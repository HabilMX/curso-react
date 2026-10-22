# Lição 1 — Componentes puros e composição

*São 6h50 da tarde e a chefe de operação quer, para amanhã cedo, uma única linha no topo do painel: quantos serviços foram verificados e quantos falham. Parece uma alteração de cinco minutos. A gente abre `Panel.tsx` e dá de cara com um arquivo onde convivem a linha, a lista, os três estados de carregamento e o botão; para acrescentar uma linha, é preciso entender as quatro coisas ao mesmo tempo. A gente acrescenta como dá e testa com os dados de sempre: parece tudo certo. Às 7h30 alguém do turno da noite reinicia a API com todos os serviços saudáveis e, no final da linha nova, colado a «revisados», surge um `0` que ninguém escreveu: `4 servicios revisados0`. Mais tarde, ao ordenar a lista «para ficar bonita», a lista mantida por outra parte do programa também fica ordenada, sem que ninguém tenha pedido isso. E quando um colega coloca um contador em um componente «auxiliar» definido dentro do painel, o contador volta a zero a cada dez segundos, a cada atualização. Nada disso quebra a compilação nem o linter. Esta lição divide o painel em peças compreensíveis separadamente e ensina as três regras que evitam esses três sustos.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 1.3 e 1.4)

**O que se constrói:** o painel dividido em peças que podem ser compreendidas e alteradas separadamente: um `Tarjeta` que envolve qualquer conteúdo, um resumo de falhas calculado com funções puras, e a lista, a linha e os três estados de carregamento em arquivos próprios

**O que se aprende:** render e *commit*; pureza: mesmas entradas, mesma saída; três impurezas plantadas para encontrar; `children` e composição; `key` com um identificador estável; a armadilha do `0` renderizado por `&&`; por que um componente jamais é definido dentro de outro

**De onde a gente vem.** Da [Lição 0](00-un-proyecto-de-verdad.md). O `revisor` já é um projeto Vite com o linter do React ativado, `StrictMode` ativo, um *proxy* para o servidor de prática e um `Panel.tsx` que faz tudo: define `FilaEstado`, define `Contenido` com o `switch` dos três estados de carregamento e monta a página. Funciona e passa no linter. O que ele não tem é forma: é um arquivo só com três responsabilidades. O trabalho segue na mesma pasta, `~/curso-react/revisor/`.

**O que esta lição não faz.** Não acrescenta estado novo: não há filtros, nem seleção, nem anotações; isso chega na [Lição 2](02-estado-instantanea-forma.md). Não mexe em `useReporte` nem na fronteira de rede: o hook e `cargar.ts` ficam idênticos. Não altera o servidor de prática, que continua na primeira versão (`GET /salud` e `GET /api/estados`). E não faz otimizações: vai dar para ver que o React volta a chamar os componentes mais vezes do que se espera, e a resposta desta lição não é «faça memoização», mas «certifique-se de que chamar a mais não faça mal». Medir e otimizar é tema da [Lição 9](09-rendimiento-publicacion.md).

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas definidas pelo `package.json` do ponto de controle (as mesmas da Lição 0: React 19.3.1, Vite 8.3.5, ESLint 10.13.0, `eslint-plugin-react-hooks` 7.1.1). Salvo o aviso de `fsevents` explicado na seção 1.7, nada do que se mostra depende do sistema operacional. Nas execuções do curso, este ponto de controle foi instalado novamente do zero em um contêiner Linux (`node:24.22.0-bookworm`) e gerou o mesmo nome de arquivo em `dist/` mostrado aqui, `index-Dezp5bTH.js`; como esse nome vem de um fragmento do hash do conteúdo, é muito provável que as duas máquinas tenham produzido o mesmo pacote. As figuras foram executadas apenas no macOS; nada foi executado em um Linux Mint real. As soluções dos exercícios foram executadas à parte, com o Node.js 24.22.0, e seus programas e saídas estão em [`programas/01-componentes-puros-composicion/ejercicios/`](../programas/01-componentes-puros-composicion/ejercicios). O que se vê «no navegador» foi medido com o Chrome em modo *headless* (`--headless --dump-dom`), que executa o JavaScript da página e entrega o documento resultante. As figuras rodam em `~/curso-react/figuras/`, a mesma pasta da Lição 0, com o mesmo `package.json`; os caminhos longos impressos pelo ESLint são mostrados a partir de `~/curso-react`. Os horários do registro do servidor de prática estão em UTC. Os programas estão em [`programas/01-componentes-puros-composicion/`](../programas/01-componentes-puros-composicion): `revisor/` é o ponto de controle e as figuras estão ao lado dele.

## Ao terminar, vai ser possível

- Distinguir em uma saída real que parte é *render* (o React chama as funções) e que parte é *commit* (o React mexe no DOM), e explicar por que um render a mais não altera a tela.
- Encontrar as três impurezas de um componente — alterar algo de fora, mutar uma prop, ler o relógio — e corrigir cada uma sem alterar o que a pessoa vê.
- Dividir um componente grande em peças com uma única responsabilidade e escrever um componente que receba `children` para envolver conteúdo que não conhece.
- Escolher a `key` de uma lista e demonstrar com uma execução o que acontece com o estado de cada linha quando a `key` é a posição, quando muda com a posição e quando é o identificador.
- Reconhecer a armadilha do `0` em um `&&` e escrever a condição para que nunca renderize um número solto.
- Interpretar o erro `static-components` do linter e explicar, com uma execução, por que um componente definido dentro de outro perde o estado.

## O porquê antes do como

Abra o `Panel.tsx` da Lição 0 e conte quantas perguntas distintas ele responde. Como se vê um serviço disponível e como um com falha? Isso é `FilaEstado`. O que é mostrado durante o carregamento, se o carregamento falhar e quando houver dados? Isso é `Contenido`. O que a página traz ao redor, o título e o botão? Isso é `Panel`. Três perguntas em um arquivo de sessenta linhas. Hoje dá para ler; o problema é o que vem pela frente. Nas próximas lições, o painel vai ganhar um filtro, uma seleção, anotações, o detalhe de cada serviço, avisos e um formulário. Se tudo isso entrar no mesmo arquivo, a chefe de operação da cena vai pedir uma linha e a gente vai ter que ler trezentas.

A resposta óbvia é «divida em componentes». E é a resposta correta, mas dividir sem entender o que é um componente para o React produz peças que quebram de formas estranhas: o `0` que aparece sozinho, a lista que se ordena sem ninguém encostar nela, o contador que volta a zero a cada atualização. Essas três falhas têm a mesma raiz: **o React não chama os componentes quando a gente imagina, nem a quantidade de vezes que a gente pensa.** Ele os chama sempre que algo puder ter mudado, às vezes duas vezes seguidas, e confia que chamá-los não trará consequências. Se um componente cumpre esse trato, dá para dividi-lo, movê-lo e reutilizá-lo sem medo. Se não cumpre, cada peça nova multiplica as surpresas.

Por isso esta lição não começa dividindo arquivos, mas com três ideias, uma por seção principal:

1. **Pureza** (1.1 e 1.2). O que o React faz quando «renderiza» e por que os componentes precisam ser funções puras: mesmas entradas, mesma saída, e nada de alterar o que existia antes de serem chamados.
2. **Composição** (1.3). Como dividir um componente por responsabilidades e como um componente pode envolver conteúdo que não conhece, com `children`.
3. **Identidade** (1.4 a 1.6). Como o React sabe que a linha de `pagos` desta renderização é a mesma da anterior: a `key`, a posição na árvore e a razão pela qual um componente jamais é definido dentro de outro. A armadilha do `0` entra aqui também, porque é um caso de «o React renderizou algo que não se esperava».

A seção 1.7 faz o percurso completo: verificar o ponto de controle e vê-lo no navegador. No final, esta é a compilação que se obtém, e vai dar para entender por que o JavaScript mudou de nome em relação à Lição 0, mesmo que o painel «faça a mesma coisa»:

```text
$ npm run build

> revisor@0.1.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 26 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-BUsPRE_Z.css    0.35 kB │ gzip:  0.22 kB
dist/assets/index-Dezp5bTH.js   222.34 kB │ gzip: 69.68 kB

✓ built in 225ms
```

Vinte e seis módulos em vez de vinte: são os seis arquivos novos desta lição. O painel mostra o mesmo de antes, mais um cartão com seu cabeçalho e uma linha de resumo; a grande diferença não se vê na tela, vê-se quando alguém precisa alterá-lo.

## Os conceitos

### 1.1 Render e *commit*: o que o React faz quando «renderiza»

#### 1.1.1 Três passos, não um

