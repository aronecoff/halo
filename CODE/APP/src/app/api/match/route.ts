import { NextResponse } from "next/server";
import { createClientFromRequest, createServiceClient } from "@/lib/supabase/server";
import { computeMatch, type Profile } from "@/lib/matching-engine";
import { computePersonalizedWeights, getVenuePreference } from "@/lib/learning-engine";
import { rateLimit } from "@/lib/rate-limit";

// Curated SF venues — scored by ambiance for first meetings
const SF_VENUES = [
  { name: "Saint Frank Coffee", area: "Russian Hill", short: "Saint Frank", lat: 37.7986, lng: -122.4189, vibe: "minimal" },
  { name: "Sightglass Coffee", area: "SoMa", short: "Sightglass", lat: 37.7756, lng: -122.4085, vibe: "industrial" },
  { name: "The Mill", area: "NoPa", short: "The Mill", lat: 37.7764, lng: -122.4378, vibe: "warm" },
  { name: "Equator Coffees", area: "Fort Mason", short: "Equator", lat: 37.8063, lng: -122.4305, vibe: "outdoor" },
  { name: "Andytown Coffee", area: "Outer Sunset", short: "Andytown", lat: 37.7529, lng: -122.5059, vibe: "cozy" },
  { name: "Hollow", area: "Inner Sunset", short: "Hollow", lat: 37.7612, lng: -122.4651, vibe: "intimate" },
  { name: "Reveille Coffee", area: "North Beach", short: "Reveille", lat: 37.7998, lng: -122.4082, vibe: "lively" },
  { name: "Flywheel Coffee", area: "Upper Haight", short: "Flywheel", lat: 37.7697, lng: -122.4435, vibe: "chill" },
  { name: "Ritual Coffee", area: "Mission", short: "Ritual", lat: 37.7565, lng: -122.4211, vibe: "classic" },
  { name: "Four Barrel Coffee", area: "Mission", short: "Four Barrel", lat: 37.7572, lng: -122.4211, vibe: "raw" },
  { name: "Blue Bottle Hayes", area: "Hayes Valley", short: "Blue Bottle", lat: 37.7763, lng: -122.4233, vibe: "minimal" },
  { name: "Wrecking Ball Coffee", area: "Cow Hollow", short: "Wrecking Ball", lat: 37.7983, lng: -122.4363, vibe: "bright" },
];

