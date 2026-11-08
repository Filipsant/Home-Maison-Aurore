/** HTMLMediaElement.HAVE_CURRENT_DATA: já há um quadro para mostrar. */
const HAVE_CURRENT_DATA = 2

/**
 * Toca o vídeo assim que ele tiver dados: um `play()` chamado antes disso pode
 * se perder enquanto o navegador escolhe a fonte (WebM ou MP4). Só a recusa do
 * navegador (autoplay bloqueado) chama `onRefused`; uma interrupção por `pause()`
 * não conta. Devolve a função de limpeza do efeito.
 */
export function playWhenReady(video: HTMLVideoElement, onRefused: () => void): () => void {
  const start = () => {
    // Ambientes sem mídia (testes) nem devolvem promessa.
    Promise.resolve(video.play()).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'NotAllowedError') onRefused()
    })
  }
  if (video.readyState >= HAVE_CURRENT_DATA) {
    start()
    return () => undefined
  }
  video.addEventListener('canplay', start, { once: true })
  return () => video.removeEventListener('canplay', start)
}