Até agora costumava-se dizer «o React renderiza o componente» como se fosse uma coisa só. A documentação do React divide isso em três passos, com uma analogia de restaurante: alguém **dispara** o pedido, a cozinha o **prepara** e o garçom o **leva** à mesa. No React, chamam-se *trigger*, *render* e *commit*, e toda atualização da tela passa pelos três ([React, «Render and Commit»](https://react.dev/learn/render-and-commit)):

1. **Disparar** (*trigger*). Algo pede uma renderização: o primeiro `createRoot(...).render(...)` ao abrir a página, ou uma mudança de estado, como o `establecerCarga` de `useReporte` quando chega a resposta.
2. **Render.** O React **chama as funções de componente**. Chama `Panel`, `Panel` devolve JSX que menciona `Tarjeta`, o React chama `Tarjeta`, e assim por diante, para baixo. A documentação diz que o processo é recursivo: segue até não restarem mais componentes aninhados e o React saber exatamente o que deve ser mostrado. O resultado deste passo não é a tela; é uma descrição de como ela deveria ficar.
3. ***Commit.*** O React aplica ao DOM as diferenças que já calculou durante o render e **mexe no DOM apenas onde houver diferença**. A comparação entre a descrição nova e a anterior ocorre enquanto renderiza; no *commit*, apenas se executam as alterações. Nas palavras da documentação: o React só altera os nós do DOM se houver diferença entre um render e outro, aplicando as operações mínimas necessárias, «calculadas durante o render».

Depois do *commit*, o navegador volta a pintar a tela. A documentação chama esse último passo de *painting* (pintar) para não confundir com o render do React. Neste curso usa-se a mesma distinção: **render** é quando o React chama as funções; **pintar** é quando o navegador desenha os pixels. Em português, «renderizar» é o verbo usado para render, como na documentação oficial do React em português.

O render produz uma **árvore**: `Panel` no topo, `Tarjeta` abaixo, depois `ContenidoReporte`, e assim por diante. A documentação chama isso de árvore de render e esclarece que é formada apenas por componentes do React ([React, «Understanding Your UI as a Tree»](https://react.dev/learn/understanding-your-ui-as-a-tree)). Essa árvore vai importar em 1.4 e 1.6, quando a pergunta for como o React sabe se um componente deste render é o mesmo do anterior.

#### 1.1.2 Observar isso em uma execução

A primeira figura torna isso visível. Uma lista de duas linhas imprime uma linha de texto a cada vez que o React chama um componente (render), e um `MutationObserver` — a API do navegador que avisa quando algo muda no DOM — conta quantos registros de mudança o contêiner recebeu em cada *commit* (as «alterações no DOM» da saída). Renderiza-se três vezes: a primeira vez, outra com os mesmos dados e outra com um número diferente.

```tsx
// fig01_01.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Servicio = { readonly nombre: string; readonly ms: number };

function Fila({ servicio }: { readonly servicio: Servicio }) {
  console.log(`  render: Fila ${servicio.nombre}`);
  return (
    <li>
      {servicio.nombre}: {servicio.ms} ms
    </li>
  );
}

function Lista({ servicios }: { readonly servicios: readonly Servicio[] }) {
  console.log("  render: Lista");
  return (
    <ul>
      {servicios.map((servicio) => (
        <Fila key={servicio.nombre} servicio={servicio} />
      ))}
    </ul>
  );
}

const contenedor = dom.window.document.getElementById("raiz")!;
let cambios = 0;
const observador = new dom.window.MutationObserver((registros) => {
  cambios += registros.length;
});
observador.observe(contenedor, { childList: true, subtree: true, characterData: true });
const raiz = createRoot(contenedor);

async function dibujar(titulo: string, servicios: readonly Servicio[]): Promise<void> {
  console.log(titulo);
  await act(async () => {
    raiz.render(<Lista servicios={servicios} />);
  });
  cambios += observador.takeRecords().length;
  console.log(`  commit: cambios en el DOM = ${cambios}`);
  cambios = 0;
}

await dibujar("1) primera vez:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 118 },
]);
await dibujar("2) mismos datos:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 118 },
]);
await dibujar("3) cambia un número:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 97 },
]);
console.log(`DOM final: ${contenedor.innerHTML}`);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_01.tsx
$ node fig01_01.js
1) primera vez:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 1
2) mismos datos:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 0
3) cambia un número:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 1
DOM final: <ul><li>catálogo: 42 ms</li><li>inventario: 97 ms</li></ul>
```

Leia as três partes com calma, porque toda a lição se apoia nelas:

- **Na primeira vez**, o React chamou os três componentes e o *commit* produziu um único registro de mudança: a inserção da `<ul>` completa, com as duas linhas dentro, de uma vez só. (Um `MutationObserver` entrega registros do que mudou no contêiner, não uma lista das operações internas do React; por isso o `1` quer dizer «a `<ul>` foi inserida», não «o React fez exatamente uma operação». [MDN, `MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).)
- **Com os mesmos dados**, o React voltou a chamar os três componentes — o render ocorreu completo — e o *commit* fez **zero** alterações. O React comparou, não encontrou diferenças e não tocou no DOM.
- **Com um número diferente**, novamente chamou os três, incluindo a linha de `catálogo`, que não mudou. O *commit* produziu um único registro de mudança: o texto `118` passou para `97`. Não substituiu a linha nem a lista; alterou um nó de texto.

Duas conclusões saem daqui, e as duas vão contra a intuição. A primeira: **o fato de o React chamar um componente não significa que a tela mude.** Um render é uma pergunta («como isso deveria ficar agora?»), não um comando de repintura. A segunda: **o React chama os componentes mais vezes do que seria necessário**: a linha de `catálogo` foi calculada três vezes, duas delas sem que nada nela tivesse mudado. Isso não é um defeito a ser caçado com `memo` (a [Lição 9](09-rendimiento-publicacion.md) explica quando sim, e sempre depois de medir); faz parte do design. O React pode se dar ao luxo de chamar a mais porque conta com uma condição: que chamar o componente não traga consequências. Essa condição tem nome.

#### 1.1.3 Por que isso importa para dividir o painel

Quando o painel era uma peça só, cada render chamava `Panel`, `Contenido` e quatro `FilaEstado`. Agora que vai ser dividido, serão mais componentes, e cada um será chamado a cada render do pai. Se algum deles «fizer algo» ao ser chamado — somar um contador, alterar um array, ler a hora —, esse algo vai se repetir tantas vezes quanto o React decidir chamá-lo, e ninguém controla quantas são. Por isso a pureza vem antes da divisão: é o que torna seguro ter muitas peças.

### 1.2 Pureza: mesmas entradas, mesma saída

#### 1.2.1 As duas condições

A documentação do React define um componente puro com duas condições, tiradas da definição de função pura na matemática e na programação ([React, «Keeping Components Pure»](https://react.dev/learn/keeping-components-pure)):

- **Cuida das próprias coisas.** Não altera nenhum objeto nem variável que já existisse antes da chamada.
- **Mesmas entradas, mesma saída.** Com as mesmas entradas, devolve sempre o mesmo resultado.

Quais são as entradas de um componente? A própria página diz: no React há três tipos de entrada que se podem ler durante a renderização, que são props, estado e contexto, e as três são tratadas **como somente leitura**. Hoje usam-se apenas props; o estado chega na [Lição 2](02-estado-instantanea-forma.md) e o contexto na [Lição 6](06-reducer-contexto.md), e a regra será a mesma para os três. A referência das regras do React formula isso com uma palavra técnica: os componentes precisam ser **idempotentes**, devolvendo sempre a mesma saída em relação às entradas, porque o React pode renderizar um componente várias vezes para oferecer a melhor experiência possível ([React, «Components and Hooks must be pure»](https://react.dev/reference/rules/components-and-hooks-must-be-pure)).

O que é permitido é alterar o que o próprio componente acabou de criar. A documentação chama isso de **mutação local**: se dentro do componente for criado um array novo e elementos forem acrescentados a ele, ninguém de fora vê isso, e a próxima chamada cria outro array novo. O problema nunca é mutar; o problema é mutar algo que **já existia** antes da chamada.

#### 1.2.2 Três impurezas plantadas

A segunda figura tem um componente com três impurezas escondidas em três linhas seguidas. Antes de ler a explicação, examine o código e a saída e tente encontrá-las. As pistas estão na saída: cada uma das linhas 2, 3 e 4 é o sintoma de uma delas.

```tsx
// fig01_02.tsx
import { JSDOM } from "jsdom";
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Servicio = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

let revision = 0;

function ResumenImpuro({ servicios }: { readonly servicios: Servicio[] }) {
  revision = revision + 1;
  const ordenados = servicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  const hora = new Date().toISOString().slice(11, 19);

  return (
    <p>
      Revisión {revision} a las {hora}: {ordenados.map((s) => s.nombre).join(", ")}
    </p>
  );
}

const servicios: Servicio[] = [
  { nombre: "pagos", tipo: "falla" },
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "reportes", tipo: "falla" },
];
const nombres = () => servicios.map((s) => s.nombre).join(", ");

console.log(`1) el arreglo antes de dibujar:   ${nombres()}`);
const raiz = createRoot(dom.window.document.getElementById("raiz")!);
await act(async () => {
  raiz.render(
    <StrictMode>
      <ResumenImpuro servicios={servicios} />
    </StrictMode>,
  );
});
console.log(`2) el arreglo después de dibujar: ${nombres()}`);
console.log(`3) se montó una vez y el contador dice: ${revision}`);

const horaDe = (html: string) => /a las (\d\d:\d\d:\d\d)/.exec(html)?.[1];
const primera = renderToStaticMarkup(<ResumenImpuro servicios={servicios} />);
await new Promise((listo) => setTimeout(listo, 1100));
const segunda = renderToStaticMarkup(<ResumenImpuro servicios={servicios} />);
console.log(`4) mismas props, ¿misma hora en los dos dibujos? ${horaDe(primera) === horaDe(segunda) ? "sí" : "no"}`);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_02.tsx
$ node fig01_02.js
1) el arreglo antes de dibujar:   pagos, catálogo, reportes
2) el arreglo después de dibujar: catálogo, pagos, reportes
3) se montó una vez y el contador dice: 2
4) mismas props, ¿misma hora en los dos dibujos? no
```

`renderToStaticMarkup` é uma função de `react-dom/server` que renderiza uma árvore e devolve o HTML em formato de texto, sem navegador nem DOM; aqui serve para renderizar o mesmo componente duas vezes, com um segundo de intervalo, e comparar. Se as três já foram encontradas, compare com a lista. Se não, leia novamente as três primeiras linhas do corpo de `ResumenImpuro` antes de continuar.

**Impureza 1: altera uma variável de fora.** `revision = revision + 1` modifica uma variável que existia antes de o componente ser chamado. O sintoma é a linha 3: montou-se **uma** vez e o contador diz **2**. Por quê? Porque o `StrictMode`, em desenvolvimento, chama cada componente duas vezes justamente para revelar isso; a documentação diz assim: ao chamar duas vezes as funções de componente, o `StrictMode` ajuda a encontrar os componentes que quebram essas regras ([React, «Keeping Components Pure»](https://react.dev/learn/keeping-components-pure)). Na Lição 0 viu-se o ciclo extra dos Effects; este é o irmão dele, o render extra. Em produção não haveria chamada dupla, mas também não há escapatória: o React pode chamar o componente toda vez que o pai for renderizado, e o número deixaria de significar «revisões» para significar «vezes que conveio ao React chamar o componente».

**Impureza 2: muta uma prop.** `servicios.sort(...)` parece que «calcula uma versão ordenada», mas `sort` ordena o array **no próprio lugar** e devolve o mesmo array ([MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). O sintoma é a linha 2: o array que pertencia a quem chamou o componente ficou reordenado. É o segundo susto da cena, a lista que se ordenou sozinha. As props são, nas palavras da documentação, fotografias imutáveis de um momento: não se alteram ([React, «Passing Props to a Component»](https://react.dev/learn/passing-props-to-a-component)).

**Impureza 3: lê o relógio.** `new Date()` devolve algo diferente a cada chamada, mesmo que as props continuem as mesmas. O sintoma é a linha 4: mesmas props, duas renderizações, dois horários diferentes. A referência do React usa este mesmo exemplo: `new Date()` não é idempotente, porque devolve a data atual e muda a cada chamada; o mesmo ocorre com `Math.random()` ([React, «Components and Hooks must be pure»](https://react.dev/reference/rules/components-and-hooks-must-be-pure)). Com um relógio no render, a saída depende de **quando** o React decidiu chamar o componente, algo que ninguém controla.

#### 1.2.3 Quem avisa sobre cada uma?

A pergunta prática é qual das ferramentas do curso pega cada impureza antes que ela chegue à pessoa usuária. Mediu-se com as três ferramentas do curso, e o resultado não é o que se esperaria.

**O linter pega a primeira.** Isto é o que o ESLint diz sobre a figura:

```text
$ npx eslint fig01_02.tsx

~/curso-react/figuras/fig01_02.tsx
  19:3  error  Error: Cannot reassign variables declared outside of the component/hook

Variable `revision` is declared outside of the component/hook. Reassigning this value during render is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render).

