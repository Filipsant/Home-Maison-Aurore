# Estudo de movimento: Floema → Maison Aurore

**Fase A do PROMPT, concluída em 06/11/2026.** Status: aprovado em 06/11/2026, com todas as recomendações da seção 9.

Referência estudada: https://floema.com/ (home, em português).
Este documento registra só **valores observáveis** (tempos, curvas, distâncias, pontos de disparo). Nenhum código, CSS, shader, SVG, imagem ou texto do Floema foi copiado para o projeto; os elementos são descritos pelo papel que têm na página, não pelos nomes internos.

---

## 1. Como foi medido

| Item                            | Detalhe                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navegador                       | Chromium 131 (Playwright 1.49) controlado por scripts, com a GPU real da máquina via D3D11. O modo de software caía para 3 a 10 fps e foi descartado. Medições a 60 fps estáveis.                                                                                                                                                                              |
| Viewports                       | Desktop 1440×900; mobile 390×844 com emulação de toque (`isMobile`, `hasTouch`).                                                                                                                                                                                                                                                                               |
| Gravação                        | Um script injetado antes da página registra, a cada frame: (a) os estilos inline que o GSAP escreve (`transform`, `opacity`, `clip-path`, `width`, variáveis CSS); (b) os eventos `transitionrun`/`animationstart` com duração, curva e atraso computados; (c) a posição do scroll. Em paralelo, um screencast via CDP captura o que acontece no canvas WebGL. |
| Por que não o painel Animations | O painel Animations do DevTools só enxerga animações CSS e Web Animations. As do Floema são GSAP (JavaScript), então a gravação frame a frame dá dados mais completos.                                                                                                                                                                                         |
| Ajuste de curvas                | Cada série foi comparada às curvas padrão do GSAP (`power1–4`, `expo`, `circ`, `sine`, em in, out e inOut) e a cubic-beziers usadas em CSS, com início, duração e curva livres. O erro quadrático médio ficou quase sempre abaixo de 0,005, numa escala de 0 a 1.                                                                                              |
| Primeiro frame já em andamento  | Em vários elementos, o primeiro frame visível chega com a animação já iniciada. Opacidade e posição andam juntas, então o valor inicial real foi deduzido pela coerência entre os dois canais (por exemplo, `y = 39,45%` com `opacity = 0,21` dá `y` inicial de 50%).                                                                                          |
| Três tipos de teste de scroll   | 1. Passeio lento do topo ao rodapé. 2. **Salto**: o scroll é posicionado instantaneamente e a página fica parada por 2,5s; o que continua mudando é animação no tempo, o que muda só com o scroll é _scrub_. 3. Scroll contínuo bem lento, de 30px por passo, que registra onde o elemento estava na tela quando começou a se mover.                           |
| Movimento reduzido              | A página foi carregada com `reducedMotion: 'reduce'` e os mesmos testes foram repetidos.                                                                                                                                                                                                                                                                       |

---

## 2. Visão geral do Floema

**Tecnologia observada**: Nuxt (Vue), GSAP, Lenis (smooth scroll) e Three.js (canvas fixo atrás do hero).

**Ordem da home**:

1. hero em tela cheia, fixo, com o título central e um campo de fotos em 3D;
2. coleções numeradas 01 a 05, numa seção fixada por cerca de 8 telas;
3. manifesto "Est. 2007" com notícias recentes;
4. produtos em destaque;
5. lista de coleções com contadores, por exemplo "(51)";
6. citação de sustentabilidade;
7. três colunas ilustradas;
8. newsletter;
9. rodapé amarelo com desenhos em linha.

---

## 3. Respostas aos pontos de verificação do prompt

