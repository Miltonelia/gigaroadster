#!/usr/bin/env python3
"""Compose Gigaroadster Racing share cards from in-game art. Exact canvas sizes."""

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ART_BANNER = "/workspace/public/art/banner.jpg"
ART_COSMOS = "/workspace/public/art/cosmos.png"
OUT_OG = "/workspace/.grok/og-master.png"
OUT_XB = "/workspace/.grok/x-banner-master.png"

VOID = (7, 6, 15)
MINT = (20, 241, 149)
IVORY = (246, 243, 236)
GOLD_HI = (246, 232, 190)
GOLD = (212, 177, 90)
GOLD_LO = (122, 90, 36)

FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSansNarrow-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSansNarrow-Regular.ttf"


def cover(im, w, h, focus=(0.5, 0.5)):
    im = im.convert("RGB")
    sw, sh = im.size
    scale = max(w / sw, h / sh)
    nw, nh = round(sw * scale), round(sh * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, min(round((nw - w) * focus[0]), nw - w))
    top = max(0, min(round((nh - h) * focus[1]), nh - h))
    return im.crop((left, top, left + w, top + h))


def fit_height(im, h):
    im = im.convert("RGB")
    sw, sh = im.size
    nw = round(sw * (h / sh))
    return im.resize((nw, h), Image.Resampling.LANCZOS)


def vertical_fade_mask(w, h, y0, y1, a0, a1):
    mask = Image.new("L", (w, h), 0)
    px = mask.load()
    for y in range(h):
        if y <= y0:
            a = a0
        elif y >= y1:
            a = a1
        else:
            t = (y - y0) / (y1 - y0)
            a = int(a0 + (a1 - a0) * t)
        for x in range(w):
            px[x, y] = a
    return mask


def side_feather(w, h, left_px=0, right_px=0):
    mask = Image.new("L", (w, h), 255)
    px = mask.load()
    for x in range(w):
        a = 255
        if left_px and x < left_px:
            a = int(255 * (x / left_px) ** 1.15)
        if right_px and x > w - 1 - right_px:
            a = min(a, int(255 * ((w - 1 - x) / right_px) ** 1.15))
        if a < 255:
            for y in range(h):
                px[x, y] = a
    return mask


def tint(im, color, amount):
    overlay = Image.new("RGB", im.size, color)
    return Image.blend(im.convert("RGB"), overlay, amount)


def tracked_mask(size, text, font, origin, tracking):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    x, y = origin
    for ch in text:
        draw.text((x, y), ch, font=font, fill=255)
        x += font.getlength(ch) + tracking
    return mask, x


def paint_text(base, text, font, origin, tracking, top, bottom, shadow=10, glow=None):
    mask, end_x = tracked_mask(base.size, text, font, origin, tracking)
    bbox = mask.getbbox()
    if bbox is None:
        raise SystemExit(f"empty text mask for {text!r}")
    if shadow:
        blurred = mask.filter(ImageFilter.GaussianBlur(shadow))
        shade = Image.new("RGBA", base.size, (0, 0, 0, 0))
        shade.putalpha(blurred.point(lambda p: min(255, int(p * 0.85))))
        base.alpha_composite(shade)
    if glow:
        blurred = mask.filter(ImageFilter.GaussianBlur(glow[0]))
        glow_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        colored = Image.new("RGBA", base.size, glow[1])
        colored.putalpha(blurred.point(lambda p: min(255, int(p * glow[2]))))
        glow_layer = colored
        base.alpha_composite(glow_layer)
    y0, y1 = bbox[1], bbox[3]
    grad = Image.new("RGBA", base.size, (0, 0, 0, 0))
    src = mask.load()
    dst = grad.load()
    span = max(1, y1 - y0)
    for y in range(y0, y1 + 1):
        t = (y - y0) / span
        # keep the highlight in the upper third so the letters read metallic
        t = t ** 0.85
        rgb = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(bbox[0], bbox[2] + 1):
            a = src[x, y]
            if a:
                dst[x, y] = (*rgb, a)
    base.alpha_composite(grad)
    return bbox, end_x


def centered_origin(text, font, tracking, canvas_w, y):
    width = sum(font.getlength(ch) for ch in text) + tracking * (len(text) - 1)
    return ((canvas_w - width) / 2, y), width


