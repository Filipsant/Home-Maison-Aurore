import pecaSrc from '@/assets/hero/peca.svg'
import toileSrc from '@/assets/hero/toile.svg'
import type { Hero } from '@/types/content'

interface HeroMediaProps {
  toile: Hero['toile']
  finalPiece: Hero['finalPiece']
}

/**
 * Composição do Figma "Imagem hero (transição toile → peça final)":
 * a toile em musselina por baixo e a peça final (veludo) revelada por cima,
 * com a linha de giz marcando a borda. A largura revelada vem de `--reveal`
 * (ver globals.css); a animação a leva de 0% a 100%.
 * As camadas `data-curtain` e `data-media` seguem o componente `Photo`,
 * para a entrada com cortina de cor (E15).
 */
export function HeroMedia({ toile, finalPiece }: HeroMediaProps) {
  return (
    <div
      data-hero-media=""
      data-intro=""
      role="img"
      aria-label={`${finalPiece.caption}. ${toile.caption}`}
      className="relative isolate aspect-4/5 overflow-hidden md:aspect-2/1"
    >
      <span data-curtain="" aria-hidden="true" className="absolute inset-0 bg-lilas" />

      <div data-media="" className="absolute inset-0">
        {/* Toile em musselina */}
        <div className="absolute inset-0 bg-musselina">
          <div data-hero-figure="" className="absolute left-1/2 aspect-square -translate-x-1/2 md:left-[62%]">
            <img src={toileSrc} alt="" aria-hidden="true" className="size-full" />
          </div>
          <p
            aria-hidden="true"
            className="absolute right-4 bottom-4 w-1/3 text-right text-caption text-grafite md:w-auto"
          >
            {toile.caption}
          </p>
        </div>

        {/* Peça final, revelada sobre a toile */}
        <div data-hero-final="" className="absolute inset-0 bg-veludo">
          <div data-hero-figure="" className="absolute left-1/2 aspect-square -translate-x-1/2 md:left-[62%]">
            <img
              src={pecaSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-y-0 left-1/4 h-full w-1/2"
            />
          </div>
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
    </div>
  )
}
