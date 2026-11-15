import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { apiError, hasKey, MODEL } from "@/lib/claude";
import { GRID_NOTE } from "@/lib/image";

export const runtime = "nodejs";
export const maxDuration = 60;

const CheckSchema = z.object({
  verdict: z.enum(["looks_good", "not_quite", "cant_tell"]),
  headline: z.string().describe("Up to 8 words, e.g. 'Chain is too tight'"),
  feedback: z.string().describe("1-2 plain sentences on what you see compared with how this step should look"),
  fix: z.string().nullable().describe("If not_quite: exactly what to do next. If cant_tell: how to retake the photo. Otherwise null."),
  safety: z.string().nullable().describe("Only if the photo shows a hazard (water near outlets, exposed live wires, gas smell risk, damaged battery). Otherwise null."),
  issue: z
    .object({
      label: z.string().describe("2-4 words naming the spot"),
      x1: z.number(),
      y1: z.number(),
      x2: z.number(),
      y2: z.number(),
    })
    .nullable()
    .describe("Bounding box (percent of image width/height, 0-100) of the problem spot when not_quite, or of the finished work when looks_good. null if nothing specific to point at."),
});

const SYSTEM = `You are FixCam's repair coach, looking over a beginner's shoulder while they fix something.
They just finished one step of a repair and sent a photo of their progress. Compare the photo with what this step should have achieved.
- looks_good: the step is clearly done correctly.
- not_quite: something is visibly wrong or unfinished. Say exactly what and how to fix it.
- cant_tell: the photo doesn't show the relevant area clearly. Say how to retake it.
Be encouraging and specific. Judge only what's visible; don't invent problems. Always mention hazards you can see.`;

export async function POST(req: Request) {
  let body: {
    grid?: string;
    item?: string;
    part?: string;
    problem?: string;
    stepIndex?: number;
    totalSteps?: number;
    step?: { title?: string; detail?: string; caution?: string | null };
    nextStep?: string | null;
    lang?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.grid || !body.step?.title) return NextResponse.json({ error: "Missing photo or step" }, { status: 400 });

  if (!hasKey()) {
    return NextResponse.json({
      check: {
        verdict: "looks_good",
        headline: "Demo: looks good!",
        feedback: "Demo mode is on, so this is a sample result. Add an API key to get real feedback on your photo.",
        fix: null,
        safety: null,
        issue: null,
      },
      demo: true,
    });
  }

  const t = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : "");
  const context = [
    `Item: ${t(body.item, 120)}`,
    `Part being fixed: ${t(body.part, 120)}`,
    `Problem: ${t(body.problem, 400)}`,
    `They just did step ${Number(body.stepIndex) + 1} of ${Number(body.totalSteps)}: "${t(body.step.title, 120)}" - ${t(body.step.detail, 600)}`,
    body.step.caution ? `Caution for this step: ${t(body.step.caution, 300)}` : "",
    body.nextStep ? `The next step will be: "${t(body.nextStep, 120)}"` : "This was the last step.",
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(CheckSchema) },
      system:
        SYSTEM +
        (typeof body.lang === "string" && /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(body.lang) && !/^en\b/i.test(body.lang)
          ? `\nWrite your answer in the user's language (BCP 47 code "${body.lang}").`
          : ""),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: body.grid } },
            { type: "text", text: `${GRID_NOTE}\n\n${context}\n\nDid they do this step right?` },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Couldn't check this photo. Try another one." }, { status: 422 });
    }
    if (!response.parsed_output) return NextResponse.json({ error: "Couldn't read the result. Try again." }, { status: 502 });
    return NextResponse.json({ check: response.parsed_output });
  } catch (error) {
    return apiError(error);
  }
}
