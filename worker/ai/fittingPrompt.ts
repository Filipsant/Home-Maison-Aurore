import type { ProvaVista } from '../../src/types/prova'

/**
 * Prompt da prova virtual (FLUX.2 [klein]): a pessoa da foto (imagem 1) vestindo
 * a peça do ateliê digital (imagem 2). O texto é fixo; as medidas e a correção
 * da cliente entram como dados, e a correção passa por um filtro antes.
 */

/** Mudar o texto abaixo exige subir a versão (invalida o cache das provas). */
export const FITTING_VERSION = 'prova-v1'

/** Modelo de edição com várias imagens de referência; o 4B preservou melhor o rosto nos testes. */
export const FITTING_MODEL = '@cf/black-forest-labs/flux-2-klein-4b'

/** Tamanho da prova (retrato 3:4, como as molduras do site). */
export const FITTING_SIZE = { width: 768, height: 1024 } as const

export const MAX_CORRECAO = 300

/** Nome em inglês de cada medida (o modelo entende melhor). */
const MEASURE_NAMES: Record<string, string> = {
  altura: 'height',
  busto: 'bust',
  torax: 'chest',
  cintura: 'waist',
  quadril: 'hips',
  ombros: 'shoulder width',
  braco: 'arm length',
  pescoco: 'neck',
  entrepernas: 'inseam',
}

const VIEW_TEXT: Record<ProvaVista, { photo: string; garment: string }> = {
  frente: { photo: 'from the front', garment: 'Show the garment from the front.' },
  costas: {
    photo: 'from behind',
    garment: 'Show the back of the garment, as it would look from behind (image 2 shows the front).',
  },
  lado: {
    photo: 'from the side, in profile',
    garment: 'Show the garment in profile, as it would look from the side (image 2 shows the front).',
  },
}

/** Texto livre da cliente: sem caracteres de controle, espaços simples e no máximo 300 caracteres. */
export function cleanCorrection(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/\p{Cc}/gu, ' ')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CORRECAO)
}

/**
 * Filtro simples da correção: recusa pedidos para despir a pessoa ou trocar o
 * rosto/identidade. Não é infalível; o limite por IP e o consentimento completam.
 */
const BLOCKED = [
  /\bn[uú]s?\b/,
  /\bnuas?\b/,
  /\bpelad[oa]s?\b/,
  /\bsem roupas?\b/,
  /\bdespid[oa]s?\b/,
  /\bdesp(ir|e)\b/,
  /\btir(e|ar|a)\s+(a|as|toda a|toda)\s+roupas?\b/,
  /\b(seios?|mamilos?|genitais?)\b/,
  /\b(nude|naked|topless|nsfw|undress\w*|porn\w*|erotic\w*|er[oó]tic\w*|sexual\w*)\b/,
  /\b(troqu?e|mude|substitua|trocar|mudar)\s+(o\s+|a\s+|de\s+)?(rosto|cara|identidade)\b/,
  /\b(face ?swap|deep ?fake)\b/,
]

export function isBlockedCorrection(text: string): boolean {
  const normalized = text.toLowerCase()
  return BLOCKED.some((pattern) => pattern.test(normalized))
}

function measuresText(medidas: Record<string, number>): string {
  const parts = Object.entries(medidas)
    .filter(([id]) => MEASURE_NAMES[id])
    .map(([id, value]) => `${MEASURE_NAMES[id] ?? id} ${value} cm`)
  return parts.length
    ? ` The garment is made to measure for this client: ${parts.join(', ')}; keep the body proportions consistent with these measurements.`
    : ''
}

/** Prova nova: foto do corpo (imagem 1) + peça (imagem 2). */
export function buildFittingPrompt(vista: ProvaVista, medidas: Record<string, number>): string {
  const view = VIEW_TEXT[vista]
  return [
    `Virtual fitting at a haute couture atelier. Image 1 is a photo of the client ${view.photo}. Image 2 is the garment.`,
    'Dress the exact person from image 1 in the garment from image 2.',
    'Keep the same face, skin tone, hair, body shape, pose and camera framing as image 1; do not change the person.',
    `Reproduce the garment from image 2 faithfully: cut, fabric, color and details. ${view.garment}`,
    measuresText(medidas).trim(),
    'Full-body fashion photograph, neutral studio background, soft light, photorealistic.',
  ]
    .filter(Boolean)
    .join(' ')
}

/** Correção: a prova anterior (imagem 1) + peça (imagem 2) + o pedido da cliente. */
export function buildCorrectionPrompt(correcao: string): string {
  return [
    `Edit image 1 following this correction requested by the client: "${correcao}".`,
    'Change only what the correction asks. Keep everything else exactly as in image 1:',
    'the same person, face, body, pose, framing and lighting, and the rest of the garment.',
    'Image 2 is the original garment, for reference. Photorealistic.',
  ].join(' ')
}
