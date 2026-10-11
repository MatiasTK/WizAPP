import CommandPalette from '@components/CommandPalette'
import HelpDialog from '@components/modals/HelpModal'
import SettingsDialog from '@components/modals/SettingsModal'
import Sidebar from '@components/ui/Sidebar'
import { ToastContainer } from '@components/ui/Toast'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useOverlayStore } from '@renderer/context/OverlayStore'
import { api } from '@renderer/lib/api'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'

const PAGE_TITLES: Record<string, string> = {
  '/': 'sidebar.home',
  '/scenes': 'sidebar.scenes',
  '/information': 'sidebar.information'
}

export default function Layout() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const isReady = useBulbStore((s) => s.isReady)
  const mainRef = useRef<HTMLElement>(null)
  const firstRoute = useRef(true)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // The window starts hidden; show it once the first state and the fonts are in. A hidden
  // webview does not run requestAnimationFrame, so a short timer stands in for "painted".
  useEffect(() => {
    if (!isReady) return
    void (document.fonts?.ready ?? Promise.resolve()).then(() => {
      window.setTimeout(() => void api.showWindow(), 50)
    })
  }, [isReady])

  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  // New page: announce it through the title and move the focus to the content.
  useEffect(() => {
    document.title = `${t(PAGE_TITLES[pathname] ?? 'sidebar.home')} - WiZ APP`
    if (firstRoute.current) {
      firstRoute.current = false
      return
    }
    mainRef.current?.focus()
  }, [pathname, t])

  // Ctrl+K opens the quick search, unless another dialog is already open.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      if (useOverlayStore.getState().depth > 0) return
      setSearchOpen(true)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-full bg-bg text-fg">
      <Sidebar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <main ref={mainRef} tabIndex={-1} className="min-w-0 grow overflow-y-auto focus:outline-none">
        <Outlet />
      </main>

      <ToastContainer />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
