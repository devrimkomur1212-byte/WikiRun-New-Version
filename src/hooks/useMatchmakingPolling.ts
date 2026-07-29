"use client";

import { useEffect, useRef, useCallback } from "react";
import { checkQueueStatus } from "@/app/actions/queueRanked";
import { joinMatchmakingQueue } from "@/app/actions/joinMatchmakingQueue";
import { logger } from "@/lib/logger";
import type { MatchFoundEvent } from "./useMatchmakingRealtime";

const POLLING_INTERVAL_MS = 3000; // Poll every 3 seconds

interface UseMatchmakingPollingOptions {
  enabled: boolean;
  onMatchFound: (match: MatchFoundEvent) => void;
  onAuthExpired?: () => void;
}

export function useMatchmakingPolling({
  enabled,
  onMatchFound,
  onAuthExpired,
}: UseMatchmakingPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const pollForMatch = useCallback(async () => {
    if (isPollingRef.current) return; // Prevent overlapping polls
    isPollingRef.current = true;

    try {
      logger.debug('polling', 'Polling for match...');

      // First, check if we were already matched by someone else
      const statusResult = await checkQueueStatus();

      if (statusResult.matched && statusResult.matchId && statusResult.runId) {
        logger.info('polling', 'Match found via status check!', {
          matchId: statusResult.matchId,
          runId: statusResult.runId,
        });

        onMatchFound({
          matchId: statusResult.matchId,
          runId: statusResult.runId,
          startTime: statusResult.startTime || new Date().toISOString(),
          startTitle: statusResult.startTitle!,
          targetTitle: statusResult.targetTitle!,
          opponentElo: statusResult.opponentElo || 1000,
        });
        return;
      }

      // If still in queue (or no pending match), actively try to match
      if (statusResult.inQueue || !statusResult.matched) {
        logger.debug('polling', 'Actively trying to match...');
        const matchResult = await joinMatchmakingQueue();

        if (matchResult.status === "unauthorized") {
          logger.warn('polling', 'Session expired while queueing');
          onAuthExpired?.();
          return;
        }

        if (matchResult.status === "matched") {
          logger.info('polling', 'Match created via active polling!', {
            matchId: matchResult.matchId,
            runId: matchResult.runId,
          });

          onMatchFound({
            matchId: matchResult.matchId,
            runId: matchResult.runId,
            startTime: matchResult.startTime,
            startTitle: matchResult.route.startTitle,
            targetTitle: matchResult.route.targetTitle,
            opponentElo: matchResult.opponent.elo,
          });
        }
        // If "queued", we stay in queue waiting for next poll
      }
    } catch (error) {
      logger.error('polling', 'Polling error', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [onMatchFound, onAuthExpired]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    logger.info('polling', 'Starting polling fallback');

    // Initial poll
    pollForMatch();

    // Set up interval
    intervalRef.current = setInterval(pollForMatch, POLLING_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollForMatch]);

  return { isPolling: enabled };
}
