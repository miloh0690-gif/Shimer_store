'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { qs } from '@/lib/api'
import { PRODUCT_ORDENES, type BrandView, type CategoryView, type ProductOrden } from '@/lib/types'

export type SearchParams = Record<string, string | string[] | undefined>

type Props = {
  categorias: CategoryView[]
  marcas: BrandView[]
  colores: string[]
  total: number
  searchParams: SearchParams
}

function comoLista(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

export default function Filtros({ categorias, marcas, colores, total, searchParams }: Props) {
  const router = useRouter()
  const [minBs, setMinBs] = useState(searchParams.precio_min ?? '')
  const [maxBs, setMaxBs] = useState(searchParams.precio_max ?? '')

  useEffect(() => {
    setMinBs(searchParams.precio_min ?? '')
    setMaxBs(searchParams.precio_max ?? '')
  }, [searchParams.precio_min, searchParams.precio_max])

  const categoriasActivas = comoLista(searchParams.categoria)
  const marcasActivas = comoLista(searchParams.marca)
  const coloresActivos = comoLista(searchParams.color)
  const enOferta = searchParams.en_oferta === 'true'
  const orden = (typeof searchParams.orden === 'string' ? searchParams.orden : 'destacado') as ProductOrden
  const q = typeof searchParams.q === 'string' ? searchParams.q : ''

  function navegar(cambios: Record<string, string | string[] | undefined | null>) {
    const siguiente: SearchParams = { ...searchParams }
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === undefined || valor === null || valor === '') delete siguiente[clave]
      else siguiente[clave] = valor
    }
    const plano: Record<string, string> = {}
    for (const [clave, valor] of Object.entries(siguiente)) {
      if (valor === undefined) continue
      plano[clave] = Array.isArray(valor) ? valor.join(',') : valor
    }
    const query = qs(plano)
    router.push(query ? `/productos${query}` : '/productos', { scroll: false })
  }

  function alternar(clave: string, valor: string) {
    const actuales = comoLista(searchParams[clave])
    const nuevas = actuales.includes(valor) ? actuales.filter((v) => v !== valor) : [...actuales, valor]
    navegar({ [clave]: nuevas })
  }

  function aplicarPrecio() {
    navegar({ precio_min: minBs, precio_max: maxBs })
  }

  function limpiar() {
    setMinBs('')
    setMaxBs('')
    router.push('/productos', { scroll: false })
  }

  const hayFiltros =
    categoriasActivas.length > 0 ||
    marcasActivas.length > 0 ||
    coloresActivos.length > 0 ||
    enOferta ||
    Boolean(searchParams.precio_min) ||
    Boolean(searchParams.precio_max) ||
    Boolean(q)

  const campo = 'w-full rounded-xl border border-tinta/15 bg-white px-3 py-2 text-sm outline-none focus:border-marca-violeta'
  const titulo = 'font-display text-sm uppercase tracking-wide text-tinta/70'
  const check = (activo: boolean) =>
    `h-4 w-4 rounded border-tinta/30 accent-marca-violeta ${activo ? 'border-marca-violeta' : ''}`

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-tinta/70">
          <span className="font-display text-lg text-tinta">{total}</span> producto{total === 1 ? '' : 's'}
        </p>
        {hayFiltros ? (
          <button type="button" onClick={limpiar} className="text-sm font-semibold text-marca-violeta hover:underline">
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="buscar" className={titulo}>Buscar</label>
        <div className="flex gap-2">
          <input
            id="buscar"
            type="search"
            defaultValue={q}
            placeholder="Nombre del producto"
            onKeyDown={(e) => {
              if (e.key === 'Enter') navegar({ q: (e.target as HTMLInputElement).value })
            }}
            className={campo}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById('buscar') as HTMLInputElement | null
              navegar({ q: input?.value ?? '' })
            }}
            className="rounded-xl bg-tinta px-3 py-2 text-sm text-white hover:bg-tinta/90"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={titulo}>Ordenar</span>
        <select
          aria-label="Ordenar"
          value={orden}
          onChange={(e) => navegar({ orden: e.target.value })}
          className={campo}
        >
          {PRODUCT_ORDENES.map((valor) => (
            <option key={valor} value={valor}>
              {valor === 'destacado'
                ? 'Destacados'
                : valor === 'recientes'
                  ? 'Novedades'
                  : valor === 'precio_asc'
                    ? 'Precio: menor a mayor'
                    : valor === 'precio_desc'
                      ? 'Precio: mayor a menor'
                      : 'Nombre A-Z'}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className={titulo}>Categorías</span>
        <ul className="flex flex-col gap-1.5">
          {categorias.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-tinta/80">
                <input
                  type="checkbox"
                  checked={categoriasActivas.includes(c.slug)}
                  onChange={() => alternar('categoria', c.slug)}
                  className={check(categoriasActivas.includes(c.slug))}
                />
                {c.nombre}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <span className={titulo}>Marcas</span>
        <ul className="flex max-h-64 flex-col gap-1.5 overflow-auto pr-1">
          {marcas.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-tinta/80">
                <input
                  type="checkbox"
                  checked={marcasActivas.includes(m.slug)}
                  onChange={() => alternar('marca', m.slug)}
                  className={check(marcasActivas.includes(m.slug))}
                />
                {m.nombre}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {colores.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className={titulo}>Color</span>
          <ul className="flex flex-wrap gap-1.5">
            {colores.map((color) => (
              <li key={color}>
                <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-tinta/10 px-2.5 py-1 text-xs text-tinta/80">
                  <input
                    type="checkbox"
                    checked={coloresActivos.includes(color)}
                    onChange={() => alternar('color', color)}
                    className={check(coloresActivos.includes(color))}
                  />
                  {color}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className={titulo}>Precio (Bs.)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="Mínimo"
            aria-label="Precio mínimo"
            value={minBs}
            onChange={(e) => setMinBs(e.target.value)}
            className={campo}
          />
          <span className="text-tinta/40">—</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="Máximo"
            aria-label="Precio máximo"
            value={maxBs}
            onChange={(e) => setMaxBs(e.target.value)}
            className={campo}
          />
        </div>
        <button
          type="button"
          onClick={aplicarPrecio}
          className="rounded-xl border border-marca-violeta px-3 py-2 text-sm font-semibold text-marca-violeta hover:bg-marca-violeta/5"
        >
          Aplicar precio
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-tinta/80">
          Solo ofertas
          <input
            type="checkbox"
            checked={enOferta}
            onChange={(e) => navegar({ en_oferta: e.target.checked ? 'true' : undefined })}
            className={check(enOferta)}
          />
        </label>
      </div>
    </aside>
  )
}
