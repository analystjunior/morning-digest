import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendDigestEmail(
  to: string,
  userName: string,
  digestHtml: string,
  date: string
): Promise<void> {
  const { error } = await getResend().emails.send({
    from: "The Paper Route <onboarding@resend.dev>",
    to,
    subject: `Your Morning Digest — ${date}`,
    html: digestHtml,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
