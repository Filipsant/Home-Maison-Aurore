import type { ReactElement } from 'react'
import { AtelierPage } from '@/pages/atelie-digital'
import { HomePage } from '@/pages/home'
import { TryOnPage } from '@/pages/provador'

/**
 * Roteamento mínimo por endereço: são só três páginas, ligadas por links comuns.
 * O Worker devolve o index.html para qualquer endereço (modo SPA no wrangler.jsonc),
 * e o Vite faz o mesmo em desenvolvimento. Endereço desconhecido mostra a home.
 */
export function renderRoute(pathname: string): ReactElement {
  const path = pathname.replace(/\/+$/, '') || '/'
  switch (path) {
    case '/atelie-digital':
      return <AtelierPage />
    case '/provador':
      return <TryOnPage />
    default:
      return <HomePage />
  }
}
