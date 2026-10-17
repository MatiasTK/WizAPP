import type { Theme } from '@renderer/bindings/Theme'

const query = () => window.matchMedia?.('(prefers-color-scheme: dark)')

export const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'light' || theme === 'dark') return theme
  return query()?.matches ? 'dark' : 'light'
}

let stopWatching: (() => void) | null = null

/** Sets `data-theme` on <html>; with `system` it keeps following the OS. */
export const applyTheme = (theme: Theme): void => {
  stopWatching?.()
  stopWatching = null

  const set = () => {
    document.documentElement.dataset.theme = resolveTheme(theme)
  }
  set()

  if (theme !== 'system') return
  const media = query()
  media?.addEventListener('change', set)
  stopWatching = () => media?.removeEventListener('change', set)
}
