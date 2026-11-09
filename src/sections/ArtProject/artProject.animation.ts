import { gsap, type Timeline } from '@/animations/gsap'
import { finalState, lineDraw, parallax, riseIn, textReveal } from '@/animations/presets'
import { delay, scrub, trigger } from '@/animations/tokens'

/**
 * Projeto de arte, no ritmo do manifesto do Floema:
 * - imagem de fundo com deslocamento linear ao atravessar a tela (E20);
 * - linha fina de 2s e título por linhas juntos; texto 0,5s depois; botão por último (E13, E16).
 */
export function artProjectReveal(root: HTMLElement, { reduced }: { reduced: boolean }): Timeline[] {
  if (reduced) return [finalState()]

  const half = scrub.decorParallaxPercent / 2
  const background = root.querySelector<HTMLElement>('[data-art-media] [data-parallax]')
  const timelines: Timeline[] = []
  if (background) {
    timelines.push(
      parallax(background, { trigger: root, from: half, to: -half, scale: scrub.decorParallaxScale }),
    )
  }

  const content = root.querySelector<HTMLElement>('[data-art-content]')
  if (!content) return timelines
  const line = content.querySelector<HTMLElement>('[data-line]')
  const title = content.querySelector<HTMLElement>('h2')
  const text = content.querySelector<HTMLElement>('[data-reveal="lines"]')
  const cta = content.querySelector('[data-reveal="rise"]')

  const tl = gsap.timeline({ scrollTrigger: { trigger: content, start: trigger.start, once: true } })
  if (line) tl.add(lineDraw(line, { trigger: false }), 0)
  if (title) tl.add(textReveal(title, { trigger: false }), 0)
  if (text) tl.add(textReveal(text, { trigger: false }), delay.sectionBody)
  if (cta) tl.add(riseIn(cta, { trigger: false, variant: 'thumb' }), delay.sectionBody + delay.thumb)
  timelines.push(tl)
  return timelines
}
