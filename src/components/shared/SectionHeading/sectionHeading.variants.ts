import { cva } from 'class-variance-authority'

export const sectionHeadingVariants = cva('font-display font-normal text-balance', {
  variants: {
    size: {
      xl: 'text-display-xl',
      l: 'text-display-l',
      m: 'text-display-m',
      s: 'text-display-s',
      art: 'text-display-art',
      cta: 'text-display-cta',
    },
    tone: {
      dark: 'text-grafite',
      light: 'text-nevoa',
    },
  },
  defaultVariants: {
    size: 'm',
    tone: 'dark',
  },
})
