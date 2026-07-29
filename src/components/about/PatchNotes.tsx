import { PATCH_NOTES, type ChangeType } from "@/lib/patchNotes";

const TAG_STYLES: Record<ChangeType, string> = {
  New: "bg-primary/10 text-primary",
  Improved: "bg-emerald-500/10 text-emerald-500",
  Fixed: "bg-secondary text-muted-foreground",
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function PatchNotes() {
  return (
    <section className="rounded-2xl border border-border/40 bg-card p-8 shadow-soft">
      <h2 className="text-h1 mb-2">What&apos;s New</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        WikiRun is actively developed. Here is what has changed recently.
      </p>

      <div className="space-y-8">
        {PATCH_NOTES.map((note) => (
          <div key={note.version}>
            <div className="flex items-baseline gap-3 mb-4">
              <h3 className="text-lg font-semibold font-mono">{note.version}</h3>
              <span className="text-sm text-muted-foreground">
                {formatDate(note.date)}
              </span>
            </div>

            <ul className="space-y-2.5">
              {note.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold w-20 text-center ${TAG_STYLES[change.type]}`}
                  >
                    {change.type}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">
                    {change.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
