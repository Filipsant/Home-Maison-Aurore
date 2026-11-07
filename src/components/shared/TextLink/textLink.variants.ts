import { cva } from 'class-variance-authority'

/** Linha do sublinhado (pseudo-elemento ::after do rótulo). */
export const textLinkUnderlineVariants = cva(
  'relative after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:bg-current',
  {
    variants: {
      underline: {
        /** Sublinhado visível (Figma); redesenhado no hover. */
        always: 'group-hover/link:after:animate-underline',
        /** Sem sublinhado em repouso; desenhado no hover e no foco (E30). */
        hover:
          'after:scale-x-0 after:transition-transform after:duration-500 after:ease-out-expo group-hover/link:after:scale-x-100 group-focus-visible/link:after:scale-x-100',
      },
    },
    defaultVariants: { underline: 'always' },
  },
)
