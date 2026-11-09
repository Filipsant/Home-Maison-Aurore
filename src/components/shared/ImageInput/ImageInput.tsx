import { useEffect, useMemo, useState } from 'react'
import { ACCEPTED_IMAGE_TYPES, isAcceptedImage } from '@/lib/ai/resizeImage'
import { cn } from '@/lib/utils'

interface ImageInputProps {
  id: string
  label: string
  hint: string
  /** Arquivo escolhido (para a prévia). */
  file: Blob | null
  onFile: (file: File | null) => void
  /** Mensagem quando o arquivo não é uma imagem aceita. */
  invalidMessage: string
  error?: string
}

/**
 * Campo de foto com prévia. O input nativo fica escondido só visualmente: a área
 * inteira é o rótulo, e o foco do teclado aparece na moldura.
 */
export function ImageInput({ id, label, hint, file, onFile, invalidMessage, error }: ImageInputProps) {
  const [typeError, setTypeError] = useState<string | null>(null)

  // Prévia calculada a partir do arquivo; o efeito só libera a memória da URL antiga.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  const message = typeError ?? error
  const hintId = `${id}-dica`
  const errorId = `${id}-erro`

  return (
    <div className="flex flex-col gap-2">
      <input
        id={id}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        aria-describedby={message ? `${hintId} ${errorId}` : hintId}
        aria-invalid={message ? true : undefined}
        className="peer sr-only"
        onChange={(event) => {
          const chosen = event.target.files?.[0] ?? null
          if (chosen && !isAcceptedImage(chosen)) {
            setTypeError(invalidMessage)
            onFile(null)
            return
          }
          setTypeError(null)
          onFile(chosen)
        }}
      />
      <label
        htmlFor={id}
        className={cn(
          'relative flex aspect-3/4 cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-texto-suave bg-musselina p-6 text-center transition-colors duration-500 ease-out-expo hover:bg-lilas',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-(--focus-ring) peer-focus-visible:outline-solid',
          message && 'border-grafite',
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="text-card-title font-medium text-grafite">{label}</span>
        )}
        {preview && <span className="sr-only">{label}</span>}
      </label>
      <p id={hintId} className="text-caption text-texto-suave">
        {hint}
      </p>
      {message && (
        <p id={errorId} role="alert" className="text-caption text-grafite">
          {message}
        </p>
      )}
    </div>
  )
}
