import ScenePicker from '@components/ScenePicker'
import Button from '@components/ui/Button'
import InlineAlert from '@components/ui/InlineAlert'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useCatalog } from '@renderer/lib/catalog'
import { useTranslation } from 'react-i18next'
import { LuUsers } from 'react-icons/lu'
import { Link } from 'react-router'

export default function Scenes() {
  const { t } = useTranslation()
  const bulb = useBulbStore((s) => s.activeBulb)
  const bulbCount = useBulbStore((s) => s.bulbs.length)
  const applyToAll = useBulbStore((s) => s.applyToAll)
  const probeBulb = useBulbStore((s) => s.probeBulb)
  const { byId } = useCatalog()

  const current = bulb && bulb.sceneId > 0 ? byId.get(bulb.sceneId) : undefined

  const renderNotice = () => {
    if (bulbCount === 0) {
      return (
        <InlineAlert
          tone="warning"
          action={
            <Link
              to="/"
              className="text-sm font-medium text-primary-text underline underline-offset-2"
            >
              {t('scenes.goToBulbs')}
            </Link>
          }
        >
          {t('scenes.noBulbs')}
        </InlineAlert>
      )
    }
    if (bulb && !bulb.online) {
      return (
        <InlineAlert
          tone="danger"
          action={
            <Button size="dense" onClick={() => void probeBulb(bulb.ip)}>
              {t('bulb.retry')}
            </Button>
          }
        >
          {t('bulb.offline', { name: bulb.name })}
        </InlineAlert>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('scenes.title')}</h1>
          <p className="mt-1 text-base text-muted">
            {bulb ? t('scenes.subtitleFor', { name: bulb.name }) : t('scenes.subtitle')}
          </p>
        </div>
        <Button
          disabled={!current || !bulb?.online || bulbCount < 2}
          onClick={() => current && void applyToAll(current.id)}
        >
          <LuUsers size={16} aria-hidden />
          {current ? t('scenes.applyToAll', { name: current.name }) : t('scenes.applyToAllEmpty')}
        </Button>
      </header>

      {renderNotice()}

      <ScenePicker bulb={bulb} />
    </div>
  )
}
