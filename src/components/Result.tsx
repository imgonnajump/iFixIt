"use client";

import { useEffect, useRef, useState } from "react";
import { newId, WHO, type Fix, type Who } from "@/lib/fixlog";
import { coinsFor } from "@/lib/house";
import { cleanBox, type Box } from "@/lib/image";
import { midpoint, savings } from "@/lib/money";
import type { IconName } from "@/lib/pixel/icons";
import type { RoomId } from "@/lib/pixel/world";
import type { Diagnosis } from "@/lib/schema";
import { CheckWork } from "./CheckWork";
import { HandsFree } from "./HandsFree";
import { IfixitGuide } from "./IfixitGuide";
import { NearbyPlaces } from "./NearbyPlaces";
import { PixelIcon } from "./PixelIcon";
import { ProHelp } from "./ProHelp";
import { StepPhoto, StepPhotoSkeleton } from "./StepPhoto";
import { StepVideo } from "./StepVideo";

const VERDICT = {
  easy_diy: { label: "Easy DIY fix", sub: "You've got this.", color: "var(--good)", soft: "var(--good-soft)", icon: "check" as IconName },
  diy_with_care: { label: "DIY with care", sub: "Doable. Go slow and follow the safety notes.", color: "var(--warn)", soft: "var(--warn-soft)", icon: "warn" as IconName },
  call_a_pro: { label: "Call a pro", sub: "This one isn't safe to do yourself.", color: "var(--bad)", soft: "var(--bad-soft)", icon: "stop" as IconName },
};

