import { describe, expect, it } from 'vitest'
import { cascade } from './cascade'
import { imageReveal } from './imageReveal'
import { lineDraw } from './lineDraw'
import { parallax } from './parallax'
import { riseIn } from './riseIn'
import { textReveal } from './textReveal'

function photo() {
  const figure = document.createElement('figure')
  figure.innerHTML = '<span data-curtain></span><div data-media></div>'
  document.body.append(figure)
  return figure
}

describe('presets com movimento reduzido', () => {
  it('devolvem uma timeline sem nada para animar e não tocam nos elementos', () => {
    const p = document.createElement('p')
    p.textContent = 'Organzas de seda sobrepostas'
    document.body.append(p)
    const fig = photo()

    const timelines = [
      textReveal(p, { reduced: true }),
      imageReveal(fig, { reduced: true }),
      lineDraw(p, { reduced: true }),
      riseIn(p, { reduced: true }),
      cascade([p], { reduced: true }),
      parallax(p, { from: 10, to: -10, reduced: true }),
    ]

    // Duração zero e inativa: o elemento fica como o CSS o desenha (estado final).
    for (const tl of timelines) {
      expect(tl.duration()).toBe(0)
      expect(tl.isActive()).toBe(false)
    }
    expect(p.querySelector('.split-line')).toBeNull()
    expect(p.getAttribute('style')).toBeNull()
    expect(fig.querySelector('[data-curtain]')?.getAttribute('style')).toBeNull()
  })
})

describe('presets com movimento', () => {
  it('imageReveal fecha a cortina e a mídia antes de abrir (de cima para baixo)', () => {
    const fig = photo()
    const tl = imageReveal(fig, { trigger: false })
    const curtain = fig.querySelector<HTMLElement>('[data-curtain]')
    expect(curtain?.style.clipPath).toContain('100%')
    tl.progress(1)
    expect(curtain?.style.clipPath).not.toContain('100%')
    tl.kill()
  })

  it('riseIn com lista vazia não quebra', () => {
    expect(() => riseIn([], {}).kill()).not.toThrow()
  })
})
