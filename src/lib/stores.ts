// Store and professional lookup via OpenStreetMap (Overpass API). Free, no API key.

export const STORE_TYPES = [
  "hardware",
  "electronics",
  "bicycle",
  "auto_parts",
  "appliance_parts",
  "phone_repair",
  "home_goods",
] as const;
export type StoreType = (typeof STORE_TYPES)[number];

export const PRO_TYPES = [
  "plumber",
  "electrician",
  "hvac",
  "appliance_repair",
  "device_repair",
  "bike_mechanic",
  "auto_mechanic",
  "locksmith",
  "carpenter",
  "repair_cafe",
] as const;
export type ProType = (typeof PRO_TYPES)[number];

export const PLACE_TYPES = [...STORE_TYPES, ...PRO_TYPES] as const;
export type PlaceType = StoreType | ProType;

export const PLACE_LABELS: Record<PlaceType, string> = {
  hardware: "Hardware store",
  electronics: "Electronics store",
  bicycle: "Bike shop",
  auto_parts: "Auto parts store",
  appliance_parts: "Appliance parts store",
  phone_repair: "Phone & device repair",
  home_goods: "Home goods store",
  plumber: "Plumber",
  electrician: "Electrician",
  hvac: "Heating & AC technician",
  appliance_repair: "Appliance repair",
  device_repair: "Phone & computer repair",
  bike_mechanic: "Bike mechanic",
  auto_mechanic: "Auto mechanic",
  locksmith: "Locksmith",
  carpenter: "Carpenter",
  repair_cafe: "Repair Café (free, volunteer-run)",
};

// OpenStreetMap tags for each place type.
const TAGS: Record<PlaceType, [string, string][]> = {
  hardware: [["shop", "hardware"], ["shop", "doityourself"], ["shop", "trade"]],
  electronics: [["shop", "electronics"], ["shop", "computer"]],
  bicycle: [["shop", "bicycle"]],
  auto_parts: [["shop", "car_parts"]],
  appliance_parts: [["shop", "appliance"], ["shop", "electrical"]],
  phone_repair: [["shop", "mobile_phone"], ["craft", "electronics_repair"], ["shop", "repair"]],
  home_goods: [["shop", "houseware"], ["shop", "department_store"], ["shop", "variety_store"]],
  plumber: [["craft", "plumber"]],
  electrician: [["craft", "electrician"]],
  hvac: [["craft", "hvac"]],
  appliance_repair: [["craft", "electronics_repair"], ["craft", "appliance_repair"]],
  device_repair: [["craft", "electronics_repair"], ["shop", "mobile_phone"], ["shop", "computer"]],
  bike_mechanic: [["shop", "bicycle"]],
  auto_mechanic: [["shop", "car_repair"]],
  locksmith: [["shop", "locksmith"], ["craft", "locksmith"]],
  carpenter: [["craft", "carpenter"]],
  repair_cafe: [["repair_cafe", "yes"]],
};

export type Store = {
  name: string;
  type: PlaceType;
  lat: number;
  lon: number;
  distanceKm: number;
  address: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
};

export function buildQuery(types: PlaceType[], lat: number, lon: number, radiusM: number): string {
  const parts = types.flatMap((t) =>
    TAGS[t].map(([k, v]) => `nwr["${k}"="${v}"]["name"](around:${radiusM},${lat},${lon});`),
  );
  return `[out:json][timeout:15];(${parts.join("")});out center tags 200;`;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

type OverpassElement = {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function typeOf(tags: Record<string, string>, wanted: PlaceType[]): PlaceType | null {
  for (const t of wanted) {
    if (TAGS[t].some(([k, v]) => tags[k] === v)) return t;
  }
  return null;
}

export function parseOverpass(json: { elements?: OverpassElement[] }, wanted: PlaceType[], lat: number, lon: number, limit = 6): Store[] {
  const seen = new Set<string>();
  const stores: Store[] = [];
  for (const el of json.elements ?? []) {
    const tags = el.tags ?? {};
    const name = tags.name ?? tags.brand;
    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;
    const type = typeOf(tags, wanted);
    if (!name || elLat == null || elLon == null || !type) continue;

    const key = `${name.toLowerCase()}|${elLat.toFixed(3)}|${elLon.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    const address = [street, tags["addr:city"]].filter(Boolean).join(", ") || null;

    stores.push({
      name,
      type,
      lat: elLat,
      lon: elLon,
      distanceKm: haversineKm(lat, lon, elLat, elLon),
      address,
      hours: tags.opening_hours ?? null,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      website: tags.website ?? tags["contact:website"] ?? null,
    });
  }
  return stores.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit);
}