export function Result({
  d,
  preview,
  aspect,
  grid,
  demo,
  onReset,
  onLog,
  placeRoom,
}: {
  d: Diagnosis;
  preview: string | null;
  aspect: number;
  grid: string | null;
  demo: boolean;
  onReset: () => void;
  onLog: (f: Fix) => void;
  placeRoom?: string;
}) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const [have, setHave] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState<Who | null>(null);
  const [earned, setEarned] = useState(0);
  const autoLogged = useRef(false);
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
  const room = ((placeRoom as RoomId | undefined) ?? d.room) as Fix["room"];

  function makeFix(who: Who): Fix {
    const diy = midpoint(d.diy_cost) ?? 0;
    const pro = midpoint(d.pro_cost) ?? 0;
    const repl = midpoint(d.replace_cost) ?? 0;
    const budget = d.help_options.find((h) => h.tier === "budget");
    const handy = midpoint(budget?.cost ?? "") ?? pro * 0.6;
    const spent = who === "pro" ? pro : who === "handyman" ? handy : who === "repair_cafe" ? 0 : diy;
    const best = who === "pro" || who === "handyman" ? repl : Math.max(pro, repl);
    return {
      id: newId(),
      date: new Date().toISOString(),
      item: d.item,
      part: d.part_name,
      room,
      who,
      spent: Math.round(spent),
      saved: Math.max(0, Math.round(best - spent)),
      kg: d.waste_saved_kg,
      difficulty: Number(d.difficulty) || 2,
      notes: "",
      source: "coach",
    };
  }

  function log(who: Who) {
    if (demo) return;
    const fix = makeFix(who);
    onLog(fix);
    setLogged(who);
    setEarned(coinsFor(fix));
  }

  useEffect(() => {
    if (!allDone || autoLogged.current || demo || logged) return;
    autoLogged.current = true;
    log("me");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  if (!d.can_diagnose) {
    return (
      <div className="fade-up space-y-4">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mx-auto h-40 w-40 rounded-lg border-2 border-[var(--ink)] object-cover" />
        )}
        <div className="card p-5 text-center">
          <PixelIcon name="camera" size={40} className="mx-auto" />
          <h3 className="mt-2 text-xl font-extrabold">I need a better look</h3>
          <p className="mt-2">{d.clarifying_question ?? "Try a closer, well-lit photo of the broken part."}</p>
        </div>
        <button type="button" className="btn btn-primary w-full" onClick={onReset}>
          Try another photo
        </button>
      </div>
    );
  }

  const v = VERDICT[d.verdict];
  const ifixit = `https://www.ifixit.com/Search?query=${encodeURIComponent(d.ifixit_search)}`;

  const toggleStep = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const toggleHave = (k: string) =>
    setHave((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const copyList = async () => {
    const text = [
      `Fixing: ${d.part_name} (${d.item})`,
      "",
      "Tools:",
      ...d.tools.map((t) => `- ${t.name}${t.substitute ? ` (or ${t.substitute})` : ""}`),
      ...(d.parts.length ? ["", "Parts:", ...d.parts.map((p) => `- ${p.name} (${p.approx_cost})`)] : []),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {demo && (
        <p className="rounded-lg border border-dashed border-[var(--warn)] bg-[var(--warn-soft)] px-3 py-2 text-center text-sm">
          Demo mode: no API key is set, so this is a sample diagnosis.
        </p>
      )}

      {/* What it is */}
      <article className="card fade-up overflow-hidden">
        <div className="flex gap-3 p-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your photo" className="h-24 w-24 shrink-0 rounded-md border border-[var(--line)] object-cover sm:h-28 sm:w-28" />
          )}
          <div className="min-w-0">
            <p className="font-pixel text-[11px] muted">{d.item}</p>
            <h3 className="text-2xl font-extrabold leading-tight">{d.part_name}</h3>
            {d.also_called.length > 0 && <p className="mt-0.5 text-sm muted">also sold as {d.also_called.join(", ")}</p>}
            <p className="mt-1">
              <span className={`stamp ${d.confidence === "high" ? "text-[var(--good)]" : d.confidence === "medium" ? "text-[var(--warn)]" : "text-[var(--bad)]"}`}>
                {d.confidence} confidence
              </span>
            </p>
          </div>
        </div>
        <p className="border-t border-dashed border-[var(--line)] px-3 py-3 leading-relaxed">{d.problem}</p>
        {d.clarifying_question && <p className="border-t border-dashed border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 text-sm">Tip: {d.clarifying_question}</p>}
      </article>

      {/* Verdict */}
      <div className="pop rounded-lg border-2 p-4" style={{ borderColor: v.color, background: v.soft }}>
        <div className="flex items-center gap-3">
          <PixelIcon name={v.icon} size={36} />
          <div>
            <p className="text-xl font-extrabold leading-tight" style={{ color: v.color }}>
              {v.label}
            </p>
            <p className="text-sm">{v.sub}</p>
          </div>
        </div>
        <p className="mt-2 text-sm">{d.verdict_reason}</p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="font-bold">Difficulty</span>
          <span className="flex gap-1" role="img" aria-label={`Difficulty ${d.difficulty} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="h-3.5 w-3.5 border-2 border-[var(--ink)]" style={{ background: n <= Number(d.difficulty) ? v.color : "transparent" }} />
            ))}
          </span>
          <span className="ml-auto muted">about {d.time_estimate}</span>
        </div>
      </div>

      {/* Money */}
      <div className="card p-4">
        {save && save.amount > 0 && (
          <p className="mb-3 text-center">
            <span className="text-sm muted">You could save about </span>
            <span className="text-3xl font-extrabold text-[var(--good)]">${save.amount.toLocaleString()}</span>
            <span className="text-sm muted"> vs {save.vs}</span>
          </p>
        )}
        <table className="w-full text-center text-sm">
          <caption className="sr-only">Cost comparison</caption>
          <thead>
            <tr className="muted">
              <th className="font-normal">Fix it yourself</th>
              <th className="font-normal">Hire help</th>
              <th className="font-normal">Buy new</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-base font-extrabold">
              <td className={d.verdict !== "call_a_pro" ? "text-[var(--good)]" : ""}>{d.diy_cost}</td>
              <td>{d.pro_cost}</td>
              <td>{d.replace_cost}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 flex items-center justify-center gap-1.5 border-t border-dashed border-[var(--line)] pt-2 text-sm">
          <PixelIcon name="leaf" size={14} /> Repairing keeps about {d.waste_saved_kg} kg out of landfill
        </p>
      </div>

      {d.verdict === "call_a_pro" && <ProHelp types={d.pro_types} options={d.help_options} diyCost={null} mustCall item={d.item} />}

      {/* Safety */}
      {d.safety_warnings.length > 0 && (
        <div className="rounded-lg border-2 border-[var(--bad)] bg-[var(--bad-soft)] p-4">
          <h3 className="title mb-2" style={{ color: "var(--bad)" }}>
            <PixelIcon name="bolt" /> Safety first
          </h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {d.safety_warnings.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Shopping list */}
      <div className="card p-4">
        <div className="card-head">
          <h3 className="title">
            <PixelIcon name="wrench" /> What you&apos;ll need
          </h3>
          <button type="button" onClick={copyList} className="btn btn-sm">
            {copied ? "Copied!" : "Copy list"}
          </button>
        </div>
        {d.no_tools_tip && (
          <p className="mb-3 rounded-lg border border-dashed border-[var(--tab)] bg-[var(--paper-2)] p-3 text-sm">
            <b>Fixing it without a toolbox:</b> {d.no_tools_tip}
          </p>
        )}
        <p className="font-pixel mb-1 text-[11px] muted">TOOLS</p>
        <ul>
          {d.tools.map((t) => (
            <CheckRow key={`t-${t.name}`} checked={have.has(`t-${t.name}`)} onChange={() => toggleHave(`t-${t.name}`)}>
              <span className="font-bold">{t.name}</span>
              {t.essential && <span className="stamp ml-1.5 align-middle text-[var(--bad)]">must have</span>}
              {t.substitute && (
                <span className="block text-xs muted">
                  No {t.name.toLowerCase().replace(/\s*\(.*\)$/, "")}? Use {t.substitute}.
                </span>
              )}
            </CheckRow>
          ))}
        </ul>
        {d.parts.length > 0 && (
          <>
            <p className="font-pixel mb-1 mt-3 text-[11px] muted">PARTS TO BUY</p>
            <ul>
              {d.parts.map((p) => (
                <CheckRow key={`p-${p.name}`} checked={have.has(`p-${p.name}`)} onChange={() => toggleHave(`p-${p.name}`)} right={p.approx_cost}>
                  {p.name}
                </CheckRow>
              ))}
            </ul>
          </>
        )}
      </div>

      {d.store_types.length > 0 && (d.parts.length > 0 || d.tools.length > 0) && (
        <NearbyPlaces
          title="Where to buy it nearby"
          icon="pin"
          types={d.store_types}
          buttonLabel="Find stores near me"
          tip={`Call ahead to check they have the ${(d.parts[0]?.name ?? d.part_name).toLowerCase()} in stock. Bring the old part to match it.`}
        />
      )}

      {/* Steps */}
      <div className="card p-4">
        <div className="card-head">
          <h3 className="title">
            <PixelIcon name="list" /> Step by step
          </h3>
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
            <span className="font-pixel text-sm text-[var(--accent-text)]" aria-label={`${done.size} of ${d.steps.length} steps done`}>
              {done.size}/{d.steps.length}
            </span>
          </span>
        </div>
        <div className="mb-4 flex gap-1" aria-hidden>
          {d.steps.map((_, i) => (
            <span key={i} className={`h-2.5 flex-1 border border-[var(--ink)] ${done.has(i) ? "bg-[var(--good)]" : "bg-[var(--paper-2)]"}`} />
          ))}
        </div>
        <ol className="space-y-3">
          {d.steps.map((s, i) => {
            const isDone = done.has(i);
            const isNext = !isDone && [...Array(i).keys()].every((j) => done.has(j));
            return (
              <li
                key={i}
                className={`rounded-lg border p-3 ${isNext ? "border-2 border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--paper-2)]"}`}
                aria-current={isNext ? "step" : undefined}
              >
                <button type="button" onClick={() => toggleStep(i)} className="flex w-full gap-3 text-left" aria-pressed={isDone}>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center border-2 border-[var(--ink)] font-pixel text-sm ${
                      isDone ? "bg-[var(--good)] text-white" : isNext ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--paper)]"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className={isDone ? "opacity-60" : ""}>
                    <span className={`block font-bold ${isDone ? "line-through" : ""}`}>{s.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed">{s.detail}</span>
                    {s.caution && (
                      <span className="mt-2 block rounded border border-[var(--warn)] bg-[var(--warn-soft)] px-2 py-1 text-xs">
                        <b>Careful:</b> {s.caution}
                      </span>
                    )}
                    <span className="sr-only">{isDone ? " (done, press to undo)" : " (press to mark done)"}</span>
                  </span>
                </button>
                {s.look_for && preview && !isDone && (marks === undefined || marks[s.look_for]) && (
                  <div className="pl-11">
                    {marks === undefined ? <StepPhotoSkeleton /> : <StepPhoto src={preview} aspect={aspect} box={marks[s.look_for]!} label={s.look_for} />}
                  </div>
                )}
                {!isDone && (
                  <div className="flex flex-wrap items-start gap-2 pl-11">
                    {isNext && (
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
                    )}
                    {s.video_search && <StepVideo query={s.video_search} />}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {allDone && (
          <div className="pop mt-4 rounded-lg border-2 border-[var(--good)] bg-[var(--good-soft)] p-4 text-center" role="status">
            <PixelIcon name="star" size={40} className="mx-auto" />
            <p className="mt-1 text-xl font-extrabold">You fixed it!</p>
            <p className="text-sm">
              About {d.waste_saved_kg} kg kept out of landfill.{logged && !demo ? ` Saved to your diary, +${earned} coins!` : ""}
            </p>
          </div>
        )}
      </div>

      <IfixitGuide query={d.ifixit_search} />

      {d.stop_and_call_pro_if.length > 0 && (
        <div className="card p-4">
          <h3 className="title mb-2">
            <PixelIcon name="stop" /> Stop and call a pro if…
          </h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {d.stop_and_call_pro_if.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {d.verdict !== "call_a_pro" && <ProHelp types={d.pro_types} options={d.help_options} diyCost={d.diy_cost} mustCall={false} item={d.item} />}

      {/* Log it */}
      {!demo && (
        <div className="card p-4">
          <h3 className="title mb-2">
            <PixelIcon name="book" /> Got it fixed?
          </h3>
          {logged ? (
            <p className="text-sm">
              <span className="stamp text-[var(--good)]">saved</span> Added to your diary as &ldquo;{WHO[logged]}&rdquo;. You earned <b>{earned} coins</b> to decorate your house!
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm muted">Log it in your diary. It counts toward your Fixed Wrapped.</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(WHO) as Who[]).map((w) => (
                  <button key={w} type="button" className="chip" onClick={() => log(w)}>
                    {WHO[w]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-[var(--ink)] bg-[var(--paper)] px-4 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5">
        <div className="mx-auto flex max-w-xl gap-2">
          <a href={ifixit} target="_blank" rel="noopener noreferrer" className="btn btn-tab flex-1 text-sm">
            iFixit guides ↗
          </a>
          <button type="button" onClick={onReset} className="btn flex-1 text-sm">
            <PixelIcon name="camera" size={16} /> New photo
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ checked, onChange, right, children }: { checked: boolean; onChange: () => void; right?: string; children: React.ReactNode }) {
  return (
    <li>
      <label className="flex min-h-10 cursor-pointer items-center gap-3 py-1">
        <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 shrink-0 accent-[var(--accent)]" />
        <span className={`flex-1 text-sm ${checked ? "muted line-through" : ""}`}>{children}</span>
        {right && <span className="shrink-0 text-sm muted">{right}</span>}
      </label>
    </li>
  );
}
