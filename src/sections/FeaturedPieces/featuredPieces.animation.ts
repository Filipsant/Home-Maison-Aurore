import type { Timeline } from '@/animations/gsap'
import { autoReveal } from '@/animations/presets'

/** Título por linhas (E16) e linhas da lista subindo 50px, cada uma ao entrar na tela (E18). */
export function featuredPiecesReveal(root: HTMLElement, { reduced }: { reduced: boolean }): Timeline[] {
  return autoReveal(root, { reduced, rise: 'list' })
}
