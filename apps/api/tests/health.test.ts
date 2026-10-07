import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/env.js';

const env = loadEnv({
  NODE_ENV: 'test',
  PORT: '4000',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'k',
  SUPABASE_JWT_SECRET: 's',
  ALLOWED_ORIGINS: '',
  ADMIN_EMAILS: '',
  RATE_LIMIT_ENABLED: 'false',
});

const app = createApp({ env });

describe('GET /api/health', () => {
  it('responde 200 con version y time', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.version).toBe('string');
    expect(typeof res.body.time).toBe('string');
  });
});