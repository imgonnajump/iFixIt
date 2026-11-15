"use client";

import type { Diagnosis } from "@/lib/schema";
import { PLACE_LABELS, type ProType } from "@/lib/stores";
import { NearbyPlaces } from "./NearbyPlaces";

const TIER = {
  free: { label: "Free", sign: "FREE" },
  budget: { label: "Budget", sign: "$" },
  standard: { label: "Standard", sign: "$$" },
  premium: { label: "Premium", sign: "$$$" },
} as const;

// Who can fix it, cheapest first, then nearby pros and other places to get help.
export function ProHelp({
  types,
  options,
  diyCost,
  mustCall,
  item,
}: {
  types: ProType[];
  options: Diagnosis["help_options"];
  diyCost: string | null;
  mustCall: boolean;
  item: string;
}) {
  const trade = PLACE_LABELS[types.find((t) => t !== "repair_cafe") ?? types[0] ?? "device_repair"].replace(/ \(.*\)$/, "");
  const order = { free: 0, budget: 1, standard: 2, premium: 3 } as const;
  const sorted = [...options].sort((a, b) => order[a.tier] - order[b.tier]);
  const budgetPick = sorted.find((o) => o.tier !== "free");
  const links = [
    { href: `https://www.yelp.com/search?find_desc=${encodeURIComponent(trade)}`, label: "Compare reviews on Yelp", sub: `${trade}s near you` },
    { href: "https://www.ifixit.com/Answers", label: "Ask the iFixit community", sub: `Free advice on your ${item.toLowerCase()}` },
    { href: "https://www.repaircafe.org/en/visit/", label: "Find a Repair Café", sub: "Volunteers fix things for free" },
  ];

  return (
    <div className={`space-y-4 rounded-lg ${mustCall ? "border-2 border-[var(--bad)] bg-[var(--bad-soft)] p-1" : ""}`}>
      <div className="card p-4">
        <div className="card-head">
          <h3 className="title">{mustCall ? "Who can fix it for you" : "Rather not DIY? Who can fix it"}</h3>
        </div>
        <p className="mb-2 text-sm muted">Cheapest first. Prices are typical US ranges for this job.</p>
        <ul className="dash-list">
          {diyCost && !mustCall && (
            <li className="flex items-start gap-3 py-2.5">
              <span className="stamp mt-0.5 w-12 shrink-0 text-center text-[var(--good)]">DIY</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">You, with this guide</p>
                <p className="text-sm muted">Parts only.</p>
              </div>
              <span className="shrink-0 font-extrabold text-[var(--good)]">{diyCost}</span>
            </li>
          )}
          {sorted.map((o) => (
            <li key={o.who} className="flex items-start gap-3 py-2.5">
              <span className={`stamp mt-0.5 w-12 shrink-0 text-center ${o.tier === "free" ? "text-[var(--good)]" : o.tier === "budget" ? "text-[var(--tab-text)]" : "muted"}`} aria-label={TIER[o.tier].label}>
                {TIER[o.tier].sign}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {o.who}
                  {o === budgetPick && <span className="stamp ml-2 align-middle text-[var(--accent-text)]">budget pick</span>}
                </p>
                <p className="text-sm muted">{o.good_for}</p>
              </div>
              <span className="shrink-0 font-extrabold">{o.cost}</span>
            </li>
          ))}
        </ul>
      </div>

      {types.length > 0 && (
        <NearbyPlaces
          title={mustCall ? "Find one near you" : "Stuck? Find help nearby"}
          icon="person"
          types={types}
          buttonLabel={`Find a ${trade.toLowerCase()} near me`}
          tip="Ask for a quote before they start, and tell them what FixCam found so they bring the right part."
        >
          <div className="mt-4 border-t border-dashed border-[var(--line)] pt-3">
            <p className="font-pixel mb-2 text-[11px] muted">MORE WAYS TO GET HELP</p>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2.5 hover:border-[var(--ink)]">
                    <span>
                      <span className="block text-sm font-bold">{l.label}</span>
                      <span className="block text-xs muted">{l.sub}</span>
                    </span>
                    <span aria-hidden>↗</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </NearbyPlaces>
      )}
    </div>
  );
}
