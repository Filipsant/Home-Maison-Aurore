import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('mantém tamanho e cor do tema juntos (não são classes em conflito)', () => {
    expect(cn('text-display-xl', 'text-grafite')).toBe('text-display-xl text-grafite')
    expect(cn('text-caption text-texto-suave')).toBe('text-caption text-texto-suave')
  })

  it('a última cor do tema vence', () => {
    expect(cn('bg-nevoa', 'bg-veludo')).toBe('bg-veludo')
    expect(cn('text-grafite', 'text-nevoa')).toBe('text-nevoa')
  })

  it('o último tamanho do tema vence', () => {
    expect(cn('text-display-m', 'text-display-s')).toBe('text-display-s')
  })

  it('aceita condicionais', () => {
    const ativo = false
    expect(cn('px-gutter', ativo && 'bg-giz')).toBe('px-gutter')
  })
})
