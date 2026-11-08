import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Body } from '@/lib/mannequin/body'
import { setReducedMotion } from '@/test/setup'
import { FittingStudio } from './FittingStudio'

// O jsdom não tem WebGL: a cena 3D é trocada por uma falsa que só registra as chamadas.
const update = vi.fn<(body: Body) => void>()
vi.mock('@/lib/mannequin/scene', () => ({
  createMannequinScene: () => ({
    update,
    turn: vi.fn(),
    face: vi.fn(),
    setReducedMotion: vi.fn(),
    dispose: vi.fn(),
  }),
}))

const ID = 'd'.repeat(64)
const smoking = {
  linha: 'masculina',
  peca: 'smoking',
  tecido: 'grain-de-poudre',
  cor: 'preto',
  silhueta: 'ajustada',
  detalhes: ['lapela-cetim'],
  colecao: 'nocturne',
}

function mockApi(orderResponse: object = { status: 'ok', codigo: 'AUR-7K3F9Q' }) {
  const calls: { url: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      calls.push({ url, body: typeof init?.body === 'string' ? JSON.parse(init.body) : null })
      if (url === `/api/pecas/${ID}`)
        return Promise.resolve(Response.json({ id: ID, imageUrl: `/api/imagens/${ID}`, peca: smoking }))
      if (url === '/api/pedidos') return Promise.resolve(Response.json(orderResponse))
      return Promise.resolve(Response.json({}, { status: 404 }))
    }),
  )
  return calls
}

beforeEach(() => {
  setReducedMotion(true)
  update.mockClear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  window.history.pushState({}, '', '/')
})

describe('Provador 3D', () => {
  it('sem peça no endereço, convida a criar uma peça primeiro', () => {
    window.history.pushState({}, '', '/provador')
    render(<FittingStudio />)
    expect(screen.getByRole('heading', { name: 'Primeiro, crie a sua peça' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar uma peça' })).toHaveAttribute('href', '/atelie-digital')
  })

  it('peça masculina: mostra a ficha e pede tórax, pescoço e entrepernas (não busto)', async () => {
    window.history.pushState({}, '', `/provador?peca=${ID}`)
    mockApi()
    render(<FittingStudio />)
    expect(await screen.findByText('Smoking')).toBeInTheDocument()
    expect(screen.getByLabelText('Tórax')).toBeInTheDocument()
    expect(screen.getByLabelText('Pescoço')).toBeInTheDocument()
    expect(screen.getByLabelText('Entrepernas')).toBeInTheDocument()
    expect(screen.queryByLabelText('Busto')).not.toBeInTheDocument()
  })

  it('o manequim acompanha as medidas digitadas', async () => {
    window.history.pushState({}, '', `/provador?peca=${ID}`)
    mockApi()
    const user = userEvent.setup()
    render(<FittingStudio />)
    await screen.findByLabelText('Cintura')
    await waitFor(() => expect(update).toHaveBeenCalled())
    const before = update.mock.lastCall?.[0].waist.a ?? 0

    await user.type(screen.getByLabelText('Cintura'), '110')
    await waitFor(() => expect(update.mock.lastCall?.[0].waist.a).toBeGreaterThan(before * 1.2))
  })

  it('sem preencher: mostra os erros, leva o foco ao primeiro campo e não envia', async () => {
    window.history.pushState({}, '', `/provador?peca=${ID}`)
    const calls = mockApi()
    const user = userEvent.setup()
    render(<FittingStudio />)
    await user.click(await screen.findByRole('button', { name: 'Enviar ao ateliê' }))

    expect(screen.getByLabelText('Altura')).toHaveFocus()
    expect(screen.getByLabelText('Altura')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Confira os campos marcados.')).toBeInTheDocument()
    expect(calls.some((c) => c.url === '/api/pedidos')).toBe(false)
  })

  it('com tudo preenchido, envia as medidas em números e mostra o código do pedido', async () => {
    window.history.pushState({}, '', `/provador?peca=${ID}`)
    const calls = mockApi()
    const user = userEvent.setup()
    render(<FittingStudio />)
    await screen.findByLabelText('Altura')

    const values: Record<string, string> = {
      Altura: '180',
      Tórax: '100',
      Cintura: '86,5',
      Quadril: '100',
      Ombros: '47',
      'Comprimento do braço': '65',
      Pescoço: '40',
      Entrepernas: '82',
    }
    for (const [label, value] of Object.entries(values)) await user.type(screen.getByLabelText(label), value)
    await user.type(screen.getByLabelText('Nome'), 'Bruno Lima')
    await user.type(screen.getByLabelText('E-mail'), 'bruno@email.com')
    await user.click(screen.getByRole('checkbox', { name: /Autorizo/ }))
    await user.click(screen.getByRole('button', { name: 'Enviar ao ateliê' }))

    expect(await screen.findByRole('heading', { name: 'Pedido recebido' })).toHaveFocus()
    expect(screen.getByText(/AUR-7K3F9Q/)).toBeInTheDocument()
    const order = calls.find((c) => c.url === '/api/pedidos')?.body
    expect(order).toMatchObject({
      pecaId: ID,
      medidas: { altura: 180, cintura: 86.5, entrepernas: 82 },
      nome: 'Bruno Lima',
      consentimento: true,
      site: '',
    })
  })

  it('limite do Worker: mensagem amigável e o formulário continua preenchido', async () => {
    window.history.pushState({}, '', `/provador?peca=${ID}`)
    mockApi({ status: 'erro', motivo: 'limite' })
    const user = userEvent.setup()
    render(<FittingStudio />)
    await screen.findByLabelText('Altura')
    for (const label of [
      'Altura',
      'Tórax',
      'Cintura',
      'Quadril',
      'Ombros',
      'Comprimento do braço',
      'Pescoço',
      'Entrepernas',
    ]) {
      const field = screen.getByLabelText(label)
      await user.type(field, field.getAttribute('placeholder') ?? '')
    }
    await user.type(screen.getByLabelText('Nome'), 'Bruno')
    await user.type(screen.getByLabelText('E-mail'), 'bruno@email.com')
    await user.click(screen.getByRole('checkbox', { name: /Autorizo/ }))
    await user.click(screen.getByRole('button', { name: 'Enviar ao ateliê' }))

    expect(await screen.findByText(/Muitos envios em pouco tempo/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Bruno')
  })
})
