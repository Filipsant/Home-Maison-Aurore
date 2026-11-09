import type { PieceRequest } from '../../src/types/ai'
import type { ProvaInfo } from '../../src/types/prova'

/**
 * Resultados guardados no Workers KV, pela chave de hash do pedido. Pedidos
 * repetidos não gastam cota. (A Cache API do Cloudflare só funciona com domínio
 * próprio; o KV funciona também no endereço gratuito workers.dev.)
 *
 * Chaves:
 * - `img:<hash>`   a imagem (foto da peça ou prova virtual)
 * - `peca:<hash>`  as escolhas que geraram a foto da peça (30 dias)
 * - `prova:<hash>` de que peça e vista é a prova (7 dias; a foto da pessoa nunca é guardada)
 */

/** Fotos de peças expiram em 30 dias, para o KV não crescer sem limite. */
export const TTL_PECA = 60 * 60 * 24 * 30
/** Provas expiram em 7 dias: mostram a cliente, ficam o mínimo possível. */
export const TTL_PROVA = 60 * 60 * 24 * 7

/** Segundos até expirar, ou 'permanente' (peças e provas que viraram pedido). */
export type Ttl = number | 'permanente'

interface ImageMetadata {
  contentType: string
}

export interface CachedImage {
  bytes: ArrayBuffer
  contentType: string
}

const imageKey = (hash: string) => `img:${hash}`
const pieceKey = (hash: string) => `peca:${hash}`
const provaKey = (hash: string) => `prova:${hash}`

const expiry = (ttl: Ttl) => (ttl === 'permanente' ? {} : { expirationTtl: ttl })

export async function getCachedImage(kv: KVNamespace, hash: string): Promise<CachedImage | null> {
  const { value, metadata } = await kv.getWithMetadata<ImageMetadata>(imageKey(hash), 'arrayBuffer')
  if (!value) return null
  return { bytes: value, contentType: metadata?.contentType ?? 'image/jpeg' }
}

export async function putCachedImage(
  kv: KVNamespace,
  hash: string,
  image: CachedImage,
  ttl: Ttl = TTL_PECA,
): Promise<void> {
  await kv.put(imageKey(hash), image.bytes, {
    ...expiry(ttl),
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
  ttl: Ttl = TTL_PECA,
): Promise<void> {
  await kv.put(pieceKey(hash), JSON.stringify(piece), expiry(ttl))
}

export async function getProva(kv: KVNamespace, hash: string): Promise<ProvaInfo | null> {
  return kv.get<ProvaInfo>(provaKey(hash), 'json')
}

export async function putProva(kv: KVNamespace, info: ProvaInfo, ttl: Ttl = TTL_PROVA): Promise<void> {
  await kv.put(provaKey(info.id), JSON.stringify(info), expiry(ttl))
}

/** Tira o prazo de validade da imagem (e das escolhas): a peça virou pedido e não pode sumir. */
export async function keepPiece(kv: KVNamespace, hash: string, piece: PieceRequest): Promise<void> {
  const image = await getCachedImage(kv, hash)
  if (image) await putCachedImage(kv, hash, image, 'permanente')
  await putPiece(kv, hash, piece, 'permanente')
}

/** Idem para uma prova enviada junto com o pedido. */
export async function keepProva(kv: KVNamespace, info: ProvaInfo): Promise<void> {
  const image = await getCachedImage(kv, info.id)
  if (image) await putCachedImage(kv, info.id, image, 'permanente')
  await putProva(kv, info, 'permanente')
}

/** Hash válido para a rota de imagens (64 caracteres hexadecimais). */
export function isHash(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}
