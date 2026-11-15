// Marker accuracy benchmark: one point per item (old) vs. grid overlay + bounding box (new).
// Setup: see eval/README.md. Run: ANTHROPIC_API_KEY=... node eval/locate-benchmark.mjs
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import fs from "fs";
const S = new URL(".", import.meta.url).pathname; // photos/ and grids/ live next to this script

const client = new Anthropic();
const truth = {
  coffee: { "spoon bowl": [0.61, 0.71], "cup handle": [0.375, 0.66], "tip of the spoon handle": [0.68, 0.19], "coffee surface": [0.48, 0.36] },
  rocket: { "rocket nose cone": [0.503, 0.33], "top of the thin tower right of the rocket": [0.70, 0.30], "launch pad base": [0.50, 0.97], "tall lattice tower on the far left": [0.07, 0.5] },
  astronaut: { "name tag": [0.59, 0.69], "round mission patch": [0.336, 0.75], "helmet": [0.76, 0.82], "space shuttle model": [0.79, 0.37], "flag": [0.08, 0.3] },
};
const A = z.object({ marks: z.array(z.object({ label: z.string(), x: z.number(), y: z.number() })) });
const B = z.object({ marks: z.array(z.object({ label: z.string(), found: z.boolean(), x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() })) });
async function ask(file, text, schema) {
  const r = await client.beta.messages.parse({
    model: "claude-opus-5-5", max_tokens: 16000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/png", data: fs.readFileSync(file).toString("base64") } },
      { type: "text", text } ] }],
  });
  return r.parsed_output.marks;
}
let hitA = 0, hitB = 0, n = 0;
for (const [img, items] of Object.entries(truth)) {
  const labels = Object.keys(items);
  const [a, b] = await Promise.all([
    ask(S + "photos/" + img + ".png", "For each item, give the point where it is in the photo, as x and y fractions of image width and height (0 = left/top, 1 = right/bottom). Items: " + JSON.stringify(labels), A),
    ask(S + "grids/" + img + ".png", "A grid is drawn over this photo to help you locate things: lines every 10% of the width and height, labeled 10-90 at the edges. For each item, give a tight bounding box as percentages of image width and height (x1,y1 = top-left corner, x2,y2 = bottom-right; 0-100). Use the grid lines to be precise. Set found=false if the item isn't visible. Items: " + JSON.stringify(labels), B),
  ]);
  for (const l of labels) {
    const [tx, ty] = items[l]; n++;
    const pa = a.find((m) => m.label === l) ?? a[labels.indexOf(l)];
    const pb = b.find((m) => m.label === l) ?? b[labels.indexOf(l)];
    const dA = Math.hypot(pa.x - tx, pa.y - ty);
    const inB = pb.found && tx * 100 >= pb.x1 - 2 && tx * 100 <= pb.x2 + 2 && ty * 100 >= pb.y1 - 2 && ty * 100 <= pb.y2 + 2;
    const cB = [(pb.x1 + pb.x2) / 200, (pb.y1 + pb.y2) / 200]; const dB = Math.hypot(cB[0] - tx, cB[1] - ty);
    if (dA < 0.07) hitA++; if (inB) hitB++;
    console.log(img.padEnd(9), l.slice(0, 34).padEnd(34), "A dot", pa.x.toFixed(2), pa.y.toFixed(2), "off", dA.toFixed(3), dA < 0.07 ? "HIT " : "MISS", "| B box", [pb.x1, pb.y1, pb.x2, pb.y2].map(Math.round).join(","), "center off", dB.toFixed(3), inB ? "HIT" : "MISS");
  }
}
console.log("\nA (dot, no grid): " + hitA + "/" + n + " within 7%   |   B (grid + box): " + hitB + "/" + n + " box contains the spot");
