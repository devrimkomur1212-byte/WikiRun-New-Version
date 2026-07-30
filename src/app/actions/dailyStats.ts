"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface RecordHolder {
  username: string;
  clicks: number;
  timeMs: number;
}

export interface DailyStats {
  challengeDate: string;
  startTitle: string;
  targetTitle: string;
  /** Completed, signed-in attempts counted for this day */
  finishers: number;
  meanClicks: number | null;
  meanTimeMs: number | null;
  /** Best runs of the day. Hinted runs are excluded from records. */
  fewestClicks: RecordHolder | null;
  fastest: RecordHolder | null;
  you: { clicks: number; timeMs: number; usedHints: boolean; gaveUp: boolean } | null;
  streak: number;
}

/**
 * Everything the daily results screen needs. Read with the service client
 * because the leaderboard spans other players' runs, but only aggregates and
 * usernames are ever returned.
 */
export async function getDailyStats(runId: string): Promise<DailyStats | null> {
  const supabase = await createClient();
  const service = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: runData } = await supabase
    .from("runs")
    .select("id, daily_challenge_id, clicks_count, active_time_ms, used_hints, gave_up, is_completed")
    .eq("id", runId)
    .maybeSingle();

  if (!runData) return null;

  const run = runData as {
    daily_challenge_id: string | null;
    clicks_count: number;
    active_time_ms: number;
    used_hints: boolean;
    gave_up: boolean | null;
    is_completed: boolean;
  };

  if (!run.daily_challenge_id) return null;

  const { data: challengeData } = await service
    .from("daily_challenges")
    .select("challenge_date, start_title, target_title")
    .eq("id", run.daily_challenge_id)
    .single();

  const challenge = challengeData as {
    challenge_date: string;
    start_title: string;
    target_title: string;
  } | null;

  if (!challenge) return null;

  // Every counted attempt for this challenge: completed, not forfeited.
  // Anonymous players never reach the runs table, so this is signed-in only.
  const { data: allRunsData } = await service
    .from("runs")
    .select("user_id, clicks_count, active_time_ms, used_hints, profiles(username)")
    .eq("daily_challenge_id", run.daily_challenge_id)
    .eq("is_completed", true)
    .neq("gave_up", true);

  const allRuns = (allRunsData ?? []) as unknown as {
    user_id: string;
    clicks_count: number;
    active_time_ms: number;
    used_hints: boolean;
    profiles: { username: string } | null;
  }[];

  const finishers = allRuns.length;
  const meanClicks = finishers
    ? Math.round((allRuns.reduce((s, r) => s + r.clicks_count, 0) / finishers) * 10) / 10
    : null;
  const meanTimeMs = finishers
    ? Math.round(allRuns.reduce((s, r) => s + r.active_time_ms, 0) / finishers)
    : null;

  // Hinted runs count toward the averages but cannot hold a record
  const eligible = allRuns.filter((r) => !r.used_hints);

  const toHolder = (r: (typeof allRuns)[number]): RecordHolder => ({
    username: r.profiles?.username ?? "Unknown",
    clicks: r.clicks_count,
    timeMs: r.active_time_ms,
  });

  const fewestClicks = eligible.length
    ? toHolder(
        [...eligible].sort(
          (a, b) =>
            a.clicks_count - b.clicks_count || a.active_time_ms - b.active_time_ms
        )[0]
      )
    : null;

  const fastest = eligible.length
    ? toHolder(
        [...eligible].sort(
          (a, b) =>
            a.active_time_ms - b.active_time_ms || a.clicks_count - b.clicks_count
        )[0]
      )
    : null;

  let streak = 0;
  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("daily_streak")
      .eq("id", user.id)
      .single();
    streak = (profileData as { daily_streak: number } | null)?.daily_streak ?? 0;
  }

  return {
    challengeDate: challenge.challenge_date,
    startTitle: challenge.start_title,
    targetTitle: challenge.target_title,
    finishers,
    meanClicks,
    meanTimeMs,
    fewestClicks,
    fastest,
    you: run.is_completed
      ? {
          clicks: run.clicks_count,
          timeMs: run.active_time_ms,
          usedHints: run.used_hints,
          gaveUp: run.gave_up === true,
        }
      : null,
    streak,
  };
}
