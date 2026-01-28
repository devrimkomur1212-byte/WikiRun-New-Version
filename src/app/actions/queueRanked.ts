"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type RouteRow = Database["public"]["Tables"]["routes"]["Row"];
type RunInsert = Database["public"]["Tables"]["runs"]["Insert"];
type RunRow = Database["public"]["Tables"]["runs"]["Row"];
type QueueInsert = Database["public"]["Tables"]["queue_ranked"]["Insert"];

export async function queueForRanked(routeId: string) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get user's ELO
  const { data: profileData } = await supabase
    .from("profiles")
    .select("elo_rating")
    .eq("id", user.id)
    .single();

  const profile = profileData as { elo_rating: number } | null;
  const userElo = profile?.elo_rating ?? 1000;

  // Check if user is already in queue
  const { data: existingQueue } = await supabase
    .from("queue_ranked")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existingQueue) {
    // Remove from queue if already there
    await supabase.from("queue_ranked").delete().eq("user_id", user.id);
  }

  // Check if someone else is waiting for this route
  const { data: waitingPlayerData } = await serviceSupabase
    .from("queue_ranked")
    .select("user_id")
    .eq("route_id", routeId)
    .neq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (waitingPlayerData) {
    const waitingPlayer = waitingPlayerData as { user_id: string };

    // Fetch route details first
    const { data: routeData } = await supabase
      .from("routes")
      .select("*")
      .eq("id", routeId)
      .single();

    if (!routeData) {
      throw new Error("Route not found");
    }

    const route = routeData as RouteRow;

    // Match found! Create the match
    const matchData: MatchInsert = {
      route_id: routeId,
      player1_id: waitingPlayer.user_id,
      player2_id: user.id,
      status: "pending",
    };

    const { data: matchResult, error: matchError } = await serviceSupabase
      .from("matches")
      .insert(matchData as never)
      .select()
      .single();

    if (matchError || !matchResult) {
      throw new Error("Failed to create match: " + matchError?.message);
    }

    const match = matchResult as MatchRow;

    // Remove waiting player from queue
    await serviceSupabase
      .from("queue_ranked")
      .delete()
      .eq("user_id", waitingPlayer.user_id);

    // Create run for Player 1 (the waiting player)
    const player1RunData: RunInsert = {
      user_id: waitingPlayer.user_id,
      mode: "ranked",
      route_id: routeId,
      match_id: match.id,
      start_title: route.start_title,
      target_title: route.target_title,
      active_time_ms: 0,
      clicks_count: 0,
      misses_count: 0,
      route_titles: [],
      step_data: [],
      is_completed: false,
    };

    const { data: player1RunResult, error: player1RunError } = await serviceSupabase
      .from("runs")
      .insert(player1RunData as never)
      .select()
      .single();

    if (player1RunError) {
      console.error("Failed to create run for player 1:", player1RunError);
    }

    // Create run for Player 2 (current user)
    const player2RunData: RunInsert = {
      user_id: user.id,
      mode: "ranked",
      route_id: routeId,
      match_id: match.id,
      start_title: route.start_title,
      target_title: route.target_title,
      active_time_ms: 0,
      clicks_count: 0,
      misses_count: 0,
      route_titles: [],
      step_data: [],
      is_completed: false,
    };

    const { data: player2RunResult, error: player2RunError } = await supabase
      .from("runs")
      .insert(player2RunData as never)
      .select()
      .single();

    if (player2RunError || !player2RunResult) {
      throw new Error("Failed to create run: " + player2RunError?.message);
    }

    const player2Run = player2RunResult as RunRow;

    revalidatePath("/play");

    return {
      status: "matched",
      matchId: match.id,
      runId: player2Run.id,
      startTitle: route.start_title,
      targetTitle: route.target_title,
    };
  } else {
    // No match found, add to queue
    const queueData: QueueInsert = {
      user_id: user.id,
      route_id: routeId,
      elo_rating: userElo,
    };

    const { error: queueError } = await supabase
      .from("queue_ranked")
      .insert(queueData as never);

    if (queueError) {
      throw new Error("Failed to join queue: " + queueError.message);
    }

    revalidatePath("/play");

    return {
      status: "queued",
    };
  }
}

export async function leaveQueue() {
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

export async function checkQueueStatus() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { inQueue: false };
  }

  // First check if the user is in the queue
  const { data: queueEntry } = await supabase
    .from("queue_ranked")
    .select("*, routes(*)")
    .eq("user_id", user.id)
    .single();

  if (queueEntry) {
    const entry = queueEntry as { route_id: string; queued_at: string; routes: RouteRow | null };
    return {
      inQueue: true,
      routeId: entry.route_id,
      route: entry.routes,
      queuedAt: entry.queued_at,
    };
  }

  // User is not in queue - check if they have a pending match (they were matched while waiting)
  const { data: pendingMatchData } = await supabase
    .from("matches")
    .select("*, routes(*)")
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingMatchData) {
    const pendingMatch = pendingMatchData as MatchRow & { routes: RouteRow | null };

    // Find the user's run for this match
    const { data: runData } = await supabase
      .from("runs")
      .select("*")
      .eq("match_id", pendingMatch.id)
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .single();

    if (runData) {
      const run = runData as RunRow;

      // Get opponent's ELO
      const opponentId =
        pendingMatch.player1_id === user.id
          ? pendingMatch.player2_id
          : pendingMatch.player1_id;

      const { data: opponentProfileData } = await supabase
        .from("profiles")
        .select("elo_rating")
        .eq("id", opponentId)
        .single();

      const opponentProfile = opponentProfileData as { elo_rating: number } | null;

      return {
        inQueue: false,
        matched: true,
        matchId: pendingMatch.id,
        runId: run.id,
        startTitle: run.start_title,
        targetTitle: run.target_title,
        startTime: pendingMatch.start_time,
        opponentElo: opponentProfile?.elo_rating ?? 1000,
      };
    }
  }

  return { inQueue: false };
}

/**
 * Check if user has a pending ranked match they need to complete
 */
export async function checkPendingMatch() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Find any pending match the user is part of
  const { data: matchData } = await supabase
    .from("matches")
    .select("*, routes(*)")
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!matchData) {
    return null;
  }

  const match = matchData as MatchRow & { routes: RouteRow | null };

  // Find the user's run for this match
  const { data: runData } = await supabase
    .from("runs")
    .select("*")
    .eq("match_id", match.id)
    .eq("user_id", user.id)
    .single();

  if (!runData) {
    return null;
  }

  const run = runData as RunRow;

  // If run is already completed, don't return it
  if (run.is_completed) {
    return null;
  }

  return {
    matchId: match.id,
    runId: run.id,
    startTitle: run.start_title,
    targetTitle: run.target_title,
    route: match.routes,
  };
}
