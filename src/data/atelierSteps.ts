import type { AtelierStep } from '@/types/content'

/**
 * As 4 etapas do ateliê (Figma: "O ateliê — Como uma peça é feita").
 * Não entram na home (a Sigma não tem bloco equivalente); ficam prontas
 * para uma futura página "O ateliê".
 */
export const atelierSteps: AtelierStep[] = [
  {
    id: 'desenhar',
    title: 'Desenhar',
    description: 'O croqui define a silhueta, o movimento e os tecidos.',
    media: { caption: '[Vídeo] Croqui', tone: 'musselina', aspect: 1 },
  },
  {
    id: 'moldar',
    title: 'Moldar',
    description: 'A toile em musselina é moldada direto no manequim.',
    media: { caption: '[Vídeo] Moulage', tone: 'lilas', aspect: 1 },
  },
  {
    id: 'bordar',
    title: 'Bordar',
    description: 'Pérolas, fios de seda e plumas aplicados ponto a ponto.',
    media: { caption: '[Vídeo] Bordado', tone: 'veludo', aspect: 1 },
  },
  {
    id: 'provar',
    title: 'Provar',
    description: 'Ajustes sucessivos até a peça vestir uma só pessoa.',
    media: { caption: '[Vídeo] Prova', tone: 'musselina', aspect: 1 },
  },
]
