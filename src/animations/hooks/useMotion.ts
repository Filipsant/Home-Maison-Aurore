import { createContext, useContext } from 'react'
import type Lenis from 'lenis'

export interface MotionState {
  /** Fontes carregadas: as animações de texto podem medir as linhas. */
  ready: boolean
  /** Instância do smooth scroll (nula com movimento reduzido). */
  getLenis: () => Lenis | null
}

export const MotionContext = createContext<MotionState>({ ready: true, getLenis: () => null })

export function useMotion(): MotionState {
  return useContext(MotionContext)
}
