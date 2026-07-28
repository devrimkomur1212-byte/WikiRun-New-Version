"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStore } from "@/lib/presence/onlineStore";

/**
 * Joins the site-wide "online-users" presence channel and keeps the online
 * count in the store. Mounted once in the root layout so every visitor
 * (logged in or not) is counted while they have the site open. Renders
 * nothing. Presence lives entirely in Supabase Realtime memory — no database
 * reads or writes.
 */
export function PresenceTracker() {
  const setOnlineCount = useOnlineStore((s) => s.setOnlineCount);

  useEffect(() => {
    const supabase = createClient();
    const presenceKey = crypto.randomUUID();

    const channel = supabase.channel("online-users", {
      config: { presence: { key: presenceKey } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setOnlineCount]);

  return null;
}
