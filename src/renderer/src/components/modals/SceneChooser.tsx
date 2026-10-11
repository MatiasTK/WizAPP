import ScenePicker from '@components/ScenePicker'
import Dialog from '@components/ui/Dialog'
import type { BulbState } from '@renderer/bindings/BulbState'
import { useTranslation } from 'react-i18next'

type SceneChooserProps = {
  bulb: BulbState | null
  onOpenChange: (open: boolean) => void
}

/** Scene picker for one bulb, opened from the scene chip of its row. */
export default function SceneChooser({ bulb, onOpenChange }: SceneChooserProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={bulb !== null}
      onOpenChange={onOpenChange}
      title={t('bulb.sceneFor', { name: bulb?.name ?? '' })}
      className="max-w-3xl"
    >
      {/* Inside the dialog the tiles sit one step darker so their edges read. */}
      <div className="[--surface:var(--sunken)]">
        <ScenePicker bulb={bulb} showFavorites={false} />
      </div>
    </Dialog>
  )
}
