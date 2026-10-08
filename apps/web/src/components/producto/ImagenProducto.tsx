'use client'

import { useEffect, useState } from 'react'

export const PLACEHOLDER = '/placeholder.svg'

export type ImagenProductoProps = {
  src: string | null;
  alt: string;
  className?: string;
};

/**
 * Foto del producto con respaldo: si no hay foto, si la URL esta vacia o si el
 * navegador no la puede cargar, se muestra el placeholder en vez de un icono
 * roto. Un producto sin foto es lo normal en un catalogo que todavia se esta
 * armando, no un error.
 *
 * Va con `<img>` y no con `next/image` a proposito: las fotos van a venir de
 * Supabase Storage, y `next/image` exige que el host este configurado para
 * optimizarlas o rompe la imagen en build.
 *
 * El `src` se re-sincroniza cuando cambia: la galeria reutiliza esta misma
 * instancia para mostrar la foto elegida, y sin el `useEffect` la imagen grande
 * se quedaba siempre en la primera.
 */
export function ImagenProducto({ src, alt, className }: ImagenProductoProps) {
  const [actual, setActual] = useState(src || PLACEHOLDER);

  useEffect(() => {
    setActual(src || PLACEHOLDER);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={actual}
      alt={alt}
      onError={() => setActual(PLACEHOLDER)}
      className={`h-full w-full object-contain p-3 ${className ?? ''}`}
    />
  )
}
