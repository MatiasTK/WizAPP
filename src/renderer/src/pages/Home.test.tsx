import { moveItem } from '@components/SortList'
import Home from '@pages/Home'
import { useBulbStore } from '@renderer/context/BulbStore'
import { api } from '@renderer/test/mockApi'
import { makeBulb, makeState, renderApp, resetStore, seedStore } from '@renderer/test/fixtures'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@renderer/lib/api', () => import('@renderer/test/mockApi'))

const card = (name: string) => within(screen.getByRole('article', { name }))

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
})

describe('bulb cards', () => {
  it('shows an offline bulb with Retry and no controls, and it does not open', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk', online: false })]))
    renderApp(<Home />)

    const desk = card('Desk')
    expect(desk.getByText('Offline')).toBeInTheDocument()
    expect(desk.queryByRole('button', { name: /Power for Desk/ })).not.toBeInTheDocument()
    expect(desk.queryByRole('button', { name: 'Open Desk' })).not.toBeInTheDocument()
    expect(desk.queryByRole('button', { name: /Apply .* to Desk/ })).not.toBeInTheDocument()

    await user.click(desk.getByRole('button', { name: /Retry connecting to Desk/ }))
    expect(api.probeBulb).toHaveBeenCalledWith('127.0.0.2')
  })

  it('turns a bulb on without making it the active one', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk', state: false })]))
    renderApp(<Home />)

    const power = screen.getByRole('button', { name: 'Power for Desk' })
    expect(power).toHaveAttribute('aria-pressed', 'false')
    await user.click(power)

    expect(api.toggleBulbByIp).toHaveBeenCalledWith('127.0.0.2')
    expect(api.setActiveBulb).not.toHaveBeenCalled()
  })

  it('opens the active bulb by default, and one card at a time', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk' })]))
    renderApp(<Home />)

    // Living is the active bulb.
    expect(screen.getByRole('button', { name: 'Close Living' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(card('Living').getByRole('slider', { name: 'Brightness of Living' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open Desk' }))
    expect(api.setActiveBulb).toHaveBeenCalledWith('127.0.0.2')
    expect(screen.getByRole('button', { name: 'Close Desk' })).toBeInTheDocument()
    expect(card('Living').queryByRole('slider')).not.toBeInTheDocument()
  })

  it('keeps the active card closed once closed, until the active bulb changes', async () => {
    const user = userEvent.setup()
    const living = makeBulb()
    const desk = makeBulb({ ip: '127.0.0.2', name: 'Desk' })
    seedStore(makeState([living, desk]))
    renderApp(<Home />)

    await user.click(screen.getByRole('button', { name: 'Close Living' }))
    expect(screen.getByRole('button', { name: 'Open Living' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Desk' })).toBeInTheDocument()

    // Picked from the sidebar: the new active bulb opens.
    act(() => seedStore(makeState([living, desk], { activeBulb: desk })))
    expect(screen.getByRole('button', { name: 'Close Desk' })).toBeInTheDocument()
  })

  it('does not open an offline active bulb', () => {
    seedStore(makeState([makeBulb({ online: false })]))
    renderApp(<Home />)

    expect(card('Living').queryByRole('slider')).not.toBeInTheDocument()
  })

  it('applies a favorite and a brightness preset to that bulb only', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk' })]))
    renderApp(<Home />)

    // Closed card: the favorite swatches.
    await user.click(screen.getByRole('button', { name: 'Apply Daylight to Desk' }))
    expect(api.setScene).toHaveBeenCalledWith(12, '127.0.0.2')

    await user.click(screen.getByRole('button', { name: 'Open Desk' }))
    await user.click(card('Desk').getByRole('button', { name: 'Set Desk to 75 %' }))
    expect(api.setBrightness).toHaveBeenCalledWith(75, '127.0.0.2')
  })

  it('renames, shows details and asks before removing from the open card', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb()]))
    renderApp(<Home />)

    // The active bulb starts open.
    await user.click(screen.getByRole('button', { name: 'Details' }))
    const details = await screen.findByRole('dialog', { name: 'Living' })
    expect(within(details).getByText('127.0.0.1')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Remove Living' })
    await user.click(within(confirm).getByRole('button', { name: 'Remove bulb' }))
    expect(api.deleteBulb).toHaveBeenCalledWith('127.0.0.1')
  })

  it('turns every bulb on or off from the toolbar', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk' })]))
    renderApp(<Home />)

    await user.click(screen.getByRole('button', { name: 'Turn all off' }))
    expect(api.setAllBulbs).toHaveBeenCalledWith(false)
    await user.click(screen.getByRole('button', { name: 'Turn all on' }))
    expect(api.setAllBulbs).toHaveBeenCalledWith(true)
  })
})

describe('sort mode', () => {
  const three = () =>
    seedStore(
      makeState([
        makeBulb(),
        makeBulb({ ip: '127.0.0.2', name: 'Desk' }),
        makeBulb({ ip: '127.0.0.3', name: 'Hall' })
      ])
    )

  it('swaps the grid for a numbered list moved with the up/down buttons', async () => {
    const user = userEvent.setup()
    three()
    renderApp(<Home />)

    await user.click(screen.getByRole('button', { name: 'Sort' }))
    expect(screen.getByRole('heading', { name: 'Sort bulbs' })).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Bulb order' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Move Living up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Hall down' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Move Living down' }))
    expect(api.setBulbsOrder).toHaveBeenCalledWith(['127.0.0.2', '127.0.0.1', '127.0.0.3'])
    // The new position shows at once and is announced.
    expect(within(list).getAllByRole('listitem')[1]).toHaveTextContent('Living')
    expect(useBulbStore.getState().toasts.at(-1)?.params).toEqual({ name: 'Living', position: 2 })

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('heading', { name: 'Bulbs' })).toBeInTheDocument()
    expect(useBulbStore.getState().toasts.at(-1)?.message).toBe('toast.orderSaved')
  })

  it('moves an item to another position', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toBeNull()
    expect(moveItem(['a', 'b', 'c'], 0, 3)).toBeNull()
    expect(moveItem(['a', 'b', 'c'], -1, 0)).toBeNull()
  })
})

describe('empty states', () => {
  it('shows the search progress while discovering', () => {
    seedStore(makeState([], { isDiscovering: true }))
    renderApp(<Home />)

    expect(screen.getByRole('heading', { name: 'Looking for bulbs…' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Search again' })).not.toBeInTheDocument()
  })

  it('keeps Retry available after a failed search', async () => {
    const user = userEvent.setup()
    seedStore(makeState([], { discoveryFailed: true }))
    renderApp(<Home />)

    expect(screen.getByRole('heading', { name: 'We could not find any bulbs' })).toBeInTheDocument()
    expect(screen.getByText(/same Wi-Fi network/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Search again' }))
    expect(api.retryDiscovery).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Add by IP' })).toBeInTheDocument()
  })
})
