-- Seed del catálogo demo de SHIMER.
-- Datos copiados del front de Librería IRBE (Cochabamba) solo como ejemplo.
-- Todo lleva demo = true: se borra entero con
--   delete from products where demo = true;

-- ---------------------------------------------------------------- categorías
insert into categories (slug, nombre, descripcion, orden) values
  ('arte-diseno', 'Arte & Diseño', 'Pinturas, acuarelas y medios para crear', 1),
  ('dibujo-escritura', 'Dibujo & Escritura', 'Marcadores, lápices y rotuladores', 2),
  ('escolar', 'Escolar', 'Cuadernos, hojas y útiles del colegio', 3),
  ('papeleria', 'Papelería', 'Papeles especiales y cartulinas', 4),
  ('oficina', 'Oficina', 'Cintas, sellos y herramientas de escritorio', 5),
  ('manualidades', 'Manualidades', 'Arcillas, puras y materiales para crear a mano', 6);

-- -------------------------------------------------------------------- marcas
insert into brands (slug, nombre) values
  ('crayola', 'Crayola'),
  ('uni', 'uni'),
  ('stabilo', 'STABILO'),
  ('faber-castell', 'Faber-Castell'),
  ('mont-marte', 'Mont Marte'),
  ('pentel', 'Pentel'),
  ('sabonis', 'SABONIS'),
  ('ibi', 'IBI'),
  ('zuixua', 'ZUIXUA'),
  ('ohuhu', 'Ohuhu'),
  ('mooving', 'Mooving'),
  ('trapper', 'Trapper'),
  ('milan', 'Milan'),
  ('maped', 'Maped'),
  ('kores', 'Kores'),
  ('giotto', 'Giotto'),
  ('sakura', 'Sakura'),
  ('yasutomo', 'Yasutomo'),
  ('derwent', 'Derwent'),
  ('holbein', 'Holbein'),
  ('blick', 'Blick'),
  ('boarg', 'Boarg'),
  ('tempra', 'Tempra'),
  ('daler-rowney', 'Daler-Rowney'),
  ('canson', 'Canson');

-- ------------------------------------------------------------------ productos
with cat as (
  select slug, id from categories
), mar as (
  select slug, id from brands
)
insert into products
  (slug, nombre, descripcion, brand_id, category_id,
   precio_bob_cents, precio_oferta_bob_cents, stock, sku, color, imagenes,
   destacado, demo, activo)
select
  p.slug, p.nombre, p.descripcion,
  (select id from mar where mar.slug = p.marca),
  (select id from cat where cat.slug = p.categoria),
  p.lista, p.oferta, p.stock, upper(p.slug), p.color, '{}',
  p.destacado, true, true
