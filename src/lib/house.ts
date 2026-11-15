// Decorating your pixel house with coins earned from fixes. Stored in this browser only.

import type { Fix } from "./fixlog";
import { COLS, findPath, FIXABLE, MAP, OBJECTS, ROWS, standSpots, TILE } from "./pixel/world";

export type DecorId =
  | "cushion"
  | "plant"
  | "cactus"
  | "rug"
  | "lavalamp"
  | "beanbag"
  | "trophy"
  | "bookshelf"
  | "vacuum"
  | "fishtank"
  | "cat"
  | "arcade";

export type DecorItem = { id: DecorId; name: string; price: number; w: number; h: number; walkable: boolean };

export const SHOP: DecorItem[] = [
  { id: "cushion", name: "Floor cushion", price: 20, w: 1, h: 1, walkable: true },
  { id: "cactus", name: "Tiny cactus", price: 25, w: 1, h: 1, walkable: false },
  { id: "plant", name: "Monstera plant", price: 30, w: 1, h: 1, walkable: false },
  { id: "rug", name: "Round rug", price: 40, w: 2, h: 2, walkable: true },
  { id: "lavalamp", name: "Lava lamp", price: 45, w: 1, h: 1, walkable: false },
  { id: "beanbag", name: "Beanbag", price: 60, w: 1, h: 1, walkable: false },
  { id: "trophy", name: "Fixer trophy", price: 75, w: 1, h: 1, walkable: false },
  { id: "bookshelf", name: "Bookshelf", price: 80, w: 1, h: 1, walkable: false },
  { id: "vacuum", name: "Robot vacuum", price: 90, w: 1, h: 1, walkable: true },
  { id: "fishtank", name: "Fish tank", price: 120, w: 1, h: 1, walkable: false },
  { id: "cat", name: "Cat in a bed", price: 150, w: 1, h: 1, walkable: false },
  { id: "arcade", name: "Arcade cabinet", price: 200, w: 1, h: 1, walkable: false },
];
export const ITEM = Object.fromEntries(SHOP.map((i) => [i.id, i])) as Record<DecorId, DecorItem>;

export const PAINT_PRICE = 50;
export const WALLPAPERS = ["#a5d8ff", "#ffe066", "#d0bfff", "#b2f2bb", "#fcc2d7", "#ffd8a8", "#99e9f2", "#ffffff"];

export type Placed = { uid: string; item: DecorId; x: number; y: number };
export type House = {
  placed: Placed[];
  inventory: Partial<Record<DecorId, number>>;
  spent: number;
  wallpaper: Partial<Record<string, string>>; // keyed by room map char
};

export const EMPTY_HOUSE: House = { placed: [], inventory: {}, spent: 0, wallpaper: {} };
const KEY = "fixcam.house.v1";

export function loadHouse(): House {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY_HOUSE, ...JSON.parse(raw) } : EMPTY_HOUSE;
  } catch {
    return EMPTY_HOUSE;
  }
}

export function saveHouse(h: House) {
  try {
    localStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    /* storage unavailable */
  }
}

// Coins for one fix: more for harder jobs, a bonus for doing it yourself.
export function coinsFor(f: Fix) {
  return 20 + 10 * Math.max(1, Math.min(5, f.difficulty || 1)) + (f.who === "me" ? 10 : 0);
}

export function coinBalance(fixes: Fix[], house: House) {
  const earned = fixes.reduce((a, f) => a + coinsFor(f), 0);
  return { earned, balance: Math.max(0, earned - house.spent) };
}

/* ---------------- placement rules ---------------- */

const key = (x: number, y: number) => y * COLS + x;

export function decorTiles(p: Placed): [number, number][] {
  const it = ITEM[p.item];
  const out: [number, number][] = [];
  for (let dx = 0; dx < it.w; dx++) for (let dy = 0; dy < it.h; dy++) out.push([p.x + dx, p.y + dy]);
  return out;
}

export function blockedBy(placed: Placed[]): Set<number> {
  const s = new Set<number>();
  for (const p of placed) if (!ITEM[p.item].walkable) decorTiles(p).forEach(([x, y]) => s.add(key(x, y)));
  return s;
}

export function decorAt(placed: Placed[], x: number, y: number): Placed | undefined {
  return placed.find((p) => decorTiles(p).some(([tx, ty]) => tx === x && ty === y));
}

function isDoor(x: number, y: number) {
  return MAP[y]?.[x] === "." && MAP[y][x - 1] === "#" && MAP[y][x + 1] === "#";
}

