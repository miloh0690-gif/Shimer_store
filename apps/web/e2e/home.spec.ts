import { expect, test, type Page } from '@playwright/test'

// naturalWidth === 0 es el criterio canonico de imagen rota. `complete === false`
// NO sirve: con un srcset de 1x/2x el navegador deja la carga pendiente aunque la
// imagen ya haya decodificado (el srcset del logo queda en false para siempre).
async function imagenesRotas(page: Page): Promise<string[]> {
  return page.locator('img').evaluateAll((imagenes) =>
    imagenes
      .filter((img) => !(img instanceof HTMLImageElement) || img.naturalWidth === 0)
      .map((img) => (img instanceof HTMLImageElement ? img.currentSrc || img.src : String(img))),
  )
}

test('la home carga el hero y los tiles de categoria', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: /Manualidades/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Arte & Diseño/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Escolar/i })).toBeVisible()
})

test('la home lista productos con precio en bolivianos', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText(/Bs\.\s?\d/).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Crayola Super Tips 150 Colores/i }).first()).toBeVisible()
})

test('ninguna imagen rota en la home', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // /_next/image optimiza cada tamano bajo demanda: la primera vez tarda.
  await expect.poll(() => imagenesRotas(page), { timeout: 20_000 }).toEqual([])
})

test('los productos sin foto caen al placeholder', async ({ page }) => {
  await page.goto('/')

  // Ningun producto del seed trae imagen: todos deben mostrar el placeholder.
  await expect(page.locator('img[src="/placeholder.svg"]').first()).toBeVisible()
})
