import { NextResponse } from "next/server";
import { buildQuery, parseOverpass, STORE_TYPES, type Store, type StoreType } from "@/lib/stores";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

async function overpass(query: string): Promise<{ elements?: unknown[] }> {
  let lastError: unknown;
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "FixCam/1.0 (hackathon project)",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) return res.json();
      lastError = new Error(`Overpass ${res.status}`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function POST(req: Request) {
  let body: { lat?: unknown; lon?: unknown; types?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lon = Number(body.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }
  const types = (Array.isArray(body.types) ? body.types : []).filter((t): t is StoreType =>
    (STORE_TYPES as readonly string[]).includes(t as string),
  );
  if (types.length === 0) return NextResponse.json({ stores: [] });

  // Round to ~100 m so we never pass a precise location upstream.
  const qLat = Math.round(lat * 1000) / 1000;
  const qLon = Math.round(lon * 1000) / 1000;

  try {
    let stores: Store[] = [];
    // Search close by first, widen if there's not much around.
    for (const radius of [5000, 25000]) {
      const json = await overpass(buildQuery(types, qLat, qLon, radius));
      stores = parseOverpass(json as Parameters<typeof parseOverpass>[0], types, lat, lon);
      if (stores.length >= 3) break;
    }
    return NextResponse.json({ stores });
  } catch (e) {
    console.error("Store lookup failed:", e);
    return NextResponse.json({ error: "Store search is busy. Try again in a moment." }, { status: 502 });
  }
}
