import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import {
  supabaseCatalogDataSource,
  supabaseOrdersDataSource,
  supabaseProfilesDataSource,
} from '../src/db.js';
import type { ProductFilters } from '../src/modules/catalog/catalog.types.js';

type Llamada = { nombre: string; args: unknown[] };

function clienteFalso() {
  const selects: string[] = [];
  const calls: Llamada[] = [];
  let terminal: string | null = null;

  const chain: Record<string, unknown> = {};
  const metodos = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'gte',
    'lte',
    'not',
    'is',
    'order',
    'range',
    'in',
    'or',
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
    await supabaseCatalogDataSource(client).products(filtros({ categoria_slugs: ['arte-diseno'] }));
    expect(selects[0]).toContain('categories!inner(slug,nombre)');
    expect(selects[0]).toContain('brands(slug,nombre)');
    expect(selects[0]).not.toContain('brands!inner');
  });

  it('exige inner join en marca cuando se filtra por su slug', async () => {
    const { client, selects } = clienteFalso();
    await supabaseCatalogDataSource(client).products(filtros({ marca_slugs: ['crayola'] }));
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
    const f = filtros({ categoria_slugs: ['arte-diseno'], marca_slugs: ['crayola'] });
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
      filtros({ categoria_slugs: ['arte-diseno'] }),
    );
    expect(selects[0]).toContain('categories');
    expect(selects[0]).toContain('brands');
    expect(calls).toContainEqual({ nombre: 'in', args: ['categories.slug', ['arte-diseno']] });
  });

  it('incluye los embeds en el conteo cuando filtra por marca', async () => {
    const { client, selects, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).countProducts(filtros({ marca_slugs: ['crayola'] }));
    expect(selects[0]).toContain('categories');
    expect(selects[0]).toContain('brands');
    expect(calls).toContainEqual({ nombre: 'in', args: ['brands.slug', ['crayola']] });
  });

  it('filtra por el slug de la categoría embebida', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).countProducts(
      filtros({ categoria_slugs: ['arte-diseno'] }),
    );
    expect(calls).toContainEqual({ nombre: 'in', args: ['categories.slug', ['arte-diseno']] });
  });

  it('traduce precio_min y precio_max a cents en la columna de precio', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).products(
      filtros({ precio_min_cents: 10000, precio_max_cents: 100000 }),
    );
    // El filtro de precio va por la columna generada, que ya vale el precio
    // de oferta cuando hay oferta, y no por el precio de lista.
    expect(calls).toContainEqual({ nombre: 'gte', args: ['precio_efectivo_cents', 10000] });
    expect(calls).toContainEqual({ nombre: 'lte', args: ['precio_efectivo_cents', 100000] });
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
      // Ordenar por precio usa la columna efectiva: si no, un producto en
      // oferta de Bs. 48 aparece despues de uno de Bs. 49.
      ['precio_asc', [['precio_efectivo_cents', true]]],
      ['precio_desc', [['precio_efectivo_cents', false]]],
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
// ── Pedidos ────────────────────────────────────────────────────────────────
// Fake con respuesta por tabla: `createOrder` escribe en `orders` y luego en
// `order_items`, y cada respuesta tiene que ser distinta.

type Respuesta = { data: unknown; error: { message: string; code?: string } | null };

function clientePedidos(respuestas: Record<string, Respuesta[]> = {}): {
  client: SupabaseClient;
  calls: Llamada[];
} {
  const calls: Llamada[] = [];
  const usados: Record<string, number> = {};

  function responder(tabla: string): Respuesta {
    const lista = respuestas[tabla] ?? [];
    const i = usados[tabla] ?? 0;
    usados[tabla] = i + 1;
    return lista[i] ?? { data: null, error: null };
  }

  function chain(tabla: string) {
    const c: Record<string, unknown> = {};
    const metodos = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'in', 'single', 'maybeSingle'];
    for (const m of metodos) {
      c[m] = (...args: unknown[]) => {
        calls.push({ nombre: `${tabla}.${m}`, args });
        if (m === 'single' || m === 'maybeSingle') c.__terminal = m;
        return c;
      };
    }
    c.then = (onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) => {
      const r = responder(tabla);
      const data = c.__terminal === 'maybeSingle' || c.__terminal === 'single' ? r.data : r.data ?? [];
      return Promise.resolve({ data, error: r.error, count: Array.isArray(data) ? data.length : 0 }).then(
        onFulfilled,
        onRejected,
      );
    };
    return c;
  }

  const client = {
    from: (tabla: string) => {
      calls.push({ nombre: 'from', args: [tabla] });
      return chain(tabla);
    },
    rpc: (fn: string) => {
      calls.push({ nombre: 'rpc', args: [fn] });
      return Promise.resolve(respuestas.rpc?.[0] ?? { data: 'SHM-000001', error: null });
    },
  };

  return { client: client as unknown as SupabaseClient, calls };
}

