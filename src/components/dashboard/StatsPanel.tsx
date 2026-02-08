"use client";

import { useState, useMemo } from "react";

interface Match {
  id: string;
  created_at: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  elo_delta_p1: number | null;
  elo_delta_p2: number | null;
}

interface StatsPanelProps {
  matches: Match[];
  userId: string;
  currentElo: number;
  opponentNames: Record<string, string>;
}

type DateRange = "1w" | "1m" | "1y" | "all";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
];

function getMyDelta(match: Match, userId: string): number {
  if (match.player1_id === userId) return match.elo_delta_p1 || 0;
  if (match.player2_id === userId) return match.elo_delta_p2 || 0;
  return 0;
}

function getOpponentId(match: Match, userId: string): string {
  return match.player1_id === userId ? match.player2_id : match.player1_id;
}

function getRangeStart(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  switch (range) {
    case "1w":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "1m":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

// ─── SVG Chart ───────────────────────────────────────────────

function EloChart({ points }: { points: { date: string; elo: number }[] }) {
  if (points.length < 2) {
    return (
      <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
        Not enough data to show chart
      </div>
    );
  }

  const W = 800;
  const H = 200;
  const PAD = { top: 15, right: 20, bottom: 5, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const elos = points.map((p) => p.elo);
  const minElo = Math.min(...elos);
  const maxElo = Math.max(...elos);
  const eloRange = maxElo - minElo || 50;
  const eloMargin = eloRange * 0.15;

  const times = points.map((p) => new Date(p.date).getTime());
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const timeRange = maxTime - minTime || 1;

  const x = (t: number) => PAD.left + ((t - minTime) / timeRange) * plotW;
  const y = (e: number) =>
    PAD.top + plotH - ((e - minElo + eloMargin) / (eloRange + eloMargin * 2)) * plotH;

  // Build smooth line path
  const pts = points.map((p) => ({
    x: x(new Date(p.date).getTime()),
    y: y(p.elo),
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${PAD.top + plotH} L ${pts[0].x},${PAD.top + plotH} Z`;

  // Y-axis labels
  const niceStep = Math.max(25, Math.ceil(eloRange / 4 / 25) * 25);
  const niceMin = Math.floor(minElo / niceStep) * niceStep;
  const niceMax = Math.ceil(maxElo / niceStep) * niceStep;
  const yLabels: number[] = [];
  for (let v = niceMin; v <= niceMax; v += niceStep) {
    yLabels.push(v);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="elo-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {yLabels.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            y1={y(v)}
            x2={W - PAD.right}
            y2={y(v)}
            stroke="hsl(var(--border))"
            strokeOpacity="0.4"
            strokeDasharray="4 4"
          />
          <text
            x={PAD.left - 8}
            y={y(v) + 4}
            textAnchor="end"
            fontSize="11"
            fill="hsl(var(--muted-foreground))"
          >
            {v}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#elo-area-grad)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Current value dot */}
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="4"
        fill="hsl(var(--primary))"
      />
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="8"
        fill="hsl(var(--primary))"
        opacity="0.2"
      />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function StatsPanel({ matches, userId, currentElo, opponentNames }: StatsPanelProps) {
  const [range, setRange] = useState<DateRange>("all");

  // Build full ELO history (chronological)
  const eloHistory = useMemo(() => {
    const sorted = [...matches].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Starting ELO = current - sum of all deltas
    let startElo = currentElo;
    for (const m of sorted) {
      startElo -= getMyDelta(m, userId);
    }

    const history: { date: string; elo: number }[] = [
      { date: sorted[0]?.created_at || new Date().toISOString(), elo: startElo },
    ];

    let running = startElo;
    for (const m of sorted) {
      running += getMyDelta(m, userId);
      history.push({ date: m.created_at, elo: running });
    }

    return history;
  }, [matches, userId, currentElo]);

  // Date range filtering
  const rangeStart = getRangeStart(range);

  const filteredMatches = useMemo(() => {
    if (!rangeStart) return matches;
    return matches.filter((m) => new Date(m.created_at) >= rangeStart);
  }, [matches, rangeStart]);

  // Chart data points for the selected range
  const chartPoints = useMemo(() => {
    if (!rangeStart) return eloHistory;

    // ELO at the start of the range = current - sum of deltas after range start
    let eloAtStart = currentElo;
    for (const m of matches) {
      if (new Date(m.created_at) >= rangeStart) {
        eloAtStart -= getMyDelta(m, userId);
      }
    }

    const points: { date: string; elo: number }[] = [
      { date: rangeStart.toISOString(), elo: eloAtStart },
    ];

    // Add all history points within the range
    for (const h of eloHistory) {
      if (new Date(h.date) >= rangeStart) {
        points.push(h);
      }
    }

    return points;
  }, [eloHistory, matches, rangeStart, currentElo, userId]);

  // Computed stats
  const stats = useMemo(() => {
    const wins = filteredMatches.filter((m) => m.winner_id === userId).length;
    const losses = filteredMatches.length - wins;
    const total = filteredMatches.length;

    const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;
    const lossPct = total > 0 ? 100 - winPct : 0;

    // Rating change in period
    const eloAtStart = chartPoints[0]?.elo || currentElo;
    const ratingChange = currentElo - eloAtStart;

    // Highest rating in period
    const highestRating =
      chartPoints.length > 0 ? Math.max(...chartPoints.map((p) => p.elo)) : currentElo;

    // Best win (biggest ELO gained in a single match when winning)
    let bestWinDelta = 0;
    let bestWinOpponentId: string | null = null;
    for (const m of filteredMatches) {
      if (m.winner_id === userId) {
        const delta = getMyDelta(m, userId);
        if (delta > bestWinDelta) {
          bestWinDelta = delta;
          bestWinOpponentId = getOpponentId(m, userId);
        }
      }
    }

    // Best win streak
    const sorted = [...filteredMatches].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    let currentStreak = 0;
    let bestStreak = 0;
    for (const m of sorted) {
      if (m.winner_id === userId) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      wins,
      losses,
      total,
      winPct,
      lossPct,
      ratingChange,
      highestRating,
      bestWinDelta,
      bestWinOpponentName: bestWinOpponentId
        ? opponentNames[bestWinOpponentId] || "Unknown"
        : null,
      bestStreak,
    };
  }, [filteredMatches, chartPoints, currentElo, userId, opponentNames]);

  if (matches.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up"
      style={{ animationDelay: "175ms" }}
    >
      {/* Header + Date Range Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-h2">Ranked Performance</h2>

        <div className="flex rounded-xl bg-secondary/60 p-1">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                range === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ELO Chart */}
      <div className="mb-6">
        <EloChart points={chartPoints} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Rating + Change */}
        <div className="rounded-xl bg-secondary/40 p-4">
          <div className="text-xs text-muted-foreground mb-1">Rating</div>
          <div className="text-2xl font-bold tracking-tight">{currentElo}</div>
          {stats.ratingChange !== 0 && (
            <div
              className={`text-sm font-semibold mt-0.5 ${
                stats.ratingChange > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {stats.ratingChange > 0 ? "+" : ""}
              {stats.ratingChange}
            </div>
          )}
          {stats.ratingChange === 0 && (
            <div className="text-sm text-muted-foreground mt-0.5">No change</div>
          )}
        </div>

        {/* Highest Rating */}
        <div className="rounded-xl bg-secondary/40 p-4">
          <div className="text-xs text-muted-foreground mb-1">Highest Rating</div>
          <div className="text-2xl font-bold tracking-tight">{stats.highestRating}</div>
        </div>

        {/* Best Win */}
        <div className="rounded-xl bg-secondary/40 p-4">
          <div className="text-xs text-muted-foreground mb-1">Best Win</div>
          {stats.bestWinDelta > 0 ? (
            <>
              <div className="text-2xl font-bold tracking-tight text-green-500">
                +{stats.bestWinDelta}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                vs {stats.bestWinOpponentName}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground mt-2">No wins yet</div>
          )}
        </div>

        {/* Win Streak */}
        <div className="rounded-xl bg-secondary/40 p-4">
          <div className="text-xs text-muted-foreground mb-1">Best Win Streak</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight">{stats.bestStreak}</span>
            {stats.bestStreak >= 3 && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-orange-500"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Games W/D/L Bar */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm font-semibold">Games</span>
          <span className="text-2xl font-bold tracking-tight">{stats.total}</span>
        </div>

        {stats.total > 0 ? (
          <>
            {/* Bar */}
            <div className="flex h-3 rounded-full overflow-hidden mb-3">
              {stats.winPct > 0 && (
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${stats.winPct}%` }}
                />
              )}
              {stats.lossPct > 0 && (
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${stats.lossPct}%` }}
                />
              )}
            </div>

            {/* Labels */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-500 font-semibold">
                {stats.wins} Won ({stats.winPct}%)
              </span>
              <span className="text-red-500 font-semibold">
                {stats.losses} Lost ({stats.lossPct}%)
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No games in this period</p>
        )}
      </div>
    </div>
  );
}
