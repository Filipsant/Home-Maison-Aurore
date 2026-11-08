import { useCallback, useRef, useState } from 'react'
import { useReducedMotion } from '@/animations/hooks'
import pecaSrc from '@/assets/hero/peca.svg'
import toileSrc from '@/assets/hero/toile.svg'
import { useVisibleAutoplay } from '@/hooks/useVisibleAutoplay'
import { cn } from '@/lib/utils'
import type { Hero } from '@/types/content'

interface HeroMediaProps {
  toile: Hero['toile']
  finalPiece: Hero['finalPiece']
  labels: Hero['videoLabels']
}

/**
 * Composição do Figma "Imagem hero (transição toile → peça final)":
 * a toile por baixo e a peça final revelada por cima, com a linha de giz
 * marcando a borda. A largura revelada vem de `--reveal` (ver globals.css);
 * a animação a leva de 55% a 100% com o scroll.
 * As camadas `data-curtain` e `data-media` seguem o componente `Photo`,
 * para a entrada com cortina de cor (E15).
 *
 * Com `src`/`videoSrc` nos dados, mostra a foto e o vídeo reais; sem eles,
 * os desenhos do Figma. O vídeo toca mudo, em loop, só quando visível, e tem
 * botão de pausa; com movimento reduzido fica parado no poster.
 */
export function HeroMedia({ toile, finalPiece, labels }: HeroMediaProps) {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [userPaused, setUserPaused] = useState<boolean | null>(null)
  // Pausado por escolha da pessoa; sem escolha, segue a preferência de movimento.
  const paused = userPaused ?? reduced
  const hasVideo = Boolean(finalPiece.videoSrc)
  const refuse = useCallback(() => setUserPaused(true), [])

  useVisibleAutoplay(videoRef, rootRef, paused, refuse)

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
        {/* Toile (por baixo) */}
        <div className="absolute inset-0 bg-musselina">
          {toile.src ? (
            <img src={toile.src} alt="" className="absolute inset-0 size-full object-cover" />
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
              toile.src && 'w-auto bg-nevoa/85 px-2 py-1',
            )}
          >
            {toile.caption}
          </p>
        </div>

        {/* Peça final, revelada sobre a toile */}
        <div data-hero-final="" className="absolute inset-0 bg-veludo">
          {finalPiece.videoSrc ? (
            <video
              ref={videoRef}
              poster={finalPiece.poster}
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover"
            >
              {finalPiece.videoWebm && <source src={finalPiece.videoWebm} type="video/webm" />}
              <source src={finalPiece.videoSrc} type="video/mp4" />
            </video>
          ) : finalPiece.src ? (
            <img src={finalPiece.src} alt="" className="absolute inset-0 size-full object-cover" />
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
