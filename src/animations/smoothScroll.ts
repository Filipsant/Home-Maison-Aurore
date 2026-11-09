import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { smoothScroll as config } from './tokens'

export interface SmoothScroll {
  lenis: Lenis
  destroy: () => void
}

/**
 * Lenis ligado ao ScrollTrigger (estudo, E05): o relógio do GSAP move o Lenis e
 * cada rolagem atualiza o ScrollTrigger. O toque fica nativo (`syncTouch: false`).
 * Não deve ser criado com movimento reduzido.
 */
export function createSmoothScroll(): SmoothScroll {
  const header = document.querySelector<HTMLElement>('[data-header]')
  const lenis = new Lenis({
    lerp: config.lerp,
    wheelMultiplier: config.wheelMultiplier,
    syncTouch: config.syncTouch,
    autoRaf: false,
    anchors: { offset: -(header?.offsetHeight ?? 0) },
  })

  lenis.on('scroll', () => ScrollTrigger.update())
  const tick = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return {
    lenis,
    destroy: () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    },
  }
}

/** Espera as fontes (o SplitText mede as linhas com a fonte final), com limite de tempo. */
export function waitForFonts(timeoutMs = 2500): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve()
  return Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}

/** Recalcula as posições de todos os gatilhos (depois de fontes e imagens). */
export function refreshScroll() {
  ScrollTrigger.refresh()
}
