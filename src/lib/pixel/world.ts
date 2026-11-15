// The pixel house: a 24x16 tile map (16px tiles), its rooms, and the fixable objects in it.

export const TILE = 16;
export const COLS = 24;
export const ROWS = 16;

// # wall   . hallway/door   b bathroom   k kitchen   u utility   l living   r bedroom   g garage
export const MAP = [
  "########################",
  "#bbbbbb#kkkkkkkk#uuuuuu#",
  "#bbbbbb#kkkkkkkk#uuuuuu#",
  "#bbbbbb#kkkkkkkk#uuuuuu#",
  "#bbbbbb#kkkkkkkk#uuuuuu#",
  "#bbbbbb#kkkkkkkk#uuuuuu#",
  "#bbbbbb#kkkkkkkk#uuuuuu#",
  "###.#######.#######.####",
  "#......................#",
  "####.#######.######.####",
  "#lllllllll#rrrrrr#ggggg#",
  "#lllllllll#rrrrrr#ggggg#",
  "#lllllllll#rrrrrr#ggggg#",
  "#lllllllll#rrrrrr#ggggg#",
  "#lllllllll#rrrrrr#ggggg#",
  "########################",
];

export const ROOMS = {
  bathroom: { name: "Bathroom", char: "b" },
  kitchen: { name: "Kitchen", char: "k" },
  utility: { name: "Utility room", char: "u" },
  living: { name: "Living room", char: "l" },
  bedroom: { name: "Bedroom", char: "r" },
  garage: { name: "Garage", char: "g" },
} as const;
export type RoomId = keyof typeof ROOMS;
export const ROOM_IDS = Object.keys(ROOMS) as RoomId[];

export type WorldObject = {
  id: string;
  name: string;
  room: RoomId;
  x: number;
  y: number;
  w: number;
  h: number;
  issues: string[];
  decor?: boolean; // furniture you can't diagnose
};

