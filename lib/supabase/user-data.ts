// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any; // Supabase client — typed as any because types/supabase.ts is manually maintained
              // and diverges from what supabase-js v2.100 expects internally.
import type {
  DigestSection,
  SectionType,
  DeliverySettings,
  User,
  DigestSubscription,
} from "@/lib/types";

// ─── Section type mapping ─────────────────────────────────────────────────────
// The app uses "finance"; the DB enum uses "stocks". Map on the way in/out.

const APP_TO_DB: Partial<Record<SectionType, string>> = { finance: "stocks" };
const DB_TO_APP: Record<string, SectionType> = { stocks: "finance" };

function toDbType(t: SectionType): string {
  return APP_TO_DB[t] ?? t;
}

function toAppType(t: string): SectionType {
  return (DB_TO_APP[t] ?? t) as SectionType;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export interface SavePayload {
  name: string;
  sections: DigestSection[];
  delivery: DeliverySettings;
}

export async function saveUserData(
  supabase: DB,
  userId: string,
  payload: SavePayload
): Promise<void> {
  // 1. Keep public.users.full_name in sync with the name collected during onboarding.
  const { error: userError } = await supabase
    .from("users")
    .update({ full_name: payload.name })
    .eq("id", userId);
  if (userError) throw new Error(`users update: ${userError.message}`);

  // 2. Upsert digest_profile (one per user; conflict key = user_id).
  const { data: profile, error: profileError } = await supabase
    .from("digest_profiles")
    .upsert(
      {
        user_id: userId,
        name: "My Morning Digest",
        timezone: payload.delivery.timezone,
        tone: "concise",
        is_active: true,
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (profileError || !profile) {
    throw new Error(`digest_profiles upsert: ${profileError?.message ?? "no data returned"}`);
  }

  const profileId = profile.id;

  // 3. Replace sections: delete existing rows then bulk-insert.
  //    Simpler and safer than a per-row upsert given that IDs are client-generated.
  const { error: deleteError } = await supabase
    .from("digest_sections")
    .delete()
    .eq("digest_profile_id", profileId);
  if (deleteError) throw new Error(`digest_sections delete: ${deleteError.message}`);

  if (payload.sections.length > 0) {
    const rows = payload.sections.map((s, i) => ({
      digest_profile_id: profileId,
      user_id: userId,
      section_type: toDbType(s.type),
      title: s.title || null,
      position: i,
      is_enabled: s.enabled,
      config: (s.config ?? {}) as Record<string, unknown>,
    }));

    const { error: insertError } = await supabase
      .from("digest_sections")
      .insert(rows);
    if (insertError) throw new Error(`digest_sections insert: ${insertError.message}`);
  }

  // 4. Upsert delivery_settings (one per user; conflict key = user_id).
  //    delivery_time is stored as a TIME column → needs "HH:MM:SS" format.
  const deliveryTime = payload.delivery.time.length === 5
    ? `${payload.delivery.time}:00`
    : payload.delivery.time;

  const { error: deliveryError } = await supabase
    .from("delivery_settings")
    .upsert(
      {
        user_id: userId,
        digest_profile_id: profileId,
        channel: "email",
        delivery_email: payload.delivery.email || null,
        delivery_time: deliveryTime,
        delivery_days: 127, // every day (Sun–Sat bitmask)
        is_enabled: true,
      },
      { onConflict: "user_id" }
    );
  if (deliveryError) throw new Error(`delivery_settings upsert: ${deliveryError.message}`);
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export interface LoadedData {
  user: User;
  subscription: DigestSubscription;
}

export async function loadUserData(supabase: DB): Promise<LoadedData | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  // Fetch digest profile (there's at most one per user due to UNIQUE constraint).
  const { data: profile } = await supabase
    .from("digest_profiles")
    .select("*")
    .maybeSingle();
  if (!profile) return null;

  // Fetch the public.users row for full_name.
  const { data: userRow } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", authUser.id)
    .maybeSingle();

  // Fetch sections ordered by position.
  const { data: dbSections } = await supabase
    .from("digest_sections")
    .select("*")
    .eq("digest_profile_id", profile.id)
    .order("position");

  // Fetch delivery settings.
  const { data: deliveryRow } = await supabase
    .from("delivery_settings")
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();

  // Map DB rows → app types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections: DigestSection[] = (dbSections ?? []).map((s: any) => ({
    id: s.id,
    title: s.title ?? "",
    type: toAppType(s.section_type),
    order: s.position,
    enabled: s.is_enabled,
    mode: "brief" as const,
    config: (s.config as Record<string, unknown>) ?? {},
  }));

  // "HH:MM:SS" → "HH:MM"
  const deliveryTime = (deliveryRow?.delivery_time ?? "07:00:00").slice(0, 5);

  const delivery: DeliverySettings = {
    time: deliveryTime,
    timezone: profile.timezone,
    channels: ["email"],
    email: deliveryRow?.delivery_email ?? authUser.email ?? "",
  };

  const now = new Date().toISOString();

  const user: User = {
    id: authUser.id,
    name: userRow?.full_name ?? authUser.email ?? "",
    email: userRow?.email ?? authUser.email,
    timezone: profile.timezone,
    createdAt: authUser.created_at ?? now,
    updatedAt: now,
  };

  const subscription: DigestSubscription = {
    id: profile.id,
    userId: authUser.id,
    name: profile.name,
    sections,
    delivery,
    status: profile.is_active ? "active" : "paused",
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };

  return { user, subscription };
}
