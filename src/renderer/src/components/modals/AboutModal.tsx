import { LuDownload, LuFolder, LuGithub, LuUser } from 'react-icons/lu'
import Modal from '../ui/Modal'
import Separator from '../ui/Separator'

type AboutModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="WiZ App">
      <p className="text-sm text-neutral-500 font-medium">Version: 3.0.0 (Windows)</p>

      <Separator />

      <article className="flex flex-col gap-2 mt-10">
        <div className="flex items-center gap-2">
          <LuGithub size={20} />
          <p>Source code:</p>
          <a className="text-primary underline">Github</a>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <LuUser size={20} />
          <p>Author:</p>
          <p>
            Matias Vallejos (<a className="text-primary underline">MatiasTK</a>)
          </p>
        </div>

        <button className="flex items-center gap-2 mt-4 bg-primary text-white px-4 py-2 rounded-lg w-fit font-medium">
          <LuFolder size={20} />
          <p>Open program folder</p>
        </button>

        <button className="flex items-center gap-2 mt-4 bg-primary text-white px-4 py-2 rounded-lg w-fit font-medium">
          <LuDownload size={20} />
          <p>Check for updates</p>
        </button>
      </article>
    </Modal>
  )
}
