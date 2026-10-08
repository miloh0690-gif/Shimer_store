-- Ordenar y filtrar por precio usaba `precio_bob_cents` (el precio de lista)
-- mientras la ficha del producto muestra el precio de oferta. Con las dos
-- columnas presentes, "Precio: menor a mayor" ponía Bs. 48 después de Bs. 49.
--
-- Una columna generada resuelve el ORDER BY y el filtro por precio en la base,
-- sin depender de que cada consulta recuerde usar el precio correcto.
alter table products
  drop column if exists precio_efectivo_cents;

alter table products
  add column precio_efectivo_cents integer
  generated always as (coalesce(precio_oferta_bob_cents, precio_bob_cents)) stored;

-- Índice parcial: solo se consultan productos activos, que son los únicos
-- visibles para el cliente.
create index if not exists products_precio_efectivo_idx
  on public.products (precio_efectivo_cents)
  where activo;
