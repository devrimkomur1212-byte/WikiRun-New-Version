import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Matchmaking treats heartbeats older than 15s as gone; use the same window
const QUEUE_FRESHNESS_MS = 15_000;

export async function GET() {
  const supabase = await createServiceClient();

  const cutoff = new Date(Date.now() - QUEUE_FRESHNESS_MS).toISOString();
  const { count, error } = await supabase
    .from("queue_ranked")
    .select("*", { count: "exact", head: true })
    .gte("last_seen", cutoff);

  if (error) {
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json(
    { count: count ?? 0 },
    { headers: { "Cache-Control": "no-store" } }
  );
}
