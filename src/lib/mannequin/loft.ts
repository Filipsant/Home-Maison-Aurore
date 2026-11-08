import { BufferAttribute, BufferGeometry, Vector3 } from 'three'
import { monotone } from './math'

/**
 * "Loft" de anéis horizontais: a técnica usada em todo o manequim. Cada parte
 * (tronco, braço, saia, paletó…) é descrita por poucos anéis-chave (altura,
 * meia-largura, meia-profundidade) e a superfície é costurada entre eles com
 * interpolação suave. Ângulo θ = 0 é a frente (+z), π/2 o lado direito (+x).
 */

export interface LoftKey {
  y: number
  /** Meia-largura (eixo x). */
  a: number
  /** Meia-profundidade (eixo z). */
  b: number
  /** Centro do anel (braços e pernas ficam fora do eixo). */
  cx?: number
  cz?: number
  /** Expoente da superelipse: 2 = elipse; maior = mais "quadrado" (tronco). */
  n?: number
}

export interface LoftOptions {
  /** Pontos ao redor de cada anel. */
  radial?: number
  /** Abertura na frente, em radianos para cada lado, conforme a altura (paletó, capa). */
  gap?: (y: number) => number
  /** Só um setor: [início, fim] em radianos (cauda da casaca). */
  arc?: readonly [number, number]
  /** Raio extra conforme o ângulo e a altura (pregas, drapeado, busto). */
  bump?: (theta: number, y: number) => number
  /** Desvio vertical conforme o ângulo e a altura (decote). */
  dy?: (theta: number, y: number) => number
}

interface Ring {
  y: number
  a: number
  b: number
  cx: number
  cz: number
  n: number
}

export interface Loft {
  geometry: BufferGeometry
  /** Altura de baixo e de cima. */
  y0: number
  y1: number
  /** Anel interpolado numa altura. */
  ring(y: number): Ring
  /** Ponto da superfície na altura `y` e ângulo `theta`. */
  point(y: number, theta: number, out?: Vector3): Vector3
  /** Direção "para fora" aproximada (para pôr pérolas e botões sobre o tecido). */
  normal(y: number, theta: number, out?: Vector3): Vector3
}

/** Seno/cosseno com expoente de superelipse, preservando o sinal. */
const shaped = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e

export function loft(keys: readonly LoftKey[], options: LoftOptions = {}): Loft {
  const sorted = [...keys].sort((p, q) => p.y - q.y)
  // Alturas estritamente crescentes (a interpolação exige).
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (prev && cur && cur.y <= prev.y) sorted[i] = { ...cur, y: prev.y + 1e-4 }
  }
  const ys = sorted.map((k) => k.y)
  const fa = monotone(
    ys,
    sorted.map((k) => k.a),
  )
  const fb = monotone(
    ys,
    sorted.map((k) => k.b),
  )
  const fcx = monotone(
    ys,
    sorted.map((k) => k.cx ?? 0),
  )
  const fcz = monotone(
    ys,
    sorted.map((k) => k.cz ?? 0),
  )
  const fn = monotone(
    ys,
    sorted.map((k) => k.n ?? 2),
  )
  const y0 = ys[0] ?? 0
  const y1 = ys[ys.length - 1] ?? 0

  const ring = (y: number): Ring => ({
    y,
    a: Math.max(1e-4, fa(y)),
    b: Math.max(1e-4, fb(y)),
    cx: fcx(y),
    cz: fcz(y),
    n: fn(y),
  })

  const point = (y: number, theta: number, out = new Vector3()) => {
    const r = ring(y)
    const e = 2 / r.n
    const bump = options.bump?.(theta, y) ?? 0
    return out.set(
      r.cx + (r.a + bump) * shaped(Math.sin(theta), e),
      y + (options.dy?.(theta, y) ?? 0),
      r.cz + (r.b + bump) * shaped(Math.cos(theta), e),
    )
  }

  const normal = (y: number, theta: number, out = new Vector3()) => {
    const r = ring(y)
    return out.set(Math.sin(theta) / r.a, 0, Math.cos(theta) / r.b).normalize()
  }

  const radial = options.radial ?? 64
  const rings = Math.max(6, Math.ceil((y1 - y0) / 0.012))
  const closed = !options.gap && !options.arc
  const cols = closed ? radial : radial + 1
  const positions = new Float32Array((rings + 1) * cols * 3)
  const uvs = new Float32Array((rings + 1) * cols * 2)
  const p = new Vector3()

  for (let i = 0; i <= rings; i++) {
    const t = i / rings
    const y = y0 + (y1 - y0) * t
    const g = options.gap?.(y) ?? 0
    const [start, end] = options.arc ?? (closed ? [Math.PI, 3 * Math.PI] : [g, 2 * Math.PI - g])
    for (let j = 0; j < cols; j++) {
      const u = closed ? j / radial : j / (cols - 1)
      // Anéis fechados começam nas costas: a emenda fica atrás, não na frente.
      point(y, start + (end - start) * u, p)
      const v = (i * cols + j) * 3
      positions[v] = p.x
      positions[v + 1] = p.y
      positions[v + 2] = p.z
      uvs[(i * cols + j) * 2] = u
      uvs[(i * cols + j) * 2 + 1] = t
    }
  }

  const indices: number[] = []
  const span = closed ? radial : cols - 1
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < span; j++) {
      const j1 = closed ? (j + 1) % radial : j + 1
      const a = i * cols + j
      const b = i * cols + j1
      const c = (i + 1) * cols + j
      const d = (i + 1) * cols + j1
      indices.push(a, b, c, b, d, c)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return { geometry, y0, y1, ring, point, normal }
}
