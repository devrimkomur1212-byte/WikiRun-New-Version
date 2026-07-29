export type ChangeType = "New" | "Improved" | "Fixed";

export interface PatchNote {
  version: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  changes: { type: ChangeType; text: string }[];
}

/**
 * Release history shown on the About page. Newest first.
 *
 * Each entry collects 5–10 changes players would actually notice — not every
 * commit. Add a new entry only when a release is worth announcing.
 */
export const PATCH_NOTES: PatchNote[] = [
  {
    version: "0.8.1",
    date: "2026-07-29",
    changes: [
      { type: "New", text: "Sound when a match is found, plus a 3–2–1 countdown" },
      { type: "New", text: "Live player count on the Play page" },
      { type: "New", text: "Cookie preferences" },
      { type: "Improved", text: "ELO graph — accurate curve and dates along the timeline" },
      { type: "Fixed", text: "Being matched against players who had already left the queue" },
      { type: "Fixed", text: "Ranked games ending without awarding ELO" },
      { type: "Fixed", text: "Opponents who abandon a match now forfeit — you take the win" },
      { type: "Fixed", text: "Optimal path sometimes failing to load on the results screen" },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-02-15",
    changes: [
      { type: "New", text: "Ranked performance dashboard with your ELO history" },
      { type: "New", text: "Give Up option in ranked and training runs" },
      { type: "New", text: "Optimal path revealed on the results screen" },
      { type: "New", text: "Custom routes in training — pick your own start and target" },
      { type: "New", text: "Personal best times saved for each training difficulty" },
      { type: "New", text: "Google sign-in and password reset" },
      { type: "Improved", text: "Article pool expanded from around 50 to 195 well-known pages" },
      { type: "Improved", text: "Top rank renamed from Elder to Wizard" },
      { type: "Fixed", text: "Severe performance lag during gameplay on Windows" },
      { type: "Fixed", text: "Find-in-page (Ctrl+F) is now blocked during runs" },
    ],
  },
];
