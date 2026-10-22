import { create } from 'zustand'

/** posição do mouse para o cartão flutuante; separado do estado principal para não redesenhar a cena */
export const usePointer = create<{ x: number; y: number }>(() => ({ x: 0, y: 0 }))
