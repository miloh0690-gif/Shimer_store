import { z } from 'zod';

const listaPorComa = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );

const booleano = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  ALLOWED_ORIGINS: listaPorComa,
  ADMIN_EMAILS: listaPorComa,
  RATE_LIMIT_ENABLED: booleano,
});

export type Env = {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  ALLOWED_ORIGINS: string[];
  ADMIN_EMAILS: string[];
  RATE_LIMIT_ENABLED: boolean;
};

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  return schema.parse(source);
}