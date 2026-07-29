import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "Privacy Policy",
  "WikiRun privacy policy. Learn how we collect, use, and protect your personal information when you use our Wikipedia speedrun game.",
  "/privacy"
);

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 max-w-3xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center">
        <h1 className="text-display-sm mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft space-y-8">
        <section>
          <h2 className="text-h2 mb-3">1. Introduction</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Welcome to WikiRun (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy
              and ensuring the security of your personal information. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p>
              By using WikiRun, you agree to the collection and use of information as described in this policy.
              If you do not agree with the terms of this Privacy Policy, please do not access or use our services.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">2. Information We Collect</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Account Information</h3>
              <p>
                When you create a WikiRun account, we collect your email address, a username you choose,
                and a password. If you sign in using Google OAuth, we receive your email address and name
                from Google. We use your email address for account authentication, password recovery, and
                important service notifications.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Game Data</h3>
              <p>
                We collect data related to your gameplay, including your game history (articles visited,
                routes completed, time taken, number of clicks), your ELO rating and ranking, match results,
                and achievements earned. This data is used to provide game functionality, maintain the
                leaderboard, and match you with appropriate opponents.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Training Mode Data</h3>
              <p>
                If you use Training Mode without an account, your game data is stored locally on your
                device using your browser&apos;s local storage. This data is not sent to our servers and is
                not accessible to us.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Automatically Collected Information</h3>
              <p>
                When you access WikiRun, we may automatically collect certain information about your
                device and usage, including your IP address, browser type and version, operating system,
                referring URLs, pages viewed, and the dates and times of your visits. This information is
                used to analyze trends, administer the site, and improve our services.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">3. How We Use Your Information</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>We use the information we collect for the following purposes:</p>
            <ul className="space-y-2 list-none">
              {[
                "To create and manage your account",
                "To provide, maintain, and improve our game services",
                "To match you with opponents in ranked mode",
                "To calculate and display your ELO rating and leaderboard position",
                "To track and award achievements",
                "To send password reset emails and important account notifications",
                "To analyze usage patterns and improve the user experience",
                "To detect and prevent cheating, abuse, and unauthorized access",
                "To comply with legal obligations",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 shrink-0">&#x2022;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">4. Third-Party Services</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Supabase</h3>
              <p>
                We use Supabase as our backend service provider for authentication, database storage,
                and real-time functionality. Supabase processes your account information and game data
                on our behalf. You can review Supabase&apos;s privacy policy at{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                  supabase.com/privacy
                </a>.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Google Services</h3>
              <p>
                We use Google OAuth for optional sign-in functionality. If you choose to sign in with
                Google, Google will share your email address and profile name with us. We also use
                Google AdSense to display advertisements on our website. Google AdSense may use cookies
                and similar technologies to serve ads based on your prior visits to our website and other
                websites. You can opt out of personalized advertising by visiting{" "}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                  Google Ads Settings
                </a>.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">Wikipedia / Wikimedia</h3>
              <p>
                WikiRun fetches article content from the Wikipedia API during gameplay. We do not share
                any of your personal information with Wikipedia or the Wikimedia Foundation. Wikipedia
                content displayed in the game is subject to the{" "}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                  Creative Commons Attribution-ShareAlike License
                </a>.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">5. Cookies</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              WikiRun uses cookies and similar technologies for the following purposes:
            </p>
            <ul className="space-y-2 list-none">
              {[
                "Essential cookies: Required for authentication and session management. These cookies are necessary for the website to function and cannot be disabled.",
                "Advertising cookies: Used by Google AdSense to serve relevant advertisements. These cookies may track your browsing activity across websites.",
                "Local storage: Used in Training Mode to save your game progress locally on your device.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 shrink-0">&#x2022;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              You can control cookie settings through your browser preferences. Please note that
              disabling essential cookies may prevent you from using certain features of our website.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">6. Data Retention</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              We retain your account information and game data for as long as your account is active
              or as needed to provide our services. If you request deletion of your account, we will
              delete your personal information within 30 days, except where we are required to retain
              it for legal or legitimate business purposes.
            </p>
            <p>
              Aggregated, anonymized data (such as overall game statistics) may be retained
              indefinitely as it cannot be used to identify you.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">7. Data Security</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              We implement appropriate technical and organizational security measures to protect your
              personal information against unauthorized access, alteration, disclosure, or destruction.
              These measures include encryption of data in transit using HTTPS/TLS, secure password
              hashing, and access controls on our databases. However, no method of transmission over
              the internet or electronic storage is completely secure, and we cannot guarantee absolute
              security.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">8. Your Rights</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="space-y-2 list-none">
              {[
                "Access: You can request a copy of the personal data we hold about you.",
                "Correction: You can update your username and account information through your dashboard.",
                "Deletion: You can request that we delete your account and associated data.",
                "Portability: You can request your data in a portable format.",
                "Objection: You can object to certain types of data processing.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 shrink-0">&#x2022;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              To exercise any of these rights, please contact us at the email address provided in
              the Contact section below.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">9. Children&apos;s Privacy</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              WikiRun is not intended for children under the age of 13. We do not knowingly collect
              personal information from children under 13. If we become aware that we have collected
              personal data from a child under 13, we will take steps to delete that information promptly.
              If you believe that a child under 13 has provided us with personal information, please
              contact us immediately.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">10. Changes to This Policy</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or for other operational, legal, or regulatory reasons. We will notify you of any material
              changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot;
              date at the top. We encourage you to review this Privacy Policy periodically.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h2 mb-3">11. Contact Us</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              If you have any questions about this Privacy Policy, your personal data, or would like
              to exercise your privacy rights, please contact us at:
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
