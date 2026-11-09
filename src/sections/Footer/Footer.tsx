import { useRef } from 'react'
import { useSectionAnimation } from '@/animations/hooks'
import { Container } from '@/components/shared/Container'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { TextLink } from '@/components/shared/TextLink'
import { site } from '@/data/site'
import { BookingForm } from './BookingForm'
import { footerReveal } from './footer.animation'

/** Rodapé (fundo veludo): chamada para prova, formulário, 4 colunas e assinatura. */
export function Footer() {
  const ref = useRef<HTMLElement>(null)
  useSectionAnimation(ref, (root, { reduced }) => {
    footerReveal(root, { reduced })
  })
  const { footer } = site
  return (
    <footer
      ref={ref}
      id="agendar"
      data-surface="dark"
      data-header-theme="dark"
      className="relative z-10 overflow-hidden bg-veludo text-nevoa"
    >
      <Container className="pt-section pb-10">
        <div className="grid gap-12 pb-24 md:grid-cols-12 md:items-end md:pb-35">
          <SectionHeading size="cta" tone="light" className="md:col-span-6">
            {footer.title}
          </SectionHeading>
          <BookingForm form={footer.form} className="md:col-span-5 md:col-start-8" />
        </div>

        <span data-line="" aria-hidden="true" className="block h-px w-full origin-left bg-linha-escura" />
        <div className="grid gap-8 pt-8 md:grid-cols-4">
          {footer.columns.map((column) => (
            <div key={column.id} data-footer-column="" className="flex flex-col gap-1.5 text-caption">
              <h3 className="text-texto-suave-escuro">{column.title}</h3>
              <ul className="flex flex-col gap-0.5">
                {column.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      // 24px de altura: área de toque mínima do WCAG 2.2, mantendo o ritmo do Figma.
                      <TextLink href={item.href} underline="hover" className="min-h-6 text-nevoa">
                        {item.label}
                      </TextLink>
                    ) : (
                      <span className="text-nevoa">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p
          data-signature=""
          aria-hidden="true"
          className="pt-20 text-center font-display text-signature text-nevoa md:pt-30"
        >
          {footer.signature}
        </p>
      </Container>
    </footer>
  )
}
