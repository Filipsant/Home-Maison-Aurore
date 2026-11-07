import { intro, media } from './tokens'

/**
 * Esconde o título e a mídia do hero até a abertura começar, para não piscarem
 * no estado final antes da animação. Chamado uma vez, antes do primeiro render.
 * Com movimento reduzido nada é escondido.
 */
export function holdIntro() {
  if (typeof window.matchMedia === 'function' && window.matchMedia(media.reduced).matches) return
  document.documentElement.classList.add(intro.pendingClass)
}

/** Libera o conteúdo da abertura (a timeline já aplicou os estados iniciais). */
export function releaseIntro() {
  document.documentElement.classList.remove(intro.pendingClass)
}
