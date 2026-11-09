import { Photo } from '@/components/shared/Photo'
import { TextLink } from '@/components/shared/TextLink'
import { cn } from '@/lib/utils'
import type { Piece } from '@/types/content'

interface ArrivalCardProps {
  piece: Piece
  className?: string
}

export function ArrivalCard({ piece, className }: ArrivalCardProps) {
  return (
    <article className={cn('group flex flex-col gap-4', className)}>
      <Photo media={piece.media} zoomOnHover data-reveal="photo" />
      <div data-reveal="rise" className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-card-title font-medium">{piece.name}</h3>
          <p className="text-caption text-texto-suave">{piece.material}</p>
        </div>
        <TextLink
          href={piece.link.href}
          aria-label={`${piece.link.label}: ${piece.name}`}
          className="self-start"
        >
          {piece.link.label}
        </TextLink>
      </div>
    </article>
  )
}
