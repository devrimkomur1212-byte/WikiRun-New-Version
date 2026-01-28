"use client";

interface QueueTimerProps {
  seconds: number;
  elo: number;
  onCancel: () => void;
}

export function QueueTimer({ seconds, elo, onCancel }: QueueTimerProps) {
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
    <div className="bg-card rounded-lg border p-8 text-center">
      <div className="mb-6">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold">Finding Match...</h2>
      </div>

      <div className="text-5xl font-mono font-bold mb-4 tabular-nums">
        {formatTime(seconds)}
      </div>

      <div className="space-y-2 mb-6">
        <div className="text-sm text-muted-foreground">
          Your ELO: <span className="font-semibold text-foreground">{elo}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Searching: <span className="font-semibold text-foreground">{elo - eloRange} - {elo + eloRange}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {eloRange < 200 ? "Search range expands over time (max: ±200)" : "Maximum search range reached"}
        </div>
      </div>

      <button
        onClick={onCancel}
        className="px-6 py-2 rounded-md border border-input bg-background hover:bg-accent transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
