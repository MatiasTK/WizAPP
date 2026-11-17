# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Home users with one or more WiZ smart bulbs who sit at a Windows PC and want to control their lights from the desktop without reaching for the phone app. Typical jobs: switch bulbs on/off (one or all), adjust brightness, pick a scene or custom color, recall favorites from the tray.

## Product Purpose

WiZ APP discovers and controls WiZ smart bulbs over the local network. Success is a quick, reliable change of light state from the desktop, with the app out of the way (tray) when not in use.

## Positioning

Local-only control: it talks to bulbs over LAN UDP, with no account and no cloud or internet dependency. It is desktop-native (tray menu with favorites and all on/off, about 7 MB resident when closed to the tray), fast and simple (optimistic UI for brightness, power, scene and color), and bilingual (English and Spanish throughout).

## Operating Context

Windows desktop app (Tauri 2 + Rust backend; React 19 + TypeScript + Tailwind v4 renderer). Bulbs found by UDP discovery or added by IP. The window can be closed to the tray, where the app stays alive. Updates ship via signed GitHub releases and are never installed without the user asking. A still-installed Electron 3.x version may coexist; the app shows a notice.

## Capabilities and Constraints

- Master-detail Bulbs page, Scenes page, Information page; hash router.
- Built-in WiZ scenes (IDs below 33) and user custom colors (RGB, IDs 33+); favorites mix both.
- Bulb failure policy: timeout or ICMP-unreachable becomes an offline bulb, without touching config.
- All user-facing strings go through i18next, with `en` and `es` kept in sync.
- Light and dark themes both supported.

## Brand Commitments

Name "WiZ APP". Logo set in Fredoka; UI in Instrument Sans (bundled fonts). Light and dark themes are both first-class.

## Evidence on Hand

HyperFrames promo video (ES/EN) with original soundtrack. Design notes in `docs/redesign-a3.md`; migration log in `MIGRATION.md`. No testimonials, user numbers or benchmarks exist; do not fabricate them.

## Product Principles

- Local first: nothing leaves the LAN, and no account is required.
- Backend state is the source of truth; the UI responds instantly but never lies about a bulb's real state.
- Stay out of the way: fast to use, light in memory, quiet when idle.
- Both languages and both themes are equal citizens.

## Accessibility & Inclusion

Keyboard and screen-reader support are built in (Radix primitives, `aria-live` toast region, focus return from dialogs). `pnpm check:contrast` verifies WCAG contrast of every token pair in both themes.
