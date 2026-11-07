import { gsap, type Timeline } from '../gsap'
import { trigger as triggerTokens } from '../tokens'

/** Opções comuns às entradas disparadas no scroll. */
export interface RevealOptions {
  /**
   * Elemento que dispara a animação ao entrar na tela (padrão: o próprio alvo).
   * `false` toca imediatamente (por exemplo, na abertura da página).
   */
  trigger?: Element | false
  /** Ponto de disparo no formato do ScrollTrigger (padrão: "top 75%"). */
  start?: string
  /** Atraso em segundos dentro da timeline. */
  delay?: number
  /** Movimento reduzido: devolve a timeline já no estado final, sem tweens. */
  reduced?: boolean
}

/** Timeline vazia e concluída: o elemento fica como o CSS o desenha (estado final). */
export function finalState(): Timeline {
  return gsap.timeline().progress(1)
}

/** Timeline que toca uma vez quando `trigger` cruza `start`, ou já, se `trigger` for `false`. */
export function revealTimeline(target: Element, opts: RevealOptions): Timeline {
  const { trigger = target, start = triggerTokens.start, delay = 0 } = opts
  return gsap.timeline({
    delay,
    scrollTrigger: trigger ? { trigger, start, once: true } : undefined,
  })
}

/** Converte NodeList/array/elemento único em array de elementos. */
export function toArray(targets: Element | ArrayLike<Element>): Element[] {
  return targets instanceof Element ? [targets] : Array.from(targets)
}
