/**
 * GET /api/digest/cron
 *
 * Hourly cron endpoint — called by Vercel Cron (or external scheduler) once per hour.
 * Finds all subscriptions whose digest is due in this hour (UTC) and triggers generation.
 *
 * Add this to vercel.json to enable:
 * {
 *   "crons": [{
 *     "path": "/api/digest/cron",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * Security: protect this endpoint with a secret header so only your scheduler can call it.
 *   const authHeader = req.headers.get("authorization")
 *   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return 401
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Verify cron secret (uncomment in production)
  // const authHeader = req.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const nowUtc = new Date();
  const currentHour = nowUtc.getUTCHours();
  const currentMinute = nowUtc.getUTCMinutes();

  // ── In production: query DB for due subscriptions ────────────────────────
  // const dueSubscriptions = await db.subscription.findMany({
  //   where: {
  //     status: "active",
  //     delivery: {
  //       utcHour: currentHour,
  //       utcMinute: { gte: currentMinute - 5, lte: currentMinute + 5 }, // 10-min window
  //     }
  //   }
  // })
  //
  // await Promise.all(dueSubscriptions.map(sub =>
  //   fetch(`${process.env.NEXT_PUBLIC_URL}/api/digest/generate`, {
  //     method: "POST",
  //     body: JSON.stringify({ subscriptionId: sub.id })
  //   })
  // ))

  console.log(`[cron] Ran at ${nowUtc.toISOString()} — hour ${currentHour}, minute ${currentMinute}`);

  return NextResponse.json({
    success: true,
    ranAt: nowUtc.toISOString(),
    message: "Cron executed. In production, this triggers digest generation for all due subscriptions.",
  });
}
