import type { Timeline } from '@/animations/gsap'
import { autoReveal } from '@/animations/presets'

/**
 * Título por linhas (E16), fotos com cortina de cor (E15) e legendas subindo (E19).
 * Cada card dispara ao entrar na tela; o segundo, mais baixo, entra depois.
 */
export function newArrivalsReveal(root: HTMLElement, { reduced }: { reduced: boolean }): Timeline[] {
  return autoReveal(root, { reduced, rise: 'thumb' })
}