export function canPlace(house: House, item: DecorId, x: number, y: number, player: [number, number]): { ok: true } | { ok: false; reason: string } {
  const it = ITEM[item];
  const tiles: [number, number][] = [];
  for (let dx = 0; dx < it.w; dx++) for (let dy = 0; dy < it.h; dy++) tiles.push([x + dx, y + dy]);
  for (const [tx, ty] of tiles) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS || MAP[ty][tx] === "#") return { ok: false, reason: "It has to go on the floor." };
    if (isDoor(tx, ty) || isDoor(tx, ty - 1) || isDoor(tx, ty + 1)) return { ok: false, reason: "That would block a doorway." };
    if (OBJECTS.some((o) => tx >= o.x && tx < o.x + o.w && ty >= o.y && ty < o.y + o.h)) return { ok: false, reason: "Something's already there." };
    if (decorAt(house.placed, tx, ty)) return { ok: false, reason: "Something's already there." };
    if (!it.walkable && tx === player[0] && ty === player[1]) return { ok: false, reason: "You're standing there!" };
  }
  if (it.walkable) return { ok: true };

  // Make sure every fixable thing can still be reached.
  const blocked = blockedBy([...house.placed, { uid: "test", item, x, y }]);
  const route = (o: (typeof FIXABLE)[number]) => findPath(player[0], player[1], standSpots(o, blocked), blocked);
  if (FIXABLE.some((o) => !route(o))) return { ok: false, reason: "That would block the way to something." };
  return { ok: true };
}

/* ---------------- drawing ---------------- */

