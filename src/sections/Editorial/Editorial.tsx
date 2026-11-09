import { useRef } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { Container } from '@/components/shared/Container'
import { Photo } from '@/components/shared/Photo'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { TextLink } from '@/components/shared/TextLink'
import { editorial } from '@/data/editorial'
import { cn } from '@/lib/utils'
import { editorialReveal } from './editorial.animation'

/** Deslocamento vertical de cada coluna, como no Figma (0, 96px e 48px). */
const columnOffset = ['md:pt-0', 'md:pt-24', 'md:pt-12'] as const

/** 4. "Vestido por" (Sigma "Captured with"): três histórias fotografadas. */
export function Editorial() {
  const ref = useRef<HTMLElement>(null)
  useSectionAnimation(ref, (root, { reduced }) => {
    editorialReveal(root, { reduced })
  })
  return (
    <section
      ref={ref}
      id="editorial"
      aria-labelledby="editorial-title"
      className="relative z-10 bg-nevoa pb-section-l"
    >
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading id="editorial-title">{editorial.title}</SectionHeading>
          <TextLink href={editorial.link.href} className="self-start md:self-auto">
            {editorial.link.label}
          </TextLink>
        </div>
        <ul data-cascade="" className="mt-12 grid gap-14 md:grid-cols-3 md:gap-6">
          {editorial.stories.map((story, i) => (
            <li key={story.id} data-cascade-item="" className={cn(columnOffset[i])}>
              <a href={story.href} className="group flex flex-col gap-3.5">
                <Photo media={story.media} zoomOnHover data-reveal="photo" />
                <h3 className="text-card-title font-medium">{story.title}</h3>
                <p className="text-caption text-texto-suave">{story.credit}</p>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
