# Promo video (HyperFrames) — design

## Intent

A short promo video for the README / GitHub releases, also shared with friends. It must convince
a general audience (not only developers) to download WiZ APP. Two versions: Spanish and English.

## Goals / non-goals / anti-goals

- Goals: show the real product _and_ the result (the room changes color); understandable muted
  (GitHub autoplays muted); ~25 s; 1920×1080 MP4; ES and EN from one source.
- Non-goals (this iteration): audio. The composition leaves a slot for music + SFX later.
- Anti-goals: looking like WiZ's official app or using WiZ branding (the logo "wız" is ours);
  technical jargon (UDP, Tauri, Rust) on screen; text too small to read in a README embed.

## Approaches

- **A. Recreated UI in HTML, animated (chosen).** Crisp at any size, one source for both
  languages (only strings change), precise timing. Risk: drifts if the real UI changes a lot.
- B. Screen recording of the real app + overlays. Most authentic, but two recordings, fixed
  resolution, every retouch means re-recording, and the emulator has no real light to show.
- C. Abstract (light, color, slogans, no UI). Mood, but doesn't show the product.

Picked A: it sells best to a general audience because it shows both the app and the light.

## Storyboard (≈25 s, dark theme, app tokens)

1. **0–3 s Hook.** Dark room, a bulb silhouette. Line: "Tus luces, desde tu escritorio." /
   "Your lights, from your desktop." The bulb flicks on, warm glow fills the frame.
2. **3–6 s Logo.** "wız" in Fredoka, the star sparkles in as the dot of the ı; "WiZ APP" below.
3. **6–12 s Control.** App window (sidebar + Bulbs master-detail: bulb list, detail with
   brightness) slides in beside a big glowing bulb. A cursor turns a bulb on, drags brightness
   up; the bulb and the ambient glow follow. Caption: "Enciende, apaga y regula el brillo".
4. **12–17 s Scenes.** Scenes grid with real swatches/names. The cursor clicks Atardecer, Océano,
   Fiesta, Bosque; each click recolors the bulb and the whole background. Caption:
   "32 escenas y tus propios colores".
5. **17–21 s Features.** Quick chips: encuentra tus bombillas solo · varias bombillas, todas a la
   vez · desde la bandeja del sistema · favoritos · español e inglés · gratis y de código abierto.
6. **21–25 s CTA.** Logo + "Gratis para Windows" + `github.com/MatiasTK/WizAPP`.

Spanish uses neutral "tú", like the app. English copy mirrors it (not a literal translation).

## Build

- Folder `promo/` in the repo: a HyperFrames project (`npx hyperframes`, GSAP timeline), fonts
  copied from the app's bundled fonts, colors from `assets/main.css` tokens.
- One composition reading a `lang` setting; strings in a small ES/EN table. Rendered to
  `promo/out/wizapp-promo-es.mp4` and `-en.mp4` (`out/` gitignored).
- README: MP4 is uploaded through GitHub's editor (user-attachments) to play inline; that step is
  the maintainer's.

## Left to the builder

Exact easing/timings, cursor path, glow rendering, which bulb names appear in the list.
