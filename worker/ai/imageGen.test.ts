import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeoutError } from '../lib/timeout'
import { FAKE_JPEG_BASE64 } from '../test/fakeEnv'
import { generatePieceImage, IMAGE_MODEL, isQuotaError } from './imageGen'

const credentials = { CLOUDFLARE_ACCOUNT_ID: 'conta-teste', CLOUDFLARE_API_TOKEN: 'token-teste' }

function fakeBinding() {
  return { run: vi.fn(() => Promise.resolve({ image: FAKE_JPEG_BASE64 })) }
}

function firstBytes(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer).slice(0, 3)]
}

afterEach(() => vi.unstubAllGlobals())

describe('geração de imagem: vínculo AI ou API REST', () => {
  it('sem token no ambiente (produção), usa o vínculo AI', async () => {
    const ai = fakeBinding()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const bytes = await generatePieceImage({ AI: ai as unknown as Ai }, 'prompt', 1000)

    expect(firstBytes(bytes)).toEqual([0xff, 0xd8, 0xff])
    expect(ai.run).toHaveBeenCalledWith(IMAGE_MODEL, { prompt: 'prompt', steps: 4 })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('com conta e token do .env (computador), usa a API REST e não o vínculo', async () => {
    const ai = fakeBinding()
    const fetchSpy = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json({ success: true, result: { image: FAKE_JPEG_BASE64 }, errors: [] })),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const bytes = await generatePieceImage({ AI: ai as unknown as Ai, ...credentials }, 'prompt', 1000)

    expect(firstBytes(bytes)).toEqual([0xff, 0xd8, 0xff])
    expect(ai.run).not.toHaveBeenCalled()
    const [url, init] = fetchSpy.mock.calls[0] ?? []
    expect(url).toBe(`https://api.cloudflare.com/client/v4/accounts/conta-teste/ai/run/${IMAGE_MODEL}`)
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token-teste')
    expect(init?.body).toBe(JSON.stringify({ prompt: 'prompt', steps: 4 }))
  })

  it('token em branco no .env conta como ausente', async () => {
    const ai = fakeBinding()
    await generatePieceImage(
      { AI: ai as unknown as Ai, CLOUDFLARE_ACCOUNT_ID: ' ', CLOUDFLARE_API_TOKEN: '' },
      'prompt',
      1000,
    )
    expect(ai.run).toHaveBeenCalled()
  })

  it('cota esgotada na API REST é reconhecida como "cota"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          Response.json(
            {
              success: false,
              errors: [
                { code: 4006, message: 'you have used up your daily free allocation of 10,000 neurons' },
              ],
            },
            { status: 429 },
          ),
        ),
      ),
    )
    const error: unknown = await generatePieceImage(credentials, 'prompt', 1000).catch((e: unknown) => e)
    expect(isQuotaError(error)).toBe(true)
  })

  it('API REST lenta: tempo esgotado e a requisição é cancelada', async () => {
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            signal = init?.signal ?? undefined
            signal?.addEventListener('abort', () => reject(new DOMException('cancelado', 'AbortError')))
          }),
      ),
    )
    await expect(generatePieceImage(credentials, 'prompt', 30)).rejects.toBeInstanceOf(TimeoutError)
    expect(signal?.aborted).toBe(true)
  })

  it('sem vínculo e sem token, falha com mensagem clara', async () => {
    await expect(generatePieceImage({}, 'prompt', 1000)).rejects.toThrow('Vínculo AI indisponível')
  })
})
