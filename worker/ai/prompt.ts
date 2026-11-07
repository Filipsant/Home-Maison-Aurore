import { atelierOptions, MAX_DETALHES } from '../../src/data/atelierOptions'
import type { PieceRequest } from '../../src/types/ai'
import type { AtelierOption } from '../../src/types/content'

/** Versão do modelo de prompt: mudar o texto abaixo exige subir este número (invalida o cache). */
export const PROMPT_VERSION = 'peca-v1'

/** Máximo de versões diferentes para os mesmos campos ("gerar outra versão"). */
export const MAX_VARIANTE = 9

const find = (list: AtelierOption[], id: unknown) =>
  typeof id === 'string' ? list.find((option) => option.id === id) : undefined

/**
 * Valida o corpo do pedido contra o catálogo. Devolve `null` se algum campo
 * não existir: o Worker nunca repassa texto livre ao modelo.
 */
export function parsePieceRequest(body: unknown): PieceRequest | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const peca = find(atelierOptions.peca, b.peca)
  const tecido = find(atelierOptions.tecido, b.tecido)
  const cor = find(atelierOptions.cor, b.cor)
  const silhueta = find(atelierOptions.silhueta, b.silhueta)
  const colecao = find(atelierOptions.colecao, b.colecao)
  if (!peca || !tecido || !cor || !silhueta || !colecao) return null

  const rawDetalhes = Array.isArray(b.detalhes) ? b.detalhes : []
  if (rawDetalhes.length > MAX_DETALHES) return null
  const detalhes = rawDetalhes.map((id) => find(atelierOptions.detalhes, id))
  if (detalhes.some((d) => !d)) return null

  const variante = b.variante === undefined ? 0 : Number(b.variante)
  if (!Number.isInteger(variante) || variante < 0 || variante > MAX_VARIANTE) return null

  return {
    peca: peca.id,
    tecido: tecido.id,
    cor: cor.id,
    silhueta: silhueta.id,
    // Ordem fixa e sem repetição: os mesmos detalhes em outra ordem dão o mesmo resultado (e o mesmo cache).
    detalhes: [...new Set(detalhes.map((d) => d?.id ?? ''))].sort(),
    colecao: colecao.id,
    variante,
  }
}

const joinList = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`

/**
 * Prompt em inglês, otimizado para fotografia de moda de alta costura.
 * Recebe um pedido já validado por `parsePieceRequest`.
 */
export function buildPiecePrompt(req: PieceRequest): string {
  const label = (list: AtelierOption[], id: string) => find(list, id)?.prompt ?? ''
  const detalhes = req.detalhes.map((id) => label(atelierOptions.detalhes, id))

  return [
    'Haute couture fashion editorial photograph.',
    `A model wearing a ${label(atelierOptions.cor, req.cor)} ${label(atelierOptions.peca, req.peca)}`,
    `with a ${label(atelierOptions.silhueta, req.silhueta)}, made of ${label(atelierOptions.tecido, req.tecido)}`,
    detalhes.length ? `featuring ${joinList(detalhes)}.` : '.',
    `Mood: ${label(atelierOptions.colecao, req.colecao)}.`,
    'Full-length view, elegant natural pose, minimalist Parisian atelier backdrop in warm grey,',
    'soft directional window light, medium format photography, 85mm lens, shallow depth of field,',
    'crisp fabric texture and visible couture craftsmanship, refined luxury fashion magazine aesthetic, photorealistic.',
    'No text, no logos, no watermark.',
  ]
    .join(' ')
    .replace(/\s+\./g, '.')
}
