import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { assertConfigProduccion, loadEnv } from '../src/env.js';
import { listProducts } from '../src/modules/catalog/catalog.service.js';
import type {
  BrandRow,
  CatalogDataSource,
  CategoryRow,
  ProductFilters,
  ProductRow,
  ProductVariantRow,
} from '../src/modules/catalog/catalog.types.js';
import type { OrdersDataSource } from '../src/modules/orders/orders.types.js';

const base = {
  PORT: '4000',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'k',
  SUPABASE_JWT_SECRET: 's',
  ADMIN_EMAILS: '',
};

const envTest = loadEnv({
  ...base,
  NODE_ENV: 'test',
  ALLOWED_ORIGINS: '',
  RATE_LIMIT_ENABLED: 'false',
});

const envConLimite = loadEnv({
  ...base,
  NODE_ENV: 'test',
  ALLOWED_ORIGINS: '',
  RATE_LIMIT_ENABLED: 'true',
});

const fila = (o: Partial<ProductRow> = {}): ProductRow => ({
  id: 'p1',
  slug: 'crayola-super-tips-150',
  nombre: 'Crayola Super Tips 150 Colores',
  descripcion: 'Marcadores de colores',
  brand_id: 'b1',
  category_id: 'c1',
  precio_bob_cents: 59500,
  precio_oferta_bob_cents: 54900,
  stock: 24,
  sku: null,
  color: 'Multicolor',
  imagenes: [],
  destacado: true,
  demo: true,
  activo: true,
  created_at: '2026-10-07T00:00:00Z',
  ...o,
});

const variante = (o: Partial<ProductVariantRow> = {}): ProductVariantRow => ({
  id: 'v1',
  product_id: 'p1',
  nombre: 'Bolsa 150 colores',
  valor: '#7C3AED',
  stock: 24,
  sku: null,
  orden: 1,
  ...o,
});

type FakeCatalog = CatalogDataSource & { lastFilters: ProductFilters | null };

function fakeCatalog(overrides: Partial<CatalogDataSource> = {}): FakeCatalog {
  const fake: FakeCatalog = {
    lastFilters: null,
    async products(f) {
      fake.lastFilters = f;
      return [fila()];
    },
    async countProducts() {
      return 1;
    },
    async productBySlug() {
      return fila();
    },
    async updateProduct() {
      return null;
    },
    async productsPorIds() {
      return [fila()];
    },
    async variantsFor() {
      return [variante()];
    },
    async categories(): Promise<CategoryRow[]> {
      return [];
    },
    async brands(): Promise<BrandRow[]> {
      return [];
    },
    ...overrides,
  } as FakeCatalog;
  return fake;
}

type OrdenesCapturadas = {
  dataSource: OrdersDataSource;
  registros: Array<{ cliente_email: string; cliente_nombre: string }>;
};

function fakeOrders(): OrdenesCapturadas {
  const registros: OrdenesCapturadas['registros'] = [];
  const pedido = {
    id: 'o1',
    folio: 'SHM-000001',
    estado: 'nuevo',
    total_bob_cents: 109800,
    cliente_nombre: 'n',
    cliente_email: 'e',
    cliente_telefono: 't',
    envio_tipo: 'cochabamba',
    envio_direccion: null,
    envio_ciudad: null,
    created_at: '2026-10-07T00:00:00Z',
    items: [],
  };
  const dataSource: OrdersDataSource = {
    async findByIdempotencyKey() {
      return null;
    },
    async nextFolio() {
      return 'SHM-000001';
    },
    async createOrder(record) {
      registros.push({ cliente_email: record.cliente_email, cliente_nombre: record.cliente_nombre });
      return { ...pedido, cliente_email: record.cliente_email };
    },
    async listOrdersByEmail() {
      return [];
    },
    async listAll() {
      return [];
    },
    async updateEstado() {
      return pedido;
    },
  };
  return { dataSource, registros };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('I7 el limite general cuenta por cliente y no es global', () => {
  it('agotar la cuota de una IP no bloquea a otra', async () => {
    const app = createApp({ env: envConLimite });
    for (let i = 0; i < 20; i += 1) {
      const res = await request(app).get('/api/health').set('X-Forwarded-For', '9.9.9.9');
      expect(res.status).toBe(200);
    }
    const agotada = await request(app).get('/api/health').set('X-Forwarded-For', '9.9.9.9');
    expect(agotada.status).toBe(429);

    const otra = await request(app).get('/api/health').set('X-Forwarded-For', '8.8.8.8');
    expect(otra.status).toBe(200);
  });
});

describe('I11 los errores inesperados quedan logueados', () => {
  it('loguea el error original cuando no es AppError', async () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = createApp({
      env: envTest,
      catalog: fakeCatalog({
        async products() {
          throw new Error('se cayo la base');
        },
      }),
    });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL');
    expect(espia).toHaveBeenCalled();
  });

  it('no loguea los errores de validacion, que son respuestas esperadas', async () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = createApp({ env: envTest, catalog: fakeCatalog() });
    await request(app).get('/api/products?pagina=0');
    expect(espia).not.toHaveBeenCalled();
  });
});

