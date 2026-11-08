# Maison Aurore — home

Home de uma maison fictícia de alta costura. A estrutura das seções segue a home da [Sigma](https://www.sigma-global.com/en/index.html) e o movimento reproduz a sensação da [Floema](https://floema.com/), reimplementado do zero em GSAP a partir de valores medidos (nenhum código, imagem ou texto dos dois sites foi copiado). O visual vem do Figma da Maison Aurore.

Além da home, há um **ateliê digital** com IA, de custo zero: a página **Criar peça** gera uma fotografia de moda a partir das escolhas do formulário, nas linhas **feminina** e **masculina**, e o **Provador virtual** veste essa peça na própria cliente: ela envia fotos do corpo (frente, costas e lado) e as medidas, a IA gera a prova, a cliente pede correções com as próprias palavras e envia o pedido sob medida ao ateliê.

## Stack

React 18, TypeScript (strict), Vite, Tailwind CSS 4, shadcn/ui (Radix), GSAP 3 (ScrollTrigger, SplitText, `useGSAP`), Lenis, Vitest + Testing Library, ESLint + Prettier. Back-end: Cloudflare Worker em TypeScript, com Workers AI (FLUX.1 [schnell] para as peças, FLUX.2 [klein] para as provas) e Workers KV.

## Como rodar

```bash
npm install
npm run dev          # site + API em http://localhost:5173 (gera imagens se o .env tiver conta e token do Cloudflare)
npm run dev:ia       # igual, mas pelo vínculo AI remoto (precisa de `wrangler login`)
npm run build        # checa os tipos e gera o site e o Worker em dist/
npm run lint
npm test             # 124 testes: site (jsdom) e Worker (Node), sem gastar cota
npm run deploy       # publica no Cloudflare
```

Páginas: `/` (home), `/atelie-digital` (Criar peça) e `/provador` (Provador virtual), com links no menu e no rodapé. O painel do ateliê fica em `/atelie/pedidos` (com senha, fora do menu e dos buscadores).

## Seções (ordem da Sigma)

Header e Menu, FeatureHero (coleção Lumière), NewArrivals, FeaturedPieces, Editorial "Vestido por", ArtProject "Arquivo Aurore", VideoFeatures, Categories e Footer.

## Arquitetura

```
src/
├── app/             App, rotas (routes.tsx) e providers (movimento, menu)
├── pages/           home, atelie-digital, provador e pedidos: só compõem as seções
├── sections/        uma pasta por seção: Componente.tsx + componente.animation.ts
├── components/ui/   shadcn (Button, Sheet, Input, Label) com a paleta da maison
├── components/shared/  Container, SectionHeading, TextLink, Photo, VideoTeaser, OptionGroup, ImageInput, AiResultFrame
├── lib/api/         clientes das provas (fitting.ts) e dos pedidos (orders.ts)
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

## Fotos e vídeos

A home usa fotos e vídeos de acervos de uso livre (The Met e Rijksmuseum em CC0, Pexels com licença livre): o hero tem o vídeo de um vestido de gala numa rua à noite sobre a foto de manequins em musselina, e os demais cards têm peças de alta costura (House of Worth, Maison Pingat), editoriais, gravuras de moda dos anos 1930 e dois filmes de ateliê. Fontes, autores e licenças de cada arquivo estão em [`docs/creditos-midia.md`](docs/creditos-midia.md).

Os arquivos ficam em `public/fotos/` (WebP, recortados no formato de cada card) e `public/videos/` (WebM + MP4, sem áudio, com poster). Para trocar uma imagem, substitua o arquivo ou edite só o `src/data/`; os componentes não mudam.

```ts
// src/data/newArrivals.ts — foto
media: {
  caption: 'Vestido Aube',
  tone: 'musselina',          // cor da cortina e do fundo enquanto carrega
  aspect: 4 / 5,
  src: '/fotos/vestido-aube.webp',
  alt: 'Vestido de baile rosa em cetim de seda, com espigas bordadas em dourado',
},

// src/data/videoFeatures.ts — vídeo (mudo, em loop, só toca na tela, com botão de pausa)
media: {
  caption: 'Bastidores do ateliê',
  tone: 'veludo',
  aspect: 4 / 5,
  videoWebm: '/videos/atelie-bastidores.webm', // Chrome, Edge, Firefox (mais leve)
  videoSrc: '/videos/atelie-bastidores.mp4',   // Safari e iPhone
  poster: '/videos/poster-atelie.webp',
  alt: 'Vídeo: mãos ajustando a fita métrica num manequim',
},
```

O hero (`src/data/hero.ts`) aceita o mesmo formato em `finalPiece` (vídeo ou foto) e `toile` (foto); sem `src`/`videoSrc`, volta aos desenhos do Figma. Com movimento reduzido, nenhum vídeo toca sozinho: fica o poster. Endereço, contatos e redes do rodapé ficam em `src/data/site.ts`: itens sem `href` aparecem como texto até serem preenchidos.

## Integrações

### Arquitetura

```
Navegador ── /atelie-digital (Criar peça) ⇄ /provador (Provador virtual) ── /atelie/pedidos (painel)
    │  (fotos do corpo reduzidas no navegador para até 1024px)
    ▼
Cloudflare Worker (worker/) ── mesmo endereço do site, rotas /api/*
    ├─ origem permitida? ── não → 403
    ├─ POST /api/pecas/imagem ─→ cache (KV, chave = SHA-256 do pedido)? sim → na hora, sem gastar cota
    │                            senão: rate limit por IP → Workers AI flux-1-schnell (tempo máx. 20s)
    │                            guarda a foto (img:<hash>) e as escolhas (peca:<hash>) por 30 dias
    ├─ GET  /api/imagens/:hash ─→ a foto guardada (cache longo no navegador)
    ├─ GET  /api/pecas/:hash ───→ as escolhas da peça (provador e "Ajustar a peça")
    ├─ POST /api/provas ────────→ foto do corpo + peça + medidas → FLUX.2 [klein] 4B (tempo máx. 45s)
    │                            correção: prova anterior + texto da cliente (passa por um filtro)
    │                            guarda só a prova (img:<hash>, prova:<hash>) por 7 dias; a foto nunca
    ├─ POST /api/pedidos ───────→ peça + medidas + contato + provas → KV (pedido:<id>), sem prazo
    └─ GET/DELETE /api/pedidos ─→ painel do ateliê, com senha (ATELIE_SENHA)
```

A **prova virtual** usa o FLUX.2 [klein] 4B, que edita imagens a partir de referências: a imagem 1 é a foto da cliente e a imagem 2 é a peça do ateliê digital. O prompt (fixo, em inglês) pede para manter rosto, corpo, pose e enquadramento e reproduzir a peça; as medidas entram como dados. A **correção** edita a prova anterior com o texto da cliente, mudando só o que foi pedido. Nos testes, o klein 4B preservou o rosto melhor que o 9B e o FLUX.2 [dev] (este último também inventou partes da roupa e é bem mais caro).

| Arquivo                           | Papel                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `worker/index.ts`                 | Rotas, checagem de origem e CORS                                               |
| `worker/ai/prompt.ts`             | Valida os campos (só ids do catálogo e da linha escolhida) e monta o prompt    |
| `worker/ai/imageGen.ts`           | Chamadas ao Workers AI (schnell e FLUX.2): vínculo AI ou, no computador, REST  |
| `worker/ai/fittingPrompt.ts`      | Prompt da prova e da correção, filtro da correção (despir, trocar rosto)       |
| `worker/routes/fitting.ts`        | Prova virtual: valida fotos e campos, cache, limite por IP, FLUX.2             |
| `worker/routes/orders.ts`         | Pedidos: validação, campo-isca contra robôs, limite por IP e painel com senha  |
| `worker/lib/`                     | Cache no KV, hash, senha (comparação em tempo constante), rate limit, exemplos |
| `src/data/atelierOptions.ts`      | Campos do formulário por linha: rótulo para a tela e trecho do prompt          |
| `src/data/measurements.ts`        | Medidas de cada linha: limites, valor típico e "como medir"                    |
| `src/sections/FittingStudio/`     | Tela do provador: fotos, medidas, abas Frente/Costas/Lado, correções, pedido   |
| `src/lib/orders/validate.ts`      | Validação do pedido, a mesma na tela e no Worker                               |
| `src/lib/ai/client.ts`, `lib/api` | Clientes usados pelas telas; nunca lançam erro                                 |

**Resiliência**: quando a IA de imagem não responde (tempo esgotado, cota do dia, limite por IP), a tela mostra a imagem de exemplo da mesma linha (`public/exemplos/peca.jpg` ou `peca-masculina.jpg`) e uma mensagem amigável (`src/data/aiMessages.ts`). No provador, uma falha mostra a mensagem do motivo (limite, tempo, cota do dia, correção recusada) e mantém as fotos, as medidas e as provas anteriores. Para trocar os exemplos por fotos geradas pela IA, rode `npm run dev` (com o token no `.env`) e, em outro terminal, `npm run exemplos:gerar` (as duas linhas) ou `npm run exemplos:gerar -- masculina` (só uma).

**Custos**: zero, dentro da cota grátis do Workers AI: 10.000 "neurons" por dia, divididos entre as peças (flux-1-schnell, barato) e as provas (FLUX.2 klein, mais caro por imagem, porque recebe duas imagens de referência). Quando a cota do dia acaba, as duas telas avisam e voltam a funcionar à meia-noite UTC (21h em Brasília). O custo exato de cada modelo aparece no painel do Cloudflare (Workers AI → Analytics). O KV grátis cobre 100.000 leituras e 1.000 gravações por dia. O rate limit (5 imagens, 6 provas, 3 pedidos e 10 tentativas de senha por minuto por IP, em `wrangler.jsonc`) e o cache protegem a cota.

**Dados pessoais**: as fotos do corpo nunca são guardadas: vão ao Workers AI só para gerar a prova. As provas ficam 7 dias no KV (para a cliente corrigir e enviar); se forem com o pedido, ficam com ele. A cliente confirma que as fotos são dela e que tem 18 anos ou mais antes de gerar, e autoriza guardar medidas, provas e contato antes de enviar o pedido. Só o painel com senha lê os pedidos, e o ateliê pode apagar cada um (o botão apaga de vez).

### Variáveis de ambiente

Copie [`.env.example`](.env.example) para `.env` (que não vai para o Git). O Worker lê o `.env` em desenvolvimento; em produção, os segredos são cadastrados com `npx wrangler secret put`.

| Variável                                        | Onde                | Para quê                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ATELIE_SENHA`                                  | Worker (secreta)    | Senha do painel de pedidos. Sem ela, o painel fica fechado (os pedidos continuam sendo guardados).                                                                                                                                                                                                                 |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | só no computador    | Com as duas, o Worker local chama o Workers AI pela API REST e `npm run dev` gera imagens (basta a permissão "Workers AI"). O wrangler também as usa em `dev:ia` e `deploy` (aí o token precisa de "Edit Cloudflare Workers" mais "Workers AI: Edit"; alternativa: `npx wrangler login`). Nunca vão para produção. |
| `ALLOWED_ORIGINS`                               | Worker              | Outros domínios que podem chamar a API (o próprio site é sempre aceito).                                                                                                                                                                                                                                           |
| `IMAGE_TIMEOUT_MS`, `PROVA_TIMEOUT_MS`          | Worker              | Tempo máximo da geração da peça (antes do exemplo) e da prova virtual.                                                                                                                                                                                                                                             |
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

**Testes automáticos** (`npm test`): validação do formulário, do prompt e do pedido, cache, rate limit, tempo esgotado, cota esgotada, origem recusada, senha do painel, campo-isca, prova virtual (foto, correção, filtro, histórico de versões, provas no pedido) e as telas, com a IA simulada.

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

**Provador virtual e pedido**

1. Com uma peça criada, clique em "Provar em você".
2. Envie a foto de frente (obrigatória) e, se quiser, de costas e de lado: corpo inteiro, roupas justas, fundo liso. Preencha as medidas que souber e confirme que as fotos são suas.
3. Clique em "Gerar prova": cada foto vira uma prova (abas Frente, Costas e Lado), em poucos segundos.
4. Em "O que precisa mudar?", escreva uma correção (ex.: "manga até o punho") e clique em "Aplicar correção": aparece a versão 2; "Voltar à versão anterior" desfaz.
5. "Ajustar a peça" volta ao ateliê digital com as mesmas escolhas, para mudar a roupa e provar de novo.
6. Preencha todas as medidas, nome e e-mail, autorize e clique em "Enviar ao ateliê": aparece o código do pedido (ex.: `AUR-7K3F9Q`).

**Painel do ateliê**: abra `http://localhost:5173/atelie/pedidos`, digite a `ATELIE_SENHA` do `.env` e veja os pedidos (foto, ficha da peça, medidas e contato). As provas aparecem em miniatura e abrem em tamanho real. "Apagar pedido" remove de vez.

**Rate limit**: envie 4 pedidos em menos de 1 minuto; o quarto mostra "Muitos envios em pouco tempo".

## Acessibilidade

Elementos semânticos com `aria-labelledby` nas seções, link "Pular para o conteúdo", foco visível (giz sobre névoa, giz-claro sobre veludo), alvos de toque de no mínimo 44px nos botões, contraste mínimo de 5,5:1 nos textos e menu com foco preso, Esc e foco devolvido. A auditoria com axe-core não aponta nenhuma violação (desktop, celular, menu aberto, provador e painel). No provador, as vistas são abas acessíveis (setas do teclado trocam de aba), cada prova tem texto alternativo, o estado da IA é anunciado a leitores de tela, cada campo liga rótulo, dica e erro, e o foco vai ao primeiro campo com erro.
