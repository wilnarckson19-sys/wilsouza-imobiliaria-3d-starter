# Como executar e modificar seu primeiro sistema 3D com IA

Guia para quem **nunca programou**. Você não vai precisar escrever código: vai conversar com a IA em português, e ela faz o trabalho técnico enquanto explica o que está acontecendo.

Tempo estimado na primeira vez: de 30 a 45 minutos, contando as instalações.

---

## 1. O que você vai conseguir fazer

Ao final deste guia, você terá:

- o sistema **Tabela Imobiliária 3D** rodando no seu computador, com o prédio em 3D e a tabela de vendas;
- trocado o nome do empreendimento pelo nome que você quiser;
- mudado preços e a situação de apartamentos (disponível, reservado, vendido);
- mudado cores e textos;
- pedido uma funcionalidade nova para a IA, só descrevendo o que quer.

Tudo isso conversando com o **Claude Code**, uma IA da Anthropic que lê e altera os arquivos do projeto no seu computador.

### O que é o quê (pequeno dicionário)

| Palavra | O que significa |
|---|---|
| **Projeto** | A pasta com todos os arquivos do sistema. |
| **Código** | O texto, escrito em uma linguagem de programação, que diz ao computador o que fazer. |
| **GitHub** | Um site onde programadores guardam e compartilham projetos. É de lá que você vai baixar este. |
| **ZIP** | Um arquivo compactado. Você clica duas vezes nele e vira uma pasta normal. |
| **Node.js** | Um programa gratuito que permite rodar este tipo de sistema no seu computador. |
| **Dependências** | Peças prontas (bibliotecas) que o projeto usa, como a que desenha o 3D. São baixadas da internet uma única vez. |
| **Terminal** | Uma janela onde se digitam comandos. O Claude Code usa por você; você só aprova. |
| **Servidor local** | O sistema rodando só no seu computador, como se fosse um site particular. |
| **localhost** | O endereço do seu próprio computador. `http://localhost:6240` abre o sistema no navegador. |

---

## 2. Instalar as ferramentas

Você vai instalar duas coisas: o **Node.js** e o **Claude** (aplicativo para computador).

### 2.1 Node.js

1. Acesse **https://nodejs.org**.
2. Baixe a versão marcada como **LTS** (é a mais estável).
3. Abra o arquivo baixado e siga o instalador clicando em "Continuar" ou "Next" até o fim. Pode deixar todas as opções como vieram.

Funciona no Mac e no Windows. Se tiver dúvida se instalou certo, não se preocupe: no passo 5 o Claude confere para você.

### 2.2 Claude (aplicativo com o Claude Code)

1. Acesse **https://claude.com/download** e baixe o aplicativo para o seu sistema (Mac ou Windows).
2. Instale e entre com a sua conta da Claude.

> **Importante:** o Claude Code faz parte dos **planos pagos** da Claude (Pro ou superior). O plano gratuito não inclui o Claude Code. Os valores atualizados estão em https://claude.com/pricing. O Starter Kit em si é gratuito e não usa nenhum serviço pago: o plano é só para conversar com a IA.

O aplicativo já traz o Claude Code dentro, na aba **Code**. Não é preciso instalar mais nada nem abrir o terminal.

*Já usa terminal?* Também dá para instalar o Claude Code pela linha de comando, seguindo https://code.claude.com/docs/en/setup.

---

## 3. Baixar o código pelo GitHub

Você tem dois caminhos. Os dois entregam o mesmo projeto.

**Pela página de acesso do kit (mais simples)**

1. Na página que abriu depois do cadastro, clique em **Baixar ZIP**.
2. Abra o arquivo baixado (clique duas vezes). Vai aparecer a pasta `wilsouza-imobiliaria-3d-starter`.

**Pelo GitHub**

