import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// GET /auth/confirm?token_hash=...&type=email
// Verifies the OTP token from the magic-link email (stateless, works cross-device/browser).
// Falls back to PKCE code exchange if token_hash is absent (same-browser only).
// Routes the user:
//   - returning user (has a digest_profile) → /dashboard
//   - new user (no profile yet)             → /onboarding
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = createClient();
  let authError: Error | null = null;

  if (token_hash && type) {
    // Stateless OTP verification — works cross-device and cross-browser.
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    authError = error;
  } else if (code) {
    // PKCE code exchange — only works in the same browser that requested the link.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else {
    return NextResponse.redirect(`${origin}/onboarding?error=missing_token`);
  }

  if (authError) {
    console.error("[/auth/confirm] auth failed:", authError.message);
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
