import { withTimeout } from '../lib/timeout'

/** Modelo de imagem do Workers AI (cota gratuita diária). */
export const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell'

/** Passos de difusão: 4 é o padrão do modelo e o mais barato em cota (máximo 8). */
const STEPS = 4

/**
 * Gera a imagem e devolve os bytes do JPEG. Lança TimeoutError ou o erro da API.
 * Entrada conforme o tipo oficial do modelo: só `prompt` e `steps`.
 */
export async function generatePieceImage(ai: Ai, prompt: string, timeoutMs: number): Promise<ArrayBuffer> {
  const output = await withTimeout(ai.run(IMAGE_MODEL, { prompt, steps: STEPS }), timeoutMs)
  if (!output.image) throw new Error('Workers AI não devolveu imagem')
  const binary = atob(output.image)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

/** A cota diária gratuita acabou? (mensagem de erro do Workers AI) */
export function isQuotaError(error: unknown): boolean {
  return /daily free allocation|neurons|quota|4006/i.test(String(error))
}
