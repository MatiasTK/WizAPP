import Home from '@pages/Home'
import { api } from '@renderer/test/mockApi'
import { makeBulb, makeState, renderApp, resetStore, seedStore } from '@renderer/test/fixtures'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@renderer/lib/api', () => import('@renderer/test/mockApi'))

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
})

describe('bulb rows', () => {
  it('disables every control of an offline row and offers Retry', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk', online: false })]))
    renderApp(<Home />)

    const rows = screen.getAllByRole('listitem').filter((li) => li.textContent?.includes('Desk'))
    const row = within(rows[0])

    expect(row.getByRole('switch', { name: /Desk/ })).toBeDisabled()
    expect(row.getByRole('slider', { name: /Desk/ })).toHaveAttribute('data-disabled')
    expect(row.getByText('Not responding')).toBeInTheDocument()

    await user.click(row.getByRole('button', { name: /Retry connecting to Desk/ }))
    expect(api.probeBulb).toHaveBeenCalledWith('127.0.0.2')
  })

  it('turns a bulb on without making it the active one', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk', state: false })]))
    renderApp(<Home />)

    await user.click(screen.getByRole('switch', { name: /Power for Desk/ }))

    expect(api.toggleBulbByIp).toHaveBeenCalledWith('127.0.0.2')
    expect(api.setActiveBulb).not.toHaveBeenCalled()
  })

  it('marks the active bulb with aria-current', () => {
    seedStore(makeState([makeBulb(), makeBulb({ ip: '127.0.0.2', name: 'Desk' })]))
    renderApp(<Home />)

    const current = screen.getAllByRole('listitem').filter((li) => li.hasAttribute('aria-current'))
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('Living')
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
