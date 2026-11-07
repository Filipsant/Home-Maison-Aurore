import { useRef } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { Container } from '@/components/shared/Container'
import { TextLink } from '@/components/shared/TextLink'
import { VideoTeaser } from '@/components/shared/VideoTeaser'
import { videoFeatures } from '@/data/videoFeatures'
import { cn } from '@/lib/utils'
import { videoFeaturesReveal } from './videoFeatures.animation'

/** Segundo bloco desce, no mesmo ritmo das Novidades. */
const blockOffset = ['', 'md:pt-40'] as const

/** 6. Dois blocos de vídeo (Sigma): o ateliê e a cápsula Terre. */
export function VideoFeatures() {
  const ref = useRef<HTMLElement>(null)
  useSectionAnimation(ref, (root, { reduced }) => {
    videoFeaturesReveal(root, { reduced })
  })
  return (
    <section
      ref={ref}
      id="atelie"
      aria-labelledby="videos-title"
      className="relative z-10 bg-nevoa pt-section-l pb-section-l"
    >
      <h2 id="videos-title" className="sr-only">
        {videoFeatures.title}
      </h2>
      <Container className="grid gap-16 md:grid-cols-2 md:gap-8">
        {videoFeatures.items.map((feature, i) => (
          <article key={feature.id} className={cn('flex flex-col gap-5', blockOffset[i])}>
            <VideoTeaser media={feature.media} data-reveal="photo" />
            <div className="flex flex-col gap-2">
              <h3 data-reveal="lines" className="font-display text-display-s">
                {feature.title}
              </h3>
              <TextLink href={feature.link.href} data-reveal="rise" className="self-start">
                {feature.link.label}
              </TextLink>
            </div>
          </article>
        ))}
      </Container>
    </section>
  )
}
