import '@testing-library/jest-dom/vitest'

// jsdom no implementa ResizeObserver y lenis lo usa al construirse: sin este
// stub cualquier componente que anime falla en los tests por una razon que no
// existe en el navegador.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
