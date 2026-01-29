"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QueueTimer } from "./QueueTimer";
import { MatchFoundOverlay } from "./MatchFoundOverlay";
import {
  useMatchmakingRealtime,
  type MatchFoundEvent,
} from "@/hooks/useMatchmakingRealtime";
import {
  joinMatchmakingQueue,
  leaveMatchmakingQueue,
} from "@/app/actions/joinMatchmakingQueue";
import { logger } from "@/lib/logger";

type MatchmakingState =
  | { status: "idle" }
  | { status: "searching"; elo: number }
  | {
      status: "matched";
      matchId: string;
      runId: string;
      startTime: string;
      route: { startTitle: string; targetTitle: string };
      opponentElo: number;
    }
  | {
      status: "countdown";
      secondsLeft: number;
      runId: string;
      route: { startTitle: string; targetTitle: string };
      opponentElo: number;
    };

interface MatchmakingQueueProps {
  userId: string;
  userElo: number;
  onCancel: () => void;
}

export function MatchmakingQueue({
  userId,
  userElo,
  onCancel,
}: MatchmakingQueueProps) {
  const router = useRouter();
  const [state, setState] = useState<MatchmakingState>({ status: "idle" });
  const [queueTime, setQueueTime] = useState(0);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'ready'>('idle');

  // Handle match found from realtime subscription
  const handleMatchFound = useCallback((match: MatchFoundEvent) => {
    setState({
      status: "matched",
      matchId: match.matchId,
      runId: match.runId,
      startTime: match.startTime,
      route: {
        startTitle: match.startTitle,
        targetTitle: match.targetTitle,
      },
      opponentElo: match.opponentElo,
    });
  }, []);

  // Subscribe to realtime match notifications
  const { isSubscribed, connectionStatus } = useMatchmakingRealtime({
    userId,
    enabled: connectionState !== 'idle',
    onMatchFound: handleMatchFound,
  });

  // Step 1: Start connection on mount
  useEffect(() => {
    if (connectionState !== 'idle') return;
    logger.info('matchmaking', 'Initializing matchmaking');
    setConnectionState('connecting');
  }, [connectionState]);

  // Step 2: Wait for connection, THEN join queue
  useEffect(() => {
    if (connectionState !== 'connecting') return;
    if (connectionStatus !== 'connected') return;

    logger.info('matchmaking', 'Realtime connected, joining queue');
    setConnectionState('ready');

    const startSearching = async () => {
      setState({ status: "searching", elo: userElo });

      try {
        const result = await joinMatchmakingQueue();
        logger.info('matchmaking', 'Queue join result', result);

        if (result.status === "matched") {
          // Immediately matched
          setState({
            status: "matched",
            matchId: result.matchId,
            runId: result.runId,
            startTime: result.startTime,
            route: result.route,
            opponentElo: result.opponent.elo,
          });
        }
        // If "queued", realtime subscription will notify us
      } catch (error) {
        logger.error('matchmaking', 'Failed to join queue', error);
        onCancel();
      }
    };

    startSearching();
  }, [connectionState, connectionStatus, userElo, onCancel]);

  // Queue time counter
  useEffect(() => {
    if (state.status !== "searching") return;

    const interval = setInterval(() => {
      setQueueTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status]);

  // Handle countdown when matched
  useEffect(() => {
    if (state.status !== "matched") return;

    const startTimeMs = new Date(state.startTime).getTime();
    const now = Date.now();
    const msUntilStart = startTimeMs - now;

    if (msUntilStart <= 0) {
      // Already past start time, go immediately
      navigateToGame(state.runId, state.route.startTitle);
      return;
    }

    // Start countdown
    const updateCountdown = () => {
      const remaining = startTimeMs - Date.now();
      if (remaining <= 0) {
        navigateToGame(state.runId, state.route.startTitle);
      } else {
        setState((prev) => {
          if (prev.status === "matched") {
            return {
              status: "countdown",
              secondsLeft: Math.ceil(remaining / 1000),
              runId: prev.runId,
              route: prev.route,
              opponentElo: prev.opponentElo,
            };
          }
          if (prev.status === "countdown") {
            return {
              ...prev,
              secondsLeft: Math.ceil(remaining / 1000),
            };
          }
          return prev;
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);

    return () => clearInterval(interval);
  }, [state.status === "matched"]);

  // Continue countdown updates
  useEffect(() => {
    if (state.status !== "countdown") return;

    const checkTime = () => {
      if (state.secondsLeft <= 0) {
        navigateToGame(state.runId, state.route.startTitle);
      }
    };

    const interval = setInterval(checkTime, 100);
    return () => clearInterval(interval);
  }, [state.status === "countdown"]);

  const navigateToGame = (runId: string, startTitle: string) => {
    router.push(`/run/${runId}/article/${encodeURIComponent(startTitle)}`);
  };

  const handleCancel = async () => {
    try {
      await leaveMatchmakingQueue();
    } catch (error) {
      console.error("Failed to leave queue:", error);
    }
    onCancel();
  };

  // Render based on state
  // Show connecting state
  if (connectionState === 'connecting' || connectionState === 'idle') {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-10 text-center shadow-soft">
        <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <div className="text-muted-foreground">
          Connecting to matchmaking...
        </div>
      </div>
    );
  }

  // Show error state
  if (connectionStatus === 'error') {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-card p-10 text-center shadow-soft">
        <h2 className="text-h2 text-destructive mb-4">Connection Error</h2>
        <p className="text-muted-foreground mb-6">
          Failed to connect to matchmaking server
        </p>
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  if (state.status === "searching") {
    return (
      <QueueTimer seconds={queueTime} elo={state.elo} onCancel={handleCancel} />
    );
  }

  if (state.status === "matched" || state.status === "countdown") {
    return (
      <MatchFoundOverlay
        opponentElo={state.opponentElo}
        route={state.route}
        secondsLeft={state.status === "countdown" ? state.secondsLeft : 5}
      />
    );
  }

  return null;
}
