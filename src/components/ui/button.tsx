import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Botão em pílula da maison (Figma: "Botão", estilos Escuro, Claro e Contorno).
 * Altura mínima de 52px e largura mínima de 160px, como no Figma.
 */
const buttonVariants = cva(
  'inline-flex min-h-13 min-w-40 shrink-0 items-center justify-center rounded-pill border px-7 font-sans text-button font-medium whitespace-nowrap transition-colors duration-500 ease-out-expo select-none disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        dark: 'border-grafite bg-grafite text-nevoa hover:border-veludo-2 hover:bg-veludo-2',
        light: 'border-nevoa bg-nevoa text-grafite hover:border-musselina hover:bg-musselina',
        outline: 'border-grafite bg-transparent text-grafite hover:bg-grafite hover:text-nevoa',
        'outline-light':
          'border-texto-sobre-escuro bg-transparent text-nevoa hover:bg-nevoa hover:text-grafite',
      },
    },
    defaultVariants: {
      variant: 'dark',
    },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Renderiza o filho (por exemplo um <a>) com o visual do botão. */
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button'
    return (
      <Comp
        ref={ref}
        data-slot="button"
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants, type ButtonProps }
