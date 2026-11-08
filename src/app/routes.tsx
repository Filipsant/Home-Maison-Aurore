import type { ReactElement } from 'react'
import { AtelierPage } from '@/pages/atelie-digital'
import { HomePage } from '@/pages/home'
import { OrdersPage } from '@/pages/pedidos'
import { ProvadorPage } from '@/pages/provador'

/**
 * Roteamento mínimo por endereço: são poucas páginas, ligadas por links comuns.
 * O Worker devolve o index.html para qualquer endereço (modo SPA no wrangler.jsonc),
 * e o Vite faz o mesmo em desenvolvimento. Endereço desconhecido mostra a home.
 */
export function renderRoute(pathname: string): ReactElement {
  const path = pathname.replace(/\/+$/, '') || '/'
  switch (path) {
    case '/atelie-digital':
      return <AtelierPage />
    case '/provador':
      return <ProvadorPage />
    case '/atelie/pedidos':
      return <OrdersPage />
    default:
      return <HomePage />
  }
}
