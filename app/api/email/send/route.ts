import { NextRequest, NextResponse } from "next/server";
import { generateDigest, digestToHTML } from "@/lib/digest/generate";
import { sendDigestEmail } from "@/lib/email/send";
import type { DigestSection, DeliverySettings } from "@/lib/types";

interface SendEmailRequest {
  email: string;
  userName: string;
  sections: DigestSection[];
  deliverySettings: DeliverySettings;
}

export async function POST(req: NextRequest) {
  try {
    const body: SendEmailRequest = await req.json();
    const { email, userName, sections } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (!sections?.length) {
      return NextResponse.json({ error: "sections is required" }, { status: 400 });
    }

    const date = new Date().toISOString().split("T")[0];
    const digest = await generateDigest(sections, date);
    const html = digestToHTML(digest, userName ?? "Friend");

    const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    await sendDigestEmail(email, userName ?? "Friend", html, dateLabel);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[/api/email/send]", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
