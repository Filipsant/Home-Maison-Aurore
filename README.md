# Maison Aurore — home

Home de uma maison fictícia de alta costura. A estrutura das seções segue a home da [Sigma](https://www.sigma-global.com/en/index.html) e o movimento reproduz a sensação da [Floema](https://floema.com/), reimplementado do zero em GSAP a partir de valores medidos (nenhum código, imagem ou texto dos dois sites foi copiado). O visual vem do Figma da Maison Aurore.

Além da home, há um **ateliê digital** com IA, de custo zero: a página **Criar peça** gera uma fotografia de moda a partir das escolhas do formulário, nas linhas **feminina** e **masculina**, e o **Provador virtual** veste uma peça numa foto da pessoa.

## Stack

React 18, TypeScript (strict), Vite, Tailwind CSS 4, shadcn/ui (Radix), GSAP 3 (ScrollTrigger, SplitText, `useGSAP`), Lenis, Vitest + Testing Library, ESLint + Prettier. Back-end: Cloudflare Worker em TypeScript, com Workers AI e `@gradio/client`.

## Como rodar

```bash
npm install
npm run dev          # site + API em http://localhost:5173 (gera imagens se o .env tiver conta e token do Cloudflare)
npm run dev:ia       # igual, mas pelo vínculo AI remoto (precisa de `wrangler login`)
npm run build        # checa os tipos e gera o site e o Worker em dist/
npm run lint
npm test             # 88 testes: site (jsdom) e Worker (Node), sem gastar cota
npm run deploy       # publica no Cloudflare
```

Páginas: `/` (home), `/atelie-digital` (Criar peça) e `/provador` (Provador virtual). Os links ficam no menu e no rodapé.

## Seções (ordem da Sigma)

Header e Menu, FeatureHero (coleção Lumière), NewArrivals, FeaturedPieces, Editorial "Vestido por", ArtProject "Arquivo Aurore", VideoFeatures, Categories e Footer.

## Arquitetura

```
src/
├── app/             App, rotas (routes.tsx) e providers (movimento, menu)
├── pages/           home, atelie-digital e provador: só compõem as seções
├── sections/        uma pasta por seção: Componente.tsx + componente.animation.ts
├── components/ui/   shadcn (Button, Sheet, Input, Label) com a paleta da maison
├── components/shared/  Container, SectionHeading, TextLink, Photo, VideoTeaser, OptionGroup, ImageInput, AiResultFrame
├── animations/      gsap.ts, tokens.ts, smoothScroll.ts, presets/, hooks/
├── data/            todo o conteúdo, tipado
├── types/           tipos do conteúdo
└── styles/          globals.css: tema do Tailwind (cores, tipografia, curvas)
worker/              Cloudflare Worker: API de IA (ver "Integrações de IA")
```

Regras, verificadas pelo ESLint e pelos testes:

- Uma seção não importa outra.
- O GSAP só é importado em `src/animations/` (pelo arquivo `gsap.ts`).
- Todo valor de animação vem de `src/animations/tokens.ts`; todo conteúdo vem de `src/data/`.
- Cores, fontes e tamanhos só pelos tokens do tema (as paletas padrão do Tailwind foram removidas).
- As animações rodam via `useGSAP` com escopo na seção: tudo é desfeito no unmount.

## Movimento

O estudo completo está em [`docs/motion-study.md`](docs/motion-study.md): catálogo com 39 efeitos medidos na Floema, os presets derivados e o mapa padrão → seção. Os presets ficam em `src/animations/presets/`:

| Preset                                                        | Onde                                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `textReveal` (linhas descendo na abertura, subindo no scroll) | títulos e parágrafos                                                         |
| `imageReveal` (cortina de cor + imagem)                       | fotos e vídeos                                                               |
| `cascade` (colunas com deslocamento crescente)                | Editorial                                                                    |
| `riseIn`, `lineDraw`, `parallax`, `headerTheme`               | listas, linhas finas, fundo do Arquivo, assinatura do rodapé, tema do header |

Com `prefers-reduced-motion`, a página aparece no estado final: sem smooth scroll, sem scrub, sem parallax e sem autoplay de vídeo.

## Trocar placeholders por fotos e vídeos

As imagens são placeholders em tons da paleta, com legenda entre colchetes. Para usar mídia real, edite só o arquivo de `src/data/`; os componentes não mudam.

```ts
// src/data/newArrivals.ts — foto
media: {
  caption: '[Foto] Vestido Aube',
  tone: 'musselina',          // cor da cortina e do fundo enquanto carrega
  aspect: 4 / 5,
  src: '/fotos/vestido-aube.jpg',
  alt: 'Vestido Aube em organza de seda, visto de frente',
},

// src/data/videoFeatures.ts — vídeo (mudo, em loop, pausa fora da tela)
media: {
  caption: '[Vídeo] bastidores do ateliê',
  tone: 'veludo',
  aspect: 4 / 5,
  videoSrc: '/videos/atelie.mp4',
  poster: '/videos/atelie.jpg',
  alt: 'Mãos bordando pérolas em organza',
},
```

Coloque os arquivos em `public/`. Endereço, contatos e redes do rodapé ficam em `src/data/site.ts`: itens sem `href` aparecem como texto até serem preenchidos.

## Integrações de IA

### Arquitetura

```
Navegador ── /atelie-digital, /provador
    │  (fotos reduzidas no navegador para até 1024px)
    ▼
Cloudflare Worker (worker/) ── mesmo endereço do site, rotas /api/*
    ├─ origem permitida? ── não → 403
    ├─ resultado no cache (KV, chave = SHA-256 do pedido)? ── sim → devolve na hora, sem gastar cota
    ├─ rate limit por IP ── estourou → imagem de exemplo + "tente de novo em instantes"
    ├─ POST /api/pecas/imagem ─→ Workers AI: @cf/black-forest-labs/flux-1-schnell (tempo máx. 20s)
    ├─ POST /api/provador ────→ Space yisol/IDM-VTON via @gradio/client
    │                            └─ falhou? tenta Nymbo/Virtual-Try-On (mesma API) dentro do prazo de 2 min
    └─ GET /api/imagens/:hash ─→ serve o resultado guardado (cache longo no navegador)
```

| Arquivo                      | Papel                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `worker/index.ts`            | Rotas, checagem de origem e CORS                                             |
| `worker/ai/prompt.ts`        | Valida os campos (só ids do catálogo e da linha escolhida) e monta o prompt  |
| `worker/ai/imageGen.ts`      | Chamada ao flux-1-schnell (4 passos): vínculo AI ou, no computador, API REST |
| `worker/ai/tryOn.ts`         | Chamada ao Space do provador, com reserva e prazo total                      |
| `worker/lib/`                | Cache no KV, hash, rate limit, tempo máximo e respostas de exemplo           |
| `src/data/atelierOptions.ts` | Campos do formulário por linha: rótulo para a tela e trecho do prompt        |
| `src/lib/ai/client.ts`       | Cliente usado pelas telas; nunca lança erro: falha vira exemplo              |
| `src/hooks/useAiRequest.ts`  | Estados das telas: ocioso, carregando (com segundos), pronto                 |

**Resiliência**: quando a IA não responde (tempo esgotado, cota do dia, Space fora do ar, limite por IP), a tela mostra a imagem de exemplo da mesma linha (`public/exemplos/peca.jpg` ou `peca-masculina.jpg`) e uma mensagem amigável (`src/data/aiMessages.ts`). Para trocar o exemplo da peça por uma foto gerada pela IA, rode `npm run dev` (com o token no `.env`) e, em outro terminal, `npm run exemplos:gerar` (as duas linhas) ou `npm run exemplos:gerar -- masculina` (só uma).

**Custos**: zero. O Workers AI tem 10.000 "neurons" grátis por dia (cerca de 170 imagens com 4 passos); o Space do Hugging Face é público. O rate limit (5 imagens e 2 provas por minuto por IP, em `wrangler.jsonc`) e o cache protegem essa cota.

### Variáveis de ambiente

Copie [`.env.example`](.env.example) para `.env` (que não vai para o Git). O Worker lê o `.env` em desenvolvimento; em produção, os segredos são cadastrados com `npx wrangler secret put`.

| Variável                                        | Onde                | Para quê                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HF_TOKEN`                                      | Worker (secreta)    | Token "Read" do Hugging Face. Opcional; aumenta a cota de GPU do provador.                                                                                                                                                                                                                                         |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | só no computador    | Com as duas, o Worker local chama o Workers AI pela API REST e `npm run dev` gera imagens (basta a permissão "Workers AI"). O wrangler também as usa em `dev:ia` e `deploy` (aí o token precisa de "Edit Cloudflare Workers" mais "Workers AI: Edit"; alternativa: `npx wrangler login`). Nunca vão para produção. |
| `TRYON_SPACE`, `TRYON_SPACE_RESERVA`            | Worker              | Spaces do provador (principal e reserva).                                                                                                                                                                                                                                                                          |
| `ALLOWED_ORIGINS`                               | Worker              | Outros domínios que podem chamar a API (o próprio site é sempre aceito).                                                                                                                                                                                                                                           |
| `IMAGE_TIMEOUT_MS`, `TRYON_TIMEOUT_MS`          | Worker              | Tempo máximo antes do exemplo.                                                                                                                                                                                                                                                                                     |
| `VITE_AI_API_URL`                               | navegador (público) | Endereço da API, se ficar em outro domínio. Vazio = mesmo endereço.                                                                                                                                                                                                                                                |

Nunca use o prefixo `VITE_` em chaves: o Vite embute essas variáveis no site e qualquer pessoa consegue lê-las.

### Publicar

```bash
npx wrangler login                        # ou token no .env
npx wrangler kv namespace create CACHE    # cole o id em wrangler.jsonc ("kv_namespaces")
npx wrangler secret put HF_TOKEN          # opcional
npm run deploy
```

Depois do deploy, acrescente o endereço publicado (por exemplo `https://maison-aurore.<conta>.workers.dev`) em `ALLOWED_ORIGINS` só se outro domínio for chamar a API.

### Como testar cada integração

**Testes automáticos** (`npm test`): validação do formulário e do prompt, cache, rate limit, tempo esgotado, cota esgotada, origem recusada, provador com reserva e as telas, com a IA simulada.

**Geração de imagem (Workers AI)**

1. Preencha `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` no `.env`, rode `npm run dev` e abra `http://localhost:5173/atelie-digital`.
2. Escolha a linha (Feminina ou Masculina), as opções, e clique em "Criar peça": a foto aparece em poucos segundos.
3. Clique de novo sem mudar nada: aparece "Esta peça já tinha sido criada", vinda do cache.
4. Com as duas variáveis vazias (e sem `dev:ia`), a tela mostra o exemplo e a mensagem de indisponível: é o fallback funcionando.

Pelo terminal:

```bash
curl -X POST http://localhost:5173/api/pecas/imagem -H "Content-Type: application/json" \
  -d '{"peca":"vestido","tecido":"organza","cor":"marfim","silhueta":"sereia","detalhes":["bordado"],"colecao":"lumiere"}'
```

**Provador virtual (Hugging Face)**: funciona até com `npm run dev`.

1. Abra `http://localhost:5173/provador` e envie uma foto de corpo inteiro e a foto de uma peça (só a peça).
2. Clique em "Provar": o resultado chega em 30s a 2 min, conforme a fila.
3. Envie as mesmas fotos de novo: o resultado vem do cache, na hora.
4. Ou crie uma peça em "Criar peça" e use "Provar esta peça": ela já chega ao provador.

**Rate limit**: faça mais de 2 provas diferentes em menos de 1 minuto; a terceira mostra "Muitos pedidos em pouco tempo".

## Acessibilidade

Elementos semânticos com `aria-labelledby` nas seções, link "Pular para o conteúdo", foco visível (giz sobre névoa, giz-claro sobre veludo), alvos de toque de no mínimo 44px nos botões, contraste mínimo de 5,5:1 nos textos e menu com foco preso, Esc e foco devolvido. A auditoria com axe-core não aponta nenhuma violação (desktop, celular e menu aberto).
