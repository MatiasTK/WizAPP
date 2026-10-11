import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// The renderer talks to Rust only through `lib/api`; tests replace the Tauri modules so
// importing the store never needs a backend.
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(() => Promise.resolve()) }))
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn(() => Promise.resolve(() => undefined)) }))
vi.mock('@tauri-apps/api/app', () => ({ getVersion: vi.fn(() => Promise.resolve('0.0.0')) }))
vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn() }))
vi.mock('@tauri-apps/plugin-log', () => ({ debug: vi.fn(() => Promise.resolve()) }))

// jsdom lacks a few browser APIs that Radix UI and dnd-kit rely on.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false
})) as unknown as typeof window.matchMedia

Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => undefined
Element.prototype.releasePointerCapture ??= () => undefined
Element.prototype.scrollIntoView ??= () => undefined

afterEach(() => cleanup())
