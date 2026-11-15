"use client";

import { useId, useRef, useState } from "react";
import { totals, type Fix } from "@/lib/fixlog";
import {
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  MOODS,
  SHIRT_COLORS,
  SKIN_TONES,
  type Profile,
} from "@/lib/profile";
import { PixelAvatar } from "./PixelAvatar";
import { PixelIcon } from "./PixelIcon";

export function ProfilePanel({
  profile,
  setProfile,
  fixes,
  visits,
  coins,
  compact = false,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  fixes: Fix[];
  visits: { today: number; total: number };
  coins: number;
  compact?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mood = MOODS.find((m) => m.id === profile.mood) ?? MOODS[0];
  const t = totals(fixes);
  const latest = [...fixes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const [opens, setOpens] = useState(0);
  const open = () => {
    setOpens((n) => n + 1); // fresh form each time
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  const editor = (
    <dialog ref={dialogRef} className="card m-auto w-[min(94vw,30rem)] p-0 text-[var(--ink)]" aria-label="Edit profile">
      <ProfileEditor
        key={opens}
        initial={profile}
        onSave={(p) => {
          setProfile(p);
          dialogRef.current?.close();
        }}
        onCancel={() => dialogRef.current?.close()}
      />
    </dialog>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <button type="button" onClick={open} className="shrink-0 rounded-lg border border-[var(--line)] bg-[var(--paper-2)]" aria-label="Edit your profile">
          <PixelAvatar avatar={profile.avatar} size={52} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold leading-tight">{profile.name}</p>
          <p className="flex items-center gap-1 text-xs muted">
            <PixelIcon name={mood.icon} size={12} /> Today is… {mood.label.toLowerCase()}
            <span className="ml-1 flex items-center gap-0.5 font-bold text-[var(--ink)]">
              <PixelIcon name="coin" size={12} /> {coins}
            </span>
          </p>
        </div>
        <button type="button" onClick={open} className="btn btn-sm">
          <PixelIcon name="pencil" size={14} /> Edit
        </button>
        {editor}
      </div>
    );
  }

  return (
    <aside aria-label="Your profile" className="flex h-full flex-col gap-3">
      <p className="font-pixel text-[11px] muted">
        TODAY <span className="text-[var(--accent-text)]">{visits.today}</span> | TOTAL {visits.total}
      </p>
      <div className="flex items-center gap-2 border-y border-dashed border-[var(--line)] py-1.5 text-sm">
        <span className="font-pixel text-[11px] text-[var(--tab-text)]">TODAY IS..</span>
        <PixelIcon name={mood.icon} size={14} />
        <span className="font-bold">{mood.label}</span>
      </div>
      <div className="grid place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-2)] py-3">
        <PixelAvatar avatar={profile.avatar} size={120} label={`${profile.name}'s pixel avatar`} />
      </div>
      <div className="text-center">
        <p className="text-lg font-extrabold leading-tight">{profile.name}</p>
        <p className="mt-1 text-sm text-[var(--tab-text)]">{profile.status}</p>
      </div>
      <dl className="grid grid-cols-3 gap-1 text-center">
        <div>
          <dd className="font-extrabold">{t.count}</dd>
          <dt className="text-[11px] muted">fixes</dt>
        </div>
        <div>
          <dd className="font-extrabold">${t.saved.toLocaleString()}</dd>
          <dt className="text-[11px] muted">saved</dt>
        </div>
        <div>
          <dd className="font-extrabold">{t.kg}kg</dd>
          <dt className="text-[11px] muted">kept</dt>
        </div>
      </dl>
      <p className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[var(--line)] py-1.5 font-extrabold">
        <PixelIcon name="coin" size={16} /> {coins} coins
      </p>
      {latest.length > 0 && (
        <div>
          <p className="font-pixel mb-1 text-[11px] muted">RECENT FIXES</p>
          <ul className="space-y-1 text-sm">
            {latest.map((f) => (
              <li key={f.id} className="flex items-center gap-1.5 truncate">
                <span className="stamp text-[var(--good)]">fixed</span>
                <span className="truncate">{f.item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-auto flex gap-3 border-t border-dashed border-[var(--line)] pt-2 text-sm">
        <button type="button" className="link font-bold" onClick={open}>
          Edit profile
        </button>
      </div>
      {editor}
    </aside>
  );
}

function ProfileEditor({ initial, onSave, onCancel }: { initial: Profile; onSave: (p: Profile) => void; onCancel: () => void }) {
  const [p, setP] = useState<Profile>(initial);
  const uid = useId();
  const setA = <K extends keyof Profile["avatar"]>(k: K, v: Profile["avatar"][K]) => setP((prev) => ({ ...prev, avatar: { ...prev.avatar, [k]: v } }));

  return (
    <form
      className="space-y-4 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...p, name: p.name.trim() || "New fixer" });
      }}
    >
      <h2 id={`${uid}-title`} className="title">
        <PixelIcon name="person" /> Edit profile
      </h2>
      <div className="flex items-center gap-4">
        <div className="grid shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper-2)] p-2">
          <PixelAvatar avatar={p.avatar} size={96} label="Avatar preview" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <label htmlFor={`${uid}-pe-name`} className="mb-1 block text-sm font-bold">
              Name
            </label>
            <input id={`${uid}-pe-name`} className="field" maxLength={24} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor={`${uid}-pe-mood`} className="mb-1 block text-sm font-bold">
              Today is…
            </label>
            <select id={`${uid}-pe-mood`} className="field" value={p.mood} onChange={(e) => setP({ ...p, mood: e.target.value as Profile["mood"] })}>
              {MOODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-pe-status`} className="mb-1 block text-sm font-bold">
          Status message
        </label>
        <input id={`${uid}-pe-status`} className="field" maxLength={60} value={p.status} onChange={(e) => setP({ ...p, status: e.target.value })} />
      </div>

      <OptionRow legend="Hair" name={`${uid}-hair`} options={HAIR_STYLES.map((h) => ({ value: h, label: h }))} value={p.avatar.hair} onChange={(v) => setA("hair", v as Profile["avatar"]["hair"])} />
      <SwatchRow legend="Hair color" name={`${uid}-hairColor`} colors={HAIR_COLORS} value={p.avatar.hairColor} onChange={(v) => setA("hairColor", v)} />
      <SwatchRow legend="Skin" name={`${uid}-skin`} colors={SKIN_TONES} value={p.avatar.skin} onChange={(v) => setA("skin", v)} />
      <SwatchRow legend="Shirt" name={`${uid}-shirt`} colors={SHIRT_COLORS} value={p.avatar.shirt} onChange={(v) => setA("shirt", v)} />
      <OptionRow
        legend="Hat"
        name={`${uid}-hat`}
        options={HATS.map((h) => ({ value: h, label: h === "hardhat" ? "hard hat" : h }))}
        value={p.avatar.hat}
        onChange={(v) => setA("hat", v as Profile["avatar"]["hat"])}
      />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-sm btn-primary">
          Save profile
        </button>
      </div>
    </form>
  );
}

function OptionRow({ legend, name, options, value, onChange }: { legend: string; name: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <label key={o.value} className={`chip cursor-pointer capitalize ${value === o.value ? "border-[var(--ink)] bg-[var(--accent-soft)] font-bold" : ""}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SwatchRow({ legend, name, colors, value, onChange }: { legend: string; name: string; colors: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <label key={c} className="cursor-pointer">
            <input type="radio" name={name} value={c} checked={value === c} onChange={() => onChange(c)} className="peer sr-only" aria-label={`${legend} option ${i + 1}`} />
            <span
              className="block h-8 w-8 rounded-md border-2 border-[var(--line)] peer-checked:border-[var(--ink)] peer-checked:ring-2 peer-checked:ring-[var(--accent)] peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--focus)]"
              style={{ background: c }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
