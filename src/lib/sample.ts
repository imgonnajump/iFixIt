import type { Diagnosis } from "./schema";

export const SAMPLE_DIAGNOSIS: Diagnosis = {
  can_diagnose: true,
  clarifying_question: null,
  item: "Toilet tank (gravity flush)",
  part_name: "Flapper valve",
  also_called: ["Toilet flapper", "Flush valve seal", "Tank ball"],
  problem:
    "The rubber flapper is warped and no longer seals the flush valve, so water keeps leaking into the bowl and the fill valve keeps refilling. A mis-set float can cause the same symptom.",
  confidence: "high",
  verdict: "easy_diy",
  verdict_reason: "A flapper clips on by hand and needs no plumbing skills.",
  difficulty: "1",
  time_estimate: "10-15 minutes",
  diy_cost: "$6-12",
  pro_cost: "$120-200",
  replace_cost: "$150-350",
  safety_warnings: ["Tank water is clean, but the bowl is not: wear gloves if you reach below the rim."],
  tools: ["Rubber gloves", "Sponge or towel", "Scissors (to trim the chain)"],
  parts: [{ name: "Universal 2-inch toilet flapper", approx_cost: "$6-12" }],
  steps: [
    { title: "Shut off the water", detail: "Turn the supply valve behind the toilet clockwise until it stops.", caution: null },
    { title: "Drain the tank", detail: "Flush and hold the handle down so the tank empties. Sponge out what's left.", caution: null },
    { title: "Remove the old flapper", detail: "Unhook the chain from the handle arm, then pop the flapper's ears off the pegs on the overflow tube.", caution: "Take it with you to the store to match the size (2\" or 3\")." },
    { title: "Fit the new flapper", detail: "Snap the new flapper onto the pegs and hook the chain to the arm, leaving about 1/2 inch of slack.", caution: null },
    { title: "Test", detail: "Turn the water back on, let the tank fill, and flush a few times. Add a few drops of food coloring to the tank; if no color reaches the bowl after 15 minutes, the seal is good.", caution: null },
  ],
  stop_and_call_pro_if: ["Water is leaking onto the floor from the base or tank bolts", "The shutoff valve won't turn or drips when you turn it"],
  ifixit_search: "toilet flapper replacement",
  waste_saved_kg: 40,
};
