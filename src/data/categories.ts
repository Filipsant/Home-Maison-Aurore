import type { CategoriesSection, Media, Tone } from '@/types/content'

/** Galeria de cada categoria: 4 fotos que se alternam no hover. Fontes em docs/creditos-midia.md. */
const gallery = (name: string, tone: Tone, photos: [string, string][]): Media[] =>
  photos.map(([file, alt], i) => ({
    caption: `${name}, foto ${i + 1}`,
    tone,
    aspect: 3 / 4,
    src: `/fotos/${file}.webp`,
    alt,
  }))

export const categories: CategoriesSection = {
  title: 'Categorias',
  items: [
    {
      id: 'alta-costura',
      name: 'Alta costura',
      description: 'Peças únicas, feitas sob medida em provas privadas.',
      link: { label: 'Ler mais', href: '#colecao' },
      // The Met, Costume Institute (CC0).
      gallery: gallery('Alta costura', 'veludo', [
        ['alta-costura-1', 'Vestido de baile verde-água com franjas douradas e cauda, num manequim'],
        ['alta-costura-2', 'Vestido de baile marfim em brocado, visto de costas, com cauda longa'],
        ['alta-costura-3', 'Casaco de noite longo com flores pretas sobre fundo branco'],
        ['alta-costura-4', 'Capa curta roxa bordada com pérolas e franjas, sobre saia marfim'],
      ]),
    },
    {
      id: 'pret-a-porter',
      name: 'Prêt-à-porter',
      description: 'A linguagem da maison em séries limitadas.',
      link: { label: 'Ler mais', href: '#colecao' },
      // Pexels (licença livre).
      gallery: gallery('Prêt-à-porter', 'musselina', [
        ['pret-a-porter-1', 'Mulher de vestido vermelho e casaco bege caminhando numa rua de pedra'],
        ['pret-a-porter-2', 'Mulher de casaco caramelo e chapéu preto diante de uma porta antiga'],
        ['pret-a-porter-3', 'Mulher de trench coat marfim e botas pretas numa avenida'],
        ['pret-a-porter-4', 'Mulher de casaco caramelo e botas de cano alto numa praça de prédios brancos'],
      ]),
    },
    {
      id: 'acessorios',
      name: 'Acessórios',
      description: 'Sapatos, leques e bolsas que completam a silhueta.',
      link: { label: 'Ler mais', href: '#colecao' },
      // The Met (CC0).
      gallery: gallery('Acessórios', 'lilas', [
        ['acessorios-1', 'Sapato de cetim marfim com laço e flores bordadas'],
        ['acessorios-2', 'Par de escarpins de cetim bordô com laços'],
        ['acessorios-3', 'Leque de marfim recortado, com flores pintadas no centro'],
        ['acessorios-4', 'Bolsa de festa bordada com contas prateadas e franjas'],
      ]),
    },
  ],
}
