import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion, useSectionAnimation } from '@/animations/hooks'
import { autoReveal } from '@/animations/presets'
import { Container } from '@/components/shared/Container'
import { ImageInput } from '@/components/shared/ImageInput'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { TextLink } from '@/components/shared/TextLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { measurements } from '@/data/measurements'
import { provadorPage } from '@/data/provadorPage'
import { apiUrl } from '@/lib/ai/client'
import { altForPiece, pieceSummary } from '@/lib/ai/describe'
import { resizeImage } from '@/lib/ai/resizeImage'
import { requestFitting } from '@/lib/api/fitting'
import { fetchPiece, sendOrder, type PieceLookup } from '@/lib/api/orders'
import { isPieceId, ORDER_LIMITS, parseMeasure, validateOrder } from '@/lib/orders/validate'
import { cn } from '@/lib/utils'
import type { PieceRequest } from '@/types/ai'
import type { AtelierLinha } from '@/types/content'
import type { OrderContact, OrderErrors } from '@/types/order'
import { PROVA_VISTAS, type ProvaResult, type ProvaVista } from '@/types/prova'

const { photos: photoText, measures: measuresText, contact: contactText, errors: errorText } = provadorPage

/** Id do campo na tela a partir da chave do erro. */
const fieldId = (key: string) => {
  if (key.startsWith('medidas.')) return `medida-${key.slice(8)}`
  if (key.startsWith('foto-') || key.startsWith('correcao-')) return key
  return `contato-${key}`
}

/** Tela "Provador virtual": fotos do corpo + peça do ateliê digital → prova com IA, correções e pedido. */
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

interface Version {
  id: string
  imageUrl: string
  correcao?: string
}

interface ViewState {
  versions: Version[]
  current: number
  loading: boolean
  message?: string
}

const emptyView: ViewState = { versions: [], current: 0, loading: false }
const emptyViews = (): Record<ProvaVista, ViewState> => ({
  frente: emptyView,
  costas: emptyView,
  lado: emptyView,
})

type SendState =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'error'; message: string }
  | { phase: 'done'; codigo: string }

