import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiResult } from '@/types/ai'
import { useAiRequest } from './useAiRequest'

const ok: AiResult = { status: 'ok', id: 'x', imageUrl: '/api/imagens/x', cached: false }

describe('useAiRequest (estados das telas de IA)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ocioso → carregando com segundos decorridos → pronto', async () => {
    let resolve: (r: AiResult) => void = () => undefined
    const request = vi.fn(() => new Promise<AiResult>((r) => (resolve = r)))
    const { result } = renderHook(() => useAiRequest(request))
    expect(result.current.state).toEqual({ phase: 'idle' })

    act(() => {
      void result.current.run('pedido')
    })
    expect(result.current.state).toEqual({ phase: 'loading', elapsed: 0 })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.state).toEqual({ phase: 'loading', elapsed: 3 })

    await act(async () => {
      resolve(ok)
      await Promise.resolve()
    })
    expect(result.current.state).toEqual({ phase: 'done', result: ok })
  })

  it('um pedido novo cancela o anterior (o antigo não sobrescreve o resultado)', async () => {
    const signals: AbortSignal[] = []
    const resolvers: ((r: AiResult) => void)[] = []
    const request = vi.fn(
      (_: string, signal: AbortSignal) =>
        new Promise<AiResult>((r) => {
          signals.push(signal)
          resolvers.push(r)
        }),
    )
    const { result } = renderHook(() => useAiRequest(request))
    act(() => {
      void result.current.run('primeiro')
    })
    act(() => {
      void result.current.run('segundo')
    })
    expect(signals[0]?.aborted).toBe(true)

    await act(async () => {
      resolvers[0]?.({ ...ok, id: 'antigo' })
      resolvers[1]?.({ ...ok, id: 'novo' })
      await Promise.resolve()
    })
    const state = result.current.state
    expect(state.phase === 'done' && state.result.status === 'ok' && state.result.id).toBe('novo')
  })

  it('reset volta ao estado inicial', () => {
    const { result } = renderHook(() => useAiRequest(() => new Promise<AiResult>(() => undefined)))
    act(() => {
      void result.current.run('x')
    })
    act(() => result.current.reset())
    expect(result.current.state).toEqual({ phase: 'idle' })
  })
})
