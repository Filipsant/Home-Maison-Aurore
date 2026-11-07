import { useRef } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { Container } from '@/components/shared/Container'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { categories } from '@/data/categories'
import { CategoryCard } from './CategoryCard'
import { categoriesReveal } from './categories.animation'

/** 7. Categorias (Sigma "Product categories"): três cards com descrição e "Ler mais". */
export function Categories() {
  const ref = useRef<HTMLElement>(null)
  useSectionAnimation(ref, (root, { reduced }) => {
    categoriesReveal(root, { reduced })
  })
  return (
    <section
      ref={ref}
      id="categorias"
      aria-labelledby="categorias-title"
      className="relative z-10 bg-nevoa pb-section-l"
    >
      <Container>
        <SectionHeading id="categorias-title">{categories.title}</SectionHeading>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {categories.items.map((category) => (
            <li key={category.id}>
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
