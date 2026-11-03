import { recordDailyCompletion } from "@/app/actions/dailyChallenge";
import { currentChallengeDate } from "./challengeDate";

/**
 * Signed-out daily runs live only in this browser, under the same localStorage
 * keys as training runs. They never reach the runs table, so they can't affect
 * a day's averages or records. The one-attempt limit is per browser: easy to
 * get around, but nothing is at stake.
 */
const GUEST_RUN_PREFIX = "guest-daily-";

export interface GuestRunResult {
  activeTimeMs: number;
  clicksCount: number;
  missesCount: number;
  routeTitles: string[];
  gaveUp?: boolean;
}

export interface GuestAttempt {
  runId: string;
  challengeDate: string;
  startTitle: string;
  targetTitle: string;
  useHints: boolean;
  streakClaimed: boolean;
  /** Null until the run is finished or given up */
  result: GuestRunResult | null;
}

export const isGuestDailyRun = (runId: string): boolean =>
  runId.startsWith(GUEST_RUN_PREFIX);

function readJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export function startGuestAttempt(route: {
  challengeDate: string;
  startTitle: string;
  targetTitle: string;
  useHints: boolean;
}): string {
  const runId = `${GUEST_RUN_PREFIX}${route.challengeDate}`;
  localStorage.setItem(`run-${runId}`, JSON.stringify({ ...route, streakClaimed: false }));
  return runId;
}

export function readGuestAttempt(challengeDate: string): GuestAttempt | null {
  const runId = `${GUEST_RUN_PREFIX}${challengeDate}`;
  const attempt = readJson<Omit<GuestAttempt, "runId" | "result">>(`run-${runId}`);
  if (!attempt) return null;

  return {
    ...attempt,
    runId,
    result: readJson<GuestRunResult>(`run-results-${runId}`),
  };
}

/** Today's attempt, or yesterday's for a run that finished after the reset. */
export function readLatestGuestAttempt(): GuestAttempt | null {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return (
    readGuestAttempt(currentChallengeDate()) ??
    readGuestAttempt(currentChallengeDate(yesterday))
  );
}

/**
 * Counts a finished guest run towards the streak of the player who has now
 * signed in. Today's run only: recording an older date would overwrite a later
 * day they have already played. Never adds the run to the day's stats.
 */
export async function claimGuestStreak(attempt: GuestAttempt): Promise<void> {
  if (
    !attempt.result ||
    attempt.result.gaveUp ||
    attempt.streakClaimed ||
    attempt.challengeDate !== currentChallengeDate()
  ) {
    return;
  }

  try {
    await recordDailyCompletion(attempt.challengeDate);

    const { runId, result, ...stored } = attempt;
    localStorage.setItem(`run-${runId}`, JSON.stringify({ ...stored, streakClaimed: true }));
  } catch (error) {
    // Not marked as claimed, so the next visit tries again
    console.error("Failed to count guest run towards streak:", error);
  }
}
