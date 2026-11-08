import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiResult } from '../src/types/ai'
import worker from './index'
import { resetMemoryLimits } from './lib/rateLimit'
import { fakeEnv, postJson, validPiece } from './test/fakeEnv'

// Nos testes não há metadados `cf` do Cloudflare: o pedido comum basta.
const call = (request: Request, env: Env) => worker.fetch(request as Parameters<typeof worker.fetch>[0], env)
const json = (response: Response) => response.json<AiResult>()

beforeEach(() => resetMemoryLimits())
afterEach(() => vi.restoreAllMocks())

describe('POST /api/pecas/imagem', () => {
  it('gera, guarda no cache e na segunda vez responde do cache sem chamar a IA', async () => {
    const { env, ai, kv } = fakeEnv()
    const first = await json(await call(postJson('/api/pecas/imagem', validPiece), env))
    expect(first).toMatchObject({ status: 'ok', cached: false })
    expect(ai.run).toHaveBeenCalledOnce()
    expect(ai.run.mock.calls[0]).toMatchObject(['@cf/black-forest-labs/flux-1-schnell', { steps: 4 }])
    // A foto e as escolhas (para o provador 3D).
    expect([...kv.store.keys()].map((k) => k.split(':')[0]).sort()).toEqual(['img', 'peca'])

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
      imageUrl: '/exemplos/peca.jpg',
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

  it('linha masculina: quando a IA falha, o exemplo também é masculino', async () => {
    const { env, ai } = fakeEnv()
    ai.run.mockRejectedValueOnce(new Error('fora do ar'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const male = {
      linha: 'masculina',
      peca: 'terno',
      tecido: 'la-fria',
      cor: 'azul-noite',
      silhueta: 'reta',
      detalhes: [],
      colecao: 'lumiere',
    }
    expect(await json(await call(postJson('/api/pecas/imagem', male), env))).toMatchObject({
      status: 'fallback',
      imageUrl: '/exemplos/peca-masculina.jpg',
      reason: 'indisponivel',
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

  it('nenhuma resposta expõe segredos', async () => {
    const { env } = fakeEnv({ ATELIE_SENHA: 'senha_de_teste', CLOUDFLARE_API_TOKEN: 'token_de_teste' })
    const body = await (await call(new Request('http://localhost:5173/api/saude'), env)).text()
    expect(body).not.toContain('senha_de_teste')
    expect(body).not.toContain('token_de_teste')
  })

  it('a antiga rota do provador por foto não existe mais', async () => {
    const { env } = fakeEnv()
    const response = await call(new Request('http://localhost:5173/api/provador', { method: 'POST' }), env)
    expect(response.status).toBe(404)
  })
})
