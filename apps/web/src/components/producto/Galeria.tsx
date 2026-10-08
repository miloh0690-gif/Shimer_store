'use client'

import { useState } from 'react'
import { ImagenProducto, PLACEHOLDER } from './ImagenProducto'

type Props = {
  imagenes: string[]
  alt: string
}

export default function Galeria({ imagenes, alt }: Props) {
  const lista = imagenes.length > 0 ? imagenes : [PLACEHOLDER]
  const [activa, setActiva] = useState(0)
  const indice = Math.min(activa, lista.length - 1)
  const principal = lista[indice] ?? PLACEHOLDER

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-tinta/10 bg-white shadow-sm">
        <ImagenProducto src={principal} alt={alt} className="h-full w-full" />
      </div>
      {lista.length > 1 ? (
        <ul className="flex gap-2">
          {lista.map((src, i) => (
            <li key={`${src}-${i}`}>
              <button
                type="button"
                onClick={() => setActiva(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === indice}
                className={`relative h-16 w-16 overflow-hidden rounded-xl border transition ${
                  i === indice ? 'border-marca-violeta' : 'border-tinta/10 hover:border-tinta/30'
                }`}
              >
                <ImagenProducto src={src} alt="" className="h-full w-full" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
