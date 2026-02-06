import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MatchData {
  status: string;
  winner_id: string | null;
  elo_delta_p1: number | null;
  elo_delta_p2: number | null;
  player1_id: string;
  player2_id: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch match
  const { data: matchData, error } = await supabase
    .from("matches")
    .select("status, winner_id, elo_delta_p1, elo_delta_p2, player1_id, player2_id")
    .eq("id", matchId)
    .single();

  if (error || !matchData) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const match = matchData as unknown as MatchData;

  // Determine which player this user is
  const isPlayer1 = match.player1_id === user.id;
  const isPlayer2 = match.player2_id === user.id;

  if (!isPlayer1 && !isPlayer2) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const userEloDelta = isPlayer1 ? match.elo_delta_p1 : match.elo_delta_p2;
  const isWinner = match.winner_id === user.id;
  const isDraw = match.status === "complete" && match.winner_id === null;

  return NextResponse.json({
    status: match.status,
    userEloDelta,
    isWinner,
    isDraw,
  });
}
