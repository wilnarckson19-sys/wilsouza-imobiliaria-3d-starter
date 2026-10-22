import { create } from 'zustand'
import { cena } from '@/config/empreendimento'
import { apartamentos } from '@/dados/apartamentos'
import type { Apartamento, Status } from '@/dados/tipos'

/*
 * Estado da tela: qual apartamento está selecionado, qual filtro está ligado, dia ou noite.
 * O prédio 3D e a tabela leem este mesmo estado, por isso ficam sempre sincronizados.
 */

export type Vista = 'inicio' | 'frente' | 'lateral' | 'fundos' | 'aerea'
export type Filtro = Status | 'todos'

interface Estado {
  /** número do apartamento selecionado ("504") */
  selecionado: string | null
  /** apartamento sob o mouse, no prédio ou na tabela */
  emFoco: string | null
  /** de onde veio o foco: do prédio ou da tabela (o cartão flutuante só aparece no prédio) */
  origemFoco: '3d' | 'tabela'
  filtro: Filtro
  destacar: boolean
  noite: boolean
  girar: boolean
  vista: Vista
  /** muda a cada clique em uma vista, para a câmera voar mesmo repetindo a vista */
  vistaPedido: number
  /** abertura terminou (a câmera chegou ao prédio) */
  pronto: boolean
  /** tabela aberta no celular */
  tabelaAberta: boolean
  /** a cena 3D desenhou o primeiro quadro (some a tela de carregamento) */
  cenaCarregada: boolean
  /** a pessoa já abriu algum apartamento (some a dica) */
  tocou: boolean

  selecionar: (numero: string | null) => void
  focar: (numero: string | null, origem?: '3d' | 'tabela') => void
  mudarVista: (v: Vista) => void
  set: (p: Partial<Estado>) => void
}

export const useStore = create<Estado>()((set, get) => ({
  selecionado: null,
  emFoco: null,
  origemFoco: '3d',
  filtro: 'todos',
  destacar: cena.destacarAoAbrir,
  noite: cena.comecarDeNoite,
  girar: false,
  vista: 'inicio',
  vistaPedido: 0,
  pronto: false,
  tabelaAberta: false,
  cenaCarregada: false,
  tocou: false,

  selecionar: (numero) => set((s) => ({ selecionado: numero, girar: false, tocou: s.tocou || !!numero })),
  focar: (numero, origem = '3d') => {
    const s = get()
    if (s.emFoco !== numero || s.origemFoco !== origem) set({ emFoco: numero, origemFoco: origem })
  },
  mudarVista: (v) => set((s) => ({ vista: v, vistaPedido: s.vistaPedido + 1, selecionado: null })),
  set: (p) => set(p),
}))

/* ---------- acesso rápido aos apartamentos ---------- */

export const POR_NUMERO = new Map<string, Apartamento>(apartamentos.map((a) => [a.numero, a]))

/** posição de cada apartamento na lista; o 3D usa esse número para pintar a unidade certa */
export const INDICE = new Map<string, number>(apartamentos.map((a, i) => [a.numero, i]))

/** o apartamento que ocupa um andar e uma posição, se existir na lista */
export const indiceEm = (andar: number, posicao: number) =>
  apartamentos.findIndex((a) => a.andar === andar && a.posicao === posicao)

/** maior andar cadastrado: define a altura do prédio */
export const TOTAL_ANDARES = Math.max(1, ...apartamentos.map((a) => a.andar))

export function contagem(lista: Apartamento[] = apartamentos) {
  const c = { total: lista.length, disponivel: 0, reservado: 0, vendido: 0 }
  for (const a of lista) c[a.status]++
  return c
}
