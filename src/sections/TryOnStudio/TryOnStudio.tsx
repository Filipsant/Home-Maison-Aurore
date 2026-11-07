import { useRef, useState } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { autoReveal } from '@/animations/presets'
import { AiResultFrame } from '@/components/shared/AiResultFrame'
import { Container } from '@/components/shared/Container'
import { ImageInput } from '@/components/shared/ImageInput'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { TextLink } from '@/components/shared/TextLink'
import { Button } from '@/components/ui/button'
import { aiMessages, tryOnLoadingMessage } from '@/data/aiMessages'
import { tryOnPage } from '@/data/tryOnPage'
import { useAiRequest } from '@/hooks/useAiRequest'
import { apiUrl, tryOn, type TryOnRequest } from '@/lib/ai/client'
import { resizeImage } from '@/lib/ai/resizeImage'

/** Peça vinda do ateliê digital pela URL (?peca=<id>&descricao=...). */
function pieceFromUrl(): { id: string; description: string } | null {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('peca')
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null
  return { id, description: (params.get('descricao') ?? '').slice(0, 120) }
}

/** Reduz as fotos no navegador e chama o provador. */
async function sendTryOn(request: TryOnRequest, signal: AbortSignal) {
  const person = await resizeImage(request.person)
  const garment = request.garment ? await resizeImage(request.garment) : undefined
  return tryOn({ ...request, person, garment }, signal)
}

/** Tela "Provador virtual": foto da pessoa + foto da peça (ou peça criada no ateliê). */
export function TryOnStudio() {
  const ref = useRef<HTMLElement>(null)
  const [person, setPerson] = useState<File | null>(null)
  const [garment, setGarment] = useState<File | null>(null)
  const [atelierPiece, setAtelierPiece] = useState(pieceFromUrl)
  const [missing, setMissing] = useState(false)
  const { state, run } = useAiRequest(sendTryOn)

  useSectionAnimation(ref, (root, { reduced }) => {
    autoReveal(root, { reduced })
  })

  const submit = () => {
    if (!person || (!garment && !atelierPiece)) {
      setMissing(true)
      return
    }
    setMissing(false)
    void run({
      person,
      garment: atelierPiece ? undefined : (garment ?? undefined),
      pieceId: atelierPiece?.id,
      description: atelierPiece?.description,
    })
  }

  return (
    <section ref={ref} aria-labelledby="provador-title" className="pt-header">
      <Container className="grid gap-12 pt-section pb-section md:grid-cols-12 md:gap-8">
        <div className="flex flex-col gap-10 md:col-span-6">
          <div className="flex flex-col gap-5">
            <SectionHeading id="provador-title" level={1} size="l">
              {tryOnPage.title}
            </SectionHeading>
            <p data-reveal="lines" className="max-w-140 text-lead">
              {tryOnPage.lead}
            </p>
            <p className="text-caption text-texto-suave">{tryOnPage.privacy}</p>
          </div>

          <form
            noValidate
            className="flex flex-col gap-8"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <ImageInput
                id="foto-pessoa"
                label={tryOnPage.person.label}
                hint={tryOnPage.person.hint}
                file={person}
                onFile={setPerson}
                invalidMessage={tryOnPage.invalidFile}
                error={missing && !person ? tryOnPage.missing : undefined}
              />

              {atelierPiece ? (
                <div className="flex flex-col gap-2">
                  <div className="relative aspect-3/4 overflow-hidden bg-musselina">
                    <img
                      src={apiUrl(`/api/imagens/${atelierPiece.id}`)}
                      alt={tryOnPage.garment.fromAtelier}
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>
                  <p className="text-caption text-texto-suave">{tryOnPage.garment.fromAtelier}</p>
                  <button
                    type="button"
                    onClick={() => setAtelierPiece(null)}
                    className="inline-flex min-h-11 items-center self-start text-caption text-grafite underline underline-offset-4"
                  >
                    {tryOnPage.garment.change}
                  </button>
                </div>
              ) : (
                <ImageInput
                  id="foto-peca"
                  label={tryOnPage.garment.label}
                  hint={tryOnPage.garment.hint}
                  file={garment}
                  onFile={setGarment}
                  invalidMessage={tryOnPage.invalidFile}
                  error={missing && !garment ? tryOnPage.missing : undefined}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Button type="submit" variant="dark" disabled={state.phase === 'loading'}>
                {tryOnPage.submit}
              </Button>
              {!atelierPiece && (
                <TextLink href={tryOnPage.createLink.href}>{tryOnPage.createLink.label}</TextLink>
              )}
            </div>
          </form>
        </div>

        <div className="md:sticky md:top-header md:col-span-5 md:col-start-8 md:self-start md:pt-8">
          <AiResultFrame
            state={state}
            emptyText={tryOnPage.empty}
            cachedText={aiMessages.cached.provador}
            loadingText={tryOnLoadingMessage}
            waitNote={tryOnPage.wait}
            alt={tryOnPage.resultAlt}
            actions={
              state.phase === 'done' && state.result.status === 'fallback' ? (
                <Button variant="outline" onClick={submit}>
                  {tryOnPage.retry}
                </Button>
              ) : undefined
            }
          />
        </div>
      </Container>
    </section>
  )
}
