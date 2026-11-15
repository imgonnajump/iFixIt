# FixCam pitch kit

## One-liner
**Snap a photo of anything broken. FixCam names the part, tells you whether it's a $10 fix or a job for a pro, and coaches you through the repair by checking your work with your camera.**

Tagline for the slide: *ChatGPT tells you how. FixCam watches you do it.*

---

## Devpost write-up

### Inspiration
Every home has a drawer of "broken" things: a running toilet, a frayed charger, a bike that skips gears. Most are $10 fixes, but people don't know what the part is called, whether it's safe to touch, or where to buy it, so they throw it out or pay $150 for a visit. The world generated about 62 million tonnes of e-waste in 2022, and less than a quarter was documented as recycled (UN Global E-waste Monitor 2024). Repair is the greenest option, but only if people feel able to do it.

### What it does
1. **Diagnose from one photo.** FixCam names the exact part (with the names stores use), explains what's wrong, and gives an honest verdict: Easy DIY, DIY with care, or Call a pro. It shows DIY vs. pro vs. buy-new costs, and how much you'd save.
2. **Show, don't just tell.** Every step highlights the part *on your own photo*, so you know exactly what to grab. Plus a how-to video per step and real photos from the matching iFixit guide.
3. **Check my work.** After a step, snap your progress. FixCam compares it with what that step should achieve, then either ✅ ticks it off or ⚠️ boxes the problem on your photo and tells you how to fix it.
4. **Hands-free.** Your hands are wet or greasy, so FixCam reads each step aloud and listens for "next", "repeat" and "back".
5. **Get it done locally.** It finds the nearest stores that stock the part and, when it isn't safe to DIY, nearby plumbers, electricians or a free Repair Café, with call and directions.
6. **See your impact.** A running total of fixes, dollars saved and kilograms kept out of landfill.

