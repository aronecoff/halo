import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

// Dev-only login endpoint that creates/signs in users without email verification
// Uses the service role key to bypass email rate limits during testing
// Gated behind ENABLE_DEV_LOGIN=true for safety
// NEVER enable in production — set ENABLE_DEV_LOGIN=false or leave unset
export async function POST(request: Request) {
  // Double gate: block in production even if env var is misconfigured
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { error: "Dev login is not available" },
      { status: 403 }
    );
  }

  if (process.env.ENABLE_DEV_LOGIN !== "true") {
    return NextResponse.json(
      { error: "Dev login is disabled in this environment" },
      { status: 403 }
    );
  }

  // Rate limit — 5 attempts per minute per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`dev-login:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try to find existing user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === email
    );

    if (existingUser) {
      // Generate a magic link for existing user (admin API, no rate limit)
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        token_hash: data.properties?.hashed_token,
        action_link: data.properties?.action_link,
      });
    } else {
      // Create new user with auto-confirm
      const { error: createError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      // Generate magic link for the new user
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        token_hash: data.properties?.hashed_token,
        action_link: data.properties?.action_link,
        new_user: true,
      });
    }
  } catch (error: unknown) {
    console.error("Dev login error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
