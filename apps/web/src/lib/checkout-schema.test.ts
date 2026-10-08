import { describe, it, expect } from 'vitest'
import { CheckoutSchema } from './checkout-schema'

const base = {
  cliente_nombre: 'Ana Ribera',
  cliente_email: 'ana@example.com',
  cliente_telefono: '70012345',
  envio_tipo: 'cochabamba' as const,
}

describe('CheckoutSchema', () => {
  it('acepta entrega en Cochabamba sin direccion', () => {
    const r = CheckoutSchema.safeParse(base)
    expect(r.success).toBe(true)
  })

  it('acepta envio nacional con direccion y ciudad', () => {
    const r = CheckoutSchema.safeParse({
      ...base,
      envio_tipo: 'nacional',
      envio_direccion: 'Av. Siempre Viva 742',
      envio_ciudad: 'La Paz',
    })
    expect(r.success).toBe(true)
  })

  it('rechaza envio nacional sin direccion ni ciudad', () => {
    const r = CheckoutSchema.safeParse({ ...base, envio_tipo: 'nacional' })
    expect(r.success).toBe(false)
    const paths = r.success ? [] : r.error.issues.map((i) => i.path.join('.'))
    expect(paths).toContain('envio_direccion')
    expect(paths).toContain('envio_ciudad')
  })

  it('rechaza un correo invalido', () => {
    const r = CheckoutSchema.safeParse({ ...base, cliente_email: 'ana(at)example' })
    expect(r.success).toBe(false)
  })

  it('rechaza nombre y telefono vacios', () => {
    const r = CheckoutSchema.safeParse({ ...base, cliente_nombre: '  ', cliente_telefono: '' })
    expect(r.success).toBe(false)
  })
})
