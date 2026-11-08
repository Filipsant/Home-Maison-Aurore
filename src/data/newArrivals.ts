import type { NewArrivalsSection } from '@/types/content'

/** Fotos: The Met, Costume Institute (domínio público, CC0). Ver docs/creditos-midia.md. */
export const newArrivals: NewArrivalsSection = {
  title: 'Recém-saídas do ateliê',
  items: [
    {
      id: 'vestido-aube',
      name: 'Vestido Aube',
      material: 'Cetim de seda bordado à mão',
      media: {
        caption: 'Vestido Aube',
        tone: 'musselina',
        aspect: 4 / 5,
        src: '/fotos/vestido-aube.webp',
        alt: 'Vestido de baile rosa em cetim de seda, com espigas bordadas em dourado, num manequim',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'manteau-minuit',
      name: 'Manteau Minuit',
      material: 'Veludo de seda e renda',
      media: {
        caption: 'Manteau Minuit',
        tone: 'veludo',
        aspect: 3 / 4,
        src: '/fotos/manteau-minuit.webp',
        alt: 'Casaco de noite longo em veludo azul-noite, com gola e punhos de renda preta',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
  ],
}
