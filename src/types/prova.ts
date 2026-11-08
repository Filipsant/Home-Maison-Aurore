/**
 * Contrato da prova virtual com IA (POST /api/provas), compartilhado entre a
 * tela (src/) e o Worker (worker/).
 */

/** De que lado a foto do corpo foi tirada (e de que lado a prova é gerada). */
export type ProvaVista = 'frente' | 'costas' | 'lado'

export const PROVA_VISTAS: readonly ProvaVista[] = ['frente', 'costas', 'lado']

/** Por que a prova não foi gerada. */
export type ProvaErro =
  | 'invalido' // campos ou foto fora do formato
  | 'peca' // a peça do ateliê digital não existe mais
  | 'correcao' // pedido de correção recusado pelo filtro
  | 'limite' // muitos pedidos por minuto
  | 'tempo' // a IA demorou demais
  | 'cota' // cota gratuita do dia acabou
  | 'indisponivel' // a IA não respondeu

export type ProvaResult =
  | { status: 'ok'; id: string; imageUrl: string; cached: boolean }
  | { status: 'erro'; motivo: ProvaErro; retryAfter?: number }

/** O que o Worker guarda de cada prova (sem a foto da pessoa, que nunca é guardada). */
export interface ProvaInfo {
  id: string
  pecaId: string
  vista: ProvaVista
  /** Prova anterior, quando esta é uma correção. */
  baseId?: string
  correcao?: string
  criadaEm: string
}
