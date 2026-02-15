import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/50 mt-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Wiki<span className="text-primary">Run</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Race through Wikipedia articles. Compete in ranked matches or sharpen your skills in training mode.
            </p>
          </div>

          {/* Game */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Game</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/play" className="hover:text-foreground transition-colors">
                  Play Ranked
                </Link>
              </li>
              <li>
                <Link href="/training" className="hover:text-foreground transition-colors">
                  Training Mode
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-foreground transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/how-to-play" className="hover:text-foreground transition-colors">
                  How to Play
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} WikiRun. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Wikipedia content is available under the{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Creative Commons Attribution-ShareAlike License
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
