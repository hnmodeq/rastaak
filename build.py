#!/usr/bin/env python3
"""Build index.html from index.template.html by embedding images & logos as base64.

Usage:  python3 build.py
"""
import base64, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "index.template.html")
OUT = os.path.join(HERE, "index.html")

# token -> relative path
MAPPING = {
    "__IMG_HERO__": "assets/hero_opt.jpg",
    "__IMG_SLIDE2__": "assets/hero-slide-2_opt.jpg",
    "__IMG_SLIDE3__": "assets/hero-slide-3_opt.jpg",
    "__IMG_AI__": "assets/ai_opt.jpg",
    "__IMG_PLATFORM__": "assets/platform_opt.jpg",
    "__IMG_CASE_VFX__": "assets/case-vfx_opt.jpg",
    "__IMG_CASE_RESEARCH__": "assets/case-research_opt.jpg",
    "__IMG_CASE_AUTO__": "assets/case-auto_opt.jpg",
    "__IMG_CASE_CITY__": "assets/case-city_opt.jpg",
    "__LOGO_FULL__": "assets/logo/rastaak-full.png",
    "__LOGO_SHORT__": "assets/logo/rastaak-short.png",
    "__FAVICON__": "assets/logo/favicon-64.png",
}
MIMES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}

with open(TEMPLATE, encoding="utf-8") as f:
    html = f.read()

html = html.replace("QORA", "RASTAAK")  # legacy brand name

for token, rel in MAPPING.items():
    path = os.path.join(HERE, rel)
    if not os.path.exists(path):
        raise SystemExit(f"missing asset: {path}")
    with open(path, "rb") as fh:
        b64 = base64.b64encode(fh.read()).decode()
    ext = os.path.splitext(rel)[1]
    uri = f"data:{MIMES[ext]};base64,{b64}"
    if token not in html:
        raise SystemExit(f"token not found in template: {token}")
    html = html.replace(token, uri)

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

leftover = re.findall(r"__(?:IMG|LOGO|FAVICON)_[A-Z0-9_]+__", html)
size = os.path.getsize(OUT) / 1024
print(f"OK -> index.html ({size:.0f} KB)")
if leftover:
    print("WARNING leftover tokens:", leftover)
