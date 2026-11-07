/**
 * Gera as imagens de exemplo da tela "Criar peça" com a IA de verdade (as
 * imagens mostradas quando a geração falha), uma por linha:
 *   feminina  → public/exemplos/peca.jpg
 *   masculina → public/exemplos/peca-masculina.jpg
 *
 * Usa o próprio Worker local, com a mesma validação e o mesmo prompt do site:
 *   1. em um terminal:  npm run dev   (com CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN no .env)
 *   2. em outro:        npm run exemplos:gerar               (as duas linhas)
 *                       npm run exemplos:gerar -- masculina  (só uma)
 *
 * Gasta ~60 dos 10.000 "neurons" gratuitos do dia por imagem.
 * Para o exemplo do provador, troque public/exemplos/provador.jpg por um resultado
 * real feito com fotos que você tem direito de usar.
 */
import { writeFile } from 'node:fs/promises'

const exemplos = {
  feminina: {
    arquivo: 'peca.jpg',
    peca: {
      linha: 'feminina',
      peca: 'vestido',
      tecido: 'organza',
      cor: 'marfim',
      silhueta: 'sereia',
      detalhes: ['bordado'],
      colecao: 'lumiere',
    },
  },
  masculina: {
    arquivo: 'peca-masculina.jpg',
    peca: {
      linha: 'masculina',
      peca: 'smoking',
      tecido: 'grain-de-poudre',
      cor: 'preto',
      silhueta: 'ajustada',
      detalhes: ['lapela-cetim'],
      colecao: 'lumiere',
    },
  },
}

const args = process.argv.slice(2)
const base = (args.find((a) => a.startsWith('http')) ?? 'http://localhost:5173').replace(/\/$/, '')
const escolhidas = args.filter((a) => a in exemplos)
const linhas = escolhidas.length ? escolhidas : Object.keys(exemplos)

async function gerar(linha) {
  const { arquivo, peca } = exemplos[linha]
  let resposta
  try {
    resposta = await fetch(`${base}/api/pecas/imagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(peca),
    })
  } catch {
    throw new Error(`Não encontrei o Worker em ${base}. Rode "npm run dev" em outro terminal.`)
  }

  const resultado = await resposta.json()
  if (resultado.status !== 'ok') {
    throw new Error(
      `A IA não gerou a imagem da linha ${linha} (motivo: ${resultado.reason}). ` +
        'Confira se CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN estão no .env e reinicie o "npm run dev".',
    )
  }

  const imagem = await fetch(`${base}${resultado.imageUrl}`)
  if (!imagem.ok) throw new Error(`Não consegui baixar a imagem (HTTP ${imagem.status}).`)
  const bytes = Buffer.from(await imagem.arrayBuffer())
  await writeFile(new URL(`../public/exemplos/${arquivo}`, import.meta.url), bytes)
  console.log(
    `Linha ${linha}: exemplo gravado em public/exemplos/${arquivo} (${Math.round(bytes.length / 1024)} KB).`,
  )
}

async function main() {
  for (const linha of linhas) await gerar(linha)
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro)
  process.exitCode = 1
})
