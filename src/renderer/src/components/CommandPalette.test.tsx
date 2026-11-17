import CommandPalette from '@components/CommandPalette'
import i18n from '@i18n/index'
import { makeBulb, makeState, renderApp, resetStore, seedStore } from '@renderer/test/fixtures'
import { api } from '@renderer/test/mockApi'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@renderer/lib/api', () => import('@renderer/test/mockApi'))

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
  seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk' })]))
})

describe('Command palette', () => {
  it('lists favorites first when the field is empty', () => {
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Warm white')
    expect(options[1]).toHaveTextContent('Daylight')
  })

  it('filters, moves with the arrows and applies with Enter without the mouse', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={onOpenChange}
      />
    )

    await user.keyboard('oce')
    const combo = screen.getByRole('combobox')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(combo.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option').id)

    await user.keyboard('{Enter}')
    expect(api.setScene).toHaveBeenCalledWith(1, '127.0.0.1')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('moves the selection with the arrow keys', async () => {
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowUp}{ArrowUp}')
    const last = screen.getAllByRole('option').at(-1)
    expect(last).toHaveAttribute('aria-selected', 'true')
  })

  it('finds scenes by their name in the current language, with or without accents', async () => {
    await i18n.changeLanguage('es')
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )
    await i18n.changeLanguage('es')

    await user.keyboard('luz de dia')
    expect(screen.getByRole('option', { name: /Luz de día/ })).toBeInTheDocument()

    await user.clear(screen.getByRole('combobox'))
    await user.keyboard('Océano')
    expect(screen.getByRole('option', { name: /Océano/ })).toBeInTheDocument()
    await i18n.changeLanguage('en')
  })

  it('switches the active bulb and powers everything off', async () => {
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    await user.keyboard('desk')
    await user.click(screen.getByRole('option', { name: /Desk.*Use in Scenes/ }))
    expect(api.setActiveBulb).toHaveBeenCalledWith('127.0.0.2')
  })

  it('puts a bulb typed by name before the scenes that only mention it', async () => {
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    await user.keyboard('living')
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Living')
    expect(screen.queryByRole('option', { name: /Apply to Living/ })).not.toBeInTheDocument()
  })

  it('opens settings from the palette', async () => {
    const user = userEvent.setup()
    const onOpenSettings = vi.fn()
    renderApp(
      <CommandPalette
        onOpenSettings={onOpenSettings}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    await user.keyboard('settings{Enter}')
    expect(onOpenSettings).toHaveBeenCalled()
  })

  it('applies a scene to another bulb named in the query', async () => {
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    await user.keyboard('ocean desk')
    await user.click(screen.getByRole('option', { name: /Ocean.*Apply to Desk/ }))
    expect(api.setScene).toHaveBeenCalledWith(1, '127.0.0.2')
  })

  it('applies a scene to the active bulb when the query names it', async () => {
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    await user.keyboard('ocean living')
    await user.click(screen.getByRole('option', { name: /Ocean.*Apply to Living/ }))
    expect(api.setScene).toHaveBeenCalledWith(1, '127.0.0.1')
  })

  it('sets a typed brightness for a named bulb', async () => {
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    await user.keyboard('living 80')
    await user.click(screen.getByRole('option', { name: /80%.*Living/ }))
    expect(api.setBrightness).toHaveBeenCalledWith(80, '127.0.0.1')
  })

  it('reads "30%" without a space as a brightness', async () => {
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    await user.keyboard('30%')
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('30%')
  })

  it('offers Retry for an offline bulb typed by name', async () => {
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk', online: false })]))
    const user = userEvent.setup()
    renderApp(
      <CommandPalette
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
        open
        onOpenChange={() => undefined}
      />
    )

    await user.keyboard('desk')
    await user.click(screen.getByRole('option', { name: /Desk.*Offline · Retry/ }))
    expect(api.probeBulb).toHaveBeenCalledWith('127.0.0.2')
  })
})
