import type { EditorialSection } from '@/types/content'

/** Fotos: Pexels (licença livre) e The Met (CC0). Ver docs/creditos-midia.md. */
export const editorial: EditorialSection = {
  title: 'Vestido por',
  stories: [
    {
      id: 'paris-a-meia-luz',
      title: 'Paris à meia-luz',
      credit: 'Fotografado por Davis Vidal',
      media: {
        caption: 'Paris à meia-luz',
        tone: 'lilas',
        aspect: 3 / 4,
        src: '/fotos/editorial-paris.webp',
        alt: 'Mulher com vestido de gala vermelho bordado sob arcadas iluminadas, à noite',
      },
      href: '#editorial',
    },
    {
      id: 'o-tempo-de-um-bordado',
      title: 'O tempo de um bordado',
      credit: 'Detalhe de vestido da House of Worth, 1898. Acervo The Met',
      media: {
        caption: 'O tempo de um bordado',
        tone: 'veludo',
        aspect: 4 / 5,
        src: '/fotos/editorial-bordado.webp',
        alt: 'Detalhe de borboletas bordadas sobre cetim marfim',
      },
      href: '#editorial',
    },
    {
      id: 'agua-linho-e-sal',
      title: 'Água, linho e sal',
      credit: 'Fotografia do acervo Pexels',
      media: {
        caption: 'Água, linho e sal',
        tone: 'musselina',
        aspect: 3 / 4,
        src: '/fotos/editorial-linho.webp',
        alt: 'Mulher de perfil com vestido de linho cinza, em luz suave',
      },
      href: '#editorial',
    },
  ],
  link: { label: 'Todo o editorial', href: '#editorial' },
}
