"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { evaluateAchievements } from "@/lib/achievements/evaluator";
import { linkRunToMatch } from "@/lib/matches/resolve";
import type { Database } from "@/types/database.types";

type RunRow = Database["public"]["Tables"]["runs"]["Row"];

interface RunPayload {
  active_time_ms: number;
  clicks_count: number;
  misses_count: number;
  route_titles: string[];
  step_data: unknown[];
}

export async function submitRun(runId: string, payload: RunPayload) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch the run to verify ownership
  const { data: existingRunData, error: fetchError } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existingRunData) {
    throw new Error("Run not found or unauthorized");
  }

  const existingRun = existingRunData as RunRow;

  if (existingRun.is_completed) {
    throw new Error("Run already completed");
  }

  // Validate the run (basic anti-cheat)
  const isValid = validateRun(payload, existingRun);

  // Update the run
  const { error: updateError } = await supabase
    .from("runs")
    .update({
      active_time_ms: payload.active_time_ms,
      clicks_count: payload.clicks_count,
      misses_count: payload.misses_count,
      route_titles: payload.route_titles,
      step_data: payload.step_data,
      is_flagged: !isValid,
      is_completed: true,
    } as never)
    .eq("id", runId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error("Failed to update run: " + updateError.message);
  }

  // Check if this is a ranked run that needs match resolution
  if (existingRun.mode === "ranked" && existingRun.match_id) {
    await linkRunToMatch(runId, existingRun.match_id, user.id);
  }

  // Evaluate achievements
  await evaluateAchievements(user.id, runId);

  revalidatePath("/dashboard");
  revalidatePath(`/results/${runId}`);

  return { success: true };
}

function validateRun(
  payload: RunPayload,
  existingRun: { start_title: string; target_title: string }
): boolean {
  // Basic validation checks
  const stepCount = payload.route_titles.length;

  // Check if time is plausible (at least 50ms per step)
  const minTime = stepCount * 50;
  if (payload.active_time_ms < minTime) {
    console.warn("Run flagged: Time too fast", {
      time: payload.active_time_ms,
      minTime,
    });
    return false;
  }

  // Check if clicks match steps (should be steps - 1 since first page doesn't count as a click)
  if (payload.clicks_count !== Math.max(0, stepCount - 1)) {
    console.warn("Run flagged: Click count mismatch", {
      clicks: payload.clicks_count,
      expected: stepCount - 1,
    });
    return false;
  }

  // Check if route starts with the correct article
  if (
    payload.route_titles.length > 0 &&
    payload.route_titles[0].toLowerCase() !== existingRun.start_title.toLowerCase()
  ) {
    console.warn("Run flagged: Route doesn't start with correct article");
    return false;
  }

  // Check if route ends with the target article
  if (
    payload.route_titles.length > 0 &&
    payload.route_titles[payload.route_titles.length - 1].toLowerCase() !==
      existingRun.target_title.toLowerCase()
  ) {
    console.warn("Run flagged: Route doesn't end with target article");
    return false;
  }

  return true;
}

/**
 * Give up a ranked run - results in automatic loss unless opponent also gave up
 * If both forfeit, the player with lower time wins (they were ahead in the race)
 */
export async function giveUpRankedRun(runId: string, activeTimeMs: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch the run to verify ownership and get match info
  const { data: runData, error: runError } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (runError || !runData) {
    throw new Error("Run not found or unauthorized");
  }

  const run = runData as RunRow;

  if (run.is_completed) {
    throw new Error("Run already completed");
  }

  if (run.mode !== "ranked" || !run.match_id) {
    throw new Error("This is not a ranked run");
  }

  // Mark the run as completed with gave_up flag
  // Store actual elapsed time so we can compare if both players forfeit
  const { error: updateError } = await supabase
    .from("runs")
    .update({
      is_completed: true,
      gave_up: true,
      active_time_ms: Math.max(0, Math.round(activeTimeMs)),
      clicks_count: run.route_titles?.length ? (run.route_titles as string[]).length - 1 : 0,
    } as never)
    .eq("id", runId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error("Failed to update run: " + updateError.message);
  }

  // Link run to match and check if we need to resolve
  await linkRunToMatch(runId, run.match_id, user.id);

  revalidatePath("/dashboard");
  revalidatePath(`/results/${runId}`);

  return { success: true, matchId: run.match_id };
}

