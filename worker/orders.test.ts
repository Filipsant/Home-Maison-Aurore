import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiResult } from '../src/types/ai'
import type { Order, OrderResult } from '../src/types/order'
import worker from './index'
import { resetMemoryLimits } from './lib/rateLimit'
import { fakeEnv, postJson, validPiece } from './test/fakeEnv'

const call = (request: Request, env: Env) => worker.fetch(request as Parameters<typeof worker.fetch>[0], env)
const SENHA = 'uma frase longa do ateliê'

const medidasFemininas = { altura: 168, busto: 88, cintura: 68, quadril: 96, ombros: 38, braco: '58,5' }
const contato = {
  nome: 'Ana Souza',
  email: 'Ana@Email.com',
  telefone: '+55 11 99999-0000',
  observacoes: 'Casamento em março.',
  consentimento: true,
}

/** Cria uma peça (foto + escolhas no KV) e devolve o id. */
async function createPiece(env: Env, piece: object = validPiece): Promise<string> {
  const result = await (await call(postJson('/api/pecas/imagem', piece), env)).json<AiResult>()
  if (result.status !== 'ok') throw new Error('esperava a peça criada')
  return result.id
}

const order = (body: object, ip = '198.51.100.1') =>
  postJson('/api/pedidos', body, { 'CF-Connecting-IP': ip })

const panel = (method: 'GET' | 'DELETE', path = '/api/pedidos', senha = SENHA) =>
  new Request(`http://localhost:5173${path}`, {
    method,
    headers: { Authorization: `Bearer ${senha}`, 'CF-Connecting-IP': '198.51.100.9' },
  })

beforeEach(() => resetMemoryLimits())
afterEach(() => vi.restoreAllMocks())

describe('GET /api/pecas/:hash (peça para o provador 3D)', () => {
  it('devolve a foto e as escolhas da peça criada', async () => {
    const { env } = fakeEnv()
    const id = await createPiece(env)
    const response = await call(new Request(`http://localhost:5173/api/pecas/${id}`), env)
    expect(await response.json()).toMatchObject({
      id,
      imageUrl: `/api/imagens/${id}`,
      peca: { linha: 'feminina', peca: 'vestido', silhueta: 'sereia' },
    })
  })

  it('404 para peça que não existe', async () => {
    const { env } = fakeEnv()
    const response = await call(new Request(`http://localhost:5173/api/pecas/${'b'.repeat(64)}`), env)
    expect(response.status).toBe(404)
  })
})

