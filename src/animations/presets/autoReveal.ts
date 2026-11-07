import type { Timeline } from '../gsap'
import { imageReveal } from './imageReveal'
import { lineDraw, type LineDrawOptions } from './lineDraw'
import { riseIn, type RiseInOptions } from './riseIn'
import { textReveal } from './textReveal'

export interface AutoRevealOptions {
  reduced?: boolean
  /** Ponto de disparo para todos os elementos da seção. */
  start?: string
  rise?: RiseInOptions['variant']
  line?: LineDrawOptions['variant']
  /** Seletores a ignorar (elementos animados à parte pela seção). */
  exclude?: string
}

/**
 * Aplica os presets aos elementos marcados dentro de `root`:
 * `[data-reveal="lines"]` → textReveal, `[data-reveal="photo"]` → imageReveal,
 * `[data-reveal="rise"]` → riseIn, `[data-line]` → lineDraw.
 * Cada elemento dispara sozinho quando entra na tela.
 */
export function autoReveal(root: HTMLElement, opts: AutoRevealOptions = {}): Timeline[] {
  const { reduced, start, rise = 'thumb', line = 'long', exclude } = opts
  const pick = <T extends Element>(selector: string) =>
    Array.from(root.querySelectorAll<T>(selector)).filter((el) => !(exclude && el.closest(exclude)))

  return [
    ...pick<HTMLElement>('[data-reveal="lines"]').map((el) => textReveal(el, { reduced, start })),
    ...pick<HTMLElement>('[data-reveal="photo"]').map((el) => imageReveal(el, { reduced, start })),
    ...pick('[data-reveal="rise"]').map((el) => riseIn(el, { reduced, start, variant: rise })),
    ...pick<HTMLElement>('[data-line]').map((el) => lineDraw(el, { reduced, start, variant: line })),
  ]
}
