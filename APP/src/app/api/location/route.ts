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
    const { lat, lng } = body as { lat: number; lng: number };

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "lat and lng must be numbers" },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Could not determine user" },
        { status: 400 }
      );
    }

    // Update user location
    const serviceClient = createServiceClient();
    const { error: updateError } = await serviceClient
      .from("users")
      .update({
        location_lat: lat,
        location_lng: lng,
        location_updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Location update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update location" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Location error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
