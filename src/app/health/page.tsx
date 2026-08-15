import { format } from "date-fns";
import { Card, Badge } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";
import { HealthRings } from "./health-rings";
import {
  getMealsForDate,
  getExercisesForDate,
  isNotionConfigured,
  type Meal,
  type Exercise,
} from "@/lib/notion";

export default async function HealthPage() {
  const notionReady = isNotionConfigured();
  const today = format(new Date(), "yyyy-MM-dd");

  let meals: Meal[] = [];
  let exercises: Exercise[] = [];
  let notionError: string | null = null;

  if (notionReady) {
    try {
      [meals, exercises] = await Promise.all([
        getMealsForDate(today),
        getExercisesForDate(today),
      ]);
    } catch (e) {
      notionError = e instanceof Error ? e.message : "Failed to load Notion data.";
    }
  }

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      water: acc.water + (m.water ?? 0),
    }),
    { calories: 0, protein: 0, water: 0 }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-[34px] text-[var(--text)]">Health &amp; Fitness</h1>

      {!notionReady && (
        <SetupNotice>
          Notion isn&apos;t connected yet. Add <code>NOTION_TOKEN</code> to{" "}
          <code>.env.local</code> to pull in today&apos;s meals and workouts.
        </SetupNotice>
      )}
      {notionError && <SetupNotice>{notionError}</SetupNotice>}

      <Card title="Today's Progress">
        <HealthRings totals={totals} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Today's Meals">
          {meals.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)]">No meals logged today.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {meals.map((m) => (
                <li key={m.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text)]">{m.name || "(untitled)"}</span>
                    {m.mealType && <Badge>{m.mealType}</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-faint)]">
                    {m.calories ?? 0} kcal · {m.protein ?? 0}g protein ·{" "}
                    {m.carbs ?? 0}g carbs · {m.fat ?? 0}g fat
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Today's Workout">
          {exercises.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)]">No exercises logged today.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {exercises.map((e) => (
                <li key={e.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={e.done ? "text-[var(--text)]" : "text-[var(--text-dim)]"}>
                      {e.name || "(untitled)"}
                    </span>
                    <Badge color={e.done ? "green" : "neutral"}>
                      {e.done ? "Done" : "Pending"}
                    </Badge>
                  </div>
                  {e.focus.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {e.focus.map((f) => (
                        <span key={f} className="text-xs text-[var(--text-faint)]">
                          #{f}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