| Ponto (seção 7.1, item 5)                     | Resposta                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preloader ou intro                            | **Não há preloader.** A tela vai do branco ao fundo da página e o conteúdo aparece em cerca de 0,5s. O título entra primeiro; o campo de fotos em WebGL só começa a surgir cerca de 1,8s depois, com fade de cerca de 0,6s.                                                                                                                                                                                                       |
| Título de abertura e "Scroll para Explorar ↓" | O título entra **linha por linha descendo de cima** (`y: -100% → 0`, opacidade 0 → 1, `circ.out`, 0,8s, cascata de 0,1s). O indicador de scroll **não tem animação de entrada**: fica numa faixa sticky no início da seção de coleções e só faz um balanço contínuo (`y ±3px`, opacidade 0,80 ↔ 0,95, 2s, ease-in-out, em loop).                                                                                                  |
| Smooth scroll                                 | **Sim, Lenis.** Inércia exponencial com λ ≈ 5,7/s: um tique de 400px faz 50% do caminho em cerca de 120ms, 95% em cerca de 530ms e para em cerca de 1,1s. Equivale a `lerp ≈ 0.1`. No toque o scroll é **nativo**, sem suavização extra.                                                                                                                                                                                          |
| Coleções 01 a 05                              | **Seção fixada** (8 telas no desktop). Cada imagem nova se **revela de baixo para cima sobre a anterior** com máscara atrelada ao scroll: linear, cerca de 2,4 telas por imagem, com leve sobreposição entre revelações. Cada imagem também tem parallax interno de 5%. Uma linha de progresso vai de 0 a 100% ao longo da seção. Quando a imagem nova chega à metade, o texto troca palavra por palavra (detalhes em E12 e E13). |
| Manifesto "Est. 2007"                         | **Por linhas, disparado uma vez**, não acompanha o scroll. Faz parte de uma timeline da seção: linhas finas e rótulos em 0s, imagem com cortina de cor em 0 a 0,1s, parágrafo por linhas em +0,5s.                                                                                                                                                                                                                                |
| Hover dos cards de coleção                    | O espaço da miniatura **alarga de 96px para 250px** (0,4s) e as imagens **se alternam a cada cerca de 150ms**, como um folioscópio, enquanto o mouse está em cima. O contador entre parênteses não anima; só é empurrado pelo espaço que alarga.                                                                                                                                                                                  |
| Imagens grandes e parallax                    | As imagens entram com **cortina de cor**: um bloco colorido se abre de cima para baixo e, 0,1s depois, a imagem se abre por cima com a mesma máscara. **Não há escala** na entrada. Parallax existe só onde é atrelado ao scroll: imagens das coleções (5%) e camada decorativa de sombra de folhas (-20%).                                                                                                                       |
| Desenhos em linha do rodapé                   | **Não são traçados.** São ilustrações que **deslizam na horizontal** com scrub linear enquanto o rodapé sobe.                                                                                                                                                                                                                                                                                                                     |
| Header ao rolar                               | **Não some nem encolhe.** Fica fixo e troca de tema (claro, escuro, amarelo) conforme a seção que está por baixo, com transição CSS de 0,5s `cubic-bezier(0.19, 1, 0.22, 1)`.                                                                                                                                                                                                                                                     |
| Hovers e cursor                               | **Não há cursor customizado.** Hovers em CSS: sublinhado `scaleX` (0,5s), pílulas que se afastam com mola (0,5s), zoom lento em imagens (3,4s), detalhes em E30 a E36.                                                                                                                                                                                                                                                            |

---

## 4. Catálogo de efeitos

Mobile (390px): **todos os valores são iguais ao desktop**, salvo indicação. Movimento reduzido: **o Floema ignora a preferência**; tudo roda igual, inclusive Lenis, loops e WebGL.

Gatilho "top 75%" significa que a animação dispara quando o topo do elemento chega a 75% da altura da tela. Todas as animações disparadas no scroll rodam **uma vez**: rolar de volta não repete (verificado descendo, subindo até o topo e descendo de novo).

