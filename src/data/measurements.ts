import type { AtelierLinha } from '@/types/content'
import type { MeasureField } from '@/types/order'

/**
 * Medidas pedidas em cada linha, em centímetros. Usadas pela tela (formulário e
 * manequim 3D) e pelo Worker (validação). Os limites cortam erros de digitação,
 * não corpos: são largos de propósito.
 */
export const measurements: Record<AtelierLinha, MeasureField[]> = {
  feminina: [
    {
      id: 'altura',
      label: 'Altura',
      min: 130,
      max: 210,
      typical: 168,
      hint: 'Descalça, de costas para a parede, do chão ao topo da cabeça.',
    },
    {
      id: 'busto',
      label: 'Busto',
      min: 65,
      max: 160,
      typical: 88,
      hint: 'Na parte mais cheia do busto, com a fita reta nas costas.',
    },
    {
      id: 'cintura',
      label: 'Cintura',
      min: 45,
      max: 160,
      typical: 68,
      hint: 'Na parte mais fina do tronco, um pouco acima do umbigo.',
    },
    {
      id: 'quadril',
      label: 'Quadril',
      min: 70,
      max: 170,
      typical: 96,
      hint: 'Na parte mais larga do quadril, com os pés juntos.',
    },
    {
      id: 'ombros',
      label: 'Ombros',
      min: 28,
      max: 56,
      typical: 38,
      hint: 'De uma ponta do ombro à outra, pelas costas.',
    },
    {
      id: 'braco',
      label: 'Comprimento do braço',
      min: 40,
      max: 80,
      typical: 58,
      hint: 'Da ponta do ombro ao osso do pulso, com o braço solto.',
    },
  ],
  masculina: [
    {
      id: 'altura',
      label: 'Altura',
      min: 140,
      max: 215,
      typical: 178,
      hint: 'Descalço, de costas para a parede, do chão ao topo da cabeça.',
    },
    {
      id: 'torax',
      label: 'Tórax',
      min: 75,
      max: 160,
      typical: 98,
      hint: 'Na parte mais larga do peito, logo abaixo das axilas.',
    },
    {
      id: 'cintura',
      label: 'Cintura',
      min: 55,
      max: 165,
      typical: 84,
      hint: 'Na altura do umbigo, onde a calça costuma ficar.',
    },
    {
      id: 'quadril',
      label: 'Quadril',
      min: 75,
      max: 170,
      typical: 98,
      hint: 'Na parte mais larga do quadril, com os pés juntos.',
    },
    {
      id: 'ombros',
      label: 'Ombros',
      min: 34,
      max: 62,
      typical: 46,
      hint: 'De uma ponta do ombro à outra, pelas costas.',
    },
    {
      id: 'braco',
      label: 'Comprimento do braço',
      min: 45,
      max: 85,
      typical: 64,
      hint: 'Da ponta do ombro ao osso do pulso, com o braço solto.',
    },
    {
      id: 'pescoco',
      label: 'Pescoço',
      min: 30,
      max: 55,
      typical: 39,
      hint: 'Na base do pescoço, com um dedo de folga: é a medida do colarinho.',
    },
    {
      id: 'entrepernas',
      label: 'Entrepernas',
      min: 60,
      max: 105,
      typical: 80,
      hint: 'Por dentro da perna, da virilha até o chão, descalço.',
    },
  ],
}
