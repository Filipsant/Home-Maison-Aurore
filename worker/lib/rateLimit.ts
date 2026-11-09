/**
 * Rate limit simples por IP, para proteger a cota gratuita.
 * Usa o vínculo nativo do Cloudflare (`ratelimits` no wrangler.jsonc). Se ele não
 * existir (por exemplo, em testes), cai num contador em memória por janela.
 */

export interface RateLimitResult {
  ok: boolean
  /** Segundos até poder tentar de novo. */
  retryAfter: number
}

interface MemoryRule {
  limit: number
  windowSeconds: number
}

const memory = new Map<string, number[]>()

function memoryLimit(key: string, { limit, windowSeconds }: MemoryRule, now: number): RateLimitResult {
  const windowMs = windowSeconds * 1000
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now
    memory.set(key, recent)
    return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) }
  }
  recent.push(now)
  memory.set(key, recent)
  return { ok: true, retryAfter: 0 }
}

export async function limitByIp(
  binding: RateLimit | undefined,
  scope: string,
  ip: string,
  rule: MemoryRule,
  now = Date.now(),
): Promise<RateLimitResult> {
  const key = `${scope}:${ip}`
  if (binding) {
    const { success } = await binding.limit({ key })
    return { ok: success, retryAfter: success ? 0 : rule.windowSeconds }
  }
  return memoryLimit(key, rule, now)
}

/** IP de quem chamou (o Cloudflare informa no cabeçalho CF-Connecting-IP). */
export function clientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'local'
  )
}

/** Só para testes: zera o contador em memória. */
export function resetMemoryLimits() {
  memory.clear()
}
