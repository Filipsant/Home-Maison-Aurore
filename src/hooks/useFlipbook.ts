import { useCallback, useEffect, useRef, useState } from 'react'

export interface Flipbook {
  /** Imagem visível. Volta a 0 quando o hover termina. */
  index: number
  start: () => void
  stop: () => void
}

/**
 * Folioscópio do hover (E35 do estudo): enquanto o ponteiro está sobre o card,
 * as imagens se alternam em loop a cada `intervalMs`. Desligado quando `enabled` é falso
 * (mobile, toque ou movimento reduzido) ou quando há menos de duas imagens.
 */
export function useFlipbook(length: number, intervalMs: number, enabled: boolean): Flipbook {
  const [index, setIndex] = useState(0)
  const timer = useRef<number | null>(null)

  const clear = () => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
  }

  const start = useCallback(() => {
    if (!enabled || length < 2 || timer.current !== null) return
    timer.current = window.setInterval(() => setIndex((i) => (i + 1) % length), intervalMs)
  }, [enabled, length, intervalMs])

  const stop = useCallback(() => {
    clear()
    setIndex(0)
  }, [])

  // Se o hover deixar de valer (por exemplo, a tela encolheu), para o loop.
  useEffect(() => {
    if (!enabled) clear()
  }, [enabled])

  useEffect(() => clear, [])

  return { index: enabled ? index : 0, start, stop }
}
