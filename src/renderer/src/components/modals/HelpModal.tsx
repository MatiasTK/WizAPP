import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import InlineAlert from '@components/ui/InlineAlert'
import Spinner from '@components/ui/Spinner'
import { useBulbStore } from '@renderer/context/BulbStore'
import { api } from '@renderer/lib/api'
import { getVersion } from '@tauri-apps/api/app'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuDownload, LuFolder } from 'react-icons/lu'

type HelpModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const LINKS = [
  { href: 'https://github.com/MatiasTK/WizAPP', key: 'help.source', label: 'GitHub' },
  { href: 'https://github.com/MatiasTK', key: 'help.author', label: 'MatiasTK' }
] as const

export default function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const { t } = useTranslation()
  const pushToast = useBulbStore((s) => s.pushToast)
  const [version, setVersion] = useState<string | null>(null)
  const [hasLegacy, setHasLegacy] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(null))
  }, [])

  // Re-checked whenever the dialog opens, so the notice goes away after uninstalling.
  useEffect(() => {
    if (open) void api.hasLegacyInstall().then(setHasLegacy)
  }, [open])

  // The webview would navigate in place; hand links to the system browser.
  const handleOpenLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    void openUrl(event.currentTarget.href)
  }

  const handleCheckForUpdates = () => {
    setIsChecking(true)
    api
      .checkForUpdates()
      // When there is an update the backend pins a toast with "update now".
      .then((found) => {
        if (!found) pushToast('help.noUpdates', 'info')
      })
      .catch(() => pushToast('toast.error.updater', 'error'))
      .finally(() => setIsChecking(false))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="WiZ APP"
      description={`${t('help.version')} ${version ?? '-'}`}
    >
      <div className="flex flex-col gap-4">
        {hasLegacy && (
          <InlineAlert
            tone="warning"
            action={
              <Button size="dense" onClick={() => void api.openAppsSettings()}>
                {t('toast.openSettings')}
              </Button>
            }
          >
            {t('toast.legacyInstallFound')}
          </InlineAlert>
        )}

        <ul className="flex flex-col gap-1 text-sm">
          {LINKS.map((link) => (
            <li key={link.href}>
              {t(link.key)}:{' '}
              <a
                href={link.href}
                onClick={handleOpenLink}
                className="font-medium text-primary-text underline underline-offset-2"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void api.openAppFolder()}>
            <LuFolder size={16} aria-hidden />
            {t('help.openFolder')}
          </Button>
          <Button disabled={isChecking} onClick={handleCheckForUpdates}>
            {isChecking ? <Spinner /> : <LuDownload size={16} aria-hidden />}
            {isChecking ? t('help.checkingUpdates') : t('help.checkUpdates')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
