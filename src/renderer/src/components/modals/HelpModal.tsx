import Logo from '@components/Logo'
import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import InlineAlert from '@components/ui/InlineAlert'
import Spinner from '@components/ui/Spinner'
import { useBulbStore } from '@renderer/context/BulbStore'
import { api } from '@renderer/lib/api'
import { cn, focusRing } from '@renderer/lib/cn'
import { getVersion } from '@tauri-apps/api/app'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type HelpModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SOURCE_URL = 'https://github.com/MatiasTK/WizAPP'
const AUTHOR_URL = 'https://github.com/MatiasTK'

const kbd = 'rounded-[6px] border border-border px-1.5 py-px font-sans text-xs text-fg'

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
    <Dialog open={open} onOpenChange={onOpenChange} title={t('sidebar.help')}>
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-center gap-3.5">
          <Logo size={44} className="pt-2" />
          <p className="text-muted">
            {t('help.version', { version: version ?? '-' })} · {t('help.author')}{' '}
            <a
              href={AUTHOR_URL}
              onClick={handleOpenLink}
              className={cn('rounded-sm text-primary-text hover:underline', focusRing)}
            >
              MatiasTK
            </a>
          </p>
        </div>

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

        <section aria-labelledby="help-shortcuts" className="flex flex-col gap-1.5">
          <h3 id="help-shortcuts" className="font-semibold">
            {t('help.shortcuts')}
          </h3>
          <dl className="flex flex-col gap-1.5 text-muted">
            <div className="flex justify-between">
              <dt>{t('help.shortcutSearch')}</dt>
              <dd>
                <kbd className={kbd}>Ctrl K</kbd>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>{t('help.shortcutClose')}</dt>
              <dd>
                <kbd className={kbd}>Esc</kbd>
              </dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" disabled={isChecking} onClick={handleCheckForUpdates}>
            {isChecking && <Spinner />}
            {isChecking ? t('help.checkingUpdates') : t('help.checkUpdates')}
          </Button>
          <Button onClick={() => void api.openAppFolder()}>{t('help.openFolder')}</Button>
          <a
            href={SOURCE_URL}
            onClick={handleOpenLink}
            className={cn(
              'flex h-9 items-center rounded-sm px-2 font-semibold text-primary-text hover:underline',
              focusRing
            )}
          >
            {t('help.source')}
          </a>
        </div>
      </div>
    </Dialog>
  )
}
