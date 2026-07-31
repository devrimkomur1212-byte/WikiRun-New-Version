import Link from "next/link";
import { notFound } from "next/navigation";
import { getDailyStats } from "@/app/actions/dailyStats";
import { ShareButton } from "@/components/results/ShareButton";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "Daily Challenge Result",
  "Your result in today's WikiRun daily challenge."
);

interface Props {
  params: Promise<{ runId: string }>;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** e.g. "3 clicks faster than average" / "1 click above average" */
function comparison(you: number, mean: number, unit: string): string {
  const diff = Math.round((you - mean) * 10) / 10;
  if (diff === 0) return `exactly the average`;
  const abs = Math.abs(diff);
  return diff < 0
    ? `${abs} ${unit} better than average`
    : `${abs} ${unit} above average`;
}

export default async function DailyResultsPage({ params }: Props) {
  const { runId } = await params;
  const stats = await getDailyStats(runId);

  if (!stats) notFound();

  const { you } = stats;

  const shareText = you
    ? `WikiRun daily — ${stats.startTitle} → ${stats.targetTitle} in ${you.clicks} clicks, ${formatTime(you.timeMs)}${stats.streak > 1 ? ` (${stats.streak} day streak)` : ""} 🏃‍♂️📚`
    : `Today's WikiRun daily: ${stats.startTitle} → ${stats.targetTitle} 🏃‍♂️📚`;

  return (
    <div className="py-8 space-y-6 max-w-2xl mx-auto">
      <div className="text-center animate-scale-in">
        <p className="text-sm text-muted-foreground mb-1">Daily Challenge</p>
        <h1 className="text-display-sm mb-3">
          {you?.gaveUp ? "Run Forfeited" : "Challenge Complete!"}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="px-2.5 py-1 rounded-lg bg-secondary font-medium">
            {stats.startTitle}
          </span>
          <span className="text-muted-foreground/50">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold">
            {stats.targetTitle}
          </span>
        </div>
      </div>

      {you?.gaveUp && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center shadow-soft animate-slide-up">
          <p className="text-destructive font-semibold">You gave up today</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your streak has been reset, and this run isn&apos;t counted in
            today&apos;s stats. A new route arrives at the next reset.
          </p>
        </div>
      )}

      {stats.streak > 0 && (
        <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft animate-slide-up">
          <div className="text-3xl font-bold">🔥 {stats.streak}</div>
          <div className="text-sm text-muted-foreground mt-1">
            day streak — come back tomorrow to keep it
          </div>
        </div>
      )}

      {you && (
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
            <div className="text-3xl font-bold font-mono tracking-tight">
              {formatTime(you.timeMs)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Your time</div>
            {stats.meanTimeMs !== null && stats.finishers > 1 && (
              <div className="text-xs text-muted-foreground/80 mt-2">
                Average {formatTime(stats.meanTimeMs)}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
            <div className="text-3xl font-bold tracking-tight">{you.clicks}</div>
            <div className="text-sm text-muted-foreground mt-1">Your clicks</div>
            {stats.meanClicks !== null && stats.finishers > 1 && (
              <div className="text-xs text-muted-foreground/80 mt-2">
                Average {stats.meanClicks}
              </div>
            )}
          </div>
        </div>
      )}

      {you && stats.meanClicks !== null && stats.finishers > 1 && (
        <p className="text-center text-sm text-muted-foreground animate-slide-up">
          You were{" "}
          <span className="font-semibold text-foreground">
            {comparison(you.clicks, stats.meanClicks, "clicks")}
          </span>{" "}
          across {stats.finishers} players today.
        </p>
      )}

      {/* Averaging a single player against themselves says nothing, so
          explain the absence rather than leaving a blank space */}
      {you && !you.gaveUp && stats.finishers === 1 && (
        <p className="text-center text-sm text-muted-foreground animate-slide-up">
          You&apos;re the first to finish today — averages appear once someone
          else has played.
        </p>
      )}

      {you?.usedHints && (
        <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4 text-center text-sm text-muted-foreground animate-slide-up">
          You played with hints on, so this run isn&apos;t eligible for today&apos;s
          records.
        </div>
      )}

      {(stats.fewestClicks || stats.fastest) && (
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up">
          <h2 className="font-semibold mb-4">Today&apos;s best</h2>
          <div className="space-y-3">
            {stats.fewestClicks && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fewest clicks</span>
                <span className="text-sm">
                  <span className="font-semibold">{stats.fewestClicks.username}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {stats.fewestClicks.clicks} clicks
                  </span>
                </span>
              </div>
            )}
            {stats.fastest && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fastest time</span>
                <span className="text-sm">
                  <span className="font-semibold">{stats.fastest.username}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {formatTime(stats.fastest.timeMs)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up">
        <ShareButton shareText={shareText} />
        <Link
          href="/play"
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm font-semibold shadow-sm hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200"
        >
          Back to Play
        </Link>
      </div>
    </div>
  );
}
