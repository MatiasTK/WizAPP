import FavoriteScene, { reorderFavorites } from '@components/FavoriteScene'
import Scenes from '@pages/Scenes'
import { makeBulb, makeState, renderApp, resetStore, seedStore } from '@renderer/test/fixtures'
import { api } from '@renderer/test/mockApi'
import { screen } from '@testing-library/react'
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
  it('filters every section and ignores case and accents', async () => {
    const user = userEvent.setup()
    seedStore(makeState([withColors()]))
    renderApp(<Scenes />)

    await user.type(screen.getByRole('searchbox', { name: 'Filter scenes' }), 'COZY')

    expect(screen.getAllByRole('button', { name: 'Cozy' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Warm white' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dynamic' })).not.toBeInTheDocument()
  })

  it('says there are no results even when custom colors exist', async () => {
    const user = userEvent.setup()
    seedStore(makeState([withColors()]))
    renderApp(<Scenes />)

    await user.type(screen.getByRole('searchbox', { name: 'Filter scenes' }), 'zzzz')

    expect(screen.getByText('No results. Try a different name.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Custom' })).not.toBeInTheDocument()
  })

  it('shows an empty custom section with a New color action', () => {
    seedStore(makeState([makeBulb({ customColors: [] })]))
    renderApp(<Scenes />)

    expect(screen.getByText('No custom colors yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'New color' }).length).toBeGreaterThan(0)
  })

  it('disables the tiles and explains why when there is no bulb', () => {
    renderApp(<Scenes />)

    expect(screen.getByText('Add a bulb to apply scenes.')).toBeInTheDocument()
    const tiles = screen.getAllByRole('button', { name: 'Cozy' })
    for (const tile of tiles) expect(tile).toBeDisabled()
  })

  it('offers Retry above the grid when the active bulb is offline', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb({ online: false })]))
    renderApp(<Scenes />)

    expect(screen.getByRole('alert')).toHaveTextContent('Living is not responding')
    for (const tile of screen.getAllByRole('button', { name: 'Cozy' })) {
      expect(tile).toBeDisabled()
    }
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
})

describe('Scene groups', () => {
  it('starts on All and narrows the sections when a group is chosen', async () => {
    const user = userEvent.setup()
    seedStore(makeState([withColors()]))
    renderApp(<Scenes />)

    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dynamic' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Static' }))
    expect(screen.getByRole('button', { name: 'Static' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Static' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dynamic' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Favorites' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Custom' }))
    expect(screen.getByRole('button', { name: 'Rosa' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Static' })).not.toBeInTheDocument()
  })
})

describe('Favorites', () => {
  it('exposes a keyboard handle for every favorite', async () => {
    const user = userEvent.setup()
    seedStore(makeState([makeBulb({ favoriteColors: [11, 12, 14] })]))
    renderApp(<FavoriteScene bulb={makeBulb()} />)

    const handles = screen.getAllByRole('button', { name: /^Reorder / })
    expect(handles).toHaveLength(3)

    await user.tab()
    expect(handles[0]).toHaveFocus()
  })

  it('moves a favorite to the position of another one', () => {
    expect(reorderFavorites([11, 12, 14], 11, 14)).toEqual([12, 14, 11])
    expect(reorderFavorites([11, 12, 14], 14, 11)).toEqual([14, 11, 12])
    expect(reorderFavorites([11, 12, 14], 12, 12)).toBeNull()
    expect(reorderFavorites([11, 12, 14], 99, 12)).toBeNull()
  })
})
