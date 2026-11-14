"use client";

import { useRef, useState } from "react";
import type { Diagnosis } from "@/lib/schema";

const VERDICT = {
  easy_diy: { label: "Easy DIY fix", tone: "bg-emerald-600", emoji: "🛠️" },
  diy_with_care: { label: "DIY with care", tone: "bg-amber-500", emoji: "⚠️" },
  call_a_pro: { label: "Call a pro", tone: "bg-rose-600", emoji: "📞" },
} as const;

// Downscale to keep uploads small and fast (Claude works well at ~1568px long edge).
async function compress(file: File): Promise<{ data: string; mediaType: string; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL("image/jpeg", 0.85);
  return { data: preview.split(",")[1], mediaType: "image/jpeg", preview };
}

export default function Home() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<{ data: string; mediaType: string } | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [demo, setDemo] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const { data, mediaType, preview } = await compress(file);
      setPreview(preview);
      setImage({ data, mediaType });
    } catch {
      setError("Couldn't read that image. Try a JPEG or PNG.");
    }
  }

  async function diagnose() {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDone(new Set());
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image.data, mediaType: image.mediaType, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setResult(json.diagnosis);
      setDemo(Boolean(json.demo));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setImage(null);
    setNote("");
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-16 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-xl text-white">🔧</div>
        <div>
          <h1 className="text-xl font-bold leading-tight">FixCam</h1>
          <p className="text-sm text-neutral-500">Snap it. Name it. Fix it yourself.</p>
        </div>
      </header>

      {!result && (
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2">
                <span className="text-5xl">📷</span>
                <span className="font-medium">Take or upload a photo of the broken thing</span>
                <span className="text-xs">Leaky faucet, frayed cable, bike part, warning light…</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional: what's it doing? (e.g. 'keeps running after flushing')"
            rows={2}
            className="w-full rounded-xl border border-neutral-300 bg-transparent p-3 text-sm dark:border-neutral-700"
          />
          <button
            type="button"
            disabled={!image || loading}
            onClick={diagnose}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Diagnosing…" : "Diagnose it"}
          </button>
          {loading && (
            <p className="text-center text-sm text-neutral-500">Identifying the part and writing your repair plan…</p>
          )}
        </section>
      )}

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

      {result && <Result d={result} preview={preview} demo={demo} done={done} setDone={setDone} onReset={reset} />}
    </main>
  );
}

function Result({
  d,
  preview,
  demo,
  done,
  setDone,
  onReset,
}: {
  d: Diagnosis;
  preview: string | null;
  demo: boolean;
  done: Set<number>;
  setDone: (s: Set<number>) => void;
  onReset: () => void;
}) {
  if (!d.can_diagnose) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="font-semibold">I need a better look</h2>
          <p className="mt-1 text-sm">{d.clarifying_question ?? "Try a closer, well-lit photo of the broken part."}</p>
        </div>
        <button onClick={onReset} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white">Try another photo</button>
      </section>
    );
  }

  const v = VERDICT[d.verdict];
  const ifixit = `https://www.ifixit.com/Search?query=${encodeURIComponent(d.ifixit_search)}`;
  const toggle = (i: number) => {
    const next = new Set(done);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setDone(next);
  };

  return (
    <section className="space-y-5">
      {demo && (
        <p className="rounded-xl bg-amber-50 p-2 text-center text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Demo mode: no API key set, showing a sample diagnosis.
        </p>
      )}

      <div className="flex gap-4">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-neutral-500">{d.item}</p>
          <h2 className="text-2xl font-bold leading-tight">{d.part_name}</h2>
          {d.also_called.length > 0 && (
            <p className="text-xs text-neutral-500">aka {d.also_called.join(", ")}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">Confidence: {d.confidence}</p>
        </div>
      </div>

      <div className={`rounded-2xl p-4 text-white ${v.tone}`}>
        <p className="text-lg font-bold">{v.emoji} {v.label}</p>
        <p className="text-sm opacity-90">{d.verdict_reason}</p>
      </div>

      <p className="text-sm">{d.problem}</p>
      {d.clarifying_question && <p className="text-sm italic text-neutral-500">{d.clarifying_question}</p>}

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Fix it yourself" value={d.diy_cost} strong />
        <Stat label="Hire a pro" value={d.pro_cost} />
        <Stat label="Buy new" value={d.replace_cost} />
        <Stat label="Time" value={d.time_estimate} />
        <Stat label="Difficulty" value={`${d.difficulty}/5`} />
        <Stat label="Landfill saved" value={`~${d.waste_saved_kg} kg`} />
      </div>

      {d.safety_warnings.length > 0 && (
        <Card title="⚡ Safety first" className="border-rose-300 dark:border-rose-800">
          <ul className="list-disc space-y-1 pl-5 text-sm">{d.safety_warnings.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
      )}

      <Card title="🧰 Tools">
        <ul className="list-disc space-y-1 pl-5 text-sm">{d.tools.map((t) => <li key={t}>{t}</li>)}</ul>
      </Card>

      {d.parts.length > 0 && (
        <Card title="🔩 Parts to buy">
          <ul className="space-y-1 text-sm">
            {d.parts.map((p) => (
              <li key={p.name} className="flex justify-between gap-2">
                <span>{p.name}</span>
                <span className="shrink-0 text-neutral-500">{p.approx_cost}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={`📋 Steps (${done.size}/${d.steps.length})`}>
        <ol className="space-y-3">
          {d.steps.map((s, i) => (
            <li key={i}>
              <label className="flex cursor-pointer gap-3">
                <input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} className="mt-1 h-5 w-5 shrink-0" />
                <span className={done.has(i) ? "opacity-50 line-through" : ""}>
                  <span className="font-semibold">{i + 1}. {s.title}</span>
                  <span className="block text-sm">{s.detail}</span>
                  {s.caution && <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">⚠️ {s.caution}</span>}
                </span>
              </label>
            </li>
          ))}
        </ol>
      </Card>

      {d.stop_and_call_pro_if.length > 0 && (
        <Card title="🛑 Stop and call a pro if">
          <ul className="list-disc space-y-1 pl-5 text-sm">{d.stop_and_call_pro_if.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>
      )}

      <a
        href={ifixit}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl border-2 border-blue-600 py-3 text-center font-semibold text-blue-600"
      >
        Find iFixit guides for “{d.ifixit_search}” →
      </a>
      <button onClick={onReset} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white">
        Diagnose something else
      </button>
    </section>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl p-2 ${strong ? "bg-emerald-50 dark:bg-emerald-950" : "bg-neutral-100 dark:bg-neutral-900"}`}>
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800 ${className}`}>
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </div>
  );
}
