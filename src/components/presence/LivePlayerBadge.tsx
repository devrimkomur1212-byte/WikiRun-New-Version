"use client";

import { useEffect, useState } from "react";
import { useOnlineStore } from "@/lib/presence/onlineStore";

const QUEUE_POLL_MS = 5000;

// The online count only appears once it reads as a crowd. At ~3 players a
// day it would otherwise usually say "1 player online", which tells a
// visitor they are alone — worse than showing nothing at all.
const MIN_ONLINE_TO_SHOW = 5;

/**
 * Live activity badge. The online count is hidden below MIN_ONLINE_TO_SHOW,
 * but the queue count still shows whenever anyone is queueing — that one is
 * actionable rather than decorative, since it tells a player whether
 * pressing Find Match will actually match them.
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

  const showOnline = onlineCount >= MIN_ONLINE_TO_SHOW;
  const showQueue = queueCount >= 1;

  if (!showOnline && !showQueue) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card px-4 py-2 text-sm text-muted-foreground shadow-soft animate-fade-in">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
      {showOnline ? (
        <span>
          <span className="font-semibold text-foreground">{onlineCount}</span>{" "}
          players online
        </span>
      ) : null}
      {showOnline && showQueue ? <span className="text-border">•</span> : null}
      {showQueue ? (
        <span>
          <span className="font-semibold text-foreground">{queueCount}</span>{" "}
          in queue
        </span>
      ) : null}
    </div>
  );
}
