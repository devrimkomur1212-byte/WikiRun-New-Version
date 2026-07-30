"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRunStore, selectCurrentTime } from "@/lib/run/runStore";
import { Timer } from "./Timer";
import { giveUpRankedRun } from "@/app/actions/submitRun";

interface RunHUDProps {
  /** Daily runs started with hints show when the target is one click away */
  showHints?: boolean;
}

export function RunHUD({ showHints = false }: RunHUDProps) {
  const router = useRouter();
  const startTitle = useRunStore((state) => state.startTitle);
  const targetTitle = useRunStore((state) => state.targetTitle);
  const outgoingLinks = useRunStore((state) => state.outgoingLinks);
  const currentTitle = useRunStore((state) => state.currentTitle);
  const clicksCount = useRunStore((state) => state.clicksCount);
  const routeTitles = useRunStore((state) => state.routeTitles);
  const isLoading = useRunStore((state) => state.isLoading);
  const isTargetReached = useRunStore((state) => state.isTargetReached);
  const mode = useRunStore((state) => state.mode);
  const runId = useRunStore((state) => state.runId);
  const completeRun = useRunStore((state) => state.completeRun);

  const [confirmingGiveUp, setConfirmingGiveUp] = useState(false);
  const [isGivingUp, setIsGivingUp] = useState(false);

  const targetIsLinkedHere =
    showHints &&
    outgoingLinks.some(
      (link) => link.toLowerCase() === targetTitle.toLowerCase()
    );

  const handleGiveUpTraining = () => {
    const runData = completeRun();
    localStorage.setItem(
      `run-results-${runId}`,
      JSON.stringify({
        runId,
        activeTimeMs: runData.activeTimeMs,
        clicksCount: runData.clicksCount,
        missesCount: runData.missesCount,
        routeTitles: runData.routeTitles,
        completedAt: Date.now(),
        gaveUp: true,
      })
    );
    router.push(`/results/training/${runId}`);
  };

  const handleGiveUpRanked = async () => {
    if (!runId || isGivingUp) return;

    setIsGivingUp(true);
    try {
      // Get the current elapsed time before forfeiting
      // This ensures accurate time comparison if both players forfeit
      const currentTime = selectCurrentTime(useRunStore.getState());
      await giveUpRankedRun(runId, currentTime);
      completeRun();
      router.push(`/results/${runId}`);
    } catch (error) {
      console.error("Failed to give up:", error);
      setIsGivingUp(false);
      setConfirmingGiveUp(false);
    }
  };

  const handleGiveUp = () => {
    if (mode === "training") {
      handleGiveUpTraining();
    } else if (mode === "ranked") {
      handleGiveUpRanked();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Route info */}
          <div className="flex items-center gap-3 text-sm">
            <span className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground font-medium">
              {startTitle}
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold">
              {targetTitle}
            </span>
            {showHints && targetIsLinkedHere && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-fade-in">
                Target is on this page
              </span>
            )}
          </div>

          {/* Timer and stats */}
          <div className="flex items-center gap-8">
            {/* Timer */}
            <div className="flex flex-col items-center">
              <Timer />
              {isLoading && (
                <span className="text-xs text-muted-foreground animate-pulse mt-1">
                  Loading...
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold tabular-nums tracking-tight">{clicksCount}</span>
              <span className="text-xs text-muted-foreground">Clicks</span>
            </div>

            {/* Give Up — training and ranked */}
            {(mode === "training" || mode === "ranked") && !isTargetReached && (
              <div className="flex items-center gap-2">
                {confirmingGiveUp ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {mode === "ranked" ? "Forfeit?" : "Sure?"}
                    </span>
                    <button
                      onClick={handleGiveUp}
                      disabled={isGivingUp}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isGivingUp ? "..." : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmingGiveUp(false)}
                      disabled={isGivingUp}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 bg-card hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmingGiveUp(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 bg-card text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                  >
                    {mode === "ranked" ? "Forfeit" : "Give Up"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Route breadcrumb */}
        <div className="mt-3 flex items-center gap-2 text-xs overflow-x-auto pb-1">
          {routeTitles.slice(-5).map((title, index, arr) => (
            <span key={index} className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                  index === arr.length - 1
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground"
                } ${title.toLowerCase() === targetTitle.toLowerCase() ? "bg-primary/10 text-primary font-semibold" : ""}`}
              >
                {title}
              </span>
              {index < arr.length - 1 && <span className="text-muted-foreground/40">→</span>}
            </span>
          ))}
          {routeTitles.length > 5 && (
            <span className="text-muted-foreground/60 ml-1 font-mono">
              ({routeTitles.length} total)
            </span>
          )}
        </div>

        {/* Target reached indicator */}
        {isTargetReached && (
          <div className="mt-3 p-3 bg-primary/10 rounded-xl text-center border border-primary/20 animate-scale-in">
            <span className="text-primary font-semibold">
              🎉 Target Reached! Submitting run...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
