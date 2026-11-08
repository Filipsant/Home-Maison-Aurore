import type { PieceRequest } from './ai'

/**
 * Contrato dos pedidos sob medida, compartilhado entre a tela (src/) e o Worker (worker/).
 */

/** Uma medida do corpo, em centímetros. */
export interface MeasureField {
  id: string
  label: string
  min: number
  max: number
  /** Valor típico: aparece como exemplo no campo e veste o manequim enquanto o campo está vazio. */
  typical: number
  /** Como medir, em uma frase. */
  hint: string
}

export interface OrderContact {
  nome: string
  email: string
  /** Opcional (WhatsApp ou telefone). */
  telefone: string
  /** Opcional. */
  observacoes: string
}

/** O que a tela envia em POST /api/pedidos. */
export interface OrderRequest extends OrderContact {
  /** Id (hash) da peça criada no ateliê digital. */
  pecaId: string
  /** Medidas em cm, pelos ids de `src/data/measurements.ts` (da linha da peça). */
  medidas: Record<string, number>
  consentimento: boolean
  /** Campo-isca contra robôs: fica escondido, pessoas não preenchem. */
  site?: string
}

/** Pedido guardado: é o que o ateliê vê no painel. */
export interface Order extends OrderContact {
  id: string
  /** Código curto para a cliente citar (ex.: "AUR-7K3F9Q"). */
  codigo: string
  /** Data e hora em ISO 8601. */
  criadoEm: string
  pecaId: string
  peca: PieceRequest
  medidas: Record<string, number>
}

/** Erros de validação por campo (`medidas.<id>` para as medidas). */
export type OrderErrors = Partial<Record<string, string>>

export type OrderResult =
  | { status: 'ok'; codigo: string }
  | { status: 'erro'; motivo: 'invalido' | 'limite' | 'peca' | 'indisponivel'; erros?: OrderErrors }
