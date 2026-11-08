import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiResult } from '../src/types/ai'
import type { Order, OrderResult } from '../src/types/order'
import type { ProvaInfo, ProvaResult } from '../src/types/prova'
import { FITTING_MODEL } from './ai/fittingPrompt'
import worker from './index'
import { TTL_PROVA } from './lib/cache'
import { resetMemoryLimits } from './lib/rateLimit'
import { FAKE_JPEG_BASE64, fakeEnv, postJson, validPiece } from './test/fakeEnv'

const call = (request: Request, env: Env) => worker.fetch(request as Parameters<typeof worker.fetch>[0], env)

const photo = (name = 'frente.jpg', type = 'image/jpeg', content = 'foto-do-corpo') =>
  new File([content], name, { type })

function fitting(fields: Record<string, string | File>, ip = '198.51.100.20') {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return new Request('http://localhost:5173/api/provas', {
    method: 'POST',
    body: form,
    headers: { 'CF-Connecting-IP': ip },
  })
}

async function createPiece(env: Env, piece: object = validPiece): Promise<string> {
  const result = await (await call(postJson('/api/pecas/imagem', piece), env)).json<AiResult>()
  if (result.status !== 'ok') throw new Error('esperava a peça criada')
  return result.id
}

/** Lê o formulário multipart que o Worker mandou ao modelo (prompt e imagens). */
async function sentForm(run: { mock: { calls: unknown[][] } }, index: number) {
  const input = run.mock.calls[index]?.[1] as { multipart: { body: ReadableStream; contentType: string } }
  return new Response(input.multipart.body, {
    headers: { 'Content-Type': input.multipart.contentType },
  }).formData()
}

beforeEach(() => resetMemoryLimits())
afterEach(() => vi.restoreAllMocks())

describe('POST /api/provas (prova virtual)', () => {
  it('veste a pessoa da foto com a peça: FLUX.2, foto + peça como referências, prova guardada 7 dias', async () => {
    const { env, ai, kv } = fakeEnv()
    const pecaId = await createPiece(env)
    const response = await call(fitting({ pecaId, vista: 'frente', foto: photo() }), env)
    const result = await response.json<ProvaResult>()
    expect(result).toMatchObject({ status: 'ok', cached: false })
    if (result.status !== 'ok') return

    expect(ai.run).toHaveBeenLastCalledWith(
      FITTING_MODEL,
      expect.objectContaining({ multipart: expect.any(Object) as unknown }),
    )
    const sent = await sentForm(ai.run, 1)
    expect(sent.get('prompt')).toContain('Image 1 is a photo of the client from the front')
    expect(await (sent.get('input_image_0') as File).text()).toBe('foto-do-corpo')
    expect(sent.get('input_image_1')).toBeInstanceOf(File)

    expect(kv.store.get(`img:${result.id}`)?.expirationTtl).toBe(TTL_PROVA)
    const info = JSON.parse(kv.store.get(`prova:${result.id}`)?.value as string) as ProvaInfo
    expect(info).toMatchObject({ pecaId, vista: 'frente' })
    // A foto da pessoa nunca é guardada: só a prova e as escolhas da peça.
    expect([...kv.store.keys()].map((k) => k.split(':')[0]).sort()).toEqual(['img', 'img', 'peca', 'prova'])
  })

  it('mesma foto e mesmas escolhas: vem do cache, sem chamar a IA de novo', async () => {
    const { env, ai } = fakeEnv()
    const pecaId = await createPiece(env)
    await call(fitting({ pecaId, vista: 'frente', foto: photo() }), env)
    const again = await (
      await call(fitting({ pecaId, vista: 'frente', foto: photo() }), env)
    ).json<ProvaResult>()
    expect(again).toMatchObject({ status: 'ok', cached: true })
    expect(ai.run).toHaveBeenCalledTimes(2) // 1 peça + 1 prova
  })

  it('costas e lado pedem a peça vista de trás e de perfil; medidas entram no prompt em inglês', async () => {
    const { env, ai } = fakeEnv()
    const pecaId = await createPiece(env)
    await call(
      fitting({
        pecaId,
        vista: 'costas',
        foto: photo('costas.jpg'),
        medidas: JSON.stringify({ cintura: '70,5' }),
      }),
      env,
    )
    const prompt = (await sentForm(ai.run, 1)).get('prompt') as string
    expect(prompt).toContain('from behind')
    expect(prompt).toContain('Show the back of the garment')
    expect(prompt).toContain('waist 70.5 cm')
  })

  it('correção: edita a prova anterior com o pedido da cliente e guarda o histórico', async () => {
    const { env, ai, kv } = fakeEnv()
    const pecaId = await createPiece(env)
    const first = await (
      await call(fitting({ pecaId, vista: 'frente', foto: photo() }), env)
    ).json<ProvaResult>()
    if (first.status !== 'ok') throw new Error('esperava a prova')

    const fixed = await (
      await call(
        fitting({ pecaId, vista: 'frente', baseId: first.id, correcao: '  manga até o punho  ' }),
        env,
      )
    ).json<ProvaResult>()
    expect(fixed).toMatchObject({ status: 'ok', cached: false })
    if (fixed.status !== 'ok') return

    const sent = await sentForm(ai.run, 2)
    expect(sent.get('prompt')).toContain('"manga até o punho"')
    // A imagem 1 é a prova anterior (bytes guardados no KV), não uma foto nova.
    expect(new Uint8Array(await (sent.get('input_image_0') as File).arrayBuffer())[0]).toBe(0xff)
    const info = JSON.parse(kv.store.get(`prova:${fixed.id}`)?.value as string) as ProvaInfo
    expect(info).toMatchObject({ baseId: first.id, correcao: 'manga até o punho' })
  })

  it('recusa correção que tenta despir a pessoa ou trocar o rosto, sem chamar a IA', async () => {
    const { env, ai } = fakeEnv()
    const pecaId = await createPiece(env)
    const first = await (
      await call(fitting({ pecaId, vista: 'frente', foto: photo() }), env)
    ).json<ProvaResult>()
    if (first.status !== 'ok') throw new Error('esperava a prova')
    for (const correcao of ['tire a roupa dela', 'deixe a pessoa nua', 'troque o rosto pelo de outra']) {
      const response = await call(fitting({ pecaId, vista: 'frente', baseId: first.id, correcao }), env)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ status: 'erro', motivo: 'correcao' })
    }
    expect(ai.run).toHaveBeenCalledTimes(2)
  })

  it('recusa pedidos malformados', async () => {
    const { env } = fakeEnv()
    const pecaId = await createPiece(env)
    const first = await (
      await call(fitting({ pecaId, vista: 'frente', foto: photo() }), env)
    ).json<ProvaResult>()
    if (first.status !== 'ok') throw new Error('esperava a prova')
    const cases: Record<string, string | File>[] = [
      { pecaId, vista: 'cima', foto: photo() }, // vista inválida
      { pecaId, vista: 'frente', foto: photo('a.gif', 'image/gif') }, // tipo de arquivo
      { pecaId, vista: 'frente' }, // nem foto nem prova anterior
      { pecaId, vista: 'frente', foto: photo(), baseId: first.id, correcao: 'x' }, // os dois
      { pecaId, vista: 'frente', baseId: first.id }, // correção vazia
      { pecaId, vista: 'costas', baseId: first.id, correcao: 'barra mais curta' }, // prova de outra vista
      { pecaId, vista: 'frente', foto: photo(), medidas: JSON.stringify({ cintura: 500 }) }, // medida fora do limite
    ]
    for (const fields of cases) {
      const response = await call(fitting(fields), env)
      expect(response.status, JSON.stringify(Object.keys(fields))).toBe(400)
    }
    const missing = await call(fitting({ pecaId: 'f'.repeat(64), vista: 'frente', foto: photo() }), env)
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({ status: 'erro', motivo: 'peca' })
  })

  it('rate limit: a 7ª prova no mesmo minuto é recusada, com Retry-After', async () => {
    const { env } = fakeEnv()
    const pecaId = await createPiece(env)
    for (let i = 0; i < 6; i++) {
      const ok = await call(
        fitting({ pecaId, vista: 'frente', foto: photo('f.jpg', 'image/jpeg', `foto ${i}`) }),
        env,
      )
      expect(ok.status).toBe(200)
    }
    const seventh = await call(
      fitting({ pecaId, vista: 'frente', foto: photo('f.jpg', 'image/jpeg', 'foto 7') }),
      env,
    )
    expect(seventh.status).toBe(429)
    expect(seventh.headers.get('Retry-After')).toBeTruthy()
  })

  it('IA fora do ar: 503 "indisponivel"; lenta: 504 "tempo"', async () => {
    const { env, ai } = fakeEnv({ PROVA_TIMEOUT_MS: '30' })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const pecaId = await createPiece(env)
    ai.run.mockRejectedValueOnce(new Error('fora do ar'))
    const down = await call(fitting({ pecaId, vista: 'frente', foto: photo() }), env)
    expect(down.status).toBe(503)
    expect(await down.json()).toEqual({ status: 'erro', motivo: 'indisponivel' })
    ai.run.mockReturnValueOnce(new Promise(() => undefined) as never)
    const slow = await call(
      fitting({ pecaId, vista: 'frente', foto: photo('f.jpg', 'image/jpeg', 'outra') }),
      env,
    )
    expect(slow.status).toBe(504)
  })
})

