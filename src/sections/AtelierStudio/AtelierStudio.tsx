import { useRef, useState } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { autoReveal } from '@/animations/presets'
import { AiResultFrame } from '@/components/shared/AiResultFrame'
import { Container } from '@/components/shared/Container'
import { OptionGroup } from '@/components/shared/OptionGroup'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { aiMessages } from '@/data/aiMessages'
import { atelierOptions, MAX_DETALHES } from '@/data/atelierOptions'
import { atelierPage } from '@/data/atelierPage'
import { useAiRequest } from '@/hooks/useAiRequest'
import { generatePiece } from '@/lib/ai/client'
import { altForPiece, describePiece } from '@/lib/ai/describe'
import type { PieceRequest } from '@/types/ai'

type SingleField = 'peca' | 'tecido' | 'cor' | 'silhueta' | 'colecao'

const INITIAL: PieceRequest = {
  peca: 'vestido',
  tecido: 'organza',
  cor: 'marfim',
  silhueta: 'sereia',
  detalhes: ['bordado'],
  colecao: 'lumiere',
}

/** Máximo de versões para os mesmos campos (igual ao Worker). */
const MAX_VARIANTE = 9

/** Tela "Criar peça": formulário do ateliê digital + resultado da IA. */
export function AtelierStudio() {
  const ref = useRef<HTMLElement>(null)
  const [piece, setPiece] = useState<PieceRequest>(INITIAL)
  const [variante, setVariante] = useState(0)
  // Peça que gerou o resultado atual (o formulário pode mudar depois).
  const [generated, setGenerated] = useState<PieceRequest | null>(null)
  const { state, run } = useAiRequest(generatePiece)

  useSectionAnimation(ref, (root, { reduced }) => {
    autoReveal(root, { reduced })
  })

  const setSingle = (field: SingleField) => (id: string) => setPiece((p) => ({ ...p, [field]: id }))
  const toggleDetalhe = (id: string) =>
    setPiece((p) => ({
      ...p,
      detalhes: p.detalhes.includes(id) ? p.detalhes.filter((d) => d !== id) : [...p.detalhes, id],
    }))

  const create = (next: number) => {
    setVariante(next)
    setGenerated(piece)
    void run({ ...piece, variante: next })
  }

  const result = state.phase === 'done' ? state.result : null
  const tryOnHref =
    result?.status === 'ok' && generated
      ? `/provador?peca=${result.id}&descricao=${encodeURIComponent(describePiece(generated))}`
      : null

  return (
    <section ref={ref} aria-labelledby="atelie-title" className="pt-header">
      <Container className="grid gap-12 pt-section pb-section md:grid-cols-12 md:gap-8">
        <div className="flex flex-col gap-10 md:col-span-6">
          <div className="flex flex-col gap-5">
            <SectionHeading id="atelie-title" level={1} size="l">
              {atelierPage.title}
            </SectionHeading>
            <p data-reveal="lines" className="max-w-140 text-lead">
              {atelierPage.lead}
            </p>
            <p className="text-caption text-texto-suave">{atelierPage.note}</p>
          </div>

          <form
            className="flex flex-col gap-8"
            onSubmit={(event) => {
              event.preventDefault()
              create(0)
            }}
          >
            {(['peca', 'tecido', 'cor', 'silhueta', 'colecao'] as const).map((field) => (
              <OptionGroup
                key={field}
                legend={atelierPage.fields[field]}
                name={field}
                options={atelierOptions[field]}
                selected={[piece[field]]}
                onToggle={setSingle(field)}
              />
            ))}
            <OptionGroup
              legend={atelierPage.fields.detalhes}
              name="detalhes"
              options={atelierOptions.detalhes}
              selected={piece.detalhes}
              multiple
              max={MAX_DETALHES}
              onToggle={toggleDetalhe}
            />
            <div>
              <Button type="submit" variant="dark" disabled={state.phase === 'loading'}>
                {atelierPage.submit}
              </Button>
            </div>
          </form>
        </div>

        <div className="md:sticky md:top-header md:col-span-5 md:col-start-8 md:self-start md:pt-8">
          <AiResultFrame
            state={state}
            emptyText={atelierPage.empty}
            cachedText={aiMessages.cached.peca}
            loadingText={() => aiMessages.loading.peca}
            alt={generated ? `${atelierPage.resultAlt}: ${altForPiece(generated)}` : atelierPage.resultAlt}
            actions={
              result?.status === 'ok' ? (
                <>
                  <Button variant="outline" onClick={() => create((variante + 1) % (MAX_VARIANTE + 1))}>
                    {atelierPage.again}
                  </Button>
                  {tryOnHref && (
                    <Button asChild variant="dark">
                      <a href={tryOnHref}>{atelierPage.tryOn}</a>
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="outline" onClick={() => create(variante)}>
                  {atelierPage.retry}
                </Button>
              )
            }
          />
        </div>
      </Container>
    </section>
  )
}
