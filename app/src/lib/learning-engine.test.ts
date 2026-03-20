import { describe, it, expect, vi } from "vitest";
import { computePersonalizedWeights, getVenuePreference } from "./learning-engine";

// ─── Supabase Mock Factory ─────────────────────────────

function mockSupabase(responses: Record<string, { data: unknown; error: unknown }>) {
  // Builds a chainable mock that resolves based on table name
  const createChain = (table: string) => {
    const response = responses[table] || { data: null, error: null };
    const chain: Record<string, unknown> = {};
    const methods = ["select", "eq", "neq", "in", "not", "or", "order", "limit", "maybeSingle", "single"];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    // Terminal methods resolve the data
    chain["select"] = vi.fn().mockReturnValue({
      ...chain,
      then: (resolve: (val: unknown) => void) => resolve(response),
    });
    // Make the chain itself thenable for await
    chain["then"] = (resolve: (val: unknown) => void) => resolve(response);
    // Override methods to still return chain
    for (const method of methods) {
      if (method !== "select") {
        (chain as Record<string, ReturnType<typeof vi.fn>>)[method] = vi.fn().mockReturnValue(chain);
      }
    }
    return chain;
  };

  return {
    from: vi.fn((table: string) => createChain(table)),
  } as unknown as Parameters<typeof computePersonalizedWeights>[0];
}

// ─── computePersonalizedWeights ────────────────────────

describe("computePersonalizedWeights", () => {
  it("returns default weights when fewer than 2 feedback entries", () => {
    const supabase = mockSupabase({
      match_feedback: { data: [{ response: "yes", dimension_ratings: null, match_id: "m1" }], error: null },
    });

    return computePersonalizedWeights(supabase, "user-1").then(weights => {
      expect(weights.attachment).toBeCloseTo(0.25, 2);
      expect(weights.communication).toBeCloseTo(0.20, 2);
      expect(weights.values).toBeCloseTo(0.20, 2);
      expect(weights.emotional).toBeCloseTo(0.15, 2);
      expect(weights.growth).toBeCloseTo(0.10, 2);
      expect(weights.intent).toBeCloseTo(0.10, 2);
    });
  });

  it("returns default weights on supabase error", () => {
    const supabase = mockSupabase({
      match_feedback: { data: null, error: { message: "DB down" } },
    });

    return computePersonalizedWeights(supabase, "user-1").then(weights => {
      expect(weights.attachment).toBeCloseTo(0.25, 2);
    });
  });

  it("weights always sum to 1.0", () => {
    const feedback = [
      {
        response: "yes",
        match_id: "m1",
        dimension_ratings: {
          "Attachment Compatibility": 9,
          "Communication Resonance": 8,
          "Values Alignment": 7,
          "Emotional Intelligence": 6,
          "Growth Trajectory": 5,
          "Intent Alignment": 4,
        },
      },
      {
        response: "no",
        match_id: "m2",
        dimension_ratings: {
          "Attachment Compatibility": 3,
          "Communication Resonance": 4,
          "Values Alignment": 5,
          "Emotional Intelligence": 6,
          "Growth Trajectory": 7,
          "Intent Alignment": 8,
        },
      },
      {
        response: "yes",
        match_id: "m3",
        dimension_ratings: {
          "Attachment Compatibility": 8,
          "Communication Resonance": 9,
          "Values Alignment": 8,
          "Emotional Intelligence": 5,
          "Growth Trajectory": 4,
          "Intent Alignment": 3,
        },
      },
    ];

    const supabase = mockSupabase({
      match_feedback: { data: feedback, error: null },
    });

    return computePersonalizedWeights(supabase, "user-1").then(weights => {
      const sum = weights.attachment + weights.communication + weights.values +
        weights.emotional + weights.growth + weights.intent;
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });

  it("all weights have minimum floor of 0.02", () => {
    const feedback = [
      {
        response: "yes",
        match_id: "m1",
        dimension_ratings: {
          "Attachment Compatibility": 10,
          "Communication Resonance": 0,
          "Values Alignment": 0,
          "Emotional Intelligence": 0,
          "Growth Trajectory": 0,
          "Intent Alignment": 0,
        },
      },
      {
        response: "no",
        match_id: "m2",
        dimension_ratings: {
          "Attachment Compatibility": 0,
          "Communication Resonance": 10,
          "Values Alignment": 10,
          "Emotional Intelligence": 10,
          "Growth Trajectory": 10,
          "Intent Alignment": 10,
        },
      },
    ];

    const supabase = mockSupabase({
      match_feedback: { data: feedback, error: null },
    });

    return computePersonalizedWeights(supabase, "user-1").then(weights => {
      expect(weights.attachment).toBeGreaterThanOrEqual(0.02);
      expect(weights.communication).toBeGreaterThanOrEqual(0.02);
      expect(weights.values).toBeGreaterThanOrEqual(0.02);
      expect(weights.emotional).toBeGreaterThanOrEqual(0.02);
      expect(weights.growth).toBeGreaterThanOrEqual(0.02);
      expect(weights.intent).toBeGreaterThanOrEqual(0.02);
    });
  });

  it("uses outcome-only heuristic when no dimension ratings exist", () => {
    const feedback = [
      { response: "no", match_id: "m1", dimension_ratings: null },
      { response: "no", match_id: "m2", dimension_ratings: null },
      { response: "no", match_id: "m3", dimension_ratings: null },
      { response: "yes", match_id: "m4", dimension_ratings: null },
    ];

    const supabase = mockSupabase({
      match_feedback: { data: feedback, error: null },
    });

    return computePersonalizedWeights(supabase, "user-1").then(weights => {
      // Low success rate (25%) -> flatten toward equal distribution
      const sum = weights.attachment + weights.communication + weights.values +
        weights.emotional + weights.growth + weights.intent;
      expect(sum).toBeCloseTo(1.0, 2);
      // With flattening, all weights should be closer to 1/6 than defaults
      const flat = 1 / 6;
      for (const key of ["attachment", "communication", "values", "emotional", "growth", "intent"] as const) {
        expect(Math.abs(weights[key] - flat)).toBeLessThan(
          Math.abs(0.25 - flat) // should be closer to flat than the most extreme default
        );
      }
    });
  });
});

// ─── getVenuePreference ────────────────────────────────

describe("getVenuePreference", () => {
  it("returns null when no positive feedback exists", () => {
    const supabase = mockSupabase({
      match_feedback: { data: [], error: null },
    });

    return getVenuePreference(supabase, "user-1").then(result => {
      expect(result).toBeNull();
    });
  });
});
