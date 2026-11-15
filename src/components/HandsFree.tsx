"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PixelIcon } from "./PixelIcon";

type Step = { title: string; detail: string; caution: string | null };

// Minimal Web Speech API types (not in every TS DOM lib).
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const COMMANDS: [RegExp, "next" | "back" | "repeat" | "stop"][] = [
  [/\b(next|done|finished|got it|ok(ay)?|continue)\b/, "next"],
  [/\b(back|previous|undo|go back)\b/, "back"],
  [/\b(repeat|again|say that again|what)\b/, "repeat"],
  [/\b(stop|exit|quit|pause|cancel)\b/, "stop"],
];

// Hands-free mode: reads each step aloud and listens for "next", "repeat", "back", "stop".
// Made for repairs where your hands are wet, greasy or full.
export function HandsFree({ steps, done, onDone, onUndo }: { steps: Step[]; done: Set<number>; onDone: (i: number) => void; onUndo: (i: number) => void }) {
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [micOk, setMicOk] = useState(true);
  const recRef = useRef<Recognition | null>(null);
  const activeRef = useRef(false);
  const speakingRef = useRef(false);
  const doneRef = useRef(done);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);
  doneRef.current = done;

  const current = steps.findIndex((_, i) => !done.has(i));
  const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
  const Rec = getRecognition();

  const lang = typeof navigator !== "undefined" ? navigator.language : "en-US";

  const listen = useCallback(() => {
    if (!activeRef.current || speakingRef.current || !recRef.current) return;
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      /* already started */
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!hasSpeech) return;
      speakingRef.current = true;
      setListening(false);
      try {
        recRef.current?.abort();
      } catch {
        /* not running */
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.98;
      u.onend = u.onerror = () => {
        speakingRef.current = false;
        listen();
      };
      window.speechSynthesis.speak(u);
    },
    [hasSpeech, lang, listen],
  );

  const stepText = useCallback(
    (i: number) => {
      if (i < 0) return "That was the last step. Nice work, you fixed it!";
      const s = steps[i];
      return `Step ${i + 1} of ${steps.length}. ${s.title}. ${s.detail}${s.caution ? ` Careful: ${s.caution}` : ""}`;
    },
    [steps],
  );

  // Latest `act`, for the recognizer callback (set below).
  const actRef = useRef<(cmd: "next" | "back" | "repeat" | "stop") => void>(() => {});

  const firstOpen = useCallback((skip?: number) => steps.findIndex((_, i) => !doneRef.current.has(i) && i !== skip), [steps]);

  const act = useCallback(
    (cmd: "next" | "back" | "repeat" | "stop") => {
      const cur = firstOpen();
      if (cmd === "stop") {
        stop();
        return;
      }
      if (cmd === "repeat") return speak(stepText(cur));
      if (cmd === "next") {
        if (cur < 0) return speak(stepText(-1));
        onDone(cur);
        return speak(stepText(firstOpen(cur)));
      }
      // back: undo the most recent finished step
      const last = Math.max(-1, ...[...doneRef.current]);
      if (last >= 0) {
        onUndo(last);
        speak(stepText(last));
      } else speak(stepText(cur));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firstOpen, onDone, onUndo, speak, stepText],
  );

  actRef.current = act;

  function stop() {
    activeRef.current = false;
    setActive(false);
    setListening(false);
    try {
      recRef.current?.abort();
    } catch {
      /* not running */
    }
    if (hasSpeech) window.speechSynthesis.cancel();
    wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
  }

  async function start() {
    activeRef.current = true;
    setActive(true);
    setHeard("");
    // Keep the screen on while working.
    try {
      const nav = navigator as unknown as {
        wakeLock?: {
          request: (t: "screen") => Promise<{ release: () => Promise<void> }>;
        };
      };
      wakeRef.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      /* not supported */
    }
    if (Rec && !recRef.current) {
      const r = new Rec();
      r.lang = lang;
      r.continuous = true;
      r.interimResults = false;
      r.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        const text = res?.[0]?.transcript?.toLowerCase().trim() ?? "";
        if (!text) return;
        setHeard(text);
        const hit = COMMANDS.find(([re]) => re.test(text));
        if (hit) actRef.current(hit[1]);
      };
      r.onend = () => {
        setListening(false);
        // Browsers stop listening after silence; keep going while active.
        if (activeRef.current && !speakingRef.current) setTimeout(listen, 250);
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") setMicOk(false);
      };
      recRef.current = r;
    }
    speak(stepText(firstOpen()));
    if (!hasSpeech) listen();
  }

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasSpeech && !Rec) return null;

  return (
    <>
      <button
        type="button"
        onClick={active ? stop : start}
        className={`btn btn-sm text-xs ${active ? "btn-primary" : ""}`}
        aria-pressed={active}
      >
        <PixelIcon name="mic" size={14} /> {active ? "Hands-free on" : "Hands-free"}
      </button>

      {active &&
        createPortal(
          <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-[var(--ink)] bg-[var(--paper)] px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 backdrop-blur">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3">
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-lg text-white">
                  {listening && micOk && <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)]/50" />}
                  <span className="relative"><PixelIcon name="mic" size={20} /></span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {current >= 0 ? `Step ${current + 1} of ${steps.length}: ${steps[current].title}` : "All steps done 🎉"}
                  </p>
                  <p className="truncate text-xs muted">
                    {Rec && micOk
                      ? heard
                        ? `Heard: “${heard}”`
                        : "Say “next”, “repeat”, “back” or “stop”"
                      : "Voice commands aren't available here. Use the buttons."}
                  </p>
                </div>
                <button onClick={stop} className="btn btn-sm px-2" aria-label="Turn off hands-free">
                  <PixelIcon name="close" size={14} />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button onClick={() => act("back")} className="btn">
                  ◀ Back
                </button>
                <button onClick={() => act("repeat")} className="btn">
                  🔁 Repeat
                </button>
                <button onClick={() => act("next")} className="btn btn-primary">
                  Next ▶
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
