import { describe, expect, it } from 'vitest'
import {
  buildCorrectionPrompt,
  buildFittingPrompt,
  cleanCorrection,
  isBlockedCorrection,
  MAX_CORRECAO,
} from './fittingPrompt'

describe('correção da cliente', () => {
  it('limpa o texto: sem controle, sem aspas duplas, espaços simples, até 300 caracteres', () => {
    expect(cleanCorrection('  manga\n\naté o "punho"  ')).toBe("manga até o 'punho'")
    expect(cleanCorrection('x'.repeat(500))).toHaveLength(MAX_CORRECAO)
    expect(cleanCorrection(42)).toBe('')
  })

  it('bloqueia pedidos para despir ou trocar a pessoa', () => {
    for (const text of [
      'deixe ela nua',
      'tire a roupa',
      'sem roupa',
      'pessoa pelada',
      'make her naked',
      'NSFW',
      'troque o rosto',
      'mude a identidade',
      'face swap',
    ]) {
      expect(isBlockedCorrection(text), text).toBe(true)
    }
  })

  it('aceita pedidos de costura comuns (sem falso positivo em palavras parecidas)', () => {
    for (const text of [
      'manga até o punho',
      'barra no tornozelo',
      'decote nuance mais suave',
      'tecido cor de nuvem',
      'tire a capa',
      'lapela mais larga e botões dourados',
    ]) {
      expect(isBlockedCorrection(text), text).toBe(false)
    }
  })
})

describe('prompt da prova', () => {
  it('pede para manter a pessoa e reproduzir a peça, com a vista certa', () => {
    const front = buildFittingPrompt('frente', {})
    expect(front).toContain('from the front')
    expect(front).toContain('do not change the person')
    expect(front).not.toContain('made to measure')
    expect(buildFittingPrompt('lado', {})).toContain('in profile')
  })

  it('inclui as medidas em inglês', () => {
    const prompt = buildFittingPrompt('frente', { altura: 172, torax: 100, entrepernas: 82 })
    expect(prompt).toContain('height 172 cm, chest 100 cm, inseam 82 cm')
  })

  it('a correção entra entre aspas e pede para mudar só o que foi pedido', () => {
    const prompt = buildCorrectionPrompt('barra no tornozelo')
    expect(prompt).toContain('"barra no tornozelo"')
    expect(prompt).toContain('Change only what the correction asks')
  })
})
