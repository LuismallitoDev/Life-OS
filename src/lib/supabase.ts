import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  );
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY to .env.local — see README for setup steps."
    );
  }
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return client;
}

// --- Types matching supabase/schema.sql -------------------------------------

export type SavingsGoal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
};

export type LongTermGoal = {
  id: string;
  name: string;
  category: string | null;
  target_date: string | null;
  progress_percent: number;
  notes: string | null;
  created_at: string;
};

export type Habit = {
  id: string;
  name: string;
  created_at: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  log_date: string;
};

export type RevenueGoal = {
  id: string;
  monthly_target: number;
  updated_at: string;
};

// --- Queries ------------------------------------------------------------------

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const { data, error } = await getSupabase()
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getLongTermGoals(): Promise<LongTermGoal[]> {
  const { data, error } = await getSupabase()
    .from("long_term_goals")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getHabits(): Promise<Habit[]> {
  const { data, error } = await getSupabase()
    .from("habits")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getHabitLogs(sinceIsoDate: string): Promise<HabitLog[]> {
  const { data, error } = await getSupabase()
    .from("habit_logs")
    .select("*")
    .gte("log_date", sinceIsoDate);
  if (error) throw error;
  return data ?? [];
}

export async function getRevenueGoal(): Promise<RevenueGoal | null> {
  const { data, error } = await getSupabase()
    .from("revenue_goal")
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw error;
  return data;
}
