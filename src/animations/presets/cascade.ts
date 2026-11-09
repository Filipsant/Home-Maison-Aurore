import type { Timeline } from '../gsap'
import { distance, duration, ease, stagger } from '../tokens'
import { finalState, revealTimeline, toArray, type RevealOptions } from './shared'

/**
 * Colunas em cascata (E24): cada coluna sobe de um deslocamento maior que a anterior
 * (40%, 80%, 120%), em circ.out de 1s e cascata de 0,05s.
 */
export function cascade(items: ArrayLike<Element>, opts: RevealOptions = {}): Timeline {
  if (opts.reduced) return finalState()
  const list = toArray(items)
  const first = list[0]
  if (!first) return finalState()
  const offsets = distance.cascadePercent
  return revealTimeline(first, opts).from(list, {
    yPercent: (i: number) => offsets[i % offsets.length] ?? 0,
    opacity: 0,
    duration: duration.block,
    ease: ease.text,
    stagger: stagger.columns,
  })
}
