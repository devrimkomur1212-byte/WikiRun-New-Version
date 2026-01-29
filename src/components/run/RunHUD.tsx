"use client";

import { useRunStore } from "@/lib/run/runStore";
import { Timer } from "./Timer";

export function RunHUD() {
  const startTitle = useRunStore((state) => state.startTitle);
  const targetTitle = useRunStore((state) => state.targetTitle);
  const currentTitle = useRunStore((state) => state.currentTitle);
  const clicksCount = useRunStore((state) => state.clicksCount);
  const routeTitles = useRunStore((state) => state.routeTitles);
  const isLoading = useRunStore((state) => state.isLoading);
  const isTargetReached = useRunStore((state) => state.isTargetReached);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Route info */}
          <div className="flex items-center gap-3 text-sm">
            <span className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground font-medium">
              {startTitle}
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold">
              {targetTitle}
            </span>
          </div>

          {/* Timer and stats */}
          <div className="flex items-center gap-8">
            {/* Timer */}
            <div className="flex flex-col items-center">
              <Timer />
              {isLoading && (
                <span className="text-xs text-muted-foreground animate-pulse mt-1">
                  Loading...
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold tabular-nums tracking-tight">{clicksCount}</span>
              <span className="text-xs text-muted-foreground">Clicks</span>
            </div>
          </div>
        </div>

        {/* Route breadcrumb */}
        <div className="mt-3 flex items-center gap-2 text-xs overflow-x-auto pb-1">
          {routeTitles.slice(-5).map((title, index, arr) => (
            <span key={index} className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                  index === arr.length - 1
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground"
                } ${title.toLowerCase() === targetTitle.toLowerCase() ? "bg-primary/10 text-primary font-semibold" : ""}`}
              >
                {title}
              </span>
              {index < arr.length - 1 && <span className="text-muted-foreground/40">→</span>}
            </span>
          ))}
          {routeTitles.length > 5 && (
            <span className="text-muted-foreground/60 ml-1 font-mono">
              ({routeTitles.length} total)
            </span>
          )}
        </div>

        {/* Target reached indicator */}
        {isTargetReached && (
          <div className="mt-3 p-3 bg-primary/10 rounded-xl text-center border border-primary/20 animate-scale-in">
            <span className="text-primary font-semibold">
              🎉 Target Reached! Submitting run...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
