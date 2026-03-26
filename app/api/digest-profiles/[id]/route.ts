import { NextRequest, NextResponse } from "next/server";
import { ok, err, validateUpdate, type ApiResponse, type DigestProfile } from "@/types/api";
import {
  getDigestProfileById,
  updateDigestProfile,
  NotFoundError,
  ForbiddenError,
  InternalError,
} from "@/lib/services/digest-profiles";

type RouteContext = { params: { id: string } };

// ─── GET /api/digest-profiles/[id] ───────────────────────────────────────────
// Fetches a single digest profile by ID.
//
// Responses:
//   200  { data: DigestProfile; error: null }
//   401  { data: null; error: { message, code: "UNAUTHORIZED" } }
//   403  { data: null; error: { message, code: "FORBIDDEN" } }
//   404  { data: null; error: { message, code: "NOT_FOUND" } }
//   500  { data: null; error: { message, code: "INTERNAL_ERROR" } }

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<DigestProfile>>> {
  // ── [SUPABASE] Authenticate the request ───────────────────────────────────
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

  try {
    const profile = await getDigestProfileById(params.id, userId);
    return NextResponse.json(ok(profile), { status: 200 });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json(err(e.message, "NOT_FOUND"), { status: 404 });
    }
    if (e instanceof ForbiddenError) {
      return NextResponse.json(err(e.message, "FORBIDDEN"), { status: 403 });
    }
    if (e instanceof InternalError) {
      return NextResponse.json(err(e.message, "INTERNAL_ERROR"), { status: 500 });
    }
    console.error(`[GET /api/digest-profiles/${params.id}] Unexpected error:`, e);
    return NextResponse.json(
      err("An unexpected error occurred.", "INTERNAL_ERROR"),
      { status: 500 }
    );
  }
}

// ─── PUT /api/digest-profiles/[id] ───────────────────────────────────────────
// Partially updates a digest profile. All fields are optional; send only
// the ones you want to change.
//
// Request body (all fields optional):
//   {
//     name?:      string
//     timezone?:  string
//     tone?:      "concise" | "detailed" | "casual" | "formal"
//     is_active?: boolean
//   }
//
// Responses:
//   200  { data: DigestProfile; error: null }
//   400  { data: null; error: { message, code: "VALIDATION_ERROR" } }
//   401  { data: null; error: { message, code: "UNAUTHORIZED" } }
//   403  { data: null; error: { message, code: "FORBIDDEN" } }
//   404  { data: null; error: { message, code: "NOT_FOUND" } }
//   500  { data: null; error: { message, code: "INTERNAL_ERROR" } }

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<DigestProfile>>> {
  // ── [SUPABASE] Authenticate the request ───────────────────────────────────
  // import { createClient } from "@/lib/supabase/server";
  // const supabase = createClient();
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) {
  //   return NextResponse.json(
  //     err("Authentication required.", "UNAUTHORIZED"),
  //     { status: 401 }
  //     );
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

  const validation = validateUpdate(body);
  if (validation.error !== null) {
    return NextResponse.json(
      err(validation.error, "VALIDATION_ERROR"),
      { status: 400 }
    );
  }

  try {
    const profile = await updateDigestProfile(params.id, userId, validation.input);
    return NextResponse.json(ok(profile), { status: 200 });
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json(err(e.message, "NOT_FOUND"), { status: 404 });
    }
    if (e instanceof ForbiddenError) {
      return NextResponse.json(err(e.message, "FORBIDDEN"), { status: 403 });
    }
    if (e instanceof InternalError) {
      return NextResponse.json(err(e.message, "INTERNAL_ERROR"), { status: 500 });
    }
    console.error(`[PUT /api/digest-profiles/${params.id}] Unexpected error:`, e);
    return NextResponse.json(
      err("An unexpected error occurred.", "INTERNAL_ERROR"),
      { status: 500 }
    );
  }
}
