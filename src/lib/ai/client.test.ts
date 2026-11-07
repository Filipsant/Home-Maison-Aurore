import { afterEach, describe, expect, it, vi } from 'vitest'
import { tryOnLoadingMessage } from '@/data/aiMessages'
import { apiUrl, generatePiece, tryOn } from './client'

const piece = {
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

  it('resposta que não é JSON (Worker parado) também vira exemplo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<html>', { status: 502 }))),
    )
    const result = await tryOn({ person: new Blob(['x']), garment: new Blob(['y']) })
    expect(result).toMatchObject({ status: 'fallback', imageUrl: '/exemplos/provador.jpg' })
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

  it('o provador envia a peça gerada pelo id, sem reenviar a foto', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      const body = init?.body as FormData
      expect(body.get('pecaId')).toBe('a'.repeat(64))
      expect(body.get('peca')).toBeNull()
      return Promise.resolve(
        Response.json({ status: 'ok', id: 'b', imageUrl: '/api/imagens/b', cached: false }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    await tryOn({ person: new Blob(['x']), pieceId: 'a'.repeat(64) })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('apiUrl só prefixa os caminhos da API', () => {
    expect(apiUrl('/api/imagens/abc')).toBe('/api/imagens/abc')
    expect(apiUrl('/exemplos/peca.jpg')).toBe('/exemplos/peca.jpg')
  })
})

describe('mensagens de espera do provador', () => {
  it('avisam sobre a fila conforme o tempo passa', () => {
    expect(tryOnLoadingMessage(0)).toContain('Enviando')
    expect(tryOnLoadingMessage(10)).toContain('2 minutos')
    expect(tryOnLoadingMessage(60)).toContain('Ajustando')
  })
})
