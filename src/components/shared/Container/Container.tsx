import * as React from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav'
}

/** Largura máxima de 1440px e margem lateral clamp(20px, 4vw, 56px). */
export const Container = React.forwardRef<HTMLElement, ContainerProps>(
  ({ as: Tag = 'div', className, ...props }, ref) => (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn('mx-auto w-full max-w-site px-gutter', className)}
      {...props}
    />
  ),
)
Container.displayName = 'Container'
