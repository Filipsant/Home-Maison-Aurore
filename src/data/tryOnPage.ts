/** Textos da página "Provador virtual". */
export const tryOnPage = {
  title: 'Provador virtual',
  lead: 'Envie uma foto sua, de corpo inteiro e de frente, e uma foto da peça. O provador veste a peça em você.',
  privacy:
    'As fotos são enviadas a um serviço público do Hugging Face para processamento. Use apenas fotos suas ou com autorização.',
  person: {
    label: 'Sua foto',
    hint: 'Corpo inteiro, de frente, fundo simples. JPG, PNG ou WebP.',
  },
  garment: {
    label: 'Foto da peça',
    hint: 'A peça sozinha, de frente, sem pessoa. JPG, PNG ou WebP.',
    fromAtelier: 'Peça criada no ateliê digital',
    change: 'Usar outra foto',
  },
  submit: 'Provar',
  retry: 'Tentar de novo',
  wait: 'O provador pode levar até 2 minutos: ele usa uma fila pública de GPU.',
  empty: 'O resultado aparece aqui.',
  resultAlt: 'Resultado do provador virtual',
  missing: 'Escolha as duas fotos para provar.',
  invalidFile: 'Use uma imagem JPG, PNG ou WebP.',
  createLink: { label: 'Criar uma peça no ateliê digital', href: '/atelie-digital' },
}
