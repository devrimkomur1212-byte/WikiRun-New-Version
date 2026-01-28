"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

type RouteRow = Database["public"]["Tables"]["routes"]["Row"];
type RunInsert = Database["public"]["Tables"]["runs"]["Insert"];
type RunRow = Database["public"]["Tables"]["runs"]["Row"];

export async function createTrainingRun(routeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch the route
  const { data: routeData, error: routeError } = await supabase
    .from("routes")
    .select("*")
    .eq("id", routeId)
    .single();

  if (routeError || !routeData) {
    throw new Error("Route not found");
  }

  const route = routeData as RouteRow;

  // Create the run
  const runData: RunInsert = {
    user_id: user.id,
    mode: "training",
    route_id: routeId,
    start_title: route.start_title,
    target_title: route.target_title,
    active_time_ms: 0,
    clicks_count: 0,
    misses_count: 0,
    route_titles: [],
    step_data: [],
    is_completed: false,
  };

  const { data: run, error: runError } = await supabase
    .from("runs")
    .insert(runData as never)
    .select()
    .single();

  if (runError) {
    throw new Error("Failed to create run: " + runError.message);
  }

  const runRow = run as RunRow;
  revalidatePath("/dashboard");

  return {
    id: runRow.id,
    startTitle: route.start_title,
    targetTitle: route.target_title,
    routeId: route.id,
  };
}

export async function createRankedRun(routeId: string, matchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch the route
  const { data: routeData2, error: routeError } = await supabase
    .from("routes")
    .select("*")
    .eq("id", routeId)
    .single();

  if (routeError || !routeData2) {
    throw new Error("Route not found");
  }

  const route = routeData2 as RouteRow;

  // Create the run
  const runData: RunInsert = {
    user_id: user.id,
    mode: "ranked",
    route_id: routeId,
    match_id: matchId,
    start_title: route.start_title,
    target_title: route.target_title,
    active_time_ms: 0,
    clicks_count: 0,
    misses_count: 0,
    route_titles: [],
    step_data: [],
    is_completed: false,
  };

  const { data: run, error: runError } = await supabase
    .from("runs")
    .insert(runData as never)
    .select()
    .single();

  if (runError) {
    throw new Error("Failed to create run: " + runError.message);
  }

  const runRow = run as RunRow;
  revalidatePath("/dashboard");

  return {
    id: runRow.id,
    startTitle: route.start_title,
    targetTitle: route.target_title,
    routeId: route.id,
    matchId,
  };
}
