"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchResult {
  title: string;
  pageid: number;
}

interface ArticleSearchProps {
  label: string;
  value: string;
  onChange: (title: string) => void;
  onRandomize: () => void;
  isRandomizing: boolean;
}

export function ArticleSearch({
  label,
  value,
  onChange,
  onRandomize,
  isRandomizing,
}: ArticleSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. from randomize)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchArticles = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: query,
        srlimit: "8",
        format: "json",
        origin: "*",
      });

      const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
      const data = await res.json();

      const searchResults: SearchResult[] = data.query?.search?.map(
        (item: { title: string; pageid: number }) => ({
          title: item.title,
          pageid: item.pageid,
        })
      ) || [];

      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchArticles(val);
    }, 300);
  };

  const handleSelect = (title: string) => {
    setInputValue(title);
    onChange(title);
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => results.length > 0 && setIsOpen(true)}
              placeholder="Search Wikipedia articles..."
              className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onRandomize}
            disabled={isRandomizing}
            title="Random article"
            className="shrink-0 w-11 h-11 rounded-xl border border-border/60 bg-card flex items-center justify-center hover:bg-secondary hover:border-primary/30 transition-all disabled:opacity-50"
          >
            {isRandomizing ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
                <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
                <path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" />
              </svg>
            )}
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/40 bg-card shadow-lg overflow-hidden">
            {results.map((result) => (
              <button
                key={result.pageid}
                type="button"
                onClick={() => handleSelect(result.title)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors border-b border-border/20 last:border-0"
              >
                {result.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
