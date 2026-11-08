import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPiece, listOrders, sendOrder } from '@/lib/api/orders'
import { apiUrl, generatePiece } from './client'

const piece = {
  linha: 'feminina',
  peca: 'vestido',
  tecido: 'organza',
  cor: 'marfim',
  silhueta: 'sereia',
  detalhes: [],
  colecao: 'lumiere',
}

afterEach(() => vi.unstubAllGlobals())

describe('cliente da API de IA', () => {
  it('devolve o resultado do Worker', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        Response.json({ status: 'ok', id: 'abc', imageUrl: '/api/imagens/abc', cached: false }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await generatePiece(piece)).toEqual({
      status: 'ok',
      id: 'abc',
      imageUrl: '/api/imagens/abc',
      cached: false,
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/pecas/imagem', expect.objectContaining({ method: 'POST' }))
  })

  it('rede fora do ar vira imagem de exemplo, sem lançar erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    expect(await generatePiece(piece)).toEqual({
      status: 'fallback',
      imageUrl: '/exemplos/peca.jpg',
      reason: 'indisponivel',
    })
  })

  it('resposta que não é JSON (Worker parado) também vira exemplo, da mesma linha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<html>', { status: 502 }))),
    )
    const result = await generatePiece({ ...piece, linha: 'masculina', peca: 'terno' })
    expect(result).toMatchObject({ status: 'fallback', imageUrl: '/exemplos/peca-masculina.jpg' })
  })

  it('cancelamento continua sendo cancelamento (não vira exemplo)', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        controller.abort()
        return Promise.reject(new DOMException('aborted', 'AbortError'))
      }),
    )
    await expect(generatePiece(piece, controller.signal)).rejects.toThrow('aborted')
  })

  it('apiUrl só prefixa os caminhos da API', () => {
    expect(apiUrl('/api/imagens/abc')).toBe('/api/imagens/abc')
    expect(apiUrl('/exemplos/peca.jpg')).toBe('/exemplos/peca.jpg')
  })
})

describe('cliente de peças e pedidos', () => {
  it('peça inexistente vira "nao-encontrada"; rede fora do ar vira "erro"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ erro: 'x' }, { status: 404 }))),
    )
    expect(await fetchPiece('a'.repeat(64))).toEqual({ status: 'nao-encontrada' })
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    expect(await fetchPiece('a'.repeat(64))).toEqual({ status: 'erro' })
  })

  it('pedido sem rede vira "indisponivel", sem lançar erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    expect(
      await sendOrder({
        pecaId: 'a'.repeat(64),
        medidas: {},
        nome: 'Ana',
        email: 'a@b.co',
        telefone: '',
        observacoes: '',
        consentimento: true,
      }),
    ).toEqual({ status: 'erro', motivo: 'indisponivel' })
  })

  it('painel: manda a senha no cabeçalho e traduz os erros', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        new Headers(init?.headers).get('Authorization') === 'Bearer certa'
          ? Response.json({ pedidos: [] })
          : Response.json({ erro: 'x' }, { status: 401 }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await listOrders('certa')).toEqual({ status: 'ok', pedidos: [] })
    expect(await listOrders('errada')).toEqual({ status: 'senha' })
  })
})
