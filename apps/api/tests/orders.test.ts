import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'
import { loadEnv } from '../src/env.js'
import type {
  BrandRow,
  CatalogDataSource,
  CategoryRow,
  ProductRow,
  ProductVariantRow,
} from '../src/modules/catalog/catalog.types.js'
import {
  computeTotal,
  createOrder,
  resolveLines,
} from '../src/modules/orders/orders.service.js'
import type {
  CreateOrderInput,
  CreateOrderRecord,
  OrderWithItems,
  OrdersDataSource,
} from '../src/modules/orders/orders.types.js'

const env = loadEnv({
  NODE_ENV: 'test',
  PORT: '4000',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'k',
  SUPABASE_JWT_SECRET: 's',
  ALLOWED_ORIGINS: '',
  ADMIN_EMAILS: '',
  RATE_LIMIT_ENABLED: 'false',
})

const NOMBRE = 'Crayola Super Tips 150 Colores'

function producto(o: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'p1',
    slug: 'crayola-super-tips-150',
    nombre: NOMBRE,
    descripcion: '',
    brand_id: null,
    category_id: null,
    precio_bob_cents: 59500,
    precio_oferta_bob_cents: 54900,
    stock: 24,
    sku: null,
    color: null,
    imagenes: [],
    destacado: true,
    demo: true,
    activo: true,
    created_at: '2026-01-01T00:00:00.000Z',
    ...o,
  }
}

function variante(o: Partial<ProductVariantRow> = {}): ProductVariantRow {
  return {
    id: 'v1',
    product_id: 'p1',
    nombre: 'Bolsa 150 colores',
    valor: '#7C3AED',
    stock: 24,
    sku: null,
    orden: 1,
    ...o,
  }
}

const CATEGORIAS: CategoryRow[] = []
const MARCAS: BrandRow[] = []

function fakeCatalog(o: Partial<CatalogDataSource> = {}): CatalogDataSource {
  const base: CatalogDataSource = {
    products: async () => [],
    countProducts: async () => 0,
    productBySlug: async () => null,
    variantsFor: async () => [],
    categories: async () => CATEGORIAS,
    brands: async () => MARCAS,
    productsPorIds: async (ids) => [producto()].filter((p) => ids.includes(p.id)),
  }
  return { ...base, ...o }
}

function variantCatalog(productos: ProductRow[], variantes: ProductVariantRow[]): CatalogDataSource {
  return fakeCatalog({
    productsPorIds: async (ids) => productos.filter((p) => ids.includes(p.id)),
    variantsFor: async (ids) => variantes.filter((v) => ids.includes(v.product_id)),
  })
}

type FakeOrders = OrdersDataSource & { createCount: number }

function armarOrden(record: CreateOrderRecord): OrderWithItems {
  return {
    id: 'o1',
    folio: record.folio,
    estado: 'nuevo',
    total_bob_cents: record.total_bob_cents,
    cliente_nombre: record.cliente_nombre,
    cliente_email: record.cliente_email,
    cliente_telefono: record.cliente_telefono,
    envio_tipo: record.envio_tipo,
    envio_direccion: record.envio_direccion,
    envio_ciudad: record.envio_ciudad,
    created_at: '2026-01-01T00:00:00.000Z',
    items: record.items.map((linea, i) => ({
      id: `oi${i + 1}`,
      nombre_snapshot: linea.nombre_snapshot,
      cantidad: linea.cantidad,
      precio_unitario_bob_cents: linea.precio_unitario_bob_cents,
      subtotal_bob_cents: linea.subtotal_bob_cents,
    })),
  }
}

function fakeOrders(
  o: {
    createCount?: number
    folio?: string
    porId?: Map<string, OrderWithItems>
    createOrder?: OrdersDataSource['createOrder']
  } = {},
): FakeOrders {
  const porId = o.porId ?? new Map<string, OrderWithItems>()
  let createCount = o.createCount ?? 0
  const create = o.createOrder ?? (async (record: CreateOrderRecord) => {
    createCount += 1
    const orden = armarOrden(record)
    porId.set(record.idempotency_key, orden)
    return orden
  })
  return {
    findByIdempotencyKey: async (key) => porId.get(key) ?? null,
    nextFolio: async () => o.folio ?? 'SHM-000001',
    createOrder: async (record) => {
      await create(record)
      const orden = armarOrden(record)
      return orden
    },
    listOrdersByEmail: async () => [...porId.values()],
    updateEstado: async (id, estado) => {
      const orden = [...porId.values()][0]
      if (!orden) throw new Error('no existe')
      return { ...orden, id, estado }
    },
    get createCount() {
      return createCount
    },
  } as FakeOrders
}

