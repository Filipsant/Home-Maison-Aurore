import type { ArtProject } from '@/types/content'

export const artProject: ArtProject = {
  title: 'Arquivo Aurore',
  text: 'Um livro com croquis, toiles e fotografias de bastidores, que mostra o processo por trás de cada coleção, do primeiro traço à passarela.',
  cta: { label: 'Conhecer o livro', href: '#arquivo' },
  // Foto: Pexels (licença livre). Ver docs/creditos-midia.md.
  media: {
    caption: 'Páginas do livro',
    tone: 'veludo-2',
    aspect: 16 / 9,
    src: '/fotos/arquivo-livro.webp',
    alt: 'Mãos folheando um lookbook sobre uma mesa escura, ao lado de um caderno',
  },
}
