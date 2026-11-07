import { useEffect, useRef, useState } from 'react'
import { useGSAP, type Timeline } from '@/animations/gsap'
import { useMotion, useReducedMotion } from '@/animations/hooks'
import { menu as menuTokens } from '@/animations/tokens'
import { Container } from '@/components/shared/Container'
import { TextLink } from '@/components/shared/TextLink'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { site } from '@/data/site'
import { useMenu, useMenuTrigger } from '@/hooks/useMenu'
import { createMenuTimeline } from './menu.animation'

/**
 * Menu em tela cheia (Sheet do shadcn, `side="top"`). O Radix cuida de foco preso,
 * Esc e trava de scroll; o foco volta ao botão "Menu" ao fechar.
 * Animação: timeline pausada que abre com `play()` e fecha com `reverse()` acelerado;
 * o conteúdo só é desmontado quando o reverse termina (`finishClose`).
 */
export function Menu() {
  const menu = useMenu()
  const triggerRef = useMenuTrigger()
  const { getLenis } = useMotion()
  const reduced = useReducedMotion()
  const { status, isOpen, finishOpen, finishClose } = menu

  // O conteúdo vive num portal montado depois do primeiro render: guardamos o nó em estado.
  const [content, setContent] = useState<HTMLDivElement | null>(null)
  const timeline = useRef<{ tl: Timeline; node: HTMLElement } | null>(null)

  useGSAP(
    () => {
      if (status === 'opening') {
        if (reduced) {
          finishOpen()
          return
        }
        if (!content) return
        const current = timeline.current
        if (current?.node === content) {
          current.tl.eventCallback('onComplete', finishOpen).timeScale(1).play()
          return
        }
        current?.tl.kill()
        const tl = createMenuTimeline(content)
        timeline.current = { tl, node: content }
        tl.eventCallback('onComplete', finishOpen).play(0)
      }
      if (status === 'closing') {
        const current = timeline.current
        if (reduced || !current) {
          finishClose()
          return
        }
        current.tl
          .eventCallback('onReverseComplete', finishClose)
          .timeScale(menuTokens.closeTimeScale)
          .reverse()
      }
    },
    { dependencies: [status, content, reduced] },
  )

  // Rede de segurança: o menu nunca fica preso fechando.
  useEffect(() => {
    if (status !== 'closing') return
    const id = window.setTimeout(finishClose, menuTokens.closeFallbackMs)
    return () => window.clearTimeout(id)
  }, [status, finishClose])

  // Smooth scroll parado enquanto o menu está aberto.
  useEffect(() => {
    const lenis = getLenis()
    if (!lenis) return
    if (isOpen) lenis.stop()
    else lenis.start()
  }, [isOpen, getLenis])

  const go = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    menu.closeAndGo(href)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? menu.open() : menu.close())}>
      <SheetContent
        ref={setContent}
        id="menu"
        side="top"
        aria-describedby={undefined}
        data-surface="dark"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          triggerRef.current?.focus()
        }}
        className="h-dvh overflow-y-auto bg-veludo text-nevoa"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <Container className="flex min-h-full flex-col">
          <div data-menu-top="" className="flex h-header items-center justify-between">
            <span className="font-display text-logo" aria-hidden="true">
              {site.name}
            </span>
            <Button variant="outline-light" onClick={menu.close}>
              Fechar
            </Button>
          </div>

          <nav aria-label="Menu" className="flex flex-1 items-center py-12">
            <ul className="flex flex-col gap-3">
              {site.nav.map((item) => (
                <li key={item.id} data-menu-item="">
                  <a
                    href={item.href}
                    onClick={go(item.href)}
                    className="inline-block font-display text-display-l text-nevoa transition-colors duration-500 ease-out-expo hover:text-giz-claro"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            data-menu-item=""
            className="flex flex-col gap-2 border-t border-linha-escura py-8 md:flex-row md:items-center md:justify-between"
          >
            <p className="text-caption text-texto-sobre-escuro">{site.menu.address}</p>
            <TextLink href={site.menu.bookFitting.href} onClick={go(site.menu.bookFitting.href)}>
              {site.menu.bookFitting.label}
            </TextLink>
          </div>
        </Container>
      </SheetContent>
    </Sheet>
  )
}
