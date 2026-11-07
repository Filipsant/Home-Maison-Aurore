import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { sectionHeadingVariants } from './sectionHeading.variants'

interface SectionHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof sectionHeadingVariants> {
  /** Nível semântico; o tamanho visual vem de `size`. */
  level?: 1 | 2 | 3
}

/**
 * Título em Italiana. Marcado com `data-reveal="lines"` para que a animação
 * de texto por linhas encontre o elemento sem depender da marcação da seção.
 */
export const SectionHeading = React.forwardRef<HTMLHeadingElement, SectionHeadingProps>(
  ({ level = 2, size, tone, className, ...props }, ref) => {
    const Tag = `h${level}` as const
    return (
      <Tag
        ref={ref}
        data-reveal="lines"
        className={cn(sectionHeadingVariants({ size, tone }), className)}
        {...props}
      />
    )
  },
)
SectionHeading.displayName = 'SectionHeading'
