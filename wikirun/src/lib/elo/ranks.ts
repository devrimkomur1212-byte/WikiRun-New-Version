export type Rank =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Emerald"
  | "Elder";

export interface RankInfo {
  name: Rank;
  color: string;
  bgColor: string;
  minElo: number;
}

export const RANK_THRESHOLDS: RankInfo[] = [
  { name: "Elder", color: "text-purple-500", bgColor: "bg-purple-500/10", minElo: 0 }, // Special - top 50
  { name: "Emerald", color: "text-emerald-500", bgColor: "bg-emerald-500/10", minElo: 1500 },
  { name: "Diamond", color: "text-cyan-400", bgColor: "bg-cyan-400/10", minElo: 1350 },
  { name: "Platinum", color: "text-slate-300", bgColor: "bg-slate-300/10", minElo: 1200 },
  { name: "Gold", color: "text-yellow-500", bgColor: "bg-yellow-500/10", minElo: 1050 },
  { name: "Silver", color: "text-gray-400", bgColor: "bg-gray-400/10", minElo: 900 },
  { name: "Bronze", color: "text-orange-600", bgColor: "bg-orange-600/10", minElo: 0 },
];

// Ranks in display order (Bronze to Emerald) - excludes Elder which is special
export const RANKS: RankInfo[] = [
  { name: "Bronze", color: "text-orange-600", bgColor: "bg-orange-600/10", minElo: 0 },
  { name: "Silver", color: "text-gray-400", bgColor: "bg-gray-400/10", minElo: 900 },
  { name: "Gold", color: "text-yellow-500", bgColor: "bg-yellow-500/10", minElo: 1050 },
  { name: "Platinum", color: "text-slate-300", bgColor: "bg-slate-300/10", minElo: 1200 },
  { name: "Diamond", color: "text-cyan-400", bgColor: "bg-cyan-400/10", minElo: 1350 },
  { name: "Emerald", color: "text-emerald-500", bgColor: "bg-emerald-500/10", minElo: 1500 },
];

/**
 * Get rank based on ELO and leaderboard position
 * Elder rank is reserved for top 50 players regardless of ELO
 */
export function getRank(elo: number, leaderboardPosition?: number): RankInfo {
  // Elder = top 50
  if (leaderboardPosition !== undefined && leaderboardPosition <= 50) {
    return RANK_THRESHOLDS[0]; // Elder
  }

  // Find rank by ELO
  if (elo >= 1500) return RANK_THRESHOLDS[1]; // Emerald
  if (elo >= 1350) return RANK_THRESHOLDS[2]; // Diamond
  if (elo >= 1200) return RANK_THRESHOLDS[3]; // Platinum
  if (elo >= 1050) return RANK_THRESHOLDS[4]; // Gold
  if (elo >= 900) return RANK_THRESHOLDS[5]; // Silver
  return RANK_THRESHOLDS[6]; // Bronze
}

/**
 * Get rank name as string
 */
export function getRankName(elo: number, leaderboardPosition?: number): Rank {
  return getRank(elo, leaderboardPosition).name;
}

/**
 * Calculate ELO change for a match
 */
export function calculateEloChange(
  rating1: number,
  rating2: number,
  score: number, // 1 for win, 0 for loss, 0.5 for draw
  k: number = 32
): { delta1: number; delta2: number } {
  const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  const delta1 = Math.round(k * (score - expected1));
  const delta2 = -delta1;
  return { delta1, delta2 };
}
