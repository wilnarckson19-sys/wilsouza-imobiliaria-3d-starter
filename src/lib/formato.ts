/* Formatação de números no padrão brasileiro: R$ 689.000,00 · 98,40 m² */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const num2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const dinheiro = (v: number) => brl.format(v)
export const dinheiroCurto = (v: number) => brl0.format(v)
export const metros = (v: number) => `${num2.format(v)} m²`
export const andarCurto = (andar: number) => `${andar}º`
export const andarLongo = (andar: number) => `${andar}º andar`
export const porcento = (v: number) => `${Math.round(v)}%`

/** sorteio com semente fixa: o mesmo número sempre gera a mesma sequência (árvores, entorno) */
export function sorteio(semente: number) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
