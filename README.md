<div align="center">
    <h1>WiZ APP 💡</h1>
    <br>
    <i>Simple desktop app to connect and control <a href="https://www.wizconnected.com/">WiZ</a> Bulbs.</i>
    <br>
    <br>
    <a href="https://github.com/MatiasTK/WizAPP/releases/latest">
        <img src="https://img.shields.io/github/downloads/MatiasTK/WizAPP/total?style=for-the-badge" alt="Downloads">
    </a>
    <a href="https://github.com/MatiasTK/WizAPP/releases/latest">
        <img src="https://img.shields.io/github/v/release/MatiasTK/WizAPP?style=for-the-badge" alt="Release">
    </a>
    <img src="https://img.shields.io/github/license/MatiasTK/WizAPP?style=for-the-badge" alt="License">
    <br>
    <br>
    <p align="center">
        <a href="#features-">Features</a> •
        <a href="#download-">Download</a> •
        <a href="#building-">Building</a> •
        <a href="#troubleshooting-">Troubleshooting</a> •
        <a href="#roadmap-">Roadmap</a> •
        <a href="#stack-%EF%B8%8F">Stack</a>
    </p>
</div>

<img width="917" height="593" alt="image" src="https://github.com/user-attachments/assets/aa2f7307-3a78-4c89-a646-8c779f4d0f44" />

## Features 🌟

- Discover your bulbs automatically.
- Multiple Bulb support.
- Turn on/off your bulbs.
- Change the scene of your bulbs.
- Change the brightness of your bulbs.
- Set custom bulb scene colors.
- Notification when an update is available.
- Spanish and English language support.
- Minimize to tray.

## Download 📥

You can download the latest release from [here](https://github.com/MatiasTK/WizAPP/releases/latest). The app is Windows-only and installs per user (no administrator rights needed). It needs the WebView2 runtime, which the installer downloads if it is missing.

### Coming from 3.x (Electron)

Version 4 is a new build of the app and **does not update from 3.x automatically**: download the 4.x installer and run it. On first start it imports your bulbs, names, custom colors and favorites from the old version (the old config file is left untouched), and it will tell you that the old version is still installed so you can remove it from *Installed apps*. From 4.x on, the app updates itself (you choose when).

## Building 📦

If you want to build the app yourself, you need [Node.js](https://nodejs.org/) 20+, [pnpm](https://pnpm.io/) 10, the stable [Rust toolchain](https://rustup.rs/) and the [Tauri prerequisites for Windows](https://tauri.app/start/prerequisites/):

- Clone the repo.
- Install the dependencies with `pnpm install`.
- `pnpm dev` runs the app with hot reload.
- `pnpm build` builds the NSIS installer in `src-tauri/target/release/bundle/nsis`. It is signed for the auto-updater, so set `TAURI_SIGNING_PRIVATE_KEY` (and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) first, or use `pnpm build:unsigned`.
- `pnpm test` runs the backend tests (they use a fake bulb, no hardware needed).

To try the app without a bulb, run `PYTHONIOENCODING=utf-8 python scripts/wiz_emulator.py` and add `127.0.0.1`, `127.0.0.2` and `127.0.0.3` from the *Add device* dialog.

## Troubleshooting 🔨

- The app can't discover the bulb automatically.
  - Windows may have asked to allow the app through the firewall the first time it ran; if that prompt was cancelled, allow *WiZ APP* on private networks in *Windows Security > Firewall > Allow an app*.
  - Set the bulb ip manually. You can find the bulb ip in the [WiZ Mobile APP](https://play.google.com/store/apps/details?id=com.wizconnected.wiz2&pcampaignid=web_share),go to settings > Lights > Your bulb > Device Info > Detailed information.

## Roadmap 🚀

- [ ] Light Mode

## Stack 🛠️

- [![Tauri](https://img.shields.io/badge/Tauri-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/) - Desktop Framework used.
- [![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/) - Backend language (bulb protocol, discovery, config).
- [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/) - Frontend Tooling used.
- [![ReactJS](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/) - Frontend Library used.
- [![Typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) - Language used.
- [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) - CSS Framework used.
- [![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)](https://zustand.docs.pmnd.rs/getting-started/introduction) - State Management used.
- [![I18next](https://img.shields.io/badge/I18next-0D2B3E?style=for-the-badge&logo=i18next&logoColor=white)](https://www.i18next.com/) - Internationalization library used.

## Responsibilities 📖

This app is not affiliated with WiZ in any way.
