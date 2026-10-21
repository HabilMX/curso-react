# Lição 2 — Estado: instantâneo, imutabilidade e forma

*São 18h05 e o plantão noturno começa às 18h30. Antes de sair, a ideia é deixar para a colega de equipe uma nota no `revisor`: «pagos: o fornecedor diz que volta às 20h00, não escalar». A gente escolhe `pagos`, escreve a nota, salva… e a linha não muda. Dá para repassar mentalmente o que foi feito: o código adiciona a nota ao objeto de notas e o salva de novo no estado. A nota está lá, na memória; o console confirma. Mas a tela não toma conhecimento. Dez segundos depois chega o polling seguinte, o painel é renderizado novamente e, de repente, a marca «com nota» aparece, como se alguém a tivesse colocado fora de hora. E, ao escolher `reportes`, a caixa de texto ainda diz «pagos: o fornecedor diz que volta…». Se a colega salvar sem ler, a nota de `pagos` vai parar colada em `reportes`. Restam vinte e cinco minutos. As duas falhas vêm do mesmo erro: pensar o estado do React como uma variável que se altera. Não é isso: é uma fotografia que se substitui, e o React a guarda em um lugar preciso da árvore. Esta lição explica essa frase e a transforma em código.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 2.3 e 2.4)

**O que se constrói:** o filtro «Apenas falhas», a seleção de um serviço com o detalhamento correspondente e uma nota por serviço, com um rascunho que não se arrasta de um serviço para outro

**O que se aprende:** o estado é uma fotografia por renderização; a forma atualizadora `establecerN((n) => n + 1)`; copiar em vez de mutar; as cinco regras de formato do estado (entre elas: um `tipo` e não três sinalizadores, guardar o identificador e não o objeto, e não guardar o que dá para calcular); elevar o estado; `key` para reiniciá-lo

**De onde se vem.** Da [Lição 1](01-componentes-puros-composicion.md). O `revisor` já está dividido em peças puras: `Tarjeta` recebe um título e os respectivos `children`; `ResumenFallas` renderiza «4 serviços revisados · 2 serviços com falha» com funções puras de `resumen.ts`; `ContenidoReporte` decide o que renderizar de acordo com o carregamento; `ListaEstados` percorre os estados com `key={estado.nombre}`; e `FilaEstado` renderiza uma linha. `Panel` apenas compõe. A única coisa que muda com o tempo é o que `useReporte` traz, o hook da lição 0 que faz `GET /api/estados` a cada dez segundos. Até hoje, quem olha para o painel não consegue fazer nada além de clicar em «Actualizar». Hoje o painel começa a lembrar o que essa pessoa faz.

**O que esta lição não faz.** Não traz dados novos da API: o detalhamento de um serviço é montado com o que já chegou no relatório, e pedir à API o detalhe de um único serviço é o assunto da [Lição 3](03-effects-sincronizar.md), com a condição de corrida (race condition) entre as respostas. As notas vivem na memória: se a página for recarregada, elas se perdem, e tudo bem ser assim por enquanto. O filtro e a seleção também não trafegam no endereço da página; fazer com que um filtro possa ser compartilhado copiando o link é assunto da [Lição 5](05-rutas-url-como-estado.md). Não há contexto nem reducer, que são tema da [Lição 6](06-reducer-contexto.md), nem formulários com `action`, que ficam para a [Lição 7](07-formularios-accesibilidad.md). E não há nenhum Effect novo: a lição inteira se resolve com `useState`, cálculos durante a renderização e uma `key`.

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas do `package.json` desta lição (React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 para `tsc`, ESLint 10.13.0 e `eslint-plugin-react-hooks` 7.1.1). Como o curso pressupõe Linux Mint, este ponto de controle foi reinstalado do zero em um contêiner `node:24.22.0-bookworm` e gerou o mesmo nome de arquivo em `dist/` visto aqui, `index-FUlywxKd.js`; não foi executado em um Linux Mint real, mas nada do que se mostra depende do sistema. No macOS, `npm ci` imprime também um aviso de `install-scripts`: refere-se a `fsevents`, um pacote opcional que só se instala no macOS e que no Mint não aparece; não é preciso aprová-lo. As figuras rodam em `~/curso-react/figuras/`, a mesma pasta das lições anteriores; o `package.json` delas não muda. São compiladas com `tsc` e executadas com `node` sobre um DOM de teste (jsdom), como na lição 0. O que se vê «no navegador» foi medido com o Chrome em modo headless (`--headless`), controlado a partir de um script que clica em botões e lê a página pelo protocolo de depuração do Chrome: é um navegador real executando o JavaScript de `dist/`, não uma simulação. O script fica junto das figuras, em `medir.mjs`, e o primeiro comentário explica como executá-lo; se a preferência for fazer os mesmos passos manualmente no navegador, o resultado deve ser o mesmo. Os caminhos longos impressos pelo ESLint e pelo `tsc` são exibidos a partir de `~/curso-react`, e em uma saída do ESLint foram encurtados os espaços com que o formatador alinha a coluna da regra. Os erros da seção «O erro que vai aparecer» foram provocados em uma cópia do ponto de controle, nunca no original, que afinal de contas voltou a passar em `npm ci`, `npm run lint` e `npm run build`. Os programas estão em [`programas/02-estado-instantanea-forma/`](../programas/02-estado-instantanea-forma): `revisor/` é o ponto de controle e as figuras estão ao lado dele.

## Ao terminar, vai ser possível

- Prever o valor exibido por um componente depois de chamar várias vezes uma função `establecer…` no mesmo clique, e conferir a previsão com uma figura.
- Escrever uma atualização com a forma atualizadora quando o estado seguinte depender do anterior, e explicar quando isso dá um resultado diferente de passar o valor diretamente.
- Atualizar um objeto do estado criando uma cópia, e demonstrar com uma figura que alterá-lo diretamente e passá-lo de volta não renderiza nada de novo.
- Revisar o estado de um componente com as cinco regras de formato e apontar no `revisor` um exemplo de cada uma (um pode servir para duas).
- Decidir em qual componente vive cada pedaço de estado, elevá-lo ao ancestral comum e repassar para baixo o valor e a função que o altera.
- Usar uma `key` para que um componente recomece do zero quando aquilo que ele representa mudar, e reproduzir o erro que surge se ela faltar.

## O porquê antes do como

Abra o `revisor` da lição 1 e peça a ele três coisas que um operador pediria no primeiro dia.

**«Mostre apenas o que está falhando.»** Com quatro serviços não faz falta, mas o `revisor` real de uma empresa monitora dezenas. Uma caixa de seleção «Solo fallas» precisa lembrar se está marcada, e duas partes distintas precisam saber disso: a própria caixa, para se renderizar marcada, e a lista, para decidir quais linhas renderizar.

**«Quero ver um serviço em detalhes.»** A pessoa escolhe `pagos` e surge um quadro com o estado correspondente. Dez segundos depois chega o polling seguinte e `pagos` se recuperou: o quadro precisa dizer «Disponible», não o que dizia dez segundos atrás. Isso depende de **o que** se guarda quando alguém faz a seleção: o serviço inteiro ou apenas o nome dele.

**«Deixe anotar algo.»** Uma nota por serviço, que sobreviva à troca de serviço e ao retorno a ele, e que marque a linha para o próximo turno ver. E, enquanto se digita, um rascunho que não vá parar na nota de outro serviço.

As três situações pedem a mesma coisa: que o painel **lembre** algo entre uma renderização e a seguinte. No React, isso que se lembra chama-se **estado**, e a ferramenta é o `useState`, já utilizado na lição 0 dentro de `useReporte`. A lição 9 de TypeScript ensinou a escrevê-lo; esta lição ensina a **pensá-lo**, porque quase todos os erros com o estado vêm de pensar nele como uma variável. Uma variável é alterada e a mudança é vista na linha seguinte. Com o estado não é assim: cada renderização recebe uma fotografia fixa, e pedir uma alteração não mexe nessa fotografia, mas sim pede ao React que tire outra ([React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot)). Pensar no estado como variável explica as duas falhas da cena, embora cada uma pelo seu motivo: a nota que não aparece vem da fotografia (foi entregue ao React a mesma, retocada, e o React não viu nada de novo), e o rascunho que se arrasta vem do lugar onde o React guarda o estado (ele preservou o estado do editor porque, para ele, naquela posição continuava existindo o mesmo editor).

A lição tem seis partes: o estado como fotografia (2.1); copiar em vez de mutar (2.2); o formato do estado (2.3); elevar o estado (2.4); `key` para reiniciá-lo (2.5); e o roteiro completo (2.6). O resultado fica assim, medido com o Chrome headless sobre o ponto de controle, ao escolher `pagos`, salvar uma nota e mudar de serviço (são os passos 3 a 6 do roteiro de 2.6):

```text
3. desmarcas y eliges pagos
   pagos aria-pressed: true
   detalle: Detalle de pagos — En falla: HTTP 503
4. escribes una nota y la guardas
   filas: catálogo: disponible (HTTP 200, 42 ms) | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
5. empiezas otra nota en pagos sin guardarla y eliges reportes
   detalle: Detalle de reportes · borrador: ""
6. regresas a pagos
   borrador: "llamar al proveedor"
```

Ao final da lição, vai dar para saber de onde sai cada linha e por que a última diz o que diz.

## Os conceitos

### 2.1 O estado é uma fotografia

#### 2.1.1 O que acontece ao chamar `establecer…`

