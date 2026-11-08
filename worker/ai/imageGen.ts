import { withTimeout } from '../lib/timeout'

/** Modelo de imagem do Workers AI (cota gratuita diária). */
export const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell'

/** Passos de difusão: 4 é o padrão do modelo e o mais barato em cota (máximo 8). */
const STEPS = 4

/**
 * Como o Worker chega ao Workers AI:
 * - em produção, pelo vínculo `AI` (sem token nenhum);
 * - no computador, se o `.env` tiver conta e token do Cloudflare, pela API REST.
 *   Assim `npm run dev` gera imagens de verdade sem `wrangler login`. O `.env`
 *   nunca é enviado no deploy, então em produção esse caminho não existe.
 */
export interface AiAccess {
  AI?: Ai
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_API_TOKEN?: string
}

interface RestAnswer {
  success?: boolean
  result?: { image?: string }
  errors?: { code: number; message: string }[]
}

/**
 * Gera a imagem e devolve os bytes do JPEG. Lança TimeoutError ou o erro da API.
 * Entrada conforme o tipo oficial do modelo: só `prompt` e `steps`.
 */
export async function generatePieceImage(
  access: AiAccess,
  prompt: string,
  timeoutMs: number,
): Promise<ArrayBuffer> {
  const controller = new AbortController()
  const rest = restCredentials(access)
  const run = rest
    ? runViaRest(rest, IMAGE_MODEL, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, steps: STEPS }),
        signal: controller.signal,
      })
    : runViaBinding(access.AI, prompt)
  const image = await withTimeout(run, timeoutMs, () => controller.abort())
  return decodeBase64(image)
}

/**
 * Edição com imagens de referência (FLUX.2 [klein]): a prova virtual.
 * O modelo recebe um formulário multipart: prompt, tamanho e `input_image_0..n`.
 */
export async function generateFittingImage(
  access: AiAccess,
  model: keyof AiModels & `@cf/black-forest-labs/flux-2-${string}`,
  prompt: string,
  images: Blob[],
  size: { width: number; height: number },
  timeoutMs: number,
): Promise<ArrayBuffer> {
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('width', String(size.width))
  form.append('height', String(size.height))
  images.forEach((image, i) => form.append(`input_image_${i}`, image, `imagem-${i}.jpg`))

  const controller = new AbortController()
  const rest = restCredentials(access)
  const run = rest
    ? runViaRest(rest, model, { body: form, signal: controller.signal })
    : (async () => {
        if (!access.AI) throw new Error('Vínculo AI indisponível')
        // O vínculo recebe o multipart como fluxo + tipo (com a fronteira do formulário).
        const encoded = new Response(form)
        const output = await access.AI.run(model, {
          multipart: {
            body: encoded.body ?? undefined,
            contentType: encoded.headers.get('content-type') ?? '',
          },
        })
        if (!output.image) throw new Error('Workers AI não devolveu imagem')
        return output.image
      })()
  const image = await withTimeout(run, timeoutMs, () => controller.abort())
  return decodeBase64(image)
}

/** A cota diária gratuita acabou? (mensagem de erro do Workers AI) */
export function isQuotaError(error: unknown): boolean {
  return /daily free allocation|neurons|quota|4006/i.test(String(error))
}

function restCredentials(access: AiAccess): { accountId: string; apiToken: string } | null {
  const accountId = access.CLOUDFLARE_ACCOUNT_ID?.trim()
  const apiToken = access.CLOUDFLARE_API_TOKEN?.trim()
  return accountId && apiToken ? { accountId, apiToken } : null
}

async function runViaBinding(ai: Ai | undefined, prompt: string): Promise<string> {
  if (!ai) throw new Error('Vínculo AI indisponível')
  const output = await ai.run(IMAGE_MODEL, { prompt, steps: STEPS })
  if (!output.image) throw new Error('Workers AI não devolveu imagem')
  return output.image
}

async function runViaRest(
  { accountId, apiToken }: { accountId: string; apiToken: string },
  model: string,
  init: { headers?: Record<string, string>; body: BodyInit; signal: AbortSignal },
): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, ...init.headers },
    body: init.body,
    signal: init.signal,
  })
  const data = (await response.json().catch(() => null)) as RestAnswer | null
  const image = data?.success ? data.result?.image : undefined
  if (!response.ok || !image) {
    const detail = data?.errors?.map((e) => `${e.code}: ${e.message}`).join(' | ') ?? ''
    throw new Error(`API REST do Workers AI respondeu HTTP ${response.status} ${detail}`.trim())
  }
  return image
}

function decodeBase64(image: string): ArrayBuffer {
  const binary = atob(image)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
