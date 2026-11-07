import type { PiecesSection } from '@/types/content'

export const pieces: PiecesSection = {
  title: 'Peças em destaque',
  items: [
    {
      id: 'robe-celeste',
      name: 'Robe Céleste',
      material: 'Organza bordada à mão',
      media: { caption: '[Foto] Robe Céleste', tone: 'musselina', aspect: 3 / 4 },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'cape-opaline',
      name: 'Cape Opaline',
      material: 'Plumas sobre tule de seda',
      media: { caption: '[Foto] Cape Opaline', tone: 'lilas', aspect: 3 / 4 },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'corset-aurore',
      name: 'Corset Aurore',
      material: 'Moulage em crepe',
      media: { caption: '[Foto] Corset Aurore', tone: 'veludo', aspect: 3 / 4 },
      link: { label: 'Ver peça', href: '#pecas' },
    },
  ],
  link: { label: 'Ver todas as peças', href: '#pecas' },
}
