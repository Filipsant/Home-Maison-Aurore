import { useReducedMotion } from '@/animations/hooks'
import { hover, media } from '@/animations/tokens'
import { Photo } from '@/components/shared/Photo'
import { TextLink } from '@/components/shared/TextLink'
import { useFlipbook } from '@/hooks/useFlipbook'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/content'
import { categoryNameVariants, categoryTextVariants } from './categoryCard.variants'

interface CategoryCardProps {
  category: Category
}

/**
 * Card de categoria (Figma "Card categoria"). No hover, as imagens da galeria se
 * alternam a cada 150ms (folioscópio, E35). Só com mouse, a partir de 760px e sem
 * movimento reduzido.
 */
export function CategoryCard({ category }: CategoryCardProps) {
  const canHover = useMediaQuery(media.hover)
  const reduced = useReducedMotion()
  const flipbook = useFlipbook(category.gallery.length, hover.flipbookIntervalMs, canHover && !reduced)

  const first = category.gallery[0]
  const surface = first?.tone === 'veludo' || first?.tone === 'veludo-2' ? 'dark' : 'light'

  return (
    <article
      data-reveal="rise"
      data-surface={surface === 'dark' ? 'dark' : undefined}
      className="group relative isolate overflow-hidden"
      onPointerEnter={flipbook.start}
      onPointerLeave={flipbook.stop}
    >
      <div aria-hidden="true" className="relative">
        {category.gallery.map((item, i) => (
          <Photo
            key={item.caption}
            media={item}
            hideCaption
            data-flipbook-frame={i}
            className={cn(i > 0 && 'absolute inset-0', i === flipbook.index ? 'visible' : 'invisible')}
          />
        ))}
      </div>
      {/* Degradê no tom do card: o texto continua legível sobre qualquer foto. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t to-transparent',
          surface === 'dark' ? 'from-veludo/90 via-veludo/60' : 'from-nevoa/95 via-nevoa/70',
        )}
      />
      <div className="absolute inset-x-6 bottom-6 flex flex-col gap-2">
        <h3 className={categoryNameVariants({ surface })}>{category.name}</h3>
        <p className={categoryTextVariants({ surface })}>{category.description}</p>
        <TextLink
          href={category.link.href}
          aria-label={`${category.link.label} sobre ${category.name}`}
          className={cn('self-start', surface === 'dark' ? 'text-nevoa' : 'text-grafite')}
        >
          {category.link.label}
        </TextLink>
      </div>
    </article>
  )
}
