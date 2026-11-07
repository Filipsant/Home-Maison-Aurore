import { Dialog as SheetPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    data-slot="sheet-overlay"
    className={cn('fixed inset-0 z-40 bg-veludo/60', className)}
    {...props}
  />
))
SheetOverlay.displayName = 'SheetOverlay'

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const SheetContent = React.forwardRef<React.ComponentRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ className, children, side = 'right', ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-popover text-popover-foreground data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=top]:inset-x-0 data-[side=top]:top-0',
          className,
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
)
SheetContent.displayName = 'SheetContent'

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    data-slot="sheet-title"
    className={cn('font-medium', className)}
    {...props}
  />
))
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    data-slot="sheet-description"
    className={cn('text-caption', className)}
    {...props}
  />
))
SheetDescription.displayName = 'SheetDescription'

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetTitle,
  SheetDescription,
}
