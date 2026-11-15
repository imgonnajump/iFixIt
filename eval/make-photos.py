# Writes the benchmark photos (public-domain scikit-image samples) and their gridded copies.
# pip install scikit-image pillow && python eval/make-photos.py
import os, subprocess, sys
import skimage.data as d, skimage.io as io

here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(here, "photos"), exist_ok=True)
os.makedirs(os.path.join(here, "grids"), exist_ok=True)
for name in ["coffee", "rocket", "astronaut"]:
    src = os.path.join(here, "photos", name + ".png")
    io.imsave(src, getattr(d, name)()[..., :3])
    subprocess.run([sys.executable, os.path.join(here, "grid.py"), src, os.path.join(here, "grids", name + ".png")], check=True)
print("ok")
