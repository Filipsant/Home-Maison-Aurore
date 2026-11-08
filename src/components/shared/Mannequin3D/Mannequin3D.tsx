import { RotateCcw, RotateCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '@/animations/hooks'
import { mannequin as motion } from '@/animations/tokens'
import { mannequinLook } from '@/data/mannequin'
import { bodyFromMeasures } from '@/lib/mannequin/body'
import type { ThemeColors } from '@/lib/mannequin/figure'
import type { MannequinScene } from '@/lib/mannequin/scene'
import { cn } from '@/lib/utils'
import type { PieceRequest } from '@/types/ai'
import type { AtelierLinha } from '@/types/content'

interface Mannequin3DTexts {
  hint: string
  turnLeft: string
  turnRight: string
  front: string
  back: string
  loading: string
  noWebgl: string
}

interface Mannequin3DProps {
  piece: PieceRequest
  /** Medidas como digitadas (texto); vazias ou inválidas usam o valor típico. */
  measures: Record<string, string>
  /** Texto alternativo: o que o manequim veste e com quais medidas. */
  label: string
  texts: Mannequin3DTexts
  className?: string
}

/** Cores do manequim vindas do tema (globals.css): nada de cor solta no 3D. */
function themeColors(): ThemeColors {
  const css = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  const ink = read('--color-grafite', 'black')
  return {
    mannequin: read('--color-musselina', 'tan'),
    base: ink,
    shirt: read('--color-nevoa', 'white'),
    ink,
  }
}

/**
 * Manequim 3D (three.js, carregado só quando este componente aparece).
 * Arraste, setas do teclado ou os botões giram o manequim. Sem WebGL, mostra
 * um aviso e o resto da página segue funcionando.
 */
export function Mannequin3D({ piece, measures, label, texts, className }: Mannequin3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<MannequinScene | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const reduced = useReducedMotion()
  const linha: AtelierLinha = piece.linha === 'masculina' ? 'masculina' : 'feminina'
  const body = useMemo(() => bodyFromMeasures(linha, measures), [linha, measures])
  const dark = mannequinLook.collections[piece.colecao]?.dark ?? false

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    import('@/lib/mannequin/scene')
      .then(({ createMannequinScene }) => {
        if (cancelled) return
        // Nasce parada; o efeito abaixo liga o giro se o movimento não for reduzido.
        sceneRef.current = createMannequinScene({ canvas, theme: themeColors(), reducedMotion: true })
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('failed')
      })
    return () => {
      cancelled = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  // Veste o manequim quando a cena fica pronta e a cada mudança de peça ou medida.
  useEffect(() => {
    if (status === 'ready') sceneRef.current?.update(body, piece)
  }, [status, body, piece])

  useEffect(() => {
    if (status === 'ready') sceneRef.current?.setReducedMotion(reduced)
  }, [status, reduced])

  const act = (action: 'esquerda' | 'direita' | 'frente' | 'costas') => {
    const scene = sceneRef.current
    if (!scene) return
    if (action === 'esquerda') scene.turn(-motion.turnStepDeg)
    else if (action === 'direita') scene.turn(motion.turnStepDeg)
    else scene.face(action)
  }

  const controls = [
    { label: texts.turnLeft, icon: RotateCcw, action: 'esquerda' },
    { label: texts.front, action: 'frente' },
    { label: texts.back, action: 'costas' },
    { label: texts.turnRight, icon: RotateCw, action: 'direita' },
  ] as const

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        className={cn(
          'relative aspect-3/4 max-h-[78vh] w-full overflow-hidden border',
          dark ? 'border-linha-escura bg-veludo' : 'border-linha bg-nevoa',
        )}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          aria-describedby="manequim-dica"
          tabIndex={status === 'ready' ? 0 : -1}
          className={cn(
            'absolute inset-0 size-full cursor-grab outline-none active:cursor-grabbing',
            'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--focus-ring)',
            status === 'failed' && 'hidden',
          )}
        />
        {status !== 'ready' && (
          <p
            role="status"
            className={cn(
              'absolute inset-0 flex items-center justify-center p-8 text-center text-caption',
              dark ? 'text-texto-sobre-escuro' : 'text-texto-suave',
            )}
          >
            {status === 'loading' ? texts.loading : texts.noWebgl}
          </p>
        )}
      </div>

      {status === 'ready' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {controls.map((control) => {
              const Icon = 'icon' in control ? control.icon : undefined
              return (
                <button
                  key={control.action}
                  type="button"
                  onClick={() => act(control.action)}
                  aria-label={Icon ? control.label : undefined}
                  title={Icon ? control.label : undefined}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill border border-grafite px-4 text-button text-grafite transition-colors duration-500 ease-out-expo hover:bg-grafite hover:text-nevoa focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus-ring)"
                >
                  {Icon ? <Icon aria-hidden="true" className="size-4" /> : control.label}
                </button>
              )
            })}
          </div>
          <p id="manequim-dica" className="text-caption text-texto-suave">
            {texts.hint}
          </p>
        </div>
      )}
    </div>
  )
}
