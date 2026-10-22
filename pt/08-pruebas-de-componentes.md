# Lição 8 — Testes de componentes

*São 12h15 de uma quinta-feira e a versão nova do `revisor` sai às 13h00. Alguém da equipe subiu uma mudança de «limpeza»: tirou do resumo um `> 0` que «sobrava» e devolveu ao botão do cadastro o seu `disabled={pending}`, porque «`aria-disabled` é uma invenção estranha». O linter não diz nada. O `npm run build` termina bem. A revisão de código aprova em dois minutos, porque cada mudança, isolada, parece razoável. Ninguém tem tempo de abrir as cinco telas, esvaziar a API para ver o relatório sem falhas e percorrer o cadastro com o teclado. Se sair assim, o painel vai pintar um `0` solto toda vez que estiver tudo bem, e Raúl, o colega de plantão que trabalha com um leitor de tela, vai perder o foco de novo no exato momento de enviar, como na lição 7. Faltam quarenta e cinco minutos. O que a gente precisa é de algo que faça esse percurso por nós em dois segundos, toda vez que alguém mudar uma linha, e que fique vermelho justamente nesses dois lugares. É isso que esta lição constrói. E também vai se ver que parte desse percurso nenhum teste em Node consegue fazer por nós.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 8.2 e 8.3)

**O que se constrói:** a suíte do painel com Vitest e Testing Library: 27 testes em 7 arquivos, que montam a aplicação completa em um DOM de teste, com um roteador em memória e um `fetch` simulado, e que cobrem as funções puras, o reducer, o schema, os estados do relatório, o detalhe, as rotas, o error boundary e o formulário de cadastro

**O que se aprende:** consultas por role e por que elas importam para a acessibilidade; `getBy`, `queryBy`, `findBy`; `user-event`; `fetch` simulado; os quatro estados, o formulário e uma rota com um roteador em memória; **o teste que fica vermelho ao reverter a correção**; o que o jsdom NÃO consegue verificar

**De onde a gente vem.** Do ponto de controle da [Lição 7](07-formularios-accesibilidad.md): um `revisor` com a lista em `/`, o detalhe em `/servicios/:nombre`, o cadastro em `/servicios/nuevo` e uma página de «não encontrada»; os dados do servidor no TanStack Query; uma bandeja de avisos com seu reducer e seu contexto; e um formulário que é validado com um schema, marca seus erros com `aria-invalid` e `aria-describedby`, e não tira o foco do botão enquanto envia. Até aqui, tudo isso foi verificado com figuras que rodavam em um DOM de teste e com o Chrome *headless*, uma vez, manualmente. Do curso de TypeScript, quem o fez traz um teste com jsdom. Aqui isso não se repete: troca-se de ferramenta e, sobretudo, de pergunta. Já não é «esta função devolve o que eu digo?», e sim «esta tela faz o que uma pessoa espera?».

**O que esta lição não faz.** Não muda nem uma linha da aplicação: o JavaScript que o `npm run build` produz é idêntico, byte a byte, ao da lição 7. Tudo o que é novo são testes, a configuração que os executa e quatro arquivos de apoio. Não usa `@testing-library/jest-dom`, a biblioteca que acrescenta comparações como `toBeInTheDocument()`: os testes comparam `textContent` e atributos com o `expect` do Vitest, que basta e obriga a dizer exatamente o que se espera. Não usa `vi.mock` para substituir módulos da aplicação: a única coisa falsa é a rede, por razões explicadas em 8.3. Não escreve testes de ponta a ponta com um navegador real (Playwright, Cypress, o modo navegador do Vitest): nomeia-se o que essas ferramentas resolveriam e diz-se o que fica para verificar manualmente. E não mede cobertura: uma porcentagem de linhas executadas não diz se um teste ficaria vermelho diante do erro que importa, e esta lição ensina a verificar justamente isso.

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas do `package.json` desta lição. O ponto de controle foi instalado do zero com `npm ci` em uma cópia fora do repositório, e ali `npm run lint`, `npm run build` e `npm test` terminaram com código 0; o `npm run build` produziu `dist/assets/index-C_lOH5GL.js` (medido de novo em 22 de outubro de 2026, no macOS), o mesmo nome da lição 7. A contagem de testes foi lida do resumo do Vitest, não do código de saída. O terceiro teste de `PaginaServicio.test.tsx` (o do detalhe antigo, 8.3.4) foi acrescentado ao revisar a lição: viu-se vermelho com a página anterior (`1 failed | 26 passed (27)`) e verde com o ponto de controle, e as saídas do exercício 3 e da suíte completa foram executadas de novo com o ponto de controle novo. Todas as saídas do Vitest da lição foram tomadas com `--reporter=default` (ou `--reporter=verbose`, onde isso é dito), que é o que se veria em um terminal interativo; o reporter foi fixado de propósito porque, fora de um terminal, o Vitest pode escolher outro que oculta o console dos testes que passam (ver «O erro que vai aparecer»). A cópia de trabalho tinha ainda os arquivos dos exercícios 3 e 4; para a execução completa, passaram-se ao Vitest os caminhos dos sete arquivos do ponto de controle, o que equivale a rodar `npx vitest run` no ponto de controle. Cada teste que «fica vermelho» foi provocado nessa cópia, mudando um único arquivo, rodando apenas o arquivo de testes afetado e restaurando depois; ao terminar, a cópia foi comparada com o ponto de controle com `diff -r` e não tinha diferenças, salvo os arquivos de teste dos exercícios 3 e 4, que não fazem parte do ponto de controle. O ponto de controle também foi instalado do zero em um contêiner Linux (Debian 12, imagem oficial `node:24.22.0-bookworm`): ali o `npm run build` deu o mesmo nome de arquivo e o `npm test` terminou com código 0 e `Tests  27 passed (27)`. Nada foi executado em um Linux Mint real; nada do que se mostra depende do sistema, exceto as medidas em pixels da página gêmea no Chrome (linha 3 da figura 3), que dependem das fontes instaladas. O que importa ali é que o Chrome mede e o jsdom devolve zeros. As figuras foram executadas com seu próprio `package.json` em [`programas/08-pruebas-de-componentes/`](../programas/08-pruebas-de-componentes), ao lado de `revisor/`, como nas lições anteriores: são compiladas com `tsc` e executadas com `node`. A figura 3 tem ainda uma página HTML gêmea que foi aberta no Chrome 155.0.8059.85 *headless*, com `--headless --dump-dom` sobre o arquivo local, para comparar o que o jsdom faz com o que faz um navegador; essa execução não abriu nenhuma porta. O que **não** foi medido nesta lição, e é dito onde aparece: o percurso com o teclado em uma janela real e o som de um leitor de tela. Os dois foram medidos ou descritos na lição 7 e voltam aqui em «Como saber se deu certo». Nas saídas, os caminhos longos são mostrados a partir de `~/curso-react`. Os arquivos de teste dos exercícios e as saídas da suíte, do controle negativo e de cada reversão estão em `programas/08-pruebas-de-componentes/ejercicios/` (foram executados de novo ao aplicar a revisão, então seus horários e durações diferem dos colados aqui). O servidor de prática (o mesmo arquivo desde a lição 4) responde `400` com `{"detalle":"nombre de servicio inválido"}` a um endereço com um `%` malformado, como `/api/servicios/%`, e à sua rota `/reintento`; antes respondia `500`. Isso foi medido com `curl` contra uma cópia, antes e depois, e o processo continuou vivo nos dois casos.

## Ao terminar, vai ser possível

- Instalar Vitest, jsdom e Testing Library em um projeto Vite, configurar o ambiente de teste e explicar por que é preciso chamar `cleanup` manualmente quando o Vitest não expõe suas funções como globais.
- Encontrar um elemento por seu role e seu nome acessível, e demonstrar com uma figura que uma consulta por role não encontra um botão feito com um `<span>` nem um campo sem rótulo.
- Escolher entre `getBy`, `queryBy` e `findBy` conforme o que o teste afirma (que algo está, que algo não está, que algo vai chegar), e interpretar o erro que cada uma dá quando falha.
- Simular uma pessoa com `user-event`: digitar, pressionar Tab e Espaço, clicar, e explicar por que essas ações são esperadas com `await`.
- Montar a aplicação completa em um endereço com um roteador em memória, um cache novo e um `fetch` simulado, e testar com isso os estados do relatório, uma rota e o formulário de cadastro.
- Verificar que um teste protege uma correção: reverter a correção em uma cópia, ver o teste vermelho com a mensagem exata e restaurar, e reconhecer um teste verde que não fica vermelho.
- Nomear o que o jsdom não calcula (o layout, o foco que se perde ao desabilitar um botão) e projetar o teste para que verifique a causa quando o efeito não pode ser visto.

## O porquê antes do como

Até a lição 7, toda vez que o `revisor` mudava, alguém verificava se ele continuava funcionando. Fazia isso bem: com figuras que renderizavam um componente em um DOM de teste, com `curl` contra a API de prática, com o Chrome *headless* conduzido por um script. Mas fazia **uma vez**, no momento de escrever a lição. A cena do início é o que acontece na segunda vez: o código muda, o linter e o compilador continuam verdes, e ninguém repete o percurso. Pergunte ao painel quatro coisas e se verá o que falta.

**Quem se lembra dos casos raros?** O `0` solto da lição 1 só aparece quando **nenhum** serviço está em falha. A API de prática sempre começa com dois em falha. Para ver o erro seria preciso cadastrar serviços saudáveis, tentar de novo os que estão fora do ar ou esvaziar a API, e depois olhar o resumo. Ninguém faz isso antes de cada versão. Um teste faz, porque decide o que a API responde.

**Como testar o que depende da rede sem depender da rede?** O relatório tem quatro estados mais um: carregando, erro, vazio, com dados, e com dados antigos quando a atualização falha. Ver o de «carregando» em um navegador exige uma API lenta; ver o de erro, uma API fora do ar; o vazio, outra API. A API de prática tem a variável `ESCENARIO` para isso, mas subi-la três vezes com três valores não é algo que rode em dois segundos. Se o teste controla o que o `fetch` responde, cada estado é uma linha.

**Como saber que o teste olha o mesmo que olha a pessoa?** Um teste que procura `.boton-enviar` ou `div > button:nth-child(2)` passa mesmo que o botão tenha virado um `<span>` que um leitor de tela não anuncia e que o teclado não alcança. As consultas da Testing Library partem de outro lugar: do **role** e do **nome acessível**, que são o que o navegador entrega à tecnologia assistiva. Se um teste encontra «o botão chamado Dar de alta», esse botão está na árvore de acessibilidade com esse role e esse nome: um leitor de tela o anuncia assim. O que a consulta **não** verifica é que ele seja alcançado com Tab nem que responda a Enter ou Espaço; isso quem garante é o `<button>` nativo (lição 7) e, nesta suíte, quem o exercita é o teste do foco com `usuario.tab()` e `usuario.keyboard(" ")`. É o mesmo hábito da lição 7, agora automático.

**Como saber que o teste serve?** Esta é a pergunta que quase ninguém faz. Um teste verde diz que o código atual cumpre o que o teste afirma. Não diz que o teste ficaria vermelho se a correção desaparecesse. Há testes que passam com o código bom **e** com o ruim: não protegem nada e dão uma tranquilidade falsa. A única forma de saber é fazer o experimento: tirar a correção, ver o vermelho, restaurar. Esta lição faz isso com três testes da suíte (e um quarto no exercício 2) e ensina a reconhecer um que não passa no exame.

As quatro respostas cabem em três conceitos: consultar a página como faz uma pessoa (8.2), montar a aplicação completa sem rede nem navegador (8.3) e o teste que fica vermelho ao reverter a correção (8.4). Antes vem a instalação (8.1) e depois, com a mesma franqueza, o que o jsdom não consegue verificar (8.5). No final, isto é o que o `npm test` diz com o reporter detalhado, que imprime uma linha por teste:

```bash
$ npx vitest run --reporter=verbose
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/avisos/avisos.test.ts > reducirAvisos > agrega al principio con un identificador nuevo 1ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > descarta uno por su identificador y no toca los demás 0ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > conserva solo los 5 más recientes 0ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > descartar todos vacía la bandeja y conserva el contador 0ms
 ✓ src/reporte/resumen.test.ts > resumen > cuenta solo los servicios en falla 1ms
 ✓ src/reporte/resumen.test.ts > resumen > usa singular y plural 0ms
 ✓ src/reporte/resumen.test.ts > resumen > filtra por falla y por nombre, sin importar mayúsculas 0ms
 ✓ src/compartido/esquema.test.ts > validarCampos con el esquema del alta > convierte el texto del formulario en un NuevoServicio 2ms
 ✓ src/compartido/esquema.test.ts > validarCampos con el esquema del alta > informa todos los campos inválidos a la vez 0ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > cargando: anuncia la carga mientras la API no responde 157ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > sin datos marca los tres campos y lo anuncia 447ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > error: muestra el motivo y un botón para reintentar 395ms
 ✓ src/app/rutas.test.tsx > las rutas > una dirección desconocida muestra la página de no encontrada 629ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > muestra el detalle del servicio de la dirección 581ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > volver a revisar deja un aviso en la bandeja 86ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > vacío: lo dice en lugar de dejar la lista en blanco 134ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > con datos: un enlace por servicio y el resumen de fallas 53ms
 ✓ src/app/rutas.test.tsx > las rutas > el menú marca la página actual 113ms
 ✓ src/app/rutas.test.tsx > las rutas > una página que se rompe al dibujar muestra el aviso del revisor 122ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > sin fallas no pinta un 0 suelto en el resumen 34ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > con datos válidos envía el alta y confirma 546ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > si la actualización del detalle falla, conserva el detalle y la nota que se escribía 518ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > el filtro «solo fallas» viaja en la dirección 401ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > una dirección con el filtro ya puesto abre filtrada 72ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > declara los obligatorios y la bandeja anuncia solo el aviso nuevo 176ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora 613ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > un nombre repetido se marca en su campo con el mensaje de la API 550ms

 Test Files  7 passed (7)
      Tests  27 passed (27)
   Start at  16:08:16
   Duration  4.69s (environment 54%, tests 29%, setup 8%, transform 4%, import 4%, worker 1%)
```

São 27 linhas com `✓`, e o resumo confirma: `Tests  27 passed (27)`. Repare em como os nomes se leem: «el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora». Cada teste diz que comportamento protege, no idioma de quem usa o painel, não no de quem o programou. Quando um ficar vermelho, o nome vai dizer o que quebrou antes que se leia uma linha de código. E repare nos milissegundos: os testes que montam a aplicação levaram de 34 a 629 ms nesta execução; os de funções puras, de 0 a 2. A suíte completa, com a inicialização do jsdom, levou 4.69 s. Esses milissegundos dependem do que a máquina tiver ligado (a execução anterior, com a máquina mais livre, deu de 8 a 112 ms e 1.06 s), então devem ser lidos como uma ordem de grandeza: o que se sustenta é que as funções puras levam quase nada e montar a aplicação custa centenas de vezes mais.

## Os conceitos

### 8.1 A instalação: Vitest, jsdom e Testing Library

#### 8.1.1 Cinco dependências e um script

