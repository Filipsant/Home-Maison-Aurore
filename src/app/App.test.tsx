import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { gsap, ScrollTrigger } from '@/animations/gsap'
import { setReducedMotion } from '@/test/setup'
import { App } from './App'

describe('App', () => {
  it('renderiza as seções na ordem da Sigma', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual([
      'Recém-saídas do ateliê',
      'Peças em destaque',
      'Vestido por',
      'Arquivo Aurore',
      'Filmes do ateliê',
      'Categorias',
      'Venha provar no ateliê',
    ])
    expect(screen.getByRole('heading', { level: 1, name: 'Lumière' })).toBeInTheDocument()
  })

  it('cria os gatilhos de scroll e não deixa nenhum para trás depois do unmount', async () => {
    setReducedMotion(false)
    const { unmount } = render(<App />)
    await waitFor(() => expect(ScrollTrigger.getAll().length).toBeGreaterThan(0))
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    expect(gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())).toHaveLength(0)
  })

  it('com movimento reduzido, não há scroll preso nem parallax', async () => {
    setReducedMotion(true)
    const { unmount } = render(<App />)
    // Só o tema do header (troca de cor, não é movimento) usa ScrollTrigger.
    await waitFor(() => expect(ScrollTrigger.getAll().length).toBeGreaterThan(0))
    expect(ScrollTrigger.getAll().every((st) => !st.pin)).toBe(true)
    expect(document.querySelector('.pin-spacer')).toBeNull()
    unmount()
  })
})
