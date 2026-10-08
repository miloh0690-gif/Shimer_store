import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

// eslint-config-next 15 sigue en formato eslintrc (no flat config), así que
// FlatCompat es el puente. Necesita las configs de referencia para resolver los
// `extends` que apuntan a shareable configs, y un directorio base explícito
// porque flat config no lo deduce solo.
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
]

export default eslintConfig