"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { evaluateAchievements } from "@/lib/achievements/evaluator";
import type { Database } from "@/types/database.types";

type RunRow = Database["public"]["Tables"]["runs"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

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

async function linkRunToMatch(
  runId: string,
  matchId: string,
  userId: string
) {
  const supabase = await createServiceClient();

  // Fetch the match
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError || !matchData) {
    console.error("Failed to fetch match:", matchError);
    return;
  }

  const match = matchData as MatchRow;

  // Determine if this user is player1 or player2
  const isPlayer1 = match.player1_id === userId;
  const isPlayer2 = match.player2_id === userId;

  if (!isPlayer1 && !isPlayer2) {
    console.error("User is not a participant in this match");
    return;
  }

  // Update the match with the run ID
  const updateField = isPlayer1 ? "player1_run_id" : "player2_run_id";
  const { error: updateError } = await supabase
    .from("matches")
    .update({ [updateField]: runId } as never)
    .eq("id", matchId);

  if (updateError) {
    console.error("Failed to update match:", updateError);
    return;
  }

  // Check if both players have completed their runs
  const otherRunId = isPlayer1 ? match.player2_run_id : match.player1_run_id;

  if (otherRunId) {
    // Both runs are complete, resolve the match
    await resolveMatch(matchId);
  }
}

async function resolveMatch(matchId: string) {
  const supabase = await createServiceClient();

  // Fetch the match with both runs
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("*, player1_run:runs!player1_run_id(*), player2_run:runs!player2_run_id(*)")
    .eq("id", matchId)
    .single();

  if (matchError || !matchData) {
    console.error("Failed to fetch match for resolution:", matchError);
    return;
  }

  const match = matchData as MatchRow & {
    player1_run: RunRow | null;
    player2_run: RunRow | null;
  };

  const player1Run = match.player1_run;
  const player2Run = match.player2_run;

  if (!player1Run || !player2Run) {
    console.error("Both runs must be complete to resolve match");
    return;
  }

  // Determine winner
  let winnerId: string | null = null;

  // Primary: lowest time wins
  if (player1Run.active_time_ms < player2Run.active_time_ms) {
    winnerId = match.player1_id;
  } else if (player2Run.active_time_ms < player1Run.active_time_ms) {
    winnerId = match.player2_id;
  } else {
    // Tie-breaker 1: fewer clicks
    if (player1Run.clicks_count < player2Run.clicks_count) {
      winnerId = match.player1_id;
    } else if (player2Run.clicks_count < player1Run.clicks_count) {
      winnerId = match.player2_id;
    } else {
      // Tie-breaker 2: fewer misses
      if (player1Run.misses_count < player2Run.misses_count) {
        winnerId = match.player1_id;
      } else if (player2Run.misses_count < player1Run.misses_count) {
        winnerId = match.player2_id;
      }
      // If still tied, winnerId remains null (draw)
    }
  }

  // Fetch both profiles for ELO calculation
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, elo_rating, games_played_ranked")
    .in("id", [match.player1_id, match.player2_id]);

  const profiles = profilesData as { id: string; elo_rating: number; games_played_ranked: number }[] | null;

  if (!profiles || profiles.length !== 2) {
    console.error("Failed to fetch profiles for ELO calculation");
    return;
  }

  const p1Profile = profiles.find((p) => p.id === match.player1_id)!;
  const p2Profile = profiles.find((p) => p.id === match.player2_id)!;

  // Calculate ELO changes
  const { delta1, delta2 } = calculateEloChange(
    p1Profile.elo_rating,
    p2Profile.elo_rating,
    winnerId === match.player1_id ? 1 : winnerId === match.player2_id ? 0 : 0.5
  );

  // Update match
  await supabase
    .from("matches")
    .update({
      status: "complete",
      winner_id: winnerId,
      elo_delta_p1: delta1,
      elo_delta_p2: delta2,
    } as never)
    .eq("id", matchId);

  // Update profiles
  await supabase
    .from("profiles")
    .update({
      elo_rating: p1Profile.elo_rating + delta1,
      games_played_ranked: p1Profile.games_played_ranked + 1,
    } as never)
    .eq("id", match.player1_id);

  await supabase
    .from("profiles")
    .update({
      elo_rating: p2Profile.elo_rating + delta2,
      games_played_ranked: p2Profile.games_played_ranked + 1,
    } as never)
    .eq("id", match.player2_id);

  // Evaluate achievements for both players
  await evaluateAchievements(match.player1_id);
  await evaluateAchievements(match.player2_id);
}

function calculateEloChange(
  rating1: number,
  rating2: number,
  score: number,
  k: number = 32
): { delta1: number; delta2: number } {
  const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  const delta1 = Math.round(k * (score - expected1));
  const delta2 = -delta1;
  return { delta1, delta2 };
}
