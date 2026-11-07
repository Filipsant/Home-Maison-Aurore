import type { Hero } from '@/types/content'

export const hero: Hero = {
  title: 'Lumière',
  support: 'Alta costura, primavera-verão 2027. Da primeira toile à última prova.',
  paragraphs: [
    'Organzas de seda sobrepostas e bordados que só aparecem em movimento. Cada vestido começa em musselina crua e passa por centenas de horas no ateliê antes de chegar a quem vai usá-lo.',
    'Nada é apressado: das primeiras toiles à última prova, cada peça é ajustada até pertencer a uma única pessoa.',
  ],
  cta: { label: 'Ver a coleção', href: '#colecao' },
  finalPiece: {
    caption: '[Foto ou vídeo] Vestido Lumière, peça final',
    tone: 'veludo',
    aspect: 2,
  },
  toile: {
    caption: 'Toile em musselina, prova 1',
    tone: 'musselina',
    aspect: 2,
  },
}
