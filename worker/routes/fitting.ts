import { measurements } from '../../src/data/measurements'
import { parseMeasure } from '../../src/lib/orders/validate'
import type { AtelierLinha } from '../../src/types/content'
import { PROVA_VISTAS, type ProvaErro, type ProvaResult, type ProvaVista } from '../../src/types/prova'
import {
  buildCorrectionPrompt,
  buildFittingPrompt,
  cleanCorrection,
  FITTING_MODEL,
  FITTING_SIZE,
  FITTING_VERSION,
  isBlockedCorrection,
} from '../ai/fittingPrompt'
import { generateFittingImage, isQuotaError } from '../ai/imageGen'
import { getCachedImage, getPiece, getProva, isHash, putCachedImage, putProva, TTL_PROVA } from '../lib/cache'
import { sha256 } from '../lib/hash'
import { clientIp, limitByIp } from '../lib/rateLimit'
import { msFromEnv, TimeoutError } from '../lib/timeout'

/** Regra do contador em memória (o vínculo nativo usa a do wrangler.jsonc). */
const RULE = { limit: 6, windowSeconds: 60 }
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_VARIANTE = 9

const result = (body: ProvaResult, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers })
const error = (motivo: ProvaErro, status: number, retryAfter?: number) =>
  result(
    { status: 'erro', motivo, retryAfter },
    status,
    retryAfter ? { 'Retry-After': String(retryAfter) } : {},
  )

function validImage(value: unknown): value is File {
  return value instanceof File && ACCEPTED.has(value.type) && value.size > 0 && value.size <= MAX_BYTES
}

/** Medidas opcionais (JSON); valem só as da linha da peça e dentro dos limites. Inválidas → null. */
function parseMeasures(raw: unknown, linha: AtelierLinha): Record<string, number> | null {
  if (raw === null || raw === '') return {}
  if (typeof raw !== 'string' || raw.length > 1000) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const out: Record<string, number> = {}
  for (const field of measurements[linha]) {
    const value = (data as Record<string, unknown>)[field.id]
    if (value === undefined || value === '') continue
    const n = parseMeasure(value)
    if (n === null || n < field.min || n > field.max) return null
    out[field.id] = n
  }
  return out
}

/**
 * POST /api/provas (multipart) — a cliente vestindo a peça do ateliê digital.
 *
 * Prova nova:  `pecaId`, `vista` (frente | costas | lado), `foto` (corpo da cliente),
 *              `medidas` (JSON opcional), `variante` (0–9, opcional).
 * Correção:    `pecaId`, `vista`, `baseId` (prova anterior), `correcao` (texto).
 *
 * A foto da pessoa só passa pelo Workers AI: nunca é guardada. A prova gerada
 * fica 7 dias no KV (ou para sempre, se for junto num pedido).
 */
export async function handleFitting(request: Request, env: Env): Promise<Response> {
  const form = await request.formData().catch(() => null)
  if (!form) return error('invalido', 400)

  const pecaId = form.get('pecaId')
  const vista = form.get('vista')
  if (!isHash(pecaId) || !PROVA_VISTAS.includes(vista as ProvaVista)) return error('invalido', 400)
  const view = vista as ProvaVista

  const piece = await getPiece(env.CACHE, pecaId)
  if (!piece) return error('peca', 404)
  const linha: AtelierLinha = piece.linha === 'masculina' ? 'masculina' : 'feminina'

  const foto = form.get('foto')
  const rawBase = form.get('baseId')
  const baseId = isHash(rawBase) ? rawBase : null
  const correcao = cleanCorrection(form.get('correcao'))
  const isCorrection = baseId !== null
  if (isCorrection === validImage(foto)) return error('invalido', 400) // exatamente um dos dois
  if (isCorrection && !correcao) return error('invalido', 400)
  if (correcao && isBlockedCorrection(correcao)) return error('correcao', 400)

  const medidas = parseMeasures(form.get('medidas'), linha)
  if (!medidas) return error('invalido', 400)
  const variante = Number(form.get('variante') ?? 0)
  if (!Number.isInteger(variante) || variante < 0 || variante > MAX_VARIANTE) return error('invalido', 400)

  // A prova anterior precisa ser desta peça e desta vista.
  const base = baseId ? await getProva(env.CACHE, baseId) : null
  if (isCorrection && (!base || base.pecaId !== pecaId || base.vista !== view)) return error('invalido', 400)

  const fotoBytes = validImage(foto) ? await foto.arrayBuffer() : null
  const hash = await sha256(
    FITTING_VERSION,
    pecaId,
    view,
    fotoBytes ?? `base:${baseId ?? ''}`,
    correcao,
    JSON.stringify(medidas),
    String(variante),
  )
  const ok = (cached: boolean) => result({ status: 'ok', id: hash, imageUrl: `/api/imagens/${hash}`, cached })

  // 1. Cache: a mesma foto (ou correção) com as mesmas escolhas não gasta cota.
  if (await getProva(env.CACHE, hash)) return ok(true)

  // 2. Limite por IP.
  const limit = await limitByIp(env.LIMITE_PROVA, 'prova', clientIp(request), RULE)
  if (!limit.ok) return error('limite', 429, limit.retryAfter)

  // 3. Imagens de referência: foto (ou prova anterior) e a peça.
  const garment = await getCachedImage(env.CACHE, pecaId)
  const previous = baseId ? await getCachedImage(env.CACHE, baseId) : null
  if (!garment || (isCorrection && !previous)) return error('peca', 404)
  const first =
    fotoBytes && validImage(foto)
      ? new Blob([fotoBytes], { type: foto.type })
      : new Blob([previous?.bytes ?? new ArrayBuffer(0)], { type: previous?.contentType ?? 'image/jpeg' })
  const prompt = isCorrection ? buildCorrectionPrompt(correcao) : buildFittingPrompt(view, medidas)

  try {
    const bytes = await generateFittingImage(
      env,
      FITTING_MODEL,
      prompt,
      [first, new Blob([garment.bytes], { type: garment.contentType })],
      FITTING_SIZE,
      msFromEnv(env.PROVA_TIMEOUT_MS, 45_000),
    )
    await putCachedImage(env.CACHE, hash, { bytes, contentType: 'image/jpeg' }, TTL_PROVA)
    await putProva(env.CACHE, {
      id: hash,
      pecaId,
      vista: view,
      ...(baseId ? { baseId, correcao } : {}),
      criadaEm: new Date().toISOString(),
    })
    return ok(false)
  } catch (err) {
    console.error('[prova] falhou:', String(err))
    if (err instanceof TimeoutError) return error('tempo', 504)
    return error(isQuotaError(err) ? 'cota' : 'indisponivel', 503)
  }
}