| #   | Onde                               | Gatilho                      | O que muda                                                                                                                                                                                                                | Duração, atraso, cascata                                                                                           | Easing                                                                                                          | Scroll                                             | Mobile          | Reduced |
| --- | ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------- | ------- |
| E01 | Hero: título                       | Carregamento                 | Cada linha: `y -100% → 0`, `opacity 0 → 1`. Sem máscara de overflow.                                                                                                                                                      | 0,8s; cascata 0,1s. O primeiro frame visível chega em cerca de 50% da animação, então a entrada percebida é curta. | `circ.out`                                                                                                      | —                                                  | igual           | ignora  |
| E02 | Hero: campo de fotos (WebGL)       | Carregamento, cerca de +1,8s | Fade da cena (cerca de 0,6s); planos de foto avançam em profundidade, do centro para as bordas, em fluxo contínuo e lento (mais de 4s por travessia).                                                                     | contínuo                                                                                                           | linear                                                                                                          | —                                                  | igual           | ignora  |
| E03 | Hero inteiro                       | Scroll                       | Hero `position: fixed`; a seção seguinte sobe por cima, como uma cortina.                                                                                                                                                 | —                                                                                                                  | —                                                                                                               | nativo                                             | igual           | igual   |
| E04 | Indicador de scroll                | Contínuo                     | `y ±3px`, opacidade 0,80 ↔ 0,95                                                                                                                                                                                           | 2s, loop                                                                                                           | ease-in-out                                                                                                     | dentro da faixa sticky das coleções                | igual           | ignora  |
| E05 | Página                             | Roda do mouse                | Scroll suavizado com decaimento exponencial (λ ≈ 5,7/s)                                                                                                                                                                   | ~1,1s até parar                                                                                                    | `lerp ≈ 0.1`                                                                                                    | —                                                  | toque nativo    | ignora  |
| E06 | Header                             | Seção sob o header muda      | Cores de fundo, borda e texto (tema claro, escuro ou amarelo)                                                                                                                                                             | 0,5s (CSS)                                                                                                         | `cubic-bezier(0.19, 1, 0.22, 1)`                                                                                | troca quando o topo da seção chega ao topo da tela | igual           | ignora  |
| E07 | Coleções: seção                    | Scroll                       | Seção fixada (sticky)                                                                                                                                                                                                     | 8 telas (7200px a 1440×900)                                                                                        | —                                                                                                               | scrub                                              | igual (8 telas) | ignora  |
| E08 | Coleções: imagem seguinte          | Scroll                       | Máscara de baixo para cima, 100% → 0, por uma variável CSS                                                                                                                                                                | ~2,4 telas por imagem; uma nova a cada ~1,9 tela                                                                   | linear                                                                                                          | scrub direto (o Lenis suaviza)                     | igual           | ignora  |
| E09 | Coleções: parallax interno         | Scroll                       | `y 0 → -180px` dentro da moldura                                                                                                                                                                                          | 5% da distância rolada                                                                                             | linear                                                                                                          | scrub                                              | igual           | ignora  |
| E10 | Coleções: linha de progresso       | Scroll                       | largura 0 → 100%                                                                                                                                                                                                          | toda a seção fixada                                                                                                | linear                                                                                                          | scrub                                              | igual           | ignora  |
| E11 | Coleções: troca do texto (saída)   | Imagem nova a 50%            | Palavras `y 0 → 20%` e opacidade → 0; número `y 0 → -100%`; botão `y 0 → 35%`; cartão lateral some                                                                                                                        | palavras 0,8s (cascata 0,018s, **a partir da última**); número 0,7s; botão 0,4s; cartão 0,3s                       | `power4.in` (palavras, número); `power1.in` (botão, cartão)                                                     | disparo                                            | igual           | ignora  |
| E12 | Coleções: troca do texto (entrada) | idem                         | Número `y -100% → 0` (+0,24s); palavras `y 20% → 0` (+0,34s, cascata 0,018s); botão `y 35% → 0` (+0,54s); etiqueta: fundo cresce (0,55s) e ícone e rótulo surgem (0,3s, +0,6s)                                            | número 0,7s; palavras 0,8s; botão 0,4s                                                                             | `expo.out` (número, palavras, ícone); `power1.out` (botão); `expo.inOut` (fundo da etiqueta)                    | disparo                                            | igual           | ignora  |
| E13 | Manifesto: linhas finas            | top 75%                      | largura 0 → 100% a partir da esquerda                                                                                                                                                                                     | 2,0s; segunda linha +0,1s                                                                                          | `expo.inOut`                                                                                                    | uma vez                                            | igual           | ignora  |
| E14 | Manifesto: rótulos                 | top 75%                      | opacidade 0 → 1                                                                                                                                                                                                           | 0,7s, +0,1s                                                                                                        | `circ.out`                                                                                                      | uma vez                                            | igual           | ignora  |
| E15 | Manifesto: imagem                  | top 75%                      | Bloco de cor: `clip-path inset(0 0 100% 0) → inset(0)` (abre de cima para baixo). Imagem: mesma máscara.                                                                                                                  | bloco 0,7s; imagem 1,0s, +0,1s                                                                                     | bloco `expo.out`; imagem `expo.inOut`                                                                           | uma vez                                            | igual           | ignora  |
| E16 | Manifesto: parágrafo               | top 75%, +0,5s na timeline   | Cada linha: `y 50% → 0`, opacidade 0 → 1                                                                                                                                                                                  | 0,8s; cascata 0,03s                                                                                                | `circ.out`                                                                                                      | uma vez                                            | igual           | ignora  |
| E17 | Notícias recentes (2 cards)        | junto com E16                | `y 20% → 0`, opacidade 0 → 1                                                                                                                                                                                              | 0,8s; cascata 0,1s                                                                                                 | `circ.out`                                                                                                      | uma vez                                            | igual           | ignora  |
| E18 | Lista de coleções: linhas          | top 75%, cada linha          | `y 50px → 0`, opacidade 0 → 1                                                                                                                                                                                             | 0,8s                                                                                                               | `power3.out`                                                                                                    | uma vez                                            | igual           | ignora  |
| E19 | Lista de coleções: miniaturas      | junto com E18, +0,1s         | `y 30px → 0`, opacidade 0 → 1                                                                                                                                                                                             | 0,6s                                                                                                               | `power2.out`                                                                                                    | uma vez                                            | igual           | ignora  |
| E20 | Camada de sombra de folhas         | Scroll                       | `y 0 → -20%`                                                                                                                                                                                                              | do momento em que a seção entra até sair da tela (`top bottom` → `bottom top`)                                     | linear                                                                                                          | scrub                                              | igual           | ignora  |
| E21 | Citação: autor e descrição         | ~62% da tela                 | `y 10%` (autor) e `30%` (descrição) → 0, com fade                                                                                                                                                                         | 0,7s                                                                                                               | `circ.out`                                                                                                      | uma vez                                            | igual           | ignora  |
| E22 | Citação: imagem                    | junto com E21                | cortina de cor igual a E15                                                                                                                                                                                                | bloco 0,7s; imagem 1,0s, +0,1s                                                                                     | `expo.out` / `expo.inOut`                                                                                       | uma vez                                            | igual           | ignora  |
| E23 | Citação: linhas e link             | +0,8s depois de E21          | linhas `y 50% → 0`; link `y 100% → 0`; legenda da foto em fade (+1,1s)                                                                                                                                                    | linhas 0,8s, cascata 0,06s; link 1,0s                                                                              | `circ.out`                                                                                                      | uma vez                                            | igual           | ignora  |
| E24 | Três colunas ilustradas            | top 75%                      | Colunas `y 40%`, `80%`, `120% → 0` (deslocamento cresce da esquerda para a direita), com fade                                                                                                                             | 1,0s; cascata 0,05s                                                                                                | `circ.out`                                                                                                      | uma vez                                            | igual           | ignora  |
| E25 | Três colunas: imagens              | +0,5s depois de E24          | cortina de cor (E15) em cada imagem                                                                                                                                                                                       | blocos 0,7s; imagens 1,0s (+0,1s); cascata 0,1s                                                                    | `expo.out` / `expo.inOut`                                                                                       | uma vez                                            | igual           | ignora  |
| E26 | Rodapé: linhas divisórias          | ~85% da tela                 | largura 0 → 100%                                                                                                                                                                                                          | 1,0s                                                                                                               | `power2.out`                                                                                                    | uma vez                                            | igual           | ignora  |
| E27 | Rodapé: endereços                  | ~87% da tela                 | `y 20px → 0`, fade                                                                                                                                                                                                        | 0,6s; cascata 0,08s                                                                                                | `power2.out`                                                                                                    | uma vez                                            | igual           | ignora  |
| E28 | Rodapé: links e redes              | ~85–93% da tela              | links `y 14px → 0`; redes `y 10px → 0`; fade                                                                                                                                                                              | 0,5s (redes 0,45s); cascata 0,05s (principais), 0,033s (secundários)                                               | `power2.out`                                                                                                    | uma vez                                            | igual           | ignora  |
| E29 | Rodapé: desenhos em linha          | Scroll                       | deslocamento horizontal, por exemplo `x -9% → 10%` e `x 99% → 55%`                                                                                                                                                        | da entrada dos desenhos até o fim da página                                                                        | linear                                                                                                          | scrub                                              | igual           | ignora  |
| E30 | Links de texto                     | Hover                        | Sublinhado de 1px: `scaleX 0 → 1`, origem à esquerda. Link externo: ícone entra.                                                                                                                                          | 0,5s (CSS)                                                                                                         | `cubic-bezier(0.19, 1, 0.22, 1)`                                                                                | —                                                  | sem hover       | ignora  |
| E31 | Botão com ícone                    | Hover                        | O ícone se afasta da pílula do texto (`0 → 16px`) e cresce (`scale 1 → 1,07`)                                                                                                                                             | 0,5s (CSS)                                                                                                         | afastamento `cubic-bezier(0.175, 0.885, 0.32, 1.275)`; ícone `cubic-bezier(0.12, 1.2, 0.16, 2.35)` (mola forte) | —                                                  | sem hover       | ignora  |
| E32 | Pílulas de navegação               | Hover                        | Margens `0 → 20px` de cada lado: as vizinhas se afastam                                                                                                                                                                   | 0,5s (CSS)                                                                                                         | `cubic-bezier(0.175, 0.885, 0.32, 1.275)`                                                                       | —                                                  | sem hover       | ignora  |
| E33 | Card de notícia                    | Hover                        | Imagem `scale 1 → 1,02`; seta aparece                                                                                                                                                                                     | imagem 3,4s; seta 1,3s                                                                                             | `cubic-bezier(0.19, 1, 0.22, 1)`                                                                                | —                                                  | sem hover       | ignora  |
| E34 | Card de produto                    | Hover                        | Fundo escurece cerca de 3%; botão `y 21px → 0` com fade                                                                                                                                                                   | 0,5s                                                                                                               | `cubic-bezier(0.075, 0.82, 0.165, 1)`                                                                           | —                                                  | sem hover       | ignora  |
| E35 | Linha da lista de coleções         | Hover                        | Espaço da miniatura `96px → 250px`; 5 imagens se alternam em loop                                                                                                                                                         | espaço 0,4s; troca a cada ~0,15s                                                                                   | `cubic-bezier(0.215, 0.61, 0.355, 1)`                                                                           | —                                                  | sem hover       | ignora  |
| E36 | Campo de e-mail                    | Hover/foco                   | Cor de fundo                                                                                                                                                                                                              | 0,75s                                                                                                              | `cubic-bezier(0.19, 1, 0.22, 1)`                                                                                | —                                                  | igual           | ignora  |
| E37 | Menu: abrir (só mobile)            | Clique                       | Painel: fade 0 → 1 (0,58s, `power1.out`). Botão troca: `scale 0,67 → 1` (0,21s, `power3.out`). Busca `y 12px → 0` (0,45s, `power2.out`, +0,13s). Links `y 20px → 0` com fade (0,5s, `power1.out`, cascata 0,066s, +0,3s). | total ~1,1s                                                                                                        | ver ao lado                                                                                                     | —                                                  | —               | ignora  |
| E38 | Menu: fechar                       | Clique                       | Links **todos juntos**: `y 0 → -6px` e fade (0,15s, `power1.in`). Depois o painel some (0,23s, `power1.out`, +0,21s).                                                                                                     | total ~0,45s                                                                                                       | ver ao lado                                                                                                     | —                                                  | —               | ignora  |
| E39 | Troca de página (referência)       | Clique em link               | Barra de progresso no topo (`scaleX`) e fade. A página nova entra como E01, e a grade sobe de cerca de 200px (0,8s, `circ.out`, cascata 0,1s).                                                                            | —                                                                                                                  | —                                                                                                               | —                                                  | igual           | ignora  |

