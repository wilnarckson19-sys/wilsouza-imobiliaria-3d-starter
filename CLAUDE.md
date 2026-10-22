# Instruções para o Claude Code

Este projeto é o **Tabela Imobiliária 3D · Starter Kit**, da WilSouza.ai. Quem abre esta pasta costuma ser
uma pessoa que **nunca programou** e está fazendo o primeiro projeto com IA.

## Como conversar

- Responda em português do Brasil, com frases curtas e palavras simples.
- Explique termos técnicos na primeira vez que aparecerem ("terminal: a janela onde se digitam comandos").
- Antes de mudar arquivos, diga em uma frase o que vai fazer. Depois, diga o que mudou e como conferir na tela.
- Faça uma mudança de cada vez e confira que o sistema continua abrindo.
- Se a pessoa pedir algo que exige banco de dados, login ou serviço pago, explique isso antes de começar.

## Como rodar

- Precisa do Node.js 20.19 ou mais novo (`node -v`). Se não tiver, oriente a instalar a versão LTS em https://nodejs.org.
- `npm install` instala as bibliotecas (só na primeira vez).
- `npm run dev` abre o sistema em http://localhost:6240. Deixe rodando: a página se atualiza sozinha a cada arquivo salvo.
- `npm run typecheck` e `npm run build` conferem se está tudo certo antes de publicar.

## Onde fica cada coisa

- `src/config/empreendimento.ts`: nome, textos e cores. Comece as personalizações por aqui.
- `src/dados/apartamentos.ts`: a lista de apartamentos (número, andar, posição, área, quartos, suítes, vagas, valor, status).
  O prédio cresce conforme o maior andar da lista.
- `src/config/predio.ts`: medidas do prédio, janelas, varandas, cores da fachada, terreno e câmeras.
- `src/three/`: o 3D (React Three Fiber). `buildingGeometry.ts` gera o prédio a partir de `predio.ts`;
  `materials.ts` tem os shaders do vidro e do destaque das unidades.
- `src/ui/`: tabela, cartão do apartamento, controles. `src/store/store.ts` guarda o estado compartilhado
  (seleção, filtro, dia e noite) que mantém prédio e tabela sincronizados.

## Regras do projeto

- Os dados são fictícios. Não invente que são reais.
- Sem segredos no código: nada de senhas, tokens ou chaves.
- Mantenha o aviso de licença MIT (arquivo LICENSE).
- Posições dos apartamentos: 1 frente esquerda, 2 frente direita, 3 fundos direita, 4 fundos esquerda,
  sempre do ponto de vista de quem olha o prédio da rua.
