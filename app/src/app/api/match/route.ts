import { NextResponse } from "next/server";
import { createClientFromRequest, createServiceClient } from "@/lib/supabase/server";

// Curated SF coffee shops with coordinates
const SF_VENUES = [
  {
    name: "Saint Frank Coffee",
    area: "Russian Hill, SF",
    short: "Saint Frank",
    lat: 37.7986,
    lng: -122.4189,
  },
  {
    name: "Sightglass Coffee",
    area: "SoMa, SF",
    short: "Sightglass",
    lat: 37.7756,
    lng: -122.4085,
  },
  {
    name: "The Mill",
    area: "NoPa, SF",
    short: "The Mill",
    lat: 37.7764,
    lng: -122.4378,
  },
  {
    name: "Equator Coffees",
    area: "Fort Mason, SF",
    short: "Equator",
    lat: 37.8063,
    lng: -122.4305,
  },
  {
    name: "Andytown Coffee",
    area: "Outer Sunset, SF",
    short: "Andytown",
    lat: 37.7529,
    lng: -122.5059,
  },
  {
    name: "Hollow",
    area: "Inner Sunset, SF",
    short: "Hollow",
    lat: 37.7612,
    lng: -122.4651,
  },
  {
    name: "Reveille Coffee",
    area: "North Beach, SF",
    short: "Reveille",
    lat: 37.7998,
    lng: -122.4082,
  },
  {
    name: "Flywheel Coffee",
    area: "Upper Haight, SF",
    short: "Flywheel",
    lat: 37.7697,
    lng: -122.4435,
  },
];

const CONVERSATION_STARTERS = [
  "Ask them what book changed how they see the world.",
  "Ask them about the last time they felt completely present.",
  "Ask them what they would build if money was not a factor.",
  "Ask them about the best conversation they have had this year.",
  "Ask them what they are most curious about right now.",
  "Ask them about a belief they held strongly that they later changed their mind on.",
  "Ask them what kind of silence feels comfortable to them.",
  "Ask them about the last thing that made them lose track of time.",
];

const TIME_SLOTS = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
];

