import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  FrontSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  Vector3,
  type Material,
  type Side,
} from 'three'
import type { PieceRequest } from '../../types/ai'
import type {
  DetailLook,
  FabricLook,
  MannequinLook,
  PieceRecipe,
  SilhouetteRecipe,
} from '../../types/mannequin'
import type { Body } from './body'
import { loft, type Loft, type LoftKey, type LoftOptions } from './loft'
import { clamp, lerp, monotone, seeded, smoothstep, wrapAngle } from './math'

/**
 * Monta o manequim vestido: corpo (a partir das medidas) + peça (a partir das
 * escolhas do ateliê digital). Tudo em metros, chão em y = 0, frente para +z.
 */

/** Cores do tema (globals.css), lidas pela cena: manequim, base, camisa e detalhes escuros. */
export interface ThemeColors {
  mannequin: string
  base: string
  shirt: string
  ink: string
}

export interface FigureInput {
  body: Body
  piece: PieceRequest
  look: MannequinLook
  theme: ThemeColors
}

const UP = new Vector3(0, 1, 0)
const WHITE = new Color(1, 1, 1)

interface Ctx {
  body: Body
  torso: Loft
  legR: (y: number) => number
  legCx: (y: number) => number
  recipe: PieceRecipe
  fit: SilhouetteRecipe
  fabric: FabricLook
  color: Color
  details: Set<DetailLook>
  look: MannequinLook
  theme: ThemeColors
  group: Group
  materials: Material[]
}

// ---------------------------------------------------------------- materiais

function track<T extends Material>(ctx: Ctx, material: T): T {
  ctx.materials.push(material)
  return material
}

function fabricMaterial(
  ctx: Ctx,
  options: { side?: Side; glossy?: boolean; opaque?: boolean; color?: Color } = {},
) {
  const color = options.color ?? ctx.color
  const sheer = !options.opaque && ctx.fabric.opacity < 1
  return track(
    ctx,
    new MeshPhysicalMaterial({
      color,
      roughness: options.glossy ? 0.22 : ctx.fabric.roughness,
      metalness: 0,
      sheen: ctx.fabric.sheen,
      sheenRoughness: 0.45,
      sheenColor: color.clone().lerp(WHITE, 0.35),
      clearcoat: options.glossy ? 0.9 : 0,
      clearcoatRoughness: 0.2,
      transparent: sheer,
      opacity: sheer ? ctx.fabric.opacity : 1,
      depthWrite: !sheer,
      side: options.side ?? (sheer ? DoubleSide : FrontSide),
    }),
  )
}

function solidMaterial(ctx: Ctx, color: string | Color, roughness: number, metalness = 0) {
  return track(ctx, new MeshStandardMaterial({ color, roughness, metalness }))
}

function add(ctx: Ctx, geometry: BufferGeometry, material: Material): Mesh {
  const mesh = new Mesh(geometry, material)
  mesh.castShadow = true
  // Sombra só no chão: a sombra da roupa sobre ela mesma escurecia as costuras.
  mesh.receiveShadow = false
  ctx.group.add(mesh)
  return mesh
}

/** Tecido com forro: em organza e tule, a camada transparente fica sobre um forro opaco. */
function addFabric(ctx: Ctx, build: (extraEase: number, liningLift: number) => Loft, side?: Side): Loft {
  const outer = build(0, 0)
  add(ctx, outer.geometry, fabricMaterial(ctx, { side }))
  if (ctx.fabric.opacity < 1) {
    const lining = build(-0.004, 0.05)
    add(ctx, lining.geometry, fabricMaterial(ctx, { opaque: true, side }))
  }
  return outer
}

// ---------------------------------------------------------------- corpo

function torsoKeys(body: Body): LoftKey[] {
  const { y, bust, waist, hip, shoulder, neckR, arm } = body
  const female = body.linha === 'feminina'
  // O quadril ganha profundidade para trás (glúteos), não para a frente: a barriga fica reta.
  const back = -Math.max(0, hip.b - waist.b) * 0.7
  return [
    { y: y.crotch - 0.03, a: hip.a * 0.84, b: hip.b * 0.84, cz: back * 0.8, n: 2.2 },
    { y: y.crotch + 0.03, a: hip.a * 0.96, b: hip.b * 0.95, cz: back, n: 2.3 },
    { y: y.hip, a: hip.a, b: hip.b, cz: back, n: 2.3 },
    { y: y.waist, a: waist.a, b: waist.b, n: 2.3 },
    {
      y: y.underbust,
      a: lerp(waist.a, bust.a, 0.82),
      b: lerp(waist.b, bust.b, female ? 0.6 : 0.8),
      n: 2.3,
    },
    { y: y.bust, a: bust.a, b: bust.b, cz: female ? 0.006 : 0.004, n: 2.3 },
    { y: y.armpit, a: bust.a * 0.97, b: bust.b * 0.9, n: 2.4 },
    {
      y: y.shoulder - 0.03,
      a: Math.max(bust.a * 0.98, shoulder - arm.upperR * 0.5),
      b: bust.b * 0.72,
      n: 2.4,
    },
    { y: y.shoulder, a: shoulder * 0.88, b: bust.b * 0.55, n: 2.4 },
    { y: y.shoulder + 0.022, a: lerp(shoulder * 0.88, neckR * 1.3, 0.62), b: bust.b * 0.44, n: 2.2 },
    { y: y.neck, a: neckR * 1.2, b: neckR * 1.12, n: 2 },
  ]
}

