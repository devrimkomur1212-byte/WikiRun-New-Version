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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border p-8 max-w-lg mx-4 text-center animate-in fade-in zoom-in duration-300">
        <h2 className="text-3xl font-bold mb-4 text-primary">
          Match Found!
        </h2>

        <div className="mb-6">
          <span className="text-muted-foreground">Opponent ELO: </span>
          <span className="font-bold text-lg">{opponentElo}</span>
        </div>

        <div className="bg-muted rounded-lg p-4 mb-6">
          <div className="text-sm text-muted-foreground mb-2">Your Route</div>
          <div className="flex items-center justify-center gap-3 text-lg">
            <span className="font-semibold">{route.startTitle}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-primary">{route.targetTitle}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-8xl font-bold font-mono text-primary animate-pulse">
            {secondsLeft}
          </div>
        </div>

        <p className="text-muted-foreground">
          {secondsLeft > 0
            ? `Game starting in ${secondsLeft} second${secondsLeft !== 1 ? "s" : ""}...`
            : "GO!"}
        </p>
      </div>
    </div>
  );
}
