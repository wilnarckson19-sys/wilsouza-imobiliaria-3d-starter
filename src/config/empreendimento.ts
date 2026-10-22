/*
 * CONFIGURAÇÃO DO EMPREENDIMENTO
 *
 * Este é o arquivo para personalizar o sistema sem mexer no código 3D: nome, textos e cores.
 * Salve o arquivo e a página se atualiza sozinha.
 *
 * Os dados que vêm de fábrica são FICTÍCIOS. Troque pelos do seu projeto.
 */

export const empreendimento = {
  nome: 'Residencial Horizonte',
  /** frase curta abaixo do nome */
  subtitulo: 'Tabela de vendas em 3D',
  construtora: 'Construtora Exemplo',
  cidade: 'Cidade Exemplo',
  /** mês da tabela de preços */
  atualizadoEm: 'Outubro de 2026',
  /** aviso que aparece no rodapé da tabela */
  aviso: 'Empreendimento, valores, áreas e situação das unidades são fictícios, criados para demonstração.',
  /** itens de lazer mostrados no cartão do apartamento */
  lazer: ['Piscina com deck', 'Academia', 'Espaço gourmet', 'Playground'],
}

/** cores das situações dos apartamentos e da interface (código de cor em hexadecimal) */
export const cores = {
  disponivel: '#34d399',
  reservado: '#fbbf24',
  vendido: '#f87171',
  /** cor de destaque da interface: botões, seleção e detalhes */
  destaque: '#d2a15a',
}

/** como a cena começa */
export const cena = {
  /** true começa à noite (janelas acesas = vendidas), false começa de dia */
  comecarDeNoite: true,
  /** liga o destaque colorido das unidades assim que a página abre */
  destacarAoAbrir: true,
}

/** créditos do Starter Kit. A licença MIT pede que o aviso de autoria continue no código. */
export const creditos = {
  texto: 'Starter Kit criado por WilSouza.ai',
  link: 'https://wilsouza.com',
}
