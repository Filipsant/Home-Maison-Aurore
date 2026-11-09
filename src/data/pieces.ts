import type { PiecesSection } from '@/types/content'

/** Fotos: Pexels (licença livre). Ver docs/creditos-midia.md. */
export const pieces: PiecesSection = {
  title: 'Peças em destaque',
  items: [
    {
      id: 'robe-celeste',
      name: 'Robe Céleste',
      material: 'Crepe de seda',
      media: {
        caption: 'Robe Céleste',
        tone: 'musselina',
        aspect: 3 / 4,
        src: '/fotos/robe-celeste.webp',
        alt: 'Mulher de vestido longo bordô com decote frente-única numa rua de prédios clássicos',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'cape-opaline',
      name: 'Cape Opaline',
      material: 'Gabardine de algodão',
      media: {
        caption: 'Cape Opaline',
        tone: 'lilas',
        aspect: 3 / 4,
        src: '/fotos/cape-opaline.webp',
        alt: 'Mulher de capa branca ampla sobre calça preta, diante de um prédio moderno',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'corset-aurore',
      name: 'Corset Aurore',
      material: 'Cetim com barbatanas',
      media: {
        caption: 'Corset Aurore',
        tone: 'veludo',
        aspect: 3 / 4,
        src: '/fotos/corset-aurore.webp',
        alt: 'Mulher de corset preto amarrado na frente e saia xadrez, encostada numa vitrine',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
  ],
  link: { label: 'Ver todas as peças', href: '#pecas' },
}
