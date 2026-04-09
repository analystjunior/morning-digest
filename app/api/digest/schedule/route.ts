/**
 * POST /api/digest/schedule
 *
 * Creates or updates a scheduled job for a subscription's daily digest.
 *
 * ─── Scheduling architecture ─────────────────────────────────────────────────
 *
 * This is the glue between user preferences and the daily send. Options:
 *
 * OPTION A — Vercel Cron Jobs (simplest for Next.js)
 *   - Add to vercel.json:
 *     { "crons": [{ "path": "/api/digest/cron", "schedule": "0 * * * *" }] }
 *   - The cron endpoint queries all subscriptions due to run in this hour,
 *     converts times to UTC, and calls /api/digest/generate for each.
 *
 * OPTION B — External scheduler (recommended for production scale)
 *   - Trigger.dev, Inngest, or Quirrel
 *   - On user signup/update: create a scheduled job with user-specific timing
 *   - The scheduler calls /api/digest/generate at the exact UTC time
 *   - Example (Trigger.dev):
 *     await client.sendEvent({ name: "digest.schedule", payload: { subscriptionId, cronExpression } })
 *
 * OPTION C — Database + polling worker
 *   - Store next_run_at UTC timestamp per subscription
 *   - A background worker (Railway, Render, Fly.io) polls every minute:
 *     SELECT * FROM subscriptions WHERE next_run_at <= NOW() AND status = 'active'
 *   - Generates and sends for each match, then updates next_run_at += 24h
 *
 * ─── Time zone math ──────────────────────────────────────────────────────────
 *
 * Always store times in UTC. To convert user's local time to a UTC cron expression:
 *   import { fromZonedTime } from "date-fns-tz"
 *   const utcTime = fromZonedTime(`${today} ${userTime}`, userTimezone)
 *   const cronExpression = `${utcTime.getMinutes()} ${utcTime.getHours()} * * *`
 */
import { NextRequest, NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, time, timezone } = await req.json();

    if (!subscriptionId || !time || !timezone) {
      return NextResponse.json(
        { error: "subscriptionId, time, and timezone are required" },
        { status: 400 }
      );
    }

    // Convert user's local time to UTC for scheduling
    const [hours, minutes] = time.split(":").map(Number);
    const today = new Date().toISOString().split("T")[0];
    const localDate = new Date(`${today}T${time}:00`);
    const utcDate = fromZonedTime(localDate, timezone);

    const utcHours = utcDate.getUTCHours();
    const utcMinutes = utcDate.getUTCMinutes();
    const cronExpression = `${utcMinutes} ${utcHours} * * *`;

    // ── In production: register with your scheduler ───────────────────────────
    // e.g. await triggerClient.schedules.create({ cron: cronExpression, task: "generate-digest", payload: { subscriptionId } })

    console.log(
      `[mock] Scheduled subscription ${subscriptionId} at ${time} ${timezone} → UTC cron: ${cronExpression}`
    );

    return NextResponse.json(
      { success: true, cronExpression, utcHours, utcMinutes },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/digest/schedule]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
