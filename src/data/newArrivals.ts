import type { NewArrivalsSection } from '@/types/content'

/** Fotos: Pexels (licença livre). Ver docs/creditos-midia.md. */
export const newArrivals: NewArrivalsSection = {
  title: 'Recém-saídas do ateliê',
  items: [
    {
      id: 'vestido-aube',
      name: 'Vestido Aube',
      material: 'Cetim de seda',
      media: {
        caption: 'Vestido Aube',
        tone: 'musselina',
        aspect: 4 / 5,
        src: '/fotos/vestido-aube.webp',
        alt: 'Vestido longo de cetim marrom, de alças finas, diante de uma balaustrada de pedra à noite',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'manteau-minuit',
      name: 'Manteau Minuit',
      material: 'Lã fria',
      media: {
        caption: 'Manteau Minuit',
        tone: 'veludo',
        aspect: 3 / 4,
        src: '/fotos/manteau-minuit.webp',
        alt: 'Mulher de casaco longo marrom-escuro e óculos escuros, encostada numa parede',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
  ],
}
