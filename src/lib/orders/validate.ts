// Imports relativos: este arquivo também roda no Worker (worker/routes/orders.ts).
import { measurements } from '../../data/measurements'
import { provadorPage } from '../../data/provadorPage'
import type { AtelierLinha } from '../../types/content'
import type { OrderErrors } from '../../types/order'

/**
 * Validação do pedido sob medida, igual na tela e no Worker: a tela mostra os
 * erros antes de enviar; o Worker repete tudo e nunca confia no navegador.
 */

export interface ValidOrder {
  pecaId: string
  medidas: Record<string, number>
  nome: string
  email: string
  telefone: string
  observacoes: string
}

export type OrderValidation = { ok: true; value: ValidOrder } | { ok: false; errors: OrderErrors }

export const ORDER_LIMITS = { nome: 80, email: 120, telefone: 30, observacoes: 500 } as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^[0-9+()\-\s]{8,30}$/

/** Texto de uma linha: sem caracteres de controle e sem espaços repetidos. */
function line(value: unknown): string {
  return typeof value === 'string'
    ? value
        .replace(/\p{Cc}/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : ''
}

/** Texto de várias linhas (observações): mantém as quebras de linha. */
function multiline(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .split(/\r?\n/)
    .map(line)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Lê uma medida digitada ("68", "68,5", 68.5). Devolve null se não for número. */
export function parseMeasure(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.round(raw * 10) / 10 : null
  if (typeof raw !== 'string' || !raw.trim()) return null
  const n = Number(raw.trim().replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null
}

export function isPieceId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

export function validateOrder(body: unknown, linha: AtelierLinha): OrderValidation {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const { errors: msg } = provadorPage
  const errors: OrderErrors = {}

  const pecaId = isPieceId(b.pecaId) ? b.pecaId : ''
  if (!pecaId) errors.pecaId = msg.peca

  const rawMedidas =
    typeof b.medidas === 'object' && b.medidas !== null ? (b.medidas as Record<string, unknown>) : {}
  const medidas: Record<string, number> = {}
  for (const field of measurements[linha]) {
    const value = parseMeasure(rawMedidas[field.id])
    if (value === null) errors[`medidas.${field.id}`] = msg.required
    else if (value < field.min || value > field.max)
      errors[`medidas.${field.id}`] = msg.range(field.min, field.max)
    else medidas[field.id] = value
  }

  const nome = line(b.nome)
  if (!nome) errors.nome = msg.required
  else if (nome.length > ORDER_LIMITS.nome) errors.nome = msg.nome

  const email = line(b.email).toLowerCase()
  if (!email) errors.email = msg.required
  else if (email.length > ORDER_LIMITS.email || !EMAIL.test(email)) errors.email = msg.email

  const telefone = line(b.telefone)
  if (telefone && !PHONE.test(telefone)) errors.telefone = msg.telefone

  const observacoes = multiline(b.observacoes)
  if (observacoes.length > ORDER_LIMITS.observacoes) errors.observacoes = msg.observacoes

  if (b.consentimento !== true) errors.consentimento = msg.consentimento

  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, value: { pecaId, medidas, nome, email, telefone, observacoes } }
}
