import type Lenis from 'lenis'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MotionContext, useReducedMotion } from '@/animations/hooks'
import { releaseIntro } from '@/animations/intro'
import { createSmoothScroll, refreshScroll, waitForFonts } from '@/animations/smoothScroll'
import { intro } from '@/animations/tokens'

/**
 * Registra o GSAP (via `@/animations/gsap`), liga o smooth scroll e avisa as seções
 * quando as fontes estão prontas. Com movimento reduzido, não há smooth scroll.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(false)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    let alive = true
    void waitForFonts().then(() => {
      if (alive) setReady(true)
    })
    const failsafe = window.setTimeout(releaseIntro, intro.failsafeMs)
    return () => {
      alive = false
      window.clearTimeout(failsafe)
    }
  }, [])

  useEffect(() => {
    if (reduced) {
      releaseIntro()
      return
    }
    const smooth = createSmoothScroll()
    lenisRef.current = smooth.lenis
    return () => {
      smooth.destroy()
      lenisRef.current = null
    }
  }, [reduced])

  // Depois que as seções criaram seus gatilhos, e de novo quando as imagens carregarem.
  useEffect(() => {
    if (!ready) return
    refreshScroll()
    window.addEventListener('load', refreshScroll)
    return () => window.removeEventListener('load', refreshScroll)
  }, [ready])

  const value = useMemo(() => ({ ready, getLenis: () => lenisRef.current }), [ready])
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}
