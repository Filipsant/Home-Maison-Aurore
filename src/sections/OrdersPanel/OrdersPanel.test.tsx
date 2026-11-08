import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Order } from '@/types/order'
import { OrdersPanel } from './OrdersPanel'

const order: Order = {
  id: '9999999999999-ABCDEF',
  codigo: 'AUR-ABCDEF',
  criadoEm: '2026-11-07T20:30:00.000Z',
  pecaId: 'e'.repeat(64),
  peca: {
    linha: 'feminina',
    peca: 'vestido',
    tecido: 'organza',
    cor: 'marfim',
    silhueta: 'sereia',
    detalhes: ['bordado'],
    colecao: 'lumiere',
  },
  medidas: { altura: 168, busto: 88, cintura: 68, quadril: 96, ombros: 38, braco: 58.5 },
  nome: 'Ana Souza',
  email: 'ana@email.com',
  telefone: '+55 11 99999-0000',
  observacoes: 'Casamento em março.',
}

function mockPanel() {
  const deleted: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (new Headers(init?.headers).get('Authorization') !== 'Bearer certa')
        return Promise.resolve(Response.json({ erro: 'x' }, { status: 401 }))
      if (init?.method === 'DELETE') {
        deleted.push(url)
        return Promise.resolve(new Response(null, { status: 204 }))
      }
      return Promise.resolve(Response.json({ pedidos: [order] }))
    }),
  )
  return deleted
}

afterEach(() => vi.unstubAllGlobals())

describe('Painel de pedidos do ateliê', () => {
  it('senha errada: avisa e não mostra pedidos', async () => {
    mockPanel()
    const user = userEvent.setup()
    render(<OrdersPanel />)
    await user.type(screen.getByLabelText('Senha do ateliê'), 'chute')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Senha incorreta.')).toBeInTheDocument()
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
  })

  it('senha certa: mostra o pedido com peça, medidas e contato; apagar pede confirmação', async () => {
    const deleted = mockPanel()
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )
    const user = userEvent.setup()
    render(<OrdersPanel />)
    await user.type(screen.getByLabelText('Senha do ateliê'), 'certa')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    const item = (await screen.findByRole('heading', { name: 'AUR-ABCDEF' })).closest('li')
    if (!item) throw new Error('esperava o pedido na lista')
    const card = within(item)
    expect(card.getByText('Ana Souza')).toBeInTheDocument()
    expect(card.getByRole('link', { name: 'ana@email.com' })).toHaveAttribute('href', 'mailto:ana@email.com')
    expect(card.getByText('Vestido')).toBeInTheDocument()
    expect(card.getByText('58.5')).toBeInTheDocument()
    expect(card.getByRole('img')).toHaveAttribute('src', `/api/imagens/${'e'.repeat(64)}`)

    await user.click(card.getByRole('button', { name: 'Apagar pedido' }))
    expect(deleted).toEqual([`/api/pedidos/${order.id}`])
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
    expect(screen.getByText('Nenhum pedido ainda.')).toBeInTheDocument()
  })
})
