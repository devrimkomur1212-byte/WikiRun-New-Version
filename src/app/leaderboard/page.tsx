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
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-display-sm mb-4">Leaderboard</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Top 50 players earn the prestigious Elder rank. Climb the ranks by winning
          ranked matches!
        </p>
      </div>

      {/* Table */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card overflow-hidden shadow-soft animate-slide-up">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="px-5 py-4 text-left text-sm font-semibold w-20">Rank</th>
              <th className="px-5 py-4 text-left text-sm font-semibold">Player</th>
              <th className="px-5 py-4 text-right text-sm font-semibold w-24">ELO</th>
              <th className="px-5 py-4 text-right text-sm font-semibold w-24">Games</th>
            </tr>
          </thead>
          <tbody>
            {players?.map((player, index) => {
              const position = index + 1;
              const rankInfo = getRank(player.elo_rating, position);

              return (
                <tr
                  key={player.id}
                  className="border-b border-border/30 last:border-b-0 hover:bg-secondary/30 transition-colors duration-150"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      {position <= 3 ? (
                        <span className="text-2xl">
                          {position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        <span className="font-mono text-muted-foreground">#{position}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{player.username}</span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${rankInfo.bgColor} ${rankInfo.color}`}
                      >
                        {rankInfo.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-lg">
                    {player.elo_rating}
                  </td>
                  <td className="px-5 py-4 text-right text-muted-foreground font-mono">
                    {player.games_played_ranked}
                  </td>
                </tr>
              );
            })}

            {!players?.length && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                  No players yet. Be the first to play ranked!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