Ao escrever `const [revisiones, establecerRevisiones] = useState(0)`, o React entrega duas coisas: o valor que ele tem guardado **para esta renderização** e uma função para lhe pedir outro. O ponto importante está na palavra «pedir». A documentação do React explica desta forma: o estado se comporta como uma fotografia; alterá-lo não muda a variável que já se tem, mas sim provoca uma nova renderização ([React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot)). E na referência de `useState`, com todas as letras: a função `set` só atualiza a variável de estado **para a próxima renderização** ([React, `useState`](https://react.dev/reference/react/useState)).

A primeira figura põe isso à prova com o caso mais simples possível: um botão que, em um único clique, chama três vezes a função que soma uma revisão. Há duas versões. A primeira passa para o React o valor, `revisiones + 1`; a segunda passa uma função, `(actual) => actual + 1`. As duas imprimem, dentro do clique, quanto vale `revisiones`, e a figura lê o que o botão diz ao terminar.

```tsx
// fig02_01.tsx
import { JSDOM } from "jsdom";
import { act, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function ConValor() {
  const [revisiones, establecerRevisiones] = useState(0);

  function revisarTres(): void {
    establecerRevisiones(revisiones + 1);
    establecerRevisiones(revisiones + 1);
    establecerRevisiones(revisiones + 1);
    console.log(`  dentro del clic, revisiones vale ${revisiones}`);
  }

  return (
    <button type="button" onClick={revisarTres}>
      {revisiones}
    </button>
  );
}

function ConActualizadora() {
  const [revisiones, establecerRevisiones] = useState(0);

  function revisarTres(): void {
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones((actual) => actual + 1);
    console.log(`  dentro del clic, revisiones vale ${revisiones}`);
  }

  return (
    <button type="button" onClick={revisarTres}>
      {revisiones}
    </button>
  );
}

async function hacerClic(titulo: string, Componente: ComponentType): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<Componente />);
  });

  const boton = contenedor.querySelector("button");
  await act(async () => {
    boton?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });

  console.log(`  después del clic, el botón dice ${boton?.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await hacerClic("con el valor (revisiones + 1, tres veces):", ConValor);
await hacerClic("con la forma actualizadora (actual => actual + 1, tres veces):", ConActualizadora);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_01.tsx
$ node fig02_01.js
con el valor (revisiones + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 1
con la forma actualizadora (actual => actual + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 3
```

Antes de ler a explicação, observe as duas linhas que dizem «dentro del clic»: nas duas versões, `revisiones` vale `0`, embora `establecerRevisiones` já tenha sido chamada três vezes. Essa é a fotografia. O manipulador de clique é uma função criada durante a renderização em que `revisiones` valia `0`, e para essa função `revisiones` é `0` para sempre, como uma constante. O React não reescreve as variáveis do código; o que ele faz é chamar o componente novamente e, nessa nova chamada, o `useState` devolve o novo valor. A documentação resume isso em uma regra: **o valor de uma variável de estado nunca muda dentro de uma renderização**, mesmo que o código do manipulador seja assíncrono ([React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot)).

Com isso, a primeira versão se explica sozinha. As três chamadas dizem a mesma coisa: «na próxima renderização, `revisiones` vale `0 + 1`». Três vezes `1` é `1`. O botão mostra `1`, não `3`. É exatamente o exemplo que a documentação do React usa com o botão «+3» ([React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot)).

#### 2.1.2 A fila de atualizações e a forma atualizadora

Por que o botão não foi renderizado três vezes, uma para cada chamada? Porque o React **espera todo o código do manipulador terminar** antes de processar as atualizações de estado. Isso se chama **agrupamento** (*batching*), e é o que evita renderizações desnecessárias e telas atualizadas pela metade ([React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates)). Enquanto o manipulador é executado, cada chamada a `establecer…` entra em uma fila. Quando ele termina, o React percorre a fila em ordem para calcular o valor da próxima renderização.

É aí que entra a segunda versão. Se em vez de um valor se passar uma **função**, o React não a executa na hora: ele a coloca na fila e, ao processá-la, entrega a ela o resultado da anterior. A documentação chama isso de **função atualizadora** (*updater function*) ([React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates)). A primeira recebe `0` e retorna `1`; a segunda recebe `1` e retorna `2`; a terceira recebe `2` e retorna `3`. O botão mostra `3`. Repare que, ainda assim, a linha «dentro del clic» continua dizendo `0`: a forma atualizadora não muda a fotografia, muda **como a próxima é calculada**.

Três detalhes para guardar:

- **O nome do parâmetro.** A documentação sugere nomeá-lo com as iniciais da variável (`n => n + 1`) ou, se a preferência for algo mais longo, repetindo o nome completo ou colocando um prefixo como `prev` ([React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates)). Este curso usa um nome em espanhol que diga o que é: `actual`, `actuales`. É um critério próprio, pensado para manter a mesma leitura do restante do código.
- **Ela precisa ser pura.** A função atualizadora roda durante a renderização, portanto só deve calcular e retornar: nada de buscar dados, imprimir mensagens nem chamar outra função `establecer…`. Em `StrictMode`, e apenas durante o desenvolvimento, o React a chama **duas vezes** e fica com um dos resultados (na versão compilada de produção ele a chama apenas uma vez), justamente para expor funções impuras ([React, `useState`](https://react.dev/reference/react/useState)). É o mesmo teste gratuito da lição 0, aplicado ao estado.
- **Se o valor novo for necessário imediatamente, calcule-o diretamente.** Se após `establecerRevisiones(revisiones + 1)` houver necessidade de usar o valor novo no mesmo manipulador, guarde-o antes em uma constante: `const siguiente = revisiones + 1`. Ler `revisiones` vai entregar a fotografia antiga; a referência de `useState` traz isso como o primeiro caso da seção de problemas comuns ([React, `useState`](https://react.dev/reference/react/useState)).

#### 2.1.3 No `revisor`: `establecerNotas((actuales) => …)`

No ponto de controle, a forma atualizadora aparece uma vez, em `Panel`, ao salvar uma nota:

```tsx
// revisor/src/reporte/Panel.tsx (fragmento)
  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }
```

Seja honesto quanto ao que isso demonstra: no painel de hoje, `establecerNotas(conNota(notas, nombre, texto))` daria o mesmo resultado, porque `guardarNota` é chamada apenas uma vez por clique. Então, por que usar a forma atualizadora? Porque **o estado seguinte depende do anterior**: uma nota nova é adicionada às que já existiam. Com a forma atualizadora, o cálculo é feito com o que há de mais recente na fila, não com a fotografia que o manipulador tinha quando foi criado. No dia em que alguém adicionar um botão que salve duas notas no mesmo clique, ou quando a nota chegar de uma função criada em uma renderização anterior, esse código continua correto sem ninguém precisar repensá-lo. A documentação do React não exige a forma atualizadora em todos os casos; o critério do curso é mais simples de memorizar: **se o novo valor for calculado a partir do antigo, passe ao React uma função**. Se o novo valor não depender do antigo, como em `establecerSoloFallas(true)` ou `establecerSeleccionado("pagos")`, passe o valor diretamente.

### 2.2 Copiar em vez de mutar

#### 2.2.1 O React compara a fotografia, não o conteúdo dela

Como o React sabe que o estado mudou? Ele não percorre o objeto campo por campo: compara o novo valor com o atual usando `Object.is` e, se forem **o mesmo**, pula a renderização desse componente e de seus filhos ([React, `useState`](https://react.dev/reference/react/useState)). Para números e textos, «o mesmo» significa o que se espera. Para objetos e arrays significa outra coisa: `Object.is` diz que dois objetos são o mesmo apenas se forem **a mesma referência na memória**, não se tiverem os mesmos campos ([MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)). Dois objetos com o mesmo conteúdo são distintos; um objeto no qual se alterou um campo continua sendo o mesmo.

A segunda figura reproduz a primeira falha da cena. Um bloco de notas guarda um objeto no estado e tem dois botões. «mutar» adiciona a nota ao objeto que já existe e o passa de volta. «copiar» cria um objeto novo com tudo o que havia antes mais a nota. Um `<Profiler>` do React conta quantas vezes uma renderização foi concluída; é a forma de contar sem introduzir um efeito colateral dentro do componente (a Lição 9 retoma o Profiler).

```tsx
// fig02_02.tsx
import { JSDOM } from "jsdom";
import { act, Profiler, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Notas = Record<string, string>;

let dibujos = 0;

function BlocDeNotas() {
  const [notas, establecerNotas] = useState<Notas>({});

  function mutar(): void {
    notas.pagos = "se reinició a las 9:40";
    establecerNotas(notas);
  }

  function copiar(): void {
    establecerNotas({ ...notas, pagos: "se reinició a las 9:40" });
  }

  return (
    <>
      <p>notas guardadas: {Object.keys(notas).length}</p>
      <button type="button" id="mutar" onClick={mutar}>
        mutar
      </button>
      <button type="button" id="copiar" onClick={copiar}>
        copiar
      </button>
    </>
  );
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor);

async function clic(id: string): Promise<void> {
  await act(async () => {
    contenedor
      .querySelector(`#${id}`)
      ?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  console.log(`clic en «${id}»: pantalla «${contenedor.querySelector("p")?.textContent}», dibujos: ${dibujos}`);
}

await act(async () => {
  raiz.render(
    <Profiler id="bloc" onRender={() => (dibujos += 1)}>
      <BlocDeNotas />
    </Profiler>,
  );
});
console.log(`al montar:      pantalla «${contenedor.querySelector("p")?.textContent}», dibujos: ${dibujos}`);
await clic("mutar");
await clic("copiar");
await act(async () => {
  raiz.unmount();
});
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_02.tsx
$ node fig02_02.js
al montar:      pantalla «notas guardadas: 0», dibujos: 1
clic en «mutar»: pantalla «notas guardadas: 0», dibujos: 1
clic en «copiar»: pantalla «notas guardadas: 1», dibujos: 2
```

Depois de «mutar», o contador de renderizações continua em `1` e a tela continua dizendo `0`. O objeto mudou, sim: ele contém a nota de `pagos`. Mas o que foi passado ao React é **o mesmo objeto** que ele já tinha, `Object.is` disse «igual» e o React não fez nada. A documentação explica isso com o exemplo de um ponto que segue o cursor do mouse: sem a função que altera o estado, o React não faz ideia de que o objeto mudou e não responde ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)); e a referência de `useState` traz isso como o problema «atualizei o estado, mas a tela não muda» ([React, `useState`](https://react.dev/reference/react/useState)).

Veja agora a última linha: depois de «copiar», há uma nova renderização e a tela mostra `1`. Repare que o objeto novo tem a nota de `pagos` por dois caminhos: a mutação anterior, que continuava escondida dentro do objeto antigo e foi copiada com `...notas`, e a própria cópia. A tela exibiu a mutação **quando outra coisa provocou a renderização**. É exatamente o que se viu na cena com o polling de dez segundos: a marca «com nota» apareceu fora de hora, quando o relatório seguinte forçou uma renderização e a mutação escondida veio à tona. Uma mutação nem sempre se perde; às vezes ela aparece tarde, e isso é ainda pior, porque dá a ilusão de funcionar.

#### 2.2.2 Copiar: a sintaxe de espalhamento

A regra da documentação é direta: **trate qualquer objeto colocado no estado como somente leitura**; em vez de alterá-lo, substitua-o por outro ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)). A ferramenta do JavaScript para isso é a **sintaxe de espalhamento** (*spread syntax*, `...`): em um objeto literal, `{ ...notas, pagos: "texto" }` copia as propriedades próprias enumeráveis de `notas` (para um objeto como este, todas) para um novo objeto e depois grava `pagos`; se `pagos` já existia, prevalece o último valor ([MDN, «Spread syntax»](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)).

Um aviso importante assim que o estado crescer: o espalhamento é **superficial**. Ele copia apenas um nível; se uma propriedade for por sua vez um objeto, a cópia apontará para o mesmo objeto interno, e alterá-lo seria novamente uma mutação. A documentação do React destaca isso e demonstra como copiar nível por nível ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)). Esse é um dos motivos da quinta regra de formato (2.3): o estado plano é copiado em uma única etapa.

No `revisor`, a cópia vive em uma função pura, fora dos componentes, em um arquivo próprio:

```ts
// revisor/src/reporte/notas.ts
export type Notas = Readonly<Record<string, string>>;

export function conNota(notas: Notas, nombre: string, texto: string): Notas {
  const limpio = texto.trim();

  if (limpio === "") {
    return Object.fromEntries(Object.entries(notas).filter(([clave]) => clave !== nombre));
  }

  return { ...notas, [nombre]: limpio };
}
```

A leitura pode ser feita linha por linha:

- **`Notas` é `Readonly<Record<string, string>>`.** Um registro cujas chaves são nomes de serviço e cujos valores são o texto da nota, marcado como somente leitura. `Record<K, T>` constrói um tipo de objeto com chaves `K` e valores `T`, e `Readonly<T>` faz com que as propriedades dele não possam ser reatribuídas ([TypeScript, «Utility Types»](https://www.typescriptlang.org/docs/handbook/utility-types.html)). Trata-se de uma checagem de tipos, não de uma proteção em tempo de execução: o objeto não é congelado, mas o `tsc` rejeita qualquer atribuição. Na seção «O erro que vai aparecer», vai ser possível vê-lo barrando a mutação da cena antes que ela chegue ao navegador.
- **`texto.trim()`.** Uma nota feita apenas de espaços não é uma nota. A limpeza é feita uma única vez, aqui, e ninguém mais precisa se lembrar disso.
- **Se o texto ficar vazio, a nota é removida.** `Object.entries` converte o objeto em uma lista de pares `[chave, valor]`, `filter` deixa de fora o par do serviço, e `Object.fromEntries` remonta um objeto com os que restaram. As três funções criam objetos novos; nenhuma mexe em `notas`. Assim, «apagar o texto e salvar» remove a marca «com nota» da linha, que é o comportamento esperado.
- **Havendo texto, copia-se e escreve-se.** `{ ...notas, [nombre]: limpio }` é o espalhamento visto acima, com uma chave computada entre colchetes.

Por que uma função separada e não três linhas dentro de `Panel`? Pelo mesmo motivo de `contarFallas` na lição 1: uma função pura — mesmas entradas, mesma saída, sem tocar em nada externo — é compreensível por si só, pode ser testada sem o React, como se verá com `resumen.ts` na Lição 8, e pode ser chamada a partir da função atualizadora sem receio de que o `StrictMode` a execute duas vezes.

#### 2.2.3 Por que tanta cerimônia

Pode parecer que copiar seja mais custoso e mais trabalhoso do que mutar. A documentação do React apresenta cinco motivos para fazer cópias mesmo assim ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)), e três deles já se fazem notar no `revisor`:

1. **Depurar.** Ao imprimir o estado com `console.log` sem nunca mutá-lo, os registros antigos continuam dizendo o que diziam no momento do registro; com mutações, um registro feito cinco segundos atrás exibe o valor de agora.
2. **Otimizar.** Se o objeto anterior for o mesmo que o novo, nada dentro dele pôde mudar. Essa comparação em um único passo é a que o React faz com `Object.is`, e a que a memoização utilizará quando a Lição 9 for medi-la.
3. **Os novos recursos do React contam com isso.** A documentação afirma que os recursos em desenvolvimento pelo React dependem de que o estado seja tratado como fotografia. Neste curso, isso vai ficar evidente com o `useOptimistic` na Lição 7.

Se um dia o estado ficar tão aninhado que copiar manualmente se torne ilegível, a documentação menciona o Immer, uma biblioteca que permite escrever com sintaxe de mutação e gera as cópias por baixo dos panos ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)). Este curso não a utiliza: o estado do `revisor` é plano de propósito, e a seção seguinte explica o porquê.

### 2.3 O formato do estado: cinco regras

#### 2.3.1 As cinco regras e o que cada uma evita

Saber alterar o estado não basta; também importa **o que** se guarda. A documentação do React propõe cinco princípios para estruturar o estado ([React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)). Eles são apresentados com o `revisor` ao lado, pois cada um conta com um exemplo no ponto de controle:

1. **Agrupar o estado relacionado.** Se duas variáveis sempre são alteradas juntas, junte-as em uma só. No `revisor`: o resultado de um carregamento é um único valor `Carga`, não um «relatório» por um lado e um «detalhe do erro» por outro que sempre mudam em conjunto. `Carga` é o exemplo das regras 1 e 2 simultaneamente: agrupa o relatório e o detalhe do erro (regra 1) e, por ser uma união, impede que entrem em contradição (regra 2).
2. **Evitar contradições.** Se vários pedaços de estado puderem discordar entre si, abre-se espaço para falhas. O exemplo da documentação são dois sinalizadores (*flags*), `isSending` e `isSent`, que nunca deveriam ser verdadeiros ao mesmo tempo e que são substituídos por um único `status` com três valores. No `revisor`, é `Carga` desde a lição 0: um `tipo` que vale `"cargando"`, `"listo"` ou `"error"`. Com três sinalizadores `cargando`, `listo` e `conError` haveria oito combinações, das quais apenas três fariam sentido; com uma união discriminada, as cinco impossíveis nem sequer podem ser escritas. A documentação estabelece isso como meta: nunca permitir na memória um estado que não corresponda a nenhuma tela válida ([React, «Reacting to Input with State»](https://react.dev/learn/reacting-to-input-with-state)).
3. **Evitar estado redundante.** Se algo puder ser calculado durante a renderização a partir das props ou do estado já existente, não guarde no estado. No `revisor`: a lista filtrada, o serviço selecionado, o número de falhas e o fato de uma linha ter nota ou não. Nenhum desses é estado; os quatro são calculados.
4. **Evitar duplicação.** Se o mesmo dado residir em dois locais, mantê-los sincronizados vira um problema do desenvolvedor. No `revisor`: guarda-se o **nome** do serviço selecionado, não o serviço.
5. **Evitar estado profundamente aninhado.** Estado hierárquico é incômodo de copiar. No `revisor`: as notas formam um registro plano por nome, `{ pagos: "…", reportes: "…" }`, separado dos estados do relatório; elas não são inseridas dentro de cada serviço.

As regras 3 e 4 são as que mais previnem erros, e ambas têm comprovação prática.


#### 2.3.2 Guardar o identificador, não o objeto

Quando a pessoa escolhe `pagos`, a tentação é guardar o objeto que foi escolhido: `{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }`. Ele já está disponível, e para renderizar o detalhe é exatamente o que se precisa. O problema é que esse objeto **já está guardado** em outro lugar: dentro do relatório. A documentação explica assim: o conteúdo do elemento escolhido é o mesmo objeto que um da lista, de modo que a informação dele fica duplicada em dois lugares ([React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)). Enquanto nada mudar, não se nota. No `revisor`, algo muda a cada dez segundos.

A quarta figura põe as duas estratégias lado a lado. Uma tela recebe a lista de estados; um componente guarda o objeto escolhido e outro guarda apenas o nome e busca o objeto ao renderizar. Em seguida chega um relatório novo no qual `pagos` se recuperou:

```tsx
// fig02_04.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

const primerReporte: readonly Estado[] = [
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "pagos", tipo: "falla" },
];
const segundoReporte: readonly Estado[] = [
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "pagos", tipo: "disponible" },
];

function GuardaElObjeto({ estados }: { readonly estados: readonly Estado[] }) {
  const [elegido] = useState<Estado | null>(estados[1] ?? null);
  return <p>guarda el objeto: {elegido === null ? "nada" : `${elegido.nombre} está ${elegido.tipo}`}</p>;
}

function GuardaElNombre({ estados }: { readonly estados: readonly Estado[] }) {
  const [seleccionado] = useState<string | null>("pagos");
  const elegido = estados.find((estado) => estado.nombre === seleccionado);
  return <p>guarda el nombre: {elegido === undefined ? "nada" : `${elegido.nombre} está ${elegido.tipo}`}</p>;
}

function Pantalla({ estados }: { readonly estados: readonly Estado[] }) {
  const lista = estados.map((estado) => `${estado.nombre}=${estado.tipo}`).join(", ");
  return (
    <>
      <p>lista: {lista}</p>
      <GuardaElObjeto estados={estados} />
      <GuardaElNombre estados={estados} />
    </>
  );
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor);
const imprimir = (titulo: string) => {
  console.log(titulo);
  for (const parrafo of contenedor.querySelectorAll("p")) {
    console.log(`  ${parrafo.textContent}`);
  }
};

await act(async () => {
  raiz.render(<Pantalla estados={primerReporte} />);
});
imprimir("primer reporte, con pagos elegido:");

await act(async () => {
  raiz.render(<Pantalla estados={segundoReporte} />);
});
imprimir("llega el siguiente sondeo (pagos se recuperó):");

await act(async () => {
  raiz.unmount();
});
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_04.tsx
$ node fig02_04.js
primer reporte, con pagos elegido:
  lista: catálogo=disponible, pagos=falla
  guarda el objeto: pagos está falla
  guarda el nombre: pagos está falla
llega el siguiente sondeo (pagos se recuperó):
  lista: catálogo=disponible, pagos=disponible
  guarda el objeto: pagos está falla
  guarda el nombre: pagos está disponible
```

A lista diz que `pagos` está disponível, e o componente que guardou o objeto continua dizendo que está em falha: ele tem uma fotografia do polling anterior, e ninguém vai atualizá-la, porque o estado só se inicializa na primeira renderização. O que guardou o nome diz a verdade sem fazer nada de especial: em cada renderização busca `pagos` na lista recém-chegada. Imagine o operador da cena lendo «En falla» no detalhe e «disponible» na linha ao lado, com o plantão prestes a começar.

Por isso, no ponto de controle, `seleccionado` é `string | null` — o nome, ou nada — e o serviço selecionado é buscado ao renderizar, em `ContenidoReporte`:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx (fragmento)
      const { estados } = carga.reporte;
      const visibles = filtrarEstados(estados, soloFallas);
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

`elegido` não é estado: é uma constante que vive durante a renderização. A documentação propõe exatamente isso com seu `selectedId`: guardar apenas o identificador, que é o essencial, e calcular o resto durante a renderização ([React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)). E isso traz uma vantagem de brinde: se o serviço desaparecer do relatório, `find` retorna `undefined` e o detalhe simplesmente não é renderizado; não é preciso «limpar» a seleção com código algum ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). É seguro buscar por nome porque a API garante que não existem dois serviços com o mesmo nome, a mesma garantia que sustenta a `key={estado.nombre}` da lição 1.

#### 2.3.3 Não guardar o que dá para calcular

A terceira regra tem uma versão que a documentação repete em duas páginas: **quando algo puder ser calculado a partir das props ou do estado já existentes, não guarde no estado; calcule durante a renderização** ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). No ponto de controle há quatro cálculos assim, e nenhum pede estado:

- **A lista filtrada.** `filtrarEstados(estados, soloFallas)` é uma função pura nova de `resumen.ts`. Se a caixa estiver marcada, deixa apenas as falhas; senão, retorna a mesma lista sem copiá-la.

```ts
// revisor/src/reporte/resumen.ts
import type { EstadoPublico } from "../compartido/contrato";

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}

export function filtrarEstados(
  estados: readonly EstadoPublico[],
  soloFallas: boolean,
): readonly EstadoPublico[] {
  return soloFallas ? estados.filter((estado) => estado.tipo === "falla") : estados;
}
```

- **O serviço escolhido**, que acabou de ser visto.
- **O resumo.** `ResumenFallas` recebe a lista **completa**, não a filtrada, de propósito: «4 serviços revisados · 2 serviços com falha» descreve o que o polling verificou, não o que foi deixado visível. A medição do Chrome confirma: com a caixa marcada, o resumo continua dizendo 4 e 2.
- **Se uma linha tem nota.** `ListaEstados` passa para cada linha `tieneNota={notas[estado.nombre] !== undefined}`. Não existe uma lista separada de «serviços com nota» que precise ser mantida em dia.

E se calcular fosse custoso? Filtrar quatro, ou quatrocentos, elementos em cada renderização não é. O critério do curso é o do README dele: primeiro se mede e depois se otimiza, e a Lição 9 traz a medição. Guardar um cálculo no estado «para não repeti-lo» não é uma otimização: é uma cópia que alguém precisa manter sincronizada, e a forma mais comum de sincronizá-la — um Effect que a recalcula — é aquela que o linter rejeita, como se verá na seção «O erro que vai aparecer».

### 2.4 Elevar o estado

#### 2.4.1 Cada pedaço de estado tem um dono

Já se sabe como alterar o estado e o que guardar. Falta decidir **onde**. A documentação apresenta isso como um princípio: para cada pedaço de estado único, escolhe-se o componente que é o «dono» dele, e isso é ter uma **única fonte de verdade**; não significa que todo o estado viva em um só lugar, mas sim que cada pedaço tem um componente específico que o guarda ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)). Quando dois componentes precisam do mesmo dado, o dono é o **ancestral comum mais próximo**: remove-se o estado dos filhos, move-se para o pai e passa-se para baixo via props, junto com as funções que o alteram. A documentação chama isso de **elevar o estado** (*lifting state up*), e diz que isso é o que mais se faz no React ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)).

Basta aplicar a pergunta «quem precisa dele?» aos três estados novos do `revisor`:

| Estado | Quem lê | Quem altera | Ancestral comum |
|---|---|---|---|
| `soloFallas` | `FiltroFallas` (para se renderizar) e `ContenidoReporte` (para filtrar) | `FiltroFallas` | `Panel` |
| `seleccionado` | `FilaEstado` (para `aria-pressed`) e `ContenidoReporte` (para o detalhe) | `FilaEstado` e o botão «Cerrar detalle» | `Panel` |
| `notas` | `FilaEstado` (a marca) e `EditorNota` (o que foi salvo) | `EditorNota` | `Panel` |
| `borrador` | apenas `EditorNota` | apenas `EditorNota` | `EditorNota` |

Os três primeiros sobem para o `Panel`. O quarto fica embaixo, e é igualmente importante entender o porquê: o rascunho é o que a pessoa está digitando **antes** de decidir salvar. Ninguém mais precisa dele, e se subisse para o `Panel`, cada tecla pressionada renderizaria novamente o painel inteiro em vez de apenas o editor. Elevar não é uma virtude por si só: o estado sobe **até onde precisam dele, e nem um nível a mais**.

Assim fica o `Panel`, que agora é o dono:

```tsx
// revisor/src/reporte/Panel.tsx
import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
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
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <ContenidoReporte
          carga={carga}
          soloFallas={soloFallas}
          seleccionado={seleccionado}
          notas={notas}
          alSeleccionar={establecerSeleccionado}
          alGuardarNota={guardarNota}
        />
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Três `useState`, um para cada pedaço de estado, cada qual com o seu tipo: `false` é suficiente para o TypeScript inferir `boolean`; `seleccionado` precisa de `<string | null>` porque começa em `null` e depois guardará um nome; `notas` começa em `{}` com o tipo `Notas`. As funções descem com o prefixo `al` (`alCambiar`, `alSeleccionar`, `alGuardarNota`), que é a convenção de nomes do curso para props que são funções. Repare que duas delas são diretamente as funções do React: `alCambiar={establecerSoloFallas}` e `alSeleccionar={establecerSeleccionado}`. As funções `establecer…` entregues pelo `useState` são estáveis — a referência de `useState` afirma que elas possuem uma identidade estável, a mesma em cada renderização ([React, `useState`](https://react.dev/reference/react/useState)) — e o formato delas coincide com o que o filho espera, de forma que não é preciso envolvê-las em outras funções.

#### 2.4.2 A caixa de seleção: um componente controlado

`FiltroFallas` não tem estado. Ele recebe o valor e uma função, limitando-se a renderizar e a notificar:

```tsx
// revisor/src/reporte/FiltroFallas.tsx
export function FiltroFallas({
  soloFallas,
  alCambiar,
}: {
  readonly soloFallas: boolean;
  readonly alCambiar: (soloFallas: boolean) => void;
}) {
  return (
    <label className="filtro">
      <input
        type="checkbox"
        checked={soloFallas}
        onChange={(evento) => alCambiar(evento.target.checked)}
      />{" "}
      Solo fallas
    </label>
  );
}
```

Um `<input>` ao qual se passa `checked` é um **campo controlado**: o React decide se ele está marcado, não o navegador. Por isso a documentação exige que, junto com `checked`, passe-se um `onChange` que atualize esse valor de forma síncrona; sem ele, o campo fica como somente leitura e o React avisa no console com «You provided a `checked` prop to a form field without an `onChange` handler» ([React, `<input>`](https://react.dev/reference/react-dom/components/input)). Para uma caixa de seleção, lê-se `evento.target.checked`, não `evento.target.value`, que é outro deslize apontado pela mesma página. E a caixa vai dentro do `<label>` correspondente: assim, clicar no texto «Solo fallas» também a marca, e um leitor de tela anuncia a caixa com o nome dela. É HTML nativo, sem ARIA.

A palavra «controlado» também é usada para componentes inteiros: a documentação chama de controlado o componente cuja informação importante vem das suas props e não do próprio estado, e de não controlado aquele que a guarda por conta própria ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)). `FiltroFallas` é controlado; `EditorNota`, com seu rascunho, é não controlado. Cuidado com o duplo sentido: o `<textarea>` de `EditorNota` é um campo controlado (o valor dele é definido por `borrador`), mas o componente é não controlado, porque esse `borrador` vive dentro dele e o `Panel` não pode tocá-lo. O primeiro termo fala do campo; o segundo, do componente; a própria documentação esclarece que «controlado» e «não controlado» não são termos técnicos estritos. Nenhum dos dois é melhor que o outro: o controlado permite que o pai coordene; o não controlado é mais simples de usar. A Lição 7 retoma essa distinção nos formulários.

#### 2.4.3 A linha: um botão que diz se está selecionado

Para escolher um serviço, o nome de cada linha vira um botão:

```tsx
// revisor/src/reporte/FilaEstado.tsx
import type { EstadoPublico } from "../compartido/contrato";

function Descripcion({ estado }: { readonly estado: EstadoPublico }) {
  if (estado.tipo === "disponible") {
    return (
      <>
        disponible (HTTP {estado.codigoHttp}, {estado.duracionMs} ms)
      </>
    );
  }

  return <>falla ({estado.detalle})</>;
}

export function FilaEstado({
  estado,
  seleccionado,
  tieneNota,
  alSeleccionar,
}: {
  readonly estado: EstadoPublico;
  readonly seleccionado: boolean;
  readonly tieneNota: boolean;
  readonly alSeleccionar: (nombre: string) => void;
}) {
  return (
    <li className={estado.tipo}>
      <button
        type="button"
        className="seleccionar"
        aria-pressed={seleccionado}
        onClick={() => alSeleccionar(estado.nombre)}
      >
        {estado.nombre}
      </button>
      : <Descripcion estado={estado} />
      {tieneNota && <span className="marca-nota"> · con nota</span>}
    </li>
  );
}
```

Várias decisões em poucas linhas:

- **Um `<button>`, não um `<span>` com `onClick`.** Um botão nativo é alcançado com a tecla Tab, é acionado com Enter ou espaço e um leitor de tela o anuncia como botão. Com um `<span>`, seria preciso construir tudo isso manualmente.
- **`aria-pressed`.** Indica o estado «pressionado» de um botão de alternância: com `true` ou `false`, o botão se anuncia como algo clicável e informa se está acionado ([MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)). O MDN também recomenda não alterar o texto do botão quando esse estado mudar, e o `revisor` respeita isso: o botão diz `pagos`, quer esteja selecionado ou não. A folha de estilos usa esse mesmo atributo para engrossar o sublinhado, com o seletor `.seleccionar[aria-pressed="true"]`: o que os olhos veem e o que o leitor de tela ouve saem do mesmo dado.
- **`className={estado.tipo}`.** A classe da linha, `disponible` ou `falla`, é o mesmo texto do tipo, de modo que já não se faz necessário um `if` com dois `<li>` quase idênticos. O `if` que distingue os dois casos foi movido para `Descripcion`, um componente pequeno que só renderiza o texto. Ele está definido **fora** de `FilaEstado`, nunca dentro, pela regra da lição 1: um componente definido dentro de outro é um componente novo a cada renderização, e o estado dele seria reiniciado sem aviso ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).
- **`{tieneNota && …}`.** Aqui o `&&` é seguro porque `tieneNota` é booleano; a armadilha do `0` da lição 1 aparece apenas quando a condição é um número.
- **A linha não sabe o que está selecionado.** Ela recebe `seleccionado: boolean`, já calculado pela lista. A linha é pura: mesmas props, mesma renderização.

A lista faz os cálculos por linha e não guarda nada:

```tsx
// revisor/src/reporte/ListaEstados.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { FilaEstado } from "./FilaEstado";
import type { Notas } from "./notas";

export function ListaEstados({
  estados,
  seleccionado,
  notas,
  alSeleccionar,
}: {
  readonly estados: readonly EstadoPublico[];
  readonly seleccionado: string | null;
  readonly notas: Notas;
  readonly alSeleccionar: (nombre: string) => void;
}) {
  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado
          key={estado.nombre}
          estado={estado}
          seleccionado={estado.nombre === seleccionado}
          tieneNota={notas[estado.nombre] !== undefined}
          alSeleccionar={alSeleccionar}
        />
      ))}
    </ul>
  );
}
```

O `alSeleccionar` dela recebe uma `string`, enquanto o de `Panel` aceita `string | null`. O TypeScript permite isso porque uma função que aceita mais casos pode ser usada onde se espera uma que aceita menos. O `null` é usado por outra peça: o botão «Cerrar detalle».

#### 2.4.4 Quem distribui

`ContenidoReporte` recebe tudo e decide o que renderizar. O caso `"listo"` agora conta com chaves próprias para declarar as três constantes calculadas vistas em 2.3:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { DetalleSeleccion } from "./DetalleSeleccion";
import { ListaEstados } from "./ListaEstados";
import type { Notas } from "./notas";
import { filtrarEstados } from "./resumen";
import { ResumenFallas } from "./ResumenFallas";
import type { Carga } from "./useReporte";

export function ContenidoReporte({
  carga,
  soloFallas,
  seleccionado,
  notas,
  alSeleccionar,
  alGuardarNota,
}: {
  readonly carga: Carga;
  readonly soloFallas: boolean;
  readonly seleccionado: string | null;
  readonly notas: Notas;
  readonly alSeleccionar: (nombre: string | null) => void;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
}) {
  switch (carga.tipo) {
    case "cargando":
      return <p role="status">Cargando…</p>;
    case "error":
      return <p role="alert">No se pudo cargar el reporte: {carga.detalle}</p>;
    case "listo": {
      const { estados } = carga.reporte;
      const visibles = filtrarEstados(estados, soloFallas);
      const elegido = estados.find((estado) => estado.nombre === seleccionado);

      return (
        <>
          <ResumenFallas estados={estados} />
          <ListaEstados
            estados={visibles}
            seleccionado={seleccionado}
            notas={notas}
            alSeleccionar={alSeleccionar}
          />
          {elegido !== undefined && (
            <DetalleSeleccion
              estado={elegido}
              notas={notas}
              alGuardarNota={alGuardarNota}
              alCerrar={() => alSeleccionar(null)}
            />
          )}
        </>
      );
    }
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

Observe dois detalhes. O primeiro: o detalhe é buscado em `estados`, a lista completa, e não em `visibles`. Trata-se de uma decisão consciente, não de um descuido, e o exercício 3 convida a pensar sobre isso. O segundo: `alCerrar={() => alSeleccionar(null)}` é a única função nova criada aqui; «fechar» nada mais é do que não selecionar nada.

### 2.5 `key` para reiniciar o estado

#### 2.5.1 O estado vive em uma posição, não no componente

Resta a segunda falha da cena: o rascunho que se arrasta. Para entendê-la, é preciso saber **onde** o React guarda o estado de um componente. Ele não o guarda «dentro» da função nem dentro do JSX: associa-o à **posição** que o componente ocupa na árvore renderizada. Enquanto nessa posição continuar sendo renderizado o mesmo componente, o React preserva o estado dele; se for removido, ou se naquela posição for renderizado outro, o estado é descartado ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

Pense no editor de notas. Escolhe-se `pagos`: na posição do editor, renderiza-se um `EditorNota` com `nombre="pagos"`. Digita-se o texto. Escolhe-se `reportes`: **na mesma posição** é renderizado **o mesmo componente**, `EditorNota`, agora com `nombre="reportes"`. Para o React, nada indica que seja outro editor: mudou uma prop, assim como muda qualquer prop, e o estado `borrador` é preservado. A documentação utiliza um caso quase idêntico, um chat em que o texto digitado para uma pessoa continua lá ao selecionar outra, e diz com clareza: em muitas aplicações esse é o comportamento desejado, mas não em um chat, pois alguém poderia enviar para a pessoa errada uma mensagem já redigida ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). No `revisor`, é uma nota de `pagos` salva em `reportes`.

A terceira figura reproduz isso com um editor mínimo que guarda seu rascunho, renderizando-o duas vezes: sem `key` e com `key={nombre}`.

```tsx
// fig02_03.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// react-dom decide al cargarse qué eventos de teclado sabe escuchar, así que se
// importa después de que exista `window` (los import de arriba se cargan antes).
const { createRoot } = await import("react-dom/client");

function Editor({ nombre }: { readonly nombre: string }) {
  const [borrador, establecerBorrador] = useState("");

  return (
    <label>
      {`Nota sobre ${nombre}`}
      <textarea value={borrador} onChange={(evento) => establecerBorrador(evento.target.value)} />
    </label>
  );
}

function Detalle({ nombre, conKey }: { readonly nombre: string; readonly conKey: boolean }) {
  return conKey ? <Editor key={nombre} nombre={nombre} /> : <Editor nombre={nombre} />;
}

function escribir(area: HTMLTextAreaElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")?.set;
  asignar?.call(area, texto);
  area.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function probar(conKey: boolean): Promise<void> {
  console.log(conKey ? "con key={nombre}:" : "sin key:");
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  const leer = () =>
    `«${contenedor.querySelector("label")?.firstChild?.textContent}» → borrador «${contenedor.querySelector("textarea")?.value}»`;

  await act(async () => {
    raiz.render(<Detalle nombre="pagos" conKey={conKey} />);
  });
  await act(async () => {
    const area = contenedor.querySelector("textarea");
    if (area !== null) {
      escribir(area, "llamar al proveedor");
    }
  });
  console.log(`  escribes en pagos:    ${leer()}`);

  await act(async () => {
    raiz.render(<Detalle nombre="reportes" conKey={conKey} />);
  });
  console.log(`  eliges reportes:      ${leer()}`);

  await act(async () => {
    raiz.unmount();
  });
  contenedor.remove();
}

await probar(false);
await probar(true);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_03.tsx
$ node fig02_03.js
sin key:
  escribes en pagos:    «Nota sobre pagos» → borrador «llamar al proveedor»
  eliges reportes:      «Nota sobre reportes» → borrador «llamar al proveedor»
con key={nombre}:
  escribes en pagos:    «Nota sobre pagos» → borrador «llamar al proveedor»
  eliges reportes:      «Nota sobre reportes» → borrador «»
```

Sem `key`, o título do editor muda para «Nota sobre reportes», mas o rascunho continua dizendo «llamar al proveedor»: a prop mudou e o estado permaneceu. Com `key={nombre}`, o rascunho fica vazio. (Uma observação sobre a figura: ao contrário das figuras da lição 0, ela importa `react-dom/client` **depois** de criar `window`. O react-dom decide ao ser carregado quais eventos de teclado sabe escutar e, se for carregado antes da existência de uma janela, o evento de digitação provocado pela figura não chega ao React. Em um navegador real a janela sempre existe primeiro, portanto no `revisor` nada disso é necessário.)

#### 2.5.2 O que a `key` faz

Na lição 1 foi usada a `key` dentro de uma lista, para que o React reconhecesse cada linha entre uma renderização e outra. Trata-se da mesma ferramenta: **uma `key` diz ao React para usar a própria `key` como parte da posição**, em vez de considerar apenas a ordem dentro do elemento pai ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). E a documentação reforça: as `key` não servem apenas para listas. Com `key="pagos"` e depois `key="reportes"`, para o React tratam-se de **dois editores distintos**: ele desmonta o primeiro com todo o estado associado e monta um novo, que começa a partir de `useState(…)` como no primeiro dia. As `key` não precisam ser únicas na aplicação inteira; basta que diferenciem posições dentro do mesmo pai ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

A documentação dá a esse uso um nome preciso em «You Might Not Need an Effect»: **reiniciar todo o estado quando uma prop mudar**. O exemplo dela é um perfil que recebe `key={userId}` para que, ao trocar de usuário, o comentário pela metade e qualquer outro estado abaixo sejam reiniciados; e classifica como prática a ser evitada a alternativa de reiniciar o estado a partir de um Effect ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). Esse é o segundo critério do curso despontando antes da Lição 3: o que dá para resolver com estrutura não se resolve com um Effect.

No ponto de controle, a `key` fica em `DetalleSeleccion`, o quadro do serviço selecionado:

```tsx
// revisor/src/reporte/DetalleSeleccion.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { EditorNota } from "./EditorNota";
import type { Notas } from "./notas";

export function DetalleSeleccion({
  estado,
  notas,
  alGuardarNota,
  alCerrar,
}: {
  readonly estado: EstadoPublico;
  readonly notas: Notas;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
  readonly alCerrar: () => void;
}) {
  return (
    <aside className="detalle" aria-label={`Detalle de ${estado.nombre}`}>
      <h3>{estado.nombre}</h3>
      <p>
        {estado.tipo === "disponible"
          ? `Disponible: HTTP ${estado.codigoHttp} en ${estado.duracionMs} ms`
          : `En falla: ${estado.detalle}`}
      </p>
      <EditorNota
        key={estado.nombre}
        nombre={estado.nombre}
        notaGuardada={notas[estado.nombre] ?? ""}
        alGuardar={alGuardarNota}
      />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
```

`key={estado.nombre}` diz exatamente o que significa: um editor da nota de `pagos` e um editor da nota de `reportes` são, conceitualmente, dois editores distintos. O mesmo que a documentação diz a respeito do chat que ela dá como exemplo: uma conversa com uma pessoa é diferente de uma conversa com outra, de modo que faz sentido atribuir uma `key` conforme a pessoa com quem se fala ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). Um detalhe de acessibilidade: o quadro é um `<aside>` com `aria-label="Detalle de pagos"`, de modo que um leitor de tela o anuncia como conteúdo complementar nomeado, «Detalle de pagos». O `aria-label` não é enfeite: como o `<aside>` está dentro da `<section>` de `Tarjeta`, sem um nome ele perderia esse papel e viraria um contêiner genérico ([MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside)). E a descrição do estado usa o operador ternário sobre `estado.tipo`, que o TypeScript estreita (*narrowing*) em cada ramo: no primeiro sabe que existem `codigoHttp` e `duracionMs`; no segundo, `detalle`.

#### 2.5.3 O editor: estado local com um valor inicial

```tsx
// revisor/src/reporte/EditorNota.tsx
import { useState } from "react";

export function EditorNota({
  nombre,
  notaGuardada,
  alGuardar,
}: {
  readonly nombre: string;
  readonly notaGuardada: string;
  readonly alGuardar: (nombre: string, texto: string) => void;
}) {
  const [borrador, establecerBorrador] = useState(notaGuardada);

  return (
    <div className="editor-nota">
      <label>
        Nota sobre {nombre}
        <textarea
          rows={3}
          value={borrador}
          onChange={(evento) => establecerBorrador(evento.target.value)}
        />
      </label>
      <button type="button" onClick={() => alGuardar(nombre, borrador)}>
        Guardar nota
      </button>
    </div>
  );
}
```

`borrador` começa com `notaGuardada`, a nota que já existia ou `""`. Isso merece um esclarecimento, porque a documentação adverte contra algo parecido: copiar uma prop no estado. O exemplo dela é uma mensagem que faz `useState(messageColor)`: se o pai depois passar outra cor, o estado não toma conhecimento, porque **o estado só é inicializado na primeira renderização** ([React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)). A mesma página indica quando isso faz sentido: quando a intenção é **ignorar** as alterações posteriores da prop, sendo conveniente que o nome comece com `initial` ou `default` para deixar isso explícito.

Aqui é exatamente o que se busca. Enquanto a pessoa digita, o rascunho não deve mudar só porque um novo relatório chegou; ele só deve recomeçar quando o serviço mudar. E disso se encarrega a `key` de `DetalleSeleccion`: a cada troca de serviço, o editor é montado do zero e `useState(notaGuardada)` lê novamente a nota salva **daquele** serviço. Por isso, na medição com o Chrome, retornar a `pagos` exibe «llamar al proveedor», a nota salva, e não o rascunho deixado sem salvar. O par «valor inicial + `key`» é o padrão completo; remover qualquer um dos dois quebra o comportamento.

E se a intenção fosse **preservar** o rascunho não salvo de cada serviço, para recuperá-lo ao retornar? A documentação oferece três caminhos: renderizar todos os editores e ocultar os inativos, guardar os rascunhos em outro lugar ou elevar o estado ao elemento pai, que é apontada como a solução mais comum ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). No `revisor`, a elevação já existe para o que realmente importa: a nota salva vive no `Panel`. O rascunho não salvo é descartado de propósito.

### 2.6 O roteiro completo

Com o estado elevado e a `key` devidamente posicionada, resta a folha de estilos. Estas são as regras adicionadas ao final de `panel.css`, o único arquivo de estilos do curso, que se expande a cada lição:

```css
/* revisor/src/reporte/panel.css (fragmento: lo que se agrega al final) */
.seleccionar {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  font-weight: bold;
  padding: 0;
  text-decoration: underline;
}

.seleccionar[aria-pressed="true"] {
  text-decoration-thickness: 3px;
}

.detalle {
  background: #f6f8fa;
  border-radius: 0.5rem;
  margin: 1rem 0;
  padding: 0.5rem 1rem 1rem;
}

.editor-nota textarea {
  display: block;
  margin: 0.5rem 0;
  width: 100%;
}
```

`.seleccionar` remove do botão a aparência padrão de botão e o transforma em um nome em negrito, sublinhado para indicar que pode ser clicado; `font: inherit` faz com que utilize a mesma tipografia do restante da linha, já que os botões não a herdam por padrão. O restante do arquivo é o da lição 1. Os demais arquivos do ponto de controle —`main.tsx`, `useReporte.ts`, `cargar.ts`, o contrato, `Tarjeta`, `ResumenFallas`, a configuração e o servidor de prática— não mudam nesta lição; o `package.json` altera apenas a sua versão para `0.2.0`.

A verificação do ponto de controle é a de praxe, a partir de `~/curso-react/revisor/`:

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0

$ npm run build

> revisor@0.2.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 30 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-CGNql20r.css    0.68 kB │ gzip:  0.38 kB
dist/assets/index-FUlywxKd.js   224.30 kB │ gzip: 70.28 kB

✓ built in 347ms
```

O linter não emite avisos e o build termina com `index-FUlywxKd.js`, o mesmo nome obtido no macOS e no Linux. Como esse nome deriva do conteúdo, se o `revisor` estiver idêntico ao ponto de controle, o mesmo nome vai aparecer. Com `npm run servidor` em um terminal e `npm run dev` (ou `npm run preview`) em outro, abra a página e explore as telas. Isto foi o que o Chrome headless mediu sobre a versão construída, servida com `vite preview`, passo a passo, com `node medir.mjs recorrido`:

```text
1. al cargar
   resumen: 4 servicios revisados · 2 servicios con falla
   botones: catálogo aria-pressed=false, pagos aria-pressed=false, inventario aria-pressed=false, reportes aria-pressed=false
2. marcas «Solo fallas»
   filas: pagos: falla (HTTP 503) | reportes: falla (tiempo límite agotado)
   resumen: 4 servicios revisados · 2 servicios con falla
3. desmarcas y eliges pagos
   pagos aria-pressed: true
   detalle: Detalle de pagos — En falla: HTTP 503
4. escribes una nota y la guardas
   filas: catálogo: disponible (HTTP 200, 42 ms) | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
5. empiezas otra nota en pagos sin guardarla y eliges reportes
   detalle: Detalle de reportes · borrador: ""
6. regresas a pagos
   borrador: "llamar al proveedor"
7. cierras el detalle
   ¿hay detalle?: false · pagos aria-pressed: false
```

Cada linha encontra explicação na lição. O passo 1 mostra os botões com `aria-pressed="false"` (2.4.3). O 2, a lista filtrada com o resumo intacto (2.3.3). O 3, o botão selecionado em `true` e o detalhe buscado por nome (2.3.2). O 4, a nota copiada no estado e a marca «con nota» na linha (2.2). O 5, o rascunho não salvo que **não** é arrastado para `reportes` (2.5). O 6, a nota salva que reaparece ao voltar a `pagos`, lida pelo editor recém-montado (2.5.3). E o 7, «fechar» significando selecionar nada (2.4.4). Desligue tudo com Ctrl+C em cada terminal.

## O erro que vai aparecer

Esta lição traz dois erros barrados pelas ferramentas e um que ferramenta nenhuma detecta.

**A mutação da cena.** Em uma cópia do ponto de controle, altere `guardarNota` em `Panel.tsx` para que adicione a nota ao objeto já existente:

```tsx
// guardarNota mutando (fragmento; en una copia, nunca en el punto de control)
  function guardarNota(nombre: string, texto: string): void {
    notas[nombre] = texto;
    establecerNotas(notas);
  }
```

Duas defesas diferentes impedem isso, cada uma à sua maneira. Primeiro, o `tsc`:

```text
$ npx tsc -b
src/reporte/Panel.tsx(6,10): error TS6133: 'conNota' is declared but its value is never read.
src/reporte/Panel.tsx(23,5): error TS2542: Index signature in type 'Readonly<Record<string, string>>' only permits reading.
```

A segunda linha é a que importa: o tipo `Notas` é `Readonly`, de forma que o seu índice «permite apenas leitura». (A primeira linha é uma consequência: `conNota` deixou de ser usada.) E o ESLint, com a regra `immutability` do pacote do React:

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/Panel.tsx
   6:10  error  'conNota' is defined but never used  @typescript-eslint/no-unused-vars
  23:5   error  Error: This value cannot be modified

Modifying a value returned from 'useState()', which should not be modified directly. Use the setter function to update instead.

~/curso-react/revisor/src/reporte/Panel.tsx:23:5
  21 |
  22 |   function guardarNota(nombre: string, texto: string): void {
> 23 |     notas[nombre] = texto;
     |     ^^^^^ `notas` cannot be modified
  24 |     establecerNotas(notas);
  25 |   }
  26 |  react-hooks/immutability

✖ 2 problems (2 errors, 0 warnings)
```

«Modificar um valor retornado por `useState()`, que não deve ser modificado diretamente. Use a função atualizadora em vez disso.» A regra valida que não sejam mutadas propriedades, estado nem outros valores que o React trata como imutáveis; a documentação dela afirma que as props e o estado de um componente são fotografias imutáveis ([React, «immutability»](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability)). Repare que a regra barra a mutação mesmo que o tipo não seja `Readonly`: a figura 2 usa um `Record<string, string>` sem `Readonly`, e o `tsc` a compila sem reclamar, mas o linter a rejeita da mesma forma:

```text
$ npx eslint fig02_02.tsx

~/curso-react/figuras/fig02_02.tsx
  22:5  error  Error: This value cannot be modified

Modifying a value returned from 'useState()', which should not be modified directly. Use the setter function to update instead.

~/curso-react/figuras/fig02_02.tsx:22:5
  20 |
  21 |   function mutar(): void {
> 22 |     notas.pagos = "se reinició a las 9:40";
     |     ^^^^^ `notas` cannot be modified
  23 |     establecerNotas(notas);
  24 |   }
  25 |  react-hooks/immutability

✖ 1 problem (1 error, 0 warnings)
```

Por isso o `revisor` conta com as duas defesas: o tipo avisa no editor enquanto se digita, e o linter pega a mutação mesmo se alguém esquecer o `Readonly`. O ajuste correto é o da seção 2.2: `establecerNotas((actuales) => conNota(actuales, nombre, texto))`.

**Guardar o que dá para calcular e sincronizar com um Effect.** Em outra cópia, em vez de passar diretamente para o editor `notas[estado.nombre] ?? ""`, `DetalleSeleccion` guarda a nota em um estado próprio e a «mantém em dia» com um Effect:

```tsx
// DetalleSeleccion con estado redundante (fragmento; en una copia)
  const [notaGuardada, establecerNotaGuardada] = useState("");

  useEffect(() => {
    establecerNotaGuardada(notas[estado.nombre] ?? "");
  }, [notas, estado.nombre]);
```

`tsc -b` não acusa nada: os tipos estão corretos. O linter, sim:

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/DetalleSeleccion.tsx
  20:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/revisor/src/reporte/DetalleSeleccion.tsx:20:5
  18 |
  19 |   useEffect(() => {
> 20 |     establecerNotaGuardada(notas[estado.nombre] ?? "");
     |     ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  21 |   }, [notas, estado.nombre]);
  22 |
  23 |   return (  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)
```

É a regra `set-state-in-effect`, a mesma que a lição 0 mostrou em `useReporte`. Aqui ela surge pelo motivo explicado em 2.3.3: `notaGuardada` é uma cópia de algo que já está em `notas`, e o Effect existe apenas para manter a cópia em sincronia com o original. Isso custa uma renderização extra a cada mudança — primeiro com a cópia antiga, depois com a nova — e, pior ainda, provoca um erro visível. Ao mudar de serviço, `DetalleSeleccion` não é montado novamente: ele permanece na mesma posição e é o mesmo componente, de modo que nessa renderização o `notaGuardada` dele ainda contém o valor do serviço **anterior**. O editor, que por sua vez é montado do zero graças à própria `key`, começa com esse valor antigo e, como explicado em 2.5.3, passa a ignorar o que chega depois, quando o Effect corrige a cópia. Construída essa cópia e feita a medição com o Chrome headless (`node medir.mjs efecto`):

```text
a. guardas una nota en pagos, eliges catálogo y regresas: Detalle de pagos · borrador: ""
b. guardas una nota en catálogo y eliges pagos: Detalle de pagos · borrador: "revisar el disco"
   filas: catálogo: disponible (HTTP 200, 42 ms) · con nota | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
```

No passo a, `catálogo` não tinha nota, logo o editor de `pagos` começa vazio: a linha indica «con nota» e ninguém vê a nota. No passo b, `catálogo` tem uma nota, e o editor de `pagos` começa com **a nota de `catálogo`**: é a falha da cena, uma nota de um serviço a ponto de ser salva em outro, com uma causa diferente. A solução não é silenciar a regra, mas sim apagar o estado e o Effect: o que dá para calcular, calcula-se.

**O erro que ninguém vê: remover a `key`.** Em uma terceira cópia, apague a linha `key={estado.nombre}` de `DetalleSeleccion.tsx`:

```text
$ npx tsc -b; echo "tsc: $?"
tsc: 0
$ npx eslint . --max-warnings 0; echo "lint: $?"
lint: 0
```

Os dois em verde, e o painel apresenta a falha da cena: o rascunho é arrastado de um serviço para outro. Nenhuma regra tem como saber que, no projeto, um editor de `pagos` e um de `reportes` são coisas distintas; essa é uma decisão de semântica, não de sintaxe. Ela só é notada usando o painel, ou com um teste de componente que o utilize: a Lição 8 ensina a escrevê-los. É a mesma lição deixada pela limpeza ausente na lição 0: o linter e os tipos são duas defesas, não todas.

## O que se faz de errado

**Ler o estado logo após alterá-lo.** `establecerX(nuevo); console.log(x)` imprime o valor antigo, sempre. Se o novo for necessário no mesmo manipulador, guarde-o antes em uma constante.

**Passar o valor quando o seguinte depende do anterior.** `establecerN(n + 1)` funciona até o dia em que for chamado duas vezes no mesmo clique, ou a partir de uma função criada em uma renderização anterior. Se o valor novo for calculado a partir do antigo, passe uma função.

**Mutar e repassar o mesmo objeto.** O React compara com `Object.is`; um objeto retocado continua sendo o mesmo, e a tela não muda. Ou muda tarde, quando outra coisa provocar uma renderização, o que é pior porque parece funcionar.

**Copiar apenas o primeiro nível de um estado aninhado.** O espalhamento é superficial. Se o estado contiver objetos dentro de objetos, cada nível que mudar deve ser copiado; melhor ainda, achate a estrutura.

**Três sinalizadores onde cabe um `tipo`.** `cargando`, `listo` e `conError` como booleanos separados permitem combinações que não correspondem a nenhuma tela válida. Uma união discriminada impede até a escrita delas.

**Guardar o objeto escolhido.** É uma cópia de um elemento da lista que fica defasada no polling seguinte. Guarde o identificador e busque o objeto ao renderizar.

**Guardar o que dá para calcular e, pior ainda, sincronizar com um Effect.** Uma lista filtrada, um total ou um elemento selecionado não são estado. Calculá-los durante a renderização é mais simples, mais rápido e não perde a sincronia.

**Elevar o estado além da conta.** Subir o rascunho de uma caixa de texto até a raiz faz com que cada tecla renderize novamente a tela inteira. O estado deve subir até o ancestral comum de quem o utiliza, nem um nível a mais.

**Reiniciar o estado com um Effect quando uma prop mudar.** Um Effect que define o rascunho como `""` quando `nombre` muda renderiza primeiro com o rascunho antigo e depois com o vazio. Uma `key` faz isso em um único passo e explicita a intenção no código.

**Definir um componente dentro de outro.** Trata-se de um componente novo a cada renderização: o React vê outro elemento na mesma posição e descarta o estado dele sem aviso. É a regra da lição 1, e agora fica claro o que se perde ao violá-la.

## Exercícios

### Exercício 1 — Preveja o botão

Em uma cópia de `fig02_01.tsx`, troque as três chamadas de `ConValor` por estas:

```tsx
// ejercicio 1 (fragmento)
    establecerRevisiones(revisiones + 5);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones(revisiones + 1);
```

Troque também o título da chamada, para que a saída reflita a execução: `await hacerClic("ejercicio (+5, actualizadora, +1):", ConValor);`.

**Antes de executar**, anote no diário de bordo qual número o botão exibirá após o clique e o porquê, percorrendo a fila de atualizações linha por linha. Em seguida, compile e execute.

### Exercício 2 — Conte as notas sem criar estado novo

Adicione ao título do card, ou logo abaixo do resumo, um texto que diga «Notas guardadas: N» com o número de serviços que possuem nota. A condição: **não é permitido adicionar nenhum `useState`**. Antes de escrever código, responda: qual regra de formato proíbe um estado `cuantasNotas`, e do que seria preciso lembrar em `guardarNota` se ele existisse?

### Exercício 3 — O detalhamento e o filtro

Com o painel aberto, selecione `catálogo` e depois marque «Solo fallas». **Antes de fazer isso**, preveja: o detalhe de `catálogo` continua visível? Confira e explique o porquê, apontando a linha de `ContenidoReporte` responsável. Depois, altere o painel para que o detalhe desapareça quando o serviço selecionado ficar de fora do filtro, **sem adicionar estado e sem apagar `seleccionado`**. O que acontece com a seleção se a caixa for desmarcada?

### Exercício 4 — A `key` ausente, na prática

Em uma cópia do ponto de controle, remova `key={estado.nombre}` de `DetalleSeleccion.tsx`. Verifique se `npm run lint` e `npm run build` continuam em verde. Abra o painel, selecione `pagos`, digite um rascunho **sem salvar** e selecione `reportes`. Anote o que aparecer. Em seguida, salve uma nota em `pagos`, selecione `catálogo` e volte para `pagos`: o que o editor exibe e por quê? Restaure a `key` ao terminar.

## Soluções

### Solução 1

O botão mostra `1`. A fila de atualizações, em ordem:

| Na fila | Recebe | Resultado |
|---|---|---|
| «substituir por `revisiones + 5`», com `revisiones` em `0` | — | `5` |
| `(actual) => actual + 1` | `5` | `6` |
| «substituir por `revisiones + 1`», com `revisiones` em `0` | — | `1` |

A última chamada não depende da anterior: substitui o valor por `0 + 1`, porque a fotografia do manipulador continua dizendo `0`. A execução resultou nisto:

```text
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx ejercicio1.tsx
$ node ejercicio1.js
ejercicio (+5, actualizadora, +1):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 1
con la forma actualizadora (actual => actual + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 3
```

A segunda metade é a da figura, que não mudou. A documentação do React traz um exercício do mesmo tipo, com uma substituição após uma função atualizadora ([React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates)). A lição a guardar: misturar as duas formas sobre o mesmo estado em um mesmo manipulador é permitido pela sintaxe, mas quem for ler o código precisa montar essa tabela mentalmente. Ao perceber essa necessidade, adote uma única forma.

### Solução 2

O número é calculado durante a renderização, a partir de `notas`, em `Panel`:

```tsx
// Panel.tsx (fragmento de la solución)
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <p>Notas guardadas: {Object.keys(notas).length}</p>
```

Um estado `cuantasNotas` violaria a regra 3, o estado redundante: trata-se de informação calculável a partir de `notas`. Se ele existisse, `guardarNota` precisaria atualizar dois estados a cada operação, tendo ainda que decidir se soma um (nota nova), se mantém igual (nota reescrita) ou se subtrai um (nota apagada com texto vazio). Com o cálculo, `conNota` já resolve tudo isso e a contagem nunca erra. Repare também que não é preciso usar `&&`: aqui um `0` é exatamente o que se quer exibir.

### Solução 3

Sim: o detalhe de `catálogo` continua visível, embora a linha dele não apareça mais. Foi isso o que o Chrome headless mediu sobre o ponto de controle (`node medir.mjs filtro`):

```text
a. eliges catálogo: Detalle de catálogo
b. marcas «Solo fallas»: pagos: falla (HTTP 503) | reportes: falla (tiempo límite agotado) · Detalle de catálogo
c. desmarcas: Detalle de catálogo
```

A linha responsável em `ContenidoReporte` é esta:

```tsx
// ContenidoReporte.tsx (fragmento)
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

Ela busca em `estados`, a lista completa, e não em `visibles`. Para fazer o detalhe sumir com o filtro, basta buscar na lista filtrada:

```tsx
// ContenidoReporte.tsx (fragmento de la solución)
      const elegido = visibles.find((estado) => estado.nombre === seleccionado);
```

Ao desmarcar a caixa, o detalhe de `catálogo` **volta a aparecer**, pois `seleccionado` continuou valendo `"catálogo"` o tempo todo; apenas mudou o que é calculado a partir dele. É a vantagem de 2.3.2 sob outra forma: como o detalhe é calculado, não há necessidade de «limpar» nada. Qual das duas abordagens é melhor? Trata-se de uma decisão de produto, não do React: o ponto de controle preserva o detalhe visível porque a pessoa o escolheu de forma intencional, e ocultá-lo na filtragem poderia causar surpresa. O ponto indiscutível é que nenhuma das duas necessita de estado novo.

### Solução 4

Lint e build continuam em verde, como na seção «O erro que vai aparecer». Foi isto o que o Chrome headless mediu sobre essa cópia construída (`node medir.mjs sin-key`):

```text
a. escribes en pagos sin guardar y eliges reportes: Detalle de reportes · borrador: "borrador de pagos"
b. guardas una nota en pagos y eliges catálogo: Detalle de catálogo · borrador: "llamar al proveedor"
c. cierras el detalle y eliges reportes: Detalle de reportes · borrador: ""
```

No passo a, o título muda para «Detalle de reportes» e o quadro preserva o rascunho de `pagos`: é a figura 3 dentro do `revisor`. O passo b é mais sutil: com uma nota salva em `pagos`, ao passar para `catálogo` o editor **continua mostrando a nota de `pagos`**. `useState(notaGuardada)` só leu o valor inicial na primeira vez em que o editor foi montado; sem a `key`, o editor nunca é montado novamente enquanto houver um serviço selecionado, logo `notaGuardada` muda e o rascunho a ignora. É exatamente a advertência da documentação sobre copiar uma prop no estado (2.5.3). Com a `key`, cada serviço monta o próprio editor e o par «valor inicial + `key`» volta a funcionar. Já o passo c demonstra uma exceção: ao fechar o detalhe e selecionar outro serviço, o editor de fato é montado do zero, pois ao fechar ele desapareceu da árvore, e o rascunho surge vazio. Isso torna a falha intermitente, que é a pior categoria de erro.

## Como saber se deu certo

- [ ] `npm run lint` termina sem relatar nenhum problema e `npm run build` termina com `✓ built`, com um `index-….js` em `dist/assets/`.
- [ ] Com o servidor de prática e `npm run dev` em execução, a caixa «Solo fallas» deixa apenas `pagos` e `reportes`, e o resumo continua dizendo «4 servicios revisados · 2 servicios con falla».
- [ ] Ao escolher um serviço, o respectivo botão passa para `aria-pressed="true"` (dá para conferir nas ferramentas de desenvolvedor, na aba Elementos) e o detalhe correspondente surge; «Cerrar detalle» o remove e o botão volta a `false`.
- [ ] Uma nota salva marca a linha com «· con nota», e salvar o texto vazio remove a marcação.
- [ ] Um rascunho não salvo não se arrasta ao escolher outro serviço, e ao retornar surge a nota salva.
- [ ] É possível rodar as quatro figuras e explicar cada linha da saída sem consultar a lição.
- [ ] Em uma cópia, a mutação de `guardarNota` é rejeitada por `tsc` (TS2542) e `npm run lint` (`react-hooks/immutability`), sabendo-se explicar por que ambas as defesas são necessárias.
- [ ] Dá para apontar no `revisor` um exemplo de cada uma das cinco regras de formato (um exemplo pode servir para duas).
- [ ] Foi anotada no [diário de bordo](bitacora.md) a previsão do exercício 1 antes da execução, conferindo se o resultado bateu.

## Resumo

Responda sem consultar a lição:

1. Por que `revisiones` vale o mesmo antes e depois de chamar `establecerRevisiones` dentro de um clique? O que significa dizer que o estado é uma fotografia?
2. O que é agrupamento (*batching*) e o que ele tem a ver com a fila de atualizações?
3. O que muda ao passar para `establecer…` uma função em vez de um valor? Quando o curso utiliza cada uma das formas?
4. Por que mutar um objeto e repassá-lo não provoca uma nova renderização? O que o React compara e com qual função do JavaScript?
5. Quais são as cinco regras de formato do estado? Aponte um exemplo do `revisor` para cada uma.
6. Por que `seleccionado` guarda um nome e não um serviço? O que ficaria incorreto na tela se guardasse o serviço?
7. Como se decide em qual componente reside um pedaço de estado? Por que o rascunho não sobe para o `Panel`?
8. Onde o React guarda o estado de um componente? O que uma `key` faz a esse respeito e por que ferramenta nenhuma avisa caso ela falte?

## Para ler mais

- [React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot): o estado como fotografia, o exemplo do botão «+3» e por que o valor não muda dentro de uma renderização. Acessado em 21 de outubro de 2026.
- [React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates): o agrupamento, a fila de atualizações, a função atualizadora e como nomear o parâmetro dela. Acessado em 21 de outubro de 2026.
- [React, `useState`](https://react.dev/reference/react/useState): a função `set`, a comparação com `Object.is`, a chamada dupla em `StrictMode` e os problemas comuns («o console exibe o valor antigo», «a tela não muda»). Acessado em 21 de outubro de 2026.
- [React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state): tratar o estado como somente leitura, o espalhamento superficial, as razões da imutabilidade e o Immer. Acessado em 21 de outubro de 2026.
- [React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure): as cinco regras de formato, o `selectedId` em vez do objeto e o aviso sobre copiar props no estado. Acessado em 21 de outubro de 2026.
- [React, «Reacting to Input with State»](https://react.dev/learn/reacting-to-input-with-state): os estados «impossíveis» e um `status` em vez de múltiplos sinalizadores. Acessado em 21 de outubro de 2026.
- [React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components): elevar o estado, componentes controlados e não controlados, e a fonte única de verdade. Acessado em 21 de outubro de 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): o estado vinculado à posição na árvore, `key` fora de listas e o exemplo do chat. Acessado em 21 de outubro de 2026.
- [React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect): calcular durante a renderização, reiniciar todo o estado com uma `key` e guardar o identificador selecionado. Acessado em 21 de outubro de 2026.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input): campos controlados, `checked` com `onChange` e `evento.target.checked` nas caixas de seleção. Acessado em 21 de outubro de 2026.
- [React, «immutability»](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability): a regra do linter que impede a mutação de props e estado. Acessado em 21 de outubro de 2026.
- [MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is): o significado de «o mesmo valor» e por que dois objetos são o mesmo apenas se forem a mesma referência. Acessado em 21 de outubro de 2026.
- [MDN, «Spread syntax»](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax): o espalhamento em objetos literais, a cópia superficial e qual valor prevalece em caso de propriedade repetida. Acessado em 21 de outubro de 2026.
- [MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed): o estado de um botão de alternância e por que o texto dele não deve mudar. Acessado em 21 de outubro de 2026.
- [MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside): o papel de conteúdo complementar e por que, dentro de uma section, necessita de um nome. Acessado em 21 de outubro de 2026.
- [TypeScript, «Utility Types»](https://www.typescriptlang.org/docs/handbook/utility-types.html): `Readonly<Type>` e `Record<Keys, Type>`. Acessado em 21 de outubro de 2026.

### Termos desta lição

| Termo | Significado |
|---|---|
| estado | o que um componente lembra entre uma renderização e a seguinte; o React o guarda e o disponibiliza com `useState` |
| fotografia (*snapshot*) | o valor fixo do estado durante uma renderização; alterá-lo solicita uma nova renderização, não reescreve a variável |
| agrupamento (*batching*) | aguardar o término do manipulador para processar todas as atualizações de estado em uma única renderização |
| função atualizadora | a função passada para `establecer…` para calcular o novo valor a partir do último elemento na fila |
| mutar | alterar um objeto já existente em vez de criar um novo |
| espalhamento (`...`) | a sintaxe que copia as propriedades de um objeto para outro novo; copia apenas um nível |
| estado redundante | informação guardada no estado que poderia ser calculada a partir de outro estado ou das props |
| elevar o estado | mover um estado para o ancestral comum dos componentes que o utilizam e repassá-lo via props |
| componente controlado | aquele cujas informações cruciais chegam por props em vez de serem guardadas por ele mesmo |
| `key` (para reiniciar) | identificador usado pelo React como parte da posição; se mudar, desmonta o componente e monta um novo |

---

**A seguir:** [Lição 3 — Effects: sincronizar, não «quando carregar»](03-effects-sincronizar.md)
