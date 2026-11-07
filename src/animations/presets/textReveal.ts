import { SplitText, type Timeline } from '../gsap'
import { distance, duration as durations, ease as eases, stagger as staggers } from '../tokens'
import { finalState, revealTimeline, type RevealOptions } from './shared'

export interface TextRevealOptions extends RevealOptions {
  /** `up`: linhas sobem de 50% (E16). `down`: descem de -100%, só na abertura (E01). */
  direction?: 'up' | 'down'
  duration?: number
  stagger?: number
  ease?: string
}

/**
 * Revelação de texto por linhas (E01, E16, E21, E23): cada linha desliza e aparece,
 * sem máscara de overflow. As linhas são refeitas se a largura ou a fonte mudar.
 */
export function textReveal(el: HTMLElement, opts: TextRevealOptions = {}): Timeline {
  if (opts.reduced) return finalState()

  const {
    direction = 'up',
    duration = direction === 'down' ? durations.titleLine : durations.line,
    stagger = direction === 'down' ? staggers.titleLines : staggers.lines,
    ease = eases.text,
  } = opts
  const yPercent = direction === 'down' ? distance.titleDropPercent : distance.linePercent
  const tl = revealTimeline(el, opts)

  SplitText.create(el, {
    type: 'lines',
    linesClass: 'split-line',
    // Só linhas: as palavras ficam inteiras e o leitor de tela lê o texto normalmente.
    // (O padrão "auto" põe aria-label no elemento, o que não é permitido em <p>.)
    aria: 'none',
    autoSplit: true,
    onSplit(self) {
      // Ao refazer as linhas, mantém o ponto em que a animação estava.
      const progress = tl.progress()
      tl.clear()
      tl.from(self.lines, { yPercent, opacity: 0, duration, ease, stagger })
      tl.progress(progress)
    },
  })

  return tl
}
