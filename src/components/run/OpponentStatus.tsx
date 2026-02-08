"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRunStore, selectCurrentTime } from "@/lib/run/runStore";
import { submitRun } from "@/app/actions/submitRun";

interface OpponentStatusResponse {
  finished: boolean;
  time?: number;
  gaveUp?: boolean;
}

export function OpponentStatus() {
  const router = useRouter();
  const matchId = useRunStore((state) => state.matchId);
  const mode = useRunStore((state) => state.mode);
  const runId = useRunStore((state) => state.runId);
  const isCompleted = useRunStore((state) => state.isCompleted);
  const completeRun = useRunStore((state) => state.completeRun);

  const [opponentFinished, setOpponentFinished] = useState(false);
  const [opponentTime, setOpponentTime] = useState<number | null>(null);
  const [opponentGaveUp, setOpponentGaveUp] = useState(false);
  const [autoEndTriggered, setAutoEndTriggered] = useState(false);
  const [autoEndReason, setAutoEndReason] = useState<"time_exceeded" | "opponent_forfeit" | null>(null);
  const autoEndRef = useRef(false);

  const isRankedMatch = mode === "ranked" && matchId;

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Auto-end the game: submit run and redirect to results
  const triggerAutoEnd = useCallback(async (reason: "time_exceeded" | "opponent_forfeit") => {
    if (autoEndRef.current || !runId) return;
    autoEndRef.current = true;
    setAutoEndTriggered(true);
    setAutoEndReason(reason);

    try {
      const runData = completeRun();

      await submitRun(runId, {
        active_time_ms: runData.activeTimeMs,
        clicks_count: runData.clicksCount,
        misses_count: runData.missesCount,
        route_titles: runData.routeTitles,
        step_data: runData.steps,
      });
    } catch (error) {
      console.error("[OpponentStatus] Auto-end submit failed:", error);
      // Run might already be completed (e.g. user reached target at same moment)
    }

    // Show overlay briefly, then redirect
    setTimeout(() => {
      router.push(`/results/${runId}`);
    }, 2000);
  }, [runId, completeRun, router]);

  // Poll for opponent's run status via API (bypasses RLS)
  useEffect(() => {
    if (!isRankedMatch || isCompleted || opponentFinished) return;

    let isMounted = true;

    const checkOpponentStatus = async () => {
      if (!isMounted) return;

      try {
        const res = await fetch(`/api/opponent-status?matchId=${matchId}`);
        if (!res.ok) return;

        const data = (await res.json()) as OpponentStatusResponse;

        if (data.finished && isMounted) {
          setOpponentFinished(true);
          setOpponentTime(data.time ?? null);
          setOpponentGaveUp(data.gaveUp === true);
        }
      } catch (error) {
        console.error("[OpponentStatus] Polling error:", error);
      }
    };

    checkOpponentStatus();
    const interval = setInterval(checkOpponentStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isRankedMatch, matchId, isCompleted, opponentFinished]);

  // Auto-end: opponent forfeited → instant win
  useEffect(() => {
    if (!opponentFinished || !opponentGaveUp || autoEndRef.current || isCompleted) return;
    triggerAutoEnd("opponent_forfeit");
  }, [opponentFinished, opponentGaveUp, isCompleted, triggerAutoEnd]);

  // Auto-end: opponent completed → watch timer, end when exceeded
  useEffect(() => {
    if (!opponentFinished || opponentGaveUp || opponentTime === null || autoEndRef.current || isCompleted) return;

    const checkInterval = setInterval(() => {
      const currentTime = selectCurrentTime(useRunStore.getState());
      if (currentTime >= opponentTime) {
        clearInterval(checkInterval);
        triggerAutoEnd("time_exceeded");
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [opponentFinished, opponentGaveUp, opponentTime, isCompleted, triggerAutoEnd]);

  // Full-screen overlay when auto-end triggers
  if (autoEndTriggered && autoEndReason) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background animate-fade-in">
        <div className="text-center space-y-4 animate-scale-in">
          {autoEndReason === "opponent_forfeit" ? (
            <>
              <div className="text-6xl">🏆</div>
              <h2 className="text-3xl font-bold text-green-500">You Win!</h2>
              <p className="text-muted-foreground">Your opponent forfeited</p>
            </>
          ) : (
            <>
              <div className="text-6xl">⏱️</div>
              <h2 className="text-3xl font-bold text-destructive">Time&apos;s Up!</h2>
              <p className="text-muted-foreground">
                Opponent finished in <span className="font-mono font-semibold text-foreground">{formatTime(opponentTime || 0)}</span>
              </p>
            </>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading results...
          </div>
        </div>
      </div>
    );
  }

  // Subtle "time to beat" banner when opponent finished normally
  if (isRankedMatch && opponentFinished && !opponentGaveUp && opponentTime !== null && !isCompleted) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
        <div className="rounded-xl border border-border/40 bg-card shadow-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Time to beat</span>
            <span className="font-mono font-bold text-sm">{formatTime(opponentTime)}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
