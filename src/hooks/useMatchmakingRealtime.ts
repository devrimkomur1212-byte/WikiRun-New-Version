"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const handleMatchFound = useCallback(
    async (matchId: string) => {
      if (!userId) return;

      // Fetch the run for this user
      const { data: runData } = await supabase
        .from("runs")
        .select("*")
        .eq("match_id", matchId)
        .eq("user_id", userId)
        .single();

      const run = runData as {
        id: string;
        start_title: string;
        target_title: string;
      } | null;

      if (!run) return;

      // Fetch match details including start_time
      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      const match = matchData as {
        id: string;
        player1_id: string;
        player2_id: string;
        start_time: string | null;
      } | null;

      if (!match) return;

      // Fetch opponent's profile for ELO
      const opponentId =
        match.player1_id === userId ? match.player2_id : match.player1_id;

      const { data: opponentProfileData } = await supabase
        .from("profiles")
        .select("elo_rating")
        .eq("id", opponentId)
        .single();

      const opponentProfile = opponentProfileData as { elo_rating: number } | null;

      onMatchFound({
        matchId: match.id,
        runId: run.id,
        startTime: match.start_time || new Date().toISOString(),
        startTitle: run.start_title,
        targetTitle: run.target_title,
        opponentElo: opponentProfile?.elo_rating ?? 1000,
      });
    },
    [userId, supabase, onMatchFound]
  );

  useEffect(() => {
    if (!userId || !enabled) {
      // Clean up if disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      }
      return;
    }

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
            return;
          }

          await handleMatchFound(match.id);
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, supabase, handleMatchFound]);

  return { isSubscribed };
}
