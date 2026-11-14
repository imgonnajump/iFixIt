import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Video = { id: string; title: string; channel: string };

// Small in-memory cache so repeat taps don't burn YouTube API quota.
const cache = new Map<string, Video | null>();

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 120);
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const key = process.env.YOUTUBE_API_KEY;
  // No key: the client falls back to a YouTube search link.
  if (!key) return NextResponse.json({ video: null, reason: "no_key" });

  const cacheKey = q.toLowerCase();
  if (cache.has(cacheKey)) return NextResponse.json({ video: cache.get(cacheKey) });

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.search = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: "1",
    q,
    videoEmbeddable: "true",
    safeSearch: "strict",
    relevanceLanguage: "en",
    key,
  }).toString();

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.error("YouTube API error", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ video: null, reason: "api_error" });
    }
    const json = await res.json();
    const item = json.items?.[0];
    const video: Video | null = item?.id?.videoId
      ? { id: item.id.videoId, title: decode(item.snippet?.title ?? ""), channel: decode(item.snippet?.channelTitle ?? "") }
      : null;
    if (cache.size > 500) cache.clear();
    cache.set(cacheKey, video);
    return NextResponse.json({ video });
  } catch (e) {
    console.error("YouTube lookup failed:", e);
    return NextResponse.json({ video: null, reason: "api_error" });
  }
}
