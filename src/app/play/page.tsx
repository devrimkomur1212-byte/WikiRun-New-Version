"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { RANKS } from "@/lib/elo/ranks";
import { checkPendingMatch } from "@/app/actions/queueRanked";
import { MatchmakingQueue } from "@/components/matchmaking/MatchmakingQueue";
import type { Tables } from "@/types/database.types";

type Profile = Tables<"profiles">;

export default function PlayPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topPlayers, setTopPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
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

        // Check for pending match (user may have an ongoing match)
        try {
          const pending = await checkPendingMatch();
          if (pending) {
            // User has an ongoing match, redirect to it
            router.push(
              `/run/${pending.runId}/article/${encodeURIComponent(pending.startTitle)}`
            );
            return;
          }
        } catch (error) {
          console.error("Failed to check pending match:", error);
        }
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
  }, [router]);

  const handlePlayClick = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    // Start matchmaking
    setIsSearching(true);
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-display-sm mb-4">Ranked Play</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Navigate from a random start article to a random target article.
          Complete your run as fast as possible and climb the ELO leaderboard!
        </p>
      </div>

      {/* User Stats Card (if logged in) */}
      {user && profile && (
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{profile.username}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-3xl font-bold tracking-tight">{profile.elo_rating}</span>
                <span className="text-sm text-muted-foreground">ELO</span>
                <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {profile.games_played_ranked} games
                </span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Matchmaking UI */}
      {isSearching && user ? (
        <div className="animate-scale-in">
          <MatchmakingQueue
            userId={user.id}
            userElo={profile?.elo_rating ?? 1000}
            onCancel={handleCancelSearch}
          />
        </div>
      ) : (
        /* Main Play Button */
        <div className="rounded-2xl border border-border/40 bg-card p-10 text-center shadow-soft animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-h2 mb-4">Ready to Play?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Click play to find an opponent with similar ELO and race!
          </p>
          <button
            onClick={handlePlayClick}
            className="px-10 py-5 text-xl font-semibold rounded-2xl bg-primary text-primary-foreground shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.5)] hover:shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.6)] hover:translate-y-[-2px] active:translate-y-[0px] transition-all duration-200"
          >
            Find Match
          </button>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="rounded-2xl border border-border/40 bg-card p-8 max-w-md mx-4 shadow-soft-lg animate-scale-in">
            <h2 className="text-h2 mb-2">Sign in to Play</h2>
            <p className="text-muted-foreground mb-6">
              Create an account to play ranked matches, track your ELO rating, and climb the leaderboard!
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/signup?redirect=/play`}
                className="w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
              >
                Sign Up
              </Link>
              <Link
                href={`/login?redirect=/play`}
                className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-center text-sm font-semibold hover:bg-secondary transition-all duration-200"
              >
                Log In
              </Link>
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
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
          <h2 className="text-h2 mb-6">About Ranked Mode</h2>
          <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4 shadow-soft">
            <p className="text-muted-foreground leading-relaxed">
              Two players. One route. No search bar, no back button &mdash; just you,
              Wikipedia, and whatever links are in front of you. Same start. Same target.
              Race begins on 3.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Get there first, gain ELO. Get there second, lose it. Simple as that.
              Reach the top 50 and you earn Elder &mdash; the only rank that actually means something.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rank Tiers */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Rank Tiers</h3>
            <div className="space-y-1">
              {RANKS.map((rank) => (
                <div
                  key={rank.name}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <span className={`font-medium ${rank.color}`}>{rank.name}</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {rank.maxElo ? `${rank.minElo} – ${rank.maxElo}` : `${rank.minElo}+`}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary/10">
                <span className="font-medium text-primary">Elder</span>
                <span className="text-sm text-muted-foreground">Top 50</span>
              </div>
            </div>
          </div>

          {/* Mini Leaderboard */}
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Top Players</h3>
              <Link
                href="/leaderboard"
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="space-y-1">
              {topPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm w-6 font-mono">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{player.username}</span>
                  </div>
                  <span className="text-sm font-mono">{player.elo_rating}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Not signed in prompt */}
          {!user && (
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6">
              <h3 className="font-semibold mb-2">Ready to compete?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign up to start playing ranked matches and climb the leaderboard!
              </p>
              <Link
                href="/signup"
                className="block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
