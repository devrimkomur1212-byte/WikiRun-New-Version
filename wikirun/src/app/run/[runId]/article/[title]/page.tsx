import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RunPageClient } from "./RunPageClient";
import type { Database } from "@/types/database.types";

type RunRow = Database["public"]["Tables"]["runs"]["Row"];

interface Props {
  params: Promise<{
    runId: string;
    title: string;
  }>;
}

export default async function RunArticlePage({ params }: Props) {
  const { runId, title } = await params;
  const decodedTitle = decodeURIComponent(title);

  // Check if this is a client-side training run (no auth required)
  const isClientSideRun = runId.startsWith("training-");

  if (isClientSideRun) {
    // For training runs, client fetches article directly from Wikipedia
    return (
      <RunPageClient
        runId={runId}
        mode="training"
        startTitle=""
        targetTitle=""
        routeId={null}
        matchId={null}
        initialTitle={decodedTitle}
        isClientSideRun={true}
      />
    );
  }

  // For database runs, require authentication
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the run metadata
  const { data: runData, error } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (error || !runData) {
    notFound();
  }

  const run = runData as RunRow;

  if (run.is_completed) {
    redirect(`/results/${runId}`);
  }

  // Client fetches article directly from Wikipedia (faster)
  return (
    <RunPageClient
      runId={runId}
      mode={run.mode as "ranked" | "training"}
      startTitle={run.start_title}
      targetTitle={run.target_title}
      routeId={run.route_id}
      matchId={run.match_id}
      initialTitle={decodedTitle}
      isClientSideRun={false}
    />
  );
}