def build_og():
    W, H = 1200, 630
    cosmos = cover(Image.open(ART_COSMOS), W, H, focus=(0.5, 0.35))
    cosmos = tint(cosmos, VOID, 0.42)
    cosmos = ImageEnhance.Contrast(cosmos).enhance(1.15)
    base = cosmos.convert("RGBA")

    hero_h = 630
    hero = fit_height(Image.open(ART_BANNER), hero_h)
    hero = ImageEnhance.Contrast(hero).enhance(1.06)
    hero = ImageEnhance.Color(hero).enhance(1.08)
    hw, hh = hero.size
    hx = (W - hw) // 2
    hero_rgba = hero.convert("RGBA")
    hero_rgba.putalpha(side_feather(hw, hh, left_px=90, right_px=90))
    base.alpha_composite(hero_rgba, (hx, 0))

    # Bottom scrim so the lockup sits on void, not on the crystal road.
    scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sp = scrim.load()
    for y in range(H):
        if y < 300:
            a = 0
        else:
            t = (y - 300) / (H - 300)
            a = int(235 * (t ** 1.35))
        if a:
            for x in range(W):
                sp[x, y] = (*VOID, a)
    base.alpha_composite(scrim)

    # Soft top vignette so the frame doesn't blow out.
    vig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vp = vig.load()
    for y in range(90):
        a = int(90 * (1 - y / 90))
        for x in range(W):
            vp[x, y] = (*VOID, a)
    base.alpha_composite(vig)

    title_font = ImageFont.truetype(FONT_BOLD, 74)
    sub_font = ImageFont.truetype(FONT_BOLD, 26)
    tag_font = ImageFont.truetype(FONT_REG, 18)

    title_origin, title_w = centered_origin("GIGAROADSTER", title_font, 6, W, 412)
    sub_origin, _ = centered_origin("RACING", sub_font, 14, W, 500)
    tag_origin, _ = centered_origin("BUILT FOR SPEED", tag_font, 6, W, 548)

    boxes = []
    boxes.append(paint_text(
        base, "GIGAROADSTER", title_font, title_origin, 6,
        GOLD_HI, GOLD_LO, shadow=12, glow=(16, (153, 69, 255, 255), 0.55),
    )[0])
    boxes.append(paint_text(
        base, "RACING", sub_font, sub_origin, 14,
        IVORY, GOLD, shadow=6,
    )[0])
    boxes.append(paint_text(
        base, "BUILT FOR SPEED", tag_font, tag_origin, 6,
        MINT, (12, 168, 112), shadow=5,
    )[0])

    # Gold rule between the wordmark and RACING, narrower than the title.
    draw = ImageDraw.Draw(base)
    rule_w = min(title_w * 0.42, 280)
    rx0 = (W - rule_w) / 2
    ry = 492
    draw.line([(rx0, ry), (rx0 + rule_w, ry)], fill=(*GOLD, 210), width=2)

    # Corner ticks — racing HUD, well inside the frame.
    tick = (*GOLD, 180)
    inset, length = 28, 36
    for x0, y0, dx, dy in (
        (inset, inset, 1, 1),
        (W - inset, inset, -1, 1),
        (inset, H - inset, 1, -1),
        (W - inset, H - inset, -1, -1),
    ):
        draw.line([(x0, y0), (x0 + dx * length, y0)], fill=tick, width=2)
        draw.line([(x0, y0), (x0, y0 + dy * length)], fill=tick, width=2)

    rgb = base.convert("RGB")
    rgb.save(OUT_OG, "PNG")
    print("OG", rgb.size, "title widths", round(title_w))
    for label, box in zip(("title", "sub", "tag"), boxes):
        print(f"  {label} bbox {box}")
        l, t, r, b = box
        if l < 48 or t < 36 or r > W - 48 or b > H - 36:
            raise SystemExit(f"OG {label} too close to an edge: {box}")
    return rgb


def build_xb():
    W, H = 1200, 264
    cosmos = cover(Image.open(ART_COSMOS), W, H, focus=(0.45, 0.4))
    cosmos = tint(cosmos, VOID, 0.5)
    cosmos = ImageEnhance.Contrast(cosmos).enhance(1.2)
    base = cosmos.convert("RGBA")

    # Right-side cinematic strip through the car. Scaled taller than the
    # banner, then the vertical middle (the supercar) is kept.
    src = Image.open(ART_BANNER).convert("RGB")
    src = ImageEnhance.Contrast(src).enhance(1.08)
    src = ImageEnhance.Color(src).enhance(1.1)
    scale_h = 520
    scaled = fit_height(src, scale_h)
    sw, sh = scaled.size
    top = max(0, (sh - H) // 2 - 10)
    strip = scaled.crop((0, top, sw, top + H))
    # Park the car on the right; feather into the starfield under the lockup.
    sx = W - sw + 40
    strip_rgba = strip.convert("RGBA")
    strip_rgba.putalpha(side_feather(sw, H, left_px=200, right_px=0))
    base.alpha_composite(strip_rgba, (sx, 0))

    # Left veil so lettering never sits on the car.
    veil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vp = veil.load()
    for x in range(W):
        if x < 520:
            a = 150
        elif x < 760:
            a = int(150 * (1 - (x - 520) / 240))
        else:
            a = 0
        if a:
            for y in range(H):
                vp[x, y] = (*VOID, a)
    base.alpha_composite(veil)

    title_font = ImageFont.truetype(FONT_BOLD, 54)
    sub_font = ImageFont.truetype(FONT_BOLD, 18)
    tag_font = ImageFont.truetype(FONT_REG, 16)
    origin_x = 56

    boxes = []
    boxes.append(paint_text(
        base, "GIGAROADSTER", title_font, (origin_x, 48), 3,
        GOLD_HI, GOLD_LO, shadow=8, glow=(10, (153, 69, 255, 255), 0.45),
    )[0])
    boxes.append(paint_text(
        base, "RACING", sub_font, (origin_x, 114), 8,
        IVORY, GOLD, shadow=4,
    )[0])
    boxes.append(paint_text(
        base, "BUILT FOR SPEED", tag_font, (origin_x, 146), 3,
        MINT, (12, 168, 112), shadow=4,
    )[0])

    draw = ImageDraw.Draw(base)
    draw.line([(origin_x, 110), (origin_x + 168, 110)], fill=(*GOLD, 200), width=2)

    rgb = base.convert("RGB")
    rgb.save(OUT_XB, "PNG")
    print("XB", rgb.size, "strip", strip.size, "placed at", sx)
    for label, box in zip(("title", "sub", "tag"), boxes):
        print(f"  {label} bbox {box}")
        l, t, r, b = box
        # Left half, above the bottom fifth, clear of the top edge.
        if l < 36 or t < 24 or r > W * 0.50 or b > H * 0.80:
            raise SystemExit(f"XB {label} outside the safe lockup: {box}")
    return rgb


if __name__ == "__main__":
    build_og()
    build_xb()
