import { useRef, type ReactNode } from 'react'
import { MenuContext, MenuTriggerContext, useMenuController } from '@/hooks/useMenu'

export function MenuProvider({ children }: { children: ReactNode }) {
  const menu = useMenuController()
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <MenuTriggerContext.Provider value={triggerRef}>
      <MenuContext.Provider value={menu}>{children}</MenuContext.Provider>
    </MenuTriggerContext.Provider>
  )
}