~/curso-react/figuras/fig01_02.tsx:19:3
  17 |
  18 | function ResumenImpuro({ servicios }: { readonly servicios: Servicio[] }) {
> 19 |   revision = revision + 1;
     |   ^^^^^^^^ `revision` cannot be reassigned
  20 |   const ordenados = servicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  21 |   const hora = new Date().toISOString().slice(11, 19);
  22 |  react-hooks/globals

✖ 1 problem (1 error, 0 warnings)
```

É a regra `globals`, uma das quatorze que vêm do React Compiler e que a Lição 0 ativou: valida que não sejam atribuídas nem mutadas variáveis globais durante o render ([React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals)). A mensagem até propõe as duas soluções: se o valor for usado para renderizar, que seja estado; se não, que seja atualizado em um Effect.

**As outras duas, o linter não viu.** Isso foi comprovado apagando a linha de `revision` em uma cópia e rodando o ESLint novamente: o único aviso restante foi `prefer-const` (porque `revision` já não era reatribuída), nada de React. Nem o `sort` sobre a prop nem o `new Date()` produziram erro. O segundo caso merece um comentário: a página da regra `purity` menciona `new Date()` entre os exemplos ([React, lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity)), mas na versão 7.1.1 do pacote, medida naquele dia, a regra dispara com `Date.now()` e não com `new Date()`. Ao trocar na cópia `new Date()` por `new Date(Date.now())`, apareceu `Error: Cannot call impure function during render`, com a regra `react-hooks/purity`. A própria página apresenta a lista como «exemplos comuns» (*usual examples*, com `Date.now()` e `new Date()` na mesma linha), não como um inventário do que a versão instalada detecta. A lição prática: **o linter é uma rede, não um muro.** Pega muita coisa, e o que não pega continua sendo responsabilidade de quem programa.

**O TypeScript pega a segunda, se for solicitado.** Repare no tipo da prop: `Servicio[]`, sem `readonly`. Foi escrito assim de propósito, para a figura compilar. Se o tipo for alterado para `readonly Servicio[]`, que é como `contrato.ts` do `revisor` declara as listas desde a Lição 0 (`readonly estados: readonly EstadoPublico[]`), a compilação é interrompida:

```text
fig01_02.tsx(20,31): error TS2339: Property 'sort' does not exist on type 'readonly Servicio[]'.
```

(É o primeiro dos quatro erros dessa execução; a saída completa está em `ejercicios/fig01_02.tipos-esperado.txt`.)

Um array `readonly` no TypeScript não tem os métodos que causam mutação: nem `sort`, nem `push`, nem `splice`. Essa palavra que parecia mero adorno em `contrato.ts` é, na verdade, a defesa contra a segunda impureza. Os três erros de tipo que a acompanham nessa execução (`TS7006`, parâmetros com tipo `any` implícito) são consequência do primeiro: como `sort` não existe, o TypeScript já não sabe que tipo `a` e `b` têm, nem o resultado `ordenados`, e por isso tampouco o `s` do `map` da linha 25.

**O `StrictMode` pega as que alteram algo a cada chamada.** O contador indicando 2 foi revelado pelo `StrictMode`. Em uma aplicação real, isso seria visto como «a revisão pula de dois em dois em desenvolvimento», e essa estranheza é a pista.

Resumo da defesa: **o linter** para o que se vê no texto do código, **o TypeScript com `readonly`** para as mutações de dados recebidos, **o `StrictMode`** para os efeitos colaterais que se repetem, e **os próprios olhos** para o restante. Nenhuma ferramenta sozinha é suficiente. O exercício 1 pede a correção das três.

#### 1.2.4 Onde colocar o que for impuro

Se um componente não pode ler o relógio nem alterar nada, onde essas coisas são feitas? A documentação do React responde com uma ordem de preferência: os efeitos colaterais ficam normalmente nos **manipuladores de eventos** (o `onClick` de um botão, por exemplo), que o React não chama durante o render; e se não houver nenhum evento correspondente, como último recurso, em um `useEffect` ([React, «Keeping Components Pure»](https://react.dev/learn/keeping-components-pure)). O painel já faz isso da forma certa: a requisição à API vive no Effect de `useReporte`, porque se trata de sincronização com algo de fora, e o `establecerCarga({ tipo: "cargando" })` de «Actualizar» vive em `recargar`, executado por um clique. A [Lição 3](03-effects-sincronizar.md) retoma os Effects em profundidade.

E o que pode ser **calculado** a partir das props não é um efeito colateral: é exatamente o que um componente puro faz. Contar quantos serviços falham é um cálculo. Por isso o primeiro arquivo novo do ponto de controle não é um componente, mas sim duas funções puras:

```ts
// revisor/src/reporte/resumen.ts
import type { EstadoPublico } from "../compartido/contrato";

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}
```

As duas cumprem as duas condições. `contarFallas` recebe uma lista `readonly`, de modo que não conseguiria mutá-la mesmo se quisesse, e `filter` devolve um novo array (uma mutação local que ninguém vê). `textoFallas` resolve o singular, porque «1 servicios con falla» soa mal. Nenhuma sabe de React, de JSX nem de DOM, e por isso podem ser testadas com um `console.log` ou, na [Lição 8](08-pruebas-de-componentes.md), com um teste de três linhas, sem montar nada. **Separar o cálculo da apresentação** é o primeiro movimento desta lição: o que for cálculo vai para uma função pura em um arquivo `.ts`; o que for apresentação vai para um componente que a chama.


### 1.3 Composição: dividir o painel por responsabilidades

#### 1.3.1 Quando dividir e por onde

A documentação do React, em seu guia sobre como pensar em uma interface, propõe dividir com as mesmas técnicas usadas para decidir se uma função nova deve ser escrita; uma delas é a separação de responsabilidades: idealmente, um componente cuida de uma coisa só, e se crescer, é decomposto em subcomponentes menores ([React, «Thinking in React»](https://react.dev/learn/thinking-in-react)). Aplicando isso ao `Panel.tsx` da Lição 0, as responsabilidades já estavam visíveis; apenas conviviam em um mesmo arquivo. O ponto de controle faz a separação da seguinte forma, de baixo para cima:

| Arquivo | Pergunta que responde | Recebe |
|---|---|---|
| `FilaEstado.tsx` | Como se vê **um** serviço? | um `EstadoPublico` |
| `ListaEstados.tsx` | Como se vê a **lista** de serviços? | a lista |
| `ResumenFallas.tsx` | O que diz a linha de **resumo**? | a lista |
| `ContenidoReporte.tsx` | O que é mostrado de acordo com o **carregamento**: aguardando, erro ou dados? | uma `Carga` |
| `Tarjeta.tsx` | Como se vê uma **caixa com título**, seja qual for o conteúdo? | um título e `children` |
| `Panel.tsx` | Como a página é **montada**? | `cargar` e `cadaMs` |

Observe a coluna «Recebe»: cada peça recebe apenas o que precisa. `FilaEstado` não sabe que existe um carregamento; `ListaEstados` não sabe que há um botão; `ResumenFallas` não sabe como o relatório é solicitado. Essa ignorância é valiosa: se amanhã mudar a aparência de uma linha, abre-se um arquivo de dezoito linhas e não é preciso entender mais nada.

Os dois primeiros saem do antigo `Panel.tsx` quase sem alterações. `FilaEstado` é idêntico ao da Lição 0, agora exportado a partir do próprio arquivo:

```tsx
// revisor/src/reporte/FilaEstado.tsx
import type { EstadoPublico } from "../compartido/contrato";

export function FilaEstado({ estado }: { readonly estado: EstadoPublico }) {
  if (estado.tipo === "disponible") {
    return (
      <li className="disponible">
        <strong>{estado.nombre}</strong>: disponible (HTTP {estado.codigoHttp}, {estado.duracionMs}{" "}
        ms)
      </li>
    );
  }

  return (
    <li className="falla">
      <strong>{estado.nombre}</strong>: falla ({estado.detalle})
    </li>
  );
}
```

`ListaEstados` é o `<ul>` com o respectivo `map`, que antes ficava dentro do `case "listo"`. Tem uma alteração em relação à Lição 0, na `key`, que a seção 1.4 explica com uma execução:

```tsx
// revisor/src/reporte/ListaEstados.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { FilaEstado } from "./FilaEstado";

export function ListaEstados({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado key={estado.nombre} estado={estado} />
      ))}
    </ul>
  );
}
```

O resumo é novo e é a linha solicitada pela chefe de operação. Usa as duas funções puras de 1.2.4 e contém, já resolvida, a armadilha do `0` explicada em 1.5:

```tsx
// revisor/src/reporte/ResumenFallas.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { contarFallas, textoFallas } from "./resumen";

