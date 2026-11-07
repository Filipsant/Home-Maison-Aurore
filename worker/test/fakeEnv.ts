import { vi } from 'vitest'

/** KV em memória com a parte da API que o Worker usa. */
export class MemoryKV {
  store = new Map<string, { value: ArrayBuffer; metadata: unknown }>()

  getWithMetadata(key: string) {
    const entry = this.store.get(key)
    return Promise.resolve({ value: entry?.value ?? null, metadata: entry?.metadata ?? null })
  }

  put(key: string, value: ArrayBuffer, options?: { metadata?: unknown }) {
    this.store.set(key, { value, metadata: options?.metadata })
    return Promise.resolve()
  }

  list({ prefix }: { prefix: string }) {
    const keys = [...this.store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name }))
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
    LIMITE_PROVADOR: undefined,
    TRYON_SPACE: 'yisol/IDM-VTON',
    TRYON_SPACE_RESERVA: 'Nymbo/Virtual-Try-On',
    ALLOWED_ORIGINS: 'http://localhost:5173',
    IMAGE_TIMEOUT_MS: '200',
    TRYON_TIMEOUT_MS: '200',
    HF_TOKEN: '',
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
