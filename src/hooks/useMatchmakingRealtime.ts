"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export interface MatchFoundEvent {
  matchId: string;
  runId: string;
  startTime: string;
  startTitle: string;
  targetTitle: string;
  opponentElo: number;
}

interface UseMatchmakingRealtimeOptions {
  userId: string | null;
  enabled: boolean;
  onMatchFound: (match: MatchFoundEvent) => void;
}

export function useMatchmakingRealtime({
  userId,
  enabled,
  onMatchFound,
}: UseMatchmakingRealtimeOptions) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const handleMatchFound = useCallback(
    async (matchId: string) => {
      try {
        logger.debug('realtime', `Match found event: ${matchId}`);

        if (!userId) {
          logger.error('realtime', 'No userId provided to handleMatchFound');
          return;
        }

        // Fetch the run for this user
        const { data: runData, error: runError } = await supabase
          .from("runs")
          .select("*")
          .eq("match_id", matchId)
          .eq("user_id", userId)
          .single();

        if (runError) {
          logger.error('realtime', `Error fetching run for match ${matchId}`, runError);
          return;
        }

        const run = runData as {
          id: string;
          start_title: string;
          target_title: string;
        } | null;

        if (!run) {
          logger.error('realtime', `Run not found for match ${matchId} and user ${userId}`);
          return;
        }

        // Fetch match details including start_time
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .single();

        if (matchError) {
          logger.error('realtime', `Error fetching match ${matchId}`, matchError);
          return;
        }

        const match = matchData as {
          id: string;
          player1_id: string;
          player2_id: string;
          start_time: string | null;
        } | null;

        if (!match) {
          logger.error('realtime', `Match ${matchId} not found`);
          return;
        }

        // Fetch opponent's profile for ELO
        const opponentId =
          match.player1_id === userId ? match.player2_id : match.player1_id;

        const { data: opponentProfileData } = await supabase
          .from("profiles")
          .select("elo_rating")
          .eq("id", opponentId)
          .single();

        const opponentProfile = opponentProfileData as { elo_rating: number } | null;

        logger.info('realtime', 'Match found callback triggered', { matchId, runId: run.id });

        onMatchFound({
          matchId: match.id,
          runId: run.id,
          startTime: match.start_time || new Date().toISOString(),
          startTitle: run.start_title,
          targetTitle: run.target_title,
          opponentElo: opponentProfile?.elo_rating ?? 1000,
        });
      } catch (error) {
        logger.error('realtime', 'Error handling match found', error);
      }
    },
    [userId, supabase, onMatchFound]
  );

  useEffect(() => {
    if (!userId || !enabled) {
      // Clean up if disabled
      if (channelRef.current) {
        logger.debug('realtime', 'Cleaning up subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
        setConnectionStatus('connecting');
      }
      return;
    }

    logger.debug('realtime', 'Setting up subscription', { userId });

    // Subscribe to matches where this user is a participant
    const channel = supabase
      .channel(`matchmaking:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
        },
        async (payload) => {
          const match = payload.new as {
            id: string;
            player1_id: string;
            player2_id: string;
          };

          // Check if this user is part of the match
          if (match.player1_id !== userId && match.player2_id !== userId) {
            logger.debug('realtime', 'Match INSERT event for different users, ignoring');
            return;
          }

          logger.info('realtime', `Match INSERT event received for user ${userId}, match ${match.id}`);
          await handleMatchFound(match.id);
        }
      )
      .subscribe((status) => {
        logger.debug('realtime', `Subscription status: ${status}`);
        setIsSubscribed(status === "SUBSCRIBED");
        setConnectionStatus(
          status === "SUBSCRIBED" ? "connected" :
          status === "CHANNEL_ERROR" ? "error" :
          "connecting"
        );
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        logger.debug('realtime', 'Unsubscribing from channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, supabase, handleMatchFound]);

  return { isSubscribed, connectionStatus };
}
