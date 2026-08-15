"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export async function addHabit(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { error } = await getSupabase().from("habits").insert({ name });
  if (error) throw error;

  revalidatePath("/goals");
}

export async function toggleHabitLog(formData: FormData) {
  const habitId = String(formData.get("habit_id") ?? "");
  const logDate = String(formData.get("log_date") ?? "");
  const wasLogged = formData.get("was_logged") === "true";
  if (!habitId || !logDate) return;

  const supabase = getSupabase();
  if (wasLogged) {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("log_date", logDate);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .insert({ habit_id: habitId, log_date: logDate });
    if (error) throw error;
  }

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function addLongTermGoal(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const targetDate = String(formData.get("target_date") ?? "") || null;
  if (!name) return;

  const { error } = await getSupabase()
    .from("long_term_goals")
    .insert({ name, category, target_date: targetDate });
  if (error) throw error;

  revalidatePath("/goals");
}

export async function updateLongTermGoalProgress(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const progress = Number(formData.get("progress_percent"));
  if (!id || !Number.isFinite(progress)) return;

  const { error } = await getSupabase()
    .from("long_term_goals")
    .update({ progress_percent: Math.max(0, Math.min(100, progress)) })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/goals");
}
