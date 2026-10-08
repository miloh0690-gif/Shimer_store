alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table profiles enable row level security;

-- anon: solo lectura del catálogo activo
create policy brands_select_anon on brands for select to anon using (true);
create policy categories_select_anon on categories for select to anon using (true);
create policy products_select_anon on products for select to anon using (activo);
create policy variants_select_anon on product_variants for select to anon using (
  exists (select 1 from products p where p.id = product_id and p.activo)
);

-- anon: sus propios pedidos, por email del JWT
create policy orders_select_own on orders for select to anon using (
  cliente_email = (auth.jwt() ->> 'email')
);
create policy order_items_select_own on order_items for select to anon using (
  exists (select 1 from orders o where o.id = order_id
          and o.cliente_email = (auth.jwt() ->> 'email'))
);

-- perfiles: cada uno lee y actualiza el suyo
create policy profiles_select_own on profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Ninguna policy de insert/update/delete para anon o authenticated:
-- las escrituras son exclusivas de service_role (la API).
grant usage on schema public to anon, authenticated;
grant select on brands, categories, products, product_variants to anon, authenticated;
grant select on orders, order_items to anon, authenticated;
grant select, update on profiles to authenticated;
revoke insert, update, delete on brands, categories, products, product_variants,
  orders, order_items, counters from anon, authenticated;