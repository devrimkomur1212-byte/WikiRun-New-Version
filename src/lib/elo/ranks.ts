export type Rank =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Emerald"
  | "Wizard";

export interface RankInfo {
  name: Rank;
  color: string;
  bgColor: string;
  minElo: number;
  maxElo?: number;
}

export const RANK_THRESHOLDS: RankInfo[] = [
  { name: "Wizard",   color: "text-[#A855F7]",   bgColor: "bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-violet-500/20", minElo: 2000 },
  { name: "Emerald",  color: "text-emerald-500", bgColor: "bg-emerald-500/10",            minElo: 1700, maxElo: 2000 },
  { name: "Diamond",  color: "text-[#7DD3FC]",   bgColor: "bg-[rgba(125,211,252,0.1)]",   minElo: 1400, maxElo: 1700 },
  { name: "Platinum", color: "text-[#D4D4D8]",   bgColor: "bg-[rgba(212,212,216,0.1)]",   minElo: 1100, maxElo: 1400 },
  { name: "Gold",     color: "text-[#FFD700]",   bgColor: "bg-[rgba(255,215,0,0.1)]",     minElo: 800,  maxElo: 1100 },
  { name: "Silver",   color: "text-[#C0C0C0]",   bgColor: "bg-[rgba(192,192,192,0.1)]",   minElo: 500,  maxElo: 800  },
  { name: "Bronze",   color: "text-[#CD7F32]",   bgColor: "bg-[rgba(205,127,50,0.1)]",    minElo: 0,    maxElo: 500  },
];

// Ranks in display order (Bronze to Wizard)
export const RANKS: RankInfo[] = [
  { name: "Bronze",   color: "text-[#CD7F32]",   bgColor: "bg-[rgba(205,127,50,0.1)]",    minElo: 0,    maxElo: 500  },
  { name: "Silver",   color: "text-[#C0C0C0]",   bgColor: "bg-[rgba(192,192,192,0.1)]",   minElo: 500,  maxElo: 800  },
  { name: "Gold",     color: "text-[#FFD700]",   bgColor: "bg-[rgba(255,215,0,0.1)]",     minElo: 800,  maxElo: 1100 },
  { name: "Platinum", color: "text-[#D4D4D8]",   bgColor: "bg-[rgba(212,212,216,0.1)]",   minElo: 1100, maxElo: 1400 },
  { name: "Diamond",  color: "text-[#7DD3FC]",   bgColor: "bg-[rgba(125,211,252,0.1)]",   minElo: 1400, maxElo: 1700 },
  { name: "Emerald",  color: "text-emerald-500", bgColor: "bg-emerald-500/10",            minElo: 1700, maxElo: 2000 },
  { name: "Wizard",   color: "text-[#A855F7]",   bgColor: "bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-violet-500/20", minElo: 2000 },
];

/**
 * Get rank based on ELO
 * Wizard rank is for 2000+ ELO
 */
export function getRank(elo: number, _leaderboardPosition?: number): RankInfo {
  // Find rank by ELO
  if (elo >= 2000) return RANK_THRESHOLDS[0]; // Wizard
  if (elo >= 1700) return RANK_THRESHOLDS[1]; // Emerald
  if (elo >= 1400) return RANK_THRESHOLDS[2]; // Diamond
  if (elo >= 1100) return RANK_THRESHOLDS[3]; // Platinum
  if (elo >= 800)  return RANK_THRESHOLDS[4]; // Gold
  if (elo >= 500)  return RANK_THRESHOLDS[5]; // Silver
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