/** Volume do busto: dois lóbulos à frente, na altura do busto. */
function bustBump(body: Body, scale = 1) {
  return (theta: number, y: number) => {
    if (!body.bustBump) return 0
    const t = wrapAngle(theta)
    const height = Math.exp(-(((y - body.y.bust) / 0.055) ** 2))
    const lobes = Math.exp(-(((t - 0.42) / 0.33) ** 2)) + Math.exp(-(((t + 0.42) / 0.33) ** 2))
    return body.bustBump * scale * height * lobes
  }
}

function legProfile(body: Body) {
  const { y, leg, height } = body
  const s = height / 1.7
  const ys = [y.ankle, y.knee - 0.11 * s, y.knee, lerp(y.knee, y.crotch, 0.55), y.crotch, y.crotch + 0.07]
  const rs = [leg.ankleR, leg.calfR, leg.kneeR, leg.thighR * 0.88, leg.thighR, leg.thighR * 0.98]
  const legR = monotone(ys, rs)
  const legCx = (yy: number) => lerp(leg.ankleX, leg.x, smoothstep(y.ankle, y.crotch, yy))
  return { legR, legCx }
}

/** Contorno do corpo numa altura (tronco, ou as duas pernas juntas abaixo do gancho). */
function envelope(ctx: Ctx, y: number): { a: number; b: number } {
  if (y >= ctx.body.y.crotch + 0.03) {
    const r = ctx.torso.ring(y)
    return { a: r.a, b: r.b + Math.abs(r.cz) }
  }
  const r = ctx.legR(y)
  return { a: ctx.legCx(y) + r, b: r * 1.05 }
}

function followTorso(ctx: Ctx, from: number, to: number, ease: (y: number) => number): LoftKey[] {
  const keys: LoftKey[] = []
  const count = Math.max(2, Math.ceil((to - from) / 0.025))
  for (let i = 0; i <= count; i++) {
    const y = lerp(from, to, i / count)
    const r = ctx.torso.ring(y)
    const e = ease(y)
    keys.push({ y, a: r.a + e, b: r.b + e, cz: r.cz, n: r.n })
  }
  return keys
}

function addLegs(ctx: Ctx, material: Material) {
  const { y } = ctx.body
  for (const side of [-1, 1]) {
    const keys: LoftKey[] = []
    for (let i = 0; i <= 14; i++) {
      const yy = lerp(y.ankle - 0.01, y.crotch + 0.07, i / 14)
      const r = ctx.legR(yy)
      keys.push({ y: yy, a: r, b: r * 1.05, cx: side * ctx.legCx(yy) })
    }
    add(ctx, loft(keys, { radial: 40 }).geometry, material)
  }
}

function addFeet(ctx: Ctx, material: Material) {
  const s = ctx.body.height / 1.7
  for (const side of [-1, 1]) {
    const foot = add(ctx, new SphereGeometry(1, 24, 16), material)
    foot.scale.set(0.038 * s, 0.03 * s, 0.115 * s)
    foot.position.set(side * ctx.body.leg.ankleX, 0.028 * s, 0.045 * s)
  }
}

interface ArmPose {
  /** Ângulo do braço com a vertical (pose em "A"), em radianos. */
  alpha: number
  jointX: number
  jointY: number
}

/** Raio do braço ao longo do comprimento `s` (0 = ombro). */
function armRadius(body: Body, s: number): number {
  const { length, upperR, elbowR, wristR } = body.arm
  const xs = [0, length * 0.25, length * 0.5, length * 0.75, length]
  const rs = [upperR, upperR * 0.93, elbowR, lerp(elbowR, wristR, 0.45), wristR]
  return monotone(xs, rs)(s)
}

function armKeys(
  body: Body,
  pose: ArmPose,
  side: number,
  from: number,
  to: number,
  extra: (s: number) => number,
) {
  const keys: LoftKey[] = []
  const steps = 12
  for (let i = 0; i <= steps; i++) {
    const s = lerp(from, to, i / steps)
    const r = armRadius(body, clamp(s, 0, body.arm.length)) + extra(s)
    keys.push({
      y: pose.jointY - s * Math.cos(pose.alpha),
      a: r,
      b: r,
      cx: side * (pose.jointX + s * Math.sin(pose.alpha)),
    })
  }
  return keys
}

function addArms(ctx: Ctx, pose: ArmPose, material: Material) {
  const { body } = ctx
  const s = body.height / 1.7
  const { length, handLength, wristR } = body.arm
  for (const side of [-1, 1]) {
    const keys = armKeys(body, pose, side, 0, length, () => 0)
    // Mão: achatada de lado (palma voltada para a coxa).
    const handAt = (k: number, a: number, b: number): LoftKey => {
      const along = length + handLength * k
      return {
        y: pose.jointY - along * Math.cos(pose.alpha),
        a,
        b,
        cx: side * (pose.jointX + along * Math.sin(pose.alpha)),
      }
    }
    // Ponta arredondada: anéis cada vez mais próximos e menores.
    keys.push(
      handAt(0.3, wristR * 0.62, 0.038 * s),
      handAt(0.7, 0.014 * s, 0.036 * s),
      handAt(0.88, 0.012 * s, 0.03 * s),
      handAt(0.97, 0.008 * s, 0.018 * s),
      handAt(1, 0.002 * s, 0.005 * s),
    )
    add(ctx, loft(keys, { radial: 32 }).geometry, material)
    // Ombro: esfera achatada que funde o braço ao tronco.
    const joint = add(ctx, new SphereGeometry(body.arm.upperR * 1.04, 24, 16), material)
    joint.scale.set(1, 0.9, 0.95)
    joint.position.set(side * (pose.jointX - 0.004), pose.jointY + 0.004, 0)
  }
}

