import Modal from '../ui/Modal'

type DeleteDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export default function DeleteDialog({ isOpen, onClose }: DeleteDialogProps) {
  // TODO: Implement delete bulb functionality

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete bulb">
      <p className="text-neutral-400">Are you sure you want to delete this bulb?</p>

      <footer className="flex items-center justify-end gap-4 mt-4">
        <button
          className="text-white mt-4 cursor-pointer transition-colors bg-secondary hover:bg-secondary-600 py-2 px-4 rounded-lg"
          type="button"
          onClick={onClose}
        >
          Cancel
        </button>
        <button className="mt-4 px-4 bg-alert rounded-lg text-white py-2 transition-colors cursor-pointer font-medium hover:bg-red-500">
          Delete
        </button>
      </footer>
    </Modal>
  )
}
