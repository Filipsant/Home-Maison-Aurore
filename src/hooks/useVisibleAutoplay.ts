import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { playWhenReady } from '@/lib/media'

/**
 * Vídeo em loop que toca só enquanto está na tela e não foi pausado
 * (pela pessoa ou pela preferência de movimento reduzido).
 *
 * Decide a cada medição do IntersectionObserver, direto no elemento, sem esperar
 * um novo render; medições de elemento ainda sem tamanho (altura 0, comuns na
 * montagem) são ignoradas, para não pausar o vídeo por engano.
 */
export function useVisibleAutoplay(
  videoRef: RefObject<HTMLVideoElement | null>,
  targetRef: RefObject<Element | null>,
  paused: boolean,
  onRefused: () => void,
  threshold = 0,
) {
  const visible = useRef(false)
  const pausedNow = useRef(true)
  const stop = useRef<() => void>(() => undefined)
  const refused = useRef(onRefused)

  useEffect(() => {
    refused.current = onRefused
  }, [onRefused])

  const sync = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    stop.current()
    stop.current = () => undefined
    if (visible.current && !pausedNow.current) {
      stop.current = playWhenReady(video, () => refused.current())
    } else {
      video.pause()
    }
  }, [videoRef])

  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.boundingClientRect.height === 0) return
        visible.current = entry.isIntersecting
        sync()
      },
      { threshold },
    )
    io.observe(target)
    return () => {
      io.disconnect()
      stop.current()
    }
  }, [targetRef, threshold, sync])

  useEffect(() => {
    pausedNow.current = paused
    sync()
  }, [paused, sync])
}