/** Pose dos braços: abre o "A" até as mãos passarem por fora da saia ou do casaco. */
function armPose(body: Body, outer: ((y: number) => number)[], sleeveEase: number): ArmPose {
  const female = body.linha === 'feminina'
  const jointX = body.shoulder - body.arm.upperR * 0.55
  const jointY = body.y.shoulder - body.arm.upperR * 0.75
  const reach = body.arm.length + body.arm.handLength
  for (let deg = female ? 9 : 7; deg <= 38; deg += 0.5) {
    const alpha = (deg * Math.PI) / 180
    let clear = true
    for (let i = 0; i <= 16 && clear; i++) {
      const s = lerp(body.arm.length * 0.45, reach, i / 16)
      const y = jointY - s * Math.cos(alpha)
      if (y > body.y.waist) continue
      const inner = jointX + s * Math.sin(alpha) - armRadius(body, Math.min(s, body.arm.length)) - sleeveEase
      const needed = Math.max(...outer.map((f) => f(y))) + 0.004
      if (inner < needed) clear = false
    }
    if (clear) return { alpha, jointX, jointY }
  }
  return { alpha: (38 * Math.PI) / 180, jointX, jointY }
}

function addHead(ctx: Ctx, material: Material) {
  const { body } = ctx
  const { y, neckR, head } = body
  // O pescoço termina por dentro da cabeça, onde ela já é mais larga que ele.
  const neck = loft(
    [
      { y: y.neck - 0.03, a: neckR * 1.08, b: neckR * 1.05 },
      { y: y.chin, a: neckR * 0.95, b: neckR * 0.95, cz: 0.004 },
      { y: y.top - head.height * 0.72, a: neckR * 0.85, b: neckR * 0.85, cz: 0.008 },
    ],
    { radial: 32 },
  )
  add(ctx, neck.geometry, material)
  const skull = add(ctx, new SphereGeometry(1, 40, 28), material)
  skull.scale.set(head.a, head.height / 2, head.b)
  skull.position.set(0, y.top - head.height / 2, 0.012)
}

// ---------------------------------------------------------------- peça: parte de baixo

/** Saia (longa ou midi) com a silhueta escolhida. Devolve a meia-largura por altura. */
function addSkirt(ctx: Ctx, kind: 'longa' | 'midi'): (y: number) => number {
  const { body, fit } = ctx
  const yTop = body.y.waist + 0.012
  const hip = body.hip
  const yHip = body.y.hip
  const kneeTop = body.y.knee + 0.05
  const ease = 0.006 * fit.ease

  const build = (extra: number, lift: number) => {
    const yHem = (kind === 'longa' ? 0.012 : body.y.knee - 0.07) + lift
    const keys: LoftKey[] = []
    const samples = 28
    for (let i = 0; i <= samples; i++) {
      const y = lerp(yHem, yTop, i / samples)
      const env = envelope(ctx, y)
      // No topo, a saia entra por baixo do corpete (a costura fica escondida).
      const tuck = 0.01 * smoothstep(yTop - 0.03, yTop, y)
      const base = env.a + ease + extra - tuck
      const u = clamp((yHip - y) / (yHip - yHem), 0, 1)
      const t = clamp((yTop - y) / (yTop - yHem), 0, 1)
      let a: number
      switch (fit.skirt) {
        case 'coluna':
          a = y > yHip ? base : hip.a * 1.04 + hip.a * 0.14 * u + ease + extra
          break
        case 'ajustada':
          a = base + 0.025 * smoothstep(0.85, 1, t)
          break
        case 'sereia':
          if (kind === 'midi') a = base + 0.05 * smoothstep(0.7, 1, t)
          else if (y > kneeTop) a = base
          else
            a =
              envelope(ctx, kneeTop).a +
              ease +
              extra +
              hip.a * 1.05 * ((kneeTop - y) / (kneeTop - yHem)) ** 1.5
          break
        case 'evase':
          a = y > yHip ? base : hip.a * 1.02 + hip.a * (kind === 'midi' ? 0.55 : 0.95) * u + ease + extra
          break
        case 'ampla':
          a =
            body.waist.a +
            ease +
            extra -
            tuck +
            (hip.a * (kind === 'midi' ? 1.9 : 2.8) - body.waist.a) * (1 - (1 - t) ** 2.6)
          break
      }
      a = Math.max(a, base)
      // A barra da saia longa "pousa" no chão.
      if (kind === 'longa') a += 0.03 * smoothstep(0.93, 1, t)
      const ratio = lerp(env.b / env.a, fit.skirt === 'ampla' ? 0.95 : 0.88, smoothstep(0, 0.6, t))
      // Segue o centro do quadril (mais para trás) perto da cintura; embaixo, centrada.
      const cz = y >= body.y.crotch ? ctx.torso.ring(y).cz * (1 - t) : 0
      keys.push({ y, a, b: Math.max(env.b + ease + extra - tuck, a * ratio), cz })
    }
    return loft(keys, skirtSurface(ctx, yTop))
  }

  const skirt = addFabric(ctx, build)
  if (ctx.details.has('plumas')) addFeathers(ctx, skirt, skirt.y0 + 0.02)
  if (ctx.details.has('bordado')) addEmbroidery(ctx, skirt, skirt.y1 - 0.25, skirt.y1)
  if (ctx.details.has('perolas')) addPearls(ctx, skirt, skirt.y1 - 0.3, skirt.y1, 36, () => 0)
  return (y) => (y >= skirt.y0 && y <= skirt.y1 ? skirt.ring(y).a + 0.01 : 0)
}

