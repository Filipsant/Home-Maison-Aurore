import { afterEach, describe, expect, it, vi } from 'vitest'
import { sha256 } from './hash'
import { isAllowedOrigin } from './http'
import { limitByIp, resetMemoryLimits } from './rateLimit'
import { msFromEnv, TimeoutError, withTimeout } from './timeout'

describe('sha256 (chave do cache)', () => {
  it('é determinístico e tem 64 caracteres hexadecimais', async () => {
    const a = await sha256('peca-v1', '{"peca":"vestido"}')
    expect(a).toMatch(/^[a-f0-9]{64}$/)
    expect(await sha256('peca-v1', '{"peca":"vestido"}')).toBe(a)
  })

  it('separa as partes: ("ab","c") é diferente de ("a","bc")', async () => {
    expect(await sha256('ab', 'c')).not.toBe(await sha256('a', 'bc'))
  })

  it('aceita bytes', async () => {
    const bytes = new Uint8Array([1, 2, 3])
    expect(await sha256(bytes)).toBe(await sha256(bytes.buffer))
  })
})

describe('limitByIp (rate limit por IP)', () => {
  afterEach(resetMemoryLimits)
  const rule = { limit: 2, windowSeconds: 60 }

  it('bloqueia acima do limite e informa quando tentar de novo', async () => {
    const now = 1_000_000
    expect((await limitByIp(undefined, 'imagem', '1.1.1.1', rule, now)).ok).toBe(true)
    expect((await limitByIp(undefined, 'imagem', '1.1.1.1', rule, now + 1000)).ok).toBe(true)
    const blocked = await limitByIp(undefined, 'imagem', '1.1.1.1', rule, now + 2000)
    expect(blocked).toEqual({ ok: false, retryAfter: 58 })
  })

  it('cada IP e cada rota têm seu próprio contador', async () => {
    const now = 1_000_000
    await limitByIp(undefined, 'imagem', '1.1.1.1', rule, now)
    await limitByIp(undefined, 'imagem', '1.1.1.1', rule, now)
    expect((await limitByIp(undefined, 'imagem', '2.2.2.2', rule, now)).ok).toBe(true)
    expect((await limitByIp(undefined, 'provador', '1.1.1.1', rule, now)).ok).toBe(true)
  })

  it('libera de novo depois da janela', async () => {
    const now = 1_000_000
    await limitByIp(undefined, 'imagem', '1.1.1.1', rule, now)
    await limitByIp(undefined, 'imagem', '1.1.1.1', rule, now)
    expect((await limitByIp(undefined, 'imagem', '1.1.1.1', rule, now + 61_000)).ok).toBe(true)
  })

  it('usa o vínculo nativo do Cloudflare quando existe', async () => {
    const binding = { limit: vi.fn(() => Promise.resolve({ success: false })) }
    const result = await limitByIp(binding, 'imagem', '1.1.1.1', rule)
    expect(binding.limit).toHaveBeenCalledWith({ key: 'imagem:1.1.1.1' })
    expect(result).toEqual({ ok: false, retryAfter: 60 })
  })
})

describe('withTimeout', () => {
  it('rejeita com TimeoutError e avisa o cancelamento', async () => {
    const onTimeout = vi.fn()
    await expect(withTimeout(new Promise(() => undefined), 20, onTimeout)).rejects.toBeInstanceOf(
      TimeoutError,
    )
    expect(onTimeout).toHaveBeenCalledOnce()
  })

  it('devolve o valor quando chega a tempo', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50)).resolves.toBe('ok')
  })

  it('msFromEnv usa o padrão para valores inválidos', () => {
    expect(msFromEnv('15000', 1)).toBe(15000)
    expect(msFromEnv(undefined, 20000)).toBe(20000)
    expect(msFromEnv('abc', 20000)).toBe(20000)
    expect(msFromEnv('-5', 20000)).toBe(20000)
  })
})

describe('isAllowedOrigin', () => {
  const req = (origin?: string) =>
    new Request('https://maison.example/api/saude', { headers: origin ? { Origin: origin } : {} })

  it('aceita a mesma origem, as da lista e pedidos sem Origin', () => {
    expect(isAllowedOrigin(req('https://maison.example'), '')).toBe(true)
    expect(isAllowedOrigin(req('http://localhost:5173'), 'http://localhost:5173, https://outro.dev')).toBe(
      true,
    )
    expect(isAllowedOrigin(req(), '')).toBe(true)
  })

  it('recusa origens de fora da lista', () => {
    expect(isAllowedOrigin(req('https://site-estranho.com'), 'http://localhost:5173')).toBe(false)
  })
})
