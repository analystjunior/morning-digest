import { NextRequest, NextResponse } from "next/server";
import { fetchCryptoData } from "@/lib/digest/sections/crypto";

// GET /api/crypto?coins=bitcoin,ethereum,solana
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("coins");
  const coins = raw
    ? raw.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean)
    : ["bitcoin", "ethereum", "solana"];

  try {
    const data = await fetchCryptoData(coins);
    return NextResponse.json({ coins: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/crypto]", err);
    return NextResponse.json({ error: "Failed to fetch crypto prices", detail: message }, { status: 500 });
  }
}
