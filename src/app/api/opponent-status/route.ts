import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface MatchData {
  player1_id: string;
  player2_id: string;
  player1_run_id: string | null;
  player2_run_id: string | null;
}

interface OpponentRunData {
  is_completed: boolean;
  gave_up: boolean;
  active_time_ms: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  // Authenticate the user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service client to bypass RLS (we need to read opponent's run)
  const serviceSupabase = await createServiceClient();

  // Fetch the match
  const { data: matchData, error: matchError } = await serviceSupabase
    .from("matches")
    .select("player1_id, player2_id, player1_run_id, player2_run_id")
    .eq("id", matchId)
    .single();

  if (matchError || !matchData) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const match = matchData as unknown as MatchData;

  // Verify the user is a participant
  const isPlayer1 = match.player1_id === user.id;
  const isPlayer2 = match.player2_id === user.id;

  if (!isPlayer1 && !isPlayer2) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // Get opponent's run ID
  const opponentRunId = isPlayer1 ? match.player2_run_id : match.player1_run_id;

  if (!opponentRunId) {
    return NextResponse.json({ finished: false });
  }

  // Fetch opponent's run status (using service client to bypass RLS)
  const { data: runData, error: runError } = await serviceSupabase
    .from("runs")
    .select("is_completed, gave_up, active_time_ms")
    .eq("id", opponentRunId)
    .single();

  if (runError || !runData) {
    return NextResponse.json({ finished: false });
  }

  const opponentRun = runData as unknown as OpponentRunData;

  if (opponentRun.is_completed) {
    return NextResponse.json({
      finished: true,
      time: opponentRun.active_time_ms,
      gaveUp: opponentRun.gave_up === true,
    });
  }

  return NextResponse.json({ finished: false });
}
