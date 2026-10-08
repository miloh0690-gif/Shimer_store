create table brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  orden int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  brand_id uuid references brands(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  precio_bob_cents integer not null check (precio_bob_cents >= 0),
  precio_oferta_bob_cents integer,
  stock integer not null default 0 check (stock >= 0),
  sku text,
  color text,
  imagenes text[] not null default '{}',
  destacado boolean not null default false,
  demo boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint oferta_menor check (precio_oferta_bob_cents is null or precio_oferta_bob_cents < precio_bob_cents)
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  nombre text not null,
  valor text not null,
  stock integer not null default 0 check (stock >= 0),
  sku text,
  orden int not null default 0
);

create table counters (nombre text primary key, valor bigint not null default 0);

create or replace function public.next_folio() returns text
language plpgsql as $$
declare v bigint;
begin
  insert into counters (nombre, valor) values ('folio', 1)
  on conflict (nombre) do update set valor = counters.valor + 1
  returning valor into v;
  return 'SHM-' || lpad(v::text, 6, '0');
end $$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  idempotency_key text unique not null,
  cliente_nombre text not null,
  cliente_email text not null,
  cliente_telefono text not null,
  envio_tipo text not null check (envio_tipo in ('cochabamba', 'nacional')),
  envio_direccion text,
  envio_ciudad text,
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado')),
  total_bob_cents integer not null check (total_bob_cents >= 0),
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  nombre_snapshot text not null,
  precio_unitario_bob_cents integer not null,
  cantidad integer not null check (cantidad > 0),
  subtotal_bob_cents integer not null
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text,
  rol text not null default 'cliente' check (rol in ('cliente', 'admin')),
  created_at timestamptz not null default now()
);

create index products_activo_idx on products (activo) where activo;
create index products_category_idx on products (category_id);
create index products_brand_idx on products (brand_id);
create index orders_email_idx on orders (cliente_email);