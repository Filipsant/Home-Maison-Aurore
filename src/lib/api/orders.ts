import { apiUrl } from '@/lib/ai/client'
import type { PieceRequest } from '@/types/ai'
import type { Order, OrderRequest, OrderResult } from '@/types/order'

/**
 * Cliente da API de peças e pedidos (provador 3D e painel do ateliê).
 * Nunca lança: falhas de rede viram um resultado que a tela sabe mostrar.
 */

export type PieceLookup =
  | { status: 'ok'; id: string; imageUrl: string; peca: PieceRequest }
  | { status: 'nao-encontrada' }
  | { status: 'erro' }

export async function fetchPiece(id: string, signal?: AbortSignal): Promise<PieceLookup> {
  try {
    const response = await fetch(apiUrl(`/api/pecas/${id}`), { signal })
    if (response.status === 404) return { status: 'nao-encontrada' }
    if (!response.ok) return { status: 'erro' }
    const body = (await response.json()) as { id: string; imageUrl: string; peca: PieceRequest }
    return { status: 'ok', ...body }
  } catch (error) {
    if (signal?.aborted) throw error
    return { status: 'erro' }
  }
}

export async function sendOrder(order: OrderRequest): Promise<OrderResult> {
  try {
    const response = await fetch(apiUrl('/api/pedidos'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    return (await response.json()) as OrderResult
  } catch {
    return { status: 'erro', motivo: 'indisponivel' }
  }
}

export type OrdersLookup =
  { status: 'ok'; pedidos: Order[] } | { status: 'senha' | 'sem-senha' | 'limite' | 'erro' }

const auth = (password: string) => ({ Authorization: `Bearer ${password}` })

function panelStatus(status: number): 'senha' | 'sem-senha' | 'limite' | 'erro' {
  if (status === 401) return 'senha'
  if (status === 503) return 'sem-senha'
  if (status === 429) return 'limite'
  return 'erro'
}

export async function listOrders(password: string): Promise<OrdersLookup> {
  try {
    const response = await fetch(apiUrl('/api/pedidos'), { headers: auth(password), cache: 'no-store' })
    if (!response.ok) return { status: panelStatus(response.status) }
    const body = (await response.json()) as { pedidos: Order[] }
    return { status: 'ok', pedidos: body.pedidos }
  } catch {
    return { status: 'erro' }
  }
}

export async function deleteOrder(id: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(apiUrl(`/api/pedidos/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: auth(password),
    })
    return response.ok
  } catch {
    return false
  }
}
