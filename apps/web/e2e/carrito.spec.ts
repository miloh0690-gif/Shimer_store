import { expect, test, type Page } from '@playwright/test'

const CRAYOLA = 'Crayola Super Tips 150 Colores'
const HOLBEIN = 'Holbein Acuarela Set 12 Colores'

async function agregar(page: Page, slug: string) {
  await page.goto(`/producto/${slug}`)
  await page.getByRole('button', { name: /Agregar al carrito/i }).click()
  await expect(page.getByRole('button', { name: /Agregado al carrito/i })).toBeVisible()
}

test('el carrito guarda dos productos distintos', async ({ page }) => {
  await agregar(page, 'crayola-super-tips-150')
  await agregar(page, 'holbein-acuarela-12')

  await page.goto('/carrito')
  await expect(page.getByRole('heading', { level: 1, name: /Tu carrito/i })).toBeVisible()

  const lineas = page.locator('main ul > li')
  await expect(lineas).toHaveCount(2)
  await expect(lineas.nth(0)).toContainText(CRAYOLA)
  await expect(lineas.nth(1)).toContainText(HOLBEIN)
})

test('subir la cantidad a 3 se mantiene despues de recargar', async ({ page }) => {
  await agregar(page, 'crayola-super-tips-150')

  await page.goto('/carrito')
  const mas = page.getByRole('button', { name: new RegExp(`Agregar una unidad de ${CRAYOLA}`) })
  await mas.click()
  await mas.click()

  // 549 Bs x 3 = 1647 Bs
  await expect(page.locator('main ul > li').first()).toContainText('Bs. 1,647.00')

  await page.reload()
  await expect(page.locator('main ul > li').first()).toContainText('Bs. 1,647.00')
})

test('un producto sin stock no se puede agregar', async ({ page }) => {
  await page.goto('/producto/boarg-resina-500ml')

  const boton = page.getByRole('button', { name: /Sin stock/i })
  await expect(boton).toBeVisible()
  await expect(boton).toBeDisabled()
})
