"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
}

interface RunMetadata {
  startTitle: string;
  targetTitle: string;
  difficulty: string;
}

export default function TrainingResultsPage({ params }: Props) {
  const router = useRouter();
  const [results, setResults] = useState<RunResults | null>(null);
  const [metadata, setMetadata] = useState<RunMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [runId, setRunId] = useState<string>("");

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
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    );
  }

  const shareText = `I completed a WikiRun from "${metadata.startTitle}" to "${metadata.targetTitle}" in ${formatTime(
    results.activeTimeMs
  )} with ${results.clicksCount} clicks! 🏃‍♂️📚`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Run Complete!</h1>
          <p className="text-muted-foreground">Training Mode</p>
        </div>

        {/* Route Info */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-center gap-4 text-lg">
            <span className="font-semibold">{metadata.startTitle}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold text-primary">{metadata.targetTitle}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold font-mono">
              {formatTime(results.activeTimeMs)}
            </div>
            <div className="text-sm text-muted-foreground">Time</div>
          </div>

          <div className="bg-card rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">{results.clicksCount}</div>
            <div className="text-sm text-muted-foreground">Clicks</div>
          </div>

          <div className="bg-card rounded-lg border p-4 text-center">
            <div
              className={`text-3xl font-bold ${
                results.missesCount > 0 ? "text-destructive" : "text-green-500"
              }`}
            >
              {results.missesCount}
            </div>
            <div className="text-sm text-muted-foreground">Misses</div>
          </div>
        </div>

        {/* Route Taken */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="font-semibold mb-4">Route Taken</h2>
          <div className="flex flex-wrap items-center gap-2">
            {results.routeTitles.map((title, index) => (
              <span key={index} className="flex items-center">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    index === 0
                      ? "bg-secondary"
                      : index === results.routeTitles.length - 1
                      ? "bg-primary/10 text-primary font-medium"
                      : "bg-muted"
                  }`}
                >
                  {title}
                </span>
                {index < results.routeTitles.length - 1 && (
                  <span className="mx-1 text-muted-foreground">→</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Misses Explanation */}
        {results.missesCount > 0 && (
          <div className="bg-destructive/10 rounded-lg border border-destructive/20 p-6 mb-6">
            <h2 className="font-semibold mb-2 text-destructive">What are misses?</h2>
            <p className="text-sm text-muted-foreground">
              A "miss" is counted when you&apos;re on a page that has a direct link to your
              target article, but you clicked on a different link instead. Lower misses means
              more efficient navigation!
            </p>
          </div>
        )}

        {/* Sign up promotion */}
        <div className="bg-primary/10 rounded-lg border border-primary/20 p-6 mb-6">
          <h2 className="font-semibold mb-2 text-primary">Want to track your progress?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create an account to save your runs, compete in ranked matches, unlock achievements,
            and climb the leaderboard!
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign Up Now
          </Link>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/training"
            className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            Play Again
          </Link>

          <button
            onClick={() => {
              navigator.clipboard.writeText(shareText);
              alert("Copied to clipboard!");
            }}
            className="flex-1 inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-3 text-sm font-semibold shadow-sm hover:bg-accent"
          >
            Share Result
          </button>

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-3 text-sm font-semibold shadow-sm hover:bg-accent"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
