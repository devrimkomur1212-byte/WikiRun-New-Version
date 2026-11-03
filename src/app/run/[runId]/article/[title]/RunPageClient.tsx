"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRunStore } from "@/lib/run/runStore";
import { RunHUD } from "@/components/run/RunHUD";
import { ArticleView } from "@/components/run/ArticleView";
import { OpponentStatus } from "@/components/run/OpponentStatus";
import { isGuestDailyRun } from "@/lib/daily/guestRun";

interface RunPageClientProps {
  runId: string;
  mode: "ranked" | "training" | "daily";
  startTitle: string;
  targetTitle: string;
  routeId: string | null;
  matchId: string | null;
  initialTitle: string;
  isClientSideRun: boolean;
  /** Daily runs started with hints enabled show a target-linked indicator */
  showHints?: boolean;
}

export function RunPageClient({
  runId,
  mode,
  startTitle,
  targetTitle,
  routeId,
  matchId,
  initialTitle,
  isClientSideRun,
  showHints = false,
}: RunPageClientProps) {
  const router = useRouter();
  const hasInitialized = useRef(false);
  const initializeRun = useRunStore((state) => state.initializeRun);
  const reset = useRunStore((state) => state.reset);
  const [hintsEnabled, setHintsEnabled] = useState(showHints);

  // Initialize store with metadata only - ArticleView handles fetching
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      if (isClientSideRun) {
        const isGuestDaily = isGuestDailyRun(runId);
        const exitPath = isGuestDaily ? "/daily" : "/training";
        const runDataString = localStorage.getItem(`run-${runId}`);

        if (!runDataString) {
          router.push(exitPath);
          return;
        }

        // A finished daily can't be played again by coming back to its URL
        if (isGuestDaily && localStorage.getItem(`run-results-${runId}`)) {
          router.replace("/daily/result");
          return;
        }

        try {
          const runData = JSON.parse(runDataString);
          if (isGuestDaily) setHintsEnabled(Boolean(runData.useHints));
          initializeRun({
            runId,
            mode: isGuestDaily ? "daily" : "training",
            startTitle: runData.startTitle,
            targetTitle: runData.targetTitle,
            routeId: null,
            matchId: null,
            initialTitle,
          });
        } catch {
          router.push(exitPath);
        }
      } else {
        initializeRun({
          runId,
          mode,
          startTitle,
          targetTitle,
          routeId,
          matchId,
          initialTitle,
        });
      }
    }

    return () => {
      hasInitialized.current = false;
      reset();
    };
  }, [runId, mode, startTitle, targetTitle, routeId, matchId, initialTitle, initializeRun, reset, isClientSideRun, router]);

  return (
    <div className="min-h-screen bg-background">
      <RunHUD showHints={hintsEnabled} />
      <ArticleView
        runId={runId}
        isClientSideRun={isClientSideRun}
        initialTitle={initialTitle}
      />
      <OpponentStatus />
    </div>
  );
}
