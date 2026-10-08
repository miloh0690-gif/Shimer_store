import { fireEvent, render, screen } from '@testing-library/react'
import { ImagenProducto } from './ImagenProducto'
import { ProductCard } from './ProductCard'
import type { ProductView } from '@/lib/types'

const producto: ProductView = {
  id: 'p1',
  slug: 'crayola-super-tips-150',
  nombre: 'Crayola Super Tips 150 Colores',
  descripcion: 'Bolsa de 150 colores',
  precio_bob_cents: 59500,
  precio_oferta_bob_cents: 54900,
  precio_efectivo_bob_cents: 54900,
  en_oferta: true,
  stock: 24,
  sku: 'CRY-150',
  color: 'Multicolor',
  imagenes: [],
  destacado: true,
  demo: true,
  categoria: { slug: 'arte-diseno', nombre: 'Arte & Diseño' },
  marca: { slug: 'crayola', nombre: 'Crayola' },
  variantes: [],
}

describe('ImagenProducto', () => {
  it('muestra la imagen cuando carga bien', () => {
    render(<ImagenProducto src="/logo.jpg" alt="Crayola" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/logo.jpg')
  })

  it('cambia a placeholder.svg cuando la imagen falla', () => {
    render(<ImagenProducto src="/no-existe.jpg" alt="Crayola" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('img')).toHaveAttribute('src', '/placeholder.svg')
  })

  it('con src vacío arranca directamente en placeholder.svg', () => {
    render(<ImagenProducto src="" alt="Crayola" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/placeholder.svg')
  })
})

describe('ProductCard', () => {
  it('un producto en oferta muestra la lista tachada y el efectivo', () => {
    render(<ProductCard product={producto} />)
    expect(screen.getByText('Bs. 595.00')).toHaveClass('line-through')
    expect(screen.getByText('Bs. 549.00')).toBeVisible()
  })

  it('un producto con stock 0 muestra "Sin stock"', () => {
    render(<ProductCard product={{ ...producto, stock: 0 }} />)
    expect(screen.getByText('Sin stock')).toBeVisible()
  })
})
