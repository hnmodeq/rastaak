# RASTAAK — Qumulo-style Landing Page

A single-file landing page inspired by the **qumulo.com** homepage (layout, color
system, typography, glow effects, and section structure), now with:

- ✅ **Your RASTAAK logo** (white chip in nav + footer + mobile menu)
- ✅ **Moving gradients** just like Qumulo's hero:
  - drifting animated gradient orbs
  - shimmering gradient headline text
  - auto-advancing hero image slider (drag it, click the dots)
  - liquid blob shape on the hero image card
- ✅ Original placeholder content (swap in your real copy)

## Files

| File | What it is |
|---|---|
| `index.html` | The complete page. Everything embedded (CSS, JS, images, logos as base64) — works offline, ~1.9 MB |
| `index.template.html` | Same page with `__IMG_*__` / `__LOGO_*__` / `__FAVICON__` tokens (edit this, then rebuild) |
| `assets/` | Generated images (`*_opt.jpg` = compressed, used in the page) |
| `assets/logo/` | Your processed logos: `rastaak-full.png` (header/footer), `rastaak-short.png` (mobile menu), `favicon-64.png` |

## How to run

**Easiest:** double-click `index.html`.

**Local server:**
```bash
cd /home/user
python3 -m http.server 8000
# open http://localhost:8000
```

**Rebuild after editing the template:**
```bash
python3 build.py
```

## The moving-gradient system

All animation code is in one block at the end of `<style>` (search for
`MOVING GRADIENTS`):

| Effect | CSS/JS | Tune it |
|---|---|---|
| Drifting orbs | `.orb` + `@keyframes drift-a/b/c` | change duration (18s/22s/26s), colors, or position |
| Shimmering gradient text | `.grad` + `@keyframes shimmer` | `animation:shimmer 7s linear infinite` |
| Hero slider | `.hero-slide` + Ken Burns `@keyframes kenburns` | autoplay interval in JS (`6500` ms), pause on hover |
| Liquid blob shape | `.hero-visual .frame` + `@keyframes blob` | adjust the morphing `border-radius` values |
| Animated glow ring on CTA | `.glow-ring::before` conic gradient | optional — add class `glow-ring` to any button |

Respects `prefers-reduced-motion` (animations turn off for users who ask).

## Design tokens (extracted from the real Qumulo site)

| Token | Value | Used for |
|---|---|---|
| `--ink` | `#08081b` | dark navy-black backgrounds |
| `--blue` | `#3463f1` | primary buttons, links, icons |
| `--blue-r` | `#2393d3` | your logo's bright blue (orbs/accents) |
| `--orange` | `#ff7a46` | accent + gradient text |
| `--peach` | `#ffe2d7` | gradient partner |
| Font | **Montserrat** | Google Fonts when online; system fallback offline |

Your logo's palette (deep navy `#1f2162`, indigo, bright blue `#2393d3`) was
matched to the theme, so the logo and page colors are in harmony.

## Sections

Nav (glass, sticky) → Hero slider + headline → press cards → logo marquee →
6 value props → AI section → platform (light) → use-case chips → case studies →
industries → partners → support → stats → resources → CTA → footer.

## How to customize

1. **Logo** — replace the base64 PNGs in `assets/logo/` (or swap `__LOGO_*__` in the template).
2. **Brand name** — search & replace `RASTAAK`.
3. **Images** — replace the `data:image/...` URIs, or edit the template tokens and rebuild.
4. **Text** — all copy is plain HTML.
5. **Slider speed / effects** — see table above.

## Notes

- Design homage with **original placeholder content** — Qumulo's real photos,
  customer logos, and marketing copy were not copied.
- The Arena preview shows fallback fonts (no network); open in your own browser
  for real Montserrat typography and full motion.
