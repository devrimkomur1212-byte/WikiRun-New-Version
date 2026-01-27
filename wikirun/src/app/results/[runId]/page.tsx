import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
  const shareText = `I completed a WikiRun from "${run.start_title}" to "${run.target_title}" in ${formatTime(
    run.active_time_ms
  )} with ${run.clicks_count} clicks! 🏃‍♂️📚`;

  const routeTitles = run.route_titles as string[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Run Complete!</h1>
          <p className="text-muted-foreground">
            {run.mode === "ranked" ? "Ranked Match" : "Training Run"}
          </p>
        </div>

        {/* Route Info */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-center gap-4 text-lg">
            <span className="font-semibold">{run.start_title}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-primary">{run.target_title}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold font-mono">
              {formatTime(run.active_time_ms)}
            </div>
            <div className="text-sm text-muted-foreground">Time</div>
          </div>

          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">{run.clicks_count}</div>
            <div className="text-sm text-muted-foreground">Clicks</div>
          </div>

          <div className="bg-card rounded-lg border p-4 text-center">
            <div
              className={`text-3xl font-bold ${
                run.misses_count > 0 ? "text-destructive" : "text-green-500"
              }`}
            >
              {run.misses_count}
            </div>
            <div className="text-sm text-muted-foreground">Misses</div>
          </div>
        </div>

        {/* Route Taken */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-4">Route Taken</h2>
          <div className="flex flex-wrap items-center gap-2">
            {routeTitles.map((title, index) => (
              <span key={index} className="flex items-center">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    index === 0
                      ? "bg-secondary"
                      : index === routeTitles.length - 1
                      ? "bg-primary/10 text-primary font-medium"
                      : "bg-muted"
                  }`}
                >
                  {title}
                </span>
                {index < routeTitles.length - 1 && (
                  <span className="mx-1 text-muted-foreground">→</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* New Achievements */}
        {newAchievements && newAchievements.length > 0 && (
          <div className="bg-card rounded-lg border p-6 mb-6">
            <h2 className="font-semibold mb-4">🏆 Achievements Unlocked!</h2>
            <div className="space-y-3">
              {newAchievements.map((ua) => {
                const achievement = ua.achievements as unknown as {
                  name: string;
                  description: string;
                };
                return (
                  <div
                    key={ua.achievement_id}
                    className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg"
                  >
                    <span className="text-2xl">🎖️</span>
                    <div>
                      <div className="font-medium">{achievement?.name}</div>
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
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/training"
            className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            Play Again
          </Link>

          <button
            onClick={() => {
              navigator.clipboard.writeText(shareText);
              alert("Copied to clipboard!");
            }}
            className="flex-1 inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-3 text-sm font-semibold shadow-sm hover:bg-accent"
          >
            Share Result
          </button>

          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-3 text-sm font-semibold shadow-sm hover:bg-accent"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
