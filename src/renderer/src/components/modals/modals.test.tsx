import AddDeviceModal from '@components/modals/AddDeviceModal'
import CustomColorModal from '@components/modals/CustomColorModal'
import { isValidIPv4 } from '@renderer/lib/ip'
import { makeBulb, makeState, renderApp, resetStore, seedStore } from '@renderer/test/fixtures'
import { api } from '@renderer/test/mockApi'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@renderer/lib/api', () => import('@renderer/test/mockApi'))

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
})

describe('IP validation', () => {
  it('checks every octet after trimming', () => {
    expect(isValidIPv4(' 192.168.1.34 ')).toBe(true)
    expect(isValidIPv4('0.0.0.0')).toBe(true)
    expect(isValidIPv4('256.1.1.1')).toBe(false)
    expect(isValidIPv4('1.2.3')).toBe(false)
    expect(isValidIPv4('1.2.3.4.5')).toBe(false)
    expect(isValidIPv4('a.b.c.d')).toBe(false)
    expect(isValidIPv4('1.2.3.')).toBe(false)
  })
})

describe('Add bulb dialog', () => {
  it('links an invalid IP error to the field and does not call the backend', async () => {
    const user = userEvent.setup()
    renderApp(<AddDeviceModal open onOpenChange={() => undefined} />)

    const field = screen.getByLabelText('IP address')
    await user.type(field, '300.1.1.1')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    const error = screen.getByText(/not a valid IP address/)
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field.getAttribute('aria-describedby')).toContain(error.id)
    expect(api.addBulbByIp).not.toHaveBeenCalled()
  })

  it('stays open and keeps the IP when the bulb does not answer', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    api.addBulbByIp.mockRejectedValueOnce({ code: 'bulbUnreachable', ip: '10.0.0.9' })
    renderApp(<AddDeviceModal open onOpenChange={onOpenChange} />)

    const field = screen.getByLabelText('IP address')
    await user.type(field, '10.0.0.9')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText(/did not respond/)).toBeInTheDocument()
    expect(field).toHaveValue('10.0.0.9')
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closes once the bulb is added', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderApp(<AddDeviceModal open onOpenChange={onOpenChange} />)

    await user.type(screen.getByLabelText('IP address'), '10.0.0.9')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(api.addBulbByIp).toHaveBeenCalledWith('10.0.0.9')
  })
})

describe('Color dialog', () => {
  it('warns about a duplicate name in the field and does not close', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    seedStore(makeState([makeBulb({ customColors: [{ id: 33, name: 'Rosa', hex: '#ff66aa' }] })]))
    renderApp(<CustomColorModal open onOpenChange={onOpenChange} />)

    const field = screen.getByLabelText('Name')
    await user.type(field, 'rosa')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('You already have a color with that name.')).toBeInTheDocument()
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(api.addCustomColor).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('adds a new color and closes', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    seedStore(makeState([makeBulb()]))
    renderApp(<CustomColorModal open onOpenChange={onOpenChange} />)

    await user.type(screen.getByLabelText('Name'), 'Sunset')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(api.addCustomColor).toHaveBeenCalledWith('Sunset', '#3772ff')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
