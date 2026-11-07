import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useMenuController } from './useMenu'

describe('useMenuController', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('começa fechado', () => {
    const { result } = renderHook(() => useMenuController())
    expect(result.current.status).toBe('closed')
    expect(result.current.isOpen).toBe(false)
  })

  it('abre em duas etapas: "opening" até a animação terminar, depois "open"', () => {
    const { result } = renderHook(() => useMenuController())
    act(() => result.current.open())
    expect(result.current.status).toBe('opening')
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.finishOpen())
    expect(result.current.status).toBe('open')
  })

  it('só desmonta (isOpen falso) quando a animação de fechar avisa o fim', () => {
    const { result } = renderHook(() => useMenuController())
    act(() => result.current.open())
    act(() => result.current.finishOpen())
    act(() => result.current.close())
    expect(result.current.status).toBe('closing')
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.finishClose())
    expect(result.current.status).toBe('closed')
    expect(result.current.isOpen).toBe(false)
  })

  it('toggle alterna entre abrir e fechar, inclusive no meio da animação', () => {
    const { result } = renderHook(() => useMenuController())
    act(() => result.current.toggle())
    expect(result.current.status).toBe('opening')
    act(() => result.current.toggle())
    expect(result.current.status).toBe('closing')
    act(() => result.current.toggle())
    expect(result.current.status).toBe('opening')
  })

  it('ignora avisos fora de hora (finishClose com o menu aberto não fecha)', () => {
    const { result } = renderHook(() => useMenuController())
    act(() => result.current.open())
    act(() => result.current.finishOpen())
    act(() => result.current.finishClose())
    expect(result.current.status).toBe('open')
  })

  it('closeAndGo fecha e só depois segue para a âncora', () => {
    const { result } = renderHook(() => useMenuController())
    act(() => result.current.open())
    act(() => result.current.finishOpen())
    act(() => result.current.closeAndGo('#editorial'))
    expect(window.location.hash).toBe('')
    act(() => result.current.finishClose())
    expect(window.location.hash).toBe('#editorial')
  })
})
