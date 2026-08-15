import { Card } from "@/components/ui";
import { ProgressBar } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";
import {
  getExpenses,
  getIncome,
  getBalances,
  isNotionConfigured,
  type Transaction,
  type Balance,
} from "@/lib/notion";
import {
  getSavingsGoals,
  getRevenueGoal,
  isSupabaseConfigured,
  type SavingsGoal,
  type RevenueGoal,
} from "@/lib/supabase";
import { MonthlyChart, type MonthlyPoint } from "./monthly-chart";
import { addSavingsGoal, updateSavingsGoalAmount, setRevenueGoal } from "./actions";

function monthKey(iso: string | null) {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function isThisMonth(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function sumByMonth(income: Transaction[], expenses: Transaction[]): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>();
  for (const t of income) {
    const key = monthKey(t.date);
    const entry = map.get(key) ?? { month: key, income: 0, expense: 0 };
    entry.income += t.amount ?? 0;
    map.set(key, entry);
  }
  for (const t of expenses) {
    const key = monthKey(t.date);
    const entry = map.get(key) ?? { month: key, income: 0, expense: 0 };
    entry.expense += t.amount ?? 0;
    map.set(key, entry);
  }
  return Array.from(map.values());
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default async function FinancePage() {
  const notionReady = isNotionConfigured();
  const supabaseReady = isSupabaseConfigured();

  let income: Transaction[] = [];
  let expenses: Transaction[] = [];
  let balances: Balance[] = [];
  let notionError: string | null = null;

  if (notionReady) {
    try {
      [income, expenses, balances] = await Promise.all([
        getIncome(),
        getExpenses(),
        getBalances(),
      ]);
    } catch (e) {
      notionError = e instanceof Error ? e.message : "Failed to load Notion data.";
    }
  }

  let savingsGoals: SavingsGoal[] = [];
  let revenueGoal: RevenueGoal | null = null;
  let supabaseError: string | null = null;
  if (supabaseReady) {
    try {
      [savingsGoals, revenueGoal] = await Promise.all([getSavingsGoals(), getRevenueGoal()]);
    } catch (e) {
      supabaseError = e instanceof Error ? e.message : "Failed to load Supabase data.";
    }
  }

  const totalIncome = income.reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalExpense = expenses.reduce((s, t) => s + (t.amount ?? 0), 0);
  const startingBalance = balances.reduce((s, b) => s + (b.startingBalance ?? 0), 0);
  const netBalance = startingBalance + totalIncome - totalExpense;
  const monthly = sumByMonth(income, expenses);
  const mrr = income.filter((t) => isThisMonth(t.date)).reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-[34px] text-[var(--text)]">Finance</h1>

      {!notionReady && (
        <SetupNotice>
          Notion isn&apos;t connected yet. Add <code>NOTION_TOKEN</code> to{" "}
          <code>.env.local</code> to pull in your Expense/Income trackers.
        </SetupNotice>
      )}
      {notionError && <SetupNotice>{notionError}</SetupNotice>}
      {supabaseError && <SetupNotice>{supabaseError}</SetupNotice>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Income">
          <p className="num text-[26px] font-medium text-[#00d294]">{formatMoney(totalIncome)}</p>
        </Card>
        <Card title="Total Expense">
          <p className="num text-[26px] font-medium text-[#ff6568]">{formatMoney(totalExpense)}</p>
        </Card>
        <Card title="Balance">
          <p className="num text-[26px] font-medium text-[var(--text)]">{formatMoney(netBalance)}</p>
        </Card>
      </div>

      <Card title="Revenue Goal">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
          <div>
            <p className="text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              MRR this month
            </p>
            <p className="num text-[26px] font-medium mt-1" style={{ color: "var(--text)" }}>
              {formatMoney(mrr)}
              {revenueGoal && revenueGoal.monthly_target > 0 && (
                <span className="text-sm ml-1.5" style={{ color: "var(--text-faint)" }}>
                  / {formatMoney(revenueGoal.monthly_target)}
                </span>
              )}
            </p>
          </div>
          {revenueGoal && revenueGoal.monthly_target > 0 && (
            <span className="num text-sm" style={{ color: "var(--accent)" }}>
              {Math.round((mrr / revenueGoal.monthly_target) * 100)}%
            </span>
          )}
        </div>
        {revenueGoal && revenueGoal.monthly_target > 0 ? (
          <ProgressBar value={mrr} max={revenueGoal.monthly_target} />
        ) : (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            No monthly goal set yet — add one below.
          </p>
        )}
        {supabaseReady && (
          <form action={setRevenueGoal} className="mt-3 flex items-end gap-2">
            <div>
              <label className="block text-xs" style={{ color: "var(--text-faint)" }}>
                Monthly target
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                name="monthly_target"
                defaultValue={revenueGoal?.monthly_target ?? ""}
                className="w-32 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
              />
            </div>
            <button
              type="submit"
              className="rounded bg-[var(--surface-active)] px-3 py-1 text-xs text-[var(--text)] hover:bg-[var(--border-strong)]"
            >
              Save
            </button>
          </form>
        )}
      </Card>

      <Card title="Income vs Expense by Month">
        {monthly.length === 0 ? (
          <p className="text-sm text-[var(--text-faint)]">No transactions yet.</p>
        ) : (
          <MonthlyChart data={monthly} />
        )}
      </Card>

      <Card title="Savings Goals">
        <div className="space-y-4">
          {savingsGoals.length === 0 && (
            <p className="text-sm text-[var(--text-faint)]">No savings goals yet — add one below.</p>
          )}
          {savingsGoals.map((g) => (
            <div key={g.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[var(--text)]">{g.name}</span>
                <span className="text-[var(--text-faint)]">
                  {formatMoney(g.current_amount)} / {formatMoney(g.target_amount)}
                </span>
              </div>
              <ProgressBar value={g.current_amount} max={g.target_amount} />
              <form action={updateSavingsGoalAmount} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={g.id} />
                <input
                  type="number"
                  name="current_amount"
                  step="0.01"
                  defaultValue={g.current_amount}
                  className="w-32 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text)]"
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
            <form action={addSavingsGoal} className="flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-4">
              <div>
                <label className="block text-xs text-[var(--text-faint)]">Name</label>
                <input
                  name="name"
                  required
                  className="w-40 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)]">Target</label>
                <input
                  type="number"
                  step="0.01"
                  name="target_amount"
                  required
                  className="w-28 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-faint)]">Starting amount</label>
                <input
                  type="number"
                  step="0.01"
                  name="current_amount"
                  className="w-28 rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text)]"
                />
              </div>
              <button
                type="submit"
                className="rounded bg-[#009767] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[#00bb7f]"
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
