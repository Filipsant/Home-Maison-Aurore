import type { AiResult } from '../../src/types/ai'
import { runTryOn } from '../ai/tryOn'
import { getCachedImage, isHash, putCachedImage } from '../lib/cache'
import { sha256 } from '../lib/hash'
import { fallback } from '../lib/http'
import { clientIp, limitByIp } from '../lib/rateLimit'
import { msFromEnv, TimeoutError } from '../lib/timeout'

const RULE = { limit: 2, windowSeconds: 60 }
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const VERSION = 'provador-v1'
const DEFAULT_DESCRIPTION = 'haute couture garment'

/** Valor de um campo de formulário (texto ou arquivo). */
type FormValue = File | string | null

function validImage(value: FormValue): value is File {
  return value instanceof File && ACCEPTED.has(value.type) && value.size > 0 && value.size <= MAX_BYTES
}

/** Descrição curta e sem caracteres de controle (vai para o Space, não para a nossa cota). */
function cleanDescription(value: FormValue): string {
  const text = typeof value === 'string' ? value.replace(/\p{Cc}/gu, ' ').trim() : ''
  return text.slice(0, 120) || DEFAULT_DESCRIPTION
}

/**
 * POST /api/provador (multipart): `pessoa` (foto) + `peca` (foto) ou `pecaId`
 * (uma peça gerada em /api/pecas/imagem), e `descricao` opcional.
 */
export async function handleTryOn(request: Request, env: Env): Promise<Response> {
  const form = await request.formData().catch(() => null)
  if (!form) return fallback('provador', 'invalido', { status: 400 })

  const person = form.get('pessoa')
  if (!validImage(person)) return fallback('provador', 'invalido', { status: 400 })

  let garment: Blob | null = null
  const pieceId = form.get('pecaId')
  if (typeof pieceId === 'string' && isHash(pieceId)) {
    const cached = await getCachedImage(env.CACHE, pieceId)
    if (cached) garment = new Blob([cached.bytes], { type: cached.contentType })
  } else {
    const file = form.get('peca')
    if (validImage(file)) garment = file
  }
  if (!garment) return fallback('provador', 'invalido', { status: 400 })

  const description = cleanDescription(form.get('descricao'))
  const [personBytes, garmentBytes] = await Promise.all([person.arrayBuffer(), garment.arrayBuffer()])
  const hash = await sha256(VERSION, personBytes, garmentBytes, description)
  const ok = (cached: boolean): Response =>
    Response.json({ status: 'ok', id: hash, imageUrl: `/api/imagens/${hash}`, cached } satisfies AiResult)

  if (await getCachedImage(env.CACHE, hash)) return ok(true)

  const limit = await limitByIp(env.LIMITE_PROVADOR, 'provador', clientIp(request), RULE)
  if (!limit.ok) return fallback('provador', 'limite', { retryAfter: limit.retryAfter })

  try {
    const spaces = [env.TRYON_SPACE, env.TRYON_SPACE_RESERVA].filter(Boolean)
    const result = await runTryOn(
      spaces,
      {
        person: new Blob([personBytes], { type: person.type }),
        garment: new Blob([garmentBytes], { type: garment.type || 'image/jpeg' }),
        description,
      },
      env.HF_TOKEN || undefined,
      msFromEnv(env.TRYON_TIMEOUT_MS, 120_000),
    )
    await putCachedImage(env.CACHE, hash, { bytes: result.bytes, contentType: result.contentType })
    return ok(false)
  } catch (error) {
    console.error('[provador] falhou:', String(error))
    return fallback('provador', error instanceof TimeoutError ? 'tempo' : 'indisponivel')
  }
}
