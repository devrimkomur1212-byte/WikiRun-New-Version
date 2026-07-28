"use client";

import { useEffect, useState } from "react";
import { useOnlineStore } from "@/lib/presence/onlineStore";

const QUEUE_POLL_MS = 5000;

/**
 * "N players online" badge with an "in queue" suffix that only appears when
 * the queue is non-empty (an explicit "0 in queue" discourages queuing).
 */
export function LivePlayerBadge() {
  const onlineCount = useOnlineStore((s) => s.onlineCount);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchQueueCount = async () => {
      try {
        const res = await fetch("/api/queue-count");
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        if (!cancelled) setQueueCount(data.count);
      } catch {
        // Ignore — the badge is cosmetic
      }
    };

    fetchQueueCount();
    const interval = setInterval(fetchQueueCount, QUEUE_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Presence needs a beat to sync; render nothing instead of "0 players online"
  if (onlineCount < 1) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card px-4 py-2 text-sm text-muted-foreground shadow-soft animate-fade-in">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
      <span>
        <span className="font-semibold text-foreground">{onlineCount}</span>{" "}
        {onlineCount === 1 ? "player" : "players"} online
      </span>
      {queueCount >= 1 && (
        <>
          <span className="text-border">•</span>
          <span>
            <span className="font-semibold text-foreground">{queueCount}</span>{" "}
            in queue
          </span>
        </>
      )}
    </div>
  );
}
