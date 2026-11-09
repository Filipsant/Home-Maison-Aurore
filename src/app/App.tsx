import { MenuProvider } from './providers/MenuProvider'
import { MotionProvider } from './providers/MotionProvider'
import { renderRoute } from './routes'

export function App() {
  return (
    <MotionProvider>
      <MenuProvider>{renderRoute(window.location.pathname)}</MenuProvider>
    </MotionProvider>
  )
}
