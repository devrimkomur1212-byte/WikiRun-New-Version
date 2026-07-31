"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isPreviousDay } from "@/lib/daily/challengeDate";
import type { Database } from "@/types/database.types";

type RunInsert = Database["public"]["Tables"]["runs"]["Insert"];

export interface DailyChallengeSummary {
  id: string;
  challengeDate: string;
  startTitle: string;
  targetTitle: string;
  /** Set when the signed-in player has already used today's attempt */
  attempt: { runId: string; isCompleted: boolean } | null;
  streak: number;
  signedIn: boolean;
}

/**
 * Today's challenge plus, for signed-in players, whether they have already
 * used their attempt. Anonymous visitors get the challenge but no attempt
 * state — their runs are client-side only and never counted.
 */
export async function getDailyChallenge(): Promise<DailyChallengeSummary | null> {
  const supabase = await createClient();
  const service = await createServiceClient();

  const { data: challengeData } = await service
    .from("daily_challenges")
    .select("id, challenge_date, start_title, target_title")
    .eq("challenge_date", await currentChallengeDateFromDb(service))
    .maybeSingle();

  if (!challengeData) return null;

  const challenge = challengeData as {
    id: string;
    challenge_date: string;
    start_title: string;
    target_title: string;
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let attempt: DailyChallengeSummary["attempt"] = null;
  let streak = 0;

  if (user) {
    const { data: runData } = await supabase
      .from("runs")
      .select("id, is_completed")
      .eq("daily_challenge_id", challenge.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (runData) {
      const run = runData as { id: string; is_completed: boolean };
      attempt = { runId: run.id, isCompleted: run.is_completed };
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("daily_streak")
      .eq("id", user.id)
      .single();

    streak = (profileData as { daily_streak: number } | null)?.daily_streak ?? 0;
  }

  return {
    id: challenge.id,
    challengeDate: challenge.challenge_date,
    startTitle: challenge.start_title,
    targetTitle: challenge.target_title,
    attempt,
    streak,
    signedIn: Boolean(user),
  };
}

/**
 * Starts today's attempt. The attempt is consumed the moment the run is
 * created — abandoning it does not grant another. A unique index on
 * (daily_challenge_id, user_id) enforces this even if the client retries.
 */
export async function startDailyRun(useHints: boolean) {
  const supabase = await createClient();
  const service = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthorized" as const };
  }

  const { data: challengeData } = await service
    .from("daily_challenges")
    .select("id, start_title, target_title")
    .eq("challenge_date", await currentChallengeDateFromDb(service))
    .maybeSingle();

  if (!challengeData) {
    return { status: "no_challenge" as const };
  }

  const challenge = challengeData as {
    id: string;
    start_title: string;
    target_title: string;
  };

  // Already used today's attempt? Send them back to it rather than erroring.
  const { data: existing } = await supabase
    .from("runs")
    .select("id, is_completed")
    .eq("daily_challenge_id", challenge.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const run = existing as { id: string; is_completed: boolean };
    return {
      status: "already_played" as const,
      runId: run.id,
      isCompleted: run.is_completed,
    };
  }

  const runData: RunInsert = {
    user_id: user.id,
    mode: "daily",
    daily_challenge_id: challenge.id,
    used_hints: useHints,
    start_title: challenge.start_title,
    target_title: challenge.target_title,
    active_time_ms: 0,
    clicks_count: 0,
    misses_count: 0,
    route_titles: [],
    step_data: [],
    is_completed: false,
  };

  const { data: run, error } = await supabase
    .from("runs")
    .insert(runData as never)
    .select("id")
    .single();

  if (error || !run) {
    // Unique-index violation means a concurrent start already claimed it
    return { status: "error" as const, message: error?.message ?? "Failed to start" };
  }

  revalidatePath("/play");

  return {
    status: "started" as const,
    runId: (run as { id: string }).id,
    startTitle: challenge.start_title,
    targetTitle: challenge.target_title,
  };
}

/**
 * Advances the player's streak after they finish a daily run. A streak grows
 * when the previous day was also played, resets to 1 after any gap, and is
 * unchanged if they somehow submit twice for the same day.
 */
export async function recordDailyCompletion(challengeDate: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { streak: 0 };

  const { data: profileData } = await supabase
    .from("profiles")
    .select("daily_streak, daily_last_played")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    daily_streak: number;
    daily_last_played: string | null;
  } | null;

  if (!profile) return { streak: 0 };

  if (profile.daily_last_played === challengeDate) {
    return { streak: profile.daily_streak };
  }

  const continues =
    profile.daily_last_played !== null &&
    isPreviousDay(profile.daily_last_played, challengeDate);

  const streak = continues ? profile.daily_streak + 1 : 1;

  await supabase
    .from("profiles")
    .update({ daily_streak: streak, daily_last_played: challengeDate } as never)
    .eq("id", user.id);

  revalidatePath("/play");

  return { streak };
}

/**
 * Gives up today's daily run. The run is marked forfeited rather than
 * deleted: it stays out of the day's averages and records (getDailyStats
 * filters forfeits out), but the row must survive so the unique index keeps
 * the attempt consumed. Giving up breaks the streak.
 */
export async function giveUpDailyRun(runId: string, activeTimeMs: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthorized" as const };
  }

  const { data: runData } = await supabase
    .from("runs")
    .select("id, is_completed, daily_challenge_id")
    .eq("id", runId)
    .eq("user_id", user.id)
    .maybeSingle();

  const run = runData as {
    is_completed: boolean;
    daily_challenge_id: string | null;
  } | null;

  if (!run || !run.daily_challenge_id) {
    return { status: "not_found" as const };
  }

  if (!run.is_completed) {
    await supabase
      .from("runs")
      .update({
        is_completed: true,
        gave_up: true,
        active_time_ms: Math.max(0, Math.round(activeTimeMs)),
      } as never)
      .eq("id", runId)
      .eq("user_id", user.id);
  }

  const { data: challengeData } = await supabase
    .from("daily_challenges")
    .select("challenge_date")
    .eq("id", run.daily_challenge_id)
    .single();

  const challengeDate =
    (challengeData as { challenge_date: string } | null)?.challenge_date ?? null;

  // Forfeiting resets the streak outright
  await supabase
    .from("profiles")
    .update({
      daily_streak: 0,
      ...(challengeDate ? { daily_last_played: challengeDate } : {}),
    } as never)
    .eq("id", user.id);

  revalidatePath("/play");

  return { status: "forfeited" as const };
}

async function currentChallengeDateFromDb(
  service: Awaited<ReturnType<typeof createServiceClient>>
): Promise<string> {
  const { data } = await service.rpc("current_challenge_date");
  return (data as unknown as string) ?? new Date().toISOString().slice(0, 10);
}
