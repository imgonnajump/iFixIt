# How we know the photo highlights are accurate

FixCam highlights the exact part each repair step works on, on **your own photo**. Early versions placed a dot that was often off. We fixed it with two changes and measured the result.

## What changed
1. **A separate, focused "find these parts" request.** The first version asked for dot positions inside the big diagnosis request, where pointing competed with prices, steps and safety notes. Now the diagnosis only *names* the part for each step ("red rubber flapper"), and a second request does nothing but find those parts.
2. **A grid overlay plus bounding boxes.** Before sending the photo to be searched, the phone draws a faint grid labeled 10–90% on it. The model returns a box (not a single point), using the grid lines as reference. Boxes are more forgiving and show the part's full extent. If a part isn't clearly visible, the model says so and that step shows no image instead of a wrong one.

## Benchmark
13 items with hand-measured positions across 3 real photos (public-domain scikit-image samples: espresso cup, rocket launch pad, astronaut portrait).

| Method | Score |
|---|---|
| A: one dot per item, no grid | 12/13 within 7% of the true spot |
| B: grid overlay + bounding box (what FixCam uses) | **13/13 boxes contain the true spot** |

We ran it twice and got the same result both times. In the app, on a test photo of a toilet tank, all 6 highlighted parts were correct (shutoff valve, lift chain, flapper, overflow tube, float), and "Check my work" correctly failed a photo with the old flapper still installed and passed one with it removed.

## Run it yourself
```bash
pip install scikit-image pillow
python eval/make-photos.py
ANTHROPIC_API_KEY=... node eval/locate-benchmark.mjs
```
It makes 6 API calls (about $0.15).
