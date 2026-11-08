import { useEffect } from 'react'

const SITE = 'Maison Aurore'

/** Título da aba do navegador para páginas internas ("Provador 3D, Maison Aurore"). */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title}, ${SITE}`
    return () => {
      document.title = previous
    }
  }, [title])
}
