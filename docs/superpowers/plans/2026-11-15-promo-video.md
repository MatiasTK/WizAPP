# Promo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A ~25 s 1920×1080 promo MP4 of WiZ APP, in Spanish and English, rendered from one HyperFrames composition.

**Architecture:** `promo/` is a standalone HyperFrames project. `index.html` holds the whole film: six scenes as `.clip` elements on one paused GSAP root timeline (`window.__timelines["main"]`). The language is a composition variable (`lang`, default `"es"`) read with `window.__hyperframes.getVariables()`; all copy lives in one `STRINGS = { es, en }` object in `promo/strings.js`.

**Tech Stack:** HyperFrames CLI pinned `hyperframes@0.9.52`, GSAP 3.15.0 (jsDelivr), FFmpeg 7, fonts from the app's `@fontsource` packages.

**Spec:** `docs/superpowers/specs/2026-11-15-promo-video-design.md`

## Global Constraints

- 1920×1080, 30 fps, total duration 25 s; output `promo/out/wizapp-promo-es.mp4` and `promo/out/wizapp-promo-en.mp4`.
- Dark theme only; colors copied from the dark block of `src/renderer/src/assets/main.css` (`--bg #17181b`, `--surface #222428`, `--fg #eef0f4`, `--muted #a9afbb`, `--primary #3a66f0`, `--primary-text #8fb0ff`, `--border #2e3036`, `--track #3a3d44`).
- Fonts: Instrument Sans (UI/copy), Fredoka 700 (logo only), loaded from local files in `promo/assets/fonts/`.
- Logo: "w", dotless "ı" topped by the four-point star path from `src/renderer/src/components/Logo.tsx` (fill `#3a66f0`), "z". Never WiZ's own logo or branding.
- Scene names/swatches from `src/renderer/utils/scenesInfo.ts`; Spanish/English names from `resources/locales/{es,en}/translation.json` (`scenes.names`). Spanish copy uses "tú"; app wording "bombilla".
- No technical jargon on screen. Minimum on-screen copy size 40 px (still readable when GitHub scales the video to ~900 px wide); headlines ≥ 88 px.
- Deterministic: no `Math.random`, `Date.now`, network fetches beyond the GSAP script.
- No audio this iteration; leave a commented `<audio>` slot in `index.html`.
- `promo/out/` and `promo/renders/` gitignored; `promo/` excluded from the app's prettier/eslint/tsc runs if they would pick it up.

## Review Focus

- Spanish lines are ~20–30 % longer than English: every caption/chip must fit its box in **both** languages (snapshot both at the same seconds).
- Fonts falling back to system fonts in the headless render: check the logo glyphs in a snapshot are Fredoka (rounded) and not Arial.
- Readability when scaled down: view one snapshot per scene at 900 px wide and confirm copy reads.
- Unknown/missing `lang` variable: falls back to `"es"` and never renders `undefined`.
- Colour scenes where the ambient glow makes white text low-contrast (Océano, Bosque): keep copy over a dark scrim.

---

### Task 1: Scaffold `promo/`

**Files:**

- Create: `promo/index.html`, `promo/strings.js`, `promo/hyperframes.json`, `promo/meta.json`, `promo/package.json`, `promo/.gitignore`, `promo/assets/fonts/*.woff2`
- Modify (only if needed): `.prettierignore`, `eslint.config.*`, `tsconfig.json`

- [ ] Generate with `npx hyperframes@0.9.52 init promo --example blank --non-interactive --skip-skills`, delete its `AGENTS.md`/`CLAUDE.md` (they ask to install skills).
- [ ] Copy `instrument-sans-latin-wght-normal.woff2` and `fredoka-latin-700-normal.woff2` from `node_modules/@fontsource*/files/` to `promo/assets/fonts/`; declare `@font-face` in `index.html`.
- [ ] Root `#root` gets `data-duration="25"` and `data-composition-variables` declaring `lang` (string, default `"es"`).
- [ ] `strings.js` exposes `window.STRINGS = { es: {...}, en: {...} }` with keys: `hook`, `control`, `scenes`, `features` (array of 6), `ctaTitle`, `ctaUrl`, `bulbNames` (array of 3), `sceneNames` (4 scenes used).
- [ ] Verify: `cd promo && npx hyperframes@0.9.52 check` reports 0 errors; `pnpm lint:check` and `pnpm typecheck` at repo root still pass.

### Task 2: Scenes 1–2 (hook 0–3 s, logo 3–6 s)

- [ ] Hook: centered bulb (SVG), off-grey, flicks on at 1.2 s (two quick flickers then on), warm radial glow `#ffc979` expands; `hook` copy fades up below.
- [ ] Logo: glow recolors to primary blue, "wız" at 220 px Fredoka with the star scaling/rotating in on the ı; "WiZ APP" subtitle.
- [ ] Verify: `npx hyperframes snapshot --at 0.5,1.8,2.8,4.5,5.8` for `lang=es` and `en`; read frames.

### Task 3: Scene 3 control (6–12 s)

- [ ] App window mock (sidebar with logo + nav "Bombillas/Escenas", bulb list of 3 `bulbNames` with switches, detail pane with brightness slider) slides in from right; big bulb on the left.
- [ ] Cursor (SVG arrow) clicks the first switch at ~7.5 s → switch on, bulb glows warm white; drags brightness 30 % → 100 % (9–10.5 s) with bulb glow intensity following. `control` caption on top.
- [ ] Verify: snapshots at 6.5, 8, 10, 11.5.

### Task 4: Scene 4 scenes (12–17 s)

- [ ] Window content crossfades to a 4×2 scenes grid (tiles with swatch gradients + names). Cursor clicks Atardecer (12.8), Océano (13.9), Fiesta (15.0), Bosque (16.1); each click: tile selected ring, bulb + full-frame ambient glow tween to the scene's `hex`/`hex2`. `scenes` caption.
- [ ] Verify: snapshots at 13.2, 14.3, 15.4, 16.6, both langs.

### Task 5: Scenes 5–6 features + CTA (17–25 s)

- [ ] Features: six chips with `react-icons/lu`-style inline SVG icons stagger in (0.35 s apart), two columns, over a soft multi-colour glow.
- [ ] CTA (21–25 s): logo, `ctaTitle` ("Gratis para Windows" / "Free for Windows"), `ctaUrl` pill; holds the last 1.5 s still.
- [ ] Verify: snapshots at 18, 20.5, 22.5, 24.9, both langs; `npx hyperframes check` 0 errors.

### Task 6: Render and hand off

- [ ] `npx hyperframes render -o out/wizapp-promo-es.mp4 --variables '{"lang":"es"}'` and same for `en`.
- [ ] `ffprobe` both: 1920×1080, 25 s ±0.1, 30 fps. Extract 6 frames per file with ffmpeg and look at them.
- [ ] Commit `promo/`, the spec and this plan (not `out/`).
