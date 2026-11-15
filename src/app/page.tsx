"use client";

import { useEffect, useRef, useState } from "react";
import { Diary } from "@/components/Diary";
import { FixFlow, type Place } from "@/components/FixFlow";
import { PixelIcon } from "@/components/PixelIcon";
import { PixelWorld } from "@/components/PixelWorld";
import { ProfilePanel } from "@/components/ProfilePanel";
import { WrappedCard } from "@/components/Wrapped";
import { loadFixes, saveFixes, type Fix } from "@/lib/fixlog";
import type { IconName } from "@/lib/pixel/icons";
import { ROOMS } from "@/lib/pixel/world";
import { countVisit, DEFAULT_PROFILE, loadProfile, saveProfile, type Profile } from "@/lib/profile";
import { isWrappedSeason } from "@/lib/wrapped";

type Tab = "home" | "fix" | "diary" | "wrapped";
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "house" },
  { id: "fix", label: "Fix it", icon: "camera" },
  { id: "diary", label: "Diary", icon: "book" },
  { id: "wrapped", label: "Wrapped", icon: "gift" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [fixes, setFixesState] = useState<Fix[]>([]);
  const [visits, setVisits] = useState({ today: 1, total: 1 });
  const [place, setPlace] = useState<Place | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setProfileState(loadProfile());
    setFixesState(loadFixes());
    setVisits(countVisit());
  }, []);

  const setProfile = (p: Profile) => {
    setProfileState(p);
    saveProfile(p);
  };
  const setFixes = (f: Fix[]) => {
    setFixesState(f);
    saveFixes(f);
  };
  const logFix = (f: Fix) => setFixes([f, ...loadFixes().filter((x) => x.id !== f.id)]);

  function go(t: Tab) {
    setTab(t);
    window.scrollTo({ top: 0 });
  }

  function onTabKey(e: React.KeyboardEvent, i: number, vertical: boolean) {
    const fwd = vertical ? "ArrowDown" : "ArrowRight";
    const back = vertical ? "ArrowUp" : "ArrowLeft";
    const dir = e.key === fwd ? 1 : e.key === back ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = TABS[(i + dir + TABS.length) % TABS.length];
    go(next.id);
    tabRefs.current[`${next.id}-${vertical}`]?.focus();
  }

  const tabList = (vertical: boolean) => (
    <div
      role="tablist"
      aria-label="Sections"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      className={vertical ? "flex flex-col gap-1.5" : "flex gap-1"}
    >
      {TABS.map((t, i) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[`${t.id}-${vertical}`] = el;
            }}
            role="tab"
            id={`tab-${t.id}${vertical ? "" : "-m"}`}
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => go(t.id)}
            onKeyDown={(e) => onTabKey(e, i, vertical)}
            className={
              vertical
                ? `flex items-center gap-2 rounded-r-lg border border-l-0 px-3 py-2.5 text-left text-sm font-bold transition-all ${
                    active ? "border-[var(--line)] bg-[var(--paper)] pl-4 text-[var(--ink)]" : "border-transparent bg-[var(--tab)] text-white hover:pl-4"
                  }`
                : `flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-t-lg border border-b-0 px-1 py-2 text-sm font-bold ${
                    active ? "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]" : "border-transparent bg-[var(--tab)] text-white"
                  }`
            }
          >
            <PixelIcon name={t.icon} size={16} />
            {t.label}
            {t.id === "wrapped" && isWrappedSeason() && <span className="sr-only"> (new)</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-[var(--paper)] focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto max-w-5xl px-2 py-3 sm:px-4 sm:py-6 md:pr-[118px]">
        <div className="page relative p-2 sm:p-3">
          {/* desktop: tabs stick out of the binder's right edge */}
          <div className="absolute -right-[112px] top-20 hidden w-[112px] md:block">{tabList(true)}</div>

          <div className="page-dash p-2 sm:p-3 md:grid md:grid-cols-[230px_22px_1fr]">
            <div className="card hidden p-3 md:block">
              <ProfilePanel profile={profile} setProfile={setProfile} fixes={fixes} visits={visits} />
            </div>
            <div className="rings hidden md:block" aria-hidden />

            <div className="min-w-0">
              <header className="mb-2 flex items-end justify-between gap-2 px-1">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-extrabold text-[var(--tab-text)] sm:text-2xl">{profile.name}&apos;s fix house</h1>
                  <p className="font-pixel truncate text-[11px] muted">fixcam / {tab}</p>
                </div>
                <p className="font-pixel shrink-0 text-[10px] muted md:hidden">
                  TODAY <span className="text-[var(--accent)]">{visits.today}</span> | TOTAL {visits.total}
                </p>
              </header>

              <aside aria-label="Your profile" className="card mb-2 p-2 md:hidden">
                <ProfilePanel profile={profile} setProfile={setProfile} fixes={fixes} visits={visits} compact />
              </aside>

              <nav aria-label="Sections" className="sticky top-0 z-20 bg-[var(--paper)] pt-1 md:hidden">
                {tabList(false)}
              </nav>

              <main id="main" className="card min-h-[60vh] rounded-t-none p-3 sm:p-4 md:rounded-t-[10px]">
                <div role="tabpanel" id="panel-home" aria-labelledby="tab-home" hidden={tab !== "home"}>
                  <PixelWorld
                    avatar={profile.avatar}
                    active={tab === "home"}
                    onPick={(o, issue) => {
                      setPlace({ room: ROOMS[o.room].name, roomId: o.room, object: o.name, issue });
                      go("fix");
                    }}
                  />
                </div>
                <div role="tabpanel" id="panel-fix" aria-labelledby="tab-fix" hidden={tab !== "fix"}>
                  <FixFlow place={place} clearPlace={() => setPlace(null)} onLog={logFix} />
                </div>
                <div role="tabpanel" id="panel-diary" aria-labelledby="tab-diary" hidden={tab !== "diary"}>
                  <Diary fixes={fixes} setFixes={setFixes} />
                </div>
                <div role="tabpanel" id="panel-wrapped" aria-labelledby="tab-wrapped" hidden={tab !== "wrapped"}>
                  <WrappedCard fixes={fixes} profile={profile} />
                </div>
              </main>
            </div>
          </div>
        </div>
        <footer className="mt-3 text-center text-xs muted">AI can make mistakes. With gas, electricity or brakes, call a professional.</footer>
      </div>
    </>
  );
}
