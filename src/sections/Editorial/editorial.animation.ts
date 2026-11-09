import { gsap, type Timeline } from '@/animations/gsap'
import { autoReveal, cascade, imageReveal } from '@/animations/presets'
import { delay, stagger, trigger } from '@/animations/tokens'

/**
 * Título por linhas e as três histórias em cascata (E24); as fotos abrem com cortina
 * de cor 0,5s depois, uma a cada 0,1s (E25).
 */
export function editorialReveal(root: HTMLElement, { reduced }: { reduced: boolean }): Timeline[] {
  const timelines = autoReveal(root, { reduced, exclude: '[data-cascade]' })
  const list = root.querySelector<HTMLElement>('[data-cascade]')
  if (reduced || !list) return timelines

  const items = list.querySelectorAll('[data-cascade-item]')
  const photos = list.querySelectorAll<HTMLElement>('[data-reveal="photo"]')
  const tl = gsap.timeline({ scrollTrigger: { trigger: list, start: trigger.start, once: true } })
  tl.add(cascade(items, { trigger: false }), 0)
  photos.forEach((photo, i) => {
    tl.add(imageReveal(photo, { trigger: false }), delay.sectionBody + i * stagger.media)
  })
  return [...timelines, tl]
}