---

## 5. Catálogo de padrões → presets

Cada padrão vira uma função pura em `src/animations/presets/` (seção 5, regra 3 do PROMPT). Os valores vêm de `tokens.ts` (seção 6 deste documento).

| Preset (arquivo)                    | O que faz                                                                                                                                                                                                                     | Efeitos do Floema que cobre |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `textReveal.ts`                     | Divide em linhas com `SplitText` e anima cada linha com `y` e fade. Direção `up` (de 50%, padrão) ou `down` (de -100%, abertura). Cascata ajustável.                                                                          | E01, E16, E21, E23, E39     |
| `imageReveal.ts`                    | "Cortina de cor": um bloco de cor se abre de cima para baixo (`expo.out` 0,7s) e a mídia se abre por cima 0,1s depois (`expo.inOut` 1,0s). Sem escala.                                                                        | E15, E22, E25               |
| `lineDraw.ts`                       | Linha fina de 0 a 100% de largura (`scaleX`, origem à esquerda). Variantes `long` (2,0s `expo.inOut`) e `short` (1,0s `power2.out`).                                                                                          | E13, E26                    |
| `riseIn.ts`                         | Elementos sobem com fade. Distância, duração, curva e cascata vêm de variantes: `list` (50px, `power3.out` 0,8s), `thumb` (30px, `power2.out` 0,6s), `footer` (20px, 0,6s), `link` (14px, 0,5s).                              | E17, E18, E19, E27, E28     |
| `cascade.ts`                        | Colunas em cascata com deslocamento crescente (40%, 80%, 120%), `circ.out` 1,0s, cascata 0,05s.                                                                                                                               | E24                         |
| `wordSwap.ts`                       | Troca de conteúdo palavra por palavra: saída (`power4.in`, a partir da última palavra) e entrada (`expo.out`, a partir da primeira), mais elementos auxiliares (botão, índice).                                               | E11, E12                    |
| `pinnedReveal.ts`                   | Seção fixada com N painéis: máscara de baixo para cima atrelada ao scroll (linear, ~2,4 telas por painel), parallax interno de 5%, linha de progresso e um callback quando cada painel passa de 50% (que dispara `wordSwap`). | E07 a E10                   |
| `parallax.ts`                       | Deslocamento linear atrelado ao scroll em `y` ou `x`, de `top bottom` a `bottom top` por padrão.                                                                                                                              | E09, E20, E29               |
| `headerTheme.ts`                    | `ScrollTrigger` por seção que troca o `data-theme` do header quando o topo da seção chega ao topo da tela. A cor muda por transição CSS (0,5s).                                                                               | E06                         |
| `flipbook.ts` + hook de estado      | Alterna imagens a cada 0,15s enquanto o mouse está em cima e alarga o espaço da imagem. A lógica de índice fica num hook testável com Vitest.                                                                                 | E35                         |
| `Menu/menu.animation.ts` (da seção) | Timeline do menu: abertura (E37) e fechamento (E38).                                                                                                                                                                          | E37, E38                    |
| Hovers em Tailwind (sem preset)     | Sublinhado (E30), afastamento com mola (E31, E32), zoom lento (E33), tingimento de card (E34), campo de e-mail (E36), usando as curvas e durações dos tokens.                                                                 | E30 a E36                   |
| Loop em CSS                         | Balanço do indicador de scroll (E04), via `@keyframes` em `globals.css`.                                                                                                                                                      | E04                         |

