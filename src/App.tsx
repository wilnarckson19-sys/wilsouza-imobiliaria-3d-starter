import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { POR_NUMERO, useStore } from '@/store/store'
import { useWidth } from '@/ui/bits'
import { HoverCard } from '@/ui/HoverCard'
import { Brand, Controls, Credit, Hint, Legend, Loader, MobileDock } from '@/ui/Overlays'
import { UnitCard } from '@/ui/UnitCard'
import { UnitTable } from '@/ui/UnitTable'

// a cena 3D carrega em separado, para a página aparecer mais rápido
const Scene = lazy(() => import('@/three/Scene'))

function hasWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

export default function App() {
  const width = useWidth()
  const mobile = width < 760
  const compactTable = width < 1180
  const mainWidth = width - (mobile ? 0 : compactTable ? 340 : 430)
  const [gl] = useState(hasWebGL)
  const pronto = useStore((s) => s.pronto)
  const selecionado = useStore((s) => s.selecionado)
  const tabelaAberta = useStore((s) => s.tabelaAberta)

  // ?apto=504 abre direto um apartamento (útil para compartilhar o link de uma unidade)
  useEffect(() => {
    if (!pronto) return
    const apto = new URLSearchParams(location.search).get('apto')
    if (apto && POR_NUMERO.has(apto)) useStore.getState().selecionar(apto)
  }, [pronto])

  // Esc fecha o que estiver aberto
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const s = useStore.getState()
      if (s.tabelaAberta) s.set({ tabelaAberta: false })
      else if (s.selecionado) s.selecionar(null)
      else if (s.filtro !== 'todos') s.set({ filtro: 'todos' })
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-ink select-none">
      <main className="relative min-w-0 flex-1">
        {gl ? (
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        ) : (
          <NoWebGL />
        )}

        <div className="pointer-events-none absolute inset-0 z-20">
          <div className={`absolute flex flex-col gap-2.5 ${mobile ? 'inset-x-3 top-3' : 'top-5 right-5 left-5'}`}>
            <div className="flex items-start justify-between gap-3">
              <Brand compact={mobile} />
              {!mobile && <Controls labels={mainWidth > 1180} />}
            </div>
            {mobile && <Controls labels={false} />}
          </div>

          {!mobile && (
            <AnimatePresence>
              {!selecionado && (
                <motion.div
                  key="legend"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="absolute bottom-5 left-5"
                >
                  <Legend />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <div className={`absolute inset-x-0 flex justify-center px-3 ${mobile ? 'bottom-[96px]' : 'bottom-6'}`}>
            <Hint />
          </div>

          {!(mobile && selecionado) && (
            <div className={`absolute ${mobile ? 'top-[124px] right-3' : 'right-5 bottom-5'}`}>
              <Credit />
            </div>
          )}

          {mobile && !selecionado && (
            <div className="absolute inset-x-3 bottom-3 pb-[env(safe-area-inset-bottom)]">
              <MobileDock />
            </div>
          )}
          {!mobile && <UnitCard />}
        </div>
      </main>

      {!mobile && (
        <aside className={`glass-strong relative z-30 h-full shrink-0 !rounded-none border-y-0 border-r-0 ${compactTable ? 'w-[340px]' : 'w-[430px]'}`}>
          <UnitTable compact={compactTable} />
        </aside>
      )}

      {mobile && <UnitCard />}
      {mobile && (
        <AnimatePresence>
          {tabelaAberta && (
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 32 }}
              className="glass-strong fixed inset-x-0 bottom-0 z-40 h-[78vh] rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
            >
              <UnitTable compact onClose={() => useStore.getState().set({ tabelaAberta: false })} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <HoverCard />
      <Loader />
    </div>
  )
}

function NoWebGL() {
  useEffect(() => useStore.getState().set({ cenaCarregada: true, pronto: true }), [])
  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <div className="glass max-w-md rounded-2xl p-5 text-center text-[13px] leading-relaxed text-muted">
        Este aparelho não liberou gráficos 3D (WebGL 2). A tabela de vendas continua funcionando normalmente.
      </div>
    </div>
  )
}
