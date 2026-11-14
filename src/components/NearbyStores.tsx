"use client";

import { useState } from "react";
import { STORE_LABELS, type Store, type StoreType } from "@/lib/stores";

type State =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "searching" }
  | { kind: "done"; stores: Store[] }
  | { kind: "error"; message: string };

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

export function NearbyStores({ types, partName }: { types: StoreType[]; partName: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const miles = prefersMiles();
  const primary = STORE_LABELS[types[0]];
  const mapsSearch = `https://www.google.com/maps/search/${encodeURIComponent(`${primary} near me`)}`;

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
      if (!res.ok) throw new Error(json.error ?? "Store search failed.");
      setState({ kind: "done", stores: json.stores ?? [] });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Store search failed." });
    }
  }

  return (
    <div className="fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <span aria-hidden>📍</span>
        Where to buy it nearby
      </h3>
      <p className="mb-4 text-sm text-stone-500">
        Try a{/^[AEIOU]/i.test(primary) ? "n" : ""} {primary.toLowerCase()}
        {types.length > 1 && <> or {types.slice(1).map((t) => STORE_LABELS[t].toLowerCase()).join(" or ")}</>}.
      </p>

      {state.kind === "idle" && (
        <>
          <button
            type="button"
            onClick={find}
            className="w-full rounded-2xl bg-orange-600 py-3.5 font-semibold text-white shadow-md shadow-orange-600/20 active:scale-[0.98]"
          >
            Find stores near me
          </button>
          <p className="mt-2 text-center text-xs text-stone-400">Your location is only used to find nearby stores. It isn&apos;t saved.</p>
        </>
      )}

      {(state.kind === "locating" || state.kind === "searching") && (
        <div className="flex items-center justify-center gap-3 py-4 text-sm text-stone-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          {state.kind === "locating" ? "Getting your location…" : "Finding stores near you…"}
        </div>
      )}

      {state.kind === "error" && (
        <div className="space-y-3">
          <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">{state.message}</p>
          <div className="flex gap-2">
            <button onClick={find} className="flex-1 rounded-2xl bg-stone-100 py-3 text-sm font-semibold dark:bg-stone-800">
              Try again
            </button>
            <a href={mapsSearch} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-2xl bg-stone-900 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-stone-900">
              Google Maps ↗
            </a>
          </div>
        </div>
      )}

      {state.kind === "done" && state.stores.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-stone-600 dark:text-stone-300">No matching stores found within about 15 miles.</p>
          <a href={mapsSearch} target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-stone-900 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-stone-900">
            Search Google Maps ↗
          </a>
        </div>
      )}

      {state.kind === "done" && state.stores.length > 0 && (
        <>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {state.stores.map((s, i) => (
              <li key={`${s.name}-${s.lat}-${s.lon}`} className="flex items-center gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="truncate">{s.name}</span>
                    {i === 0 && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Closest</span>}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    {STORE_LABELS[s.type]}
                    {s.address && <> · {s.address}</>}
                  </p>
                  {s.hours && <p className="truncate text-xs text-stone-400">🕒 {s.hours}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-bold text-orange-600">{formatDistance(s.distanceKm, miles)}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold active:scale-95 dark:bg-stone-800"
                  >
                    Directions ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl bg-sky-50 p-3 text-xs text-sky-900 dark:bg-sky-950 dark:text-sky-200">
            💡 Call ahead to check they have the {partName.toLowerCase()} in stock. Bring the old part to match it.
          </p>
        </>
      )}
    </div>
  );
}