/** Pregas (plissado) e drapeado na superfície da saia. */
function skirtSurface(ctx: Ctx, yTop: number): LoftOptions {
  const pleats = ctx.details.has('plissado')
  const drape = ctx.details.has('drapeado')
  return {
    radial: pleats ? 192 : 96,
    bump: (theta, y) =>
      (pleats ? 0.0035 * (1 + Math.cos(theta * 80)) * smoothstep(yTop, yTop - 0.15, y) : 0) +
      (drape ? 0.012 * Math.sin(3 * theta + 14 * (yTop - y)) * smoothstep(yTop, yTop - 0.2, y) : 0),
  }
}

/** Calça: assento + duas pernas, com a barra conforme a silhueta. */
function addTrousers(ctx: Ctx): (y: number) => number {
  const { body, fit } = ctx
  const ease = 0.012 * fit.ease
  const material = fabricMaterial(ctx, { opaque: true })
  const seat = loft(
    followTorso(ctx, body.y.crotch - 0.03, body.y.waist + 0.02, () => 0.008 * fit.ease),
    {
      radial: 64,
    },
  )
  add(ctx, seat.geometry, material)

  const hemA = (() => {
    switch (fit.skirt) {
      case 'ajustada':
        return body.leg.ankleR + 0.026
      case 'evase':
        return body.leg.thighR * 0.85 + 0.02
      default:
        return body.leg.kneeR + 0.02 + (fit.shoulders > 0 ? 0.004 : 0)
    }
  })()
  const legKeys = (side: number) => {
    const keys: LoftKey[] = []
    for (let i = 0; i <= 14; i++) {
      const y = lerp(body.y.ankle - 0.012, body.y.crotch + 0.07, i / 14)
      const r = Math.max(ctx.legR(y) + ease, y < body.y.knee + 0.15 ? hemA : 0)
      keys.push({ y, a: r, b: r * 1.04, cx: side * ctx.legCx(y) })
    }
    return keys
  }
  for (const side of [-1, 1]) add(ctx, loft(legKeys(side), { radial: 40 }).geometry, material)
  return (y) => (y < body.y.crotch + 0.05 ? ctx.legCx(y) + ctx.legR(y) + ease : 0)
}

// ---------------------------------------------------------------- peça: parte de cima

interface Top {
  loft: Loft
  /** Abertura em "V" na frente (paletós): ângulo por altura. */
  gap?: (y: number) => number
  buttonY?: number
  outer: (y: number) => number
  sleeveEase: number
  sleeveFlare: number
}

function strapless(ctx: Ctx, corset: boolean): Top {
  const { body } = ctx
  const yBottom = corset ? body.y.hip - 0.02 : body.y.waist - 0.02
  const yTop = body.y.bust + (corset ? 0.05 : 0.045)
  const loftTop = addFabric(ctx, (extra) =>
    loft(
      // 3 mm por fora da saia: as duas superfícies nunca coincidem (sem "briga" de profundidade).
      followTorso(ctx, yBottom, yTop, () => 0.006 * ctx.fit.ease + 0.003 + extra),
      {
        radial: 96,
        bump: (theta, y) => bustBump(body)(theta, y) + (corset ? 0.0012 * Math.cos(theta * 14) : 0),
        // Decote: desce um pouco no centro da frente.
        dy: (theta, y) =>
          -0.022 * smoothstep(yTop - 0.03, yTop, y) * Math.exp(-((wrapAngle(theta) / 0.22) ** 2)),
      },
    ),
  )
  return {
    loft: loftTop,
    outer: (y) => (y >= yBottom && y <= yTop ? loftTop.ring(y).a : 0),
    sleeveEase: 0,
    sleeveFlare: 0,
  }
}

function longSleeved(ctx: Ctx): Top {
  const { body } = ctx
  const yBottom = body.y.waist - 0.02
  const yTop = body.y.neck - 0.012
  const loftTop = addFabric(ctx, (extra) => {
    const keys = followTorso(ctx, yBottom, body.y.shoulder + 0.01, () => 0.006 * ctx.fit.ease + 0.004 + extra)
    // Decote redondo, afastado do pescoço.
    keys.push({ y: yTop, a: body.neckR * 1.7 + extra, b: body.neckR * 1.55 + extra })
    return loft(keys, { radial: 96, bump: bustBump(body, 0.8) })
  })
  return {
    loft: loftTop,
    outer: (y) => (y >= yBottom ? loftTop.ring(y).a : 0),
    sleeveEase: 0.012,
    sleeveFlare: 0.07,
  }
}

interface JacketStyle {
  hem: number
  buttonY: number
  chest: number
  neckOpen: number
  ease: number
  coat?: boolean
}

