import { useState } from 'react'
import { Container } from '@/components/shared/Container'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { measurements } from '@/data/measurements'
import { ordersPanel } from '@/data/ordersPanel'
import { apiUrl } from '@/lib/ai/client'
import { altForPiece, pieceSummary } from '@/lib/ai/describe'
import { deleteOrder, listOrders } from '@/lib/api/orders'
import type { AtelierLinha } from '@/types/content'
import type { Order } from '@/types/order'

type PanelState =
  { phase: 'login'; message?: string } | { phase: 'loading' } | { phase: 'ready'; orders: Order[] }

const loginMessage = {
  senha: ordersPanel.login.wrong,
  'sem-senha': ordersPanel.login.notConfigured,
  limite: ordersPanel.login.limite,
  erro: ordersPanel.login.error,
} as const

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/**
 * Painel do ateliê: senha → lista de pedidos. A senha fica só na memória da
 * aba (some ao recarregar) e vai em cada pedido à API, que confere no Worker.
 */
export function OrdersPanel() {
  const [password, setPassword] = useState('')
  const [state, setState] = useState<PanelState>({ phase: 'login' })

  const load = async (secret: string) => {
    setState({ phase: 'loading' })
    const result = await listOrders(secret)
    if (result.status === 'ok') setState({ phase: 'ready', orders: result.pedidos })
    else setState({ phase: 'login', message: loginMessage[result.status] })
  }

  const remove = async (order: Order) => {
    if (!window.confirm(ordersPanel.order.confirmRemove)) return
    if (await deleteOrder(order.id, password)) {
      setState((s) => (s.phase === 'ready' ? { ...s, orders: s.orders.filter((o) => o.id !== order.id) } : s))
    }
  }

  return (
    <section aria-labelledby="pedidos-title" className="pt-header">
      <Container className="flex flex-col gap-10 pt-section pb-section">
        <div className="flex flex-col gap-4">
          <SectionHeading id="pedidos-title" level={1} size="l">
            {ordersPanel.title}
          </SectionHeading>
          <p className="max-w-140 text-lead">{ordersPanel.lead}</p>
        </div>

        {state.phase !== 'ready' ? (
          <form
            className="flex max-w-100 flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              void load(password)
            }}
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="painel-senha">{ordersPanel.login.label}</Label>
              <div className="border-b border-linha-escura focus-within:border-grafite">
                <Input
                  id="painel-senha"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={state.phase === 'login' && state.message ? 'painel-erro' : undefined}
                />
              </div>
            </div>
            <div>
              <Button type="submit" variant="dark" disabled={state.phase === 'loading' || !password}>
                {ordersPanel.login.submit}
              </Button>
            </div>
            <p id="painel-erro" role="status" className="min-h-6 text-caption font-medium text-grafite">
              {state.phase === 'login' ? (state.message ?? '') : ''}
            </p>
          </form>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void load(password)}>
                {ordersPanel.refresh}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPassword('')
                  setState({ phase: 'login' })
                }}
              >
                {ordersPanel.logout}
              </Button>
            </div>
            {state.orders.length === 0 ? (
              <p>{ordersPanel.empty}</p>
            ) : (
              <ol className="flex flex-col">
                {state.orders.map((order) => (
                  <OrderItem key={order.id} order={order} onRemove={() => void remove(order)} />
                ))}
              </ol>
            )}
          </div>
        )}
      </Container>
    </section>
  )
}

function OrderItem({ order, onRemove }: { order: Order; onRemove: () => void }) {
  const linha: AtelierLinha = order.peca.linha === 'masculina' ? 'masculina' : 'feminina'
  const { order: t } = ordersPanel
  return (
    <li className="grid gap-6 border-t border-linha py-8 md:grid-cols-12 md:gap-8">
      <div className="relative aspect-3/4 w-32 overflow-hidden bg-musselina md:col-span-2 md:w-auto">
        <img
          src={apiUrl(`/api/imagens/${order.pecaId}`)}
          alt={`${t.photoAlt}: ${altForPiece(order.peca)}`}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-3 md:col-span-4">
        <h2 className="text-card-title">{order.codigo}</h2>
        <p className="text-caption text-texto-suave">
          {t.received} {dateFormat.format(new Date(order.criadoEm))}
        </p>
        <div className="text-caption">
          <p className="text-texto-suave">{t.contact}</p>
          <p>{order.nome}</p>
          <p>
            <a className="underline underline-offset-4" href={`mailto:${order.email}`}>
              {order.email}
            </a>
          </p>
          {order.telefone && <p>{order.telefone}</p>}
        </div>
        {order.observacoes && (
          <div className="text-caption">
            <p className="text-texto-suave">{t.notes}</p>
            <p className="whitespace-pre-line">{order.observacoes}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 md:col-span-6 md:flex-row md:gap-8">
        <div className="flex-1">
          <p className="mb-2 text-caption text-texto-suave">{t.piece}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-caption">
            {pieceSummary(order.peca).map(({ label, value }) => (
              <div key={label} className="contents">
                <dt className="text-texto-suave">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex-1">
          <p className="mb-2 text-caption text-texto-suave">{t.measures}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-caption">
            {measurements[linha].map((field) => (
              <div key={field.id} className="contents">
                <dt className="text-texto-suave">{field.label}</dt>
                <dd>{order.medidas[field.id] ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {(order.provas ?? []).length > 0 && (
        <div className="md:col-span-12">
          <p className="mb-2 text-caption text-texto-suave">{t.provas}</p>
          <ul className="flex flex-wrap gap-3">
            {(order.provas ?? []).map((prova, i) => (
              <li key={prova}>
                <a
                  href={apiUrl(`/api/imagens/${prova}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-3/4 w-28 overflow-hidden bg-musselina focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus-ring)"
                >
                  <img
                    src={apiUrl(`/api/imagens/${prova}`)}
                    alt={t.provaAlt(i + 1)}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="md:col-span-12">
        <Button variant="outline" onClick={onRemove}>
          {t.remove}
        </Button>
      </div>
    </li>
  )
}
