"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export async function addSavingsGoal(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const target = Number(formData.get("target_amount"));
  const current = Number(formData.get("current_amount") ?? 0);
  if (!name || !Number.isFinite(target) || target <= 0) return;

  const { error } = await getSupabase()
    .from("savings_goals")
    .insert({ name, target_amount: target, current_amount: current || 0 });
  if (error) throw error;

  revalidatePath("/finance");
}

export async function updateSavingsGoalAmount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const current = Number(formData.get("current_amount"));
  if (!id || !Number.isFinite(current)) return;

  const { error } = await getSupabase()
    .from("savings_goals")
    .update({ current_amount: current })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/finance");
}

export async function setRevenueGoal(formData: FormData) {
  const target = Number(formData.get("monthly_target"));
  if (!Number.isFinite(target) || target < 0) return;

  const { error } = await getSupabase()
    .from("revenue_goal")
    .upsert({ id: "default", monthly_target: target, updated_at: new Date().toISOString() });
  if (error) throw error;

  revalidatePath("/finance");
  revalidatePath("/");
}
