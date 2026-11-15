"use client";

import { PLACE_LABELS, type ProType } from "@/lib/stores";
import { NearbyPlaces } from "./NearbyPlaces";

// Nearby professionals plus other places to get help.
export function ProHelp({ types, mustCall, item }: { types: ProType[]; mustCall: boolean; item: string }) {
  const trade = PLACE_LABELS[types.find((t) => t !== "repair_cafe") ?? types[0]].replace(/ \(.*\)$/, "");
  const links = [
    { href: `https://www.yelp.com/search?find_desc=${encodeURIComponent(trade)}`, label: "Reviews on Yelp", sub: `Compare ${trade.toLowerCase()}s near you` },
    { href: "https://www.ifixit.com/Answers", label: "Ask the iFixit community", sub: `Free help from repair experts for your ${item.toLowerCase()}` },
    { href: "https://www.repaircafe.org/en/visit/", label: "Find a Repair Café", sub: "Volunteers fix things for free" },
  ];

  return (
    <NearbyPlaces
      title={mustCall ? "Get a pro to fix it" : "Stuck? Find a pro"}
      icon="👷"
      types={types}
      buttonLabel={`Find a ${trade.toLowerCase()} near me`}
      tip="Ask for a quote before they start, and mention what FixCam found so they know what to bring."
      emphasis={mustCall}
    >
      <div className="mt-4 space-y-2 border-t border-stone-200/70 pt-4 dark:border-stone-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">More ways to get help</p>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3 active:scale-[0.99] dark:bg-stone-800/60"
          >
            <span>
              <span className="block text-sm font-semibold">{l.label}</span>
              <span className="block text-xs text-stone-500">{l.sub}</span>
            </span>
            <span aria-hidden className="text-stone-400">↗</span>
          </a>
        ))}
      </div>
    </NearbyPlaces>
  );
}