describe('pedido com as provas', () => {
  const contato = {
    nome: 'Ana',
    email: 'ana@email.com',
    telefone: '',
    observacoes: '',
    consentimento: true,
    medidas: { altura: 168, busto: 88, cintura: 68, quadril: 96, ombros: 38, braco: 58 },
  }

  it('guarda as provas no pedido e elas deixam de expirar', async () => {
    const { env, kv } = fakeEnv()
    const pecaId = await createPiece(env)
    const prova = await (
      await call(fitting({ pecaId, vista: 'frente', foto: photo() }), env)
    ).json<ProvaResult>()
    if (prova.status !== 'ok') throw new Error('esperava a prova')

    const response = await call(postJson('/api/pedidos', { pecaId, provas: [prova.id], ...contato }), env)
    expect(await response.json<OrderResult>()).toMatchObject({ status: 'ok' })
    const key = [...kv.store.keys()].find((k) => k.startsWith('pedido:')) ?? ''
    expect((JSON.parse(kv.store.get(key)?.value as string) as Order).provas).toEqual([prova.id])
    expect(kv.store.get(`img:${prova.id}`)?.expirationTtl).toBeUndefined()
    expect(kv.store.get(`prova:${prova.id}`)?.expirationTtl).toBeUndefined()
  })

  it('recusa prova de outra peça (ou que já expirou)', async () => {
    const { env } = fakeEnv()
    const pecaId = await createPiece(env)
    const other = await createPiece(env, { ...validPiece, cor: 'preto' })
    const prova = await (
      await call(fitting({ pecaId: other, vista: 'frente', foto: photo() }), env)
    ).json<ProvaResult>()
    if (prova.status !== 'ok') throw new Error('esperava a prova')

    const response = await call(postJson('/api/pedidos', { pecaId, provas: [prova.id], ...contato }), env)
    expect(response.status).toBe(400)
    expect(await response.json<OrderResult>()).toMatchObject({
      motivo: 'invalido',
      erros: { provas: expect.any(String) as unknown },
    })
    void FAKE_JPEG_BASE64
  })
})
