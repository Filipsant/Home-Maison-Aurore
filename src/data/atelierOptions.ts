import type { AtelierLinha, AtelierOptions } from '@/types/content'

const F: AtelierLinha[] = ['feminina']
const M: AtelierLinha[] = ['masculina']

/**
 * Campos do formulário "Criar peça". Usado pela tela (rótulos) e pelo Worker
 * (trechos do prompt). O Worker só aceita ids desta lista: nada de texto livre
 * chega ao modelo, o que protege a cota e a identidade da maison.
 *
 * `linhas` diz em qual linha a opção aparece (F = feminina, M = masculina);
 * sem `linhas`, a opção vale para as duas.
 */
export const atelierOptions: AtelierOptions = {
  linha: [
    { id: 'feminina', label: 'Feminina', prompt: 'female model' },
    { id: 'masculina', label: 'Masculina', prompt: 'male model' },
  ],
  peca: [
    { id: 'vestido', label: 'Vestido', prompt: 'haute couture evening gown', linhas: F },
    {
      id: 'tailleur',
      label: 'Tailleur',
      prompt: 'haute couture tailored skirt suit with a sculpted jacket',
      linhas: F,
    },
    { id: 'capa', label: 'Capa', prompt: 'dramatic haute couture cape over a slip dress', linhas: F },
    {
      id: 'corset',
      label: 'Corset',
      prompt: 'structured haute couture corset bodice with a long skirt',
      linhas: F,
    },
    { id: 'robe', label: 'Robe', prompt: 'flowing haute couture robe dress', linhas: F },
    { id: 'smoking', label: 'Smoking', prompt: 'haute couture tuxedo with satin peak lapels', linhas: M },
    { id: 'terno', label: 'Terno', prompt: 'bespoke haute couture three-piece suit', linhas: M },
    {
      id: 'sobretudo',
      label: 'Sobretudo',
      prompt: 'long sculpted haute couture overcoat worn over a tailored suit',
      linhas: M,
    },
    { id: 'casaca', label: 'Casaca', prompt: 'haute couture tailcoat with high-waisted trousers', linhas: M },
    {
      id: 'capa-alfaiataria',
      label: 'Capa',
      prompt: 'dramatic haute couture cape over a tailored suit',
      linhas: M,
    },
  ],
  tecido: [
    { id: 'organza', label: 'Organza de seda', prompt: 'layered silk organza', linhas: F },
    { id: 'crepe', label: 'Crepe', prompt: 'fluid silk crepe' },
    { id: 'tule', label: 'Tule de seda', prompt: 'airy silk tulle', linhas: F },
    { id: 'grain-de-poudre', label: 'Grain de poudre', prompt: 'crisp grain de poudre wool' },
    { id: 'la-fria', label: 'Lã fria', prompt: 'fine tropical merino wool' },
    { id: 'veludo', label: 'Veludo', prompt: 'deep silk velvet' },
    { id: 'musselina', label: 'Musselina', prompt: 'unbleached cotton muslin, like an atelier toile' },
  ],
  cor: [
    { id: 'marfim', label: 'Marfim', prompt: 'ivory' },
    { id: 'champanhe', label: 'Champanhe', prompt: 'pale champagne' },
    { id: 'preto', label: 'Preto', prompt: 'deep black' },
    { id: 'azul-noite', label: 'Azul-noite', prompt: 'midnight blue' },
    { id: 'lilas', label: 'Lilás', prompt: 'soft lilac grey' },
    { id: 'terracota', label: 'Terracota', prompt: 'muted terracotta' },
  ],
  silhueta: [
    { id: 'coluna', label: 'Coluna', prompt: 'column silhouette', linhas: F },
    { id: 'sereia', label: 'Sereia', prompt: 'mermaid silhouette', linhas: F },
    { id: 'evase', label: 'Evasê', prompt: 'A-line silhouette', linhas: F },
    { id: 'ampla', label: 'Ampla', prompt: 'voluminous ball gown silhouette', linhas: F },
    { id: 'ajustada', label: 'Ajustada', prompt: 'sculpted fitted silhouette' },
    { id: 'reta', label: 'Reta', prompt: 'clean straight-cut silhouette', linhas: M },
    {
      id: 'ombros-marcados',
      label: 'Ombros marcados',
      prompt: 'strong-shouldered silhouette and a nipped waist',
      linhas: M,
    },
    { id: 'oversized', label: 'Oversized', prompt: 'relaxed oversized silhouette', linhas: M },
  ],
  detalhes: [
    { id: 'bordado', label: 'Bordado à mão', prompt: 'intricate hand embroidery' },
    { id: 'plumas', label: 'Plumas', prompt: 'delicate feather trim', linhas: F },
    { id: 'perolas', label: 'Pérolas', prompt: 'scattered seed pearls' },
    { id: 'drapeado', label: 'Drapeado', prompt: 'soft sculptural draping', linhas: F },
    { id: 'plissado', label: 'Plissado', prompt: 'fine knife pleats', linhas: F },
    { id: 'lapela-cetim', label: 'Lapela de cetim', prompt: 'glossy satin lapels', linhas: M },
    {
      id: 'botoes-madreperola',
      label: 'Botões de madrepérola',
      prompt: 'mother-of-pearl buttons',
      linhas: M,
    },
    { id: 'pesponto', label: 'Pesponto à mão', prompt: 'visible hand pick-stitching', linhas: M },
  ],
  colecao: [
    { id: 'lumiere', label: 'Lumière', prompt: 'translucent layers catching soft natural light' },
    { id: 'nocturne', label: 'Nocturne', prompt: 'moody evening atmosphere with deep shadows' },
    { id: 'atelier-blanc', label: 'Atelier Blanc', prompt: 'pure white minimal atelier with diffused light' },
    { id: 'terre', label: 'Terre', prompt: 'earthy natural tones and raw linen textures' },
  ],
}

/** Máximo de detalhes escolhidos de uma vez. */
export const MAX_DETALHES = 3
