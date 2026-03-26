import type { DigestTone } from "./index";

// ─── Response envelope ────────────────────────────────────────────────────────
// All API routes return this shape so callers can always destructure
// { data, error } without checking the HTTP status first.

export type ApiSuccess<T> = { data: T; error: null };
export type ApiError = { data: null; error: { message: string; code: ApiErrorCode } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function ok<T>(data: T): ApiSuccess<T> {
  return { data, error: null };
}

export function err(message: string, code: ApiErrorCode): ApiError {
  return { data: null, error: { message, code } };
}

// ─── Digest profile shapes ────────────────────────────────────────────────────

export interface DigestProfile {
  id: string;
  user_id: string;
  name: string;
  timezone: string;
  tone: DigestTone;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDigestProfileInput {
  name: string;
  timezone: string;
  tone?: DigestTone;
}

export interface UpdateDigestProfileInput {
  name?: string;
  timezone?: string;
  tone?: DigestTone;
  is_active?: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_TONES: DigestTone[] = ["concise", "detailed", "casual", "formal"];

export function validateCreate(body: unknown): {
  input: CreateDigestProfileInput;
  error: null;
} | { input: null; error: string } {
  if (!body || typeof body !== "object") {
    return { input: null, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !b.name.trim()) {
    return { input: null, error: "\"name\" is required and must be a non-empty string." };
  }
  if (b.name.length > 100) {
    return { input: null, error: "\"name\" must be 100 characters or fewer." };
  }
  if (typeof b.timezone !== "string" || !b.timezone.trim()) {
    return { input: null, error: "\"timezone\" is required (IANA format, e.g. \"America/New_York\")." };
  }
  if (b.tone !== undefined && !VALID_TONES.includes(b.tone as DigestTone)) {
    return { input: null, error: `\"tone\" must be one of: ${VALID_TONES.join(", ")}.` };
  }

  return {
    input: {
      name: b.name.trim(),
      timezone: b.timezone.trim(),
      tone: (b.tone as DigestTone) ?? "concise",
    },
    error: null,
  };
}

export function validateUpdate(body: unknown): {
  input: UpdateDigestProfileInput;
  error: null;
} | { input: null; error: string } {
  if (!body || typeof body !== "object") {
    return { input: null, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const input: UpdateDigestProfileInput = {};

  if ("name" in b) {
    if (typeof b.name !== "string" || !b.name.trim()) {
      return { input: null, error: "\"name\" must be a non-empty string." };
    }
    if (b.name.length > 100) {
      return { input: null, error: "\"name\" must be 100 characters or fewer." };
    }
    input.name = b.name.trim();
  }
  if ("timezone" in b) {
    if (typeof b.timezone !== "string" || !b.timezone.trim()) {
      return { input: null, error: "\"timezone\" must be a non-empty string." };
    }
    input.timezone = b.timezone.trim();
  }
  if ("tone" in b) {
    if (!VALID_TONES.includes(b.tone as DigestTone)) {
      return { input: null, error: `\"tone\" must be one of: ${VALID_TONES.join(", ")}.` };
    }
    input.tone = b.tone as DigestTone;
  }
  if ("is_active" in b) {
    if (typeof b.is_active !== "boolean") {
      return { input: null, error: "\"is_active\" must be a boolean." };
    }
    input.is_active = b.is_active;
  }

  if (Object.keys(input).length === 0) {
    return { input: null, error: "Request body must include at least one updatable field." };
  }

  return { input, error: null };
}
