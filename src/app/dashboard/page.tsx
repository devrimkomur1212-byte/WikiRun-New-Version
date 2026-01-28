import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRank } from "@/lib/elo/ranks";
import type { Database } from "@/types/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type RunRow = Database["public"]["Tables"]["runs"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch global stats for all users
  const { count: totalPlayers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: totalRuns } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("is_completed", true);

  const { count: totalMatches } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("status", "complete");

  // If not logged in, show guest view
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Guest Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-2">Welcome to WikiRun</h1>
            <p className="text-muted-foreground">
              Sign in to track your progress, compete in ranked matches, and unlock achievements!
            </p>
          </div>

          {/* Global Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card rounded-lg border p-6 text-center">
              <div className="text-4xl font-bold mb-2">{totalPlayers || 0}</div>
              <div className="text-muted-foreground">Players</div>
            </div>
            <div className="bg-card rounded-lg border p-6 text-center">
              <div className="text-4xl font-bold mb-2">{totalRuns || 0}</div>
              <div className="text-muted-foreground">Runs Completed</div>
            </div>
            <div className="bg-card rounded-lg border p-6 text-center">
              <div className="text-4xl font-bold mb-2">{totalMatches || 0}</div>
              <div className="text-muted-foreground">Ranked Matches</div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-primary/10 rounded-lg border border-primary/20 p-8 text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Ready to compete?</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Create an account to save your runs, track your ELO rating, unlock achievements,
              and compete against other players in ranked matches!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
              >
                Sign Up Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-6 py-3 text-sm font-semibold shadow-sm hover:bg-accent"
              >
                Log In
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-2">Try Training Mode</h3>
              <p className="text-muted-foreground mb-4">
                Practice navigating Wikipedia with random routes. No account required!
              </p>
              <Link
                href="/training"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Start Training
              </Link>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-2">View Leaderboard</h3>
              <p className="text-muted-foreground mb-4">
                See the top players and their ELO ratings. Can you reach Elder rank?
              </p>
              <Link
                href="/leaderboard"
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch profile for logged-in user
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as ProfileRow | null;

  // Fetch leaderboard position
  const { count: playersAbove } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("elo_rating", profile?.elo_rating || 1000);

  const leaderboardPosition = (playersAbove || 0) + 1;

  // Fetch recent runs
  const { data: recentRunsData } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentRuns = recentRunsData as RunRow[] | null;

  // Fetch achievements
  const { data: achievementsData } = await supabase
    .from("user_achievements")
    .select("*, achievements(*)")
    .eq("user_id", user.id);

  const achievements = achievementsData as { achievement_id: string; achievements: AchievementRow }[] | null;

  const { data: allAchievementsData } = await supabase.from("achievements").select("*");
  const allAchievements = allAchievementsData as AchievementRow[] | null;

  // Fetch match stats
  const { data: matchesData } = await supabase
    .from("matches")
    .select("*")
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .eq("status", "complete");

  const matches = matchesData as MatchRow[] | null;

  const wins = matches?.filter((m) => m.winner_id === user.id).length || 0;
  const losses = (matches?.length || 0) - wins;
  const winRate = matches?.length ? Math.round((wins / matches.length) * 100) : 0;

  const rankInfo = getRank(profile?.elo_rating || 1000, leaderboardPosition);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{profile?.username}</h1>
            <p className="text-muted-foreground">
              Member since {new Date(profile?.created_at || "").toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              href="/play"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
            >
              Play Ranked
            </Link>
            <Link
              href="/training"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-6 py-3 text-sm font-semibold shadow-sm hover:bg-accent"
            >
              Training
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">ELO Rating</div>
            <div className="text-3xl font-bold">{profile?.elo_rating || 1000}</div>
            <div className={`text-sm ${rankInfo.color}`}>
              {rankInfo.name} #{leaderboardPosition}
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
            <div className="text-3xl font-bold">{winRate}%</div>
            <div className="text-sm text-muted-foreground">
              {wins}W - {losses}L
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">Ranked Games</div>
            <div className="text-3xl font-bold">
              {profile?.games_played_ranked || 0}
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-1">Achievements</div>
            <div className="text-3xl font-bold">
              {achievements?.length || 0}/{allAchievements?.length || 10}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Runs */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Runs</h2>

            {recentRuns && recentRuns.length > 0 ? (
              <div className="space-y-3">
                {recentRuns.map((run) => (
                  <Link
                    key={run.id}
                    href={`/results/${run.id}`}
                    className="block p-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {run.start_title} → {run.target_title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          run.mode === "ranked"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {run.mode}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatTime(run.active_time_ms)}</span>
                      <span>{run.clicks_count} clicks</span>
                      <span>{run.misses_count} misses</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No runs yet. Start playing to see your history!
              </p>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Achievements</h2>

            <div className="grid grid-cols-2 gap-3">
              {allAchievements?.map((achievement) => {
                const isUnlocked = achievements?.some(
                  (ua) => ua.achievement_id === achievement.id
                );

                return (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-md border ${
                      isUnlocked
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{isUnlocked ? "🏆" : "🔒"}</span>
                      <span className="font-medium text-sm">{achievement.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
