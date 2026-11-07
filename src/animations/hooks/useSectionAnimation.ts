import type { RefObject } from 'react'
import { gsap, useGSAP } from '../gsap'
import { media } from '../tokens'
import { useMotion } from './useMotion'

export interface MotionConditions {
  /** O sistema pede movimento reduzido: presets devolvem o estado final, sem scrub nem parallax. */
  reduced: boolean
  /** Tela a partir de 760px. */
  desktop: boolean
}

export type SectionAnimationSetup = (root: HTMLElement, conditions: MotionConditions) => void | (() => void)

/**
 * Liga as animações de uma seção (regra 4 do PROMPT): `useGSAP` com `scope` no
 * elemento da seção, então tudo o que for criado é desfeito no unmount.
 * Usa `gsap.matchMedia()`: se o movimento reduzido for ligado ou a tela cruzar 760px,
 * a animação é desfeita e montada de novo com as novas condições.
 */
export function useSectionAnimation(
  scope: RefObject<HTMLElement | null>,
  setup: SectionAnimationSetup,
  dependencies: unknown[] = [],
) {
  const { ready } = useMotion()

  useGSAP(
    () => {
      const root = scope.current
      if (!ready || !root) return
      const mm = gsap.matchMedia()
      mm.add(
        // `motion` + `reduced` garantem que sempre uma condição vale (o matchMedia exige ao menos uma).
        { reduced: media.reduced, motion: media.motion, desktop: media.desktop },
        (context) => {
          const c = context.conditions ?? {}
          return setup(root, { reduced: Boolean(c.reduced), desktop: Boolean(c.desktop) })
        },
        root,
      )
      return () => mm.revert()
    },
    { scope, dependencies: [ready, ...dependencies] },
  )
}
