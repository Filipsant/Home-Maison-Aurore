import { Client, handle_file } from '@gradio/client'
import { withTimeout } from '../lib/timeout'

/**
 * Provador virtual via Space público do Hugging Face (@gradio/client).
 * API verificada com `view_api` em 07/11/2026 (yisol/IDM-VTON e Nymbo/Virtual-Try-On):
 * endpoint "/tryon" com [pessoa (editor de imagem), peça, descrição, máscara automática,
 * recorte automático, passos, semente]; devolve [imagem final, máscara].
 */
const ENDPOINT = '/tryon'
const DENOISE_STEPS = 30
const SEED = 42

export interface TryOnInput {
  person: Blob
  garment: Blob
  description: string
}

export interface TryOnOutput {
  bytes: ArrayBuffer
  contentType: string
  space: string
}

interface GradioFile {
  url?: string
}

async function callSpace(space: string, input: TryOnInput, token: string | undefined, timeoutMs: number) {
  const app = await Client.connect(space, token ? { token: token as `hf_${string}` } : undefined)
  const job = app.submit(ENDPOINT, [
    { background: handle_file(input.person), layers: [], composite: null },
    handle_file(input.garment),
    input.description,
    true, // máscara automática do corpo
    false, // sem recorte automático
    DENOISE_STEPS,
    SEED,
  ])

  const result = async () => {
    for await (const message of job) {
      if (message.type === 'status' && message.stage === 'error') {
        const detail = typeof message.message === 'string' ? message.message : 'erro na fila'
        throw new Error(`Space ${space}: ${detail}`)
      }
      if (message.type === 'data') {
        const [image] = message.data as [GradioFile | undefined]
        if (!image?.url) throw new Error(`Space ${space}: resposta sem imagem`)
        const response = await fetch(image.url)
        if (!response.ok) throw new Error(`Space ${space}: imagem indisponível (${response.status})`)
        return {
          bytes: await response.arrayBuffer(),
          contentType: response.headers.get('Content-Type') ?? 'image/png',
          space,
        }
      }
    }
    throw new Error(`Space ${space}: fila encerrada sem resultado`)
  }

  return withTimeout(result(), timeoutMs, () => void job.cancel())
}

/** Tempo mínimo que ainda vale a pena dar ao Space de reserva. */
const MIN_ATTEMPT_MS = 20_000

/**
 * Tenta o Space principal e, se falhar, o de reserva (mesma API).
 * `timeoutMs` é o prazo total: a reserva só é tentada se ainda sobrar tempo.
 */
export async function runTryOn(
  spaces: string[],
  input: TryOnInput,
  token: string | undefined,
  timeoutMs: number,
): Promise<TryOnOutput> {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  for (const [i, space] of spaces.entries()) {
    const remaining = deadline - Date.now()
    if (i > 0 && remaining < MIN_ATTEMPT_MS) break
    try {
      return await callSpace(space, input, token, remaining)
    } catch (error) {
      lastError = error
      console.error(`[provador] ${space} falhou:`, String(error))
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Nenhum Space respondeu')
}
