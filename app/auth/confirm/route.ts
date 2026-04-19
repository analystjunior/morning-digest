import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /auth/confirm?code=...
// Exchanges the PKCE code from the magic-link email for a session,
// then routes the user appropriately:
//   - returning user (has a digest_profile) → /dashboard
//   - new user (no profile yet)             → /onboarding
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/onboarding?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[/auth/confirm] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(`${origin}/onboarding?error=auth_failed`);
  }

  // Check whether this user has already completed onboarding.
  // RLS ensures we only see the authenticated user's own row.
  const { data: profile } = await supabase
    .from("digest_profiles")
    .select("id")
    .maybeSingle();

  if (profile) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // New user — send back to onboarding; the page detects the session
  // and advances past the "welcome" step automatically.
  return NextResponse.redirect(`${origin}/onboarding`);
}
