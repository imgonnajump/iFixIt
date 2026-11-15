import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const MODEL = "claude-opus-5-5";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

export function hasKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

// Shared error -> friendly JSON response.
export function apiError(error: unknown) {
  if (error instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: "Too many requests. Wait a few seconds." }, { status: 429 });
  }
  if (error instanceof Anthropic.BadRequestError) {
    console.error("Bad request:", error.message);
    return NextResponse.json(
      { error: "The AI service rejected the request. Check the server log (bad image, or API account out of credits)." },
      { status: 400 },
    );
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`API error ${error.status}:`, error.message);
    return NextResponse.json({ error: "The AI service had a problem. Try again." }, { status: 502 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
