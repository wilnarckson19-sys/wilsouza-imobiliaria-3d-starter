import { AnimatePresence, motion } from 'motion/react'
import { andarLongo, dinheiro, metros } from '@/lib/formato'
import { usePointer } from '@/store/pointer'
import { POR_NUMERO, useStore } from '@/store/store'
import { StatusChip, isTouch } from './bits'

/** cartão que segue o mouse ao passar sobre um apartamento no prédio */
export function HoverCard() {
  const emFoco = useStore((s) => s.emFoco)
  const origem = useStore((s) => s.origemFoco)
  const selecionado = useStore((s) => s.selecionado)
  const { x, y } = usePointer()
  const a = emFoco ? POR_NUMERO.get(emFoco) : undefined
  const show = !!a && emFoco !== selecionado && origem === '3d' && !isTouch()

  const W = 250
  const left = Math.min(x + 18, window.innerWidth - W - 12)
  const top = Math.min(Math.max(12, y + 18), window.innerHeight - 150)

  return (
    <AnimatePresence>
      {show && a && (
        <motion.div
          key="hover"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1, left, top }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
          transition={{ opacity: { duration: 0.15 }, left: { duration: 0.12 }, top: { duration: 0.12 } }}
          className="glass-strong pointer-events-none fixed z-40 rounded-xl px-4 py-3"
          style={{ width: W }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="label !text-[9.5px]">{andarLongo(a.andar)}</span>
            <StatusChip status={a.status} small />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="display text-[26px] leading-none font-semibold">{a.numero}</span>
            <span className="text-[12.5px] text-muted">
              {a.quartos} quartos · {metros(a.area)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/8 pt-2.5 text-[12.5px]">
            <span className="text-muted">Clique para abrir</span>
            <span className="num font-semibold">{a.status === 'vendido' ? 'Vendido' : dinheiro(a.valor).replace(/,00$/, '')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
