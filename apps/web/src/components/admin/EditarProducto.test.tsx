import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EditarProducto } from './EditarProducto'

const refrescar = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refrescar, push: vi.fn(), replace: vi.fn() }),
}))

function jsonOk() {
  return { ok: true, json: async () => ({}) } as Response
}

type Props = Parameters<typeof EditarProducto>[0]

const BASE: Props = {
  productoId: 'p1',
  stockInicial: 24,
  destacadoInicial: false,
  precioInicial: 59500,
  precioOfertaInicial: 54900,
  token: 'token-admin',
}

function montar(extra: Partial<Props> = {}) {
  return render(<EditarProducto {...BASE} {...extra} />)
}

function precioLista() {
  return screen.getByLabelText('Precio de lista')
}

function precioOferta() {
  return screen.getByLabelText('Precio en oferta')
}

async function guardar() {
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))
}

describe('EditarProducto', () => {
  beforeEach(() => {
    refrescar.mockClear()
    vi.stubGlobal('fetch', vi.fn(async () => jsonOk()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra los precios en bolivianos, no en centavos', () => {
    montar()
    expect(precioLista()).toHaveValue(595)
    expect(precioOferta()).toHaveValue(549)
  })

  it('el boton arranca deshabilitado porque no hay cambios', () => {
    montar()
    expect(screen.getByRole('button', { name: /Guardar/ })).toBeDisabled()
  })

  it('manda el precio de lista en centavos al guardar', async () => {
    const fetchMock = vi.fn(async () => jsonOk())
    vi.stubGlobal('fetch', fetchMock)
    montar()
    fireEvent.change(precioLista(), { target: { value: '600' } })
    await guardar()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [, opciones] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(opciones.body))).toEqual({ precio_bob_cents: 60000 })
  })

  it('manda el precio de oferta en centavos al guardar', async () => {
    const fetchMock = vi.fn(async () => jsonOk())
    vi.stubGlobal('fetch', fetchMock)
    montar()
    fireEvent.change(precioOferta(), { target: { value: '500' } })
    await guardar()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [, opciones] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(opciones.body))).toEqual({ precio_oferta_bob_cents: 50000 })
  })

  it('rechaza que la oferta sea mayor o igual a la lista sin llamar a la API', async () => {
    const fetchMock = vi.fn(async () => jsonOk())
    vi.stubGlobal('fetch', fetchMock)
    montar()
    fireEvent.change(precioOferta(), { target: { value: '700' } })
    await guardar()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/menor/i))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rechaza un precio negativo sin llamar a la API', async () => {
    const fetchMock = vi.fn(async () => jsonOk())
    vi.stubGlobal('fetch', fetchMock)
    montar()
    fireEvent.change(precioLista(), { target: { value: '-5' } })
    await guardar()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sigue mandando el stock y el destacado de antes', async () => {
    const fetchMock = vi.fn(async () => jsonOk())
    vi.stubGlobal('fetch', fetchMock)
    montar({ destacadoInicial: true })
    fireEvent.change(screen.getByLabelText('Stock del producto p1'), { target: { value: '30' } })
    await guardar()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [, opciones] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(opciones.body))).toEqual({ stock: 30 })
  })
})
