// ═══════════════════════════════════════════════════════════
// HALO Learning Engine v1
// Processes match feedback to personalize matching weights
// ═══════════════════════════════════════════════════════════
//
// After each meeting, users rate the match on each dimension.
// This engine aggregates that history to shift dimension
// weights for future matches — so IRIS gets smarter per user.
//
// Example: if a user consistently rates "values alignment"
// high on their best matches, we increase that weight.
// If "attachment compatibility" is always irrelevant to
// their satisfaction, we decrease it.

import { SupabaseClient } from "@supabase/supabase-js";

export interface WeightAdjustments {
  attachment: number;
  communication: number;
  values: number;
  emotional: number;
  growth: number;
  intent: number;
}

interface FeedbackRow {
  response: "yes" | "no" | "maybe";
  dimension_ratings: Record<string, number> | null;
  match_id: string;
}

interface MatchRow {
  id: string;
  venue: { lat?: number; lng?: number } | null;
}

const DEFAULT_WEIGHTS: WeightAdjustments = {
  attachment: 0.25,
  communication: 0.20,
  values: 0.20,
  emotional: 0.15,
  growth: 0.10,
  intent: 0.10,
};

const DIMENSION_KEYS: (keyof WeightAdjustments)[] = [
  "attachment", "communication", "values", "emotional", "growth", "intent",
];

// Map dimension display names to weight keys
const DIMENSION_NAME_MAP: Record<string, keyof WeightAdjustments> = {
  "Attachment Compatibility": "attachment",
  "Communication Resonance": "communication",
  "Values Alignment": "values",
  "Emotional Intelligence": "emotional",
  "Growth Trajectory": "growth",
  "Intent Alignment": "intent",
};

/**
 * Compute personalized weight adjustments for a user based on
 * their feedback history. Returns adjusted weights that sum to 1.0.
 */
export async function computePersonalizedWeights(
  supabase: SupabaseClient,
  userId: string,
): Promise<WeightAdjustments> {
  // Fetch all feedback from this user
  const { data: feedbackRows, error: fbError } = await supabase
    .from("match_feedback")
    .select("response, dimension_ratings, match_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (fbError || !feedbackRows || feedbackRows.length < 2) {
    // Not enough data to personalize — need at least 2 completed matches
    return { ...DEFAULT_WEIGHTS };
  }

  const feedback = feedbackRows as FeedbackRow[];

  // Separate positive (yes) and negative (no) feedback
  const positive = feedback.filter(f => f.response === "yes");
  const negative = feedback.filter(f => f.response === "no");

  // If no dimension ratings exist yet, use outcome-only heuristic
  const hasRatings = feedback.some(f => f.dimension_ratings && Object.keys(f.dimension_ratings).length > 0);

  if (!hasRatings) {
    return computeFromOutcomesOnly(positive.length, negative.length, feedback.length);
  }

  // Compute average dimension rating for positive vs negative outcomes
  const posAvg = averageDimensionRatings(positive);
  const negAvg = averageDimensionRatings(negative);

  // Dimensions that score high in positive matches and low in
  // negative matches are the ones that matter most to this user
  const adjustments = { ...DEFAULT_WEIGHTS };

  for (const key of DIMENSION_KEYS) {
    const posScore = posAvg[key] ?? 0.5;
    const negScore = negAvg[key] ?? 0.5;

    // Signal = how much this dimension differentiates good from bad matches
    const signal = posScore - negScore;

    // Shift weight: positive signal = increase, negative = decrease
    // Max shift is +/- 0.08 per dimension to prevent extreme skew
    const shift = Math.max(-0.08, Math.min(0.08, signal * 0.15));
    adjustments[key] = DEFAULT_WEIGHTS[key] + shift;
  }

  // Normalize to sum to 1.0
  return normalizeWeights(adjustments);
}

/**
 * When we only have yes/no outcomes (no granular ratings),
 * we can still adjust based on match success rate patterns.
 * High success rate = weights are working, nudge toward extremes.
 * Low success rate = weights need rebalancing toward center.
 */
function computeFromOutcomesOnly(
  positiveCount: number,
  negativeCount: number,
  totalCount: number,
): WeightAdjustments {
  const successRate = positiveCount / Math.max(totalCount, 1);

  if (successRate > 0.7) {
    // Weights are working well — keep them
    return { ...DEFAULT_WEIGHTS };
  }

  if (successRate < 0.3) {
    // Weights aren't working — flatten toward equal distribution
    // This gives all dimensions more equal say until we get signal
    const flat = 1 / 6;
    const blend = 0.4; // 40% toward flat
    const adjusted: WeightAdjustments = { ...DEFAULT_WEIGHTS };
    for (const key of DIMENSION_KEYS) {
      adjusted[key] = DEFAULT_WEIGHTS[key] * (1 - blend) + flat * blend;
    }
    return normalizeWeights(adjusted);
  }

  return { ...DEFAULT_WEIGHTS };
}

/**
 * Average dimension ratings across a set of feedback entries
 */
function averageDimensionRatings(
  entries: FeedbackRow[],
): Record<keyof WeightAdjustments, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    if (!entry.dimension_ratings) continue;
    for (const [dimName, rating] of Object.entries(entry.dimension_ratings)) {
      const key = DIMENSION_NAME_MAP[dimName] || dimName.toLowerCase();
      sums[key] = (sums[key] || 0) + (rating as number);
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  const result: Record<string, number> = {};
  for (const key of DIMENSION_KEYS) {
    result[key] = counts[key] ? sums[key] / counts[key] : 0.5;
  }

  return result as Record<keyof WeightAdjustments, number>;
}

/**
 * Normalize weights to sum to exactly 1.0
 */
function normalizeWeights(weights: WeightAdjustments): WeightAdjustments {
  const sum = DIMENSION_KEYS.reduce((s, k) => s + Math.max(0.02, weights[k]), 0);
  const normalized = { ...weights };
  for (const key of DIMENSION_KEYS) {
    normalized[key] = Math.max(0.02, weights[key]) / sum;
  }
  return normalized;
}

/**
 * Get venue preference from feedback history.
 * Returns average lat/lng of venues from positive matches,
 * or null if no location signal exists.
 */
export async function getVenuePreference(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ lat: number; lng: number } | null> {
  const { data: feedback } = await supabase
    .from("match_feedback")
    .select("match_id, response")
    .eq("user_id", userId)
    .eq("response", "yes");

  if (!feedback || feedback.length === 0) return null;

  const matchIds = feedback.map(f => f.match_id);
  const { data: matches } = await supabase
    .from("matches")
    .select("id, venue")
    .in("id", matchIds);

  if (!matches) return null;

  const locs = (matches as MatchRow[])
    .filter(m => m.venue?.lat && m.venue?.lng)
    .map(m => ({ lat: m.venue!.lat!, lng: m.venue!.lng! }));

  if (locs.length === 0) return null;

  return {
    lat: locs.reduce((s, l) => s + l.lat, 0) / locs.length,
    lng: locs.reduce((s, l) => s + l.lng, 0) / locs.length,
  };
}
