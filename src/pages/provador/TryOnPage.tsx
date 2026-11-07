import { tryOnPage } from '@/data/tryOnPage'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Footer } from '@/sections/Footer'
import { Header } from '@/sections/Header'
import { Menu } from '@/sections/Menu'
import { TryOnStudio } from '@/sections/TryOnStudio'

/** Página "Provador virtual". */
export function TryOnPage() {
  usePageTitle(tryOnPage.title)
  return (
    <div id="topo">
      <Header />
      <Menu />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <TryOnStudio />
      </main>
      <Footer />
    </div>
  )
}