O ponto de controle desta lição acrescenta cinco dependências de desenvolvimento e um script. Este é o `package.json` completo:

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.8.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "servidor": "node servidor/practica.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@tanstack/react-query": "5.104.5",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "react-router": "8.5.0"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@testing-library/dom": "10.4.2",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.8",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "npm:typescript@7.0.2",
    "@vitejs/plugin-react": "6.1.2",
    "eslint": "10.13.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "jsdom": "30.1.3",
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "typescript-eslint": "8.72.0",
    "vite": "8.3.5",
    "vitest": "5.0.5"
  }
}
```

Cada peça tem um trabalho diferente, e convém não confundi-las:

- **`vitest`** é quem executa os testes: encontra os arquivos `*.test.ts` e `*.test.tsx`, transforma-os com a mesma configuração do Vite que o projeto já usa (por isso entende TypeScript e JSX sem um passo à parte) e fornece as funções `test`, `describe`, `expect` e `vi`.
- **`jsdom`** é um DOM escrito em JavaScript: `document`, `window`, elementos, eventos, formulários. Não é um navegador; é a parte do navegador que se pode imitar sem renderizar nada. Já foi usado nas figuras das lições anteriores.
- **`@testing-library/dom`** traz as consultas (`getByRole`, `findByText`…) e a espera (`waitFor`). Não sabe nada de React. É instalada à parte porque `@testing-library/react` a declara como dependência peer (*peer dependency*) e não a traz; a documentação pede para instalar as duas juntas. As figuras a importam diretamente para `logRoles` (8.2.2).
- **`@testing-library/react`** é uma camada fina por cima: `render`, que renderiza um componente do React no DOM de teste, e `cleanup`, que o desmonta. Envolve suas funções em `act` por nós, que é a ferramenta do React para aplicar todas as mudanças pendentes antes de comparar ([React, `act`](https://react.dev/reference/react/act)). A documentação do React acrescenta que, com a React Testing Library, a variável `IS_REACT_ACT_ENVIRONMENT` «já fica definida». Isso é meio verdadeiro: a biblioteca a liga **de forma permanente** apenas quando o executor expõe `beforeAll` como global, o mesmo que acontece com `cleanup`; sem globais, ela a liga somente enquanto dura cada `render` ou cada evento que ela mesma envolve em `act`, e a desliga durante cada espera. Uma atualização que ocorra fora desses trechos (um temporizador, uma resposta que chega tarde) nunca avisaria. Por isso o `preparar.ts` a liga manualmente (8.1.3). Por isso nesta suíte o `act` quase não aparece: a única vez que é usado à mão é no exercício 3, para navegar com o roteador de fora de um clique.
- **`@testing-library/user-event`** simula uma pessoa: digita, clica, pressiona teclas. É explicada em 8.2.3.

O script novo é `"test": "vitest run"`. A palavra `run` importa: sem ela, em um terminal o `vitest` fica vigiando os arquivos e roda os testes de novo a cada mudança, o que é cômodo enquanto se programa e atrapalha numa verificação que precisa terminar. (Ele roda uma só vez por conta própria em um servidor de integração contínua, em um terminal não interativo ou quando detecta que quem o executa é um assistente de programação.) Com `run`, roda uma vez em qualquer lugar e sai com código 0 se tudo passou, ou 1 se algo falhou.

Como em todo o curso, as versões são exatas. Foram medidas com `npm view` em 21 de outubro de 2026 e são as mesmas da tabela «Versões com as quais foi escrito» do README. Se um dia diferirem, vale o `package.json` do ponto de controle.

#### 8.1.2 A configuração vive em `vite.config.ts`

O Vitest lê a configuração do Vite. Não é preciso um arquivo à parte; basta uma seção `test`:

```ts
// revisor/vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3100",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/pruebas/preparar.ts"],
  },
});
```

Em comparação com a lição 7, mudam duas coisas. A primeira: `defineConfig` é importado de `vitest/config` e não de `vite`. É a mesma função com um tipo mais amplo, que conhece a seção `test`; com a de `vite`, o TypeScript rejeitaria essa chave. (A documentação do Vitest também mostra a outra saída, que é manter a importação de `vite` e acrescentar uma referência de tipos com barra tripla no início do arquivo; o ponto de controle escolheu a importação, que se lê sem saber o que é uma barra tripla.)

A segunda: a seção `test`, com duas opções.

- **`environment: "jsdom"`.** Por padrão, o Vitest roda os testes no ambiente `node`, sem `document` nem `window` ([Vitest, «Test Environment»](https://vitest.dev/guide/environment.html)). Com `jsdom`, antes de cada arquivo de testes ele cria um DOM e coloca seus objetos no escopo global, como se o arquivo rodasse numa página. Por isso o `jsdom` precisa estar instalado: o Vitest o usa, mas não o traz.
- **`setupFiles`.** Uma lista de arquivos que o Vitest executa antes de cada arquivo de testes. Aqui é um só, `preparar.ts`, e o que ele faz merece seu próprio tópico.

O que não muda também importa: `plugins: [react()]` é o mesmo de sempre, então os testes veem o código transformado do mesmo modo que o servidor de desenvolvimento o vê. E o `proxy` para a API não interfere nos testes: neles ninguém vai à rede.

#### 8.1.3 O que é preciso limpar depois de cada teste

```ts
// revisor/src/pruebas/preparar.ts
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// React solo avisa de las actualizaciones fuera de act() si esta variable está encendida.
// Testing Library la enciende sola cuando el ejecutor expone `beforeAll` como global; con
// `globals` apagado no lo hace, y hay que hacerlo aquí.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
```

São três instruções, e cada uma tem uma razão.

**`cleanup()`** desmonta tudo o que o `render` renderizou. Sem ele, o segundo teste de um arquivo encontraria no DOM a aplicação do primeiro **e** a sua própria: dois botões «Dar de alta», duas bandejas, e uma consulta como `getByRole("button", { name: "Dar de alta" })` falharia com «encontrei vários». A documentação da React Testing Library diz que o `cleanup` é chamado automaticamente se o ambiente de testes define uma função global `afterEach`, e que, se não, é preciso chamá-lo depois de cada teste ([Testing Library, API do React](https://testing-library.com/docs/react-testing-library/api)). E o Vitest, por padrão, **não** expõe suas funções como globais: a opção `globals` vale `false`, e sua documentação adverte justamente isto, que algumas bibliotecas, como a `@testing-library/react`, dependem desses globais para limpar sozinhas ([Vitest, `globals`](https://vitest.dev/config/globals.html)). O curso deixa `globals` desligado de propósito: cada arquivo de testes importa `test`, `expect` e `vi` explicitamente, e se vê de onde sai cada coisa. O preço é este arquivo.

**`vi.unstubAllGlobals()`** desfaz o que o `vi.stubGlobal` fez. Os testes trocam o `fetch` global por um falso (8.3.1), e essa troca não deve sobreviver ao teste que a fez. Segundo a documentação, o `vi.stubGlobal` muda o valor de uma variável global e o `vi.unstubAllGlobals` restaura os valores originais; com o jsdom, a mudança também se vê em `window` ([Vitest, `vi`](https://vitest.dev/api/vi.html)).

**`IS_REACT_ACT_ENVIRONMENT = true`** liga os avisos do React sobre `act`. O React só avisa de uma atualização de estado ocorrida fora de `act` se essa variável global estiver em `true`; a documentação do React pede para defini-la no arquivo de preparação dos testes. A React Testing Library a liga sozinha, mas o faz a partir de um `beforeAll` global, que com `globals` desligado não existe: é o mesmo problema do `cleanup`. Sem esta linha, a suíte nunca imprimiria um aviso de `act`, e «não há nenhum aviso» não demonstraria nada. O `as { IS_REACT_ACT_ENVIRONMENT?: boolean }` é para o TypeScript, que não conhece essa propriedade de `globalThis`.

Que a linha serve foi medido com um controle negativo, um teste descartável que não faz parte do ponto de controle: um componente muda seu estado com um temporizador, e o teste espera com outro temporizador, não com `findBy`, de modo que ninguém envolve a mudança em `act`. (O `screen`, que aparece no teste, consulta o documento inteiro; é explicado em 8.3.2.)

```tsx
// fragmento: una prueba de control, fuera del punto de control (programas/08-pruebas-de-componentes/ejercicios/control.test.tsx)
import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { expect, test } from "vitest";

function Tardio() {
  const [texto, establecerTexto] = useState("esperando");
  useEffect(() => {
    const temporizador = setTimeout(() => establecerTexto("listo"), 10);
    return () => clearTimeout(temporizador);
  }, []);
  return <p>{texto}</p>;
}

test("una actualización fuera de act", async () => {
  render(<Tardio />);
  // Se espera con un temporizador simple, no con findBy: nadie envuelve el cambio en act.
  await new Promise((listo) => setTimeout(listo, 50));
  expect(screen.getByText("listo")).toBeDefined();
});
```

Com o `preparar.ts` sem a linha:

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:10
   Duration  362ms (environment 66%, tests 20%, setup 10%, transform 3%, import 1%, worker 1%)
```

Com a linha:

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/pruebas/control.test.tsx > una actualización fuera de act
An update to Tardio inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:11
   Duration  349ms (environment 67%, tests 20%, setup 10%, transform 1%, import 1%, worker 1%)
```

O teste passa nos dois casos, porque o texto de fato chega a «listo». O que muda é que, com a linha, o React avisa na saída de erro (`stderr`) que houve uma atualização sem `act`. Esse é o aviso que a suíte do `revisor` não deve ter, e não tem: com a linha ligada, os 27 testes passam sem um único `stderr`.

Por que `afterEach` e não `beforeEach`? Porque limpar no final deixa o DOM vazio também depois do **último** teste, e porque assim cada teste começa com o que a limpeza deixou, não com o que outro deixou. Os testes não dependem de sua ordem, que é a propriedade que permite rodar um arquivo sozinho, como se fará em 8.4.

#### 8.1.4 O primeiro teste não precisa de React

Antes de renderizar qualquer coisa, as peças mais fáceis de testar são as funções puras. A lição 1 extraiu a contagem de falhas para `resumen.ts` justamente para isto: mesmas entradas, mesma saída, sem DOM. Seu teste:

```ts
// revisor/src/reporte/resumen.test.ts
import { describe, expect, test } from "vitest";
import { reporteDeEjemplo } from "../pruebas/datos";
import { contarFallas, filtrarEstados, textoFallas } from "./resumen";

describe("resumen", () => {
  test("cuenta solo los servicios en falla", () => {
    expect(contarFallas(reporteDeEjemplo.estados)).toBe(2);
    expect(contarFallas([])).toBe(0);
  });

  test("usa singular y plural", () => {
    expect(textoFallas(1)).toBe("1 servicio con falla");
    expect(textoFallas(2)).toBe("2 servicios con falla");
  });

  test("filtra por falla y por nombre, sin importar mayúsculas", () => {
    const nombres = (soloFallas: boolean, texto: string) =>
      filtrarEstados(reporteDeEjemplo.estados, { soloFallas, texto }).map((estado) => estado.nombre);

    expect(nombres(false, "")).toEqual(["catálogo", "pagos", "inventario", "reportes"]);
    expect(nombres(true, "")).toEqual(["pagos", "reportes"]);
    expect(nombres(false, "PAG")).toEqual(["pagos"]);
    expect(nombres(true, "catá")).toEqual([]);
  });
});
```

Leia a forma, porque é a de toda a suíte. `describe` agrupa testes sob um nome; `test` define um, com um nome e uma função; `expect(valor).toBe(esperado)` compara com `Object.is`, que para números e textos é a igualdade de sempre; `toEqual` compara a **forma** de arrays e objetos, elemento por elemento. O terceiro teste usa uma função auxiliar, `nombres`, para que cada linha diga apenas o que muda: com ou sem «solo fallas», com que texto. O último caso, `nombres(true, "catá")`, verifica que os dois filtros se combinam: `catálogo` coincide com o texto mas não está em falha, e por isso a lista fica vazia.

Os outros dois testes sem React seguem a mesma ideia. O do reducer de avisos da lição 6, que o testa sem montar um único componente, como já havia feito a figura dessa lição:

```ts
// revisor/src/avisos/avisos.test.ts
import { describe, expect, test } from "vitest";
import { estadoInicialAvisos, MAXIMO_AVISOS, reducirAvisos, type EstadoAvisos } from "./avisos";

function agregar(estado: EstadoAvisos, texto: string): EstadoAvisos {
  return reducirAvisos(estado, { tipo: "agregado", nivel: "exito", texto });
}

describe("reducirAvisos", () => {
  test("agrega al principio con un identificador nuevo", () => {
    const estado = agregar(agregar(estadoInicialAvisos, "primero"), "segundo");
    expect(estado.avisos.map((aviso) => [aviso.id, aviso.texto])).toEqual([
      [2, "segundo"],
      [1, "primero"],
    ]);
  });

  test("descarta uno por su identificador y no toca los demás", () => {
    const estado = agregar(agregar(estadoInicialAvisos, "primero"), "segundo");
    const despues = reducirAvisos(estado, { tipo: "descartado", id: 1 });
    expect(despues.avisos.map((aviso) => aviso.texto)).toEqual(["segundo"]);
    expect(estado.avisos).toHaveLength(2);
  });

  test(`conserva solo los ${MAXIMO_AVISOS} más recientes`, () => {
    let estado = estadoInicialAvisos;
    for (let numero = 1; numero <= MAXIMO_AVISOS + 2; numero += 1) {
      estado = agregar(estado, `aviso ${numero}`);
    }
    expect(estado.avisos).toHaveLength(MAXIMO_AVISOS);
    expect(estado.avisos[0]?.texto).toBe(`aviso ${MAXIMO_AVISOS + 2}`);
  });

  test("descartar todos vacía la bandeja y conserva el contador", () => {
    const estado = reducirAvisos(agregar(estadoInicialAvisos, "uno"), { tipo: "todos-descartados" });
    expect(estado).toEqual({ avisos: [], siguienteId: 2 });
  });
});
```

O segundo teste afirma algo que uma pessoa jamais veria na tela: `expect(estado.avisos).toHaveLength(2)` depois de descartar. Verifica que o reducer **não mutou** o estado que recebeu, que é a regra de imutabilidade da lição 2. E o terceiro usa a constante `MAXIMO_AVISOS` em vez de escrever `5`: se amanhã o máximo mudar, o teste continua dizendo a verdade.

E o do schema da lição 7, que verifica a diferença que essa lição explicou: todos os erros de uma vez, não só o primeiro.

```ts
// revisor/src/compartido/esquema.test.ts
import { describe, expect, test } from "vitest";
import { camposAlta } from "../alta/esquemaAlta";
import { validarCampos } from "./esquema";

describe("validarCampos con el esquema del alta", () => {
  test("convierte el texto del formulario en un NuevoServicio", () => {
    expect(
      validarCampos(camposAlta, { nombre: " correo ", url: "https://correo.example", timeoutMs: "1500" }),
    ).toEqual({
      ok: true,
      valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 },
    });
  });

  test("informa todos los campos inválidos a la vez", () => {
    expect(validarCampos(camposAlta, { nombre: "  ", url: "ftp://x", timeoutMs: "1.5" })).toEqual({
      ok: false,
      errores: {
        nombre: "escribe un valor",
        url: "escribe una dirección que empiece con http:// o https://",
        timeoutMs: "escribe un número entero mayor que cero",
      },
    });
  });
});
```

Estes nove testes custam quase nada (de 0 a 2 ms cada um) e protegem a lógica que não depende de React. Mas não veem a tela. O `0` solto da cena não vive em `contarFallas`, que devolve `0` corretamente: vive na maneira como `ResumenFallas` usa esse `0` no JSX. Para vê-lo é preciso renderizar.

### 8.2 Consultar como faz uma pessoa

#### 8.2.1 `getBy`, `queryBy`, `findBy`

Antes de ver por que convém buscar por role (8.2.2), é preciso saber de que formas se pode perguntar. Cada consulta vem em três famílias, e a diferença não é de estilo: cada uma afirma algo distinto. A documentação resume assim: `getBy` devolve o elemento e lança um erro descritivo se não houver nenhum; `queryBy` devolve o elemento ou `null`; `findBy` devolve uma promise que se resolve quando ele aparece. As três têm sua versão `All` (`getAllBy`, `queryAllBy`, `findAllBy`), que devolve um array. E as versões sem `All` também falham se encontram **mais de um**.

A figura 1 mostra isso com uma cópia reduzida do que `/` renderiza: uma bandeja de avisos vazia (um `role="status"` sem conteúdo, como o do `revisor`) e o conteúdo do relatório, que diz «Cargando…» e cem milissegundos depois mostra a lista.

```tsx
// fig08_01.tsx
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { useEffect, useState } from "react";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Una copia reducida de lo que dibuja `/`: la bandeja de avisos (un `status` vacío)
// y el contenido del reporte, que dice «Cargando…» y 100 ms después muestra la lista.
function Reporte() {
  const [estados, establecerEstados] = useState<readonly string[] | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerEstados(["catálogo", "pagos"]), 100);
    return () => clearTimeout(temporizador);
  }, []);

  return (
    <>
      <section aria-label="Avisos">
        <div role="status" aria-atomic="false"></div>
      </section>
      {estados === null ? (
        <p role="status">Cargando…</p>
      ) : (
        <ul>
          {estados.map((nombre) => (
            <li key={nombre}>{nombre}</li>
          ))}
        </ul>
      )}
    </>
  );
}

// Solo la primera línea del mensaje: el resto es el DOM completo, que aquí estorba.
function primeraLinea(error: unknown): string {
  return error instanceof Error ? error.message.split("\n")[0] : String(error);
}

const pantalla = render(<Reporte />);

console.log("1. antes de que lleguen los datos");
try {
  pantalla.getByRole("list");
} catch (error) {
  console.log(`   getByRole("list")   lanza: ${primeraLinea(error)}`);
}
console.log(`   queryByRole("list") devuelve: ${String(pantalla.queryByRole("list"))}`);
try {
  pantalla.getByRole("status");
} catch (error) {
  console.log(`   getByRole("status") lanza: ${primeraLinea(error)}`);
}
console.log(`   getAllByRole("status") encuentra: ${pantalla.getAllByRole("status").length}`);
const cargando = pantalla.getByText("Cargando…");
console.log(`   getByText("Cargando…") tiene role="${cargando.getAttribute("role")}"`);

console.log("2. esperando con findBy");
const lista = await pantalla.findByRole("list");
console.log(`   findByRole("list") la encontró, con ${lista.children.length} elementos`);
console.log(`   queryByText("Cargando…") ahora devuelve: ${String(pantalla.queryByText("Cargando…"))}`);

console.log("3. lo que nunca aparece");
try {
  await pantalla.findByRole("table", {}, { timeout: 300 });
} catch (error) {
  console.log(`   findByRole("table") rechaza: ${primeraLinea(error)}`);
}

pantalla.unmount();
dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_01.tsx
$ node fig08_01.js
1. antes de que lleguen los datos
   getByRole("list")   lanza: Unable to find an accessible element with the role "list"
   queryByRole("list") devuelve: null
   getByRole("status") lanza: Found multiple elements with the role "status"
   getAllByRole("status") encuentra: 2
   getByText("Cargando…") tiene role="status"
2. esperando con findBy
   findByRole("list") la encontró, con 2 elementos
   queryByText("Cargando…") ahora devuelve: null
3. lo que nunca aparece
   findByRole("table") rechaza: Unable to find role="table"
