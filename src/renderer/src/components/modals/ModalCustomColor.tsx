import { CustomColor } from '@/types/customColor'
import { useBulbStore } from '@renderer/context/BulbStore'
import { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal'

type ModalCustomColorProps = {
  isOpen: boolean
  onClose: () => void
  editingColor?: CustomColor
}

export default function ModalCustomColor({ isOpen, onClose, editingColor }: ModalCustomColorProps) {
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
      setError('Name is required')
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Color">
      <form onSubmit={handleSubmit}>
        <label htmlFor="name" className="text-neutral-400 block mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="e.g. Red"
          defaultValue={editingColor?.name}
          onChange={resetError}
          className={`w-full bg-secondary-700 text-white p-2 rounded-lg border ${areErrors ? 'border-red-500' : 'border-neutral-600'} focus:outline-none focus:border-primary focus:border-2 `}
        />

        {areErrors && <p className="text-red-500 text-sm mt-1 ms-1 font-medium">{error}</p>}

        <label htmlFor="color" className="text-neutral-400 block mt-4 mb-2">
          Color
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
            Cancel
          </button>
          <button
            type="submit"
            className="mt-4 px-4 bg-primary rounded-lg text-white py-2 transition-colors cursor-pointer font-medium hover:bg-primary-600"
          >
            Add
          </button>
        </footer>
      </form>
    </Modal>
  )
}
