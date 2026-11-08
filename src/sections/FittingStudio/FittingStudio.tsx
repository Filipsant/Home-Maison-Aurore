import { useDeferredValue, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { autoReveal } from '@/animations/presets'
import { Container } from '@/components/shared/Container'
import { Mannequin3D } from '@/components/shared/Mannequin3D'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { TextLink } from '@/components/shared/TextLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { measurements } from '@/data/measurements'
import { provadorPage } from '@/data/provadorPage'
import { apiUrl } from '@/lib/ai/client'
import { altForPiece, pieceSummary } from '@/lib/ai/describe'
import { fetchPiece, sendOrder, type PieceLookup } from '@/lib/api/orders'
import { resolveMeasures } from '@/lib/mannequin/body'
import { isPieceId, ORDER_LIMITS, validateOrder } from '@/lib/orders/validate'
import { cn } from '@/lib/utils'
import type { PieceRequest } from '@/types/ai'
import type { AtelierLinha } from '@/types/content'
import type { OrderContact, OrderErrors } from '@/types/order'

const { viewer, measures: measuresText, contact: contactText, errors: errorText } = provadorPage

/** Id do campo na tela, a partir da chave do erro ("medidas.busto" → "medida-busto"). */
const fieldId = (key: string) => (key.startsWith('medidas.') ? `medida-${key.slice(8)}` : `contato-${key}`)

/** Tela "Provador 3D": a peça do ateliê digital no manequim, com medidas e pedido. */
export function FittingStudio() {
  const ref = useRef<HTMLElement>(null)
  const [id] = useState(() => new URLSearchParams(window.location.search).get('peca'))
  const [lookup, setLookup] = useState<PieceLookup | { status: 'carregando' }>(() =>
    isPieceId(id) ? { status: 'carregando' } : { status: 'nao-encontrada' },
  )

  useEffect(() => {
    if (!isPieceId(id)) return
    const controller = new AbortController()
    fetchPiece(id, controller.signal)
      .then(setLookup)
      .catch(() => undefined)
    return () => controller.abort()
  }, [id])

  useSectionAnimation(ref, (root, { reduced }) => {
    autoReveal(root, { reduced })
  })

  return (
    <section ref={ref} aria-labelledby="provador-title" className="pt-header">
      <Container className="flex flex-col gap-12 pt-section pb-section">
        <div className="flex max-w-160 flex-col gap-5">
          <SectionHeading id="provador-title" level={1} size="l">
            {provadorPage.title}
          </SectionHeading>
          <p data-reveal="lines" className="text-lead">
            {provadorPage.lead}
          </p>
        </div>

        {lookup.status === 'carregando' && (
          <p role="status" className="text-caption text-texto-suave">
            {provadorPage.loading}
          </p>
        )}
        {(lookup.status === 'nao-encontrada' || lookup.status === 'erro') && <MissingPiece />}
        {lookup.status === 'ok' && <Fitting id={lookup.id} piece={lookup.peca} imageUrl={lookup.imageUrl} />}
      </Container>
    </section>
  )
}

function MissingPiece() {
  const { missing } = provadorPage
  return (
    <div className="flex max-w-140 flex-col gap-4 border-t border-linha pt-8">
      <h2 className="font-display text-display-card leading-none">{missing.title}</h2>
      <p>{missing.text}</p>
      <div>
        <Button asChild variant="dark">
          <a href={missing.link.href}>{missing.link.label}</a>
        </Button>
      </div>
    </div>
  )
}

type SendState =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; codigo: string }

