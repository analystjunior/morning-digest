/**
 * Digest Profile Service
 *
 * All data access for digest_profiles lives here. The mock implementations
 * below use a module-level Map as an in-memory store. Each function has the
 * equivalent Supabase call commented out directly below the mock block — swap
 * by deleting the mock block and uncommenting the Supabase block.
 *
 * Integration points are marked with one of three tags:
 *   [SUPABASE]  — database read/write
 *   [LLM]       — AI content generation (Claude API)
 *   [EMAIL]     — transactional email (Resend / Postmark)
 */

import type {
  DigestProfile,
  CreateDigestProfileInput,
  UpdateDigestProfileInput,
} from "@/types/api";

// ─── Mock in-memory store ─────────────────────────────────────────────────────
// This entire block is replaced by the Supabase client import when going live.
// The Map persists for the lifetime of the Next.js server process (dev: per
// hot-reload cycle, prod: per serverless cold start — do not rely on it).

const _store = new Map<string, DigestProfile>([
  [
    "profile_demo",
    {
      id: "profile_demo",
      user_id: "user_demo",
      name: "My Morning Briefing",
      timezone: "America/New_York",
      tone: "concise",
      is_active: true,
      created_at: "2026-01-15T08:00:00.000Z",
      updated_at: "2026-03-10T14:22:00.000Z",
    },
  ],
]);

function _now() {
  return new Date().toISOString();
}

