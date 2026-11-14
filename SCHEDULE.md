# FixCam hackathon schedule (Unlocked Hacks)

Times are hours from kickoff. If the event is shorter, cut the **stretch** rows first and keep the **must** rows.

| Hours | Block | Goal | Status |
|---|---|---|---|
| 0–2 | **Must:** MVP | Next.js app: photo → Claude vision → structured diagnosis (part name, DIY / pro verdict, costs, tools, parts, steps, safety, iFixit link). Demo mode with no API key. | ✅ Done |
| 2–3 | **Must:** Go live | Push to GitHub, deploy on Vercel, set `ANTHROPIC_API_KEY`, test on a real phone camera. | ⏳ Next |
| 3–6 | **Must:** Prompt quality | Photograph 10 real broken things (faucet, charger, bike, toilet, laptop hinge, dashboard light…). Fix wrong part names, bad prices and missing safety warnings in the system prompt. Save the 3 best results as demo backups. | |
| 6–9 | **Stretch:** Follow-up chat | "I'm on step 3 and the nut won't turn": a follow-up question about the same photo and plan. | |
| 9–11 | **Stretch:** Repair log | Save past fixes in localStorage and show running totals of "$ saved vs buying new" and "kg kept out of landfill". | |
| 11–12 | **Stretch:** Share card | One-tap share image: "I fixed my ___ for $8 instead of $200". | |
| — | **Sleep / buffer** | At least 4 hours. Don't skip it. | |
| 12–14 | **Must:** Polish | Loading state with rotating tips, empty / error states, app icon, PWA manifest so it installs on a phone. | |
| 14–16 | **Must:** Demo video (2–3 min) | Script: problem (stats on e-waste) → live snap of a real broken item → result → iFixit handoff → impact numbers. Record on a phone screen. | |
| 16–17 | **Must:** Submission | Devpost write-up: inspiration, what it does, how we built it, challenges, what's next. Screenshots, repo link, live link, video. | |
| Last 1–2 h | **Buffer** | Submit **at least 1 hour before the deadline**. Don't add features after submitting. | |

## Pitch angles for judges
- **Impact:** about 62 million tonnes of e-waste a year, plus everyday items thrown away over a $10 part.
- **iFixit tie-in:** every diagnosis ends with a handoff to iFixit guides for the exact part (Right to Repair).
- **Safety:** honest "call a pro" verdicts for gas, mains wiring, swollen batteries and brakes, plus "stop if" checkpoints.
- **Simple:** one photo in, one AI call, a full repair plan out.

## To confirm on unlockedhacks.org
- [ ] Exact submission deadline and timezone
- [ ] Submission platform (Devpost?) and demo-video length limit
- [ ] Judging criteria and tracks (pick the closest: sustainability, social good, or AI)
- [ ] Rules on code written before kickoff
