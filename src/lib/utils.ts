import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge precisa conhecer os tokens do tema (src/styles/globals.css).
 * Sem isso, `text-display-xl` (tamanho) e `text-grafite` (cor) seriam tratados como
 * conflitantes e um deles seria descartado.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'nevoa',
        'grafite',
        'veludo',
        'veludo-2',
        'musselina',
        'lilas',
        'giz',
        'giz-claro',
        'texto-suave',
        'texto-corpo',
        'texto-sobre-escuro',
        'texto-suave-escuro',
        'linha',
        'linha-escura',
        'background',
        'foreground',
        'card',
        'card-foreground',
        'popover',
        'popover-foreground',
        'primary',
        'primary-foreground',
        'secondary',
        'secondary-foreground',
        'muted',
        'muted-foreground',
        'accent',
        'accent-foreground',
        'border',
        'input',
        'ring',
      ],
      font: ['display', 'sans'],
      text: [
        'display-xl',
        'display-l',
        'display-m',
        'display-s',
        'display-art',
        'display-cta',
        'display-card',
        'signature',
        'logo',
        'lead',
        'body-l',
        'body',
        'card-title',
        'field',
        'caption',
        'note',
        'button',
      ],
      spacing: ['gutter', 'header', 'section', 'section-l'],
      container: ['site'],
      radius: ['pill'],
      ease: ['out-expo', 'out-circ', 'out-cubic', 'spring', 'pop'],
      animate: ['bob', 'underline'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
