import { create } from 'zustand'

/** Counts open modals (Ctrl+K must not open over another dialog). */
interface OverlayStore {
  depth: number
  /** Registers an open modal; returns the function that unregisters it. */
  enter: () => () => void
}

export const useOverlayStore = create<OverlayStore>((set) => ({
  depth: 0,
  enter: () => {
    set((s) => ({ depth: s.depth + 1 }))
    return () => set((s) => ({ depth: Math.max(0, s.depth - 1) }))
  }
}))
