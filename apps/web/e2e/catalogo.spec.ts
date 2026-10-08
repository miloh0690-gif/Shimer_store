import { expect, test } from '@playwright/test'

const CRAYOLA = 'Crayola Super Tips 150 Colores'
const HOLBEIN = 'Holbein Acuarela Set 12 Colores'

// El tile de categoria es un link en la home; en /productos la misma categoria es
// un checkbox. El brief pide clickear el link, asi que el viaje arranca en '/'.
test('filtrar por categoria desde la home deja el filtro en la URL', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Arte & Diseño/i }).click()

  await page.waitForURL(/categoria=arte-diseno/)
  await expect(page.getByRole('heading', { level: 1, name: 'Productos' })).toBeVisible()
  await expect(page.getByText(CRAYOLA, { exact: true }).first()).toBeVisible()
  await expect(page.getByText(HOLBEIN, { exact: true }).first()).toBeVisible()
})

test('una URL de filtro compartida reproduce el mismo resultado', async ({ page }) => {
  await page.goto('/productos?categoria=arte-diseno&en_oferta=true')

  await expect(page.getByText(CRAYOLA, { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Bs. 549.00').first()).toBeVisible()

  // Solo tres productos de arte-diseno estan en oferta; Holbein no, asi que la
  // misma URL compartida tiene que excluirlo.
  await expect(page.getByText(HOLBEIN, { exact: true })).toHaveCount(0)
})

test('un filtro imposible muestra el estado vacio con salida', async ({ page }) => {
  await page.goto('/productos?categoria=arte-diseno&precio_min=99999')

  await expect(page.getByText(/No encontramos productos/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver todo el cat/i })).toBeVisible()
})
