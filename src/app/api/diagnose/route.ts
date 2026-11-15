import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { apiError, hasKey, IMAGE_TYPES, MODEL, type ImageType } from "@/lib/claude";
import { DiagnosisSchema } from "@/lib/schema";
import { SAMPLE_DIAGNOSIS } from "@/lib/sample";

export const runtime = "nodejs";
export const maxDuration = 60;


const SYSTEM = `You are FixCam, a veteran repair technician who has fixed everything from toilets and bikes to laptops and car dashboards.
A user sends a photo of something broken (and maybe a short note). Your job:
1. Identify the item and the exact name of the faulty part, using the name a hardware store or iFixit would use.
2. Diagnose what is most likely wrong. If several causes are plausible, pick the most likely and mention the alternative in the problem text.
3. Decide honestly whether this is an easy DIY fix, DIY with care, or a job for a professional. Choose call_a_pro for anything involving gas lines, mains wiring inside walls, swollen lithium batteries, airbags, brakes on cars, refrigerant, or structural work.
4. List the exact tools and parts, with realistic US prices, and the kinds of local stores that stock them.
5. Give clear numbered steps a first-timer can follow. Always start with the safety step (unplug, shut off water, turn off breaker, etc.) when relevant.
6. For each step, set look_for to the part in the photo that step works on, with a visual cue (color, material, position) so it can be highlighted. Use null if that part isn't visible.
7. Name the kind of local professional who could do the job, in case the user gets stuck.
Be specific, practical and concise. Never invent certainty: if the photo is unclear, set can_diagnose to false or confidence to low and ask for what you need.
For a dashboard warning light, identify the light, explain what it means, and say whether it is safe to keep driving.`;

// Answer in the user's device language (search queries stay searchable).
function languageRule(lang: unknown) {
  if (typeof lang !== "string" || !/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(lang) || /^en\b/i.test(lang)) return "";
  return `\nWrite every text field in the user's language (BCP 47 code "${lang}"). Keep ifixit_search in English.`;
}

export async function POST(req: Request) {
  let body: { image?: string; mediaType?: string; note?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { image, mediaType, note } = body;
  if (!image || !mediaType || !IMAGE_TYPES.includes(mediaType as ImageType)) {
    return NextResponse.json({ error: "Send a JPEG, PNG, WebP or GIF photo." }, { status: 400 });
  }

  // Demo mode: lets the UI run with no API key (useful for judging / offline demos).
  if (!hasKey()) {
    return NextResponse.json({ diagnosis: SAMPLE_DIAGNOSIS, demo: true });
  }

  const client = new Anthropic();

  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(DiagnosisSchema),
      },
      system: SYSTEM + languageRule(body.lang),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as ImageType, data: image },
            },
            {
              type: "text",
              text: note?.trim()
                ? `What's wrong, in my words: ${note.trim().slice(0, 500)}`
                : "Here's the broken thing. What is it and how do I fix it?",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "Couldn't help with this one. Try a different photo." },
        { status: 422 },
      );
    }
    if (!response.parsed_output) {
      return NextResponse.json({ error: "Couldn't read the diagnosis. Try again." }, { status: 502 });
    }
    return NextResponse.json({ diagnosis: response.parsed_output });
  } catch (error) {
    return apiError(error);
  }
}
