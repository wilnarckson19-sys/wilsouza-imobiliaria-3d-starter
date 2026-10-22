import type { Janela, Planta, PoseCamera, Predio } from '@/dados/tipos'

/*
 * DESENHO DO PRÉDIO (avançado)
 *
 * Medidas em metros. O centro do prédio fica no ponto 0,0. Vista de cima, com a rua embaixo;
 * esquerda e direita são de quem olha o prédio da rua:
 *
 *                 fundos
 *         ┌──────────┬──────────┐
 *         │    4     │    3     │
 *         │          │          │
 *         ├───── elevadores ────┤
 *         │    1     │    2     │
 *         │          │          │
 *         └──────────┴──────────┘
 *                 frente
 *                  rua
 *
 * A quantidade de andares vem da lista de apartamentos: se você cadastrar o 13º andar, o prédio cresce.
 */

const sala = (face: Janela['face'], centro: number, largura: number, varanda: number): Janela => ({
  face,
  centro,
  largura,
  altura: 2.35,
  peitoril: 0.1,
  comodo: 'sala',
  varanda,
})

const quarto = (face: Janela['face'], centro: number): Janela => ({
  face,
  centro,
  largura: 1.6,
  altura: 1.3,
  peitoril: 1.0,
  comodo: 'quarto',
  ar: true,
})

// no 3D, x positivo fica à esquerda de quem olha da rua (face nz = frente, px = lateral esquerda)
const plantas: Planta[] = [
  {
    posicao: 1,
    retangulo: [1.3, -9, 15, 0],
    faces: ['nz', 'px'],
    janelas: [sala('nz', 9.4, 5.0, 1.9), quarto('nz', 3.2), quarto('px', -6.2), quarto('px', -2.4)],
    vista: 'Frente',
  },
  {
    posicao: 2,
    retangulo: [-15, -9, -1.3, 0],
    faces: ['nz', 'nx'],
    janelas: [sala('nz', -9.4, 5.0, 1.9), quarto('nz', -3.2), quarto('nx', -6.2), quarto('nx', -2.4)],
    vista: 'Frente',
  },
  {
    posicao: 3,
    retangulo: [-15, 0, -1.3, 9],
    faces: ['pz', 'nx'],
    janelas: [sala('pz', -9.4, 4.4, 1.6), quarto('pz', -3.2), quarto('nx', 2.4)],
    vista: 'Fundos',
  },
  {
    posicao: 4,
    retangulo: [1.3, 0, 15, 9],
    faces: ['pz', 'px'],
    janelas: [sala('pz', 9.4, 4.4, 1.6), quarto('pz', 3.2), quarto('px', 2.4)],
    vista: 'Fundos',
  },
]

export const predio: Predio = {
  comprimento: 30,
  profundidade: 18,
  alturaAndar: 3,
  alturaTerreo: 4.5,
  plantas,
  nucleo: [-2.4, -3.2, 2.4, 3.2],
  cores: {
    parede: '#ece8e1',
    faixa: '#cdc5b8',
    destaque: '#a87f4f',
    base: '#2b2e34',
  },
}

/** posições da câmera: pos = onde a câmera fica, alvo = para onde ela olha */
export const cameras: Record<'inicio' | 'frente' | 'lateral' | 'fundos' | 'aerea' | 'abertura', PoseCamera> = {
  inicio: { pos: [-78, 14, -92], alvo: [0, 21, 0] },
  frente: { pos: [0, 18, -112], alvo: [0, 21, 0] },
  lateral: { pos: [-112, 20, 0], alvo: [0, 21, 0] },
  fundos: { pos: [0, 18, 112], alvo: [0, 21, 0] },
  aerea: { pos: [-62, 128, -78], alvo: [0, 8, 0] },
  abertura: { pos: [-230, 190, -280], alvo: [0, 18, 0] },
}

/** terreno do condomínio, piscina e árvores (pontos [x, z] em metros) */
export const terreno = {
  lote: [
    [-36, -30],
    [36, -30],
    [36, 42],
    [-36, 42],
  ] as [number, number][],
  rua: [
    [-900, -43],
    [900, -43],
    [900, -31],
    [-900, -31],
  ] as [number, number][],
  piscina: [
    [-12, 19],
    [8, 19],
    [8, 26],
    [-12, 26],
  ] as [number, number][],
  deck: [
    [-15.5, 16.5],
    [11.5, 16.5],
    [11.5, 28.5],
    [-15.5, 28.5],
  ] as [number, number][],
  gramados: [
    [
      [-36, 31],
      [36, 31],
      [36, 42],
      [-36, 42],
    ],
    [
      [18, 14],
      [36, 14],
      [36, 31],
      [18, 31],
    ],
    [
      [-36, -30],
      [-20, -30],
      [-20, -14],
      [-36, -14],
    ],
    [
      [20, -30],
      [36, -30],
      [36, -14],
      [20, -14],
    ],
  ] as [number, number][][],
  /** árvores: [x, z, tamanho] */
  arvores: [
    [-30, -24, 3.6],
    [-24, -19, 3.1],
    [26, -24, 3.6],
    [31, -18, 3.2],
    [-31, 2, 3.8],
    [31, -2, 3.6],
    [-30, 16, 3.4],
    [24, 20, 4.2],
    [31, 27, 3.4],
    [-28, 36, 3.8],
    [-14, 37, 3.4],
    [2, 37, 3.6],
    [16, 37, 3.8],
    [30, 37, 3.2],
  ] as [number, number, number][],
  portao: [0, -30] as [number, number],
}
