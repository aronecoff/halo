import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase SSR
const mockGetSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}));

// Build a minimal NextRequest/NextResponse mock
function makeRequest(pathname: string): any {
  const url = new URL(pathname, "https://example.com");
  const cookiesMap = new Map<string, { name: string; value: string }>();

  return {
    headers: new Headers(),
    nextUrl: { pathname: url.pathname },
    url: url.toString(),
    cookies: {
      get(name: string) {
        return cookiesMap.get(name);
      },
      set(opts: { name: string; value: string }) {
        cookiesMap.set(opts.name, opts);
      },
    },
  };
}

// Mock next/server
vi.mock("next/server", () => {
  class MockNextResponse {
    headers: Headers;
    cookies: {
      set: (opts: any) => void;
    };

    constructor() {
      this.headers = new Headers();
      const cookiesMap = new Map();
      this.cookies = {
        set(opts: any) {
          cookiesMap.set(opts.name, opts);
        },
      };
    }

    static next(opts?: any) {
      const resp = new MockNextResponse();
      (resp as any)._type = "next";
      return resp;
    }

    static redirect(url: URL | string) {
      const resp = new MockNextResponse();
      (resp as any)._type = "redirect";
      (resp as any)._url = url.toString();
      return resp;
    }
  }

  return { NextResponse: MockNextResponse };
});

import { middleware } from "@/middleware";

describe("Auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("allows access to /login without session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = makeRequest("/login");
    const response = await middleware(request);

    expect((response as any)._type).toBe("next");
  });

  it("allows access to /auth/callback without session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = makeRequest("/auth/callback");
    const response = await middleware(request);

    expect((response as any)._type).toBe("next");
  });

  it("allows access to API routes without session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = makeRequest("/api/auth/dev-login");
    const response = await middleware(request);

    expect((response as any)._type).toBe("next");
  });

  it("allows access to static assets without session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = makeRequest("/_next/static/chunk.js");
    const response = await middleware(request);

    expect((response as any)._type).toBe("next");
  });

  it("redirects unauthenticated users to /login for protected routes", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = makeRequest("/dashboard");
    const response = await middleware(request);

    expect((response as any)._type).toBe("redirect");
    expect((response as any)._url).toContain("/login");
  });

  it("allows authenticated users to access protected routes", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const request = makeRequest("/dashboard");
    const response = await middleware(request);

    expect((response as any)._type).toBe("next");
  });

  it("redirects authenticated users away from /login", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const request = makeRequest("/login");
    const response = await middleware(request);

    expect((response as any)._type).toBe("redirect");
    expect((response as any)._url).toContain("/");
  });

  it("allows access to /manifest.json without session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const request = makeRequest("/manifest.json");
    const response = await middleware(request);

    expect((response as any)._type).toBe("next");
  });
});
