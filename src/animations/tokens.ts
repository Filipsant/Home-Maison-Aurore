/**
 * Valores de movimento medidos no Floema (docs/motion-study.md, seções 4 e 6).
 * Nenhuma seção usa números soltos: tudo sai daqui.
 * Códigos entre parênteses (E01, E15…) apontam para o catálogo do estudo.
 */

export const ease = {
  /** Linhas e blocos de texto (E01, E16, E21, E23, E24). */
  text: 'circ.out',
  /** Bloco de cor e conteúdo que entra numa troca (E12, E15). */
  enter: 'expo.out',
  /** Máscara de mídia e linhas longas (E13, E15). */
  mask: 'expo.inOut',
  /** Conteúdo que sai numa troca (E11). */
  exit: 'power4.in',
  /** Linhas de lista (E18). */
  list: 'power3.out',
  /** Miniaturas, rodapé, linhas curtas (E19, E26 a E28). */
  soft: 'power2.out',
  /** Menu e botões (E37). */
  ui: 'power1.out',
  /** Saída do menu (E38). */
  uiExit: 'power1.in',
  /** Troca do botão do menu (E37). */
  toggle: 'power3.out',
  /** Tudo que é atrelado ao scroll (E08 a E10, E20, E29). */
  scrub: 'none',
} as const

/** Durações em segundos. */
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
  menuPanel: 0.58,
  menuToggle: 0.21,
  menuItem: 0.5,
  menuItemOut: 0.15,
  menuPanelOut: 0.23,
  menuTop: 0.45,
} as const

/** Intervalo entre o início de elementos em sequência, em segundos. */
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

/** Atrasos dentro de uma timeline, em segundos. */
export const delay = {
  /** Mídia depois do bloco de cor (E15). */
  curtainMedia: 0.1,
  /** Miniatura depois da linha (E19). */
  thumb: 0.1,
  /** Texto principal depois de linhas e rótulos (E16: manifesto). */
  sectionBody: 0.5,
  /** Hero: mídia logo depois do título (estudo, seção 10). */
  heroMedia: 0.9,
  /** Hero: a peça final começa a cobrir a toile depois que a mídia abre. */
  heroReveal: 1.4,
  /** Menu: barra superior depois do painel (E37). */
  menuTop: 0.13,
  /** Menu: links depois do painel (E37). */
  menuItems: 0.3,
  /** Menu: painel some depois dos links (E38). */
  menuPanelOut: 0.21,
} as const

/** Distâncias de entrada. `*Percent` em % do próprio elemento; `*Px` em pixels. */
export const distance = {
  /** Abertura: as linhas descem de cima (E01). */
  titleDropPercent: -100,
  linePercent: 50,
  /** Colunas em cascata: o deslocamento cresce da esquerda para a direita (E24). */
  cascadePercent: [40, 80, 120],
  listPx: 50,
  thumbPx: 30,
  footerPx: 20,
  linkPx: 14,
  socialPx: 10,
  menuPx: 20,
  menuOutPx: -6,
  menuSearchPx: 12,
} as const

/** Consultas de mídia usadas pelo `gsap.matchMedia()` (breakpoint do PROMPT: 760px). */
export const media = {
  reduced: '(prefers-reduced-motion: reduce)',
  /** Contraparte de `reduced`: juntas, sempre uma das duas vale (o matchMedia exige ao menos uma). */
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(min-width: 760px)',
  /** Hovers só com mouse e a partir de 760px (seção 8 do PROMPT). */
  hover: '(min-width: 760px) and (hover: hover) and (pointer: fine)',
} as const

/** Abertura: o título e a mídia do hero ficam ocultos até a timeline existir. */
export const intro = {
  /** Classe aplicada ao <html> enquanto a abertura não começa. */
  pendingClass: 'motion-intro',
  /** Se algo falhar, mostra o conteúdo mesmo assim depois deste tempo. */
  failsafeMs: 3000,
} as const

/** Pontos de disparo no scroll (E13 a E28): uma vez só, não repete ao voltar. */
export const trigger = {
  start: 'top 75%',
  footerStart: 'top 90%',
} as const

/** Smooth scroll (E05): decaimento exponencial λ ≈ 5,7/s. Toque fica nativo. */
export const smoothScroll = {
  lerp: 0.1,
  wheelMultiplier: 1,
  syncTouch: false,
} as const

/** Efeitos atrelados ao scroll. */
export const scrub = {
  /** Camada decorativa: deslocamento total ao atravessar a tela (E20). */
  decorParallaxPercent: 20,
  /** Folga de escala para o parallax não mostrar borda vazia. */
  decorParallaxScale: 1.25,
  /** Assinatura do rodapé desliza na horizontal (E29). */
  signatureDriftPercent: 10,
  /** Hero: largura revelada pela abertura (de 0% à composição do Figma). */
  heroRevealStart: '0%',
  heroRevealFigma: '55%',
} as const

/** Menu: fechamento mais rápido que a abertura (E38, decisão 3 do estudo). */
export const menu = {
  /** `reverse()` acelerado: ~1,1s de abertura viram ~0,45s de fechamento. */
  closeTimeScale: 2.4,
  /** Rede de segurança: se a animação não avisar o fim, fecha mesmo assim. */
  closeFallbackMs: 1500,
} as const

/**
 * Hovers e transições CSS. As curvas também estão em `globals.css`
 * (`--ease-out-expo` etc.) para uso nas classes do Tailwind.
 */
export const cssEase = {
  outExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  outCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
  outCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  pop: 'cubic-bezier(0.12, 1.2, 0.16, 2.35)',
} as const

export const hover = {
  underline: 0.5,
  spring: 0.5,
  zoom: 3.4,
  zoomScale: 1.02,
  slot: 0.4,
  /** Folioscópio: troca de imagem a cada 150ms (E35). */
  flipbookIntervalMs: 150,
  input: 0.75,
  headerTheme: 0.5,
} as const

export const loop = {
  bob: { duration: 2, yPx: 3, opacity: [0.8, 0.95] },
} as const
