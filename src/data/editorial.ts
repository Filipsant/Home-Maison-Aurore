import type { EditorialSection } from '@/types/content'

export const editorial: EditorialSection = {
  title: 'Vestido por',
  stories: [
    {
      id: 'paris-a-meia-luz',
      title: 'Paris à meia-luz',
      credit: 'Fotografado por [nome], em [cidade]',
      media: { caption: '[Foto editorial] Paris à meia-luz', tone: 'lilas', aspect: 3 / 4 },
      href: '#editorial',
    },
    {
      id: 'o-tempo-de-um-bordado',
      title: 'O tempo de um bordado',
      credit: 'Fotografado por [nome], em [cidade]',
      media: { caption: '[Foto editorial] O tempo de um bordado', tone: 'veludo', aspect: 4 / 5 },
      href: '#editorial',
    },
    {
      id: 'agua-linho-e-sal',
      title: 'Água, linho e sal',
      credit: 'Fotografado por [nome], em [cidade]',
      media: { caption: '[Foto editorial] Água, linho e sal', tone: 'musselina', aspect: 3 / 4 },
      href: '#editorial',
    },
  ],
  link: { label: 'Todo o editorial', href: '#editorial' },
}
