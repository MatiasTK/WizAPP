# Redesign "A3" — implementation brief

Handoff for implementing the UI redesign agreed in the Claude Design canvas
**WiZ APP — Rediseño**: https://claude.ai/artifact/Xh9udKvz4ntqDZCtcaxDRH

The source of truth is the artboard **`App.dc.html`** ("A3 · App completa (jugable)"). It is a
playable prototype: every page, dialog and state below can be tried with Play. Read it with the
Artifact tool (`action: "read"`, `path: "project/App.dc.html"`); its `renderVals()` holds the exact
colors, copy and behaviour. The logo options are in `Logo.dc.html` (option 2 was chosen). The other
artboards (A, B, C, D, A1, A2, A4, A3) are discarded explorations kept for reference.

This is a renderer-only change. No Rust command, binding or store contract needs to change, except
where noted under "Open points".

## 1. What changes, at a glance

| Area | Today | A3 |
| --- | --- | --- |
| Bulbs page | One row per bulb (`BulbRow`) with power, slider, scene chip, `⋮` menu | Grid of **expandable cards**. Closed: color dot, name, status, power switch, up to 5 favorite swatches. Open (spans the full row): brightness slider + 25/50/75/100 % presets, favorite tiles, Rename / Details / Remove buttons. Only one card open at a time. The `⋮` menu goes away. |
| Reordering | Drag handles always visible on rows and favorite tiles | **"Ordenar" mode**: a button in the page header swaps the grid for a compact numbered list with drag + up/down arrow buttons and a "Listo" button. Same for favorites, from the Favoritas section header on the Scenes page. No grips in normal view. |
| Sidebar | Logo PNG, search, nav, `BulbShortcut`, settings/help | Sticky full-height sidebar (224 px), hand-drawn logo, search (Ctrl K), nav, **"Bombilla activa"** card (bulb selector, status, switch, brightness slider — no presets), Ajustes / Ayuda. Only `main` scrolls. |
| Scenes page | Grid + favorites | Target-bulb pills, search field, type segmented control (Todas / Estáticas / Dinámicas / Personalizadas), Favoritas section (with "Ordenar"), scene grid. Dynamic scenes show a two-color gradient swatch and an activity icon. Heart toggles favorite. "Aplicar «X» a todas" + "Nuevo color" in the header. |
| Information page | Table | One card per bulb: color dot, name, status, signal bars, then IP (copy), MAC (copy), model, firmware, signal label + dBm. "Actualizar" button in the header. |
| Dialogs | Existing | Same set, restyled: Ajustes, Ayuda, Agregar bombilla, Renombrar, Detalles, Confirmar (quitar bombilla / eliminar perfil), Nuevo color, Buscador rápido. |

## 2. Visual language

- **Font:** Instrument Sans (400/500/600/700) for the UI; Fredoka 700 only for the logo. Replaces
  Inter Variable. Bundle both locally (the app must work offline; do not load Google Fonts at
  runtime), e.g. via `@fontsource-variable/instrument-sans` and `@fontsource/fredoka`.
- **Scale:** base 14 px; page title 24 px / 700; section title 16 px / 700; controls 36 px high
  (38–40 px for text fields and dialog buttons); radius 9–10 px on controls, 16 px on cards,
  18 px on dialogs. This is a desktop app on a monitor: keep it at this density.
- **Bulb color:** a bulb's dot uses its current scene color, with a soft glow and an ~8 % tint of
  the same color behind the card header while it is on. Off = dot at 35 % opacity, no glow, no tint.

### Tokens (map onto the existing semantic tokens in `assets/main.css`)

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | `#f2f4f7` | `#17181b` |
| `--surface` | `#ffffff` | `#222428` |
| `--sunken` | `#f4f5f8` | `#1c1d21` |
| `--border` | `#e3e6ec` | `#2e3036` |
| `--fg` | `#14161b` | `#eef0f4` |
| `--muted` | `#5b6474` | `#a9afbb` |
| `--primary` | `#2a5fe8` | `#3a66f0` |
| `--primary-text` | `#1f4fd1` | `#8fb0ff` |
| `--primary-soft` | `#e6edff` | `#26345c` |
| `--danger` (solid button) | `#c62828` | `#c62828` |
| `--danger-text` | `#b3261e` | `#ff8178` |
| `--danger-soft` | `#fdecea` | `#3a1f1f` |
| slider track (new) | `#dfe3ea` | `#3a3d44` |
| switch off (new) | `#c4c9d3` | `#4a4e57` |

The prototype draws button and input borders with `#cfd4dd` / `#41444c`. That is fine for
buttons, but **text fields and the switch's off track need 3:1 against the surface** (WCAG 1.4.11):
keep `--control` for those and run `pnpm check:contrast` after changing any token.

## 3. Components

- **Logo** (`components/Logo.tsx`, new): inline SVG/text, not a PNG. Lowercase "wız" in Fredoka 700
  (dotless ı) with a four-point star as the dot of the i, colored with the accent (`--primary` in
  light, `#6f95ff` in dark). No "app" label. Left-aligned in the sidebar, ~50 px font size.
  Accessible name "WiZ APP". The star path:
  `M12 1.5c.7 6.4 3.7 9.6 10.5 10.5-6.8.9-9.8 4.1-10.5 10.5C11.3 16.1 8.3 12.9 1.5 12 8.3 11.1 11.3 7.9 12 1.5Z`.
  It is our own mark, not a copy of the WiZ brand logo. Once settled, also regenerate the app/tray icons from it.
- **Switch** (replaces `PowerButton` in cards and the sidebar): pill 48×28 (44×26 in the sidebar),
  `aria-pressed`, accent when on.
