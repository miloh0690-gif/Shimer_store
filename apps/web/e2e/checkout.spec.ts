import { expect, test } from '@playwright/test'

// La escritura real contra la base necesita la service_role, que vive en Render
// (T16). Aca se intercepta el POST para verificar el flujo de la interfaz: que
// mande el header idempotency-key, que solo mande ids y cantidades, y que el
// carrito se vacie al confirmar.
test('confirmar el pedido lleva el folio a la pantalla de exito', async ({ page }, testInfo) => {
  let cabeceras: Record<string, string> = {}
  let cuerpo = ''

  await page.route('**/api/orders', async (route) => {
    cabeceras = route.request().headers()
    cuerpo = route.request().postData() ?? ''
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-0000-0000',
        folio: 'SHM-000123',
        estado: 'nuevo',
        total_bob_cents: 109800,
      }),
    })
  })

  await page.goto('/producto/crayola-super-tips-150')
  await page.getByRole('button', { name: /Agregar al carrito/i }).click()

  await page.goto('/checkout')
  await page.locator('#cliente_nombre').fill('Persona de prueba')
  await page.locator('#cliente_email').fill('prueba@shimer.test')
  await page.locator('#cliente_telefono').fill('+591 700 00000')
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()

  await page.waitForURL(/exito/)
  const folio = page.getByText(/SHM-\d{6}/)
  await expect(folio).toBeVisible()
  await expect(folio).toHaveText('SHM-000123')
  await testInfo.attach('folio', { body: 'SHM-000123', contentType: 'text/plain' })

  expect(cabeceras['idempotency-key']).toBeTruthy()

  const enviado = JSON.parse(cuerpo) as {
    items: Array<{ product_id: string; variant_id?: string; cantidad: number }>
  }
  expect(enviado.items).toHaveLength(1)
  expect(enviado.items[0]!.cantidad).toBe(1)
  expect(enviado.items[0]!.product_id).toMatch(/^[0-9a-f-]{36}$/)

  // El precio y el nombre del producto los decide el servidor: el navegador
  // manda solo el id, la cantidad y los datos de entrega del cliente.
  expect(cuerpo).not.toContain('bob_cents')
  expect(cuerpo).not.toContain('54900')
  expect(cuerpo).not.toContain('Crayola')
})

test('el formulario rechaza datos invalidos antes de llamar a la API', async ({ page }) => {
  let llamadas = 0
  await page.route('**/api/orders', async (route) => {
    llamadas += 1
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
  })

  await page.goto('/producto/crayola-super-tips-150')
  await page.getByRole('button', { name: /Agregar al carrito/i }).click()

  await page.goto('/checkout')
  await page.locator('#cliente_nombre').fill('')
  await page.locator('#cliente_email').fill('esto-no-es-un-correo')
  await page.locator('#cliente_telefono').fill('')
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()

  await expect(page.getByText(/Escribí un correo válido/i)).toBeVisible()
  await expect(page.getByText(/El nombre es obligatorio/i)).toBeVisible()
  await expect(page.locator('#cliente_email')).toHaveAttribute('aria-invalid', 'true')
  expect(llamadas).toBe(0)
})
