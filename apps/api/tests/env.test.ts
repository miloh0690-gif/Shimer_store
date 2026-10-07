import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env.js';

const base = {
  NODE_ENV: 'test',
  PORT: '4000',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'k',
  SUPABASE_JWT_SECRET: 's',
  ALLOWED_ORIGINS: 'https://a.vercel.app,https://b.vercel.app',
  ADMIN_EMAILS: 'milo@x.com, otro@x.com',
  RATE_LIMIT_ENABLED: 'false',
};

describe('loadEnv', () => {
  it('parte ALLOWED_ORIGINS y ADMIN_EMAILS por coma y recorta espacios', () => {
    const env = loadEnv(base);
    expect(env.ALLOWED_ORIGINS).toEqual(['https://a.vercel.app', 'https://b.vercel.app']);
    expect(env.ADMIN_EMAILS).toEqual(['milo@x.com', 'otro@x.com']);
  });

  it('lanza si falta SUPABASE_JWT_SECRET', () => {
    expect(() => loadEnv({ ...base, SUPABASE_JWT_SECRET: undefined })).toThrow(/SUPABASE_JWT_SECRET/);
  });

  it('RATE_LIMIT_ENABLED=1 queda true', () => {
    expect(loadEnv({ ...base, RATE_LIMIT_ENABLED: '1' }).RATE_LIMIT_ENABLED).toBe(true);
  });
});