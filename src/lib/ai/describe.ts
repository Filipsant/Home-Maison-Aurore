import { atelierOptions } from '@/data/atelierOptions'
import { atelierPage } from '@/data/atelierPage'
import type { PieceRequest } from '@/types/ai'
import type { AtelierOption } from '@/types/content'

const labelOf = (list: AtelierOption[], id: string) => list.find((o) => o.id === id)?.label ?? id

/** Texto alternativo da imagem gerada, em português, a partir das escolhas. */
export function altForPiece(piece: PieceRequest): string {
  const parts = [
    labelOf(atelierOptions.peca, piece.peca),
    `em ${labelOf(atelierOptions.tecido, piece.tecido).toLowerCase()}`,
    labelOf(atelierOptions.cor, piece.cor).toLowerCase(),
    `silhueta ${labelOf(atelierOptions.silhueta, piece.silhueta).toLowerCase()}`,
  ]
  return parts.join(', ')
}

/** Ficha da peça (rótulo e valor de cada campo), para o provador e o painel do ateliê. */
export function pieceSummary(piece: PieceRequest): { label: string; value: string }[] {
  const { fields } = atelierPage
  return [
    { label: fields.linha, value: labelOf(atelierOptions.linha, piece.linha) },
    { label: fields.peca, value: labelOf(atelierOptions.peca, piece.peca) },
    { label: fields.tecido, value: labelOf(atelierOptions.tecido, piece.tecido) },
    { label: fields.cor, value: labelOf(atelierOptions.cor, piece.cor) },
    { label: fields.silhueta, value: labelOf(atelierOptions.silhueta, piece.silhueta) },
    {
      label: fields.detalhes.replace(/\s*\(.*\)$/, ''),
      value: piece.detalhes.map((id) => labelOf(atelierOptions.detalhes, id)).join(', ') || '—',
    },
    { label: fields.colecao, value: labelOf(atelierOptions.colecao, piece.colecao) },
  ]
}
