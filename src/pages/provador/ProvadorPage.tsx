import { provadorPage } from '@/data/provadorPage'
import { usePageTitle } from '@/hooks/usePageTitle'
import { FittingStudio } from '@/sections/FittingStudio'
import { Footer } from '@/sections/Footer'
import { Header } from '@/sections/Header'
import { Menu } from '@/sections/Menu'

/** Página "Provador 3D": a peça do ateliê digital no manequim, com as medidas e o pedido. */
export function ProvadorPage() {
  usePageTitle(provadorPage.title)
  return (
    <div id="topo">
      <Header />
      <Menu />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <FittingStudio />
      </main>
      <Footer />
    </div>
  )
}
