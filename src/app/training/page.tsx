"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Difficulty = "easy" | "medium" | "hard";

export default function TrainingPage() {
  const router = useRouter();
  const [generatingRoute, setGeneratingRoute] = useState<Difficulty | null>(null);

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
      description: "Popular articles, trickier combinations. Test your knowledge.",
    },
    hard: {
      label: "Hard",
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      description: "Start somewhere familiar. End up… somewhere random.",
    },
  };

  const handleStartRun = async (difficulty: Difficulty) => {
    setGeneratingRoute(difficulty);

    try {
      // Generate a random route
      const response = await fetch(`/api/generate-route?difficulty=${difficulty}`);
      const route = await response.json();

      if (!route.start_title || !route.target_title) {
        throw new Error("Invalid route generated");
      }

      // Create a unique run ID for client-side tracking
      const runId = `training-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Store the run metadata in localStorage for non-authenticated runs
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

      // Navigate to the run page
      router.push(`/run/${runId}/article/${encodeURIComponent(route.start_title)}`);
    } catch (error) {
      console.error("Failed to generate route:", error);
      alert("Failed to generate route. Please try again.");
      setGeneratingRoute(null);
    }
  };

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
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-fade-in" style={{ animationDelay: '400ms' }}>
        <h3 className="text-lg font-semibold mb-4">How it works</h3>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Click "Start Run" on any difficulty to generate a random Wikipedia route
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
