import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { supabaseCatalogDataSource } from '../src/db.js';
import type { ProductFilters } from '../src/modules/catalog/catalog.types.js';

type Llamada = { nombre: string; args: unknown[] };

function clienteFalso() {
  const selects: string[] = [];
  const calls: Llamada[] = [];
  let terminal: string | null = null;

  const chain: Record<string, unknown> = {};
  const metodos = [
    'select',
    'eq',
    'neq',
    'gte',
    'lte',
    'not',
    'is',
    'order',
    'range',
    'in',
    'maybeSingle',
    'single',
  ];
  for (const m of metodos) {
    chain[m] = (...args: unknown[]) => {
      calls.push({ nombre: m, args });
      if (m === 'select') selects.push(String(args[0]));
      if (m === 'maybeSingle' || m === 'single') terminal = m;
      return chain;
    };
  }
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) =>
    Promise.resolve(
      terminal === 'maybeSingle' || terminal === 'single'
        ? { data: null, error: null }
        : { data: [], error: null, count: 0 },
    ).then(onFulfilled, onRejected);

  const client = {
    from: (tabla: string) => {
      calls.push({ nombre: 'from', args: [tabla] });
      return chain;
    },
  };

  return { client: client as unknown as SupabaseClient, selects, calls };
}

const filtros = (o: Partial<ProductFilters> = {}): ProductFilters => ({
  activo: true,
  orden: 'destacado',
  desde: 0,
  limite: 24,
  ...o,
});

describe('supabaseCatalogDataSource.products', () => {
  it('selecciona productos con los embeds de categoría y marca', async () => {
    const { client, selects } = clienteFalso();
    await supabaseCatalogDataSource(client).products(filtros());
    expect(selects[0]).toBe('*, categories(slug,nombre), brands(slug,nombre)');
  });

  it('exige inner join en categoría cuando se filtra por su slug', async () => {
    const { client, selects } = clienteFalso();
    await supabaseCatalogDataSource(client).products(filtros({ categoria_slug: 'arte-diseno' }));
    expect(selects[0]).toContain('categories!inner(slug,nombre)');
    expect(selects[0]).toContain('brands(slug,nombre)');
    expect(selects[0]).not.toContain('brands!inner');
  });

  it('exige inner join en marca cuando se filtra por su slug', async () => {
    const { client, selects } = clienteFalso();
    await supabaseCatalogDataSource(client).products(filtros({ marca_slug: 'crayola' }));
    expect(selects[0]).toContain('brands!inner(slug,nombre)');
    expect(selects[0]).toContain('categories(slug,nombre)');
  });

  it('no descarta productos sin categoría cuando no se filtra por categoría', async () => {
    const { client, selects } = clienteFalso();
    await supabaseCatalogDataSource(client).products(filtros());
    expect(selects[0]).not.toContain('categories!inner');
    expect(selects[0]).not.toContain('brands!inner');
  });

  it('el conteo también exige inner join en las relaciones que se filtran', async () => {
    const { client, selects } = clienteFalso();
    const src = supabaseCatalogDataSource(client);
    const f = filtros({ categoria_slug: 'arte-diseno', marca_slug: 'crayola' });
    await src.countProducts(f);
    await src.products(f);
    for (const select of selects) {
      expect(select).toContain('categories!inner');
      expect(select).toContain('brands!inner');
    }
  });

  it('busca por slug sin inner join para no perder productos sin categoría', async () => {
    const { client, selects } = clienteFalso();
    await supabaseCatalogDataSource(client).productBySlug('crayola-super-tips-150');
    expect(selects[0]).toBe('*, categories(slug,nombre), brands(slug,nombre)');
    expect(selects[0]).not.toContain('!inner');
  });

  it('incluye los embeds también en el conteo cuando filtra por categoría', async () => {
    const { client, selects, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).countProducts(
      filtros({ categoria_slug: 'arte-diseno' }),
    );
    expect(selects[0]).toContain('categories');
    expect(selects[0]).toContain('brands');
    expect(calls).toContainEqual({ nombre: 'eq', args: ['categories.slug', 'arte-diseno'] });
  });

  it('incluye los embeds en el conteo cuando filtra por marca', async () => {
    const { client, selects, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).countProducts(filtros({ marca_slug: 'crayola' }));
    expect(selects[0]).toContain('categories');
    expect(selects[0]).toContain('brands');
    expect(calls).toContainEqual({ nombre: 'eq', args: ['brands.slug', 'crayola'] });
  });

  it('filtra por el slug de la categoría embebida', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).countProducts(
      filtros({ categoria_slug: 'arte-diseno' }),
    );
    expect(calls).toContainEqual({ nombre: 'eq', args: ['categories.slug', 'arte-diseno'] });
  });

  it('traduce precio_min y precio_max a cents en la columna de precio', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).products(
      filtros({ precio_min_cents: 10000, precio_max_cents: 100000 }),
    );
    expect(calls).toContainEqual({ nombre: 'gte', args: ['precio_bob_cents', 10000] });
    expect(calls).toContainEqual({ nombre: 'lte', args: ['precio_bob_cents', 100000] });
  });

  it('en_oferta true busca las filas con precio de oferta no nulo', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).products(filtros({ en_oferta: true }));
    expect(calls).toContainEqual({
      nombre: 'not',
      args: ['precio_oferta_bob_cents', 'is', null],
    });
  });

  it('en_oferta false busca las filas sin precio de oferta', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).products(filtros({ en_oferta: false }));
    expect(calls).toContainEqual({
      nombre: 'is',
      args: ['precio_oferta_bob_cents', null],
    });
  });

  it('traduce cada orden a su cláusula de ordenamiento', async () => {
    const casos: Array<[ProductFilters['orden'], Array<[string, boolean]>]> = [
      ['destacado', [
        ['destacado', false],
        ['created_at', false],
      ]],
      ['recientes', [['created_at', false]]],
      ['precio_asc', [['precio_bob_cents', true]]],
      ['precio_desc', [['precio_bob_cents', false]]],
      ['nombre', [['nombre', true]]],
    ];
    for (const [orden, esperado] of casos) {
      const { client, calls } = clienteFalso();
      await supabaseCatalogDataSource(client).products(filtros({ orden }));
      const orders = calls.filter((c) => c.nombre === 'order');
      expect(orders.map((o) => [o.args[0], (o.args[1] as { ascending: boolean }).ascending])).toEqual(
        esperado,
      );
    }
  });

  it('pagina con range usando desde y limite', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).products(filtros({ desde: 24, limite: 12 }));
    expect(calls).toContainEqual({ nombre: 'range', args: [24, 35] });
  });

  it('no consulta variantes cuando la lista de ids está vacía', async () => {
    const { client, calls } = clienteFalso();
    const res = await supabaseCatalogDataSource(client).variantsFor([]);
    expect(res).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('busca las variantes de todos los ids en una sola consulta', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).variantsFor(['p1', 'p2']);
    expect(calls).toContainEqual({ nombre: 'in', args: ['product_id', ['p1', 'p2']] });
  });

  it('propaga el error de Supabase como excepción con contexto', async () => {
    const { client } = clienteFalso();
    const roto = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              order: () => ({
                range: async () => ({ data: null, error: { message: 'boom' } }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;
    void client;
    await expect(supabaseCatalogDataSource(roto).products(filtros())).rejects.toThrow(
      'products: boom',
    );
  });
});