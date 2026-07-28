import { createServiceClient } from "@/lib/supabase/server";
import { calculateEloChange } from "@/lib/elo/ranks";
import { evaluateAchievements } from "@/lib/achievements/evaluator";
import type { Database } from "@/types/database.types";

type RunRow = Database["public"]["Tables"]["runs"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

type MatchWithRuns = MatchRow & {
  player1_run: (RunRow & { gave_up?: boolean }) | null;
  player2_run: (RunRow & { gave_up?: boolean }) | null;
};

// How many timed-out matches a single sweep will settle
const EXPIRY_SWEEP_LIMIT = 20;

export async function linkRunToMatch(
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

export async function resolveMatch(matchId: string) {
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

  // Only pending matches can be resolved — completed matches are done and
  // expired matches were already settled by the timeout sweep
  if ((matchData as MatchRow).status !== "pending") {
    console.log("Match no longer pending, skipping resolution");
    return;
  }

  const match = matchData as MatchWithRuns;

  const player1Run = match.player1_run;
  const player2Run = match.player2_run;

  if (!player1Run || !player2Run) {
    console.error("Both runs must be complete to resolve match");
    return;
  }

  // Both runs must actually be completed (not just exist from matchmaking)
  if (!player1Run.is_completed || !player2Run.is_completed) {
    return;
  }

  // Determine winner (handles forfeits, time, clicks, misses)
  let winnerId: string | null = null;
  const p1GaveUp = player1Run.gave_up === true;
  const p2GaveUp = player2Run.gave_up === true;

  if (p1GaveUp && p2GaveUp) {
    // Both forfeited - whoever had lower time was ahead in the race
    if (player1Run.active_time_ms < player2Run.active_time_ms) {
      winnerId = match.player1_id;
    } else if (player2Run.active_time_ms < player1Run.active_time_ms) {
      winnerId = match.player2_id;
    }
    // Equal times = draw
  } else if (p1GaveUp) {
    winnerId = match.player2_id;
  } else if (p2GaveUp) {
    winnerId = match.player1_id;
  } else {
    // Normal resolution - lowest time wins
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
  }

  await applyMatchResult(supabase, match, winnerId);
}

/**
 * Settles pending matches whose expires_at deadline has passed.
 *
 * - Exactly one player finished (without forfeiting): they get a full ELO win,
 *   the absent opponent takes the full loss.
 * - Nobody finished (or the only finisher forfeited): the match is voided as
 *   "expired" with no ELO changes.
 * - Both finished but resolution never ran (partial failure): normal resolution.
 *
 * Called from joinMatchmakingQueue (each queue poll) and /api/match-status
 * (the finisher's results page polls it every 2s while waiting).
 */
export async function expireStaleMatches(matchId?: string) {
  const supabase = await createServiceClient();

  let query = supabase
    .from("matches")
    .select("*, player1_run:runs!player1_run_id(*), player2_run:runs!player2_run_id(*)")
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .limit(EXPIRY_SWEEP_LIMIT);

  if (matchId) {
    query = query.eq("id", matchId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return;

  for (const matchData of data) {
    const match = matchData as unknown as MatchWithRuns;
    const p1Run = match.player1_run;
    const p2Run = match.player2_run;

    if (p1Run?.is_completed && p2Run?.is_completed) {
      await resolveMatch(match.id);
      continue;
    }

    const p1Finished = p1Run?.is_completed === true && p1Run.gave_up !== true;
    const p2Finished = p2Run?.is_completed === true && p2Run.gave_up !== true;

    if (p1Finished || p2Finished) {
      // Sole finisher wins with full ELO; the opponent abandoned the match
      const winnerId = p1Finished ? match.player1_id : match.player2_id;
      console.log("Awarding timeout win", { matchId: match.id, winnerId });
      await applyMatchResult(supabase, match, winnerId);
    } else {
      // Nobody finished (or the only finisher forfeited) — void without ELO
      await supabase
        .from("matches")
        .update({ status: "expired" } as never)
        .eq("id", match.id)
        .eq("status", "pending");
    }
  }
}

/**
 * Applies a match outcome: sets status/winner/ELO deltas atomically (only if
 * the match is still pending, preventing double resolution), then updates both
 * profiles and evaluates achievements.
 */
async function applyMatchResult(
  supabase: ServiceClient,
  match: MatchRow,
  winnerId: string | null
) {
  // Fetch both profiles for ELO calculation
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, elo_rating, games_played_ranked")
    .in("id", [match.player1_id, match.player2_id]);

  const profiles = profilesData as
    | { id: string; elo_rating: number; games_played_ranked: number }[]
    | null;

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

  // ATOMIC update: only succeeds if match status is still "pending"
  // This prevents double resolution when concurrent calls race
  const { data: updateResult } = await supabase
    .from("matches")
    .update({
      status: "complete",
      winner_id: winnerId,
      elo_delta_p1: delta1,
      elo_delta_p2: delta2,
    } as never)
    .eq("id", match.id)
    .eq("status", "pending")
    .select("id");

  // If no rows affected, another call already resolved this match
  if (!updateResult || updateResult.length === 0) {
    console.log("Match was already resolved by concurrent call, skipping profile updates");
    return;
  }

  // Update profiles (only runs once due to atomic guard above)
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
