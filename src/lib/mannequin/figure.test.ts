import { Box3, Mesh, type BufferAttribute } from 'three'
import { describe, expect, it } from 'vitest'
import { atelierOptions } from '@/data/atelierOptions'
import { mannequinLook } from '@/data/mannequin'
import { measurements } from '@/data/measurements'
import { optionsForLinha } from '@/lib/ai/atelier'
import type { PieceRequest } from '@/types/ai'
import { bodyFromMeasures, resolveMeasures } from './body'
import { buildFigure } from './figure'
import { monotone } from './math'

const theme = { mannequin: '#cfc9bf', base: '#1c1b20', shirt: '#e9e7ea', ink: '#1c1b20' }

function piece(linha: 'feminina' | 'masculina', over: Partial<PieceRequest> = {}): PieceRequest {
  const first = (field: 'peca' | 'tecido' | 'cor' | 'silhueta' | 'colecao') =>
    optionsForLinha(atelierOptions[field], linha)[0]?.id ?? ''
  return {
    linha,
    peca: first('peca'),
    tecido: first('tecido'),
    cor: first('cor'),
    silhueta: first('silhueta'),
    detalhes: [],
    colecao: first('colecao'),
    ...over,
  }
}

/** Monta a figura e confere: nenhum vértice inválido e tamanho de gente. */
function check(linha: 'feminina' | 'masculina', over: Partial<PieceRequest>, raw = {}) {
  const body = bodyFromMeasures(linha, raw)
  const figure = buildFigure({ body, piece: piece(linha, over), look: mannequinLook, theme })
  let vertices = 0
  figure.group.traverse((child) => {
    if (!(child instanceof Mesh)) return
    const position = (child as Mesh).geometry.getAttribute('position') as BufferAttribute
    for (let i = 0; i < position.array.length; i++) {
      if (!Number.isFinite(position.array[i])) throw new Error(`vértice inválido em ${JSON.stringify(over)}`)
    }
    vertices += position.count
  })
  const box = new Box3().setFromObject(figure.group)
  figure.dispose()
  return { vertices, box, body }
}

describe('corpo a partir das medidas', () => {
  it('usa o valor típico quando o campo está vazio ou não é número, e prende nos limites', () => {
    const resolved = resolveMeasures('feminina', {
      altura: '',
      cintura: 'abc',
      busto: '500',
      quadril: '101,5',
    })
    expect(resolved).toMatchObject({ altura: 168, cintura: 68, busto: 160, quadril: 101.5 })
  })

  it('cintura maior deixa o manequim mais largo na cintura; altura muda a altura', () => {
    const thin = bodyFromMeasures('feminina', { cintura: 60 })
    const wide = bodyFromMeasures('feminina', { cintura: 100 })
    expect(wide.waist.a).toBeGreaterThan(thin.waist.a * 1.5)
    expect(bodyFromMeasures('masculina', { altura: 195 }).height).toBeCloseTo(1.95)
  })

  it('cada linha tem todas as medidas com valor típico dentro dos limites', () => {
    for (const fields of Object.values(measurements)) {
      for (const f of fields) expect(f.typical).toBeGreaterThanOrEqual(f.min)
    }
  })
})

describe('manequim vestido (todas as combinações do catálogo)', () => {
  it('cada id do catálogo tem como aparecer no 3D', () => {
    for (const o of atelierOptions.peca) expect(mannequinLook.pieces[o.id], o.id).toBeDefined()
    for (const o of atelierOptions.tecido) expect(mannequinLook.fabrics[o.id], o.id).toBeDefined()
    for (const o of atelierOptions.cor) expect(mannequinLook.colors[o.id], o.id).toBeDefined()
    for (const o of atelierOptions.silhueta) expect(mannequinLook.silhouettes[o.id], o.id).toBeDefined()
    for (const o of atelierOptions.detalhes) expect(mannequinLook.details[o.id], o.id).toBeDefined()
    for (const o of atelierOptions.colecao) expect(mannequinLook.collections[o.id], o.id).toBeDefined()
  })

  for (const linha of ['feminina', 'masculina'] as const) {
    it(`linha ${linha}: toda peça com toda silhueta e todos os detalhes monta sem erro`, () => {
      const detalhes = optionsForLinha(atelierOptions.detalhes, linha).map((d) => d.id)
      for (const peca of optionsForLinha(atelierOptions.peca, linha)) {
        for (const silhueta of optionsForLinha(atelierOptions.silhueta, linha)) {
          const { box, body, vertices } = check(linha, { peca: peca.id, silhueta: silhueta.id, detalhes })
          expect(vertices).toBeGreaterThan(1000)
          // Da base ao topo da cabeça; nada mais largo que 1,6 m (saia ampla com capa e plumas).
          expect(box.max.y).toBeCloseTo(body.height, 1)
          expect(box.max.x - box.min.x).toBeLessThan(1.6)
        }
      }
    })
  }

  it('organza ganha forro (mais malhas que o mesmo vestido em crepe)', () => {
    const count = (tecido: string) => {
      const body = bodyFromMeasures('feminina')
      const figure = buildFigure({ body, piece: piece('feminina', { tecido }), look: mannequinLook, theme })
      const n = figure.group.children.length
      figure.dispose()
      return n
    }
    expect(count('organza')).toBeGreaterThan(count('crepe'))
  })

  it('medidas extremas também montam', () => {
    check('feminina', {}, { altura: 130, busto: 160, cintura: 160, quadril: 170, ombros: 28, braco: 40 })
    check('masculina', {}, { altura: 215, torax: 75, cintura: 55, quadril: 75, ombros: 62, entrepernas: 105 })
  })
})

describe('interpolação monótona', () => {
  it('passa pelos pontos e não ultrapassa os vizinhos', () => {
    const f = monotone([0, 1, 2, 3], [0, 1, 1, 5])
    expect(f(1)).toBeCloseTo(1)
    expect(f(1.5)).toBeCloseTo(1)
    expect(f(2.5)).toBeGreaterThan(1)
    expect(f(2.5)).toBeLessThan(5)
  })
})
