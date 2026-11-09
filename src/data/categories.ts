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
      // Pexels (licença livre).
      gallery: gallery('Alta costura', 'musselina', [
        ['alta-costura-1', 'Mulher de casaco de couro bordô numa alameda de Paris no outono'],
        ['alta-costura-2', 'Mulher de vestido de veludo bordô e óculos escuros'],
        ['alta-costura-3', 'Mulher de trench coat de couro bordô brilhante'],
        ['alta-costura-4', 'Mulher de casaco marrom e roupa de couro numa escadaria'],
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
      description: 'Bolsas, sapatos e botas que completam a silhueta.',
      link: { label: 'Ler mais', href: '#colecao' },
      // Pexels (licença livre).
      gallery: gallery('Acessórios', 'lilas', [
        ['acessorios-1', 'Bolsa de couro bordô e escarpim de bico fino sobre madeira'],
        ['acessorios-2', 'Mão segurando uma bolsa de couro marrom com corrente'],
        ['acessorios-3', 'Botas de couro marrom com fivelas'],
        ['acessorios-4', 'Casaco escuro e bolsa de couro marrom a tiracolo'],
      ]),
    },
  ],
}