- **Slider** (`ui/Slider`, Radix): restyle only. 8 px rounded track, accent fill up to the value,
  20 px white thumb with a shadow, accent focus ring. Keep `BrightnessSlider`'s
  send-on-release behaviour.
- **Segmented control** (`ui/SegmentedControl`): used for scene type, theme and language.
- **Bulb card** (`BulbRow` → `BulbCard`): see table above. The whole header (dot + name + status +
  chevron) is one button with `aria-expanded`; the switch and "Reintentar" sit beside it.
  Offline: wifi-off icon + "Sin conexión" in danger text, "Reintentar" button, no swatches, cannot open.
- **"Bombilla activa"** (`BulbShortcut`): uppercase label, a ghost select-like button
  (dot + name + chevrons-up-down) opening a listbox of bulbs with their status (offline ones
  disabled), status text + switch, then the brightness slider.
- **Sort list** (new, shared by bulbs and favorites): numbered rows with grip, swatch/dot, name,
  and Subir/Bajar icon buttons (disabled at the ends). Rows are draggable with dnd-kit
  (already a dependency); the buttons are the keyboard path. Announce moves in the toast region.
- **Scene tile** (`SceneTile`): swatch (gradient for dynamic scenes), name, activity icon for
  dynamic ones, heart button in the corner. Selected = accent border.
- **Toasts:** dark pill at the bottom center with a check icon (inverted in dark mode).

### Icons (react-icons/lu) — one icon per meaning

| Meaning | Icon |
| --- | --- |
| Bulbs (nav) | `LuLightbulb` |
| Scenes (nav) | `LuPalette` |
| Information (nav) | `LuInfo` |
| Settings | `LuSettings` |
| Help | `LuCircleHelp` |
| Search | `LuSearch` |
| Brightness | `LuSun` |
| Turn all on / off | `LuPower` / `LuPowerOff` |
| Add bulb / new color | `LuPlus` |
| Sort mode | `LuArrowDownUp` |
| Done | `LuCheck` |
| Move up / down (sort list) | `LuArrowUp` / `LuArrowDown` |
| Drag handle | `LuGripVertical` |
| Open / close card | `LuChevronDown` (rotates) |
| Active-bulb selector | `LuChevronsUpDown` |
| See all scenes | `LuChevronRight` |
| Rename | `LuPencil` |
| Details | `LuClipboardList` |
| Remove / delete profile | `LuTrash2` |
| Retry (reconnect) | `LuPlugZap` |
| Refresh data (Information) | `LuRefreshCw` |
| Offline | `LuWifiOff` |
| Favorite | `LuHeart` |
| Dynamic scene | `LuActivity` |
| Copy | `LuCopy` |
| Close dialog | `LuX` |

Do not reuse an icon for a different meaning. `LuInfo` stays only for the Information page.

## 4. Copy

All new strings go through i18next, in both `resources/locales/es` and `en`. The prototype uses
the existing tone (tú, "bombillas"). New or changed keys, roughly:

- `home.sort`, `home.sortTitle` ("Ordenar bombillas"), `home.sortHint`, `common.done` ("Listo"),
  `home.subtitleCount` ("{{online}} de {{total}} en línea · abre una tarjeta para ajustarla").
- `bulb.open` / `bulb.close` ("Abrir {{name}}" / "Cerrar {{name}}"), `bulb.moveUp` / `bulb.moveDown`,
  `bulb.movedTo` ("{{name}} movida a la posición {{position}}"), `bulb.removeMessage`
  ("«{{name}}» dejará de aparecer en la app. Puedes volver a agregarla buscando bombillas.").
- `sidebar.activeBulb` already exists; `sidebar.chooseActiveBulb` for the listbox.
- `scenes.sort`, `scenes.sortHint`, `scenes.dynamic` (icon label), `toast.orderSaved`.
- `information.signal.good|fair|weak` ("Buena" / "Aceptable" / "Débil": > -60, > -72, else).

## 5. Behaviour to keep

Everything in CLAUDE.md "State flow" still applies: optimistic overlay, rejected command → toast,
`bulbOffline` shown on the card instead of a toast, send-on-release brightness, active bulb drives
the sidebar card and the Scenes page target, `setScene` / `setCustomColor` redirect at
`MAX_DEFAULT_COLORS`. Reorder still goes through the existing bulb/favorite reorder actions.
Dialogs keep `useReturnFocus` and `OverlayStore`; Ctrl K still opens the palette.

## 6. Open points (decide while implementing)

- **Theme "Igual que el sistema":** the prototype only shows Claro / Oscuro; keep the existing
  system option as the first segment.
- **Prototype-only details:** the version is a placeholder, "Código fuente" links to `#`, and
  the Add dialog fakes a bulb. Wire them to the real data.
- **Window size:** design target is 1280×800. Check the minimum window size; below ~900 px wide the
  card grid drops to one column (fine) and the sidebar should stay.
- CLAUDE.md mentions `DESIGN.md`, which is not in the repository: either add it from this brief
  or drop the reference.

## 7. Suggested order

1. Tokens, fonts, logo, sidebar shell (sticky, scroll only `main`).
2. Switch, slider and segmented control restyle; icon pass.
3. Bulb card + "Bombilla activa" card; remove the `⋮` menu.
4. Sort mode (bulbs, then favorites).
5. Scenes page, then Information page.
6. Dialogs and toasts.
7. i18n (es + en), `pnpm check:contrast`, `pnpm typecheck`, `pnpm lint:check`, `pnpm test:web`
   (update tests that query the old row/menu), then check in `pnpm dev` with the emulator
   (`scripts/wiz_emulator.py`) in both themes.