const INPUT_BASE: CreateOrderInput = {
  idempotencyKey: 'key-1',
  cliente_nombre: 'Ana',
  cliente_email: 'ana@example.com',
  cliente_telefono: '70000000',
  envio_tipo: 'cochabamba',
  items: [{ product_id: 'p1', cantidad: 2 }],
}

describe('resolveLines', () => {
  test('ignora el precio del cliente y usa el precio efectivo del catálogo', async () => {
    const catalog = variantCatalog([producto()], [])
    const items = [
      { product_id: 'p1', cantidad: 2, precio_unitario_bob_cents: 0 } as unknown as {
        product_id: string
        cantidad: number
      },
    ]
    const [linea] = await resolveLines(catalog, items)
    expect(linea?.precio_unitario_bob_cents).toBe(54900)
    expect(linea?.subtotal_bob_cents).toBe(109800)
    expect(linea?.nombre_snapshot).toBe(NOMBRE)
    expect(linea?.variant_id).toBeNull()
  })

  test('rechaza cantidad 0', async () => {
    const catalog = variantCatalog([producto()], [])
    await expect(
      resolveLines(catalog, [{ product_id: 'p1', cantidad: 0 }]),
    ).rejects.toMatchObject({ status: 400 })
  })

  test('rechaza cantidad negativa', async () => {
    const catalog = variantCatalog([producto()], [])
    await expect(
      resolveLines(catalog, [{ product_id: 'p1', cantidad: -3 }]),
    ).rejects.toMatchObject({ status: 400 })
  })

  test('rechaza product_id inexistente con 404 NOT_FOUND', async () => {
    const catalog = variantCatalog([], [])
    await expect(
      resolveLines(catalog, [{ product_id: 'no-existe', cantidad: 1 }]),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })

  test('rechaza stock insuficiente con 409 STOCK_INSUFICIENTE', async () => {
    const catalog = variantCatalog(
      [producto({ id: 'boarg', stock: 0, precio_oferta_bob_cents: null, nombre: 'Boarg Resina' })],
      [],
    )
    await expect(
      resolveLines(catalog, [{ product_id: 'boarg', cantidad: 1 }]),
    ).rejects.toMatchObject({ status: 409, code: 'STOCK_INSUFICIENTE' })
  })

  test('rechaza una variante que pertenece a otro producto', async () => {
    const catalog = variantCatalog(
      [producto(), producto({ id: 'p2', slug: 'otro', nombre: 'Otro' })],
      [variante({ id: 'v1', product_id: 'p2' })],
    )
    await expect(
      resolveLines(catalog, [{ product_id: 'p1', variant_id: 'v1', cantidad: 1 }]),
    ).rejects.toMatchObject({ status: 400 })
  })

  test('el stock de la variante manda sobre el del producto', async () => {
    const catalog = variantCatalog(
      [producto({ stock: 24 })],
      [variante({ id: 'v1', product_id: 'p1', stock: 2 })],
    )
    await expect(
      resolveLines(catalog, [{ product_id: 'p1', variant_id: 'v1', cantidad: 3 }]),
    ).rejects.toMatchObject({ status: 409, code: 'STOCK_INSUFICIENTE' })

    const [linea] = await resolveLines(catalog, [
      { product_id: 'p1', variant_id: 'v1', cantidad: 2 },
    ])
    expect(linea?.variant_id).toBe('v1')
    expect(linea?.subtotal_bob_cents).toBe(109800)
  })

  test('suma dos líneas del mismo producto en una sola', async () => {
    const catalog = variantCatalog([producto()], [])
    const lineas = await resolveLines(catalog, [
      { product_id: 'p1', cantidad: 1 },
      { product_id: 'p1', cantidad: 2 },
    ])
    expect(lineas).toHaveLength(1)
    expect(lineas[0]?.cantidad).toBe(3)
    expect(lineas[0]?.precio_unitario_bob_cents).toBe(54900)
  })
})

describe('computeTotal', () => {
  test('suma los subtotales', () => {
    expect(
      computeTotal([{ subtotal_bob_cents: 100 }, { subtotal_bob_cents: 250 }]),
    ).toBe(350)
  })

  test('devuelve 0 con lista vacía', () => {
    expect(computeTotal([])).toBe(0)
  })
})

describe('createOrder', () => {
  test('rechaza items vacío', async () => {
    const catalog = variantCatalog([producto()], [])
    const orders = fakeOrders()
    await expect(
      createOrder(catalog, orders, { ...INPUT_BASE, items: [] }),
    ).rejects.toMatchObject({ status: 400 })
  })

  test('crea la orden una vez y devuelve el folio', async () => {
    const catalog = variantCatalog([producto()], [])
    const porId = new Map<string, OrderWithItems>()
    const orders = fakeOrders({ porId })
    const r = await createOrder(catalog, orders, INPUT_BASE)
    expect(r.creado).toBe(true)
    expect(r.order.folio).toBe('SHM-000001')
    expect(r.order.total_bob_cents).toBe(109800)
  })

  test('con la misma idempotency_key devuelve la misma orden sin volver a insertar', async () => {
    const catalog = variantCatalog([producto()], [])
    const porId = new Map<string, OrderWithItems>()
    let inserts = 0
    const orders = fakeOrders({
      porId,
      createOrder: async (record) => {
        inserts += 1
        const orden = armarOrden(record)
        porId.set(record.idempotency_key, orden)
        return orden
      },
    })
    const a = await createOrder(catalog, orders, INPUT_BASE)
    const b = await createOrder(catalog, orders, INPUT_BASE)
    expect(b.creado).toBe(false)
    expect(b.order.folio).toBe(a.order.folio)
    expect(inserts).toBe(1)
  })

  test('si el insert pierde la carrera por el UNIQUE re-lee y devuelve la ganadora', async () => {
    const catalog = variantCatalog([producto()], [])
    const ganadora = armarOrden({
      folio: 'SHM-000001',
      idempotency_key: 'key-1',
      cliente_nombre: 'Ana',
      cliente_email: 'ana@example.com',
      cliente_telefono: '70000000',
      envio_tipo: 'cochabamba',
      envio_direccion: null,
      envio_ciudad: null,
      total_bob_cents: 109800,
      items: [],
    })
    const porId = new Map<string, OrderWithItems>([['key-1', ganadora]])
    const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' })
    const orders = fakeOrders({
      porId,
      createOrder: async () => {
        throw uniqueViolation
      },
    })
    const r = await createOrder(catalog, orders, INPUT_BASE)
    expect(r.creado).toBe(false)
    expect(r.order.folio).toBe('SHM-000001')
  })
})

const BODY_VALIDO = {
  cliente_nombre: 'Ana',
  cliente_email: 'ana@example.com',
  cliente_telefono: '70000000',
  envio_tipo: 'cochabamba',
  envio_direccion: 'Av. Siempre Viva 742',
  items: [{ product_id: 'p1', cantidad: 2 }],
}

describe('POST /api/orders', () => {
  function app(conRateLimit = false) {
    const envApp = loadEnv({
      NODE_ENV: 'test',
      PORT: '4000',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'k',
      SUPABASE_JWT_SECRET: 's',
      ALLOWED_ORIGINS: '',
      ADMIN_EMAILS: '',
      RATE_LIMIT_ENABLED: conRateLimit ? 'true' : 'false',
    })
    const catalog = variantCatalog([producto()], [])
    const orders = fakeOrders()
    return createApp({ env: envApp, catalog, orders })
  }

  test('sin header idempotency-key responde 400 VALIDATION', async () => {
    const res = await request(app()).post('/api/orders').send(BODY_VALIDO)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
  })

  test('body inválido responde 400 VALIDATION con details', async () => {
    const res = await request(app())
      .post('/api/orders')
      .set('idempotency-key', 'k1')
      .send({ ...BODY_VALIDO, cliente_email: 'no-es-email', envio_tipo: 'otro' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
    expect(res.body.error.details.length).toBeGreaterThan(0)
  })

  test('body válido crea el pedido', async () => {
    const res = await request(app())
      .post('/api/orders')
      .set('idempotency-key', 'k1')
      .send(BODY_VALIDO)
    expect([200, 201]).toContain(res.status)
    expect(res.body).toMatchObject({
      folio: 'SHM-000001',
      total_bob_cents: 109800,
      estado: 'nuevo',
    })
  })

  test('repetido con la misma key devuelve el mismo folio', async () => {
    const server = app()
    const a = await request(server)
      .post('/api/orders')
      .set('idempotency-key', 'k1')
      .send(BODY_VALIDO)
    const b = await request(server)
      .post('/api/orders')
      .set('idempotency-key', 'k1')
      .send(BODY_VALIDO)
    expect(b.body.folio).toBe(a.body.folio)
    expect(b.status).toBe(200)
  })

  test('la sexta llamada en un minuto responde 429 RATE_LIMITED', async () => {
    const server = app(true)
    for (let i = 0; i < 5; i += 1) {
      await request(server)
        .post('/api/orders')
        .set('idempotency-key', `k${i}`)
        .send(BODY_VALIDO)
    }
    const res = await request(server)
      .post('/api/orders')
      .set('idempotency-key', 'k5')
      .send(BODY_VALIDO)
    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('RATE_LIMITED')
  })
})