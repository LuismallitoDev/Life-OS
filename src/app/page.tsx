import { format, subDays, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card, Badge, ProgressBar } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";
import { HealthRings } from "./health/health-rings";
import { WeeklyPulseChart, type DailyPoint } from "./weekly-pulse-chart";
import { OverviewHero } from "./overview-hero";
import {
  getProjects,
  getIncome,
  getExpenses,
  getBalances,
  getMealsForDate,
  getExercisesForDate,
  isNotionConfigured,
  type Project,
  type Transaction,
  type Meal,
  type Exercise,
  type Balance,
} from "@/lib/notion";
import { getTodayEvents, isCalendarConfigured, type CalendarEvent } from "@/lib/calendar";
import {
  getHabits,
  getHabitLogs,
  getSavingsGoals,
  getRevenueGoal,
  isSupabaseConfigured,
  type Habit,
  type HabitLog,
  type SavingsGoal,
  type RevenueGoal,
} from "@/lib/supabase";
import { toggleHabitLog } from "./goals/actions";

const PRIORITY_RANK: Record<string, number> = {
  "High Priority": 3,
  "Medium Priority": 2,
  "Low Priority": 1,
};

const PRIORITY_COLOR: Record<string, "neutral" | "yellow" | "red"> = {
  "Low Priority": "neutral",
  "Medium Priority": "yellow",
  "High Priority": "red",
};

const STATUS_PROGRESS: Record<string, number> = {
  Inbox: 10,
  Planning: 35,
  "In progress": 65,
  Completed: 100,
};

