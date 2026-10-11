import Modal from '@components/ui/Modal'
import Separator from '@components/ui/Separator'
import { api } from '@renderer/lib/api'
import { getVersion } from '@tauri-apps/api/app'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuDownload, LuFolder, LuGithub, LuLoaderCircle, LuUser } from 'react-icons/lu'

type AboutModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function HelpModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useTranslation()
  const [updateMsg, setUpdateMsg] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(null))
  }, [])

  const handleOpenAppFolder = () => {
    void api.openAppFolder()
  }

  // The webview would navigate in place; hand https links to the system browser.
  const handleOpenLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    void openUrl(event.currentTarget.href)
  }

  const handleCheckForUpdates = () => {
    setIsChecking(true)
    api
      .checkForUpdates()
      .then((updateFound) => {
        // When there is an update the backend pins a toast with "update now".
        if (!updateFound) {
          setUpdateMsg(t('help.noUpdates'))

          setTimeout(() => {
            setUpdateMsg(null)
          }, 5000)
        }
      })
      .catch(() => {
        setUpdateMsg(t('toast.error.updater'))
        setTimeout(() => setUpdateMsg(null), 5000)
      })
      .finally(() => setIsChecking(false))
  }

  const updateToast = (msg) => (
    <div className="fixed -bottom-14 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white px-4 py-2 font-medium rounded-lg shadow-lg animated animate-fade-in whitespace-nowrap">
      {msg}
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="WiZ App" maxWidth="max-w-sm">
      <p className="text-sm text-neutral-500 font-medium -mt-6">
        {t('help.version')}: {version ?? '—'} (Windows)
      </p>

      <Separator />

      <article className="flex flex-col gap-1 mt-8">
        <div className="flex items-center gap-2">
          <LuGithub size={24} />
          <p>{t('help.source')}:</p>
          <a
            href="https://github.com/MatiasTK/WizAPP"
            rel="noreferrer"
            target="_blank"
            onClick={handleOpenLink}
            className="text-primary underline"
          >
            Github
          </a>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <LuUser size={24} />
          <p>{t('help.author')}:</p>
          <p>
            Matias Vallejos (
            <a
              href="https://github.com/MatiasTK"
              rel="noreferrer"
              target="_blank"
              onClick={handleOpenLink}
              className="text-primary underline"
            >
              MatiasTK
            </a>
            )
          </p>
        </div>

        <button
          className="flex items-center gap-2 mt-4 bg-primary text-white px-4 py-2 rounded-lg w-fit font-medium cursor-pointer hover:bg-primary-600"
          onClick={handleOpenAppFolder}
        >
          <LuFolder size={20} />
          <p>{t('help.openFolder')}</p>
        </button>

        <button
          className="flex items-center gap-2 mt-4 bg-primary text-white px-4 py-2 rounded-lg w-fit font-medium cursor-pointer hover:bg-primary-600 disabled:cursor-not-allowed"
          onClick={handleCheckForUpdates}
          disabled={isChecking}
        >
          {isChecking ? (
            <LuLoaderCircle
              size={20}
              className="animated animate-spin-clockwise animate-iteration-count-infinite animate-duration-700"
            />
          ) : (
            <LuDownload size={20} />
          )}
          {isChecking ? <p>{t('help.checkingUpdates')}</p> : <p>{t('help.checkUpdates')}</p>}
        </button>

        {updateMsg && updateToast(updateMsg)}
      </article>
    </Modal>
  )
}
