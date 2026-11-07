import type { Timeline } from '@/animations/gsap'
import { autoReveal } from '@/animations/presets'

/** Vídeos com cortina de cor (E15), títulos por linhas (E16) e links subindo (E19). */
export function videoFeaturesReveal(root: HTMLElement, { reduced }: { reduced: boolean }): Timeline[] {
  return autoReveal(root, { reduced, rise: 'thumb' })
}
