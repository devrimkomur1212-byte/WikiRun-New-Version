"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";
import { logger } from "@/lib/logger";
import { generateRandomRoute } from "@/lib/wiki/randomRoute";
import { expireStaleMatches } from "@/lib/matches/resolve";

type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];
type RunInsert = Database["public"]["Tables"]["runs"]["Insert"];
type QueueInsert = Database["public"]["Tables"]["queue_ranked"]["Insert"];

// How long after its scheduled start a pending match can stay unresolved
// before the timeout sweep settles it (sole finisher wins, ghosts expire)
const MATCH_EXPIRY_MS = 15 * 60 * 1000;

// ELO matching tiers (enforced inside the claim_queue_opponent DB function):
// 0-15s: ±50, 15-45s: ±100, 45s+: ±200. Queue entries whose heartbeat is
// older than 15s are invisible to matchmaking and deleted after 60s.

interface QueuedPlayer {
  user_id: string;
  elo_rating: number;
}

export async function joinMatchmakingQueue() {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Returned rather than thrown: the client polls this every 3s, and Next.js
  // masks thrown server-action messages in production, so a expired session
  // used to surface as an unrecognisable error loop
  if (!user) {
    return { status: "unauthorized" as const };
  }

  // Settle any timed-out matches first so a stale pending match can't
  // re-capture a player through the existing-match check below
  await expireStaleMatches();

  // First, check if user already has a pending match (prevents re-queuing after match is created)
  const { data: existingMatchData } = await supabase
    .from("matches")
    .select("id, start_time, player1_id, player2_id")
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingMatchData) {
    const existingMatch = existingMatchData as {
      id: string;
      start_time: string | null;
      player1_id: string;
      player2_id: string;
    };

    // Find the user's incomplete run for this match
    const { data: existingRunData } = await supabase
      .from("runs")
      .select("id, start_title, target_title")
      .eq("match_id", existingMatch.id)
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .maybeSingle();

    if (existingRunData) {
      const existingRun = existingRunData as {
        id: string;
        start_title: string;
        target_title: string;
      };

      // Get opponent's ELO
      const opponentId =
        existingMatch.player1_id === user.id
          ? existingMatch.player2_id
          : existingMatch.player1_id;

      const { data: opponentProfileData } = await supabase
        .from("profiles")
        .select("elo_rating")
        .eq("id", opponentId)
        .single();

      const opponentProfile = opponentProfileData as { elo_rating: number } | null;

      logger.info('matchmaking', 'User already has pending match', {
        matchId: existingMatch.id,
        runId: existingRun.id,
      });

      // Remove from queue if still there
      await serviceSupabase.from("queue_ranked").delete().eq("user_id", user.id);

      return {
        status: "matched" as const,
        matchId: existingMatch.id,
        runId: existingRun.id,
        startTime: existingMatch.start_time || new Date().toISOString(),
        route: {
          startTitle: existingRun.start_title,
          targetTitle: existingRun.target_title,
        },
        opponent: {
          elo: opponentProfile?.elo_rating ?? 1000,
        },
      };
    }
  }

  // Get user's ELO from profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("elo_rating")
    .eq("id", user.id)
    .single();

  const profile = profileData as { elo_rating: number } | null;
  const userElo = profile?.elo_rating ?? 1000;

  // Upsert self into the queue with a fresh heartbeat. Clients call this
  // action every 3 seconds while searching, so last_seen doubles as a
  // liveness signal — players who close the tab stop refreshing and become
  // invisible to matchmaking within seconds (no more ghost matches).
  const queueData: QueueInsert = {
    user_id: user.id,
    elo_rating: userElo,
    last_seen: new Date().toISOString(),
  };
  const { error: queueError } = await serviceSupabase
    .from("queue_ranked")
    .upsert(queueData as never, { onConflict: "user_id" });

  if (queueError) {
    throw new Error("Failed to join queue: " + queueError.message);
  }

  // Atomically claim an opponent. The DB function locks both players' queue
  // rows in a consistent order, so two players joining simultaneously can't
  // both create a match for the same pair.
  const { data: claimData, error: claimError } = await serviceSupabase.rpc(
    "claim_queue_opponent",
    { p_user_id: user.id, p_elo: userElo }
  );

  if (claimError) {
    logger.error('matchmaking', 'claim_queue_opponent failed', claimError);
    return { status: "queued" as const, elo: userElo };
  }

  const claimed = (claimData as
    | { opponent_id: string; opponent_elo: number }[]
    | null)?.[0];

  if (!claimed) {
    // Still queued — or we were claimed by another player, in which case
    // their match INSERT notifies us via realtime or the next status poll
    revalidatePath("/play");
    return { status: "queued" as const, elo: userElo };
  }

  logger.info('matchmaking', 'Opponent claimed, creating match', {
    opponentId: claimed.opponent_id,
    opponentElo: claimed.opponent_elo,
  });

  return await createMatch(serviceSupabase, supabase, user.id, userElo, {
    user_id: claimed.opponent_id,
    elo_rating: claimed.opponent_elo,
  });
}

