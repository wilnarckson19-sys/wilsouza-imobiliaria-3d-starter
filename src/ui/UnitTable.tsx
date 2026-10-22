import { ArrowDownUp, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { empreendimento } from '@/config/empreendimento'
import { apartamentos } from '@/dados/apartamentos'
import type { Apartamento, Status } from '@/dados/tipos'
import { andarLongo, dinheiro, dinheiroCurto, metros } from '@/lib/formato'
import { contagem, useStore, type Filtro } from '@/store/store'
import { STATUS_COLOR, STATUS_PLURAL, StatusChip, StatusDot } from './bits'

type Ordem = 'numero' | 'area' | 'valor'

/**
 * Tabela de vendas ligada ao prédio: passar o mouse acende o apartamento no 3D, clicar leva a câmera
 * até ele, e o que é selecionado no prédio fica marcado aqui.
 */
export function UnitTable({ compact = false, onClose }: { compact?: boolean; onClose?: () => void }) {
  const filtro = useStore((s) => s.filtro)
  const selecionado = useStore((s) => s.selecionado)
  const emFoco = useStore((s) => s.emFoco)
  const [quartos, setQuartos] = useState<number | 0>(0)
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<{ k: Ordem; dir: 1 | -1 }>({ k: 'numero', dir: -1 })
  const listRef = useRef<HTMLDivElement>(null)

  const c = useMemo(() => contagem(), [])
  const opcoesQuartos = useMemo(() => [...new Set(apartamentos.map((a) => a.quartos))].sort(), [])

  const linhas = useMemo(() => {
    const r = apartamentos.filter(
      (a) => (filtro === 'todos' || a.status === filtro) && (!quartos || a.quartos === quartos) && (!busca || a.numero.includes(busca.trim())),
    )
    // do andar mais alto para o mais baixo, como se lê o prédio
    const key = (a: Apartamento) => (ordem.k === 'valor' ? a.valor : ordem.k === 'area' ? a.area : a.andar * 10 - a.posicao)
    return [...r].sort((a, b) => (key(a) - key(b)) * ordem.dir)
  }, [filtro, quartos, busca, ordem])

  // seleção feita no prédio: rola a tabela até a linha
  useEffect(() => {
    if (!selecionado) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-apto="${selecionado}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selecionado])

  const set = useStore.getState().set
  const th = (k: Ordem, label: string, right = false) => (
    <button
      onClick={() => setOrdem((o) => ({ k, dir: o.k === k ? (o.dir === 1 ? -1 : 1) : k === 'numero' ? -1 : 1 }))}
      className={`inline-flex items-center gap-1 hover:text-text ${right ? 'justify-end' : ''} ${ordem.k === k ? 'text-text' : ''}`}
    >
      {label} <ArrowDownUp size={10} className="opacity-60" />
    </button>
  )
  const cols = compact ? 'grid-cols-[1.1fr_1fr_1.3fr_1.1fr]' : 'grid-cols-[1.05fr_1fr_0.55fr_1.3fr_1.15fr]'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="label">Tabela de vendas</div>
            <div className="display mt-1 truncate text-[21px] leading-tight font-semibold">{empreendimento.nome}</div>
            <div className="mt-0.5 text-[12px] text-muted">
              {c.total} apartamentos · {c.disponivel} disponíveis
            </div>
          </div>
          {onClose && (
            <button className="icon-btn !size-9 shrink-0" onClick={onClose} aria-label="Fechar tabela">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
          {(['todos', 'disponivel', 'reservado', 'vendido'] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => set({ filtro: f })}
              aria-pressed={filtro === f}
              className={`min-w-0 rounded-xl py-1.5 text-left transition ${compact ? 'px-1.5' : 'px-2'} ${filtro === f ? 'bg-white text-ink' : 'text-muted hover:bg-white/5 hover:text-text'}`}
            >
              <span className={`flex items-center truncate font-semibold ${compact ? 'gap-1 text-[10px]' : 'gap-1.5 text-[11px]'}`}>
                {f !== 'todos' && <StatusDot status={f as Status} size={6} />}
                {f === 'todos' ? 'Todos' : STATUS_PLURAL[f as Status]}
              </span>
              <span className="num display block text-[16px] leading-tight font-semibold">{f === 'todos' ? c.total : c[f as Status]}</span>
            </button>
          ))}
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <div className="seg">
            {[0, ...opcoesQuartos].map((q) => (
              <button key={q} data-on={quartos === q} onClick={() => setQuartos(q)}>
                {q === 0 ? 'Quartos' : `${q} qts`}
              </button>
            ))}
          </div>
          <label className="flex h-[38px] min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 px-3">
            <Search size={14} className="shrink-0 text-faint" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="Nº do apto"
              aria-label="Buscar apartamento pelo número"
              className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-faint"
            />
          </label>
        </div>
      </div>

      <div className={`grid ${cols} shrink-0 gap-2 border-y border-white/8 px-5 py-2 text-[11px] font-semibold text-faint`}>
        {th('numero', 'Apto')}
        {th('area', 'Área')}
        {!compact && <span>Qts</span>}
        <span className="flex justify-end">{th('valor', 'Valor', true)}</span>
        <span className="text-right">Situação</span>
      </div>

      <div ref={listRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {linhas.map((a) => {
          const sel = selecionado === a.numero
          const hov = emFoco === a.numero
          return (
            <button
              key={a.numero}
              data-apto={a.numero}
              onMouseEnter={() => useStore.getState().focar(a.numero, 'tabela')}
              onMouseLeave={() => useStore.getState().focar(null, 'tabela')}
              onClick={() => {
                useStore.getState().selecionar(sel ? null : a.numero)
                onClose?.()
              }}
              className={`relative grid w-full ${cols} items-center gap-2 border-b border-white/[0.05] px-5 py-2.5 text-left text-[13px] transition-colors ${
                sel ? 'bg-accent/[0.12]' : hov ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
              }`}
            >
              {sel && <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" />}
              <span className="min-w-0">
                <span className="display block text-[16px] leading-tight font-semibold">{a.numero}</span>
                <span className="block text-[11px] text-faint">{andarLongo(a.andar)}</span>
              </span>
              <span className="num text-muted">{metros(a.area)}</span>
              {!compact && <span className="num text-muted">{a.quartos}</span>}
              <span className="num text-right font-semibold" style={a.status === 'vendido' ? { color: 'var(--color-faint)' } : undefined}>
                {compact ? dinheiroCurto(a.valor) : dinheiro(a.valor).replace(/,00$/, '')}
              </span>
              <span className="flex justify-end">
                <StatusChip status={a.status} small />
              </span>
            </button>
          )
        })}
        {linhas.length === 0 && <div className="py-12 text-center text-[13px] text-muted">Nenhum apartamento com esses filtros.</div>}
      </div>

      <div className="shrink-0 border-t border-white/8 px-5 py-3 text-[10.5px] leading-relaxed text-faint">
        Tabela de {empreendimento.atualizadoEm.toLowerCase()}. {empreendimento.aviso}
      </div>
    </div>
  )
}

/** barra com a proporção de vendidos, reservados e disponíveis */
export function StatusBar({ height = 6 }: { height?: number }) {
  const c = contagem()
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-white/10" style={{ height }}>
      {(['vendido', 'reservado', 'disponivel'] as Status[]).map((s) => (
        <div key={s} style={{ width: `${(c[s] / c.total) * 100}%`, background: STATUS_COLOR[s] }} />
      ))}
    </div>
  )
}
