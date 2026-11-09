import { gsap, type Timeline } from '../gsap'
import { ease } from '../tokens'
import { finalState } from './shared'

export interface ParallaxOptions {
  /** Elemento cuja passagem pela tela controla o deslocamento (padrão: o pai do alvo). */
  trigger?: Element
  axis?: 'x' | 'y'
  /** Deslocamento inicial e final, em % do próprio elemento. */
  from: number
  to: number
  start?: string
  end?: string
  /** Escala aplicada antes, para o deslocamento não revelar bordas vazias. */
  scale?: number
  /** Movimento reduzido: sem parallax. */
  reduced?: boolean
}

/** Deslocamento linear atrelado ao scroll (E09, E20, E29). */
export function parallax(el: HTMLElement, opts: ParallaxOptions): Timeline {
  if (opts.reduced) return finalState()
  const {
    trigger = el.parentElement ?? el,
    axis = 'y',
    from,
    to,
    start = 'top bottom',
    end = 'bottom top',
    scale,
  } = opts
  const prop = axis === 'y' ? 'yPercent' : 'xPercent'
  if (scale) gsap.set(el, { scale })
  return gsap
    .timeline({ scrollTrigger: { trigger, start, end, scrub: true } })
    .fromTo(el, { [prop]: from }, { [prop]: to, ease: ease.scrub })
}
