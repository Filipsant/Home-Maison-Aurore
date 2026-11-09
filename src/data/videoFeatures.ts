import type { VideoFeaturesSection } from '@/types/content'

/** Vídeos: Pexels (licença livre). Ver docs/creditos-midia.md. */
export const videoFeatures: VideoFeaturesSection = {
  title: 'Filmes do ateliê',
  items: [
    {
      id: 'feito-a-mao',
      title: 'Feito à mão no ateliê',
      link: { label: 'Como uma peça é feita', href: '#atelie' },
      media: {
        caption: 'Bastidores do ateliê',
        tone: 'veludo',
        aspect: 4 / 5,
        videoSrc: '/videos/atelie-bastidores.mp4',
        videoWebm: '/videos/atelie-bastidores.webm',
        poster: '/videos/poster-atelie.webp',
        alt: 'Vídeo: mãos ajustando a fita métrica num manequim de costura cor de musselina',
      },
    },
    {
      id: 'beleza-do-essencial',
      title: 'A beleza do essencial',
      link: { label: 'Conhecer a cápsula Terre', href: '#colecao' },
      media: {
        caption: 'Cápsula Terre',
        tone: 'musselina',
        aspect: 4 / 5,
        videoSrc: '/videos/capsula-terre.mp4',
        videoWebm: '/videos/capsula-terre.webm',
        poster: '/videos/poster-terre.webp',
        alt: 'Vídeo: modelo de vestido branco com mangas amplas desfilando entre capins secos',
      },
    },
  ],
}
