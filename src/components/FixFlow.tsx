"use client";

import { useEffect, useRef, useState } from "react";
import type { Fix } from "@/lib/fixlog";
import { prepareImage } from "@/lib/image";
import type { Diagnosis } from "@/lib/schema";
import { PixelIcon } from "./PixelIcon";
import { Result } from "./Result";

export type Place = { room: string; roomId: string; object: string; issue: string };

export type Toolkit = "full" | "basic" | "none";
const TOOLKITS: { id: Toolkit; label: string; sub: string }[] = [
  { id: "full", label: "Full toolbox", sub: "Drills, wrenches, the works" },
  { id: "basic", label: "A few basics", sub: "Screwdriver, pliers, tape" },
  { id: "none", label: "No tools at all", sub: "Use what's around the house" },
];

const EXAMPLES = ["Keeps running", "Drips", "Won't turn on", "Makes a noise", "Cracked", "Leaking"];

const STAGES = [
  "Looking closely at your photo…",
  "Identifying the part…",
  "Figuring out what went wrong…",
  "Checking if it's safe to DIY…",
  "Pricing parts and who can help…",
  "Writing your step-by-step fix…",
  "Almost there…",
];

const TIPS = [
  "Take a photo of a part before you remove it. It's the best reassembly guide.",
  "Put screws in an egg carton in the order you take them out.",
  "Bring the old part to the store to match it exactly.",
  "Always cut the power or the water first. Every time.",
  "Repair Cafés fix things for free. There may be one near you.",
];

