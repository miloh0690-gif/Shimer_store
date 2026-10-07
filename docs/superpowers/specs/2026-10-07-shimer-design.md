# SHIMER — E-commerce Librería/Papelería

Fecha: 2026-10-07
Estado: aprobado por Milo (diseño presentado en chat, "dale")
Autor: opencode

---

## 1. Objetivo

Construir el sitio web de **SHIMER** (Librería, Papelería y Arte) como **demo
completa y desplegada**, para que Milo pueda ver cómo se vería y funcionando antes
de tener el catálogo real, los precios reales y los datos de contacto reales.

Inspiración de estructura y contenido: el front de `https://libreriairbe.com/`
(WooCommerce). **No es una copia**: el diseño se rehace, con identidad propia,
mejor animación y mejor seguridad.

Éxito = hay una URL real de Vercel sirviendo el sitio, con catálogo navegable,
carrito, checkout que guarda la orden en Supabase, y panel de administración
protegido.

Fuera de alcance en esta entrega (seagregan cuando Milo pase los datos):
- Pasarela de pago en línea
- Catálogo y fotos reales (los datos actuales son `demo: true`)
- NIT, dirección, teléfono, WhatsApp, horarios reales

---

## 2. Identidad

Extraída del logo `~/Downloads/shimer.jpg` (logo SHIMER: "Librería Papelería y
Arte", violeta + degradado morado→magenta→rosa, fondo madera blanca, estación con
útiles de escritorio coloridos).

| Token | Valor | Uso |
|---|---|---|
| `violet` | `#7C3AED` | primario, precios, CTAs |
| `magenta` | `#E935C1` | acento, degradados |
| `pink` | `#FF6B9D` | acento secundario |
| `cream` | `#FDF9F3` | fondo de página |
| `ink` | `#17111F` | texto |
| `mint` | `#00B2AC` | éxito / disponible (heredado del sistema visual del cliente actual) |

- **Display**: `Fredoka` (redondeada, de spirit juguetón, igual al logo).
- **Texto**: `Plus Jakarta Sans`.
- Google Fonts vía `next/font`, sin peticiones externas en runtime.
- Fondo crema, **no blanco puro**: más cálido, menos "template".
- Degradado de marca `--gradiente-marca`: `linear-gradient(135deg, violet, magenta, pink)`
  usado solo en logos, precios y el hero. No en bloques de texto largos.

---

## 3. Arquitectura

```
OpenCode (local) ──git push──► GitHub (miloh0690-gif/Shimer, público)
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        Vercel  [apps/web  Next.js 15]            Render  [apps/api  Express]
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        ▼
                      Supabase  [Postgres · Auth · Storage]
```

Monorepo de 3 piezas, sin microservicios:

| Ruta en repo | Qué es | Dónde vive |
|---|---|---|
| `apps/web` | Next.js 15 App Router, Tailwind v4, Motion, GSAP/ScrollTrigger, Lenis | Vercel |
| `apps/api` | Express 5, monolito modular: `catalog` · `orders` · `admin` | Render |
| `supabase/` | Migraciones SQL (esquema + RLS) y `seed.sql` del catálogo demo | aplicado por MCP |

### Cuentas ya verificadas

| Plataforma | Identificador |
|---|---|
| GitHub | `miloh0690-gif` |
| Vercel | team `team_jsYNMLk0Eox6x0SLZBmk6SyH` (scope personal; `list_teams` no lo devuelve pero existe) |
| Render | workspace `tea-dagf9grl550s73bfh1hg` |
| Supabase | org `qzvbxmcoordjkceunqoo` (`opencode`), costo **$0/mes**, 0 proyectos |

---

## 4. Modelo de datos (Supabase Postgres)

Todo importe se guarda como **entero, nunca float**. Convención: `*_bob_cents integer`,
donde **1 Bs = 100**. `Bs. 8.00` se guarda como `800`; `Bs. 549.00` como `54900`.
Es la regla de Milo ("importes en centavos") aplicada a una moneda sin centavos
reales: el front formatea dividiendo por 100. Evita errores de coma flotante y
conserva exactamente los 2 decimales que usa WooCommerce.

