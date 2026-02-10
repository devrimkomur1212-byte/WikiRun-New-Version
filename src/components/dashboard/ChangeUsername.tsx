"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUsername } from "@/app/actions/updateUsername";
import { validateUsername } from "@/lib/validation/profanity";

export function ChangeUsername({ currentUsername }: { currentUsername: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError(null);

    if (username === currentUsername) {
      setEditing(false);
      return;
    }

    // Client-side validation first
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await updateUsername(username);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setUsername(currentUsername);
    setError(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <h1 className="text-display-sm">{currentUsername}</h1>
        <button
          onClick={() => setEditing(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-secondary"
          title="Change username"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-lg font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 w-56"
          maxLength={20}
          minLength={3}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:translate-y-[-1px] transition-all duration-200 disabled:opacity-50"
        >
          {loading ? "..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold hover:bg-secondary transition-all duration-200"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive animate-fade-in">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        3-20 characters, letters, numbers, and underscores only
      </p>
    </div>
  );
}
