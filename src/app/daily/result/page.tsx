import { createPageMetadata } from "@/lib/seo/metadata";
import { GuestDailyResult } from "@/components/daily/GuestDailyResult";

export const metadata = createPageMetadata(
  "Daily Challenge Result",
  "Your result in today's WikiRun daily challenge."
);

// Signed-out runs only exist in the browser, so unlike /results/daily/[runId]
// this page has no run to load on the server (and needs no login)
export default function GuestDailyResultPage() {
  return <GuestDailyResult />;
}
