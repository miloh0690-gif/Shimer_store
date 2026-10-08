import { createClient } from '@supabase/supabase-js';
import { createApp } from './app.js';
import {
  supabaseCatalogDataSource,
  supabaseOrdersDataSource,
  supabaseProfilesDataSource,
  supabaseRespaldoToken,
} from './db.js';
import { assertConfigProduccion, loadEnv } from './env.js';

const env = loadEnv();
assertConfigProduccion(env);

const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const app = createApp({
  env,
  catalog: supabaseCatalogDataSource(client),
  orders: supabaseOrdersDataSource(client),
  profiles: supabaseProfilesDataSource(client),
  respaldo: supabaseRespaldoToken(client),
});

app.listen(env.PORT, () => {
  console.log(`shimer-api escuchando en http://localhost:${env.PORT}`);
});