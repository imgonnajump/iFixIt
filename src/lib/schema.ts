import * as z from "zod/v4";

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
    }),
  ),
  stop_and_call_pro_if: z.array(z.string()).describe("Signs during the repair that mean stop and get help"),
  ifixit_search: z.string().describe("Best short search query for iFixit repair guides, e.g. 'toilet flapper replacement'"),
  waste_saved_kg: z.number().describe("Rough mass in kg of the item kept out of landfill by repairing instead of replacing"),
});

export type Diagnosis = z.infer<typeof DiagnosisSchema>;
