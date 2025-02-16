import { useBulbStore } from '@renderer/context/BulbStore'
import { useState } from 'react'
import Modal from '../ui/Modal'

type EditNameModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function EditNameModal({ isOpen, onClose }: EditNameModalProps) {
  const bulb = useBulbStore((state) => state.bulb)
  const setBulbName = useBulbStore((state) => state.setBulbName)

  const [error, setError] = useState<string | null>(null)

  const validateName = (name: string) => {
    if (name.length <= 0) {
      setError('Name cannot be empty')
      return false
    }

    if (name.length > 15) {
      setError('Name cannot be longer than 15 characters')
      return false
    }

    if (name === bulb.name) {
      setError('Name cannot be the same as the current name')
      return false
    }

    resetError()
    return true
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const name = event.target.name.value

    if (!validateName(name)) {
      return
    }

    setBulbName(name)

    window.api.setBulbName(name)

    onClose()
  }

  const areErrors = error !== null

  const resetError = () => {
    if (areErrors) {
      setError(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit bulb name">
      <form onSubmit={handleSubmit}>
        <label htmlFor="name" className="text-neutral-400 block mb-2">
          New name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={bulb.name}
          onChange={resetError}
          placeholder='e.g. "Living room"'
          className={`w-full bg-secondary-700 text-white p-2 rounded-lg border border-neutral-600 focus:outline-none focus:border-primary focus:border-2  ${areErrors ? 'border-red-500' : 'border-neutral-600'}`}
        />
        {areErrors && <p className="text-red-500 text-sm mt-1 ms-1 font-medium">{error}</p>}

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
            Save
          </button>
        </footer>
      </form>
    </Modal>
  )
}
