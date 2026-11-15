"use client";

import { useRef, useState } from "react";
import { newId, sampleYear, totals, WHO, type Fix, type Who } from "@/lib/fixlog";
import { ROOM_IDS, ROOMS } from "@/lib/pixel/world";
import { PixelIcon } from "./PixelIcon";

const fmtMonth = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function Diary({ fixes, setFixes }: { fixes: Fix[]; setFixes: (f: Fix[]) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Fix | null>(null);
  const t = totals(fixes);
  const hasSample = fixes.some((f) => f.source === "sample");
  const sorted = [...fixes].sort((a, b) => b.date.localeCompare(a.date));
  const groups = new Map<string, Fix[]>();
  sorted.forEach((f) => {
    const k = fmtMonth(f.date);
    groups.set(k, [...(groups.get(k) ?? []), f]);
  });

  function openEditor(f?: Fix) {
    setEditing(
      f ?? {
        id: newId(),
        date: new Date().toISOString(),
        item: "",
        part: "",
        room: "other",
        who: "me",
        spent: 0,
        saved: 0,
        kg: 1,
        difficulty: 2,
        notes: "",
        source: "manual",
      },
    );
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  function save(f: Fix) {
    const exists = fixes.some((x) => x.id === f.id);
    setFixes(exists ? fixes.map((x) => (x.id === f.id ? f : x)) : [f, ...fixes]);
    dialogRef.current?.close();
  }

  function remove(f: Fix) {
    if (confirm(`Delete "${f.item}" from your diary?`)) setFixes(fixes.filter((x) => x.id !== f.id));
  }

  return (
    <section aria-labelledby="diary-title" className="space-y-4">
      <div className="card-head">
        <h2 id="diary-title" className="title">
          <PixelIcon name="book" /> Fix diary
        </h2>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => openEditor()}>
          <PixelIcon name="pencil" size={14} /> Log a fix
        </button>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat label="fixes" value={String(t.count)} />
        <Stat label="saved" value={`$${t.saved.toLocaleString()}`} />
        <Stat label="kept from landfill" value={`${t.kg} kg`} />
      </dl>

      {fixes.length === 0 && (
        <div className="card p-4 text-center">
          <p className="font-bold">No fixes yet.</p>
          <p className="mt-1 text-sm muted">Finish a repair with FixCam and it lands here automatically, or log one you did yourself.</p>
          <button type="button" className="btn btn-sm mt-3" onClick={() => setFixes([...sampleYear(new Date().getFullYear()), ...fixes])}>
            Try it with a sample year
          </button>
        </div>
      )}

      {[...groups.entries()].map(([month, list]) => (
        <div key={month}>
          <h3 className="font-pixel mb-1 text-xs muted">{month}</h3>
          <ul className="card dash-list">
            {list.map((f) => (
              <li key={f.id} className="flex items-start gap-3 p-3">
                <span className="font-pixel w-12 shrink-0 pt-0.5 text-xs muted">{fmtDay(f.date)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug">
                    {f.item}
                    {f.part && <span className="font-normal muted"> · {f.part}</span>}
                  </p>
                  <p className="text-xs muted">
                    {f.room === "other" ? "Around the house" : ROOMS[f.room].name} · {WHO[f.who]}
                    {f.spent > 0 && <> · spent ${f.spent}</>}
                  </p>
                  {f.notes && <p className="mt-1 text-sm">{f.notes}</p>}
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {f.saved > 0 && <span className="stamp text-[var(--good)]">saved ${f.saved}</span>}
                    {f.kg > 0 && <span className="stamp text-[var(--tab-text)]">{f.kg} kg</span>}
                    {f.source === "sample" && <span className="stamp muted">sample</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className="btn btn-sm px-2" onClick={() => openEditor(f)} aria-label={`Edit ${f.item}`}>
                    <PixelIcon name="pencil" size={14} />
                  </button>
                  <button type="button" className="btn btn-sm px-2" onClick={() => remove(f)} aria-label={`Delete ${f.item}`}>
                    <PixelIcon name="close" size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {fixes.length > 0 && (
        <p className="text-sm">
          {hasSample ? (
            <button type="button" className="link" onClick={() => setFixes(fixes.filter((f) => f.source !== "sample"))}>
              Remove sample fixes
            </button>
          ) : (
            <button type="button" className="link" onClick={() => setFixes([...fixes, ...sampleYear(new Date().getFullYear())])}>
              Add a sample year (for demos)
            </button>
          )}
        </p>
      )}

      <dialog ref={dialogRef} className="card m-auto w-[min(92vw,28rem)] p-0 text-[var(--ink)]" aria-labelledby="fix-editor-title" onClose={() => setEditing(null)}>
        {editing && <FixEditor initial={editing} onSave={save} onCancel={() => dialogRef.current?.close()} />}
      </dialog>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-2 py-3">
      <dd className="whitespace-nowrap text-lg font-extrabold sm:text-xl">{value}</dd>
      <dt className="text-xs muted">{label}</dt>
    </div>
  );
}

function FixEditor({ initial, onSave, onCancel }: { initial: Fix; onSave: (f: Fix) => void; onCancel: () => void }) {
  const [f, setF] = useState<Fix>(initial);
  const set = <K extends keyof Fix>(k: K, v: Fix[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const isNew = initial.item === "";

  return (
    <form
      className="space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (f.item.trim()) onSave({ ...f, item: f.item.trim(), part: f.part.trim() });
      }}
    >
      <h2 id="fix-editor-title" className="title">
        <PixelIcon name="pencil" /> {isNew ? "Log a fix" : "Edit fix"}
      </h2>
      <Field label="What did you fix?" id="fe-item">
        <input id="fe-item" className="field" required value={f.item} onChange={(e) => set("item", e.target.value)} placeholder="e.g. Kitchen faucet" />
      </Field>
      <Field label="Part (optional)" id="fe-part">
        <input id="fe-part" className="field" value={f.part} onChange={(e) => set("part", e.target.value)} placeholder="e.g. Cartridge" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Room" id="fe-room">
          <select id="fe-room" className="field" value={f.room} onChange={(e) => set("room", e.target.value as Fix["room"])}>
            {ROOM_IDS.map((id) => (
              <option key={id} value={id}>
                {ROOMS[id].name}
              </option>
            ))}
            <option value="other">Somewhere else</option>
          </select>
        </Field>
        <Field label="Date" id="fe-date">
          <input
            id="fe-date"
            type="date"
            className="field"
            value={f.date.slice(0, 10)}
            onChange={(e) => e.target.value && set("date", new Date(e.target.value + "T12:00:00").toISOString())}
          />
        </Field>
      </div>
      <Field label="Who fixed it?" id="fe-who">
        <select id="fe-who" className="field" value={f.who} onChange={(e) => set("who", e.target.value as Who)}>
          {Object.entries(WHO).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Spent $" id="fe-spent">
          <input id="fe-spent" type="number" min={0} inputMode="decimal" className="field" value={f.spent} onChange={(e) => set("spent", Number(e.target.value) || 0)} />
        </Field>
        <Field label="Saved $" id="fe-saved">
          <input id="fe-saved" type="number" min={0} inputMode="decimal" className="field" value={f.saved} onChange={(e) => set("saved", Number(e.target.value) || 0)} />
        </Field>
        <Field label="Kept (kg)" id="fe-kg">
          <input id="fe-kg" type="number" min={0} step="0.1" inputMode="decimal" className="field" value={f.kg} onChange={(e) => set("kg", Number(e.target.value) || 0)} />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-bold">How hard was it?</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`chip cursor-pointer ${f.difficulty === n ? "border-[var(--ink)] bg-[var(--accent-soft)] font-bold" : ""}`}>
              <input type="radio" name="fe-diff" className="sr-only" checked={f.difficulty === n} onChange={() => set("difficulty", n)} />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Notes" id="fe-notes">
        <textarea id="fe-notes" className="field" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="What worked, what to remember next time" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-sm btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}
