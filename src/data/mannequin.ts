import type { MannequinLook } from '@/types/mannequin'

/**
 * Como cada id do catálogo (`src/data/atelierOptions.ts`) aparece no manequim 3D.
 * As cores são as dos tecidos (conteúdo), não do tema: por isso ficam aqui.
 * O manequim, a camisa e o fundo usam as cores do tema (globals.css).
 */
export const mannequinLook: MannequinLook = {
  colors: {
    marfim: '#efe8da',
    champanhe: '#e2cda9',
    preto: '#19181c',
    'azul-noite': '#1f2944',
    lilas: '#b6adc4',
    terracota: '#a95f45',
  },
  fabrics: {
    organza: { roughness: 0.45, sheen: 0.6, opacity: 0.62 },
    crepe: { roughness: 0.85, sheen: 0.3, opacity: 1 },
    tule: { roughness: 0.9, sheen: 0.2, opacity: 0.45 },
    'grain-de-poudre': { roughness: 0.7, sheen: 0.15, opacity: 1 },
    'la-fria': { roughness: 0.8, sheen: 0.1, opacity: 1 },
    veludo: { roughness: 1, sheen: 1, opacity: 1 },
    musselina: { roughness: 0.95, sheen: 0, opacity: 1 },
  },
  pieces: {
    vestido: { top: 'tomaraQueCaia', bottom: 'saiaLonga' },
    tailleur: { top: 'casaco', bottom: 'saiaMidi' },
    capa: { top: 'tomaraQueCaia', bottom: 'saiaLonga', cape: true },
    corset: { top: 'corset', bottom: 'saiaLonga' },
    robe: { top: 'mangaLonga', bottom: 'saiaLonga' },
    smoking: { top: 'paleto', bottom: 'calca', neck: 'gravataBorboleta' },
    terno: { top: 'paleto', bottom: 'calca', neck: 'gravata' },
    sobretudo: { top: 'sobretudo', bottom: 'calca', neck: 'gravata' },
    casaca: { top: 'casaca', bottom: 'calca', neck: 'gravataBorboleta' },
    'capa-alfaiataria': { top: 'paleto', bottom: 'calca', neck: 'gravata', cape: true },
  },
  silhouettes: {
    coluna: { skirt: 'coluna', ease: 1, shoulders: 0 },
    sereia: { skirt: 'sereia', ease: 0.8, shoulders: 0 },
    evase: { skirt: 'evase', ease: 1, shoulders: 0 },
    ampla: { skirt: 'ampla', ease: 1, shoulders: 0 },
    ajustada: { skirt: 'ajustada', ease: 0.6, shoulders: 0 },
    reta: { skirt: 'coluna', ease: 1.1, shoulders: 0 },
    'ombros-marcados': { skirt: 'coluna', ease: 1, shoulders: 0.025 },
    oversized: { skirt: 'evase', ease: 2.2, shoulders: 0.015 },
  },
  details: {
    bordado: 'bordado',
    plumas: 'plumas',
    perolas: 'perolas',
    drapeado: 'drapeado',
    plissado: 'plissado',
    'lapela-cetim': 'lapela',
    'botoes-madreperola': 'botoes',
    pesponto: 'nenhum',
  },
  collections: {
    lumiere: { key: 2.4, keyColor: '#fff3e2', fill: 0.5, ambient: 0.8, dark: false },
    nocturne: { key: 3, keyColor: '#e6e2ff', fill: 0.15, ambient: 0.3, dark: true },
    'atelier-blanc': { key: 1.7, keyColor: '#ffffff', fill: 0.8, ambient: 1.2, dark: false },
    terre: { key: 2.2, keyColor: '#ffe2c4', fill: 0.4, ambient: 0.7, dark: false },
  },
  pearl: '#f3eee4',
  embroidery: '#d6c08f',
}
