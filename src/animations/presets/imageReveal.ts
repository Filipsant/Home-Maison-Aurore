import type { Timeline } from '../gsap'
import { delay as delays, duration, ease } from '../tokens'
import { finalState, revealTimeline, type RevealOptions } from './shared'

const CLOSED = 'inset(0% 0% 100% 0%)'
const OPEN = 'inset(0% 0% 0% 0%)'

/**
 * Imagem com cortina de cor (E15, E22, E25): o bloco de cor (`[data-curtain]`) abre de
 * cima para baixo e, 0,1s depois, a mídia (`[data-media]`) abre por cima. Sem escala.
 * Espera a estrutura do componente `Photo`.
 */
export function imageReveal(figure: HTMLElement, opts: RevealOptions = {}): Timeline {
  if (opts.reduced) return finalState()

  const curtain = figure.querySelector('[data-curtain]')
  const media = figure.querySelector('[data-media]')
  const tl = revealTimeline(figure, opts)

  if (curtain) {
    tl.fromTo(
      curtain,
      { clipPath: CLOSED },
      { clipPath: OPEN, duration: duration.curtainBlock, ease: ease.enter },
      0,
    )
  }
  if (media) {
    tl.fromTo(
      media,
      { clipPath: CLOSED },
      { clipPath: OPEN, duration: duration.curtainMedia, ease: ease.mask },
      curtain ? delays.curtainMedia : 0,
    )
  }
  return tl
}
