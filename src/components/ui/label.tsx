import { Label as LabelPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    data-slot="label"
    className={cn('font-sans text-caption text-muted-foreground select-none', className)}
    {...props}
  />
))
Label.displayName = 'Label'

export { Label }