**Não entram na Fase B**, porque o Floema não tem: preloader (a pasta `Preloader/` não será criada), cursor customizado, header que some ou encolhe, traço de SVG sendo desenhado.

---

## 6. Tokens medidos (base de `src/animations/tokens.ts`)

Rascunho com os valores deste estudo. Os nomes descrevem o uso na Maison Aurore.

```ts
export const ease = {
  text: 'circ.out', // linhas e blocos de texto (E01, E16, E21, E23, E24)
  enter: 'expo.out', // bloco de cor, conteúdo que entra numa troca (E12, E15)
  mask: 'expo.inOut', // máscara de mídia, linhas longas (E13, E15)
  exit: 'power4.in', // conteúdo que sai numa troca (E11)
  list: 'power3.out', // linhas de lista (E18)
  soft: 'power2.out', // miniaturas, rodapé, linhas curtas (E19, E26–E28)
  ui: 'power1.out', // menu, botões (E12, E37)
  uiExit: 'power1.in', // saída de botões e menu (E11, E38)
  toggle: 'power3.out', // troca do botão do menu (E37)
  scrub: 'none', // tudo que é atrelado ao scroll (E08–E10, E20, E29)
} as const

export const duration = {
  titleLine: 0.8,
  line: 0.8,
  block: 1.0,
  label: 0.7,
  curtainBlock: 0.7,
  curtainMedia: 1.0,
  lineLong: 2.0,
  lineShort: 1.0,
  list: 0.8,
  thumb: 0.6,
  footerItem: 0.6,
  link: 0.5,
  social: 0.45,
  wordOut: 0.8,
  wordIn: 0.8,
  indexSwap: 0.7,
  buttonSwap: 0.4,
  menuPanel: 0.58,
  menuToggle: 0.21,
  menuItem: 0.5,
  menuItemOut: 0.15,
  menuPanelOut: 0.23,
} as const

export const stagger = {
  titleLines: 0.1,
  lines: 0.03,
  linesLoose: 0.06,
  words: 0.018,
  columns: 0.05,
  media: 0.1,
  footer: 0.08,
  links: 0.05,
  linksDense: 0.033,
  menu: 0.066,
} as const

export const delay = {
  curtainMedia: 0.1, // mídia depois do bloco de cor
  thumb: 0.1, // miniatura depois da linha
  sectionBody: 0.5, // texto principal depois de linhas e rótulos (manifesto)
  swapIn: 0.24,
  swapWords: 0.34,
  swapButton: 0.54, // troca de conteúdo
  menuItems: 0.3,
  menuPanelOut: 0.21,
} as const

export const distance = {
  titleDrop: -100, // yPercent, abertura (de cima)
  line: 50, // yPercent
  word: 20, // yPercent
  button: 35, // yPercent
  cascade: [40, 80, 120], // yPercent por coluna
  listPx: 50,
  thumbPx: 30,
  footerPx: 20,
  linkPx: 14,
  socialPx: 10,
  menuPx: 20,
  menuOutPx: -6,
} as const

export const trigger = { start: 'top 75%', footerStart: 'top 90%', once: true } as const

export const smoothScroll = { lerp: 0.1, wheelMultiplier: 1, syncTouch: false } as const

export const scrub = {
  panelRevealVh: 2.4, // telas por painel (E08)
  panelStepVh: 1.9, // distância entre o início de dois painéis
  swapAt: 0.5, // troca de conteúdo na metade da revelação
  mediaParallax: 0.05, // 5% da distância rolada (E09)
  decorParallax: -20, // yPercent ao atravessar a tela (E20)
} as const

// Hovers e transições em CSS (Tailwind): curvas e tempos
export const cssEase = {
  outExpo: 'cubic-bezier(0.19, 1, 0.22, 1)', // E06, E30, E33, E36
  outCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)', // E34
  outCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)', // E35
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // E31, E32
  pop: 'cubic-bezier(0.12, 1.2, 0.16, 2.35)', // ícone do E31
} as const

export const hover = {
  underline: 0.5,
  spring: 0.5,
  springGapPx: 16,
  pillGapPx: 20,
  iconScale: 1.07,
  zoom: 3.4,
  zoomScale: 1.02,
  tint: 0.5,
  revealPx: 21,
  slot: 0.4,
  flipbookInterval: 0.15,
  input: 0.75,
  headerTheme: 0.5,
} as const

export const loop = { bob: { duration: 2, yPx: 3, opacity: [0.8, 0.95] } } as const
```

