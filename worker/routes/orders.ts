import { isPieceId, validateOrder } from '../../src/lib/orders/validate'
import type { AtelierLinha } from '../../src/types/content'
import type { Order, OrderResult } from '../../src/types/order'
import { checkAtelierPassword } from '../lib/auth'
import { getPiece, keepPiece } from '../lib/cache'
import { jsonError } from '../lib/http'
import { clientIp, limitByIp } from '../lib/rateLimit'

/**
 * Pedidos sob medida, guardados no KV (`pedido:<id>`), sem prazo de validade.
 * O id começa pelo tempo "invertido": a listagem do KV (em ordem alfabética)
 * já vem do pedido mais novo para o mais antigo.
 */

/** Regras do contador em memória (o vínculo nativo usa as do wrangler.jsonc). */
const ORDER_RULE = { limit: 3, windowSeconds: 60 }
const PANEL_RULE = { limit: 10, windowSeconds: 60 }

const MAX_TIME = 9_999_999_999_999
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ORDER_ID = /^\d{13}-[A-Z2-9]{6}$/

const orderKey = (id: string) => `pedido:${id}`

function newOrderId(now: number): { id: string; codigo: string } {
  const random = crypto.getRandomValues(new Uint8Array(6))
  const code = [...random].map((n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join('')
  const inverted = String(MAX_TIME - now).padStart(13, '0')
  return { id: `${inverted}-${code}`, codigo: `AUR-${code}` }
}

const result = (body: OrderResult, status = 200) => Response.json(body, { status })

/** POST /api/pedidos — a cliente envia a peça, as medidas e o contato. */
export async function handleCreateOrder(request: Request, env: Env, now = Date.now()): Promise<Response> {
  const body: unknown = await request.json().catch(() => null)
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

  // Campo-isca preenchido: é robô. Responde como se tivesse dado certo e não guarda nada.
  if (typeof b.site === 'string' && b.site.trim()) {
    return result({ status: 'ok', codigo: newOrderId(now).codigo })
  }

  const limit = await limitByIp(env.LIMITE_PEDIDO, 'pedido', clientIp(request), ORDER_RULE, now)
  if (!limit.ok) return result({ status: 'erro', motivo: 'limite' }, 429)

  // A linha (e portanto as medidas pedidas) vem da peça guardada, não do navegador.
  const piece = isPieceId(b.pecaId) ? await getPiece(env.CACHE, b.pecaId) : null
  if (!piece) return result({ status: 'erro', motivo: 'peca' }, 404)

  const linha: AtelierLinha = piece.linha === 'masculina' ? 'masculina' : 'feminina'
  const validation = validateOrder(body, linha)
  if (!validation.ok) return result({ status: 'erro', motivo: 'invalido', erros: validation.errors }, 400)

  const { id, codigo } = newOrderId(now)
  const order: Order = {
    id,
    codigo,
    criadoEm: new Date(now).toISOString(),
    ...validation.value,
    peca: piece,
  }
  try {
    await env.CACHE.put(orderKey(id), JSON.stringify(order))
    await keepPiece(env.CACHE, validation.value.pecaId, piece)
  } catch (error) {
    console.error('[pedido] falhou ao guardar:', String(error))
    return result({ status: 'erro', motivo: 'indisponivel' }, 503)
  }
  return result({ status: 'ok', codigo })
}

/** Senha e limite de tentativas do painel. Devolve a resposta de erro, ou null se pode seguir. */
async function guardPanel(request: Request, env: Env): Promise<Response | null> {
  const limit = await limitByIp(env.LIMITE_PAINEL, 'painel', clientIp(request), PANEL_RULE)
  if (!limit.ok) return jsonError(429, 'Muitas tentativas')
  const auth = await checkAtelierPassword(request, env.ATELIE_SENHA)
  if (auth === 'sem-senha') return jsonError(503, 'Painel sem senha configurada')
  if (auth === 'negado') return jsonError(401, 'Senha incorreta')
  return null
}

/** GET /api/pedidos — painel do ateliê: os 100 pedidos mais novos. */
export async function handleListOrders(request: Request, env: Env): Promise<Response> {
  const denied = await guardPanel(request, env)
  if (denied) return denied

  const list = await env.CACHE.list({ prefix: 'pedido:', limit: 100 })
  const orders = await Promise.all(list.keys.map((k) => env.CACHE.get<Order>(k.name, 'json')))
  return Response.json(
    { pedidos: orders.filter((o): o is Order => o !== null) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

/** DELETE /api/pedidos/:id — o ateliê apaga um pedido (e os dados pessoais dele). */
export async function handleDeleteOrder(request: Request, env: Env, id: string): Promise<Response> {
  const denied = await guardPanel(request, env)
  if (denied) return denied
  if (!ORDER_ID.test(id)) return jsonError(400, 'Pedido inválido')
  await env.CACHE.delete(orderKey(id))
  return new Response(null, { status: 204 })
}
