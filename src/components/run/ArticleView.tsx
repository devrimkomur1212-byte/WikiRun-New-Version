"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useRunStore } from "@/lib/run/runStore";
import { rewriteWikiLinks } from "@/lib/wiki/rewriteLinks";
import { submitRun } from "@/app/actions/submitRun";
import DOMPurify from "dompurify";

// Configure DOMPurify to add lazy loading to images (performance optimization)
// This runs once at module load to add the hook
if (typeof window !== "undefined") {
  DOMPurify.addHook("afterSanitizeElements", (node) => {
    if (node.nodeName === "IMG") {
      (node as Element).setAttribute("loading", "lazy");
      (node as Element).setAttribute("decoding", "async");
    }
  });
}

interface ArticleViewProps {
  runId: string;
  isClientSideRun: boolean;
  initialTitle: string;
}

// Client-side fetch - simple and fast
async function fetchArticleClient(title: string): Promise<{ html: string; title: string }> {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, "_"));

  // Use Action API (more reliable for CORS)
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    format: "json",
    origin: "*",
    prop: "text|displaytitle",
    disableeditsection: "1",
    redirects: "1",
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.info || "Failed to fetch article");
  }

  return {
    html: data.parse.text["*"],
    title: data.parse.title,
  };
}

export function ArticleView({
  runId,
  isClientSideRun,
  initialTitle,
}: ArticleViewProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoadingState] = useState(true);
  const [articleHtml, setArticleHtml] = useState<string>("");
  const [articleTitle, setArticleTitle] = useState<string>(initialTitle);
  const hasFetched = useRef(false);

  const {
    targetTitle,
    startTitle,
    setCurrentArticle,
    setOutgoingLinks,
    setLoading,
    pauseTimer,
    resumeTimer,
    registerNavigation,
    completeRun,
    isTargetReached,
    outgoingLinks,
    isCompleted,
  } = useRunStore();

  // Fetch initial article on mount (client-side only)
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadArticle = async () => {
      try {
        const titleToFetch = initialTitle || startTitle;
        if (!titleToFetch) {
          console.error("No title to fetch");
          return;
        }

        console.log("[ArticleView] Fetching:", titleToFetch);
        const article = await fetchArticleClient(titleToFetch);

        const sanitized = DOMPurify.sanitize(article.html, {
          FORBID_TAGS: ["script", "style", "iframe"],
        });

        const { html: processedHtml, outgoingLinks: links } = rewriteWikiLinks(sanitized, runId);

        setArticleHtml(processedHtml);
        setArticleTitle(article.title);
        setOutgoingLinks(links);
        setCurrentArticle(article.title, processedHtml);
        setLoadingState(false);

        // Start timer after article loads
        resumeTimer();
      } catch (error) {
        console.error("Failed to load article:", error);
        setLoadingState(false);
      }
    };

    loadArticle();
  }, [initialTitle, startTitle, runId, setOutgoingLinks, setCurrentArticle, resumeTimer]);

  // Check for target reached
  useEffect(() => {
    if (isTargetReached && !isCompleted) {
      handleRunComplete();
    }
  }, [isTargetReached, isCompleted]);

  const handleRunComplete = async () => {
    const runData = completeRun();

    if (isClientSideRun) {
      localStorage.setItem(
        `run-results-${runId}`,
        JSON.stringify({
          runId,
          activeTimeMs: runData.activeTimeMs,
          clicksCount: runData.clicksCount,
          missesCount: runData.missesCount,
          routeTitles: runData.routeTitles,
          completedAt: Date.now(),
        })
      );
      router.push(`/results/training/${runId}`);
    } else {
      try {
        await submitRun(runId, {
          active_time_ms: runData.activeTimeMs,
          clicks_count: runData.clicksCount,
          misses_count: runData.missesCount,
          route_titles: runData.routeTitles,
          step_data: runData.steps,
        });
        router.push(`/results/${runId}`);
      } catch (error) {
        console.error("Failed to submit run:", error);
        router.push(`/results/${runId}`);
      }
    }
  };

  const handleLinkClick = useCallback(
    async (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[data-wiki-link]") as HTMLAnchorElement | null;

      if (!link) return;
      e.preventDefault();

      const nextTitle = link.getAttribute("data-wiki-title");
      if (!nextTitle) return;

      pauseTimer();
      setLoading(true);
      setLoadingState(true);

      try {
        const hadDirectLinkToTarget = outgoingLinks.some(
          (linkTitle) => linkTitle.toLowerCase() === targetTitle.toLowerCase()
        );

        registerNavigation(nextTitle, hadDirectLinkToTarget);

        if (nextTitle.toLowerCase() === targetTitle.toLowerCase()) {
          setLoading(false);
          setLoadingState(false);
          return;
        }

        const article = await fetchArticleClient(nextTitle);
        const sanitized = DOMPurify.sanitize(article.html, {
          FORBID_TAGS: ["script", "style", "iframe"],
        });

        const { html: processedHtml, outgoingLinks: links } = rewriteWikiLinks(sanitized, runId);

        setArticleHtml(processedHtml);
        setArticleTitle(article.title);
        setOutgoingLinks(links);
        setCurrentArticle(article.title, processedHtml);

        window.history.pushState({}, "", `/run/${runId}/article/${encodeURIComponent(article.title)}`);
        window.scrollTo(0, 0);

        resumeTimer();
      } catch (error) {
        console.error("Failed to load article:", error);
        resumeTimer();
      } finally {
        setLoading(false);
        setLoadingState(false);
      }
    },
    [runId, targetTitle, outgoingLinks, pauseTimer, resumeTimer, setLoading, setCurrentArticle, setOutgoingLinks, registerNavigation]
  );

  if (loading) {
    return (
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse text-muted-foreground text-center py-12">
            Loading article...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{articleTitle}</h1>
        <div
          ref={contentRef}
          className="wiki-content prose prose-sm dark:prose-invert max-w-none"
          onClick={handleLinkClick}
          dangerouslySetInnerHTML={{ __html: articleHtml }}
        />
      </div>
    </div>
  );
}
