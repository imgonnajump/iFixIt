"use client";

import { useRef, useState } from "react";
import { cleanBox, prepareImage, type Box } from "@/lib/image";
import type { IconName } from "@/lib/pixel/icons";
import { PixelIcon } from "./PixelIcon";
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
  looks_good: { icon: "check" as IconName, title: "Looks good!", card: "border-[var(--good)] bg-[var(--good-soft)]", tone: "green" as const },
  not_quite: { icon: "warn" as IconName, title: "Not quite", card: "border-[var(--warn)] bg-[var(--warn-soft)]", tone: "red" as const },
  cant_tell: { icon: "camera" as IconName, title: "Can't tell yet", card: "border-[var(--line)] bg-[var(--paper-2)]", tone: "orange" as const },
};

// "Check my work": snap a progress photo, the AI compares it with what this step should achieve.
export function CheckWork({ context, onPassed }: { context: Record<string, unknown>; onPassed: () => void }) {
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
          className="btn btn-sm btn-primary"
        >
          <PixelIcon name="camera" size={14} /> Check my work
        </button>
      )}

      {state.kind === "checking" && (
        <div className="mt-1 overflow-hidden rounded-lg border border-[var(--line)]">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.preview} alt="" className="max-h-56 w-full object-cover brightness-75" />
            <div className="scan-line" />
          </div>
          <p className="flex items-center gap-2 bg-[var(--paper)] px-3 py-2 text-xs ">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            Checking your work…
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-1 rounded-lg bg-[var(--bad-soft)] p-3 text-xs ">
          {state.message}{" "}
          <button onClick={open} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {state.kind === "done" &&
        (() => {
          const c = state.check;
          const look = LOOK[c.verdict];
          const box = c.issue ? cleanBox(c.issue) : null;
          return (
            <div className={`pop mt-1 w-full rounded-lg border-2 p-3 ${look.card}`} role="status">
              <p className="flex items-center gap-2 font-bold">
                <PixelIcon name={look.icon} size={18} /> {c.headline || look.title}
              </p>
              <p className="mt-1 text-sm ">{c.feedback}</p>
              {c.fix && <p className="mt-2 text-sm font-bold">Next: {c.fix}</p>}
              {c.safety && <p className="mt-2 rounded-lg bg-[var(--bad-soft)] px-2 py-1 text-xs font-medium "><b>Safety:</b> {c.safety}</p>}
              {box && c.issue ? (
                <StepPhoto src={state.preview} aspect={state.aspect} box={box} label={c.issue.label} tone={look.tone} caption="Your progress photo" />
              ) : null}
              {c.verdict === "looks_good" ? (
                <p className="mt-2 text-xs text-[var(--good)]">Marking this step done…</p>
              ) : (
                <button onClick={open} className="btn btn-sm mt-3">
                  <PixelIcon name="camera" size={14} /> Check again
                </button>
              )}
            </div>
          );
        })()}
    </div>
  );
}
