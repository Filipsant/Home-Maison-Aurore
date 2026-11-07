import { HomePage } from '@/pages/home'
import { MenuProvider } from './providers/MenuProvider'
import { MotionProvider } from './providers/MotionProvider'

export function App() {
  return (
    <MotionProvider>
      <MenuProvider>
        <HomePage />
      </MenuProvider>
    </MotionProvider>
  )
}
