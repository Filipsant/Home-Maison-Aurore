import { useRef } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { Container } from '@/components/shared/Container'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { newArrivals } from '@/data/newArrivals'
import { ArrivalCard } from './ArrivalCard'
import { newArrivalsReveal } from './newArrivals.animation'

/** 2. Novidades (Sigma "New products"): dois cards grandes em colunas desencontradas. */
export function NewArrivals() {
  const ref = useRef<HTMLElement>(null)
  useSectionAnimation(ref, (root, { reduced }) => {
    newArrivalsReveal(root, { reduced })
  })
  const [first, second] = newArrivals.items
  return (
    <section
      ref={ref}
      id="novidades"
      aria-labelledby="novidades-title"
      className="relative z-10 bg-nevoa py-section-l"
    >
      <Container className="grid gap-16 md:grid-cols-2 md:gap-8">
        <div className="flex flex-col gap-6">
          <SectionHeading id="novidades-title">{newArrivals.title}</SectionHeading>
          <ArrivalCard piece={first} className="md:pt-10" />
        </div>
        <ArrivalCard piece={second} className="md:pt-55" />
      </Container>
    </section>
  )
}