const OUT = "#2a2140";
function r(ctx: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

export function drawDecor(ctx: CanvasRenderingContext2D, item: DecorId, x: number, y: number, t = 0) {
  switch (item) {
    case "cushion":
      r(ctx, OUT, x + 2, y + 5, 12, 9);
      r(ctx, "#f783ac", x + 3, y + 6, 10, 7);
      r(ctx, "#faa2c1", x + 4, y + 7, 4, 2);
      r(ctx, "#e64980", x + 7, y + 9, 2, 2);
      break;
    case "cactus":
      r(ctx, OUT, x + 4, y + 10, 8, 6);
      r(ctx, "#e8590c", x + 5, y + 11, 6, 4);
      r(ctx, OUT, x + 6, y + 1, 4, 10);
      r(ctx, "#40c057", x + 7, y + 2, 2, 8);
      r(ctx, "#40c057", x + 4, y + 4, 2, 3);
      r(ctx, "#40c057", x + 10, y + 3, 2, 3);
      r(ctx, "#ff8787", x + 7, y, 2, 2);
      break;
    case "plant":
      r(ctx, OUT, x + 4, y + 10, 8, 6);
      r(ctx, "#ffd43b", x + 5, y + 11, 6, 4);
      r(ctx, "#2f9e44", x + 2, y - 2, 5, 7);
      r(ctx, "#40c057", x + 8, y - 4, 6, 8);
      r(ctx, "#51cf66", x + 5, y + 2, 5, 8);
      r(ctx, "#2f9e44", x + 10, y - 1, 1, 4);
      break;
    case "rug":
      r(ctx, "#7048e8", x + 4, y + 2, 24, 28);
      r(ctx, "#7048e8", x + 2, y + 4, 28, 24);
      r(ctx, "#9775fa", x + 6, y + 6, 20, 20);
      r(ctx, "#ffd43b", x + 10, y + 10, 12, 12);
      r(ctx, "#f783ac", x + 13, y + 13, 6, 6);
      break;
    case "lavalamp": {
      const b = Math.round(Math.sin(t / 400) * 2);
      r(ctx, OUT, x + 5, y + 12, 6, 4);
      r(ctx, OUT, x + 5, y - 4, 6, 16);
      r(ctx, "#ffec99", x + 6, y - 3, 4, 14);
      r(ctx, "#ff6b6b", x + 6, y + 5 + b, 3, 3);
      r(ctx, "#ff6b6b", x + 7, y - 1 - b, 2, 2);
      r(ctx, "#748ffc", x + 5, y + 12, 6, 2);
      break;
    }
    case "beanbag":
      r(ctx, OUT, x + 1, y + 4, 14, 12);
      r(ctx, "#4dabf7", x + 2, y + 5, 12, 10);
      r(ctx, "#74c0fc", x + 3, y + 6, 6, 4);
      r(ctx, "#339af0", x + 2, y + 12, 12, 3);
      break;
    case "trophy":
      r(ctx, OUT, x + 3, y + 12, 10, 4);
      r(ctx, "#845ef7", x + 4, y + 13, 8, 2);
      r(ctx, OUT, x + 7, y + 8, 2, 4);
      r(ctx, OUT, x + 3, y - 2, 10, 11);
      r(ctx, "#fcc419", x + 4, y - 1, 8, 9);
      r(ctx, "#fff3bf", x + 5, y, 2, 3);
      r(ctx, "#fcc419", x + 1, y, 2, 4);
      r(ctx, "#fcc419", x + 13, y, 2, 4);
      break;
    case "bookshelf": {
      r(ctx, OUT, x + 1, y - 12, 14, 28);
      r(ctx, "#b5651d", x + 2, y - 11, 12, 26);
      const books = ["#ff6b6b", "#4dabf7", "#ffd43b", "#51cf66", "#cc5de8", "#ff922b"];
      [-10, -3, 4, 11].forEach((sy, row) => {
        for (let i = 0; i < 4; i++) r(ctx, books[(i + row) % books.length], x + 3 + i * 3, y + sy, 2, 5);
        r(ctx, "#8b4513", x + 2, y + sy + 5, 12, 1);
      });
      break;
    }
    case "vacuum": {
      const dx = Math.round(Math.sin(t / 900) * 2);
      r(ctx, OUT, x + 2 + dx, y + 5, 12, 9);
      r(ctx, "#495057", x + 3 + dx, y + 6, 10, 7);
      r(ctx, "#868e96", x + 4 + dx, y + 7, 8, 3);
      r(ctx, t % 1000 < 500 ? "#69db7c" : "#2b8a3e", x + 7 + dx, y + 8, 2, 1);
      break;
    }
    case "fishtank": {
      r(ctx, OUT, x, y - 6, 16, 22);
      r(ctx, "#8b5e3c", x + 1, y + 9, 14, 6);
      r(ctx, "#74c0fc", x + 1, y - 5, 14, 13);
      r(ctx, "#a5d8ff", x + 1, y - 5, 14, 2);
      r(ctx, "#2f9e44", x + 3, y + 2, 1, 6);
      r(ctx, "#2f9e44", x + 12, y + 1, 1, 7);
      const fx = 4 + Math.round((Math.sin(t / 700) + 1) * 3);
      r(ctx, "#ff922b", x + fx, y, 3, 2);
      r(ctx, "#ff922b", x + fx + 3, y - 1, 1, 4);
      r(ctx, "#ffffff", x + 9, y - 2 - (Math.floor(t / 300) % 3), 1, 1);
      break;
    }
    case "cat": {
      r(ctx, OUT, x + 1, y + 6, 14, 10);
      r(ctx, "#e64980", x + 2, y + 7, 12, 8);
      r(ctx, "#fcc2d7", x + 3, y + 8, 10, 5);
      const breathe = Math.floor(t / 600) % 2;
      r(ctx, "#ff922b", x + 4, y + 6 - breathe, 8, 6);
      r(ctx, "#ff922b", x + 4, y + 4 - breathe, 2, 2);
      r(ctx, "#ff922b", x + 10, y + 4 - breathe, 2, 2);
      r(ctx, OUT, x + 6, y + 8 - breathe, 1, 1);
      r(ctx, OUT, x + 9, y + 8 - breathe, 1, 1);
      r(ctx, "#ffe8cc", x + 7, y + 9 - breathe, 2, 1);
      break;
    }
    case "arcade":
      r(ctx, OUT, x + 1, y - 13, 14, 29);
      r(ctx, "#7048e8", x + 2, y - 12, 12, 27);
      r(ctx, "#ffd43b", x + 2, y - 12, 12, 3);
      r(ctx, OUT, x + 3, y - 8, 10, 8);
      r(ctx, t % 800 < 400 ? "#63e6be" : "#4dabf7", x + 4, y - 7, 8, 6);
      r(ctx, "#ff6b6b", x + 5, y - 5, 2, 2);
      r(ctx, "#5c3cd6", x + 2, y + 2, 12, 4);
      r(ctx, "#ff6b6b", x + 4, y + 3, 2, 2);
      r(ctx, "#63e6be", x + 9, y + 3, 2, 2);
      break;
  }
}

export function drawDecorAtTile(ctx: CanvasRenderingContext2D, p: Placed, t = 0) {
  drawDecor(ctx, p.item, p.x * TILE, p.y * TILE, t);
}
