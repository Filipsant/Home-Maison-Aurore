/**
 * Cache dos resultados no Workers KV, pela chave de hash do pedido.
 * Pedidos repetidos não gastam cota. (A Cache API do Cloudflare só funciona com
 * domínio próprio; o KV funciona também no endereço gratuito workers.dev.)
 */

/** Resultados expiram em 30 dias, para o KV não crescer sem limite. */
const TTL_SECONDS = 60 * 60 * 24 * 30

interface ImageMetadata {
  contentType: string
}

export interface CachedImage {
  bytes: ArrayBuffer
  contentType: string
}

const key = (hash: string) => `img:${hash}`

export async function getCachedImage(kv: KVNamespace, hash: string): Promise<CachedImage | null> {
  const { value, metadata } = await kv.getWithMetadata<ImageMetadata>(key(hash), 'arrayBuffer')
  if (!value) return null
  return { bytes: value, contentType: metadata?.contentType ?? 'image/jpeg' }
}

export async function hasCachedImage(kv: KVNamespace, hash: string): Promise<boolean> {
  const list = await kv.list({ prefix: key(hash), limit: 1 })
  return list.keys.length > 0
}

export async function putCachedImage(kv: KVNamespace, hash: string, image: CachedImage): Promise<void> {
  await kv.put(key(hash), image.bytes, {
    expirationTtl: TTL_SECONDS,
    metadata: { contentType: image.contentType } satisfies ImageMetadata,
  })
}

/** Hash válido para a rota de imagens (64 caracteres hexadecimais). */
export function isHash(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value)
}
