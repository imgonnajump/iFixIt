"use client";

import { useState } from "react";
import type { Box } from "@/lib/image";

const BOX_ASPECT = 4 / 3; // container width / height

// Shows a photo zoomed in on a bounding box, with the box highlighted.
// Math: the photo is a background image `s` frame-widths wide and `t` frame-heights
// tall, shifted by (ox, oy). Image point u lands at frame point ox + u*s.
// background-position p% means a shift of p*(1-s), so p = ox / (1-s).
export function StepPhoto({
  src,
  aspect,
  box,
  label,
  tone = "orange",
  caption = "Your photo",
}: {
  src: string;
  aspect: number;
  box: Box;
  label: string;
  tone?: "orange" | "red" | "green";
  caption?: string;
}) {
  const [zoomed, setZoomed] = useState(true);

  const x1 = box.x1 / 100, x2 = box.x2 / 100, y1 = box.y1 / 100, y2 = box.y2 / 100;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  const cover = Math.max(1, aspect / BOX_ASPECT); // image width in container widths at zoom 1
  const toT = BOX_ASPECT / aspect; // image height in container heights per unit of s
  // Zoom so the box fills about 60% of the frame, between 1x and 4x.
  const fit = 0.6 / Math.max((x2 - x1) * cover, (y2 - y1) * cover * toT, 0.01);
  const z = zoomed ? Math.min(4, Math.max(1, fit)) : 1;
  const s = z * cover; // image width / frame width
  const t = s * toT; // image height / frame height

  // Center the box in the frame, but never show past the photo's edges.
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const ox = clamp(0.5 - cx * s, 1 - s, 0);
  const oy = clamp(0.5 - cy * t, 1 - t, 0);
  const px = s > 1 ? ox / (1 - s) : 0.5;
  const py = t > 1 ? oy / (1 - t) : 0.5;

  const left = ox + x1 * s;
  const right = ox + x2 * s;
  const top = oy + y1 * t;
  const bottom = oy + y2 * t;

  const ring = { orange: "border-orange-500", red: "border-rose-500", green: "border-emerald-500" }[tone];
  const chip = { orange: "bg-orange-600", red: "bg-rose-600", green: "bg-emerald-600" }[tone];
  // Label above the box; below it if there's no room; inside it if the box fills the frame.
  const labelTop =
    top >= 0.12 ? `calc(${top * 100}% - 26px)` : bottom < 0.85 ? `calc(${bottom * 100}% + 6px)` : `calc(${top * 100}% + 8px)`;

  return (
    <button
      type="button"
      onClick={() => setZoomed((v) => !v)}
      className="relative mt-3 block w-full overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800"
      style={{
        aspectRatio: `${BOX_ASPECT}`,
        backgroundImage: `url(${src})`,
        backgroundSize: `${s * 100}% auto`,
        backgroundPosition: `${px * 100}% ${py * 100}%`,
        backgroundRepeat: "no-repeat",
        transition: "background-size 300ms ease, background-position 300ms ease",
      }}
      aria-label={`${caption}: ${label}. Tap to ${zoomed ? "zoom out" : "zoom in"}.`}
    >
      <span
        className={`absolute rounded-lg border-[3px] ${ring} transition-all duration-300`}
        style={{
          left: `${left * 100}%`,
          top: `${top * 100}%`,
          width: `${(right - left) * 100}%`,
          height: `${(bottom - top) * 100}%`,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.38), 0 0 18px 2px rgba(255,255,255,0.35)",
        }}
      />
      <span
        className={`absolute -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold text-white shadow ${chip}`}
        style={{
          left: `${Math.min(85, Math.max(15, ((left + right) / 2) * 100))}%`,
          top: labelTop,
        }}
      >
        {label}
      </span>
      <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-xs text-white" aria-hidden>
        {zoomed ? "⤢" : "🔍"}
      </span>
    </button>
  );
}

export function StepPhotoSkeleton() {
  return (
    <div className="mt-3 flex aspect-[4/3] w-full animate-pulse items-center justify-center rounded-xl bg-stone-200 text-xs text-stone-500 dark:bg-stone-800">
      Finding it on your photo…
    </div>
  );
}
