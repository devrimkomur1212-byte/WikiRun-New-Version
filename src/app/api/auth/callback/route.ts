import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { containsProfanity } from "@/lib/validation/profanity";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  // Google accounts still carrying an auto-generated username are signing up
  // for the first time — send them to the game, not an empty dashboard
  let isNewSignup = false;

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);

    // For Google OAuth users: derive username from email prefix
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.app_metadata?.provider === "google") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      // If username is auto-generated (starts with user_), replace with email prefix
      if (profile?.username?.startsWith("user_")) {
        isNewSignup = true;
        const emailPrefix = user.email?.split("@")[0] || "";
        // Clean to alphanumeric + underscore only
        let baseUsername = emailPrefix.replace(/[^a-zA-Z0-9_]/g, "");
        if (baseUsername.length < 3) baseUsername = `player_${baseUsername}`;
        baseUsername = baseUsername.slice(0, 20);

        // Check profanity
        if (containsProfanity(baseUsername)) {
          baseUsername = `player_${user.id.slice(0, 8)}`;
        }

        // Find available username (append numbers if taken)
        let finalUsername = baseUsername;
        let suffix = 1;
        while (true) {
          const { data: existing } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", finalUsername)
            .neq("id", user.id)
            .single();
          if (!existing) break;
          finalUsername = `${baseUsername.slice(0, 17)}${suffix}`;
          suffix++;
        }

        await supabase
          .from("profiles")
          .update({ username: finalUsername })
          .eq("id", user.id);
      }
    }
  }

  const next =
    requestUrl.searchParams.get("next") || (isNewSignup ? "/play" : "/dashboard");
  return NextResponse.redirect(`${origin}${next}`);
}
