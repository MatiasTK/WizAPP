import AlertDialog from '@components/ui/AlertDialog'
import Dialog from '@components/ui/Dialog'
import Menu from '@components/ui/Menu'
import Slider from '@components/ui/Slider'
import { renderApp } from '@renderer/test/fixtures'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

function Nested() {
  const [outer, setOuter] = useState(false)
  const [inner, setInner] = useState(false)
  return (
    <>
      <button onClick={() => setOuter(true)}>open outer</button>
      <Dialog open={outer} onOpenChange={setOuter} title="Outer">
        <button onClick={() => setInner(true)}>open inner</button>
        <input aria-label="outer field" />
      </Dialog>
      <AlertDialog
        open={inner}
        onOpenChange={setInner}
        title="Inner"
        description="Are you sure?"
        confirmLabel="Do it"
        onConfirm={() => undefined}
      />
    </>
  )
}

describe('Dialog', () => {
  it('moves focus in, traps it and gives it back to the trigger', async () => {
    const user = userEvent.setup()
    renderApp(<Nested />)

    const trigger = screen.getByRole('button', { name: 'open outer' })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Outer' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    // Tabbing many times never leaves the dialog.
    for (let i = 0; i < 6; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Outer' })).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes only the topmost dialog on Escape and starts on Cancel', async () => {
    const user = userEvent.setup()
    renderApp(<Nested />)

    await user.click(screen.getByRole('button', { name: 'open outer' }))
    await user.click(await screen.findByRole('button', { name: 'open inner' }))

    const alert = await screen.findByRole('alertdialog', { name: 'Inner' })
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(alert).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument()
  })
})

describe('Menu', () => {
  it('opens and is operated with arrows, Enter and Escape', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    const onDelete = vi.fn()
    renderApp(
      <Menu
        trigger={<button>options</button>}
        items={[
          { label: 'Rename', onSelect: onRename },
          { label: 'Delete', onSelect: onDelete }
        ]}
      />
    )

    const trigger = screen.getByRole('button', { name: 'options' })
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('menu')).toBeInTheDocument()

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('Slider', () => {
  it('emits the value when changed with the keyboard', () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()
    renderApp(
      <Slider
        aria-label="Brightness"
        value={50}
        min={10}
        max={100}
        step={10}
        onValueChange={onChange}
        onValueCommit={onCommit}
      />
    )

    const thumb = screen.getByRole('slider', { name: 'Brightness' })
    thumb.focus()
    fireEvent.keyDown(thumb, { key: 'ArrowRight' })

    expect(onChange).toHaveBeenCalledWith(60)
    expect(onCommit).toHaveBeenCalledWith(60)
  })
})