1. Abra a página do projeto no GitHub (o link também está na página de acesso).
2. Clique no botão verde **Code**.
3. Clique em **Download ZIP**.
4. Abra o arquivo baixado. A pasta vai se chamar `wilsouza-imobiliaria-3d-starter-main`.

Depois, nos dois casos, mova a pasta para um lugar fácil de achar, como **Documentos**.

Dica: se quiser, renomeie a pasta para `meu-predio-3d`. O nome da pasta não muda nada no sistema.

---

## 4. Abrir o projeto no Claude Code

1. Abra o aplicativo **Claude**.
2. Clique na aba **Code**, no alto da barra lateral.
3. Embaixo da caixa de mensagem, no seletor de ambiente, escolha a opção **Local** (seu computador).
4. Clique no seletor de pasta ao lado e escolha **Open folder…** (Abrir pasta).
5. Selecione a pasta do projeto que você moveu para Documentos (a pasta que tem o arquivo `package.json` dentro).

Pronto: o Claude agora "enxerga" os arquivos do projeto. Este projeto tem um arquivo chamado `CLAUDE.md` com instruções para a IA falar com você de forma simples, em português.

---

## 5. Pedir ao Claude para instalar as dependências

Abra o arquivo **PROMPT-CLAUDE.md** do projeto, copie o primeiro prompt (o texto do quadro) e cole na conversa. Ou escreva com suas palavras:

```text
Eu não sei programar. Confira se o Node.js está instalado, instale as dependências
deste projeto e me explique o que você fez.
```

O Claude vai propor rodar comandos como `node -v` (confere a versão do Node.js) e `npm install` (baixa as dependências). Antes de rodar um comando, ele pede sua permissão. Quando aparecer a pergunta, leia o que ele quer fazer e clique em **Yes** (Sim) para aprovar.

O `npm install` demora de 1 a 3 minutos e cria uma pasta chamada `node_modules`. Ela é grande e é normal: são as peças prontas que o sistema usa.

> **Regra de ouro:** aprove comandos que você entende para que servem. Se não entender, pergunte: "Para que serve esse comando?". O Claude explica antes de rodar.

---

## 6. Executar o sistema no seu computador

Peça na conversa:

```text
Coloque o sistema para rodar e me diga o endereço para abrir no navegador.
```

O Claude vai rodar `npm run dev`, que liga o servidor local. Quando terminar, abra no navegador:

**http://localhost:6240**

Você vai ver a tela de carregamento, a câmera voando até o prédio e, em seguida, o sistema completo. Experimente:

- clicar em um apartamento colorido no prédio;
- passar o mouse nas linhas da tabela à direita e ver o apartamento acender no 3D;
- clicar em **Disponíveis** no filtro da tabela;
- trocar entre noite e dia e usar as vistas (Frente, Fundos, Aérea).

Deixe o servidor rodando enquanto faz mudanças: **a página se atualiza sozinha** cada vez que um arquivo é salvo.

Para desligar, peça ao Claude: `Pare o servidor.` Para ligar de novo outro dia, abra a mesma pasta no Claude Code e peça: `Coloque o sistema para rodar.`

---

## 7. Alterar o nome do empreendimento

Peça:

```text
Troque o nome do empreendimento para "Edifício Jardim das Flores" e a cidade para "Campinas".
```

Volte ao navegador: o nome mudou no topo e na tabela.

**Por dentro:** o Claude alterou o arquivo `src/config/empreendimento.ts`. Se quiser ver, peça `Me mostre o arquivo de configuração e explique cada parte.` Você também pode abrir esse arquivo em qualquer editor de texto e trocar o que está entre aspas.

---

## 8. Mudar preços e apartamentos

Os apartamentos ficam no arquivo `src/dados/apartamentos.ts`. Cada linha é um apartamento:

```ts
{ numero: '504', andar: 5, posicao: 4, area: 72.15, quartos: 2, suites: 1, vagas: 1, valor: 519900, status: 'disponivel' },
```

Exemplos de pedidos:

