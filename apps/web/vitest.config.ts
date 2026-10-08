import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Sin `@vitejs/plugin-react`: en tests no hace falta Fast Refresh y Vite ya
// transpila TSX con el `jsx: react-jsx` del tsconfig. Además el plugin es
// ESM-only y entraba en conflicto de tipos con el Vite del workspace raíz.
export default defineConfig({
  // Next 15 pone `jsx: preserve` en tsconfig porque él transpila con SWC; en
  // los tests no hay SWC, así que le decimos a esbuild que transforme a JSX.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})