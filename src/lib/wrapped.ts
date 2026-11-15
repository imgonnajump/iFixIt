// "Fixed Wrapped": your year in repairs.

import type { Fix } from "./fixlog";
import { ROOMS, type RoomId } from "./pixel/world";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const PERSONAS: Record<RoomId | "other", { title: string; blurb: string }> = {
  bathroom: { title: "The Plumbing Whisperer", blurb: "Leaks fear you. Running toilets go quiet when you walk in." },
  kitchen: { title: "The Kitchen Medic", blurb: "Faucets, burners, disposals: you keep the heart of the home beating." },
  utility: { title: "The Utility Hero", blurb: "Washers, dryers and water heaters: you fix the stuff nobody else wants to touch." },
  living: { title: "The Gadget Surgeon", blurb: "Lamps, cables and remotes come back to life in your hands." },
  bedroom: { title: "The Tech Rescuer", blurb: "Phones and laptops get a second life instead of a landfill." },
  garage: { title: "The Garage Gearhead", blurb: "Chains, tires and engines: if it has gears, it's yours." },
  other: { title: "The Fix-It Generalist", blurb: "Anything, anywhere. You just fix things." },
};

export type WrappedStats = ReturnType<typeof wrap>;

export function wrap(all: Fix[], year: number) {
  const fixes = all.filter((f) => new Date(f.date).getFullYear() === year).sort((a, b) => a.date.localeCompare(b.date));
  const saved = Math.round(fixes.reduce((a, f) => a + f.saved, 0));
  const spent = Math.round(fixes.reduce((a, f) => a + f.spent, 0));
  const kg = Math.round(fixes.reduce((a, f) => a + f.kg, 0) * 10) / 10;
  const diy = fixes.filter((f) => f.who === "me" || f.who === "friend").length;

  const roomCount = new Map<RoomId | "other", number>();
  fixes.forEach((f) => roomCount.set(f.room, (roomCount.get(f.room) ?? 0) + 1));
  const topRoom = [...roomCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";

  const monthCount = new Array(12).fill(0);
  fixes.forEach((f) => monthCount[new Date(f.date).getMonth()]++);
  const busiest = monthCount.indexOf(Math.max(...monthCount));

  const hardest = [...fixes].sort((a, b) => b.difficulty - a.difficulty || b.saved - a.saved)[0];
  const biggestSave = [...fixes].sort((a, b) => b.saved - a.saved)[0];

  return {
    year,
    count: fixes.length,
    saved,
    spent,
    kg,
    diyShare: fixes.length ? Math.round((diy / fixes.length) * 100) : 0,
    topRoom,
    topRoomName: topRoom === "other" ? "Around the house" : ROOMS[topRoom].name,
    topRoomCount: roomCount.get(topRoom) ?? 0,
    persona: PERSONAS[topRoom],
    monthCount,
    busiestMonth: MONTHS[busiest],
    busiestCount: monthCount[busiest],
    first: fixes[0],
    hardest,
    biggestSave,
    // Fun but honest comparisons
    pizzas: Math.floor(saved / 15), // ~$15 a pizza
    laptops: Math.round(kg / 2), // a laptop weighs ~2 kg
  };
}

export function isWrappedSeason(d = new Date()) {
  return d.getMonth() === 11 || (d.getMonth() === 0 && d.getDate() <= 15);
}

export function wrappedYear(d = new Date()) {
  return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
}
