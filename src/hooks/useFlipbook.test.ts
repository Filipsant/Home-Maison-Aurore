import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFlipbook } from './useFlipbook'

describe('useFlipbook (troca de imagens no hover)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('alterna as imagens em loop a cada intervalo enquanto o hover dura', () => {
    const { result } = renderHook(() => useFlipbook(4, 150, true))
    expect(result.current.index).toBe(0)

    act(() => result.current.start())
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current.index).toBe(1)
    act(() => {
      vi.advanceTimersByTime(150 * 3)
    })
    expect(result.current.index).toBe(0) // deu a volta: 1 → 2 → 3 → 0
  })

  it('ao sair do hover, para e volta à primeira imagem', () => {
    const { result } = renderHook(() => useFlipbook(4, 150, true))
    act(() => result.current.start())
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.index).toBe(2)

    act(() => result.current.stop())
    expect(result.current.index).toBe(0)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(result.current.index).toBe(0)
  })

  it('não faz nada quando desligado (celular, toque ou movimento reduzido)', () => {
    const { result } = renderHook(() => useFlipbook(4, 150, false))
    act(() => result.current.start())
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(result.current.index).toBe(0)
  })

  it('não faz nada com uma imagem só', () => {
    const { result } = renderHook(() => useFlipbook(1, 150, true))
    act(() => result.current.start())
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(result.current.index).toBe(0)
  })

  it('start repetido não acelera a troca', () => {
    const { result } = renderHook(() => useFlipbook(4, 150, true))
    act(() => {
      result.current.start()
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current.index).toBe(1)
  })
})