```text
Mude o valor do apartamento 504 para R$ 549.900 e marque ele como reservado.
```

```text
Marque como vendidos todos os apartamentos do 3º andar.
```

```text
Aumente em 4% o valor de todos os apartamentos disponíveis e me diga quais mudaram.
```

```text
Acrescente um 13º andar com 4 apartamentos, seguindo o padrão dos andares de baixo.
```

O prédio 3D acompanha a lista: com o 13º andar cadastrado, ele ganha um andar a mais.

---

## 9. Modificar cores e textos

As cores ficam no mesmo arquivo do nome, `src/config/empreendimento.ts`, no bloco `cores`. Você não precisa saber o código da cor: descreva.

```text
Troque a cor de destaque da interface para um azul-marinho elegante.
```

```text
Use azul-claro para os apartamentos disponíveis e cinza para os vendidos.
```

```text
Mude a cor da fachada do prédio para um cinza-claro e a faixa central para verde-escuro.
```

```text
Troque o subtítulo para "Lançamento 2027" e o aviso do rodapé por um texto que eu vou te passar.
```

---

## 10. Pedir funcionalidades novas em linguagem natural

Aqui está a parte mais poderosa: você descreve o que quer e o Claude constrói. Alguns exemplos:

```text
Crie um filtro de faixa de preço na tabela, com valor mínimo e máximo.
```

```text
No cartão do apartamento, adicione um botão "Tenho interesse" que abre o WhatsApp
com uma mensagem pronta citando o número do apartamento. Use o número 55 11 99999-9999.
```

```text
Crie um botão para baixar a tabela de apartamentos em planilha.
```

```text
Faça os apartamentos do último andar aparecerem com um selo "Cobertura".
```

### Como pedir bem

1. **Diga o resultado, não o código.** "Quero um botão que faça X quando eu clicar" funciona melhor do que tentar adivinhar termos técnicos.
2. **Seja específico.** Diga o número do apartamento, o valor, a cor, o texto exato.
3. **Uma coisa de cada vez.** Confira na tela e só então peça a próxima.
4. **Dê retorno.** "Ficou bom, mas o botão está grande demais" é um ótimo pedido.
5. **Pode voltar atrás.** Se não gostou, peça: `Desfaça a última mudança.`
6. **Peça para conferir.** No fim, peça: `Rode o typecheck e o build e me diga se está tudo certo.`

---

## Se algo der errado

| O que aconteceu | O que fazer |
|---|---|
| "node: command not found" ou "node não é reconhecido" | O Node.js não está instalado ou o computador ainda não reconheceu. Instale (passo 2.1), feche e abra o aplicativo Claude e tente de novo. |
| "Port 6240 is already in use" (porta ocupada) | O sistema já está rodando em outra janela. Peça: `Feche o servidor que está usando a porta 6240 e rode de novo.` |
| A página abre, mas o prédio não aparece | O navegador pode estar sem aceleração 3D (WebGL). Teste no Chrome ou no Edge atualizados. A tabela continua funcionando. |
| Mudei o arquivo e nada aconteceu | Confira se o servidor está rodando e se o arquivo foi salvo. Recarregue a página. |
| Apareceu um erro vermelho na tela | Copie o texto do erro, cole na conversa e peça: `Apareceu este erro, conserte e me explique o que era.` |

---

## Próximos passos

Você acabou de rodar e modificar um sistema real usando IA. Este Starter Kit é uma parte de um sistema completo de vendas imobiliárias. Na versão completa entram painel de gestão, vários empreendimentos, banco de dados, login de corretores, integração com CRM e WhatsApp, propostas e relatórios.

Quer aprender a criar sistemas completos com IA, mesmo sem saber programar? Acompanhe a **WilSouza.ai** no Instagram, [@wilsouza.ai](https://instagram.com/wilsouza.ai), e entre na lista de espera do curso pela página onde você baixou este kit.
