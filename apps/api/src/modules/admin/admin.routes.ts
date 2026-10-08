import { Router } from 'express'
import { notFound, validacion } from '../../errors.js'
import type { AuthUser, ProfilesDataSource } from '../../auth.js'
import { requireAdmin, requireAuth } from '../../auth.js'
import type { Env } from '../../env.js'
import type { CatalogDataSource } from '../catalog/catalog.types.js'
import type { OrdersDataSource } from '../orders/orders.types.js'
import { PatchPedidoSchema, PatchProductoSchema } from './admin.schemas.js'

export type AdminRoutesDeps = {
  env: Env;
  catalog: CatalogDataSource;
  orders: OrdersDataSource;
  profiles: ProfilesDataSource;
};

/**
 * Endpoints de administración. Montar siempre `requireAuth` antes que
 * `requireAdmin`: el segundo depende de `res.locals.user`.
 */
export function adminRoutes(deps: AdminRoutesDeps): Router {
  const router = Router();
  const sesion = requireAuth(deps.env.SUPABASE_JWT_SECRET);
  const admin = requireAdmin(deps.profiles, deps.env.ADMIN_EMAILS);

  router.get('/orders', sesion, admin, async (_req, res) => {
    const items = await deps.orders.listAll();
    res.json({ items, total: items.length });
  });

  router.patch('/orders/:id/estado', sesion, admin, async (req, res) => {
    const parsed = PatchPedidoSchema.safeParse(req.body);
    if (!parsed.success) throw validacion('Estado inválido', parsed.error.issues);
    const { id } = req.params;
    if (typeof id !== 'string') throw notFound();
    const orden = await deps.orders.updateEstado(id, parsed.data.estado);
    res.json({ id: orden.id, folio: orden.folio, estado: orden.estado });
  });

  router.patch('/products/:id', sesion, admin, async (req, res) => {
    const parsed = PatchProductoSchema.safeParse(req.body);
    if (!parsed.success) throw validacion('Datos inválidos', parsed.error.issues);
    const { id } = req.params;
    if (typeof id !== 'string') throw notFound();
    const producto = await deps.catalog.updateProduct(id, parsed.data);
    if (!producto) throw notFound('Producto no encontrado');
    res.json({
      id: producto.id,
      nombre: producto.nombre,
      precio_bob_cents: producto.precio_bob_cents,
      precio_oferta_bob_cents: producto.precio_oferta_bob_cents,
      stock: producto.stock,
      activo: producto.activo,
      destacado: producto.destacado,
    });
  });

  return router;
}

/** `GET /api/orders/mine`: solo las órdenes del email del token. */
export function ordersMineRoutes(deps: { env: Env; orders: OrdersDataSource }): Router {
  const router = Router();
  router.get('/orders/mine', requireAuth(deps.env.SUPABASE_JWT_SECRET), async (_req, res) => {
    const user = res.locals.user as AuthUser;
    const items = await deps.orders.listOrdersByEmail(user.email);
    res.json({ items, total: items.length });
  });
  return router;
}