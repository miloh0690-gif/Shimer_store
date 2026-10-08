import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { jwtVerify } from 'jose'
import { notFound, unauthorized } from './errors.js'

export type AuthUser = {
  id: string;
  email: string;
};

export type Perfil = {
  id: string;
  email: string;
  nombre: string | null;
  rol: 'cliente' | 'admin';
};

export type ProfilesDataSource = {
  findById(id: string): Promise<Perfil | null>;
  /** Crea el perfil como admin si no existe. Nunca degrada ni promueve nada. */
  ensureAdmin(id: string, email: string, nombre: string | null): Promise<void>;
};

/**
 * Verificación delegada: por ejemplo `supabase.auth.getUser`, que valida las
 * firmas reales del proyecto sin necesitar el JWT secret local.
 */
export type RespaldoToken = (token: string) => Promise<AuthUser | null>;

/**
 * Verifica un JWT de Supabase. Primero con HS256 y el `secret` local —que
 * llega siempre por parámetro para que los tests puedan firmarlo de verdad— y
 * si eso falla, con el respaldo: hoy Supabase firma los access tokens con
 * ES256 y no con el secret, así que sin el respaldo el admin nunca entra.
 */
export async function verifyToken(
  token: string,
  secret: string,
  respaldo?: RespaldoToken,
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    if (typeof payload.sub === 'string' && typeof payload.email === 'string') {
      return { id: payload.sub, email: payload.email };
    }
    return null;
  } catch {
    // HS256 no aplica: puede ser ES256 de Supabase o un token inválido.
  }
  if (!respaldo) return null;
  try {
    return await respaldo(token);
  } catch {
    return null;
  }
}

/**
 * Exige `Authorization: Bearer <jwt>`. Sin token o con token inválido responde 401;
 * si no, deja el usuario en `res.locals.user` para los middlewares siguientes.
 */
export function requireAuth(secret: string, respaldo?: RespaldoToken): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.header('authorization');
    if (!header || !header.startsWith('Bearer ')) {
      next(unauthorized());
      return;
    }
    const user = await verifyToken(header.slice('Bearer '.length), secret, respaldo);
    if (!user) {
      next(unauthorized());
      return;
    }
    res.locals.user = user;
    next();
  };
}

/**
 * True si el email está en la lista de administradores —en cuyo caso el perfil
 * queda como admin— o si el perfil ya lo es en la base.
 */
export async function esAdmin(
  user: AuthUser,
  profiles: ProfilesDataSource,
  adminEmails: string[],
): Promise<boolean> {
  const email = user.email.toLowerCase();
  if (adminEmails.some((e) => e.toLowerCase() === email)) {
    await profiles.ensureAdmin(user.id, user.email, null);
    return true;
  }
  const perfil = await profiles.findById(user.id);
  return perfil?.rol === 'admin';
}

/**
 * Los endpoints de administración no existen para quien no es admin: responden
 * 404, no 403. Un 403 confirmaría que el recurso está ahí.
 */
export function requireAdmin(
  profiles: ProfilesDataSource,
  adminEmails: string[],
): RequestHandler {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as AuthUser | undefined;
    if (!user || !(await esAdmin(user, profiles, adminEmails))) {
      next(notFound());
      return;
    }
    next();
  };
}