```

Oito resultados, e cada um ensina algo.

**Antes de os dados chegarem, `getByRole("list")` lança e `queryByRole("list")` devolve `null`.** É a mesma pergunta com duas respostas diferentes para «não está». Use `getBy` quando o elemento **tem que** estar: se faltar, o teste para nessa linha com uma mensagem que diz o que se buscava e, abaixo, o DOM que havia (quem imprime é a Testing Library, não o Vitest, truncado em 7 000 caracteres a menos que se mude `DEBUG_PRINT_LIMIT`; a figura o corta com `primeraLinea` porque aqui atrapalha). Use `queryBy` quando se quer afirmar que algo **não** está: `expect(screen.queryByRole("list")).toBeNull()`. Escrever isso com `getBy` é impossível, porque ele lançaria antes de chegar ao `expect`. O teste do estado vazio do `revisor` usa exatamente essa linha.

**`getByRole("status")` lança «Found multiple elements with the role "status"».** Na tela há **duas** regiões de status: a bandeja de avisos, que está sempre ali (lição 6), e o «Cargando…». O `getBy` exige um e somente um. Esse detalhe é real no `revisor` e explica uma linha de sua suíte que, de outro modo, pareceria estranha: o teste de «carregando» busca o texto com `findByText("Cargando…")` e **depois** verifica que seu role seja `status`. Assim encontra o elemento sem ambiguidade e, mesmo assim, afirma que ele é anunciado como região de status. A outra saída seria filtrar por nome, mas um `status` não toma seu nome do conteúdo, de modo que «Cargando…» não é o nome dele.

**`findByRole("list")` espera e encontra a lista com dois elementos**, e depois `queryByText("Cargando…")` já é `null`. O `findBy` é a combinação de `getBy` com `waitFor`: repete a consulta a cada 50 ms até encontrar ou até passarem 1000 ms, e além disso tenta de novo toda vez que o DOM muda ([Testing Library, «Async Methods»](https://testing-library.com/docs/dom-testing-library/api-async/)). No `revisor` quase tudo chega tarde: o relatório depende de um `fetch`, o aviso da bandeja depende de uma ação, a página depende do roteador. Por isso quase todos os testes de componentes da suíte começam com um `await screen.findBy…`: é a maneira de dizer «espere a tela chegar a este ponto».

**`findByRole("table")` rejeita «Unable to find role="table"»** depois do tempo limite, que a figura reduziu a 300 ms para não esperar o segundo inteiro. Um `findBy` que nunca encontra não fica pendurado: falha com uma mensagem.

Uma regra que sai daqui: **não envolva um `getBy` em um `waitFor` manual** se o que se quer é esperar um elemento; para isso existe o `findBy`. E não use `findBy` para algo que já está: funciona, mas diz a quem lê o teste que se esperava algo que não se esperava. Cada família comunica uma intenção.

Por que a figura não avisou nada de `act`? Porque roda com `node`, fora de um teste, e ninguém ligou `IS_REACT_ACT_ENVIRONMENT`: sem essa variável, o React não avisa. Na suíte ela está ligada (`preparar.ts`, 8.1.3). E ali, enquanto um `findBy` espera, a React Testing Library a **desliga** de propósito, porque a espera já é a forma correta de deixar a tela chegar aonde vai. Um aviso que menciona `act(` aparece quando uma atualização ocorre sem que ninguém esteja esperando, por exemplo depois de o teste terminar; em 8.4.3 se verá um de verdade. A saída completa da suíte do `revisor` não tem nenhum.

#### 8.2.2 Por role e por nome

Quando uma pessoa usa o painel, não pensa «o segundo `<button>` dentro do `<form>`». Pensa «o botão Dar de alta». Quem usa um leitor de tela ouve o mesmo: «Dar de alta, botão». Essas duas palavras são o **nome acessível** e o **role**, as mesmas da lição 7, e são o que o navegador entrega à tecnologia assistiva. A Testing Library ordena suas consultas com esse critério. Em sua página de consultas coloca primeiro as que chama de «acessíveis a todos» (`getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`), porque refletem a experiência de quem usa o mouse e a visão e também a de quem usa tecnologia assistiva; depois as semânticas (`getByAltText`, `getByTitle`) e, por último, os identificadores de teste (`getByTestId`) ([Testing Library, «About Queries»](https://testing-library.com/docs/queries/about/)). Por trás há um princípio que a própria biblioteca escreve assim: quanto mais seus testes se parecerem com a forma como o seu programa é usado, mais confiança podem dar ([Testing Library, «Guiding Principles»](https://testing-library.com/docs/guiding-principles)).

A consequência prática é mais forte do que parece: **uma consulta por role falha se o elemento não tem esse role e esse nome na árvore de acessibilidade**, ou se está oculto para ela. Não é um teste completo de acessibilidade (um `<span role="button">` sem `tabindex` passaria na consulta e continuaria fora do alcance do teclado), mas descarta a imitação mais comum, que é a da figura 2. Para ver isso, a figura 2 renderiza duas vezes o mesmo: um aviso da bandeja com seu botão «Descartar» e um campo «Nombre». Em cima com os elementos nativos; embaixo, uma imitação que pareceria igual com um pouco de CSS.

```tsx
// fig08_02.tsx
import { logRoles } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Dos versiones de lo mismo: un aviso de la bandeja con su botón y un campo.
// La de arriba usa los elementos nativos; la de abajo se ve igual con CSS, pero no lo es.
function Nativo() {
  return (
    <section aria-label="Nativo">
      <p>
        Se dio de alta correo{" "}
        <button type="button" aria-label="Descartar: Se dio de alta correo">
          Descartar
        </button>
      </p>
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" name="nombre" />
    </section>
  );
}

function Imitacion() {
  return (
    <section aria-label="Imitación">
      <p>
        Se dio de alta correo <span className="boton">Descartar</span>
      </p>
      <p>Nombre</p>
      <input name="nombre" />
    </section>
  );
}

function probar(descripcion: string, consulta: () => unknown): void {
  try {
    consulta();
    console.log(`   ${descripcion}: lo encuentra`);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(`   ${descripcion}: ${mensaje}`);
  }
}

for (const [titulo, Componente] of [
  ["nativo", Nativo],
  ["imitación", Imitacion],
] as const) {
  const pantalla = render(<Componente />);
  console.log(`${titulo}:`);
  probar('getByText("Descartar")', () => pantalla.getByText("Descartar"));
  probar('getByRole("button", { name: "Descartar: Se dio de alta correo" })', () =>
    pantalla.getByRole("button", { name: "Descartar: Se dio de alta correo" }),
  );
  probar('getByRole("button", { name: "Descartar" })', () =>
    pantalla.getByRole("button", { name: "Descartar" }),
  );
  probar('getByLabelText("Nombre")', () => pantalla.getByLabelText("Nombre"));
  probar('getByRole("textbox", { name: "Nombre" })', () =>
    pantalla.getByRole("textbox", { name: "Nombre" }),
  );
  pantalla.unmount();
}

// logRoles colorea su salida para la terminal; en un archivo, los colores estorban.
process.env.COLORS = "false";
console.log("logRoles del nativo:");
const nativo = render(<Nativo />);
logRoles(nativo.container);
nativo.unmount();
dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_02.tsx
$ node fig08_02.js
nativo:
   getByText("Descartar"): lo encuentra
   getByRole("button", { name: "Descartar: Se dio de alta correo" }): lo encuentra
   getByRole("button", { name: "Descartar" }): Unable to find an accessible element with the role "button" and name "Descartar"
   getByLabelText("Nombre"): lo encuentra
   getByRole("textbox", { name: "Nombre" }): lo encuentra
imitación:
   getByText("Descartar"): lo encuentra
   getByRole("button", { name: "Descartar: Se dio de alta correo" }): Unable to find an accessible element with the role "button" and name "Descartar: Se dio de alta correo"
   getByRole("button", { name: "Descartar" }): Unable to find an accessible element with the role "button" and name "Descartar"
   getByLabelText("Nombre"): Unable to find a label with the text of: Nombre
   getByRole("textbox", { name: "Nombre" }): Unable to find an accessible element with the role "textbox" and name "Nombre"
logRoles del nativo:
region:

Name "Nativo":
<section
  aria-label="Nativo"
/>

--------------------------------------------------
paragraph:

Name "":
<p />

--------------------------------------------------
button:

Name "Descartar: Se dio de alta correo":
<button
  aria-label="Descartar: Se dio de alta correo"
  type="button"
/>

--------------------------------------------------
textbox:

Name "Nombre":
<input
  id="nombre"
  name="nombre"
/>

--------------------------------------------------
```

Leia a saída por colunas. **`getByText("Descartar")` encontra as duas versões.** Buscar por texto não sabe se o que encontrou é um botão, um `<span>` ou um parágrafo. Um teste escrito assim passaria com a imitação, que o teclado não alcança e que um leitor de tela não anuncia como botão.

**`getByRole("button", { name: "Descartar: Se dio de alta correo" })` encontra só o nativo.** O role `button` o `<button>` tem sem que ninguém escreva `role="button"`: é um role implícito, e a documentação do `ByRole` diz isso com esse mesmo exemplo ([Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole)). A imitação não tem role de botão, então não existe para a consulta, assim como não existe para um leitor de tela.

**`getByRole("button", { name: "Descartar" })` não encontra nenhum**, e isso surpreende na primeira vez. O botão nativo **diz** «Descartar» na tela, mas seu nome acessível é «Descartar: Se dio de alta correo», porque `aria-label` ganha do conteúdo. É exatamente o que a bandeja da lição 6 queria: com cinco avisos na lista, cinco botões chamados «Descartar» seriam impossíveis de distinguir para quem os ouve. O teste verifica isso sem se propor: se alguém tirasse o `aria-label`, o teste do formulário que busca «Descartar: Se dio de alta correo» ficaria vermelho.

**`getByLabelText("Nombre")` e `getByRole("textbox", { name: "Nombre" })` encontram o campo nativo e não a imitação.** O parágrafo «Nombre» acima do campo parece um rótulo, mas não está relacionado com ele: é a figura 4 da lição 7 vista de dentro de um teste.

A última parte da saída é o `logRoles`, uma função de depuração da Testing Library que imprime os roles implícitos de uma árvore e o nome de cada elemento ([Testing Library, «Debugging»](https://testing-library.com/docs/dom-testing-library/api-debugging)). Quando não se souber como algo se chama para uma consulta, `logRoles(container)` diz. Repare que `section` aparece como `region` com o nome «Nativo»: uma `<section>` com nome acessível tem o role `region`, que é justamente o que a lição 1 explicou para o `Tarjeta`, e por isso a suíte pode buscar `getByRole("region", { name: "Avisos" })`. Dois detalhes da figura: o `logRoles` colore sua saída para o terminal, e a linha `process.env.COLORS = "false"` a desliga para que o arquivo `.salida.txt` se leia limpo (a documentação nomeia essa variável); e o parágrafo aparece com o nome vazio porque parágrafos não tomam nome de seu conteúdo.

Isso não significa que só se use `getByRole`. A suíte usa `getByLabelText` para os campos do formulário, que é mais direto e diz o mesmo (o campo tem esse rótulo), e `getByText` ou `findByText` para textos que não são controles, como «No hay servicios configurados todavía.». O que **não** usa é `getByTestId` nem seletores de CSS. A regra prática: busque primeiro por role; se o elemento não tem um role útil (um parágrafo, um texto solto), por texto; e se para encontrar algo for preciso um identificador de teste, convém perguntar antes se uma pessoa poderia encontrá-lo.

Há um custo que convém conhecer. O `ByRole` calcula a árvore de acessibilidade, e a documentação adverte que esses cálculos podem ser caros com árvores de DOM grandes. Com o `revisor` não se nota (o teste mais lento da suíte levou 629 ms na execução da 8.1, com a aplicação completa montada), mas se uma suíte sua se arrasta, esse é um suspeito.

#### 8.2.3 `user-event`: uma pessoa, não um evento

Para testar um formulário é preciso digitar nele e enviá-lo. A Testing Library traz o `fireEvent`, que dispara **um** evento do DOM: um `click`, um `input`. Mas uma pessoa que clica produz vários eventos seguidos (o ponteiro desce, o ponteiro sobe, o foco muda, o clique), e uma que digita produz, para cada tecla, uma sequência de teclado e de entrada. O `user-event` simula a interação completa. Sua documentação diz assim: simula *interações* completas, que podem disparar vários eventos e fazer verificações no caminho; por exemplo, não deixa clicar em um elemento oculto nem digitar em um campo desabilitado, como o navegador também não deixaria ([Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro)).

Três regras de uso, as três visíveis em `montar.tsx` e nos testes:

1. **`userEvent.setup()` antes de renderizar.** A documentação recomenda assim, e `montarEn` o faz nessa ordem. Devolve um objeto, `usuario`, com os métodos `click`, `type`, `tab`, `keyboard`.
2. **Cada método é esperado com `await`.** Devolvem promises, porque entre uma tecla e outra deixam o React e o DOM terminarem seu trabalho. Um `usuario.click(…)` sem `await` é um teste que compara antes de o clique ter ocorrido.
3. **Digita-se sobre o que a pessoa tocaria.** `usuario.type(campo, "correo")` digita no campo que foi encontrado por seu rótulo; `usuario.tab()` move o foco para o próximo elemento focalizável, como a tecla Tab; `usuario.keyboard(" ")` pressiona Espaço sobre o que tiver o foco. Na [documentação do teclado](https://testing-library.com/docs/user-event/keyboard), os caracteres imprimíveis são escritos tal como são e as teclas com nome vão entre chaves (`{Shift}`).

A diferença se nota no teste mais fino da suíte: «o foco não se perde ao enviar». Chega ao botão com Tab a partir do último campo e envia com Espaço, que é o que faz uma pessoa com teclado. Com `fireEvent.click(boton)` teria pulado justamente a parte que importa: que o foco estivesse no botão quando se enviou.

### 8.3 A aplicação inteira, sem rede nem navegador

#### 8.3.1 A única coisa falsa é a rede

Para testar uma tela do `revisor` é preciso decidir o que é de verdade e o que é falso. As opções vão de um extremo ao outro: renderizar `ContenidoReporte` sozinho, passando-lhe à mão um objeto que imite o resultado de `useQuery`; substituir com `vi.mock` o módulo `cargar.ts` por um que devolva o que se quiser; ou renderizar a aplicação completa e substituir apenas o `fetch`.

O ponto de controle escolheu a terceira, e a razão é a mesma regra de 8.2: parecer-se com a forma como o programa é usado. Se o teste passa a `ContenidoReporte` um objeto inventado, verifica que `ContenidoReporte` sabe renderizar esse objeto, mas não que o TanStack Query o produza assim, nem que a chave da consulta seja a correta, nem que `cargarReporte` valide a resposta. Se o teste substitui `cargar.ts`, pula a fronteira de rede que a lição 0 escreveu e a lição 4 conectou. Já o `fetch` é a fronteira **externa** do programa: tudo o que está deste lado (os componentes, o Query, o roteador, a validação com `esReportePublico`, o reducer de avisos) roda de verdade, e a única coisa que se decide é o que «a API» responde. É a mesma fronteira que o servidor de prática imita, mas dentro do processo e em zero milissegundos.

```ts
// revisor/src/pruebas/fetchFalso.ts
import { vi } from "vitest";

export interface RespuestaFalsa {
  readonly status: number;
  readonly cuerpo: unknown;
}

export type Rutas = Readonly<Record<string, RespuestaFalsa | (() => Promise<RespuestaFalsa>)>>;

// Sustituye `fetch` por una función que responde según "MÉTODO /ruta". Lo que no
// esté en la tabla responde 404, para que una ruta olvidada se note en la prueba.
export function instalarFetchFalso(rutas: Rutas) {
  const falso = vi.fn(async (entrada: RequestInfo | URL, opciones?: RequestInit) => {
    const url = new URL(String(entrada), "http://localhost");
    const clave = `${opciones?.method ?? "GET"} ${decodeURIComponent(url.pathname)}`;
    const definida = rutas[clave];
    const respuesta =
      definida === undefined
        ? { status: 404, cuerpo: { detalle: `sin ruta falsa para ${clave}` } }
        : typeof definida === "function"
          ? await definida()
          : definida;

    return new Response(JSON.stringify(respuesta.cuerpo), {
      status: respuesta.status,
      headers: { "content-type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", falso);
  return falso;
}

export function nuncaResponde(): Promise<RespuestaFalsa> {
  return new Promise(() => {});
}
```

Percorra a função de cima para baixo.

- **A tabela de rotas.** `instalarFetchFalso` recebe um objeto cujas chaves são `"MÉTODO /ruta"`, como `"GET /api/estados"` ou `"POST /api/servicios"`, e cujos valores são uma resposta (`status` e `cuerpo`) ou uma **função** que devolve uma promise de resposta. A função serve para o que não responde imediatamente: uma resposta que nunca chega, ou uma que o teste entrega quando quiser.
- **A chave sai da requisição.** `new URL(String(entrada), "http://localhost")` converte o endereço relativo que o painel usa (`/api/estados`) em uma URL completa para poder ler seu `pathname`. O `decodeURIComponent` importa com `catálogo`: ao montar a URL, o acento fica codificado (`/api/servicios/cat%C3%A1logo`), e a tabela se escreve com o acento, como a escreveria uma pessoa. O método sai de `opciones?.method`, e se não vier é `GET`, igual ao `fetch`.
- **O que não está na tabela responde 404.** É uma decisão pequena com consequências grandes. Se um teste esquece de declarar uma rota, o painel recebe um 404 com um `detalle` que diz `sin ruta falsa para GET /api/…`, e o mais provável é que o teste falhe mostrando esse texto. A outra opção, lançar um erro ou devolver `undefined`, produziria falhas mais confusas, ou nenhuma.
- **A resposta é um `Response` de verdade.** `new Response(JSON.stringify(…), { status, headers })` é a classe padrão que o navegador também usa, e o Node 24 a traz. Assim `cargarReporte` lê `respuesta.ok`, `respuesta.status` e `respuesta.json()` igual à produção.
- **`vi.fn` registra cada chamada.** O falso não é uma função qualquer: o `vi.fn` a envolve e guarda os argumentos de cada chamada em `mock.calls`, que é um array com os argumentos de cada chamada, um por elemento ([Vitest, `mock`](https://vitest.dev/api/mock.html)). Por isso `instalarFetchFalso` devolve o falso: os testes podem perguntar se foi chamado, quantas vezes e com que corpo.
- **`vi.stubGlobal("fetch", falso)`** o instala como `fetch` global, e o `preparar.ts` o remove ao terminar o teste.

`nuncaResponde` é a função mais curta do curso: uma promise que jamais se resolve. Com ela, a API «fica pensando» para sempre, e a tela permanece em seu estado de carregamento pelo tempo que o teste precisar para olhá-lo.

Os dados de exemplo vivem à parte, para que todos os testes usem os mesmos:

```ts
// revisor/src/pruebas/datos.ts
import type { DetalleServicio, ReportePublico } from "../compartido/contrato";

export const reporteDeEjemplo: ReportePublico = {
  estados: [
    { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
    { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
    { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
    { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
  ],
};

export const detallePagos: DetalleServicio = {
  nombre: "pagos",
  estado: { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
  revisiones: 3,
  ultimaRevision: "2026-10-21T08:00:00.000Z",
};
```

São os quatro serviços com os quais a API de prática começa, com os mesmos estados, e o detalhe de `pagos`. Que coincidam não é casualidade: assim um teste pode ser comparado com o que se vê no navegador com `npm run dev`. E estão tipados como `ReportePublico` e `DetalleServicio`: se os tipos da API mudarem (`src/compartido/contrato.ts`), o `tsc -b` marca os dados de teste antes que um teste passe por acidente com dados antigos.

#### 8.3.2 Montar a aplicação em um endereço

```tsx
// revisor/src/pruebas/montar.tsx
import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Proveedores } from "../app/Proveedores";
import { rutas } from "../app/rutas";

// Monta la aplicación completa en una dirección, con un enrutador en memoria y una
// caché nueva en cada prueba, sin reintentos para que un error se vea de inmediato.
export function montarEn(direccion: string) {
  const clienteConsultas = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const enrutador = createMemoryRouter(rutas, { initialEntries: [direccion] });
  const usuario = userEvent.setup();

  render(
    <Proveedores clienteConsultas={clienteConsultas}>
      <RouterProvider router={enrutador} />
    </Proveedores>,
  );

  return { enrutador, usuario };
}
```

`montarEn` é a peça que faz cada teste de tela caber em cinco linhas, e cada uma de suas linhas tem uma razão.

**Um `QueryClient` novo em cada teste.** O cache do TanStack Query guarda o que chegou da API. Se dois testes compartilhassem o cliente, o segundo veria o relatório do primeiro antes de pedir qualquer coisa, e o estado de «carregando» não existiria. Um cliente por teste é um cache vazio por teste. E tem `retry: false` em consultas e mutações: na aplicação, `crearClienteConsultas` pede `retry: 2`, e a lição 4 mediu as três requisições que isso produz com a API fora do ar. Em um teste, essas novas tentativas só atrasam o erro com esperas crescentes; com `retry: false`, uma resposta 503 vira o estado de erro imediatamente.

**`createMemoryRouter(rutas, { initialEntries: [direccion] })`.** A aplicação usa `createBrowserRouter`, que guarda seu histórico na barra de endereços da janela. No jsdom essa barra existe (a API `history` funciona), mas é **uma só** para todos os testes do arquivo: o endereço que um teste deixou seria o ponto de partida do seguinte. O `createMemoryRouter` cria um roteador que guarda seu histórico em memória, um por teste, e sua documentação o descreve como útil para ambientes que não são um navegador ([React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter)). `initialEntries` são as entradas iniciais desse histórico: o teste diz «comece em `/servicios/nuevo`» e a aplicação inicia ali. O que importa é **quais** rotas recebe: o mesmo array `rutas` que o `main.tsx` usa. É a razão pela qual a lição 5 o escreveu como um array exportado e não como JSX dentro de `main.tsx`. Os testes não testam uma cópia das rotas; testam as rotas.

**`<Proveedores clienteConsultas={…}>`.** O mesmo componente que o `main.tsx` monta, com o cache, as preferências e a bandeja de avisos. A lição 6 o extraiu para seu próprio arquivo por isto, e a lição 4 explicou o erro que um `useQuery` dá sem seu provedor: se o teste montasse as páginas sem `Proveedores`, elas falhariam pela razão errada.

**O que devolve.** `{ enrutador, usuario }`. O `usuario` serve para agir; o `enrutador`, para perguntar onde a aplicação foi parar (`enrutador.state.location.search`) ou para navegar de fora, como no exercício 3. O que **não** devolve são as consultas do `render`: os testes usam `screen`, que consulta todo o `document.body`. A diferença importa pouco aqui e algo no futuro: se amanhã um componente renderizar algo com um portal fora de seu contêiner, o `screen` continua encontrando.

Repare no que o `montarEn` **não** monta: `StrictMode` nem `LimiteDeError`, que estão em `main.tsx` em volta de tudo. Os testes montam o que está dentro. O `StrictMode` fica de fora de propósito: em desenvolvimento ele monta, desmonta e volta a montar cada componente (lição 3), de modo que a primeira requisição de cada consulta seria cancelada e repetida, e contar chamadas ao `fetch` ficaria ambíguo. Se um dia se quiser essa dupla passada em um teste, a React Testing Library a oferece com `configure({ reactStrictMode: true })` ou com a opção `reactStrictMode` do `render`. O error boundary das rotas está, sim, porque vem dentro de `rutas`, e tem seu teste em 8.3.4.

#### 8.3.3 Os estados do relatório

Com `instalarFetchFalso` e `montarEn`, os estados do relatório são sete testes quase iguais, que só mudam no que a API responde e no que se espera ver:

```tsx
// revisor/src/reporte/PaginaReporte.test.tsx
import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { reporteDeEjemplo } from "../pruebas/datos";
import { instalarFetchFalso, nuncaResponde } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página del reporte", () => {
  test("cargando: anuncia la carga mientras la API no responde", async () => {
    instalarFetchFalso({ "GET /api/estados": nuncaResponde });
    montarEn("/");
    const cargando = await screen.findByText("Cargando…");
    expect(cargando.getAttribute("role")).toBe("status");
  });

  test("error: muestra el motivo y un botón para reintentar", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 503, cuerpo: { detalle: "caída" } } });
    montarEn("/");
    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("la API respondió 503");
    expect(within(alerta).getByRole("button", { name: "Reintentar" })).toBeDefined();
  });

  test("vacío: lo dice en lugar de dejar la lista en blanco", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: { estados: [] } } });
    montarEn("/");
    expect(await screen.findByText("No hay servicios configurados todavía.")).toBeDefined();
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("con datos: un enlace por servicio y el resumen de fallas", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    montarEn("/");
    const lista = await screen.findByRole("list");
    expect(within(lista).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual([
      "catálogo",
      "pagos",
      "inventario",
      "reportes",
    ]);
    expect(screen.getByText(/2 servicios con falla/)).toBeDefined();
  });

  test("sin fallas no pinta un 0 suelto en el resumen", async () => {
    const sinFallas = { estados: reporteDeEjemplo.estados.filter((estado) => estado.tipo === "disponible") };
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: sinFallas } });
    montarEn("/");
    const resumen = await screen.findByText(/servicios revisados/);
    expect(resumen.textContent).toBe("2 servicios revisados");
  });

  test("el filtro «solo fallas» viaja en la dirección", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    const { enrutador, usuario } = montarEn("/");
    await screen.findByRole("list");
    await usuario.click(screen.getByRole("checkbox", { name: "Solo fallas" }));
    expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(2);
    expect(enrutador.state.location.search).toBe("?fallas=1");
  });

  test("una dirección con el filtro ya puesto abre filtrada", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    montarEn("/?q=inv");
    const lista = await screen.findByRole("list");
    expect(within(lista).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual(["inventario"]);
  });
});
```

Percorra-os em ordem, porque juntos são a tabela de estados que a lição 4 prometeu.

**Carregando.** A API nunca responde, então a tela fica em `isPending`. O teste busca «Cargando…» por texto e verifica que seu `role` seja `status`, pela razão da figura 1: há duas regiões de status e `findByRole("status")` isolado falharia. O que protege: que o carregamento seja **anunciado**. Se alguém trocasse o `<p role="status">` por um `<p>` simples, o teste ficaria vermelho mesmo que o texto continuasse na tela.

**Erro.** A API responde 503. O teste busca o alerta, verifica que a mensagem inclua `la API respondió 503` (quem a escreve é `cargarReporte`) e que **dentro do alerta** haja um botão «Reintentar». O `within(alerta)` restringe a consulta a esse elemento: o botão tem que estar junto da mensagem, não em qualquer parte da página. Graças ao `retry: false`, o erro aparece na primeira tentativa.

**Vazio.** A API responde `{ "estados": [] }`. O teste espera o texto «No hay servicios configurados todavía.» e afirma com `queryByRole("list")` que **não** há lista. Essa segunda `expect` é a que distingue «vazio» de «uma lista sem elementos»: um `<ul>` vazio não diz nada a ninguém.

**Com dados.** Os quatro serviços. O teste pega a lista, dentro dela todos os links, e compara seus textos **em ordem**. Depois busca o resumo com uma expressão regular, `/2 servicios con falla/`. É necessário porque o texto do `<strong>` não é «2 servicios con falla», e sim « · 2 servicios con falla», com o separador na frente (`ResumenFallas.tsx`, linha 10), e o `getByText` com um texto fixo exige que o texto do elemento coincida por inteiro. A expressão regular busca apenas o pedaço que importa.

**Sem falhas não pinta um 0 solto.** O que a cena precisava. A API responde só os dois serviços disponíveis, e o teste compara o `textContent` completo do resumo com `"2 servicios revisados"`, exato, com `toBe`. Se nesse texto aparecesse qualquer coisa a mais, um `0`, um espaço, um ponto, a comparação falharia. É o caso que a API de prática não tem e que ninguém verificaria manualmente. Em 8.4 se vê isso falhar.

**O filtro viaja no endereço.** Aqui o teste age: espera a lista, clica na caixa «Solo fallas» (encontrada por seu role, `checkbox`, e seu nome) e verifica duas coisas. Que a lista agora tenha dois links, e que o endereço do roteador termine em `?fallas=1`. A segunda é a promessa da lição 5: o filtro é estado da URL, então se alguém o movesse para um `useState`, a lista se filtraria igual, a primeira afirmação passaria e a segunda não.

**Um endereço com o filtro já aplicado abre filtrado.** A outra metade da mesma promessa: montar em `/?q=inv` e ver só `inventario`. É o que acontece quando alguém cola um link compartilhado.

Faltam dois estados da tabela, e digo isso para que não sejam procurados. O de «com dados e erro» do **relatório** (a atualização falhou, mas continua se mostrando o último relatório) não tem teste no ponto de controle; o do **detalhe** tem, e é o terceiro teste de 8.3.4. O de «dados antigos enquanto se atualiza», o `· actualizando…` junto à hora, também não: depende de uma segunda requisição em curso. Esses dois testes são escritos no exercício 4, e sem eles não se cumpre o terceiro ponto de «Como saber se deu certo» do curso.

#### 8.3.4 As rotas, com um roteador em memória

Dois arquivos testam a navegação. O do detalhe:

```tsx
// revisor/src/detalle/PaginaServicio.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { detallePagos } from "../pruebas/datos";
import { instalarFetchFalso, type RespuestaFalsa } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página de un servicio", () => {
  test("muestra el detalle del servicio de la dirección", async () => {
    instalarFetchFalso({ "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos } });
    montarEn("/servicios/pagos");
    expect(await screen.findByText("En falla: HTTP 503")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Servicio pagos" })).toBeDefined();
  });

  test("volver a revisar deja un aviso en la bandeja", async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    await usuario.click(await screen.findByRole("button", { name: "Volver a revisar" }));
    expect(await screen.findByText("pagos se volvió a revisar: disponible")).toBeDefined();
    expect(fetchFalso.mock.calls.some(([, opciones]) => opciones?.method === "POST")).toBe(true);
  });

  test("si la actualización del detalle falla, conserva el detalle y la nota que se escribía", async () => {
    // El primer GET responde bien; los siguientes, 503. El clic en «Volver a revisar»
    // invalida el detalle, y esa segunda petición es la que falla.
    const detalles: RespuestaFalsa[] = [{ status: 200, cuerpo: detallePagos }];
    instalarFetchFalso({
      "GET /api/servicios/pagos": async () => detalles.shift() ?? { status: 503, cuerpo: { detalle: "caída" } },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    const nota = await screen.findByLabelText("Nota sobre pagos");
    await usuario.type(nota, "revisar con infraestructura");
    await usuario.click(screen.getByRole("button", { name: "Volver a revisar" }));

    expect(await screen.findByText(/Mostrando el último detalle que llegó/)).toBeDefined();
    expect(screen.getByText("En falla: HTTP 503")).toBeDefined();
    expect((screen.getByLabelText("Nota sobre pagos") as HTMLTextAreaElement).value).toBe("revisar con infraestructura");
  });
});
```

O primeiro teste monta diretamente em `/servicios/pagos` e espera o estado do serviço e o título «Servicio pagos». Verifica de uma vez três coisas que ninguém revisaria juntas: que a rota `servicios/:nombre` leve a `PaginaServicio`, que `useParams` entregue `pagos`, e que a consulta peça `GET /api/servicios/pagos`. Se a rota pedisse outro endereço, o falso responderia 404 e o texto esperado jamais apareceria.

O segundo clica em «Volver a revisar» e espera o aviso na bandeja, que é o que a lição 6 conectou com `useReintentar`. Sua última linha verifica que alguma chamada ao `fetch` tenha sido um `POST`: percorre `fetchFalso.mock.calls` e pergunta pelo método de cada uma.

O terceiro teste existe por um defeito que uma revisão externa encontrou e que nenhum dos outros dois podia ver. Enquanto a primeira requisição do detalhe responde bem e as seguintes com `503` (uma função na tabela do falso mantém a conta, como no exercício 4), o teste escreve um rascunho em «Nota sobre pagos», clica em «Volver a revisar» e espera o aviso «Mostrando el último detalle que llegó». O clique invalida o detalhe, a segunda requisição falha e o estado da consulta passa a `error` com os dados anteriores ainda no cache. O teste verifica três coisas: o aviso, o estado «En falla: HTTP 503» que continua à vista e o rascunho da nota intacto. Esta última importa tanto quanto o aviso: com a versão anterior da página, que renderizava o detalhe somente se `consulta.isSuccess`, o editor da nota era desmontado com o erro e o rascunho se perdia.

Um teste novo não vale até que se o veja vermelho. Com a página anterior (a condição `consulta.isSuccess` e um único aviso de erro) a suíte dá `1 failed | 26 passed (27)`, e o arquivo, o seguinte:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/detalle/PaginaServicio.tsx src/detalle/PaginaServicio.tsx
20c20
<       {consulta.isError && consulta.data === undefined && (
---
>       {consulta.isError && (
23,28c23
<       {consulta.isError && consulta.data !== undefined && (
<         <p role="alert" className="viejo">
<           Mostrando el último detalle que llegó: la actualización falló ({consulta.error.message}).
<         </p>
<       )}
<       {consulta.data !== undefined && (
---
>       {consulta.isSuccess && (
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/detalle/PaginaServicio.test.tsx (3 tests | 1 failed)
   ❯ la página de un servicio (3)
     ✓ muestra el detalle del servicio de la dirección
     ✓ volver a revisar deja un aviso en la bandeja
     × si la actualización del detalle falla, conserva el detalle y la nota que se escribía

 FAIL  src/detalle/PaginaServicio.test.tsx > la página de un servicio > si la actualización del detalle falla, conserva el detalle y la nota que se escribía
TestingLibraryElementError: Unable to find an element with the text: /Mostrando el último detalle que llegó/.
[… el DOM que había: solo «No se pudo cargar el detalle: la API respondió 503», sin detalle ni editor …]

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
```

Com o ponto de controle, o mesmo teste passa e a suíte completa dá `27 passed (27)`:

```bash
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/PaginaServicio.test.tsx (3 tests)

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

As saídas completas estão em `programas/08-pruebas-de-componentes/ejercicios/` (`detalle-viejo-con-isSuccess.salida.txt` e `detalle-viejo-punto-de-control.salida.txt`, com o `diff` em `detalle-viejo-con-isSuccess.diff.txt`).

E o das rotas em geral:

```tsx
// revisor/src/app/rutas.test.tsx
import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";
import { Proveedores } from "./Proveedores";
import { rutas } from "./rutas";

function PaginaRota(): never {
  throw new Error("la página se rompió al dibujar");
}

describe("las rutas", () => {
  test("una dirección desconocida muestra la página de no encontrada", async () => {
    instalarFetchFalso({});
    montarEn("/no-existe");
    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeDefined();
    expect(screen.getByText("No existe ninguna página en /no-existe.")).toBeDefined();
  });

  test("el menú marca la página actual", async () => {
    instalarFetchFalso({});
    montarEn("/servicios/nuevo");
    const actual = await screen.findByRole("link", { name: "Dar de alta" });
    expect(actual.getAttribute("aria-current")).toBe("page");
  });

  test("una página que se rompe al dibujar muestra el aviso del revisor", async () => {
    // React y React Router anuncian el error en la consola; aquí se espera, así que se calla.
    const consola = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => consola.mockRestore());

    // La ruta raíz del revisor, con su límite de error, y una sola página: una que lanza.
    const enrutador = createMemoryRouter([
      { ...rutas[0], index: false, children: [{ index: true, Component: PaginaRota }] },
    ]);
    render(
      <Proveedores clienteConsultas={new QueryClient()}>
        <RouterProvider router={enrutador} />
      </Proveedores>,
    );

    const aviso = await screen.findByRole("alert");
    expect(aviso.querySelector("h2")?.textContent).toBe("Algo salió mal al dibujar el panel");
    expect(aviso.querySelector("p")?.textContent).toBe("la página se rompió al dibujar");
    expect(screen.queryByText("Unexpected Application Error!")).toBeNull();
  });
});
```

**O endereço desconhecido** monta em `/no-existe` e espera o título e o texto de `PaginaNoEncontrada`, com o endereço incluído. Verifica que a rota curinga `*` exista e esteja no final.

**O menu marca a página atual** monta em `/servicios/nuevo` e verifica que o link «Dar de alta» tenha `aria-current="page"`. Esse atributo quem coloca é o `NavLink` no link ativo (lição 5), e é o que um leitor de tela anuncia como «página atual». O teste não olha a classe `active`, que só serve para pintar: olha o atributo que chega à tecnologia assistiva.

**Uma página que quebra ao renderizar mostra o aviso do revisor** é diferente das demais, e vale a pena lê-la devagar. Não usa `montarEn`, porque precisa de uma rota que não existe na aplicação: uma página que lança um erro ao ser renderizada. Monta seu próprio roteador com **a rota raiz real** do `revisor`, `rutas[0]`, com seu `Component: Disposicion` e seu `ErrorBoundary: ErrorDeRuta`, mas troca os filhos por um só, `PaginaRota`. O `index: false` está ali para o TypeScript: no tipo `RouteObject`, uma rota índice não pode ter filhos, e ao escrevê-lo explicitamente a cópia fica do lado das rotas que os admitem. Depois verifica que apareça o alerta com o título e a mensagem de `AvisoDeError`, e que **não** apareça o «Unexpected Application Error!» que o React Router renderiza quando uma rota não tem boundary próprio (lição 5).

As duas primeiras linhas desse teste silenciam o console. Quando um componente lança, o React e o React Router anunciam o erro com `console.error`, mesmo que um boundary o capture: é informação para quem desenvolve. Aqui esse erro é **o cenário** do teste, não um problema, e deixá-lo sair encheria a saída de stack traces que parecem falhas. `vi.spyOn(console, "error")` envolve o método e `.mockImplementation(() => undefined)` o deixa sem efeito; `onTestFinished(() => consola.mockRestore())` o restaura ao terminar. `mockRestore` devolve o método original de um objeto espionado com `vi.spyOn`, e `onTestFinished` é chamado sempre depois de o teste terminar de rodar, depois dos `afterEach` ([Vitest, «Hooks»](https://vitest.dev/api/hooks.html)). É usado em vez de um `consola.mockRestore()` no final do corpo por uma razão: se o teste falha no meio, o final do corpo nunca é executado, e o console ficaria calado para os testes seguintes. Silencia apenas o que este teste provoca, e apenas enquanto dura.

#### 8.3.5 O formulário

O cadastro da lição 7 tem a suíte mais longa, porque é a tela com mais comportamento: validar, enviar, anunciar, não perder o foco, não enviar duas vezes, traduzir o 409.

```tsx
// revisor/src/alta/FormularioAlta.test.tsx
import { screen, within } from "@testing-library/react";
import { describe, expect, onTestFinished, test } from "vitest";
import { instalarFetchFalso, type RespuestaFalsa } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("el formulario de alta", () => {
  test("sin datos marca los tres campos y lo anuncia", async () => {
    const fetchFalso = instalarFetchFalso({});
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.click(await screen.findByRole("button", { name: "Dar de alta" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Revisa los campos marcados.");
    for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)"]) {
      expect(screen.getByLabelText(etiqueta).getAttribute("aria-invalid")).toBe("true");
    }
    expect(screen.getByLabelText("Nombre").getAttribute("aria-describedby")).toBe(
      "nombre-error nombre-ayuda",
    );
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  test("con datos válidos envía el alta y confirma", async () => {
    const fetchFalso = instalarFetchFalso({
      "POST /api/servicios": {
        status: 201,
        cuerpo: { nombre: "correo", tipo: "disponible", codigoHttp: 200, duracionMs: 75 },
      },
    });
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "correo");
    await usuario.type(screen.getByLabelText("Dirección"), "https://correo.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));

    // El éxito se anuncia una sola vez: en la bandeja de avisos, no también en el formulario.
    expect(await screen.findByRole("button", { name: "Descartar: Se dio de alta correo" })).toBeDefined();
    expect(screen.queryByText("Se dio de alta correo.")).toBeNull();
    const [, opciones] = fetchFalso.mock.calls[0] ?? [];
    expect(JSON.parse(String(opciones?.body))).toEqual({
      nombre: "correo",
      url: "https://correo.example/",
      timeoutMs: 1500,
    });
  });

  test("declara los obligatorios y la bandeja anuncia solo el aviso nuevo", async () => {
    instalarFetchFalso({});
    montarEn("/servicios/nuevo");

    for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)"]) {
      const campo = (await screen.findByLabelText(etiqueta)) as HTMLInputElement;
      expect(campo.required).toBe(true);
    }
    const bandeja = screen.getByRole("region", { name: "Avisos" });
    expect(within(bandeja).getByRole("status").getAttribute("aria-atomic")).toBe("false");
  });

  test("el foco no se pierde al enviar y un segundo envío se ignora", async () => {
    // La respuesta se entrega a mano. Una acción que nunca terminara dejaría pendiente
    // la Transition y enredaría las acciones de las pruebas siguientes: por eso, aunque
    // esta prueba falle a la mitad, al terminar se responde lo que quede pendiente.
    const creado: RespuestaFalsa = {
      status: 201,
      cuerpo: { nombre: "correo", tipo: "disponible", codigoHttp: 200, duracionMs: 75 },
    };
    let responder: (respuesta: RespuestaFalsa) => void = () => {};
    const fetchFalso = instalarFetchFalso({
      "POST /api/servicios": () => new Promise<RespuestaFalsa>((listo) => (responder = listo)),
    });
    onTestFinished(() => responder(creado));
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "correo");
    await usuario.type(screen.getByLabelText("Dirección"), "https://correo.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Dar de alta" }));

    await usuario.keyboard(" ");
    const pendiente = await screen.findByRole("button", { name: "Dando de alta…" });
    // jsdom no saca el foco de un botón desactivado (Chrome sí: lo manda al body), así
    // que se comprueba la causa: el botón sigue habilitado y anuncia que no está disponible.
    expect(pendiente.hasAttribute("disabled")).toBe(false);
    expect(pendiente.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(pendiente);

    // Un segundo Espacio mientras está pendiente. Si no se ignorara, React lo pondría en
    // cola y lo enviaría en cuanto terminara el primero: por eso se cuenta al final.
    await usuario.keyboard(" ");
    responder(creado);

    expect(await screen.findByRole("button", { name: "Descartar: Se dio de alta correo" })).toBeDefined();
    expect(document.activeElement).toBe(await screen.findByRole("button", { name: "Dar de alta" }));
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  test("un nombre repetido se marca en su campo con el mensaje de la API", async () => {
    instalarFetchFalso({
      "POST /api/servicios": {
        status: 409,
        cuerpo: { detalle: "ya existe un servicio llamado pagos", campos: { nombre: "ese nombre ya existe" } },
      },
    });
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "pagos");
    await usuario.type(screen.getByLabelText("Dirección"), "https://pagos.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));

    expect(await screen.findByText("ese nombre ya existe")).toBeDefined();
    expect(screen.getByLabelText("Nombre").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Dirección").getAttribute("aria-invalid")).toBe("false");
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("pagos");
  });
});
```

**Sem dados marca os três campos e anuncia.** A API não tem nenhuma rota declarada (`instalarFetchFalso({})`), então qualquer requisição responderia 404. O teste clica em «Dar de alta» com o formulário vazio e verifica quatro coisas: o texto do alerta, `aria-invalid="true"` nos três campos (encontrados por seu rótulo, em um `for`), o `aria-describedby` do nome com o erro **antes** da ajuda (a ordem em que o leitor os lê, lição 7), e que o `fetch` não tenha sido chamado nunca. Essa última é a que demonstra que a validação ocorre no navegador: se o formulário mandasse a requisição e esperasse a API reclamar, o teste continuaria vendo erros (a API falsa responderia 404), mas `not.toHaveBeenCalled()` ficaria vermelho.

**Com dados válidos envia o cadastro e confirma.** A API responde 201. O teste digita nos três campos, clica e espera o botão «Descartar: Se dio de alta correo», que só existe quando há um aviso na bandeja. Depois afirma que o texto «Se dio de alta correo.» com ponto, o que teria um formulário com sua própria região de sucesso (a versão com dois `status` que a lição 7 descartou em 7.3.3), **não** está: o sucesso é anunciado em um só lugar. Por fim lê o corpo da primeira chamada ao `fetch`: `fetchFalso.mock.calls[0]` é o array de argumentos `[entrada, opciones]`, e a desestruturação `const [, opciones]` pula o primeiro. O corpo é JSON, então é convertido com `JSON.parse` e comparado com `toEqual`. Repare na URL: a pessoa digitou `https://correo.example` e viajou `https://correo.example/`, com a barra final que o schema acrescenta. O teste documenta essa normalização.

**Declara os obrigatórios e a bandeja anuncia só o aviso novo.** Duas das correções da lição 7, em um teste. `campo.required` é a propriedade do DOM que reflete o atributo `required`; o `as HTMLInputElement` diz ao TypeScript que o encontrado por rótulo é um `<input>`, porque `findByLabelText` só promete um `HTMLElement`. E a bandeja é encontrada por seu role de região e seu nome, «Avisos», e dentro dela o `status`, para ler seu `aria-atomic`. É um teste de atributos, não de comportamento: o jsdom não tem leitor de tela, então o mais perto que pode chegar é verificar que o atributo de que o leitor precisa está colocado.

**O foco não se perde ao enviar e um segundo envio é ignorado.** O teste mais cuidadoso da suíte, e o que a cena precisava para o botão. Vai por partes.

1. *A resposta é entregue manualmente.* A rota `POST /api/servicios` é uma função que devolve uma promise e guarda seu `listo` na variável `responder`. Enquanto ninguém chamar `responder`, o cadastro fica pendente, e o teste pode olhar o formulário nesse estado pelo tempo que quiser. É a versão controlável de `nuncaResponde`.
2. *`onTestFinished(() => responder(creado))`.* Se o teste falhasse no meio, o cadastro ficaria pendente para sempre, e com ele a *Transition* do React que o envolve (lição 7). O comentário do arquivo diz o que aconteceria: essa ação sem terminar embaralharia as ações dos testes seguintes. Por isso, aconteça o que acontecer, ao terminar responde-se o que tiver ficado pendente.
3. *Chegar ao botão como faria Raúl.* Digita nos três campos e pressiona Tab: o foco passa do último campo para o botão. O teste verifica com `document.activeElement`, o elemento que tem o foco.
4. *Enviar com Espaço.* `usuario.keyboard(" ")` sobre o botão focalizado. O teste espera o botão «Dando de alta…», que só existe enquanto `useFormStatus` diz `pending`.
5. *Verificar a causa, não o efeito.* Aqui está a decisão mais importante, e o comentário a diz: o jsdom não tira o foco de um botão desabilitado; o Chrome tira. Se o teste verificasse apenas `document.activeElement`, passaria também com `disabled={pending}`, porque no jsdom o foco fica onde estava mesmo que no navegador vá para o `body`. Por isso verifica primeiro o que **causa** a conservação do foco: que o botão **não** tenha o atributo `disabled` e que **tenha** `aria-disabled="true"`. O `activeElement` também é verificado, mas é a afirmação fraca; a forte é a anterior. A seção 8.5 mede essa diferença entre o jsdom e o Chrome.
6. *O segundo Espaço.* Com o cadastro ainda pendente, outro `usuario.keyboard(" ")`. Se a guarda do `BotonEnviar` não cancelasse o clique, o React colocaria esse segundo envio na fila.
7. *Responder e contar.* `responder(creado)` termina o cadastro. O teste espera o aviso da bandeja, verifica que o foco esteja no botão, que já voltou a dizer «Dar de alta», e que o `fetch` tenha sido chamado **uma** vez.

**Um nome repetido é marcado em seu campo com a mensagem da API.** A API responde 409 com `campos.nombre`. O teste espera o texto do erro («ese nombre ya existe», que vem da API e não do schema), verifica que só «Nombre» fique inválido e que «Dirección» continue em `false`, e que o campo conserve o que foi digitado. Essa última linha protege o `defaultValue` a partir do estado da lição 7: se `Campo` recebesse um valor fixo, o React esvaziaria o campo depois da ação, e a pessoa teria de digitar tudo de novo por um único erro.

### 8.4 O teste que fica vermelho ao reverter a correção

#### 8.4.1 O experimento

Um teste verde responde «o código cumpre isto?». Não responde «este teste notaria se a correção desaparecesse?». Para a segunda pergunta há um experimento direto, e é o que dá nome à seção:

1. Copie o ponto de controle (ou trabalhe em um branch que será descartado).
2. Desfaça **apenas** a correção que o teste diz proteger, em um único arquivo.
3. Rode só o arquivo de testes que a cobre.
4. Leia o vermelho: falha o teste que se esperava, pela razão que se esperava, com uma mensagem que explica o problema?
5. Restaure e rode de novo.

Se no passo 4 tudo continuar verde, o teste não protege essa correção, por mais bem escrito que pareça. Isso não é um fracasso do experimento: é justamente o que o experimento serve para descobrir. Foi feito com três correções do curso, uma delas desfeita de duas formas, e as quatro reversões ficaram vermelhas. O exercício 2 acrescenta uma quarta correção. E no exercício 3 será escrito um teste que não passa no exame.

Rodar um único arquivo é `npx vitest run` seguido do caminho, ou de um pedaço dele: `npx vitest run src/alta` roda todos os arquivos de teste cujo caminho contenha `src/alta`. É mais rápido e a saída não se mistura com o resto.

#### 8.4.2 O zero solto

A correção da lição 1: em `ResumenFallas.tsx`, a condição é `{fallas > 0 && …}`. Na cópia foi trocada pela versão «mais curta» da cena:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ResumenFallas.tsx src/reporte/ResumenFallas.tsx
10c10
<       {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
---
>       {fallas && <strong> · {textoFallas(fallas)}</strong>}
$ npx vitest run src/reporte/PaginaReporte.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/PaginaReporte.test.tsx (7 tests | 1 failed) 256ms
   ❯ la página del reporte (7)
     ✓ cargando: anuncia la carga mientras la API no responde 36ms
     ✓ error: muestra el motivo y un botón para reintentar 58ms
     ✓ vacío: lo dice en lugar de dejar la lista en blanco 28ms
     ✓ con datos: un enlace por servicio y el resumen de fallas 25ms
     × sin fallas no pinta un 0 suelto en el resumen 16ms
     ✓ el filtro «solo fallas» viaja en la dirección 57ms
     ✓ una dirección con el filtro ya puesto abre filtrada 35ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/PaginaReporte.test.tsx > la página del reporte > sin fallas no pinta un 0 suelto en el resumen
AssertionError: expected '2 servicios revisados0' to be '2 servicios revisados' // Object.is equality

Expected: "2 servicios revisados"
Received: "2 servicios revisados0"

 ❯ src/reporte/PaginaReporte.test.tsx:48:33
     46|     montarEn("/");
     47|     const resumen = await screen.findByText(/servicios revisados/);
     48|     expect(resumen.textContent).toBe("2 servicios revisados");
       |                                 ^
     49|   });
     50|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  04:04:54
   Duration  1.13s (environment 53%, tests 25%, transform 8%, import 7%, setup 6%)
```

Um teste vermelho de sete, o que devia. Leia a mensagem de baixo para cima, que é como melhor se lê uma falha. O resumo: `Tests  1 failed | 6 passed (7)`. O nome: «sin fallas no pinta un 0 suelto en el resumen», que já diz o que aconteceu. A comparação: `Expected: "2 servicios revisados"` contra `Received: "2 servicios revisados0"`. E o lugar: a linha 48 do arquivo de testes, com uma seta sob `toBe`.

O `0` colado no final é o erro da lição 1, visto de dentro de um teste: quando `fallas` vale `0`, a expressão `0 && <strong>…</strong>` vale `0`, e o React renderiza números (não renderiza `false`, `null` nem `undefined`, mas sim `0`). Os outros seis testes continuam verdes, e isso também é informação: em particular, «con datos» continua verde, porque com duas falhas `fallas && …` se comporta igual a `fallas > 0 && …`. **Um único teste deste arquivo distingue a correção do erro**, e é o que tem dados sem falhas. Se ele não existisse, a suíte diria «tudo bem» com o erro da cena dentro.

Restaurado o arquivo, o arquivo de testes volta a `7 passed (7)`, e a suíte completa, a 27 de 27.

#### 8.4.3 O botão que leva o foco

A correção da lição 7: `BotonEnviar` leva `aria-disabled={pending}` e cancela o clique enquanto está pendente, em vez de `disabled={pending}`. Há **duas** formas de desfazê-la, e o teste tem que notar as duas.

A primeira é a da cena: voltar a `disabled`.

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/BotonEnviar.tsx src/alta/BotonEnviar.tsx
17c17
<     <button type="submit" aria-disabled={pending} onClick={alPulsar}>
---
>     <button type="submit" disabled={pending} onClick={alPulsar}>
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 362ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 75ms
     ✓ con datos válidos envía el alta y confirma 96ms
     ✓ declara los obligatorios y la bandeja anuncia solo el aviso nuevo 9ms
     × el foco no se pierde al enviar y un segundo envío se ignora 94ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 87ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 ❯ src/alta/FormularioAlta.test.tsx:82:48
     80|     // jsdom no saca el foco de un botón desactivado (Chrome sí: lo ma…
     81|     // que se comprueba la causa: el botón sigue habilitado y anuncia …
     82|     expect(pendiente.hasAttribute("disabled")).toBe(false);
       |                                                ^
     83|     expect(pendiente.getAttribute("aria-disabled")).toBe("true");
     84|     expect(document.activeElement).toBe(pendiente);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:26
   Duration  1.31s (environment 43%, tests 29%, import 11%, transform 10%, setup 6%)
```

Falha na linha 82, `expect(pendiente.hasAttribute("disabled")).toBe(false)`, com `expected true to be false`: o botão pendente tem o atributo `disabled`. Repare em **onde** falha: na verificação da causa, duas linhas antes da do foco. Se o teste não tivesse essa linha, chegaria a `expect(document.activeElement).toBe(pendiente)`, e no jsdom isso **passaria**, porque o jsdom deixa o foco no botão mesmo que esteja desabilitado (8.5). O teste estaria verde com o erro que a lição 7 mediu no Chrome. Essa linha existe porque alguém fez este experimento.

Repare também no que sai **antes** do vermelho: um aviso em `stderr`, «A suspended resource finished loading inside a test, but the event was not wrapped in act(...)». É o caso que 8.2.1 anunciou, uma atualização quando já ninguém estava esperando. O teste falhou na linha 82, antes de chegar a `responder(creado)`; ao terminar, o `onTestFinished` entregou a resposta pendente, e a ação do formulário terminou fora de qualquer `act`. A mensagem fala de um «recurso suspenso» porque é assim que o React chama a promise que estava esperando. Com o ponto de controle, o teste chega a `responder(creado)` dentro de seu corpo e o aviso não aparece. É a linha de `IS_REACT_ACT_ENVIRONMENT` em `preparar.ts` que torna este aviso visível: sem ela, o vermelho sairia igual, mas calado.

A segunda forma de desfazer é mais sutil: deixar o `aria-disabled`, que fica bem na revisão de código, e tirar a guarda que cancela o clique.

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/BotonEnviar.tsx src/alta/BotonEnviar.tsx
17c17
<     <button type="submit" aria-disabled={pending} onClick={alPulsar}>
---
>     <button type="submit" aria-disabled={pending}>
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 1387ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 77ms
     ✓ con datos válidos envía el alta y confirma 97ms
     ✓ declara los obligatorios y la bandeja anuncia solo el aviso nuevo 9ms
     × el foco no se pierde al enviar y un segundo envío se ignora 1095ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 109ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
TestingLibraryElementError: Unable to find role="button" and name "Descartar: Se dio de alta correo"

Ignored nodes: comments, script, style
<body>
[… recortado: 141 líneas del DOM (encabezado, bandeja y los tres campos) …]
          <button
            aria-disabled="true"
            type="submit"
          >
            Dando de alta…
          </button>
        </form>
        <div
          id="resultado-alta"
        >
          <div
            role="alert"
          />
        </div>
        <section
          aria-label="Altas de esta sesión"
        >
          <h3>
            Altas de esta sesión
          </h3>
          <ul>
            <li
              class="pendiente"
            >
              correo
               (agregando…)
            </li>
          </ul>
        </section>
      </section>
    </main>
  </div>
</body>
[… recortado: la salida imprime el mismo DOM otra vez, 177 líneas …]
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ src/alta/FormularioAlta.test.tsx:91:25
     89|     responder(creado);
     90|
     91|     expect(await screen.findByRole("button", { name: "Descartar: Se di…
       |                         ^
     92|     expect(document.activeElement).toBe(await screen.findByRole("butto…
     93|     expect(fetchFalso).toHaveBeenCalledTimes(1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:27
   Duration  1.79s (tests 80%, environment 14%, import 3%, setup 2%, transform 2%)
```

Desta vez falha na linha 91 (e volta a sair o aviso de `act`, duas vezes, pela mesma razão de antes), `findByRole("button", { name: "Descartar: Se dio de alta correo" })`, com «Unable to find role="button"». A saída real imprime o DOM completo da página, mais de cem linhas; acima foram deixados o começo e o final, e o corte está marcado. O final é o que importa: depois de `responder(creado)` e um segundo inteiro de espera, o botão **continua** dizendo «Dando de alta…» com `aria-disabled="true"`, e «Altas de esta sesión» continua mostrando `correo (agregando…)`. O segundo Espaço não foi ignorado: colocou um segundo envio na fila. Esse segundo envio chamou o `fetch` de novo, que guardou um novo `responder` que ninguém chamou, e o formulário ficou pendente. O que se vê no DOM é isso; o que se deduz, e a lição 7 explicou, é que o React junta as ações em curso, e o aviso da primeira não se confirma na tela enquanto a segunda não terminar. É a mesma razão pela qual o teste conta as chamadas ao `fetch` **no final**: um segundo envio na fila não se vê enquanto o primeiro está pendente.

Na lição 7 este mesmo erro foi medido no Chrome, com o registro da API: um `201` seguido de um `409`. Aqui o mesmo teste o detecta em menos de dois segundos, sem API e sem navegador.

As duas variantes dão `Tests  1 failed | 4 passed (5)` em `src/alta`. Restaurado, `5 passed (5)`.

#### 8.4.4 O error boundary das rotas

A correção da lição 5: `ErrorBoundary: ErrorDeRuta` na rota raiz. Na cópia foi apagada essa linha de `rutas.tsx`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/app/rutas.tsx src/app/rutas.tsx
13d12
<     ErrorBoundary: ErrorDeRuta,
$ npx vitest run src/app
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/app/rutas.test.tsx (3 tests | 1 failed) 1089ms
   ❯ las rutas (3)
     ✓ una dirección desconocida muestra la página de no encontrada 59ms
     ✓ el menú marca la página actual 8ms
     × una página que se rompe al dibujar muestra el aviso del revisor 1019ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/app/rutas.test.tsx > las rutas > una página que se rompe al dibujar muestra el aviso del revisor
TestingLibraryElementError: Unable to find role="alert"

Ignored nodes: comments, script, style
<body>
  <div>
    <h2>
      Unexpected Application Error!
    </h2>
    <h3
      style="font-style: italic;"
    >
      la página se rompió al dibujar
    </h3>
    <pre
      style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);"
    >
      Error: la página se rompió al dibujar
[… recortado: 10 renglones de la pila …]
    </pre>
    <p>
      💿 Hey developer 👋
    </p>
    <p>
      You can provide a way better UX than this when your app throws errors by providing your own
      <code
        style="padding: 2px 4px; background-color: rgba(200, 200, 200, 0.5);"
      >
        ErrorBoundary
      </code>
       or

      <code
        style="padding: 2px 4px; background-color: rgba(200, 200, 200, 0.5);"
      >
        errorElement
      </code>
       prop on your route.
    </p>
  </div>
</body>
[… recortado: la salida imprime el mismo DOM otra vez, 48 líneas …]
 ❯ PaginaRota src/app/rutas.test.tsx:11:9
      9|
     10| function PaginaRota(): never {
     11|   throw new Error("la página se rompió al dibujar");
       |         ^
     12| }
     13|
 ❯ Object.react_stack_bottom_frame node_modules/react-dom/cjs/react-dom-client.development.js:28571:20
 ❯ renderWithHooks node_modules/react-dom/cjs/react-dom-client.development.js:8030:22
 ❯ updateFunctionComponent node_modules/react-dom/cjs/react-dom-client.development.js:10569:19
 ❯ beginWork node_modules/react-dom/cjs/react-dom-client.development.js:12205:18
 ❯ runWithFiberInDEV node_modules/react-dom/cjs/react-dom-client.development.js:1048:13
 ❯ performUnitOfWork node_modules/react-dom/cjs/react-dom-client.development.js:19176:22
 ❯ workLoopSync node_modules/react-dom/cjs/react-dom-client.development.js:19004:41
 ❯ renderRootSync node_modules/react-dom/cjs/react-dom-client.development.js:18985:11
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ src/app/rutas.test.tsx:44:32

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  04:05:30
   Duration  2.20s (tests 56%, environment 36%, import 3%, transform 3%, setup 2%)
```

«Unable to find role="alert"», e abaixo, o DOM que de fato havia: o boundary padrão do React Router, com «Unexpected Application Error!», a mensagem, a stack trace (cortada acima) e o parágrafo que sugere colocar o próprio `ErrorBoundary` ou `errorElement` na rota. Esse parágrafo existe apenas na versão de desenvolvimento do React Router: o Vitest não roda em modo de produção (`NODE_ENV` vale `test`), de modo que o Vite carrega essa versão, assim como carrega a do React (repare em `react-dom-client.development.js` na stack trace). É a tela que a lição 5 mostrou no Chrome, agora como texto na saída de um teste. A saída real imprime esse DOM duas vezes; a segunda cópia foi retirada. `Tests  1 failed | 2 passed (3)`.

Os três testes passaram no exame, quatro vezes. O que têm em comum vale mais do que cada um: **cada um afirma exatamente o que a correção mudou**. O resumo é comparado inteiro, não com um `toContain`. O botão é verificado por seu atributo, não só pelo foco. O alerta é buscado por seu role, e além disso se verifica que não apareça o texto do boundary alheio. Quando um teste afirma algo mais fraco do que a correção, o erro passa pelo buraco.

### 8.5 O que o jsdom não consegue verificar

#### 8.5.1 Um DOM que não renderiza

O jsdom implementa o DOM, os eventos, os formulários e a leitura das folhas de estilo (sabe que regra se aplica a cada elemento, como mostra a linha 4 da figura). O que não faz é **renderizar**. Seu README põe duas coisas fora do seu alcance: a navegação (mudar de página ao seguir um link ou ao atribuir `location.href`) e o layout, que define como a capacidade de calcular onde os elementos ficarão por efeito do CSS. Para o layout há valores de preenchimento, e muitas propriedades devolvem zeros ([jsdom, README](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform)).

Isso tem uma consequência que não é óbvia: há comportamentos do navegador que dependem da renderização mesmo que não pareçam ser de renderização. O foco é um. A figura 3 faz quatro perguntas ao jsdom, sem React, e uma página HTML gêmea faz as mesmas quatro ao Chrome:

```tsx
// fig08_03.tsx
import { JSDOM } from "jsdom";

// Sin React a propósito: lo que se mide aquí es el DOM de prueba, no la biblioteca.
// `pretendToBeVisual` le da a jsdom un requestAnimationFrame, para esperar dos cuadros
// como en fig08_03.html, la misma página para Chrome.
const dom = new JSDOM(`<!doctype html>
<style>
  button[aria-disabled="true"] { opacity: 0.6; cursor: not-allowed; }
  .oculto { display: none; }
</style>
<button type="submit" id="enviar">Dar de alta</button>
<button type="button" id="escondido" class="oculto">Escondido</button>`, { pretendToBeVisual: true });

const { document } = dom.window;
const enviar = document.getElementById("enviar") as HTMLButtonElement;
const escondido = document.getElementById("escondido") as HTMLButtonElement;

function quienTieneElFoco(): string {
  const activo = document.activeElement;
  return activo === null ? "nadie" : activo.id === "" ? activo.tagName.toLowerCase() : `#${activo.id}`;
}

console.log("1. el foco en un botón que se desactiva");
enviar.focus();
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);
enviar.disabled = true;
console.log(`   después de disabled = true: foco en ${quienTieneElFoco()}`);
await new Promise((listo) => dom.window.requestAnimationFrame(() => dom.window.requestAnimationFrame(listo)));
console.log(`   dos cuadros después: foco en ${quienTieneElFoco()}`);
enviar.disabled = false;
enviar.focus();

console.log("2. el foco en un elemento con display: none");
escondido.focus();
console.log(`   display calculado: ${dom.window.getComputedStyle(escondido).display}`);
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);

console.log("3. el diseño");
const caja = enviar.getBoundingClientRect();
console.log(`   getBoundingClientRect(): ${caja.width} × ${caja.height} en (${caja.x}, ${caja.y})`);
console.log(`   offsetWidth: ${enviar.offsetWidth}`);

console.log("4. la hoja de estilos");
enviar.setAttribute("aria-disabled", "true");
const estilo = dom.window.getComputedStyle(enviar);
console.log(`   opacity: ${estilo.opacity}, cursor: ${estilo.cursor}`);

dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_03.tsx
$ node fig08_03.js
1. el foco en un botón que se desactiva
   después de focus(): foco en #enviar
   después de disabled = true: foco en #enviar
   dos cuadros después: foco en #enviar
2. el foco en un elemento con display: none
   display calculado: none
   después de focus(): foco en #enviar
3. el diseño
   getBoundingClientRect(): 0 × 0 en (0, 0)
   offsetWidth: 0
4. la hoja de estilos
   opacity: 0.6, cursor: not-allowed
```

E a página gêmea, `fig08_03.html` (está junto da figura, com o mesmo HTML e os mesmos passos escritos em JavaScript de navegador), aberta no Chrome *headless*:

```bash
$ google-chrome --headless --disable-gpu --no-first-run \
    --user-data-dir="$PWD/perfil" --virtual-time-budget=3000 --dump-dom "file://$PWD/fig08_03.html"
1. el foco en un botón que se desactiva
   después de focus(): foco en #enviar
   después de disabled = true: foco en #enviar
   dos cuadros después: foco en body
2. el foco en un elemento con display: none
   display calculado: none
   después de focus(): foco en #enviar
3. el diseño
   getBoundingClientRect(): 81.21875 × 21 en (8, 8)
   offsetWidth: 81
4. la hoja de estilos
   opacity: 0.6, cursor: not-allowed
```

(O que se mostra é o conteúdo do `<pre id="salida">` onde a página escreve seus resultados; o `--dump-dom` imprime a página inteira. No Chromium o executável se chama `chromium`; no macOS, onde esta saída foi medida, o caminho é `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. O `--virtual-time-budget` deixa correr os temporizadores e os quadros de animação antes de imprimir. E o `--user-data-dir` usa um perfil novo do Chrome na pasta `perfil/`, para não mexer no perfil de quem executa: apague-a ao terminar e não a suba para o repositório.)

Compare linha por linha.

**1. O foco em um botão que é desabilitado.** Logo depois de `disabled = true`, **os dois** dizem que o foco continua em `#enviar`. Dois quadros de animação depois, o Chrome diz `body` e o jsdom continua dizendo `#enviar`. A especificação do HTML explica a diferença. Nos passos de «atualizar a renderização» (*update the rendering*), que o navegador executa quando vai renderizar um quadro, há um que diz: se a área focalizada do documento deixou de ser uma área focalizável, executam-se os passos de foco sobre o *viewport* do documento (na prática, o foco cai no `body`, que é o que o Chrome reporta). E dá como exemplo justamente isto: que um controle receba `disabled` ([WHATWG, HTML, «Update the rendering»](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)). A especificação a chama de uma correção **assíncrona**: não ocorre ao colocar o atributo, mas na renderização seguinte. O jsdom não renderiza, então essa correção nunca chega, mesmo que com `pretendToBeVisual` se lhe dê `requestAnimationFrame`. É a medição da lição 7 (no Chrome, enquanto o cadastro estava pendente, o foco já estava no `body`), explicada a partir da especificação e vista no jsdom. E é a razão da linha 82 do teste do formulário.

Repare em um detalhe da primeira linha do Chrome: mesmo em um navegador real, uma verificação **imediata** teria dito «o foco continua no botão». Um teste que olhasse o foco logo depois de desabilitar o botão estaria errado nos dois lados.

**2. O foco em um elemento com `display: none`.** Aqui o jsdom acerta: os dois rejeitam o `focus()` e o foco fica onde estava. O jsdom de fato aplica a folha de estilos para saber que o elemento não é exibido. Convém saber disso para não culpar o jsdom pelo que ele faz.

**3. O layout.** O Chrome mede o botão: 81.21875 por 21 pixels, na posição (8, 8), que é a margem padrão do `body`. O jsdom diz `0 × 0 em (0, 0)` e `offsetWidth: 0`. Qualquer teste que dependa de tamanhos ou posições (se algo cabe, se saiu da tela, se dois elementos se sobrepõem) não pode ser feito no jsdom. Ele não falha: devolve zeros com toda a tranquilidade, o que é pior.

**4. A folha de estilos.** Os dois calculam `opacity: 0.6` e `cursor: not-allowed` para o botão com `aria-disabled="true"`, a partir da regra da folha de estilos. O jsdom resolve a cascata do CSS para `getComputedStyle`. O que ele não pode dizer é se esse cinza se **vê**, ou se cumpre o contraste que a MDN pede para um controle desabilitado (lição 7): isso é design e percepção.

#### 8.5.2 O que fazer com o que o jsdom não vê

A figura deixa três regras para escrever testes, e uma lista do que fica para verificar manualmente.

**Quando o efeito não se vê, verifique a causa.** O foco que se perde é um efeito da renderização. Sua causa é um atributo, `disabled`, que o jsdom de fato vê. O teste do formulário verifica a causa (sem `disabled`, com `aria-disabled="true"`) e deixa a do efeito como afirmação secundária. Funciona porque a relação entre causa e efeito foi medida em um navegador (lição 7) e é respaldada pela especificação (8.5.1). Sem essa medição, verificar a causa seria uma suposição.

**Não escreva um teste que passe pela razão errada.** Um teste de jsdom que afirmasse «o foco não se perde» olhando apenas `document.activeElement` seria verde com o código bom e com o ruim. É o teste que não passa no exame de 8.4, e a pior classe de teste: a que dá confiança sem merecê-la.

**Nomeie o buraco.** O comentário da linha 80 do arquivo de testes diz, em uma frase, o que o jsdom não consegue ver e o que se verifica em seu lugar. Quem ler o teste daqui a seis meses não vai «simplificá-lo» tirando a linha do atributo.

E o que esta suíte **não** verifica, mesmo estando verde:

- **O percurso real com o teclado**: que o Tab passe pelos elementos em ordem, que o contorno de `:focus-visible` se veja, que o foco não se perca em um navegador. O teste do formulário cobre um trecho (do último campo ao botão, e o botão durante o envio), com a ressalva de 8.5.1.
- **O que soa em um leitor de tela.** A suíte verifica que os roles, nomes, `aria-invalid`, `aria-describedby`, `aria-atomic` e `required` estejam colocados. Se o NVDA, o Orca ou o VoiceOver os anunciam como se espera é outra pergunta, e se responde escutando.
- **O layout**: que nada se sobreponha, que o botão atenuado se distinga, que o painel compacto caiba em uma tela estreita.
- **A rede e o servidor de verdade**: o *proxy* do Vite, a API de prática, a reescrita para `index.html` da lição 9. O `fetch` falso responde o que o teste diz; se a API real mudasse a forma de suas respostas, o `tsc -b` notaria pelos tipos compartilhados, mas nenhum destes testes.

Para essas coisas existem os testes de ponta a ponta, que conduzem um navegador real. Este curso não os ensina; o que faz é deixá-los escritos como passos manuais em «Como saber se deu certo». A ordem de custo é clara: um teste de jsdom leva milissegundos e roda a cada mudança; um teste em um navegador leva segundos e precisa de um navegador instalado; uma revisão com um leitor de tela leva minutos e precisa de uma pessoa. As três se complementam, e nenhuma substitui a outra.

## O erro que vai aparecer

A lição tem um erro principal e dois de apoio.

**O erro principal: «Found multiple elements with the role "status"».** Se o teste de «carregando» for escrito da forma natural, `await screen.findByRole("status")`, falha. A figura 1 mostrou isso com `getByRole`: na tela há duas regiões de status, a bandeja de avisos e a carga. `findByRole` é `getByRole` com espera, então também exige um só. A mensagem completa, em um teste do Vitest, imprime além disso o DOM com os dois elementos, e ali se vê qual é qual. Resolve-se de duas formas: buscar pelo texto e depois verificar o role, como faz a suíte; ou restringir a busca com `within` à parte da página onde está a carga. O que **não** resolve nada é `getAllByRole("status")[1]`: depende da ordem do DOM, e no dia em que a bandeja mudar de lugar o teste olhará o elemento errado sem avisar.

**O de apoio: «Unable to find role="…"» com um DOM de cem linhas.** Foi visto em 8.4.3 e 8.4.4. Assusta pelo tamanho, mas é a melhor ajuda que a Testing Library dá: quando uma consulta `get` ou `find` falha, imprime o estado do DOM ([Testing Library, «Debugging»](https://testing-library.com/docs/dom-testing-library/api-debugging)). Leia-o procurando o que se esperava encontrar. Quase sempre está ali com outro nome (um `aria-label` diferente), outro role (um `<div>` com `onClick`), ou ainda não chegou (um `getBy` onde devia ir um `findBy`). Se o DOM for longo demais, a documentação explica que ele é cortado em 7000 caracteres e que a variável `DEBUG_PRINT_LIMIT` muda esse limite.

**O silencioso: o teste que limpa pela metade.** Se `cleanup()` for tirado do `preparar.ts`, os testes que montam a aplicação começam a falhar com «Found multiple elements…» em lugares que nada têm a ver entre si, porque cada teste encontra no DOM o que o anterior deixou. Se `vi.unstubAllGlobals()` for tirado, o `fetch` falso de um teste fica para os seguintes do mesmo arquivo, e um teste pode passar com as rotas que outro declarou. Este segundo é o silencioso de verdade: não falha, apenas deixa de testar o que diz.

**O silencioso da ferramenta: o reporter que oculta o console.** Se o Vitest for executado a partir de uma ferramenta automatizada (um assistente de programação, um script que se identifica como agente), o Vitest pode escolher outro reporter sem avisar. Sua documentação explica: quando não há reporters configurados e ele detecta que roda dentro de um agente de programação, usa o reporter mínimo, que mostra apenas os testes que falham e suprime o console dos que passam e o resumo por arquivo ([Vitest, «Reporters»](https://vitest.dev/guide/reporters.html)). Com esse reporter, um aviso de `act` em um teste verde não se vê. Em um terminal comum isso não acontece, mas se alguma vez uma ferramenta disser «sem avisos», convém pedir `--reporter=default`.

## O que se faz errado

**Buscar por classes de CSS ou pela estrutura do DOM.** `container.querySelector(".resumen strong")` passa mesmo que o resumo deixe de ser legível para um leitor de tela, e quebra quando alguém muda um nome de classe sem mudar nada que uma pessoa veja. Busque por role, rótulo ou texto.

**`getByTestId` como primeira opção.** Um `data-testid` é um atributo que só existe para o teste: encontra o elemento mesmo que não tenha role nem nome. A Testing Library o põe no fim de sua lista por essa razão.

**Testar a implementação.** Ler o estado de um componente, contar quantas vezes foi renderizado ou verificar que `establecerAltas` foi chamado. Esses testes quebram a cada refatoração que não muda nada para a pessoa, e continuam verdes com erros que mudam algo para ela. Teste o que se vê, se ouve ou se envia.

**Simular módulos da aplicação com `vi.mock`.** Substituir `cargar.ts` ou `useReintentar.ts` deixa de fora justamente a parte que costuma quebrar: a validação, a chave da consulta, a invalidação. Simule a fronteira externa, o `fetch`, e deixe o resto rodar.

**Compartilhar o `QueryClient` entre testes.** O cache de um teste aparece no seguinte: o carregamento não se vê e um teste passa com os dados de outro.

**Novas tentativas ativadas nos testes.** Com `retry: 2`, cada teste de erro espera as novas tentativas antes de mostrar o erro, e um teste de erro pode estourar o limite de um segundo do `findBy`.

**`fireEvent` para o que faz uma pessoa.** Um único evento não move o foco nem respeita um campo desabilitado. Use `user-event` e espere cada ação com `await`.

**Esquecer o `await`.** `usuario.click(boton)` sem `await` compara antes de o clique ocorrer. O teste pode passar por acaso e falhar no dia em que a máquina estiver carregada.

**Um `expect` que não pode falhar.** `expect(screen.getByText("Dar de alta")).toBeDefined()` nunca falha em seu `expect`: se o texto não está, o `getByText` já lançou, e se está, está definido. A suíte usa essa forma algumas vezes, de propósito: o que afirma é o `getBy` ou o `findBy`, e o `expect` apenas faz a linha se ler como afirmação. O que se faz errado é acreditar que o `toBeDefined()` verifica algo mais.

**Dar um teste por bom porque está verde.** Se não foi visto em vermelho com a correção desfeita, não se sabe se ele protege algo. O exercício 3 tem um que não protege.

**Um teste que passa no jsdom pela razão errada.** Afirmar o foco no jsdom depois de desabilitar um botão, medir tamanhos, esperar que um `<a href>` sem roteador carregue outra página. Se o jsdom não calcula o efeito, verifique a causa e nomeie o buraco.

**Silenciar o console para toda a suíte.** Um `console.error` silenciado em `preparar.ts` esconde os avisos do React que delatam erros de verdade (uma `key` repetida, uma atualização fora de `act`). Silencie apenas o que um teste provoca de propósito, só durante esse teste, e restaure com `onTestFinished`.

## Exercícios

### Exercício 1 — Escolha a consulta

Sem rodar nada, escreva no diário de bordo que consulta usaria (família `getBy`, `queryBy` ou `findBy`, e tipo `ByRole`, `ByLabelText` ou `ByText`) para cada afirmação, e por quê:

1. Ao terminar de carregar, o relatório mostra uma lista.
2. Com a API vazia, **não** há lista.
3. O campo «Dirección» ficou marcado como inválido depois de enviar vazio (o formulário já está renderizado).
4. Aparece o botão para descartar o aviso de cadastro de `correo`.
5. O carregamento é anunciado como região de status.

Depois busque cada caso na suíte do ponto de controle e compare.

### Exercício 2 — O obrigatório que desaparece

Em uma cópia do ponto de controle, tire o atributo `required` de `src/alta/Campo.tsx`. **Antes** de rodar qualquer coisa, preveja: quantos testes ficam vermelhos, quais, em que linha e com que mensagem? Rode `npx vitest run src/alta` e compare. Restaure ao terminar. E mais uma pergunta: o que mudaria para uma pessoa, no navegador, se esse atributo faltasse? (Dica: a lição 7, árvore de acessibilidade.)

### Exercício 3 — O teste que não passa no exame

A lição 2 corrigiu um erro com `key`: o rascunho de uma nota não deve ser arrastado de um serviço para outro. Hoje vive em `PaginaServicio.tsx`, em `<EditorNota key={nombre} …>`, e o ponto de controle **não** tem um teste para ele. Escreva-o em um arquivo novo, `src/detalle/EditorNota.test.tsx`: monte em `/servicios/pagos`, escreva um rascunho no campo «Nota sobre pagos» sem salvá-lo, navegue para `/servicios/reportes` com `await act(() => enrutador.navigate("/servicios/reportes"))` (importe `act` de `@testing-library/react`) e verifique que o campo «Nota sobre reportes» esteja vazio. Declare no `fetch` falso as duas rotas de detalhe.

Quando estiver verde, faça o exame de 8.4: tire `key={nombre}` em uma cópia e rode de novo. **Ele fica vermelho?** Se não, explique por quê e corrija-o até que fique. Dica: veja o que `PaginaServicio` renderiza enquanto a consulta do serviço novo está pendente.

### Exercício 4 — Os dados antigos

O ponto de controle não testa o quinto estado do relatório: a atualização falha, mas continua se mostrando o último relatório que chegou, com um aviso. Escreva esse teste em `src/reporte/DatosViejos.test.tsx`. É preciso que a primeira requisição a `/api/estados` responda bem e as seguintes com 503 (uma função na tabela do falso pode manter a conta), e uma forma de provocar a segunda requisição sem esperar os dez segundos do polling (procure em `PaginaReporte.tsx` um botão). Verifique o texto exato do aviso e que a lista continue ali com seus quatro links. Depois faça o exame: em uma cópia, troque em `ContenidoReporte.tsx` a condição `consulta.isError && consulta.data === undefined` por `consulta.isError` e verifique que o teste fica vermelho.

Segunda parte, o estado «atualizando»: no mesmo arquivo, escreva outro teste em que a primeira requisição responda bem e a segunda **nunca responda** (já existe `nuncaResponde`). Depois de pressionar «Actualizar», verifique que apareça `· actualizando…` junto à hora, que a lista continue com seus quatro links e que **não** apareça «Cargando…». O exame deste: em uma cópia, troque em `ContenidoReporte.tsx` o `if (consulta.isPending)` por `if (consulta.isFetching)`. Que diferença da lição 4 este teste protege?

## Soluções

### Solução 1

1. `findByRole("list")`: a lista **vai chegar** depois de um `fetch`, e é um elemento com role. É a primeira linha de «com dados».
2. `queryByRole("list")` dentro de `expect(…).toBeNull()`: afirma-se uma **ausência**, e `getBy` lançaria antes do `expect`. Mas antes é preciso um `findBy…` de algo que de fato aparece («No hay servicios configurados todavía.»): se não, o teste afirmaria a ausência enquanto a página ainda está carregando, e passaria pela razão errada. É assim que «vazio» faz.
3. `getByLabelText("Dirección")` e depois seu `aria-invalid`: o formulário já está renderizado e o campo **tem que** estar; `getBy`. Na suíte, o teste espera primeiro o alerta com `findByRole("alert")`, que é o sinal de que o envio terminou, e depois usa `getByLabelText` nos três campos. `getByRole("textbox", { name: "Dirección" })` também funcionaria.
4. `findByRole("button", { name: "Descartar: Se dio de alta correo" })`: chega depois da ação, e o nome acessível é o do `aria-label`, não o texto visível «Descartar» (figura 2).
5. `findByText("Cargando…")` e depois verificar `role="status"`: `findByRole("status")` falha porque há duas regiões de status (figura 1 e «O erro que vai aparecer»).

Se em algum caso foi escolhida outra família, convém perguntar o que a versão escolhida afirmaria que a da suíte não afirma, ou o contrário. As duas coisas que mais se confundem são «espera» contra «já está» e «tem que estar» contra «não deve estar».

### Solução 2

Fica vermelho **um** teste, «declara los obligatorios y la bandeja anuncia solo el aviso nuevo», na linha 52, com `expected false to be true`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/Campo.tsx src/alta/Campo.tsx
26d25
<         required
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 363ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 72ms
     ✓ con datos válidos envía el alta y confirma 91ms
     × declara los obligatorios y la bandeja anuncia solo el aviso nuevo 7ms
     ✓ el foco no se pierde al enviar y un segundo envío se ignora 110ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 82ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > declara los obligatorios y la bandeja anuncia solo el aviso nuevo
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ src/alta/FormularioAlta.test.tsx:52:30
     50|     for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)…
     51|       const campo = (await screen.findByLabelText(etiqueta)) as HTMLIn…
     52|       expect(campo.required).toBe(true);
       |                              ^
     53|     }
     54|     const bandeja = screen.getByRole("region", { name: "Avisos" });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:33
   Duration  935ms (tests 44%, environment 39%, import 6%, setup 5%, transform 5%)
```

O teste para no primeiro campo, «Nombre», porque o `expect` da volta do `for` lança ao falhar; por isso não se veem os outros dois. Os demais testes do arquivo continuam verdes: o formulário tem `noValidate`, então o navegador nunca usou o `required` para impedir o envio, e a validação quem faz é o schema. O que muda para a pessoa é o que a lição 7 mediu na árvore de acessibilidade: sem `required`, os três campos passam de `required=true` a `required=false`, e um leitor de tela deixa de anunciar «obrigatório» ao chegar a cada um. Nada muda à vista. É o exemplo perfeito de uma correção que só um teste (ou um leitor de tela) pode notar.

### Solução 3

O teste como o enunciado pede:

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, versión ingenua
const { enrutador, usuario } = montarEn("/servicios/pagos");
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

Está verde. E em uma cópia **sem** `key={nombre}`, continua verde (para rodar as duas versões lado a lado, a ingênua foi guardada como `EditorNotaIngenua.test.tsx`):

```bash
$ npx vitest run src/detalle/EditorNotaIngenua.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNotaIngenua.test.tsx (1 test) 116ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:37
   Duration  478ms (environment 49%, tests 27%, import 9%, setup 8%, transform 6%)
```

Não passa no exame. A razão está em `PaginaServicio`: `EditorNota` só é renderizado quando a consulta já tem dados (`consulta.data !== undefined`). Ao navegar para `reportes`, a consulta desse serviço ainda não tem dados, então a página mostra «Cargando detalle…» e **desmonta** o editor. Quando os dados chegam, monta um novo, com seu estado novo. O rascunho se perde por essa razão, com `key` ou sem ela. O teste verifica algo verdadeiro, mas não o que a `key` corrige.

O caso que a `key` corrige é quando a página **não** passa por «carregando»: quando o serviço de destino já está no cache. Então os dados já estão desde a primeira renderização, `EditorNota` fica no mesmo lugar da árvore, e sem `key` o React o reutiliza com seu estado. O bom teste visita primeiro `reportes` para que seu detalhe fique no cache:

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, la que pasa el examen
const { enrutador, usuario } = montarEn("/servicios/reportes");
await screen.findByRole("textbox", { name: "Nota sobre reportes" });
await act(() => enrutador.navigate("/servicios/pagos"));
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

O `fetch` falso declara as duas rotas; para `reportes` basta copiar `detallePagos` trocando o nome:

```tsx
// fragmento: la tabla del fetch falso en EditorNota.test.tsx
instalarFetchFalso({
  "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
  "GET /api/servicios/reportes": {
    status: 200,
    cuerpo: { ...detallePagos, nombre: "reportes", estado: { ...detallePagos.estado, nombre: "reportes" } },
  },
});
```

Com o ponto de controle, verde:

```bash
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNota.test.tsx (1 test) 120ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:34
   Duration  522ms (environment 49%, tests 26%, import 10%, transform 8%, setup 7%)
```

E sem `key={nombre}`, vermelho, com o rascunho de `pagos` no editor de `reportes`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/detalle/PaginaServicio.tsx src/detalle/PaginaServicio.tsx
46d45
<             key={nombre}
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/detalle/EditorNota.test.tsx (1 test | 1 failed) 131ms
   × el borrador de una nota no se arrastra a otro servicio 131ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/detalle/EditorNota.test.tsx > el borrador de una nota no se arrastra a otro servicio
AssertionError: expected 'revisar el lunes' to be '' // Object.is equality

- Expected
+ Received

+ revisar el lunes

 ❯ src/detalle/EditorNota.test.tsx:24:24
     22|   await act(() => enrutador.navigate("/servicios/reportes"));
     23|   const editor = (await screen.findByRole("textbox", { name: "Nota sob…
     24|   expect(editor.value).toBe("");
       |                        ^
     25| });
     26|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:05:36
   Duration  695ms (environment 54%, tests 21%, import 9%, setup 8%, transform 7%, worker 1%)
```

O `act` é necessário aqui porque `enrutador.navigate` muda o estado da aplicação de fora de uma interação da Testing Library, e envolvê-lo em `act` faz o React aplicar todas as mudanças antes da linha seguinte. A versão que passa no exame e o teste do exercício 4 passaram no `npx eslint` e no `tsc` sem avisos. O que se leva daqui é a ideia, mais do que o teste: **um teste pode verificar algo verdadeiro por uma razão diferente da que se imagina**, e a única maneira de saber é o experimento.

### Solução 4

Uma forma de escrevê-lo:

```tsx
// fragmento: src/reporte/DatosViejos.test.tsx
test("datos viejos: si la actualización falla, conserva la lista y lo avisa", async () => {
  // La primera petición responde bien; las siguientes, 503.
  const respuestas: RespuestaFalsa[] = [{ status: 200, cuerpo: reporteDeEjemplo }];
  instalarFetchFalso({
    "GET /api/estados": async () => respuestas.shift() ?? { status: 503, cuerpo: { detalle: "caída" } },
  });
  const { usuario } = montarEn("/");
  await screen.findByRole("list");

  await usuario.click(screen.getByRole("button", { name: "Actualizar" }));

  const aviso = await screen.findByRole("alert");
  expect(aviso.textContent).toBe(
    "Mostrando el último reporte que llegó: la actualización falló (la API respondió 503).",
  );
  expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(4);
});
```

(Importa `screen` e `within` de `@testing-library/react`, `expect` e `test` de `vitest`, `reporteDeEjemplo` de `../pruebas/datos`, `instalarFetchFalso` e o tipo `RespuestaFalsa` de `../pruebas/fetchFalso`, e `montarEn` de `../pruebas/montar`.)

O array `respuestas` é a conta: `shift()` tira a primeira resposta na primeira vez e devolve `undefined` depois, e o `??` converte esse `undefined` no 503. O botão «Actualizar» de `PaginaReporte` chama `consulta.refetch()`, que provoca a segunda requisição sem esperar o polling. Com o ponto de controle:

```bash
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (1 test) 137ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:35
   Duration  649ms (environment 42%, tests 24%, transform 14%, import 12%, setup 7%, worker 1%)
```

Com a condição trocada por `consulta.isError`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ContenidoReporte.tsx src/reporte/ContenidoReporte.tsx
21c21
<   if (consulta.isError && consulta.data === undefined) {
---
>   if (consulta.isError) {
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/DatosViejos.test.tsx (1 test | 1 failed) 88ms
   × datos viejos: si la actualización falla, conserva la lista y lo avisa 87ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/DatosViejos.test.tsx > datos viejos: si la actualización falla, conserva la lista y lo avisa
AssertionError: expected 'No se pudo cargar el reporte: la API …' to be 'Mostrando el último reporte que llegó…' // Object.is equality

Expected: "Mostrando el último reporte que llegó: la actualización falló (la API respondió 503)."
Received: "No se pudo cargar el reporte: la API respondió 503Reintentar"

 ❯ src/reporte/DatosViejos.test.tsx:19:29
     17|
     18|   const aviso = await screen.findByRole("alert");
     19|   expect(aviso.textContent).toBe(
       |                             ^
     20|     "Mostrando el último reporte que llegó: la actualización falló (la…
     21|   );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:05:38
   Duration  579ms (environment 56%, tests 18%, import 10%, setup 8%, transform 7%, worker 1%)
```

O `Received` conta a história: sem `consulta.data === undefined`, qualquer erro manda para a tela de erro, e a pessoa perde a lista que já tinha por causa de uma atualização que falhou; o `Reintentar` colado no final é o texto do botão, que o `textContent` junta com o do parágrafo. A segunda afirmação do teste (a lista com quatro links) não chegou a rodar, porque a primeira já falhou; se se quiser ver as duas, basta trocá-las de ordem. Se o teste escrito usou outro caminho para a segunda requisição (por exemplo, invalidar a consulta), também vale, desde que passe no exame.

A segunda parte, no mesmo arquivo (acrescente `nuncaResponde` à importação de `../pruebas/fetchFalso`):

```tsx
// fragmento: src/reporte/DatosViejos.test.tsx, segunda prueba
test("actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista", async () => {
  // La primera petición responde bien; la segunda no responde nunca.
  const respuestas: RespuestaFalsa[] = [{ status: 200, cuerpo: reporteDeEjemplo }];
  instalarFetchFalso({
    "GET /api/estados": () => {
      const siguiente = respuestas.shift();
      return siguiente === undefined ? nuncaResponde() : Promise.resolve(siguiente);
    },
  });
  const { usuario } = montarEn("/");
  await screen.findByRole("list");

  await usuario.click(screen.getByRole("button", { name: "Actualizar" }));

  expect((await screen.findByText(/· actualizando…/)).textContent).toMatch(/^Actualizado a las .+ · actualizando…$/);
  expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(4);
  expect(screen.queryByText("Cargando…")).toBeNull();
});
```

A hora não é comparada exata, porque muda a cada execução: a expressão regular pede que o parágrafo comece com «Actualizado a las», tenha algo no meio e termine em `· actualizando…`. Com o ponto de controle, os dois testes do arquivo em verde:

```bash
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (2 tests) 143ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  04:06:36
   Duration  784ms (environment 49%, tests 20%, import 11%, setup 10%, transform 10%)
```

Com `consulta.isFetching` em vez de `consulta.isPending`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ContenidoReporte.tsx src/reporte/ContenidoReporte.tsx
17c17
<   if (consulta.isPending) {
---
>   if (consulta.isFetching) {
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/DatosViejos.test.tsx (2 tests | 1 failed) 161ms
   ✓ datos viejos: si la actualización falla, conserva la lista y lo avisa 126ms
   × actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista 34ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/DatosViejos.test.tsx > actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista
TestingLibraryElementError: Unable to find an accessible element with the role "list"
[… recortado: la lista de roles accesibles y el principio del DOM, 218 líneas …]
        <p
          role="status"
        >
          Cargando…
        </p>
        <p
          class="actualizado"
        >
          Actualizado a las
          4:06:38 a.m.
           · actualizando…
        </p>
        <button
          disabled=""
          type="button"
        >
          Actualizar
        </button>
      </section>
    </main>
  </div>
</body>
 ❯ Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 ❯ src/reporte/DatosViejos.test.tsx:40:24
     38|
     39|   expect((await screen.findByText(/· actualizando…/)).textContent).toM…
     40|   expect(within(screen.getByRole("list")).getAllByRole("link")).toHave…
       |                        ^
     41|   expect(screen.queryByText("Cargando…")).toBeNull();
     42| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Start at  04:06:37
   Duration  600ms (environment 44%, tests 30%, import 9%, transform 9%, setup 7%)
```

No DOM cortado se vê o problema: enquanto chega o relatório novo, a tela diz «Cargando…» onde estava a lista, embora o cache tenha o relatório anterior. É a diferença da lição 4 entre `status` («há dados?») e `fetchStatus` («há uma requisição em curso?»): `isPending` é «ainda não há dados», `isFetching` é «está se pedindo algo», e confundi-las apaga a lista a cada polling, a cada dez segundos. O primeiro teste do arquivo continua verde com essa mudança: cada um protege uma correção diferente. Os dois passaram no `npx eslint` e no `tsc`.

## Como saber se deu certo

- [ ] `npm ci`, `npm run lint` e `npm run build` terminam bem dentro de `~/curso-react/revisor/`, e `npm run build` deixa `dist/assets/index-C_lOH5GL.js`, **o mesmo nome da lição 7**: os testes não mudaram a aplicação.
- [ ] `npm test` termina com `Test Files  7 passed (7)` e `Tests  27 passed (27)`, lidos do resumo, não do código de saída. Com `npx vitest run --reporter=verbose`, veem-se as 27 linhas com `✓` e seus nomes.
- [ ] Com `npx vitest run --reporter=default`, a saída da suíte não tem nenhum `stderr` nem nenhum aviso que mencione `act(`. E ficou comprovado que isso significa algo: sem a linha de `IS_REACT_ACT_ENVIRONMENT` em `preparar.ts`, o teste de controle de 8.1.3 não avisa; com ela, avisa.
- [ ] O exame de 8.4 foi feito com pelo menos duas correções, em uma cópia: `fallas > 0` em `ResumenFallas.tsx` e a guarda `onClick={alPulsar}` em `BotonEnviar.tsx`. Cada uma deixou vermelho o teste que a lição indica, com a mensagem que a lição indica; restaurado, tudo voltou a verde.
- [ ] As figuras 1, 2 e 3 dão na máquina de quem executa a mesma saída da lição, e a página `fig08_03.html` no Chrome diz `body` na linha «dos cuadros después».
- [ ] Foi escrito o teste do exercício 3 que **fica** vermelho sem `key={nombre}`, e foi visto verde o que não fica.
- [ ] Foram escritos os dois testes do exercício 4 (dados antigos com erro e «actualizando…»), vistos em verde com o ponto de controle e cada um em vermelho com sua mudança (`consulta.isError` e `isFetching`). Com eles, os estados do relatório têm todos o seu teste.
- [ ] **Manualmente, com o teclado, no Chrome**, com `npm run servidor` e `npm run dev`: em `/servicios/nuevo`, preencher o formulário, chegar ao botão com Tab e enviar com Espaço. O contorno azul continua no botão enquanto diz «Dando de alta…» e depois. É a parte do teste do foco que o jsdom não consegue ver (8.5); na lição 7 está o passo a passo completo.
- [ ] **Manualmente, com um leitor de tela** (Orca no Mint, NVDA no Windows ou VoiceOver no macOS): repetir as verificações da lição 7 e anotar no [diário de bordo](bitacora.md) que atributos a suíte verifica e o que só foi verificado escutando.

## Resumo

Responda sem olhar a lição:

1. O que faz cada uma das cinco dependências novas, e por que o `jsdom` precisa estar instalado se é o Vitest quem o usa?
2. Por que o `preparar.ts` chama `cleanup` manualmente? O que aconteceria sem ele, e o que aconteceria sem `vi.unstubAllGlobals`?
3. Por que uma consulta por role e nome diz algo sobre a acessibilidade que uma consulta por texto não diz? Por que `getByRole("button", { name: "Descartar" })` não encontra o botão da bandeja?
4. O que afirma cada família, `getBy`, `queryBy` e `findBy`? Por que o teste de «carregando» busca por texto e depois verifica o role?
5. O que o `user-event` faz que o `fireEvent` não faz, e por que cada ação leva `await`?
6. Por que o ponto de controle simula o `fetch` e não os módulos da aplicação? O que o falso responde a uma rota que não foi declarada, e por quê?
7. Que três coisas o `montarEn` monta, e por que cada teste precisa de um `QueryClient` novo e sem novas tentativas?
8. Quais são os cinco passos do exame de 8.4? O que diz um teste que continua verde com a correção desfeita?
9. Por que o teste do foco verifica que o botão não tenha `disabled`, se o que importa é o foco? O que diz a especificação do HTML sobre quando se perde o foco de um controle desabilitado?
10. Nomeie três coisas que a suíte não verifica mesmo estando verde, e como se verifica cada uma.

## Leituras complementares

- [Testing Library, «About Queries»](https://testing-library.com/docs/queries/about/): as três famílias (`getBy`, `queryBy`, `findBy`) com suas versões `All`, a prioridade das consultas e o tempo limite do `findBy`. Consultado em 21 de outubro de 2026.
- [Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole): a opção `name`, os roles implícitos, a opção `hidden` e o custo de calcular a árvore de acessibilidade. Consultado em 21 de outubro de 2026.
- [Testing Library, «Guiding Principles»](https://testing-library.com/docs/guiding-principles): quanto mais os testes se parecem com o uso real, mais confiança dão. Consultado em 21 de outubro de 2026.
- [Testing Library, «Async Methods»](https://testing-library.com/docs/dom-testing-library/api-async/): `findBy` como `getBy` mais `waitFor`, o intervalo de 50 ms e o tempo limite de 1000 ms. Consultado em 21 de outubro de 2026.
- [Testing Library, «Debugging»](https://testing-library.com/docs/dom-testing-library/api-debugging): `logRoles`, `prettyDOM`, o DOM impresso nas falhas, `DEBUG_PRINT_LIMIT` e `COLORS`. Consultado em 21 de outubro de 2026.
- [Testing Library, API da React Testing Library](https://testing-library.com/docs/react-testing-library/api): `render`, o que devolve, e quando o `cleanup` é automático e quando não. Consultado em 21 de outubro de 2026.
- [Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro) e [seu teclado](https://testing-library.com/docs/user-event/keyboard): interações completas versus eventos soltos, `setup()` antes de renderizar, e como se escrevem as teclas. Consultado em 21 de outubro de 2026.
- [Vitest, «Test Environment»](https://vitest.dev/guide/environment.html): o ambiente `node` por padrão e o ambiente `jsdom`. Consultado em 21 de outubro de 2026.
- [Vitest, `globals`](https://vitest.dev/config/globals.html) e [«Reporters»](https://vitest.dev/guide/reporters.html): por que `globals` vale `false` por padrão e que bibliotecas dependem dos globais para limpar sozinhas; que reporter o Vitest escolhe e qual oculta o console dos testes que passam. Consultado em 21 de outubro de 2026.
- [Vitest, `vi`](https://vitest.dev/api/vi.html), [`mock`](https://vitest.dev/api/mock.html) e [«Hooks»](https://vitest.dev/api/hooks.html): `vi.fn`, `vi.spyOn`, `vi.stubGlobal`, `vi.unstubAllGlobals`, `mock.calls`, `mockRestore`, `afterEach` e `onTestFinished`. Consultado em 21 de outubro de 2026.
- [React, `act`](https://react.dev/reference/react/act): aplicar as mudanças pendentes antes de comparar, `IS_REACT_ACT_ENVIRONMENT`, e por que a React Testing Library já o usa por nós. Consultado em 21 de outubro de 2026.
- [React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter): o roteador com histórico em memória e `initialEntries`. Consultado em 21 de outubro de 2026.
- [jsdom, README, «Unimplemented parts of the web platform»](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform): a navegação e o layout fora do seu alcance, os zeros de preenchimento e `pretendToBeVisual`. Consultado em 21 de outubro de 2026.
- [WHATWG, HTML, «Update the rendering»](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering): a correção assíncrona do foco quando o elemento focalizado deixa de ser focalizável, por exemplo ao ser desabilitado. Consultado em 21 de outubro de 2026.
- [MDN, atributo `disabled`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled): um controle desabilitado não recebe o foco nem eventos como o clique. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| teste de componente | um teste que renderiza componentes em um DOM de teste e os usa como faria uma pessoa |
| Vitest | o executor de testes que usa a configuração do Vite; fornece `test`, `describe`, `expect` e `vi` |
| jsdom | um DOM escrito em JavaScript, sem layout nem renderização, onde os testes rodam |
| consulta | uma função da Testing Library que busca elementos: `getBy…`, `queryBy…`, `findBy…` e suas versões `All` |
| role implícito | o role que um elemento nativo tem sem escrever `role`: `<button>` é `button`, `<ul>` é `list` |
| `user-event` | biblioteca que simula interações completas de uma pessoa: digitar, clicar, pressionar teclas |
| `fetch` simulado | um `fetch` substituído no teste que responde conforme uma tabela de rotas, sem rede |
| roteador em memória | um roteador do React Router que guarda seu histórico em memória, sem barra de endereços |
| `act` | ferramenta do React que aplica as mudanças pendentes antes de comparar; a Testing Library o usa por nós |
| o exame do teste | desfazer a correção que um teste protege, vê-lo em vermelho e restaurar; se continuar verde, não protege nada |
| correção do foco | o passo do navegador que, ao renderizar o quadro seguinte, tira o foco de um elemento que deixou de ser focalizável |

---

**Próxima:** [Lição 9 — Desempenho, publicação e quando usar um framework](09-rendimiento-publicacion.md)
