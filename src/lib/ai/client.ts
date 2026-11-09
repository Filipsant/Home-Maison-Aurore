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

/** Gera a foto de uma peça. Nunca lança: falhas viram resultado de exemplo (da mesma linha). */
export async function generatePiece(request: PieceRequest, signal?: AbortSignal): Promise<AiResult> {
  const example = request.linha === 'masculina' ? '/exemplos/peca-masculina.jpg' : '/exemplos/peca.jpg'
  try {
    const response = await fetch(`${API_URL}/api/pecas/imagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
    return await readResult(response, example)
  } catch (error) {
    if (signal?.aborted) throw error
    return { status: 'fallback', imageUrl: example, reason: 'indisponivel' }
  }
}
