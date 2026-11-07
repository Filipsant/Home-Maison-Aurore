/**
 * Gera a imagem de exemplo da tela "Criar peça" com a IA de verdade e grava em
 * public/exemplos/peca.jpg (a imagem mostrada quando a geração falha).
 *
 * Usa o próprio Worker local, com a mesma validação e o mesmo prompt do site:
 *   1. em um terminal:  npm run dev:ia      (precisa de login no Cloudflare)
 *   2. em outro:        npm run exemplos:gerar
 *
 * Gasta ~60 dos 10.000 "neurons" gratuitos do dia (uma imagem).
 * Para o exemplo do provador, troque public/exemplos/provador.jpg por um resultado
 * real feito com fotos que você tem direito de usar.
 */
import { writeFile } from 'node:fs/promises'

const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '')
const destino = new URL('../public/exemplos/peca.jpg', import.meta.url)

const pecaDeExemplo = {
  peca: 'vestido',
  tecido: 'organza',
  cor: 'marfim',
  silhueta: 'sereia',
  detalhes: ['bordado'],
  colecao: 'lumiere',
}

async function main() {
  let resposta
  try {
    resposta = await fetch(`${base}/api/pecas/imagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pecaDeExemplo),
    })
  } catch {
    throw new Error(`Não encontrei o Worker em ${base}. Rode "npm run dev:ia" em outro terminal.`)
  }

  const resultado = await resposta.json()
  if (resultado.status !== 'ok') {
    throw new Error(
      `A IA não gerou a imagem (motivo: ${resultado.reason}). ` +
        'Confira se o servidor está em "npm run dev:ia" e se o login no Cloudflare funciona.',
    )
  }

  const imagem = await fetch(`${base}${resultado.imageUrl}`)
  if (!imagem.ok) throw new Error(`Não consegui baixar a imagem (HTTP ${imagem.status}).`)
  const bytes = Buffer.from(await imagem.arrayBuffer())
  await writeFile(destino, bytes)
  console.log(
    `Imagem de exemplo gravada em public/exemplos/peca.jpg (${Math.round(bytes.length / 1024)} KB).`,
  )
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro)
  process.exitCode = 1
})
