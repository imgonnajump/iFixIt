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
    { title: "Shut off the water", look_for: "Shutoff valve", detail: "Turn the supply valve behind the toilet clockwise until it stops.", caution: null, video_search: "how to shut off water valve behind toilet" },
    { title: "Drain the tank", look_for: null, detail: "Flush and hold the handle down so the tank empties. Sponge out what's left.", caution: null, video_search: "how to drain a toilet tank" },
    { title: "Remove the old flapper", look_for: "Flapper", detail: "Unhook the chain from the handle arm, then pop the flapper's ears off the pegs on the overflow tube.", caution: "Take it with you to the store to match the size (2\" or 3\").", video_search: "how to remove toilet flapper" },
    { title: "Fit the new flapper", look_for: "Flapper pegs", detail: "Snap the new flapper onto the pegs and hook the chain to the arm, leaving about 1/2 inch of slack.", caution: null, video_search: "how to install toilet flapper" },
    { title: "Test", look_for: null, detail: "Turn the water back on, let the tank fill, and flush a few times. Add a few drops of food coloring to the tank; if no color reaches the bowl after 15 minutes, the seal is good.", caution: null, video_search: "how to test toilet flapper leak food coloring" },
  ],
  stop_and_call_pro_if: ["Water is leaking onto the floor from the base or tank bolts", "The shutoff valve won't turn or drips when you turn it"],
  store_types: ["hardware", "home_goods"],
  pro_types: ["plumber"],
  ifixit_search: "toilet flapper replacement",
  waste_saved_kg: 40,
};