---

## 7. Mapa: padrão do Floema → seção da Maison Aurore

| Seção (ordem da Sigma)         | Padrões aplicados                                                                                                                | Como fica                                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header**                     | `headerTheme` (E06), hovers E30 e E32                                                                                            | Não some ao rolar. Tema claro sobre névoa e escuro quando passa sobre seções veludo (ArtProject, Footer). Links da navegação com sublinhado; os dois botões em pílula se afastam com mola no hover.                                                                                                                                   |
| **Menu** (Sheet, `side="top"`) | `menu.animation.ts` (E37, E38)                                                                                                   | Painel veludo em fade (0,58s). Links grandes em Italiana sobem 20px em cascata de 0,066s a partir de +0,3s; o rodapé do menu entra junto com o último link. Fechamento rápido (ver decisão 3).                                                                                                                                        |
| **1. FeatureHero**             | `textReveal` direção `down` (E01), `imageReveal` (E15), `textReveal` `up` (E16), `riseIn`, loop E04 (decisão 5)                  | Ordem do Floema, primeiro o texto: "Lumière" e a linha de apoio descem em `circ.out` 0,8s, com cascata de 0,1s. Em seguida a mídia abre com cortina de musselina. Os dois parágrafos e o botão entram no scroll (top 75%). Opcional: mídia fixa coberta pelo resto da seção, como o hero do Floema (decisão 2).                       |
| **2. NewArrivals**             | `textReveal`, `imageReveal` (cascata 0,1s), `riseIn` `thumb`, hovers E33 e E30                                                   | Título por linhas; as duas imagens abrem com cortina (musselina e veludo); nome e material sobem. Hover: zoom de 1,02 em 3,4s e sublinhado em "Ver peça".                                                                                                                                                                             |
| **3. FeaturedPieces**          | `pinnedReveal` e `wordSwap` (E07 a E12)                                                                                          | **Recomendado:** seção fixada com 3 painéis em tela cheia, cada peça se revelando de baixo para cima conforme o scroll, com parallax de 5% e linha de progresso. Nome e material trocam palavra por palavra. Sem numeração, porque não há sequência real. "Ver todas as peças" entra com `riseIn` ao final. Alternativa na decisão 1. |
| **4. Editorial**               | `cascade` (E24), `imageReveal` (E25), hovers E33 e E30                                                                           | As 3 histórias sobem em cascata (40/80/120%); as fotos abrem com cortina de cor a partir de +0,5s, com cascata de 0,1s. Hover: zoom lento. "Todo o editorial" com sublinhado.                                                                                                                                                         |
| **5. ArtProject**              | `parallax` decorativo (E20), `lineDraw` `long` (E13), `textReveal` (E16), `riseIn`                                               | Imagem de fundo com deslocamento linear de -20% ao atravessar a tela. Linha fina de 2s acima do título. "Arquivo Aurore" e o texto entram por linhas (+0,5s, cascata 0,03s, como o manifesto). Botão "Conhecer o livro" sobe por último. Header em tema escuro.                                                                       |
| **6. VideoFeatures**           | `imageReveal` (E15), `textReveal`, hover E30                                                                                     | Cada vídeo abre com cortina (veludo-2 e lilás), com cascata de 0,1s entre os blocos; títulos por linhas; links com sublinhado. O vídeo só começa a tocar quando está na tela e revelado.                                                                                                                                              |
| **7. Categories**              | `riseIn` `list` e `thumb` (E18, E19), `flipbook` (E35), hover E30                                                                | Os 3 cards sobem 50px em `power3.out` 0,8s, e as imagens 30px 0,1s depois. Hover: as imagens da categoria se alternam a cada 0,15s. "Ler mais" com sublinhado. Sem contador, porque não há dado aprovado para ele.                                                                                                                    |
| **Footer**                     | `textReveal`, `lineDraw` `short` (E26), `riseIn` `footer` e `link` (E27, E28), `parallax` horizontal (E29, decisão 4), hover E36 | "Venha provar no ateliê" por linhas; divisórias desenhadas em 1s; colunas e links sobem 20 ou 14px em cascata (top 90%). A assinatura "Aurore" desliza na horizontal com o scroll. Fundo do campo de e-mail com transição de 0,75s.                                                                                                   |

