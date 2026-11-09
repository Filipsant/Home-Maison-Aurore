import { useRef } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { Container } from '@/components/shared/Container'
import { Photo } from '@/components/shared/Photo'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { artProject } from '@/data/artProject'
import { artProjectReveal } from './artProject.animation'

/** 5. Projeto de arte (Sigma "Art project"): bloco em tela cheia sobre veludo. */
export function ArtProject() {
  const ref = useRef<HTMLElement>(null)
  useSectionAnimation(ref, (root, { reduced }) => {
    artProjectReveal(root, { reduced })
  })
  return (
    <section
      ref={ref}
      id="arquivo"
      aria-labelledby="arquivo-title"
      data-surface="dark"
      data-header-theme="dark"
      className="relative isolate z-10 flex min-h-svh flex-col overflow-hidden bg-veludo-2 text-nevoa"
    >
      <Photo
        media={artProject.media}
        hideCaption
        data-art-media=""
        className="absolute inset-0 -z-10"
        style={{ aspectRatio: 'auto' }}
      />
      {/* Véu de veludo sobre a foto: o texto claro continua legível sobre gravuras claras. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-veludo-2/25" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-veludo-2/90 via-veludo-2/30 to-transparent"
      />
      <p aria-hidden="true" className="absolute top-24 right-gutter text-caption text-texto-suave-escuro">
        {artProject.media.caption}
      </p>

      <Container data-art-content="" className="mt-auto pt-section pb-22">
        <span
          data-line=""
          aria-hidden="true"
          className="mb-10 block h-px w-full origin-left bg-linha-escura"
        />
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <SectionHeading id="arquivo-title" size="art" tone="light" className="md:col-span-7">
            {artProject.title}
          </SectionHeading>
          <div className="flex flex-col gap-6 md:col-span-4 md:col-start-9">
            <p data-reveal="lines" className="max-w-115 text-body-l text-texto-sobre-escuro">
              {artProject.text}
            </p>
            <div data-reveal="rise">
              <Button asChild variant="light">
                <a href={artProject.cta.href}>{artProject.cta.label}</a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
