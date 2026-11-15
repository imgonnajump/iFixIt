import * as z from "zod/v4";
import { PRO_TYPES, STORE_TYPES } from "./stores";

export const DiagnosisSchema = z.object({
  can_diagnose: z
    .boolean()
    .describe("false if the photo is too unclear or doesn't show a broken item"),
  clarifying_question: z
    .string()
    .nullable()
    .describe("If can_diagnose is false or confidence is low: one short question or a tip for a better photo"),
  item: z.string().describe("What the object is, e.g. 'Toilet tank (gravity flush)'"),
  part_name: z.string().describe("Exact name of the broken/faulty part, e.g. 'Flapper valve'"),
  also_called: z.array(z.string()).describe("Other names people search for this part"),
  problem: z.string().describe("Plain-English diagnosis of what is wrong, 1-2 sentences"),
  confidence: z.enum(["high", "medium", "low"]),
  verdict: z.enum(["easy_diy", "diy_with_care", "call_a_pro"]),
  verdict_reason: z.string().describe("One sentence on why"),
  difficulty: z.enum(["1", "2", "3", "4", "5"]).describe("1 = anyone, 5 = expert"),
  time_estimate: z.string().describe("e.g. '15-20 minutes'"),
  diy_cost: z.string().describe("Approximate USD cost to fix yourself, e.g. '$8-15'"),
  pro_cost: z.string().describe("Approximate USD cost for a professional, e.g. '$120-200'"),
  replace_cost: z.string().describe("Approximate USD cost to buy a new item instead"),
  safety_warnings: z.array(z.string()).describe("Critical safety notes (electricity, gas, water, batteries, sharp edges). Empty if none."),
  tools: z.array(z.string()).describe("Exact tools needed, e.g. 'Phillips #1 screwdriver'"),
  parts: z.array(
    z.object({
      name: z.string(),
      approx_cost: z.string(),
    }),
  ),
  steps: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      caution: z.string().nullable(),
      photo_marker: z
        .object({
          x: z.number().describe("Horizontal position as a fraction of image width, 0 = left edge, 1 = right edge"),
          y: z.number().describe("Vertical position as a fraction of image height, 0 = top edge, 1 = bottom edge"),
          label: z.string().describe("2-4 word name of what is at that spot, e.g. 'Shutoff valve'"),
        })
        .nullable()
        .describe("The exact spot in the user's photo this step involves. null if that spot isn't visible in the photo or you're not sure."),
      video_search: z
        .string()
        .describe("Short YouTube search query for a video showing exactly this step, e.g. 'how to remove toilet flapper'. Include the item type."),
    }),
  ),
  stop_and_call_pro_if: z.array(z.string()).describe("Signs during the repair that mean stop and get help"),
  store_types: z
    .array(z.enum(STORE_TYPES))
    .describe("Kinds of local physical stores most likely to stock the parts and tools, best first (1-3). Empty if the parts are only sold online or by the manufacturer."),
  pro_types: z
    .array(z.enum(PRO_TYPES))
    .describe("Kinds of local professionals who could do this repair, best first (1-2). Add repair_cafe when volunteers could fix it (small appliances, electronics, clothing, bikes, furniture)."),
  ifixit_search: z.string().describe("Best short search query for iFixit repair guides, e.g. 'toilet flapper replacement'"),
  waste_saved_kg: z.number().describe("Rough mass in kg of the item kept out of landfill by repairing instead of replacing"),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;
