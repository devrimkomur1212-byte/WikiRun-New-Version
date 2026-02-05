"use client";

interface QueueTimerProps {
  seconds: number;
  elo: number;
  onCancel: () => void;
  isPollingMode?: boolean;
}

export function QueueTimer({ seconds, elo, onCancel, isPollingMode }: QueueTimerProps) {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate current ELO range based on time (capped at 200)
  const getEloRange = () => {
    if (seconds < 15) return 50;
    if (seconds < 45) return 100;
    return 200;
  };

  const eloRange = getEloRange();

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-10 text-center shadow-soft-lg">
      <div className="mb-8">
        {/* Premium spinner */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-secondary" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-primary/20 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <h2 className="text-h2">Finding Match...</h2>
      </div>

      <div className="text-6xl font-mono font-bold mb-6 tabular-nums tracking-tight">
        {formatTime(seconds)}
      </div>

      <div className="space-y-3 mb-8 p-4 rounded-xl bg-secondary/30">
        <div className="text-sm text-muted-foreground">
          Your ELO: <span className="font-bold text-foreground">{elo}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Searching: <span className="font-bold text-foreground font-mono">{elo - eloRange} - {elo + eloRange}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {eloRange < 200 ? "Search range expands over time (max: ±200)" : "Maximum search range reached"}
        </div>
      </div>

      {isPollingMode && (
        <div className="text-xs text-muted-foreground/70 mb-4">
          Using backup connection mode
        </div>
      )}

      <button
        onClick={onCancel}
        className="px-6 py-3 rounded-xl border border-border/60 bg-card hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200 font-medium"
      >
        Cancel
      </button>
    </div>
  );
}
