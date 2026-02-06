"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRunStore, selectCurrentTime } from "@/lib/run/runStore";
import { giveUpRankedRun } from "@/app/actions/submitRun";

interface OpponentRunData {
  is_completed: boolean;
  gave_up: boolean;
  active_time_ms: number;
}

interface MatchData {
  player1_id: string;
  player2_id: string;
  player1_run_id: string | null;
  player2_run_id: string | null;
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
  const [showNotification, setShowNotification] = useState(false);
  const [isForfeiting, setIsForfeiting] = useState(false);

  // Only show for ranked matches
  const isRankedMatch = mode === "ranked" && matchId;

  useEffect(() => {
    if (!isRankedMatch || isCompleted) return;

    const supabase = createClient();

    const checkOpponentStatus = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get match data to find opponent's run
      const { data: matchData } = await supabase
        .from("matches")
        .select("player1_id, player2_id, player1_run_id, player2_run_id")
        .eq("id", matchId)
        .single();

      if (!matchData) return;

      const match = matchData as unknown as MatchData;

      // Determine which run is the opponent's
      const isPlayer1 = match.player1_id === user.id;
      const opponentRunId = isPlayer1 ? match.player2_run_id : match.player1_run_id;

      if (!opponentRunId) return; // Opponent hasn't started yet

      // Check opponent's run status
      const { data: opponentRunData } = await supabase
        .from("runs")
        .select("is_completed, gave_up, active_time_ms")
        .eq("id", opponentRunId)
        .single();

      if (!opponentRunData) return;

      const opponentRun = opponentRunData as unknown as OpponentRunData;

      if (opponentRun.is_completed) {
        const run = opponentRun;
        setOpponentFinished(true);
        setOpponentTime(run.active_time_ms);
        setOpponentGaveUp(run.gave_up === true);
        setShowNotification(true);
      }
    };

    // Check immediately
    checkOpponentStatus();

    // Poll every 5 seconds (realtime would be better but this is simpler)
    const interval = setInterval(checkOpponentStatus, 5000);

    return () => clearInterval(interval);
  }, [isRankedMatch, matchId, isCompleted]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleForfeit = async () => {
    if (!runId || isForfeiting) return;

    setIsForfeiting(true);
    try {
      const currentTime = selectCurrentTime(useRunStore.getState());
      await giveUpRankedRun(runId, currentTime);
      completeRun();
      router.push(`/results/${runId}`);
    } catch (error) {
      console.error("Failed to forfeit:", error);
      setIsForfeiting(false);
    }
  };

  const handleContinue = () => {
    setShowNotification(false);
  };

  if (!isRankedMatch || !opponentFinished || !showNotification || isCompleted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="rounded-2xl border border-border/40 bg-card shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">🏁</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {opponentGaveUp ? "Opponent forfeited" : "Opponent finished!"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {opponentGaveUp ? (
                <>They gave up at <span className="font-mono font-semibold text-foreground">{formatTime(opponentTime || 0)}</span></>
              ) : (
                <>Their time: <span className="font-mono font-semibold text-foreground">{formatTime(opponentTime || 0)}</span></>
              )}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleContinue}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Keep Going
              </button>
              <button
                onClick={handleForfeit}
                disabled={isForfeiting}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                {isForfeiting ? "..." : "Forfeit"}
              </button>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