```sql
-- catálogo
brands      (id uuid pk, slug text unique, nombre text, logo_url text, created_at)
categories  (id uuid pk, slug text unique, nombre text, descripcion text, orden int)
products    (id uuid pk, slug text unique, nombre text, descripcion text,
             brand_id uuid fk, category_id uuid fk,
             precio_bob_cents integer not null check (precio_bob_cents >= 0),
             precio_oferta_bob_cents integer null,
             stock integer not null default 0 check (stock >= 0),
             sku text, color text, imagenes text[],      -- array de URLs en Supabase Storage
             destacado boolean default false,
             demo boolean default true,                    -- true = dato de ejemplo
             activo boolean default true,
             created_at, updated_at)
product_variants (id uuid pk, product_id uuid fk, nombre text, valor text,
                  stock integer, sku text, orden int)

-- pedidos
orders      (id uuid pk, folio text unique,          -- "SHM-000001"
             idempotency_key text unique not null,
             cliente_nombre text not null, cliente_email text not null,
             cliente_telefono text not null,
             envio_tipo text not null check (envio_tipo in ('cochabamba','nacional')),
             envio_direccion text, envio_ciudad text,
             estado text not null default 'nuevo',
             total_bob_cents integer not null,
             created_at)
order_items (id uuid pk, order_id uuid fk on delete cascade,
             product_id uuid null on delete set null,
             nombre_snapshot text not null,      -- el nombre al momento de comprar
             precio_unitario_bob_cents integer not null,
             cantidad integer not null check (cantidad > 0),
             subtotal_bob_cents integer not null)

-- auth/admin
profiles    (id uuid pk references auth.users on delete cascade,
             email text, nombre text, rol text not null default 'cliente'
             check (rol in ('cliente','admin')), created_at)
```

### Reglas de dinero
- El **total se calcula en el servidor** a partir de `order_items`, nunca se acepta
  del cliente.
- El tipo de cambio **no aplica** (precios ya en Bs.), pero si más adelante se
  importa un catálogo en USD, la tasa del día se guarda **en la fila del pedido**
  (`tasa_cambio_bob_por_usd numeric`), nunca se recalcula en un reporte.
- Todo importe en la fila de venta/pedido queda congelado: `precio_unitario_bob_cents`
  y `nombre_snapshot` son historia, no referencia.

---

## 5. Seguridad

| Riesgo (IRBE hoy) | Mitigación en SHIMER |
|---|---|
| Plugins de pago, superficie de ataque grande | API propia y mínima: solo expone lo que la tienda necesita |
| Sin CSP | `helmet` con CSP explícita + HSTS |
| Fuerza bruta / spam en checkout | `express-rate-limit`: 20 req/min general, 5/min en `POST /orders` |
| anybody can POST a `/wp-admin` | Admin con Supabase Auth + `profiles.rol = 'admin'`; `/admin` server-side guard |
| `service_role` filtrada al navegador | El navegador **nunca** recibe `service_role`. Solo la API en Render la tiene |
| Doble clic en "Finalizar" → pedido duplicado | `orders.idempotency_key` UNIQUE; repetido devuelve el mismo folio |
| Injection / payload en login | Zod valida todo en el borde; queries parametrizadas con `.eq()` |
| Coste creado por requests falsos (bots) | **404 en vez de 403** para no confirmar existencia de recursos |
| Sesión en `localStorage` | Cookie `httpOnly` `sameSite=lax` (JWT de Supabase, servidor Render la verifica) |

### RLS (Supabase)
- `anon`: `SELECT` en `products`, `brands`, `categories`, `product_variants`
  donde `activo = true`. **Nada más.**
- `anon`: `SELECT` en `orders` solo si `cliente_email = auth.jwt() ->> 'email'`
  (para "mis pedidos"). Sin login, cero filas.
- `insert/update/delete` en cualquier tabla: **solo** `service_role` (la API).
- `profiles`: el usuario lee y actualiza su propia fila; el `rol` es inmutable
  para el cliente (se cambia por SQL/admin).

