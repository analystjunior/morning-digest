import { NextRequest, NextResponse } from "next/server";
import { ok, err, validateCreate, type ApiResponse, type DigestProfile } from "@/types/api";
import {
  createDigestProfile,
  ConflictError,
  InternalError,
} from "@/lib/services/digest-profiles";

// ─── POST /api/digest-profiles ────────────────────────────────────────────────
// Creates a new digest profile for the authenticated user.
//
// Request body:
//   { name: string; timezone: string; tone?: "concise"|"detailed"|"casual"|"formal" }
//
// Responses:
//   201  { data: DigestProfile; error: null }
//   400  { data: null; error: { message, code: "VALIDATION_ERROR" } }
//   401  { data: null; error: { message, code: "UNAUTHORIZED" } }
//   409  { data: null; error: { message, code: "CONFLICT" } }
//   500  { data: null; error: { message, code: "INTERNAL_ERROR" } }

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<DigestProfile>>> {
  // ── [SUPABASE] Authenticate the request ───────────────────────────────────
  // Replace the mock userId below with a real session check:
  //
  // import { createClient } from "@/lib/supabase/server";
  // const supabase = createClient();
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) {
  //   return NextResponse.json(
  //     err("Authentication required.", "UNAUTHORIZED"),
  //     { status: 401 }
  //   );
  // }
  // const userId = user.id;
  // ─────────────────────────────────────────────────────────────────────────
  const userId = "user_demo"; // ← remove when auth is wired up

  // Parse and validate the request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      err("Request body must be valid JSON.", "VALIDATION_ERROR"),
      { status: 400 }
    );
  }

  const validation = validateCreate(body);
  if (validation.error !== null) {
    return NextResponse.json(
      err(validation.error, "VALIDATION_ERROR"),
      { status: 400 }
    );
  }

  try {
    const profile = await createDigestProfile(userId, validation.input);
    return NextResponse.json(ok(profile), { status: 201 });
  } catch (e) {
    if (e instanceof ConflictError) {
      return NextResponse.json(err(e.message, "CONFLICT"), { status: 409 });
    }
    if (e instanceof InternalError) {
      return NextResponse.json(err(e.message, "INTERNAL_ERROR"), { status: 500 });
    }
    console.error("[POST /api/digest-profiles] Unexpected error:", e);
    return NextResponse.json(
      err("An unexpected error occurred.", "INTERNAL_ERROR"),
      { status: 500 }
    );
  }
}
