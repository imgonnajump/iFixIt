"use client";

import { useEffect, useRef, useState } from "react";
import type { Diagnosis } from "@/lib/schema";
import { PrimaryButton, Result } from "@/components/Result";

const EXAMPLES = [
  { icon: "🚽", text: "Toilet keeps running" },
  { icon: "🔌", text: "Charger cable is frayed" },
  { icon: "🚲", text: "Bike gears skip" },
  { icon: "🚰", text: "Faucet drips" },
  { icon: "🚗", text: "Warning light came on" },
  { icon: "💻", text: "Laptop hinge is loose" },
];

const STAGES = [
  "Looking closely at your photo…",
  "Identifying the part…",
  "Figuring out what went wrong…",
  "Checking if it's safe to DIY…",
  "Pricing parts and tools…",
  "Writing your step-by-step fix…",
  "Almost there…",
];

const TIPS = [
  "Take a photo of a part before you remove it. It's the best reassembly guide.",
  "Put screws in an egg carton in the order you remove them.",
  "Bring the old part to the hardware store to match it exactly.",
  "Always cut the power or the water first. Every time.",
  "Over 60 million tonnes of e-waste are thrown away every year. Repair beats recycling.",
];

// Downscale to keep uploads small and fast (Claude works well at ~1568px long edge).
async function compress(file: File): Promise<{ data: string; mediaType: string; preview: string; aspect: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL("image/jpeg", 0.85);
  return { data: preview.split(",")[1], mediaType: "image/jpeg", preview, aspect: canvas.width / canvas.height };
}

export default function Home() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aspect, setAspect] = useState(4 / 3);
  const [image, setImage] = useState<{ data: string; mediaType: string } | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [demo, setDemo] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const { data, mediaType, preview, aspect } = await compress(file);
      setPreview(preview);
      setAspect(aspect);
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
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image.data, mediaType: image.mediaType, note }),
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
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pb-10 pt-5">
      <header className="mb-6 flex items-center justify-between">
        <button onClick={reset} className="flex items-center gap-2.5" aria-label="FixCam home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-9 w-9" />
          <span className="text-xl font-extrabold tracking-tight">FixCam</span>
        </button>
        {(preview || result) && !loading && (
          <button onClick={reset} className="text-sm font-medium text-stone-500">
            Start over
          </button>
        )}
      </header>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {loading && preview && <Loading preview={preview} />}

      {!loading && result && <Result d={result} preview={preview} aspect={aspect} demo={demo} onReset={reset} />}

      {!loading && !result && !preview && (
        <section className="fade-up space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight">
              What&apos;s <span className="text-orange-600">broken?</span>
            </h1>
            <p className="mt-3 text-lg text-stone-600 dark:text-stone-300">
              Snap a photo. Get the part name, what it costs, and a step-by-step fix.
            </p>
          </div>

          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-xl shadow-orange-600/25 transition active:scale-[0.98]"
          >
            <span className="absolute inset-4 rounded-2xl border-2 border-dashed border-white/40" />
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/20 text-4xl backdrop-blur transition group-hover:scale-105">📷</span>
            <span className="text-xl font-bold">Take a photo</span>
            <span className="text-sm opacity-85">Get close to the broken part</span>
          </button>

          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="w-full rounded-2xl bg-white py-3.5 font-semibold text-stone-800 shadow-sm ring-1 ring-stone-200 active:scale-[0.98] dark:bg-stone-900 dark:text-stone-100 dark:ring-stone-800"
          >
            🖼️ Choose from gallery
          </button>

          <div>
            <p className="mb-2 text-sm font-medium text-stone-500">Works on things like</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((e) => (
                <span key={e.text} className="rounded-full bg-white px-3 py-1.5 text-sm shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
                  {e.icon} {e.text}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            {[
              { n: "1", icon: "📸", t: "Snap it" },
              { n: "2", icon: "🔍", t: "We name the part" },
              { n: "3", icon: "🛠️", t: "Fix it yourself" },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
                <p className="text-2xl">{s.icon}</p>
                <p className="mt-1 text-xs font-semibold">{s.t}</p>
              </div>
            ))}
          </div>

          <p className="pt-2 text-center text-xs text-stone-400">
            AI can make mistakes. When in doubt, especially with gas, electricity or brakes, call a professional.
          </p>
        </section>
      )}

      {!loading && !result && preview && (
        <section className="fade-up space-y-4">
          <div className="relative overflow-hidden rounded-3xl shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your photo" className="max-h-[50vh] w-full object-cover" />
            <button
              onClick={() => cameraRef.current?.click()}
              className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-sm font-medium text-white backdrop-blur"
            >
              ↺ Retake
            </button>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
            <label htmlFor="note" className="text-sm font-semibold">
              What&apos;s it doing? <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. keeps running after I flush"
              rows={2}
              className="mt-2 w-full resize-none rounded-xl bg-stone-50 p-3 text-base outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-400 dark:bg-stone-800 dark:ring-stone-700"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.slice(0, 4).map((e) => (
                <button
                  key={e.text}
                  type="button"
                  onClick={() => setNote(e.text)}
                  className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700 active:scale-95 dark:bg-stone-800 dark:text-stone-300"
                >
                  {e.icon} {e.text}
                </button>
              ))}
            </div>
          </div>

          {error && <ErrorBox message={error} />}

          <PrimaryButton onClick={diagnose} disabled={!image}>
            🔍 Diagnose it
          </PrimaryButton>
        </section>
      )}

      {!loading && !result && !preview && error && <ErrorBox message={error} />}
    </main>
  );
}

function Loading({ preview }: { preview: string }) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(4);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const s = setInterval(() => setStage((i) => Math.min(i + 1, STAGES.length - 1)), 4000);
    // Eases toward 95% so it keeps moving but never claims to finish early.
    const p = setInterval(() => setProgress((x) => x + (95 - x) * 0.06), 400);
    return () => {
      clearInterval(s);
      clearInterval(p);
    };
  }, []);

  return (
    <section className="fade-up space-y-5" aria-live="polite">
      <div className="relative overflow-hidden rounded-3xl shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="max-h-[45vh] w-full object-cover brightness-75" />
        <div className="scan-line" />
        <div className="pointer-events-none absolute inset-5 rounded-2xl border-2 border-white/50" />
      </div>
      <div className="text-center">
        <p key={stage} className="fade-up text-lg font-semibold">
          {STAGES[stage]}
        </p>
        <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-stone-400">This usually takes 15–30 seconds</p>
      </div>
      <div className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
        <p className="font-semibold text-orange-600">💡 Repair tip</p>
        <p className="mt-1 text-stone-600 dark:text-stone-300">{tip}</p>
      </div>
    </section>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900">
      <p className="font-semibold">😕 That didn&apos;t work</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
