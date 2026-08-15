import { format, subDays } from "date-fns";
import Link from "next/link";
import { Card, Badge, ProgressBar } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";
import {
  getProjects,
  getExpenses,
  getMealsForDate,
  isNotionConfigured,
} from "@/lib/notion";
import { getTodayEvents, isCalendarConfigured } from "@/lib/calendar";
import { getHabits, getHabitLogs, isSupabaseConfigured } from "@/lib/supabase";

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

  const anyMissing = !notionReady || !calendarReady;

  const [projects, expenses, meals, events, habits, logs] = await Promise.all([
    notionReady ? getProjects().catch(() => []) : Promise.resolve([]),
    notionReady ? getExpenses().catch(() => []) : Promise.resolve([]),
    notionReady ? getMealsForDate(today).catch(() => []) : Promise.resolve([]),
    calendarReady ? getTodayEvents().catch(() => []) : Promise.resolve([]),
    supabaseReady ? getHabits().catch(() => []) : Promise.resolve([]),
    supabaseReady
      ? getHabitLogs(format(subDays(new Date(), 6), "yyyy-MM-dd")).catch(() => [])
      : Promise.resolve([]),
  ]);

  const activeProjects = projects
    .filter((p) => p.status === "In progress")
    .slice(0, 5);

  const todaysSpend = expenses
    .filter((t) => t.date === today)
    .reduce((s, t) => s + (t.amount ?? 0), 0);

  const todaysCalories = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const todaysProtein = meals.reduce((s, m) => s + (m.protein ?? 0), 0);

  const logsByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    const set = logsByHabit.get(log.habit_id) ?? new Set<string>();
    set.add(log.log_date);
    logsByHabit.set(log.habit_id, set);
  }
  const streaks = habits
    .map((h) => ({ name: h.name, streak: computeStreak(logsByHabit.get(h.id) ?? new Set()) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] text-[var(--text)]">
          {format(new Date(), "EEEE, MMMM d")}
        </h1>
        <p className="text-sm text-[var(--text-faint)]">Your day at a glance.</p>
      </div>

      {anyMissing && (
        <SetupNotice>
          Some integrations aren&apos;t configured yet — fill in{" "}
          <code>.env.local</code> to see live data across all sections. Missing:{" "}
          {[!notionReady && "Notion", !calendarReady && "Google Calendar"]
            .filter(Boolean)
            .join(", ")}
          .
        </SetupNotice>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Today's Calendar">
          {events.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)]">No events today.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="text-sm text-[var(--text)]">
                  {e.summary}
                </li>
              ))}
            </ul>
          )}
          <Link href="/work" className="mt-3 inline-block text-xs text-[var(--text-faint)] hover:text-[var(--text-dim)]">
            View Work &amp; Projects →
          </Link>
        </Card>

        <Card title="Active Projects">
          {activeProjects.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)]">Nothing in progress.</p>
          ) : (
            <ul className="space-y-2">
              {activeProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text)]">{p.name}</span>
                  {p.priority && <Badge>{p.priority.replace(" Priority", "")}</Badge>}
                </li>
              ))}
            </ul>
          )}
          <Link href="/work" className="mt-3 inline-block text-xs text-[var(--text-faint)] hover:text-[var(--text-dim)]">
            View all projects →
          </Link>
        </Card>

        <Card title="Today's Spend">
          <p className="text-[34px] text-[var(--text)]">
            {todaysSpend.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          </p>
          <Link href="/finance" className="mt-3 inline-block text-xs text-[var(--text-faint)] hover:text-[var(--text-dim)]">
            View Finance →
          </Link>
        </Card>

        <Card title="Today's Macros">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-dim)]">Calories</span>
              <span className="text-[var(--text)]">{Math.round(todaysCalories)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-dim)]">Protein</span>
              <span className="text-[var(--text)]">{Math.round(todaysProtein)}g</span>
            </div>
          </div>
          <Link href="/health" className="mt-3 inline-block text-xs text-[var(--text-faint)] hover:text-[var(--text-dim)]">
            View Health &amp; Fitness →
          </Link>
        </Card>

        <Card title="Current Streaks" className="lg:col-span-2">
          {streaks.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)]">No habits tracked yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {streaks.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 text-xs text-[var(--text-dim)]">{s.name}</div>
                  <div className="text-lg font-semibold text-[var(--text)]">
                    {s.streak > 0 ? `🔥 ${s.streak}d` : "—"}
                  </div>
                  <ProgressBar value={s.streak} max={7} />
                </div>
              ))}
            </div>
          )}
          <Link href="/goals" className="mt-3 inline-block text-xs text-[var(--text-faint)] hover:text-[var(--text-dim)]">
            View Personal Goals →
          </Link>
        </Card>
      </div>
    </div>
  );
}
