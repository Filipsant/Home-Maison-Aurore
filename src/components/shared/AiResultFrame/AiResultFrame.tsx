import { useEffect, useRef, type ReactNode } from 'react'
import { useReducedMotion } from '@/animations/hooks'
import { aiMessages } from '@/data/aiMessages'
import type { AiRequestState } from '@/hooks/useAiRequest'
import { apiUrl } from '@/lib/ai/client'

interface AiResultFrameProps {
  state: AiRequestState
  emptyText: string
  /** Texto quando o resultado veio do cache (sem gastar cota). */
  cachedText: string
  /** Texto enquanto carrega (pode depender dos segundos decorridos). */
  loadingText: (elapsed: number) => string
  /** Aviso fixo durante a espera (por exemplo, sobre a fila do provador). */
  waitNote?: string
  alt: string
  /** Ações depois do resultado (gerar outra versão, provar, tentar de novo). */
  actions?: ReactNode
}

/**
 * Moldura do resultado de IA: vazio, carregando, resultado ou exemplo.
 * O texto de estado fica numa região `role="status"`, anunciada a leitores de tela.
 */
export function AiResultFrame({
  state,
  emptyText,
  cachedText,
  loadingText,
  waitNote,
  alt,
  actions,
}: AiResultFrameProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const loading = state.phase === 'loading'

  // No celular a moldura fica abaixo do formulário: traz ela para a tela quando o pedido começa.
  // No desktop ela já está visível (fixa ao lado) e nada se move.
  useEffect(() => {
    if (loading) ref.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
  }, [loading, reduced])

  const result = state.phase === 'done' ? state.result : null
  const status =
    state.phase === 'loading'
      ? `${loadingText(state.elapsed)} ${state.elapsed}s`
      : result?.status === 'fallback'
        ? aiMessages.fallback[result.reason]
        : result?.status === 'ok' && result.cached
          ? cachedText
          : ''

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <div
        aria-busy={state.phase === 'loading'}
        className="relative flex aspect-3/4 items-center justify-center overflow-hidden bg-musselina"
      >
        {state.phase === 'idle' && (
          <p className="px-6 text-center text-caption text-texto-suave">{emptyText}</p>
        )}
        {state.phase === 'loading' && (
          <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-lilas" />
        )}
        {result && (
          <img
            src={apiUrl(result.imageUrl)}
            alt={result.status === 'ok' ? alt : ''}
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </div>
      <p role="status" className="min-h-6 text-caption text-texto-corpo">
        {status}
      </p>
      {state.phase === 'loading' && waitNote && <p className="text-caption text-texto-suave">{waitNote}</p>}
      {actions && state.phase === 'done' && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
