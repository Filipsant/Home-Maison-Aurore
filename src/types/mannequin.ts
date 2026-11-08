/**
 * Receitas do manequim 3D: como cada escolha do ateliê digital vira forma,
 * cor e material. Os valores ficam em `src/data/mannequin.ts`.
 */

/** Parte de cima da peça. */
export type TopKind =
  | 'tomaraQueCaia' // corpete sem alças (vestido, capa)
  | 'corset' // corpete estruturado até o quadril
  | 'mangaLonga' // corpo e mangas longas (robe)
  | 'casaco' // casaco curto do tailleur
  | 'paleto' // paletó até o quadril (smoking, terno)
  | 'sobretudo' // casaco até o meio da canela
  | 'casaca' // frente curta e cauda atrás

/** Parte de baixo da peça. */
export type BottomKind = 'saiaLonga' | 'saiaMidi' | 'calca'

export type NeckKind = 'gravata' | 'gravataBorboleta'

export type SkirtShape = 'coluna' | 'sereia' | 'evase' | 'ampla' | 'ajustada'

export interface PieceRecipe {
  top: TopKind
  bottom: BottomKind
  /** Camisa branca e gravata por baixo do paletó. */
  neck?: NeckKind
  /** Capa aberta na frente, por cima de tudo. */
  cape?: boolean
}

export interface SilhouetteRecipe {
  /** Forma da saia (nas calças, só a largura da barra muda). */
  skirt: SkirtShape
  /** Folga da roupa sobre o corpo: 1 = justa normal; 2 = bem folgada. */
  ease: number
  /** Ombro extra do casaco, em metros (ombros marcados). */
  shoulders: number
}

export interface FabricLook {
  /** 0 = brilhante, 1 = fosco. */
  roughness: number
  /** Brilho aveludado nas bordas (veludo = 1). */
  sheen: number
  /** 1 = opaco; menos que 1 = transparente (organza, tule). */
  opacity: number
}

/** Como um detalhe aparece no 3D. */
export type DetailLook =
  'perolas' | 'botoes' | 'plumas' | 'lapela' | 'bordado' | 'plissado' | 'drapeado' | 'nenhum'

export interface CollectionLight {
  /** Luz principal (janela), intensidade. */
  key: number
  keyColor: string
  /** Luz de preenchimento do outro lado. */
  fill: number
  /** Luz ambiente (céu/chão). */
  ambient: number
  /** Fundo escuro (Nocturne) ou claro. */
  dark: boolean
}

export interface MannequinLook {
  colors: Record<string, string>
  fabrics: Record<string, FabricLook>
  pieces: Record<string, PieceRecipe>
  silhouettes: Record<string, SilhouetteRecipe>
  details: Record<string, DetailLook>
  collections: Record<string, CollectionLight>
  /** Pérolas e botões de madrepérola. */
  pearl: string
  /** Linha do bordado à mão. */
  embroidery: string
}
