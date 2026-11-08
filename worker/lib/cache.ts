import type { PieceRequest } from '../../src/types/ai'

/**
 * Cache dos resultados no Workers KV, pela chave de hash do pedido.
 * Pedidos repetidos não gastam cota. (A Cache API do Cloudflare só funciona com
 * domínio próprio; o KV funciona também no endereço gratuito workers.dev.)
 *
 * Chaves: `img:<hash>` (a foto) e `peca:<hash>` (as escolhas que geraram a foto,
 * para o provador 3D e para o pedido).
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

const imageKey = (hash: string) => `img:${hash}`
const pieceKey = (hash: string) => `peca:${hash}`

/** `permanent`: sem prazo de validade (peças que viraram pedido). */
const expiry = (permanent: boolean) => (permanent ? {} : { expirationTtl: TTL_SECONDS })

export async function getCachedImage(kv: KVNamespace, hash: string): Promise<CachedImage | null> {
  const { value, metadata } = await kv.getWithMetadata<ImageMetadata>(imageKey(hash), 'arrayBuffer')
  if (!value) return null
  return { bytes: value, contentType: metadata?.contentType ?? 'image/jpeg' }
}

export async function putCachedImage(
  kv: KVNamespace,
  hash: string,
  image: CachedImage,
  permanent = false,
): Promise<void> {
  await kv.put(imageKey(hash), image.bytes, {
    ...expiry(permanent),
    metadata: { contentType: image.contentType } satisfies ImageMetadata,
  })
}

export async function getPiece(kv: KVNamespace, hash: string): Promise<PieceRequest | null> {
  return kv.get<PieceRequest>(pieceKey(hash), 'json')
}

export async function putPiece(
  kv: KVNamespace,
  hash: string,
  piece: PieceRequest,
  permanent = false,
): Promise<void> {
  await kv.put(pieceKey(hash), JSON.stringify(piece), expiry(permanent))
}

/** Tira o prazo de validade da foto e das escolhas: a peça virou pedido e não pode sumir. */
export async function keepPiece(kv: KVNamespace, hash: string, piece: PieceRequest): Promise<void> {
  const image = await getCachedImage(kv, hash)
  if (image) await putCachedImage(kv, hash, image, true)
  await putPiece(kv, hash, piece, true)
}

/** Hash válido para a rota de imagens (64 caracteres hexadecimais). */
export function isHash(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value)
}
