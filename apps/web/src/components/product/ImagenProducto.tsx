'use client'

import Image from 'next/image'
import { useState } from 'react'

export type ImagenProductoProps = {
  src: string | null;
  alt: string;
  /** Se usa en el `sizes` de next/image. */
  sizes?: string;
  className?: string;
  priority?: boolean;
};

/**
 * Foto del producto con respaldo: si no hay foto o la imagen falla, se muestra
 * el placeholder en vez de un ícono roto. Un producto sin foto es lo normal en
 * un catálogo que todavía se está armando, no un error.
 */
export function ImagenProducto({
  src,
  alt,
  sizes = '(max-width: 640px) 50vw, 20vw',
  className,
  priority = false,
}: ImagenProductoProps) {
  const [fallo, setFallo] = useState(false);
  const usarPlaceholder = !src || fallo;

  return (
    <div className={`relative overflow-hidden bg-white ${className ?? ''}`}>
      <Image
        src={usarPlaceholder ? '/placeholder.svg' : src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFallo(true)}
        className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  )
}