/**
 * Único ponto de entrada do GSAP no projeto (regra 5 do PROMPT; o ESLint bloqueia
 * imports de `gsap` fora de `src/animations/`). Os plugins são registrados uma vez.
 */
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

// Barra de endereço do mobile muda a altura da tela ao rolar: não recalcular por isso.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, SplitText, useGSAP }

/** Tipo das timelines devolvidas pelos presets e pelos arquivos `*.animation.ts`. */
export type Timeline = gsap.core.Timeline
