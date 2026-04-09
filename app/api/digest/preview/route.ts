/**
 * POST /api/digest/preview
 *
 * Generates a preview digest for the given sections.
 *
 * In production, this would:
 * 1. For each enabled section, call the content pipeline:
 *    a. Fetch raw content from configured sources (news APIs, RSS, web search)
 *    b. Pass to an LLM (OpenAI / Anthropic Claude) with the section prompt
 *    c. Receive back formatted bullet points
 * 2. Assemble into a GeneratedDigest
 * 3. Return it
 *
 * Example LLM integration (see README for full details):
 *   import Anthropic from "@anthropic-ai/sdk"
 *   const client = new Anthropic()
 *   const message = await client.messages.create({
 *     model: "claude-opus-4-6",
 *     max_tokens: 1024,
 *     messages: [{ role: "user", content: `Summarize today's ${section.title} news in 3 bullet points. Sources: ${section.sources?.join(", ")}. Instructions: ${section.prompt}` }]
 *   })
 */
import { NextRequest, NextResponse } from "next/server";
import { PreviewDigestRequest, PreviewDigestResponse } from "@/lib/types";
import { generateDigest } from "@/lib/digest/generate";

export async function POST(req: NextRequest) {
  try {
    const body: PreviewDigestRequest = await req.json();

    if (!body.sections?.length) {
      return NextResponse.json({ error: "sections is required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const digest = await generateDigest(body.sections, today);

    const response: PreviewDigestResponse = { digest };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[/api/digest/preview]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
