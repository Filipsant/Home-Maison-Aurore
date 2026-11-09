import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ResizeModule from '@/lib/ai/resizeImage'
import { setReducedMotion } from '@/test/setup'
import { FittingStudio } from './FittingStudio'

// O jsdom não decodifica imagens: a redução da foto devolve o próprio arquivo.
vi.mock('@/lib/ai/resizeImage', async (original) => ({
  ...(await original<typeof ResizeModule>()),
  resizeImage: (file: Blob) => Promise.resolve(file),
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

interface Call {
  url: string
  form?: FormData
  json?: unknown
}

/** API falsa: peça, provas (cada uma com um id novo) e pedido. */
function mockApi({ prova }: { prova?: (form: FormData) => object } = {}) {
  const calls: Call[] = []
  let n = 0
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      const call: Call = { url }
      if (init?.body instanceof FormData) call.form = init.body
      else if (typeof init?.body === 'string') call.json = JSON.parse(init.body)
      calls.push(call)
      if (url === `/api/pecas/${ID}`)
        return Promise.resolve(Response.json({ id: ID, imageUrl: `/api/imagens/${ID}`, peca: smoking }))
      if (url === '/api/provas') {
        n++
        const id = String(n).repeat(64).slice(0, 64)
        const body = prova?.(call.form ?? new FormData()) ?? {
          status: 'ok',
          id,
          imageUrl: `/api/imagens/${id}`,
          cached: false,
        }
        return Promise.resolve(Response.json(body))
      }
      if (url === '/api/pedidos')
        return Promise.resolve(Response.json({ status: 'ok', codigo: 'AUR-7K3F9Q' }))
      return Promise.resolve(Response.json({}, { status: 404 }))
    }),
  )
  return calls
}

const photo = (name: string) => new File(['foto'], name, { type: 'image/jpeg' })
const provaCalls = (calls: Call[]) => calls.filter((c) => c.url === '/api/provas')

beforeAll(() => {
  // Prévia das fotos (o jsdom não cria URLs de arquivos).
  URL.createObjectURL = vi.fn(() => 'blob:previa')
  URL.revokeObjectURL = vi.fn()
})
beforeEach(() => setReducedMotion(true))
afterEach(() => {
  vi.unstubAllGlobals()
  window.history.pushState({}, '', '/')
})

async function openWithPiece() {
  window.history.pushState({}, '', `/provador?peca=${ID}`)
  const calls = mockApi()
  const user = userEvent.setup()
  render(<FittingStudio />)
  await screen.findByText('Smoking')
  return { calls, user }
}

