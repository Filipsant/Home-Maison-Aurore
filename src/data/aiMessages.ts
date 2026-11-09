import type { FallbackReason } from '@/types/ai'

/** Textos da tela de IA: mensagens amigáveis para cada motivo de fallback e de espera. */
export const aiMessages = {
  fallback: {
    limite: 'Muitos pedidos em pouco tempo. Mostramos uma imagem de exemplo; tente de novo em instantes.',
    tempo:
      'O ateliê demorou mais que o esperado para responder. Mostramos uma imagem de exemplo; tente de novo.',
    cota: 'O ateliê digital atingiu o limite do dia. Mostramos uma imagem de exemplo; volte amanhã.',
    indisponivel:
      'O ateliê digital não respondeu agora. Mostramos uma imagem de exemplo; tente de novo em alguns minutos.',
    invalido: 'Não conseguimos ler esse pedido. Confira os campos e tente de novo.',
  } satisfies Record<FallbackReason, string>,
  cached: {
    peca: 'Esta peça já tinha sido criada: trouxemos a mesma imagem, sem custo.',
  },
  loading: {
    peca: 'Desenhando a peça… costuma levar alguns segundos.',
  },
} as const
