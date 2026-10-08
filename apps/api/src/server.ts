import { createClient } from '@supabase/supabase-js';
import { createApp } from './app.js';
import { supabaseCatalogDataSource } from './db.js';
import { loadEnv } from './env.js';

const env = loadEnv();

const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const app = createApp({ env, catalog: supabaseCatalogDataSource(client) });

app.listen(env.PORT, () => {
  console.log(`shimer-api escuchando en http://localhost:${env.PORT}`);
});