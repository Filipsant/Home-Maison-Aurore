/** Textos do painel de pedidos do ateliê (/atelie/pedidos). */
export const ordersPanel = {
  title: 'Pedidos do ateliê',
  lead: 'Pedidos sob medida enviados pelo provador 3D, do mais novo para o mais antigo.',
  login: {
    label: 'Senha do ateliê',
    submit: 'Entrar',
    wrong: 'Senha incorreta.',
    notConfigured: 'O painel ainda não tem senha. Configure ATELIE_SENHA no Worker (veja o README).',
    limite: 'Muitas tentativas. Espere um minuto.',
    error: 'Não foi possível falar com o Worker agora.',
  },
  empty: 'Nenhum pedido ainda.',
  refresh: 'Atualizar',
  logout: 'Sair',
  order: {
    received: 'Recebido em',
    contact: 'Contato',
    piece: 'Peça',
    measures: 'Medidas (cm)',
    notes: 'Observações',
    photoAlt: 'Peça gerada por IA para o pedido',
    remove: 'Apagar pedido',
    confirmRemove: 'Apagar este pedido de vez? As medidas e os dados de contato somem.',
  },
}
