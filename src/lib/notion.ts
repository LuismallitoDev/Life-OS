import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDataSourceParameters,
} from "@notionhq/client/build/src/api-endpoints";

// Data source IDs resolved from the user's Notion workspace (Business OS / Money
// Tracker / Weekly Workout & Meals). See the Life OS setup guide for how these
// map to the visible databases in Notion.
export const DATA_SOURCES = {
  projects: "d7ea35b1-e3ca-83cd-b286-07f6a626a243",
  clients: "5e9a35b1-e3ca-8313-bd48-07a3994fe51f",
  mealTracking: "3bba35b1-e3ca-8038-9629-000bcb647ec3",
  exercises: "2b5a35b1-e3ca-801a-bd91-000b26a95b75",
  expenses: "ee2a35b1-e3ca-8222-8224-0744b102336e",
  income: "db2a35b1-e3ca-82c0-a4e9-07a23b2b9d59",
  balance: "3fba35b1-e3ca-823f-83ec-07c60db6fb0e",
} as const;

let client: Client | null = null;

export function isNotionConfigured() {
  return Boolean(process.env.NOTION_TOKEN);
}

function getClient() {
  if (!process.env.NOTION_TOKEN) {
    throw new Error(
      "NOTION_TOKEN is not set. Add it to .env.local — see README for setup steps."
    );
  }
  if (!client) {
    client = new Client({ auth: process.env.NOTION_TOKEN });
  }
  return client;
}

async function queryDataSource(
  dataSourceId: string,
  args: Omit<QueryDataSourceParameters, "data_source_id"> = {}
) {
  const notion = getClient();
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      ...args,
    });
    results.push(...(response.results as PageObjectResponse[]));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return results;
}

// --- Property extraction helpers -----------------------------------------

function prop(page: PageObjectResponse, name: string) {
  return page.properties[name];
}

function title(page: PageObjectResponse, name: string): string {
  const p = prop(page, name);
  if (p?.type !== "title") return "";
  return p.title.map((t) => t.plain_text).join("");
}

function richText(page: PageObjectResponse, name: string): string {
  const p = prop(page, name);
  if (p?.type !== "rich_text") return "";
  return p.rich_text.map((t) => t.plain_text).join("");
}

function select(page: PageObjectResponse, name: string): string | null {
  const p = prop(page, name);
  if (p?.type !== "select") return null;
  return p.select?.name ?? null;
}

function status(page: PageObjectResponse, name: string): string | null {
  const p = prop(page, name);
  if (p?.type !== "status") return null;
  return p.status?.name ?? null;
}

function multiSelect(page: PageObjectResponse, name: string): string[] {
  const p = prop(page, name);
  if (p?.type !== "multi_select") return [];
  return p.multi_select.map((o) => o.name);
}

function numberProp(page: PageObjectResponse, name: string): number | null {
  const p = prop(page, name);
  if (p?.type !== "number") return null;
  return p.number;
}

function dateProp(page: PageObjectResponse, name: string): string | null {
  const p = prop(page, name);
  if (p?.type !== "date") return null;
  return p.date?.start ?? null;
}

function checkbox(page: PageObjectResponse, name: string): boolean {
  const p = prop(page, name);
  if (p?.type !== "checkbox") return false;
  return p.checkbox;
}

function email(page: PageObjectResponse, name: string): string | null {
  const p = prop(page, name);
  if (p?.type !== "email") return null;
  return p.email;
}

function relationCount(page: PageObjectResponse, name: string): number {
  const p = prop(page, name);
  if (p?.type !== "relation") return 0;
  return p.relation.length;
}

// --- Public types -----------------------------------------------------------

export type Project = {
  id: string;
  name: string;
  status: string | null;
  priority: string | null;
  startDate: string | null;
  taskCount: number;
};

export type NotionClientRecord = {
  id: string;
  name: string;
  email: string | null;
  note: string;
  dealCount: number;
};

export type Meal = {
  id: string;
  name: string;
  mealType: string | null;
  date: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  water: number | null;
};

export type Exercise = {
  id: string;
  name: string;
  focus: string[];
  intensity: string | null;
  date: string | null;
  done: boolean;
  observations: string;
};

export type Transaction = {
  id: string;
  name: string;
  label: string | null;
  type: string | null;
  amount: number | null;
  date: string | null;
};

export type Balance = {
  id: string;
  name: string;
  startingBalance: number | null;
};

// --- Public queries ----------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  const pages = await queryDataSource(DATA_SOURCES.projects, {
    sorts: [{ property: "Start Date ", direction: "descending" }],
  });
  return pages.map((page) => ({
    id: page.id,
    name: title(page, "Name"),
    status: status(page, "Status"),
    priority: select(page, "Priority "),
    startDate: dateProp(page, "Start Date "),
    taskCount: relationCount(page, "Tasks  "),
  }));
}

export async function getClients(): Promise<NotionClientRecord[]> {
  const pages = await queryDataSource(DATA_SOURCES.clients);
  return pages.map((page) => ({
    id: page.id,
    name: title(page, "Client Name"),
    email: email(page, "Email address "),
    note: richText(page, "Note"),
    dealCount: relationCount(page, "Deals"),
  }));
}

export async function getMealsForDate(isoDate: string): Promise<Meal[]> {
  const pages = await queryDataSource(DATA_SOURCES.mealTracking, {
    filter: {
      property: "Date",
      date: { equals: isoDate },
    },
  });
  return pages.map((page) => ({
    id: page.id,
    name: title(page, "Name"),
    mealType: select(page, "Meal Type"),
    date: dateProp(page, "Date"),
    calories: numberProp(page, "Calories"),
    protein: numberProp(page, "Protein (g)"),
    carbs: numberProp(page, "Carbohydrates (g)"),
    fat: numberProp(page, "Fat (g)"),
    water: numberProp(page, "Water (ml)"),
  }));
}

export async function getExercisesForDate(isoDate: string): Promise<Exercise[]> {
  const pages = await queryDataSource(DATA_SOURCES.exercises, {
    filter: {
      property: "Date",
      date: { equals: isoDate },
    },
  });
  return pages.map((page) => ({
    id: page.id,
    name: title(page, "Name"),
    focus: multiSelect(page, "Focus"),
    intensity: select(page, "Intensity"),
    date: dateProp(page, "Date"),
    done: checkbox(page, "Done"),
    observations: richText(page, "Observations"),
  }));
}

export async function getExpenses(): Promise<Transaction[]> {
  const pages = await queryDataSource(DATA_SOURCES.expenses, {
    sorts: [{ property: "Date", direction: "ascending" }],
  });
  return pages.map((page) => ({
    id: page.id,
    name: title(page, "Name"),
    label: select(page, "Label"),
    type: select(page, "Type"),
    amount: numberProp(page, "Amount"),
    date: dateProp(page, "Date"),
  }));
}

export async function getIncome(): Promise<Transaction[]> {
  const pages = await queryDataSource(DATA_SOURCES.income, {
    sorts: [{ property: "Date", direction: "ascending" }],
  });
  return pages.map((page) => ({
    id: page.id,
    name: title(page, "Name"),
    label: select(page, "Label"),
    type: select(page, "Type"),
    amount: numberProp(page, "Amount"),
    date: dateProp(page, "Date"),
  }));
}

export async function getBalances(): Promise<Balance[]> {
  const pages = await queryDataSource(DATA_SOURCES.balance);
  return pages.map((page) => ({
    id: page.id,
    name: title(page, "Name"),
    startingBalance: numberProp(page, "Starting Balance"),
  }));
}
