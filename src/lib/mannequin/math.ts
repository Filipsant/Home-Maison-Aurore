/** Funções numéricas pequenas do manequim (sem three.js: testáveis em Node). */

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Ângulo em (-π, π]. No manequim, 0 é a frente e π as costas. */
export function wrapAngle(theta: number): number {
  const t = theta % (2 * Math.PI)
  if (t > Math.PI) return t - 2 * Math.PI
  if (t <= -Math.PI) return t + 2 * Math.PI
  return t
}

const at = (arr: readonly number[], i: number) => arr[i] ?? 0

/**
 * Interpolação cúbica monótona (Fritsch–Carlson): passa pelos pontos sem
 * "inchar" entre eles. Evita barrigas e raios negativos no corpo e nas roupas.
 * `xs` precisa ser crescente.
 */
export function monotone(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length
  if (n === 0) return () => 0
  if (n === 1) return () => at(ys, 0)

  const d: number[] = []
  for (let i = 0; i < n - 1; i++) d.push((at(ys, i + 1) - at(ys, i)) / (at(xs, i + 1) - at(xs, i)))
  const m: number[] = [at(d, 0)]
  for (let i = 1; i < n - 1; i++) {
    const a = at(d, i - 1)
    const b = at(d, i)
    m.push(a * b <= 0 ? 0 : (a + b) / 2)
  }
  m.push(at(d, n - 2))
  for (let i = 0; i < n - 1; i++) {
    const di = at(d, i)
    if (di === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = at(m, i) / di
    const b = at(m, i + 1) / di
    const s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[i] = t * a * di
      m[i + 1] = t * b * di
    }
  }

  return (x: number) => {
    if (x <= at(xs, 0)) return at(ys, 0)
    if (x >= at(xs, n - 1)) return at(ys, n - 1)
    let i = 0
    while (i < n - 2 && x > at(xs, i + 1)) i++
    const h = at(xs, i + 1) - at(xs, i)
    const t = (x - at(xs, i)) / h
    const t2 = t * t
    const t3 = t2 * t
    return (
      (2 * t3 - 3 * t2 + 1) * at(ys, i) +
      (t3 - 2 * t2 + t) * h * at(m, i) +
      (-2 * t3 + 3 * t2) * at(ys, i + 1) +
      (t3 - t2) * h * at(m, i + 1)
    )
  }
}

/** Raio de uma elipse com meia-largura `a` e profundidade `b = k·a`, a partir da circunferência (Ramanujan). */
export function ellipseFromCircumference(circumference: number, k: number): { a: number; b: number } {
  const factor = 3 * (1 + k) - Math.sqrt((3 + k) * (1 + 3 * k))
  const a = circumference / (Math.PI * factor)
  return { a, b: a * k }
}

/** Gerador pseudoaleatório com semente: pérolas e plumas ficam no mesmo lugar a cada redesenho. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}
