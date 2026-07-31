"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getDailyChallenge,
  startDailyRun,
  type DailyChallengeSummary,
} from "@/app/actions/dailyChallenge";
import { msUntilNextReset, formatCountdown } from "@/lib/daily/challengeDate";
import { track } from "@/lib/analytics/posthog";

export function DailyChallengeCard() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<DailyChallengeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [useHints, setUseHints] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    getDailyChallenge()
      .then(setChallenge)
      .catch(() => setChallenge(null))
      .finally(() => setLoading(false));
  }, []);

  // Low-key countdown — refreshed each minute, never seconds
  useEffect(() => {
    const update = () => setCountdown(formatCountdown(msUntilNextReset()));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleStart = async () => {
    setStarting(true);
    try {
      const result = await startDailyRun(useHints);

      if (result.status === "started") {
        track("daily_challenge_started", { used_hints: useHints });
        router.push(
          `/run/${result.runId}/article/${encodeURIComponent(result.startTitle)}`
        );
        return;
      }

      if (result.status === "already_played") {
        router.push(
          result.isCompleted
            ? `/results/daily/${result.runId}`
            : `/run/${result.runId}/article/${encodeURIComponent(challenge!.startTitle)}`
        );
        return;
      }

      setStarting(false);
    } catch {
      setStarting(false);
    }
  };

  if (loading || !challenge) return null;

  const played = challenge.attempt !== null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
      <div className="flex items-baseline justify-between mb-4 gap-3">
        <h3 className="text-lg font-semibold">Daily Challenge</h3>
        {/* Intentionally understated — it is not the point of the card */}
        <span className="text-xs text-muted-foreground/70 shrink-0">
          resets in {countdown}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5 text-sm">
        <span className="px-2.5 py-1 rounded-lg bg-secondary font-medium">
          {challenge.startTitle}
        </span>
        <span className="text-muted-foreground/50">→</span>
        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold">
          {challenge.targetTitle}
        </span>
      </div>

      {challenge.streak > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          🔥 <span className="font-semibold text-foreground">{challenge.streak}</span>{" "}
          day streak
        </p>
      )}

      {!challenge.signedIn ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to play the daily challenge, keep a streak, and appear on the
            leaderboard.
          </p>
          <Link
            href="/login?redirect=/play"
            className="block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:translate-y-[-1px] transition-all duration-200"
          >
            Sign in to play
          </Link>
        </>
      ) : played ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            You have played today. Come back after the reset for a new route.
          </p>
          {challenge.attempt!.isCompleted && (
            <Link
              href={`/results/daily/${challenge.attempt!.runId}`}
              className="block w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-center text-sm font-semibold hover:bg-secondary transition-all duration-200"
            >
              View your result
            </Link>
          )}
        </>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <label className="flex items-start gap-2.5 cursor-pointer group sm:max-w-sm">
            <input
              type="checkbox"
              checked={useHints}
              onChange={(e) => setUseHints(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Use hints
              <span className="block text-xs text-muted-foreground/70">
                Shows when the target is linked from your page. Hinted runs
                can&apos;t set a record.
              </span>
            </span>
          </label>

          <div className="sm:text-right shrink-0">
            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full sm:w-auto rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {starting ? "Starting…" : "Play today's challenge"}
            </button>
            <p className="text-xs text-muted-foreground/70 mt-2.5 text-center sm:text-right">
              One attempt per day — it starts as soon as you begin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
