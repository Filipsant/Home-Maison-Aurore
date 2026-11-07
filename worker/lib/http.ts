import type { AiResult, FallbackReason } from '../../src/types/ai'

/** Imagens de exemplo pré-geradas (em public/exemplos), mostradas quando a IA falha. */
export const FALLBACK_IMAGES = {
  peca: '/exemplos/peca.jpg',
  pecaMasculina: '/exemplos/peca-masculina.jpg',
  provador: '/exemplos/provador.jpg',
} as const

/** Resposta de fallback: status 200 para a tela tratar como resultado, com o motivo. */
export function fallback(
  kind: keyof typeof FALLBACK_IMAGES,
  reason: FallbackReason,
  extra: { retryAfter?: number; status?: number } = {},
): Response {
  const body: AiResult = {
    status: 'fallback',
    imageUrl: FALLBACK_IMAGES[kind],
    reason,
    retryAfter: extra.retryAfter,
  }
  const headers: HeadersInit = extra.retryAfter ? { 'Retry-After': String(extra.retryAfter) } : {}
  return Response.json(body, { status: extra.status ?? 200, headers })
}

/**
 * Origem permitida: o próprio site (mesma origem) ou uma da lista ALLOWED_ORIGINS.
 * Pedidos sem Origin (curl, testes) passam, mas continuam sujeitos ao rate limit.
 */
export function isAllowedOrigin(request: Request, allowedList: string | undefined): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  if (origin === new URL(request.url).origin) return true
  const allowed = (allowedList ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return allowed.includes(origin)
}

/** Cabeçalhos CORS para uma origem de outra lista (quando o site e a API estão em domínios diferentes). */
export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin')
  if (!origin || origin === new URL(request.url).origin) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export function withHeaders(response: Response, headers: HeadersInit): Response {
  const copy = new Response(response.body, response)
  for (const [k, v] of Object.entries(headers)) copy.headers.set(k, v as string)
  return copy
}

export function jsonError(status: number, message: string): Response {
  return Response.json({ erro: message }, { status })
}
