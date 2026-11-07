import type { FallbackReason } from '@/types/ai'

/** Textos das telas de IA: mensagens amigáveis para cada motivo de fallback e de espera. */
export const aiMessages = {
  fallback: {
    limite: 'Muitos pedidos em pouco tempo. Mostramos uma imagem de exemplo; tente de novo em instantes.',
    tempo:
      'O ateliê demorou mais que o esperado para responder. Mostramos uma imagem de exemplo; tente de novo.',
    cota: 'O ateliê digital atingiu o limite do dia. Mostramos uma imagem de exemplo; volte amanhã.',
    indisponivel:
      'O ateliê digital não respondeu agora. Mostramos uma imagem de exemplo; tente de novo em alguns minutos.',
    invalido: 'Não conseguimos ler esse pedido. Confira os campos e as fotos e tente de novo.',
  } satisfies Record<FallbackReason, string>,
  cached: {
    peca: 'Esta peça já tinha sido criada: trouxemos a mesma imagem, sem custo.',
    provador: 'Esta prova já tinha sido feita: trouxemos o mesmo resultado, sem custo.',
  },
  loading: {
    peca: 'Desenhando a peça… costuma levar alguns segundos.',
    provador: [
      'Enviando as fotos ao provador…',
      'Na fila do provador. Pode levar até 2 minutos quando há muita gente usando.',
      'Ajustando a peça ao corpo…',
    ],
  },
} as const

/** Mensagem do provador conforme o tempo de espera (segundos). */
export function tryOnLoadingMessage(elapsed: number): string {
  const steps = aiMessages.loading.provador
  if (elapsed < 5) return steps[0]
  if (elapsed < 45) return steps[1]
  return steps[2]
}
