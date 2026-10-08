import { describe, expect, it } from 'vitest'
import { CLAVE_IDEMPOTENCIA, borrarIdempotencia, leerIdempotencia } from './idempotencia'

function storageVacio(): Storage {
  const datos = new Map<string, string>()
  return {
    get length() {
      return datos.size
    },
    clear: () => datos.clear(),
    getItem: (k: string) => datos.get(k) ?? null,
    key: (i: number) => [...datos.keys()][i] ?? null,
    removeItem: (k: string) => void datos.delete(k),
    setItem: (k: string, v: string) => void datos.set(k, v),
  } as Storage
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('idempotencia del checkout', () => {
  it('genera una key con formato de UUID cuando no hay ninguna guardada', () => {
    const storage = storageVacio()
    expect(leerIdempotencia(storage)).toMatch(UUID)
  })

  it('devuelve la misma key en dos montajes seguidos con el mismo storage', () => {
    const storage = storageVacio()
    const primera = leerIdempotencia(storage)
    const segunda = leerIdempotencia(storage)
    expect(segunda).toBe(primera)
  })

  it('sobrevive a un almacenamiento que lanza, y genera una key nueva', () => {
    const roto = {
      getItem() {
        throw new Error('sin storage')
      },
      setItem() {
        throw new Error('sin storage')
      },
      removeItem() {
        throw new Error('sin storage')
      },
    } as unknown as Storage
    expect(leerIdempotencia(roto)).toMatch(UUID)
  })

  it('borrar la key hace que la siguiente llamada sea distinta', () => {
    const storage = storageVacio()
    const primera = leerIdempotencia(storage)
    borrarIdempotencia(storage)
    expect(leerIdempotencia(storage)).not.toBe(primera)
  })

  it('ignora una key guardada que no es un UUID', () => {
    const storage = storageVacio()
    storage.setItem(CLAVE_IDEMPOTENCIA, 'no-es-una-key')
    expect(leerIdempotencia(storage)).toMatch(UUID)
  })
})
