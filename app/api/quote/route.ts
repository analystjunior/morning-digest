import { NextResponse } from "next/server";
import { fetchQuoteData } from "@/lib/digest/sections/quote";

export async function GET() {
  try {
    const data = await fetchQuoteData();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/quote] Error:", err);
    return NextResponse.json({ error: "Failed to fetch quote", detail: message }, { status: 500 });
  }
}
