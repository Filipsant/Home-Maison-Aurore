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
      linha: 'feminina',
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

  it('linha masculina: troca as opções e ajusta as escolhas que não existem nela', async () => {
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

    await user.click(screen.getByRole('radio', { name: 'Masculina' }))

    // Peças e silhuetas femininas somem; as masculinas aparecem.
    expect(screen.queryByRole('radio', { name: 'Vestido' })).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Sereia' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Plumas' })).not.toBeInTheDocument()
    // Escolhas de fora da linha passam para a primeira opção disponível.
    expect(screen.getByRole('radio', { name: 'Smoking' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Ajustada' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Crepe' })).toBeChecked()
    // O que vale nas duas linhas continua escolhido.
    expect(screen.getByRole('radio', { name: 'Marfim' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Bordado à mão' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Terno' }))
    await user.click(screen.getByRole('radio', { name: 'Grain de poudre' }))
    await user.click(screen.getByRole('checkbox', { name: 'Lapela de cetim' }))
    await user.click(screen.getByRole('button', { name: 'Criar peça' }))

    await waitFor(() =>
      expect(bodies[0]).toMatchObject({
        linha: 'masculina',
        peca: 'terno',
        tecido: 'grain-de-poudre',
        silhueta: 'ajustada',
        detalhes: ['bordado', 'lapela-cetim'],
      }),
    )

    // Voltar para a feminina: a peça masculina vira a primeira feminina, o tecido
    // e a silhueta comuns às duas linhas ficam, e o detalhe masculino sai.
    await user.click(screen.getByRole('radio', { name: 'Feminina' }))
    expect(screen.getByRole('radio', { name: 'Vestido' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Grain de poudre' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Ajustada' })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Lapela de cetim' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Bordado à mão' })).toBeChecked()
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
          Response.json({ status: 'fallback', imageUrl: '/exemplos/peca.jpg', reason: 'cota' }),
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
