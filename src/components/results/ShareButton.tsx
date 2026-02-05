"use client";

interface ShareButtonProps {
  shareText: string;
}

export function ShareButton({ shareText }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex-1 inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm font-semibold shadow-sm hover:bg-secondary hover:translate-y-[-1px] transition-all duration-200"
    >
      Share Result
    </button>
  );
}
