import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { textLinkUnderlineVariants } from './textLink.variants'

interface TextLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof textLinkUnderlineVariants> {
  href: string
}

/**
 * Link de texto. Por padrão é sublinhado, como no Figma, e o sublinhado é
 * redesenhado da esquerda para a direita no hover (E30 do estudo: 0,5s, easeOutExpo).
 * A área de toque tem no mínimo 44px de altura.
 */
export const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ className, children, underline, ...props }, ref) => (
    <a
      ref={ref}
      className={cn('group/link inline-flex min-h-11 items-center text-caption', className)}
      {...props}
    >
      <span className={textLinkUnderlineVariants({ underline })}>{children}</span>
    </a>
  ),
)
TextLink.displayName = 'TextLink'
