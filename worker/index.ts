import { getCachedImage, isHash } from './lib/cache'
import { corsHeaders, isAllowedOrigin, jsonError, withHeaders } from './lib/http'
import { handlePieceImage } from './routes/piece'
import { handleTryOn } from './routes/tryOn'

/**
 * Worker da Maison Aurore. Serve o site (assets estáticos, configurados no
 * wrangler.jsonc) e a API de IA em /api/*. Nenhuma chave chega ao navegador:
 * o Workers AI é acessado pelo vínculo `AI` e o token do Hugging Face fica no Worker.
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
  if (pathname === '/api/provador' && method === 'POST') {
    return handleTryOn(request, env)
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
