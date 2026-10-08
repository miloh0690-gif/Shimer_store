import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Galeria from './Galeria'

const FOTOS = ['/a.jpg', '/b.jpg', '/c.jpg']

function principal() {
  return screen.getByAltText('Crayola Super Tips 150 Colores')
}

describe('Galeria', () => {
  it('muestra la primera foto como imagen principal', () => {
    render(<Galeria imagenes={FOTOS} alt="Crayola Super Tips 150 Colores" />)
    expect(principal()).toHaveAttribute('src', '/a.jpg')
  })

  it('cambia la imagen principal al elegir otra miniatura', () => {
    render(<Galeria imagenes={FOTOS} alt="Crayola Super Tips 150 Colores" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver imagen 2' }))
    expect(principal()).toHaveAttribute('src', '/b.jpg')
  })

  it('vuelve a la primera foto al elegirla de nuevo', () => {
    render(<Galeria imagenes={FOTOS} alt="Crayola Super Tips 150 Colores" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver imagen 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver imagen 1' }))
    expect(principal()).toHaveAttribute('src', '/a.jpg')
  })

  it('marca como actual la miniatura elegida', () => {
    render(<Galeria imagenes={FOTOS} alt="Crayola Super Tips 150 Colores" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver imagen 2' }))
    expect(screen.getByRole('button', { name: 'Ver imagen 2' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Ver imagen 1' })).toHaveAttribute('aria-current', 'false')
  })

  it('sin fotos muestra el placeholder y no hay miniaturas', () => {
    render(<Galeria imagenes={[]} alt="Crayola Super Tips 150 Colores" />)
    expect(principal()).toHaveAttribute('src', '/placeholder.svg')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('marca la miniatura activa con aria-current en un solo boton', () => {
    render(<Galeria imagenes={FOTOS} alt="Crayola Super Tips 150 Colores" />)
    const actuales = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'true')
    expect(actuales).toHaveLength(1)
  })
})
