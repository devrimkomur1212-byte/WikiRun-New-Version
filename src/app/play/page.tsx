"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { RANKS } from "@/lib/elo/ranks";
import { startRankedRun } from "@/app/actions/startRankedRun";
import type { Tables } from "@/types/database.types";

type Profile = Tables<"profiles">;

export default function PlayPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topPlayers, setTopPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [generatedRoute, setGeneratedRoute] = useState<{
    startTitle: string;
    targetTitle: string;
    difficulty: string;
  } | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Check if user is logged in
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);

      // Fetch user profile if logged in
      if (authUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setProfile(profileData as Profile | null);
      }

      // Fetch top players for leaderboard preview
      const { data: topPlayersData } = await supabase
        .from("profiles")
        .select("*")
        .order("elo_rating", { ascending: false })
        .limit(5);

      setTopPlayers((topPlayersData as Profile[]) || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  const handlePlayClick = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    setStarting(true);

    try {
      // Generate random route
      const response = await fetch("/api/random-route");
      if (!response.ok) {
        throw new Error("Failed to generate route");
      }

      const route = await response.json();
      setGeneratedRoute(route);

      // Create a run in the database using server action
      const result = await startRankedRun(route.startTitle, route.targetTitle);

      // Navigate to the game
      router.push(
        `/run/${result.runId}/article/${encodeURIComponent(result.startTitle)}`
      );
    } catch (error) {
      console.error("Failed to start game:", error);
      setStarting(false);
    }
  };

  const difficultyColors = {
    easy: "text-green-500",
    medium: "text-yellow-500",
    hard: "text-red-500",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Ranked Play</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Navigate from a random start article to a random target article.
            Complete your run as fast as possible and climb the ELO leaderboard!
          </p>
        </div>

        {/* User Stats Card (if logged in) */}
        {user && profile && (
          <div className="bg-card rounded-lg border p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{profile.username}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-2xl font-bold">{profile.elo_rating}</span>
                  <span className="text-sm text-muted-foreground">ELO</span>
                  <span className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {profile.games_played_ranked} games
                  </span>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="text-sm text-primary hover:underline"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Main Play Button */}
        <div className="bg-card rounded-lg border p-8 mb-8 text-center">
          {generatedRoute && starting ? (
            <div className="space-y-4">
              <div className="text-lg text-muted-foreground">Starting game...</div>
              <div className="flex items-center justify-center gap-4 text-xl">
                <span className="font-semibold">{generatedRoute.startTitle}</span>
                <span className="text-muted-foreground">to</span>
                <span className="font-semibold text-primary">{generatedRoute.targetTitle}</span>
              </div>
              <div className={`text-sm ${difficultyColors[generatedRoute.difficulty as keyof typeof difficultyColors]}`}>
                {generatedRoute.difficulty.charAt(0).toUpperCase() + generatedRoute.difficulty.slice(1)} Route
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-4">Ready to Play?</h2>
              <p className="text-muted-foreground mb-6">
                Click play to get a random Wikipedia route and start your run!
              </p>
              <button
                onClick={handlePlayClick}
                disabled={starting}
                className="px-8 py-4 text-xl font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {starting ? "Generating Route..." : "Play Now"}
              </button>
            </>
          )}
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card rounded-lg border p-6">
            <div className="text-3xl mb-3">1</div>
            <h3 className="font-semibold mb-2">Get Random Route</h3>
            <p className="text-sm text-muted-foreground">
              Press play to receive a randomly generated start and target article. Each game is unique!
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-3xl mb-3">2</div>
            <h3 className="font-semibold mb-2">Navigate Wikipedia</h3>
            <p className="text-sm text-muted-foreground">
              Click only on links within articles to navigate from start to target as fast as possible.
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-3xl mb-3">3</div>
            <h3 className="font-semibold mb-2">Climb Leaderboard</h3>
            <p className="text-sm text-muted-foreground">
              Your time affects your ELO rating. Compete for a spot in the top 50 Elder ranks!
            </p>
          </div>
        </div>

        {/* Auth Prompt Modal */}
        {showAuthPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border p-6 max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-2">Sign in to Play</h2>
              <p className="text-muted-foreground mb-6">
                Create an account to play ranked matches, track your ELO rating, and climb the leaderboard!
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href={`/signup?redirect=/play`}
                  className="w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Sign Up
                </Link>
                <Link
                  href={`/login?redirect=/play`}
                  className="w-full rounded-md border border-input bg-background px-4 py-2 text-center text-sm font-medium hover:bg-accent"
                >
                  Log In
                </Link>
                <button
                  onClick={() => setShowAuthPrompt(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Info */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6">About Ranked Mode</h2>
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <p className="text-muted-foreground">
                In Ranked mode, you&apos;ll receive randomly generated Wikipedia routes.
                The routes are pulled from obscure topics across various categories including
                medieval history, extinct animals, minerals, islands, and more.
              </p>
              <p className="text-muted-foreground">
                Your goal is to navigate from the start article to the target article by
                clicking only on Wikipedia links within articles. No searching, no back button -
                just pure navigation skill and Wikipedia knowledge!
              </p>
              <p className="text-muted-foreground">
                Each completed run affects your ELO rating. Faster times and fewer clicks
                mean better scores. Can you reach the Elder ranks?
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rank Tiers */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Rank Tiers</h3>
              <div className="space-y-2">
                {RANKS.map((rank) => (
                  <div
                    key={rank.name}
                    className="flex items-center justify-between p-2 rounded"
                  >
                    <span className={`font-medium ${rank.color}`}>{rank.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {rank.minElo}+
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 rounded bg-primary/10">
                  <span className="font-medium text-primary">Elder</span>
                  <span className="text-sm text-muted-foreground">Top 50</span>
                </div>
              </div>
            </div>

            {/* Mini Leaderboard */}
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top Players</h3>
                <Link
                  href="/leaderboard"
                  className="text-sm text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-2">
                {topPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{player.username}</span>
                    </div>
                    <span className="text-sm">{player.elo_rating}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Not signed in prompt */}
            {!user && (
              <div className="bg-primary/10 rounded-lg border border-primary/20 p-6">
                <h3 className="font-semibold mb-2">Ready to compete?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign up to start playing ranked matches and climb the leaderboard!
                </p>
                <Link
                  href="/signup"
                  className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