### How we built it
- Next.js 15 + Tailwind on Vercel. Claude (Opus 5.5) vision through the Anthropic SDK, with Zod-typed structured outputs, so every AI response is valid JSON the UI can rely on.
- **A three-stage vision pipeline:** `diagnose` (the part, verdict, costs, steps, and what to look for in the photo) → `locate` (finds each part as a bounding box) → `check` (judges a progress photo against the step's goal).
- **Accurate highlights:** the phone draws a faint labeled grid on the photo before the locate pass, and the model returns boxes instead of points. We benchmarked it: 13/13 hits vs. 12/13 for plain dots ([eval/](eval/README.md)).
- OpenStreetMap (Overpass) for nearby stores and professionals, the iFixit public API for photo guides, YouTube for step videos, the Web Speech API for hands-free mode, and the Wake Lock API to keep the screen on.
- Privacy by design: no accounts and no database. Location is rounded to about 100 m and never stored, and the repair log lives in your browser.

### Challenges
- **Pointing at the right spot.** Our first dots were often off. We found the cause: pointing was buried inside a big multi-task request. Splitting it into a focused pass, with a grid overlay and boxes, fixed it, and we measured the improvement instead of guessing.
- **Being honest about safety.** The model must say "call a pro" for gas, mains wiring, swollen batteries and brakes, even when the user wants a DIY answer.
- **Keeping a 20–30 second AI call from feeling slow:** a scanning animation, progress stages and repair tips, and highlights that load progressively after the results appear.

### Accomplishments
- A repair coach that verifies real progress photos (in testing, it failed a photo with the old flapper still installed and passed one where it was removed).
- Measured, reproducible accuracy for the photo highlights.
- It works in your language: in Spanish it even used "sapo", the everyday Mexican term for a toilet flapper.

### What's next
- Live camera overlay (AR) instead of photos
- A community "fixed it" map and a parts-matching marketplace
- Repair Café partnerships, so volunteers can take over when DIY gets stuck

---

## 3-minute demo script

**Setup:** the live site on a phone, mirrored to the screen. Have a real broken item ready (a running toilet tank with the lid off works great; a frayed cable or a loose bike chain also work). Turn on Do Not Disturb. **Do one full run-through beforehand**, and keep its results open in a second tab as a backup.

| Time | Show | Say |
|---|---|---|
| 0:00–0:20 | Title slide | "Every home has a drawer of broken things. Most are $10 fixes, but people don't know what the part is called or whether it's safe, so it goes in the trash. We built FixCam." |
| 0:20–0:45 | Tap **Take a photo**, shoot the item, tap a quick note chip, **Diagnose it** | "One photo. While it thinks, notice it's telling you what it's doing." |
| 0:45–1:15 | Results: part name, green verdict, **You could save $X**, safety card | "It names the exact part, with the names hardware stores use, gives an honest verdict, and shows the money: fix it yourself for $8, or pay $150." |
| 1:15–1:45 | Scroll to steps: the **highlight on our own photo** | "Every step highlights the part on *your* photo. We measured this: 13 out of 13 on our benchmark." |
| 1:45–2:20 | Do the step, tap **📸 Check my work** → ✅ (or show ⚠️ first) | "Here's what a chatbot can't do: it checks your work. This is the moment it catches a mistake and boxes it on your photo." |
| 2:20–2:35 | Tap **🎙️ Hands-free**, say "next" | "Your hands are wet, so just talk to it." |
| 2:35–2:50 | Tap **Find stores near me** / the **Get a pro** card | "It tells you the closest store that stocks the part, and if it isn't safe, finds a plumber or a free Repair Café." |
| 2:50–3:00 | Finish → 🎉 and the **impact card** | "Every fix adds up: money saved, and kilograms kept out of landfill. FixCam: don't toss it, fix it." |

**If the Wi-Fi or the AI is slow:** switch to the backup tab, and say "Here's one we ran earlier" while the live one finishes.

---

## Questions judges will ask

**"Isn't this just ChatGPT with a camera?"**
No. ChatGPT gives you a wall of text. FixCam turns the photo into a structured repair plan with a verdict, costs, and parts and tools you can check off. It then grounds each step on your own photo, *verifies your progress photos step by step*, works hands-free, and connects you to local stores and pros. The coaching loop is the product.

**"How accurate is it? What if it's wrong?"**
We measured the photo highlights (13/13 on our benchmark, in `eval/`), and when a part isn't clearly visible, it shows nothing rather than a wrong box. For diagnoses, it reports its confidence, asks for a better photo when it's unsure, and errs toward "call a pro" for anything dangerous. Every plan includes "stop and call a pro if…" checkpoints.

**"What about safety and liability?"**
The model is told to say "Call a pro" for gas, mains wiring, swollen lithium batteries, brakes, refrigerant and structural work. Safety warnings come first, and the coach flags hazards it sees in progress photos. There's a clear "AI can make mistakes" notice. We don't hide the pro option. We find you one nearby.

**"What does it cost to run?"**
Roughly 5¢ per diagnosis, including the highlight pass, and a couple of cents per "Check my work" (approximate, based on our testing). Stores and pros come from free OpenStreetMap data, with no paid maps API.

**"Privacy?"**
No accounts and no database. Photos are only sent to the AI for the request. Location is rounded to about 100 m before any lookup and isn't stored, and your repair history stays in your browser.

**"Who is it for, and how do you know they want it?"**
Renters, students and anyone on a budget, plus people who want to cut waste. Repair Cafés and iFixit's community show there's huge demand for help with repairs. FixCam is the help that's in your pocket at 9 pm when the toilet won't stop running.

**"What was the hardest technical problem?"**
Making the highlights land on the right spot. Our first version asked for coordinates inside the big diagnosis request, and they were often off. We split localization into its own pass, added a grid overlay, and switched to bounding boxes, then wrote a benchmark to prove it worked.

---

## How it maps to the rubric
| Criterion | Evidence |
|---|---|
| Technical execution | A three-stage vision pipeline with typed structured outputs; a measured, reproducible accuracy benchmark; graceful fallbacks (demo mode, Google Maps fallback, a hidden iFixit strip on failure) |
| Creativity & novelty | Highlights on *your* photo, a "Check my work" repair coach, a hands-free voice mode |
| Impact & utility | Real costs and savings, honest safety verdicts, local stores and pros, a Repair Café option, a landfill and money impact tracker, answers in your language |
| Presentation & polish | A mobile-first UI, dark mode, an installable app, smooth loading states, and a tight 3-minute demo with a backup plan |
