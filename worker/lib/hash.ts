const encoder = new TextEncoder()

/** SHA-256 em hexadecimal de textos e/ou bytes, na ordem dada (chave de cache). */
export async function sha256(...parts: (string | ArrayBuffer | Uint8Array)[]): Promise<string> {
  const chunks = parts.map((part) =>
    typeof part === 'string'
      ? encoder.encode(part)
      : part instanceof Uint8Array
        ? part
        : new Uint8Array(part),
  )
  // Separador de 1 byte entre as partes: evita colisões como ("ab", "c") × ("a", "bc").
  const total = chunks.reduce((sum, c) => sum + c.byteLength + 1, 0)
  const buffer = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.byteLength + 1
  }
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