function jacketStyle(ctx: Ctx): JacketStyle {
  const { body, recipe } = ctx
  const y = body.y
  const fit = ctx.fit.ease
  switch (recipe.top) {
    case 'casaco':
      return {
        hem: y.hip - 0.02,
        buttonY: y.waist + 0.02,
        chest: 0.5,
        neckOpen: 0.4,
        ease: 0.014 * fit + 0.006,
      }
    case 'sobretudo':
      return {
        hem: y.knee - 0.12,
        buttonY: y.bust - 0.03,
        chest: 0.3,
        neckOpen: 0.36,
        ease: 0.03 * fit + 0.01,
        coat: true,
      }
    case 'casaca':
      return {
        hem: y.waist - 0.02,
        buttonY: y.waist + 0.02,
        chest: 0.55,
        neckOpen: 0.38,
        ease: 0.014 * fit + 0.006,
      }
    default:
      return {
        hem: y.crotch - 0.03,
        buttonY: recipe.neck === 'gravataBorboleta' ? y.waist - 0.02 : y.waist + 0.01,
        chest: 0.55,
        neckOpen: 0.38,
        ease: 0.016 * fit + 0.006,
      }
  }
}

function jacket(ctx: Ctx): Top {
  const { body, fit } = ctx
  const style = jacketStyle(ctx)
  const y = body.y
  const pad = 0.008 + fit.shoulders
  const shoulderPad = (yy: number) =>
    pad *
    smoothstep(y.armpit, y.shoulder - 0.01, yy) *
    (1 - smoothstep(y.shoulder + 0.004, y.shoulder + 0.02, yy))
  const collarY = y.neck + 0.035

  const gap = (yy: number) => {
    if (yy < style.buttonY) return clamp(0.04 + 0.6 * (style.buttonY - yy), 0, style.coat ? 0.08 : 0.35)
    if (yy <= y.bust) return lerp(0.02, style.chest, smoothstep(style.buttonY, y.bust, yy))
    return lerp(style.chest, style.neckOpen, smoothstep(y.bust, collarY, yy))
  }

  const build = (extra: number) => {
    const keys: LoftKey[] = []
    // Do quadril para baixo o casaco cai reto (sobretudo: abre um pouco até a barra).
    const hipRing = ctx.torso.ring(y.hip)
    if (style.hem < y.hip) {
      const count = Math.max(2, Math.ceil((y.hip - style.hem) / 0.04))
      for (let i = 0; i < count; i++) {
        const yy = lerp(style.hem, y.hip, i / count)
        const drop = y.hip - yy
        keys.push({
          y: yy,
          a: Math.max(envelope(ctx, yy).a, hipRing.a) + style.ease + extra + (style.coat ? 0.08 * drop : 0),
          b: hipRing.b + style.ease + extra + (style.coat ? 0.03 * drop : 0),
          cz: hipRing.cz,
        })
      }
    }
    keys.push(
      ...followTorso(
        ctx,
        Math.max(style.hem, y.hip),
        y.neck,
        (yy) => style.ease + extra + shoulderPad(yy),
      ).map((k) => ({
        ...k,
        // O tecido do paletó passa reto pela cintura: menos marcada que o corpo.
        a: Math.max(k.a, lerp(body.bust.a, body.hip.a, 0.5) * 0.92 + style.ease),
      })),
    )
    keys.push({ y: collarY, a: body.neckR + 0.012 + extra, b: body.neckR + 0.012 + extra })
    return loft(keys, { radial: 96, gap, bump: bustBump(body, 0.6) })
  }

  const main = addFabric(ctx, build, DoubleSide)
  if (ctx.recipe.top === 'casaca') addTails(ctx, style.ease)
  return {
    loft: main,
    gap,
    buttonY: style.buttonY,
    outer: (yy) => (yy >= main.y0 ? main.ring(yy).a : 0),
    sleeveEase: 0.01 * fit.ease + 0.005,
    sleeveFlare: 0,
  }
}

/** Cauda da casaca: só nas costas, da cintura até o joelho. */
function addTails(ctx: Ctx, ease: number) {
  const { body } = ctx
  const keys: LoftKey[] = []
  const from = body.y.knee - 0.04
  const to = body.y.waist + 0.03
  for (let i = 0; i <= 10; i++) {
    const y = lerp(from, to, i / 10)
    const env = envelope(ctx, y)
    const drop = to - y
    keys.push({
      y,
      a: Math.max(env.a, body.hip.a) + ease + 0.01 + 0.05 * drop,
      b: Math.max(env.b, body.hip.b) + ease + 0.01 + 0.03 * drop,
    })
  }
  add(
    ctx,
    loft(keys, { radial: 48, arc: [Math.PI - 0.8, Math.PI + 0.8] }).geometry,
    fabricMaterial(ctx, { side: DoubleSide, opaque: true }),
  )
}

function addSleeves(ctx: Ctx, pose: ArmPose, top: Top) {
  const { body } = ctx
  const end = body.arm.length - 0.012 + top.sleeveFlare * 0.4
  const material = fabricMaterial(ctx, { side: DoubleSide })
  for (const side of [-1, 1]) {
    const keys = armKeys(
      body,
      pose,
      side,
      -0.02,
      end,
      (s) => top.sleeveEase + top.sleeveFlare * smoothstep(body.arm.length * 0.5, end, s),
    )
    add(ctx, loft(keys, { radial: 40 }).geometry, material)
    // Cabeça da manga: mesmo centro do ombro do manequim e um pouco maior, cobrindo-o por inteiro.
    const cap = add(
      ctx,
      new SphereGeometry(body.arm.upperR * 1.04 + top.sleeveEase * 0.6 + 0.004, 24, 16),
      material,
    )
    cap.scale.set(1, 0.92, 0.97)
    cap.position.set(side * (pose.jointX - 0.004), pose.jointY + 0.004, 0)
  }
}

