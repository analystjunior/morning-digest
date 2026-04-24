import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateDigest, digestToHTML } from "@/lib/digest/generate";
import { sendDigestEmail } from "@/lib/email/send";
import type { DigestSection, SectionType } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

// DB enum "stocks" maps to app type "finance"
const DB_TO_APP: Record<string, SectionType> = { stocks: "finance" };
function toAppType(t: string): SectionType {
  return (DB_TO_APP[t] ?? t) as SectionType;
}

export async function GET(req: NextRequest) {
  // Vercel automatically sets Authorization: Bearer <CRON_SECRET> on cron invocations.
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const date = new Date().toISOString().split("T")[0];
  const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Fetch all active delivery configs with related profile and user.
  const { data: rawDelivery, error: deliveryError } = await supabase
    .from("delivery_settings")
    .select(`
      user_id,
      delivery_email,
      digest_profile_id,
      digest_profiles ( id, is_active ),
      users ( email, full_name )
    `)
    .eq("is_enabled", true) as { data: Row[] | null; error: Row };

  if (deliveryError) {
    console.error("[cron/send-digests] delivery_settings query failed:", deliveryError.message);
    return NextResponse.json({ error: deliveryError.message }, { status: 500 });
  }

  // Filter to users whose digest profile is active.
  const deliveryRows: Row[] = (rawDelivery ?? []).filter(
    (r) => r.digest_profiles?.is_active === true
  );

  if (deliveryRows.length === 0) {
    return NextResponse.json({ success: true, sent: 0, failed: 0, message: "No active subscribers" });
  }

  // Batch-fetch all sections for the active profiles.
  const profileIds: string[] = deliveryRows.map((r) => r.digest_profile_id);
  const { data: rawSections, error: sectionsError } = await supabase
    .from("digest_sections")
    .select("*")
    .in("digest_profile_id", profileIds)
    .eq("is_enabled", true)
    .order("position") as { data: Row[] | null; error: Row };

  if (sectionsError) {
    console.error("[cron/send-digests] digest_sections query failed:", sectionsError.message);
    return NextResponse.json({ error: sectionsError.message }, { status: 500 });
  }

  // Group sections by profile id.
  const sectionsByProfile: Record<string, DigestSection[]> = {};
  for (const s of rawSections ?? []) {
    const key = s.digest_profile_id as string;
    if (!sectionsByProfile[key]) sectionsByProfile[key] = [];
    sectionsByProfile[key].push({
      id: s.id as string,
      title: (s.title as string) ?? "",
      type: toAppType(s.section_type as string),
      order: s.position as number,
      enabled: true,
      mode: "brief",
      config: (s.config as Record<string, unknown>) ?? {},
    });
  }

  // Send digests — same proven path as /api/email/send.
  const results = await Promise.allSettled(
    deliveryRows.map(async (row: Row) => {
      const email = (row.delivery_email as string | null) ?? (row.users?.email as string);
      const userName = (row.users?.full_name as string | null) ?? email ?? "Friend";
      const profileId = row.digest_profile_id as string;
      const sections = sectionsByProfile[profileId] ?? [];

      if (!email) throw new Error(`No email for user ${row.user_id}`);
      if (sections.length === 0) throw new Error(`No sections for profile ${profileId}`);

      const digest = await generateDigest(sections, date);
      const html = digestToHTML(digest, userName);
      await sendDigestEmail(email, userName, html, dateLabel);

      // Record delivery timestamp.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("delivery_settings")
        .update({ last_delivered_at: new Date().toISOString() })
        .eq("user_id", row.user_id as string);

      console.log(`[cron/send-digests] sent → ${email} (profile ${profileId})`);
      return email;
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => r.reason?.message ?? String(r.reason));

  console.log(`[cron/send-digests] done — sent: ${sent}, failed: ${failed}`);

  return NextResponse.json({
    success: true,
    ranAt: new Date().toISOString(),
    date,
    sent,
    failed,
    ...(errors.length > 0 && { errors }),
  });
}