function Fitting({ id, piece, imageUrl }: { id: string; piece: PieceRequest; imageUrl: string }) {
  const linha: AtelierLinha = piece.linha === 'masculina' ? 'masculina' : 'feminina'
  const fields = measurements[linha]
  const [measures, setMeasures] = useState<Record<string, string>>({})
  const [contact, setContact] = useState<OrderContact>({ nome: '', email: '', telefone: '', observacoes: '' })
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<OrderErrors>({})
  const [send, setSend] = useState<SendState>({ phase: 'idle' })
  const trap = useRef<HTMLInputElement>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)
  // O manequim acompanha a digitação sem travar o campo.
  const deferredMeasures = useDeferredValue(measures)

  const resolved = resolveMeasures(linha, deferredMeasures)
  const mannequinLabel = `${viewer.altPrefix}: ${altForPiece(piece)}. ${fields
    .map((f) => `${f.label} ${resolved[f.id]} cm`)
    .join(', ')}.`

  useEffect(() => {
    if (send.phase === 'done') doneRef.current?.focus()
  }, [send.phase])

  const showErrors = (found: OrderErrors) => {
    setErrors(found)
    setSend({ phase: 'error', message: errorText.summary })
    const order = [
      ...fields.map((f) => `medidas.${f.id}`),
      'nome',
      'email',
      'telefone',
      'observacoes',
      'consentimento',
    ]
    const first = order.find((key) => found[key])
    if (first) document.getElementById(fieldId(first))?.focus()
  }

  const submit = async () => {
    const body = { pecaId: id, medidas: measures, ...contact, consentimento: consent }
    const validation = validateOrder(body, linha)
    if (!validation.ok) {
      showErrors(validation.errors)
      return
    }
    setErrors({})
    setSend({ phase: 'sending' })
    const result = await sendOrder({
      ...validation.value,
      consentimento: true,
      site: trap.current?.value ?? '',
    })
    if (result.status === 'ok') setSend({ phase: 'done', codigo: result.codigo })
    else if (result.motivo === 'invalido') showErrors(result.erros ?? {})
    else setSend({ phase: 'error', message: errorText[result.motivo] })
  }

  const errorFor = (key: string) => errors[key]

  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-8">
      <div className="md:sticky md:top-header md:col-span-6 md:self-start md:pt-2 lg:col-span-5">
        <Mannequin3D piece={piece} measures={deferredMeasures} label={mannequinLabel} texts={viewer} />
      </div>

      <div className="flex flex-col gap-12 md:col-span-6 lg:col-span-6 lg:col-start-7">
        <PieceCard piece={piece} imageUrl={imageUrl} />

        {send.phase === 'done' ? (
          <div className="flex flex-col gap-4 border-t border-linha pt-8">
            <h2
              ref={doneRef}
              tabIndex={-1}
              className="font-display text-display-card leading-none outline-none"
            >
              {provadorPage.success.title}
            </h2>
            <p role="status">{provadorPage.success.text(send.codigo)}</p>
            <div>
              <Button asChild variant="outline">
                <a href={provadorPage.piece.change.href}>{provadorPage.success.again}</a>
              </Button>
            </div>
          </div>
        ) : (
          <form
            noValidate
            className="flex flex-col gap-12"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <fieldset className="flex flex-col gap-6">
              <legend className="mb-2 font-display text-display-card leading-none">
                {measuresText.title}
              </legend>
              <p className="text-caption text-texto-suave">{measuresText.note}</p>
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {fields.map((field) => (
                  <Field
                    key={field.id}
                    id={`medida-${field.id}`}
                    label={field.label}
                    hint={field.hint}
                    error={errorFor(`medidas.${field.id}`)}
                    suffix="cm"
                  >
                    {(props) => (
                      <Input
                        {...props}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder={String(field.typical)}
                        value={measures[field.id] ?? ''}
                        onChange={(e) => setMeasures((m) => ({ ...m, [field.id]: e.target.value }))}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-6">
              <legend className="mb-2 font-display text-display-card leading-none">
                {contactText.title}
              </legend>
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <Field id="contato-nome" label={contactText.nome} error={errorFor('nome')}>
                  {(props) => (
                    <Input
                      {...props}
                      autoComplete="name"
                      maxLength={ORDER_LIMITS.nome}
                      value={contact.nome}
                      onChange={(e) => setContact((c) => ({ ...c, nome: e.target.value }))}
                    />
                  )}
                </Field>
                <Field id="contato-email" label={contactText.email} error={errorFor('email')}>
                  {(props) => (
                    <Input
                      {...props}
                      type="email"
                      autoComplete="email"
                      maxLength={ORDER_LIMITS.email}
                      value={contact.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    />
                  )}
                </Field>
                <Field id="contato-telefone" label={contactText.telefone} error={errorFor('telefone')}>
                  {(props) => (
                    <Input
                      {...props}
                      type="tel"
                      autoComplete="tel"
                      maxLength={ORDER_LIMITS.telefone}
                      value={contact.telefone}
                      onChange={(e) => setContact((c) => ({ ...c, telefone: e.target.value }))}
                    />
                  )}
                </Field>
              </div>
              <Field
                id="contato-observacoes"
                label={contactText.observacoes}
                hint={contactText.observacoesHint}
                error={errorFor('observacoes')}
              >
                {(props) => (
                  <textarea
                    {...props}
                    rows={3}
                    maxLength={ORDER_LIMITS.observacoes}
                    value={contact.observacoes}
                    onChange={(e) => setContact((c) => ({ ...c, observacoes: e.target.value }))}
                    className="min-h-24 w-full resize-y border-0 bg-transparent py-2 font-sans text-field text-foreground outline-none"
                  />
                )}
              </Field>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contato-consentimento"
                  className="flex cursor-pointer items-start gap-3 text-caption"
                >
                  <input
                    id="contato-consentimento"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    aria-invalid={errorFor('consentimento') ? true : undefined}
                    aria-describedby={errorFor('consentimento') ? 'contato-consentimento-erro' : undefined}
                    className="mt-0.5 size-5 shrink-0 accent-grafite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
                  />
                  <span>{contactText.consentimento}</span>
                </label>
                {errorFor('consentimento') && (
                  <p id="contato-consentimento-erro" className="text-caption font-medium text-grafite">
                    {errorFor('consentimento')}
                  </p>
                )}
              </div>
            </fieldset>

            {/* Campo-isca: invisível para pessoas; robôs costumam preencher. */}
            <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
              <label>
                Site
                <input ref={trap} type="text" name="site" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <Button type="submit" variant="dark" disabled={send.phase === 'sending'}>
                  {send.phase === 'sending' ? provadorPage.sending : provadorPage.submit}
                </Button>
              </div>
              <p role="status" aria-live="polite" className="min-h-6 text-caption font-medium text-grafite">
                {send.phase === 'error' ? send.message : ''}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function PieceCard({ piece, imageUrl }: { piece: PieceRequest; imageUrl: string }) {
  return (
    <div className="flex gap-6 border-t border-linha pt-8">
      <div className="relative aspect-3/4 w-28 shrink-0 overflow-hidden bg-musselina sm:w-36">
        <img
          src={apiUrl(imageUrl)}
          alt={`${provadorPage.piece.photoAlt}: ${altForPiece(piece)}`}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="text-card-title">{provadorPage.piece.title}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-caption">
          {pieceSummary(piece).map(({ label, value }) => (
            <div key={label} className="contents">
              <dt className="text-texto-suave">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <TextLink href={provadorPage.piece.change.href} className="self-start">
          {provadorPage.piece.change.label}
        </TextLink>
      </div>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  suffix?: string
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode
}

/** Campo com rótulo, dica e erro ligados ao input (leitores de tela leem tudo junto). */
function Field({ id, label, hint, error, suffix, children }: FieldProps) {
  const hintId = hint ? `${id}-dica` : undefined
  const errorId = error ? `${id}-erro` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          'flex items-baseline gap-2 border-b focus-within:border-grafite',
          error ? 'border-b-2 border-grafite' : 'border-linha-escura',
        )}
      >
        {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
        {suffix && (
          <span aria-hidden="true" className="text-caption text-texto-suave">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-caption text-texto-suave">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption font-medium text-grafite">
          {error}
        </p>
      )}
    </div>
  )
}
