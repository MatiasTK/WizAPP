import Scenes from '@pages/Scenes'
import { makeBulb, makeState, renderApp, resetStore, seedStore } from '@renderer/test/fixtures'
import { api } from '@renderer/test/mockApi'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@renderer/lib/api', () => import('@renderer/test/mockApi'))

const withColors = (overrides = {}) =>
  makeBulb({
    customColors: [{ id: 33, name: 'Rosa', hex: '#ff66aa' }],
    favoriteColors: [11, 33, 6],
    ...overrides
  })

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
})

describe('Scenes page', () => {
  it('filters the grid and ignores case and accents', async () => {
    const user = userEvent.setup()
    seedStore(makeState([withColors()]))
    renderApp(<Scenes />)

    await user.type(screen.getByRole('searchbox', { name: 'Filter scenes' }), 'COZY')

    expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cozy' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Warm white' })).not.toBeInTheDocument()
    // Favorites step aside while filtering.
    expect(screen.queryByRole('heading', { name: 'Favorites' })).not.toBeInTheDocument()
  })

  it('says there are no results even when custom colors exist', async () => {
    const user = userEvent.setup()
    seedStore(makeState([withColors()]))
    renderApp(<Scenes />)

    await user.type(screen.getByRole('searchbox', { name: 'Filter scenes' }), 'zzzz')

    expect(screen.getByText('No results. Try a different name.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rosa' })).not.toBeInTheDocument()
  })

  it('shows an empty custom group with a New color action', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb({ customColors: [] })]))
    renderApp(<Scenes />)

    await user.click(screen.getByRole('button', { name: 'Custom' }))
    expect(screen.getByText('No custom colors yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'New color' }).length).toBeGreaterThan(1)
  })

  it('disables the tiles and explains why when there is no bulb', () => {
    renderApp(<Scenes />)

    expect(screen.getAllByText('Add a bulb to apply scenes.').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Cozy' })).toBeDisabled()
  })

  it('offers Retry above the grid when the active bulb is offline', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb({ online: false })]))
    renderApp(<Scenes />)

    expect(screen.getByRole('alert')).toHaveTextContent('Living is not responding')
    expect(screen.getByRole('button', { name: 'Cozy' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(api.probeBulb).toHaveBeenCalledWith('127.0.0.1')
  })

  it('marks the active scene as pressed and applies another one', async () => {
    const user = userEvent.setup()
    seedStore(makeState([withColors({ sceneId: 6, favoriteColors: [] })]))
    renderApp(<Scenes />)

    expect(screen.getByRole('button', { name: 'Cozy' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Ocean' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Ocean' }))
    expect(api.setScene).toHaveBeenCalledWith(1, '127.0.0.1')

    await user.click(screen.getByRole('button', { name: 'Rosa' }))
    expect(api.setCustomColor).toHaveBeenCalledWith(33, '127.0.0.1')
  })

  it('toggles a favorite with an accessible, pressed heart', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb({ favoriteColors: [6] })]))
    renderApp(<Scenes />)

    const remove = screen.getAllByRole('button', { name: 'Remove Cozy from favorites' })[0]
    expect(remove).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Add Ocean to favorites' }))
    expect(api.toggleFavoriteColor).toHaveBeenCalledWith(1)
  })

  it('picks the target bulb from the pills; offline ones cannot be picked', async () => {
    const user = userEvent.setup()
    seedStore(
      makeState([
        makeBulb(),
        makeBulb({ ip: '127.0.0.2', name: 'Desk' }),
        makeBulb({ ip: '127.0.0.3', name: 'Hall', online: false })
      ])
    )
    renderApp(<Scenes />)

    const pills = within(screen.getByRole('group', { name: 'Bulb they are applied to' }))
    expect(pills.getByRole('button', { name: 'Living' })).toHaveAttribute('aria-pressed', 'true')
    expect(pills.getByRole('button', { name: 'Hall' })).toBeDisabled()

    await user.click(pills.getByRole('button', { name: 'Desk' }))
    expect(api.setActiveBulb).toHaveBeenCalledWith('127.0.0.2')
  })
})

describe('Scene groups', () => {
  it('starts on All and narrows the grid when a group is chosen', async () => {
    const user = userEvent.setup()
    seedStore(makeState([withColors()]))
    renderApp(<Scenes />)

    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'All scenes' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Static' }))
    expect(screen.getByRole('button', { name: 'Static' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Static' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ocean' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Favorites' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Custom' }))
    expect(screen.getByRole('button', { name: 'Rosa' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cozy' })).not.toBeInTheDocument()
  })
})

describe('Favorites', () => {
  it('are sorted in a list with up/down buttons, without drag handles in the grid', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb({ favoriteColors: [11, 12, 14] })]))
    renderApp(<Scenes />)

    expect(screen.queryByRole('button', { name: /^Move / })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sort' }))
    const list = within(screen.getByRole('list', { name: 'Favorites order' }))
    expect(list.getAllByRole('listitem')).toHaveLength(3)

    await user.click(list.getByRole('button', { name: 'Move Night light up' }))
    expect(api.setFavoriteColorsOrder).toHaveBeenCalledWith([11, 14, 12])

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('list', { name: 'Favorites order' })).not.toBeInTheDocument()
  })
})
