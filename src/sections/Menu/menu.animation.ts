import { gsap, type Timeline } from '@/animations/gsap'
import { delay, distance, duration, ease, stagger } from '@/animations/tokens'

/**
 * Abertura do menu (E37), como timeline pausada: o painel aparece, a barra superior
 * sobe 12px e os itens sobem 20px em cascata de 0,066s.
 * O fechamento é a mesma timeline em `reverse()` acelerado (decisão 3 do estudo).
 */
export function createMenuTimeline(content: HTMLElement): Timeline {
  const top = content.querySelector('[data-menu-top]')
  const items = content.querySelectorAll('[data-menu-item]')
  const tl = gsap.timeline({ paused: true })
  tl.fromTo(content, { opacity: 0 }, { opacity: 1, duration: duration.menuPanel, ease: ease.ui }, 0)
  if (top) {
    tl.fromTo(
      top,
      { y: distance.menuSearchPx, opacity: 0 },
      { y: 0, opacity: 1, duration: duration.menuTop, ease: ease.soft },
      delay.menuTop,
    )
  }
  tl.fromTo(
    items,
    { y: distance.menuPx, opacity: 0 },
    { y: 0, opacity: 1, duration: duration.menuItem, ease: ease.ui, stagger: stagger.menu },
    delay.menuItems,
  )
  return tl
}
