import { format, subDays, eachDayOfInterval } from "date-fns";
import { Card, ProgressBar } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";
import {
  getHabits,
  getHabitLogs,
  getLongTermGoals,
  isSupabaseConfigured,
  type Habit,
  type HabitLog,
  type LongTermGoal,
} from "@/lib/supabase";
import {
  addHabit,
  toggleHabitLog,
  addLongTermGoal,
  updateLongTermGoalProgress,
} from "./actions";

const DAYS_BACK = 6; // show a 7-day window ending today

function computeStreak(loggedDates: Set<string>): number {
  let streak = 0;
  let cursor = new Date();
  while (loggedDates.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export default async function GoalsPage() {
  const supabaseReady = isSupabaseConfigured();

  let habits: Habit[] = [];
  let logs: HabitLog[] = [];
  let goals: LongTermGoal[] = [];
  let supabaseError: string | null = null;

  if (supabaseReady) {
    try {
      const since = format(subDays(new Date(), DAYS_BACK), "yyyy-MM-dd");
      [habits, logs, goals] = await Promise.all([
        getHabits(),
        getHabitLogs(since),
        getLongTermGoals(),
      ]);
    } catch (e) {
      supabaseError = e instanceof Error ? e.message : "Failed to load Supabase data.";
    }
  }

  const days = eachDayOfInterval({ start: subDays(new Date(), DAYS_BACK), end: new Date() });
  const logsByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    const set = logsByHabit.get(log.habit_id) ?? new Set<string>();
    set.add(log.log_date);
    logsByHabit.set(log.habit_id, set);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[34px] text-[var(--text)]">Personal Goals</h1>

      {supabaseError && <SetupNotice>{supabaseError}</SetupNotice>}

      <Card title="Habit Tracker — last 7 days">
        <div className="space-y-3">
          {habits.length === 0 && (
            <p className="text-sm text-[var(--text-faint)]">No habits yet — add one below.</p>
          )}
          {habits.map((habit) => {
            const loggedDates = logsByHabit.get(habit.id) ?? new Set<string>();
            const streak = computeStreak(loggedDates);
            return (
              <div key={habit.id} className="flex items-center justify-between gap-4">
                <div className="w-40 shrink-0 text-sm text-[var(--text)]">{habit.name}</div>
                <div className="flex gap-1.5">
                  {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isLogged = loggedDates.has(dateStr);
                    return (
                      <form key={dateStr} action={toggleHabitLog}>
                        <input type="hidden" name="habit_id" value={habit.id} />
                        <input type="hidden" name="log_date" value={dateStr} />
                        <input type="hidden" name="was_logged" value={String(isLogged)} />
                        <button
                          type="submit"
                          title={dateStr}
                          className={`h-7 w-7 rounded-md text-xs transition-colors ${
                            isLogged
                              ? "bg-[#00bb7f] text-[var(--text)]"
                              : "bg-[var(--surface-active)] text-[var(--text-faint)] hover:bg-[var(--border-strong)]"
                          }`}
                        >
                          {format(day, "d")}
                        </button>
                      </form>
                    );
                  })}
                </div>
                <div className="w-20 shrink-0 text-right text-xs text-[var(--text-faint)]">
                  {streak > 0 ? `🔥 ${streak}d` : "—"}
                </div>
              </div>
            );
          })}

          {supabaseReady && (
            <form action={addHabit} className="flex items-end gap-2 border-t border-[var(--border)] pt-4">
              <div>
                <label className="block text-xs text-[var(--text-faint)]">New habit</label>
                <input
                  name="name"
                  required
                  className="w-56 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </div>
              <button
                type="submit"
                className="rounded bg-[#009767] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[#00bb7f]"
              >
                Add habit
              </button>
            </form>
          )}
        </div>
      </Card>

      <Card title="Long-Term Goals">
        <div className="space-y-4">
          {goals.length === 0 && (
            <p className="text-sm text-[var(--text-faint)]">No long-term goals yet — add one below.</p>
          )}
          {goals.map((g) => (
            <div key={g.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[var(--text)]">
                  {g.name}
                  {g.category && <span className="ml-2 text-xs text-[var(--text-faint)]">{g.category}</span>}
                </span>
                <span className="text-[var(--text-faint)]">{g.progress_percent}%</span>
              </div>
              <ProgressBar value={g.progress_percent} max={100} color="#90c5ff" />
              <form action={updateLongTermGoalProgress} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={g.id} />
                <input
                  type="number"
                  name="progress_percent"
                  min={0}
                  max={100}
                  defaultValue={g.progress_percent}
                  className="w-24 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text)]"
                />
                <button
                  type="submit"
                  className="rounded bg-[var(--surface-active)] px-3 py-1 text-xs text-[var(--text)] hover:bg-[var(--border-strong)]"
                >
                  Update
                </button>
              </form>
            </div>
          ))}

          {supabaseReady && (
            <form action={addLongTermGoal} className="flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-4">
              <div>
                <label className="block text-xs text-[var(--text-faint)]">Goal</label>
                <input
                  name="name"
                  required
                  className="w-48 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)]">Category</label>
                <input
                  name="category"
                  placeholder="SaaS, real estate..."
                  className="w-40 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)]">Target date</label>
                <input
                  type="date"
                  name="target_date"
                  className="rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </div>
              <button
                type="submit"
                className="rounded bg-[#155dfc] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[#3080ff]"
              >
                Add goal
              </button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
