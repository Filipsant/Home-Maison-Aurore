import type { VideoFeaturesSection } from '@/types/content'

export const videoFeatures: VideoFeaturesSection = {
  title: 'Filmes do ateliê',
  items: [
    {
      id: 'feito-a-mao',
      title: 'Feito à mão no ateliê',
      link: { label: 'Como uma peça é feita', href: '#atelie' },
      media: { caption: '[Vídeo] bastidores do ateliê', tone: 'veludo', aspect: 4 / 5 },
    },
    {
      id: 'beleza-do-essencial',
      title: 'A beleza do essencial',
      link: { label: 'Conhecer a cápsula Terre', href: '#colecao' },
      media: { caption: '[Vídeo] cápsula Terre', tone: 'musselina', aspect: 4 / 5 },
    },
  ],
}
