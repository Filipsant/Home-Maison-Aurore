import * as React from 'react'
import { useReducedMotion } from '@/animations/hooks/useReducedMotion'
import { Photo } from '@/components/shared/Photo'
import { useVisibleAutoplay } from '@/hooks/useVisibleAutoplay'
import { cn } from '@/lib/utils'
import type { VideoMedia } from '@/types/content'

interface VideoTeaserProps extends React.HTMLAttributes<HTMLElement> {
  media: VideoMedia
  /** Rótulos do controle de pausa (texto de interface). */
  labels?: { play: string; pause: string }
}

/**
 * Vídeo em loop, mudo, com poster. Toca só quando está visível e pausa fora
 * da viewport. Com movimento reduzido não há autoplay: a pessoa decide pelo botão.
 * Sem `videoSrc`, mostra o placeholder do `Photo`.
 */
export function VideoTeaser({
  media,
  labels = { play: 'Reproduzir vídeo', pause: 'Pausar vídeo' },
  className,
  ...props
}: VideoTeaserProps) {
  const reduced = useReducedMotion()
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [userPaused, setUserPaused] = React.useState<boolean | null>(null)

  // Pausado por escolha da pessoa; sem escolha, segue a preferência de movimento.
  const paused = userPaused ?? reduced
  const refuse = React.useCallback(() => setUserPaused(true), [])
  useVisibleAutoplay(videoRef, videoRef, paused, refuse, 0.25)

  if (!media.videoSrc) {
    return <Photo media={media} className={className} {...props} />
  }

  return (
    <Photo media={{ ...media, src: media.poster }} className={cn('group/video', className)} {...props}>
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        poster={media.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={media.alt ?? media.caption}
      >
        {media.videoWebm && <source src={media.videoWebm} type="video/webm" />}
        <source src={media.videoSrc} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={() => setUserPaused(!paused)}
        aria-pressed={!paused}
        className="absolute right-4 bottom-4 min-h-11 rounded-pill bg-nevoa px-4 text-caption text-grafite"
      >
        {paused ? labels.play : labels.pause}
      </button>
    </Photo>
  )
}
