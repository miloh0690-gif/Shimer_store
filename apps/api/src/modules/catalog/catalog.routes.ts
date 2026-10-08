import { Router } from 'express';
import { z } from 'zod';
import { notFound, validacion } from '../../errors.js';
import {
  POR_PAGINA_POR_DEFECTO,
  getProductBySlug,
  listProducts,
} from './catalog.service.js';
import type { CatalogDataSource, ProductQuery } from './catalog.types.js';

const querySchema = z.object({
  categoria: z.string().min(1).optional(),
  marca: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  precio_min: z.coerce.number().min(0).optional(),
  precio_max: z.coerce.number().min(0).optional(),
  en_oferta: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  orden: z
    .enum(['destacado', 'recientes', 'precio_asc', 'precio_desc', 'nombre'])
    .default('destacado'),
  pagina: z.coerce.number().int().min(1).default(1),
  por_pagina: z.coerce.number().int().min(1).max(60).default(POR_PAGINA_POR_DEFECTO),
});

export function catalogRoutes(deps: { catalog: CatalogDataSource }): Router {
  const { catalog } = deps;
  const router = Router();

  // Las filas completas, no solo el par {slug, nombre}: el frontend usa el id
  // como clave de React y la descripción y el orden en los tiles de categoría.
  router.get('/categories', async (_req, res) => {
    const rows = await catalog.categories();
    res.json([...rows].sort((a, b) => a.orden - b.orden));
  });

  router.get('/brands', async (_req, res) => {
    res.json(await catalog.brands());
  });

  router.get('/products', async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) throw validacion('Parámetros inválidos', parsed.error.issues);
    const q: ProductQuery = parsed.data;
    res.json(await listProducts(catalog, q));
  });

  router.get('/products/:slug', async (req, res) => {
    const slug = String(req.params.slug ?? '');
    const view = await getProductBySlug(catalog, slug);
    if (view === null) throw notFound('Producto no encontrado');
    res.json(view);
  });

  return router;
}