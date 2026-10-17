import AlertDialog from '@components/ui/AlertDialog'
import Button from '@components/ui/Button'
import Dialog from '@components/ui/Dialog'
import SegmentedControl from '@components/ui/SegmentedControl'
import type { LanguagePref } from '@renderer/bindings/LanguagePref'
import type { Theme } from '@renderer/bindings/Theme'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuTrash2 } from 'react-icons/lu'

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

  const choice = (id: string, label: string, control: ReactNode) => (
    <div className="flex flex-col gap-2">
      <span id={id} className="font-semibold">
        {label}
      </span>
      {control}
    </div>
  )

  const action = (id: string, label: string, hint: string, control: ReactNode) => (
    <div className="flex items-center gap-4 border-t border-border pt-3.5">
      <div className="min-w-0 grow">
        <p id={id} className="font-semibold">
          {label}
        </p>
        <p className="text-[13px] text-muted">{hint}</p>
      </div>
      {control}
    </div>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} title={t('settings.title')}>
        <div className="flex flex-col gap-[18px]">
          {choice(
            'setting-theme',
            t('settings.theme.title'),
            <SegmentedControl<Theme>
              fill
              aria-labelledby="setting-theme"
              value={settings.theme}
              onValueChange={(v) => void setTheme(v)}
              segments={[
                { value: 'system', label: t('settings.theme.system') },
                { value: 'light', label: t('settings.theme.light') },
                { value: 'dark', label: t('settings.theme.dark') }
              ]}
            />
          )}
          {choice(
            'setting-language',
            t('settings.language.title'),
            <SegmentedControl<LanguagePref>
              fill
              aria-labelledby="setting-language"
              value={settings.language}
              onValueChange={(v) => void setLanguage(v)}
              segments={[
                { value: 'auto', label: t('settings.language.auto') },
                { value: 'es', label: t('settings.language.spanish') },
                { value: 'en', label: t('settings.language.english') }
              ]}
            />
          )}
          {action(
            'setting-search',
            t('settings.search.title'),
            t('settings.search.hint'),
            <Button aria-describedby="setting-search" onClick={handleSearchAgain}>
              {t('settings.search.button')}
            </Button>
          )}
          {action(
            'setting-delete',
            t('settings.deleteProfile.title'),
            t('settings.deleteProfile.hint'),
            <Button variant="danger-soft" onClick={() => setConfirmDelete(true)}>
              <LuTrash2 size={15} aria-hidden />
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
