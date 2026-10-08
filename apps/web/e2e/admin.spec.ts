import { expect, test } from '@playwright/test'

const CLIENTE = { email: 'cliente@shimer.test', password: 'ShimerCliente2026' }

test('sin sesion, /admin manda a /cuenta', async ({ page }) => {
  await page.goto('/admin')

  await page.waitForURL(/\/cuenta/)
  await expect(page.getByRole('heading', { level: 1, name: /Mi cuenta/i })).toBeVisible()
})

test('con sesion de cliente, /admin responde 404', async ({ page }) => {
  await page.goto('/cuenta')
  await page.locator('#email').fill(CLIENTE.email)
  await page.locator('#password').fill(CLIENTE.password)
  await page.locator('form').getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByText(new RegExp(`iniciada como ${CLIENTE.email}`, 'i'))).toBeVisible()

  const respuesta = await page.goto('/admin')
  expect(respuesta?.status()).toBe(404)
  await expect(page.getByText(/404|not found|no encontrada/i).first()).toBeVisible()
})
