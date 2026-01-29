"use client";

interface MatchFoundOverlayProps {
  opponentElo: number;
  route: { startTitle: string; targetTitle: string };
  secondsLeft: number;
}

export function MatchFoundOverlay({
  opponentElo,
  route,
  secondsLeft,
}: MatchFoundOverlayProps) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="bg-card rounded-3xl border border-border/40 p-10 max-w-lg mx-4 text-center shadow-soft-lg animate-scale-in">
        <h2 className="text-display-sm mb-6 text-primary">
          Match Found!
        </h2>

        <div className="mb-8">
          <span className="text-muted-foreground">Opponent ELO: </span>
          <span className="font-bold text-xl">{opponentElo}</span>
        </div>

        <div className="bg-secondary/50 rounded-2xl p-5 mb-8">
          <div className="text-sm text-muted-foreground mb-3">Your Route</div>
          <div className="flex items-center justify-center gap-4 text-lg">
            <span className="px-3 py-1.5 rounded-lg bg-card font-semibold">{route.startTitle}</span>
            <span className="text-muted-foreground/50">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold">{route.targetTitle}</span>
          </div>
        </div>

        <div className="mb-6">
          <div
            className="text-8xl sm:text-9xl font-bold font-mono text-primary animate-pulse tabular-nums"
            style={{ textShadow: '0 0 40px hsl(var(--primary) / 0.5)' }}
          >
            {secondsLeft}
          </div>
        </div>

        <p className="text-lg text-muted-foreground">
          {secondsLeft > 0
            ? `Game starting in ${secondsLeft} second${secondsLeft !== 1 ? "s" : ""}...`
            : <span className="text-primary font-bold text-2xl">GO!</span>}
        </p>
      </div>
    </div>
  );
}
