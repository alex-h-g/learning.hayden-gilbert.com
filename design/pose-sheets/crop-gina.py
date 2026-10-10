import sys
from PIL import Image
import numpy as np
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
arr = np.array(im).astype(np.float32)
names = ['waving','thinking','explaining','curious','encouraging','celebrating','cheering','reassuring','neutral']
rb = [0, 343, 682, 1024]; cb = [0, 550, 1000, 1536]
cells = []
for r in range(3):
    for c in range(3):
        cell = arr[rb[r]:rb[r+1], cb[c]:cb[c+1]].copy()
        a = cell[:, :, 3]
        # remove the soft glow: ramp alpha 70..200 -> 0..255
        a2 = np.clip((a - 70) / (200 - 70), 0, 1) * 255
        cell[:, :, 3] = a2
        m = a2 > 10
        ys, xs = np.where(m)
        cells.append(cell[ys.min():ys.max()+1, xs.min():xs.max()+1])
W = max(c.shape[1] for c in cells) + 16
H = max(c.shape[0] for c in cells) + 8
for name, cell in zip(names, cells):
    canvas = np.zeros((H, W, 4), np.float32)
    h, w = cell.shape[:2]
    x = (W - w) // 2; y = H - h  # bottom-aligned so the hoodie sits on the baseline
    canvas[y:y+h, x:x+w] = cell
    img = Image.fromarray(canvas.astype(np.uint8), 'RGBA')
    img = img.resize((int(W * 400 / H), 400), Image.LANCZOS)
    img.save(f'{out}/gina-{name}.webp', 'WEBP', quality=88, method=6)
    img.save(f'{out}/gina-{name}.png', optimize=True)
print(W, H)
