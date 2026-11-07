import type { AtelierOptions } from '@/types/content'

/**
 * Campos do formulário "Criar peça". Usado pela tela (rótulos) e pelo Worker
 * (trechos do prompt). O Worker só aceita ids desta lista: nada de texto livre
 * chega ao modelo, o que protege a cota e a identidade da maison.
 */
export const atelierOptions: AtelierOptions = {
  peca: [
    { id: 'vestido', label: 'Vestido', prompt: 'haute couture evening gown' },
    { id: 'tailleur', label: 'Tailleur', prompt: 'haute couture tailored skirt suit with a sculpted jacket' },
    { id: 'capa', label: 'Capa', prompt: 'dramatic haute couture cape over a slip dress' },
    { id: 'corset', label: 'Corset', prompt: 'structured haute couture corset bodice with a long skirt' },
    { id: 'robe', label: 'Robe', prompt: 'flowing haute couture robe dress' },
  ],
  tecido: [
    { id: 'organza', label: 'Organza de seda', prompt: 'layered silk organza' },
    { id: 'crepe', label: 'Crepe', prompt: 'fluid silk crepe' },
    { id: 'tule', label: 'Tule de seda', prompt: 'airy silk tulle' },
    { id: 'grain-de-poudre', label: 'Grain de poudre', prompt: 'crisp grain de poudre wool' },
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
    { id: 'coluna', label: 'Coluna', prompt: 'column silhouette' },
    { id: 'sereia', label: 'Sereia', prompt: 'mermaid silhouette' },
    { id: 'evase', label: 'Evasê', prompt: 'A-line silhouette' },
    { id: 'ampla', label: 'Ampla', prompt: 'voluminous ball gown silhouette' },
    { id: 'ajustada', label: 'Ajustada', prompt: 'sculpted fitted silhouette' },
  ],
  detalhes: [
    { id: 'bordado', label: 'Bordado à mão', prompt: 'intricate hand embroidery' },
    { id: 'plumas', label: 'Plumas', prompt: 'delicate feather trim' },
    { id: 'perolas', label: 'Pérolas', prompt: 'scattered seed pearls' },
    { id: 'drapeado', label: 'Drapeado', prompt: 'soft sculptural draping' },
    { id: 'plissado', label: 'Plissado', prompt: 'fine knife pleats' },
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
