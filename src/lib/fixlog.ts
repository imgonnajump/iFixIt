// The fix diary: every repair you log. Stored in this browser only.

import type { RoomId } from "./pixel/world";

export const WHO = {
  me: "I fixed it",
  friend: "A friend helped",
  repair_cafe: "Repair Café",
  handyman: "Handyman",
  pro: "A pro fixed it",
} as const;
export type Who = keyof typeof WHO;

export type Fix = {
  id: string;
  date: string; // ISO
  item: string;
  part: string;
  room: RoomId | "other";
  who: Who;
  spent: number; // $ actually spent
  saved: number; // $ saved vs. the next-best option
  kg: number; // kept out of landfill
  difficulty: number; // 1-5
  notes: string;
  source: "coach" | "manual" | "sample";
};

const KEY = "fixcam.fixes.v2";
const OLD_KEY = "fixcam.fixes.v1";

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function loadFixes(): Fix[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    }
    // migrate from the first version
    const old = JSON.parse(localStorage.getItem(OLD_KEY) ?? "[]");
    if (Array.isArray(old) && old.length) {
      const migrated: Fix[] = old.map((f) => ({
        id: newId(),
        date: f.date ?? new Date().toISOString(),
        item: f.item ?? "Something",
        part: f.part ?? "",
        room: "other",
        who: "me",
        spent: 0,
        saved: f.saved ?? 0,
        kg: f.kg ?? 0,
        difficulty: 2,
        notes: "",
        source: "coach",
      }));
      saveFixes(migrated);
      return migrated;
    }
  } catch {
    /* storage unavailable */
  }
  return [];
}

export function saveFixes(list: Fix[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
  } catch {
    /* storage unavailable */
  }
}

export function addFix(fix: Fix): Fix[] {
  const list = [fix, ...loadFixes()];
  saveFixes(list);
  return list;
}

export function totals(list: Fix[]) {
  return {
    count: list.length,
    saved: Math.round(list.reduce((a, f) => a + (f.saved || 0), 0)),
    spent: Math.round(list.reduce((a, f) => a + (f.spent || 0), 0)),
    kg: Math.round(list.reduce((a, f) => a + (f.kg || 0), 0) * 10) / 10,
  };
}

// A believable year of fixes, for demos. Marked "sample" so it can be cleared in one tap.
export function sampleYear(year: number): Fix[] {
  const rows: [number, number, string, string, RoomId, Who, number, number, number, number][] = [
    [0, 14, "Toilet", "Flapper valve", "bathroom", "me", 9, 151, 40, 1],
    [1, 3, "Phone charger cable", "USB-C cable", "living", "me", 12, 0, 0.1, 1],
    [1, 22, "Bike", "Rear derailleur cable", "garage", "me", 8, 62, 12, 2],
    [2, 9, "Kitchen faucet", "Cartridge", "kitchen", "me", 24, 180, 3, 2],
    [3, 18, "Laptop", "Hinge screws", "bedroom", "repair_cafe", 0, 210, 2, 3],
    [4, 2, "Dryer", "Drum belt", "utility", "me", 19, 216, 50, 3],
    [5, 27, "Lawn mower", "Spark plug", "garage", "me", 6, 74, 25, 1],
    [6, 11, "Floor lamp", "Inline switch", "living", "friend", 5, 40, 4, 1],
    [7, 5, "Bathroom sink", "Pop-up drain", "bathroom", "me", 14, 126, 6, 2],
    [8, 20, "Washing machine", "Drain pump filter", "utility", "me", 0, 160, 70, 2],
    [9, 2, "Water heater", "Thermocouple", "utility", "pro", 165, 1135, 60, 4],
    [10, 8, "Bike", "Inner tube", "garage", "me", 7, 23, 1, 1],
  ];
  return rows.map(([m, d, item, part, room, who, spent, saved, kg, diff]) => ({
    id: newId(),
    date: new Date(Date.UTC(year, m, d, 15)).toISOString(),
    item,
    part,
    room,
    who,
    spent,
    saved,
    kg,
    difficulty: diff,
    notes: "",
    source: "sample",
  }));
}
