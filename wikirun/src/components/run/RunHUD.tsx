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
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Route info */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground">From:</span>
            <span className="font-semibold">{startTitle}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-muted-foreground">To:</span>
            <span className="font-semibold text-primary">{targetTitle}</span>
          </div>

          {/* Timer and stats */}
          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className="flex flex-col items-center">
              <Timer />
              {isLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Loading...
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{clicksCount}</span>
                <span className="text-xs text-muted-foreground">Clicks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route breadcrumb */}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto pb-1">
          {routeTitles.slice(-5).map((title, index, arr) => (
            <span key={index} className="flex items-center">
              <span
                className={`whitespace-nowrap ${
                  index === arr.length - 1 ? "text-foreground font-medium" : ""
                } ${title.toLowerCase() === targetTitle.toLowerCase() ? "text-primary" : ""}`}
              >
                {title}
              </span>
              {index < arr.length - 1 && <span className="mx-1">→</span>}
            </span>
          ))}
          {routeTitles.length > 5 && (
            <span className="text-muted-foreground ml-2">
              ({routeTitles.length} total)
            </span>
          )}
        </div>

        {/* Target reached indicator */}
        {isTargetReached && (
          <div className="mt-2 p-2 bg-primary/10 rounded-md text-center">
            <span className="text-primary font-semibold">
              🎉 Target Reached! Submitting run...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
