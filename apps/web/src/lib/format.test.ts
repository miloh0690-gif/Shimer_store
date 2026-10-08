import { describe, expect, it } from 'vitest'
import { formatBob, precioEfectivo } from './format'

describe('formatBob', () => {
  it('formatea un precio en bolivianos con dos decimales', () => {
    expect(formatBob(54900)).toBe('Bs. 549.00')
  })

  it('formatea un precio con centavos', () => {
    expect(formatBob(850)).toBe('Bs. 8.50')
  })

  it('usa coma como separador de miles', () => {
    expect(formatBob(123456)).toBe('Bs. 1,234.56')
  })
})

describe('precioEfectivo', () => {
  it('devuelve la oferta cuando existe', () => {
    expect(precioEfectivo({ precio_bob_cents: 59500, precio_oferta_bob_cents: 54900 })).toBe(54900)
  })

  it('devuelve la lista cuando no hay oferta', () => {
    expect(precioEfectivo({ precio_bob_cents: 2400, precio_oferta_bob_cents: null })).toBe(2400)
  })
})