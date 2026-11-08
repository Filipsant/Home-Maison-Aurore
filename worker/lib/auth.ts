/**
 * Senha do painel do ateliê. Fica só no Worker (`ATELIE_SENHA`: .env em
 * desenvolvimento, `wrangler secret put` em produção); o navegador manda a senha
 * digitada no cabeçalho `Authorization: Bearer <senha>` a cada pedido.
 */

export type AuthResult = 'ok' | 'sem-senha' | 'negado'

const encoder = new TextEncoder()

/** Compara em tempo constante: o tempo de resposta não revela quantas letras acertou. */
async function sameSecret(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  const va = new Uint8Array(ha)
  const vb = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < va.length; i++) diff |= (va[i] ?? 0) ^ (vb[i] ?? 0)
  return diff === 0
}

export async function checkAtelierPassword(
  request: Request,
  secret: string | undefined,
): Promise<AuthResult> {
  const expected = secret?.trim()
  if (!expected) return 'sem-senha'
  const header = request.headers.get('Authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  if (!given) return 'negado'
  return (await sameSecret(given, expected)) ? 'ok' : 'negado'
}
