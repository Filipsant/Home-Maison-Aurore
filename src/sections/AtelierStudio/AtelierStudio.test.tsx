import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setReducedMotion } from '@/test/setup'
import { AtelierStudio } from './AtelierStudio'

const okResult = {
  status: 'ok',
  id: 'a'.repeat(64),
  imageUrl: `/api/imagens/${'a'.repeat(64)}`,
  cached: false,
}

afterEach(() => vi.unstubAllGlobals())

describe('Criar peça (ateliê digital)', () => {
  it('envia só ids do catálogo e mostra a imagem com ações para outra versão e para provar', async () => {
    setReducedMotion(true)
    const bodies: unknown[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        bodies.push(typeof init?.body === 'string' ? JSON.parse(init.body) : null)
        return Promise.resolve(Response.json(okResult))
      }),
    )
    const user = userEvent.setup()
    render(<AtelierStudio />)

    await user.click(screen.getByRole('radio', { name: 'Tailleur' }))
    await user.click(screen.getByRole('radio', { name: 'Preto' }))
    await user.click(screen.getByRole('button', { name: 'Criar peça' }))

    expect(await screen.findByRole('img', { name: /Fotografia gerada por IA: Tailleur/ })).toBeInTheDocument()
    expect(bodies[0]).toEqual({
      peca: 'tailleur',
      tecido: 'organza',
      cor: 'preto',
      silhueta: 'sereia',
      detalhes: ['bordado'],
      colecao: 'lumiere',
      variante: 0,
    })
    const tryOnLink = screen.getByRole('link', { name: 'Provar esta peça' })
    expect(tryOnLink.getAttribute('href')).toContain(`/provador?peca=${'a'.repeat(64)}`)

    await user.click(screen.getByRole('button', { name: 'Gerar outra versão' }))
    await waitFor(() => expect(bodies[1]).toMatchObject({ variante: 1 }))
  })

  it('limita os detalhes a 3: os demais ficam desabilitados', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    render(<AtelierStudio />)
    await user.click(screen.getByRole('checkbox', { name: 'Plumas' }))
    await user.click(screen.getByRole('checkbox', { name: 'Pérolas' }))
    expect(screen.getByRole('checkbox', { name: 'Drapeado' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Bordado à mão' })).toBeChecked()
  })

  it('quando a IA falha, mostra a imagem de exemplo e a mensagem amigável', async () => {
    setReducedMotion(true)
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          Response.json({ status: 'fallback', imageUrl: '/exemplos/peca.svg', reason: 'cota' }),
        ),
      ),
    )
    const user = userEvent.setup()
    render(<AtelierStudio />)
    await user.click(screen.getByRole('button', { name: 'Criar peça' }))
    expect(await screen.findByRole('status')).toHaveTextContent('limite do dia')
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })
})
