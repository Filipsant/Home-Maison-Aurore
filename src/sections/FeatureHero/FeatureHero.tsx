import { useRef } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { releaseIntro } from '@/animations/intro'
import { autoReveal } from '@/animations/presets'
import { Container } from '@/components/shared/Container'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { hero } from '@/data/hero'
import { heroIntro, heroPin } from './featureHero.animation'
import { HeroMedia } from './HeroMedia'

/**
 * 1. Destaque principal (Sigma) — coleção Lumière.
 * A mídia fica presa enquanto `data-hero-body` sobe por cima (decisão 2 do estudo).
 */
export function FeatureHero() {
  const ref = useRef<HTMLElement>(null)

  useSectionAnimation(ref, (root, { reduced }) => {
    heroIntro(root, { reduced })
    releaseIntro()
    heroPin(root, { reduced })
    const body = root.querySelector<HTMLElement>('[data-hero-body]')
    if (body) autoReveal(body, { reduced })
  })

  return (
    <section ref={ref} id="colecao" aria-labelledby="hero-title" className="pt-header">
      <div data-hero-stage="">
        <Container className="flex flex-col gap-7 pt-6">
          <div className="flex items-end justify-between gap-6">
            <SectionHeading
              id="hero-title"
              level={1}
              size="xl"
              data-hero-title=""
              data-intro=""
              data-reveal="intro"
            >
              {hero.title}
            </SectionHeading>
            {/* Indicador de scroll (decisão 5): linha fina com o balanço do Floema (E04) */}
            <span
              aria-hidden="true"
              className="mb-4 hidden h-16 w-px animate-bob bg-grafite motion-reduce:animate-none md:block"
            />
          </div>
          <HeroMedia toile={hero.toile} finalPiece={hero.finalPiece} />
        </Container>
      </div>

      <div data-hero-body="" className="relative z-10 bg-nevoa">
        <Container className="grid gap-8 pt-10 pb-section md:grid-cols-12">
          <p data-reveal="lines" className="max-w-80 text-caption text-texto-suave md:col-span-4">
            {hero.support}
          </p>
          <div className="flex flex-col gap-7 md:col-span-5 md:col-start-8">
            <p data-reveal="lines" className="text-lead text-grafite">
              {hero.paragraphs[0]}
            </p>
            <p data-reveal="lines" className="text-body-l text-texto-corpo">
              {hero.paragraphs[1]}
            </p>
            <div data-reveal="rise">
              <Button asChild variant="dark">
                <a href={hero.cta.href}>{hero.cta.label}</a>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}
