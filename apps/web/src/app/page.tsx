import { BrandStrip } from '@/components/home/BrandStrip'
import { CategoryTiles } from '@/components/home/CategoryTiles'
import { Hero } from '@/components/home/Hero'
import { ProductRail } from '@/components/home/ProductRail'
import { Testimonials } from '@/components/home/Testimonials'
import { getHomeData } from '@/lib/queries'

export default async function Home() {
  // Si la API no responde, getHomeData devuelve listas vacías y la home degrada
  // a secciones incompletas en vez de reventar con un 500.
  const { categorias, marcas, novedades, masVendidos, ofertas } = await getHomeData();

  return (
    <main>
      <Hero />
      <CategoryTiles categorias={categorias} />
      <ProductRail titulo="Novedades" items={novedades} />
      <ProductRail titulo="Los más vendidos" items={masVendidos} />
      <BrandStrip marcas={marcas} />
      <ProductRail titulo="Ofertas" items={ofertas} />
      <Testimonials />
    </main>
  )
}