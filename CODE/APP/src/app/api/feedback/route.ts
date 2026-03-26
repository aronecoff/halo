import { NextResponse } from "next/server";
import { createClientFromRequest, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Try to get userId from session (non-blocking)
    let userId: string | null = null;
    try {
      const supabase = createClientFromRequest(request);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    } catch {
      userId = null;
    }

    // Parse body
    const body = await request.json();
    const { matchId, response, notes, dimensionRatings } = body as {
      matchId: string;
      response: "yes" | "no" | "maybe";
      notes?: string;
      dimensionRatings?: Record<string, number>;
    };

    if (!matchId || !response) {
      return NextResponse.json(
        { error: "matchId and response are required" },
        { status: 400 }
      );
    }

    if (!["yes", "no", "maybe"].includes(response)) {
      return NextResponse.json(
        { error: "response must be 'yes', 'no', or 'maybe'" },
        { status: 400 }
      );
    }

    // Validate dimension ratings if provided (each should be 0-1)
    if (dimensionRatings) {
      for (const [key, val] of Object.entries(dimensionRatings)) {
        if (typeof val !== "number" || val < 0 || val > 1) {
          return NextResponse.json(
            { error: `Invalid rating for ${key}: must be 0-1` },
            { status: 400 }
          );
        }
      }
    }

    const serviceClient = createServiceClient();

    // Verify the user is part of this match
    const { data: match, error: matchError } = await serviceClient
      .from("matches")
      .select("id, user_a_id, user_b_id")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (userId && match.user_a_id !== userId && match.user_b_id !== userId) {
      return NextResponse.json(
        { error: "You are not part of this match" },
        { status: 403 }
      );
    }

    // Insert feedback with dimension ratings
    const { error: feedbackError } = await serviceClient
      .from("match_feedback")
      .insert({
        match_id: matchId,
        user_id: userId,
        response,
        notes: notes || null,
        dimension_ratings: dimensionRatings || null,
      });

    if (feedbackError) {
      console.error("Feedback insert error:", feedbackError);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    // Update match status to completed
    const { error: updateError } = await serviceClient
      .from("matches")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateError) {
      console.error("Match status update error:", updateError);
      return NextResponse.json({
        success: true,
        warning: "Feedback saved but match status update failed",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Feedback error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