export const OBJECTS: WorldObject[] = [
  { id: "bathtub", name: "Bathtub & shower", room: "bathroom", x: 1, y: 1, w: 2, h: 3, issues: ["Drain is slow", "Faucet drips", "Caulk is moldy", "Showerhead sprays sideways"] },
  { id: "bath-sink", name: "Bathroom sink", room: "bathroom", x: 4, y: 1, w: 1, h: 1, issues: ["Faucet drips", "Drain is clogged", "Leak under the sink", "Pop-up stopper stuck"] },
  { id: "toilet", name: "Toilet", room: "bathroom", x: 6, y: 1, w: 1, h: 2, issues: ["Keeps running", "Won't flush", "Leaks at the base", "Handle is loose"] },
  { id: "fridge", name: "Fridge", room: "kitchen", x: 8, y: 1, w: 1, h: 2, issues: ["Not cold enough", "Leaking water", "Loud buzzing", "Door won't seal"] },
  { id: "counter-1", name: "Counter", room: "kitchen", x: 9, y: 1, w: 1, h: 1, issues: [], decor: true },
  { id: "stove", name: "Stove & oven", room: "kitchen", x: 10, y: 1, w: 1, h: 1, issues: ["Burner won't light", "Oven not heating", "Knob broken", "Clicking won't stop"] },
  { id: "counter-2", name: "Counter", room: "kitchen", x: 11, y: 1, w: 1, h: 1, issues: [], decor: true },
  { id: "kitchen-sink", name: "Kitchen sink", room: "kitchen", x: 12, y: 1, w: 1, h: 1, issues: ["Faucet drips", "Low water pressure", "Garbage disposal jammed", "Sprayer leaks"] },
  { id: "counter-3", name: "Counter", room: "kitchen", x: 13, y: 1, w: 1, h: 1, issues: [], decor: true },
  { id: "microwave", name: "Microwave", room: "kitchen", x: 14, y: 1, w: 1, h: 1, issues: ["Doesn't heat", "Turntable won't spin", "Door latch broken", "Sparks inside"] },
  { id: "counter-4", name: "Counter", room: "kitchen", x: 15, y: 1, w: 1, h: 1, issues: [], decor: true },
  { id: "table", name: "Kitchen table", room: "kitchen", x: 11, y: 4, w: 2, h: 1, issues: ["Wobbly leg", "Scratched top"] },
  { id: "breaker", name: "Breaker panel", room: "utility", x: 17, y: 1, w: 1, h: 1, issues: ["Breaker keeps tripping", "Outlet has no power", "Burning smell"] },
  { id: "washer", name: "Washing machine", room: "utility", x: 18, y: 1, w: 1, h: 1, issues: ["Won't drain", "Shakes and bangs", "Leaks", "Won't spin"] },
  { id: "dryer", name: "Dryer", room: "utility", x: 19, y: 1, w: 1, h: 1, issues: ["Not heating", "Squeaks", "Takes forever to dry", "Drum won't turn"] },
  { id: "water-heater", name: "Water heater", room: "utility", x: 22, y: 1, w: 1, h: 2, issues: ["No hot water", "Leaking at the bottom", "Rumbling noise", "Pilot light out"] },
  { id: "lamp", name: "Floor lamp", room: "living", x: 1, y: 10, w: 1, h: 1, issues: ["Won't turn on", "Flickers", "Switch is loose", "Wobbly"] },
  { id: "tv", name: "TV", room: "living", x: 6, y: 10, w: 2, h: 1, issues: ["No picture", "No sound", "Remote doesn't work", "Cracked screen"] },
  { id: "outlet", name: "Outlet & charger", room: "living", x: 8, y: 10, w: 1, h: 1, issues: ["Charger cable frayed", "Phone won't charge", "Outlet is loose", "Outlet sparks"] },
  { id: "couch", name: "Couch", room: "living", x: 3, y: 13, w: 3, h: 1, issues: ["Ripped cushion", "Broken leg", "Saggy seat", "Recliner stuck"] },
  { id: "plant", name: "Plant", room: "living", x: 9, y: 14, w: 1, h: 1, issues: [], decor: true },
  { id: "bed", name: "Bed", room: "bedroom", x: 14, y: 11, w: 2, h: 3, issues: ["Frame squeaks", "Slat broken", "Wobbly headboard"] },
  { id: "nightstand", name: "Phone on nightstand", room: "bedroom", x: 16, y: 11, w: 1, h: 1, issues: ["Cracked screen", "Battery drains fast", "Charging port loose", "Buttons stuck"] },
  { id: "desk", name: "Desk & laptop", room: "bedroom", x: 11, y: 13, w: 2, h: 1, issues: ["Laptop hinge loose", "Keyboard key broken", "Laptop overheats", "Won't charge"] },
  { id: "workbench", name: "Workbench & tools", room: "garage", x: 20, y: 10, w: 3, h: 1, issues: ["Drill won't hold a charge", "Rusty tools", "Extension cord damaged"] },
  { id: "bike", name: "Bike", room: "garage", x: 18, y: 12, w: 2, h: 1, issues: ["Flat tire", "Chain skips gears", "Brakes squeal", "Chain fell off"] },
  { id: "mower", name: "Lawn mower", room: "garage", x: 21, y: 13, w: 1, h: 1, issues: ["Won't start", "Cuts unevenly", "Pull cord stuck", "Smokes"] },
];

export const FIXABLE = OBJECTS.filter((o) => !o.decor);

export function roomAt(x: number, y: number): RoomId | null {
  const ch = MAP[y]?.[x];
  const found = ROOM_IDS.find((id) => ROOMS[id].char === ch);
  return found ?? null;
}

