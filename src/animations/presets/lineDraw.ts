import type { Timeline } from '../gsap'
import { duration, ease } from '../tokens'
import { finalState, revealTimeline, type RevealOptions } from './shared'

const variants = {
  /** Linhas de seção (E13): 2s, expo.inOut. */
  long: { duration: duration.lineLong, ease: ease.mask },
  /** Divisórias do rodapé (E26): 1s, power2.out. */
  short: { duration: duration.lineShort, ease: ease.soft },
} as const

export interface LineDrawOptions extends RevealOptions {
  variant?: keyof typeof variants
}

/** Linha fina desenhada da esquerda para a direita. */
export function lineDraw(el: HTMLElement, opts: LineDrawOptions = {}): Timeline {
  if (opts.reduced) return finalState()
  const { variant = 'long' } = opts
  return revealTimeline(el, opts).fromTo(
    el,
    { scaleX: 0, transformOrigin: 'left center' },
    { scaleX: 1, ...variants[variant] },
  )
}
