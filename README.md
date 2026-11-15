# FixCam 🔧

**Snap a photo of anything broken. FixCam names the part, tells you honestly whether it's a $10 DIY fix or a job for a pro, and then coaches you through the repair: it checks your work with your camera, step by step.**

Millions of easily fixable things are thrown away because people don't know what the broken part is called, or whether fixing it is safe and cheap. A chatbot can give you instructions. FixCam watches you do the repair.

## What it does
**Your fix house**
- 🏠 A walkable pixel house (bathroom, kitchen, utility room, living room, bedroom, garage). Walk to the broken thing with the arrow keys / WASD, the on-screen pad, or tap-to-walk, then pick what's wrong. Every object is also in a plain list, so keyboard and screen-reader users never need the game.
- 🪙 **Decorate with coins you earn by fixing:** every fix pays coins (more for harder jobs, a bonus for DIY). Spend them on a cat, fish tank, arcade cabinet, rugs, plants and more, or repaint any room. The shop never lets you block a doorway or cut off something you'll need to fix.
- 🧑‍🔧 An editable profile: name, mood, status and a pixel avatar you design (hair, skin, shirt, hat)
- 📒 A fix diary: every repair is logged automatically, and you can add, edit or delete your own
- 🎁 **Fixed Wrapped:** your year in repairs as story slides (fixes, $ saved, kg kept, your "repair persona", busiest month, toughest fix) with a shareable image. It unlocks every December, with a preview any time.

**Diagnose**
- 📷 One photo (plus an optional note) of a leaky faucet, a frayed charger, a bike derailleur or a dashboard warning light
- 🏷️ The exact part name, plus the other names it's sold under
- 🚦 An honest verdict: **Easy DIY / DIY with care / Call a pro**, with the reason
- 💵 Cost to fix it yourself vs. hiring a pro vs. buying new, with "You could save $X"
- 🪜 **Who can fix it, cheapest first:** free help (Repair Café, a handy friend), a budget handyman, a licensed pro, with typical prices and when each makes sense
- 🧰 **No tools? No problem:** tell it whether you have a full toolbox, a few basics, or nothing at all. Every tool gets a household stand-in where one is safe, essential tools are marked, and it suggests where to borrow one.

**Fix**
- 🎯 **Each step highlights the part on your own photo** (a separate, measured localization pass; see [eval/](eval/README.md))
- 📸 **Check my work:** snap your progress after a step. The AI compares it with what the step should achieve, says ✅ looks good or ⚠️ not quite (and how to fix it), boxes the problem on your photo, and ticks off the step when you pass
- 🎙️ **Hands-free mode:** reads each step aloud and listens for "next", "repeat", "back" (your hands are wet or greasy), and keeps the screen awake
- ▶️ A how-to video for every step, and 🖼️ real step photos from the matching iFixit guide
- ⚡ Safety warnings, plus "stop and call a pro if…" checkpoints

**Get it done locally**
- 📍 The nearest stores that sell the part, with distance and directions
- 👷 Nearby professionals (plumber, electrician, bike mechanic, Repair Café…), with call and directions, plus Yelp and iFixit Answers links
- ♻️ **Your repair impact:** a running total of fixes, money saved and kg kept out of landfill
- 🌍 Answers in the phone's language
- 📱 Installable as a phone app
- ♿ Keyboard and screen-reader friendly: real tabs, labeled controls, visible focus, reduced-motion support, and 0 axe violations in light and dark mode

## How it works
```
photo ──► /api/diagnose  (Claude vision + structured output: part, verdict, costs, steps, what to look for)
      └─► /api/locate    (grid overlay + bounding boxes for each step's part)   ──► highlights on your photo
progress photo ──► /api/check (compares with the step's goal; verdict + box)    ──► ✅ / ⚠️ coaching
location ──► /api/stores (OpenStreetMap)      step ──► /api/video (YouTube)     guide ──► /api/ifixit
```
- Next.js 15 (App Router) + Tailwind, deployed on Vercel
- Claude (`claude-opus-5-5`) through the Anthropic TypeScript SDK, with Zod structured outputs so every response is valid JSON
- Photos are resized and gridded on the phone before upload; location is rounded to about 100 m before any lookup and never stored
- No database: your repair log stays in your browser

## Run it
```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY (and optionally YOUTUBE_API_KEY)
npm run dev
```
With no API key, the app runs in **demo mode** with a sample diagnosis.

## Deploy
Import the repo on Vercel, add `ANTHROPIC_API_KEY` (and optionally `YOUTUBE_API_KEY`) as environment variables, and deploy.
