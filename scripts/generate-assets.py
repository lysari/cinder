#!/usr/bin/env python3
"""
Asset generation and post-processing script for Cinder.
Generates the social preview banner and manages documentation assets.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOCS_DIRS = [
    os.path.join(ROOT_DIR, "docs", "images"),
    os.path.join(ROOT_DIR, "cinder", "docs", "images")
]

def build_social_preview():
    W, H = 1280, 640
    base = Image.new("RGBA", (W, H), (15, 16, 20, 255))

    # Atmospheric ambient brand glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse([-80, -60, 480, 480], fill=(239, 106, 31, 38))
    g_draw.ellipse([W - 450, H - 380, W + 120, H + 120], fill=(255, 140, 30, 22))
    glow = glow.filter(ImageFilter.GaussianBlur(85))
    base.alpha_composite(glow)

    draw = ImageDraw.Draw(base)

    # Logo
    logo_path = os.path.join(DOCS_DIRS[0], "logo.png")
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        logo = logo.resize((92, 92), Image.Resampling.LANCZOS)
        base.paste(logo, (52, 60), logo)

    font_bold_44 = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 44, index=1)
    font_mono_12 = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 12)
    font_title_16 = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 16, index=1)
    font_sub_13 = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 13, index=0)

    draw.text((160, 64), "CINDER", fill=(255, 255, 255), font=font_bold_44)
    draw.text((162, 118), "DESKTOP CLIENT FOR CLOUD FIRESTORE", fill=(251, 138, 69), font=font_mono_12)

    # Gradient accent line
    for i in range(370):
        t = i / 370.0
        r = int(239 + (255 - 239) * t)
        g = int(106 + (210 - 106) * t)
        b = int(31 + (122 - 31) * t)
        draw.line([(52 + i, 160), (52 + i, 163)], fill=(r, g, b, 255))

    features = [
        ("High-Performance Core", "Built on Electrobun, Bun & Angular 19"),
        ("Realtime Data Explorer", "Table, Tree & JSON views with live streaming"),
        ("Visual Query Builder", "Two-way filter generator & JavaScript runner"),
        ("Lossless Import & Export", "Cinder JSON, NDJSON, and auto-mapped CSV"),
        ("Local & Cloud Native", "Google OAuth (PKCE), Service Accounts & Emulator")
    ]

    by = 194
    for title, desc in features:
        cy = by + 9
        draw.polygon([(56, cy - 4), (60, cy), (56, cy + 4), (52, cy)], fill=(251, 138, 69))
        draw.text((74, by), title, fill=(245, 245, 250), font=font_title_16)
        draw.text((74, by + 23), desc, fill=(155, 155, 170), font=font_sub_13)
        by += 68

    hero_path = os.path.join(DOCS_DIRS[0], "hero.png")
    if os.path.exists(hero_path):
        screenshot = Image.open(hero_path).convert("RGBA")
        sw = 770
        sh = int(sw * screenshot.height / screenshot.width)
        resized_shot = screenshot.resize((sw, sh), Image.Resampling.LANCZOS)
        base.paste(resized_shot, (490, (H - sh) // 2), resized_shot)

    for d in DOCS_DIRS:
        os.makedirs(d, exist_ok=True)
        out_file = os.path.join(d, "social-preview.png")
        base.save(out_file, "PNG", optimize=True)
        print(f"Created {out_file} (1280x640)")

if __name__ == "__main__":
    build_social_preview()
