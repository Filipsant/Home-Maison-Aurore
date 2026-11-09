import { cn } from '@/lib/utils'

export interface OptionGroupOption {
  id: string
  label: string
}

interface OptionGroupProps {
  legend: string
  /** Nome do grupo no formulário (também usado nos ids). */
  name: string
  options: OptionGroupOption[]
  selected: string[]
  /** Várias escolhas (checkbox) em vez de uma só (radio). */
  multiple?: boolean
  /** Máximo de escolhas quando `multiple`: as demais ficam desabilitadas. */
  max?: number
  onToggle: (id: string) => void
}

/**
 * Grupo de opções em pílula. Usa inputs nativos (radio/checkbox) escondidos só
 * visualmente: teclado, leitor de tela e formulário funcionam sem JavaScript extra.
 */
export function OptionGroup({
  legend,
  name,
  options,
  selected,
  multiple = false,
  max,
  onToggle,
}: OptionGroupProps) {
  const full = multiple && max !== undefined && selected.length >= max
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-caption text-texto-suave">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `${name}-${option.id}`
          const checked = selected.includes(option.id)
          const disabled = full && !checked
          return (
            <div key={option.id}>
              <input
                id={id}
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                value={option.id}
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(option.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center rounded-pill border border-grafite px-5 text-button text-grafite transition-colors duration-500 ease-out-expo select-none',
                  'peer-checked:border-grafite peer-checked:bg-grafite peer-checked:text-nevoa hover:bg-musselina',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-(--focus-ring) peer-focus-visible:outline-solid',
                  'peer-disabled:cursor-not-allowed peer-disabled:border-linha peer-disabled:text-texto-suave peer-disabled:hover:bg-transparent',
                )}
              >
                {option.label}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
