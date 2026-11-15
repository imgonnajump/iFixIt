"use client";

import { useEffect, useRef, useState } from "react";
import { cleanBox, type Box } from "@/lib/image";
import type { Diagnosis } from "@/lib/schema";
import { addFix, totals } from "@/lib/fixlog";
import { savings } from "@/lib/money";
import { CheckWork } from "./CheckWork";
import { HandsFree } from "./HandsFree";
import { IfixitGuide } from "./IfixitGuide";
import { NearbyPlaces } from "./NearbyPlaces";
import { ProHelp } from "./ProHelp";
import { StepPhoto, StepPhotoSkeleton } from "./StepPhoto";
import { StepVideo } from "./StepVideo";

const VERDICT = {
  easy_diy: {
    label: "Easy DIY fix",
    sub: "You've got this",
    icon: "🛠️",
    card: "bg-emerald-600",
  },
  diy_with_care: {
    label: "DIY with care",
    sub: "Doable: go slow and follow the safety notes",
    icon: "⚠️",
    card: "bg-amber-500",
  },
  call_a_pro: {
    label: "Call a pro",
    sub: "This one isn't safe to DIY",
    icon: "📞",
    card: "bg-rose-600",
  },
} as const;


export function Result({
  d,
  preview,
  aspect,
  grid,
  demo,
  onReset,
}: {
  d: Diagnosis;
  preview: string | null;
  aspect: number;
  grid: string | null;
  demo: boolean;
  onReset: () => void;
}) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const [have, setHave] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [impact, setImpact] = useState<ReturnType<typeof totals> | null>(null);
  const logged = useRef(false);
  // Where each step's part is on the photo: undefined = still looking.
  const [marks, setMarks] = useState<Record<string, Box | null> | undefined>(undefined);

  const lookFor = d.can_diagnose ? [...new Set(d.steps.map((s) => s.look_for).filter((l): l is string => Boolean(l)))] : [];
  const lookKey = lookFor.join("|");

  useEffect(() => {
    if (!grid || demo || !lookKey) {
      setMarks({});
      return;
    }
    let alive = true;
    const labels = lookKey.split("|");
    fetch("/api/locate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grid, labels, item: d.item }),
    })
      .then((r) => r.json())
      .then((j: { marks?: ({ label: string; found: boolean } & Box)[] }) => {
        if (!alive) return;
        const out: Record<string, Box | null> = {};
        labels.forEach((label, i) => {
          const m = j.marks?.find((x) => x.label === label) ?? j.marks?.[i];
          out[label] = m && m.found ? cleanBox(m) : null;
        });
        setMarks(out);
      })
      .catch(() => alive && setMarks({}));
    return () => {
      alive = false;
    };
  }, [grid, demo, lookKey, d.item]);

  const save = savings(d);
  const allDone = d.can_diagnose && d.steps.length > 0 && done.size === d.steps.length;

  useEffect(() => {
    if (!allDone || logged.current || demo) return;
    logged.current = true;
    const list = addFix({
      item: d.item,
      part: d.part_name,
      saved: save?.amount ?? 0,
      kg: d.waste_saved_kg,
      date: new Date().toISOString(),
    });
    setImpact(totals(list));
  }, [allDone, demo, d.item, d.part_name, d.waste_saved_kg, save?.amount]);

  if (!d.can_diagnose) {
    return (
      <section className="fade-up space-y-5 pt-2">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mx-auto h-40 w-40 rounded-3xl object-cover opacity-80" />
        )}
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
          <p className="text-4xl">🔍</p>
          <h2 className="mt-2 text-xl font-bold">I need a better look</h2>
          <p className="mt-2 text-stone-600 dark:text-stone-300">
            {d.clarifying_question ?? "Try a closer, well-lit photo of the broken part."}
          </p>
        </div>
        <PrimaryButton onClick={onReset}>📷 Try another photo</PrimaryButton>
      </section>
    );
  }

  const v = VERDICT[d.verdict];
  const ifixit = `https://www.ifixit.com/Search?query=${encodeURIComponent(d.ifixit_search)}`;
  const pct = d.steps.length ? Math.round((done.size / d.steps.length) * 100) : 0;


  const toggleStep = (i: number) => {
    const next = new Set(done);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setDone(next);
  };
  const toggleHave = (k: string) => {
    const next = new Set(have);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setHave(next);
  };
  const copyList = async () => {
    const text = [
      `Fixing: ${d.part_name} (${d.item})`,
      "",
      "Tools:",
      ...d.tools.map((t) => `- ${t}`),
      ...(d.parts.length ? ["", "Parts:", ...d.parts.map((p) => `- ${p.name} (${p.approx_cost})`)] : []),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: ignore */
    }
  };

  return (
    <section className="space-y-4 pb-28">
      {demo && (
        <p className="rounded-2xl bg-amber-100 px-3 py-2 text-center text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Demo mode: no API key set, so this is a sample diagnosis.
        </p>
      )}

      {/* Hero: photo + part name */}
      <div className="fade-up overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
        {preview && (
          <div className="relative h-44 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">{d.item}</p>
              <h2 className="text-2xl font-bold leading-tight">{d.part_name}</h2>
            </div>
            <ConfidencePill level={d.confidence} />
          </div>
        )}
        {!preview && (
          <div className="px-5 pt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{d.item}</p>
            <h2 className="text-2xl font-bold">{d.part_name}</h2>
          </div>
        )}
        <div className="space-y-3 p-5">
          {d.also_called.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-stone-500">Also called</span>
              {d.also_called.map((a) => (
                <span key={a} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  {a}
                </span>
              ))}
            </div>
          )}
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">{d.problem}</p>
          {d.clarifying_question && (
            <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900 dark:bg-sky-950 dark:text-sky-200">
              💡 {d.clarifying_question}
            </p>
          )}
        </div>
      </div>

      {/* Verdict */}
      <div className={`pop rounded-3xl p-5 text-white shadow-sm ${v.card}`} style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl">{v.icon}</span>
          <div>
            <p className="text-xl font-bold leading-tight">{v.label}</p>
            <p className="text-sm opacity-90">{v.sub}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed opacity-95">{d.verdict_reason}</p>
        <div className="mt-4 flex gap-1.5" aria-label={`Difficulty ${d.difficulty} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= Number(d.difficulty) ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs opacity-80">
          <span>Difficulty {d.difficulty}/5</span>
          <span>⏱ {d.time_estimate}</span>
        </div>
      </div>

      {/* Pro help first when it isn't safe to DIY */}
      {d.verdict === "call_a_pro" && d.pro_types.length > 0 && <ProHelp types={d.pro_types} mustCall item={d.item} />}

      {/* Money */}
      <div className="fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800" style={{ animationDelay: "140ms" }}>
        {save && save.amount > 0 && (
          <p className="mb-4 text-center">
            <span className="block text-sm text-stone-500">You could save about</span>
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">${save.amount.toLocaleString()}</span>
            <span className="block text-sm text-stone-500">vs {save.vs}</span>
          </p>
        )}
        <div className="grid grid-cols-3 divide-x divide-stone-200 text-center dark:divide-stone-800">
          <Money label="DIY" value={d.diy_cost} highlight={d.verdict !== "call_a_pro"} />
          <Money label="Pro" value={d.pro_cost} highlight={d.verdict === "call_a_pro"} />
          <Money label="New" value={d.replace_cost} />
        </div>
        <p className="mt-4 rounded-xl bg-emerald-50 py-2 text-center text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          ♻️ Repairing keeps ~{d.waste_saved_kg} kg out of landfill
        </p>
      </div>

      {/* Safety */}
      {d.safety_warnings.length > 0 && (
        <div className="rounded-3xl border-2 border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/40">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">⚡ Safety first</h3>
          <ul className="space-y-2 text-sm text-rose-900 dark:text-rose-100">
            {d.safety_warnings.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Shopping list */}
      <Card
        title="What you'll need"
        icon="🧰"
        action={
          <button onClick={copyList} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 active:scale-95 dark:bg-stone-800 dark:text-stone-200">
            {copied ? "✓ Copied" : "Copy list"}
          </button>
        }
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Tools</p>
        <ul className="space-y-1">
          {d.tools.map((t) => (
            <CheckRow key={`t-${t}`} checked={have.has(`t-${t}`)} onChange={() => toggleHave(`t-${t}`)}>
              {t}
            </CheckRow>
          ))}
        </ul>
        {d.parts.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-stone-500">Parts to buy</p>
            <ul className="space-y-1">
              {d.parts.map((p) => (
                <CheckRow key={`p-${p.name}`} checked={have.has(`p-${p.name}`)} onChange={() => toggleHave(`p-${p.name}`)} right={p.approx_cost}>
                  {p.name}
                </CheckRow>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* Nearby stores */}
      {d.store_types.length > 0 && (d.parts.length > 0 || d.tools.length > 0) && (
        <NearbyPlaces
          title="Where to buy it nearby"
          icon="📍"
          types={d.store_types}
          buttonLabel="Find stores near me"
          tip={`Call ahead to check they have the ${(d.parts[0]?.name ?? d.part_name).toLowerCase()} in stock. Bring the old part to match it.`}
        />
      )}

      {/* Steps */}
      <Card
        title="Step by step"
        icon="📋"
        action={
          <span className="flex items-center gap-2">
            <HandsFree
              steps={d.steps}
              done={done}
              onDone={(i) => setDone((prev) => new Set(prev).add(i))}
              onUndo={(i) =>
                setDone((prev) => {
                  const next = new Set(prev);
                  next.delete(i);
                  return next;
                })
              }
            />
            <span className="text-sm font-semibold text-orange-600">
              {done.size}/{d.steps.length}
            </span>
          </span>
        }
      >
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
          <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <ol className="space-y-3">
          {d.steps.map((s, i) => {
            const isDone = done.has(i);
            const isNext = !isDone && [...Array(i).keys()].every((j) => done.has(j));
            return (
              <li
                key={i}
                className={`rounded-2xl p-3 transition ${
                  isNext ? "bg-orange-50 ring-2 ring-orange-300 dark:bg-orange-950/40 dark:ring-orange-800" : "bg-stone-50 dark:bg-stone-800/50"
                }`}
              >
                <button type="button" onClick={() => toggleStep(i)} className="flex w-full gap-3 text-left" aria-pressed={isDone}>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                      isDone ? "bg-emerald-500 text-white" : isNext ? "bg-orange-500 text-white" : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className={isDone ? "opacity-50" : ""}>
                    <span className={`block font-semibold ${isDone ? "line-through" : ""}`}>{s.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-stone-600 dark:text-stone-300">{s.detail}</span>
                    {s.caution && (
                      <span className="mt-2 block rounded-lg bg-amber-100 px-2 py-1 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        ⚠️ {s.caution}
                      </span>
                    )}
                  </span>
                </button>
                {s.look_for && preview && !isDone && (marks === undefined || marks[s.look_for]) && (
                  <div className="pl-11">
                    {marks === undefined ? (
                      <StepPhotoSkeleton />
                    ) : (
                      <StepPhoto src={preview} aspect={aspect} box={marks[s.look_for]!} label={s.look_for} />
                    )}
                  </div>
                )}
                {isNext && (
                  <div className="pl-11">
                    <CheckWork
                      key={i}
                      context={{
                        item: d.item,
                        part: d.part_name,
                        problem: d.problem,
                        stepIndex: i,
                        totalSteps: d.steps.length,
                        step: { title: s.title, detail: s.detail, caution: s.caution },
                        nextStep: d.steps[i + 1]?.title ?? null,
                        lang: navigator.language,
                      }}
                      onPassed={() => setDone((prev) => new Set(prev).add(i))}
                    />
                  </div>
                )}
                {s.video_search && !isDone && (
                  <div className="pl-11">
                    <StepVideo query={s.video_search} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {allDone && (
          <div className="pop mt-4 rounded-2xl bg-emerald-600 p-4 text-center text-white">
            <p className="text-3xl">🎉</p>
            <p className="font-bold">You fixed it!</p>
            <p className="text-sm opacity-90">~{d.waste_saved_kg} kg kept out of landfill. Nice work.</p>
            {impact && impact.count > 1 && (
              <p className="mt-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium">
                Your total: {impact.count} fixes · ${impact.saved.toLocaleString()} saved · {impact.kg} kg kept out of landfill
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Real step photos from iFixit */}
      <IfixitGuide query={d.ifixit_search} />

      {/* Stop signs */}
      {d.stop_and_call_pro_if.length > 0 && (
        <Card title="Stop and call a pro if…" icon="🛑">
          <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
            {d.stop_and_call_pro_if.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="text-rose-500">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Pro help, for when DIY goes sideways */}
      {d.verdict !== "call_a_pro" && d.pro_types.length > 0 && <ProHelp types={d.pro_types} mustCall={false} item={d.item} />}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/90 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto flex max-w-xl gap-2">
          <a
            href={ifixit}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-[#0071ce] px-3 py-3.5 text-center text-sm font-semibold text-white active:scale-[0.98]"
          >
            iFixit guides ↗
          </a>
          <button
            onClick={onReset}
            className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-stone-900 px-3 py-3.5 text-sm font-semibold text-white active:scale-[0.98] dark:bg-white dark:text-stone-900"
          >
            📷 New photo
          </button>
        </div>
      </div>
    </section>
  );
}

function ConfidencePill({ level }: { level: Diagnosis["confidence"] }) {
  const map = {
    high: "bg-emerald-500",
    medium: "bg-amber-500",
    low: "bg-rose-500",
  } as const;
  return (
    <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${map[level]}`} />
      {level[0].toUpperCase() + level.slice(1)} confidence
    </span>
  );
}

function Money({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-1">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${highlight ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{value}</p>
    </div>
  );
}

function Card({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <span aria-hidden>{icon}</span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  right,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1.5">
        <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 shrink-0 accent-orange-500" />
        <span className={`flex-1 text-sm ${checked ? "text-stone-400 line-through" : ""}`}>{children}</span>
        {right && <span className="shrink-0 text-sm text-stone-500">{right}</span>}
      </label>
    </li>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-orange-600 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-600/25 transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
    >
      {children}
    </button>
  );
}
