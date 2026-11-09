import { usePageTitle } from '@/hooks/usePageTitle'
import { AtelierStudio } from '@/sections/AtelierStudio'
import { Footer } from '@/sections/Footer'
import { Header } from '@/sections/Header'
import { Menu } from '@/sections/Menu'
import { atelierPage } from '@/data/atelierPage'

/** Página "Criar peça" (ateliê digital com IA). */
export function AtelierPage() {
  usePageTitle(atelierPage.title)
  return (
    <div id="topo">
      <Header />
      <Menu />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <AtelierStudio />
      </main>
      <Footer />
    </div>
  )
}
