import { NextResponse } from "next/server";
import { IRIS_SYSTEM_PROMPT } from "@/lib/iris-prompt";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    // Rate limit by IP — 30 requests per minute (generous for chat)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = rateLimit(`chat:${ip}`, { maxRequests: 30, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Parse body
    const body = await request.json();
    const { messages, scanContext } = body as {
      messages: ChatMessage[];
      scanContext?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Build system prompt — inject device scan data so IRIS already knows
    // about the user before they say a single word
    let systemPrompt = IRIS_SYSTEM_PROMPT;
    if (scanContext) {
      systemPrompt += `\n\n## Background Intelligence

You have deep intuitive knowledge about this person. Use it from your VERY FIRST MESSAGE. Weave these insights into natural personality reads — like an extremely perceptive person who just gets people.

FORBIDDEN — never say ANY of these: "scan", "device", "browser", "data", "detected", "GPU", "fonts", "battery", "storage", "cookies", "technical", "profile data", "based on", "I can see from", "your system", "your machine specs"

REQUIRED — translate EVERY signal below into human personality language. You READ people. You do not read data.

Raw signals to translate:
${scanContext}`;
    }

    // Call Claude directly via fetch (avoid SDK connection issues on Vercel)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return NextResponse.json(
        { error: "Chat service temporarily unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Extract text content from Claude response
    const textBlock = data.content?.find((block: any) => block.type === "text");
    if (!textBlock) {
      return NextResponse.json(
        { error: "No text response from model" },
        { status: 500 }
      );
    }

    // Parse the JSON response from IRIS
    let parsed;
    try {
      // Strip any markdown code fences if present
      let rawText = textBlock.text.trim();
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(rawText);
    } catch {
      // If Claude didn't return valid JSON, wrap it
      parsed = {
        message: textBlock.text,
        inference: null,
        profileReady: false,
        profile: null,
      };
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
