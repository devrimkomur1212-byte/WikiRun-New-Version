"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type RunInsert = Database["public"]["Tables"]["runs"]["Insert"];
type RunRow = Database["public"]["Tables"]["runs"]["Row"];

export async function startRankedRun(startTitle: string, targetTitle: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const runData: RunInsert = {
    user_id: user.id,
    mode: "ranked",
    start_title: startTitle,
    target_title: targetTitle,
    active_time_ms: 0,
    clicks_count: 0,
    misses_count: 0,
    route_titles: [],
    step_data: [],
    is_completed: false,
  };

  const { data: runResult, error } = await supabase
    .from("runs")
    .insert(runData as never)
    .select()
    .single();

  if (error || !runResult) {
    throw new Error("Failed to create run: " + error?.message);
  }

  const run = runResult as RunRow;

  return {
    runId: run.id,
    startTitle,
    targetTitle,
  };
}
