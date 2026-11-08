import { vi } from 'vitest'

type Stored = ArrayBuffer | string

/** KV em memória com a parte da API que o Worker usa. */
export class MemoryKV {
  store = new Map<string, { value: Stored; metadata: unknown; expirationTtl?: number }>()

  getWithMetadata(key: string) {
    const entry = this.store.get(key)
    return Promise.resolve({ value: entry?.value ?? null, metadata: entry?.metadata ?? null })
  }

  get(key: string, type?: 'json' | 'text') {
    const value = this.store.get(key)?.value
    if (value === undefined) return Promise.resolve(null)
    const text = typeof value === 'string' ? value : new TextDecoder().decode(value)
    return Promise.resolve(type === 'json' ? (JSON.parse(text) as unknown) : text)
  }

  put(key: string, value: Stored, options?: { metadata?: unknown; expirationTtl?: number }) {
    this.store.set(key, { value, metadata: options?.metadata, expirationTtl: options?.expirationTtl })
    return Promise.resolve()
  }

  delete(key: string) {
    this.store.delete(key)
    return Promise.resolve()
  }

  list({ prefix, limit = 1000 }: { prefix: string; limit?: number }) {
    const keys = [...this.store.keys()]
      .filter((k) => k.startsWith(prefix))
      .sort()
      .slice(0, limit)
      .map((name) => ({ name }))
    return Promise.resolve({ keys, list_complete: true })
  }
}

/** JPEG mínimo em base64 (só os primeiros bytes importam para os testes). */
export const FAKE_JPEG_BASE64 = btoa('\xff\xd8\xff\xe0fake-jpeg')

export function fakeEnv(overrides: Partial<Record<string, unknown>> = {}) {
  const kv = new MemoryKV()
  const ai = { run: vi.fn(() => Promise.resolve({ image: FAKE_JPEG_BASE64 })) }
  const env = {
    AI: ai,
    CACHE: kv,
    LIMITE_IMAGEM: undefined,
    LIMITE_PEDIDO: undefined,
    LIMITE_PAINEL: undefined,
    ALLOWED_ORIGINS: 'http://localhost:5173',
    IMAGE_TIMEOUT_MS: '200',
    ATELIE_SENHA: '',
    ...overrides,
  }
  return { env: env as unknown as Env, kv, ai }
}

export const validPiece = {
  peca: 'vestido',
  tecido: 'organza',
  cor: 'marfim',
  silhueta: 'sereia',
  detalhes: ['perolas', 'bordado'],
  colecao: 'lumiere',
}

export function postJson(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost:5173${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7', ...headers },
    body: JSON.stringify(body),
  })
}
