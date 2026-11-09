import { useCallback, useEffect, useRef, useState } from 'react'
import type { AiResult } from '@/types/ai'

export type AiRequestState =
  { phase: 'idle' } | { phase: 'loading'; elapsed: number } | { phase: 'done'; result: AiResult }

/**
 * Estado de um pedido à API de IA: ocioso → carregando (com segundos decorridos,
 * para a tela avisar sobre a fila) → pronto (resultado real ou de exemplo).
 * Cancela o pedido anterior se outro começar e ao desmontar.
 */
export function useAiRequest<TArgs>(request: (args: TArgs, signal: AbortSignal) => Promise<AiResult>) {
  const [state, setState] = useState<AiRequestState>({ phase: 'idle' })
  const controller = useRef<AbortController | null>(null)
  const timer = useRef<number | null>(null)

  const stopTimer = () => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
  }

  const run = useCallback(
    async (args: TArgs) => {
      controller.current?.abort()
      stopTimer()
      const current = new AbortController()
      controller.current = current

      const started = Date.now()
      setState({ phase: 'loading', elapsed: 0 })
      timer.current = window.setInterval(() => {
        setState({ phase: 'loading', elapsed: Math.floor((Date.now() - started) / 1000) })
      }, 1000)

      try {
        const result = await request(args, current.signal)
        if (!current.signal.aborted) setState({ phase: 'done', result })
      } catch {
        // Cancelado: um pedido mais novo assumiu ou o componente saiu da tela.
      } finally {
        if (controller.current === current) stopTimer()
      }
    },
    [request],
  )

  /** Mostra um resultado que já existe (ex.: peça reaberta pelo endereço), sem chamar a API. */
  const show = useCallback((result: AiResult) => {
    controller.current?.abort()
    stopTimer()
    setState({ phase: 'done', result })
  }, [])

  const reset = useCallback(() => {
    controller.current?.abort()
    stopTimer()
    setState({ phase: 'idle' })
  }, [])

  useEffect(
    () => () => {
      controller.current?.abort()
      stopTimer()
    },
    [],
  )

  return { state, run, show, reset }
}
