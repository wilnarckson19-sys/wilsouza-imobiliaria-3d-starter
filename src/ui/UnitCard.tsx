import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useMemo } from 'react'
import { predio } from '@/config/predio'
import { apartamentos } from '@/dados/apartamentos'
import type { Apartamento } from '@/dados/tipos'
import { andarLongo, dinheiro, metros } from '@/lib/formato'
import { POR_NUMERO, useStore } from '@/store/store'
import { Fact, StatusChip, useIsMobile } from './bits'

/** anterior e próximo apartamento disponível, na ordem do prédio */
function useNav(a: Apartamento | undefined) {
  return useMemo(() => {
    if (!a) return { prev: undefined, next: undefined }
    const livres = apartamentos.filter((x) => x.status === 'disponivel' || x.numero === a.numero)
    livres.sort((x, y) => x.andar * 10 + x.posicao - (y.andar * 10 + y.posicao))
    const i = livres.findIndex((x) => x.numero === a.numero)
    const prev = livres[(i - 1 + livres.length) % livres.length]
    const next = livres[(i + 1) % livres.length]
    return { prev: prev?.numero === a.numero ? undefined : prev, next: next?.numero === a.numero ? undefined : next }
  }, [a])
}

/** Cartão com os dados do apartamento selecionado (no celular vira uma gaveta embaixo). */
export function UnitCard() {
  const selecionado = useStore((s) => s.selecionado)
  const mobile = useIsMobile()
  return (
    <AnimatePresence>
      {selecionado && (
        <motion.section
          key="unit"
          initial={mobile ? { y: '100%' } : { y: 24, opacity: 0 }}
          animate={mobile ? { y: 0 } : { y: 0, opacity: 1 }}
          exit={mobile ? { y: '100%' } : { y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className={
            mobile
              ? 'glass-strong pointer-events-auto fixed inset-x-0 bottom-0 z-30 max-h-[62vh] overflow-y-auto rounded-t-3xl pb-[env(safe-area-inset-bottom)] scroll-thin'
              : 'glass-strong pointer-events-auto absolute bottom-5 left-5 z-30 w-[352px] rounded-3xl'
          }
          aria-label="Detalhes do apartamento"
        >
          <Body numero={selecionado} />
        </motion.section>
      )}
    </AnimatePresence>
  )
}

function Body({ numero }: { numero: string }) {
  const a = POR_NUMERO.get(numero)
  const nav = useNav(a)
  if (!a) return null
  const vista = predio.plantas.find((p) => p.posicao === a.posicao)?.vista ?? ''
  const vendido = a.status === 'vendido'
  const select = useStore.getState().selecionar

  return (
    <div className="px-5 pt-4 pb-4">
      <div className="flex items-center justify-between">
        <span className="label">Apartamento · {andarLongo(a.andar)}</span>
        <button className="icon-btn !size-8" onClick={() => select(null)} aria-label="Fechar detalhes">
          <X size={15} />
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <motion.span key={a.numero} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="display text-[46px] leading-none font-semibold">
          {a.numero}
        </motion.span>
        <StatusChip status={a.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3.5 border-t border-white/8 pt-4">
        <Fact label="Área" value={metros(a.area)} sub="privativa" />
        <Fact label="Quartos" value={a.quartos} sub={a.suites ? `${a.suites} suíte${a.suites > 1 ? 's' : ''}` : 'sem suíte'} />
        <Fact label="Andar" value={`${a.andar}º`} sub={vista} />
      </div>

      <div className="mt-4 border-t border-white/8 pt-4">
        <div className="label">Valor de tabela</div>
        <div className={`display mt-1 text-[30px] leading-none font-semibold ${vendido ? 'text-muted' : ''}`}>{dinheiro(a.valor)}</div>
        <div className="mt-1.5 text-[12px] text-faint">
          {vendido ? 'Unidade vendida. ' : ''}
          {dinheiro(a.valor / a.area)} por m² · {a.vagas} vaga{a.vagas > 1 ? 's' : ''}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/8 pt-3 text-[12px]">
        <button
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-muted transition hover:bg-white/5 hover:text-text disabled:opacity-30"
          disabled={!nav.prev}
          onClick={() => nav.prev && select(nav.prev.numero)}
        >
          <ChevronLeft size={15} /> Disponível anterior
        </button>
        <button
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-muted transition hover:bg-white/5 hover:text-text disabled:opacity-30"
          disabled={!nav.next}
          onClick={() => nav.next && select(nav.next.numero)}
        >
          Próximo disponível <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
