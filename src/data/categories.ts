import type { CategoriesSection, Media, Tone } from '@/types/content'

/** Galeria de placeholders: cada categoria alterna 4 imagens no hover. */
const gallery = (name: string, tones: [Tone, Tone, Tone, Tone]): Media[] =>
  tones.map((tone, i) => ({ caption: `[Foto ${i + 1}] ${name}`, tone, aspect: 3 / 4 }))

export const categories: CategoriesSection = {
  title: 'Categorias',
  items: [
    {
      id: 'alta-costura',
      name: 'Alta costura',
      description: 'Peças únicas, feitas sob medida em provas privadas.',
      link: { label: 'Ler mais', href: '#colecao' },
      gallery: gallery('Alta costura', ['veludo', 'veludo-2', 'veludo', 'veludo-2']),
    },
    {
      id: 'pret-a-porter',
      name: 'Prêt-à-porter',
      description: 'A linguagem da maison em séries limitadas.',
      link: { label: 'Ler mais', href: '#colecao' },
      gallery: gallery('Prêt-à-porter', ['musselina', 'lilas', 'musselina', 'lilas']),
    },
    {
      id: 'acessorios',
      name: 'Acessórios',
      description: 'Bolsas, luvas e chapéus que completam a silhueta.',
      link: { label: 'Ler mais', href: '#colecao' },
      gallery: gallery('Acessórios', ['lilas', 'musselina', 'lilas', 'musselina']),
    },
  ],
}
