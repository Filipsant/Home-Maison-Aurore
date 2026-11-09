import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Estados do menu. "opening" e "closing" existem para que a timeline do GSAP
 * toque antes de o conteúdo ser desmontado: o diálogo só fecha de fato
 * quando a animação chama `finishClose()`.
 */
export type MenuStatus = 'closed' | 'opening' | 'open' | 'closing'

export interface MenuController {
  status: MenuStatus
  /** Valor para o `open` do Sheet: verdadeiro enquanto abre, está aberto ou fecha. */
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  /** Fecha e depois segue para a âncora (o scroll fica travado enquanto o menu está aberto). */
  closeAndGo: (href: string) => void
  finishOpen: () => void
  finishClose: () => void
}

export function useMenuController(): MenuController {
  const [status, setStatus] = useState<MenuStatus>('closed')
  const pendingHref = useRef<string | null>(null)

  const open = useCallback(() => {
    setStatus((s) => (s === 'closed' || s === 'closing' ? 'opening' : s))
  }, [])
  const close = useCallback(() => {
    setStatus((s) => (s === 'open' || s === 'opening' ? 'closing' : s))
  }, [])
  const toggle = useCallback(() => {
    setStatus((s) => (s === 'open' || s === 'opening' ? 'closing' : 'opening'))
  }, [])
  const closeAndGo = useCallback(
    (href: string) => {
      pendingHref.current = href
      close()
    },
    [close],
  )
  const finishOpen = useCallback(() => {
    setStatus((s) => (s === 'opening' ? 'open' : s))
  }, [])
  const finishClose = useCallback(() => {
    setStatus((s) => (s === 'closing' ? 'closed' : s))
  }, [])

  // Depois de fechar: segue para o destino pedido. Âncora na mesma página só troca o hash;
  // outra página (ou âncora de outra página) carrega o endereço.
  useEffect(() => {
    if (status !== 'closed' || !pendingHref.current) return
    const target = new URL(pendingHref.current, window.location.href)
    pendingHref.current = null
    if (target.pathname === window.location.pathname && target.hash) window.location.hash = target.hash
    else window.location.assign(target.href)
  }, [status])

  return useMemo(
    () => ({
      status,
      isOpen: status !== 'closed',
      open,
      close,
      toggle,
      closeAndGo,
      finishOpen,
      finishClose,
    }),
    [status, open, close, toggle, closeAndGo, finishOpen, finishClose],
  )
}

export const MenuContext = createContext<MenuController | null>(null)

/** Referência ao botão "Menu" do header: recebe o foco de volta quando o menu fecha. */
export const MenuTriggerContext = createContext<React.RefObject<HTMLButtonElement> | null>(null)

/** Estado do menu compartilhado entre o Header (botão) e o Menu (painel). */
export function useMenu(): MenuController {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu precisa estar dentro de <MenuProvider>')
  return ctx
}

export function useMenuTrigger(): React.RefObject<HTMLButtonElement> {
  const ref = useContext(MenuTriggerContext)
  if (!ref) throw new Error('useMenuTrigger precisa estar dentro de <MenuProvider>')
  return ref
}
