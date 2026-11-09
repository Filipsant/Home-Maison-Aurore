import { useEffect } from 'react'
import { ordersPanel } from '@/data/ordersPanel'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Header } from '@/sections/Header'
import { Menu } from '@/sections/Menu'
import { OrdersPanel } from '@/sections/OrdersPanel'

/** Painel de pedidos do ateliê (/atelie/pedidos): fora do menu e dos buscadores. */
export function OrdersPage() {
  usePageTitle(ordersPanel.title)
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
  return (
    <div id="topo">
      <Header />
      <Menu />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <OrdersPanel />
      </main>
    </div>
  )
}
