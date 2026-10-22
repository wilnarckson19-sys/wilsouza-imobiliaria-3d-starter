import { AnimatePresence, motion } from 'motion/react'
import { Building2, Eye, Moon, MousePointerClick, RotateCw, Sun, Table2 } from 'lucide-react'
import { creditos, empreendimento } from '@/config/empreendimento'
import type { Status } from '@/dados/tipos'
import { porcento } from '@/lib/formato'
import { contagem, useStore, type Vista } from '@/store/store'
import { STATUS_PLURAL, StatusDot, Wordmark, isTouch } from './bits'
import { StatusBar } from './UnitTable'

/* Elementos sobre o 3D: marca, controles, legenda, dica, créditos e tela de carregamento. */

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="glass pointer-events-auto flex items-center gap-3 rounded-2xl py-2.5 pr-4 pl-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-accent">
        <Building2 size={20} />
      </span>
      <div className="min-w-0">
        <div className={`display truncate leading-tight font-semibold ${compact ? 'text-[15px]' : 'text-[17px]'}`}>{empreendimento.nome}</div>
        <div className="truncate text-[11.5px] text-muted">
          {empreendimento.subtitulo}
          {!compact && ` · ${empreendimento.cidade}`}
        </div>
      </div>
    </div>
  )
}

const VISTAS: [Vista, string][] = [
  ['inicio', 'Início'],
  ['frente', 'Frente'],
  ['lateral', 'Lateral'],
  ['fundos', 'Fundos'],
  ['aerea', 'Aérea'],
]

export function Controls({ labels = true }: { labels?: boolean }) {
  const destacar = useStore((s) => s.destacar)
  const noite = useStore((s) => s.noite)
  const girar = useStore((s) => s.girar)
  const vista = useStore((s) => s.vista)
  const set = useStore((s) => s.set)
  return (
    <div className="no-scrollbar pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto">
      <button className="btn glass !h-10 shrink-0" data-on={destacar} onClick={() => set({ destacar: !destacar })} aria-pressed={destacar}>
        <Eye size={16} /> {labels ? 'Destacar situação' : 'Destacar'}
      </button>
      <button className="btn glass !h-10 shrink-0" onClick={() => set({ noite: !noite })} aria-label={noite ? 'Ver de dia' : 'Ver à noite'}>
        {noite ? <Sun size={16} /> : <Moon size={16} />} {labels && (noite ? 'Dia' : 'Noite')}
      </button>
      <button className="btn glass !h-10 shrink-0" data-on={girar} onClick={() => set({ girar: !girar, selecionado: null })} aria-pressed={girar} aria-label="Girar o prédio">
        <RotateCw size={16} /> {labels && 'Girar'}
      </button>
      <div className="seg glass shrink-0 !p-[4px]">
        {VISTAS.map(([v, label]) => (
          <button key={v} data-on={vista === v} onClick={() => useStore.getState().mudarVista(v)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** resumo de vendas; clicar numa situação filtra o prédio e a tabela */
export function Legend() {
  const c = contagem()
  const filtro = useStore((s) => s.filtro)
  const set = useStore((s) => s.set)
  return (
    <div className="glass pointer-events-auto w-[300px] rounded-2xl px-4 py-3.5">
      <div className="flex items-baseline gap-2">
        <span className="display text-[30px] leading-none font-semibold">{porcento((c.vendido / c.total) * 100)}</span>
        <span className="label">vendido</span>
      </div>
      <div className="mt-2.5">
        <StatusBar />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {(['disponivel', 'reservado', 'vendido'] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => set({ filtro: filtro === s ? 'todos' : s })}
            className={`rounded-lg px-2 py-1.5 text-left transition ${filtro === s ? 'bg-white/10' : 'hover:bg-white/5'}`}
            aria-pressed={filtro === s}
          >
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <StatusDot status={s} size={7} /> {STATUS_PLURAL[s]}
            </span>
            <span className="num display mt-0.5 block text-[17px] font-semibold">{c[s]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Hint() {
  const pronto = useStore((s) => s.pronto)
  const selecionado = useStore((s) => s.selecionado)
  const tocou = useStore((s) => s.tocou)
  return (
    <AnimatePresence>
      {pronto && !selecionado && !tocou && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="glass pointer-events-none flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] text-muted"
        >
          <MousePointerClick size={15} className="text-accent" />
          {isTouch() ? 'Toque' : 'Clique'} em um apartamento no prédio ou na tabela
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Credit() {
  return (
    <a
      href={creditos.link}
      target="_blank"
      rel="noopener noreferrer"
      className="pointer-events-auto rounded-full bg-black/35 px-3 py-1.5 text-[11px] text-muted backdrop-blur transition hover:text-text"
    >
      Starter Kit criado por <Wordmark className="text-text" />
    </a>
  )
}

export function Loader() {
  const carregada = useStore((s) => s.cenaCarregada)
  return (
    <AnimatePresence>
      {!carregada && (
        <motion.div
          key="loader"
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          className="fixed inset-0 z-50 grid place-items-center bg-ink"
        >
          <div className="text-center">
            <div className="display text-[28px] font-semibold">{empreendimento.nome}</div>
            <div className="mt-1 text-[13px] text-muted">Carregando o prédio 3D</div>
            <div className="mx-auto mt-5 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full w-1/3 rounded-full bg-accent"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** barra do celular: resumo de vendas e botão da tabela */
export function MobileDock() {
  const c = contagem()
  const set = useStore((s) => s.set)
  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass pointer-events-auto rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="display text-[24px] leading-none font-semibold">{porcento((c.vendido / c.total) * 100)}</span>
            <span className="label !text-[9px]">vendido</span>
            <span className="ml-auto text-[11.5px] text-muted">
              <b className="num text-avail">{c.disponivel}</b> disponíveis
            </span>
          </div>
          <div className="mt-2">
            <StatusBar height={5} />
          </div>
        </div>
        <button className="btn !h-11 shrink-0 !rounded-xl !px-3.5" onClick={() => set({ tabelaAberta: true })} aria-label="Abrir tabela de vendas">
          <Table2 size={16} /> Tabela
        </button>
      </div>
    </motion.div>
  )
}
