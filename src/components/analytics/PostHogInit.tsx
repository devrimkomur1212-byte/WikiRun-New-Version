"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  initPostHogIfConsented,
  identifyUser,
  isPostHogReady,
  capturePageview,
} from "@/lib/analytics/posthog";
import { CONSENT_CHANGED_EVENT } from "@/lib/consent/cookieConsent";

/**
 * Boots PostHog (consent-gated), identifies the logged-in player, and
 * captures pageviews on every route change (PostHog's documented App Router
 * pattern — auto-capture misses client-side navigations). Mounted once in
 * the root layout; renders nothing. Reacts to the consent banner being
 * accepted mid-session so tracking starts without a page reload.
 */
export function PostHogInit() {
  const pathname = usePathname();
  const lastCapturedUrl = useRef<string | null>(null);

  // Dedupes so init-time and pathname-change captures can't double-fire
  const maybeCapturePageview = () => {
    if (!isPostHogReady()) return;
    const url = window.location.href;
    if (lastCapturedUrl.current === url) return;
    lastCapturedUrl.current = url;
    capturePageview();
  };

  useEffect(() => {
    const start = async () => {
      initPostHogIfConsented();
      maybeCapturePageview();

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) identifyUser(user.id);
    };

    start();

    window.addEventListener(CONSENT_CHANGED_EVENT, start);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    maybeCapturePageview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
