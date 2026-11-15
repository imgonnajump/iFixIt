import sys
from PIL import Image, ImageDraw, ImageFont
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W, H = im.size
d = ImageDraw.Draw(im, "RGBA")
fs = max(11, int(min(W, H) * 0.028))
try: font = ImageFont.truetype("DejaVuSans-Bold.ttf", fs)
except Exception: font = ImageFont.load_default()
for i in range(1, 10):
    x = round(W * i / 10); y = round(H * i / 10)
    d.line([(x, 0), (x, H)], fill=(0, 0, 0, 90), width=3); d.line([(x, 0), (x, H)], fill=(255, 255, 255, 140), width=1)
    d.line([(0, y), (W, y)], fill=(0, 0, 0, 90), width=3); d.line([(0, y), (W, y)], fill=(255, 255, 255, 140), width=1)
    for (tx, ty) in [(x + 3, 2), (x + 3, H - fs - 4)]:
        d.rectangle([tx - 1, ty, tx + fs * 1.3, ty + fs + 2], fill=(0, 0, 0, 150)); d.text((tx, ty), str(i * 10), fill="white", font=font)
    for (tx, ty) in [(2, y + 2), (W - fs * 1.4 - 2, y + 2)]:
        d.rectangle([tx - 1, ty, tx + fs * 1.3, ty + fs + 2], fill=(0, 0, 0, 150)); d.text((tx, ty), str(i * 10), fill="white", font=font)
im.save(dst)
