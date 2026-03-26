import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route
const mockExchangeCodeForSession = vi.fn();
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

vi.mock("next/server", () => {
  class MockNextResponse {
    static redirect(url: string | URL) {
      return { type: "redirect", url: url.toString() };
    }
  }
  return { NextResponse: MockNextResponse };
});

import { GET } from "@/app/auth/callback/route";

describe("Auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("exchanges code for session and redirects to / on success", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const request = new Request("https://example.com/auth/callback?code=test-code");
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("test-code");
    expect(response).toEqual({
      type: "redirect",
      url: "https://example.com/",
    });
  });

  it("redirects to /login?error=auth when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: new Error("Invalid code"),
    });

    const request = new Request("https://example.com/auth/callback?code=bad-code");
    const response = await GET(request);

    expect(response).toEqual({
      type: "redirect",
      url: "https://example.com/login?error=auth",
    });
  });

  it("redirects to /login?error=auth when no code is provided", async () => {
    const request = new Request("https://example.com/auth/callback");
    const response = await GET(request);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(response).toEqual({
      type: "redirect",
      url: "https://example.com/login?error=auth",
    });
  });
});
