import type { PiecesSection } from '@/types/content'

/** Fotos: The Met, Costume Institute (domínio público, CC0). Ver docs/creditos-midia.md. */
export const pieces: PiecesSection = {
  title: 'Peças em destaque',
  items: [
    {
      id: 'robe-celeste',
      name: 'Robe Céleste',
      material: 'Cetim bordado à mão',
      media: {
        caption: 'Robe Céleste',
        tone: 'musselina',
        aspect: 3 / 4,
        src: '/fotos/robe-celeste.webp',
        alt: 'Vestido de baile marfim com cauda e borboletas bordadas na saia',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'cape-opaline',
      name: 'Cape Opaline',
      material: 'Seda com bordado em relevo',
      media: {
        caption: 'Cape Opaline',
        tone: 'lilas',
        aspect: 3 / 4,
        src: '/fotos/cape-opaline.webp',
        alt: 'Capa curta em seda cor de cobre com bordado preto em relevo',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
    {
      id: 'corset-aurore',
      name: 'Corset Aurore',
      material: 'Seda e renda',
      media: {
        caption: 'Corset Aurore',
        tone: 'veludo',
        aspect: 3 / 4,
        src: '/fotos/corset-aurore.webp',
        alt: 'Corset de seda bordô com renda na borda, num manequim branco',
      },
      link: { label: 'Ver peça', href: '#pecas' },
    },
  ],
  link: { label: 'Ver todas as peças', href: '#pecas' },
}
