import { useCallback, useRef, useState, type RefObject } from 'react'
import { useReducedMotion } from '@/animations/hooks'
import pecaSrc from '@/assets/hero/peca.svg'
import toileSrc from '@/assets/hero/toile.svg'
import { useVisibleAutoplay } from '@/hooks/useVisibleAutoplay'
import { cn } from '@/lib/utils'
import type { Hero, VideoMedia } from '@/types/content'

interface HeroMediaProps {
  toile: Hero['toile']
  finalPiece: Hero['finalPiece']
  labels: Hero['videoLabels']
}

/**
 * Composição do Figma "Imagem hero (transição toile → peça final)":
 * uma camada por baixo e a peça final revelada por cima, com a linha de giz
 * marcando a borda. A largura revelada vem de `--reveal` (ver globals.css);
 * a animação a leva de 55% a 100% com o scroll.
 * As camadas `data-curtain` e `data-media` seguem o componente `Photo`,
 * para a entrada com cortina de cor (E15).
 *
 * Com `src`/`videoSrc` nos dados, cada camada mostra a foto ou o vídeo real
 * (hoje, duas modelos caminhando ao mesmo tempo); sem eles, os desenhos do Figma.
 * A mídia real acompanha a borda (`data-hero-follow`), para cada pessoa ficar
 * no meio da parte que aparece. Os vídeos tocam mudos, em loop, só quando
 * visíveis; um botão pausa os dois, e com movimento reduzido ficam no poster.
 */
export function HeroMedia({ toile, finalPiece, labels }: HeroMediaProps) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const finalVideoRef = useRef<HTMLVideoElement>(null)
  const toileVideoRef = useRef<HTMLVideoElement>(null)
  const [userPaused, setUserPaused] = useState<boolean | null>(null)
  // Pausado por escolha da pessoa; sem escolha, segue a preferência de movimento.
  const paused = userPaused ?? reduced
  const hasVideo = Boolean(finalPiece.videoSrc || toile.videoSrc)
  const toileReal = Boolean(toile.src || toile.videoSrc)
  const finalReal = Boolean(finalPiece.src || finalPiece.videoSrc)
  const refuse = useCallback(() => setUserPaused(true), [])

  useVisibleAutoplay(finalVideoRef, rootRef, paused, refuse)
  useVisibleAutoplay(toileVideoRef, rootRef, paused, refuse)

  const label = `${finalPiece.alt ?? finalPiece.caption}. ${toile.alt ?? toile.caption}`

  return (
    <div
      ref={rootRef}
      data-hero-media=""
      data-intro=""
      className="relative isolate aspect-4/5 overflow-hidden md:aspect-2/1"
    >
      <span data-curtain="" aria-hidden="true" className="absolute inset-0 bg-lilas" />

      <div data-media="" role="img" aria-label={label} className="absolute inset-0">
        {/* Camada de baixo (no Figma, a toile) */}
        <div className="absolute inset-0 bg-musselina">
          {toileReal ? (
            <LayerMedia media={toile} follow="toile" videoRef={toileVideoRef} />
          ) : (
            <div
              data-hero-figure=""
              className="absolute left-1/2 aspect-square -translate-x-1/2 md:left-[62%]"
            >
              <img src={toileSrc} alt="" aria-hidden="true" className="size-full" />
            </div>
          )}
          <p
            aria-hidden="true"
            className={cn(
              'absolute right-4 bottom-4 w-1/3 text-right text-caption text-grafite md:w-auto',
              toileReal && 'w-auto bg-nevoa/85 px-2 py-1',
            )}
          >
            {toile.caption}
          </p>
        </div>

        {/* Peça final, revelada por cima */}
        <div data-hero-final="" className="absolute inset-0 bg-veludo">
          {finalReal ? (
            <LayerMedia media={finalPiece} follow="final" videoRef={finalVideoRef} />
          ) : (
            <div
              data-hero-figure=""
              className="absolute left-1/2 aspect-square -translate-x-1/2 md:left-[62%]"
            >
              <img
                src={pecaSrc}
                alt=""
                aria-hidden="true"
                className="absolute inset-y-0 left-1/4 h-full w-1/2"
              />
            </div>
          )}
          <p aria-hidden="true" className="absolute bottom-4 left-4 w-2/5 text-caption text-nevoa md:w-auto">
            {finalPiece.caption}
          </p>
        </div>

        {/* Linha de giz */}
        <span
          data-hero-chalk=""
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 -translate-x-px bg-giz"
        />
      </div>

      {hasVideo && (
        <button
          type="button"
          onClick={() => setUserPaused(!paused)}
          aria-pressed={!paused}
          className="absolute top-4 left-4 z-10 min-h-11 rounded-pill bg-nevoa/90 px-4 text-caption text-grafite focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus-ring)"
        >
          {paused ? labels.play : labels.pause}
        </button>
      )}
    </div>
  )
}

interface LayerMediaProps {
  media: VideoMedia
  /** Qual borda a mídia acompanha (ver `[data-hero-follow]` em globals.css). */
  follow: 'final' | 'toile'
  videoRef: RefObject<HTMLVideoElement>
}

/** Vídeo em loop (WebM e MP4, com poster) ou foto real de uma camada do hero. */
function LayerMedia({ media, follow, videoRef }: LayerMediaProps) {
  const className = 'absolute inset-0 size-full object-cover'
  if (!media.videoSrc) {
    return <img src={media.src} alt="" data-hero-follow={follow} className={className} />
  }
  return (
    <video
      ref={videoRef}
      poster={media.poster}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      data-hero-follow={follow}
      className={className}
    >
      {media.videoWebm && <source src={media.videoWebm} type="video/webm" />}
      <source src={media.videoSrc} type="video/mp4" />
    </video>
  )
}
