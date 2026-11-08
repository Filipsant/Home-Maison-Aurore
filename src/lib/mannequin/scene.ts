import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { mannequin as motion } from '@/animations/tokens'
import { mannequinLook } from '@/data/mannequin'
import type { PieceRequest } from '@/types/ai'
import type { Body } from './body'
import { buildFigure, type Figure, type ThemeColors } from './figure'

/**
 * Cena 3D do provador: câmera fixa, luz de janela, sombra no chão e o manequim
 * num "prato giratório". Arrastar, as setas do teclado e os botões giram o
 * manequim; o giro automático para quando a pessoa mexe e com movimento reduzido.
 *
 * Carregada sob demanda (import dinâmico): o three.js só baixa na página do provador.
 */

export interface MannequinScene {
  update(body: Body, piece: PieceRequest): void
  /** Gira o manequim (graus; positivo = para a direita). */
  turn(degrees: number): void
  face(side: 'frente' | 'costas'): void
  setReducedMotion(reduced: boolean): void
  dispose(): void
}

export interface SceneOptions {
  canvas: HTMLCanvasElement
  theme: ThemeColors
  reducedMotion: boolean
}

/** Altura enquadrada (metros): cabe até ~1,95 m; acima disso a câmera se afasta. */
const FRAME_HEIGHT = 1.98
const FOV = 26

export function createMannequinScene({ canvas, theme, reducedMotion }: SceneOptions): MannequinScene {
  // Lança se o navegador não tiver WebGL: o componente mostra a alternativa.
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 30)

  const hemi = new HemisphereLight(new Color(theme.shirt), new Color(theme.base), 0.8)
  const key = new DirectionalLight(new Color(theme.shirt), 2.4)
  key.position.set(-2.2, 3.4, 2.6)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -1.2
  key.shadow.camera.right = 1.2
  key.shadow.camera.top = 2.4
  key.shadow.camera.bottom = -0.2
  key.shadow.bias = -0.0004
  key.shadow.normalBias = 0.02
  const fill = new DirectionalLight(new Color(theme.shirt), 0.5)
  fill.position.set(2.5, 1.6, 2)
  const rim = new DirectionalLight(new Color(theme.shirt), 0.7)
  rim.position.set(0.5, 2.5, -3)
  const floor = new Mesh(new PlaneGeometry(6, 6), new ShadowMaterial({ opacity: 0.16 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.03
  floor.receiveShadow = true
  scene.add(hemi, key, fill, rim, floor)

  const turntable = new Group()
  scene.add(turntable)
  let figure: Figure | null = null
  let height = 1.7
  /** Maior largura do manequim vestido (qualquer lado, já que ele gira). */
  let width3d = 1.1

  // ------------------------------------------------ giro
  let angle = 0
  let target = 0
  let reduced = reducedMotion
  let lastInteraction = -Infinity
  let dragging = false
  let lastX = 0

  const interacted = () => {
    lastInteraction = performance.now()
  }
  const onPointerDown = (event: PointerEvent) => {
    dragging = true
    lastX = event.clientX
    canvas.setPointerCapture(event.pointerId)
    interacted()
  }
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return
    target += (event.clientX - lastX) * 0.01
    lastX = event.clientX
    interacted()
  }
  const onPointerUp = (event: PointerEvent) => {
    dragging = false
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') api.turn(-motion.turnStepDeg)
    else if (event.key === 'ArrowRight') api.turn(motion.turnStepDeg)
    else return
    event.preventDefault()
  }
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('keydown', onKey)
  // Arrastar na horizontal gira; na vertical, a página continua rolando (celular).
  canvas.style.touchAction = 'pan-y'

  // ------------------------------------------------ enquadramento
  let needsRender = true
  const frame = () => {
    const width = canvas.clientWidth || 1
    const heightPx = canvas.clientHeight || 1
    renderer.setSize(width, heightPx, false)
    camera.aspect = width / heightPx
    const tall = Math.max(FRAME_HEIGHT, height * 1.06)
    const halfV = Math.tan(((FOV / 2) * Math.PI) / 180)
    // Cabe na altura e na largura do manequim vestido (saia ampla, capa), com folga.
    const distance = Math.max(tall / 2 / halfV, (width3d * 0.56) / (halfV * camera.aspect))
    camera.position.set(0, tall * 0.54, distance)
    camera.lookAt(0, tall * 0.45, 0)
    camera.updateProjectionMatrix()
    needsRender = true
  }
  const resizeObserver = new ResizeObserver(frame)
  resizeObserver.observe(canvas)

  // ------------------------------------------------ laço de desenho
  let visible = true
  let raf = 0
  let lastFrame = performance.now()
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true
  })
  intersection.observe(canvas)

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    const dt = Math.min(0.1, (now - lastFrame) / 1000)
    lastFrame = now
    if (!visible || document.hidden) return
    const idle = (now - lastInteraction) / 1000 > motion.resumeAfterSeconds
    // Mesma convenção do OrbitControls: velocidade 2 = uma volta a cada 30s.
    if (!reduced && idle && !dragging) target += ((motion.autoRotateSpeed * Math.PI) / 30) * dt
    const delta = target - angle
    if (Math.abs(delta) > 1e-4) {
      angle = reduced ? target : angle + delta * (dragging ? 0.35 : motion.damping * 2)
      needsRender = true
    }
    if (!needsRender) return
    turntable.rotation.y = angle
    renderer.render(scene, camera)
    needsRender = false
  }
  raf = requestAnimationFrame(loop)

  const api: MannequinScene = {
    update(body, piece) {
      figure?.dispose()
      if (figure) turntable.remove(figure.group)
      figure = buildFigure({ body, piece, look: mannequinLook, theme })
      turntable.add(figure.group)
      height = body.height
      const box = new Box3().setFromObject(figure.group)
      width3d = Math.max(1.1, box.max.x - box.min.x, box.max.z - box.min.z)

      const light = mannequinLook.collections[piece.colecao]
      if (light) {
        key.intensity = light.key
        key.color.set(light.keyColor)
        fill.intensity = light.fill
        hemi.intensity = light.ambient
        rim.intensity = light.dark ? 1.4 : 0.7
      }
      frame()
    },
    turn(degrees) {
      target += (degrees * Math.PI) / 180
      interacted()
    },
    face(side) {
      const base = Math.round(target / (2 * Math.PI)) * 2 * Math.PI
      target = side === 'frente' ? base : base + Math.PI
      interacted()
    },
    setReducedMotion(value) {
      reduced = value
    },
    dispose() {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersection.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('keydown', onKey)
      figure?.dispose()
      floor.geometry.dispose()
      floor.material.dispose()
      renderer.dispose()
    },
  }
  return api
}