export function ResumenFallas({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  const fallas = contarFallas(estados);

  return (
    <p className="resumen">
      {estados.length} servicios revisados
      {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
    </p>
  );
}
```

Um detalhe do JSX explica por que o texto sai colado da forma devida: a quebra de linha e a indentação entre `servicios revisados` e a chave `{fallas > 0 && …}` **não** produzem um espaço na página, porque o JSX descarta espaços em branco que contenham quebra de linha. Por isso o separador `·` traz o espaço dentro da tag `<strong>`: `<strong> · …</strong>`. Se esse espaço fosse retirado, a tela mostraria `revisados· 2 servicios`.

`ContenidoReporte` é o antigo `Contenido`, com o nome completo e o `case "listo"` dividido em duas peças. `<>` e `</>` são um **fragmento**: uma forma de devolver dois elementos irmãos sem envolvê-los em uma `<div>` sem significado:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { ListaEstados } from "./ListaEstados";
import { ResumenFallas } from "./ResumenFallas";
import type { Carga } from "./useReporte";

export function ContenidoReporte({ carga }: { readonly carga: Carga }) {
  switch (carga.tipo) {
    case "cargando":
      return <p role="status">Cargando…</p>;
    case "error":
      return <p role="alert">No se pudo cargar el reporte: {carga.detalle}</p>;
    case "listo":
      return (
        <>
          <ResumenFallas estados={carga.reporte.estados} />
          <ListaEstados estados={carga.reporte.estados} />
        </>
      );
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

O `default` com `never` é o mesmo da Lição 0 e continua pela mesma razão: se amanhã alguém adicionar um quarto tipo a `Carga` (a [Lição 4](04-estado-del-servidor.md) adiciona o estado vazio, embora de outra forma), o TypeScript apontará este `switch` como incompleto. Note também o que **não** foi feito: `ResumenFallas` e `ListaEstados` recebem a mesma lista e cada um faz com ela o que lhe cabe. Nenhum a armazena, nenhum a copia para um estado, nenhum a modifica. Os dois são puros e, por isso, compartilhar a mesma lista é seguro.

#### 1.3.2 `children`: o vão que o pai preenche

Falta a peça mais instrutiva. A chefe de operação quer que o relatório tenha a aparência de um cartão: um quadro com um título. E é fácil adivinhar que, assim que ele existir, alguém vai querer outro cartão igual para o detalhe de um serviço, outro para os avisos e outro para o formulário. Seria possível escrever `TarjetaReporte`, `TarjetaDetalle` e `TarjetaAvisos`, três componentes quase idênticos. Ou dá para escrever **um único** cartão que não sabe o que traz dentro.

O React resolve isso com uma prop especial. Ao aninhar conteúdo dentro de uma tag JSX, o componente pai recebe esse conteúdo em uma prop chamada `children`. A documentação propõe imaginar da seguinte forma: um componente com `children` tem um «vão» que os componentes que o utilizam podem preencher com o JSX que quiserem, sem precisar saber o que é renderizado ali dentro ([React, «Passing Props to a Component»](https://react.dev/learn/passing-props-to-a-component)). Essa é a **composição**: montar peças grandes juntando peças que não se conhecem entre si.

```tsx
// revisor/src/compartido/Tarjeta.tsx
import type { ReactNode } from "react";

export function Tarjeta({
  titulo,
  children,
}: {
  readonly titulo: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="tarjeta" aria-label={titulo}>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
```

Três decisões deste arquivo:

- **Fica em `src/compartido/`, não em `src/reporte/`.** Não sabe nada do relatório. É a primeira peça da aplicação pensada para várias funcionalidades, e a pasta deixa isso claro. É o princípio de pastas por funcionalidade da Lição 0: o que uma única funcionalidade usa fica com ela; o que várias usam, em `compartido/`.
- **`children` tem o tipo `ReactNode`.** É o tipo que o React exporta para «qualquer coisa que possa ser renderizada»: um elemento JSX, um texto, um número, uma lista de elementos, `null`. Assim o cartão aceita o que for colocado dentro dele e o TypeScript avisa se for passado algo que o React não saiba renderizar, como um objeto solto.
- **Usa `<section>` com um nome acessível.** Uma tag `<section>` qualquer não significa nada especial para um leitor de tela. Mas, segundo a MDN, um `<section>` comunica a função (*role*) `region` (uma área nomeada para a qual a pessoa pode saltar) quando tem um nome acessível ([MDN, função `region`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role)). Aqui o nome é dado por `aria-label={titulo}`. A MDN prefere, quando há um cabeçalho visível, `aria-labelledby` apontando para o cabeçalho em vez de repetir o texto; o ponto de controle usa `aria-label` por simplicidade: o texto é o mesmo do `<h2>`, e a forma preferida pela MDN, `aria-labelledby`, exige um `id` único por cartão, que no React é gerado com `useId`, um hook que o curso ainda não apresentou. É uma decisão do curso, não uma regra rígida: as duas formas produzem o mesmo nome. A acessibilidade, como diz o README do curso, é um hábito ensinado onde surge; a [Lição 8](08-pruebas-de-componentes.md) consulta a página por função e por nome, e esta região é uma das coisas encontradas.

E `Panel` fica assim, sem nenhuma lógica de apresentação própria:

```tsx
// revisor/src/reporte/Panel.tsx
import { Tarjeta } from "../compartido/Tarjeta";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import "./panel.css";
import { useReporte } from "./useReporte";

export function Panel({
  cargar,
  cadaMs = 10_000,
}: {
  readonly cargar: Cargar;
  readonly cadaMs?: number;
}) {
  const { carga, recargar } = useReporte(cargar, cadaMs);

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <ContenidoReporte carga={carga} />
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Leia o JSX de `Panel` como uma frase: «a página tem um título e um cartão chamado Estado de los servicios, que contém o conteúdo do relatório e um botão». O que fica entre `<Tarjeta>` e `</Tarjeta>` — o conteúdo e o botão — é exatamente o que `Tarjeta` recebe como `children` e coloca abaixo do `<h2>`. `Tarjeta` não sabe que há um botão nem que existe um carregamento; `Panel` não sabe que o cartão usa uma `<section>`. Se amanhã o cartão mudar de estilo, altera-se um arquivo só e todos os cartões herdam a mudança.

Há um efeito menos visível e muito útil: o botão **viaja com o estado que o controla**. `recargar` sai de `useReporte`, que fica em `Panel`; o botão está no JSX de `Panel`. `Tarjeta` faz a renderização dele, mas não o conhece. Se em vez de `children` `recargar` tivesse sido passado como prop para `Tarjeta` renderizar o botão, o cartão deixaria de ser genérico: saberia sobre recarregamentos. `children` permite que cada peça saiba apenas o que lhe diz respeito, e a [Lição 6](06-reducer-contexto.md) volta a este ponto ao analisar se um contexto é necessário: muitas vezes, a resposta é «não, basta `children`».

A folha de estilos ganha duas regras, uma para o cartão e outra para destacar o número de falhas:

```css revisor/src/reporte/panel.css
body {
  font-family: system-ui, sans-serif;
  margin: 2rem auto;
  max-width: 40rem;
  padding: 0 1rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  border-left: 0.5rem solid #888;
  margin: 0.5rem 0;
  padding: 0.5rem 0.75rem;
}

li.disponible {
  border-color: #1a7f37;
}

li.falla {
  border-color: #cf222e;
}

.tarjeta {
  border: 1px solid #d0d7de;
  border-radius: 0.5rem;
  padding: 0 1rem 1rem;
}

.resumen strong {
  color: #cf222e;
}
```

A regra `.tarjeta` fica na folha do relatório embora `Tarjeta` esteja em `compartido/`. O curso usa **uma única folha de estilos** que cresce lição a lição; é uma simplificação consciente para que não seja preciso caçar estilos entre arquivos. Quando um projeto cresce de verdade, cada componente compartilhado costuma trazer sua própria folha; aqui ainda não é necessário.

`useReporte.ts`, `cargar.ts`, `main.tsx`, `contrato.ts`, `configuracion.ts` e o servidor de prática não mudam. No `package.json` só muda o número de versão, de `0.0.0` para `0.1.0`: o curso usa `0.N.0` no ponto de controle da lição N.

### 1.4 `key`: como o React sabe se uma linha é a mesma

#### 1.4.1 O problema que ela resolve

Volte à figura 1. Na terceira renderização, o React alterou um texto e não substituiu a linha. Como ele soube que a linha de `inventario` da terceira renderização era **a mesma** da segunda e que bastava mudar o número? Com uma lista que sempre traz os mesmos elementos na mesma ordem, a posição poderia ser usada. Mas as listas mudam: um serviço novo surge no topo, outro é desativado, a ordem se altera. Para correlacionar os elementos de uma lista entre um render e outro, o React usa a `key`.

A documentação estabelece duas regras ([React, «Rendering Lists»](https://react.dev/learn/rendering-lists)):

- **As `key` são únicas entre irmãos.** Dois elementos da mesma lista não podem compartilhá-la (em listas diferentes podem se repetir).
- **As `key` não devem mudar**, caso contrário perde-se o propósito delas; por isso não são geradas durante o render.

E esclarece um detalhe que confunde: o componente **não recebe** a `key` como prop. Trata-se de uma dica para o React; se `FilaEstado` precisasse do nome, este seria passado à parte (aqui ele já está disponível, dentro de `estado`).

#### 1.4.2 Três opções de `key` para a mesma lista

Na Lição 0, a linha trazia `` key={`${posicion}-${estado.nombre}`} ``. Funcionava e não continha duplicatas. Por que mudar? A figura 3 responde fazendo medições. Uma lista de quatro serviços recebe um quinto, `correo`, **no início**, e três formas de `key` são testadas. Cada linha guarda no próprio estado o nome com que nasceu — um `useState` com valor inicial, explicado em detalhe na [Lição 2](02-estado-instantanea-forma.md); aqui basta saber que o React o preserva enquanto a linha for «a mesma» — e exibe um aviso se agora couber a ela renderizar outro nome. Além disso, conta-se quantos `<li>` do DOM são novos após a mudança.

```tsx
// fig01_03.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Fila({ nombre }: { readonly nombre: string }) {
  const [nacio] = useState(nombre);

  return <li>{nombre === nacio ? nombre : `${nombre} (nació como ${nacio})`}</li>;
}

type Llave = (nombre: string, posicion: number) => string;

function Lista({ nombres, llave }: { readonly nombres: readonly string[]; readonly llave: Llave }) {
  return (
    <ul>
      {nombres.map((nombre, posicion) => (
        <Fila key={llave(nombre, posicion)} nombre={nombre} />
      ))}
    </ul>
  );
}

const antes = ["catálogo", "pagos", "inventario", "reportes"];
const despues = ["correo", ...antes];

const estrategias: readonly (readonly [string, Llave])[] = [
  ["key={posicion}", (_nombre, posicion) => String(posicion)],
  ["key={`${posicion}-${nombre}`}", (nombre, posicion) => `${posicion}-${nombre}`],
  ["key={nombre}", (nombre) => nombre],
];

for (const [titulo, llave] of estrategias) {
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Lista nombres={antes} llave={llave} />);
  });
  const viejos = new Set(contenedor.querySelectorAll("li"));
  await act(async () => {
    raiz.render(<Lista nombres={despues} llave={llave} />);
  });
  const filas = [...contenedor.querySelectorAll("li")];
  const nuevos = filas.filter((li) => !viejos.has(li));
  console.log(titulo);
  console.log(`  filas creadas desde cero: ${nuevos.length} de ${filas.length}`);
  console.log(`  ${filas.map((li) => li.textContent).join(" | ")}`);
  await act(async () => {
    raiz.unmount();
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_03.tsx
$ node fig01_03.js
key={posicion}
  filas creadas desde cero: 1 de 5
  correo (nació como catálogo) | catálogo (nació como pagos) | pagos (nació como inventario) | inventario (nació como reportes) | reportes
key={`${posicion}-${nombre}`}
  filas creadas desde cero: 5 de 5
  correo | catálogo | pagos | inventario | reportes
key={nombre}
  filas creadas desde cero: 1 de 5
  correo | catálogo | pagos | inventario | reportes
```

Três resultados, três lições:

- **`key={posicion}`: a identidade trocada.** O React fez o emparelhamento pela posição: a linha que ocupava a posição 0 (a de `catálogo`) agora recebe `correo`, a da posição 1 (a de `pagos`) recebe `catálogo`, e assim por diante. Criou apenas uma linha nova, a última. O DOM ficou com os textos certos, mas **o estado de cada linha permaneceu no lugar enquanto os dados foram deslocados**: a linha que exibe `correo` é, para o React, a que nasceu como `catálogo`. Se a linha de `pagos` guardasse no próprio estado algo digitado pela pessoa, agora esse texto apareceria ao lado de `catálogo`. A documentação adverte: usar a posição como `key` (o que o React faz se nenhuma for definida) costuma levar a erros sutis e confusos ao inserir, remover ou reordenar elementos ([React, «Rendering Lists»](https://react.dev/learn/rendering-lists)).
- **`` key={`${posicion}-${nombre}`} ``: a identidade perdida.** A `key` da Lição 0. Enquanto os nomes não se repetirem, não confunde uma linha com outra, pois inclui o nome. Mas inclui também a posição e, ao inserir `correo` no topo, **todas** as posições mudaram: `0-catálogo` passou a ser `1-catálogo`, uma `key` que o React nunca tinha visto. Resultado: cinco de cinco linhas criadas do zero, e as quatro antigas destruídas com todo o estado que continham. É o mesmo defeito apontado pela documentação para `key={Math.random()}`, em grau menor: as chaves não coincidem entre renderizações e os componentes e o DOM são recriados. No `revisor` isso não é perceptível porque `FilaEstado` não guarda estado próprio, e a [Lição 2](02-estado-instantanea-forma.md) mantém dessa forma intencionalmente: as anotações ficarão em `Panel` e a marcação «com anotação» de cada linha será calculada a partir delas; portanto, recriar uma linha não apaga nada. Mas o custo de processamento permanece ali (cinco linhas destruídas e recriadas onde bastava criar uma), e no dia em que uma linha guardar algo no próprio estado, como um campo de texto digitado pela metade, isso se perderia em todas as linhas. A `key` estável é a que não depende de alguém se lembrar dessa condição.
- **`key={nombre}`: a identidade correta.** Uma única linha nova, a de `correo`, e as quatro de sempre preservadas, cada uma com o próprio estado. É a `key` do ponto de controle.

#### 1.4.3 Por que o nome é uma `key` segura

A documentação recomenda extrair a `key` dos dados: se eles vierem de um banco de dados, seus identificadores são únicos por natureza ([React, «Rendering Lists»](https://react.dev/learn/rendering-lists)). Os tipos da API, em `contrato.ts`, não trazem um identificador numérico; trazem o nome do serviço. Ele é único? No projeto deste sistema, sim: o nome é a identidade do serviço (a rota de detalhe, a partir da [Lição 3](03-effects-sincronizar.md), é `/api/servicios/:nombre`), e a partir da [Lição 4](04-estado-del-servidor.md), quando o servidor de prática aceitar cadastros, tentar cadastrar um nome já existente responde `409` com `ya existe un servicio llamado X`. A tela se apoia nessa regra porque quem a faz valer é a API; a tela não a inventa. E, como qualquer regra de outro sistema, vale enquanto esse sistema a cumprir: por isso convém saber o que acontece se um dia ele não a cumprir.

E se a API cometesse um erro e enviasse dois serviços com o mesmo nome? O React avisa em desenvolvimento. A figura 4 provoca os dois avisos de `key` que aparecem no console do navegador: a lista sem `key` e a `key` repetida. As mensagens do React saem por `console.error`; a figura as captura para imprimi-las com um prefixo.

```tsx
// fig01_04.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { format } from "node:util";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

console.error = (...partes: unknown[]) => {
  const mensaje = format(...partes);
  console.log(`  console.error: ${mensaje}`);
};

function SinLlave({ nombres }: { readonly nombres: readonly string[] }) {
  return <ul>{nombres.map((nombre) => <li>{nombre}</li>)}</ul>;
}

function LlaveRepetida({ nombres }: { readonly nombres: readonly string[] }) {
  return (
    <ul>
      {nombres.map((nombre) => (
        <li key={nombre}>{nombre}</li>
      ))}
    </ul>
  );
}

for (const [titulo, arbol] of [
  ["sin key:", <SinLlave nombres={["catálogo", "pagos"]} />],
  ["dos servicios con el mismo nombre:", <LlaveRepetida nombres={["pagos", "pagos"]} />],
] as const) {
  console.log(titulo);
  const raiz = createRoot(dom.window.document.createElement("div"));
  await act(async () => {
    raiz.render(arbol);
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_04.tsx
$ node fig01_04.js
sin key:
  console.error: Each child in a list should have a unique "key" prop.

Check the render method of `SinLlave`. See https://react.dev/link/warning-keys for more information.
dos servicios con el mismo nombre:
  console.error: Encountered two children with the same key, `pagos`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

O primeiro aviso diz «cada filho de uma lista deve ter uma prop `key` única» e aponta o componente responsável: «verifique o método de renderização de `SinLlave`». O segundo diz «foram encontrados dois filhos com a mesma `key`, `pagos`», e adverte que, com chaves repetidas, o React pode duplicar ou omitir elementos, e que esse comportamento não tem suporte. Um fato medido que convém saber: **nem o TypeScript nem o linter do curso detectam a `key` ausente.** `npx eslint fig01_04.tsx` termina sem avisos, porque `eslint-plugin-react-hooks` verifica as regras dos hooks e do compilador, não as das listas. O aviso só aparece na execução, no console, e apenas em desenvolvimento. Por isso o console do navegador não deve ser ignorado: um `console.error` do React é um defeito, mesmo que a página pareça perfeita.


### 1.5 A armadilha do `0`

Esta é a falha mais famosa do JSX e a mais fácil de evitar quando se compreende o mecanismo. O operador `&&` do JavaScript não devolve `true` ou `false`: ele devolve **o primeiro valor que decide a operação**. `a && b` devolve `a` se `a` for «falso» (`false`, `0`, `""`, `null`, `undefined`), e `b` caso contrário. Com um booleano à esquerda, `false && <strong>…</strong>` devolve `false`, e o React não renderiza nada para `false`. Com um número à esquerda, `0 && <strong>…</strong>` devolve `0`… e o React **renderiza números**. A documentação coloca isso como aviso com todas as letras: não se deve colocar números do lado esquerdo de `&&`, porque se o lado esquerdo for `0`, a expressão inteira vale `0` e o React renderizará `0` em vez de nada ([React, «Conditional Rendering»](https://react.dev/learn/conditional-rendering)).

A figura 5 demonstra isso com o resumo do painel, em duas versões que diferem apenas em uma linha:

```tsx
// fig01_05.tsx
import { renderToStaticMarkup } from "react-dom/server";

function ResumenConTrampa({ total, fallas }: { readonly total: number; readonly fallas: number }) {
  return (
    <p className="resumen">
      {total} servicios revisados
      {fallas && <strong> · {fallas} con falla</strong>}
    </p>
  );
}

function ResumenSinTrampa({ total, fallas }: { readonly total: number; readonly fallas: number }) {
  return (
    <p className="resumen">
      {total} servicios revisados
      {fallas > 0 && <strong> · {fallas} con falla</strong>}
    </p>
  );
}

for (const fallas of [2, 0]) {
  console.log(`con ${fallas} fallas:`);
  console.log(`  fallas && …     ${renderToStaticMarkup(<ResumenConTrampa total={4} fallas={fallas} />)}`);
  console.log(`  fallas > 0 && … ${renderToStaticMarkup(<ResumenSinTrampa total={4} fallas={fallas} />)}`);
}
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_05.tsx
$ node fig01_05.js
con 2 fallas:
  fallas && …     <p class="resumen">4 servicios revisados<strong> · 2 con falla</strong></p>
  fallas > 0 && … <p class="resumen">4 servicios revisados<strong> · 2 con falla</strong></p>
con 0 fallas:
  fallas && …     <p class="resumen">4 servicios revisados0</p>
  fallas > 0 && … <p class="resumen">4 servicios revisados</p>
```

Com duas falhas, as duas versões são idênticas: por isso a armadilha sobrevive a testes manuais com os dados de sempre, nos quais `pagos` e `reportes` falham. Com zero falhas, a primeira renderiza `4 servicios revisados0`: o `0` que apareceu na cena quando o turno da noite reiniciou a API com tudo funcionando perfeitamente. A segunda não renderiza nada além do esperado.

A correção é a que a documentação propõe: **fazer com que o lado esquerdo seja um booleano.** `fallas > 0` é `true` ou `false`, nunca um número. É exatamente o que `ResumenFallas` faz no ponto de controle. Outras formas que funcionam: `Boolean(fallas) && …`, `!!fallas && …` ou um ternário, `fallas > 0 ? <strong>…</strong> : null`. O curso usa a comparação porque ela se lê exatamente como o que significa: «se houver falhas». Aqui também não há rede de proteção: o TypeScript aceita `fallas && …` sem reclamar (um `number` é um filho válido de JSX) e o linter do curso também não marca isso; comprovou-se executando `npx eslint fig01_05.tsx`, que termina sem avisos. A defesa é o hábito: **à esquerda de `&&`, sempre um booleano.** Na [Lição 8](08-pruebas-de-componentes.md), um teste do curso coloca `fallas &&` de propósito e verifica se o texto sai com o `0` colado; é o teste que fica vermelho ao reverter o ajuste.

### 1.6 Jamais um componente dentro de outro

#### 1.6.1 A tentação

Ao dividir um componente, surge uma tentação natural: definir a peça menor **dentro** da maior, para ter à mão as variáveis do pai sem precisar passá-las como props. Algo assim, dentro de `Panel`:

```tsx
// Fragmento: lo que NO se hace
export function Panel({ cargar, cadaMs = 10_000 }: { readonly cargar: Cargar; readonly cadaMs?: number }) {
  const { carga, recargar } = useReporte(cargar, cadaMs);

  function BotonActualizar() {
    return <button type="button" onClick={recargar}>Actualizar</button>;
  }

  // ...
}
```

Parece prático: `BotonActualizar` enxerga `recargar` sem ninguém precisar passar. A documentação proíbe isso categoricamente: componentes podem renderizar outros componentes, mas **jamais** se aninham suas definições; cada componente é definido no nível superior do arquivo, e se o filho precisar de dados do pai, eles devem ser passados por props ([React, «Your First Component»](https://react.dev/learn/your-first-component)).

#### 1.6.2 Por quê: identidade novamente

A razão é a mesma da `key`. Para decidir se um componente deste render é o mesmo do anterior, o React examina **sua posição na árvore e seu tipo**. O tipo de `<BotonActualizar />` é a função `BotonActualizar`. Se essa função for definida dentro de `Panel`, **cada render de `Panel` cria uma nova função**: o mesmo código, mas outro objeto. Para o React, trata-se de outro tipo de componente. Então ele destrói o antigo, com o estado que tinha e os nós do DOM, e monta um novo. A documentação explica isso com o estado: o React preserva o estado enquanto o mesmo componente for renderizado na mesma posição, e o estado desaparece porque a cada render cria-se uma função diferente ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

A figura 6 mede isso. Dois painéis iguais; em um, o contador de cliques está definido fora e, no outro, dentro. Clica-se duas vezes no contador e, em seguida, atualiza-se o pai:

```tsx
// fig01_06.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function ContadorDeFuera() {
  const [clics, establecerClics] = useState(0);
  return (
    <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
      clics: {clics}
    </button>
  );
}

function PanelBien() {
  const [vueltas, establecerVueltas] = useState(0);
  return (
    <section>
      <button type="button" className="actualizar" onClick={() => establecerVueltas((n) => n + 1)}>
        actualizar ({vueltas})
      </button>
      <ContadorDeFuera />
    </section>
  );
}

function PanelMal() {
  const [vueltas, establecerVueltas] = useState(0);

  function ContadorDeDentro() {
    const [clics, establecerClics] = useState(0);
    return (
      <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
        clics: {clics}
      </button>
    );
  }

  return (
    <section>
      <button type="button" className="actualizar" onClick={() => establecerVueltas((n) => n + 1)}>
        actualizar ({vueltas})
      </button>
      <ContadorDeDentro />
    </section>
  );
}

async function clic(contenedor: Element, clase: string): Promise<void> {
  await act(async () => {
    contenedor
      .querySelector(`.${clase}`)!
      .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
}

for (const [titulo, Panel] of [
  ["definido fuera", PanelBien],
  ["definido dentro", PanelMal],
] as const) {
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Panel />);
  });
  await clic(contenedor, "mas");
  await clic(contenedor, "mas");
  const antes = contenedor.querySelector(".mas")!.textContent;
  await clic(contenedor, "actualizar");
  const despues = contenedor.querySelector(".mas")!.textContent;
  console.log(`${titulo}: dos clics → «${antes}»; el padre se actualiza → «${despues}»`);
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_06.tsx
$ node fig01_06.js
definido fuera: dos clics → «clics: 2»; el padre se actualiza → «clics: 2»
definido dentro: dos clics → «clics: 2»; el padre se actualiza → «clics: 0»
```

O contador de fora preserva seus dois cliques quando o pai é atualizado. O de dentro volta a zero, que é o terceiro susto da cena: o render de `PanelMal` criou um novo `ContadorDeDentro`, o React o enxergou como um tipo diferente, desmontou o antigo e montou outro com estado inicial. Imagine isso no `revisor`: a cada dez segundos, o polling de `useReporte` atualiza o painel; se a linha estivesse definida dentro do painel, a cada dez segundos seria apagado tudo o que a pessoa tivesse digitado nela. Além do estado, perde-se processamento: o React destrói e recria os nós do DOM a cada render, quando a figura 1 mostrou que o normal é alterar apenas o que mudou.

Desta vez o linter está do lado de quem desenvolve. É a regra `static-components`, outra vinda do compilador:

```text
$ npx eslint fig01_06.tsx

~/curso-react/figuras/fig01_06.tsx
  51:8  error  Error: Cannot create components during render

Components created during render will reset their state each time they are created. Declare components outside of render.

~/curso-react/figuras/fig01_06.tsx:51:8
  49 |         actualizar ({vueltas})
  50 |       </button>
> 51 |       <ContadorDeDentro />
     |        ^^^^^^^^^^^^^^^^ This component is created during render
  52 |     </section>
  53 |   );
  54 | }

~/curso-react/figuras/fig01_06.tsx:37:3
  35 |   const [vueltas, establecerVueltas] = useState(0);
  36 |
> 37 |   function ContadorDeDentro() {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 38 |     const [clics, establecerClics] = useState(0);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 39 |     return (
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 40 |       <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 41 |         clics: {clics}
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 42 |       </button>
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 43 |     );
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 44 |   }
     | ^^^^ The component is created during render here
  45 |
  46 |   return (
  47 |     <section>  react-hooks/static-components

✖ 1 problem (1 error, 0 warnings)
```

A mensagem aponta dois lugares: onde o componente criado durante o render é **usado** (linha 51) e onde é **definido** (linhas 37 a 44). E diz a consequência em uma frase: componentes criados durante o render reiniciam o estado a cada vez que são criados. A página da regra acrescenta o motivo: o React enxerga cada um como um tipo de componente novo, desmonta o antigo e monta o novo, destruindo todo o estado e os nós do DOM ([React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components)). Como se trata de um erro e não de um aviso, `npm run lint` para mesmo sem o uso de `--max-warnings 0`.

O conserto habitual é mover a definição para o nível superior do arquivo (ou para um arquivo próprio) e passar por props o que era consumido do pai. Para o botão do fragmento de 1.6.1, isso significa `function BotonActualizar({ alPulsar }: { readonly alPulsar: () => void })` fora de `Panel`, e `<BotonActualizar alPulsar={recargar} />` dentro. O nome `alPulsar` estreia uma convenção do curso: as props que recebem um **handler de evento** (algo que é executado quando a pessoa faz alguma coisa) começam com `al`, como `alPulsar` aqui e `alCambiar` ou `alSeleccionar` na Lição 2. `cargar`, em contrapartida, não começa com `al`: não responde a um evento, é o trabalho que o painel pede ao hook. No ponto de controle nem sequer foi necessário esse componente: o botão vive diretamente no JSX de `Panel`, que é onde reside `recargar`, e viaja para o cartão como `children`. Às vezes, a melhor maneira de não aninhar um componente é não criá-lo.

### 1.7 O percurso completo

Com as seis peças em seus lugares, verifica-se o ponto de controle como em qualquer verificação automática do curso: instalação limpa, linter e compilação. Os três comandos terminaram com código 0:

```text
$ npm ci
...
$ npm run lint

> revisor@0.1.0 lint
> eslint . --max-warnings 0

$ npm run build
...
dist/assets/index-Dezp5bTH.js   222.34 kB │ gzip: 69.68 kB

✓ built in 225ms
```

`npm run lint` não imprime nada após o cabeçalho: nenhum problema. (Na execução de `npm ci` desta lição, o npm imprimiu adicionalmente um aviso de `install-scripts`. Ele vem de `fsevents`, uma dependência opcional instalada apenas no macOS para monitorar arquivos e que traz um script de instalação; não é preciso aprovar nada. No Linux essa dependência não é instalada, de modo que é de esperar que o aviso não apareça; no contêiner Linux do curso não se mediu se ele aparecia ou não, então, aparecendo ou não, não é erro de quem segue a lição.) A compilação é a que foi vista em «O porquê antes do como»: vinte e seis módulos, uma folha de estilos um pouco maior devido às duas regras novas e um JavaScript que mudou de nome. Essa mudança de nome não é capricho: o Vite calcula o nome a partir do conteúdo, e o conteúdo mudou. É o `index-Dezp5bTH.js` documentado pelo curso para este ponto de controle; se aparecer outro nome, algo difere: o código ou as versões das dependências (compare com `package-lock.json`).

Para ver no navegador, utilizam-se os mesmos dois terminais da Lição 0: `npm run servidor` em um e, no outro, `npm run dev` para desenvolvimento ou `npm run preview` para ver a versão compilada. Isto foi o que o Chrome em modo *headless* entregou ao abrir a versão compilada (mostra-se apenas o contêiner):

```text
<div id="raiz"><main><h1>Revisor</h1><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></section></main></div>
```

Compare com o da Lição 0. As linhas são idênticas, caractere por caractere: separar `FilaEstado` no próprio arquivo não mudou o que ele renderiza. A novidade é a `<section>` com nome acessível, o `<h2>` e o parágrafo de resumo, com `4 servicios revisados` e, em vermelho, `· 2 servicios con falla`. O botão «Actualizar» ficou dentro do cartão, como `children`. E o registro do servidor de prática anotou uma única requisição, como corresponde à versão compilada: o `StrictMode` continua em `main.tsx`, mas suas verificações só atuam em desenvolvimento:

```text
08:14:17.848 GET /api/estados 200
```

Já com `npm run dev`, vê-se o par da Lição 0 (uma requisição `cancelada por el cliente` e um `200`) se a conexão chegar a tempo. E agora se sabe que, além do ciclo extra do Effect, o `StrictMode` está chamando duas vezes cada um dos seis componentes a cada render. Isso passa despercebido porque os seis são puros: chamá-los duas vezes produz duas vezes o mesmo resultado. Esse é o teste gratuito da Lição 0, aplicado aos componentes.


## O erro que vai aparecer

**O erro principal: `Cannot create components during render`.** É o de 1.6. Surge assim que um componente é definido dentro de outro, e como é um erro (não um aviso), `npm run lint` para. Interpreta-se em três partes: a linha onde o componente é usado (`This component is created during render`), o bloco onde é definido (`The component is created during render here`) e a regra, `react-hooks/static-components`. O conserto consiste em mover a definição para o nível superior e passar por props o que era aproveitado do pai. A documentação do React pede que não se aninhem definições de componentes ([React, «Your First Component»](https://react.dev/learn/your-first-component)); se parecer necessário fazer isso, quase sempre o que se quer é passar o conteúdo como `children`.

**O aviso que só sai na execução: `Each child in a list should have a unique "key" prop.`** É o da figura 4. Não é apontado nem pelo TypeScript nem pelo linter do curso; aparece no console do navegador, em desenvolvimento, na primeira vez em que a lista é renderizada. Informa em qual componente procurar (`Check the render method of …`). Corrige-se com uma `key` estável extraída dos dados, nunca com a posição e nunca com um valor gerado no render. O aviso irmão, `Encountered two children with the same key`, significa que os dados não cumprem a unicidade presumida: a correção não é inventar outra `key`, mas investigar por que a API enviou itens repetidos.

**O erro de tipos que protege contra mutação: `Property 'sort' does not exist on type 'readonly …[]'`.** É o de 1.2.3. Se aparecer, o TypeScript está indicando uma tentativa de alterar uma lista que não pertence ao componente. Não se deve retirar o `readonly` para compilar: faça uma cópia antes de ordenar, com `[...lista].sort(…)`, ou use `toSorted`, que devolve um array novo e deixa o original intacto ([MDN, `Array.prototype.toSorted()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted); `sort`, o que altera o original, está em [MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). `toSorted` faz parte do ES2023; o `tsconfig.app.json` do `revisor` declara `"lib": ["ES2023", "DOM"]`, de modo que ali é possível utilizá-lo.

## O que se costuma fazer de errado

**Alterar algo de fora durante o render.** Um contador de módulo, uma variável global, um `document.title = …` no corpo do componente. Executa-se tantas vezes quantas o React chamar o componente, o que não equivale a «cada vez que a tela muda». Em desenvolvimento, o `StrictMode` duplica a chamada e dá a pista; em produção, o número simplesmente mente.

**Mutar as props.** `props.estados.sort()`, `props.estados.push(…)`, `estado.nombre = …`. Alteram-se dados pertencentes a outro componente, e esse outro componente não toma conhecimento da mudança. O custo é uma falha distante de onde foi cometida: a lista se ordena sozinha «em outro lugar». Declare as props com `readonly` e o TypeScript impedirá isso.

**Ler o relógio ou aleatoriedade no render.** `new Date()`, `Date.now()`, `Math.random()`. A saída depende de quando o React decidiu fazer a chamada. Se o componente precisa da hora, deve recebê-la como prop ou armazená-la no estado e atualizá-la a partir de um Effect, como mostra a referência do React.

**Usar a posição como `key`, ou uma `key` que muda com a posição.** A primeira confunde as linhas entre si quando a lista muda; a segunda destrói todas elas. Nenhuma das duas é notada enquanto as linhas não tiverem estado, e por isso ambas sobrevivem até o dia em que a linha ganha uma anotação ou um campo de texto.

**Gerar a `key` durante o render.** `key={Math.random()}` ou `key={crypto.randomUUID()}` dentro do `map`. Cada render produz novas chaves, e o React recria todos os componentes e todo o DOM da lista a cada vez.

**Um número à esquerda de `&&`.** `{fallas && …}`, `{lista.length && …}`. Funciona com os dados de teste e renderiza um `0` no dia em que não houver nada. À esquerda de `&&`, sempre um booleano.

**Definir um componente dentro de outro.** Perde o estado e o DOM a cada render do pai. O linter bloqueia com `static-components`; não silencie a regra.

**Dividir apenas por dividir.** Um componente para cada tag HTML não é um design melhor: são apenas mais arquivos para ler. O critério é a responsabilidade, «qual pergunta esta peça responde?», e não o tamanho. `Tarjeta` existe porque «uma caixa com título» é uma pergunta que se repete; um `TextoRevisados` de uma linha que mais ninguém usa não seria.

**Criar um cartão que sabe demais.** Passar para `Tarjeta` o `recargar`, a carga ou o tipo de conteúdo para que ele decida o que renderizar acaba amarrando o componente a uma única funcionalidade. Com `children`, quem o utiliza decide o que vai dentro.

## Exercícios

### Exercício 1 — Limpar as três impurezas

Copie `fig01_02.tsx` para `~/curso-react/figuras/` e corrija `ResumenImpuro` para que seja puro, sem perder o que exibe: um número de revisão, uma hora e os nomes ordenados. **Antes de alterar qualquer coisa, preveja** o que dirão as quatro linhas da saída quando o componente for puro. Ao terminar, a saída deve confirmar a previsão e o `npx eslint` não deve informar problemas. Dica: um componente puro não pode inventar a revisão nem a hora; alguém precisa fornecê-las.

### Exercício 2 — Remover em vez de acrescentar

Na figura 3, `correo` era adicionado no início. Altere uma linha para que, em vez disso, seja **removido** `catálogo`, o primeiro da lista: `const despues = antes.slice(1);`. **Antes de executar, preveja** para cada uma das três opções de `key` quantas linhas são criadas do zero e que texto cada linha exibe. Depois execute e compare. Qual dos três resultados seria mais perigoso se cada linha guardasse, no próprio estado, uma anotação escrita pela pessoa? (No `revisor` não será assim: a partir da [Lição 2](02-estado-instantanea-forma.md), as anotações ficam em `Panel`. A pergunta serve para reconhecer o risco quando uma linha de fato guarda estado.)

### Exercício 3 — O singular que falta

O resumo do ponto de controle resolve o singular das falhas («1 servicio con falla»), mas não o dos verificados: com um único serviço, diria `1 servicios revisados`. Escreva, em um arquivo `textoRevisados.ts` dentro de `~/curso-react/figuras/` (não no `revisor`, para que o projeto continue igual ao ponto de controle), uma função pura `textoRevisados(total: number): string` seguindo o modelo de `textoFallas`, e teste com `node textoRevisados.ts` para 0, 1 e 4. **Antes de executar, escreva** as três saídas esperadas. Por que esta função pode ser testada sem React, sem jsdom e sem navegador?

### Exercício 4 — Encontrar a armadilha

Um colega propõe, para a [Lição 4](04-estado-del-servidor.md), mostrar a lista apenas se houver serviços: `{carga.reporte.estados.length && <ListaEstados estados={carga.reporte.estados} />}` dentro de uma `<section>`. **Sem executar nada**, escreva qual HTML é produzido quando a API responde `{"estados":[]}`. Depois comprove com `renderToStaticMarkup`, como na figura 5, e escreva a versão correta.

## Soluções

### Solução 1

A previsão, com o componente puro: a linha 2 mostra o array **sem alterações** (`pagos, catálogo, reportes`), porque ninguém mais o ordena no próprio lugar; a linha 3 diz `0`, porque o componente já não mexe na variável de módulo; e a linha 4 diz `sí`, porque a hora chega como prop e é a mesma nas duas renderizações. As três correções, uma por impureza:

```tsx
// fig01_02.tsx corregida (fragmento)
function ResumenImpuro({
  servicios,
  revision,
  hora,
}: {
  readonly servicios: readonly Servicio[];
  readonly revision: number;
  readonly hora: string;
}) {
  const ordenados = [...servicios].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <p>
      Revisión {revision} a las {hora}: {ordenados.map((s) => s.nombre).join(", ")}
    </p>
  );
}
```

A revisão e a hora agora são props: quem usa o componente decide quais são (nas chamadas da figura, por exemplo, `revision={1} hora="10:00:00"`), e o componente apenas as exibe. A lista é copiada com `[...servicios]` antes de ser ordenada: é uma mutação local, sobre um array que o componente acabou de criar, e isso é permitido. O tipo `readonly Servicio[]` impede que alguém volte a escrever `servicios.sort(…)` sem o TypeScript interromper. Resta um detalhe do restante da figura: a linha 3 continua imprimindo a variável de módulo `revision`, que ninguém mais altera. Se deixada como `let revision = 0;`, o ESLint avisa com `prefer-const`, justamente porque ninguém a reatribui; altere para `const revision = 0;`. Mediu-se exatamente esta versão (`ejercicios/fig01_02.corregida.tsx`, com sua saída em `ejercicios/fig01_02.corregida.salida.txt`), compilada com o mesmo comando de sempre: as quatro linhas saíram `pagos, catálogo, reportes` (antes), `pagos, catálogo, reportes` (depois), `0` e `sí`, e `npx eslint` terminou sem problemas. No `revisor`, de onde viriam de verdade a revisão e a hora? De dados que mudam ao longo do tempo, ou seja, de estado; a [Lição 2](02-estado-instantanea-forma.md) traz isso.

### Solução 2

Medido ao executar (`ejercicios/fig01_03.ejercicio2.tsx` e sua saída em `ejercicios/fig01_03.ejercicio2.salida.txt`):

```text
key={posicion}
  filas creadas desde cero: 0 de 3
  pagos (nació como catálogo) | inventario (nació como pagos) | reportes (nació como inventario)
key={`${posicion}-${nombre}`}
  filas creadas desde cero: 3 de 3
  pagos | inventario | reportes
key={nombre}
  filas creadas desde cero: 0 de 3
  pagos | inventario | reportes
```

Com a posição, o React não cria nada e **remove a última linha**, a que havia nascido como `reportes`; as três restantes conservam o próprio estado (o da linha que nasceu naquele lugar), mas agora renderizam o nome da vizinha de baixo: a que nasceu como `catálogo` diz `pagos`, e assim por diante. Com posição e nome, as três linhas restantes são recriadas do zero, porque as posições mudaram. Com o nome, nada é criado: o React remove a linha de `catálogo` e as outras três continuam sendo as mesmas. O resultado mais perigoso é o primeiro, porque não é visível: a tela exibe os nomes corretos com o estado errado. A anotação digitada para `pagos` apareceria ao lado de `inventario` e ninguém notaria até ser tarde demais. O segundo resultado ao menos «apenas» descarta o trabalho; o primeiro o troca de lugar.

### Solução 3

As saídas esperadas são `0 servicios revisados`, `1 servicio revisado` e `4 servicios revisados`. Uma solução:

```ts
// textoRevisados.ts (en ~/curso-react/figuras/)
export function textoRevisados(total: number): string {
  return total === 1 ? "1 servicio revisado" : `${total} servicios revisados`;
}

for (const n of [0, 1, 4]) console.log(`${n} → ${textoRevisados(n)}`);
```
```text
$ node textoRevisados.ts
0 → 0 servicios revisados
1 → 1 servicio revisado
4 → 4 servicios revisados
```

(O arquivo e sua saída estão em `ejercicios/textoRevisados.ts` e `ejercicios/textoRevisados.salida.txt`.)

O Node 24 executa o arquivo `.ts` diretamente, assim como no servidor de prática (Lição 0). Dá para testar sem React porque é uma função pura que não sabe nada sobre React: recebe um número e devolve um texto. É a vantagem de separar o cálculo da apresentação: o que é calculado testa-se com um `console.log`. Repare que o `0` fica no plural («0 servicios»), que é como se diz em espanhol. Se a ideia fosse levar isso ao `revisor`, a função iria para `resumen.ts`, junto com `textoFallas`, e `ResumenFallas` a chamaria; não faça isso na cópia do ponto de controle, para que continue coincidindo com a do curso.

### Solução 4

Com a lista vazia, `estados.length` vale `0`, `0 && …` vale `0`, e o React renderiza o número. Comprovado com `renderToStaticMarkup` sobre um `<section>` com esse mesmo `&&` e uma lista vazia (`ejercicios/solucion4.tsx` e `ejercicios/solucion4.salida.txt`):

```text
<section>0</section>
<section></section>
```

A primeira linha é a versão do colega: um `0` solitário dentro da seção. A segunda é a versão correta, com um booleano à esquerda: `{carga.reporte.estados.length > 0 && <ListaEstados estados={carga.reporte.estados} />}`. Uma observação de design para o diário de bordo: uma lista vazia, no `revisor`, não deveria ser mostrada como «nada», mas sim com uma mensagem dizendo que não há serviços. É o quarto estado, «vazio», que a [Lição 4](04-estado-del-servidor.md) adiciona com seu próprio texto.

## Como saber se deu certo

- [ ] Em `~/curso-react/revisor/`, `npm ci`, `npm run lint` e `npm run build` terminam com código 0, `npm run lint` não relata nenhum problema e a compilação deixa em `dist/assets/` um arquivo chamado `index-Dezp5bTH.js`.
- [ ] Com o servidor de prática e `npm run dev` rodando, `http://localhost:5173/` exibe um cartão com o cabeçalho «Estado de los servicios», a linha `4 servicios revisados · 2 servicios con falla` sobre a lista, e o botão «Actualizar» dentro do cartão. O console do navegador não apresenta nenhum erro do React.
- [ ] É possível apontar, na saída da figura 1, quais linhas são render e quais são *commit*, e explicar por que a segunda renderização faz zero alterações no DOM.
- [ ] As três impurezas da figura 2 foram encontradas e sabe-se qual é detectada pelo linter, qual é detectada pelo TypeScript com `readonly` e qual só aparece na saída.
- [ ] Ao definir temporariamente um componente dentro de `Panel`, `npm run lint` falha com `react-hooks/static-components`; ao retirá-lo, volta a passar. (Restaure o arquivo ao terminar.)
- [ ] Ao copiar `fig01_05.tsx` e trocar `[2, 0]` por `[0]`, é possível prever antes de executar as duas linhas impressas, e a execução confirma: com `fallas &&` sai `4 servicios revisados0`, e com `fallas > 0 &&`, `4 servicios revisados`. (O servidor de prática desta lição não tem um cenário sem falhas; a [Lição 8](08-pruebas-de-componentes.md) testa isso no `revisor`.)
- [ ] É possível explicar, com a saída da figura 3, por que o `revisor` usa `key={estado.nombre}` e por que isso é seguro com a API do curso.
- [ ] Foram anotadas no [diário de bordo](bitacora.md) as três impurezas e como foram encontradas, um componente dividido e o que se ganhou com isso, e um `0` que surgiu na tela sem ter sido solicitado.

## Resumo

Responda sem consultar a lição:

1. O que acontece no render e o que acontece no *commit*? Por que o React pode chamar o componente sem que a tela mude?
2. Quais são as duas condições de um componente puro? O que é uma mutação local e por que ela é permitida?
3. Cite três impurezas típicas e, para cada uma, qual ferramenta do curso a detecta (ou se nenhuma detecta).
4. O que um componente recebe em `children`? Por que `Tarjeta` fica em `compartido/` e não em `reporte/`?
5. O que acontece com o estado das linhas se a `key` for a posição e um elemento for inserido no início? E se a `key` combinar posição e nome?
6. Por que `{fallas && …}` pode renderizar um `0`, e como se escreve para que isso não aconteça?
7. Por que um componente definido dentro de outro perde o estado a cada render do pai? Qual regra do linter detecta isso?

## Leituras complementares

- [React, «Render and Commit»](https://react.dev/learn/render-and-commit): os três passos de uma atualização, o render recursivo e por que o React só toca no DOM onde houver diferenças. Consultado em 21 de outubro de 2026.
- [React, «Keeping Components Pure»](https://react.dev/learn/keeping-components-pure): as duas condições da pureza, a mutação local, o render duplo do `StrictMode` e onde ficam os efeitos colaterais. Consultado em 21 de outubro de 2026.
- [React, «Components and Hooks must be pure»](https://react.dev/reference/rules/components-and-hooks-must-be-pure): idempotência, `new Date()` e `Math.random()`, props e estado imutáveis, efeitos colaterais fora do render. Consultado em 21 de outubro de 2026.
- [React, «Passing Props to a Component»](https://react.dev/learn/passing-props-to-a-component): `children` como um vão preenchido pelo pai e props como fotografias imutáveis. Consultado em 21 de outubro de 2026.
- [React, «Understanding Your UI as a Tree»](https://react.dev/learn/understanding-your-ui-as-a-tree): a árvore de render, formada apenas por componentes. Consultado em 21 de outubro de 2026.
- [React, «Thinking in React»](https://react.dev/learn/thinking-in-react): dividir uma interface em componentes por separação de responsabilidades. Consultado em 21 de outubro de 2026.
- [React, «Rendering Lists»](https://react.dev/learn/rendering-lists): as regras da `key`, o perigo da posição e de chaves geradas em tempo de execução, e de onde extraí-las. Consultado em 21 de outubro de 2026.
- [React, «Conditional Rendering»](https://react.dev/learn/conditional-rendering): o aviso sobre números à esquerda de `&&`. Consultado em 21 de outubro de 2026.
- [React, «Your First Component»](https://react.dev/learn/your-first-component): nunca aninhar definições de componentes; nomes iniciados por letra maiúscula. Consultado em 21 de outubro de 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): o estado vinculado à posição na árvore e por que um componente aninhado o perde. Consultado em 21 de outubro de 2026.
- [React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components): a regra que detecta componentes criados durante o render. Consultado em 21 de outubro de 2026.
- [React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals) e [lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity): as regras que detectam alterações em variáveis de fora e funções impuras durante o render. Consultado em 21 de outubro de 2026.
- [MDN, `MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver): o que entrega o observador da figura 1: registros de mutação do contêiner. Consultado em 21 de outubro de 2026.
- [MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) e [`toSorted()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted): `sort` ordena no próprio lugar; `toSorted` devolve um array novo. Consultado em 21 de outubro de 2026.
- [MDN, função ARIA `region`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role): quando uma `<section>` é uma região e como receber um nome. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| render | o passo em que o React chama as funções de componente para saber como a tela deveria ficar; não mexe no DOM |
| *commit* | o passo em que o React aplica ao DOM apenas as diferenças entre o render novo e o anterior |
| pintar | o que o navegador faz após o *commit*: desenhar os pixels |
| componente puro | não altera nada que existisse antes da chamada e, com as mesmas entradas, devolve a mesma saída |
| mutação local | alterar um objeto ou array que o próprio componente acabou de criar; é permitida porque ninguém de fora enxerga isso |
| idempotente | que devolve o mesmo resultado a cada vez que é chamado com as mesmas entradas |
| composição | montar componentes grandes juntando peças que não se conhecem entre si |
| `children` | a prop em que um componente recebe o conteúdo aninhado entre as tags de abertura e fechamento |
| fragmento (`<>…</>`) | uma forma de devolver vários elementos irmãos sem envolvê-los em outro elemento |
| `key` | a dica com que o React emparelha os elementos de uma lista entre um render e outro; única entre irmãos e estável |
| região | uma área da página com nome próprio para a qual um leitor de tela pode saltar; uma tag `<section>` com nome acessível é uma região |

---

**Próxima:** [Lição 2 — Estado: instantâneo, imutabilidade e forma](02-estado-instantanea-forma.md)
