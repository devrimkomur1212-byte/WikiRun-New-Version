"use client";

import { useEffect, useRef } from "react";
import { useRunStore } from "@/lib/run/runStore";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

export function Timer() {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let rafId: number;

    function tick() {
      const { timerRunning, activeTimeMs, timerStartedAt } =
        useRunStore.getState();

      let displayTime: number;
      if (timerRunning && timerStartedAt !== null) {
        displayTime = activeTimeMs + (performance.now() - timerStartedAt);
      } else {
        displayTime = activeTimeMs;
      }

      if (spanRef.current) {
        spanRef.current.textContent = formatTime(displayTime);
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <span
      ref={spanRef}
      className="font-mono text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-foreground"
    >
      {formatTime(0)}
    </span>
  );
}
