import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "Ranked Play",
  "Compete in ranked matches and climb the ELO leaderboard. Match with opponents and race to complete Wikipedia routes.",
  "/play"
);

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