const ORDEN_FILA = {
  id: 'o1',
  folio: 'SHM-000001',
  idempotency_key: 'k1',
  estado: 'nuevo',
  total_bob_cents: 109800,
  cliente_nombre: 'Ana',
  cliente_email: 'ana@example.com',
  cliente_telefono: '70000000',
  envio_tipo: 'cochabamba',
  envio_direccion: null,
  envio_ciudad: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

const ITEM_FILA = {
  id: 'oi1',
  order_id: 'o1',
  product_id: 'p1',
  variant_id: null,
  nombre_snapshot: 'Crayola Super Tips 150 Colores',
  precio_unitario_bob_cents: 54900,
  cantidad: 2,
  subtotal_bob_cents: 109800,
};

const RECORD = {
  folio: 'SHM-000001',
  idempotency_key: 'k1',
  cliente_nombre: 'Ana',
  cliente_email: 'ana@example.com',
  cliente_telefono: '70000000',
  envio_tipo: 'cochabamba',
  envio_direccion: null,
  envio_ciudad: null,
  total_bob_cents: 109800,
  items: [
    {
      product_id: 'p1',
      variant_id: null,
      nombre_snapshot: 'Crayola Super Tips 150 Colores',
      precio_unitario_bob_cents: 54900,
      cantidad: 2,
      subtotal_bob_cents: 109800,
    },
  ],
};

describe('supabaseCatalogDataSource.productsPorIds', () => {
  it('no consulta cuando no hay ids', async () => {
    const { client, calls } = clienteFalso();
    const res = await supabaseCatalogDataSource(client).productsPorIds([]);
    expect(res).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('consulta products filtrando por id', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).productsPorIds(['p1', 'p2']);
    // Tambien exige activo=true: un producto desactivado no se puede pedir.
    expect(calls.map((c) => c.nombre)).toEqual(['from', 'select', 'in', 'eq']);
    expect(calls[2]?.args).toEqual(['id', ['p1', 'p2']]);
    expect(calls[3]?.args).toEqual(['activo', true]);
  });
});

describe('supabaseOrdersDataSource', () => {
  it('nextFolio llama a la función next_folio de Postgres', async () => {
    const { client, calls } = clientePedidos();
    await expect(supabaseOrdersDataSource(client).nextFolio()).resolves.toBe('SHM-000001');
    expect(calls[0]).toEqual({ nombre: 'rpc', args: ['next_folio'] });
  });

  it('findByIdempotencyKey devuelve null si no hay orden', async () => {
    const { client } = clientePedidos({ orders: [{ data: null, error: null }] });
    await expect(
      supabaseOrdersDataSource(client).findByIdempotencyKey('k1'),
    ).resolves.toBeNull();
  });

  it('findByIdempotencyKey arma la orden con sus renglones', async () => {
    const { client } = clientePedidos({
      orders: [{ data: ORDEN_FILA, error: null }],
      order_items: [{ data: [ITEM_FILA], error: null }],
    });
    const orden = await supabaseOrdersDataSource(client).findByIdempotencyKey('k1');
    expect(orden?.folio).toBe('SHM-000001');
    expect(orden?.items).toHaveLength(1);
    expect(orden?.items[0]?.subtotal_bob_cents).toBe(109800);
  });

  it('createOrder inserta la orden y sus renglones y devuelve el total', async () => {
    const { client, calls } = clientePedidos({
      orders: [{ data: ORDEN_FILA, error: null }],
      order_items: [{ data: null, error: null }],
    });
    const orden = await supabaseOrdersDataSource(client).createOrder(RECORD);
    expect(orden.total_bob_cents).toBe(109800);
    const inserciones = calls.filter((c) => c.nombre.endsWith('.insert'));
    expect(inserciones.map((c) => c.nombre)).toEqual(['orders.insert', 'order_items.insert']);
  });

  it('createOrder borra la orden si falla el insert de los renglones', async () => {
    const { client, calls } = clientePedidos({
      orders: [{ data: ORDEN_FILA, error: null }],
      order_items: [{ data: null, error: { message: 'boom' } }],
    });
    await expect(supabaseOrdersDataSource(client).createOrder(RECORD)).rejects.toThrow(
      'order_items: boom',
    );
    expect(calls.some((c) => c.nombre === 'orders.delete')).toBe(true);
  });

  it('createOrder propaga el code 23505 para que el servicio detecte la carrera', async () => {
    const { client } = clientePedidos({
      orders: [{ data: null, error: { message: 'duplicate key', code: '23505' } }],
    });
    await expect(supabaseOrdersDataSource(client).createOrder(RECORD)).rejects.toMatchObject({
      code: '23505',
    });
  });

  it('listOrdersByEmail devuelve las órdenes de ese correo', async () => {
    const { client, calls } = clientePedidos({
      orders: [{ data: [ORDEN_FILA], error: null }],
      order_items: [{ data: [ITEM_FILA], error: null }],
    });
    const ordenes = await supabaseOrdersDataSource(client).listOrdersByEmail('ana@example.com');
    expect(ordenes).toHaveLength(1);
    expect(calls.some((c) => c.args[0] === 'cliente_email')).toBe(true);
  });

  it('updateEstado cambia el estado y falla si la orden no existe', async () => {
    // Postgres devuelve la fila ya actualizada, no la anterior.
    const { client } = clientePedidos({
      orders: [{ data: { ...ORDEN_FILA, estado: 'enviado' }, error: null }],
      order_items: [{ data: [], error: null }],
    });
    await expect(supabaseOrdersDataSource(client).updateEstado('o1', 'enviado')).resolves.toMatchObject({
      estado: 'enviado',
    });

    const vacio = clientePedidos({ orders: [{ data: null, error: null }] });
    await expect(
      supabaseOrdersDataSource(vacio.client).updateEstado('o9', 'enviado'),
    ).rejects.toThrow('no existe');
  });
});

describe('supabaseCatalogDataSource.updateProduct', () => {
  it('actualiza el producto y devuelve la fila', async () => {
    const { client, calls } = clienteFalso();
    await supabaseCatalogDataSource(client).updateProduct('p1', { stock: 7 });
    const upd = calls.find((c) => c.nombre === 'update');
    expect(upd?.args[0]).toMatchObject({ stock: 7 });
    expect(calls.some((c) => c.nombre === 'eq' && c.args[0] === 'id')).toBe(true);
  });
});

describe('supabaseProfilesDataSource', () => {
  it('findById lee id, email, nombre y rol', async () => {
    const { client, selects, calls } = clienteFalso();
    await supabaseProfilesDataSource(client).findById('u1');
    expect(selects[0]).toBe('id,email,nombre,rol');
    expect(calls.some((c) => c.nombre === 'maybeSingle')).toBe(true);
  });

  it('findById devuelve null si no hay perfil', async () => {
    const { client } = clienteFalso();
    await expect(supabaseProfilesDataSource(client).findById('u9')).resolves.toBeNull();
  });

  it('ensureAdmin crea el perfil como admin cuando no existe', async () => {
    const { client, calls } = clientePedidos({
      profiles: [{ data: null, error: null }],
    });
    await supabaseProfilesDataSource(client).ensureAdmin('u1', 'dueno@ejemplo.com', null);
    const ins = calls.find((c) => c.nombre === 'profiles.insert');
    expect(ins?.args[0]).toMatchObject({ id: 'u1', rol: 'admin' });
  });

  it('ensureAdmin no toca un perfil que ya existe', async () => {
    const { client, calls } = clientePedidos({
      profiles: [{ data: { id: 'u1', rol: 'cliente' }, error: null }],
    });
    await supabaseProfilesDataSource(client).ensureAdmin('u1', 'dueno@ejemplo.com', null);
    expect(calls.some((c) => c.nombre === 'profiles.insert')).toBe(false);
  });
});
