import type { AiResult, PieceRequest } from '@/types/ai'

/** Endereço da API: vazio = mesma origem do site (o Worker serve os dois). */
const API_URL = (import.meta.env.VITE_AI_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

/** Monta a URL absoluta de um caminho devolvido pela API (`/api/imagens/...`, `/exemplos/...`). */
export function apiUrl(path: string): string {
  return path.startsWith('/api/') ? `${API_URL}${path}` : path
}

async function readResult(response: Response, fallbackImage: string): Promise<AiResult> {
  try {
    return (await response.json()) as AiResult
  } catch {
    // Resposta inesperada (por exemplo, o Worker não está rodando): trata como indisponível.
    return { status: 'fallback', imageUrl: fallbackImage, reason: 'indisponivel' }
  }
}

/** Gera a foto de uma peça. Nunca lança: falhas viram resultado de exemplo. */
export async function generatePiece(request: PieceRequest, signal?: AbortSignal): Promise<AiResult> {
  try {
    const response = await fetch(`${API_URL}/api/pecas/imagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
    return await readResult(response, '/exemplos/peca.jpg')
  } catch (error) {
    if (signal?.aborted) throw error
    return { status: 'fallback', imageUrl: '/exemplos/peca.jpg', reason: 'indisponivel' }
  }
}

export interface TryOnRequest {
  person: Blob
  /** Foto da peça enviada pela pessoa... */
  garment?: Blob
  /** ...ou o id de uma peça gerada no ateliê digital. */
  pieceId?: string
  description?: string
}

/** Prova a peça na foto da pessoa. Nunca lança: falhas viram resultado de exemplo. */
export async function tryOn(request: TryOnRequest, signal?: AbortSignal): Promise<AiResult> {
  const form = new FormData()
  form.append('pessoa', request.person, 'pessoa.jpg')
  if (request.pieceId) form.append('pecaId', request.pieceId)
  else if (request.garment) form.append('peca', request.garment, 'peca.jpg')
  if (request.description) form.append('descricao', request.description)

  try {
    const response = await fetch(`${API_URL}/api/provador`, { method: 'POST', body: form, signal })
    return await readResult(response, '/exemplos/provador.jpg')
  } catch (error) {
    if (signal?.aborted) throw error
    return { status: 'fallback', imageUrl: '/exemplos/provador.jpg', reason: 'indisponivel' }
  }
}
