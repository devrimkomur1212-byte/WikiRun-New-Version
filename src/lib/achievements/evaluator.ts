import { createServiceClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database.types";

type RunRow = Database["public"]["Tables"]["runs"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];

export async function evaluateAchievements(userId: string, runId?: string) {
  const supabase = await createServiceClient();

  // Fetch user's current achievements
  const { data: unlockedAchievementsData } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const unlockedAchievements = unlockedAchievementsData as { achievement_id: string }[] | null;
  const unlockedIds = new Set(unlockedAchievements?.map((a) => a.achievement_id) || []);

  // Fetch all achievements
  const { data: allAchievementsData } = await supabase.from("achievements").select("*");
  const allAchievements = allAchievementsData as AchievementRow[] | null;

  if (!allAchievements) return;

  // Fetch user stats
  const { data: userRunsData } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", userId)
    .eq("is_completed", true);

  const { data: userMatchesData } = await supabase
    .from("matches")
    .select("*")
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq("status", "complete");

  const runs = (userRunsData as RunRow[]) || [];
  const matches = (userMatchesData as MatchRow[]) || [];

  // Current run data (if provided)
  let currentRun = null;
  if (runId) {
    currentRun = runs.find((r) => r.id === runId);
  }

  // Calculate stats
  const totalRuns = runs.length;
  const trainingRuns = runs.filter((r) => r.mode === "training").length;
  const rankedWins = matches.filter((m) => m.winner_id === userId).length;

  // Calculate unique articles visited
  const uniqueArticles = new Set<string>();
  runs.forEach((run) => {
    const titles = run.route_titles as string[];
    titles.forEach((title) => uniqueArticles.add(title.toLowerCase()));
  });

  // Calculate win streak
  const userMatchesSorted = matches
    .filter((m) => m.player1_id === userId || m.player2_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  let winStreak = 0;
  for (const match of userMatchesSorted) {
    if (match.winner_id === userId) {
      winStreak++;
    } else {
      break;
    }
  }

  // Evaluate each achievement
  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    const criteria = achievement.criteria as Record<string, unknown>;
    let earned = false;

    switch (criteria.type) {
      case "run_count":
        earned = totalRuns >= (criteria.min as number);
        break;

      case "ranked_wins":
        earned = rankedWins >= (criteria.min as number);
        break;

      case "time":
        if (currentRun) {
          earned = currentRun.active_time_ms <= (criteria.max_ms as number);
        } else {
          earned = runs.some((r) => r.active_time_ms <= (criteria.max_ms as number));
        }
        break;

      case "clicks":
        if (currentRun) {
          earned = currentRun.clicks_count <= (criteria.max as number);
        } else {
          earned = runs.some((r) => r.clicks_count <= (criteria.max as number));
        }
        break;

      case "training_count":
        earned = trainingRuns >= (criteria.min as number);
        break;

      case "misses":
        if (currentRun) {
          earned = currentRun.misses_count <= (criteria.max as number);
        } else {
          earned = runs.some((r) => r.misses_count <= (criteria.max as number));
        }
        break;

      case "win_streak":
        earned = winStreak >= (criteria.min as number);
        break;

      case "unique_articles":
        earned = uniqueArticles.size >= (criteria.min as number);
        break;
    }

    if (earned) {
      await supabase.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
      } as never);
    }
  }
}
