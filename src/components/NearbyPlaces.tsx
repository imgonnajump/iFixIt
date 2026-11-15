"use client";

import { useState } from "react";
import type { IconName } from "@/lib/pixel/icons";
import { PLACE_LABELS, type PlaceType, type Store } from "@/lib/stores";
import { PixelIcon } from "./PixelIcon";

type State = { kind: "idle" } | { kind: "locating" } | { kind: "searching" } | { kind: "done"; places: Store[] } | { kind: "error"; message: string };

function prefersMiles() {
  if (typeof navigator === "undefined") return true;
  return /^en-(US|GB|LR|MM)$/i.test(navigator.language);
}

function formatDistance(km: number, miles: boolean) {
  if (miles) {
    const mi = km * 0.621371;
    return mi < 0.1 ? "< 0.1 mi" : `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
  }
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

function locate(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
  });
}

function joinOr(items: string[]) {
  return items.map((s) => s.toLowerCase()).join(" or ");
}

export function NearbyPlaces({
  title,
  icon,
  types,
  buttonLabel,
  tip,
  emphasis = false,
  children,
}: {
  title: string;
  icon: IconName;
  types: PlaceType[];
  buttonLabel: string;
  tip?: string;
  emphasis?: boolean;
  children?: React.ReactNode;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const miles = prefersMiles();
  const labels = types.map((t) => PLACE_LABELS[t]);
  const mapsSearch = `https://www.google.com/maps/search/${encodeURIComponent(`${labels[0].replace(/ \(.*\)$/, "")} near me`)}`;

  async function find() {
    setState({ kind: "locating" });
    let pos: GeolocationPosition;
    try {
      pos = await locate();
    } catch (e) {
      const denied = (e as GeolocationPositionError)?.code === 1;
      setState({
        kind: "error",
        message: denied
          ? "Location is turned off for this site. Allow location access in your browser settings, or search on Google Maps instead."
          : "Couldn't get your location. Try again, or search on Google Maps instead.",
      });
      return;
    }
    setState({ kind: "searching" });
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude, types }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Search failed.");
      setState({ kind: "done", places: json.stores ?? [] });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Search failed." });
    }
  }

  return (
    <div className="card p-4" data-emphasis={emphasis || undefined}>
      <h3 className="title mb-1">
        <PixelIcon name={icon} />
        {title}
      </h3>
      <p className="mb-4 text-sm muted">
        Look for a{/^[AEIOU]/i.test(labels[0]) ? "n" : ""} {joinOr(labels)}.
      </p>

      {state.kind === "idle" && (
        <>
          <button type="button" onClick={find} className="btn btn-primary w-full">
            {buttonLabel}
          </button>
          <p className="mt-2 text-center text-xs muted">Your location is only used for this search. It isn&apos;t saved.</p>
        </>
      )}

      {(state.kind === "locating" || state.kind === "searching") && (
        <div className="flex items-center justify-center gap-3 py-4 text-sm muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          {state.kind === "locating" ? "Getting your location…" : "Searching near you…"}
        </div>
      )}

      {state.kind === "error" && (
        <div className="space-y-3">
          <p className="rounded-lg bg-[var(--bad-soft)] p-3 text-sm ">{state.message}</p>
          <div className="flex gap-2">
            <button onClick={find} className="btn btn-sm flex-1">
              Retry
            </button>
            <a
              href={mapsSearch}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-tab flex-1"
            >
              Google Maps ↗
            </a>
          </div>
        </div>
      )}

      {state.kind === "done" && state.places.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm ">Nothing listed within about 15 miles.</p>
          <a
            href={mapsSearch}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-tab block"
          >
            Search Google Maps ↗
          </a>
        </div>
      )}

      {state.kind === "done" && state.places.length > 0 && (
        <>
          <ul className="divide-y divide-[var(--line)]">
            {state.places.map((s, i) => (
              <li key={`${s.name}-${s.lat}-${s.lon}`} className="flex items-center gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-semibold leading-snug">{s.name}</p>
                  <p className="truncate text-xs muted">
                    {i === 0 && (
                      <span className="mr-1.5 rounded-full bg-[var(--good-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--good)]">
                        Closest
                      </span>
                    )}
                    {PLACE_LABELS[s.type]}
                    {s.address && <> · {s.address}</>}
                  </p>
                  {s.hours && <p className="truncate text-xs muted">{s.hours}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-pixel text-sm font-bold text-[var(--accent)]">{formatDistance(s.distanceKm, miles)}</span>
                  <div className="flex gap-1">
                    {s.phone && (
                      <a
                        href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}
                        className="btn btn-sm px-2 text-xs"
                      >
                        Call
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm px-2 text-xs"
                    >
                      Directions ↗
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {tip && <p className="mt-3 rounded-lg bg-[var(--paper-2)] p-3 text-xs ">Tip: {tip}</p>}
        </>
      )}

      {children}
    </div>
  );
}
