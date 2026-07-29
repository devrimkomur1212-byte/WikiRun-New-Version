import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata(
  "Contact",
  "Get in touch with the WikiRun team. Report bugs, ask questions, give feedback, or reach out for support.",
  "/contact"
);

export default function ContactPage() {
  return (
    <div className="py-12 max-w-3xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center">
        <h1 className="text-display-sm mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Have a question, found a bug, or want to share feedback? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Methods */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Email</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              For general inquiries, support requests, account issues, or privacy-related questions.
            </p>
            <a
              href="mailto:devrim.komur@revolutionarymedia.co.uk"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              devrim.komur@revolutionarymedia.co.uk
            </a>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Bug Reports</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Found a bug or experiencing a technical issue? Please include a description of the problem,
              the steps to reproduce it, and your browser/device information so we can investigate quickly.
            </p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Feedback</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We welcome suggestions for new features, game mode ideas, and improvements. Your feedback
              helps us make WikiRun better for everyone.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft h-fit">
          <h2 className="text-h1 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {[
              {
                q: "Is WikiRun free to use?",
                a: "Yes, WikiRun is completely free. Both training mode and ranked mode are available at no cost.",
              },
              {
                q: "Do I need an account to play?",
                a: "Training mode can be played without an account. Ranked mode requires a free account so we can track your ELO rating and match history.",
              },
              {
                q: "How is my ELO rating calculated?",
                a: "We use the standard ELO formula used in chess. You gain more points for beating higher-rated opponents and lose fewer points when losing to them.",
              },
              {
                q: "Can I change my username?",
                a: "Yes, you can change your username from your dashboard by clicking the edit icon next to your current username.",
              },
              {
                q: "How do I reset my password?",
                a: "Click \"Forgot password?\" on the login page and enter your email. You'll receive a link to set a new password.",
              },
              {
                q: "Is Wikipedia content modified in any way?",
                a: "No, we fetch article content directly from the Wikipedia API. The content you see during gameplay is the same as on Wikipedia itself.",
              },
              {
                q: "How can I report a player?",
                a: "If you encounter a player with an offensive username or suspect cheating, please email us with the player's username and a description of the issue.",
              },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-foreground mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 text-center">
        <h2 className="text-h2 mb-3">Response Time</h2>
        <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
          We aim to respond to all inquiries within 48 hours. For urgent account or security issues,
          please include &quot;URGENT&quot; in your email subject line.
        </p>
      </div>
    </div>
  );
}
