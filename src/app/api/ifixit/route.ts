import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Finds the best matching iFixit guide and returns its step photos.
// Uses iFixit's public API (no key). Content is CC BY-NC-SA, credited in the UI.

type GuideStep = { image: string; text: string };
type Guide = { title: string; url: string; steps: GuideStep[] };

const API = "https://www.ifixit.com/api/2.0";
const cache = new Map<string, Guide | null>();

type IfixitImage = { standard?: string; medium?: string; large?: string; thumbnail?: string };

function pick(img: IfixitImage | undefined): string | null {
  return img?.medium ?? img?.standard ?? img?.large ?? img?.thumbnail ?? null;
}

async function getJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "FixCam/1.0 (hackathon project)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`iFixit ${res.status}`);
  return res.json();
}

async function findGuide(q: string): Promise<Guide | null> {
  const search = await getJson(`${API}/search/${encodeURIComponent(q)}?filter=guide&limit=3`);
  const hit = (search?.results ?? []).find((r: { dataType?: string; guideid?: number }) => r?.guideid && (!r.dataType || r.dataType === "guide"));
  if (!hit) return null;

  const guide = await getJson(`${API}/guides/${hit.guideid}`);
  const steps: GuideStep[] = [];
  for (const step of guide?.steps ?? []) {
    const media = step?.media;
    const image = media?.type === "image" ? pick(media?.data?.[0]) : null;
    if (!image) continue;
    const text = (step?.lines ?? [])
      .map((l: { text_raw?: string }) => l?.text_raw ?? "")
      .filter(Boolean)
      .join(" ")
      .replace(/\[[^\]]*\]/g, "") // strip wiki markup like [link|text]
      .trim();
    steps.push({ image, text: step?.title || text.slice(0, 140) });
    if (steps.length >= 12) break;
  }
  if (steps.length === 0) return null;
  return { title: guide?.title ?? hit.title ?? q, url: guide?.url ?? hit.url ?? `https://www.ifixit.com/Search?query=${encodeURIComponent(q)}`, steps };
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100);
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const key = q.toLowerCase();
  if (cache.has(key)) return NextResponse.json({ guide: cache.get(key) });

  try {
    const guide = await findGuide(q);
    if (cache.size > 300) cache.clear();
    cache.set(key, guide);
    return NextResponse.json({ guide });
  } catch (e) {
    console.error("iFixit lookup failed:", e);
    return NextResponse.json({ guide: null });
  }
}
