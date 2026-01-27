import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type RunRow = Database["public"]["Tables"]["runs"]["Row"];

interface Props {
  params: Promise<{
    runId: string;
  }>;
}

export default async function RunPage({ params }: Props) {
  const { runId } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the run
  const { data: runData, error } = await supabase
    .from("runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user.id)
    .single();

  if (error || !runData) {
    redirect("/dashboard");
  }

  const run = runData as RunRow;

  // If run is completed, go to results
  if (run.is_completed) {
    redirect(`/results/${runId}`);
  }

  // Redirect to the start article
  redirect(`/run/${runId}/article/${encodeURIComponent(run.start_title)}`);
}
