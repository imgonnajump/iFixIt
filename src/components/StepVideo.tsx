"use client";

import { useState } from "react";
import { PixelIcon } from "./PixelIcon";

type Video = { id: string; title: string; channel: string };
type State = { kind: "closed" } | { kind: "loading" } | { kind: "video"; video: Video } | { kind: "search" };

export function StepVideo({ query }: { query: string }) {
  const [state, setState] = useState<State>({ kind: "closed" });
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  async function open() {
    if (state.kind === "video" || state.kind === "search") {
      setState({ kind: "closed" });
      return;
    }
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/video?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.video) {
        setState({ kind: "video", video: json.video });
      } else {
        // No API key or no result: open YouTube search instead.
        window.open(searchUrl, "_blank", "noopener,noreferrer");
        setState({ kind: "closed" });
      }
    } catch {
      window.open(searchUrl, "_blank", "noopener,noreferrer");
      setState({ kind: "closed" });
    }
  }

  return (
    <div className="mt-2 w-full sm:w-auto">
      <button
        type="button"
        onClick={open}
        className="btn btn-sm"
        aria-expanded={state.kind === "video"}
      >
        {state.kind === "loading" ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--bad)] border-t-transparent" />
        ) : (
          <PixelIcon name={state.kind === "video" ? "close" : "play"} size={14} />
        )}
        {state.kind === "video" ? "Hide video" : "Watch how"}
      </button>

      {state.kind === "video" && (
        <div className="fade-up mt-2 overflow-hidden rounded-lg bg-black">
          <div className="relative aspect-video">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${state.video.id}?rel=0&modestbranding=1&playsinline=1`}
              title={state.video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-between gap-2 bg-[var(--ink)] px-3 py-2 text-xs ">
            <span className="truncate">
              {state.video.title}
              {state.video.channel && <span className="muted"> · {state.video.channel}</span>}
            </span>
            <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 font-semibold text-white">
              More ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
