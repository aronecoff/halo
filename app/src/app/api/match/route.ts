import { NextResponse } from "next/server";
import { createClientFromRequest, createServiceClient } from "@/lib/supabase/server";
import { computeMatch, type Profile } from "@/lib/matching-engine";

// Curated SF venues — scored by ambiance for first meetings
const SF_VENUES = [
  { name: "Saint Frank Coffee", area: "Russian Hill, SF", short: "Saint Frank", lat: 37.7986, lng: -122.4189 },
  { name: "Sightglass Coffee", area: "SoMa, SF", short: "Sightglass", lat: 37.7756, lng: -122.4085 },
  { name: "The Mill", area: "NoPa, SF", short: "The Mill", lat: 37.7764, lng: -122.4378 },
  { name: "Equator Coffees", area: "Fort Mason, SF", short: "Equator", lat: 37.8063, lng: -122.4305 },
  { name: "Andytown Coffee", area: "Outer Sunset, SF", short: "Andytown", lat: 37.7529, lng: -122.5059 },
  { name: "Hollow", area: "Inner Sunset, SF", short: "Hollow", lat: 37.7612, lng: -122.4651 },
  { name: "Reveille Coffee", area: "North Beach, SF", short: "Reveille", lat: 37.7998, lng: -122.4082 },
  { name: "Flywheel Coffee", area: "Upper Haight, SF", short: "Flywheel", lat: 37.7697, lng: -122.4435 },
];

const TIME_SLOTS = ["10:00 AM", "10:30 AM", "11:00 AM", "2:00 PM", "2:30 PM", "3:00 PM"];
const DAYS = ["Saturday", "Sunday"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// GET: Return current active match for user
export async function GET(request: Request) {
  try {
    let userId: string | null = null;
    try {
      const supabase = createClientFromRequest(request);
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    } catch {
      userId = null;
    }

    if (!userId) {
      return NextResponse.json({ match: null });
    }

    const serviceClient = createServiceClient();

    const { data: match, error: matchError } = await serviceClient
      .from("matches")
      .select("*")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .not("status", "in", '("completed","declined")')
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (matchError) {
      console.error("Match query error:", matchError);
      return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
    }

    if (!match) {
      return NextResponse.json({ match: null });
    }

    const partnerId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;
    const { data: partner } = await serviceClient
      .from("users")
      .select("id, name")
      .eq("id", partnerId)
      .single();

    return NextResponse.json({
      match: { ...match, other_user_name: partner?.name || "Your match" },
    });
  } catch (error: unknown) {
    console.error("Match GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Run the matching engine
export async function POST() {
  try {
    const serviceClient = createServiceClient();

    // Get all users with completed onboarding
    const { data: eligibleUsers, error: usersError } = await serviceClient
      .from("users")
      .select("id, name")
      .eq("onboarding_complete", true);

    if (usersError) {
      console.error("Users query error:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!eligibleUsers || eligibleUsers.length < 2) {
      return NextResponse.json({ error: "Not enough users for matching" }, { status: 404 });
    }

    // Filter out users who already have an active match
    const { data: activeMatches } = await serviceClient
      .from("matches")
      .select("user_a_id, user_b_id")
      .not("status", "in", '("completed","declined")');

    const matched = new Set<string>();
    if (activeMatches) {
      for (const m of activeMatches) {
        matched.add(m.user_a_id);
        matched.add(m.user_b_id);
      }
    }

    const available = eligibleUsers.filter(u => !matched.has(u.id));
    if (available.length < 2) {
      return NextResponse.json({ error: "Not enough available users for matching" }, { status: 404 });
    }

    // Fetch full profiles with conversation data
    const userIds = available.map(u => u.id);
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("*")
      .in("user_id", userIds);

    if (profilesError || !profiles || profiles.length < 2) {
      return NextResponse.json({ error: "Not enough profiles for matching" }, { status: 404 });
    }

    // ═══ Run the matching engine on every pair ═══
    let bestResult: ReturnType<typeof computeMatch> | null = null;
    let bestPair: [string, string] | null = null;

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const result = computeMatch(profiles[i] as Profile, profiles[j] as Profile);
        if (!bestResult || result.score > bestResult.score) {
          bestResult = result;
          bestPair = [profiles[i].user_id, profiles[j].user_id];
        }
      }
    }

    if (!bestResult || !bestPair) {
      return NextResponse.json({ error: "Could not compute match" }, { status: 500 });
    }

    // Generate meeting details
    const venue = pickRandom(SF_VENUES);
    const day = pickRandom(DAYS);
    const time = pickRandom(TIME_SLOTS);

    const userAName = available.find(u => u.id === bestPair![0])?.name || "User A";
    const userBName = available.find(u => u.id === bestPair![1])?.name || "User B";

    // Create match record with full engine output
    const { data: newMatch, error: insertError } = await serviceClient
      .from("matches")
      .insert({
        user_a_id: bestPair[0],
        user_b_id: bestPair[1],
        status: "pending",
        compatibility_score: bestResult.score,
        venue: { name: venue.name, area: venue.area, short: venue.short, lat: venue.lat, lng: venue.lng },
        meeting_day: day,
        meeting_time: time,
        conversation_starter: bestResult.conversationStarter,
        shared_traits: bestResult.sharedTraits,
        iris_description: bestResult.irisNarrative,
        match_dimensions: bestResult.dimensions,
        complementary_traits: bestResult.complementaryTraits,
        risk_factors: bestResult.riskFactors,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Match insert error:", insertError);
      return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
    }

    return NextResponse.json({ match: newMatch }, { status: 201 });
  } catch (error: unknown) {
    console.error("Match POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
