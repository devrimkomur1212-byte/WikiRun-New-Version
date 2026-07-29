"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { initPostHogIfConsented, identifyUser } from "@/lib/analytics/posthog";
import { CONSENT_CHANGED_EVENT } from "@/lib/consent/cookieConsent";

/**
 * Boots PostHog (consent-gated) and identifies the logged-in player.
 * Mounted once in the root layout; renders nothing. Also reacts to the
 * consent banner being accepted mid-session, so tracking starts without
 * a page reload.
 */
export function PostHogInit() {
  useEffect(() => {
    const start = async () => {
      initPostHogIfConsented();

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) identifyUser(user.id);
    };

    start();

    window.addEventListener(CONSENT_CHANGED_EVENT, start);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, start);
  }, []);

  return null;
}
