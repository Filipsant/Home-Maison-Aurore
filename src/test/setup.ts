import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/**
 * jsdom não implementa `matchMedia`, `IntersectionObserver` nem `ResizeObserver`.
 * Os simuladores abaixo permitem trocar a preferência de movimento por teste:
 * `setReducedMotion(true)`.
 */
let reducedMotion = false

export function setReducedMotion(value: boolean) {
  reducedMotion = value
}

/** Responde às consultas usadas no projeto como um navegador de desktop sem toque. */
function matchesQuery(query: string): boolean {
  if (query.includes('prefers-reduced-motion: reduce')) return reducedMotion
  if (query.includes('prefers-reduced-motion: no-preference')) return !reducedMotion
  if (query.includes('hover') || query.includes('pointer')) return false
  const minWidth = /min-width:\s*(\d+)px/.exec(query)
  if (minWidth?.[1]) return window.innerWidth >= Number(minWidth[1])
  return false
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn((query: string) => ({
    matches: matchesQuery(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })),
})

class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

// jsdom não rola a página: scrollIntoView vira uma função vazia.
Element.prototype.scrollIntoView = vi.fn()

Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: ObserverStub })
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ObserverStub })

afterEach(() => {
  cleanup()
  reducedMotion = false
})
