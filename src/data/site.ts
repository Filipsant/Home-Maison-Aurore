import type { Site } from '@/types/content'

export const site: Site = {
  name: 'Aurore',
  nav: [
    { id: 'colecoes', label: 'Coleções', href: '/#colecao' },
    { id: 'pecas', label: 'Peças', href: '/#pecas' },
    { id: 'editorial', label: 'Editorial', href: '/#editorial' },
    { id: 'atelie', label: 'O ateliê', href: '/#atelie' },
  ],
  bookFitting: { label: 'Agendar prova', href: '#agendar' },
  menu: {
    address: '[Endereço do ateliê], [cidade]',
    bookFitting: { label: 'Agendar uma prova', href: '#agendar' },
  },
  digital: {
    title: 'Ateliê digital',
    links: [
      { id: 'criar-peca', label: 'Criar peça', href: '/atelie-digital' },
      { id: 'provador', label: 'Provador virtual', href: '/provador' },
    ],
  },
  footer: {
    title: 'Venha provar no ateliê',
    form: {
      label: 'Deixe seu e-mail e entramos em contato para marcar um horário.',
      placeholder: 'seu@email.com',
      submit: 'Pedir horário',
      privacy: 'Ao enviar, você concorda com a política de privacidade.',
      success: 'Recebemos seu e-mail. Entraremos em contato para marcar a prova.',
    },
    // Placeholders sem `href` aparecem como texto. Ao preencher, adicione
    // `href: 'mailto:...'`, `href: 'tel:...'` ou a URL do perfil.
    columns: [
      {
        id: 'atelie',
        title: 'Ateliê',
        items: [{ label: '[Endereço do ateliê]' }, { label: '[Cidade, país]' }],
      },
      {
        id: 'contato',
        title: 'Contato',
        items: [{ label: '[E-mail]' }, { label: '[Telefone]' }],
      },
      {
        id: 'maison',
        title: 'Maison',
        items: [
          { label: 'Coleções', href: '/#colecao' },
          { label: 'O ateliê', href: '/#atelie' },
          { label: 'Editorial', href: '/#editorial' },
          { label: 'Criar peça', href: '/atelie-digital' },
          { label: 'Provador virtual', href: '/provador' },
        ],
      },
      {
        id: 'redes',
        title: 'Redes',
        items: [{ label: 'Instagram' }, { label: 'Pinterest' }],
      },
    ],
    signature: 'Aurore',
  },
}
