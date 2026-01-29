import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-16 overflow-hidden">
      {/* Atmospheric background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-10">
        {/* Hero */}
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-display-sm sm:text-display tracking-tight">
            Wiki<span className="text-primary">Run</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Race through Wikipedia. Navigate from one article to another as fast as possible.
            Compete in ranked matches or sharpen your skills in training mode.
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-2 animate-slide-up"
          style={{ animationDelay: '100ms' }}
        >
          <Link
            href="/play"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] hover:shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.6)] hover:translate-y-[-2px] active:translate-y-[0px] transition-all duration-200"
          >
            Play Ranked
          </Link>
          <Link
            href="/training"
            className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-8 py-4 text-lg font-semibold shadow-soft hover:bg-secondary hover:border-border hover:translate-y-[-2px] active:translate-y-[0px] transition-all duration-200"
          >
            Training Mode
          </Link>
        </div>

        {/* Feature Cards with staggered animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-16">
          <div
            className="group p-6 rounded-2xl border border-border/40 bg-card shadow-soft hover:shadow-soft-lg hover:translate-y-[-2px] transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '200ms' }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Async PvP</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get matched with opponents on the same route. Complete your run anytime within 24 hours.
            </p>
          </div>

          <div
            className="group p-6 rounded-2xl border border-border/40 bg-card shadow-soft hover:shadow-soft-lg hover:translate-y-[-2px] transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '300ms' }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">ELO Rankings</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Climb from Bronze to Elder. Top 50 players earn the prestigious Elder rank.
            </p>
          </div>

          <div
            className="group p-6 rounded-2xl border border-border/40 bg-card shadow-soft hover:shadow-soft-lg hover:translate-y-[-2px] transition-all duration-300 animate-slide-up"
            style={{ animationDelay: '400ms' }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Fair Timing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Only your navigation time counts. Loading times are automatically excluded.
            </p>
          </div>
        </div>

        {/* Leaderboard link */}
        <div
          className="pt-6 animate-fade-in"
          style={{ animationDelay: '500ms' }}
        >
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all duration-200"
          >
            View Leaderboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
