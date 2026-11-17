import { useBulbStore } from '@renderer/context/BulbStore'
import { makeBulb, makeState, resetStore, seedStore } from '@renderer/test/fixtures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { api } = vi.hoisted(() => ({
  api: {
    onUpdateBulb: vi.fn(() => () => undefined),
    onShowToast: vi.fn(() => () => undefined),
    getBulbs: vi.fn(() => Promise.resolve({ bulbs: [], activeBulb: null })),
    getSettings: vi.fn(() => Promise.resolve({ theme: 'system', language: 'auto' })),
    setSettings: vi.fn(() => Promise.resolve()),
    getLanguage: vi.fn(() => Promise.resolve('en')),
    toggleBulb: vi.fn(),
    toggleBulbByIp: vi.fn(),
    setBrightness: vi.fn(),
    setScene: vi.fn(),
    setCustomColor: vi.fn(),
    setAllBulbs: vi.fn()
  }
}))
vi.mock('@renderer/lib/api', () => ({ api }))

const first = () => useBulbStore.getState().bulbs[0]
const toastKeys = () => useBulbStore.getState().toasts.map((t) => t.message)

/** A promise the test settles by hand, to look at the store while a command is in flight. */
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
  seedStore(makeState([makeBulb({ dimming: 50 }), makeBulb({ ip: '127.0.0.2', name: 'Desk' })]))
})

describe('optimistic commands', () => {
  it('shows the expected value at once and keeps it once the command succeeds', async () => {
    const call = deferred<void>()
    api.setBrightness.mockReturnValueOnce(call.promise)

    const pending = useBulbStore.getState().setBrightness(80, '127.0.0.1')
    expect(first().dimming).toBe(80)
    expect(useBulbStore.getState().activeBulb?.dimming).toBe(80)

    call.resolve()
    await pending
    // The backend update that follows carries the same value and replaces the overlay.
    seedStore(makeState([makeBulb({ dimming: 80 }), makeBulb({ ip: '127.0.0.2', name: 'Desk' })]))
    expect(first().dimming).toBe(80)
    expect(toastKeys()).toEqual([])
  })

  it('goes back to the real value and shows a toast when the bulb rejects it', async () => {
    api.setBrightness.mockRejectedValueOnce({ code: 'bulbRejected', ip: '127.0.0.1' })

    await useBulbStore.getState().setBrightness(80, '127.0.0.1')

    expect(first().dimming).toBe(50)
    expect(toastKeys()).toEqual(['toast.error.bulbRejected'])
  })

  it('reverts without a toast when the bulb is offline: the row already says so', async () => {
    api.toggleBulbByIp.mockRejectedValueOnce({ code: 'bulbOffline', ip: '127.0.0.1' })
    expect(first().state).toBe(true)

    await useBulbStore.getState().toggleBulb('127.0.0.1')

    expect(first().state).toBe(true)
    expect(toastKeys()).toEqual([])
  })

  it('applies a scene or a custom color to the right bulb only', async () => {
    api.setScene.mockResolvedValueOnce(undefined)
    api.setCustomColor.mockResolvedValueOnce(undefined)

    await useBulbStore.getState().setScene(6, '127.0.0.2')
    await useBulbStore.getState().setScene(40, '127.0.0.1')

    expect(api.setScene).toHaveBeenCalledWith(6, '127.0.0.2')
    expect(api.setCustomColor).toHaveBeenCalledWith(40, '127.0.0.1')
  })
})

describe('all bulbs', () => {
  it('reports which bulbs did not respond and keeps them as they were', async () => {
    seedStore(
      makeState([
        makeBulb({ state: false }),
        makeBulb({ ip: '127.0.0.2', name: 'Desk', state: false })
      ])
    )
    api.setAllBulbs.mockResolvedValueOnce(['127.0.0.2'])

    await useBulbStore.getState().setAllBulbs(true)

    const toast = useBulbStore.getState().toasts[0]
    expect(toast.message).toBe('toast.someDidNotRespond')
    expect(toast.params).toEqual({ names: 'Desk' })
    expect(useBulbStore.getState().bulbs[1].state).toBe(false)
  })
})
