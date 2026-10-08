-- La línea de pedido guardaba el nombre del producto pero no la variante elegida.
-- Un producto con cuatro colores (Mont Marte Signature) llegaba a la tienda como
-- cuatro renglones idénticos sin forma de saber cuál preparar.
alter table order_items
  add column if not exists variant_id uuid references product_variants(id) on delete set null;