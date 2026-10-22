import { useEffect, useState, type ReactNode } from 'react'
import type { Status } from '@/dados/tipos'

/* Peças pequenas reaproveitadas pela interface: etiqueta de situação, fato, marca. */

export const STATUS_LABEL: Record<Status, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
}

export const STATUS_PLURAL: Record<Status, string> = {
  disponivel: 'Disponíveis',
  reservado: 'Reservados',
  vendido: 'Vendidos',
}

export const STATUS_COLOR: Record<Status, string> = {
  disponivel: 'var(--color-avail)',
  reservado: 'var(--color-reserved)',
  vendido: 'var(--color-sold)',
}

export function StatusDot({ status, size = 8 }: { status: Status; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: STATUS_COLOR[status], boxShadow: `0 0 10px color-mix(in srgb, ${STATUS_COLOR[status]} 45%, transparent)` }}
    />
  )
}

export function StatusChip({ status, small }: { status: Status; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${small ? 'h-5 px-2 text-[10.5px]' : 'h-6 px-2.5 text-[11.5px]'}`}
      style={{
        color: STATUS_COLOR[status],
        borderColor: `color-mix(in srgb, ${STATUS_COLOR[status]} 45%, transparent)`,
        background: `color-mix(in srgb, ${STATUS_COLOR[status]} 10%, transparent)`,
      }}
    >
      <StatusDot status={status} size={6} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Fact({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="label !text-[9.5px]">{label}</div>
      <div className="mt-1 truncate text-[15px] font-semibold text-text">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-faint">{sub}</div>}
    </div>
  )
}

/** assinatura WilSouza.ai */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`display font-semibold tracking-tight ${className}`}>
      wilsouza<span className="text-accent">.ai</span>
    </span>
  )
}

/** tela sem mouse (celular e tablet) */
export const isTouch = () => typeof window !== 'undefined' && matchMedia('(hover: none)').matches

export function useWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280))
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

/** celular: abaixo de 760 px de largura */
export const useIsMobile = () => useWidth() < 760
