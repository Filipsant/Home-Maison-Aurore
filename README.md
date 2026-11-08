# Maison Aurore — home

Home de uma maison fictícia de alta costura. A estrutura das seções segue a home da [Sigma](https://www.sigma-global.com/en/index.html) e o movimento reproduz a sensação da [Floema](https://floema.com/), reimplementado do zero em GSAP a partir de valores medidos (nenhum código, imagem ou texto dos dois sites foi copiado). O visual vem do Figma da Maison Aurore.

Além da home, há um **ateliê digital** com IA, de custo zero: a página **Criar peça** gera uma fotografia de moda a partir das escolhas do formulário, nas linhas **feminina** e **masculina**, e o **Provador 3D** veste essa peça num manequim 3D com as medidas da cliente, que envia o pedido sob medida ao ateliê.

## Stack

React 18, TypeScript (strict), Vite, Tailwind CSS 4, shadcn/ui (Radix), GSAP 3 (ScrollTrigger, SplitText, `useGSAP`), Lenis, Vitest + Testing Library, ESLint + Prettier. Manequim 3D em three.js (carregado só no provador). Back-end: Cloudflare Worker em TypeScript, com Workers AI e Workers KV.

## Como rodar

```bash
npm install
npm run dev          # site + API em http://localhost:5173 (gera imagens se o .env tiver conta e token do Cloudflare)
npm run dev:ia       # igual, mas pelo vínculo AI remoto (precisa de `wrangler login`)
npm run build        # checa os tipos e gera o site e o Worker em dist/
npm run lint
npm test             # 115 testes: site (jsdom) e Worker (Node), sem gastar cota
npm run deploy       # publica no Cloudflare
```

Páginas: `/` (home), `/atelie-digital` (Criar peça) e `/provador` (Provador 3D), com links no menu e no rodapé. O painel do ateliê fica em `/atelie/pedidos` (com senha, fora do menu e dos buscadores).

## Seções (ordem da Sigma)

Header e Menu, FeatureHero (coleção Lumière), NewArrivals, FeaturedPieces, Editorial "Vestido por", ArtProject "Arquivo Aurore", VideoFeatures, Categories e Footer.

## Arquitetura

```
src/
├── app/             App, rotas (routes.tsx) e providers (movimento, menu)
├── pages/           home, atelie-digital, provador e pedidos: só compõem as seções
├── sections/        uma pasta por seção: Componente.tsx + componente.animation.ts
├── components/ui/   shadcn (Button, Sheet, Input, Label) com a paleta da maison
├── components/shared/  Container, SectionHeading, TextLink, Photo, VideoTeaser, OptionGroup, AiResultFrame, Mannequin3D
├── lib/mannequin/   manequim 3D: corpo pelas medidas (body.ts), roupas (figure.ts), cena (scene.ts)
├── lib/orders/      validação do pedido, a mesma na tela e no Worker
├── animations/      gsap.ts, tokens.ts, smoothScroll.ts, presets/, hooks/
├── data/            todo o conteúdo, tipado
├── types/           tipos do conteúdo
└── styles/          globals.css: tema do Tailwind (cores, tipografia, curvas)
worker/              Cloudflare Worker: API de imagens e pedidos (ver "Integrações")
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

## Integrações

### Arquitetura

```
Navegador ── /atelie-digital (Criar peça) ── /provador (Provador 3D) ── /atelie/pedidos (painel)
    ▼
Cloudflare Worker (worker/) ── mesmo endereço do site, rotas /api/*
    ├─ origem permitida? ── não → 403
    ├─ POST /api/pecas/imagem ─→ cache (KV, chave = SHA-256 do pedido)? sim → na hora, sem gastar cota
    │                            senão: rate limit por IP → Workers AI flux-1-schnell (tempo máx. 20s)
    │                            guarda a foto (img:<hash>) e as escolhas (peca:<hash>) por 30 dias
    ├─ GET  /api/imagens/:hash ─→ a foto guardada (cache longo no navegador)
    ├─ GET  /api/pecas/:hash ───→ as escolhas da peça, para o provador 3D vestir o manequim
    ├─ POST /api/pedidos ───────→ peça + medidas + contato → KV (pedido:<id>), sem prazo de validade
    └─ GET/DELETE /api/pedidos ─→ painel do ateliê, com senha (ATELIE_SENHA)
```

O **manequim 3D** é desenhado no navegador (three.js), sem IA e sem custo: o corpo sai das medidas digitadas e a roupa sai das escolhas do ateliê digital (peça, tecido, cor, silhueta, detalhes e coleção). O three.js só é baixado na página do provador.

| Arquivo                           | Papel                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `worker/index.ts`                 | Rotas, checagem de origem e CORS                                               |
| `worker/ai/prompt.ts`             | Valida os campos (só ids do catálogo e da linha escolhida) e monta o prompt    |
| `worker/ai/imageGen.ts`           | Chamada ao flux-1-schnell (4 passos): vínculo AI ou, no computador, API REST   |
| `worker/routes/orders.ts`         | Pedidos: validação, campo-isca contra robôs, limite por IP e painel com senha  |
| `worker/lib/`                     | Cache no KV, hash, senha (comparação em tempo constante), rate limit, exemplos |
| `src/data/atelierOptions.ts`      | Campos do formulário por linha: rótulo para a tela e trecho do prompt          |
| `src/data/measurements.ts`        | Medidas de cada linha: limites, valor típico e "como medir"                    |
| `src/data/mannequin.ts`           | Como cada escolha aparece no 3D: cor, tecido, partes da peça, luz da coleção   |
| `src/lib/mannequin/`              | Corpo pelas medidas, roupas (lofts de anéis) e cena com giro                   |
| `src/lib/orders/validate.ts`      | Validação do pedido, a mesma na tela e no Worker                               |
| `src/lib/ai/client.ts`, `lib/api` | Clientes usados pelas telas; nunca lançam erro                                 |

**Resiliência**: quando a IA de imagem não responde (tempo esgotado, cota do dia, limite por IP), a tela mostra a imagem de exemplo da mesma linha (`public/exemplos/peca.jpg` ou `peca-masculina.jpg`) e uma mensagem amigável (`src/data/aiMessages.ts`). Sem WebGL, o provador mostra um aviso no lugar do 3D e as medidas e o pedido continuam funcionando. Para trocar os exemplos por fotos geradas pela IA, rode `npm run dev` (com o token no `.env`) e, em outro terminal, `npm run exemplos:gerar` (as duas linhas) ou `npm run exemplos:gerar -- masculina` (só uma).

**Custos**: zero. O Workers AI tem 10.000 "neurons" grátis por dia (cerca de 170 imagens com 4 passos); o KV grátis cobre 100.000 leituras e 1.000 gravações por dia. O rate limit (5 imagens, 3 pedidos e 10 tentativas de senha por minuto por IP, em `wrangler.jsonc`) e o cache protegem essa cota.

**Dados pessoais**: o pedido guarda nome, contato e medidas do corpo. A cliente autoriza antes de enviar (caixa obrigatória); só o painel com senha lê os pedidos, e o ateliê pode apagar cada um (o botão apaga de vez).

### Variáveis de ambiente

Copie [`.env.example`](.env.example) para `.env` (que não vai para o Git). O Worker lê o `.env` em desenvolvimento; em produção, os segredos são cadastrados com `npx wrangler secret put`.

| Variável                                        | Onde                | Para quê                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ATELIE_SENHA`                                  | Worker (secreta)    | Senha do painel de pedidos. Sem ela, o painel fica fechado (os pedidos continuam sendo guardados).                                                                                                                                                                                                                 |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | só no computador    | Com as duas, o Worker local chama o Workers AI pela API REST e `npm run dev` gera imagens (basta a permissão "Workers AI"). O wrangler também as usa em `dev:ia` e `deploy` (aí o token precisa de "Edit Cloudflare Workers" mais "Workers AI: Edit"; alternativa: `npx wrangler login`). Nunca vão para produção. |
| `ALLOWED_ORIGINS`                               | Worker              | Outros domínios que podem chamar a API (o próprio site é sempre aceito).                                                                                                                                                                                                                                           |
| `IMAGE_TIMEOUT_MS`                              | Worker              | Tempo máximo da geração de imagem antes do exemplo.                                                                                                                                                                                                                                                                |
| `VITE_AI_API_URL`                               | navegador (público) | Endereço da API, se ficar em outro domínio. Vazio = mesmo endereço.                                                                                                                                                                                                                                                |

Nunca use o prefixo `VITE_` em chaves: o Vite embute essas variáveis no site e qualquer pessoa consegue lê-las.

### Publicar

```bash
npx wrangler login                        # ou token no .env
npx wrangler kv namespace create CACHE    # cole o id em wrangler.jsonc ("kv_namespaces")
npx wrangler secret put ATELIE_SENHA      # senha do painel de pedidos
npm run deploy
```

Depois do deploy, acrescente o endereço publicado (por exemplo `https://maison-aurore.<conta>.workers.dev`) em `ALLOWED_ORIGINS` só se outro domínio for chamar a API.

### Como testar

**Testes automáticos** (`npm test`): validação do formulário, do prompt e do pedido, cache, rate limit, tempo esgotado, cota esgotada, origem recusada, senha do painel, campo-isca, todas as combinações de peça × silhueta no manequim 3D e as telas, com a IA simulada.

**Geração de imagem (Workers AI)**

1. Preencha `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` no `.env`, rode `npm run dev` e abra `http://localhost:5173/atelie-digital`.
2. Escolha a linha (Feminina ou Masculina), as opções, e clique em "Criar peça": a foto aparece em poucos segundos.
3. Clique de novo sem mudar nada: aparece "Esta peça já tinha sido criada", vinda do cache.
4. Com as duas variáveis vazias (e sem `dev:ia`), a tela mostra o exemplo e a mensagem de indisponível: é o fallback funcionando.

Pelo terminal:

```bash
curl -X POST http://localhost:5173/api/pecas/imagem -H "Content-Type: application/json" \
  -d '{"linha":"feminina","peca":"vestido","tecido":"organza","cor":"marfim","silhueta":"sereia","detalhes":["bordado"],"colecao":"lumiere"}'
```

**Provador 3D e pedido**

1. Com uma peça criada, clique em "Ver em 3D e tirar medidas": o manequim aparece vestido com ela.
2. Arraste (ou use as setas do teclado ou os botões) para girar; "Costas" mostra a parte de trás.
3. Digite as medidas: o manequim muda na hora (campo vazio usa o valor típico, mostrado no próprio campo).
4. Preencha nome, e-mail, marque a autorização e clique em "Enviar ao ateliê": aparece o código do pedido (ex.: `AUR-7K3F9Q`).

**Painel do ateliê**: abra `http://localhost:5173/atelie/pedidos`, digite a `ATELIE_SENHA` do `.env` e veja os pedidos (foto, ficha da peça, medidas e contato). "Apagar pedido" remove de vez.

**Rate limit**: envie 4 pedidos em menos de 1 minuto; o quarto mostra "Muitos envios em pouco tempo".

## Acessibilidade

Elementos semânticos com `aria-labelledby` nas seções, link "Pular para o conteúdo", foco visível (giz sobre névoa, giz-claro sobre veludo), alvos de toque de no mínimo 44px nos botões, contraste mínimo de 5,5:1 nos textos e menu com foco preso, Esc e foco devolvido. A auditoria com axe-core não aponta nenhuma violação (desktop, celular, menu aberto, provador 3D e painel). No provador, o manequim tem texto alternativo com a peça e as medidas, gira pelo teclado e pelos botões e, com movimento reduzido, não gira sozinho; cada campo liga rótulo, dica e erro, e o foco vai ao primeiro campo com erro.
