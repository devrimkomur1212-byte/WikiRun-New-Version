/**
 * Article loading placeholder.
 *
 * A sweeping bar plus a rough outline of the article body reads as faster
 * than static "Loading article..." text, even at identical speed, and the
 * shape hints at what is about to appear. Arbitrary Tailwind values are
 * written as literals so the JIT compiler picks them up.
 */
export function ArticleSkeleton() {
  // Rough paragraph rhythm — varied widths look more like real text
  const lines = [
    "w-full", "w-[92%]", "w-[97%]", "w-[85%]", "w-full", "w-[78%]",
    "w-[94%]", "w-full", "w-[88%]", "w-[70%]",
  ];

  return (
    <div className="pt-32 pb-8 px-4" role="status" aria-live="polite">
      <div className="max-w-4xl mx-auto">
        <span className="sr-only">Loading the next article</span>

        {/* Sweeping progress bar */}
        <div className="h-1 w-full rounded-full overflow-hidden bg-secondary mb-10">
          <div className="h-full w-full bg-[linear-gradient(90deg,transparent_0%,hsl(var(--primary))_50%,transparent_100%)] bg-[length:200%_100%] animate-shimmer" />
        </div>

        {/* Title */}
        <div className="h-9 w-2/5 rounded-lg mb-8 bg-[linear-gradient(90deg,hsl(var(--muted))_0%,hsl(var(--secondary))_50%,hsl(var(--muted))_100%)] bg-[length:200%_100%] animate-shimmer" />

        {/* Body */}
        <div className="space-y-3.5">
          {lines.map((width, i) => (
            <div
              key={i}
              className={`h-4 rounded bg-[linear-gradient(90deg,hsl(var(--muted))_0%,hsl(var(--secondary))_50%,hsl(var(--muted))_100%)] bg-[length:200%_100%] animate-shimmer ${width}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