/** Camisa por baixo do paletó (aparece no "V") e gravata ou gravata-borboleta. */
function addShirtAndTie(ctx: Ctx, top: Top) {
  const { body, recipe } = ctx
  const shirtKeys = followTorso(ctx, body.y.waist - 0.03, body.y.neck, () => 0.003)
  shirtKeys.push({ y: body.y.neck + 0.03, a: body.neckR + 0.007, b: body.neckR + 0.007 })
  add(ctx, loft(shirtKeys, { radial: 64 }).geometry, solidMaterial(ctx, ctx.theme.shirt, 0.55))

  // Tailleur: só a blusa, sem gravata.
  if (!recipe.neck) return
  const ink = new Color(ctx.theme.ink)
  const frontZ = (y: number) => {
    const r = ctx.torso.ring(Math.min(y, body.y.neck))
    return r.cz + r.b + 0.008
  }
  const knotY = body.y.neck + 0.012
  if (recipe.neck === 'gravataBorboleta') {
    const material = solidMaterial(ctx, ink, 0.35)
    for (const side of [-1, 1]) {
      const wing = add(ctx, new SphereGeometry(1, 16, 12), material)
      wing.scale.set(0.034, 0.017, 0.008)
      wing.position.set(side * 0.03, knotY, frontZ(knotY) + 0.004)
    }
    const knot = add(ctx, new SphereGeometry(0.009, 12, 8), material)
    knot.position.set(0, knotY, frontZ(knotY) + 0.008)
    return
  }
  // Gravata: tira estreita no nó, mais larga embaixo, apoiada na camisa.
  const bottom = Math.max(top.buttonY ?? body.y.waist, body.y.waist) + 0.02
  const rows = 12
  const positions: number[] = []
  const index: number[] = []
  for (let i = 0; i <= rows; i++) {
    const y = lerp(bottom, knotY, i / rows)
    const w = lerp(0.036, 0.014, (i / rows) ** 1.4)
    const z = frontZ(y)
    positions.push(-w, y, z, w, y, z)
    if (i < rows) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const tie = new BufferGeometry()
  tie.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  tie.setIndex(index)
  tie.computeVertexNormals()
  add(
    ctx,
    tie,
    fabricMaterial(ctx, { side: DoubleSide, opaque: true, color: ctx.color.clone().lerp(ink, 0.35) }),
  )
}

/** Lapelas: faixas dobradas sobre as bordas do "V" do paletó. */
function addLapels(ctx: Ctx, top: Top) {
  if (!top.gap) return
  const { body } = ctx
  const glossy = ctx.details.has('lapela') || ctx.recipe.neck === 'gravataBorboleta'
  const material = fabricMaterial(ctx, { side: DoubleSide, opaque: true, glossy })
  const from = top.buttonY ?? body.y.waist
  const to = body.y.shoulder + 0.012
  const rows = 18
  const p = new Vector3()
  const n = new Vector3()
  for (const side of [1, -1]) {
    const positions: number[] = []
    const index: number[] = []
    for (let i = 0; i <= rows; i++) {
      const y = lerp(from, to, i / rows)
      const t = i / rows
      // Mais larga no peito; nas lapelas em bico (smoking), o bico sobe perto do ombro.
      const width = 0.05 + 0.32 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (glossy ? 1.1 : 0.9)
      const edge = top.gap(y)
      for (const [theta, lift] of [
        [edge, 0.0025],
        [edge + width, 0.004],
      ] as const) {
        const angle = side === 1 ? theta : 2 * Math.PI - theta
        top.loft.point(y, angle, p)
        top.loft.normal(y, angle, n)
        p.addScaledVector(n, lift)
        positions.push(p.x, p.y, p.z)
      }
      if (i < rows) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setIndex(index)
    geometry.computeVertexNormals()
    add(ctx, geometry, material)
  }
}

function addButtons(ctx: Ctx, top: Top) {
  if (top.buttonY === undefined) return
  const pearl = ctx.details.has('botoes')
  const material = pearl
    ? track(
        ctx,
        new MeshPhysicalMaterial({ color: ctx.look.pearl, roughness: 0.25, clearcoat: 1, iridescence: 0.6 }),
      )
    : solidMaterial(ctx, ctx.color.clone().lerp(new Color(ctx.theme.ink), 0.6), 0.4)
  const spots: [number, number][] = (() => {
    const y = top.buttonY
    switch (ctx.recipe.top) {
      case 'sobretudo':
        return [0, 1, 2].flatMap(
          (i) =>
            [
              [y - 0.02 - i * 0.11, 0.3],
              [y - 0.02 - i * 0.11, -0.3],
            ] as [number, number][],
        )
      case 'casaca':
        return [
          [y - 0.01, 0.38],
          [y - 0.01, -0.38],
        ]
      default:
        return ctx.recipe.neck === 'gravataBorboleta'
          ? [[y, 0.04]]
          : [
              [y, 0.04],
              [y - 0.1, 0.04],
            ]
    }
  })()
  const geometry = new CylinderGeometry(0.0105, 0.0105, 0.004, 20)
  const p = new Vector3()
  const n = new Vector3()
  for (const [y, theta] of spots) {
    top.loft.point(y, theta, p)
    top.loft.normal(y, theta, n)
    const button = add(ctx, geometry, material)
    button.position.copy(p.addScaledVector(n, 0.004))
    button.quaternion.copy(new Quaternion().setFromUnitVectors(UP, n))
  }
}

/** Capa aberta na frente, por fora dos braços e da saia. */
function addCape(ctx: Ctx, pose: ArmPose, outer: ((y: number) => number)[]) {
  const { body } = ctx
  const y = body.y
  const hem = body.linha === 'feminina' ? 0.06 : y.knee - 0.1
  const armOuter = (yy: number) => {
    const s = Math.max(0, (pose.jointY - yy) / Math.cos(pose.alpha))
    return pose.jointX + s * Math.sin(pose.alpha) + armRadius(body, Math.min(s, body.arm.length)) + 0.02
  }
  const keys: LoftKey[] = []
  const top = y.shoulder - 0.04
  const count = Math.ceil((top - hem) / 0.05)
  for (let i = 0; i <= count; i++) {
    const yy = lerp(hem, top, i / count)
    const env = envelope(ctx, yy)
    const under = Math.max(armOuter(yy), env.a, ...outer.map((f) => f(yy)))
    // A capa abre em direção à barra, menos quando o que está por baixo já é largo (saia ampla).
    const flare = 0.1 * (top - yy) * clamp((0.45 - under) / 0.2, 0, 1)
    const a = under + 0.035 + flare
    keys.push({ y: yy, a, b: Math.max(env.b + 0.06, a * 0.72) })
  }
  keys.push(
    { y: y.shoulder + 0.015, a: body.shoulder + 0.035, b: body.bust.b * 0.75 + 0.03 },
    { y: y.neck + 0.02, a: body.neckR + 0.02, b: body.neckR + 0.02 },
  )
  // Aberta na frente: mais na barra, menos no pescoço (o que está por baixo aparece).
  const opening = (yy: number) => lerp(0.62, 0.3, smoothstep(hem, y.shoulder, yy))
  add(ctx, loft(keys, { radial: 96, gap: opening }).geometry, fabricMaterial(ctx, { side: DoubleSide }))
}

// ---------------------------------------------------------------- detalhes

function addPearls(
  ctx: Ctx,
  surface: Loft,
  from: number,
  to: number,
  count: number,
  gap: (y: number) => number,
) {
  const rand = seeded(7 + count)
  const mesh = new InstancedMesh(
    new SphereGeometry(0.0045, 10, 8),
    track(
      ctx,
      new MeshPhysicalMaterial({ color: ctx.look.pearl, roughness: 0.2, clearcoat: 1, iridescence: 0.5 }),
    ),
    count,
  )
  const p = new Vector3()
  const n = new Vector3()
  const matrix = new Matrix4()
  let placed = 0
  for (let tries = 0; placed < count && tries < count * 10; tries++) {
    const y = lerp(Math.max(from, surface.y0), Math.min(to, surface.y1), rand())
    const theta = rand() * 2 * Math.PI
    if (Math.abs(wrapAngle(theta)) < gap(y) + 0.06) continue
    surface.point(y, theta, p)
    surface.normal(y, theta, n)
    matrix.makeTranslation(p.addScaledVector(n, 0.004))
    mesh.setMatrixAt(placed++, matrix)
  }
  mesh.count = placed
  mesh.castShadow = true
  ctx.group.add(mesh)
}

function addFeathers(ctx: Ctx, surface: Loft, y: number) {
  const count = 150
  const rand = seeded(11)
  const mesh = new InstancedMesh(
    new ConeGeometry(0.009, 0.11, 6),
    fabricMaterial(ctx, { opaque: true, color: ctx.color.clone().lerp(WHITE, 0.15) }),
    count,
  )
  const p = new Vector3()
  const n = new Vector3()
  const dir = new Vector3()
  const q = new Quaternion()
  const matrix = new Matrix4()
  const scale = new Vector3(1, 1, 1)
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * 2 * Math.PI + rand() * 0.04
    surface.point(y, theta, p)
    surface.normal(y, theta, n)
    // A pluma aponta para baixo e um pouco para fora; a ponta fina para baixo.
    dir.set(n.x * 0.6, -1, n.z * 0.6).normalize()
    q.setFromUnitVectors(new Vector3(0, -1, 0), dir)
    p.addScaledVector(n, 0.012).addScaledVector(dir, 0.04)
    scale.setScalar(0.8 + rand() * 0.5)
    matrix.compose(p, q, scale)
    mesh.setMatrixAt(i, matrix)
  }
  mesh.castShadow = true
  ctx.group.add(mesh)
}

let embroideryTexture: CanvasTexture | null = null

/** Motivo do bordado: ramos e pontos desenhados num canvas, usado como transparência. */
function embroidery(): CanvasTexture | null {
  if (embroideryTexture) return embroideryTexture
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const g = canvas.getContext('2d')
  if (!g) return null
  g.fillStyle = 'black'
  g.fillRect(0, 0, 256, 256)
  g.strokeStyle = 'white'
  g.fillStyle = 'white'
  g.lineWidth = 3
  const rand = seeded(3)
  for (let i = 0; i < 9; i++) {
    const x = rand() * 256
    const y = rand() * 256
    g.beginPath()
    g.moveTo(x, y)
    g.bezierCurveTo(x + 30, y - 40, x + 60, y + 20, x + 90, y - 30)
    g.stroke()
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2
      g.beginPath()
      g.ellipse(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 2.5, a, 0, Math.PI * 2)
      g.fill()
    }
  }
  for (let i = 0; i < 60; i++) {
    g.beginPath()
    g.arc(rand() * 256, rand() * 256, 1.6, 0, Math.PI * 2)
    g.fill()
  }
  embroideryTexture = new CanvasTexture(canvas)
  embroideryTexture.wrapS = RepeatWrapping
  embroideryTexture.wrapT = RepeatWrapping
  embroideryTexture.repeat.set(9, 4)
  return embroideryTexture
}

