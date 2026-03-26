import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Advance time past any existing windows to reset state
    vi.useFakeTimers();
    vi.advanceTimersByTime(10 * 60 * 1000);
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, { maxRequests: 3, windowMs: 60_000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks remaining requests correctly", () => {
    const key = `test-remaining-${Date.now()}`;
    const opts = { maxRequests: 3, windowMs: 60_000 };

    const r1 = rateLimit(key, opts);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit(key, opts);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit(key, opts);
    expect(r3.remaining).toBe(0);
    expect(r3.success).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const key = `test-block-${Date.now()}`;
    const opts = { maxRequests: 2, windowMs: 60_000 };

    rateLimit(key, opts);
    rateLimit(key, opts);
    const r3 = rateLimit(key, opts);

    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resets after the time window expires", () => {
    vi.useFakeTimers();
    const key = `test-reset-${Date.now()}`;
    const opts = { maxRequests: 1, windowMs: 1000 };

    rateLimit(key, opts);
    const blocked = rateLimit(key, opts);
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(1500);

    const afterReset = rateLimit(key, opts);
    expect(afterReset.success).toBe(true);
    expect(afterReset.remaining).toBe(0);

    vi.useRealTimers();
  });

  it("isolates different keys", () => {
    const keyA = `test-iso-a-${Date.now()}`;
    const keyB = `test-iso-b-${Date.now()}`;
    const opts = { maxRequests: 1, windowMs: 60_000 };

    rateLimit(keyA, opts);
    const resultB = rateLimit(keyB, opts);

    expect(resultB.success).toBe(true);
  });
});
