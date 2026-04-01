import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Vary tone based on day of year so consecutive previews feel different
function getToneInstruction(): string {
  const tones = [
    "witty and a little irreverent — something that makes you smile or think sideways",
    "quietly profound — the kind of observation that stays with you all day",
    "deadpan funny — dry humor from a philosopher, scientist, or writer",
    "unexpectedly practical — wisdom that sounds simple but cuts deep",
    "poetic and a little melancholy — beautiful in a bittersweet way",
    "sharp and contrarian — challenges a common assumption",
    "warmly human — about friendship, time, or being alive",
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return tones[dayOfYear % tones.length];
}

export async function GET() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("[/api/quote] GEMINI_API_KEY is not set");
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  const tone = getToneInstruction();

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      systemInstruction: `You generate daily quotes for a morning briefing app called The Paper Route.
Return ONLY a JSON object with two fields: "quote" (the quote text, no quotation marks around it) and "author" (the person's name and, if relevant, a brief descriptor like their role or era — keep it short).
No other text, no markdown, no explanation. Just the raw JSON object.`,
    });

    const result = await model.generateContent(
      `Give me a single quote that is ${tone}. Avoid overused motivational quotes. Prefer lesser-known gems from writers, scientists, comedians, philosophers, or historical figures. The quote should feel like a discovery, not a poster.`
    );

    const text = result.response.text().trim();

    // Strip any accidental markdown fences
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(clean) as { quote: string; author: string };

    if (!parsed.quote || !parsed.author) {
      throw new Error("Gemini response missing 'quote' or 'author' fields");
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/quote] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate quote", detail: message },
      { status: 500 }
    );
  }
}
