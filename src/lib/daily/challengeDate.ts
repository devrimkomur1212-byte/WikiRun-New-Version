/**
 * The daily challenge rolls over at 07:00 UTC — a single global moment, so
 * every player is racing the same route at the same time regardless of where
 * they are. Mirrors the `current_challenge_date()` SQL function.
 */
export const RESET_HOUR_UTC = 7;

/** The challenge date (YYYY-MM-DD) currently live, in UTC terms. */
export function currentChallengeDate(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - RESET_HOUR_UTC * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/** Milliseconds until the next 07:00 UTC rollover. */
export function msUntilNextReset(now: Date = new Date()): number {
  const next = new Date(now);
  next.setUTCHours(RESET_HOUR_UTC, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

/** Compact countdown, e.g. "6h 12m" or "48m" — deliberately low-key. */
export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "under a minute";
}

/** True when `date` (YYYY-MM-DD) is the day immediately before `reference`. */
export function isPreviousDay(date: string, reference: string): boolean {
  const prev = new Date(`${reference}T00:00:00Z`);
  prev.setUTCDate(prev.getUTCDate() - 1);
  return prev.toISOString().slice(0, 10) === date;
}
