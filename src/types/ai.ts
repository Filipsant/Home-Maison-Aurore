/**
 * Contrato da API de IA, compartilhado entre o front-end (src/) e o Worker (worker/).
 */

/** Campos do formulário "Criar peça" (ids de `src/data/atelierOptions.ts`). */
export interface PieceRequest {
  /** "feminina" ou "masculina": define o modelo da foto e as opções válidas. */
  linha: string
  peca: string
  tecido: string
  cor: string
  silhueta: string
  detalhes: string[]
  colecao: string
  /** 0 = primeira versão; incrementar gera outra imagem para os mesmos campos. */
  variante?: number
}

/** Por que a IA não respondeu e o exemplo foi mostrado no lugar. */
export type FallbackReason = 'limite' | 'tempo' | 'cota' | 'indisponivel' | 'invalido'

export interface AiResultOk {
  status: 'ok'
  /** Endereço da imagem gerada (servida pelo Worker a partir do cache). */
  imageUrl: string
  /** Identificador do resultado (hash); serve para levar a peça ao provador. */
  id: string
  /** A resposta veio do cache, sem gastar cota. */
  cached: boolean
}

export interface AiResultFallback {
  status: 'fallback'
  /** Imagem de exemplo pré-gerada. */
  imageUrl: string
  reason: FallbackReason
  /** Segundos até poder tentar de novo (quando `reason` é "limite"). */
  retryAfter?: number
}

export type AiResult = AiResultOk | AiResultFallback
