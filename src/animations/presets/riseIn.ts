import type { Timeline } from '../gsap'
import { distance, duration, ease, stagger } from '../tokens'
import { finalState, revealTimeline, toArray, type RevealOptions } from './shared'

const variants = {
  /** Linhas de lista e cards (E18): 50px, 0,8s, power3.out. */
  list: { y: distance.listPx, duration: duration.list, ease: ease.list, stagger: stagger.media },
  /** Miniaturas e legendas (E19): 30px, 0,6s, power2.out. */
  thumb: { y: distance.thumbPx, duration: duration.thumb, ease: ease.soft, stagger: stagger.media },
  /** Colunas do rodapé (E27): 20px, 0,6s, cascata de 0,08s. */
  footer: { y: distance.footerPx, duration: duration.footerItem, ease: ease.soft, stagger: stagger.footer },
  /** Links (E28): 14px, 0,5s, cascata de 0,05s. */
  link: { y: distance.linkPx, duration: duration.link, ease: ease.soft, stagger: stagger.links },
} as const

export interface RiseInOptions extends RevealOptions {
  variant?: keyof typeof variants
}

/** Elementos sobem e aparecem, em cascata (E17 a E19, E27, E28). */
export function riseIn(targets: Element | ArrayLike<Element>, opts: RiseInOptions = {}): Timeline {
  if (opts.reduced) return finalState()
  const items = toArray(targets)
  const first = items[0]
  if (!first) return finalState()
  const { variant = 'list' } = opts
  const { y, ...rest } = variants[variant]
  return revealTimeline(first, opts).from(items, { y, opacity: 0, ...rest })
}
