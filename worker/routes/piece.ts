import type { AiResult } from '../../src/types/ai'
import { generatePieceImage, isQuotaError } from '../ai/imageGen'
import { buildPiecePrompt, parsePieceRequest, PROMPT_VERSION } from '../ai/prompt'
import { getCachedImage, putCachedImage } from '../lib/cache'
import { sha256 } from '../lib/hash'
import { fallback } from '../lib/http'
import { clientIp, limitByIp } from '../lib/rateLimit'
import { msFromEnv, TimeoutError } from '../lib/timeout'

/** Regra do contador em memória (o vínculo nativo usa a do wrangler.jsonc). */
const RULE = { limit: 5, windowSeconds: 60 }

/** POST /api/pecas/imagem — gera a foto de uma peça a partir dos campos do formulário. */
export async function handlePieceImage(request: Request, env: Env): Promise<Response> {
  const body: unknown = await request.json().catch(() => null)
  const piece = parsePieceRequest(body)
  if (!piece) return fallback('peca', 'invalido', { status: 400 })

  const hash = await sha256(PROMPT_VERSION, JSON.stringify(piece))
  const ok = (cached: boolean): Response =>
    Response.json({ status: 'ok', id: hash, imageUrl: `/api/imagens/${hash}`, cached } satisfies AiResult)

  // 1. Cache: pedido repetido não gasta cota nem conta no limite.
  if (await getCachedImage(env.CACHE, hash)) return ok(true)

  // 2. Limite por IP.
  const limit = await limitByIp(env.LIMITE_IMAGEM, 'imagem', clientIp(request), RULE)
  if (!limit.ok) return fallback('peca', 'limite', { retryAfter: limit.retryAfter })

  // 3. Geração com tempo máximo; qualquer falha vira a imagem de exemplo.
  try {
    const prompt = buildPiecePrompt(piece)
    const bytes = await generatePieceImage(env, prompt, msFromEnv(env.IMAGE_TIMEOUT_MS, 20_000))
    await putCachedImage(env.CACHE, hash, { bytes, contentType: 'image/jpeg' })
    return ok(false)
  } catch (error) {
    console.error('[imagem] falhou:', String(error))
    const reason = error instanceof TimeoutError ? 'tempo' : isQuotaError(error) ? 'cota' : 'indisponivel'
    return fallback('peca', reason)
  }
}
