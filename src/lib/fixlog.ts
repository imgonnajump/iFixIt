// "Your repair impact": a per-device log of finished fixes (browser storage only).

export type Fix = { item: string; part: string; saved: number; kg: number; date: string };

const KEY = "fixcam.fixes.v1";

export function loadFixes(): Fix[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addFix(fix: Fix): Fix[] {
  const list = [fix, ...loadFixes()].slice(0, 100);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
  return list;
}

export function totals(list: Fix[]) {
  return {
    count: list.length,
    saved: Math.round(list.reduce((a, f) => a + (f.saved || 0), 0)),
    kg: Math.round(list.reduce((a, f) => a + (f.kg || 0), 0) * 10) / 10,
  };
}
