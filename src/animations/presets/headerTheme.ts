import { ScrollTrigger } from '../gsap'

/**
 * Troca de tema do header (E06): fica escuro enquanto uma seção marcada passa por
 * baixo dele. A cor muda por transição CSS; aqui só se decide quando.
 * @param sections seções com fundo escuro
 * @param headerHeight altura do header em px (a troca acontece no meio dele)
 * @param onChange recebe `true` quando há uma seção escura sob o header
 */
export function headerTheme(
  sections: HTMLElement[],
  headerHeight: number,
  onChange: (dark: boolean) => void,
): ScrollTrigger[] {
  const active = new Set<HTMLElement>()
  const line = Math.round(headerHeight / 2)
  return sections.map((section) =>
    ScrollTrigger.create({
      trigger: section,
      start: `top top+=${line}`,
      end: `bottom top+=${line}`,
      onToggle: (self) => {
        if (self.isActive) active.add(section)
        else active.delete(section)
        onChange(active.size > 0)
      },
    }),
  )
}
