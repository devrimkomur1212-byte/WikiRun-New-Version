"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArticleSearch } from "@/components/training/ArticleSearch";

type Difficulty = "easy" | "medium" | "hard";

interface PersonalRecord {
  timeMs: number;
  clicks: number;
  date: string;
}

type PersonalRecords = Partial<Record<Difficulty, PersonalRecord>>;

async function getRandomArticle(): Promise<string> {
  const params = new URLSearchParams({
    action: "query",
    generator: "random",
    grnnamespace: "0",
    grnlimit: "1",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
  const data = await res.json();
  const pages = data.query?.pages;
  if (!pages) throw new Error("Failed to get random article");
  const page = Object.values(pages)[0] as { title: string };
  return page.title;
}

function formatRecordTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function TrainingPage() {
  const router = useRouter();
  const [generatingRoute, setGeneratingRoute] = useState<Difficulty | null>(null);
  const [records, setRecords] = useState<PersonalRecords>({});

  // Load personal records from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("training-records");
    if (stored) {
      setRecords(JSON.parse(stored));
    }
  }, []);

  // Custom route state
  const [customStart, setCustomStart] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [randomizingStart, setRandomizingStart] = useState(false);
  const [randomizingTarget, setRandomizingTarget] = useState(false);
  const [startingCustom, setStartingCustom] = useState(false);

  const difficultyLabels = {
    easy: {
      label: "Easy",
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      description: "Well-known articles on both ends. Short routes, familiar territory.",
    },
    medium: {
      label: "Medium",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      description: "Both articles are well-known, but from completely different topics. Connect the dots!",
    },
    hard: {
      label: "Hard",
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      description: "Dropped somewhere random. Find your way to a well-known destination.",
    },
  };

  const handleStartRun = async (difficulty: Difficulty) => {
    setGeneratingRoute(difficulty);

    try {
      const response = await fetch(`/api/generate-route?difficulty=${difficulty}`);
      const route = await response.json();

      if (!route.start_title || !route.target_title) {
        throw new Error("Invalid route generated");
      }

      const runId = `training-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      localStorage.setItem(
        `run-${runId}`,
        JSON.stringify({
          runId,
          mode: "training",
          startTitle: route.start_title,
          targetTitle: route.target_title,
          difficulty,
          createdAt: Date.now(),
        })
      );

      router.push(`/run/${runId}/article/${encodeURIComponent(route.start_title)}`);
    } catch (error) {
      console.error("Failed to generate route:", error);
      alert("Failed to generate route. Please try again.");
      setGeneratingRoute(null);
    }
  };

  const handleRandomizeStart = useCallback(async () => {
    setRandomizingStart(true);
    try {
      const title = await getRandomArticle();
      setCustomStart(title);
    } catch {
      // silently fail
    } finally {
      setRandomizingStart(false);
    }
  }, []);

  const handleRandomizeTarget = useCallback(async () => {
    setRandomizingTarget(true);
    try {
      const title = await getRandomArticle();
      setCustomTarget(title);
    } catch {
      // silently fail
    } finally {
      setRandomizingTarget(false);
    }
  }, []);

  const handleStartCustomRun = async () => {
    if (!customStart.trim() || !customTarget.trim()) return;
    if (customStart.trim().toLowerCase() === customTarget.trim().toLowerCase()) return;

    setStartingCustom(true);

    try {
      const runId = `training-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      localStorage.setItem(
        `run-${runId}`,
        JSON.stringify({
          runId,
          mode: "training",
          startTitle: customStart.trim(),
          targetTitle: customTarget.trim(),
          difficulty: "custom",
          createdAt: Date.now(),
        })
      );

      router.push(`/run/${runId}/article/${encodeURIComponent(customStart.trim())}`);
    } catch {
      setStartingCustom(false);
    }
  };

  const canStartCustom =
    customStart.trim() &&
    customTarget.trim() &&
    customStart.trim().toLowerCase() !== customTarget.trim().toLowerCase();

  return (
    <div className="py-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-display-sm mb-4">Training Mode</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Practice navigating Wikipedia with randomly generated routes. No sign-in required!
          Each run generates two random Wikipedia articles - navigate from start to target
          as quickly as possible.
        </p>
      </div>

      {/* Difficulty Cards */}
      <div className="grid gap-5 md:grid-cols-3 max-w-4xl mx-auto">
        {(["easy", "medium", "hard"] as const).map((difficulty, index) => (
          <div
            key={difficulty}
            className={`group p-6 rounded-2xl border-2 ${difficultyLabels[difficulty].bg} ${difficultyLabels[difficulty].border} hover:translate-y-[-2px] transition-all duration-300 animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`w-12 h-12 rounded-xl ${difficultyLabels[difficulty].bg} flex items-center justify-center mb-4`}>
              {difficulty === 'easy' && (
                <svg className={difficultyLabels[difficulty].color} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4" /><path d="m6.8 15-3.5 2" /><path d="m20.7 17-3.5-2" /><path d="M6.8 9 3.3 7" /><path d="m20.7 7-3.5 2" /><circle cx="12" cy="12" r="4" />
                </svg>
              )}
              {difficulty === 'medium' && (
                <svg className={difficultyLabels[difficulty].color} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              )}
              {difficulty === 'hard' && (
                <svg className={difficultyLabels[difficulty].color} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              )}
            </div>

            <h2 className={`text-2xl font-bold mb-2 ${difficultyLabels[difficulty].color}`}>
              {difficultyLabels[difficulty].label}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {difficultyLabels[difficulty].description}
            </p>

            <button
              onClick={() => handleStartRun(difficulty)}
              disabled={generatingRoute !== null}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                generatingRoute === difficulty
                  ? "bg-muted text-muted-foreground cursor-wait"
                  : "bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px]"
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {generatingRoute === difficulty ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  Generating Route...
                </span>
              ) : (
                "Start Run"
              )}
            </button>

            {/* Personal Record */}
            {records[difficulty] && (
              <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Personal Best</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatRecordTime(records[difficulty]!.timeMs)}
                  <span className="text-muted-foreground font-normal ml-1.5">
                    ({records[difficulty]!.clicks} clicks)
                  </span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Route Section */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">Custom Route</h2>
            <p className="text-sm text-muted-foreground">Choose your own start and target articles</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ArticleSearch
            label="Start Article"
            value={customStart}
            onChange={setCustomStart}
            onRandomize={handleRandomizeStart}
            isRandomizing={randomizingStart}
          />
          <ArticleSearch
            label="Target Article"
            value={customTarget}
            onChange={setCustomTarget}
            onRandomize={handleRandomizeTarget}
            isRandomizing={randomizingTarget}
          />
        </div>

        {customStart.trim() && customTarget.trim() && customStart.trim().toLowerCase() === customTarget.trim().toLowerCase() && (
          <p className="text-sm text-destructive mt-3">Start and target articles must be different.</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleStartCustomRun}
            disabled={!canStartCustom || startingCustom}
            className="flex-1 sm:flex-none rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {startingCustom ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Starting...
              </span>
            ) : (
              "Start Run"
            )}
          </button>

          <button
            type="button"
            onClick={async () => {
              setRandomizingStart(true);
              setRandomizingTarget(true);
              try {
                const [start, target] = await Promise.all([
                  getRandomArticle(),
                  getRandomArticle(),
                ]);
                setCustomStart(start);
                setCustomTarget(target);
              } catch {
                // silently fail
              } finally {
                setRandomizingStart(false);
                setRandomizingTarget(false);
              }
            }}
            disabled={randomizingStart || randomizingTarget}
            className="rounded-xl border border-border/60 bg-card px-6 py-3.5 text-sm font-semibold hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200 disabled:opacity-50"
          >
            Randomize Both
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-fade-in" style={{ animationDelay: '400ms' }}>
        <h3 className="text-lg font-semibold mb-4">How it works</h3>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Click &quot;Start Run&quot; on any difficulty to generate a random Wikipedia route
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Navigate from the start article to the target article by clicking links
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Your time and clicks are tracked - try to be fast and efficient!
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            No account required - perfect for trying out the game
          </li>
          <li className="flex items-start gap-2 sm:col-span-2">
            <span className="text-primary mt-0.5">•</span>
            Want to save your runs and compete? Sign up for{" "}
            <a href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              ranked play
            </a>
            !
          </li>
        </ul>
      </div>
    </div>
  );
}
