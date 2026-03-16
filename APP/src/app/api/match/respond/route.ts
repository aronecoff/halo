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
    const { matchId, response } = body as {
      matchId: string;
      response: "accept" | "decline";
    };

    if (!matchId || !response) {
      return NextResponse.json(
        { error: "matchId and response are required" },
        { status: 400 }
      );
    }

    if (response !== "accept" && response !== "decline") {
      return NextResponse.json(
        { error: "response must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Fetch the match
    const { data: match, error: matchError } = await serviceClient
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Validate the user is part of this match
    const isUserA = userId ? match.user_a_id === userId : false;
    const isUserB = userId ? match.user_b_id === userId : false;

    if (userId && !isUserA && !isUserB) {
      return NextResponse.json(
        { error: "You are not part of this match" },
        { status: 403 }
      );
    }

    // Handle decline
    if (response === "decline") {
      const { error: updateError } = await serviceClient
        .from("matches")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (updateError) {
        console.error("Match decline error:", updateError);
        return NextResponse.json(
          { error: "Failed to update match" },
          { status: 500 }
        );
      }

      return NextResponse.json({ status: "declined" });
    }

    // Handle accept
    let newStatus: string;
    const currentStatus = match.status;

    if (isUserA) {
      if (currentStatus === "accepted_b") {
        // Both have now accepted
        newStatus = "confirmed";
      } else {
        newStatus = "accepted_a";
      }
    } else {
      // isUserB
      if (currentStatus === "accepted_a") {
        // Both have now accepted
        newStatus = "confirmed";
      } else {
        newStatus = "accepted_b";
      }
    }

    const { error: updateError } = await serviceClient
      .from("matches")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateError) {
      console.error("Match accept error:", updateError);
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: newStatus });
  } catch (error: unknown) {
    console.error("Match respond error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
