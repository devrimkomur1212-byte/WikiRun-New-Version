import { createPageMetadata } from "@/lib/seo/metadata";
import { DailyChallengeCard } from "@/components/daily/DailyChallengeCard";

export const metadata = createPageMetadata(
  "Daily Challenge",
  "One Wikipedia route a day, the same for every player. One attempt, then see how you compare and keep your streak going.",
  "/daily"
);

const RULES = [
  {
    title: "One attempt",
    body: "Your attempt starts as soon as you begin, and leaving doesn't give you another.",
  },
  {
    title: "Hints are optional",
    body: "Choose before you start. Hints show when the target is linked from your page, but a hinted run can't set a record.",
  },
  {
    title: "Keep your streak",
    body: "Finish every day to build a streak. Giving up or missing a day ends it.",
  },
  {
    title: "Compare afterwards",
    body: "Finish to see the day's average clicks and time, and who holds the records.",
  },
];

export default function DailyPage() {
  return (
    <div className="py-8 max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-display-sm mb-4">Daily Challenge</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          One route a day, the same for everyone. It never touches your ELO.
        </p>
      </div>

      <DailyChallengeCard />

      <div>
        <h2 className="text-h2 mb-6">How it works</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {RULES.map((rule) => (
            <div
              key={rule.title}
              className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft"
            >
              <h3 className="font-semibold mb-2">{rule.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {rule.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
