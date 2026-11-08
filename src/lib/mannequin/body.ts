// Imports relativos: arquivo puro, testável em Node.
import { measurements } from '../../data/measurements'
import type { AtelierLinha } from '../../types/content'
import { parseMeasure } from '../orders/validate'
import { clamp, ellipseFromCircumference } from './math'

/**
 * Corpo do manequim, em metros, a partir das medidas em centímetros.
 * Alturas como fração da altura total (proporções de manequim de costura);
 * larguras a partir das circunferências medidas, como elipses.
 */

export interface Ellipse {
  a: number
  b: number
}

export interface Body {
  linha: AtelierLinha
  height: number
  y: {
    ankle: number
    knee: number
    crotch: number
    hip: number
    waist: number
    underbust: number
    bust: number
    armpit: number
    shoulder: number
    neck: number
    chin: number
    top: number
  }
  bust: Ellipse
  waist: Ellipse
  hip: Ellipse
  /** Meia largura de ombro a ombro. */
  shoulder: number
  neckR: number
  arm: { length: number; upperR: number; elbowR: number; wristR: number; handLength: number }
  leg: { x: number; ankleX: number; thighR: number; kneeR: number; calfR: number; ankleR: number }
  head: { height: number; a: number; b: number }
  /** Volume extra do busto à frente (só na linha feminina). */
  bustBump: number
}

/** Medidas usadas no manequim: o valor digitado (dentro dos limites) ou o típico. */
export function resolveMeasures(linha: AtelierLinha, raw: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const field of measurements[linha]) {
    const value = parseMeasure(raw[field.id])
    out[field.id] = value === null ? field.typical : clamp(value, field.min, field.max)
  }
  return out
}

export function bodyFromMeasures(linha: AtelierLinha, raw: Record<string, unknown> = {}): Body {
  const m = resolveMeasures(linha, raw)
  const female = linha === 'feminina'
  const cm = (id: string, fallback: number) => (m[id] ?? fallback) / 100

  const H = cm('altura', female ? 168 : 178)
  const scale = H / (female ? 1.68 : 1.78)
  const bustC = cm(female ? 'busto' : 'torax', female ? 88 : 98)
  const waistC = cm('cintura', female ? 68 : 84)
  const hipC = cm('quadril', female ? 96 : 98)
  const shoulders = cm('ombros', female ? 38 : 46)
  const armLength = cm('braco', female ? 58 : 64)
  const neckC = female ? 0.33 * scale : cm('pescoco', 39)

  const crotch = female ? 0.47 * H : clamp(cm('entrepernas', 80) + 0.02, 0.4 * H, 0.52 * H)
  const y = {
    ankle: 0.045 * H,
    knee: 0.285 * H,
    crotch,
    hip: Math.max(crotch + 0.06, (female ? 0.52 : 0.515) * H),
    waist: (female ? 0.625 : 0.6) * H,
    underbust: 0.69 * H,
    bust: (female ? 0.72 : 0.725) * H,
    armpit: (female ? 0.75 : 0.745) * H,
    shoulder: (female ? 0.815 : 0.81) * H,
    neck: (female ? 0.835 : 0.83) * H,
    chin: 0.87 * H,
    top: H,
  }

  const hip = ellipseFromCircumference(hipC, female ? 0.78 : 0.75)
  const thighR = (0.58 * hipC) / (2 * Math.PI)
  const upperR = ((female ? 0.31 : 0.32) * bustC) / (2 * Math.PI)
  const headHeight = H / 7.6

  return {
    linha,
    height: H,
    y,
    bust: ellipseFromCircumference(bustC, female ? 0.82 : 0.68),
    waist: ellipseFromCircumference(waistC, female ? 0.72 : 0.75),
    hip,
    shoulder: shoulders / 2,
    neckR: neckC / (2 * Math.PI),
    arm: {
      length: armLength,
      upperR,
      elbowR: upperR * 0.74,
      wristR: 0.026 * scale,
      handLength: 0.108 * H,
    },
    leg: {
      x: Math.max(thighR * 0.98, hip.a * 0.45),
      ankleX: 0.06 * scale,
      thighR,
      kneeR: (0.38 * hipC) / (2 * Math.PI),
      calfR: (0.37 * hipC) / (2 * Math.PI),
      ankleR: (0.22 * hipC) / (2 * Math.PI),
    },
    head: { height: headHeight, a: headHeight * 0.36, b: headHeight * 0.44 },
    bustBump: female ? clamp((bustC - waistC) * 0.08, 0.004, 0.026) : 0,
  }
}
