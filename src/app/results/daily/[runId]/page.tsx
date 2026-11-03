import { notFound } from "next/navigation";
import { getDailyStats } from "@/app/actions/dailyStats";
import { DailyResultView } from "@/components/daily/DailyResultView";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "Daily Challenge Result",
  "Your result in today's WikiRun daily challenge."
);

interface Props {
  params: Promise<{ runId: string }>;
}

export default async function DailyResultsPage({ params }: Props) {
  const { runId } = await params;
  const stats = await getDailyStats(runId);

  if (!stats) notFound();

  return <DailyResultView stats={stats} />;
}