describe('I12 la configuracion de produccion falla cerrada', () => {
  const prod = (o: Record<string, string> = {}) =>
    loadEnv({
      ...base,
      NODE_ENV: 'production',
      ALLOWED_ORIGINS: 'https://shimer-lilac.vercel.app',
      RATE_LIMIT_ENABLED: 'true',
      ADMIN_EMAILS: 'dueño@example.com',
      ...o,
    });

  it('falla si ALLOWED_ORIGINS queda vacio en produccion', () => {
    expect(() => assertConfigProduccion(prod({ ALLOWED_ORIGINS: '' }))).toThrow(/ALLOWED_ORIGINS/);
  });

  it('falla si el rate limit esta apagado en produccion', () => {
    expect(() => assertConfigProduccion(prod({ RATE_LIMIT_ENABLED: 'false' }))).toThrow(
      /RATE_LIMIT_ENABLED/,
    );
  });

  it('falla si ADMIN_EMAILS queda vacio en produccion', () => {
    expect(() => assertConfigProduccion(prod({ ADMIN_EMAILS: '' }))).toThrow(/ADMIN_EMAILS/);
  });

  it('acepta una configuracion de produccion completa', () => {
    expect(() => assertConfigProduccion(prod())).not.toThrow();
  });

  it('es silencioso fuera de produccion', () => {
    expect(() => assertConfigProduccion(envTest)).not.toThrow();
  });
});

describe('I1 los filtros de varias categorias llegan como lista', () => {
  it('traduce una lista de categorias a categoria_slugs', async () => {
    const catalog = fakeCatalog();
    await listProducts(catalog, {
      orden: 'destacado',
      pagina: 1,
      por_pagina: 24,
      categoria: 'arte-diseno,escolar',
    });
    expect(catalog.lastFilters?.categoria_slugs).toEqual(['arte-diseno', 'escolar']);
  });

  it('una sola categoria sigue siendo una lista de un elemento', async () => {
    const catalog = fakeCatalog();
    await listProducts(catalog, {
      orden: 'destacado',
      pagina: 1,
      por_pagina: 24,
      categoria: 'arte-diseno',
    });
    expect(catalog.lastFilters?.categoria_slugs).toEqual(['arte-diseno']);
  });

  it('la ruta acepta la lista separada por comas', async () => {
    const catalog = fakeCatalog();
    const app = createApp({ env: envTest, catalog });
    const res = await request(app).get('/api/products?categoria=arte-diseno,escolar');
    expect(res.status).toBe(200);
    expect(catalog.lastFilters?.categoria_slugs).toEqual(['arte-diseno', 'escolar']);
  });

  it('sin el filtro no inventa la lista', async () => {
    const catalog = fakeCatalog();
    await listProducts(catalog, { orden: 'destacado', pagina: 1, por_pagina: 24 });
    expect(catalog.lastFilters?.categoria_slugs).toBeUndefined();
  });
});

describe('I8 el correo del cliente se normaliza', () => {
  it('guarda el correo en minusculas y sin espacios', async () => {
    const app = createApp({
      env: envTest,
      catalog: fakeCatalog(),
      orders: fakeOrders().dataSource,
    });
    const res = await request(app)
      .post('/api/orders')
      .set('idempotency-key', 'k-1')
      .send({
        cliente_nombre: '  Juan Perez  ',
        cliente_email: '  Juan.Perez@Gmail.COM  ',
        cliente_telefono: '70000000',
        envio_tipo: 'cochabamba',
        items: [{ product_id: 'p1', cantidad: 2 }],
      });
    expect(res.status).toBe(201);
  });

  it('el registro guardado trae el correo normalizado y el nombre sin espacios', async () => {
    const { dataSource, registros } = fakeOrders();
    const app = createApp({ env: envTest, catalog: fakeCatalog(), orders: dataSource });
    await request(app)
      .post('/api/orders')
      .set('idempotency-key', 'k-2')
      .send({
        cliente_nombre: '  Juan Perez  ',
        cliente_email: '  Juan.Perez@Gmail.COM  ',
        cliente_telefono: ' 70000000 ',
        envio_tipo: 'cochabamba',
        items: [{ product_id: 'p1', cantidad: 1 }],
      });
    expect(registros).toEqual([
      { cliente_email: 'juan.perez@gmail.com', cliente_nombre: 'Juan Perez' },
    ]);
  });
});

describe('M10 la API recorta los textos del cliente', () => {
  it('un nombre de puros espacios se rechaza', async () => {
    const app = createApp({
      env: envTest,
      catalog: fakeCatalog(),
      orders: fakeOrders().dataSource,
    });
    const res = await request(app)
      .post('/api/orders')
      .set('idempotency-key', 'k-3')
      .send({
        cliente_nombre: '   ',
        cliente_email: 'a@b.com',
        cliente_telefono: '70000000',
        envio_tipo: 'cochabamba',
        items: [{ product_id: 'p1', cantidad: 1 }],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });
});

describe('I13 el orden curado de las variantes se respeta', () => {
  it('las variantes llegan ordenadas por su campo orden', async () => {
    const app = createApp({
      env: envTest,
      catalog: fakeCatalog({
        async variantsFor() {
          return [
            variante({ id: 'v-cuarto', nombre: 'Azul', orden: 4 }),
            variante({ id: 'v-primero', nombre: 'Blanco', orden: 1 }),
            variante({ id: 'v-tercero', nombre: 'Amarillo', orden: 3 }),
            variante({ id: 'v-segundo', nombre: 'Negro', orden: 2 }),
          ];
        },
      }),
    });
    const res = await request(app).get('/api/products/crayola-super-tips-150');
    expect(res.status).toBe(200);
    expect(res.body.variantes.map((v: { nombre: string }) => v.nombre)).toEqual([
      'Blanco',
      'Negro',
      'Amarillo',
      'Azul',
    ]);
  });

  it('la vista expone el orden para que el cliente no lo adivine', async () => {
    const app = createApp({
      env: envTest,
      catalog: fakeCatalog({
        async variantsFor() {
          return [variante({ id: 'v-b', nombre: 'Negro', orden: 2 })];
        },
      }),
    });
    const res = await request(app).get('/api/products/crayola-super-tips-150');
    expect(res.body.variantes[0].orden).toBe(2);
  });
});
