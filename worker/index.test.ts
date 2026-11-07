import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiResult } from '../src/types/ai'
import worker from './index'
import { resetMemoryLimits } from './lib/rateLimit'
import { fakeEnv, postJson, validPiece } from './test/fakeEnv'

vi.mock('./ai/tryOn', () => ({ runTryOn: vi.fn() }))
const { runTryOn } = await import('./ai/tryOn')

// Nos testes não há metadados `cf` do Cloudflare: o pedido comum basta.
const call = (request: Request, env: Env) => worker.fetch(request as Parameters<typeof worker.fetch>[0], env)
const json = (response: Response) => response.json<AiResult>()

beforeEach(() => {
  resetMemoryLimits()
  vi.mocked(runTryOn).mockReset()
})
afterEach(() => vi.restoreAllMocks())

describe('POST /api/pecas/imagem', () => {
  it('gera, guarda no cache e na segunda vez responde do cache sem chamar a IA', async () => {
    const { env, ai, kv } = fakeEnv()
    const first = await json(await call(postJson('/api/pecas/imagem', validPiece), env))
    expect(first).toMatchObject({ status: 'ok', cached: false })
    expect(ai.run).toHaveBeenCalledOnce()
    expect(ai.run.mock.calls[0]).toMatchObject(['@cf/black-forest-labs/flux-1-schnell', { steps: 4 }])
    expect(kv.store.size).toBe(1)

    // Mesmos campos em outra ordem: mesmo resultado, vindo do cache.
    const again = await json(
      await call(postJson('/api/pecas/imagem', { ...validPiece, detalhes: ['bordado', 'perolas'] }), env),
    )
    expect(again).toMatchObject({ status: 'ok', cached: true })
    expect(again.status === 'ok' && first.status === 'ok' && again.id === first.id).toBe(true)
    expect(ai.run).toHaveBeenCalledOnce()
  })

  it('outra variante gera outra imagem', async () => {
    const { env, ai } = fakeEnv()
    await call(postJson('/api/pecas/imagem', validPiece), env)
    await call(postJson('/api/pecas/imagem', { ...validPiece, variante: 1 }), env)
    expect(ai.run).toHaveBeenCalledTimes(2)
  })

  it('campos inválidos: 400 com a imagem de exemplo e motivo "invalido"', async () => {
    const { env, ai } = fakeEnv()
    const response = await call(postJson('/api/pecas/imagem', { ...validPiece, cor: 'neon' }), env)
    expect(response.status).toBe(400)
    expect(await json(response)).toMatchObject({
      status: 'fallback',
      reason: 'invalido',
      imageUrl: '/exemplos/peca.svg',
    })
    expect(ai.run).not.toHaveBeenCalled()
  })

  it('demora demais: imagem de exemplo com motivo "tempo"', async () => {
    const { env, ai } = fakeEnv({ IMAGE_TIMEOUT_MS: '20' })
    ai.run.mockReturnValueOnce(new Promise(() => undefined) as never)
    expect(await json(await call(postJson('/api/pecas/imagem', validPiece), env))).toMatchObject({
      status: 'fallback',
      reason: 'tempo',
    })
  })

  it('cota diária esgotada: motivo "cota"', async () => {
    const { env, ai } = fakeEnv()
    ai.run.mockRejectedValueOnce(
      new Error('4006: you have used up your daily free allocation of 10,000 neurons'),
    )
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(await json(await call(postJson('/api/pecas/imagem', validPiece), env))).toMatchObject({
      reason: 'cota',
    })
  })

  it('rate limit: a 6ª geração no mesmo minuto cai no exemplo, com Retry-After', async () => {
    const { env } = fakeEnv()
    for (let v = 0; v < 5; v++) {
      const r = await json(await call(postJson('/api/pecas/imagem', { ...validPiece, variante: v }), env))
      expect(r.status).toBe('ok')
    }
    const response = await call(postJson('/api/pecas/imagem', { ...validPiece, variante: 5 }), env)
    expect(response.headers.get('Retry-After')).toBeTruthy()
    expect(await json(response)).toMatchObject({ status: 'fallback', reason: 'limite' })
  })

  it('o cache não conta no limite', async () => {
    const { env } = fakeEnv()
    for (let i = 0; i < 8; i++) {
      expect((await json(await call(postJson('/api/pecas/imagem', validPiece), env))).status).toBe('ok')
    }
  })
})

