import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { holdIntro } from '@/animations/intro'
import { App } from '@/app/App'
import '@/styles/globals.css'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado')

holdIntro()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
