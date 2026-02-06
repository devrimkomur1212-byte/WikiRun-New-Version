"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShareButton } from "@/components/results/ShareButton";

interface Props {
  params: Promise<{
    runId: string;
  }>;
}

interface RunData {
  id: string;
  start_title: string;
  target_title: string;
  active_time_ms: number;
  clicks_count: number;
  misses_count: number;
  route_titles: string[];
  mode: string;
  gave_up: boolean;
  match_id: string | null;
}

interface ShortestPathResult {
  found: boolean;
  path?: string[];
  hops?: number;
  minHops?: string;
}

interface MatchStatus {
  status: string;
  userEloDelta: number | null;
  isWinner: boolean;
  isDraw: boolean;
}

export default function RankedResultsPage({ params }: Props) {
  const router = useRouter();
  const [runId, setRunId] = useState<string>("");
  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shortestPath, setShortestPath] = useState<ShortestPathResult | null>(null);
  const [loadingShortestPath, setLoadingShortestPath] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [matchResolved, setMatchResolved] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setRunId(p.runId));
  }, [params]);

  // Fetch run data
  useEffect(() => {
    if (!runId) return;

    const fetchRun = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: rawRunData, error } = await supabase
        .from("runs")
        .select("*")
        .eq("id", runId)
        .eq("user_id", user.id)
        .single();

      if (error || !rawRunData) {
        router.push("/play");
        return;
      }

      // Type assertion for Supabase data
      const runData = rawRunData as unknown as {
        id: string;
        start_title: string;
        target_title: string;
        active_time_ms: number;
        clicks_count: number;
        misses_count: number;
        route_titles: string[] | null;
        mode: string;
        gave_up: boolean | null;
        match_id: string | null;
      };

      setRun({
        id: runData.id,
        start_title: runData.start_title,
        target_title: runData.target_title,
        active_time_ms: runData.active_time_ms,
        clicks_count: runData.clicks_count,
        misses_count: runData.misses_count,
        route_titles: runData.route_titles || [],
        mode: runData.mode,
        gave_up: runData.gave_up === true,
        match_id: runData.match_id,
      });
      setLoading(false);
    };

    fetchRun();
  }, [runId, router]);

  // Fetch shortest path
  useEffect(() => {
    if (!run) return;

    const fetchShortestPath = async () => {
      setLoadingShortestPath(true);
      try {
        const res = await fetch(
          `/api/shortest-path?start=${encodeURIComponent(run.start_title)}&target=${encodeURIComponent(run.target_title)}`
        );
        const data = await res.json();
        setShortestPath(data as ShortestPathResult);
      } catch {
        setShortestPath({ found: false, minHops: "unknown" });
      } finally {
        setLoadingShortestPath(false);
      }
    };

    fetchShortestPath();
  }, [run]);

  // Poll for match status and ELO delta
  useEffect(() => {
    if (!run?.match_id) return;
    // Keep polling even after resolved to ensure we have latest data

    const pollMatchStatus = async () => {
      try {
        const res = await fetch(`/api/match-status?matchId=${run.match_id}`);
        if (!res.ok) return;

        const data = (await res.json()) as MatchStatus;

        // Only mark as resolved when we have BOTH complete status AND valid ELO data
        // This prevents showing incorrect results before match is fully processed
        if (data.status === "complete" && data.userEloDelta !== null) {
          setMatchStatus(data);
          setMatchResolved(true);
        } else if (data.status === "complete") {
          // Match is complete but ELO not calculated yet - keep polling
          setMatchStatus(data);
        }
      } catch {
        // Ignore polling errors
      }
    };

    // Check immediately
    pollMatchStatus();

    // Poll every 2 seconds (faster) until resolved, then stop
    const interval = setInterval(() => {
      if (!matchResolved) {
        pollMatchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [run?.match_id, matchResolved]);

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

  if (loading || !run) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading results...
        </div>
      </div>
    );
  }

  const gaveUp = run.gave_up;
  const routeTitles = run.route_titles;

  // Generate share text
  const shareText = gaveUp
    ? `I forfeited a WikiRun from "${run.start_title}" to "${run.target_title}". Next time! 🏃‍♂️📚`
    : `I completed a WikiRun from "${run.start_title}" to "${run.target_title}" in ${formatTime(
        run.active_time_ms
      )} with ${run.clicks_count} clicks! 🏃‍♂️📚`;

  return (
    <div className="py-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center animate-scale-in">
        <h1 className={`text-display-sm mb-2 ${gaveUp ? "text-destructive" : ""}`}>
          {gaveUp ? "Match Forfeited" : "Run Complete!"}
        </h1>
        <p className="text-muted-foreground">
          {run.mode === "ranked" ? "Ranked Match" : "Training Run"}
        </p>
      </div>

      {/* ELO Change - shown when match is fully resolved with ELO data */}
      {run.match_id && matchResolved && matchStatus?.userEloDelta !== null && matchStatus?.userEloDelta !== undefined && (
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up text-center">
          <div
            className={`text-4xl font-bold ${
              matchStatus.userEloDelta >= 0 ? "text-green-500" : "text-destructive"
            }`}
          >
            {matchStatus.userEloDelta >= 0 ? "+" : ""}
            {matchStatus.userEloDelta}
          </div>
          <div className="text-sm text-muted-foreground mt-1">ELO</div>
          {matchStatus.isWinner === true && (
            <div className="text-sm text-green-500 mt-2 font-semibold">Victory!</div>
          )}
          {matchStatus.isDraw === true && (
            <div className="text-sm text-muted-foreground mt-2">Draw</div>
          )}
          {matchStatus.isWinner === false && matchStatus.isDraw === false && (
            <div className="text-sm text-destructive mt-2">Defeat</div>
          )}
        </div>
      )}

      {/* Waiting for opponent */}
      {run.match_id && !matchResolved && (
        <div className="rounded-2xl border border-border/40 bg-card p-4 text-center shadow-soft animate-pulse">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Waiting for opponent to finish...
          </div>
        </div>
      )}

      {/* Forfeit Notice */}
      {gaveUp && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-soft animate-slide-up">
          <div className="text-center">
            <p className="text-destructive font-semibold">You forfeited this match</p>
            <p className="text-sm text-muted-foreground mt-1">
              This counts as a loss and affects your ELO rating
            </p>
          </div>
        </div>
      )}

      {/* Route Info */}
      <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up">
        <div className="flex items-center justify-center gap-4 text-lg">
          <span className="px-3 py-1.5 rounded-lg bg-secondary font-semibold">{run.start_title}</span>
          <span className="text-muted-foreground">→</span>
          <span className="px-3 py-1.5 rounded-lg bg-primary/10 font-semibold text-primary">{run.target_title}</span>
        </div>
      </div>

      {/* Stats Grid - always show (not just when not forfeited) */}
      <div className="grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
          <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
            {formatTime(run.active_time_ms)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Time</div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight">{run.clicks_count}</div>
          <div className="text-sm text-muted-foreground mt-1">Clicks</div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
          <div
            className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              run.misses_count > 0 ? "text-destructive" : "text-green-500"
            }`}
          >
            {run.misses_count}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Misses</div>
        </div>
      </div>

      {/* Optimal Path */}
      <div
        className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up"
        style={{ animationDelay: "125ms" }}
      >
        <h2 className="font-semibold mb-3">{gaveUp ? "Shortest Path" : "Optimal Path"}</h2>
        {loadingShortestPath ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Computing optimal path…
          </div>
        ) : shortestPath ? (
          shortestPath.found && shortestPath.path ? (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {gaveUp ? (
                  <>Could have been done in </>
                ) : run.clicks_count === shortestPath.hops ? (
                  <>Perfect! You matched the optimal </>
                ) : (
                  <>Optimal route was </>
                )}
                <span className="font-bold text-foreground">
                  {shortestPath.hops} click{shortestPath.hops !== 1 ? "s" : ""}
                </span>
                {!gaveUp && run.clicks_count > (shortestPath.hops || 0) && (
                  <span className="text-muted-foreground">
                    {" "}
                    (you used {run.clicks_count - (shortestPath.hops || 0)} extra)
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {shortestPath.path.map((title, index) => (
                  <span key={index} className="flex items-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-sm ${
                        index === 0
                          ? "bg-secondary font-medium"
                          : index === shortestPath.path!.length - 1
                          ? "bg-primary/10 text-primary font-semibold"
                          : "bg-muted"
                      }`}
                    >
                      {title}
                    </span>
                    {index < shortestPath.path!.length - 1 && (
                      <span className="mx-1.5 text-muted-foreground/50">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              At least{" "}
              <span className="font-bold text-foreground">{shortestPath.minHops} clicks</span> —
              exact path couldn&apos;t be determined.
            </p>
          )
        ) : null}
      </div>

      {/* Route Taken */}
      {routeTitles.length > 0 && (
        <div
          className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up"
          style={{ animationDelay: "150ms" }}
        >
          <h2 className="font-semibold mb-4">Route Taken</h2>
          <div className="flex flex-wrap items-center gap-2">
            {routeTitles.map((title, index) => (
              <span key={index} className="flex items-center">
                <span
                  className={`px-2.5 py-1 rounded-lg text-sm ${
                    index === 0
                      ? "bg-secondary font-medium"
                      : index === routeTitles.length - 1
                      ? "bg-primary/10 text-primary font-semibold"
                      : "bg-muted"
                  }`}
                >
                  {title}
                </span>
                {index < routeTitles.length - 1 && (
                  <span className="mx-1.5 text-muted-foreground/50">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Misses Explanation */}
      {run.misses_count > 0 && (
        <div
          className="rounded-2xl bg-destructive/10 border border-destructive/20 p-6 shadow-soft animate-slide-up"
          style={{ animationDelay: "175ms" }}
        >
          <h2 className="font-semibold mb-2 text-destructive">What are misses?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A &quot;miss&quot; is counted when you&apos;re on a page that has a direct link to your
            target article, but you clicked on a different link instead. Lower misses means more
            efficient navigation!
          </p>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex flex-col sm:flex-row gap-3 animate-slide-up"
        style={{ animationDelay: "200ms" }}
      >
        <Link
          href="/play"
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
        >
          Play Again
        </Link>

        <ShareButton shareText={shareText} />

        <Link
          href="/dashboard"
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm font-semibold shadow-sm hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
