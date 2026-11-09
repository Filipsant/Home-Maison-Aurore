import type { Timeline } from '@/animations/gsap'
import { autoReveal, parallax, riseIn } from '@/animations/presets'
import { scrub, trigger } from '@/animations/tokens'

/**
 * Rodapé (decisão 4 do estudo):
 * - título por linhas e divisória curta (E26), disparando mais cedo (90% da tela);
 * - colunas subindo 20px em cascata de 0,08s (E27);
 * - assinatura "Aurore" deslizando na horizontal com o scroll (E29).
 */
export function footerReveal(root: HTMLElement, { reduced }: { reduced: boolean }): Timeline[] {
  const start = trigger.footerStart
  const timelines = autoReveal(root, { reduced, start, line: 'short' })
  const columns = root.querySelectorAll('[data-footer-column]')
  timelines.push(riseIn(columns, { reduced, start, variant: 'footer' }))

  const signature = root.querySelector<HTMLElement>('[data-signature]')
  if (signature) {
    timelines.push(
      parallax(signature, {
        reduced,
        trigger: root,
        axis: 'x',
        from: scrub.signatureDriftPercent,
        to: 0,
        start: 'top bottom',
        end: 'bottom bottom',
      }),
    )
  }
  return timelines
}
