import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Site } from '@/types/content'

interface BookingFormProps {
  form: Site['footer']['form']
  className?: string
}

/**
 * Formulário de e-mail do rodapé. Validação nativa do navegador (`type="email"`,
 * `required`); a confirmação é anunciada a leitores de tela.
 * O envio real fica para quando houver um serviço de agendamento.
 */
export function BookingForm({ form, className }: BookingFormProps) {
  const id = useId()
  const [sent, setSent] = useState(false)

  return (
    <form
      className={cn('flex flex-col gap-3.5', className)}
      onSubmit={(event) => {
        event.preventDefault()
        setSent(true)
      }}
    >
      <Label htmlFor={`${id}-email`} className="text-texto-suave-escuro">
        {form.label}
      </Label>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-3 md:border-b md:border-linha-escura md:pb-2.5">
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={form.placeholder}
          aria-describedby={`${id}-privacy`}
          className="flex-1 border-b border-linha-escura text-nevoa placeholder:text-texto-suave-escuro md:border-0"
        />
        <Button type="submit" variant="light" className="self-start md:self-auto">
          {form.submit}
        </Button>
      </div>
      <p id={`${id}-privacy`} className="text-note text-texto-suave-escuro">
        {form.privacy}
      </p>
      <p role="status" className="min-h-6 text-caption text-giz-claro">
        {sent ? form.success : ''}
      </p>
    </form>
  )
}
