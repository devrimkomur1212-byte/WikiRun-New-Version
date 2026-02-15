import Link from "next/link";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "How to Play",
  "Learn how to play WikiRun. Step-by-step guide to Wikipedia speedrunning, game modes, difficulty levels, scoring, and strategies to improve your runs.",
  "/how-to-play"
);

export default function HowToPlayPage() {
  return (
    <div className="py-12 max-w-3xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center">
        <h1 className="text-display-sm mb-4">How to Play</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Everything you need to know to start speedrunning Wikipedia
        </p>
      </div>

      <div className="space-y-8">
        {/* The Basics */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">The Basics</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              In WikiRun, you are given two Wikipedia articles: a <strong className="text-foreground">starting article</strong> and
              a <strong className="text-foreground">target article</strong>. Your objective is simple &mdash; navigate from the start
              to the target by clicking links within each Wikipedia article.
            </p>
            <div className="rounded-xl bg-secondary/30 border border-border/30 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">1</span>
                <p>You see a Wikipedia article on your screen. Read through it and find a link that you think will bring you closer to the target article.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">2</span>
                <p>Click the link. A new Wikipedia article loads. Repeat the process &mdash; find another link that moves you closer to the target.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">3</span>
                <p>When you reach the target article, the run is complete. Your time and number of clicks are recorded.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Rules */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">Rules</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>To keep the game fair and consistent, the following rules apply during gameplay:</p>
            <ul className="space-y-3 list-none">
              {[
                "You can only navigate by clicking links within the article text.",
                "The browser's find-in-page function (Ctrl+F) is disabled during runs.",
                "You cannot use the browser's back button or any external search tools.",
                "Only links to other Wikipedia articles count. External links, references, and citation links are filtered out.",
                "The game tracks your active time, so page loading time does not count against you.",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-primary mt-1 shrink-0">&#x2022;</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Game Modes */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">Game Modes</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Training Mode</h3>
              <p>
                Training mode is perfect for practice. No account is required, and your runs are saved
                locally on your device. You can choose from three difficulty levels and play at your own pace.
                If you get stuck, you can give up and the game will show you the shortest possible path between
                the two articles.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Ranked Mode</h3>
              <p>
                Ranked mode is the competitive core of WikiRun. You are matched against another player
                and both of you race to complete the same route simultaneously. The first player to reach the target
                article wins. Your ELO rating adjusts based on the result &mdash; winning earns points,
                losing costs points. An account is required to play ranked matches.
              </p>
            </div>
          </div>
        </section>

        {/* Difficulty Levels */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">Difficulty Levels</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>Training mode offers three difficulty levels that determine how the route is generated:</p>
            <div className="grid gap-4">
              {[
                {
                  name: "Easy",
                  color: "text-emerald-500",
                  desc: "Both the starting and target articles are chosen from a curated list of well-known, popular topics. These articles tend to be heavily linked, making it easier to find paths between them. Great for beginners.",
                },
                {
                  name: "Medium",
                  color: "text-[#FFD700]",
                  desc: "The starting article is a popular, well-known topic, but the target article is completely random. You will need to navigate from familiar territory into less common areas of Wikipedia.",
                },
                {
                  name: "Hard",
                  color: "text-destructive",
                  desc: "Both articles are entirely random. You could start on anything from a small village in Norway to an obscure species of beetle, and your target could be equally unexpected. This is the ultimate test of general knowledge and navigational skill.",
                },
              ].map((level) => (
                <div key={level.name} className="rounded-xl border border-border/30 p-4">
                  <h3 className={`font-semibold ${level.color} mb-1`}>{level.name}</h3>
                  <p className="text-sm">{level.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ranking System */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">Ranking System</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              WikiRun uses an ELO rating system to rank players. Every new player starts at 1000 ELO.
              Winning ranked matches increases your rating, while losing decreases it. The system accounts
              for the skill difference between players &mdash; you gain more points for beating someone
              rated higher than you and fewer points for beating someone rated lower.
            </p>
            <p>There are seven competitive tiers:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {[
                { name: "Bronze", range: "0 – 500 ELO", color: "text-[#CD7F32]", bgColor: "bg-[rgba(205,127,50,0.1)]", desc: "Starting tier for new players" },
                { name: "Silver", range: "500 – 800 ELO", color: "text-[#C0C0C0]", bgColor: "bg-[rgba(192,192,192,0.1)]", desc: "Learning the ropes" },
                { name: "Gold", range: "800 – 1100 ELO", color: "text-[#FFD700]", bgColor: "bg-[rgba(255,215,0,0.1)]", desc: "Solid understanding of navigation" },
                { name: "Platinum", range: "1100 – 1400 ELO", color: "text-[#D4D4D8]", bgColor: "bg-[rgba(212,212,216,0.1)]", desc: "Above average player" },
                { name: "Diamond", range: "1400 – 1700 ELO", color: "text-[#7DD3FC]", bgColor: "bg-[rgba(125,211,252,0.1)]", desc: "Highly skilled speedrunner" },
                { name: "Emerald", range: "1700 – 2000 ELO", color: "text-emerald-500", bgColor: "bg-emerald-500/10", desc: "Elite tier" },
                { name: "Wizard", range: "2000+ ELO", color: "text-[#A855F7]", bgColor: "bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-violet-500/20", desc: "The best of the best" },
              ].map((rank) => (
                <div key={rank.name} className={`rounded-xl border border-border/30 p-4 ${rank.bgColor}`}>
                  <div className={`font-semibold ${rank.color}`}>{rank.name}</div>
                  <div className="text-xs text-muted-foreground">{rank.range}</div>
                  <div className="text-sm mt-1">{rank.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tips and Strategies */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">Tips &amp; Strategies</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>Here are some strategies that experienced WikiRun players use to complete routes faster:</p>
            <ul className="space-y-3 list-none">
              {[
                { title: "Use hub articles", desc: "Articles about countries, major cities, historical periods, and broad scientific fields link to many other articles. When in doubt, navigate toward one of these hubs." },
                { title: "Think geographically", desc: "If your target is related to a specific country or region, find a link to that country first. Geography is one of the strongest connectors on Wikipedia." },
                { title: "Go broad, then narrow", desc: "Start by navigating to a general topic related to your target, then narrow down. For example, to reach a specific physicist, first navigate to Physics, then to a relevant subfield." },
                { title: "Read the first paragraph", desc: "The first paragraph of an article often contains the most important and well-linked terms. Scan it quickly for useful links." },
                { title: "Avoid dead ends", desc: "Very specific articles (obscure species, small towns, minor historical events) tend to have fewer outgoing links. If you end up on one, look for category-level links to escape." },
                { title: "Practice regularly", desc: "The more you play, the better you understand Wikipedia's link structure. Training mode is perfect for building this intuition without ELO pressure." },
              ].map((tip) => (
                <li key={tip.title} className="flex items-start gap-3">
                  <span className="text-primary mt-1 shrink-0">&#x2022;</span>
                  <span><strong className="text-foreground">{tip.title}:</strong> {tip.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <h2 className="text-h1 mb-4">Start Playing Now</h2>
          <p className="text-muted-foreground mb-6">
            Jump into training mode to practice, or create an account to compete in ranked matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/training"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] hover:translate-y-[-2px] transition-all duration-200"
            >
              Start Training
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-8 py-4 text-lg font-semibold shadow-soft hover:bg-secondary hover:translate-y-[-2px] transition-all duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