from (values
  ('crayola-super-tips-150', 'Crayola Super Tips 150 Colores', 'Caja de 150 marcadores de punta fina lavable, la más vendida para arte escolar.', 'crayola', 'arte-diseno', 59500, 54900, 24, 'Multicolor', true),
  ('crayola-tempera-12', 'Crayola Tempera Set 12 Colores', 'Set de témperas en frascos de 12 colores para primeras manualidades.', 'crayola', 'manualidades', 8200, null, 27, 'Multicolor', true),
  ('uniposca-pc3m-set-8', 'uni-POSCA PC-3M Set 8 Colores', 'Set de 8 marcadores para papel que no se corre ni en superficies claras.', 'uni', 'dibujo-escritura', 17600, null, 40, 'Multicolor', true),
  ('uniposca-pc5m-blanco', 'uni-POSCA PC-5M Punta Fina Blanca', 'Marcador blanco de punta fina para corregir y marcar sobre fondo oscuro.', 'uni', 'dibujo-escritura', 2450, 2200, 60, 'Blanco', false),
  ('stabilo-boss-original-set-30', 'STABILO BOSS ORIGINAL Set 30 Colores', 'Set de 30 marcadores de colores planos que no se corre y se seca rápido.', 'stabilo', 'dibujo-escritura', 39000, 28500, 18, 'Multicolor', true),
  ('stabilo-boss-original-set-20', 'STABILO BOSS ORIGINAL Set 20 Colores', 'Set de 20 marcadores de tinta permanente con punta ancha.', 'stabilo', 'dibujo-escritura', 23500, null, 21, 'Multicolor', false),
  ('stabilo-boss-mini-pastellove-6', 'STABILO BOSS Mini Pastellove Set 6', 'Set de 6 colores pastel en formato compacto para llevar a todas partes.', 'stabilo', 'dibujo-escritura', 6900, null, 35, 'Rosa Pastel', false),
  ('stabilo-point-88', 'STABILO Point 88 Micropunta', 'Micropunta de 0.4 mm ideal para rotular, dibujar y letra chica.', 'stabilo', 'dibujo-escritura', 850, null, 120, 'Negro', false),
  ('stabilo-pen-68-brush-set-10', 'STABILO Pen 68 Brush Set 10', 'Set de 10 marcadores con punta de pincel, para pintar y lettering.', 'stabilo', 'dibujo-escritura', 13850, 6900, 22, 'Multicolor', false),
  ('fc-textliner-plus-pastel-6', 'Faber-Castell Textliner Plus Pastel Set 6', 'Set de 6 marcadores pastel de punta fina para rotular y subrayar.', 'faber-castell', 'dibujo-escritura', 3400, null, 55, 'Multicolor', false),
  ('fc-ecolapices-set-12', 'Faber-Castell EcoLápices Set 12', 'Set de 12 lápices de grafito de madera certificada.', 'faber-castell', 'escolar', 2600, null, 90, 'Multicolor', false),
  ('fc-pitt-charcoal-hard', 'Faber-Castell Pitt Charcoal Hard', 'Carbón pastillable duro para dibujo fino, lettering y bocetos.', 'faber-castell', 'arte-diseno', 1500, null, 70, 'Negro', false),
  ('fc-grapites-2b-set-12', 'Faber-Castell Grápites 2B Set 12', 'Set de 12 lápices HB-2B para escritura y dibujo escolar.', 'faber-castell', 'escolar', 4400, null, 82, 'Negro', false),
  ('fc-alpino-color-48', 'Faber-Castell Alpino Color Doble Punta 48', 'Caja de 48 colores de doble punta para colorear y crear.', 'faber-castell', 'escolar', 8800, null, 40, 'Multicolor', false),
  ('montmarte-signature-300ml', 'Mont Marte Signature Acrílico 300 ml', 'Acrílico de alta cobertura en bote de 300 ml, disponible en 16 colores.', 'mont-marte', 'arte-diseno', 5350, 4800, 26, 'Blanco', true),
  ('montmarte-arcilla-500g', 'Mont Marte Arcilla 500 g', 'Arcilla blanca de 500 g para modelar que seca al aire.', 'mont-marte', 'manualidades', 4900, null, 20, 'Café', false),
  ('montmarte-sistema-marble-1kg', 'Mont Marte Sistema Marble 1 kg', 'Sistema de EPOXY de 1 kg para rellenar y decorar en 3D.', 'mont-marte', 'arte-diseno', 11800, null, 9, 'Blanco', false),
  ('pentel-graph-gear-1000', 'Pentel Graph Gear 1000', 'Lápiz de grafito resistente de 1 mm, no se rompe al escribir fuerte.', 'pentel', 'arte-diseno', 21000, 19800, 14, 'Negro', true),
  ('pentel-aquash-brush-12', 'Pentel Aquash Brush 12 Colores', 'Set de 12 acuarelas en formato sólido que se activan con agua.', 'pentel', 'manualidades', 9600, null, 23, 'Multicolor', false),
  ('sabonis-pintura-dedos-6', 'SABONIS Pintura para Dedos 6 Colores', 'Pinturas de dedos lavables y seguras, set de 6 botes.', 'sabonis', 'manualidades', 3400, null, 48, 'Multicolor', false),
  ('ibi-craft-guillotina-a4', 'IBI CRAFT Guillotina A4', 'Guillotina de mesa con guía para papel A4 y A3.', 'ibi', 'oficina', 9600, null, 8, 'Gris', false),
  ('ibi-sello-lapicero', 'IBI Sello Lapicero Automático', 'Sello automático de tinta azul para marcar documentos.', 'ibi', 'oficina', 1500, null, 30, null, false),
  ('zuixua-marcadores-120', 'ZUIXUA Marcadores 120 Colores', 'Caja de 120 marcadores de punta fina con témpera lavable.', 'zuixua', 'arte-diseno', 8900, null, 15, 'Multicolor', false),
  ('ohuhu-honolulu-24', 'Ohuhu Honolulu Marcadores 24 Colores', 'Set de 24 marcadores de doble punta, resistente al agua.', 'ohuhu', 'arte-diseno', 10900, null, 19, 'Multicolor', false),
  ('mooving-sketch-60', 'Mooving Sketch Set 60', 'Set de 60 lápices en estuche para dibujo y bocetos.', 'mooving', 'dibujo-escritura', 7400, null, 25, 'Multicolor', false),
  ('trapper-hojas-a4-100', 'Trapper Hojas Bond A4 100 Unidades', 'Resma de 100 hojas bond A4 de 75 g para impresión y folder.', 'trapper', 'escolar', 3900, null, 110, 'Blanco', false),
  ('milan-cuaderno-dibujar-a4', 'Milan Cuaderno Todo Para Dibujar A4', 'Cuaderno A4 de dibujo liso ideal para técnicas en seco y húmedo.', 'milan', 'escolar', 2800, null, 75, 'Blanco', false),
  ('maped-cuaderno-profesional-a4', 'Maped Cuaderno Profesional A4 100 Hojas', 'Cuaderno rayado profesional A4 de 100 hojas con espiral.', 'maped', 'escolar', 4200, null, 44, 'Celeste', false),
  ('kores-cinta-doble-cara-18mm', 'Kores Cinta Doble Cara 18 mm x 33 m', 'Cinta adhesiva doble cara transparente de 18 mm, 33 m.', 'kores', 'oficina', 1200, null, 90, null, false),
  ('giotto-marcadores-12', 'Giotto Marcadores 12 Colores', 'Set de 12 marcadores de punta fina para rotular letra clara.', 'giotto', 'dibujo-escritura', 4500, null, 52, 'Multicolor', false),
  ('sakura-pintadores-12', 'Sakura Pintadores 12 Colores', 'Pintadores al agua lavables, seguros para uso escolar.', 'sakura', 'arte-diseno', 7900, null, 30, 'Multicolor', false),
  ('yasutomo-papel-de-seda-a3', 'Yasutomo Papel de Seda A3 10 Hojas', 'Papel de seda A3 de 10 hojas, ideal para collage y origami.', 'yasutomo', 'manualidades', 5500, null, 18, 'Beige', false),
  ('derwent-coloursoft-12', 'Derwent Coloursoft Lápices 12 Colores', 'Set de 12 lápices de color blandos, ideales para la piel.', 'derwent', 'dibujo-escritura', 6800, null, 34, 'Multicolor', false),
  ('holbein-acuarela-12', 'Holbein Acuarela Set 12 Colores', 'Set de 12 acuarelas de intensidad extra, aptas para uso escolar.', 'holbein', 'arte-diseno', 14500, null, 16, 'Multicolor', true),
  ('blick-cartulina-50', 'Blick Cartulina 50 Hojas', 'Cartulina de 50 hojas de colores surtidos.', 'blick', 'manualidades', 4700, null, 38, 'Blanco', false),
  ('boarg-resina-500ml', 'Boarg Resina Líquida 500 ml', 'Resina líquida transparente de 500 ml para manualidades y bis.', 'boarg', 'manualidades', 3600, null, 0, 'Blanco', false),
  ('tempra-acuarela-12', 'Tempra Acuarela Set 12 Colores', 'Set de 12 acuarelas de témpera en frascos con tapa.', 'tempra', 'arte-diseno', 6500, null, 29, 'Multicolor', false),
  ('daler-rowney-gouache-12', 'Daler-Rowney Gouache Set 12 Colores', 'Set de 12 gouaches opacos de colores intensos, estilo ilustración.', 'daler-rowney', 'arte-diseno', 15800, null, 12, 'Multicolor', false),
  ('canson-cartulina-color-10', 'Canson Cartulina Colorida 10 Hojas', 'Cartulina de 10 hojas en colores surtidos para proyectos.', 'canson', 'manualidades', 3100, null, 64, 'Multicolor', false),
  ('uniball-signo-038-azul', 'uni-ball Signo 0.38 Azul', 'Bolígrafo gel de punta fina de 0.38 mm con tinta azul.', 'uni', 'dibujo-escritura', 1900, null, 95, 'Azul', false)
) as p(slug, nombre, descripcion, marca, categoria, lista, oferta, stock, color, destacado);

-- ------------------------------------------------------------------ variantes
insert into product_variants (product_id, nombre, valor, stock, sku, orden)
select p.id, v.nombre, v.valor, v.stock, upper(p.slug) || '-' || v.nombre, v.orden
from (values
  ('montmarte-signature-300ml', 'Blanco',        '#FFFFFF', 26, 1),
  ('montmarte-signature-300ml', 'Negro',         '#000000', 18, 2),
  ('montmarte-signature-300ml', 'Amarillo Ocre', '#F2C230', 12, 3),
  ('montmarte-signature-300ml', 'Azul Cobalto',  '#1F4E9C', 12, 4),
  ('crayola-super-tips-150', 'Bolsa 150 colores', '#7C3AED', 24, 1)
) as v(slug, nombre, valor, stock, orden)
join products p on p.slug = v.slug;