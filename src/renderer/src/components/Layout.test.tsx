import Layout from '@components/Layout'
import { useOverlayStore } from '@renderer/context/OverlayStore'
import { makeBulb, makeState, renderApp, resetStore, seedStore } from '@renderer/test/fixtures'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@renderer/lib/api', () => import('@renderer/test/mockApi'))

const PALETTE = 'Search scenes, bulbs and actions'

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
  seedStore(makeState([makeBulb()]))
})

describe('Layout', () => {
  it('opens the quick search with Ctrl+K and only registers open modals', async () => {
    const user = userEvent.setup()
    renderApp(<Layout />)
    expect(useOverlayStore.getState().depth).toBe(0)

    await user.keyboard('{Control>}k{/Control}')
    expect(await screen.findByRole('combobox', { name: PALETTE })).toBeInTheDocument()
    expect(useOverlayStore.getState().depth).toBe(1)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('combobox', { name: PALETTE })).not.toBeInTheDocument()
    expect(useOverlayStore.getState().depth).toBe(0)
  })

  it('does not open the quick search over another dialog', async () => {
    const user = userEvent.setup()
    renderApp(<Layout />)

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(await screen.findByRole('dialog', { name: 'Settings' })).toBeInTheDocument()

    await user.keyboard('{Control>}k{/Control}')
    expect(screen.queryByRole('combobox', { name: PALETTE })).not.toBeInTheDocument()
  })

  it('shows the toasts above an open dialog', async () => {
    const user = userEvent.setup()
    renderApp(<Layout />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await screen.findByRole('dialog', { name: 'Settings' })

    const { useBulbStore } = await import('@renderer/context/BulbStore')
    useBulbStore.getState().pushToast('help.noUpdates', 'info')

    const toast = await screen.findByText(/latest version/)
    expect(toast).toHaveTextContent('latest version')
    // Not hidden from assistive technology by the modal.
    expect(toast.closest('[aria-hidden="true"]')).toBeNull()
  })
})
