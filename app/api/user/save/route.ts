/**
 * POST /api/user/save
 *
 * Saves or updates a user profile and digest subscription.
 *
 * In production, this would:
 * 1. Validate the request payload
 * 2. Upsert the user record in your database (Postgres/Supabase/Prisma)
 * 3. Upsert the subscription record
 * 4. Schedule the digest job via a cron service (see /api/digest/schedule)
 * 5. Return the new IDs
 */
import { NextRequest, NextResponse } from "next/server";
import { SavePreferencesRequest, SavePreferencesResponse } from "@/lib/types";
import { generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body: SavePreferencesRequest = await req.json();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!body.user?.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!body.subscription?.sections?.length) {
      return NextResponse.json({ error: "At least one section is required" }, { status: 400 });
    }

    if (!body.subscription?.delivery?.channels?.length) {
      return NextResponse.json({ error: "At least one delivery channel is required" }, { status: 400 });
    }

    // ── Mock DB write (replace with real DB calls) ───────────────────────────
    // e.g. await db.user.upsert({ where: { email: body.user.email }, ... })
    const userId = generateId();
    const subscriptionId = generateId();

    // ── Schedule the digest job ──────────────────────────────────────────────
    // In production:
    //   await scheduleDigestJob({ subscriptionId, time: body.subscription.delivery.time, timezone: body.subscription.delivery.timezone })
    // This would create a cron job in your scheduler (see architecture notes in README)

    const response: SavePreferencesResponse = {
      success: true,
      userId,
      subscriptionId,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[/api/user/save]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
