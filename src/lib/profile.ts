// The user's profile (name, mood, avatar). Stored in this browser only.

export const HAIR_STYLES = ["short", "bob", "long", "spiky", "bun"] as const;
export const HATS = ["none", "cap", "beanie", "hardhat"] as const;
export const HAIR_COLORS = ["#3b2a20", "#6b4226", "#c8873a", "#e9c46a", "#b23a48", "#2b2b2b", "#8e8e93"] as const;
export const SKIN_TONES = ["#f6d5b8", "#eebd94", "#d6996b", "#a8693f", "#6e4126"] as const;
export const SHIRT_COLORS = ["#e8590c", "#1d8a9e", "#5c7cfa", "#37a24b", "#e64980", "#f2c94c", "#495057", "#ffffff"] as const;
export const MOODS = [
  { id: "happy", label: "Happy", icon: "star" },
  { id: "handy", label: "Handy", icon: "wrench" },
  { id: "proud", label: "Proud", icon: "check" },
  { id: "tired", label: "Tired", icon: "warn" },
  { id: "eco", label: "Eco", icon: "leaf" },
] as const;

export type Avatar = {
  hair: (typeof HAIR_STYLES)[number];
  hairColor: string;
  skin: string;
  shirt: string;
  hat: (typeof HATS)[number];
};

export type Profile = {
  name: string;
  mood: (typeof MOODS)[number]["id"];
  status: string;
  avatar: Avatar;
};

export const DEFAULT_PROFILE: Profile = {
  name: "New fixer",
  mood: "handy",
  status: "Don't toss it, fix it.",
  avatar: { hair: "bob", hairColor: HAIR_COLORS[1], skin: SKIN_TONES[1], shirt: SHIRT_COLORS[0], hat: "none" },
};

const KEY = "fixcam.profile.v1";
const VISITS = "fixcam.visits.v1";

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    const p = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...p, avatar: { ...DEFAULT_PROFILE.avatar, ...(p?.avatar ?? {}) } };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

// A little visit counter for the profile header ("today / total").
export function countVisit(): { today: number; total: number } {
  const day = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(VISITS);
    const v = raw ? JSON.parse(raw) : { day, today: 0, total: 0 };
    const next = { day, today: v.day === day ? v.today + 1 : 1, total: (v.total ?? 0) + 1 };
    localStorage.setItem(VISITS, JSON.stringify(next));
    return { today: next.today, total: next.total };
  } catch {
    return { today: 1, total: 1 };
  }
}
