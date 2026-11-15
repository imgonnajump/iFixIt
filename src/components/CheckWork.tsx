"use client";

import { useRef, useState } from "react";
import { cleanBox, prepareImage, type Box } from "@/lib/image";
import { StepPhoto } from "./StepPhoto";

type Check = {
  verdict: "looks_good" | "not_quite" | "cant_tell";
  headline: string;
  feedback: string;
  fix: string | null;
  safety: string | null;
  issue: ({ label: string } & Box) | null;
};

type State =
  | { kind: "idle" }
  | { kind: "checking"; preview: string }
  | { kind: "done"; check: Check; preview: string; aspect: number }
  | { kind: "error"; message: string };

const LOOK = {
  looks_good: { icon: "✅", title: "Looks good!", card: "bg-emerald-50 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900", tone: "green" as const },
  not_quite: { icon: "⚠️", title: "Not quite", card: "bg-amber-50 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900", tone: "red" as const },
  cant_tell: { icon: "🤔", title: "Can't tell yet", card: "bg-sky-50 ring-sky-200 dark:bg-sky-950/40 dark:ring-sky-900", tone: "orange" as const },
};

// "Check my work": snap a progress photo, the AI compares it with what this step should achieve.
export function CheckWork({
  context,
  onPassed,
}: {
  context: Record<string, unknown>;
  onPassed: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onFile(file: File | undefined) {
    if (!file) return;
    let img;
    try {
      img = await prepareImage(file);
    } catch {
      setState({ kind: "error", message: "Couldn't read that photo." });
      return;
    }
    setState({ kind: "checking", preview: img.preview });
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid: img.grid, ...context }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Check failed.");
      setState({ kind: "done", check: json.check, preview: img.preview, aspect: img.aspect });
      if (json.check.verdict === "looks_good") setTimeout(onPassed, 1800);
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Check failed." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const open = () => inputRef.current?.click();

  return (
    <div className="mt-2">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {state.kind === "idle" && (
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-600/30 active:scale-95"
        >
          📸 Check my work
        </button>
      )}

      {state.kind === "checking" && (
        <div className="mt-1 overflow-hidden rounded-xl ring-1 ring-stone-200 dark:ring-stone-700">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.preview} alt="" className="max-h-56 w-full object-cover brightness-75" />
            <div className="scan-line" />
          </div>
          <p className="flex items-center gap-2 bg-white px-3 py-2 text-xs text-stone-600 dark:bg-stone-900 dark:text-stone-300">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Checking your work…
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-1 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {state.message}{" "}
          <button onClick={open} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {state.kind === "done" && (() => {
        const c = state.check;
        const look = LOOK[c.verdict];
        const box = c.issue ? cleanBox(c.issue) : null;
        return (
          <div className={`pop mt-1 rounded-xl p-3 ring-1 ${look.card}`}>
            <p className="font-bold">
              {look.icon} {c.headline || look.title}
            </p>
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{c.feedback}</p>
            {c.fix && <p className="mt-2 text-sm font-medium">👉 {c.fix}</p>}
            {c.safety && (
              <p className="mt-2 rounded-lg bg-rose-100 px-2 py-1 text-xs font-medium text-rose-900 dark:bg-rose-950 dark:text-rose-200">⚡ {c.safety}</p>
            )}
            {box && c.issue ? (
              <StepPhoto src={state.preview} aspect={state.aspect} box={box} label={c.issue.label} tone={look.tone} caption="Your progress photo" />
            ) : null}
            {c.verdict === "looks_good" ? (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">Marking this step done…</p>
            ) : (
              <button onClick={open} className="mt-3 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white active:scale-95 dark:bg-white dark:text-stone-900">
                📸 Check again
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}
