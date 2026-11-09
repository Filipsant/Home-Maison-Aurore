/**
 * Reduz a foto no navegador antes do envio (lado maior com até `maxSide` px, JPEG).
 * Fotos de celular têm 3 a 8 MB; reduzidas ficam com ~150 a 300 KB. O provador
 * responde mais rápido e o Worker gasta menos CPU no hash.
 */
export async function resizeImage(file: Blob, maxSide = 1024, quality = 0.88): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality)
  })
}

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function isAcceptedImage(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)
}
