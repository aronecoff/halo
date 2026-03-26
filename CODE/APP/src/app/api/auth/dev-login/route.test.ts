import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock rate-limit
const mockRateLimit = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

// Mock supabase admin client
const mockListUsers = vi.fn();
const mockGenerateLink = vi.fn();
const mockCreateUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
        generateLink: mockGenerateLink,
        createUser: mockCreateUser,
      },
    },
  })),
}));

import { POST } from "@/app/api/auth/dev-login/route";

describe("Dev login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.VERCEL_ENV = undefined;
    process.env.ENABLE_DEV_LOGIN = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://test.app";
    mockRateLimit.mockReturnValue({ success: true, remaining: 4 });
  });

  it("returns 403 in production environment", async () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";

    const request = new Request("https://test.app/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error).toBe("Dev login is not available");
  });

  it("returns 403 when ENABLE_DEV_LOGIN is not true", async () => {
    process.env.ENABLE_DEV_LOGIN = "false";

    const request = new Request("https://test.app/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

    const request = new Request("https://test.app/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it("returns 400 when email is missing", async () => {
    const request = new Request("https://test.app/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Email required");
  });

  it("generates magic link for existing user", async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ email: "existing@example.com" }] },
    });
    mockGenerateLink.mockResolvedValue({
      data: {
        properties: {
          hashed_token: "hash123",
          action_link: "https://test.supabase.co/verify?token=abc",
        },
      },
      error: null,
    });

    const request = new Request("https://test.app/api/auth/dev-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://test.app",
      },
      body: JSON.stringify({ email: "existing@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.token_hash).toBe("hash123");
    expect(body.action_link).toBeDefined();
    expect(body.new_user).toBeUndefined();
  });

  it("creates new user and generates magic link for unknown email", async () => {
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockCreateUser.mockResolvedValue({ error: null });
    mockGenerateLink.mockResolvedValue({
      data: {
        properties: {
          hashed_token: "newhash",
          action_link: "https://test.supabase.co/verify?token=new",
        },
      },
      error: null,
    });

    const request = new Request("https://test.app/api/auth/dev-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://test.app",
      },
      body: JSON.stringify({ email: "new@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.token_hash).toBe("newhash");
    expect(body.new_user).toBe(true);
  });

  it("returns 500 when createUser fails", async () => {
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockCreateUser.mockResolvedValue({
      error: { message: "User creation failed" },
    });

    const request = new Request("https://test.app/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "fail@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("returns 500 when generateLink fails for existing user", async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ email: "existing@example.com" }] },
    });
    mockGenerateLink.mockResolvedValue({
      data: null,
      error: { message: "Link generation failed" },
    });

    const request = new Request("https://test.app/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "existing@example.com" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