describe('Provador virtual', () => {
  it('sem peça no endereço, convida a criar uma peça primeiro', () => {
    window.history.pushState({}, '', '/provador')
    render(<FittingStudio />)
    expect(screen.getByRole('heading', { name: 'Primeiro, crie a sua peça' })).toBeInTheDocument()
  })

  it('mostra a peça com o link para ajustá-la no ateliê digital e pede as medidas da linha', async () => {
    await openWithPiece()
    expect(screen.getByRole('link', { name: 'Ajustar a peça' })).toHaveAttribute(
      'href',
      `/atelie-digital?peca=${ID}`,
    )
    expect(screen.getByLabelText('Tórax')).toBeInTheDocument()
    expect(screen.queryByLabelText('Busto')).not.toBeInTheDocument()
  })

  it('sem foto de frente ou sem confirmar as fotos: avisa, leva o foco e não chama a IA', async () => {
    const { calls, user } = await openWithPiece()
    await user.click(screen.getByRole('button', { name: 'Gerar prova' }))
    expect(screen.getByText('Escolha a foto de frente.')).toBeInTheDocument()
    expect(screen.getByText(/Confirme que as fotos são suas/)).toBeInTheDocument()
    expect(document.getElementById('foto-frente')).toHaveFocus()
    expect(provaCalls(calls)).toHaveLength(0)
  })

  it('gera uma prova por foto enviada, com as medidas válidas, e mostra cada vista numa aba', async () => {
    const { calls, user } = await openWithPiece()
    await user.upload(document.getElementById('foto-frente') as HTMLInputElement, photo('frente.jpg'))
    await user.upload(document.getElementById('foto-costas') as HTMLInputElement, photo('costas.jpg'))
    await user.type(screen.getByLabelText('Cintura'), '86,5')
    await user.click(screen.getByRole('checkbox', { name: /As fotos são minhas/ }))
    await user.click(screen.getByRole('button', { name: 'Gerar prova' }))

    expect(await screen.findByRole('img', { name: /vista de frente/ })).toBeInTheDocument()
    const sent = provaCalls(calls).map((c) => c.form)
    expect(sent.map((f) => f?.get('vista')).sort()).toEqual(['costas', 'frente'])
    expect(sent[0]?.get('pecaId')).toBe(ID)
    expect(JSON.parse(sent[0]?.get('medidas') as string)).toEqual({ cintura: 86.5 })
    expect(sent[0]?.get('foto')).toBeInstanceOf(File)

    await user.click(screen.getByRole('tab', { name: 'Costas' }))
    expect(screen.getByRole('img', { name: /vista de costas/ })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Lado' })).not.toBeInTheDocument()
  })

  it('correção: manda a prova anterior e o texto, cria a versão 2 e permite voltar à anterior', async () => {
    const { calls, user } = await openWithPiece()
    await user.upload(document.getElementById('foto-frente') as HTMLInputElement, photo('frente.jpg'))
    await user.click(screen.getByRole('checkbox', { name: /As fotos são minhas/ }))
    await user.click(screen.getByRole('button', { name: 'Gerar prova' }))
    await screen.findByText('Versão 1 de 1')
    const firstId = '1'.repeat(64)

    await user.click(screen.getByRole('button', { name: 'Aplicar correção' }))
    expect(screen.getByText('Escreva o que precisa mudar.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('O que precisa mudar?'), 'lapela mais larga')
    await user.click(screen.getByRole('button', { name: 'Aplicar correção' }))
    expect(await screen.findByText('Versão 2 de 2')).toBeInTheDocument()
    expect(screen.getByText('Correção: lapela mais larga')).toBeInTheDocument()
    const correction = provaCalls(calls).at(-1)?.form
    expect(correction?.get('baseId')).toBe(firstId)
    expect(correction?.get('correcao')).toBe('lapela mais larga')
    expect(correction?.get('foto')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Voltar à versão anterior' }))
    expect(screen.getByText('Versão 1 de 2')).toBeInTheDocument()
  })

  it('correção recusada pelo filtro: explica o motivo e mantém a prova', async () => {
    window.history.pushState({}, '', `/provador?peca=${ID}`)
    mockApi({
      prova: (form) =>
        form.get('correcao')
          ? { status: 'erro', motivo: 'correcao' }
          : { status: 'ok', id: 'a'.repeat(64), imageUrl: `/api/imagens/${'a'.repeat(64)}`, cached: false },
    })
    const user = userEvent.setup()
    render(<FittingStudio />)
    await screen.findByText('Smoking')
    await user.upload(document.getElementById('foto-frente') as HTMLInputElement, photo('frente.jpg'))
    await user.click(screen.getByRole('checkbox', { name: /As fotos são minhas/ }))
    await user.click(screen.getByRole('button', { name: 'Gerar prova' }))
    await screen.findByText('Versão 1 de 1')
    await user.type(screen.getByLabelText('O que precisa mudar?'), 'troque o rosto')
    await user.click(screen.getByRole('button', { name: 'Aplicar correção' }))
    expect(await screen.findByText(/Não podemos aplicar essa correção/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /vista de frente/ })).toBeInTheDocument()
  })

  it('o pedido leva as medidas e a versão atual de cada prova', async () => {
    const { calls, user } = await openWithPiece()
    await user.upload(document.getElementById('foto-frente') as HTMLInputElement, photo('frente.jpg'))
    await user.click(screen.getByRole('checkbox', { name: /As fotos são minhas/ }))
    await user.click(screen.getByRole('button', { name: 'Gerar prova' }))
    await screen.findByText('Versão 1 de 1')

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
    const form = screen.getByRole('heading', { name: 'Enviar ao ateliê' }).closest('form')
    if (!form) throw new Error('esperava o formulário do pedido')
    await user.type(within(form).getByLabelText('Nome'), 'Bruno Lima')
    await user.type(within(form).getByLabelText('E-mail'), 'bruno@email.com')
    await user.click(within(form).getByRole('checkbox', { name: /Autorizo/ }))
    await user.click(within(form).getByRole('button', { name: 'Enviar ao ateliê' }))

    expect(await screen.findByRole('heading', { name: 'Pedido recebido' })).toHaveFocus()
    await waitFor(() =>
      expect(calls.find((c) => c.url === '/api/pedidos')?.json).toMatchObject({
        pecaId: ID,
        provas: ['1'.repeat(64)],
        medidas: { altura: 178, torax: 98 },
        nome: 'Bruno Lima',
      }),
    )
  })
})
