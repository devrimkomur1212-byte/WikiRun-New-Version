import { createClient } from "@/lib/supabase/server";
import { getRank } from "@/lib/elo/ranks";

type PlayerRow = {
  id: string;
  username: string;
  elo_rating: number;
  games_played_ranked: number;
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Fetch top 100 players by ELO
  const { data: playersData, error } = await supabase
    .from("profiles")
    .select("id, username, elo_rating, games_played_ranked")
    .order("elo_rating", { ascending: false })
    .limit(100);

  const players = playersData as PlayerRow[] | null;

  if (error) {
    console.error("Failed to fetch leaderboard:", error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground mb-8">
          Top 50 players earn the prestigious Elder rank. Climb the ranks by winning
          ranked matches!
        </p>

        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Player</th>
                <th className="px-4 py-3 text-right text-sm font-medium">ELO</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Games</th>
              </tr>
            </thead>
            <tbody>
              {players?.map((player, index) => {
                const position = index + 1;
                const rankInfo = getRank(player.elo_rating, position);

                return (
                  <tr
                    key={player.id}
                    className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            position <= 3 ? "text-lg" : "text-sm"
                          }`}
                        >
                          {position <= 3 ? (
                            <span
                              className={
                                position === 1
                                  ? "text-yellow-500"
                                  : position === 2
                                  ? "text-gray-400"
                                  : "text-orange-600"
                              }
                            >
                              {position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            `#${position}`
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.username}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${rankInfo.bgColor} ${rankInfo.color}`}
                        >
                          {rankInfo.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {player.elo_rating}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {player.games_played_ranked}
                    </td>
                  </tr>
                );
              })}

              {!players?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No players yet. Be the first to play ranked!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