export function objectAt(x: number, y: number): WorldObject | undefined {
  return OBJECTS.find((o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
}

// `extra` = tiles blocked by placed decorations (y * COLS + x).
export function walkable(x: number, y: number, extra?: Set<number>): boolean {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  if (MAP[y][x] === "#") return false;
  if (extra?.has(y * COLS + x)) return false;
  return !objectAt(x, y);
}

// Breadth-first path from (sx, sy) to the nearest of `goals`. Returns the tiles to step through.
export function findPath(sx: number, sy: number, goals: [number, number][], extra?: Set<number>): [number, number][] | null {
  const key = (x: number, y: number) => y * COLS + x;
  const goalSet = new Set(goals.filter(([x, y]) => walkable(x, y, extra)).map(([x, y]) => key(x, y)));
  if (goalSet.size === 0) return null;
  const prev = new Map<number, number>();
  const q: [number, number][] = [[sx, sy]];
  prev.set(key(sx, sy), -1);
  while (q.length) {
    const [x, y] = q.shift()!;
    if (goalSet.has(key(x, y))) {
      const path: [number, number][] = [];
      let k = key(x, y);
      while (k !== key(sx, sy)) {
        path.unshift([k % COLS, Math.floor(k / COLS)]);
        k = prev.get(k)!;
      }
      return path;
    }
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (walkable(nx, ny, extra) && !prev.has(key(nx, ny))) {
        prev.set(key(nx, ny), key(x, y));
        q.push([nx, ny]);
      }
    }
  }
  return null;
}

// Free tiles next to an object, where the player can stand to use it.
export function standSpots(o: WorldObject, extra?: Set<number>): [number, number][] {
  const spots: [number, number][] = [];
  for (let x = o.x - 1; x <= o.x + o.w; x++) {
    for (let y = o.y - 1; y <= o.y + o.h; y++) {
      const inside = x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h;
      const diagonal = (x < o.x || x >= o.x + o.w) && (y < o.y || y >= o.y + o.h);
      if (!inside && !diagonal && walkable(x, y, extra)) spots.push([x, y]);
    }
  }
  return spots;
}

/* ------------------------------ drawing ------------------------------ */

const OUT = "#2a2520";
function r(ctx: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

export const WALLPAPER: Record<string, string> = { b: "#a5d8ff", k: "#ffe066", u: "#d0bfff", l: "#b2f2bb", r: "#fcc2d7", g: "#ffd8a8", ".": "#ffec99" };

function drawFloor(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, tx: number, ty: number) {
  switch (ch) {
    case "b": // small white tiles
      r(ctx, "#f1f8ff", x, y, 16, 16);
      r(ctx, "#bfe0ff", x, y + 7, 16, 1);
      r(ctx, "#bfe0ff", x, y + 15, 16, 1);
      r(ctx, "#bfe0ff", x + 7, y, 1, 16);
      r(ctx, "#bfe0ff", x + 15, y, 1, 16);
      break;
    case "k": // checker
      r(ctx, "#fff4e0", x, y, 16, 16);
      r(ctx, "#ff8a65", x, y, 8, 8);
      r(ctx, "#ff8a65", x + 8, y + 8, 8, 8);
      break;
    case "u":
    case "g": // concrete
      r(ctx, ch === "u" ? "#cfd8ff" : "#c9c2b6", x, y, 16, 16);
      if ((tx * 7 + ty * 3) % 5 === 0) r(ctx, "#a9a59d", x + 4, y + 9, 2, 1);
      if ((tx + ty) % 4 === 0) r(ctx, "#a9a59d", x + 11, y + 3, 1, 1);
      if (ch === "g" && tx === 20 && ty === 12) r(ctx, "#8d8a84", x + 2, y + 5, 9, 5); // oil stain
      break;
    case "l": // carpet
      r(ctx, "#69db7c", x, y, 16, 16);
      if ((tx + ty) % 2 === 0) r(ctx, "#51cf66", x + 3, y + 3, 1, 1);
      else r(ctx, "#51cf66", x + 11, y + 10, 1, 1);
      break;
    case "r": // light wood
    case ".": {
      const base = ch === "r" ? "#ffd8a8" : "#e8a86b";
      const seam = ch === "r" ? "#f4b77a" : "#c98546";
      r(ctx, base, x, y, 16, 16);
      r(ctx, seam, x, y + 4, 16, 1);
      r(ctx, seam, x, y + 9, 16, 1);
      r(ctx, seam, x, y + 14, 16, 1);
      r(ctx, seam, x + ((tx * 5) % 13) + 1, y, 1, 4);
      r(ctx, seam, x + ((tx * 3 + 6) % 13) + 1, y + 5, 1, 4);
      break;
    }
  }
}

export function drawHouse(ctx: CanvasRenderingContext2D, wallpaper: Partial<Record<string, string>> = {}, underlay?: (ctx: CanvasRenderingContext2D) => void) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = MAP[ty][tx];
      const x = tx * TILE, y = ty * TILE;
      if (ch !== "#") {
        drawFloor(ctx, ch, x, y, tx, ty);
        continue;
      }
      const below = MAP[ty + 1]?.[tx];
      if (below && below !== "#") {
        // wall face with wallpaper and baseboard (3/4 view)
        r(ctx, "#5f3dc4", x, y, 16, 4);
        r(ctx, wallpaper[below] ?? WALLPAPER[below] ?? "#ddd", x, y + 4, 16, 10);
        r(ctx, "#ffffff55", x, y + 4, 16, 1);
        r(ctx, "#845ef7", x, y + 14, 16, 2);
      } else {
        r(ctx, "#5f3dc4", x, y, 16, 16);
        r(ctx, "#7048e8", x + 1, y + 1, 14, 14);
      }
    }
  }
  // door frames
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (MAP[ty][tx] === "." && (MAP[ty - 1]?.[tx] !== "#" || MAP[ty + 1]?.[tx] !== "#") && MAP[ty][tx - 1] === "#" && MAP[ty][tx + 1] === "#") {
        r(ctx, "#7a5232", tx * TILE, ty * TILE, 2, 16);
        r(ctx, "#7a5232", tx * TILE + 14, ty * TILE, 2, 16);
      }
    }
  }
  underlay?.(ctx); // rugs and other floor decorations
  for (const o of OBJECTS) drawObject(ctx, o);
}

