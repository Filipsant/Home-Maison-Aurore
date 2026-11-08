import type { ProvaErro, ProvaVista } from '@/types/prova'

/** Textos da página "Provador virtual" (prova com IA + medidas + pedido ao ateliê). */
export const provadorPage = {
  title: 'Provador virtual',
  lead: 'Envie fotos suas de frente, de costas e de lado. A inteligência artificial veste em você a peça que você criou no ateliê digital, com as suas medidas. Se algo sair diferente, peça a correção com as suas palavras.',
  loading: 'Buscando a sua peça…',
  missing: {
    title: 'Primeiro, crie a sua peça',
    text: 'O provador veste em você a peça que você desenhou no ateliê digital. Escolha a linha, o tecido e os detalhes, e volte aqui com ela.',
    link: { label: 'Criar uma peça', href: '/atelie-digital' },
  },
  piece: {
    title: 'Sua peça',
    photoAlt: 'Fotografia da peça gerada por IA',
    adjust: 'Ajustar a peça',
    change: { label: 'Criar outra peça', href: '/atelie-digital' },
  },
  photos: {
    title: 'Suas fotos',
    note: 'Corpo inteiro, em pé, com roupas justas (legging e regata, por exemplo), fundo liso e boa luz. A foto de frente é obrigatória; costas e lado são opcionais.',
    views: {
      frente: { label: 'Frente', hint: 'De frente, braços soltos.' },
      costas: { label: 'Costas', hint: 'De costas, mesma pose.' },
      lado: { label: 'Lado', hint: 'De perfil, braços soltos.' },
    } satisfies Record<ProvaVista, { label: string; hint: string }>,
    invalidFile: 'Use uma imagem JPG, PNG ou WebP.',
    privacy:
      'As fotos vão ao Cloudflare Workers AI só para gerar a prova e não ficam guardadas. As provas geradas ficam 7 dias no site, ou com o ateliê se você enviar o pedido.',
    consent: 'As fotos são minhas e tenho 18 anos ou mais.',
  },
  measures: {
    title: 'Suas medidas',
    note: 'Em centímetros. Ajudam a IA a deixar a prova mais fiel ao seu corpo e são obrigatórias para enviar o pedido. Use uma fita métrica sobre roupas leves.',
  },
  generate: {
    submit: 'Gerar prova',
    again: 'Gerar de novo com as fotos atuais',
    loading: 'Vestindo a peça em você… costuma levar menos de 15 segundos.',
    empty: 'Sua prova aparece aqui.',
    resultAlt: (vista: string) => `Prova virtual gerada por IA, vista de ${vista}`,
  },
  correction: {
    label: 'O que precisa mudar?',
    hint: 'Ex.: "manga até o punho", "barra no tornozelo", "lapela mais larga". Mude uma coisa por vez.',
    submit: 'Aplicar correção',
    undo: 'Voltar à versão anterior',
    version: (current: number, total: number) => `Versão ${current} de ${total}`,
    applied: (text: string) => `Correção: ${text}`,
  },
  contact: {
    title: 'Enviar ao ateliê',
    note: 'O ateliê recebe a peça, as medidas e as provas que você gerou (a última versão de cada vista).',
    nome: 'Nome',
    email: 'E-mail',
    telefone: 'WhatsApp ou telefone (opcional)',
    observacoes: 'Observações (opcional)',
    observacoesHint: 'Data do evento, ajustes que você imagina, dúvidas.',
    consentimento:
      'Autorizo a Maison Aurore a guardar estas medidas, as provas e meus dados de contato para fazer a peça e falar comigo sobre ela.',
  },
  submit: 'Enviar ao ateliê',
  sending: 'Enviando…',
  success: {
    title: 'Pedido recebido',
    text: (codigo: string) =>
      `O ateliê recebeu o pedido ${codigo} e vai responder por e-mail para combinar a primeira prova.`,
    again: 'Criar outra peça',
  },
  fittingErrors: {
    invalido: 'Não conseguimos ler esse pedido. Confira as fotos (JPG, PNG ou WebP, até 5 MB) e as medidas.',
    peca: 'Esta peça expirou no ateliê digital. Crie a peça de novo e volte ao provador.',
    correcao:
      'Não podemos aplicar essa correção. Peça mudanças na roupa (corte, comprimento, cor, detalhes), sem mudar a pessoa.',
    limite: 'Muitas provas em pouco tempo. Espere um minuto e tente de novo.',
    tempo: 'A IA demorou mais que o esperado. Tente de novo.',
    cota: 'O provador atingiu o limite do dia. Volte amanhã.',
    indisponivel: 'A IA não respondeu agora. Tente de novo em alguns minutos.',
  } satisfies Record<ProvaErro, string>,
  errors: {
    required: 'Preencha este campo.',
    range: (min: number, max: number) => `Use um valor entre ${min} e ${max} cm.`,
    email: 'Confira o e-mail (ex.: nome@email.com).',
    nome: 'Escreva seu nome (até 80 letras).',
    telefone: 'Use só números, espaços, +, ( ) e -.',
    observacoes: 'Use até 500 caracteres.',
    consentimento: 'Precisamos da sua autorização para guardar as medidas.',
    fotoFrente: 'Escolha a foto de frente.',
    fotosConsentimento: 'Confirme que as fotos são suas e que você tem 18 anos ou mais.',
    correcaoVazia: 'Escreva o que precisa mudar.',
    provas: 'Uma das provas expirou. Gere a prova de novo antes de enviar.',
    summary: 'Confira os campos marcados.',
    limite: 'Muitos envios em pouco tempo. Espere um minuto e tente de novo.',
    peca: 'Não encontramos esta peça no ateliê. Crie a peça de novo e volte ao provador.',
    indisponivel: 'O ateliê não respondeu agora. Suas medidas continuam aqui; tente de novo em instantes.',
  },
}
