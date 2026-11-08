/** Textos da página "Provador 3D" (peça do ateliê digital + medidas + pedido). */
export const provadorPage = {
  title: 'Provador 3D',
  lead: 'Sua peça num manequim 3D com as suas medidas. Gire o manequim, ajuste as medidas e envie o pedido: o ateliê entra em contato para a primeira prova.',
  loading: 'Buscando a sua peça…',
  missing: {
    title: 'Primeiro, crie a sua peça',
    text: 'O provador 3D veste a peça que você desenhou no ateliê digital. Escolha a linha, o tecido e os detalhes, e volte aqui com ela.',
    link: { label: 'Criar uma peça', href: '/atelie-digital' },
  },
  piece: {
    title: 'Sua peça',
    photoAlt: 'Fotografia da peça gerada por IA',
    change: { label: 'Criar outra peça', href: '/atelie-digital' },
  },
  viewer: {
    label: 'Manequim 3D',
    hint: 'Arraste para girar. O manequim muda conforme as medidas.',
    turnLeft: 'Girar para a esquerda',
    turnRight: 'Girar para a direita',
    front: 'Frente',
    back: 'Costas',
    loading: 'Montando o manequim…',
    noWebgl:
      'Este navegador não consegue mostrar o 3D. Tudo bem: as medidas e o pedido funcionam do mesmo jeito.',
    /** Início do texto alternativo do manequim (o resto é montado com a peça e as medidas). */
    altPrefix: 'Manequim 3D vestindo',
  },
  measures: {
    title: 'Suas medidas',
    note: 'Em centímetros. Use uma fita métrica sobre roupas leves; se puder, peça ajuda a alguém.',
  },
  contact: {
    title: 'Seus dados',
    nome: 'Nome',
    email: 'E-mail',
    telefone: 'WhatsApp ou telefone (opcional)',
    observacoes: 'Observações (opcional)',
    observacoesHint: 'Data do evento, ajustes que você imagina, dúvidas.',
    consentimento:
      'Autorizo a Maison Aurore a guardar estas medidas e dados de contato para fazer a peça e falar comigo sobre ela.',
  },
  submit: 'Enviar ao ateliê',
  sending: 'Enviando…',
  success: {
    title: 'Pedido recebido',
    text: (codigo: string) =>
      `O ateliê recebeu o pedido ${codigo} e vai responder por e-mail para combinar a primeira prova.`,
    again: 'Criar outra peça',
  },
  errors: {
    required: 'Preencha este campo.',
    range: (min: number, max: number) => `Use um valor entre ${min} e ${max} cm.`,
    email: 'Confira o e-mail (ex.: nome@email.com).',
    nome: 'Escreva seu nome (até 80 letras).',
    telefone: 'Use só números, espaços, +, ( ) e -.',
    observacoes: 'Use até 500 caracteres.',
    consentimento: 'Precisamos da sua autorização para guardar as medidas.',
    summary: 'Confira os campos marcados.',
    limite: 'Muitos envios em pouco tempo. Espere um minuto e tente de novo.',
    peca: 'Não encontramos esta peça no ateliê. Crie a peça de novo e volte ao provador.',
    indisponivel: 'O ateliê não respondeu agora. Suas medidas continuam aqui; tente de novo em instantes.',
  },
}
