import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const gsapImports = {
  paths: [
    { name: 'gsap', message: 'Importe GSAP de "@/animations/gsap" (plugins registrados uma vez).' },
    { name: '@gsap/react', message: 'Use os hooks de "@/animations/hooks".' },
  ],
  patterns: [{ group: ['gsap/*'], message: 'Importe GSAP de "@/animations/gsap".' }],
}

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'worker/worker-configuration.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': ['error', gsapImports],
    },
  },
  {
    // Regra 5: GSAP só entra pela biblioteca de animação.
    files: ['src/animations/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Regra 1: seções não importam umas às outras.
    files: ['src/sections/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          ...gsapImports,
          patterns: [
            ...gsapImports.patterns,
            {
              group: ['@/sections/*', '@/sections/**', '../*', '../**'],
              message: 'Seções não importam outras seções.',
            },
          ],
        },
      ],
    },
  },
  {
    // shadcn/ui exporta variantes junto dos componentes.
    files: ['src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
])
