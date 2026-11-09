import type { Hero } from '@/types/content'

/** Fotos e vídeos: fontes e licenças em docs/creditos-midia.md. */
export const hero: Hero = {
  title: 'Lumière',
  support: 'Alta costura, primavera-verão 2027. Da primeira toile à última prova.',
  paragraphs: [
    'Organzas de seda sobrepostas e bordados que só aparecem em movimento. Cada vestido começa em musselina crua e passa por centenas de horas no ateliê antes de chegar a quem vai usá-lo.',
    'Nada é apressado: das primeiras toiles à última prova, cada peça é ajustada até pertencer a uma única pessoa.',
  ],
  cta: { label: 'Ver a coleção', href: '#colecao' },
  finalPiece: {
    caption: 'Trench Lumière, peça final',
    tone: 'veludo',
    aspect: 2,
    videoSrc: '/videos/hero-lumiere.mp4',
    videoWebm: '/videos/hero-lumiere.webm',
    poster: '/videos/poster-hero.webp',
    alt: 'Vídeo: mulher de trench coat bege e calça ampla caminhando sob uma colunata de pedra',
  },
  // Camada de baixo: outra modelo caminhando ao mesmo tempo que a do Trench Lumière.
  toile: {
    caption: 'Manteau Écorce, peça final',
    tone: 'musselina',
    aspect: 2,
    videoSrc: '/videos/hero-ecorce.mp4',
    videoWebm: '/videos/hero-ecorce.webm',
    poster: '/videos/poster-ecorce.webp',
    alt: 'Vídeo: mulher de óculos e casaco longo cor de oliva caminhando entre colunas brancas',
  },
  videoLabels: { play: 'Reproduzir vídeos', pause: 'Pausar vídeos' },
}
