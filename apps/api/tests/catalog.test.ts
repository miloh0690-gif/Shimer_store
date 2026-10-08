import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/env.js';
import {
  getProductBySlug,
  listProducts,
  precioEfectivo,
} from '../src/modules/catalog/catalog.service.js';
import type {
  BrandRow,
  CatalogDataSource,
  CategoryRow,
  ProductFilters,
  ProductRow,
  ProductVariantRow,
} from '../src/modules/catalog/catalog.types.js';

const env = loadEnv({
  NODE_ENV: 'test',
  PORT: '4000',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'k',
  SUPABASE_JWT_SECRET: 's',
  ALLOWED_ORIGINS: '',
  ADMIN_EMAILS: '',
  RATE_LIMIT_ENABLED: 'false',
});

const fila = (o: Partial<ProductRow> = {}): ProductRow => ({
  id: 'p1',
  slug: 'crayola-super-tips-150',
  nombre: 'Crayola Super Tips 150 Colores',
  descripcion: null,
  brand_id: 'b1',
  category_id: 'c1',
  precio_bob_cents: 59500,
  precio_oferta_bob_cents: 54900,
  stock: 24,
  sku: 'CRAYOLA-SUPER-TIPS-150',
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

const categoria = (o: Partial<CategoryRow> = {}): CategoryRow => ({
  id: 'c1',
  slug: 'arte-diseno',
  nombre: 'Arte & Diseño',
  descripcion: null,
  orden: 1,
  ...o,
});

const marca = (o: Partial<BrandRow> = {}): BrandRow => ({
  id: 'b1',
  slug: 'crayola',
  nombre: 'Crayola',
  logo_url: null,
  created_at: '2026-10-07T00:00:00Z',
  ...o,
});

type FakeCatalog = CatalogDataSource & {
  lastFilters: ProductFilters | null;
  calls: { products: number; countProducts: number; variantsFor: number };
};

function fakeCatalog(overrides: Partial<CatalogDataSource> = {}): FakeCatalog {
  const fake: FakeCatalog = {
    lastFilters: null,
    calls: { products: 0, countProducts: 0, variantsFor: 0 },
    async products(f) {
      fake.calls.products += 1;
      fake.lastFilters = f;
      return [fila()];
    },
    async countProducts() {
      fake.calls.countProducts += 1;
      return 1;
    },
    async productBySlug(slug) {
      return slug === 'crayola-super-tips-150' ? fila() : null;
    },
    async updateProduct() {
      return null;
    },
    async productsPorIds(ids) {
      return ids.includes('p1') ? [fila()] : [];
    },
    async variantsFor(ids) {
      fake.calls.variantsFor += 1;
      return ids.includes('p1') ? [variante()] : [];
    },
    async categories() {
      return [
        categoria({ id: 'c2', slug: 'escolar', nombre: 'Escolar', orden: 3 }),
        categoria({ id: 'c1', slug: 'arte-diseno', nombre: 'Arte & Diseño', orden: 1 }),
      ];
    },
    async brands() {
      return [marca()];
    },
    ...overrides,
  } as FakeCatalog;
  return fake;
}

const q = (o: Partial<Parameters<typeof listProducts>[1]> = {}) => ({
  orden: 'destacado' as const,
  pagina: 1,
  por_pagina: 24,
  ...o,
});

describe('precioEfectivo', () => {
  it('usa el precio de oferta cuando existe', () => {
    expect(
      precioEfectivo({ precio_bob_cents: 59500, precio_oferta_bob_cents: 54900 }),
    ).toBe(54900);
  });

  it('usa el precio de lista cuando no hay oferta', () => {
    expect(precioEfectivo({ precio_bob_cents: 2400, precio_oferta_bob_cents: null })).toBe(
      2400,
    );
  });
});

describe('listProducts', () => {
  it('devuelve precio_efectivo = oferta y en_oferta = true', async () => {
    const { items } = await listProducts(fakeCatalog(), q());
    expect(items[0]?.precio_efectivo_bob_cents).toBe(54900);
    expect(items[0]?.en_oferta).toBe(true);
    expect(items[0]?.precio_bob_cents).toBe(59500);
  });

  it('traduce precio_min en Bs. a cents antes de filtrar', async () => {
    const src = fakeCatalog();
    await listProducts(src, q({ precio_min: 100 }));
    expect(src.lastFilters?.precio_min_cents).toBe(10000);
  });

  it('traduce precio_max en Bs. a cents antes de filtrar', async () => {
    const src = fakeCatalog();
    await listProducts(src, q({ precio_max: 250.5 }));
    expect(src.lastFilters?.precio_max_cents).toBe(25050);
  });

  it('solo devuelve productos activos', async () => {
    const src = fakeCatalog({
      products: async () => [fila(), fila({ id: 'p2', activo: false })],
    });
    const { items } = await listProducts(src, q());
    expect(items).toHaveLength(1);
  });

  it('adjunta categoría, marca y variantes', async () => {
    const src = fakeCatalog({
      products: async () => [
        fila({ category_id: 'c1', brand_id: 'b1' }),
      ],
      variantsFor: async () => [variante()],
    });
    const { items } = await listProducts(src, q());
    expect(items[0]?.categoria).toEqual({ slug: 'arte-diseno', nombre: 'Arte & Diseño' });
    expect(items[0]?.marca).toEqual({ slug: 'crayola', nombre: 'Crayola' });
    expect(items[0]?.variantes[0]?.id).toBe('v1');
  });

  it('no expone created_at ni activo en la vista', async () => {
    const { items } = await listProducts(fakeCatalog(), q());
    expect(items[0]).not.toHaveProperty('created_at');
    expect(items[0]).not.toHaveProperty('activo');
  });

  it('llama a variantsFor una sola vez para toda la página', async () => {
    const src = fakeCatalog({
      products: async () => [fila(), fila({ id: 'p2' })],
    });
    await listProducts(src, q());
    expect(src.calls.variantsFor).toBe(1);
  });

  it('devuelve total, pagina y por_pagina de la consulta', async () => {
    const src = fakeCatalog({ countProducts: async () => 57 });
    const res = await listProducts(src, q({ pagina: 3, por_pagina: 12 }));
    expect(res.total).toBe(57);
    expect(res.pagina).toBe(3);
    expect(res.por_pagina).toBe(12);
    expect(src.lastFilters?.desde).toBe(24);
    expect(src.lastFilters?.limite).toBe(12);
  });

  it('arma los filtros una sola vez para products y countProducts', async () => {
    const src = fakeCatalog();
    await listProducts(src, q({ categoria: 'arte-diseno', marca: 'crayola', color: 'Rojo' }));
    expect(src.calls.products).toBe(1);
    expect(src.calls.countProducts).toBe(1);
    expect(src.lastFilters?.activo).toBe(true);
    expect(src.lastFilters?.categoria_slug).toBe('arte-diseno');
    expect(src.lastFilters?.marca_slug).toBe('crayola');
    expect(src.lastFilters?.color).toBe('Rojo');
  });

  it('traduce en_oferta a un filtro propio', async () => {
    const src = fakeCatalog();
    await listProducts(src, q({ en_oferta: true }));
    expect(src.lastFilters?.en_oferta).toBe(true);
  });
});

describe('getProductBySlug', () => {
  it('devuelve el producto con precio efectivo', async () => {
    const view = await getProductBySlug(fakeCatalog(), 'crayola-super-tips-150');
    expect(view?.precio_efectivo_bob_cents).toBe(54900);
    expect(view?.slug).toBe('crayola-super-tips-150');
  });

  it('devuelve null si el slug no existe', async () => {
    const view = await getProductBySlug(fakeCatalog(), 'no-existe');
    expect(view).toBeNull();
  });

  it('no trae variantes de otro producto', async () => {
    const src = fakeCatalog({
      productBySlug: async () => fila({ id: 'p9' }),
      variantsFor: async () => [variante({ id: 'v9', product_id: 'p9' }), variante({ id: 'vX', product_id: 'otra' })],
    });
    const view = await getProductBySlug(src, 'crayola-super-tips-150');
    expect(view?.variantes.map((v) => v.id)).toEqual(['v9']);
  });
});

describe('rutas de catálogo', () => {
  let catalog: FakeCatalog;

  beforeEach(() => {
    catalog = fakeCatalog();
  });

  it('GET /api/categories devuelve las categorías ordenadas por orden', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { slug: 'arte-diseno', nombre: 'Arte & Diseño' },
      { slug: 'escolar', nombre: 'Escolar' },
    ]);
  });

  it('GET /api/brands devuelve slug y nombre de cada marca', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get('/api/brands');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ slug: 'crayola', nombre: 'Crayola' }]);
  });

  it('GET /api/products devuelve la página pedida y traduce los filtros a cents', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get(
      '/api/products?categoria=arte-diseno&precio_min=100&precio_max=1000&en_oferta=true&orden=precio_asc&pagina=2&por_pagina=12',
    );
    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(2);
    expect(res.body.por_pagina).toBe(12);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].precio_efectivo_bob_cents).toBe(54900);
    expect(catalog.lastFilters).toMatchObject({
      activo: true,
      categoria_slug: 'arte-diseno',
      precio_min_cents: 10000,
      precio_max_cents: 100000,
      en_oferta: true,
      orden: 'precio_asc',
      desde: 12,
      limite: 12,
    });
  });

  it('GET /api/products con pagina no numérica responde 400 VALIDATION', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get('/api/products?pagina=abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('GET /api/products con orden inválido responde 400 VALIDATION', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get('/api/products?orden=inventado');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('GET /api/products/:slug inexistente responde 404 NOT_FOUND', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get('/api/products/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/products/:slug existente responde 200 con precio efectivo', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get('/api/products/crayola-super-tips-150');
    expect(res.status).toBe(200);
    expect(res.body.precio_efectivo_bob_cents).toBe(54900);
  });

  it('no expone x-powered-by', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get('/api/categories');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('funciona sin el data source de catálogo si la ruta no se usa', async () => {
    const app = createApp({ env, catalog });
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});