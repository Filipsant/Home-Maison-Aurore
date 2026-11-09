import { useRef, useState } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { headerTheme } from '@/animations/presets'
import { Container } from '@/components/shared/Container'
import { TextLink } from '@/components/shared/TextLink'
import { Button } from '@/components/ui/button'
import { site } from '@/data/site'
import { useMenu, useMenuTrigger } from '@/hooks/useMenu'

/**
 * Header fixo: logo, navegação (some abaixo de 760px) e os botões
 * "Agendar prova" e "Menu". Não some ao rolar; só troca de tema quando passa
 * sobre uma seção escura (E06 do estudo).
 */
export function Header() {
  const ref = useRef<HTMLElement>(null)
  const menu = useMenu()
  const triggerRef = useMenuTrigger()
  const [dark, setDark] = useState(false)

  useSectionAnimation(ref, (root) => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-header-theme="dark"]'))
    headerTheme(sections, root.offsetHeight, setDark)
  })

  return (
    <header
      ref={ref}
      data-header=""
      data-theme={dark ? 'dark' : 'light'}
      data-surface={dark ? 'dark' : undefined}
      className="fixed inset-x-0 top-0 z-30 bg-nevoa text-grafite transition-colors duration-500 ease-out-expo data-[theme=dark]:bg-veludo data-[theme=dark]:text-nevoa"
    >
      <a
        href="#conteudo"
        className="absolute top-2 left-2 -translate-y-24 rounded-pill bg-grafite px-5 py-3 text-button text-nevoa focus-visible:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <Container className="flex h-header items-center justify-between gap-6">
        <a href="#topo" className="inline-flex min-h-11 items-center font-display text-logo">
          {site.name}
        </a>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex gap-10">
            {site.nav.map((item) => (
              <li key={item.id}>
                <TextLink href={item.href}>{item.label}</TextLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant={dark ? 'light' : 'dark'}
            className="hidden transition-[margin,background-color,border-color,color] duration-500 ease-spring lg:inline-flex lg:pointer-fine:hover:mr-5"
          >
            <a href={site.bookFitting.href}>{site.bookFitting.label}</a>
          </Button>
          <Button
            ref={triggerRef}
            variant={dark ? 'outline-light' : 'outline'}
            onClick={menu.toggle}
            aria-haspopup="dialog"
            aria-expanded={menu.isOpen}
            aria-controls={menu.isOpen ? 'menu' : undefined}
            className="transition-[margin,background-color,border-color,color] duration-500 ease-spring md:pointer-fine:hover:ml-5"
          >
            Menu
          </Button>
        </div>
      </Container>
    </header>
  )
}
