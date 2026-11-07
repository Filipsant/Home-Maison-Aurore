/**
 * Tipos do conteúdo da home. Todo texto editorial vive em `src/data/`.
 * Placeholders aparecem entre colchetes, por exemplo "[nome]".
 */

/** Tons de placeholder usados enquanto não há fotografia (Figma: "Foto"). */
export type Tone = 'musselina' | 'veludo' | 'lilas' | 'veludo-2'

export interface Media {
  /** Legenda visível no placeholder e texto alternativo quando houver imagem. */
  caption: string
  /** Cor do placeholder. */
  tone: Tone
  /** Proporção largura / altura, por exemplo 4 / 5. */
  aspect: number
  /** URL da imagem real. Sem ela, o placeholder é exibido. */
  src?: string
  /** Texto alternativo da imagem real. Se omitido, usa `caption`. */
  alt?: string
}

export interface VideoMedia extends Media {
  /** URL do vídeo em loop (mudo). Sem ela, só o poster/placeholder aparece. */
  videoSrc?: string
  /** Imagem de poster do vídeo. */
  poster?: string
}

export interface Link {
  label: string
  href: string
}

export interface NavItem extends Link {
  id: string
}

export interface Hero {
  title: string
  support: string
  paragraphs: [string, string]
  cta: Link
  /** Peça final (revelada sobre a toile). */
  finalPiece: Media
  /** Toile em musselina (por baixo). */
  toile: Media
}

export interface Piece {
  id: string
  name: string
  material: string
  media: Media
  link: Link
}

export interface PiecesSection {
  title: string
  items: Piece[]
  link: Link
}

export interface NewArrivalsSection {
  title: string
  items: [Piece, Piece]
}

export interface EditorialStory {
  id: string
  title: string
  credit: string
  media: Media
  href: string
}

export interface EditorialSection {
  title: string
  stories: EditorialStory[]
  link: Link
}

export interface ArtProject {
  title: string
  text: string
  cta: Link
  media: Media
}

export interface VideoFeature {
  id: string
  title: string
  link: Link
  media: VideoMedia
}

export interface VideoFeaturesSection {
  /** Título da seção, lido só por leitores de tela (o visual mostra os títulos dos blocos). */
  title: string
  items: [VideoFeature, VideoFeature]
}

export interface Category {
  id: string
  name: string
  description: string
  link: Link
  /** Várias imagens por categoria: alternam no hover (padrão "folioscópio" do estudo). */
  gallery: Media[]
}

export interface CategoriesSection {
  title: string
  items: Category[]
}

export interface AtelierStep {
  id: string
  title: string
  description: string
  media: Media
}

/** Linha do ateliê digital: define o modelo da foto e quais opções aparecem. */
export type AtelierLinha = 'feminina' | 'masculina'

/** Opção de um campo do ateliê digital: rótulo para a tela e trecho do prompt (em inglês) para a IA. */
export interface AtelierOption {
  id: string
  label: string
  prompt: string
  /** Linhas em que a opção aparece. Sem o campo, vale para as duas. */
  linhas?: AtelierLinha[]
}

export interface AtelierOptions {
  linha: (AtelierOption & { id: AtelierLinha })[]
  peca: AtelierOption[]
  tecido: AtelierOption[]
  cor: AtelierOption[]
  silhueta: AtelierOption[]
  detalhes: AtelierOption[]
  colecao: AtelierOption[]
}

/** Item do rodapé: vira link quando tiver `href`; sem ele, é texto. */
export interface FooterItem {
  label: string
  href?: string
}

export interface FooterColumn {
  id: string
  title: string
  items: FooterItem[]
}

export interface Site {
  name: string
  nav: NavItem[]
  bookFitting: Link
  menu: {
    address: string
    bookFitting: Link
  }
  /** Páginas do ateliê digital (IA): aparecem no menu e no rodapé. */
  digital: {
    title: string
    links: NavItem[]
  }
  footer: {
    title: string
    form: {
      label: string
      placeholder: string
      submit: string
      privacy: string
      success: string
    }
    columns: FooterColumn[]
    signature: string
  }
}
