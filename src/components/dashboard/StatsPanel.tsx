"use client";

import { useState, useRef, useCallback, useMemo } from "react";

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

// Cardinal spline — smooth rolling curves like Chess.com
// Low tension (0.2) prevents overshooting while avoiding flat stair-steps
function smoothCurvePath(pts: { x: number; y: number }[], tension = 0.2): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y}`;

  let d = `M ${pts[0].x},${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

// ─── SVG Chart ───────────────────────────────────────────────

function EloChart({ points }: { points: { date: string; elo: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; elo: number; date: string } | null>(
    null
  );

  const W = 800;
  const H = 200;
  const PAD = { top: 15, right: 20, bottom: 5, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const chartData = useMemo(() => {
    if (points.length < 2) return null;

    const elos = points.map((p) => p.elo);
    const minElo = Math.min(...elos);
    const maxElo = Math.max(...elos);
    const eloRange = maxElo - minElo || 50;

    // Wide Y-axis: minimum 300pt visual range for smooth appearance
    const visualRange = Math.max(eloRange * 1.6, 300);
    const center = (minElo + maxElo) / 2;
    const visualMin = center - visualRange / 2;
    const visualMax = center + visualRange / 2;

    const times = points.map((p) => new Date(p.date).getTime());
    const minTime = times[0];
    const maxTime = times[times.length - 1];
    const timeRange = maxTime - minTime || 1;

    const xScale = (t: number) => PAD.left + ((t - minTime) / timeRange) * plotW;
    const yScale = (e: number) =>
      PAD.top + plotH - ((e - visualMin) / (visualMax - visualMin)) * plotH;

    const pts = points.map((p) => ({
      x: xScale(new Date(p.date).getTime()),
      y: yScale(p.elo),
      elo: p.elo,
      date: p.date,
    }));

    const curvePath = smoothCurvePath(pts);
    const areaPath = `${curvePath} L ${pts[pts.length - 1].x},${PAD.top + plotH} L ${pts[0].x},${PAD.top + plotH} Z`;

    // Y-axis labels spanning the full visual range
    const niceStep = Math.max(25, Math.ceil(visualRange / 5 / 25) * 25);
    const niceMin = Math.ceil(visualMin / niceStep) * niceStep;
    const niceMax = Math.floor(visualMax / niceStep) * niceStep;
    const yLabels: number[] = [];
    for (let v = niceMin; v <= niceMax; v += niceStep) {
      yLabels.push(v);
    }

    return { pts, curvePath, areaPath, yLabels, yScale, xScale, minTime, timeRange };
  }, [points, plotW, plotH]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!chartData || !svgRef.current) return;
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;

      // Find closest point
      let closest = chartData.pts[0];
      let closestDist = Infinity;
      for (const pt of chartData.pts) {
        const dist = Math.abs(pt.x - mouseX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = pt;
        }
      }

      setHover({ x: closest.x, y: closest.y, elo: closest.elo, date: closest.date });
    },
    [chartData]
  );

  const handleMouseLeave = useCallback(() => setHover(null), []);

  if (!chartData) {
    return (
      <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
        Not enough data to show chart
      </div>
    );
  }

  const { pts, curvePath, areaPath, yLabels, yScale } = chartData;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto cursor-crosshair"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
            y1={yScale(v)}
            x2={W - PAD.right}
            y2={yScale(v)}
            stroke="hsl(var(--border))"
            strokeOpacity="0.4"
            strokeDasharray="4 4"
          />
          <text
            x={PAD.left - 8}
            y={yScale(v) + 4}
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

      {/* Smooth curve line */}
      <path
        d={curvePath}
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

      {/* Hover elements */}
      {hover && (
        <>
          {/* Vertical line */}
          <line
            x1={hover.x}
            y1={PAD.top}
            x2={hover.x}
            y2={PAD.top + plotH}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {/* Dot */}
          <circle cx={hover.x} cy={hover.y} r="5" fill="hsl(var(--primary))" />
          <circle cx={hover.x} cy={hover.y} r="9" fill="hsl(var(--primary))" opacity="0.2" />

          {/* Tooltip background */}
          <rect
            x={Math.min(hover.x - 45, W - PAD.right - 90)}
            y={Math.max(hover.y - 48, PAD.top)}
            width="90"
            height="36"
            rx="8"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="1"
          />
          {/* Tooltip text - ELO */}
          <text
            x={Math.min(hover.x, W - PAD.right - 45)}
            y={Math.max(hover.y - 30, PAD.top + 18) - 1}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="hsl(var(--foreground))"
          >
            {hover.elo}
          </text>
          {/* Tooltip text - Date */}
          <text
            x={Math.min(hover.x, W - PAD.right - 45)}
            y={Math.max(hover.y - 30, PAD.top + 18) + 13}
            textAnchor="middle"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
          >
            {formatDate(hover.date)}
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function StatsPanel({ matches, userId, currentElo }: StatsPanelProps) {
  const [range, setRange] = useState<DateRange>("all");

  // Build full ELO history aggregated by day (one point per day)
  // Aggregating prevents clustered x-values that cause spline loops
  const eloHistory = useMemo(() => {
    const sorted = [...matches].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Starting ELO = current - sum of all deltas
    let startElo = currentElo;
    for (const m of sorted) {
      startElo -= getMyDelta(m, userId);
    }

    // Walk through matches and group by day
    const dayMap = new Map<string, number>();
    let running = startElo;
    const firstDay = sorted[0]
      ? new Date(sorted[0].created_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    dayMap.set(firstDay, startElo);

    for (const m of sorted) {
      running += getMyDelta(m, userId);
      const day = new Date(m.created_at).toISOString().split("T")[0];
      dayMap.set(day, running);
    }

    const history: { date: string; elo: number }[] = [];
    for (const [day, elo] of dayMap) {
      history.push({ date: day, elo });
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

    const rangeDay = rangeStart.toISOString().split("T")[0];
    const pointsInRange = eloHistory.filter((h) => h.date >= rangeDay);

    if (pointsInRange.length === 0) {
      // Compute ELO at start of range
      let eloAtStart = currentElo;
      for (const m of matches) {
        if (new Date(m.created_at) >= rangeStart) {
          eloAtStart -= getMyDelta(m, userId);
        }
      }
      return [{ date: rangeDay, elo: eloAtStart }];
    }

    return pointsInRange;
  }, [eloHistory, matches, rangeStart, currentElo, userId]);

  // Computed stats
  const stats = useMemo(() => {
    const wins = filteredMatches.filter((m) => m.winner_id === userId).length;
    const losses = filteredMatches.length - wins;
    const total = filteredMatches.length;

    const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;
    const lossPct = total > 0 ? 100 - winPct : 0;

    // Rating change within this time frame only
    let ratingChange = 0;
    for (const m of filteredMatches) {
      ratingChange += getMyDelta(m, userId);
    }

    // Highest rating in period
    const highestRating =
      chartPoints.length > 0 ? Math.max(...chartPoints.map((p) => p.elo)) : currentElo;

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
      bestStreak,
    };
  }, [filteredMatches, chartPoints, currentElo, userId]);

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
      <div className="grid grid-cols-3 gap-3 mb-6">
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

      {/* Games W/L Bar */}
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
