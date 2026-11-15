import type { Diagnosis } from "./schema";

// "$120-200" -> 160. Returns null if no number found.
function midpoint(s: string): number | null {
  const nums = (s.replace(/,/g, "").match(/\d+(\.\d+)?/g) ?? []).map(Number).slice(0, 2);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function savings(d: Diagnosis): { amount: number; vs: string } | null {
  const diy = midpoint(d.diy_cost);
  const pro = midpoint(d.pro_cost);
  const replace = midpoint(d.replace_cost);
  if (d.verdict === "call_a_pro") {
    if (pro != null && replace != null && replace > pro) return { amount: Math.round(replace - pro), vs: "buying new" };
    return null;
  }
  const best = Math.max(pro ?? 0, replace ?? 0);
  if (diy != null && best > diy) return { amount: Math.round(best - diy), vs: pro != null && pro >= (replace ?? 0) ? "hiring a pro" : "buying new" };
  return null;
}
