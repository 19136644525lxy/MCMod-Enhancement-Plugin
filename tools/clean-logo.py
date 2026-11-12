from PIL import Image, ImageSequence

SRC = 'output/logo_dynamic.gif'
DST = 'assets/logo_dynamic.webp'

im = Image.open(SRC)
frames = []
durations = []

for fr in ImageSequence.Iterator(im):
    durations.append(fr.info.get('duration', 80))
    rgba = fr.convert('RGBA')
    px = rgba.load()
    w, h = rgba.size

    # 收集透明像素
    transp = [[px[x, y][3] == 0 for x in range(w)] for y in range(h)]

    # 边缘上的浅色像素：GIF 的 1-bit 透明留下的抗锯齿残渣，深色底上就是白毛边
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            near_transparent = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and transp[ny][nx]:
                    near_transparent = True
                    break
            if near_transparent and r > 200 and g > 200 and b > 200:
                px[x, y] = (r, g, b, 0)

    frames.append(rgba)

frames[0].save(
    DST,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    format='WEBP',
    quality=82,
    method=4,
)

import os
print('frames', len(frames))
print('webp bytes', os.path.getsize(DST))
print('gif bytes', os.path.getsize(SRC))
