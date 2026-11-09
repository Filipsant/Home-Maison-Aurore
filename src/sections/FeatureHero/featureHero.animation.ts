import { gsap, type Timeline } from '@/animations/gsap'
import { finalState, imageReveal, textReveal } from '@/animations/presets'
import { delay, duration, ease, scrub } from '@/animations/tokens'

interface HeroOptions {
  reduced: boolean
}

/**
 * Abertura (E01 + E15): o título desce linha por linha; a mídia abre com cortina de cor
 * logo depois; então a peça final cobre a toile até a composição do Figma (55%),
 * com a linha de giz acompanhando a borda (desenho de linha longa, E13).
 * Anima `--reveal-intro` (ver globals.css).
 */
export function heroIntro(root: HTMLElement, { reduced }: HeroOptions): Timeline {
  if (reduced) return finalState()
  const title = root.querySelector<HTMLElement>('[data-hero-title]')
  const media = root.querySelector<HTMLElement>('[data-hero-media]')
  // Pausada: os estados iniciais são aplicados já, mas o relógio só começa no próximo quadro.
  // Assim o tempo gasto montando a página não vira um salto no primeiro quadro da abertura.
  const tl = gsap.timeline({ paused: true })
  gsap.delayedCall(0, () => tl.play())

  if (title) tl.add(textReveal(title, { direction: 'down', trigger: false }), 0)
  if (media) {
    tl.add(imageReveal(media, { trigger: false }), delay.heroMedia)
    tl.fromTo(
      media,
      { '--reveal-intro': scrub.heroRevealStart },
      {
        '--reveal-intro': scrub.heroRevealFigma,
        duration: duration.lineLong,
        ease: ease.mask,
        immediateRender: true,
      },
      delay.heroReveal,
    )
  }
  return tl
}

/**
 * Hero coberto pela seção seguinte (E03, decisão 2 do estudo): a mídia fica presa quando
 * chega ao fim da tela, a peça final termina de cobrir a toile conforme o scroll (E08, linear)
 * e o texto do hero sobe por cima dela. Anima `--reveal-scroll` de 0 a 1.
 */
export function heroPin(root: HTMLElement, { reduced }: HeroOptions): Timeline {
  const media = root.querySelector<HTMLElement>('[data-hero-media]')
  if (reduced || !media) return finalState()
  return gsap
    .timeline({
      scrollTrigger: {
        trigger: media,
        start: 'bottom bottom',
        end: () => `+=${media.offsetHeight}`,
        pin: true,
        pinSpacing: false,
        scrub: true,
        invalidateOnRefresh: true,
      },
    })
    .fromTo(media, { '--reveal-scroll': 0 }, { '--reveal-scroll': 1, ease: ease.scrub })
}
