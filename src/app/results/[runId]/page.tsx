import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ShareButton } from "@/components/results/ShareButton";
import type { Database } from "@/types/database.types";

type RunRow = Database["public"]["Tables"]["runs"]["Row"];

interface Props {
  params: Promise<{
    runId: string;
  }>;
}

export default async function ResultsPage({ params }: Props) {
  const { runId } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the run
  const { data: runData, error } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (error || !runData) {
    notFound();
  }

  const run = runData as RunRow;
  const gaveUp = run.gave_up === true;

  // Fetch newly unlocked achievements (unlocked today)
  const today = new Date().toISOString().split("T")[0];
  const { data: newAchievementsData } = await supabase
    .from("user_achievements")
    .select("achievement_id, achievements(*)")
    .eq("user_id", user.id)
    .gte("unlocked_at", today);

  const newAchievements = newAchievementsData as { achievement_id: string; achievements: { name: string; description: string } }[] | null;

  // Format time
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  // Generate share text
  const shareText = gaveUp
    ? `I forfeited a WikiRun from "${run.start_title}" to "${run.target_title}". Next time! 🏃‍♂️📚`
    : `I completed a WikiRun from "${run.start_title}" to "${run.target_title}" in ${formatTime(
        run.active_time_ms
      )} with ${run.clicks_count} clicks! 🏃‍♂️📚`;

  const routeTitles = (run.route_titles as string[]) || [];

  return (
    <div className="py-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center animate-scale-in">
        <h1 className="text-display-sm mb-2">
          {gaveUp ? "Match Forfeited" : "Run Complete!"}
        </h1>
        <p className="text-muted-foreground">
          {run.mode === "ranked" ? "Ranked Match" : "Training Run"}
        </p>
      </div>

      {/* Forfeit Notice */}
      {gaveUp && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-soft animate-slide-up">
          <div className="text-center">
            <p className="text-destructive font-semibold">You forfeited this match</p>
            <p className="text-sm text-muted-foreground mt-1">
              This counts as a loss and affects your ELO rating
            </p>
          </div>
        </div>
      )}

      {/* Route Info */}
      <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up">
        <div className="flex items-center justify-center gap-4 text-lg">
          <span className="px-3 py-1.5 rounded-lg bg-secondary font-semibold">{run.start_title}</span>
          <span className="text-muted-foreground">→</span>
          <span className="px-3 py-1.5 rounded-lg bg-primary/10 font-semibold text-primary">{run.target_title}</span>
        </div>
      </div>

      {/* Stats Grid - only show if not forfeited */}
      {!gaveUp && (
        <div className="grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
            <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
              {formatTime(run.active_time_ms)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Time</div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">{run.clicks_count}</div>
            <div className="text-sm text-muted-foreground mt-1">Clicks</div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
            <div
              className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                run.misses_count > 0 ? "text-destructive" : "text-green-500"
              }`}
            >
              {run.misses_count}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Misses</div>
          </div>
        </div>
      )}

      {/* Route Taken - only show if there's a route */}
      {routeTitles.length > 0 && (
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up" style={{ animationDelay: '150ms' }}>
          <h2 className="font-semibold mb-4">Route Taken</h2>
          <div className="flex flex-wrap items-center gap-2">
            {routeTitles.map((title, index) => (
              <span key={index} className="flex items-center">
                <span
                  className={`px-2.5 py-1 rounded-lg text-sm ${
                    index === 0
                      ? "bg-secondary font-medium"
                      : index === routeTitles.length - 1
                      ? "bg-primary/10 text-primary font-semibold"
                      : "bg-muted"
                  }`}
                >
                  {title}
                </span>
                {index < routeTitles.length - 1 && (
                  <span className="mx-1.5 text-muted-foreground/50">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* New Achievements */}
      {newAchievements && newAchievements.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-soft animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="font-semibold mb-4 text-primary">Achievements Unlocked!</h2>
          <div className="space-y-3">
            {newAchievements.map((ua) => {
              const achievement = ua.achievements as unknown as {
                name: string;
                description: string;
              };
              return (
                <div
                  key={ua.achievement_id}
                  className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/40"
                >
                  <span className="text-2xl">🎖️</span>
                  <div>
                    <div className="font-semibold">{achievement?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {achievement?.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '250ms' }}>
        <Link
          href="/play"
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
        >
          Play Again
        </Link>

        <ShareButton shareText={shareText} />

        <Link
          href="/dashboard"
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm font-semibold shadow-sm hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
