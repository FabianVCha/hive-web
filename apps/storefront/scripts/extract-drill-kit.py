"""Extract native-alpha connected objects without synthesizing product pixels."""
from collections import deque
from pathlib import Path
from PIL import Image

directory = Path(__file__).resolve().parents[1] / "public/ferready/products"
image = Image.open(directory / "drill-12v-includes-ai.png").convert("RGBA")
width, height = image.size
alpha = image.getchannel("A").tobytes()
seen = bytearray(width * height)
components = []
for seed, value in enumerate(alpha):
    if value < 16 or seen[seed]:
        continue
    queue = deque([seed])
    seen[seed] = 1
    pixels = []
    while queue:
        pixel = queue.popleft()
        pixels.append(pixel)
        x, y = pixel % width, pixel // width
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                neighbor = ny * width + nx
                if not seen[neighbor] and alpha[neighbor] >= 16:
                    seen[neighbor] = 1
                    queue.append(neighbor)
    if len(pixels) > 1000:
        components.append(pixels)
assert len(components) == 3, "Review source alpha before changing extraction"
components.sort(key=lambda pixels: min(pixel % width for pixel in pixels))
for name, pixels in zip(("drill", "battery", "charger"), components):
    mask = bytearray(width * height)
    for pixel in pixels:
        mask[pixel] = alpha[pixel]
    cutout = image.copy()
    cutout.putalpha(Image.frombytes("L", image.size, bytes(mask)))
    cutout = cutout.crop(cutout.getbbox())
    cutout.save(directory / f"drill-kit-{name}.webp", lossless=True)
    print(name, cutout.size, len(pixels))