describe('POST /api/pedidos', () => {
  it('guarda o pedido com a peça, as medidas e o contato, e devolve o código', async () => {
    const { env, kv } = fakeEnv()
    const pecaId = await createPiece(env)
    const response = await call(order({ pecaId, medidas: medidasFemininas, ...contato }), env)
    const result = await response.json<OrderResult>()
    expect(result).toMatchObject({ status: 'ok' })
    expect(result.status === 'ok' && /^AUR-[A-Z2-9]{6}$/.test(result.codigo)).toBe(true)

    const key = [...kv.store.keys()].find((k) => k.startsWith('pedido:'))
    const saved = JSON.parse(kv.store.get(key ?? '')?.value as string) as Order
    expect(saved).toMatchObject({
      pecaId,
      nome: 'Ana Souza',
      email: 'ana@email.com',
      medidas: { ...medidasFemininas, braco: 58.5 },
      peca: { linha: 'feminina', peca: 'vestido' },
    })
    // A peça do pedido não expira mais.
    expect(kv.store.get(`img:${pecaId}`)?.expirationTtl).toBeUndefined()
    expect(kv.store.get(`peca:${pecaId}`)?.expirationTtl).toBeUndefined()
  })

  it('pede as medidas da linha da peça guardada (masculina: tórax, pescoço, entrepernas)', async () => {
    const { env } = fakeEnv()
    const pecaId = await createPiece(env, {
      linha: 'masculina',
      peca: 'smoking',
      tecido: 'grain-de-poudre',
      cor: 'preto',
      silhueta: 'ajustada',
      detalhes: [],
      colecao: 'nocturne',
    })
    const response = await call(order({ pecaId, medidas: medidasFemininas, ...contato }), env)
    expect(response.status).toBe(400)
    const result = await response.json<OrderResult>()
    expect(result.status === 'erro' && Object.keys(result.erros ?? {})).toEqual(
      expect.arrayContaining(['medidas.torax', 'medidas.pescoco', 'medidas.entrepernas']),
    )
  })

  it('recusa medidas fora dos limites, e-mail inválido e falta de autorização', async () => {
    const { env } = fakeEnv()
    const pecaId = await createPiece(env)
    const response = await call(
      order({
        pecaId,
        medidas: { ...medidasFemininas, cintura: 4 },
        ...contato,
        email: 'ana@',
        consentimento: false,
      }),
      env,
    )
    expect(response.status).toBe(400)
    const result = await response.json<OrderResult>()
    expect(result.status === 'erro' && result.erros).toMatchObject({
      'medidas.cintura': expect.stringContaining('entre 45 e 160') as unknown,
      email: expect.any(String) as unknown,
      consentimento: expect.any(String) as unknown,
    })
  })

  it('peça inexistente: 404 com motivo "peca"', async () => {
    const { env } = fakeEnv()
    const response = await call(order({ pecaId: 'c'.repeat(64), medidas: medidasFemininas, ...contato }), env)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ status: 'erro', motivo: 'peca' })
  })

  it('robô que preenche o campo-isca: parece aceito, mas nada é guardado', async () => {
    const { env, kv } = fakeEnv()
    const pecaId = await createPiece(env)
    const response = await call(order({ pecaId, medidas: medidasFemininas, ...contato, site: 'spam' }), env)
    expect(await response.json()).toMatchObject({ status: 'ok' })
    expect([...kv.store.keys()].some((k) => k.startsWith('pedido:'))).toBe(false)
  })

  it('rate limit: o 4º pedido no mesmo minuto é recusado', async () => {
    const { env } = fakeEnv()
    const pecaId = await createPiece(env)
    for (let i = 0; i < 3; i++) {
      expect((await call(order({ pecaId, medidas: medidasFemininas, ...contato }), env)).status).toBe(200)
    }
    const fourth = await call(order({ pecaId, medidas: medidasFemininas, ...contato }), env)
    expect(fourth.status).toBe(429)
    expect(await fourth.json()).toEqual({ status: 'erro', motivo: 'limite' })
  })
})

describe('painel do ateliê (GET e DELETE /api/pedidos)', () => {
  async function withOrders(count: number) {
    const ctx = fakeEnv({ ATELIE_SENHA: SENHA })
    const pecaId = await createPiece(ctx.env)
    for (let i = 0; i < count; i++) {
      await call(
        order({ pecaId, medidas: medidasFemininas, ...contato, nome: `Cliente ${i}` }, `10.0.0.${i}`),
        ctx.env,
      )
      // Tempo diferente para cada pedido (o id começa pelo tempo).
      await new Promise((resolve) => setTimeout(resolve, 2))
    }
    return ctx
  }

  it('com a senha certa, lista os pedidos do mais novo para o mais antigo', async () => {
    const { env } = await withOrders(2)
    const response = await call(panel('GET'), env)
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    const { pedidos } = await response.json<{ pedidos: Order[] }>()
    expect(pedidos.map((p) => p.nome)).toEqual(['Cliente 1', 'Cliente 0'])
  })

  it('senha errada: 401; sem senha configurada: 503', async () => {
    const { env } = await withOrders(1)
    expect((await call(panel('GET', '/api/pedidos', 'chute'), env)).status).toBe(401)
    const semSenha = fakeEnv({ ATELIE_SENHA: '' })
    expect((await call(panel('GET'), semSenha.env)).status).toBe(503)
  })

  it('limita as tentativas de senha (11ª no minuto: 429)', async () => {
    const { env } = await withOrders(0)
    for (let i = 0; i < 10; i++) await call(panel('GET', '/api/pedidos', `chute ${i}`), env)
    expect((await call(panel('GET'), env)).status).toBe(429)
  })

  it('apaga um pedido', async () => {
    const { env } = await withOrders(1)
    const { pedidos } = await (await call(panel('GET'), env)).json<{ pedidos: Order[] }>()
    const id = pedidos[0]?.id ?? ''
    expect((await call(panel('DELETE', `/api/pedidos/${id}`), env)).status).toBe(204)
    const after = await (await call(panel('GET'), env)).json<{ pedidos: Order[] }>()
    expect(after.pedidos).toEqual([])
    expect((await call(panel('DELETE', '/api/pedidos/qualquer-coisa'), env)).status).toBe(400)
  })
})
