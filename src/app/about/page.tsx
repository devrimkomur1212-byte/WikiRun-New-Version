import Link from "next/link";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "About",
  "Learn about WikiRun, the competitive Wikipedia speedrun game. Navigate between articles as fast as possible, compete in ranked matches, and climb the ELO leaderboard.",
  "/about"
);

export default function AboutPage() {
  return (
    <div className="py-12 max-w-3xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center">
        <h1 className="text-display-sm mb-4">
          About Wiki<span className="text-primary">Run</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          The competitive Wikipedia speedrunning game
        </p>
      </div>

      <div className="space-y-8">
        {/* What is WikiRun */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">What is WikiRun?</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              WikiRun is a free online game where players race through Wikipedia articles to reach a target
              page as quickly as possible. Starting from one article, you navigate exclusively by clicking
              hyperlinks within the text to reach your destination. The fewer clicks and less time you take,
              the better your score.
            </p>
            <p>
              Wikipedia speedrunning has been a popular internet challenge for years, but WikiRun brings
              it to the next level with competitive ranked matchmaking, an ELO rating system, and a
              global leaderboard. Whether you are a casual player looking for a fun brain exercise or a
              competitive speedrunner aiming for the top ranks, WikiRun has something for you.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">How It Works</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Every game begins with two Wikipedia articles: a <strong className="text-foreground">starting article</strong> and
              a <strong className="text-foreground">target article</strong>. Your goal is to navigate from the start to the target
              by clicking links within each article. You cannot use the browser&apos;s search function, back
              button, or any external tools &mdash; only the links on the page.
            </p>
            <p>
              WikiRun offers two game modes. In <strong className="text-foreground">Training Mode</strong>, you can practice
              at your own pace with three difficulty levels. In <strong className="text-foreground">Ranked Mode</strong>, you
              compete head-to-head against another player on the same route. The player who reaches
              the target article first wins ELO points, while the loser loses points. Your ELO rating
              determines your rank on the global leaderboard.
            </p>
          </div>
        </section>

        {/* The Ranking System */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">The Ranking System</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              WikiRun uses an ELO rating system, the same system used in chess and other competitive
              games. Every new player starts at 1000 ELO. Winning ranked matches earns you points,
              while losing costs you points. The amount gained or lost depends on the relative skill
              difference between you and your opponent &mdash; beating a higher-rated player rewards
              more points than beating a lower-rated one.
            </p>
            <p>
              As your rating changes, you progress through seven competitive tiers:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { name: "Bronze", range: "0–500", color: "text-[#CD7F32]" },
                { name: "Silver", range: "500–800", color: "text-[#C0C0C0]" },
                { name: "Gold", range: "800–1100", color: "text-[#FFD700]" },
                { name: "Platinum", range: "1100–1400", color: "text-[#D4D4D8]" },
                { name: "Diamond", range: "1400–1700", color: "text-[#7DD3FC]" },
                { name: "Emerald", range: "1700–2000", color: "text-emerald-500" },
                { name: "Wizard", range: "2000+", color: "text-[#A855F7]" },
              ].map((rank) => (
                <div key={rank.name} className="rounded-xl border border-border/30 p-3 text-center">
                  <div className={`font-semibold ${rank.color}`}>{rank.name}</div>
                  <div className="text-xs text-muted-foreground">{rank.range} ELO</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Wikipedia Speedrunning */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">Why Wikipedia Speedrunning?</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Wikipedia is the largest encyclopedia ever created, with over 6.8 million articles in English
              alone. Every article is connected to thousands of others through hyperlinks, forming an
              enormous web of human knowledge. Navigating this web efficiently requires a combination of
              general knowledge, pattern recognition, and strategic thinking.
            </p>
            <p>
              Wikipedia speedrunning is not just a game &mdash; it is a way to explore and learn. Every
              run exposes you to new topics, historical events, scientific concepts, and cultural
              connections you might never have discovered otherwise. The competitive element adds
              motivation and excitement, turning passive reading into an active, engaging experience.
            </p>
            <p>
              WikiRun makes this experience accessible to everyone. No downloads, no installations,
              no cost. Just open the site, pick a mode, and start running.
            </p>
          </div>
        </section>

        {/* Fair Play */}
        <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
          <h2 className="text-h1 mb-4">Fair Play &amp; Timing</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              WikiRun is designed to be fair for all players. The game uses active timing, which means
              only the time you spend reading and clicking counts toward your score. Time spent waiting
              for pages to load is not counted against you, so players with slower internet connections
              are not disadvantaged.
            </p>
            <p>
              In ranked matches, both players receive the exact same route, ensuring a level playing
              field. The browser&apos;s find-in-page function is disabled during gameplay to prevent
              shortcuts, and all navigation must happen through article links.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <h2 className="text-h1 mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-6">
            Jump into a game right now. No account required for training mode.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/play"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] hover:translate-y-[-2px] transition-all duration-200"
            >
              Play Ranked
            </Link>
            <Link
              href="/training"
              className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-8 py-4 text-lg font-semibold shadow-soft hover:bg-secondary hover:translate-y-[-2px] transition-all duration-200"
            >
              Try Training Mode
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
