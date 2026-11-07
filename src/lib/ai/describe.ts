import { atelierOptions } from '@/data/atelierOptions'
import type { PieceRequest } from '@/types/ai'
import type { AtelierOption } from '@/types/content'

const promptOf = (list: AtelierOption[], id: string) => list.find((o) => o.id === id)?.prompt ?? ''

/**
 * Descrição curta da peça em inglês, para o provador (o modelo entende melhor inglês).
 * Ex.: "ivory haute couture evening gown in layered silk organza".
 */
export function describePiece(piece: PieceRequest): string {
  const color = promptOf(atelierOptions.cor, piece.cor)
  const garment = promptOf(atelierOptions.peca, piece.peca)
  const fabric = promptOf(atelierOptions.tecido, piece.tecido)
  return `${color} ${garment} in ${fabric}`.replace(/\s+/g, ' ').trim().slice(0, 120)
}

/** Texto alternativo da imagem gerada, em português, a partir das escolhas. */
export function altForPiece(piece: PieceRequest): string {
  const label = (list: AtelierOption[], id: string) => list.find((o) => o.id === id)?.label ?? ''
  const parts = [
    label(atelierOptions.peca, piece.peca),
    `em ${label(atelierOptions.tecido, piece.tecido).toLowerCase()}`,
    label(atelierOptions.cor, piece.cor).toLowerCase(),
    `silhueta ${label(atelierOptions.silhueta, piece.silhueta).toLowerCase()}`,
  ]
  return parts.join(', ')
}
