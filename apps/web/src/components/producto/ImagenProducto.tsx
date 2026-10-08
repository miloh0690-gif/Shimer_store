'use client'

import { useState } from 'react'

export const PLACEHOLDER = '/placeholder.svg'

export type ImagenProductoProps = {
  src: string | null;
  alt: string;
  className?: string;
};

/**
 * Foto del producto con respaldo: si no hay foto, si la URL está vacía o si el
 * navegador no la puede cargar, se muestra el placeholder en vez de un ícono
 * roto. Un producto sin foto es lo normal en un catálogo que todavía se está
 * armando, no un error.
 *
 * Va con `<img>` y no con `next/image` a propósito: las fotos van a venir de
 * Supabase Storage, y `next/image` exige que el host esté configurado para
 * optimizarlas o rompe la imagen en build.
 */
export function ImagenProducto({ src, alt, className }: ImagenProductoProps) {
  const [actual, setActual] = useState(src || PLACEHOLDER);

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
