import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function getSnapshot() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(QUERY).matches
  )
}

/** `true` quando o sistema pede movimento reduzido. Reage a mudanças em tempo real. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
