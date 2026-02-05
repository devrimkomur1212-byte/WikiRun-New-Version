"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";
import { logger } from "@/lib/logger";

type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];
type RunInsert = Database["public"]["Tables"]["runs"]["Insert"];

// ELO matching tiers - range expands over time, capped at 200
const ELO_TIERS = [
  { range: 50, timeThresholdMs: 0 },       // 0-15s: ±50 ELO
  { range: 100, timeThresholdMs: 15000 },  // 15-45s: ±100 ELO
  { range: 200, timeThresholdMs: 45000 },  // 45s+: ±200 ELO (maximum)
];

interface QueuedPlayer {
  user_id: string;
  elo_rating: number;
  queued_at: string;
}

export async function joinMatchmakingQueue() {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get user's ELO from profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("elo_rating")
    .eq("id", user.id)
    .single();

  const profile = profileData as { elo_rating: number } | null;
  const userElo = profile?.elo_rating ?? 1000;

  logger.info('matchmaking', `User ${user.id} joining queue`, { elo: userElo });

  // Remove user from queue if already there
  await supabase.from("queue_ranked").delete().eq("user_id", user.id);

  // Try to find a match based on ELO range
  const match = await findMatchInQueue(serviceSupabase, user.id, userElo);

  if (match) {
    logger.info('matchmaking', 'Match found, creating match', { opponentId: match.user_id, opponentElo: match.elo_rating });
    return await createMatch(serviceSupabase, supabase, user.id, userElo, match);
  }

  logger.debug('matchmaking', 'No match found, adding to queue');
  // No match found - add to queue with ELO
  type QueueInsert = Database["public"]["Tables"]["queue_ranked"]["Insert"];
  const queueData: QueueInsert = {
    user_id: user.id,
    elo_rating: userElo,
  };
  const { error: queueError } = await supabase
    .from("queue_ranked")
    .insert(queueData as never);

  if (queueError) {
    throw new Error("Failed to join queue: " + queueError.message);
  }

  // Re-check after insert — handles race condition where opponent inserted simultaneously
  const matchAfterInsert = await findMatchInQueue(serviceSupabase, user.id, userElo);
  if (matchAfterInsert) {
    logger.info('matchmaking', 'Match found on re-check after insert');
    // Remove self from queue before creating match (we just inserted ourselves above)
    await supabase.from("queue_ranked").delete().eq("user_id", user.id);
    return await createMatch(serviceSupabase, supabase, user.id, userElo, matchAfterInsert);
  }

  revalidatePath("/play");

  return {
    status: "queued" as const,
    elo: userElo,
  };
}

async function findMatchInQueue(
  serviceSupabase: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  userElo: number
): Promise<QueuedPlayer | null> {
  // Get all queue entries (excluding self), ordered by time
  const { data: queueEntriesData } = await serviceSupabase
    .from("queue_ranked")
    .select("user_id, elo_rating, queued_at")
    .neq("user_id", userId)
    .order("queued_at", { ascending: true });

  const queueEntries = queueEntriesData as QueuedPlayer[] | null;

  logger.debug('matchmaking', 'Queue search', { found: queueEntries?.length || 0 });

  if (!queueEntries || queueEntries.length === 0) {
    return null;
  }

  const now = Date.now();

  for (const entry of queueEntries) {
    const waitTimeMs = now - new Date(entry.queued_at).getTime();
    const eloDiff = Math.abs(entry.elo_rating - userElo);

    // Find the appropriate ELO tier based on their wait time
    // Use the highest tier they qualify for (most relaxed matching)
    let maxAllowedRange = ELO_TIERS[0].range;
    for (const tier of ELO_TIERS) {
      if (waitTimeMs >= tier.timeThresholdMs) {
        maxAllowedRange = tier.range;
      }
    }

    logger.debug('matchmaking', 'Checking opponent', {
      opponentId: entry.user_id,
      eloDiff,
      waitTimeMs,
      maxAllowedRange
    });

    // Check if ELO difference is within allowed range (capped at 200)
    if (eloDiff <= maxAllowedRange) {
      logger.info('matchmaking', 'Opponent matched within ELO range', {
        opponentId: entry.user_id,
        eloDiff,
        maxAllowedRange
      });
      return entry as QueuedPlayer;
    }
  }

  return null;
}

async function createMatch(
  serviceSupabase: Awaited<ReturnType<typeof createServiceClient>>,
  userSupabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userElo: number,
  opponent: QueuedPlayer
) {
  logger.info('matchmaking', 'Creating match', { userId, opponentId: opponent.user_id });

  // Generate a shared route
  logger.debug('matchmaking', 'Generating route...');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/random-route`);

  if (!response.ok) {
    logger.error('matchmaking', 'Failed to generate route', { status: response.status });
    throw new Error("Failed to generate route");
  }

  const route = await response.json();
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
  logger.debug('matchmaking', 'Route created in DB', { routeId: routeResult.id });

  // Set start_time to 5 seconds from now for countdown
  const startTime = new Date(Date.now() + 5000).toISOString();

  logger.debug('matchmaking', 'Creating match record', { startTime });
  // Create the match
  const matchData: MatchInsert = {
    route_id: routeResult.id,
    player1_id: opponent.user_id,
    player2_id: userId,
    status: "pending",
    start_time: startTime,
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

  // Remove opponent from queue
  logger.debug('matchmaking', 'Removing opponent from queue', { opponentId: opponent.user_id });
  await serviceSupabase
    .from("queue_ranked")
    .delete()
    .eq("user_id", opponent.user_id);

  logger.debug('matchmaking', 'Creating runs for both players');
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
  logger.debug('matchmaking', 'Player 1 run created', { runId: player1RunResult.id });

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
  logger.debug('matchmaking', 'Player 2 run created', { runId: player2RunResult.id });

  // Update match with run IDs
  logger.debug('matchmaking', 'Updating match with run IDs');
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
