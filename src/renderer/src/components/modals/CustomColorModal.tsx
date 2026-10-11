import Modal from '@components/ui/Modal'
import { useBulbStore } from '@renderer/context/BulbStore'
import { CustomColor } from '@renderer/bindings/CustomColor'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type ModalCustomColorProps = {
  isOpen: boolean
  onClose: () => void
  editingColor?: CustomColor
}

export default function CustomColorModal({ isOpen, onClose, editingColor }: ModalCustomColorProps) {
  const { t } = useTranslation()
  const addCustomColor = useBulbStore((state) => state.addCustomColor)
  const editCustomColor = useBulbStore((state) => state.editCustomColor)

  const [error, setError] = useState<string | null>(null)
  const [color, setColor] = useState<string>(editingColor?.hex || '#000000')
  const colorInputRef = useRef<HTMLInputElement>(null)
  const areErrors = error !== null

  useEffect(() => {
    setColor(editingColor?.hex || '#000000')
    setError(null)
  }, [editingColor])

  const resetError = () => {
    if (areErrors) {
      setError(null)
    }
  }

  const validateName = (name: string) => {
    if (name.length === 0) {
      setError(t('errors.emptyName'))
      return false
    } else if (name.length > 10) {
      setError(t('errors.customLongName'))
      return false
    }

    return true
  }

  const handleSubmit = (event) => {
    const name = event.target.name.value
    event.preventDefault()

    if (!validateName(name)) {
      return
    }

    if (editingColor) {
      editCustomColor(editingColor.id, name, color)
    } else {
      addCustomColor(name, color)
    }

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingColor ? t('scenes.custom.edit.title') : t('scenes.custom.add.title')}
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="name" className="text-neutral-400 block mb-2">
          {editingColor ? t('scenes.custom.edit.label') : t('scenes.custom.add.nameLabel')}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder={t('scenes.custom.add.nameExample')}
          defaultValue={editingColor?.name}
          onChange={resetError}
          className={`w-full bg-secondary-700 text-white p-2 rounded-lg border ${areErrors ? 'border-red-500' : 'border-neutral-600'} focus:outline-none focus:border-primary focus:border-2 `}
        />

        {areErrors && <p className="text-red-500 text-sm mt-1 ms-1 font-medium">{error}</p>}

        <label htmlFor="color" className="text-neutral-400 block mt-4 mb-2">
          {t('scenes.custom.add.colorLabel')}
        </label>

        <div
          className="w-fit px-4 bg-secondary-700 h-12 text-white p-2 rounded-lg border-neutral-600 border flex items-center gap-2 cursor-pointer hover:bg-secondary-600"
          onClick={() => colorInputRef.current?.click()}
        >
          <input
            type="color"
            id="color"
            name="color"
            ref={colorInputRef}
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-8 w-8"
          />
          <p>{color}</p>
        </div>

        <footer className="flex items-center justify-end gap-2 mt-6">
          <button
            className="text-white mt-4 mr-2 cursor-pointer transition-colors bg-secondary hover:bg-secondary-600 py-2 px-4 rounded-lg"
            type="button"
            onClick={onClose}
          >
            {t('modals.cancel')}
          </button>
          <button
            type="submit"
            className="mt-4 px-4 bg-primary rounded-lg text-white py-2 transition-colors cursor-pointer font-medium hover:bg-primary-600"
          >
            {editingColor ? t('modals.save') : t('modals.add')}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
