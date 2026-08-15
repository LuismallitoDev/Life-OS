import {
  getProjects,
  getClients,
  getIncome,
  getExpenses,
  isNotionConfigured,
  type Project,
  type NotionClientRecord,
  type Transaction,
} from "@/lib/notion";
import { getTodayEvents, isCalendarConfigured, type CalendarEvent } from "@/lib/calendar";
import { WorkTabs } from "./work-tabs";

function monthKey(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function sumForMonth(transactions: Transaction[], key: string): number {
  return transactions
    .filter((t) => monthKey(t.date) === key)
    .reduce((s, t) => s + (t.amount ?? 0), 0);
}

export default async function WorkPage() {
  const notionReady = isNotionConfigured();
  const calendarReady = isCalendarConfigured();

  let projects: Project[] = [];
  let clients: NotionClientRecord[] = [];
  let events: CalendarEvent[] = [];
  let income: Transaction[] = [];
  let expenses: Transaction[] = [];
  let notionError: string | null = null;
  let calendarError: string | null = null;

  if (notionReady) {
    try {
      [projects, clients, income, expenses] = await Promise.all([
        getProjects(),
        getClients(),
        getIncome(),
        getExpenses(),
      ]);
    } catch (e) {
      notionError = e instanceof Error ? e.message : "Failed to load Notion data.";
    }
  }

  if (calendarReady) {
    try {
      events = await getTodayEvents();
    } catch (e) {
      calendarError = e instanceof Error ? e.message : "Failed to load calendar.";
    }
  }

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;

  const mrr = sumForMonth(income, thisMonthKey);
  const prevMrr = sumForMonth(income, lastMonthKey);
  const mrrChangePct = prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : null;

  const expensesThisMonth = sumForMonth(expenses, thisMonthKey);
  const moneyThisMonth = mrr - expensesThisMonth;

  const mostRecentIncomeDate = income
    .map((t) => t.date)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  return (
    <WorkTabs
      projects={projects}
      clients={clients}
      events={events}
      notionReady={notionReady}
      calendarReady={calendarReady}
      notionError={notionError}
      calendarError={calendarError}
      mrr={mrr}
      mrrChangePct={mrrChangePct}
      mrrLastUpdated={mostRecentIncomeDate ?? null}
      moneyThisMonth={moneyThisMonth}
    />
  );
}
