"use client";

import { useState } from "react";

const BOX = 4 / 3; // container aspect ratio
const ZOOM = 2;

// Shows the user's own photo, zoomed in on the spot this step involves, with a marker.
// background-position p% lines up point p% of the image with point p% of the box,
// so the marker sits at (x, y) of the box and the zoom never runs off the edge.
export function StepPhoto({
  src,
  aspect,
  x,
  y,
  label,
}: {
  src: string;
  aspect: number;
  x: number;
  y: number;
  label: string;
}) {
  const [zoomed, setZoomed] = useState(true);
  const cx = Math.min(1, Math.max(0, x));
  const cy = Math.min(1, Math.max(0, y));
  const cover = Math.max(1, aspect / BOX); // width (x box width) needed to cover the box
  const size = `${(zoomed ? ZOOM : 1) * cover * 100}% auto`;
  const labelLeft = cx > 0.6;

  return (
    <button
      type="button"
      onClick={() => setZoomed((z) => !z)}
      className="relative mt-3 block w-full overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800"
      style={{
        aspectRatio: `${BOX}`,
        backgroundImage: `url(${src})`,
        backgroundSize: size,
        backgroundPosition: `${cx * 100}% ${cy * 100}%`,
        backgroundRepeat: "no-repeat",
        transition: "background-size 300ms ease",
      }}
      aria-label={`Your photo: ${label}. Tap to ${zoomed ? "zoom out" : "zoom in"}.`}
    >
      <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}>
        <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-orange-400/60" />
        <span className="relative block h-6 w-6 rounded-full border-[3px] border-white bg-orange-500 shadow-lg" />
      </span>
      <span
        className="absolute whitespace-nowrap rounded-lg bg-black/75 px-2 py-1 text-xs font-semibold text-white backdrop-blur"
        style={{
          top: `calc(${cy * 100}% - 12px)`,
          ...(labelLeft ? { right: `calc(${(1 - cx) * 100}% + 20px)` } : { left: `calc(${cx * 100}% + 20px)` }),
        }}
      >
        {label}
      </span>
      <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
        📷 Your photo · tap to {zoomed ? "zoom out" : "zoom in"}
      </span>
    </button>
  );
}
