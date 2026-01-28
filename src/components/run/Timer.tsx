"use client";

import { useState, useEffect } from "react";
import { useRunStore, selectCurrentTime } from "@/lib/run/runStore";

export function Timer() {
  const [displayTime, setDisplayTime] = useState(0);
  const timerRunning = useRunStore((state) => state.timerRunning);
  const activeTimeMs = useRunStore((state) => state.activeTimeMs);
  const timerStartedAt = useRunStore((state) => state.timerStartedAt);

  useEffect(() => {
    if (!timerRunning) {
      setDisplayTime(activeTimeMs);
      return;
    }

    const interval = setInterval(() => {
      if (timerStartedAt !== null) {
        setDisplayTime(activeTimeMs + (performance.now() - timerStartedAt));
      }
    }, 10); // Update every 10ms for smooth display

    return () => clearInterval(interval);
  }, [timerRunning, activeTimeMs, timerStartedAt]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="font-mono text-4xl font-bold tabular-nums">
      {formatTime(displayTime)}
    </div>
  );
}
