import { SignJWT } from 'jose'
import { describe, expect, it, vi } from 'vitest'
import { verifyToken } from '../src/auth.js'
import type { AuthUser } from '../src/auth.js'

const SECRET = 'secreto-de-prueba-largo'
const OTRO = 'otro-secreto-de-prueba'

function firmar(payload: Record<string, unknown>, secret = SECRET): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret))
}

describe('verifyToken', () => {
  it('acepta un JWT HS256 válido y devuelve id y email', async () => {
    const token = await firmar({ sub: 'u1', email: 'ana@example.com' })
    await expect(verifyToken(token, SECRET)).resolves.toEqual({
      id: 'u1',
      email: 'ana@example.com',
    })
  })

  it('rechaza un token con alg=none', async () => {
    // Header base64 de {"alg":"none","typ":"JWT"} sin firma.
    const sinFirma = `${btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${btoa(
      JSON.stringify({ sub: 'u1', email: 'ana@example.com' }),
    )}.`;
    await expect(verifyToken(sinFirma, SECRET)).resolves.toBeNull();
  });

  it('rechaza un token expirado', async () => {
    const vencido = await new SignJWT({ sub: 'u1', email: 'ana@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));
    await expect(verifyToken(vencido, SECRET)).resolves.toBeNull();
  });

  it('rechaza un token firmado con otra clave', async () => {
    const token = await firmar({ sub: 'u1', email: 'ana@example.com' }, OTRO)
    await expect(verifyToken(token, SECRET)).resolves.toBeNull();
  })

  it('rechaza un token sin sub o sin email', async () => {
    const sinEmail = await firmar({ sub: 'u1' })
    await expect(verifyToken(sinEmail, SECRET)).resolves.toBeNull();
    const sinSub = await firmar({ email: 'ana@example.com' })
    await expect(verifyToken(sinSub, SECRET)).resolves.toBeNull();
  })

  it('rechaza un token que no es un JWT', async () => {
    await expect(verifyToken('no-es-un-jwt', SECRET)).resolves.toBeNull();
  })
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const algNinguno = null

describe('verifyToken con respaldo de Supabase', () => {
  it('acepta un token que Supabase valida aunque HS256 falle', async () => {
    const remoto: AuthUser = { id: 'u-es256', email: 'admin@shimer.test' };
    const respaldo = vi.fn(async () => remoto);
    const token = await firmar({ sub: 'u1', email: 'otro@example.com' }, OTRO);
    await expect(verifyToken(token, SECRET, respaldo)).resolves.toEqual(remoto);
    expect(respaldo).toHaveBeenCalledWith(token);
  });

  it('no consulta Supabase si el token ya valido con HS256', async () => {
    const respaldo = vi.fn(async () => null);
    const token = await firmar({ sub: 'u1', email: 'ana@example.com' });
    await expect(verifyToken(token, SECRET, respaldo)).resolves.toEqual({
      id: 'u1',
      email: 'ana@example.com',
    });
    expect(respaldo).not.toHaveBeenCalled();
  });

  it('devuelve null si ni HS256 ni Supabase aceptan el token', async () => {
    const respaldo = vi.fn(async () => null);
    await expect(verifyToken('no-es-un-jwt', SECRET, respaldo)).resolves.toBeNull();
    expect(respaldo).toHaveBeenCalled();
  });

  it('devuelve null si el respaldo lanza', async () => {
    const respaldo = vi.fn(async () => {
      throw new Error('red caída');
    });
    await expect(verifyToken('no-es-un-jwt', SECRET, respaldo)).resolves.toBeNull();
  });
});