const TIME_SLOTS = ["10:00 AM", "10:30 AM", "11:00 AM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];
const DAYS = ["Saturday", "Sunday"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick the venue closest to the midpoint between two users */
function pickVenueByLocation(
  userALat: number | null, userALng: number | null,
  userBLat: number | null, userBLng: number | null,
  venuePref: { lat: number; lng: number } | null,
): typeof SF_VENUES[0] {
  // If we have both locations, pick venue nearest to midpoint
  if (userALat && userALng && userBLat && userBLng) {
    const midLat = (userALat + userBLat) / 2;
    const midLng = (userALng + userBLng) / 2;
    return pickNearestVenue(midLat, midLng);
  }

  // If we have a venue preference from feedback history, use that
  if (venuePref) {
    return pickNearestVenue(venuePref.lat, venuePref.lng);
  }

  // If we have one user's location, pick near them
  if (userALat && userALng) return pickNearestVenue(userALat, userALng);
  if (userBLat && userBLng) return pickNearestVenue(userBLat, userBLng);

  // No location data — random
  return pickRandom(SF_VENUES);
}

function pickNearestVenue(lat: number, lng: number): typeof SF_VENUES[0] {
  let best = SF_VENUES[0];
  let bestDist = Infinity;
  for (const v of SF_VENUES) {
    const dist = Math.sqrt((v.lat - lat) ** 2 + (v.lng - lng) ** 2);
    if (dist < bestDist) {
      bestDist = dist;
      best = v;
    }
  }
  return best;
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

// POST: Find the best match for the current authenticated user
export async function POST(request: Request) {
  try {
    // Rate limit — 10 match requests per minute
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = rateLimit(`match:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Get current user
    let userId: string | null = null;
    try {
      const supabase = createClientFromRequest(request);
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    } catch {
      userId = null;
    }

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Check if user already has an active match
    const { data: existingMatch } = await serviceClient
      .from("matches")
      .select("*")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .not("status", "in", '("completed","declined")')
      .limit(1)
      .maybeSingle();

    if (existingMatch) {
      const partnerId = existingMatch.user_a_id === userId ? existingMatch.user_b_id : existingMatch.user_a_id;
      const { data: partner } = await serviceClient.from("users").select("name").eq("id", partnerId).single();
      return NextResponse.json({
        match: { ...existingMatch, other_user_name: partner?.name || "Your match" },
      });
    }

    // Get all users with completed onboarding (excluding current user)
    const { data: eligibleUsers, error: usersError } = await serviceClient
      .from("users")
      .select("id, name")
      .eq("onboarding_complete", true)
      .neq("id", userId);

    if (usersError) {
      console.error("Users query error:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!eligibleUsers || eligibleUsers.length < 1) {
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

    const candidates = eligibleUsers.filter(u => !matched.has(u.id));
    if (candidates.length < 1) {
      return NextResponse.json({ error: "No available users to match with" }, { status: 404 });
    }

    // Fetch current user's profile + all candidate profiles
    const allIds = [userId, ...candidates.map(u => u.id)];
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("*")
      .in("user_id", allIds);

    if (profilesError || !profiles) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    const myProfile = profiles.find(p => p.user_id === userId);
    const candidateProfiles = profiles.filter(p => p.user_id !== userId);

    if (!myProfile || candidateProfiles.length < 1) {
      return NextResponse.json({ error: "Not enough profiles for matching" }, { status: 404 });
    }

    // Learn from past feedback to personalize weights
    const personalizedWeights = await computePersonalizedWeights(serviceClient, userId);
    const venuePref = await getVenuePreference(serviceClient, userId);

    // Run matching engine: current user vs every candidate
    let bestResult: ReturnType<typeof computeMatch> | null = null;
    let bestCandidate: string | null = null;

    for (const candidate of candidateProfiles) {
      const result = computeMatch(myProfile as Profile, candidate as Profile, personalizedWeights);
      if (!bestResult || result.score > bestResult.score) {
        bestResult = result;
        bestCandidate = candidate.user_id;
      }
    }

    if (!bestResult || !bestCandidate) {
      return NextResponse.json({ error: "Could not compute match" }, { status: 500 });
    }

    const partnerName = candidates.find(u => u.id === bestCandidate)?.name || "Your match";

    // Get user locations for venue selection
    const { data: userA } = await serviceClient.from("users").select("location_lat, location_lng").eq("id", userId).single();
    const { data: userB } = await serviceClient.from("users").select("location_lat, location_lng").eq("id", bestCandidate).single();

    // Pick venue based on location intelligence
    const venue = pickVenueByLocation(
      userA?.location_lat, userA?.location_lng,
      userB?.location_lat, userB?.location_lng,
      venuePref,
    );
    const day = pickRandom(DAYS);
    const time = pickRandom(TIME_SLOTS);

    // Create match record
    const { data: newMatch, error: insertError } = await serviceClient
      .from("matches")
      .insert({
        user_a_id: userId,
        user_b_id: bestCandidate,
        status: "pending",
        compatibility_score: bestResult.score,
        venue: { name: venue.name, area: venue.area, short: venue.short, lat: venue.lat, lng: venue.lng },
        meeting_day: day,
        meeting_time: time,
        conversation_starter: bestResult.conversationStarter,
        shared_traits: bestResult.sharedTraits,
        iris_description: bestResult.irisNarrative,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Match insert error:", insertError);
      return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
    }

    return NextResponse.json({
      match: {
        ...newMatch,
        other_user_name: partnerName,
        match_dimensions: bestResult.dimensions,
        complementary_traits: bestResult.complementaryTraits,
        risk_factors: bestResult.riskFactors,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Match POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
