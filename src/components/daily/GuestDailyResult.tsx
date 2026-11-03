"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getDailyAggregates, type DailyAggregates, type DailyStats } from "@/app/actions/dailyStats";
import { claimGuestStreak, readLatestGuestAttempt, type GuestAttempt } from "@/lib/daily/guestRun";
import { track } from "@/lib/analytics/posthog";
import { DailyResultView } from "./DailyResultView";

const RESULT_PATH = encodeURIComponent("/daily/result");

const NO_AGGREGATES: DailyAggregates = {
  finishers: 0,
  meanClicks: null,
  meanTimeMs: null,
  meanMisses: null,
  fewestClicks: null,
  fastest: null,
};

export function GuestDailyResult() {
  const router = useRouter();
  const [attempt, setAttempt] = useState<GuestAttempt | null>(null);
  const [aggregates, setAggregates] = useState<DailyAggregates>(NO_AGGREGATES);
  const [signedIn, setSignedIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const latest = readLatestGuestAttempt();

    if (!latest?.result) {
      router.replace("/daily");
      return;
    }

    setAttempt(latest);

    const load = async () => {
      const supabase = createClient();
      const [dayStats, { data: { user } }] = await Promise.all([
        getDailyAggregates(latest.challengeDate).catch(() => null),
        supabase.auth.getUser(),
      ]);

      if (dayStats) setAggregates(dayStats);

      // Back here after signing up: today's run starts (or continues) the streak
      if (user) {
        setSignedIn(true);
        await claimGuestStreak(latest);

        const { data: profile } = await supabase
          .from("profiles")
          .select("daily_streak")
          .eq("id", user.id)
          .single();

        setStreak((profile as { daily_streak: number } | null)?.daily_streak ?? 0);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  if (loading || !attempt?.result) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const { result } = attempt;
  const gaveUp = result.gaveUp === true;

  const stats: DailyStats = {
    ...aggregates,
    challengeDate: attempt.challengeDate,
    startTitle: attempt.startTitle,
    targetTitle: attempt.targetTitle,
    you: {
      clicks: result.clicksCount,
      timeMs: result.activeTimeMs,
      misses: result.missesCount,
      routeTitles: result.routeTitles,
      usedHints: attempt.useHints,
      gaveUp,
    },
    streak,
  };

  return (
    <DailyResultView
      stats={stats}
      guestRun
      notice={
        signedIn ? (
          <p className="text-center text-sm text-muted-foreground animate-slide-up">
            You played this run before signing in, so it isn&apos;t in today&apos;s
            averages or records.
          </p>
        ) : (
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6 shadow-soft animate-slide-up">
            <h2 className="font-semibold mb-2">
              {gaveUp ? "Sign up to keep a streak" : "Sign up to start your streak"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {gaveUp
                ? "Come back tomorrow and start building one. It's free."
                : "It's free, and today's run counts as your first day."}{" "}
              You played as a guest, so this run isn&apos;t in today&apos;s averages
              or records.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/signup?redirect=${RESULT_PATH}`}
                onClick={() => track("daily_guest_signup_clicked", { gave_up: gaveUp })}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:translate-y-[-1px] transition-all duration-200"
              >
                Sign Up Free
              </Link>
              <Link
                href={`/login?redirect=${RESULT_PATH}`}
                className="flex-1 rounded-xl border border-border/60 bg-card px-4 py-3 text-center text-sm font-semibold hover:bg-secondary transition-all duration-200"
              >
                Log In
              </Link>
            </div>
          </div>
        )
      }
    />
  );
}
