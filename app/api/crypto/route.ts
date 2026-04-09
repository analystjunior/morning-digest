import { NextRequest, NextResponse } from "next/server";
import { fetchCryptoData } from "@/lib/digest/sections/crypto";

// GET /api/crypto?coins=bitcoin,ethereum,solana
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("coins");
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Missing coins parameter" }, { status: 400 });
  }

  const coins = raw
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  if (!coins.length) {
    return NextResponse.json({ error: "No valid coin IDs provided" }, { status: 400 });
  }

  try {
    const data = await fetchCryptoData({ coins });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/crypto]", err);
    return NextResponse.json({ error: "Failed to fetch crypto prices", detail: message }, { status: 500 });
  }
}