**Mobile (< 760px)**: seguem as regras do PROMPT. Hovers desativados (flipbook, zoom, afastamentos); os efeitos de scroll continuam, como no Floema, que não simplifica nada no mobile. Lenis só suaviza a roda do mouse; o toque fica nativo (`syncTouch: false`), como medido.

**Movimento reduzido** (o Floema ignora a preferência; aqui ela vale, conforme a seção 7.3 do PROMPT): sem Lenis; timelines direto ao fim (`tl.progress(1)`); sem scrub, pin ou parallax, então FeaturedPieces vira uma pilha estática; sem o loop do indicador; vídeos sem autoplay; hovers mantêm a mudança de cor, sem movimento.

**Smooth scroll**: recomendo **Lenis**, e não ScrollSmoother. É o que o Floema usa (os valores medidos são de Lenis); mantém o scroll nativo, então `position: sticky` e `fixed` continuam funcionando; e convive bem com o Sheet do Radix (basta `lenis.stop()` com o menu aberto). Ligação: `lenis.on('scroll', ScrollTrigger.update)` e `gsap.ticker.add`.

---

## 8. Diferenças em relação aos "valores de partida" do PROMPT

| Item              | Valor de partida do PROMPT                           | Medido no Floema                                                                                                                                          |
| ----------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Easing de entrada | `expo.out`                                           | Texto em `circ.out`; `expo.out` só para blocos de cor e conteúdo que entra numa troca                                                                     |
| Easing de máscara | `power4.inOut`                                       | `expo.inOut`                                                                                                                                              |
| Texto por linhas  | `yPercent 105 → 0`, 1,2–1,6s, cascata 0,08           | `yPercent 50 → 0` com fade, 0,8s, cascata 0,03–0,06 (abertura: de -100%, cascata 0,1). Sem máscara de overflow.                                           |
| Imagens           | `inset(100% 0 0 0) → inset(0)`, escala 1,2 → 1, 1,6s | Bloco de cor primeiro (0,7s `expo.out`), depois a imagem com `inset(0 0 100% 0) → inset(0)` (abre de cima para baixo), 1,0s `expo.inOut`. **Sem escala.** |
| Parallax          | `yPercent ±8`, scrub                                 | 5% da distância rolada (mídia) e -20% (camada decorativa), linear                                                                                         |

