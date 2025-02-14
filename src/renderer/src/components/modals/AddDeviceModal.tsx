import { useState } from 'react'
import Modal from '../ui/Modal'

type EditNameModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function EditNameModal({ isOpen, onClose }: EditNameModalProps) {
  const [error, setError] = useState<string | null>(null)
  const areErrors = error !== null

  const validateIP = (ip: string) => {
    if (ip.length <= 0) {
      setError('IP cannot be empty')
      return false
    }

    if (ip.length > 15) {
      setError('IP cannot be longer than 15 characters')
      return false
    }

    if (ip.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/) === null) {
      setError('Invalid IP address')
      return false
    }

    resetError()
    return true
  }

  const resetError = () => {
    if (areErrors) {
      setError(null)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!validateIP(event.target.ip.value)) {
      return
    }

    window.api.setIp(event.target.ip.value)

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add device">
      <form onSubmit={handleSubmit}>
        <label htmlFor="ip" className="text-neutral-400 block mb-2">
          IP
        </label>
        <input
          type="text"
          id="ip"
          name="ip"
          placeholder="e.g. 192.168.1.34"
          onChange={resetError}
          className={`w-full bg-secondary-700 text-white p-2 rounded-lg border ${areErrors ? 'border-red-500' : 'border-neutral-600'} focus:outline-none focus:border-primary focus:border-2 `}
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
            Add
          </button>
        </footer>
      </form>
    </Modal>
  )
}
