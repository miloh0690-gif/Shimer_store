# SHIMER

Tienda online de una libreria y papeleria (Cochabamba, Bolivia). Monorepo: frontend
en Next.js 15 sobre Vercel, API en Express 5 sobre Render, datos en Supabase.

## Produccion

| Que | Donde |
|---|---|
| Sitio | https://shimer-lilac.vercel.app |
| API | https://shimer-api.onrender.com (`/api/health` devuelve `ok: true`) |

La API corre en el plan gratuito de Render: se duerme sola tras unos minutos sin
trafico, asi que la primera visita del sitio puede tardar un poco mas de lo normal.

> [!warning] Catalogo y datos de contacto de ejemplo
> Los 40 productos y sus precios estan marcados con `demo = true` y se copiaron del
> catalogo de otra libreria como contenido de muestra. Para cargarlos de verdad:
> `delete from products where demo = true;`
> Los datos de contacto (direccion, telefono, correo, NIT, horarios) son
> placeholders, y cada pagina legal lo avisa.

## Requisitos

- Node 20 o superior (probado en 26.10.0)
- npm 10 o superior

```sh
npm install
```

## Desarrollo

Cada app es un workspace. Para levantar una sola:

```sh
npm run dev -w apps/api    # API en http://localhost:4000
npm run dev -w apps/web    # Frontend en http://localhost:3000
```

Para levantar todas las que tengan script `dev`: `npm run dev` en la raiz.

La API lee su configuracion del entorno. Copia `apps/api/.env.example` a
`apps/api/.env` y completa los valores antes de arrancar. El frontend toma sus
variables publicas de `apps/web/.env.example` en `apps/web/.env.local`.

## Pruebas

En la raiz, `npm test` corre la suite de cada workspace:

```sh
npm test                          # unitarias de api y web
npm run test -w apps/web -- e2e   # end-to-end con Playwright (requiere la web arriba)
npm run typecheck                 # TypeScript en todas las apps
```

## Despliegue

`main` es la rama de produccion. Un push a `main` dispara el deploy de Render y
el de Vercel.

- **Render** (`shimer-api`): usa los scripts `start` y `build` de la raiz del repo,
  porque el servicio se crea sobre el repo completo y no sobre `apps/api`.
- **Vercel** (`shimer`): `rootDirectory` es `apps/web`, y por eso su build command
  es `npm run build` sin el flag `-w` (desde `apps/web` ese flag no resuelve).

Variables de entorno necesarias:

| App | Variables |
|---|---|
| `apps/api` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `ALLOWED_ORIGINS`, `ADMIN_EMAILS`, `PORT`, `NODE_ENV`, `RATE_LIMIT_ENABLED` |
| `apps/web` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> [!danger] La `service_role` solo vive en Render
> Nunca en el navegador ni en un archivo versionado. Es la unica llave que ignora
> las reglas de RLS, asi que con ella se puede escribir cualquier tabla.
