import { useRef } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { Container } from '@/components/shared/Container'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { TextLink } from '@/components/shared/TextLink'
import { pieces } from '@/data/pieces'
import { PieceRow } from './PieceRow'
import { featuredPiecesReveal } from './featuredPieces.animation'

/** 3. Peças em destaque (Sigma "Featured products"): lista curta com prévia no hover. */
export function FeaturedPieces() {
  const ref = useRef<HTMLElement>(null)
  useSectionAnimation(ref, (root, { reduced }) => {
    featuredPiecesReveal(root, { reduced })
  })
  return (
    <section
      ref={ref}
      id="pecas"
      aria-labelledby="pecas-title"
      className="relative z-10 bg-nevoa pt-section pb-section"
    >
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading id="pecas-title">{pieces.title}</SectionHeading>
          <TextLink href={pieces.link.href} className="self-start md:self-auto">
            {pieces.link.label}
          </TextLink>
        </div>
        <ul data-reveal-group="" className="relative mt-10 border-t border-grafite">
          {pieces.items.map((piece) => (
            <PieceRow key={piece.id} piece={piece} />
          ))}
        </ul>
      </Container>
    </section>
  )
}