/** Bordado: uma película fina sobre o tecido, só com o desenho do motivo. */
function addEmbroidery(ctx: Ctx, surface: Loft, from: number, to: number) {
  const texture = embroidery()
  if (!texture) return
  const keys: LoftKey[] = []
  const a = Math.max(from, surface.y0)
  const b = Math.min(to, surface.y1)
  for (let i = 0; i <= 10; i++) {
    const y = lerp(a, b, i / 10)
    const r = surface.ring(y)
    keys.push({ y, a: r.a + 0.0015, b: r.b + 0.0015, cx: r.cx, cz: r.cz, n: r.n })
  }
  const material = track(
    ctx,
    new MeshStandardMaterial({
      color: ctx.look.embroidery,
      roughness: 0.4,
      metalness: 0.35,
      alphaMap: texture,
      transparent: true,
      depthWrite: false,
    }),
  )
  ctx.group.add(new Mesh(loft(keys, { radial: 96 }).geometry, material))
}

// ---------------------------------------------------------------- montagem

export interface Figure {
  group: Group
  dispose(): void
}

export function buildFigure({ body, piece, look, theme }: FigureInput): Figure {
  const recipe = look.pieces[piece.peca] ?? { top: 'tomaraQueCaia', bottom: 'saiaLonga' }
  const fit = look.silhouettes[piece.silhueta] ?? { skirt: 'coluna', ease: 1, shoulders: 0 }
  const fabric = look.fabrics[piece.tecido] ?? { roughness: 0.8, sheen: 0.2, opacity: 1 }
  const details = new Set(piece.detalhes.map((id) => look.details[id] ?? 'nenhum'))
  const group = new Group()
  const { legR, legCx } = legProfile(body)
  const ctx: Ctx = {
    body,
    torso: loft(torsoKeys(body), { radial: 64, bump: bustBump(body) }),
    legR,
    legCx,
    recipe,
    fit,
    fabric,
    color: new Color(look.colors[piece.cor] ?? theme.mannequin),
    details,
    look,
    theme,
    group,
    materials: [],
  }

  const skin = solidMaterial(ctx, theme.mannequin, 0.55)
  add(ctx, ctx.torso.geometry, skin)
  addHead(ctx, skin)
  addLegs(ctx, skin)
  addFeet(ctx, recipe.bottom === 'calca' ? solidMaterial(ctx, theme.ink, 0.3, 0.1) : skin)

  // Parte de baixo primeiro: a pose dos braços depende da largura da saia.
  const outer: ((y: number) => number)[] = [(y) => envelope(ctx, y).a]
  if (recipe.bottom === 'calca') outer.push(addTrousers(ctx))
  else outer.push(addSkirt(ctx, recipe.bottom === 'saiaLonga' ? 'longa' : 'midi'))

  let top: Top
  switch (recipe.top) {
    case 'tomaraQueCaia':
      top = strapless(ctx, false)
      break
    case 'corset':
      top = strapless(ctx, true)
      break
    case 'mangaLonga':
      top = longSleeved(ctx)
      break
    default:
      top = jacket(ctx)
  }
  outer.push(top.outer)

  const pose = armPose(body, outer, top.sleeveEase + top.sleeveFlare)
  addArms(ctx, pose, skin)
  if (top.sleeveEase > 0) addSleeves(ctx, pose, top)
  if (top.gap) {
    addShirtAndTie(ctx, top)
    addLapels(ctx, top)
    addButtons(ctx, top)
  }
  if (recipe.cape) addCape(ctx, pose, outer)

  const gap = top.gap ?? (() => 0)
  if (details.has('perolas')) addPearls(ctx, top.loft, body.y.waist, top.loft.y1 - 0.02, 70, gap)
  if (details.has('bordado'))
    addEmbroidery(ctx, top.loft, Math.max(top.loft.y0, body.y.waist - 0.1), top.loft.y1)

  // Base redonda, como um manequim de ateliê.
  const s = body.height / 1.7
  const base = add(
    ctx,
    new CylinderGeometry(0.4 * s, 0.42 * s, 0.03, 64),
    solidMaterial(ctx, theme.base, 0.45, 0.25),
  )
  base.position.y = -0.015

  return {
    group,
    dispose() {
      group.traverse((child) => {
        // InstancedMesh também é Mesh.
        if (child instanceof Mesh) (child as Mesh).geometry.dispose()
      })
      for (const material of ctx.materials) material.dispose()
    },
  }
}
