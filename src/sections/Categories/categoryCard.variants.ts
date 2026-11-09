import { cva } from 'class-variance-authority'

/** Texto sobre a foto do card (Figma "Card categoria"): claro sobre veludo, escuro sobre tons claros. */
export const categoryNameVariants = cva('font-display text-display-card', {
  variants: {
    surface: {
      dark: 'text-nevoa',
      light: 'text-grafite',
    },
  },
  defaultVariants: { surface: 'light' },
})

export const categoryTextVariants = cva('text-caption', {
  variants: {
    surface: {
      dark: 'text-texto-sobre-escuro',
      light: 'text-texto-corpo',
    },
  },
  defaultVariants: { surface: 'light' },
})
