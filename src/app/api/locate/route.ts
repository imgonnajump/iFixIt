import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { apiError, hasKey, MODEL } from "@/lib/claude";
import { GRID_NOTE } from "@/lib/image";

export const runtime = "nodejs";
export const maxDuration = 60;

// Finds named parts on the user's photo. A focused call (instead of asking during
// the big diagnosis) with a grid overlay and bounding boxes is much more accurate.
const Marks = z.object({
  marks: z.array(
    z.object({
      label: z.string(),
      found: z.boolean().describe("false if this part isn't clearly visible in the photo"),
      x1: z.number().describe("Left edge, percent of image width (0-100)"),
      y1: z.number().describe("Top edge, percent of image height (0-100)"),
      x2: z.number().describe("Right edge, percent of image width (0-100)"),
      y2: z.number().describe("Bottom edge, percent of image height (0-100)"),
    }),
  ),
});

export async function POST(req: Request) {
  let body: { grid?: string; labels?: unknown; item?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const labels = (Array.isArray(body.labels) ? body.labels : [])
    .filter((l): l is string => typeof l === "string" && l.trim().length > 0)
    .map((l) => l.trim().slice(0, 80))
    .slice(0, 12);
  if (!body.grid || labels.length === 0) return NextResponse.json({ marks: [] });
  if (!hasKey()) return NextResponse.json({ marks: [] });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Marks) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: body.grid } },
            {
              type: "text",
              text: `${GRID_NOTE}
This is a photo of ${body.item ? `a ${body.item.slice(0, 80)}` : "something broken"}. For each part below, give a tight bounding box around it, as percentages of the image width and height (x1,y1 = top-left corner, x2,y2 = bottom-right). Use the grid lines to be precise. Set found=false if the part isn't clearly visible; never guess.
Return one entry per part, in the same order, with the label copied exactly.
Parts: ${JSON.stringify(labels)}`,
            },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return NextResponse.json({ marks: [] });
    return NextResponse.json({ marks: response.parsed_output.marks });
  } catch (error) {
    return apiError(error);
  }
}
