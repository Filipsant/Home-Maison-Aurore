import type { NewArrivalsSection } from '@/types/content'

export const newArrivals: NewArrivalsSection = {
  title: 'Recém-saídas do ateliê',
  items: [
    {
      id: 'vestido-aube',
      name: 'Vestido Aube',
      material: 'Organza de seda',
      media: { caption: '[Foto] Vestido Aube', tone: 'musselina', aspect: 4 / 5 },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'tailleur-minuit',
      name: 'Tailleur Minuit',
      material: 'Grain de poudre',
      media: { caption: '[Foto] Tailleur Minuit', tone: 'veludo', aspect: 3 / 4 },
      link: { label: 'Ver peça', href: '#pecas' },
    },
  ],
}
