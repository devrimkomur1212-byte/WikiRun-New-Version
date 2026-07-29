import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "Terms of Service",
  "WikiRun terms of service. Read the rules, guidelines, and legal terms that govern your use of our Wikipedia speedrun game.",
  "/terms"
);

export default function TermsPage() {
  return (
    <div className="py-12 max-w-3xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center">
        <h1 className="text-display-sm mb-4">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft space-y-8">
        <section>
          <h2 className="text-h2 mb-3">1. Acceptance of Terms</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              By accessing or using WikiRun (&quot;the Service&quot;), you agree to be bound by these Terms of
              Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service.
              We reserve the right to modify these Terms at any time. Continued use of the Service
              after changes constitutes acceptance of the modified Terms.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">2. Description of Service</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              WikiRun is a free online game that allows users to race through Wikipedia articles by
              navigating from a starting article to a target article using only hyperlinks. The Service
              includes training mode (available without an account), ranked competitive mode (requires
              an account), a global leaderboard, and related features.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">3. User Accounts</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              To access ranked mode and certain features, you must create an account. You agree to
              provide accurate and complete information during registration and to keep your account
              information up to date. You are responsible for maintaining the confidentiality of your
              password and for all activities that occur under your account.
            </p>
            <p>
              You may create only one account per person. Creating multiple accounts to manipulate
              rankings, matchmaking, or any other game system is prohibited and may result in the
              suspension or termination of all associated accounts.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">4. Username Policy</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Your username must be between 3 and 20 characters long and may contain only letters,
              numbers, and underscores. Usernames that contain profanity, slurs, hate speech, or any
              offensive, discriminatory, or inappropriate language are strictly prohibited. We reserve
              the right to change or remove any username that violates this policy without prior notice.
            </p>
            <p>
              Usernames that impersonate other users, public figures, or WikiRun staff are also prohibited.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">5. Fair Play</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>WikiRun is a competitive game, and fair play is essential. The following are prohibited:</p>
            <ul className="space-y-2 list-none">
              {[
                "Using external tools, browser extensions, or scripts to gain an unfair advantage during gameplay",
                "Exploiting bugs, glitches, or vulnerabilities in the game",
                "Colluding with other players to manipulate match outcomes or rankings",
                "Intentionally losing matches to manipulate ELO ratings (sandbagging)",
                "Using automated programs or bots to play the game",
                "Circumventing any game restrictions or security measures",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 shrink-0">&#x2022;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              Violations of fair play rules may result in temporary or permanent suspension of your
              account, removal from the leaderboard, and/or reset of your ELO rating.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">6. Intellectual Property</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              The WikiRun website, including its design, code, graphics, and branding, is owned by
              WikiRun and is protected by applicable intellectual property laws. You may not copy,
              modify, distribute, or reverse-engineer any part of the Service without our prior
              written consent.
            </p>
            <p>
              Wikipedia article content displayed within the game is sourced from the Wikimedia
              Foundation and is available under the{" "}
              <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                Creative Commons Attribution-ShareAlike 4.0 International License
              </a>.
              WikiRun is not affiliated with, endorsed by, or sponsored by the Wikimedia Foundation.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">7. Advertisements</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              WikiRun displays advertisements through Google AdSense to support the free operation of
              the Service. These advertisements may use cookies and tracking technologies as described
              in our Privacy Policy. By using the Service, you acknowledge that advertisements are a
              necessary part of the free experience.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">8. Limitation of Liability</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              WikiRun is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
              express or implied, including but not limited to implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement. We do not warrant that the
              Service will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>
            <p>
              In no event shall WikiRun, its owners, operators, or contributors be liable for any
              indirect, incidental, special, consequential, or punitive damages arising out of or
              related to your use of the Service, regardless of the cause of action or the theory
              of liability.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">9. Account Termination</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without
              cause, and with or without notice. Grounds for termination include, but are not limited
              to, violations of these Terms, fair play violations, abusive behavior toward other
              users, and prolonged inactivity.
            </p>
            <p>
              You may delete your account at any time by contacting us. Upon deletion, your personal
              information will be removed in accordance with our Privacy Policy.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">10. Age Requirement</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              You must be at least 13 years of age to create an account and use the ranked features
              of WikiRun. Training mode may be used without age restrictions as it does not require
              account creation or the collection of personal information. If you are under 18, you
              should review these Terms with a parent or guardian.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">11. Governing Law</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              United States, without regard to its conflict of law provisions. Any disputes arising
              from these Terms or your use of the Service shall be resolved through good-faith
              negotiation or, if necessary, through binding arbitration.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">12. Contact</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="font-medium text-foreground">
              Email: devrim.komur@revolutionarymedia.co.uk
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