function counterBase(ctx: CanvasRenderingContext2D, x: number, y: number) {
  r(ctx, OUT, x, y + 2, 16, 14);
  r(ctx, "#e7d8bb", x, y + 3, 16, 4);
  r(ctx, "#e8913a", x, y + 7, 16, 8);
  r(ctx, "#7a5232", x + 7, y + 8, 1, 6);
  r(ctx, "#d9c08f", x + 5, y + 10, 1, 1);
  r(ctx, "#d9c08f", x + 9, y + 10, 1, 1);
}

function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number, c: string) {
  for (let a = 0; a < 64; a++) {
    const t = (a / 64) * Math.PI * 2;
    r(ctx, c, Math.round(cx + Math.cos(t) * rad), Math.round(cy + Math.sin(t) * rad), 1, 1);
  }
}

export function drawObject(ctx: CanvasRenderingContext2D, o: WorldObject, ox = o.x * TILE, oy = o.y * TILE) {
  const x = ox, y = oy;
  switch (o.id) {
    case "bathtub":
      r(ctx, OUT, x + 1, y + 1, 30, 46);
      r(ctx, "#f7f9fa", x + 2, y + 2, 28, 44);
      r(ctx, "#9fd3e6", x + 5, y + 7, 22, 36);
      r(ctx, "#c9ecf7", x + 8, y + 10, 2, 10);
      r(ctx, "#a8b0b5", x + 14, y + 2, 4, 4);
      r(ctx, "#5c7cfa", x + 22, y + 38, 3, 3);
      break;
    case "bath-sink":
      r(ctx, OUT, x + 4, y - 11, 8, 8);
      r(ctx, "#d7eef5", x + 5, y - 10, 6, 6);
      r(ctx, "#ffffff", x + 6, y - 9, 2, 1);
      r(ctx, OUT, x + 1, y + 2, 14, 13);
      r(ctx, "#f59f00", x + 2, y + 3, 12, 11);
      r(ctx, "#f7f9fa", x + 3, y + 3, 10, 5);
      r(ctx, "#bfe3ef", x + 5, y + 4, 6, 3);
      r(ctx, "#a8b0b5", x + 7, y + 2, 2, 2);
      r(ctx, "#8a6440", x + 7, y + 10, 2, 1);
      break;
    case "toilet":
      r(ctx, OUT, x + 2, y - 2, 12, 11);
      r(ctx, "#f7f9fa", x + 3, y - 1, 10, 9);
      r(ctx, "#dde3e6", x + 3, y + 6, 10, 2);
      r(ctx, "#a8b0b5", x + 3, y + 1, 2, 1);
      r(ctx, OUT, x + 3, y + 9, 10, 15);
      r(ctx, "#f7f9fa", x + 4, y + 10, 8, 13);
      r(ctx, "#9fd3e6", x + 6, y + 12, 4, 8);
      r(ctx, OUT, x + 6, y + 24, 4, 3);
      break;
    case "fridge":
      r(ctx, OUT, x + 1, y - 9, 14, 40);
      r(ctx, "#e9eef0", x + 2, y - 8, 12, 38);
      r(ctx, OUT, x + 2, y + 5, 12, 1);
      r(ctx, "#8a9399", x + 11, y - 4, 1, 6);
      r(ctx, "#8a9399", x + 11, y + 8, 1, 9);
      r(ctx, "#e8590c", x + 4, y + 11, 3, 3);
      r(ctx, "#4c9be8", x + 5, y - 5, 3, 2);
      break;
    case "counter-1":
    case "counter-2":
    case "counter-3":
    case "counter-4":
      counterBase(ctx, x, y);
      if (o.id === "counter-1") r(ctx, "#c2410c", x + 5, y + 2, 5, 3); // a fruit bowl
      if (o.id === "counter-3") {
        r(ctx, OUT, x + 4, y - 1, 6, 5);
        r(ctx, "#5f9ea0", x + 5, y, 4, 3); // kettle
      }
      break;
    case "stove":
      r(ctx, OUT, x, y + 1, 16, 15);
      r(ctx, "#dfe3e6", x + 1, y + 2, 14, 13);
      r(ctx, "#2b2b2b", x + 2, y + 3, 5, 3);
      r(ctx, "#2b2b2b", x + 9, y + 3, 5, 3);
      r(ctx, "#e03131", x + 4, y + 4, 1, 1);
      r(ctx, "#4a4a4a", x + 3, y + 9, 10, 5);
      r(ctx, "#f08c00", x + 5, y + 11, 6, 1);
      // range hood
      r(ctx, OUT, x + 1, y - 12, 14, 6);
      r(ctx, "#a8b0b5", x + 2, y - 11, 12, 4);
      break;
    case "kitchen-sink":
      counterBase(ctx, x, y);
      r(ctx, "#b7c4cc", x + 2, y + 3, 12, 4);
      r(ctx, "#8a9ba5", x + 3, y + 4, 10, 2);
      r(ctx, "#8a9399", x + 7, y + 1, 2, 3);
      r(ctx, OUT, x + 2, y - 13, 12, 10);
      r(ctx, "#9ed0f0", x + 3, y - 12, 10, 8);
      r(ctx, OUT, x + 7, y - 12, 1, 8);
      r(ctx, "#ffffff", x + 4, y - 11, 2, 2);
      break;
    case "microwave":
      counterBase(ctx, x, y);
      r(ctx, OUT, x + 1, y - 4, 14, 9);
      r(ctx, "#e9eef0", x + 2, y - 3, 12, 7);
      r(ctx, "#4a4a4a", x + 3, y - 2, 7, 5);
      r(ctx, "#69db7c", x + 11, y - 2, 2, 1);
      r(ctx, "#8a9399", x + 11, y, 2, 3);
      break;
    case "table":
      r(ctx, OUT, x + 2, y + 1, 28, 12);
      r(ctx, "#f2a65a", x + 3, y + 2, 26, 9);
      r(ctx, "#ffffff", x + 8, y + 4, 5, 4);
      r(ctx, "#f1f3f5", x + 19, y + 4, 5, 4);
      r(ctx, OUT, x + 4, y + 13, 2, 3);
      r(ctx, OUT, x + 26, y + 13, 2, 3);
      break;
    case "breaker":
      r(ctx, OUT, x + 3, y - 13, 10, 12);
      r(ctx, "#b5b9bc", x + 4, y - 12, 8, 10);
      for (let i = 0; i < 4; i++) {
        r(ctx, OUT, x + 5, y - 11 + i * 2, 2, 1);
        r(ctx, OUT, x + 9, y - 11 + i * 2, 2, 1);
      }
      r(ctx, OUT, x + 2, y + 6, 12, 9);
      r(ctx, "#8d6e4f", x + 3, y + 7, 10, 7);
      r(ctx, "#ffd43b", x + 5, y + 9, 6, 3); // toolbox
      break;
    case "washer":
    case "dryer":
      r(ctx, OUT, x + 1, y - 5, 14, 21);
      r(ctx, "#f1f3f5", x + 2, y - 4, 12, 19);
      r(ctx, "#cfd6db", x + 2, y - 4, 12, 4);
      r(ctx, o.id === "washer" ? "#4c9be8" : "#f08c00", x + 10, y - 3, 2, 2);
      r(ctx, OUT, x + 4, y + 2, 8, 9);
      r(ctx, o.id === "washer" ? "#9fc7dc" : "#7d8a94", x + 5, y + 3, 6, 7);
      r(ctx, "#ffffff88", x + 6, y + 4, 2, 2);
      break;
    case "water-heater":
      r(ctx, "#b87333", x + 5, y - 13, 1, 5);
      r(ctx, "#b87333", x + 10, y - 13, 1, 5);
      r(ctx, OUT, x + 3, y - 9, 10, 40);
      r(ctx, "#d9dcdf", x + 4, y - 8, 8, 38);
      r(ctx, "#bfc3c7", x + 4, y - 2, 8, 1);
      r(ctx, "#bfc3c7", x + 4, y + 18, 8, 1);
      r(ctx, "#f03e3e", x + 6, y + 22, 4, 3);
      break;
    case "lamp":
      r(ctx, OUT, x + 4, y + 12, 8, 3);
      r(ctx, OUT, x + 7, y - 2, 2, 14);
      r(ctx, OUT, x + 2, y - 9, 12, 8);
      r(ctx, "#f6d365", x + 3, y - 8, 10, 6);
      r(ctx, "#fff3bf", x + 5, y - 7, 3, 2);
      break;
    case "tv":
      r(ctx, OUT, x + 2, y + 5, 28, 10);
      r(ctx, "#7a5232", x + 3, y + 6, 26, 8);
      r(ctx, "#5c3d22", x + 15, y + 7, 1, 6);
      r(ctx, OUT, x + 3, y - 11, 26, 16);
      r(ctx, "#2c3e50", x + 4, y - 10, 24, 13);
      r(ctx, "#4f6d8a", x + 6, y - 9, 7, 2);
      r(ctx, OUT, x + 14, y + 4, 4, 2);
      break;
    case "outlet":
      r(ctx, OUT, x + 5, y - 9, 6, 7);
      r(ctx, "#f4f1ea", x + 6, y - 8, 4, 5);
      r(ctx, OUT, x + 7, y - 7, 1, 1);
      r(ctx, OUT, x + 7, y - 5, 1, 1);
      r(ctx, "#f4f1ea", x + 7, y - 2, 1, 6);
      r(ctx, "#f4f1ea", x + 8, y + 3, 1, 3);
      r(ctx, OUT, x + 5, y + 6, 7, 9);
      r(ctx, "#5c7cfa", x + 6, y + 7, 5, 7);
      r(ctx, "#a5b4fc", x + 7, y + 8, 2, 1);
      break;
    case "couch":
      r(ctx, OUT, x + 1, y, 46, 16);
      r(ctx, "#e64980", x + 2, y + 1, 44, 14);
      r(ctx, "#f06595", x + 6, y + 1, 36, 7);
      r(ctx, "#e64980", x + 24, y + 1, 1, 7);
      r(ctx, "#f6c344", x + 8, y + 2, 5, 4);
      break;
    case "plant":
      r(ctx, OUT, x + 4, y + 9, 8, 7);
      r(ctx, "#c2410c", x + 5, y + 10, 6, 5);
      r(ctx, "#2b8a3e", x + 3, y + 1, 4, 8);
      r(ctx, "#37b24d", x + 7, y - 3, 3, 12);
      r(ctx, "#2b8a3e", x + 10, y + 2, 3, 7);
      break;
    case "bed":
      r(ctx, OUT, x + 1, y - 4, 30, 51);
      r(ctx, "#8b5e3c", x + 2, y - 3, 28, 9);
      r(ctx, "#ffffff", x + 4, y + 7, 10, 7);
      r(ctx, "#ffffff", x + 18, y + 7, 10, 7);
      r(ctx, "#74c0fc", x + 2, y + 16, 28, 30);
      r(ctx, "#a5d8ff", x + 2, y + 16, 28, 3);
      r(ctx, "#4dabf7", x + 8, y + 27, 3, 3);
      r(ctx, "#4dabf7", x + 20, y + 35, 3, 3);
      break;
    case "nightstand":
      r(ctx, OUT, x + 2, y + 2, 12, 13);
      r(ctx, "#e8913a", x + 3, y + 3, 10, 11);
      r(ctx, "#7a5232", x + 3, y + 9, 10, 1);
      r(ctx, OUT, x + 5, y + 3, 5, 5);
      r(ctx, "#74c0fc", x + 6, y + 4, 3, 3);
      break;
    case "desk":
      r(ctx, OUT, x, y + 2, 32, 13);
      r(ctx, "#f2a65a", x + 1, y + 3, 30, 11);
      r(ctx, OUT, x + 9, y - 6, 14, 10);
      r(ctx, "#74c0fc", x + 10, y - 5, 12, 8);
      r(ctx, "#d0ebff", x + 11, y - 4, 3, 1);
      r(ctx, OUT, x + 8, y + 4, 16, 6);
      r(ctx, "#b8bec4", x + 9, y + 5, 14, 4);
      r(ctx, "#f6c344", x + 26, y + 5, 3, 4); // mug
      break;
    case "workbench":
      r(ctx, OUT, x + 2, y - 13, 44, 11);
      r(ctx, "#d4b483", x + 3, y - 12, 42, 9);
      r(ctx, OUT, x + 7, y - 11, 1, 7);
      r(ctx, OUT, x + 6, y - 11, 3, 2); // hammer
      r(ctx, "#e03131", x + 15, y - 10, 6, 2);
      r(ctx, OUT, x + 17, y - 8, 2, 4); // drill
      r(ctx, OUT, x + 28, y - 11, 1, 7);
      r(ctx, OUT, x + 33, y - 11, 4, 1); // saw
      r(ctx, "#a8b0b5", x + 33, y - 10, 7, 4);
      r(ctx, OUT, x, y + 2, 48, 13);
      r(ctx, "#e8913a", x + 1, y + 3, 46, 5);
      r(ctx, "#7a5232", x + 1, y + 8, 46, 6);
      break;
    case "bike":
      ring(ctx, x + 7, y + 9, 6, OUT);
      ring(ctx, x + 25, y + 9, 6, OUT);
      ring(ctx, x + 7, y + 9, 5, "#495057");
      ring(ctx, x + 25, y + 9, 5, "#495057");
      r(ctx, "#e8590c", x + 9, y + 4, 14, 2);
      for (let i = 0; i < 5; i++) r(ctx, "#e8590c", x + 9 + i * 2, y + 6 + i, 2, 1);
      for (let i = 0; i < 5; i++) r(ctx, "#e8590c", x + 22 - i, y + 5 + i, 1, 1);
      r(ctx, OUT, x + 9, y + 1, 6, 2);
      r(ctx, OUT, x + 22, y, 5, 2);
      break;
    case "mower":
      r(ctx, OUT, x + 3, y - 4, 1, 10);
      r(ctx, OUT, x + 12, y - 4, 1, 10);
      r(ctx, OUT, x + 3, y - 4, 10, 1);
      r(ctx, OUT, x + 2, y + 5, 12, 9);
      r(ctx, "#2f9e44", x + 3, y + 6, 10, 7);
      r(ctx, "#69db7c", x + 4, y + 7, 3, 1);
      r(ctx, OUT, x + 1, y + 13, 4, 3);
      r(ctx, OUT, x + 11, y + 13, 4, 3);
      break;
  }
}