---

## 9. Decisões aprovadas para a Fase B

Aprovadas em 06/11/2026: em todos os itens vale a opção recomendada.

**Revisão do item 1 (06/11/2026):** na leitura do Figma, "Peças em destaque" aparece como lista com prévia no hover. A decisão final é seguir o Figma: lista com prévia (padrão E35, sem a seção fixada E07 a E12).

1. **FeaturedPieces.** Opção A (recomendada): seção fixada com 3 painéis e troca de texto, que é o efeito mais característico do Floema. Opção B: lista com hover em folioscópio (E35), mais simples e mais curta.
2. **Hero coberto pela seção seguinte (E03).** Recomendo fixar a mídia e o título do FeatureHero enquanto o restante da seção sobe por cima. Alternativa: hero rolando normalmente.
3. **Fechamento do menu.** O Floema fecha em cerca de 0,45s, com outra coreografia; o PROMPT pede uma timeline com `play()` e `reverse()`. Recomendo manter `reverse()` com `timeScale` de cerca de 2,4 no fechamento, o que dá aproximadamente o mesmo tempo, e desmontar no `onReverseComplete`. Alternativa: uma segunda timeline só de fechamento, igual à do Floema.
4. **Desenhos do rodapé.** No Floema eles deslizam na horizontal, não são traçados. Recomendo aplicar esse deslizamento à assinatura gigante "Aurore", sem criar ilustrações novas. Alternativa: desenhar SVGs próprios em linha (por exemplo, um manequim de costura) com o mesmo deslizamento.
5. **Indicador de scroll no hero.** O Floema usa um rótulo com seta e balanço contínuo. As regras de estilo proíbem setas no fim de links e caixa alta, e não há texto aprovado para isso. Recomendo uma linha fina vertical com o balanço (E04), sem texto. Alternativa: nenhum indicador.

---

## 10. Limitações

- O campo de fotos em WebGL do hero (E02) foi avaliado só visualmente, por frames; tempos aproximados.
- O atraso de cerca de 1,8s entre o título e as fotos do hero pode incluir carregamento de texturas. Para a Maison Aurore proponho começar a mídia logo depois do título (cerca de 0,9s) e ajustar na comparação final (etapa 11 do PROMPT).
- Pontos de disparo têm margem de cerca de ±3% da altura da tela (passos de 30px).
- Não medi a saída dos hovers (por exemplo, se o sublinhado recolhe para a direita) nem a inércia de um "fling" no toque; o gesto sintético não tem fling.
- Medições feitas em 06/11/2026; o site pode mudar.
