import { Resend } from "resend";
import type { GeneratedDigest } from "@/lib/types";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function buildHtml(digest: GeneratedDigest, userName: string): string {
  const dayStr = new Date(digest.date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const sectionsHtml = digest.sections
    .map(
      (section) => `
    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#111827;">
        ${section.emoji} ${section.title}
      </h2>
      <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.7;font-size:15px;">
        ${section.items
          .map(
            (item) =>
              `<li style="margin-bottom:6px;">${item.text}${
                item.source
                  ? ` <span style="font-size:12px;color:#9ca3af;">— ${item.source}</span>`
                  : ""
              }</li>`
          )
          .join("")}
      </ul>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;font-weight:500;">Your Morning Digest</p>
        <h1 style="margin:0;font-size:26px;font-weight:700;color:#111827;">${dayStr}</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">Good morning, ${userName} 👋</p>
      </div>

      ${sectionsHtml}

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          Sent by <strong>Briefd</strong> · <a href="#" style="color:#9ca3af;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildText(digest: GeneratedDigest, userName: string): string {
  const dayStr = new Date(digest.date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const sections = digest.sections
    .map((section) => {
      const items = section.items.map((i) => `  • ${i.text}${i.source ? ` (${i.source})` : ""}`).join("\n");
      return `${section.emoji} ${section.title}\n${items}`;
    })
    .join("\n\n");

  return `Good morning, ${userName}!\nYour Briefd digest for ${dayStr}\n\n${sections}\n\n—\nSent by Briefd`;
}

export async function sendDigestEmail({
  to,
  digest,
  userName,
}: {
  to: string;
  digest: GeneratedDigest;
  userName: string;
}): Promise<void> {
  const dayStr = new Date(digest.date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const { error } = await getResend().emails.send({
    from: "Briefd <onboarding@resend.dev>",
    to,
    subject: `Your Morning Digest — ${dayStr}`,
    html: buildHtml(digest, userName),
    text: buildText(digest, userName),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
