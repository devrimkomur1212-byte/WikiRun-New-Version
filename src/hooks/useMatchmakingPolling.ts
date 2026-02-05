"use client";

import { useEffect, useRef, useCallback } from "react";
import { checkQueueStatus } from "@/app/actions/queueRanked";
import { logger } from "@/lib/logger";
import type { MatchFoundEvent } from "./useMatchmakingRealtime";

const POLLING_INTERVAL_MS = 3000; // Poll every 3 seconds

interface UseMatchmakingPollingOptions {
  enabled: boolean;
  onMatchFound: (match: MatchFoundEvent) => void;
}

export function useMatchmakingPolling({
  enabled,
  onMatchFound,
}: UseMatchmakingPollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const pollForMatch = useCallback(async () => {
    if (isPollingRef.current) return; // Prevent overlapping polls
    isPollingRef.current = true;

    try {
      logger.debug('polling', 'Polling for match...');
      const result = await checkQueueStatus();

      if (result.matched && result.matchId && result.runId) {
        logger.info('polling', 'Match found via polling!', {
          matchId: result.matchId,
          runId: result.runId,
        });

        onMatchFound({
          matchId: result.matchId,
          runId: result.runId,
          startTime: result.startTime || new Date().toISOString(),
          startTitle: result.startTitle!,
          targetTitle: result.targetTitle!,
          opponentElo: result.opponentElo || 1000,
        });
      }
    } catch (error) {
      logger.error('polling', 'Polling error', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [onMatchFound]);

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
