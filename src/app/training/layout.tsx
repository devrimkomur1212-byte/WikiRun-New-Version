import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "Training Mode",
  "Practice navigating Wikipedia with randomly generated routes. No sign-in required. Perfect for learning the game.",
  "/training"
);

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
