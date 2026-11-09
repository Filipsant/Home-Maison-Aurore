import { Photo } from '@/components/shared/Photo'
import type { Piece } from '@/types/content'

interface PieceRowProps {
  piece: Piece
}

/**
 * Linha da lista (Figma "Linha / Robe Céleste (estado hover)"): no hover ou no
 * foco, o nome desloca 18px e uma prévia inclinada da peça aparece.
 * Efeitos de hover só a partir de 760px e com mouse.
 */
export function PieceRow({ piece }: PieceRowProps) {
  return (
    <li data-reveal="rise" className="border-b border-linha">
      <a
        href={piece.link.href}
        className="group/row relative flex flex-col gap-2 py-7.5 md:flex-row md:items-center md:justify-between"
      >
        <h3 className="font-display text-display-s transition-transform duration-500 ease-out-expo md:group-focus-visible/row:translate-x-4.5 md:pointer-fine:group-hover/row:translate-x-4.5">
          {piece.name}
        </h3>
        <p className="text-caption text-texto-suave">{piece.material}</p>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-15 left-[65%] z-10 hidden w-42 translate-y-3 rotate-2 opacity-0 transition duration-400 ease-out-cubic md:block md:group-focus-visible/row:translate-y-0 md:group-focus-visible/row:opacity-100 md:pointer-fine:group-hover/row:translate-y-0 md:pointer-fine:group-hover/row:opacity-100"
        >
          <Photo media={piece.media} hideCaption />
        </span>
      </a>
    </li>
  )
}
