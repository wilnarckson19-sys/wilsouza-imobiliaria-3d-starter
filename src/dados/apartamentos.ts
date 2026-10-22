import type { Apartamento } from './tipos'

/*
 * LISTA DE APARTAMENTOS
 *
 * Cada linha é um apartamento. Para mudar preço ou situação, edite a linha e salve o arquivo:
 * o prédio 3D e a tabela se atualizam sozinhos.
 *
 *   numero   como aparece na tela ("504")
 *   andar    de 1 a 12
 *   posicao  1 frente esquerda, 2 frente direita, 3 fundos direita, 4 fundos esquerda
 *            (esquerda e direita de quem olha o prédio da rua)
 *   area     metros quadrados (use ponto para os centavos: 98.40)
 *   valor    em reais, sem pontos (689000 = R$ 689.000,00)
 *   status   'disponivel', 'reservado' ou 'vendido'
 *
 * Todos os dados são FICTÍCIOS, criados só para demonstração.
 */

export const apartamentos: Apartamento[] = [
  // 1º andar
  { numero: '101', andar: 1, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 689000, status: 'disponivel' },
  { numero: '102', andar: 1, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 697300, status: 'vendido' },
  { numero: '103', andar: 1, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 501000, status: 'vendido' },
  { numero: '104', andar: 1, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 498000, status: 'reservado' },

  // 2º andar
  { numero: '201', andar: 2, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 696600, status: 'disponivel' },
  { numero: '202', andar: 2, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 704900, status: 'disponivel' },
  { numero: '203', andar: 2, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 506500, status: 'vendido' },
  { numero: '204', andar: 2, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 503500, status: 'disponivel' },

  // 3º andar
  { numero: '301', andar: 3, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 704200, status: 'reservado' },
  { numero: '302', andar: 3, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 712600, status: 'vendido' },
  { numero: '303', andar: 3, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 512000, status: 'vendido' },
  { numero: '304', andar: 3, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 509000, status: 'disponivel' },

  // 4º andar
  { numero: '401', andar: 4, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 711700, status: 'vendido' },
  { numero: '402', andar: 4, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 720300, status: 'vendido' },
  { numero: '403', andar: 4, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 517500, status: 'vendido' },
  { numero: '404', andar: 4, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 514400, status: 'vendido' },

  // 5º andar
  { numero: '501', andar: 5, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 719300, status: 'vendido' },
  { numero: '502', andar: 5, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 727900, status: 'reservado' },
  { numero: '503', andar: 5, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 523000, status: 'vendido' },
  { numero: '504', andar: 5, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 519900, status: 'disponivel' },

  // 6º andar
  { numero: '601', andar: 6, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 726900, status: 'reservado' },
  { numero: '602', andar: 6, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 735600, status: 'vendido' },
  { numero: '603', andar: 6, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 528500, status: 'disponivel' },
  { numero: '604', andar: 6, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 525400, status: 'vendido' },

  // 7º andar
  { numero: '701', andar: 7, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 734500, status: 'disponivel' },
  { numero: '702', andar: 7, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 743300, status: 'reservado' },
  { numero: '703', andar: 7, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 534100, status: 'disponivel' },
  { numero: '704', andar: 7, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 530900, status: 'vendido' },

  // 8º andar
  { numero: '801', andar: 8, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 742100, status: 'vendido' },
  { numero: '802', andar: 8, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 751000, status: 'vendido' },
  { numero: '803', andar: 8, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 539600, status: 'vendido' },
  { numero: '804', andar: 8, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 536300, status: 'disponivel' },

  // 9º andar
  { numero: '901', andar: 9, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 749600, status: 'disponivel' },
  { numero: '902', andar: 9, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 758600, status: 'reservado' },
  { numero: '903', andar: 9, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 545100, status: 'vendido' },
  { numero: '904', andar: 9, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 541800, status: 'disponivel' },

  // 10º andar
  { numero: '1001', andar: 10, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 757200, status: 'disponivel' },
  { numero: '1002', andar: 10, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 766300, status: 'vendido' },
  { numero: '1003', andar: 10, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 550600, status: 'vendido' },
  { numero: '1004', andar: 10, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 547300, status: 'disponivel' },

  // 11º andar
  { numero: '1101', andar: 11, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 764800, status: 'vendido' },
  { numero: '1102', andar: 11, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 774000, status: 'disponivel' },
  { numero: '1103', andar: 11, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 556100, status: 'vendido' },
  { numero: '1104', andar: 11, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 552800, status: 'vendido' },

  // 12º andar
  { numero: '1201', andar: 12, posicao: 1, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 772400, status: 'reservado' },
  { numero: '1202', andar: 12, posicao: 2, area: 98.40, quartos: 3, suites: 1, vagas: 2, valor: 781600, status: 'vendido' },
  { numero: '1203', andar: 12, posicao: 3, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 561600, status: 'disponivel' },
  { numero: '1204', andar: 12, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 558300, status: 'vendido' },
]
