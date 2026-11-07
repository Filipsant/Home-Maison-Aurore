import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Media } from '@/types/content'
import { captionToneVariants, curtainVariants, photoToneVariants } from './photo.variants'

interface PhotoProps extends React.HTMLAttributes<HTMLElement> {
  media: Media
  /** Zoom lento no hover (E33: escala 1,02 em 3,4s). Só a partir de 760px e com mouse. */
  zoomOnHover?: boolean
  /** Prioridade de carregamento para imagens acima da dobra. */
  priority?: boolean
  /** Esconde a legenda do placeholder (quando o texto já aparece fora da foto). */
  hideCaption?: boolean
  /** Conteúdo extra sobre a mídia (vídeo, desenhos). */
  children?: React.ReactNode
}

/**
 * Foto com placeholder em tom da maison.
 *
 * Camadas usadas pelas animações (atributos `data-*`), de baixo para cima:
 * - `data-curtain`: bloco de cor que abre antes da imagem;
 * - `data-media`: a mídia em si (recebe a máscara);
 * - `data-parallax`: camada interna que pode se deslocar com o scroll.
 *
 * Para trocar o placeholder por uma foto real, preencha `src` e `alt` no arquivo de `src/data/`.
 */
export const Photo = React.forwardRef<HTMLElement, PhotoProps>(
  (
    {
      media,
      zoomOnHover = false,
      priority = false,
      hideCaption = false,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const label = media.alt ?? media.caption
    return (
      <figure
        ref={ref}
        data-photo=""
        className={cn('relative isolate overflow-hidden', className)}
        style={{ aspectRatio: media.aspect, ...style }}
        {...props}
      >
        <span
          data-curtain=""
          aria-hidden="true"
          className={cn('absolute inset-0', curtainVariants({ tone: media.tone }))}
        />
        <div data-media="" className="absolute inset-0 overflow-hidden">
          <div data-parallax="" className="absolute inset-0">
            <div
              className={cn(
                'relative size-full',
                photoToneVariants({ tone: media.tone }),
                zoomOnHover &&
                  'transition-transform duration-3400 ease-out-expo md:pointer-fine:group-hover:scale-102',
              )}
            >
              {media.src ? (
                <img
                  src={media.src}
                  alt={label}
                  loading={priority ? 'eager' : 'lazy'}
                  decoding="async"
                  className="size-full object-cover"
                />
              ) : (
                <div role="img" aria-label={label} className="size-full" />
              )}
              {children}
            </div>
          </div>
          {!media.src && !hideCaption && (
            <figcaption
              aria-hidden="true"
              className={cn(
                'absolute bottom-4 left-4 text-caption',
                captionToneVariants({ tone: media.tone }),
              )}
            >
              {media.caption}
            </figcaption>
          )}
        </div>
      </figure>
    )
  },
)
Photo.displayName = 'Photo'
