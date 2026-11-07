import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

const base = viteConfig({ command: 'serve', mode: 'test', isSsrBuild: false, isPreview: false })

export default mergeConfig(
  base,
  defineConfig({
    test: {
      css: false,
      projects: [
        {
          extends: true,
          test: {
            name: 'site',
            environment: 'jsdom',
            setupFiles: ['./src/test/setup.ts'],
            include: ['src/**/*.test.{ts,tsx}'],
          },
        },
        {
          extends: true,
          test: {
            name: 'worker',
            environment: 'node',
            include: ['worker/**/*.test.ts'],
          },
        },
      ],
    },
  }),
)
