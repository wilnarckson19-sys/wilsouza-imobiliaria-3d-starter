/*
 * Tipos de dados do projeto. "Tipo" é a forma que um dado precisa ter: por exemplo, todo apartamento
 * precisa ter número, andar, área e valor. Se faltar algo, o editor avisa antes de o sistema quebrar.
 */

/** situação comercial do apartamento */
export type Status = 'disponivel' | 'reservado' | 'vendido'

/** posição do apartamento no andar (veja o desenho em src/config/predio.ts) */
export type Posicao = 1 | 2 | 3 | 4

export interface Apartamento {
  /** número que aparece na tabela e no prédio, por exemplo "504" */
  numero: string
  /** andar de 1 a 12 (o térreo é a portaria) */
  andar: number
  /** 1 frente esquerda, 2 frente direita, 3 fundos direita, 4 fundos esquerda (olhando da rua) */
  posicao: Posicao
  /** área privativa em metros quadrados */
  area: number
  quartos: number
  suites: number
  vagas: number
  /** valor em reais, sem pontos: 689000 = R$ 689.000,00 */
  valor: number
  status: Status
}

/** faces do prédio: nz = frente, pz = fundos, px = lateral esquerda, nx = lateral direita (olhando da rua) */
export type Face = 'nz' | 'pz' | 'nx' | 'px'

/** janela de um apartamento; com `varanda` vira porta de vidro com sacada */
export interface Janela {
  face: Face
  /** centro da janela ao longo da face, em metros a partir do meio do prédio */
  centro: number
  largura: number
  altura: number
  /** altura do peitoril (do piso até a base da janela) */
  peitoril: number
  /** cômodo atrás do vidro, usado no desenho do interior */
  comodo: 'sala' | 'quarto'
  /** profundidade da varanda em metros */
  varanda?: number
  /** ar-condicionado ao lado da janela */
  ar?: boolean
}

/** área de um apartamento dentro do andar */
export interface Planta {
  posicao: Posicao
  /** retângulo em planta: [x0, z0, x1, z1] em metros */
  retangulo: [number, number, number, number]
  /** faces do prédio onde o apartamento aparece (a primeira é a principal) */
  faces: Face[]
  janelas: Janela[]
  /** como o apartamento é descrito: "Frente", "Fundos" */
  vista: string
}

export interface Predio {
  /** comprimento da fachada principal e profundidade, em metros */
  comprimento: number
  profundidade: number
  alturaAndar: number
  /** altura do térreo (portaria), que costuma ser mais alto */
  alturaTerreo: number
  plantas: Planta[]
  /** caixa de escada e elevadores: [x0, z0, x1, z1] */
  nucleo: [number, number, number, number]
  cores: {
    parede: string
    faixa: string
    destaque: string
    base: string
  }
}

export interface PoseCamera {
  pos: [number, number, number]
  alvo: [number, number, number]
}
