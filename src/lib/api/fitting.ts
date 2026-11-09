import { apiUrl } from '@/lib/ai/client'
import type { ProvaResult, ProvaVista } from '@/types/prova'

/** Prova nova (com a foto do corpo) ou correção (com a prova anterior e o texto da cliente). */
export interface FittingRequest {
  pecaId: string
  vista: ProvaVista
  /** Foto do corpo já reduzida (prova nova). */
  foto?: Blob
  /** Prova anterior (correção). */
  baseId?: string
  correcao?: string
  /** Medidas válidas, em cm (opcional). */
  medidas?: Record<string, number>
  variante?: number
}

/** Chama POST /api/provas. Nunca lança: falhas viram um motivo que a tela sabe explicar. */
export async function requestFitting(request: FittingRequest, signal?: AbortSignal): Promise<ProvaResult> {
  const form = new FormData()
  form.append('pecaId', request.pecaId)
  form.append('vista', request.vista)
  if (request.foto) form.append('foto', request.foto, `${request.vista}.jpg`)
  if (request.baseId) form.append('baseId', request.baseId)
  if (request.correcao) form.append('correcao', request.correcao)
  if (request.medidas && Object.keys(request.medidas).length) {
    form.append('medidas', JSON.stringify(request.medidas))
  }
  if (request.variante) form.append('variante', String(request.variante))

  try {
    const response = await fetch(apiUrl('/api/provas'), { method: 'POST', body: form, signal })
    return (await response.json()) as ProvaResult
  } catch (error) {
    if (signal?.aborted) throw error
    return { status: 'erro', motivo: 'indisponivel' }
  }
}