### Variables de entorno (secretos)
- Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_API_URL`. Las dos primeras son públicas por diseño (solo lectura).
- Render: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
  `ALLOWED_ORIGINS`, `ADMIN_EMAILS`. **Nunca** en el repo, nunca en el front.

---

## 6. Frontend — `apps/web`

### Rutas
| Ruta | Contenido |
|---|---|
| `/` | Hero parallax · 6 tiles de categoría · Novedades · Más vendidos · Ofertas · Marcas · Testimonios · Banners |
| `/productos` | Grid con filtros en URL: `categoria`, `marca`, `color`, `precio_min`, `precio_max`, `en_oferta`, `orden`, `pagina` |
| `/producto/[slug]` | Galería, precio con oferta, stock, variantes, agregar al carrito, relacionados, JSON-LD `Product` |
| `/carrito` | Drawer lateral + página completa; quantities editables |
| `/checkout` | Formulario (nombre, email, teléfono, tipo de envío, dirección/ciudad) → `POST /api/orders` → pantalla de folio |
| `/exito` | Confirmación con folio y qué sigue |
| `/cuenta` | Login/registro (Supabase Auth) + lista de "mis pedidos" |
| `/admin` | Productos (listar, activar, editar precio/stock) y pedidos (listar, cambiar estado). Protegido |
| `/envios` `/formas-de-pago` `/devoluciones` `/terminos` `/privacidad` `/contacto` `/ubicacion` | Estáticas con datos `SHIMER` placeholder |

### Animación (regla de Milo + `frontend-design`)
- **Lenis** para scroll suave; **GSAP + ScrollTrigger** para reveals;
  **Motion** (`motion/react`) para microinteracciones.
- Sección entra con `opacity 0→1` + `translateY 24px→0`, `0.7s`, `power3.out`.
- Hover en tarjetas y botones: `scale 1.03` + sombra, `200–300ms`.
- Hero: parallax del fondo y del texto a distinta velocidad; contador animado.
- Grillas: `staggerChildren 0.06s`.
- Transición de ruta: fade + `translateY` corto.
- **Solo `transform` y `opacity`.** Nunca `width/height/top/left`. Nunca animar
  `scroll` directamente (lo hace Lenis).
- `prefers-reduced-motion: reduce` → todo se muestra sin animación.
- CDN para GSAP/Lenis (un solo archivo HTML no aplica aquí: es Next con bundler,
  así que van por `npm`, no por `<script>`).

### Datos
- **Server Components** por defecto. El cliente solo donde hay interacción
  (carrito, filtros, drawer, formularios).
- La API se llama **desde el servidor** cuando se puede (evita CORS y expone menos
  superficie). El navegador llama directo a la API solo para el checkout y el carrito
  si hace falta latencia baja.

---

## 7. API — `apps/api` (Render)

```
GET    /api/health                 → { ok, version, time }
GET    /api/products               ?categoria&marca&color&precio_min&precio_max&en_oferta&orden&pagina&por_pagina
GET    /api/products/:slug
GET    /api/categories
GET    /api/brands
POST   /api/orders                 (idempotency-key header)  → { folio, total }
GET    /api/orders                 (admin)                     → lista
PATCH  /api/orders/:id/estado      (admin)
GET    /api/orders/mine            (cliente autenticado)
PATCH  /api/products/:id           (admin)
```

Formato de error único, siempre:
```json
{ "error": { "code": "VALIDATION", "message": "…", "details": [] } }
```

### Carrito
El carrito vive en el **cliente** (contexto de React + `localStorage` como
respaldo) y **se revalida contra la API al checkout**: el cliente manda
`{ items: [{ product_id, variant_id, cantidad }] }` y la API devuelve el precio
real. Un cliente que manipule `localStorage` no cambia el total.

---

## 8. Datos demo

~40 productos tomados del front de IRBE (mismos productos y precios en Bs., como
pedido explícito), **todos con `demo = true`**:

- Crayola Super Tips 150 colores — Bs. 549 (antes 595)
- uni-POSCA PC-3M set 8 — Bs. 176 · PC-5M blanco — Bs. 22 (antes 24.50)
- STABILO BOSS ORIGINAL set 30 — Bs. 285 (antes 390) · BOSS Mini Pastellove 6 — Bs. 69
- STABILO Point 88 micropunta — Bs. 8.50 · Pen 68 Brush set 10 — Bs. 69 (antes 138.50)
- Faber-Castell Textliner Plus Pastel set 6 — Bs. 34 · EcoLápices set 12 — Bs. 26
- Faber-Castell Pitt Charcoal Hard — Bs. 15
- Mont Marte Signature acrílico 300 ml — Bs. 48 (antes 53.50) · Arcilla 500 g — Bs. 49
- Pentel Graph Gear 1000 — Bs. 198 (antes 210)
- Crayola Super Tips, SABONIS pintura dedos, IBI CRAFT guillotina y sellos,
  ZUIXUA 120 marcadores, Ohuhu Honolulu 24, Mooving Sketch 60, etc.

6 categorías: Arte & Diseño · Dibujo & Escritura · Escolar · Papelería ·
Oficina · Manualidades. ~25 marcas. 16 colores para el filtro.

Los productos **sin foto** usan un placeholder SVG generado en el repo
(`/public/placeholder.svg`), no una imagen rota.

---

## 9. Pruebas

- **Unit (API)**: Vitest. Total del carrito, idempotencia, validación Zod,
  precios desde la base.
- **Unit (web)**: Vitest + Testing Library para reducer del carrito y helpers de
  formato de precio.
- **E2E**: Playwright en 5 rutas críticas — home carga, filtro de catálogo,
  agregar al carrito, checkout completo, `/admin` bloqueado sin login.
- **Manual antes de declarar terminado**: carrito real en el sitio desplegado,
  orden creada visible en `/admin`, RLS probado (escritura con anon → 0 filas).

---

## 10. Riesgos y trampas conocidas

1. **Vercel scope**: `vercel_list_teams` devuelve vacío pero existe
   `team_jsYNMLk0Eox6x0SLZBmk6SyH`. Si falla el deploy, reintentar con ese `teamId`
   explícito en cada tool.
2. **Supabase nuevo**: hay que crear el proyecto (`create_project` con
   `organization_id: qzvbxmcoordjkceunqoo`) y esperar a que inicialice. La API
   key `service_role` hay que leerla con `get_publishable_keys` +
   el secreto del proyecto; si no está exposed, se genera desde el dashboard y se
   pega como env var de Render.
3. **`render_create_web_service`**: repo es el mismo monorepo con
   `rootDirectory: apps/api`. Auto-deploy por commit en `main`.
4. **Precios en Bs. sin centavos reales**: se usa convención entera con 2
   decimales implícitos. Es lo mismo que hace WooCommerce internamente
   (`wc_price_decimal_separator: "."`, `price_decimals: 2`).
5. **No borrar `~/Shimer`** si Render/Vercel apuntan a ese repo: cualquier push
   dispara deploy.
6. **Reminders de Milo**: los datos demo se borran con
   `delete from products where demo = true` cuando llegue el catálogo real.

---

## 11. Criterios de terminado

- [ ] `https://<sub>.vercel.app` responde 200 con el home completo
- [ ] El catálogo carga desde Supabase (no desde datos hardcodeados)
- [ ] Un filtro de categoría + precio devuelve el subconjunto correcto
- [ ] La página de producto muestra precio, stock y variantes
- [ ] El carrito persiste al recargar
- [ ] El checkout crea una orden y devuelve folio; la orden aparece en `/admin`
- [ ] Repetir el mismo checkout con la misma `idempotency-key` devuelve el mismo
      folio y **no** crea una segunda orden
- [ ] `/admin` sin sesión redirige a login
- [ ] RLS: escribir con la `anon` key desde el navegador no cambia nada
- [ ] Lighthouse reasonable en móvil (sin regresiones de animación)
- [ ] `npm run lint` y `npm run typecheck` pasan en `apps/web` y `apps/api`
- [ ] Nota de proyecto en el vault + sesión registrada

---

## 12. Nombres de cosas

- Producto: **SHIMER** (no "Librería SHIMER" en el logo; sí en el `<title>` y el
  footer legal: "SHIMER — Librería, Papelería y Arte").
- Prefijo de folios: `SHM-000001`.
- Repositorio: `miloh0690-gif/Shimer`.
- Servicio Render: `shimer-api`.
- Dominio: aún ninguno (se compra después si Milo quiere).
