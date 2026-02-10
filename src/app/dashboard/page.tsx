import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRank } from "@/lib/elo/ranks";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { ChangeUsername } from "@/components/dashboard/ChangeUsername";
import { createPageMetadata } from "@/lib/seo/metadata";
import type { Database } from "@/types/database.types";

export const metadata = createPageMetadata(
  "Dashboard",
  "View your WikiRun stats, recent runs, achievements, and ELO rating. Track your progress and compete on the leaderboard.",
  "/dashboard"
);

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
      <div className="py-8 space-y-10">
        {/* Guest Header */}
        <div className="text-center animate-fade-in">
          <h1 className="text-display-sm mb-4">Welcome to WikiRun</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sign in to track your progress, compete in ranked matches, and unlock achievements!
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { value: totalPlayers || 0, label: 'Players' },
            { value: totalRuns || 0, label: 'Runs Completed' },
            { value: totalMatches || 0, label: 'Ranked Matches' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/40 bg-card p-6 text-center shadow-soft animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl font-bold tracking-tight mb-2">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-10 text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-h1 mb-4">Ready to compete?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            Create an account to save your runs, track your ELO rating, unlock achievements,
            and compete against other players in ranked matches!
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_16px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_20px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
            >
              Sign Up Free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-8 py-3.5 text-sm font-semibold shadow-sm hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200"
            >
              Log In
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-soft hover:shadow-soft-lg hover:translate-y-[-2px] transition-all duration-300 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-lg font-semibold mb-2">Try Training Mode</h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Practice navigating Wikipedia with random routes. No account required!
            </p>
            <Link
              href="/training"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.5)] transition-all duration-200"
            >
              Start Training
            </Link>
          </div>
          <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-soft hover:shadow-soft-lg hover:translate-y-[-2px] transition-all duration-300 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h3 className="text-lg font-semibold mb-2">View Leaderboard</h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              See the top players and their ELO ratings. Can you reach Wizard rank?
            </p>
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-secondary transition-all duration-200"
            >
              View Leaderboard
            </Link>
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

  // Fetch opponent usernames for StatsPanel
  const opponentIds = new Set<string>();
  matches?.forEach((m) => {
    const oppId = m.player1_id === user.id ? m.player2_id : m.player1_id;
    opponentIds.add(oppId);
  });

  const opponentNames: Record<string, string> = {};
  if (opponentIds.size > 0) {
    const { data: oppProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", Array.from(opponentIds));

    (oppProfiles as { id: string; username: string }[] | null)?.forEach((p) => {
      opponentNames[p.id] = p.username;
    });
  }

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
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <ChangeUsername currentUsername={profile?.username || "Player"} />
          <p className="text-muted-foreground">
            Member since {new Date(profile?.created_at || "").toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/play"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
          >
            Play Ranked
          </Link>
          <Link
            href="/training"
            className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-6 py-3 text-sm font-semibold shadow-sm hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200"
          >
            Training
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-soft animate-slide-up">
          <div className="text-sm text-muted-foreground mb-2">ELO Rating</div>
          <div className="text-4xl font-bold tracking-tight">{profile?.elo_rating || 1000}</div>
          <div className={`text-sm font-medium mt-1 ${rankInfo.color}`}>
            {rankInfo.name} #{leaderboardPosition}
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-soft animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
          <div className="text-4xl font-bold tracking-tight">{winRate}%</div>
          <div className="text-sm text-muted-foreground mt-1">
            {wins}W - {losses}L
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-soft animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="text-sm text-muted-foreground mb-2">Ranked Games</div>
          <div className="text-4xl font-bold tracking-tight">
            {profile?.games_played_ranked || 0}
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-soft animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="text-sm text-muted-foreground mb-2">Achievements</div>
          <div className="text-4xl font-bold tracking-tight">
            {achievements?.length || 0}<span className="text-muted-foreground text-xl">/{allAchievements?.length || 10}</span>
          </div>
        </div>
      </div>

      {/* Ranked Performance Stats */}
      <StatsPanel
        matches={(matches || []).map((m) => ({
          id: m.id,
          created_at: m.created_at,
          player1_id: m.player1_id,
          player2_id: m.player2_id,
          winner_id: m.winner_id,
          elo_delta_p1: m.elo_delta_p1,
          elo_delta_p2: m.elo_delta_p2,
        }))}
        userId={user.id}
        currentElo={profile?.elo_rating || 1000}
        opponentNames={opponentNames}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Runs */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-h2 mb-5">Recent Runs</h2>

          {recentRuns && recentRuns.length > 0 ? (
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/results/${run.id}`}
                  className="block p-3 rounded-xl hover:bg-secondary/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm truncate mr-3">
                      {run.start_title} → {run.target_title}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                        run.mode === "ranked"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {run.mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                    <span>{formatTime(run.active_time_ms)}</span>
                    <span>{run.clicks_count} clicks</span>
                    <span>{run.misses_count} misses</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">
              No runs yet. Start playing to see your history!
            </p>
          )}
        </div>

        {/* Achievements */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up" style={{ animationDelay: '250ms' }}>
          <h2 className="text-h2 mb-5">Achievements</h2>

          <div className="grid grid-cols-2 gap-3">
            {allAchievements?.map((achievement) => {
              const isUnlocked = achievements?.some(
                (ua) => ua.achievement_id === achievement.id
              );

              return (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isUnlocked
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "bg-muted/20 border-border/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{isUnlocked ? "🏆" : "🔒"}</span>
                    <span className="font-semibold text-sm">{achievement.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {achievement.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
