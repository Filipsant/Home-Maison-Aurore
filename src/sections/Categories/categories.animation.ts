import type { Timeline } from '@/animations/gsap'
import { autoReveal } from '@/animations/presets'

/**
 * Título por linhas (E16) e cards subindo 50px (E18). O hover em folioscópio (E35)
 * é estado de React (`useFlipbook`), não timeline.
 */
export function categoriesReveal(root: HTMLElement, { reduced }: { reduced: boolean }): Timeline[] {
  return autoReveal(root, { reduced, rise: 'list' })
}
