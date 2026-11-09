import { getCachedImage, isHash } from './lib/cache'
import { corsHeaders, isAllowedOrigin, jsonError, withHeaders } from './lib/http'
import { handleFitting } from './routes/fitting'
import { handleCreateOrder, handleDeleteOrder, handleListOrders } from './routes/orders'
import { handleGetPiece, handlePieceImage } from './routes/piece'

/**
 * Worker da Maison Aurore. Serve o site (assets estáticos, configurados no
 * wrangler.jsonc) e a API em /api/*: geração de imagens (Workers AI, pelo vínculo
 * `AI`, sem token), prova virtual (FLUX.2, com as fotos da cliente) e pedidos sob
 * medida (guardados no KV).
 * Nenhuma chave chega ao navegador.
 */
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return jsonError(404, 'Rota não encontrada')

    if (!isAllowedOrigin(request, env.ALLOWED_ORIGINS)) return jsonError(403, 'Origem não permitida')
    const cors = corsHeaders(request)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    const response = await route(request, env, url)
    return Object.keys(cors).length ? withHeaders(response, cors) : response
  },
} satisfies ExportedHandler<Env>

async function route(request: Request, env: Env, url: URL): Promise<Response> {
  const { pathname } = url
  const method = request.method

  if (pathname === '/api/saude' && method === 'GET') {
    return Response.json({ ok: true })
  }
  if (pathname === '/api/pecas/imagem' && method === 'POST') {
    return handlePieceImage(request, env)
  }
  if (pathname === '/api/provas' && method === 'POST') {
    return handleFitting(request, env)
  }
  if (pathname === '/api/pedidos' && method === 'POST') {
    return handleCreateOrder(request, env)
  }
  if (pathname === '/api/pedidos' && method === 'GET') {
    return handleListOrders(request, env)
  }

  const order = /^\/api\/pedidos\/([^/]+)$/.exec(pathname)
  if (order?.[1] && method === 'DELETE') {
    return handleDeleteOrder(request, env, order[1])
  }

  const piece = /^\/api\/pecas\/([a-f0-9]{64})$/.exec(pathname)
  if (piece?.[1] && method === 'GET') {
    return handleGetPiece(piece[1], env)
  }

  const image = /^\/api\/imagens\/([a-f0-9]{64})$/.exec(pathname)
  if (image?.[1] && method === 'GET' && isHash(image[1])) {
    const cached = await getCachedImage(env.CACHE, image[1])
    if (!cached) return jsonError(404, 'Imagem não encontrada')
    return new Response(cached.bytes, {
      headers: {
        'Content-Type': cached.contentType,
        // O conteúdo de um hash nunca muda: o navegador pode guardar para sempre.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  return jsonError(404, 'Rota não encontrada')
}
