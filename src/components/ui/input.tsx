import * as React from 'react'
import { cn } from '@/lib/utils'

/** Campo sublinhado do Figma ("Campo de e-mail"): sem caixa, só a linha inferior. */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'min-h-11 w-full min-w-0 border-0 bg-transparent font-sans text-field text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
