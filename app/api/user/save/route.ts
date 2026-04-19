import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveUserData } from "@/lib/supabase/user-data";
import type { SavePreferencesRequest, SavePreferencesResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body: SavePreferencesRequest = await req.json();

    if (!body.user?.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.subscription?.sections?.length) {
      return NextResponse.json({ error: "At least one section is required" }, { status: 400 });
    }

    await saveUserData(supabase, user.id, {
      name: body.user.name,
      sections: body.subscription.sections,
      delivery: body.subscription.delivery,
    });

    const response: SavePreferencesResponse = {
      success: true,
      userId: user.id,
      subscriptionId: user.id,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[/api/user/save]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
