"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawAvatar, type Dir } from "@/lib/pixel/avatar";
import {
  COLS,
  drawHouse,
  drawObject,
  findPath,
  FIXABLE,
  objectAt,
  OBJECTS,
  ROOM_IDS,
  ROOMS,
  ROWS,
  roomAt,
  standSpots,
  TILE,
  walkable,
  type WorldObject,
} from "@/lib/pixel/world";
import { blockedBy, canPlace, decorAt, drawDecor, ITEM, type DecorId, type House, type Placed } from "@/lib/house";
import type { Avatar } from "@/lib/profile";
import { HouseShop } from "./HouseShop";
import { PixelIcon } from "./PixelIcon";

const W = COLS * TILE;
const H = ROWS * TILE;
const STEP_MS = 130;
const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

type Player = { x: number; y: number; fromX: number; fromY: number; t0: number; dir: Dir; moving: boolean };

export function PixelWorld({
  avatar,
  active = true,
  onPick,
  house,
  setHouse,
  coins,
}: {
  avatar: Avatar;
  active?: boolean;
  onPick: (o: WorldObject, issue: string) => void;
  house: House;
  setHouse: (h: House) => void;
  coins: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticRef = useRef<HTMLCanvasElement | null>(null);
  const player = useRef<Player>({ x: 11, y: 8, fromX: 11, fromY: 8, t0: 0, dir: "down", moving: false });
  const path = useRef<[number, number][]>([]);
  const target = useRef<WorldObject | null>(null);
  const hover = useRef<WorldObject | null>(null);
  const raf = useRef(0);
  const avatarRef = useRef(avatar);
  avatarRef.current = avatar;
  const houseRef = useRef(house);
  const blockedRef = useRef<Set<number>>(blockedBy(house.placed));
  const ghost = useRef<[number, number] | null>(null);
  const [decorating, setDecorating] = useState(false);
  const [placing, setPlacing] = useState<DecorId | null>(null);
  const placingRef = useRef<DecorId | null>(null);
  placingRef.current = placing;
  const [picked, setPicked] = useState<Placed | null>(null);
  const pickedRef = useRef<Placed | null>(null);
  pickedRef.current = picked;
  // Moving an item that's already placed (by drag, the Move button, or the keyboard).
  const [moving, setMoving] = useState<Placed | null>(null);
  const movingRef = useRef<Placed | null>(null);
  movingRef.current = moving;
  const drag = useRef<{ d: Placed; offX: number; offY: number; started: boolean } | null>(null);
  const [message, setMessage] = useState("");

  // Rebuild the static layer and walking rules whenever the house changes.
  useEffect(() => {
    houseRef.current = house;
    blockedRef.current = blockedBy(house.placed);
    staticRef.current = null;
  }, [house]);

  const [selected, setSelected] = useState<WorldObject | null>(null);
  const [near, setNear] = useState<WorldObject | null>(null);
  const [room, setRoom] = useState<string>("Hallway");
  const [other, setOther] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const facing = useCallback((): WorldObject | null => {
    const p = player.current;
    const [dx, dy] = DIRS[p.dir];
    const o = objectAt(p.x + dx, p.y + dy);
    return o && !o.decor ? o : null;
  }, []);

  const select = useCallback((o: WorldObject) => {
    setSelected(o);
    setOther("");
    requestAnimationFrame(() => cardRef.current?.focus());
  }, []);

  const draw = useCallback(
    (now: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      if (!staticRef.current) {
        const s = document.createElement("canvas");
        s.width = W;
        s.height = H;
        const h = houseRef.current;
        drawHouse(s.getContext("2d")!, h.wallpaper, (sctx) => {
          for (const d of h.placed) if (ITEM[d.item].walkable && d.item !== "vacuum") drawDecor(sctx, d.item, d.x * TILE, d.y * TILE);
        });
        staticRef.current = s;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(staticRef.current, 0, 0);

      const p = player.current;
      const t = p.moving ? Math.min(1, (now - p.t0) / STEP_MS) : 1;
      const px = (p.fromX + (p.x - p.fromX) * t) * TILE;
      const py = (p.fromY + (p.y - p.fromY) * t) * TILE;

      // highlight the object you're facing (or hovering)
      const f = !p.moving ? facing() : null;
      for (const o of [hover.current, f]) {
        if (!o) continue;
        ctx.strokeStyle = o === f ? "#e8590c" : "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(o.x * TILE + 0.5, o.y * TILE - 0.5, o.w * TILE - 1, o.h * TILE);
      }
      if (f) {
        // a bobbing "!" bubble
        const bx = (f.x + f.w / 2) * TILE - 4;
        const by = f.y * TILE - 22 + Math.round(Math.sin(now / 180) * 1.5);
        ctx.fillStyle = "#2a2520";
        ctx.fillRect(bx - 1, by - 1, 10, 11);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(bx, by, 8, 9);
        ctx.fillStyle = "#e8590c";
        ctx.fillRect(bx + 3, by + 1, 2, 5);
        ctx.fillRect(bx + 3, by + 7, 2, 1);
      }

      // decorations that move or stand up (drawn every frame)
      const live = houseRef.current.placed.filter((d) => !ITEM[d.item].walkable || d.item === "vacuum");
      for (const d of live) drawDecor(ctx, d.item, d.x * TILE, d.y * TILE, now);
      if (pickedRef.current) {
        const d = pickedRef.current, it = ITEM[d.item];
        ctx.strokeStyle = "#7048e8";
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x * TILE + 1, d.y * TILE + 1, it.w * TILE - 2, it.h * TILE - 2);
      }

      const frame = p.moving ? Math.floor(now / 110) % 2 : 0;
      drawAvatar(ctx, avatarRef.current, Math.round(px), Math.round(py) - 4, p.dir, frame);
      for (const d of live) if (d.y > p.y && Math.abs(d.x - p.x) <= 1) drawDecor(ctx, d.item, d.x * TILE, d.y * TILE, now);

      // placement preview
      const item = placingRef.current ?? movingRef.current?.item ?? null;
      if (item && ghost.current) {
        const [gx, gy] = ghost.current;
        const ok = canPlace(houseRef.current, item, gx, gy, [p.x, p.y]).ok;
        ctx.globalAlpha = 0.65;
        drawDecor(ctx, item, gx * TILE, gy * TILE, now);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = ok ? "#2b8a3e" : "#e03131";
        ctx.lineWidth = 2;
        ctx.strokeRect(gx * TILE + 1, gy * TILE + 1, ITEM[item].w * TILE - 2, ITEM[item].h * TILE - 2);
      }

      // Re-draw tall furniture in front of the player when they walk behind it.
      const sx = Math.round(px), sy = Math.round(py) - 4;
      for (const o of OBJECTS) {
        const ox1 = o.x * TILE, ox2 = (o.x + o.w) * TILE, oy1 = o.y * TILE - 14, oy2 = (o.y + o.h) * TILE;
        const overlaps = sx < ox2 && sx + 16 > ox1 && sy < oy2 && sy + 16 > oy1;
        if (overlaps && o.y + o.h - 1 > p.y) drawObject(ctx, o);
      }
    },
    [facing],
  );

  const tick = useCallback(
    (now: number) => {
      const p = player.current;
      if (p.moving && now - p.t0 >= STEP_MS) {
        p.moving = false;
        p.fromX = p.x;
        p.fromY = p.y;
        setRoom(roomAt(p.x, p.y) ? ROOMS[roomAt(p.x, p.y)!].name : "Hallway");
        const next = path.current.shift();
        if (next) {
          stepTo(next[0], next[1], now);
        } else if (target.current) {
          const o = target.current;
          target.current = null;
          // turn to face the object
          const cx = Math.max(o.x, Math.min(p.x, o.x + o.w - 1));
          const cy = Math.max(o.y, Math.min(p.y, o.y + o.h - 1));
          p.dir = cx > p.x ? "right" : cx < p.x ? "left" : cy < p.y ? "up" : "down";
          if (!o.decor) select(o);
        }
        setNear(facing());
      }
      draw(now);
      raf.current = requestAnimationFrame(tick);
    },
     
    [draw, facing, select],
  );

  function stepTo(nx: number, ny: number, now = performance.now()) {
    const p = player.current;
    p.dir = nx > p.x ? "right" : nx < p.x ? "left" : ny < p.y ? "up" : "down";
    p.fromX = p.x;
    p.fromY = p.y;
    p.x = nx;
    p.y = ny;
    p.t0 = now;
    p.moving = true;
  }

  const move = useCallback((dir: Dir) => {
    const p = player.current;
    path.current = [];
    target.current = null;
    if (p.moving) return;
    const [dx, dy] = DIRS[dir];
    if (walkable(p.x + dx, p.y + dy, blockedRef.current)) stepTo(p.x + dx, p.y + dy);
    else {
      p.dir = dir;
      setNear(facing());
    }
  }, [facing]);

  const goTo = useCallback((o: WorldObject) => {
    const p = player.current;
    const spots = standSpots(o, blockedRef.current);
    const route = findPath(p.x, p.y, spots, blockedRef.current);
    if (!route) return;
    target.current = o;
    if (route.length === 0) {
      // already next to it
      target.current = null;
      const cx = Math.max(o.x, Math.min(p.x, o.x + o.w - 1));
      const cy = Math.max(o.y, Math.min(p.y, o.y + o.h - 1));
      p.dir = cx > p.x ? "right" : cx < p.x ? "left" : cy < p.y ? "up" : "down";
      setNear(facing());
      if (!o.decor) select(o);
      return;
    }
    path.current = route;
    if (!p.moving) {
      const n = path.current.shift()!;
      stepTo(n[0], n[1]);
    }
  }, [facing, select]);

  const interact = useCallback(() => {
    const f = facing();
    if (f) select(f);
  }, [facing, select]);

  useEffect(() => {
    if (!active) return; // pause the game loop when the tab is hidden
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [tick, active]);

  function tileFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return [Math.floor(((e.clientX - rect.left) / rect.width) * COLS), Math.floor(((e.clientY - rect.top) / rect.height) * ROWS)];
  }

  function placeAt(tx: number, ty: number) {
    const item = placingRef.current;
    if (!item) return;
    const p = player.current;
    const res = canPlace(houseRef.current, item, tx, ty, [p.x, p.y]);
    if (!res.ok) {
      setMessage(`Can't put it there: ${res.reason}`);
      return;
    }
    const h = houseRef.current;
    const left = (h.inventory[item] ?? 0) - 1;
    setHouse({ ...h, placed: [...h.placed, { uid: Math.random().toString(36).slice(2, 9), item, x: tx, y: ty }], inventory: { ...h.inventory, [item]: left } });
    setMessage(`Placed the ${ITEM[item].name.toLowerCase()}!`);
    if (left <= 0) setPlacing(null);
  }

  function startMove(d: Placed) {
    // Take the item out of the house while it's being moved.
    houseRef.current = { ...house, placed: house.placed.filter((x) => x.uid !== d.uid) };
    blockedRef.current = blockedBy(houseRef.current.placed);
    staticRef.current = null;
    ghost.current = [d.x, d.y];
    setPlacing(null);
    setPicked(null);
    setMoving(d);
    setMessage(`Moving the ${ITEM[d.item].name.toLowerCase()}: tap a new spot, or use the arrow keys and Enter.`);
  }

  function cancelMove(reason?: string) {
    houseRef.current = house;
    blockedRef.current = blockedBy(house.placed);
    staticRef.current = null;
    ghost.current = null;
    setMoving(null);
    setMessage(reason ?? "Move cancelled.");
  }

  function dropAt(tx: number, ty: number): boolean {
    const d = movingRef.current;
    if (!d) return false;
    const p = player.current;
    const res = canPlace(houseRef.current, d.item, tx, ty, [p.x, p.y]);
    if (!res.ok) {
      setMessage(`Can't put it there: ${res.reason}`);
      return false;
    }
    setHouse({ ...house, placed: house.placed.map((x) => (x.uid === d.uid ? { ...x, x: tx, y: ty } : x)) });
    ghost.current = null;
    setMoving(null);
    setMessage(`Moved the ${ITEM[d.item].name.toLowerCase()}!`);
    return true;
  }

  function placeInFront() {
    const p = player.current;
    const [dx, dy] = DIRS[p.dir];
    placeAt(p.x + dx, p.y + dy);
  }

  function pickUp(d: Placed) {
    const h = houseRef.current;
    setHouse({ ...h, placed: h.placed.filter((x) => x.uid !== d.uid), inventory: { ...h.inventory, [d.item]: (h.inventory[d.item] ?? 0) + 1 } });
    setPicked(null);
    setMessage(`Picked up the ${ITEM[d.item].name.toLowerCase()}.`);
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const [tx, ty] = tileFromEvent(e);
    if (placingRef.current) return placeAt(tx, ty);
    if (movingRef.current) {
      dropAt(tx, ty);
      return;
    }
    if (decorating) {
      const d = decorAt(houseRef.current.placed, tx, ty) ?? decorAt(houseRef.current.placed, tx, ty + 1);
      if (d) {
        // select it now; it becomes a drag once the pointer moves to another tile
        setPicked(d);
        setMessage(`${ITEM[d.item].name} selected. Drag it, or press Move.`);
        drag.current = { d, offX: tx - d.x, offY: ty - d.y, started: false };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }
    const o = objectAt(tx, ty) ?? objectAt(tx, ty + 1); // tall things are drawn a bit above their tile
    if (o) return goTo(o);
    const p = player.current;
    const route = findPath(p.x, p.y, [[tx, ty]], blockedRef.current);
    if (route && route.length) {
      target.current = null;
      path.current = route;
      if (!p.moving) {
        const n = path.current.shift()!;
        stepTo(n[0], n[1]);
      }
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const [tx, ty] = tileFromEvent(e);
    const dr = drag.current;
    if (dr) {
      const nx = tx - dr.offX, ny = ty - dr.offY;
      if (!dr.started && (nx !== dr.d.x || ny !== dr.d.y)) {
        dr.started = true;
        startMove(dr.d);
      }
      if (dr.started) ghost.current = [nx, ny];
      e.currentTarget.style.cursor = "grabbing";
      return;
    }
    if (movingRef.current) {
      ghost.current = [tx, ty];
      e.currentTarget.style.cursor = "move";
      return;
    }
    if (placingRef.current) {
      ghost.current = [tx, ty];
      e.currentTarget.style.cursor = "copy";
      return;
    }
    const o = objectAt(tx, ty) ?? objectAt(tx, ty + 1);
    hover.current = o && !o.decor ? o : null;
    e.currentTarget.style.cursor = hover.current ? "pointer" : "default";
  }

  function onPointerUp() {
    const dr = drag.current;
    drag.current = null;
    if (!dr?.started || !ghost.current) return;
    const [gx, gy] = ghost.current;
    if (!dropAt(gx, gy)) {
      const p = player.current;
      const res = canPlace(houseRef.current, dr.d.item, gx, gy, [p.x, p.y]);
      cancelMove(res.ok ? undefined : `Can't put it there: ${res.reason} It went back where it was.`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (movingRef.current && ghost.current) {
      const nudge: Record<string, [number, number]> = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
      if (nudge[k]) {
        e.preventDefault();
        const [gx, gy] = ghost.current;
        ghost.current = [Math.max(0, Math.min(COLS - 1, gx + nudge[k][0])), Math.max(0, Math.min(ROWS - 1, gy + nudge[k][1]))];
        return;
      }
      if (k === "enter" || k === " ") {
        e.preventDefault();
        dropAt(ghost.current[0], ghost.current[1]);
        return;
      }
      if (k === "escape") {
        e.preventDefault();
        cancelMove();
        return;
      }
    }
    const map: Record<string, Dir> = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
    if (map[k]) {
      e.preventDefault();
      move(map[k]);
    } else if (k === "escape" && placingRef.current) {
      setPlacing(null);
    } else if (k === "enter" || k === " " || k === "e") {
      e.preventDefault();
      if (placingRef.current) placeInFront();
      else interact();
    }
  }

  return (
    <section aria-labelledby="world-title" className="space-y-3">
      <div className="card-head">
        <h2 id="world-title" className="title">
          <PixelIcon name="house" /> My home
        </h2>
        <span className="flex items-center gap-2">
          <span className="font-pixel text-xs muted" aria-live="polite">
            {room}
          </span>
          <span className="chip font-bold" aria-label={`${coins} coins`}>
            <PixelIcon name="coin" size={14} /> {coins}
          </span>
          <button
            type="button"
            className={`btn btn-sm ${decorating ? "btn-primary" : ""}`}
            aria-pressed={decorating}
            onClick={() => {
              if (movingRef.current) cancelMove();
              setDecorating((v) => !v);
              setPlacing(null);
              setPicked(null);
              setMessage("");
            }}
          >
            <PixelIcon name="star" size={14} /> {decorating ? "Done" : "Decorate"}
          </button>
        </span>
      </div>

      <p className="text-sm muted">
        Walk to the thing that&apos;s broken and press <kbd className="stamp">E</kbd> (or tap it). Move with the arrow keys / WASD, or tap the floor.
      </p>

      <div ref={worldRef} className="relative overflow-hidden rounded-lg border-2 border-[var(--ink)]" role="group" tabIndex={0} onKeyDown={onKeyDown} aria-label="Pixel home. Use arrow keys to walk and E to inspect. A list of every room and object follows below.">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="pixelated block w-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => (hover.current = null)}
          aria-hidden
        />
        {moving && (
          <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2 rounded-md border-2 border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-xs font-bold">
            <span>Moving the {ITEM[moving.item].name.toLowerCase()}: tap a spot, or arrows + Enter</span>
            <button type="button" className="btn btn-sm px-2 text-xs" onClick={() => cancelMove()}>
              Cancel
            </button>
          </div>
        )}
        {placing && (
          <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2 rounded-md border-2 border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-xs font-bold">
            <span>Tap a spot to place the {ITEM[placing].name.toLowerCase()}</span>
            <span className="flex gap-1">
              <button type="button" className="btn btn-sm px-2 text-xs" onClick={placeInFront}>
                Place in front of me
              </button>
              <button type="button" className="btn btn-sm px-2 text-xs" onClick={() => setPlacing(null)}>
                Cancel
              </button>
            </span>
          </div>
        )}
        {near && !selected && !decorating && (
          <button type="button" onClick={interact} className="btn btn-sm btn-primary absolute bottom-2 left-1/2 -translate-x-1/2 shadow-lg">
            Inspect {near.name.toLowerCase()}
          </button>
        )}
      </div>

      {/* touch controls */}
      <div className="flex items-center justify-between gap-3 sm:hidden" aria-label="Movement controls">
        <div className="grid grid-cols-3 gap-1" style={{ width: 132 }}>
          <span />
          <PadButton label="Walk up" onPress={() => move("up")}>▲</PadButton>
          <span />
          <PadButton label="Walk left" onPress={() => move("left")}>◀</PadButton>
          <PadButton label="Walk down" onPress={() => move("down")}>▼</PadButton>
          <PadButton label="Walk right" onPress={() => move("right")}>▶</PadButton>
        </div>
        <button type="button" onClick={interact} disabled={!near} className="btn btn-primary h-16 w-16 rounded-full font-pixel text-lg" aria-label="Inspect what you're facing">
          E
        </button>
      </div>

      {decorating && (
        <HouseShop
          house={house}
          setHouse={setHouse}
          coins={coins}
          placing={placing}
          onPlace={(id) => {
            setPlacing(id);
            setPicked(null);
            setMessage("");
            // bring the house back into view so you can pick a spot right away
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            worldRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
            worldRef.current?.focus({ preventScroll: true });
          }}
          picked={picked}
          onPickUp={pickUp}
          onMove={(d) => {
            startMove(d);
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            worldRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
            worldRef.current?.focus({ preventScroll: true });
          }}
          message={message}
        />
      )}

      {selected && !decorating && (
        <div ref={cardRef} tabIndex={-1} className="card pop p-4" role="region" aria-label={`${selected.name}: what's wrong?`}>
          <div className="flex items-start gap-3">
            <ObjectThumb o={selected} />
            <div className="min-w-0 flex-1">
              <p className="font-pixel text-xs muted">{ROOMS[selected.room].name}</p>
              <h3 className="text-lg font-extrabold leading-tight">{selected.name}</h3>
              <p className="text-sm muted">What&apos;s wrong with it?</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="btn btn-sm" aria-label="Close">
              <PixelIcon name="close" size={14} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.issues.map((i) => (
              <button key={i} type="button" className="chip" onClick={() => onPick(selected, i)}>
                {i}
              </button>
            ))}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onPick(selected, other.trim() || "Something's wrong");
            }}
          >
            <label className="sr-only" htmlFor="other-issue">
              Describe the problem
            </label>
            <input id="other-issue" className="field" placeholder="Something else…" value={other} onChange={(e) => setOther(e.target.value)} />
            <button className="btn btn-primary btn-sm whitespace-nowrap" type="submit">
              <PixelIcon name="camera" size={16} /> Next
            </button>
          </form>
        </div>
      )}

      <details className="card p-3">
        <summary className="cursor-pointer font-bold">Pick from a list instead</summary>
        <div className="mt-3 space-y-3">
          {ROOM_IDS.map((id) => (
            <div key={id}>
              <h3 className="font-pixel text-xs muted">{ROOMS[id].name}</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {FIXABLE.filter((o) => o.room === id).map((o) => (
                  <button key={o.id} type="button" className="chip" onClick={() => goTo(o)}>
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function PadButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onPress} className="btn btn-sm h-11 w-11 p-0">
      {children}
    </button>
  );
}

// A close-up of one object, cut from the house drawing.
function ObjectThumb({ o }: { o: WorldObject }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = Math.max(o.w, o.h) * TILE + 16;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, w, w);
    ctx.fillStyle = "#efe7d6";
    ctx.fillRect(0, 0, w, w);
    drawObject(ctx, o, (w - o.w * TILE) / 2, (w - o.h * TILE) / 2 + 6);
  }, [o, w]);
  return <canvas ref={ref} width={w} height={w} className="pixelated h-16 w-16 shrink-0 rounded-md border border-[var(--line)]" aria-hidden />;
}
