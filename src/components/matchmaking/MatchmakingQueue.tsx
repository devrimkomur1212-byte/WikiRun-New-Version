"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { QueueTimer } from "./QueueTimer";
import { MatchFoundOverlay } from "./MatchFoundOverlay";
import {
  useMatchmakingRealtime,
  type MatchFoundEvent,
} from "@/hooks/useMatchmakingRealtime";
import { useMatchmakingPolling } from "@/hooks/useMatchmakingPolling";
import {
  joinMatchmakingQueue,
  leaveMatchmakingQueue,
} from "@/app/actions/joinMatchmakingQueue";
import { logger } from "@/lib/logger";
import { track } from "@/lib/analytics/posthog";
import {
  playMatchFoundSound,
  playCountdownTickSound,
  playGoSound,
} from "@/lib/sound/gameSounds";

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
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const matchSoundPlayedRef = useRef(false);
  const lastTickSecondRef = useRef<number | null>(null);

  // Chime once when a match is found — players wait with the tab in the
  // background, so this is the signal to come back
  useEffect(() => {
    if (state.status !== "matched" && state.status !== "countdown") return;
    if (matchSoundPlayedRef.current) return;
    matchSoundPlayedRef.current = true;
    playMatchFoundSound();
  }, [state.status]);

  // Handle match found from realtime subscription or polling
  const handleMatchFound = useCallback((match: MatchFoundEvent) => {
    track("match_found", { opponent_elo: match.opponentElo });
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
  const { isSubscribed, connectionStatus, retryCount, connectionError } = useMatchmakingRealtime({
    userId,
    enabled: connectionState !== 'idle',
    onMatchFound: handleMatchFound,
  });

  // Polling fallback when realtime fails
  useMatchmakingPolling({
    enabled: state.status === 'searching',
    onMatchFound: handleMatchFound,
  });

  // Step 1: Start connection on mount
  useEffect(() => {
    if (connectionState !== 'idle') return;
    logger.info('matchmaking', 'Initializing matchmaking');
    setConnectionState('connecting');
  }, [connectionState]);

  // Step 2: Wait for connection, THEN join queue (or fallback to polling)
  useEffect(() => {
    if (connectionState !== 'connecting') return;

    const startSearching = async () => {
      setConnectionState('ready');
      setState({ status: "searching", elo: userElo });
      track("matchmaking_queue_joined", { elo: userElo });

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
        // If "queued", realtime subscription or polling will notify us
      } catch (error) {
        logger.error('matchmaking', 'Failed to join queue', error);
        onCancel();
      }
    };

    // If realtime connected, proceed normally
    if (connectionStatus === 'connected') {
      logger.info('matchmaking', 'Realtime connected, joining queue');
      startSearching();
      return;
    }

    // If realtime failed after retries, switch to polling mode
    if (connectionStatus === 'error') {
      logger.warn('matchmaking', 'Realtime failed, switching to polling fallback', {
        error: connectionError,
      });
      setUsePollingFallback(true);
      startSearching();
      return;
    }

    // Still connecting - wait for timeout or success
  }, [connectionState, connectionStatus, connectionError, userElo, onCancel]);

  // Queue time counter — ticks from mount, stops only once matched/countdown
  useEffect(() => {
    if (state.status === "matched" || state.status === "countdown") return;

    const interval = setInterval(() => {
      setQueueTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status]);

  // Handle countdown when matched - single unified effect
  useEffect(() => {
    if (state.status !== "matched" && state.status !== "countdown") return;

    // Get the start time and route info
    const serverStartTime = state.status === "matched" ? state.startTime : null;
    const runId = state.runId;
    const startTitle = state.route.startTitle;

    // If we don't have start time info, we can't countdown
    if (!serverStartTime && state.status === "matched") return;

    // Calculate target time - ensure at least 3 seconds of countdown
    const serverStartTimeMs = serverStartTime ? new Date(serverStartTime).getTime() : Date.now();
    const now = Date.now();
    const minCountdownMs = 3000; // Minimum 3 seconds countdown

    // If server time has mostly elapsed, give a fresh 3 second countdown
    const remainingFromServer = serverStartTimeMs - now;
    const startTimeMs = remainingFromServer < minCountdownMs
      ? now + minCountdownMs
      : serverStartTimeMs;

    const updateCountdown = () => {
      const remaining = startTimeMs - Date.now();

      if (remaining <= 0) {
        // Time's up - navigate to game
        playGoSound();
        router.push(`/run/${runId}/article/${encodeURIComponent(startTitle)}`);
        return true; // Signal to stop interval
      }

      const secondsLeft = Math.ceil(remaining / 1000);

      // Tick once per second for the final 3... 2... 1...
      if (secondsLeft <= 3 && secondsLeft !== lastTickSecondRef.current) {
        lastTickSecondRef.current = secondsLeft;
        playCountdownTickSound();
      }

      setState((prev) => {
        if (prev.status === "matched" || prev.status === "countdown") {
          return {
            status: "countdown",
            secondsLeft,
            runId: prev.runId,
            route: prev.route,
            opponentElo: prev.opponentElo,
          };
        }
        return prev;
      });

      return false; // Continue interval
    };

    // Run immediately
    const shouldStop = updateCountdown();
    if (shouldStop) return;

    // Then run every 100ms
    const interval = setInterval(() => {
      const shouldStop = updateCountdown();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state.status, state.status === "matched" ? state.startTime : null, router]);

  const handleCancel = async () => {
    try {
      await leaveMatchmakingQueue();
    } catch (error) {
      console.error("Failed to leave queue:", error);
    }
    onCancel();
  };

  // Render based on state
  if (state.status === "matched" || state.status === "countdown") {
    return (
      <MatchFoundOverlay
        opponentElo={state.opponentElo}
        route={state.route}
        secondsLeft={state.status === "countdown" ? state.secondsLeft : 5}
      />
    );
  }

  // Default: show queue timer for idle / connecting / searching phases
  return (
    <QueueTimer
      seconds={queueTime}
      elo={userElo}
      onCancel={handleCancel}
      isPollingMode={usePollingFallback}
    />
  );
}
