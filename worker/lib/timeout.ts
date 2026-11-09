export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Tempo esgotado depois de ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

/**
 * Espera a promessa por no máximo `ms`. No tempo esgotado, chama `onTimeout`
 * (por exemplo, para cancelar a fila no Hugging Face) e rejeita com TimeoutError.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // Rejeita antes de cancelar: assim o motivo é sempre "tempo", nunca o erro do cancelamento.
      reject(new TimeoutError(ms))
      onTimeout?.()
    }, ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/** Lê um número de uma variável de ambiente, com valor padrão. */
export function msFromEnv(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}
