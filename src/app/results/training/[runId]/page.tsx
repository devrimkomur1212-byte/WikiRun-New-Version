"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Props {
  params: Promise<{
    runId: string;
  }>;
}

interface RunResults {
  runId: string;
  activeTimeMs: number;
  clicksCount: number;
  missesCount: number;
  routeTitles: string[];
  completedAt: number;
  gaveUp?: boolean;
}

interface ShortestPathResult {
  found: boolean;
  path?: string[];
  hops?: number;
  minHops?: string;
}

interface RunMetadata {
  startTitle: string;
  targetTitle: string;
  difficulty: string;
}

interface PersonalRecord {
  timeMs: number;
  clicks: number;
  date: string;
}

type PersonalRecords = Partial<Record<string, PersonalRecord>>;

export default function TrainingResultsPage({ params }: Props) {
  const router = useRouter();
  const [results, setResults] = useState<RunResults | null>(null);
  const [metadata, setMetadata] = useState<RunMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [runId, setRunId] = useState<string>("");
  const [shortestPath, setShortestPath] = useState<ShortestPathResult | null>(null);
  const [loadingShortestPath, setLoadingShortestPath] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Check auth status
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  useEffect(() => {
    // Unwrap params Promise
    params.then((p) => {
      setRunId(p.runId);
    });
  }, [params]);

  useEffect(() => {
    if (!runId) return;

    // Load results from localStorage
    const resultsString = localStorage.getItem(`run-results-${runId}`);
    const metadataString = localStorage.getItem(`run-${runId}`);

    if (!resultsString || !metadataString) {
      router.push("/training");
      return;
    }

    try {
      const resultsData = JSON.parse(resultsString) as RunResults;
      const metadataData = JSON.parse(metadataString) as RunMetadata;

      setResults(resultsData);
      setMetadata(metadataData);
    } catch (error) {
      console.error("Failed to load results:", error);
      router.push("/training");
    } finally {
      setLoading(false);
    }
  }, [runId, router]);

  // Check and save personal record
  useEffect(() => {
    if (!results || !metadata) return;
    if (results.gaveUp) return;
    const diff = metadata.difficulty;
    if (diff !== "easy" && diff !== "medium" && diff !== "hard") return;

    const stored = localStorage.getItem("training-records");
    const records: PersonalRecords = stored ? JSON.parse(stored) : {};
    const current = records[diff];

    if (!current || results.activeTimeMs < current.timeMs) {
      records[diff] = {
        timeMs: results.activeTimeMs,
        clicks: results.clicksCount,
        date: new Date().toISOString(),
      };
      localStorage.setItem("training-records", JSON.stringify(records));
      setIsNewRecord(true);
    }
  }, [results, metadata]);

  // Fetch shortest path for all runs (not just give-up)
  useEffect(() => {
    if (!results || !metadata) return;

    const fetchShortestPath = async () => {
      setLoadingShortestPath(true);
      try {
        const res = await fetch(
          `/api/shortest-path?start=${encodeURIComponent(metadata.startTitle)}&target=${encodeURIComponent(metadata.targetTitle)}`
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
  }, [results, metadata]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  if (loading || !results || !metadata) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading results...
        </div>
      </div>
    );
  }

  const shareText = `I completed a WikiRun from "${metadata.startTitle}" to "${metadata.targetTitle}" in ${formatTime(
    results.activeTimeMs
  )} with ${results.clicksCount} clicks! 🏃‍♂️📚`;

  return (
    <div className="py-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center animate-scale-in">
        <h1 className={`text-display-sm mb-2 ${results.gaveUp ? "text-destructive" : ""}`}>
          {results.gaveUp ? "Gave Up" : "Run Complete!"}
        </h1>
        <p className="text-muted-foreground">Training Mode</p>
      </div>

      {/* Personal Record Banner */}
      {isNewRecord && (
        <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-5 text-center shadow-soft animate-scale-in">
          <div className="text-3xl mb-1">🏅</div>
          <h2 className="text-lg font-bold text-yellow-500">New Personal Record!</h2>
          <p className="text-sm text-muted-foreground">
            Best time on {metadata.difficulty} difficulty
          </p>
        </div>
      )}

      {/* Route Info */}
      <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up">
        <div className="flex items-center justify-center gap-4 text-lg">
          <span className="px-3 py-1.5 rounded-lg bg-secondary font-semibold">{metadata.startTitle}</span>
          <span className="text-muted-foreground">→</span>
          <span className="px-3 py-1.5 rounded-lg bg-primary/10 font-semibold text-primary">{metadata.targetTitle}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
          <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
            {formatTime(results.activeTimeMs)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Time</div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
          <div className="text-3xl sm:text-4xl font-bold tracking-tight">{results.clicksCount}</div>
          <div className="text-sm text-muted-foreground mt-1">Clicks</div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-5 text-center shadow-soft">
          <div
            className={`text-3xl sm:text-4xl font-bold tracking-tight ${
              results.missesCount > 0 ? "text-destructive" : "text-green-500"
            }`}
          >
            {results.missesCount}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Misses</div>
        </div>
      </div>

      {/* Shortest Path */}
      <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up" style={{ animationDelay: '125ms' }}>
        <h2 className="font-semibold mb-3">
          {results.gaveUp ? "Shortest Path" : "Optimal Path"}
        </h2>
        {loadingShortestPath ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Computing optimal path…
          </div>
        ) : shortestPath ? (
          shortestPath.found && shortestPath.path ? (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {results.gaveUp ? (
                  <>Could have been done in{" "}</>
                ) : results.clicksCount === shortestPath.hops ? (
                  <>Perfect! You matched the optimal{" "}</>
                ) : (
                  <>Optimal route was{" "}</>
                )}
                <span className="font-bold text-foreground">
                  {shortestPath.hops} click{shortestPath.hops !== 1 ? "s" : ""}
                </span>
                {!results.gaveUp && results.clicksCount > (shortestPath.hops || 0) && (
                  <span className="text-muted-foreground">
                    {" "}(you used {results.clicksCount - (shortestPath.hops || 0)} extra)
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
              At least <span className="font-bold text-foreground">{shortestPath.minHops} clicks</span> — exact path couldn&apos;t be determined.
            </p>
          )
        ) : null}
      </div>

      {/* Route Taken */}
      <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up" style={{ animationDelay: '150ms' }}>
        <h2 className="font-semibold mb-4">Route Taken</h2>
        <div className="flex flex-wrap items-center gap-2">
          {results.routeTitles.map((title, index) => (
            <span key={index} className="flex items-center">
              <span
                className={`px-2.5 py-1 rounded-lg text-sm ${
                  index === 0
                    ? "bg-secondary font-medium"
                    : index === results.routeTitles.length - 1
                    ? "bg-primary/10 text-primary font-semibold"
                    : "bg-muted"
                }`}
              >
                {title}
              </span>
              {index < results.routeTitles.length - 1 && (
                <span className="mx-1.5 text-muted-foreground/50">→</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Misses Explanation */}
      {results.missesCount > 0 && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-6 shadow-soft animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="font-semibold mb-2 text-destructive">What are misses?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A "miss" is counted when you&apos;re on a page that has a direct link to your
            target article, but you clicked on a different link instead. Lower misses means
            more efficient navigation!
          </p>
        </div>
      )}

      {/* Sign up promotion - only show if not logged in */}
      {!isLoggedIn && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6 shadow-soft animate-slide-up" style={{ animationDelay: '250ms' }}>
          <h2 className="font-semibold mb-2 text-primary">Want to track your progress?</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Create an account to save your runs, compete in ranked matches, unlock achievements,
            and climb the leaderboard!
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
          >
            Sign Up Now
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <Link
          href="/training"
          className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
        >
          Play Again
        </Link>

        {!results.gaveUp && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareText);
              alert("Copied to clipboard!");
            }}
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm font-semibold shadow-sm hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200"
          >
            Share Result
          </button>
        )}

        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm font-semibold shadow-sm hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
