import { NextRequest, NextResponse } from "next/server";
import { MOCK_SUBSCRIPTION, MOCK_USER } from "@/lib/mock-data";
import { generateDigest } from "@/lib/digest/generate";
import { sendDigestEmail } from "@/lib/digest/email";

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 });
    }

    // TODO: replace with real DB query once Supabase is wired up
    // const subscription = await db.subscription.findUnique({ where: { id: subscriptionId } })
    // const user = await db.user.findUnique({ where: { id: subscription.userId } })
    const subscription = MOCK_SUBSCRIPTION;
    const user = MOCK_USER;

    const today = new Date().toISOString().split("T")[0];
    const digest = await generateDigest(subscription.sections, today);
    digest.subscriptionId = subscriptionId;
    digest.channels = subscription.delivery.channels;

    if (subscription.delivery.channels.includes("email") && subscription.delivery.email) {
      await sendDigestEmail({
        to: subscription.delivery.email,
        digest,
        userName: user.name,
      });
      console.log(`[digest/generate] Email sent to ${subscription.delivery.email}`);
    }

    digest.status = "sent";
    digest.sentAt = new Date().toISOString();

    // TODO: save to DB
    // await db.generatedDigest.create({ data: { ...digest, status: "sent", sentAt: new Date() } })

    return NextResponse.json({ success: true, digestId: digest.id }, { status: 200 });
  } catch (err) {
    console.error("[/api/digest/generate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
