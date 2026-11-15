"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { drawAvatar } from "@/lib/pixel/avatar";
import type { IconName } from "@/lib/pixel/icons";
import type { Fix } from "@/lib/fixlog";
import type { Profile } from "@/lib/profile";
import { isWrappedSeason, wrap, wrappedYear, type WrappedStats } from "@/lib/wrapped";
import { PixelAvatar } from "./PixelAvatar";
import { PixelIcon } from "./PixelIcon";

const SLIDE_MS = 6000;

type Slide = { bg: string; fg: string; icon: IconName; kicker: string; big: string; sub?: string; extra?: React.ReactNode };

function slidesFor(s: WrappedStats, profile: Profile): Slide[] {
  if (s.count === 0) {
    return [
      { bg: "#1d6f80", fg: "#fff", icon: "gift", kicker: `${s.year} Fixed Wrapped`, big: "Your year in repairs", sub: `Hi ${profile.name}!` },
      { bg: "#f2c94c", fg: "#2a2520", icon: "wrench", kicker: "So far…", big: "No fixes logged yet", sub: "Fix something with FixCam (or log one in your diary) and your Wrapped fills itself in." },
    ];
  }
  const perWeeks = Math.max(1, Math.round(52 / s.count));
  return [
    { bg: "#1d6f80", fg: "#fff", icon: "gift", kicker: `${s.year} Fixed Wrapped`, big: "Your year in repairs", sub: `Ready, ${profile.name}?` },
    {
      bg: "#c2410c",
      fg: "#fff",
      icon: "wrench",
      kicker: "This year you fixed",
      big: `${s.count} ${s.count === 1 ? "thing" : "things"}`,
      sub: s.count > 1 ? `That's about one every ${perWeeks} ${perWeeks === 1 ? "week" : "weeks"}.` : "Every repair counts.",
    },
    {
      bg: "#2b7a3d",
      fg: "#fff",
      icon: "coin",
      kicker: "You saved",
      big: `$${s.saved.toLocaleString()}`,
      sub: `and only spent $${s.spent.toLocaleString()} on parts and help.${s.pizzas > 0 ? ` That's ${s.pizzas} pizzas' worth.` : ""}`,
    },
    {
      bg: "#f2c94c",
      fg: "#2a2520",
      icon: "leaf",
      kicker: "You kept",
      big: `${s.kg} kg`,
      sub: `out of the landfill${s.laptops > 0 ? `, about the weight of ${s.laptops} ${s.laptops === 1 ? "laptop" : "laptops"}` : ""}.`,
    },
    {
      bg: "#5f3dc4",
      fg: "#fff",
      icon: "star",
      kicker: `Your favorite room: ${s.topRoomName} (${s.topRoomCount} ${s.topRoomCount === 1 ? "fix" : "fixes"})`,
      big: s.persona.title,
      sub: s.persona.blurb,
    },
    {
      bg: "#1b2a4a",
      fg: "#fff",
      icon: "book",
      kicker: "Your busiest month",
      big: s.busiestMonth,
      sub: `${s.busiestCount} ${s.busiestCount === 1 ? "fix" : "fixes"}`,
      extra: <MonthBars counts={s.monthCount} />,
    },
    ...(s.hardest
      ? [
          {
            bg: "#f4a6c1",
            fg: "#2a2520",
            icon: "bolt" as IconName,
            kicker: "Your toughest fix",
            big: s.hardest.item,
            sub: `${s.hardest.part ? s.hardest.part + " · " : ""}difficulty ${s.hardest.difficulty}/5. ${s.diyShare}% of your fixes were DIY.`,
          },
        ]
      : []),
  ];
}