export function FixFlow({ place, clearPlace, onLog }: { place: Place | null; clearPlace: () => void; onLog: (f: Fix) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aspect, setAspect] = useState(4 / 3);
  const [image, setImage] = useState<{ data: string; grid: string } | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [demo, setDemo] = useState(false);
  const [toolkit, setToolkitState] = useState<Toolkit>("basic");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fixcam.toolkit") as Toolkit | null;
      if (saved && TOOLKITS.some((t) => t.id === saved)) setToolkitState(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const setToolkit = (t: Toolkit) => {
    setToolkitState(t);
    try {
      localStorage.setItem("fixcam.toolkit", t);
    } catch {
      /* storage unavailable */
    }
  };

  // A new spot picked in the house starts a fresh fix.
  useEffect(() => {
    if (!place) return;
    setNote(place.issue);
    setResult(null);
    setError(null);
  }, [place]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const img = await prepareImage(file);
      setPreview(img.preview);
      setAspect(img.aspect);
      setImage({ data: img.data, grid: img.grid });
    } catch {
      setError("Couldn't read that image. Try a JPEG or PNG.");
    }
  }

  async function diagnose() {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: image.data,
          mediaType: "image/jpeg",
          note,
          lang: navigator.language,
          toolkit,
          place: place ? `${place.room}, ${place.object}` : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setResult(json.diagnosis);
      setDemo(Boolean(json.demo));
      window.scrollTo({ top: 0 });
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
    clearPlace();
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    window.scrollTo({ top: 0 });
  }

  const thing = place?.object.toLowerCase() ?? "the broken thing";

  return (
    <section aria-labelledby="fix-title" className="space-y-4">
      <div className="card-head">
        <h2 id="fix-title" className="title">
          <PixelIcon name="camera" /> Fix it
        </h2>
        {(preview || result) && !loading && (
          <button type="button" onClick={reset} className="link text-sm">
            Start over
          </button>
        )}
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {place && !result && !loading && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--tab)] bg-[var(--paper-2)] px-3 py-2 text-sm">
          <PixelIcon name="pin" size={16} />
          <span className="min-w-0 flex-1">
            <b>{place.room}</b> → {place.object}: {place.issue.toLowerCase()}
          </span>
          <button type="button" className="link text-xs" onClick={clearPlace}>
            Clear
          </button>
        </div>
      )}

      {loading && preview && <Loading preview={preview} />}

      {!loading && result && <Result d={result} preview={preview} aspect={aspect} grid={image?.grid ?? null} demo={demo} onReset={reset} onLog={onLog} placeRoom={place?.roomId} />}

      {!loading && !result && !preview && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--ink)] bg-[var(--paper-2)] px-4 py-10 text-center transition hover:bg-[var(--accent-soft)]"
          >
            <PixelIcon name="camera" size={48} />
            <span className="text-xl font-extrabold">Take a photo of {thing}</span>
            <span className="text-sm muted">Get close, with good light, so the part is easy to see.</span>
          </button>
          <button type="button" onClick={() => galleryRef.current?.click()} className="btn w-full">
            <PixelIcon name="photo" size={16} /> Choose from gallery
          </button>
          {!place && <p className="text-center text-sm muted">Tip: start from the Home tab and tap the broken thing in your pixel house.</p>}
        </div>
      )}

      {!loading && !result && preview && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border-2 border-[var(--ink)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your photo" className="max-h-[50vh] w-full object-cover" />
            <button type="button" onClick={() => cameraRef.current?.click()} className="btn btn-sm absolute right-2 top-2">
              Retake
            </button>
          </div>
          <div>
            <label htmlFor="note" className="mb-1 block text-sm font-bold">
              What&apos;s it doing? <span className="font-normal muted">(optional)</span>
            </label>
            <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. keeps running after I flush" rows={2} className="field resize-none" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((e) => (
                <button key={e} type="button" onClick={() => setNote(e)} className="chip">
                  {e}
                </button>
              ))}
            </div>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-bold">What tools do you have?</legend>
            <div className="grid grid-cols-3 gap-2">
              {TOOLKITS.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer flex-col rounded-lg border-2 p-2 text-center text-sm ${
                    toolkit === t.id ? "border-[var(--ink)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--paper-2)]"
                  } has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]`}
                >
                  <input type="radio" name="toolkit" value={t.id} checked={toolkit === t.id} onChange={() => setToolkit(t.id)} className="sr-only" />
                  <PixelIcon name={t.id === "none" ? "house" : "wrench"} size={18} className="mx-auto" />
                  <span className="mt-1 font-bold leading-tight">{t.label}</span>
                  <span className="text-[11px] leading-tight muted">{t.sub}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <ErrorBox message={error} />}
          <button type="button" onClick={diagnose} disabled={!image} className="btn btn-primary w-full text-lg">
            Diagnose it
          </button>
        </div>
      )}

      {!loading && !result && !preview && error && <ErrorBox message={error} />}
    </section>
  );
}

function Loading({ preview }: { preview: string }) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(4);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const s = setInterval(() => setStage((i) => Math.min(i + 1, STAGES.length - 1)), 4000);
    const p = setInterval(() => setProgress((x) => x + (95 - x) * 0.06), 400);
    return () => {
      clearInterval(s);
      clearInterval(p);
    };
  }, []);

  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="relative overflow-hidden rounded-lg border-2 border-[var(--ink)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="max-h-[45vh] w-full object-cover brightness-75" />
        <div className="scan-line" />
      </div>
      <div className="text-center">
        <p key={stage} className="fade-up text-lg font-bold">
          {STAGES[stage]}
        </p>
        <div className="mx-auto mt-3 flex max-w-xs gap-1" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`h-3 flex-1 border border-[var(--ink)] ${i < Math.round(progress / 10) ? "bg-[var(--accent)]" : "bg-[var(--paper-2)]"}`} />
          ))}
        </div>
        <p className="mt-2 text-xs muted">This usually takes 15–30 seconds.</p>
      </div>
      <div className="card p-3 text-sm">
        <p className="font-pixel text-xs text-[var(--tab-text)]">REPAIR TIP</p>
        <p className="mt-1">{tip}</p>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-[var(--bad)] bg-[var(--bad-soft)] p-3 text-sm">
      <p className="font-bold">That didn&apos;t work</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
