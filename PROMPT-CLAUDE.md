# Prompt para usar no Claude Code

Abra esta pasta no Claude Code, copie o texto do quadro abaixo (do começo ao fim) e cole na conversa.

```text
Olá, Claude! Eu não sei programar e este é o meu primeiro projeto com IA.
Esta pasta é o "Tabela Imobiliária 3D · Starter Kit", da WilSouza.ai: um prédio em 3D ligado a uma
tabela de vendas de apartamentos.

Quero que você seja meu guia. Por favor:

1. Analise o projeto e me explique, em linguagem simples e em poucos parágrafos:
   - o que o sistema faz;
   - quais pastas e arquivos são os mais importantes e para que serve cada um;
   - onde ficam os dados dos apartamentos e onde ficam os textos e as cores.

2. Confira se o meu computador tem o Node.js instalado. Se não tiver, me explique como instalar.
   Depois instale as dependências do projeto e coloque o sistema para rodar. Me diga o endereço
   para eu abrir no navegador.

3. Me mostre 3 mudanças fáceis que eu posso pedir para começar (por exemplo: trocar o nome do
   empreendimento, mudar o preço de um apartamento, mudar uma cor), e espere eu escolher.

Regras para a nossa conversa:
- Fale comigo em português, sem termos técnicos. Quando precisar usar um, explique.
- Antes de mudar qualquer arquivo, me diga em uma frase o que vai fazer.
- Faça uma mudança de cada vez e me diga como conferir o resultado na tela.
- Se algo der erro, me explique o que aconteceu e conserte.
- Se eu pedir algo que precise de internet, banco de dados, login ou serviço pago, me avise antes.
```

## Depois do primeiro prompt: ideias para pedir

Copie, troque o que estiver entre colchetes e cole no Claude Code.

**Personalizar**

- `Troque o nome do empreendimento para [Nome do seu prédio] e a cidade para [Sua cidade].`
- `Mude o valor do apartamento [504] para [R$ 650.000] e a situação dele para reservado.`
- `Marque como vendidos todos os apartamentos do [3º] andar.`
- `Aumente em [5%] o valor de todos os apartamentos disponíveis.`
- `Troque a cor de destaque da interface para [azul-marinho] e a cor dos disponíveis para [azul-claro].`
- `Mude a cor da fachada do prédio para [cinza-claro] e a faixa central para [verde-escuro].`

**Novas funcionalidades**

- `Acrescente um 13º e um 14º andar, com 4 apartamentos cada, seguindo o padrão de preços dos andares de baixo.`
- `Crie um filtro de faixa de preço na tabela, com valor mínimo e máximo.`
- `Adicione no cartão do apartamento um botão "Tenho interesse" que abre o WhatsApp com uma mensagem pronta citando o número do apartamento. Use o número [55 DDD número].`
- `Mostre na tabela o valor do metro quadrado de cada apartamento.`
- `Crie um botão para baixar a tabela em planilha (CSV).`
- `Faça os apartamentos de cobertura (último andar) aparecerem com um selo "Cobertura".`

**Entender o código**

- `Me explique, como se eu tivesse 12 anos, como o clique no prédio chega até a tabela.`
- `Qual arquivo desenha as janelas acesas à noite? Me mostre o trecho e explique.`

## Dicas

- Seja específico: diga o número do apartamento, o valor exato, a cor que você quer.
- Peça uma coisa de cada vez. Se gostar, peça a próxima.
- Se não gostou do resultado, diga: `Desfaça a última mudança.`
- Quando terminar uma sessão de mudanças, peça: `Rode o typecheck e o build e me diga se está tudo certo.`