async function createMatch(
  serviceSupabase: Awaited<ReturnType<typeof createServiceClient>>,
  userSupabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userElo: number,
  opponent: QueuedPlayer
) {
  logger.info('matchmaking', 'Creating match', { userId, opponentId: opponent.user_id });

  try {
    // Generate a shared route for ranked (weighted difficulty: mostly easy/medium).
    // Never throws — Wikipedia failures degrade to the popular-article list.
    const route = await generateRandomRoute("ranked");
    logger.debug('matchmaking', 'Route generated', { startTitle: route.startTitle, targetTitle: route.targetTitle });

    // Create route in DB
    type RouteInsert = Database["public"]["Tables"]["routes"]["Insert"];
    const routeInsertData: RouteInsert = {
      start_title: route.startTitle,
      target_title: route.targetTitle,
      difficulty: route.difficulty || "medium",
      is_active: true,
    };
    const { data: routeData, error: routeError } = await serviceSupabase
      .from("routes")
      .insert(routeInsertData as never)
      .select()
      .single();

    if (routeError || !routeData) {
      logger.error('matchmaking', 'Failed to create route in DB', routeError);
      throw new Error("Failed to create route: " + routeError?.message);
    }

    const routeResult = routeData as { id: string };

    // Set start_time to 5 seconds from now for countdown
    const startTimeMs = Date.now() + 5000;
    const startTime = new Date(startTimeMs).toISOString();

    // Create the match; expires_at is the deadline for the timeout sweep
    const matchData: MatchInsert = {
      route_id: routeResult.id,
      player1_id: opponent.user_id,
      player2_id: userId,
      status: "pending",
      start_time: startTime,
      expires_at: new Date(startTimeMs + MATCH_EXPIRY_MS).toISOString(),
    };

    const { data: matchResultData, error: matchError } = await serviceSupabase
      .from("matches")
      .insert(matchData as never)
      .select()
      .single();

    if (matchError || !matchResultData) {
      logger.error('matchmaking', 'Failed to create match record', matchError);
      throw new Error("Failed to create match: " + matchError?.message);
    }

    const matchResult = matchResultData as { id: string };
    logger.info('matchmaking', 'Match record created', { matchId: matchResult.id });

    // Create run for Player 1 (the waiting opponent)
    const player1RunData: RunInsert = {
      user_id: opponent.user_id,
      mode: "ranked",
      route_id: routeResult.id,
      match_id: matchResult.id,
      start_title: route.startTitle,
      target_title: route.targetTitle,
      active_time_ms: 0,
      clicks_count: 0,
      misses_count: 0,
      route_titles: [],
      step_data: [],
      is_completed: false,
    };

    const { data: player1RunResultData, error: player1RunError } = await serviceSupabase
      .from("runs")
      .insert(player1RunData as never)
      .select()
      .single();

    if (player1RunError) {
      logger.error('matchmaking', 'Failed to create run for player 1', player1RunError);
      throw new Error("Failed to create run for opponent");
    }

    const player1RunResult = player1RunResultData as { id: string };

    // Create run for Player 2 (current user)
    const player2RunData: RunInsert = {
      user_id: userId,
      mode: "ranked",
      route_id: routeResult.id,
      match_id: matchResult.id,
      start_title: route.startTitle,
      target_title: route.targetTitle,
      active_time_ms: 0,
      clicks_count: 0,
      misses_count: 0,
      route_titles: [],
      step_data: [],
      is_completed: false,
    };

    const { data: player2RunResultData, error: player2RunError } = await userSupabase
      .from("runs")
      .insert(player2RunData as never)
      .select()
      .single();

    if (player2RunError || !player2RunResultData) {
      logger.error('matchmaking', 'Failed to create run for player 2', player2RunError);
      throw new Error("Failed to create run: " + player2RunError?.message);
    }

    const player2RunResult = player2RunResultData as { id: string };

    // Update match with run IDs
    await serviceSupabase
      .from("matches")
      .update({
        player1_run_id: player1RunResult.id,
        player2_run_id: player2RunResult.id,
      } as never)
      .eq("id", matchResult.id);

    logger.info('matchmaking', 'Match creation complete', {
      matchId: matchResult.id,
      player1RunId: player1RunResult.id,
      player2RunId: player2RunResult.id
    });

    revalidatePath("/play");

    return {
      status: "matched" as const,
      matchId: matchResult.id,
      runId: player2RunResult.id,
      startTime,
      route: {
        startTitle: route.startTitle,
        targetTitle: route.targetTitle,
      },
      opponent: {
        elo: opponent.elo_rating,
      },
    };
  } catch (error) {
    // The claim already removed both players from the queue — put them back
    // so neither is silently stranded outside matchmaking
    logger.error('matchmaking', 'Match creation failed, re-queueing both players', error);
    const requeueRows: QueueInsert[] = [
      { user_id: userId, elo_rating: userElo, last_seen: new Date().toISOString() },
      { user_id: opponent.user_id, elo_rating: opponent.elo_rating, last_seen: new Date().toISOString() },
    ];
    await serviceSupabase
      .from("queue_ranked")
      .upsert(requeueRows as never, { onConflict: "user_id" });
    throw error;
  }
}

export async function leaveMatchmakingQueue() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await supabase.from("queue_ranked").delete().eq("user_id", user.id);

  revalidatePath("/play");

  return { success: true };
}
