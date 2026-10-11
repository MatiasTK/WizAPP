# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WiZ APP — a desktop app (Tauri 2 + React 19 + TypeScript + Tailwind v4 + Zustand) that discovers and controls WiZ smart bulbs over the local network via UDP.

**This branch (`tauri`) is mid-migration from Electron.** `MIGRATION.md` is the plan and defines the module order (M0–M8); `docs/electron-inventory.md` describes the old behaviour. `main` is still Electron 3.0.x. Current status: **M0 done** (scaffolding), no Rust backend yet — `src-tauri/` only opens the window, so the renderer still calls the removed `window.api` (typed by a temporary shim in `src/renderer/src/env.d.ts`) and every bulb action fails until M4.

## Commands

The package manager is **pnpm** (`.npmrc` sets `shamefully-hoist=true`). Rust stable via `src-tauri/rust-toolchain.toml`.

```bash
pnpm install
pnpm tauri dev        # Vite on :5173 (strictPort) + Rust app with HMR
pnpm dev              # renderer only, in a browser
pnpm typecheck        # tsc --noEmit -p tsconfig.json
pnpm lint             # eslint with --fix (it modifies files)
pnpm format           # prettier --write .
pnpm build            # typecheck + vite build -> dist/
cd src-tauri && cargo check   # also fmt / clippy -D warnings / test from M1 on
```

There are no JS tests. Rust tests arrive with M1.

### Testing without physical bulbs

`python scripts/wiz_emulator.py` starts three virtual bulbs on UDP port 38899 at `127.0.0.1`, `127.0.0.2` and `127.0.0.3`. Add them manually by IP through the app's "add device" modal rather than relying on broadcast discovery.

## Layout

- `src-tauri/` — Rust backend (`tauri.conf.json`, `capabilities/default.json`; the planned module tree is in `MIGRATION.md` §2.2).
- `src/renderer/` — React app (hash router: `/`, `/scenes`, `/information`). Vite `root` is `src/renderer`, output goes to `dist/`.
- `src/shared/` — legacy TS types and constants; to be replaced by `ts-rs` bindings in `src/renderer/src/bindings/` (M4).
- `src/i18n/` + `resources/locales/{en,es}/translation.json` — single source of UI strings.
- `scripts/wiz_emulator.py` — fake bulbs.
- `wizapp-tauri/` (untracked) holds only an old build output; deletion is waiting on the user's confirmation (`MIGRATION.md` §6).

### Path aliases

Declared once in `tsconfig.json` and picked up by `vite-tsconfig-paths`. `@/types/*` → `src/renderer/src/types/*`.

## Code style

- Prettier: single quotes, no semicolons, 100 columns, no trailing commas. The vendored `src/lib/wikari` keeps its own style.
- All user-facing strings go through i18next; add keys to both `en` and `es` translation files.
- From the project's Cursor rules for React code:
  - Style with Tailwind classes only; avoid custom CSS.
  - Prefer early returns.
  - Name event handlers with a `handle` prefix (`handleClick`, `handleKeyDown`).
  - Use `const` arrow functions rather than `function` declarations, typed where possible.
  - Add accessibility attributes to interactive elements (`tabIndex`, `aria-label`, keyboard handlers).
  - Favor readability over performance.
