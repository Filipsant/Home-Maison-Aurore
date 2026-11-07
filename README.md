# Maison Aurore — home

Home de uma maison fictícia de alta costura. A estrutura das seções segue a home da [Sigma](https://www.sigma-global.com/en/index.html) e o movimento reproduz a sensação da [Floema](https://floema.com/), reimplementado do zero em GSAP a partir de valores medidos (nenhum código, imagem ou texto dos dois sites foi copiado). O visual vem do Figma da Maison Aurore.

## Stack

React 18, TypeScript (strict), Vite, Tailwind CSS 4, shadcn/ui (Radix), GSAP 3 (ScrollTrigger, SplitText, `useGSAP`), Lenis, Vitest + Testing Library, ESLint + Prettier.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # checa os tipos e gera dist/
npm run lint
npm test
```

## Seções (ordem da Sigma)

Header e Menu, FeatureHero (coleção Lumière), NewArrivals, FeaturedPieces, Editorial "Vestido por", ArtProject "Arquivo Aurore", VideoFeatures, Categories e Footer.

## Arquitetura

```
src/
├── app/             App e providers (movimento, menu)
├── pages/home/      HomePage: só compõe as seções
├── sections/        uma pasta por seção: Componente.tsx + componente.animation.ts
├── components/ui/   shadcn (Button, Sheet, Input, Label) com a paleta da maison
├── components/shared/  Container, SectionHeading, TextLink, Photo, VideoTeaser
├── animations/      gsap.ts, tokens.ts, smoothScroll.ts, presets/, hooks/
├── data/            todo o conteúdo, tipado
├── types/           tipos do conteúdo
└── styles/          globals.css: tema do Tailwind (cores, tipografia, curvas)
```

Regras, verificadas pelo ESLint e pelos testes:

- Uma seção não importa outra.
- O GSAP só é importado em `src/animations/` (pelo arquivo `gsap.ts`).
- Todo valor de animação vem de `src/animations/tokens.ts`; todo conteúdo vem de `src/data/`.
- Cores, fontes e tamanhos só pelos tokens do tema (as paletas padrão do Tailwind foram removidas).
- As animações rodam via `useGSAP` com escopo na seção: tudo é desfeito no unmount.

## Movimento

O estudo completo está em [`docs/motion-study.md`](docs/motion-study.md): catálogo com 39 efeitos medidos na Floema, os presets derivados e o mapa padrão → seção. Os presets ficam em `src/animations/presets/`:

| Preset | Onde |
|---|---|
| `textReveal` (linhas descendo na abertura, subindo no scroll) | títulos e parágrafos |
| `imageReveal` (cortina de cor + imagem) | fotos e vídeos |
| `cascade` (colunas com deslocamento crescente) | Editorial |
| `riseIn`, `lineDraw`, `parallax`, `headerTheme` | listas, linhas finas, fundo do Arquivo, assinatura do rodapé, tema do header |

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

## Variáveis de ambiente

O site em si não precisa de nenhuma. O arquivo [`.env.example`](.env.example) documenta as variáveis da futura integração de IA. Copie para `.env` (que não vai para o Git) e nunca use o prefixo `VITE_` em chaves: tudo com esse prefixo fica público no navegador.

## Acessibilidade

Elementos semânticos com `aria-labelledby` nas seções, link "Pular para o conteúdo", foco visível (giz sobre névoa, giz-claro sobre veludo), alvos de toque de no mínimo 44px nos botões, contraste mínimo de 5,5:1 nos textos e menu com foco preso, Esc e foco devolvido. A auditoria com axe-core não aponta nenhuma violação (desktop, celular e menu aberto).