const DAYS = ["Saturday", "Sunday"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Simple trait overlap scoring
function computeCompatibility(
  profileA: Record<string, unknown>,
  profileB: Record<string, unknown>
): number {
  let score = 60; // Base score

  // Compare core values overlap
  const valuesA = (profileA.core_values as string[]) || [];
  const valuesB = (profileB.core_values as string[]) || [];
  const sharedValues = valuesA.filter((v) =>
    valuesB.some((vb) => vb.toLowerCase() === v.toLowerCase())
  );
  score += sharedValues.length * 5;

  // Compare EQ scores (closer = better)
  const eqA = (profileA.eq_score as number) || 70;
  const eqB = (profileB.eq_score as number) || 70;
  const eqDiff = Math.abs(eqA - eqB);
  score += Math.max(0, 10 - eqDiff);

  // Compare traits overlap
  const traitsA = (profileA.traits as Array<{ label: string; value: string }>) || [];
  const traitsB = (profileB.traits as Array<{ label: string; value: string }>) || [];
  for (const tA of traitsA) {
    const match = traitsB.find((tB) => tB.label === tA.label);
    if (match) {
      score += 2;
      // Bonus for same value
      if (match.value === tA.value) {
        score += 3;
      }
    }
  }

  // Random variance (simulates factors we don't model yet)
  score += Math.floor(Math.random() * 8) - 4;

  // Clamp to range
  return Math.min(99, Math.max(60, score));
}

function generateSharedTraits(
  profileA: Record<string, unknown>,
  profileB: Record<string, unknown>
): string[] {
  const shared: string[] = [];
  const valuesA = (profileA.core_values as string[]) || [];
  const valuesB = (profileB.core_values as string[]) || [];

  for (const v of valuesA) {
    if (valuesB.some((vb) => vb.toLowerCase() === v.toLowerCase())) {
      shared.push(v);
    }
  }

  // Add generic complementary traits
  const possibleTraits = [
    "Deep curiosity",
    "Emotional security",
    "Direct communicator",
    "Active listener",
    "Values authenticity",
    "Growth oriented",
    "Intentional connector",
  ];

  while (shared.length < 4) {
    const trait = pickRandom(possibleTraits);
    if (!shared.includes(trait)) {
      shared.push(trait);
    }
  }

  return shared.slice(0, 6);
}

// GET: Return current active match for user
export async function GET(request: Request) {
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

    if (!userId) {
      return NextResponse.json({ match: null });
    }

    const serviceClient = createServiceClient();

    // Find active match where user is either user_a or user_b
    // Active = not completed and not declined
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
      return NextResponse.json(
        { error: "Failed to fetch match" },
        { status: 500 }
      );
    }

    if (!match) {
      return NextResponse.json({ match: null });
    }

    // Determine which user is the match partner
    const partnerId = match.user_a_id === userId ? match.user_b_id : match.user_a_id;

    // Fetch partner's basic info
    const { data: partner } = await serviceClient
      .from("users")
      .select("id, name")
      .eq("id", partnerId)
      .single();

    // Fetch partner's profile
    const { data: partnerProfile } = await serviceClient
      .from("profiles")
      .select("summary, eq_score, traits, core_values")
      .eq("user_id", partnerId)
      .single();

    return NextResponse.json({
      match: {
        ...match,
        other_user_name: partner?.name || "Your match",
      },
    });
  } catch (error: unknown) {
    console.error("Match GET error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Trigger match generation
export async function POST() {
  try {
    // Use service client to read all profiles
    const serviceClient = createServiceClient();

    // Get all users with completed onboarding
    const { data: eligibleUsers, error: usersError } = await serviceClient
      .from("users")
      .select("id, name")
      .eq("onboarding_complete", true);

    if (usersError) {
      console.error("Users query error:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!eligibleUsers || eligibleUsers.length < 2) {
      return NextResponse.json(
        { error: "Not enough users for matching" },
        { status: 404 }
      );
    }

    // Filter out users who already have an active match
    const { data: activeMatches } = await serviceClient
      .from("matches")
      .select("user_a_id, user_b_id")
      .not("status", "in", '("completed","declined")');

    const usersWithActiveMatch = new Set<string>();
    if (activeMatches) {
      for (const m of activeMatches) {
        usersWithActiveMatch.add(m.user_a_id);
        usersWithActiveMatch.add(m.user_b_id);
      }
    }

    const availableUsers = eligibleUsers.filter(
      (u) => !usersWithActiveMatch.has(u.id)
    );

    if (availableUsers.length < 2) {
      return NextResponse.json(
        { error: "Not enough available users for matching" },
        { status: 404 }
      );
    }

    // Fetch all profiles for available users
    const userIds = availableUsers.map((u) => u.id);
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("*")
      .in("user_id", userIds);

    if (profilesError || !profiles || profiles.length < 2) {
      return NextResponse.json(
        { error: "Not enough profiles for matching" },
        { status: 404 }
      );
    }

    // Find best pair by computing compatibility for each combination
    let bestScore = 0;
    let bestPair: [string, string] | null = null;
    let bestProfileA: Record<string, unknown> | null = null;
    let bestProfileB: Record<string, unknown> | null = null;

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const score = computeCompatibility(profiles[i], profiles[j]);
        if (score > bestScore) {
          bestScore = score;
          bestPair = [profiles[i].user_id, profiles[j].user_id];
          bestProfileA = profiles[i];
          bestProfileB = profiles[j];
        }
      }
    }

    if (!bestPair || !bestProfileA || !bestProfileB) {
      return NextResponse.json(
        { error: "Could not compute match" },
        { status: 500 }
      );
    }

    // Generate match details
    const venue = pickRandom(SF_VENUES);
    const day = pickRandom(DAYS);
    const time = pickRandom(TIME_SLOTS);
    const starter = pickRandom(CONVERSATION_STARTERS);
    const sharedTraits = generateSharedTraits(bestProfileA, bestProfileB);

    // Create match record
    const userAName = availableUsers.find(u => u.id === bestPair[0])?.name || "User A";
    const userBName = availableUsers.find(u => u.id === bestPair[1])?.name || "User B";

    const { data: newMatch, error: insertError } = await serviceClient
      .from("matches")
      .insert({
        user_a_id: bestPair[0],
        user_b_id: bestPair[1],
        status: "pending",
        compatibility_score: bestScore,
        venue: {
          name: venue.name,
          area: venue.area,
          short: venue.short,
          lat: venue.lat,
          lng: venue.lng,
        },
        meeting_day: day,
        meeting_time: time,
        conversation_starter: starter,
        shared_traits: sharedTraits,
        iris_description: `IRIS matched ${userAName} and ${userBName} with ${bestScore}% compatibility. Shared values and complementary traits suggest a meaningful connection.`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Match insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create match" },
        { status: 500 }
      );
    }

    return NextResponse.json({ match: newMatch }, { status: 201 });
  } catch (error: unknown) {
    console.error("Match POST error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
