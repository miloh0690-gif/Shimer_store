import { SignJWT } from 'jose'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { loadEnv } from '../src/env.js'
import type { CatalogDataSource } from '../src/modules/catalog/catalog.types.js'
import type { ProfilesDataSource, RespaldoToken } from '../src/auth.js'
import type {
  OrderWithItems,
  OrdersDataSource,
} from '../src/modules/orders/orders.types.js'

const SECRET = 'secreto-de-prueba-largo'
const EMAIL_ADMIN = 'dueño@example.com'
const EMAIL_CLIENTE = 'ana@example.com'

const env = loadEnv({
  NODE_ENV: 'test',
  PORT: '4000',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'k',
  SUPABASE_JWT_SECRET: SECRET,
  ALLOWED_ORIGINS: '',
  ADMIN_EMAILS: EMAIL_ADMIN,
  RATE_LIMIT_ENABLED: 'false',
})

function token(email: string, id = 'u1'): Promise<string> {
  return new SignJWT({ sub: id, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(SECRET));
}

function orden(email: string): OrderWithItems {
  return {
    id: 'o1',
    folio: 'SHM-000001',
    estado: 'nuevo',
    total_bob_cents: 109800,
    cliente_nombre: 'Ana',
    cliente_email: email,
    cliente_telefono: '70000000',
    envio_tipo: 'cochabamba',
    envio_direccion: null,
    envio_ciudad: null,
    created_at: '2026-01-01T00:00:00.000Z',
    items: [],
  }
}

type FakeOrders = OrdersDataSource & { estados: Array<{ id: string; estado: string }> };

function fakeOrders(o: Partial<OrdersDataSource> = {}): FakeOrders {
  return {
    estados: [],
    findByIdempotencyKey: async () => null,
    nextFolio: async () => 'SHM-000001',
    createOrder: async () => orden(EMAIL_CLIENTE),
    listOrdersByEmail: async (email) => [orden(email)],
    listAll: async () => [orden(EMAIL_CLIENTE)],
    updateEstado: async function (id, estado) {
      this.estados.push({ id, estado });
      return { ...orden(EMAIL_CLIENTE), id, estado };
    },
    ...o,
  } as FakeOrders;
}

type FakeProfiles = ProfilesDataSource & { ensureCalls: Array<{ id: string; email: string }> };

function fakeProfiles(o: Partial<ProfilesDataSource> = {}): FakeProfiles {
  const base: ProfilesDataSource = {
    findById: async (id) =>
      id === 'u-admin' ? { id, email: 'admin@roles.com', nombre: null, rol: 'admin' } : null,
    ensureAdmin: async () => {},
  };
  const fake = { ...base, ...o } as FakeProfiles;
  fake.ensureCalls = [];
  const original = fake.ensureAdmin;
  fake.ensureAdmin = async (id, email, nombre) => {
    fake.ensureCalls.push({ id, email });
    return original(id, email, nombre);
  };
  return fake;
}

const CATALOGO: CatalogDataSource = {
  products: async () => [],
  countProducts: async () => 0,
  productBySlug: async () => null,
  productsPorIds: async () => [],
  updateProduct: async () => null,
  variantsFor: async () => [],
  categories: async () => [],
  brands: async () => [],
}

type Parches = { precio_bob_cents?: number; stock?: number; activo?: boolean }

function appCon(
  o: { profiles?: ProfilesDataSource; orders?: OrdersDataSource; respaldo?: RespaldoToken } = {},
) {
  return createApp({
    env,
    catalog: CATALOGO,
    orders: o.orders ?? fakeOrders(),
    profiles: o.profiles ?? fakeProfiles(),
    respaldo: o.respaldo,
  })
}

describe('GET /api/orders (admin)', () => {
  it('sin header Authorization responde 401 UNAUTHORIZED', async () => {
    const res = await request(appCon()).get('/api/orders')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('con un token inválido responde 401 UNAUTHORIZED', async () => {
    const res = await request(appCon())
      .get('/api/orders')
      .set('authorization', 'Bearer no-es-un-jwt')
    expect(res.status).toBe(401)
  })

  it('con un usuario de rol cliente responde 404 NOT_FOUND, no 403', async () => {
    const res = await request(appCon())
      .get('/api/orders')
      .set('authorization', `Bearer ${await token(EMAIL_CLIENTE)}`)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('con el email en ADMIN_EMAILS responde 200 y promueve el perfil', async () => {
    const profiles = fakeProfiles();
    const orders = fakeOrders();
    const res = await request(appCon({ profiles, orders }))
      .get('/api/orders')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(typeof res.body.total).toBe('number')
    expect(profiles.ensureCalls).toEqual([{ id: 'u1', email: EMAIL_ADMIN }])
  })

  it('con un usuario cuyo perfil ya es admin responde 200 sin promoverlo', async () => {
    const profiles = fakeProfiles();
    const res = await request(appCon({ profiles }))
      .get('/api/orders')
      .set('authorization', `Bearer ${await token('admin@roles.com', 'u-admin')}`)
    expect(res.status).toBe(200)
    expect(profiles.ensureCalls).toEqual([])
  })
})

describe('PATCH /api/orders/:id/estado', () => {
  it('rechaza un estado inventado con 400 VALIDATION', async () => {
    const res = await request(appCon())
      .patch('/api/orders/o1/estado')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
      .send({ estado: 'inventado' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
  })

  it('rechaza campos extra con 400 VALIDATION', async () => {
    const res = await request(appCon())
      .patch('/api/orders/o1/estado')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
      .send({ estado: 'cancelado', motivo: 'porque sí' })
    expect(res.status).toBe(400)
  })

  it('cambia el estado y responde 200', async () => {
    const orders = fakeOrders();
    const res = await request(appCon({ orders }))
      .patch('/api/orders/o9/estado')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
      .send({ estado: 'cancelado' })
    expect(res.status).toBe(200)
    expect(orders.estados).toEqual([{ id: 'o9', estado: 'cancelado' }])
  })

  it('sin sesión responde 401', async () => {
    const res = await request(appCon()).patch('/api/orders/o1/estado').send({ estado: 'cancelado' })
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/products/:id', () => {
  it('rechaza un precio negativo con 400 VALIDATION', async () => {
    const res = await request(appCon())
      .patch('/api/products/p1')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
      .send({ precio_bob_cents: -5 })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
  })

  it('rechaza un stock negativo con 400 VALIDATION', async () => {
    const res = await request(appCon())
      .patch('/api/products/p1')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
      .send({ stock: -1 })
    expect(res.status).toBe(400)
  })

  it('rechaza una oferta mayor que el precio de lista con 400 VALIDATION', async () => {
    const res = await request(appCon())
      .patch('/api/products/p1')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
      .send({ precio_oferta_bob_cents: 60000, precio_bob_cents: 59500 })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
  })

  it('acepta una oferta menor que el precio de lista', async () => {
    const actualizados: Parches[] = [];
    const catalog: CatalogDataSource = {
      ...CATALOGO,
      products: async () => [],
      updateProduct: async (_id, parches) => {
        actualizados.push({ ...parches });
        return {
          id: 'p1',
          slug: 'crayola-super-tips-150',
          nombre: 'Crayola Super Tips 150 Colores',
          descripcion: '',
          brand_id: null,
          category_id: null,
          precio_bob_cents: parches.precio_bob_cents ?? 59500,
          precio_oferta_bob_cents: parches.precio_oferta_bob_cents ?? null,
          stock: parches.stock ?? 24,
          sku: null,
          color: null,
          imagenes: [],
          destacado: false,
          demo: true,
          activo: parches.activo ?? true,
          created_at: '2026-01-01T00:00:00.000Z',
        };
      },
    };
    const res = await request(
      createApp({ env, catalog, orders: fakeOrders(), profiles: fakeProfiles() }),
    )
      .patch('/api/products/p1')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
      .send({ precio_oferta_bob_cents: 54900, precio_bob_cents: 59500 })
    expect(res.status).toBe(200)
    expect(actualizados[0]?.precio_bob_cents).toBe(59500)
  })

  it('responde 404 si el producto no existe', async () => {
    const catalog: CatalogDataSource = { ...CATALOGO, updateProduct: async () => null };
    const res = await request(
      createApp({ env, catalog, orders: fakeOrders(), profiles: fakeProfiles() }),
    )
      .patch('/api/products/no-existe')
      .set('authorization', `Bearer ${await token(EMAIL_ADMIN)}`)
      .send({ stock: 5 })
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('sin sesión responde 401', async () => {
    const res = await request(appCon()).patch('/api/products/p1').send({ stock: 5 })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/orders/mine', () => {
  it('sin token responde 401', async () => {
    const res = await request(appCon()).get('/api/orders/mine')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('devuelve solo las órdenes del email del token', async () => {
    const pedidos: string[] = [];
    const orders = fakeOrders({
      listOrdersByEmail: async (email) => {
        pedidos.push(email);
        return [orden(email)];
      },
    });
    const res = await request(appCon({ orders }))
      .get('/api/orders/mine?email=otro@ejemplo.com')
      .set('authorization', `Bearer ${await token(EMAIL_CLIENTE)}`)
    expect(res.status).toBe(200)
    expect(pedidos).toEqual([EMAIL_CLIENTE])
    expect(res.body.items.every((i: { cliente_email: string }) => i.cliente_email === EMAIL_CLIENTE)).toBe(
      true,
    )
  })
})

describe('respaldo de Supabase para tokens ES256', () => {
  // Supabase firma sus access tokens con ES256: HS256 con el secret local falla
  // siempre, asi que sin el respaldo el admin nunca puede entrar.
  it('GET /api/orders acepta el token que valida Supabase', async () => {
    const respaldo = vi.fn(async () => ({ id: 'u-admin', email: EMAIL_ADMIN }))
    const res = await request(appCon({ respaldo }))
      .get('/api/orders')
      .set('authorization', 'Bearer token-es256-de-supabase')
    expect(respaldo).toHaveBeenCalledWith('token-es256-de-supabase')
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(1)
  })

  it('GET /api/orders/mine acepta el token que valida Supabase', async () => {
    const respaldo: RespaldoToken = async () => ({ id: 'u1', email: EMAIL_CLIENTE })
    const res = await request(appCon({ respaldo }))
      .get('/api/orders/mine')
      .set('authorization', 'Bearer token-es256-de-supabase')
    expect(res.status).toBe(200)
    expect(res.body.items[0].cliente_email).toBe(EMAIL_CLIENTE)
  })

  it('sin respaldo, un token que Supabase si aceptaria responde 401', async () => {
    const res = await request(appCon())
      .get('/api/orders')
      .set('authorization', 'Bearer token-es256-de-supabase')
    expect(res.status).toBe(401)
  })
})
