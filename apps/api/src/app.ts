import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { errorEnvelope } from './errors.js';
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
    res.status(status).json(body);
  };
  app.use(handler);

  return app;
}