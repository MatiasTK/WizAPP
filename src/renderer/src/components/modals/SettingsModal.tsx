import AlertDialog from '@components/ui/AlertDialog'
import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import Select from '@components/ui/Select'
import type { LanguagePref } from '@renderer/bindings/LanguagePref'
import type { Theme } from '@renderer/bindings/Theme'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type SettingsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { t } = useTranslation()
  const settings = useBulbStore((s) => s.settings)
  const setTheme = useBulbStore((s) => s.setTheme)
  const setLanguage = useBulbStore((s) => s.setLanguage)
  const retryDiscovery = useBulbStore((s) => s.retryDiscovery)
  const deleteProfile = useBulbStore((s) => s.deleteProfile)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSearchAgain = () => {
    onOpenChange(false)
    void retryDiscovery()
  }

  const handleDeleteProfile = () => {
    setConfirmDelete(false)
    onOpenChange(false)
    void deleteProfile()
  }

  const row = (id: string, label: string, hint: string | null, control: React.ReactNode) => (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p id={id} className="text-sm font-medium">
          {label}
        </p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {control}
    </div>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} title={t('settings.title')}>
        <div className="flex flex-col gap-5">
          {row(
            'setting-theme',
            t('settings.theme.title'),
            null,
            <Select
              aria-labelledby="setting-theme"
              value={settings.theme}
              onValueChange={(v) => void setTheme(v as Theme)}
              options={[
                { value: 'system', label: t('settings.theme.system') },
                { value: 'light', label: t('settings.theme.light') },
                { value: 'dark', label: t('settings.theme.dark') }
              ]}
            />
          )}
          {row(
            'setting-language',
            t('settings.language.title'),
            null,
            <Select
              aria-labelledby="setting-language"
              value={settings.language}
              onValueChange={(v) => void setLanguage(v as LanguagePref)}
              options={[
                { value: 'auto', label: t('settings.language.auto') },
                { value: 'en', label: t('settings.language.english') },
                { value: 'es', label: t('settings.language.spanish') }
              ]}
            />
          )}
          {row(
            'setting-search',
            t('settings.search.title'),
            t('settings.search.hint'),
            <Button aria-labelledby="setting-search" onClick={handleSearchAgain}>
              {t('settings.search.button')}
            </Button>
          )}
          {row(
            'setting-delete',
            t('settings.deleteProfile.title'),
            t('settings.deleteProfile.hint'),
            <Button
              variant="destructive"
              aria-labelledby="setting-delete"
              onClick={() => setConfirmDelete(true)}
            >
              {t('settings.deleteProfile.button')}
            </Button>
          )}
        </div>
      </Dialog>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('settings.deleteProfile.title')}
        description={t('settings.deleteProfile.description')}
        confirmLabel={t('settings.deleteProfile.confirm')}
        onConfirm={handleDeleteProfile}
      />
    </>
  )
}
