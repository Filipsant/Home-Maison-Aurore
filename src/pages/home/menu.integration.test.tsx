import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MenuProvider } from '@/app/providers/MenuProvider'
import { Header } from '@/sections/Header'
import { setReducedMotion } from '@/test/setup'
import { Menu } from '@/sections/Menu'

function renderHeaderWithMenu() {
  return render(
    <MenuProvider>
      <Header />
      <Menu />
    </MenuProvider>,
  )
}

describe('Menu (Header + Menu juntos)', () => {
  it('abre pelo botão "Menu" e prende o foco dentro do diálogo', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    renderHeaderWithMenu()

    const trigger = screen.getByRole('button', { name: 'Menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Menu' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement))
  })

  it('fecha com Esc e devolve o foco ao botão "Menu"', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    renderHeaderWithMenu()

    const trigger = screen.getByRole('button', { name: 'Menu' })
    await user.click(trigger)
    await screen.findByRole('dialog', { name: 'Menu' })

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('fecha pelo botão "Fechar" mesmo com a animação ligada', async () => {
    setReducedMotion(false)
    const user = userEvent.setup()
    renderHeaderWithMenu()

    const trigger = screen.getByRole('button', { name: 'Menu' })
    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: 'Fechar' }))

    // A timeline toca em reverse; o conteúdo só sai quando ela termina (ou pela rede de segurança).
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 3000 })
    expect(trigger).toHaveFocus()
  })

  it('os links do menu levam às seções da home e às páginas do ateliê digital', async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    renderHeaderWithMenu()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const nav = await screen.findByRole('navigation', { name: 'Menu' })
    const links = Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    expect(links).toEqual(['/#colecao', '/#pecas', '/#editorial', '/#atelie', '/atelie-digital', '/provador'])
  })
})
