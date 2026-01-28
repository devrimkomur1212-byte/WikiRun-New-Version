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
      description: "Random Wikipedia articles - perfect for beginners",
    },
    medium: {
      label: "Medium",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      description: "Random Wikipedia articles - moderate challenge",
    },
    hard: {
      label: "Hard",
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      description: "Random Wikipedia articles - for experienced navigators",
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Training Mode</h1>
        <p className="text-muted-foreground mb-8">
          Practice navigating Wikipedia with randomly generated routes. No sign-in required!
          Each run generates two random Wikipedia articles - navigate from start to target
          as quickly as possible.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {(["easy", "medium", "hard"] as const).map((difficulty) => (
            <div
              key={difficulty}
              className={`p-6 rounded-lg border-2 ${difficultyLabels[difficulty].bg} ${difficultyLabels[difficulty].border}`}
            >
              <h2 className={`text-2xl font-semibold mb-2 ${difficultyLabels[difficulty].color}`}>
                {difficultyLabels[difficulty].label}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {difficultyLabels[difficulty].description}
              </p>

              <button
                onClick={() => handleStartRun(difficulty)}
                disabled={generatingRoute !== null}
                className={`w-full rounded-md px-4 py-3 text-sm font-medium shadow-sm transition-all ${
                  generatingRoute === difficulty
                    ? "bg-muted text-muted-foreground cursor-wait"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {generatingRoute === difficulty ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚡</span>
                    Generating Route...
                  </span>
                ) : (
                  "Start Run"
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">How it works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Click "Start Run" on any difficulty to generate a random Wikipedia route</li>
            <li>• Navigate from the start article to the target article by clicking links</li>
            <li>• Your time and clicks are tracked - try to be fast and efficient!</li>
            <li>• No account required - perfect for trying out the game</li>
            <li>
              • Want to save your runs and compete? Sign up for{" "}
              <a href="/signup" className="text-primary hover:underline">
                ranked play
              </a>
              !
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
