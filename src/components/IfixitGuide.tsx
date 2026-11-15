"use client";

import { useEffect, useState } from "react";
import { PixelIcon } from "./PixelIcon";

type Guide = { title: string; url: string; steps: { image: string; text: string }[] };

// A swipeable strip of real step photos from the best matching iFixit guide.
// Hides itself if nothing is found.
export function IfixitGuide({ query }: { query: string }) {
  const [guide, setGuide] = useState<Guide | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ifixit?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((j) => alive && setGuide(j.guide ?? null))
      .catch(() => alive && setGuide(null));
    return () => {
      alive = false;
    };
  }, [query]);

  if (guide === null) return null;

  return (
    <div className="fade-up rounded-lg bg-[var(--paper)] p-5 border border-[var(--line)]">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <PixelIcon name="photo" />
        Photo guide
      </h3>
      {guide === undefined ? (
        <div className="mt-3 flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[4/3] w-56 shrink-0 animate-pulse rounded-lg bg-[var(--paper-2)]" />
          ))}
        </div>
      ) : (
        <>
          <p className="mb-3 truncate text-sm muted">{guide.title}</p>
          <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
            {guide.steps.map((s, i) => (
              <figure key={i} className="w-60 shrink-0 snap-start">
                <div className="relative overflow-hidden rounded-lg bg-[var(--paper-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt={s.text || `Step ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">{i + 1}</span>
                </div>
                {s.text && <figcaption className="mt-1.5 line-clamp-2 text-xs ">{s.text}</figcaption>}
              </figure>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] muted">Photos: iFixit (CC BY-NC-SA)</span>
            <a href={guide.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#0071ce]">
              Full guide on iFixit ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}
