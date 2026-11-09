import type { AtelierOption } from '@/types/content'

/**
 * Regras da linha (feminina/masculina), usadas pela tela e pelo Worker.
 * Só importa tipos: o Worker pode usar este arquivo sem levar nada da tela.
 */

/** A opção vale para esta linha? Sem `linhas`, vale para as duas. */
export function fitsLinha(option: AtelierOption, linha: string): boolean {
  return !option.linhas || option.linhas.some((l) => l === linha)
}

/** Opções de um campo disponíveis numa linha, na ordem do catálogo. */
export function optionsForLinha(list: AtelierOption[], linha: string): AtelierOption[] {
  return list.filter((option) => fitsLinha(option, linha))
}