function MonthBars({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);
  return (
    <div className="mt-6 flex h-24 items-end gap-1" aria-hidden>
      {counts.map((c, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="w-full rounded-sm bg-white/85" style={{ height: `${(c / max) * 80 + 4}px` }} />
          <span className="font-pixel text-[9px] opacity-80">{"JFMAMJJASOND"[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function WrappedCard({ fixes, profile }: { fixes: Fix[]; profile: Profile }) {
  const [open, setOpen] = useState(false);
  const year = wrappedYear();
  const season = isWrappedSeason();
  const stats = useMemo(() => wrap(fixes, year), [fixes, year]);
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <section aria-labelledby="wrapped-title" className="space-y-3">
      <div className="card-head">
        <h2 id="wrapped-title" className="title">
          <PixelIcon name="gift" /> Fixed Wrapped {year}
        </h2>
        {!season && <span className="stamp muted">unlocks Dec 1</span>}
      </div>
      <div className="overflow-hidden rounded-lg border-2 border-[var(--ink)] bg-[#1d6f80] p-5 text-white">
        <p className="font-pixel text-xs">{season ? "It's here!" : "Sneak peek"}</p>
        <p className="mt-1 text-2xl font-extrabold leading-tight">Your year in repairs</p>
        <p className="mt-1 text-sm">
          {stats.count} {stats.count === 1 ? "fix" : "fixes"} · ${stats.saved.toLocaleString()} saved · {stats.kg} kg kept out of landfill
        </p>
        <button ref={opener} type="button" className="btn mt-4 bg-white text-[#1d6f80]" onClick={() => setOpen(true)}>
          {season ? "Play my Wrapped" : "Preview my Wrapped"}
        </button>
      </div>
      {open && (
        <WrappedStory
          stats={stats}
          profile={profile}
          onClose={() => {
            setOpen(false);
            opener.current?.focus();
          }}
        />
      )}
    </section>
  );
}

function WrappedStory({ stats, profile, onClose }: { stats: WrappedStats; profile: Profile; onClose: () => void }) {
  const slides = useMemo(() => slidesFor(stats, profile), [stats, profile]);
  const total = slides.length + 1; // + summary
  const [i, setI] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [paused, setPaused] = useState(reduced);
  const dialogRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setI((v) => Math.min(total - 1, v + 1)), [total]);
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    dialogRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (paused || i >= total - 1) return;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, paused, next, total]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === " ") {
      e.preventDefault();
      setPaused((p) => !p);
    }
  }

  const s = i < slides.length ? slides[i] : null;
  const bg = s?.bg ?? "#fdfbf6";
  const fg = s?.fg ?? "#2a2520";

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Fixed Wrapped ${stats.year}`}
      tabIndex={-1}
      onKeyDown={onKey}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-6"
    >
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden sm:h-[min(90vh,760px)] sm:rounded-2xl" style={{ background: bg, color: fg }}>
        {/* progress */}
        <div className="flex gap-1 p-3" aria-hidden>
          {Array.from({ length: total }).map((_, k) => (
            <div key={k} className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: `color-mix(in srgb, ${fg} 25%, transparent)` }}>
              <div
                className="h-full"
                style={{
                  background: fg,
                  width: k < i ? "100%" : k === i && !paused && i < total - 1 ? undefined : k === i ? "100%" : "0%",
                  animation: k === i && !paused && i < total - 1 ? `story-bar ${SLIDE_MS}ms linear forwards` : undefined,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-3">
          <span className="font-pixel text-xs opacity-80">
            {i + 1} / {total}
          </span>
          <div className="flex gap-2">
            {i < total - 1 && (
              <button type="button" className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: `color-mix(in srgb, ${fg} 15%, transparent)` }} onClick={() => setPaused((p) => !p)}>
                {paused ? "Play" : "Pause"}
              </button>
            )}
            <button type="button" className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: `color-mix(in srgb, ${fg} 15%, transparent)` }} onClick={onClose} aria-label="Close Wrapped">
              ✕
            </button>
          </div>
        </div>

        {/* tap zones */}
        <button type="button" className="absolute bottom-0 left-0 top-20 z-10 w-1/3 opacity-0" onClick={prev} aria-label="Previous slide" tabIndex={-1} />
        {i < total - 1 && <button type="button" className="absolute bottom-0 right-0 top-20 z-10 w-2/3 opacity-0" onClick={next} aria-label="Next slide" tabIndex={-1} />}

        <div key={i} className="pop flex flex-1 flex-col justify-center px-7 pb-10" aria-live="polite">
          {s ? (
            <>
              <div className="bob mb-6">
                {i === 0 ? <PixelAvatar avatar={profile.avatar} size={96} /> : <PixelIcon name={s.icon} size={64} />}
              </div>
              <p className="text-lg font-bold opacity-90">{s.kicker}</p>
              <p className="mt-2 break-words text-5xl font-extrabold leading-[1.05]">{s.big}</p>
              {s.sub && <p className="mt-4 text-lg leading-snug opacity-90">{s.sub}</p>}
              {s.extra}
            </>
          ) : (
            <Summary stats={stats} profile={profile} onReplay={() => setI(0)} />
          )}
        </div>

        <div className="relative z-20 flex justify-between p-3">
          <button type="button" className="rounded-full px-4 py-2 text-sm font-bold disabled:opacity-30" style={{ background: `color-mix(in srgb, ${fg} 15%, transparent)` }} onClick={prev} disabled={i === 0}>
            ◀ Back
          </button>
          {i < total - 1 && (
            <button type="button" className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: `color-mix(in srgb, ${fg} 15%, transparent)` }} onClick={next}>
              Next ▶
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Summary({ stats, profile, onReplay }: { stats: WrappedStats; profile: Profile; onReplay: () => void }) {
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    try {
      const blob = await renderShareCard(stats, profile);
      const file = new File([blob], `fixed-wrapped-${stats.year}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `My ${stats.year} Fixed Wrapped` });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
    } catch {
      /* share cancelled */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-[#2a2520]">
      <div className="card border-2 border-[#2a2520] bg-[#fdfbf6] p-5">
        <div className="flex items-center gap-3">
          <PixelAvatar avatar={profile.avatar} size={64} />
          <div>
            <p className="font-pixel text-xs text-[#6a6157]">{stats.year} Fixed Wrapped</p>
            <p className="text-xl font-extrabold leading-tight">{profile.name}</p>
            <p className="text-sm font-bold text-[#1d6f80]">{stats.persona.title}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <SummaryStat k="Fixes" v={String(stats.count)} />
          <SummaryStat k="Saved" v={`$${stats.saved.toLocaleString()}`} />
          <SummaryStat k="Kept from landfill" v={`${stats.kg} kg`} />
          <SummaryStat k="Top room" v={stats.topRoomName} />
        </dl>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={share} disabled={busy}>
          {busy ? "Making image…" : "Share my Wrapped"}
        </button>
        <button type="button" className="btn" onClick={onReplay}>
          Replay
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-t border-dashed border-[#d9cfbd] pt-2">
      <dt className="text-xs text-[#6a6157]">{k}</dt>
      <dd className="text-lg font-extrabold">{v}</dd>
    </div>
  );
}

// Draws a 1080x1350 share image.
async function renderShareCard(s: WrappedStats, p: Profile): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1350;
  const ctx = c.getContext("2d")!;
  const probe = document.createElement("span");
  probe.className = "font-pixel";
  document.body.appendChild(probe);
  const pixelFont = getComputedStyle(probe).fontFamily;
  const bodyFont = getComputedStyle(document.body).fontFamily;
  probe.remove();

  ctx.fillStyle = "#1d6f80";
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = "#fdfbf6";
  ctx.fillRect(60, 60, 960, 1230);
  ctx.setLineDash([18, 12]);
  ctx.strokeStyle = "#d9cfbd";
  ctx.lineWidth = 6;
  ctx.strokeRect(90, 90, 900, 1170);
  ctx.setLineDash([]);

  // avatar
  const av = document.createElement("canvas");
  av.width = 20;
  av.height = 20;
  drawAvatar(av.getContext("2d")!, p.avatar, 2, 3, "down", 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(av, 140, 140, 220, 220);

  ctx.fillStyle = "#6a6157";
  ctx.font = `700 34px ${pixelFont}`;
  ctx.fillText(`${s.year} FIXED WRAPPED`, 400, 200);
  ctx.fillStyle = "#2a2520";
  ctx.font = `800 64px ${bodyFont}`;
  ctx.fillText(p.name.slice(0, 22), 400, 280);
  ctx.fillStyle = "#1d6f80";
  ctx.font = `800 40px ${bodyFont}`;
  ctx.fillText(s.persona.title, 400, 340);

  const rows: [string, string][] = [
    ["Fixes", String(s.count)],
    ["Money saved", `$${s.saved.toLocaleString()}`],
    ["Kept from landfill", `${s.kg} kg`],
    ["Favorite room", s.topRoomName],
    ["Busiest month", s.busiestMonth],
  ];
  rows.forEach(([k, v], idx) => {
    const y = 470 + idx * 150;
    ctx.strokeStyle = "#d9cfbd";
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(140, y - 50);
    ctx.lineTo(940, y - 50);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#6a6157";
    ctx.font = `600 34px ${bodyFont}`;
    ctx.fillText(k, 140, y);
    ctx.fillStyle = "#2a2520";
    ctx.font = `800 64px ${bodyFont}`;
    ctx.fillText(v, 140, y + 70);
  });
  ctx.fillStyle = "#c2410c";
  ctx.font = `700 30px ${pixelFont}`;
  ctx.fillText("FIXCAM: DON'T TOSS IT, FIX IT", 140, 1220);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("no image"))), "image/png"));
}
