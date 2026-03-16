import { NextResponse } from "next/server";
import { createServiceClient, createClientFromRequest } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Try to get user ID from session, fall back to service client for testing
    let userId: string | null = null;
    try {
      const supabase = createClientFromRequest(request);
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
    } catch {}

    // Parse body
    const body = await request.json();
    const { profile, conversation, name } = body as {
      profile: Record<string, unknown>;
      conversation: Array<{ role: string; content: string }>;
      name?: string;
    };

    if (!profile) {
      return NextResponse.json(
        { error: "profile is required" },
        { status: 400 }
      );
    }

    // If no authenticated user, still return success (profile lives in client state)
    if (!userId) {
      return NextResponse.json({ success: true, persisted: false });
    }

    // Use service client for reliable DB writes
    const supabase = createServiceClient();

    // Upsert into profiles table
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        summary: profile.summary,
        eq_score: profile.eqScore,
        traits: profile.traits,
        personality_nodes: profile.personalityNodes,
        personality_edges: profile.personalityEdges,
        intent_profile: profile.intentProfile,
        core_values: profile.coreValues,
        raw_conversation: conversation || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      return NextResponse.json(
        { error: "Failed to save profile" },
        { status: 500 }
      );
    }

    // Update users table
    const userUpdate: Record<string, unknown> = {
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };

    if (name) {
      userUpdate.name = name;
    }

    const { error: userError } = await supabase
      .from("users")
      .update(userUpdate)
      .eq("id", userId);

    if (userError) {
      console.error("User update error:", userError);
    }

    return NextResponse.json({ success: true, persisted: true });
  } catch (error: unknown) {
    console.error("Profile finalize error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
