# Self-hosted fonts

`app/fonts.css` and `public/fonts/*.woff2` are generated. Don't edit them by hand.

```bash
pip install fonttools brotli
python3 scripts/fonts/subset.py build scripts/fonts/fonts.json
```

Then update `FONT_PRELOADS` in `app/layout.tsx` to the new `*-core.*.woff2`
names the script prints, and commit everything it wrote.

Each font is cut to what the site renders (`usage.json`, from a crawl of every
sitemap page plus /auth/signin, /auth/verify and the 404 page) plus Latin-1 and
Latin Extended-A, restricted to the characters Google's slices drew before
(`coverage-*.json`), and split into a preloaded `core` file (ASCII, curly
quotes, dashes, ellipsis, plus `©·•`) and `ext` files behind `unicode-range`.

| Font | Source | Weights kept |
|---|---|---|
| Geist | `src/Geist.ttf` (google/fonts, v1.800) | 400 to 900, `tnum` kept |
| Geist Mono | `src/GeistMono.ttf` (google/fonts, v1.701) | 400 to 900 |
| Newsreader | `src/Newsreader-google-*.woff2` (Google Fonts' own latin + latin-ext slices, opsz pinned by Google) | 400 to 800 |

Newsreader uses Google's slices: the old next/font file was byte-identical to
the `latin` slice, and the GitHub font has an extra opsz axis.

Axes are only cut where the result is outline-identical: each range runs from
the font's default (400) to its max master. `ss01`/`cv11` in `globals.css` are
not kept on purpose: Google's slices never had them, so they never applied.

`subset.py` passes `--glyph-names`: without it Chrome draws 9px Geist (the hero
phone mockups) a fraction of a pixel off, even with identical outlines.

**Rerun when:**

- Geist or Geist Mono is used lighter than 400, or Newsreader lighter than 400
  or heavier than 800 (those ranges were cut);
- CSS turns on a new OpenType feature (`font-feature-settings`, `font-variant-*`);
- content adds characters outside Latin-1 / Latin Extended-A (re-crawl with
  the optimize-fonts skill's `scan-usage.mjs` and refresh `usage.json`);
- a source font is upgraded.
