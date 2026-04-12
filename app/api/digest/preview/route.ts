import { NextRequest, NextResponse } from "next/server";
import { PreviewDigestRequest, PreviewDigestResponse } from "@/lib/types";
import { generateDigestHTML } from "@/lib/digest/agent";

export async function POST(req: NextRequest) {
  try {
    const body: PreviewDigestRequest = await req.json();

    if (!body.sections?.length) {
      return NextResponse.json({ error: "sections is required" }, { status: 400 });
    }

    const userName = body.userName ?? "Friend";
    const html = await generateDigestHTML(body.sections, userName);
    const response: PreviewDigestResponse = { html };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[/api/digest/preview]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
