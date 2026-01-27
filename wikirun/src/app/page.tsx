import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Wiki<span className="text-primary">Run</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Race through Wikipedia. Navigate from one article to another as fast as possible.
          Compete in ranked matches or sharpen your skills in training mode.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/play"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            Play Ranked
          </Link>
          <Link
            href="/training"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-8 py-4 text-lg font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Training Mode
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Async PvP</h3>
            <p className="text-muted-foreground">
              Get matched with opponents on the same route. Complete your run anytime within 24 hours.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">ELO Rankings</h3>
            <p className="text-muted-foreground">
              Climb from Bronze to Elder. Top 50 players earn the prestigious Elder rank.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Fair Timing</h3>
            <p className="text-muted-foreground">
              Only your navigation time counts. Loading times are automatically excluded.
            </p>
          </div>
        </div>

        <div className="pt-8">
          <Link
            href="/leaderboard"
            className="text-primary hover:underline"
          >
            View Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
