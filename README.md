# FixCam 🔧

**Snap a photo of anything broken. Get the exact part name, an honest "DIY or call a pro" verdict, costs, tools, and a step-by-step repair plan.**

Millions of easily fixable items are thrown away because people don't know what the broken part is called or whether fixing it is safe and cheap. FixCam answers both with one photo.

## What it does
- 📷 Take a photo (or upload one) of a leaky faucet, a frayed charger, a bike derailleur or a dashboard warning light
- 🏷️ Names the exact part, plus the other names it's sold under
- 🚦 Verdict: **Easy DIY / DIY with care / Call a pro**, with the reason
- 💵 Cost to fix it yourself vs. hiring a pro vs. buying new
- 🧰 Tools and parts list, with a checklist of steps you can tick off
- ⚡ Safety warnings, plus "stop and call a pro if…" checkpoints
- 📍 Finds the nearest stores that sell the part, with distance and directions (OpenStreetMap, no key needed)
- 🎯 Marks the exact spot for each step on your own photo
- 🖼️ Real step-by-step photos from the matching iFixit guide
- 👷 Finds nearby professionals (plumbers, electricians, bike mechanics, Repair Cafés…) with call and directions, plus Yelp and iFixit Answers links
- ▶️ A how-to video for every step (inline with a YouTube API key, YouTube search otherwise)
- 🔗 Links straight to iFixit repair guides for that part
- ♻️ Estimates how much waste you kept out of landfill

## Tech
- Next.js 15 (App Router) + Tailwind
- Claude vision (`claude-opus-5-5`) through the Anthropic TypeScript SDK, with structured outputs (a Zod schema) so the UI always gets valid JSON
- Photos are downscaled in the browser before upload, which keeps requests fast on a phone

## Run it
```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY (and optionally YOUTUBE_API_KEY)
npm run dev
```
With no API key, the app runs in **demo mode** and returns a sample diagnosis.

## Deploy
Import the repo on Vercel, add `ANTHROPIC_API_KEY` (and optionally `YOUTUBE_API_KEY`) as environment variables, and deploy.