function isThisMonth(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function computeStreak(loggedDates: Set<string>): number {
  let streak = 0;
  let cursor = new Date();
  while (loggedDates.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export default async function OverviewPage() {
  const notionReady = isNotionConfigured();
  const calendarReady = isCalendarConfigured();
  const supabaseReady = isSupabaseConfigured();
  const today = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");

  let projects: Project[] = [];
  let income: Transaction[] = [];
  let expenses: Transaction[] = [];
  let balances: Balance[] = [];
  let meals: Meal[] = [];
  let exercises: Exercise[] = [];
  let notionError: string | null = null;

  if (notionReady) {
    try {
      [projects, income, expenses, balances, meals, exercises] = await Promise.all([
        getProjects(),
        getIncome(),
        getExpenses(),
        getBalances(),
        getMealsForDate(today),
        getExercisesForDate(today),
      ]);
    } catch (e) {
      notionError = e instanceof Error ? e.message : "Failed to load Notion data.";
    }
  }

  let events: CalendarEvent[] = [];
  let calendarError: string | null = null;
  if (calendarReady) {
    try {
      events = await getTodayEvents();
    } catch (e) {
      calendarError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  }

  let habits: Habit[] = [];
  let logs: HabitLog[] = [];
  let savingsGoals: SavingsGoal[] = [];
  let revenueGoal: RevenueGoal | null = null;
  if (supabaseReady) {
    try {
      [habits, logs, savingsGoals, revenueGoal] = await Promise.all([
        getHabits(),
        getHabitLogs(sevenDaysAgo),
        getSavingsGoals(),
        getRevenueGoal(),
      ]);
    } catch {
      // Supabase-backed sections just fall back to empty states below.
    }
  }

  // KPIs
  const mrr = income.filter((t) => isThisMonth(t.date)).reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalIncomeAllTime = income.reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalExpenseAllTime = expenses.reduce((s, t) => s + (t.amount ?? 0), 0);
  const startingBalance = balances.reduce((s, b) => s + (b.startingBalance ?? 0), 0);
  const netBalance = startingBalance + totalIncomeAllTime - totalExpenseAllTime;
  const activeProjects = projects.filter((p) => p.status === "In progress");

  const logsByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    const set = logsByHabit.get(log.habit_id) ?? new Set<string>();
    set.add(log.log_date);
    logsByHabit.set(log.habit_id, set);
  }
  const habitStreak = habits.reduce(
    (max, h) => Math.max(max, computeStreak(logsByHabit.get(h.id) ?? new Set())),
    0
  );

  // #1 priority project — highest priority, then oldest start date.
  const topProject = [...activeProjects].sort((a, b) => {
    const rankDiff = (PRIORITY_RANK[b.priority ?? ""] ?? 0) - (PRIORITY_RANK[a.priority ?? ""] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    const aDate = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const bDate = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    return aDate - bDate;
  })[0];

  // Today's Finance
  const todaysSpend = expenses.filter((t) => t.date === today).reduce((s, t) => s + (t.amount ?? 0), 0);
  const expensesThisMonth = expenses.filter((t) => isThisMonth(t.date)).reduce((s, t) => s + (t.amount ?? 0), 0);
  const monthNet = mrr - expensesThisMonth;

  // Today's Body
  const mealTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      water: acc.water + (m.water ?? 0),
    }),
    { calories: 0, protein: 0, water: 0 }
  );

  // Weekly pulse — last 7 days of income
  const weekDays = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  const weeklyPulse: DailyPoint[] = weekDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayIncome = income.filter((t) => t.date === dayStr).reduce((s, t) => s + (t.amount ?? 0), 0);
    return { day: format(day, "EEE"), income: dayIncome };
  });

  const anyMissing = !notionReady || !calendarReady;

  return (
    <div className="space-y-6">
      {/* Row 1 — greeting */}
      <OverviewHero />

      {anyMissing && (
        <SetupNotice>
          Some integrations aren&apos;t configured yet — fill in{" "}
          <code>.env.local</code> to see live data across all sections. Missing:{" "}
          {[!notionReady && "Notion", !calendarReady && "Google Calendar"].filter(Boolean).join(", ")}.
        </SetupNotice>
      )}
      {notionError && <SetupNotice>{notionError}</SetupNotice>}
      {calendarError && <SetupNotice>{calendarError}</SetupNotice>}

      {/* Row 2 — KPI pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card>
          <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            MRR
          </p>
          <p className="num text-[22px] font-medium mt-2" style={{ color: "var(--text)" }}>
            {formatMoney(mrr)}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Net Balance
          </p>
          <p
            className="num text-[22px] font-medium mt-2"
            style={{ color: netBalance >= 0 ? "#00d294" : "#ff6568" }}
          >
            {formatMoney(netBalance)}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Active Projects
          </p>
          <p className="num text-[22px] font-medium mt-2" style={{ color: "var(--text)" }}>
            {activeProjects.length}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Habit Streak
          </p>
          <p className="num text-[22px] font-medium mt-2" style={{ color: "var(--text)" }}>
            {habitStreak > 0 ? `${habitStreak}d` : "—"}
          </p>
        </Card>
      </div>

      {/* Row 3 — main body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left ~5/12 */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card title="Today's Schedule">
            {events.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                No events today.
              </p>
            ) : (
              <ul className="space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="flex items-baseline gap-2 text-sm">
                    <span className="num shrink-0" style={{ color: "var(--accent)" }}>
                      {e.allDay ? "All day" : formatTime(e.start)}
                    </span>
                    <span style={{ color: "var(--text)" }}>{e.summary}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="#1 Priority Project">
            {topProject ? (
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[17px] font-medium" style={{ color: "var(--text)" }}>
                    {topProject.name || "(untitled)"}
                  </span>
                  {topProject.priority && (
                    <Badge color={PRIORITY_COLOR[topProject.priority] ?? "neutral"}>
                      {topProject.priority.replace(" Priority", "")}
                    </Badge>
                  )}
                </div>
                <ProgressBar
                  value={STATUS_PROGRESS[topProject.status ?? "Inbox"]}
                  max={100}
                />
                <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
                  {topProject.taskCount} task{topProject.taskCount === 1 ? "" : "s"}
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                Nothing in progress — pick your next project.
              </p>
            )}
          </Card>
        </div>

        {/* Center ~4/12 */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card
            title="Revenue Goal"
            style={{
              borderColor: "rgba(0, 210, 148, 0.22)",
              background: "linear-gradient(165deg, rgba(0, 210, 148, 0.08), var(--bg-elevated) 55%)",
            }}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="num text-[22px] font-medium" style={{ color: "var(--text)" }}>
                {formatMoney(mrr)}
              </span>
              {revenueGoal && revenueGoal.monthly_target > 0 && (
                <span className="num text-xs" style={{ color: "var(--text-faint)" }}>
                  of {formatMoney(revenueGoal.monthly_target)}
                </span>
              )}
            </div>
            {revenueGoal && revenueGoal.monthly_target > 0 ? (
              <ProgressBar value={mrr} max={revenueGoal.monthly_target} />
            ) : (
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                No goal set —{" "}
                <Link href="/finance" className="underline underline-offset-2">
                  set one in Finance
                </Link>
                .
              </p>
            )}
          </Card>

          <Card title="Today's Finance">
            <p className="text-sm" style={{ color: "var(--text)" }}>
              <span className="num">{formatMoney(todaysSpend)}</span> today ·{" "}
              <span className="num">{formatMoney(monthNet)}</span> this month
            </p>
          </Card>

          <Card title="Savings Goals">
            {savingsGoals.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                No savings goals yet.
              </p>
            ) : (
              <div className="space-y-3">
                {savingsGoals.slice(0, 2).map((g) => (
                  <div key={g.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: "var(--text)" }}>{g.name}</span>
                      <span className="num" style={{ color: "var(--text-faint)" }}>
                        {formatMoney(g.current_amount)} / {formatMoney(g.target_amount)}
                      </span>
                    </div>
                    <ProgressBar value={g.current_amount} max={g.target_amount} />
                  </div>
                ))}
                {savingsGoals.length > 2 && (
                  <Link
                    href="/finance"
                    className="text-xs inline-block"
                    style={{ color: "var(--text-faint)" }}
                  >
                    View {savingsGoals.length - 2} more in Finance →
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right ~3/12 */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card title="Today's Body">
            <HealthRings totals={mealTotals} />
          </Card>

          <Card title="Today's Workout">
            {exercises.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                Rest day.
              </p>
            ) : (
              <ul className="space-y-2">
                {exercises.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span style={{ color: e.done ? "var(--text)" : "var(--text-dim)" }}>
                      {e.name || "(untitled)"}
                    </span>
                    <Badge color={e.done ? "green" : "neutral"}>{e.done ? "Done" : "Pending"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Habit Checklist">
            {habits.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                No habits yet.
              </p>
            ) : (
              <div className="space-y-2">
                {habits.map((h) => {
                  const isLogged = logsByHabit.get(h.id)?.has(today) ?? false;
                  return (
                    <form key={h.id} action={toggleHabitLog} className="flex items-center gap-2.5">
                      <input type="hidden" name="habit_id" value={h.id} />
                      <input type="hidden" name="log_date" value={today} />
                      <input type="hidden" name="was_logged" value={String(isLogged)} />
                      <button
                        type="submit"
                        className="w-[18px] h-[18px] rounded flex items-center justify-center shrink-0"
                        style={{
                          background: isLogged ? "var(--accent)" : "transparent",
                          border: isLogged ? "none" : "1px solid var(--border-strong)",
                        }}
                        aria-label={isLogged ? `Mark ${h.name} not done` : `Mark ${h.name} done`}
                      >
                        {isLogged && <Check size={13} color="#04120d" />}
                      </button>
                      <span
                        className="text-sm text-left"
                        style={{ color: isLogged ? "var(--text-faint)" : "var(--text)" }}
                      >
                        {h.name}
                      </span>
                    </form>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Row 4 — weekly pulse */}
      <Card title="Weekly Pulse — Income">
        {income.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            No income logged yet.
          </p>
        ) : (
          <WeeklyPulseChart data={weeklyPulse} />
        )}
      </Card>
    </div>
  );
}
