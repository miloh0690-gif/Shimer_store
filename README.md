# SHIMER

Tienda online de una librería y papelería (Cochabamba, Bolivia). Monorepo: frontend
en Next.js 15 sobre Vercel, API en Express 5 sobre Render, datos en Supabase.

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

Para levantar todas las que tengan script `dev`: `npm run dev` en la raíz.

La API lee su configuración del entorno. Copiá `apps/api/.env.example` a
`apps/api/.env` y completá los valores antes de arrancar.

## Pruebas

En la raíz, `npm test` corre la suite de cada workspace:

```sh
npm test              # unitarias de api y web
npm run test -w apps/web -- e2e   # end-to-end con Playwright (requiere la web arriba)
npm run typecheck     # TypeScript en todas las apps
```