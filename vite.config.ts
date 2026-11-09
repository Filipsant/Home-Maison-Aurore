import path from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O plugin do Cloudflare roda o Worker (API de IA) junto com o site e gera o build do Worker.
// - `npm run dev`: sem conexão remota; a geração de imagem cai no exemplo (não exige login).
// - `npm run dev:ia` (modo "ia"): liga o Workers AI de verdade (exige login no Cloudflare).
// Nos testes (Vitest) o plugin fica de fora.
export default defineConfig(({ mode }) => {
  const isTest = Boolean(process.env.VITEST)
  return {
    plugins: [react(), tailwindcss(), ...(isTest ? [] : [cloudflare({ remoteBindings: mode === 'ia' })])],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