function Fitting({ id, piece, imageUrl }: { id: string; piece: PieceRequest; imageUrl: string }) {
  const linha: AtelierLinha = piece.linha === 'masculina' ? 'masculina' : 'feminina'
  const fields = measurements[linha]
  const reduced = useReducedMotion()

  const [photos, setPhotos] = useState<Record<ProvaVista, File | null>>({
    frente: null,
    costas: null,
    lado: null,
  })
  const [photosConsent, setPhotosConsent] = useState(false)
  const [measures, setMeasures] = useState<Record<string, string>>({})
  const [views, setViews] = useState(emptyViews)
  const [tab, setTab] = useState<ProvaVista>('frente')
  const [corrections, setCorrections] = useState<Record<ProvaVista, string>>({
    frente: '',
    costas: '',
    lado: '',
  })
  const [variante, setVariante] = useState(0)

  const [contact, setContact] = useState<OrderContact>({ nome: '', email: '', telefone: '', observacoes: '' })
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<OrderErrors>({})
  const [send, setSend] = useState<SendState>({ phase: 'idle' })
  const trap = useRef<HTMLInputElement>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (send.phase === 'done') doneRef.current?.focus()
  }, [send.phase])

  const updateView = (vista: ProvaVista, change: (view: ViewState) => ViewState) =>
    setViews((all) => ({ ...all, [vista]: change(all[vista]) }))

  /** Resultado da IA na vista: prova nova recomeça o histórico; correção acrescenta uma versão. */
  const apply = (vista: ProvaVista, result: ProvaResult, mode: 'nova' | 'correcao', correcao?: string) =>
    updateView(vista, (view) => {
      if (result.status !== 'ok') {
        return { ...view, loading: false, message: provadorPage.fittingErrors[result.motivo] }
      }
      const version: Version = { id: result.id, imageUrl: result.imageUrl, correcao }
      const versions = mode === 'nova' ? [version] : [...view.versions.slice(0, view.current + 1), version]
      return { versions, current: versions.length - 1, loading: false }
    })

  const focusFirst = (found: OrderErrors, order: string[]) => {
    const first = order.find((key) => found[key])
    if (first) document.getElementById(fieldId(first))?.focus()
  }

  /** Medidas digitadas: as válidas vão para a IA; as preenchidas fora do limite viram erro. */
  const checkMeasures = (required: boolean) => {
    const valid: Record<string, number> = {}
    const found: OrderErrors = {}
    for (const field of fields) {
      const raw = measures[field.id] ?? ''
      if (!raw.trim()) {
        if (required) found[`medidas.${field.id}`] = errorText.required
        continue
      }
      const value = parseMeasure(raw)
      if (value === null || value < field.min || value > field.max) {
        found[`medidas.${field.id}`] = errorText.range(field.min, field.max)
      } else valid[field.id] = value
    }
    return { valid, found }
  }

  const generate = async (next: number) => {
    const { valid, found } = checkMeasures(false)
    if (!photos.frente) found['foto-frente'] = errorText.fotoFrente
    if (!photosConsent) found['foto-consentimento'] = errorText.fotosConsentimento
    setErrors(found)
    if (Object.keys(found).length) {
      focusFirst(found, ['foto-frente', 'foto-consentimento', ...fields.map((f) => `medidas.${f.id}`)])
      return
    }

    setVariante(next)
    setTab('frente')
    const chosen = PROVA_VISTAS.filter((vista) => photos[vista])
    for (const vista of chosen) updateView(vista, (view) => ({ ...view, loading: true, message: undefined }))
    // No celular o resultado fica abaixo do formulário: traz para a tela.
    if (resultsRef.current && resultsRef.current.getBoundingClientRect().top > window.innerHeight * 0.5) {
      resultsRef.current.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    }

    await Promise.all(
      chosen.map(async (vista) => {
        const file = photos[vista]
        if (!file) return
        const foto = await resizeImage(file)
        const result = await requestFitting({ pecaId: id, vista, foto, medidas: valid, variante: next })
        apply(vista, result, 'nova')
      }),
    )
  }

  const correct = async (vista: ProvaVista) => {
    const view = views[vista]
    const base = view.versions[view.current]
    const text = corrections[vista].trim()
    if (!base) return
    if (!text) {
      setErrors((e) => ({ ...e, [`correcao-${vista}`]: errorText.correcaoVazia }))
      document.getElementById(`correcao-${vista}`)?.focus()
      return
    }
    setErrors((e) => ({ ...e, [`correcao-${vista}`]: undefined }))
    updateView(vista, (v) => ({ ...v, loading: true, message: undefined }))
    const result = await requestFitting({ pecaId: id, vista, baseId: base.id, correcao: text })
    apply(vista, result, 'correcao', text)
    if (result.status === 'ok') setCorrections((c) => ({ ...c, [vista]: '' }))
  }

  const showOrderErrors = (found: OrderErrors) => {
    setErrors(found)
    setSend({ phase: 'error', message: found.provas ?? errorText.summary })
    focusFirst(found, [
      ...fields.map((f) => `medidas.${f.id}`),
      'nome',
      'email',
      'telefone',
      'observacoes',
      'consentimento',
    ])
  }

  const submit = async () => {
    const provas = PROVA_VISTAS.map((vista) => views[vista].versions[views[vista].current]?.id).filter(
      (p): p is string => Boolean(p),
    )
    const body = { pecaId: id, medidas: measures, ...contact, consentimento: consent, provas }
    const validation = validateOrder(body, linha)
    if (!validation.ok) {
      showOrderErrors(validation.errors)
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
    else if (result.motivo === 'invalido') showOrderErrors(result.erros ?? {})
    else setSend({ phase: 'error', message: errorText[result.motivo] })
  }

  const anyLoading = PROVA_VISTAS.some((vista) => views[vista].loading)
  const hasResult = PROVA_VISTAS.some((vista) => views[vista].versions.length > 0)

  return (
    <div className="flex flex-col gap-16">
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="flex flex-col gap-12 md:col-span-6">
          <PieceCard id={id} piece={piece} imageUrl={imageUrl} />

          <fieldset className="flex flex-col gap-5">
            <legend className="mb-2 font-display text-display-card leading-none">{photoText.title}</legend>
            <p className="text-caption text-texto-suave">{photoText.note}</p>
            <div className="grid grid-cols-3 gap-3">
              {PROVA_VISTAS.map((vista) => (
                <ImageInput
                  key={vista}
                  id={`foto-${vista}`}
                  label={photoText.views[vista].label}
                  hint={photoText.views[vista].hint}
                  file={photos[vista]}
                  onFile={(file) => setPhotos((p) => ({ ...p, [vista]: file }))}
                  invalidMessage={photoText.invalidFile}
                  error={errors[`foto-${vista}`]}
                />
              ))}
            </div>
            <p className="text-caption text-texto-suave">{photoText.privacy}</p>
            <Checkbox
              id="foto-consentimento"
              checked={photosConsent}
              onChange={setPhotosConsent}
              label={photoText.consent}
              error={errors['foto-consentimento']}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-6">
            <legend className="mb-2 font-display text-display-card leading-none">{measuresText.title}</legend>
            <p className="text-caption text-texto-suave">{measuresText.note}</p>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {fields.map((field) => (
                <Field
                  key={field.id}
                  id={`medida-${field.id}`}
                  label={field.label}
                  hint={field.hint}
                  error={errors[`medidas.${field.id}`]}
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

          <div className="flex flex-wrap gap-3">
            <Button variant="dark" disabled={anyLoading} onClick={() => void generate(0)}>
              {provadorPage.generate.submit}
            </Button>
            {hasResult && (
              <Button
                variant="outline"
                disabled={anyLoading}
                onClick={() => void generate((variante + 1) % 10)}
              >
                {provadorPage.generate.again}
              </Button>
            )}
          </div>
        </div>

        <div
          ref={resultsRef}
          className="scroll-mt-header md:sticky md:top-header md:col-span-6 md:self-start md:pt-2 lg:col-span-5 lg:col-start-8"
        >
          <Results
            views={views}
            photos={photos}
            tab={tab}
            onTab={setTab}
            corrections={corrections}
            onCorrection={(vista, text) => setCorrections((c) => ({ ...c, [vista]: text }))}
            onCorrect={(vista) => void correct(vista)}
            onVersion={(vista, step) =>
              updateView(vista, (v) => ({
                ...v,
                current: Math.min(v.versions.length - 1, Math.max(0, v.current + step)),
              }))
            }
            errors={errors}
          />
        </div>
      </div>

      {send.phase === 'done' ? (
        <div className="flex max-w-160 flex-col gap-4 border-t border-linha pt-8">
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
          className="flex max-w-200 flex-col gap-8 border-t border-linha pt-12"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-display-card leading-none">{contactText.title}</h2>
            <p className="text-caption text-texto-suave">{contactText.note}</p>
          </div>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Field id="contato-nome" label={contactText.nome} error={errors.nome}>
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
            <Field id="contato-email" label={contactText.email} error={errors.email}>
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
            <Field id="contato-telefone" label={contactText.telefone} error={errors.telefone}>
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
            error={errors.observacoes}
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
          <Checkbox
            id="contato-consentimento"
            checked={consent}
            onChange={setConsent}
            label={contactText.consentimento}
            error={errors.consentimento}
          />

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
  )
}

interface ResultsProps {
  views: Record<ProvaVista, ViewState>
  photos: Record<ProvaVista, File | null>
  tab: ProvaVista
  onTab: (vista: ProvaVista) => void
  corrections: Record<ProvaVista, string>
  onCorrection: (vista: ProvaVista, text: string) => void
  onCorrect: (vista: ProvaVista) => void
  onVersion: (vista: ProvaVista, step: number) => void
  errors: OrderErrors
}

/** Abas Frente / Costas / Lado: a prova de cada vista, as versões e a correção. */
function Results({
  views,
  photos,
  tab,
  onTab,
  corrections,
  onCorrection,
  onCorrect,
  onVersion,
  errors,
}: ResultsProps) {
  const { generate, correction } = provadorPage
  // Mostra a aba de uma vista se ela tem foto ou prova (frente sempre).
  const visible = PROVA_VISTAS.filter((v) => v === 'frente' || photos[v] || views[v].versions.length)
  const view = views[tab]
  const version = view.versions[view.current]
  const label = photoText.views[tab].label

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label={photoText.title} className="flex gap-2">
        {visible.map((vista) => (
          <button
            key={vista}
            id={`aba-${vista}`}
            role="tab"
            type="button"
            aria-selected={tab === vista}
            aria-controls="prova-painel"
            tabIndex={tab === vista ? 0 : -1}
            onClick={() => onTab(vista)}
            onKeyDown={(event) => {
              const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
              if (!step) return
              const next = visible[(visible.indexOf(vista) + step + visible.length) % visible.length]
              if (next) {
                onTab(next)
                document.getElementById(`aba-${next}`)?.focus()
              }
            }}
            className={cn(
              'inline-flex min-h-11 items-center rounded-pill border border-grafite px-5 text-button transition-colors duration-500 ease-out-expo',
              'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus-ring)',
              tab === vista ? 'bg-grafite text-nevoa' : 'text-grafite hover:bg-musselina',
            )}
          >
            {photoText.views[vista].label}
          </button>
        ))}
      </div>

      <div id="prova-painel" role="tabpanel" aria-labelledby={`aba-${tab}`} className="flex flex-col gap-4">
        {/* No desktop, a altura fica em até 64% da tela: imagem e correção cabem juntas. */}
        <div className="relative mx-auto flex aspect-3/4 w-full items-center justify-center overflow-hidden bg-musselina md:max-w-[48vh]">
          {version && (
            <img
              src={apiUrl(version.imageUrl)}
              alt={generate.resultAlt(label.toLowerCase())}
              className={cn('absolute inset-0 size-full object-cover', view.loading && 'opacity-40')}
            />
          )}
          {(!version || view.loading) && (
            <p className="relative max-w-60 p-6 text-center text-caption text-grafite">
              {view.loading ? generate.loading : generate.empty}
            </p>
          )}
        </div>

        <p role="status" aria-live="polite" className="min-h-6 text-caption font-medium text-grafite">
          {view.message ?? (view.loading ? generate.loading : '')}
        </p>

        {view.versions.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 text-caption text-texto-suave">
              <span>{correction.version(view.current + 1, view.versions.length)}</span>
              {view.current > 0 && (
                <button
                  type="button"
                  onClick={() => onVersion(tab, -1)}
                  className="inline-flex min-h-11 items-center text-grafite underline underline-offset-4"
                >
                  {correction.undo}
                </button>
              )}
              {version?.correcao && <span className="w-full">{correction.applied(version.correcao)}</span>}
            </div>

            <Field
              id={`correcao-${tab}`}
              label={correction.label}
              hint={correction.hint}
              error={errors[`correcao-${tab}`]}
            >
              {(props) => (
                <textarea
                  {...props}
                  rows={2}
                  maxLength={300}
                  value={corrections[tab]}
                  onChange={(e) => onCorrection(tab, e.target.value)}
                  className="min-h-16 w-full resize-y border-0 bg-transparent py-2 font-sans text-field text-foreground outline-none"
                />
              )}
            </Field>
            <div>
              <Button variant="outline" disabled={view.loading} onClick={() => onCorrect(tab)}>
                {correction.submit}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PieceCard({ id, piece, imageUrl }: { id: string; piece: PieceRequest; imageUrl: string }) {
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
        <div className="flex flex-wrap gap-x-6">
          <TextLink href={`/atelie-digital?peca=${id}`}>{provadorPage.piece.adjust}</TextLink>
          <TextLink href={provadorPage.piece.change.href}>{provadorPage.piece.change.label}</TextLink>
        </div>
      </div>
    </div>
  )
}

function Checkbox({
  id,
  checked,
  onChange,
  label,
  error,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  error?: string
}) {
  const errorId = `${id}-erro`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-caption">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 size-5 shrink-0 accent-grafite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={errorId} className="text-caption font-medium text-grafite">
          {error}
        </p>
      )}
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
