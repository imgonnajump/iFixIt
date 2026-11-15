"use client";

import { useEffect, useRef, useState } from "react";
import { drawDecor, ITEM, PAINT_PRICE, SHOP, WALLPAPERS, type DecorId, type House, type Placed } from "@/lib/house";
import { ROOM_IDS, ROOMS, WALLPAPER } from "@/lib/pixel/world";
import { PixelIcon } from "./PixelIcon";

export function HouseShop({
  house,
  setHouse,
  coins,
  placing,
  onPlace,
  picked,
  onPickUp,
  message,
}: {
  house: House;
  setHouse: (h: House) => void;
  coins: number;
  placing: DecorId | null;
  onPlace: (id: DecorId) => void;
  picked: Placed | null;
  onPickUp: (d: Placed) => void;
  message: string;
}) {
  const [tab, setTab] = useState<"shop" | "paint" | "placed">("shop");
  const [room, setRoom] = useState<(typeof ROOM_IDS)[number]>("living");
  const [note, setNote] = useState("");
  // The newest message wins: a placement result replaces an older "bought it" note.
  useEffect(() => {
    if (message) setNote("");
  }, [message]);

  function buy(id: DecorId) {
    const it = ITEM[id];
    if (coins < it.price) {
      setNote(`You need ${it.price - coins} more coins. Fix something to earn more!`);
      return;
    }
    setHouse({ ...house, spent: house.spent + it.price, inventory: { ...house.inventory, [id]: (house.inventory[id] ?? 0) + 1 } });
    setNote(`Bought the ${it.name.toLowerCase()}! Now tap Place.`);
  }

  function paint(color: string) {
    const ch = ROOMS[room].char;
    if ((house.wallpaper[ch] ?? WALLPAPER[ch]) === color) return;
    if (coins < PAINT_PRICE) {
      setNote(`Paint costs ${PAINT_PRICE} coins. Fix something to earn more!`);
      return;
    }
    setHouse({ ...house, spent: house.spent + PAINT_PRICE, wallpaper: { ...house.wallpaper, [ch]: color } });
    setNote(`Painted the ${ROOMS[room].name.toLowerCase()}!`);
  }

  const current = house.wallpaper[ROOMS[room].char] ?? WALLPAPER[ROOMS[room].char];

  return (
    <div className="card space-y-3 p-3" role="region" aria-label="Decorate your house">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-extrabold">
          <PixelIcon name="coin" size={18} /> {coins} coins
        </p>
        <p className="text-xs muted">Earn coins with every fix: harder fixes pay more, and doing it yourself pays a bonus.</p>
      </div>

      <p className="min-h-5 text-sm font-bold text-[var(--tab-text)]" aria-live="polite">
        {note || message}
      </p>

      {picked && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-[var(--focus)] bg-[var(--paper-2)] p-2">
          <DecorThumb id={picked.item} />
          <span className="flex-1 font-bold">{ITEM[picked.item].name}</span>
          <button type="button" className="btn btn-sm" onClick={() => onPickUp(picked)}>
            Pick up
          </button>
        </div>
      )}

      <div role="tablist" aria-label="Decorate" className="flex gap-1">
        {(["shop", "paint", "placed"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            type="button"
            onClick={() => setTab(t)}
            className={`chip flex-1 justify-center font-bold ${tab === t ? "border-[var(--ink)] bg-[var(--accent)] text-[var(--accent-ink)]" : ""}`}
          >
            {t === "shop" ? "Shop" : t === "paint" ? "Paint" : `Placed (${house.placed.length})`}
          </button>
        ))}
      </div>

      {tab === "shop" && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SHOP.map((it) => {
            const owned = house.inventory[it.id] ?? 0;
            return (
              <li key={it.id} className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-center ${placing === it.id ? "border-[var(--focus)]" : "border-[var(--line)]"} bg-[var(--paper-2)]`}>
                <DecorThumb id={it.id} />
                <span className="text-sm font-bold leading-tight">{it.name}</span>
                <span className="flex items-center gap-1 text-xs font-bold">
                  <PixelIcon name="coin" size={12} /> {it.price}
                  {owned > 0 && <span className="stamp ml-1 text-[var(--good)]">x{owned}</span>}
                </span>
                <span className="mt-1 flex gap-1">
                  <button type="button" className="btn btn-sm px-2 text-xs" onClick={() => buy(it.id)} disabled={coins < it.price} aria-label={`Buy ${it.name} for ${it.price} coins`}>
                    Buy
                  </button>
                  {owned > 0 && (
                    <button type="button" className="btn btn-sm btn-primary px-2 text-xs" onClick={() => onPlace(it.id)} aria-label={`Place ${it.name}`}>
                      Place
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "paint" && (
        <div className="space-y-3">
          <div>
            <label htmlFor="paint-room" className="mb-1 block text-sm font-bold">
              Room
            </label>
            <select id="paint-room" className="field" value={room} onChange={(e) => setRoom(e.target.value as typeof room)}>
              {ROOM_IDS.map((id) => (
                <option key={id} value={id}>
                  {ROOMS[id].name}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-bold">
              Wallpaper <span className="font-normal muted">({PAINT_PRICE} coins)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {WALLPAPERS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => paint(c)}
                  aria-label={`Wallpaper color ${i + 1}${current === c ? " (current)" : ""}`}
                  aria-pressed={current === c}
                  className={`h-10 w-10 rounded-md border-2 ${current === c ? "border-[var(--ink)] ring-2 ring-[var(--focus)]" : "border-[var(--line)]"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {tab === "placed" && (
        <ul className="dash-list">
          {house.placed.length === 0 && <li className="py-2 text-sm muted">Nothing placed yet. Buy something in the shop!</li>}
          {house.placed.map((d) => (
            <li key={d.uid} className="flex items-center gap-3 py-2">
              <DecorThumb id={d.item} />
              <span className="flex-1 text-sm font-bold">{ITEM[d.item].name}</span>
              <button type="button" className="btn btn-sm text-xs" onClick={() => onPickUp(d)}>
                Pick up
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DecorThumb({ id }: { id: DecorId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const it = ITEM[id];
  const size = Math.max(it.w, it.h) * 16 + 16;
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    drawDecor(ctx, id, (size - it.w * 16) / 2, (size - it.h * 16) / 2 + 4, 0);
  }, [id, size, it.w, it.h]);
  return <canvas ref={ref} width={size} height={size} className="pixelated h-12 w-12 shrink-0" aria-hidden />;
}
