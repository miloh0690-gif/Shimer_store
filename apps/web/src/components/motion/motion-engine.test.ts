import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  motionActual,
  onMotion,
  arrancarMotion,
  reiniciarMotion,
} from './motion-engine'

function fijarSinMovimientoReducido() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (q: string) => ({
      matches: q.includes('prefers-reduced-motion: reduce') ? reducido : false,
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

let reducido = false

beforeEach(() => {
  reducido = false
  reiniciarMotion()
  fijarSinMovimientoReducido()
})

describe('motion-engine', () => {
  it('arranca sin gsap cargado para que el primer render no lo bloquee', () => {
    expect(motionActual().gsap).toBeNull()
    expect(motionActual().lenis).toBeNull()
  })

  it('avisa a los suscriptores cuando el motor queda listo', async () => {
    const listo = vi.fn()
    onMotion(listo)
    expect(listo).not.toHaveBeenCalled()

    arrancarMotion()
    await vi.waitFor(() => expect(motionActual().gsap).not.toBeNull(), { timeout: 5000 })
    expect(listo).toHaveBeenCalledTimes(1)
  })

  it('con prefers-reduced-motion avisa sin cargar gsap', async () => {
    reducido = true
    const listo = vi.fn()
    onMotion(listo)

    arrancarMotion()
    await new Promise((r) => setTimeout(r, 50))

    expect(listo).toHaveBeenCalledTimes(1)
    expect(motionActual().gsap).toBeNull()
  })

  it('suscribirse cuando ya esta listo dispara al instante', async () => {
    arrancarMotion()
    await vi.waitFor(() => expect(motionActual().gsap).not.toBeNull(), { timeout: 5000 })

    const tarde = vi.fn()
    onMotion(tarde)
    expect(tarde).toHaveBeenCalledTimes(1)
  })

  it('cancelar la suscripcion evita la notificacion', async () => {
    const cb = vi.fn()
    const cancelar = onMotion(cb)
    cancelar()

    arrancarMotion()
    await new Promise((r) => setTimeout(r, 200))

    expect(cb).not.toHaveBeenCalled()
  })
})
