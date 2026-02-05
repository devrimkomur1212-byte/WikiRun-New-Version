"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRunStore } from "@/lib/run/runStore";
import { RunHUD } from "@/components/run/RunHUD";
import { ArticleView } from "@/components/run/ArticleView";

interface RunPageClientProps {
  runId: string;
  mode: "ranked" | "training";
  startTitle: string;
  targetTitle: string;
  routeId: string | null;
  matchId: string | null;
  initialTitle: string;
  isClientSideRun: boolean;
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
}: RunPageClientProps) {
  const router = useRouter();
  const hasInitialized = useRef(false);
  const initializeRun = useRunStore((state) => state.initializeRun);
  const reset = useRunStore((state) => state.reset);

  // Initialize store with metadata only - ArticleView handles fetching
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      if (isClientSideRun) {
        const runDataString = localStorage.getItem(`run-${runId}`);

        if (!runDataString) {
          router.push("/training");
          return;
        }

        try {
          const runData = JSON.parse(runDataString);
          initializeRun({
            runId,
            mode: "training",
            startTitle: runData.startTitle,
            targetTitle: runData.targetTitle,
            routeId: null,
            matchId: null,
            initialTitle,
          });
        } catch {
          router.push("/training");
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
      <RunHUD />
      <ArticleView
        runId={runId}
        isClientSideRun={isClientSideRun}
        initialTitle={initialTitle}
      />
    </div>
  );
}