describe('GET /api/imagens/:hash', () => {
  it('serve a imagem do cache com cache longo no navegador', async () => {
    const { env } = fakeEnv()
    const result = await json(await call(postJson('/api/pecas/imagem', validPiece), env))
    if (result.status !== 'ok') throw new Error('esperava ok')
    const response = await call(new Request(`http://localhost:5173${result.imageUrl}`), env)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
    expect(response.headers.get('Cache-Control')).toContain('immutable')
    expect(new Uint8Array(await response.arrayBuffer())[0]).toBe(0xff)
  })

  it('404 para hash inexistente', async () => {
    const { env } = fakeEnv()
    const response = await call(new Request(`http://localhost:5173/api/imagens/${'0'.repeat(64)}`), env)
    expect(response.status).toBe(404)
  })
})

describe('POST /api/provador', () => {
  const image = (name: string) =>
    new File([new Uint8Array([0xff, 0xd8, name.length])], name, { type: 'image/jpeg' })
  const form = (fields: Record<string, string | File>) => {
    const data = new FormData()
    for (const [k, v] of Object.entries(fields)) data.append(k, v)
    return new Request('http://localhost:5173/api/provador', { method: 'POST', body: data })
  }

  it('prova a peça, guarda no cache e não chama o Space de novo para as mesmas fotos', async () => {
    const { env } = fakeEnv()
    vi.mocked(runTryOn).mockResolvedValue({
      bytes: new Uint8Array([0x89, 0x50]).buffer,
      contentType: 'image/png',
      space: 'yisol/IDM-VTON',
    })
    const fields = { pessoa: image('pessoa.jpg'), peca: image('vestido.jpg'), descricao: 'ivory silk gown' }
    expect(await json(await call(form(fields), env))).toMatchObject({ status: 'ok', cached: false })
    expect(await json(await call(form(fields), env))).toMatchObject({ status: 'ok', cached: true })
    expect(runTryOn).toHaveBeenCalledOnce()
    expect(vi.mocked(runTryOn).mock.calls[0]?.[0]).toEqual(['yisol/IDM-VTON', 'Nymbo/Virtual-Try-On'])
  })

  it('aceita uma peça gerada antes (pecaId) no lugar da foto da peça', async () => {
    const { env } = fakeEnv()
    vi.mocked(runTryOn).mockResolvedValue({
      bytes: new Uint8Array([1]).buffer,
      contentType: 'image/png',
      space: 'x',
    })
    const piece = await json(await call(postJson('/api/pecas/imagem', validPiece), env))
    if (piece.status !== 'ok') throw new Error('esperava ok')
    expect(await json(await call(form({ pessoa: image('p.jpg'), pecaId: piece.id }), env))).toMatchObject({
      status: 'ok',
    })
  })

  it('sem foto válida: 400 com motivo "invalido"', async () => {
    const { env } = fakeEnv()
    const notImage = new File(['texto'], 'nota.txt', { type: 'text/plain' })
    const response = await call(form({ pessoa: notImage, peca: image('v.jpg') }), env)
    expect(response.status).toBe(400)
    expect(await json(response)).toMatchObject({ reason: 'invalido', imageUrl: '/exemplos/provador.svg' })
  })

  it('Space fora do ar: imagem de exemplo com motivo "indisponivel"', async () => {
    const { env } = fakeEnv()
    vi.mocked(runTryOn).mockRejectedValue(new Error('Space pausado'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(await json(await call(form({ pessoa: image('p.jpg'), peca: image('v.jpg') }), env))).toMatchObject(
      {
        status: 'fallback',
        reason: 'indisponivel',
      },
    )
  })
})

describe('segurança e rotas', () => {
  it('recusa chamadas de outra origem', async () => {
    const { env } = fakeEnv()
    const response = await call(
      postJson('/api/pecas/imagem', validPiece, { Origin: 'https://site-estranho.com' }),
      env,
    )
    expect(response.status).toBe(403)
  })

  it('responde ao preflight CORS de uma origem permitida', async () => {
    const { env } = fakeEnv({ ALLOWED_ORIGINS: 'https://outro.dev' })
    const response = await call(
      new Request('http://localhost:5173/api/pecas/imagem', {
        method: 'OPTIONS',
        headers: { Origin: 'https://outro.dev' },
      }),
      env,
    )
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://outro.dev')
  })

  it('nenhuma resposta expõe tokens', async () => {
    const { env } = fakeEnv({ HF_TOKEN: 'hf_segredo_de_teste' })
    const body = await (await call(new Request('http://localhost:5173/api/saude'), env)).text()
    expect(body).not.toContain('hf_segredo_de_teste')
  })
})