function _uid() {
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Service: create ──────────────────────────────────────────────────────────

export async function createDigestProfile(
  userId: string,
  input: CreateDigestProfileInput
): Promise<DigestProfile> {
  // ── [SUPABASE] Check for existing profile (one per user) ──────────────────
  // ─ MOCK ──────────────────────────────────────────────────────────────────
  const existing = Array.from(_store.values()).find((p) => p.user_id === userId);
  // ─ SUPABASE REPLACEMENT ───────────────────────────────────────────────────
  // const { data: existing } = await supabase
  //   .from("digest_profiles")
  //   .select("id")
  //   .eq("user_id", userId)
  //   .maybeSingle();
  // ─────────────────────────────────────────────────────────────────────────

  if (existing) {
    throw new ConflictError(
      "A digest profile already exists for this user. Use PUT to update it."
    );
  }

  const now = _now();
  const profile: DigestProfile = {
    id: _uid(),
    user_id: userId,
    name: input.name,
    timezone: input.timezone,
    tone: input.tone ?? "concise",
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  // ── [SUPABASE] Persist the new profile ────────────────────────────────────
  // ─ MOCK ──────────────────────────────────────────────────────────────────
  _store.set(profile.id, profile);
  // ─ SUPABASE REPLACEMENT ───────────────────────────────────────────────────
  // const { data, error } = await supabase
  //   .from("digest_profiles")
  //   .insert({
  //     user_id: userId,
  //     name: input.name,
  //     timezone: input.timezone,
  //     tone: input.tone ?? "concise",
  //   })
  //   .select()
  //   .single();
  // if (error) throw new InternalError(error.message);
  // const profile = data;
  // ─────────────────────────────────────────────────────────────────────────

  // ── [LLM] Kick off initial digest generation ──────────────────────────────
  // After the profile is saved, queue a background job to pre-generate the
  // user's first digest so it's ready for them immediately.
  //
  // await generateDigestJob({
  //   profileId: profile.id,
  //   userId,
  //   sections: await getDefaultSections(profile.id),
  //   tone: profile.tone,
  // });
  //
  // Or via a Supabase Edge Function / queue:
  // await supabase.functions.invoke("generate-digest", {
  //   body: { profile_id: profile.id },
  // });
  // ─────────────────────────────────────────────────────────────────────────

  // ── [EMAIL] Send onboarding confirmation ──────────────────────────────────
  // Let the user know their digest is set up and when to expect the first one.
  //
  // await resend.emails.send({
  //   from: "Briefd <hello@briefd.app>",
  //   to: userEmail,                       // fetch from auth.users
  //   subject: "Your morning digest is ready",
  //   react: OnboardingEmail({ profile }),  // React Email template
  // });
  // ─────────────────────────────────────────────────────────────────────────

  return profile;
}

// ─── Service: get by ID ───────────────────────────────────────────────────────

export async function getDigestProfileById(
  id: string,
  userId: string
): Promise<DigestProfile> {
  // ── [SUPABASE] Fetch profile, enforce ownership via RLS or explicit filter ─
  // ─ MOCK ──────────────────────────────────────────────────────────────────
  const profile = _store.get(id);
  // ─ SUPABASE REPLACEMENT ───────────────────────────────────────────────────
  // const { data: profile, error } = await supabase
  //   .from("digest_profiles")
  //   .select("*")
  //   .eq("id", id)
  //   .eq("user_id", userId)   // redundant with RLS but explicit is safer
  //   .single();
  // if (error?.code === "PGRST116") throw new NotFoundError();
  // if (error) throw new InternalError(error.message);
  // ─────────────────────────────────────────────────────────────────────────

  if (!profile) throw new NotFoundError();
  if (profile.user_id !== userId) throw new ForbiddenError();

  return profile;
}

// ─── Service: update ──────────────────────────────────────────────────────────

export async function updateDigestProfile(
  id: string,
  userId: string,
  input: UpdateDigestProfileInput
): Promise<DigestProfile> {
  // Confirm the profile exists and belongs to this user before updating.
  const existing = await getDigestProfileById(id, userId);

  const updated: DigestProfile = {
    ...existing,
    ...input,
    updated_at: _now(),
  };

  // ── [SUPABASE] Persist the update ─────────────────────────────────────────
  // ─ MOCK ──────────────────────────────────────────────────────────────────
  _store.set(id, updated);
  // ─ SUPABASE REPLACEMENT ───────────────────────────────────────────────────
  // const { data: updated, error } = await supabase
  //   .from("digest_profiles")
  //   .update({
  //     ...input,
  //     updated_at: new Date().toISOString(),
  //   })
  //   .eq("id", id)
  //   .eq("user_id", userId)
  //   .select()
  //   .single();
  // if (error) throw new InternalError(error.message);
  // ─────────────────────────────────────────────────────────────────────────

  // ── [LLM] Regenerate digest if content-affecting fields changed ───────────
  // Tone or timezone changes mean the existing cached digest is stale.
  //
  // const contentChanged = "tone" in input || "timezone" in input;
  // if (contentChanged) {
  //   await supabase.functions.invoke("generate-digest", {
  //     body: { profile_id: id, reason: "profile_updated" },
  //   });
  // }
  // ─────────────────────────────────────────────────────────────────────────

  // ── [EMAIL] Notify on is_active change ───────────────────────────────────
  // If the user just re-activated their digest, send a "you're back" email.
  //
  // if ("is_active" in input && input.is_active && !existing.is_active) {
  //   await resend.emails.send({
  //     from: "Briefd <hello@briefd.app>",
  //     to: userEmail,
  //     subject: "Your digest is back on",
  //     react: DigestResumedEmail({ profile: updated }),
  //   });
  // }
  // ─────────────────────────────────────────────────────────────────────────

  return updated;
}

// ─── Typed errors ─────────────────────────────────────────────────────────────
// Route handlers catch these to map to HTTP status codes, keeping the service
// layer free of any HTTP / Next.js concerns.

export class NotFoundError extends Error {
  readonly type = "NOT_FOUND" as const;
  constructor(message = "Digest profile not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  readonly type = "FORBIDDEN" as const;
  constructor(message = "You do not have access to this resource.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  readonly type = "CONFLICT" as const;
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class InternalError extends Error {
  readonly type = "INTERNAL_ERROR" as const;
  constructor(message = "An unexpected error occurred.") {
    super(message);
    this.name = "InternalError";
  }
}
