import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppError, errorEnvelope } from './errors.js';
import type { Env } from './env.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import type { OrdersDataSource } from './modules/orders/orders.types.js';
import { adminRoutes, ordersMineRoutes } from './modules/admin/admin.routes.js';
import type { ProfilesDataSource, RespaldoToken } from './auth.js';
import type { CatalogDataSource } from './modules/catalog/catalog.types.js';

export type AppDeps = {
  env: Env;
  catalog?: CatalogDataSource;
  orders?: OrdersDataSource;
  profiles?: ProfilesDataSource;
  respaldo?: RespaldoToken;
};

export const API_VERSION = '0.1.0';

export function createApp(deps: AppDeps): Express {
  const { env } = deps;
  const app = express();

  app.disable('x-powered-by');

  // Render termina TLS en su balanceador y reenvía por HTTP con X-Forwarded-For.
  // Sin esto `req.ip` es siempre la IP del balanceador, el limitador se vuelve un
  // cubo único y basta un bot para tumbar la API de toda la tienda. El 1 (y no
  // `true`) es deliberado: Render AGREGA al encabezado en vez de reemplazarlo, y
  // con `true` un cliente podría inventar su propia IP y esquivar el límite.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.gstatic.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: (o, cb) =>
        cb(
          null,
          env.ALLOWED_ORIGINS.length === 0 || env.ALLOWED_ORIGINS.includes(String(o)),
        ),
    }),
  );

  if (env.RATE_LIMIT_ENABLED) {
    app.use(
      rateLimit({
        windowMs: 60_000,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      }),
    );
  }

  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, version: API_VERSION, time: new Date().toISOString() });
  });

  if (deps.catalog) {
    app.use('/api', catalogRoutes({ catalog: deps.catalog }));
  }
  if (deps.catalog && deps.orders) {
    app.use('/api', ordersRoutes({ env: deps.env, catalog: deps.catalog, orders: deps.orders }));
  }
  if (deps.orders) {
    app.use(
      '/api',
      ordersMineRoutes({ env: deps.env, orders: deps.orders, respaldo: deps.respaldo }),
    );
  }
  if (deps.catalog && deps.orders && deps.profiles) {
    app.use(
      '/api',
      adminRoutes({
        env: deps.env,
        catalog: deps.catalog,
        orders: deps.orders,
        profiles: deps.profiles,
        respaldo: deps.respaldo,
      }),
    );
  }

  const handler: ErrorRequestHandler = (err, _req, res, _next) => {
    const { status, body } = errorEnvelope(err);
    // Los AppError son respuestas esperadas (400, 404, 409). Cualquier otra
    // cosa es una caída que hay que ver en los logs de Render, porque el cliente
    // solo recibe un "Error interno" y sin esto no queda ningún rastro.
    if (!(err instanceof AppError)) {
      console.error('[shimer-api] error no controlado', err);
    }
    res.status(status).json(body);
  };
  app.use(handler);

  return app;
}