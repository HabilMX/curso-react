# Lição 6 — Estado compartilhado: reducer e contexto

*Sexta-feira, 18h50. A versão da semana sai às 19h30. Pelo chat chegam duas mensagens quase juntas. A primeira é da operação: «Cliquei em "Volver a revisar" em pagos, voltei para a lista para ver se mudava e nunca soube se funcionou». A explicação já é conhecida: o aviso de erro ficava dentro da página do serviço e, ao sair da página, o aviso foi embora com ela. A segunda é da sala de plantão: «Na tela grande os milissegundos ficam amontoados, dá para ocultá-los?». Parece uma alteração de dez minutos. A gente abre `FilaEstado.tsx`, que é quem renderiza os milissegundos, e adiciona uma prop `mostrarDuracion`. Mas `FilaEstado` a recebe de `ListaEstados`, que a recebe de `ContenidoReporte`, que a recebe de `PaginaReporte`, que teria de recebê-la do layout pelo `Outlet`. Às 19h05 a alteração mexe em cinco arquivos, e três deles não fazem nada com esse dado: apenas o repassam para o seguinte. E ainda falta a caixa de seleção para alterá-lo. Esta lição resolve as duas mensagens com duas ferramentas do React e explica por que nenhuma das duas serve para tudo.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 6.1 e 6.2)

**O que se constrói:** a bandeja de avisos do `revisor`, que fica no layout e, por isso, sobrevive à mudança de página; o botão «Volver a revisar» deixa ali o resultado, tanto em caso de sucesso quanto de erro. E as preferências de tela, «Mostrar duración» e «Vista compacta», que são alteradas no cabeçalho e lidas por uma linha da lista cinco níveis abaixo, sem passar pelos componentes intermediários.

**O que se aprende:** `useReducer`: ações que descrevem o que aconteceu e um reducer puro testado sem o React; contexto apenas quando as props e `children` já não bastam; dois contextos, um para o estado e outro para o despacho; um hook que falha se faltar o provedor; **qual estado fica onde**: local, URL, servidor ou contexto.

**De onde a gente vem.** Da [Lição 5](05-rutas-url-como-estado.md). O `revisor` já conta com rotas: a lista em `/`, com os filtros no endereço (`?fallas=1&q=`); o detalhe em `/servicios/:nombre`; e uma página «não encontrada» para o restante. Um layout, `Disposicion`, envolve todas as páginas com o cabeçalho e a navegação, e guarda as notas, que chegam às páginas por `<Outlet context>` e pelo hook `useNotas()`. A partir dessa lição, a rota raiz tem também o próprio limite de erro, porque o React Router captura os erros das páginas antes que cheguem a `LimiteDeError`. Os dados continuam sendo buscados pelo TanStack Query, e «Volver a revisar» é uma mutação que invalida o relatório e o detalhe. O ponto de partida é o ponto de controle [`programas/05-rutas-url-como-estado/revisor/`](../programas/05-rutas-url-como-estado/revisor).

**O que esta lição não faz.** Não mexe no servidor de prática nem nas rotas: a API continua na versão C e o array de rotas é o mesmo da Lição 5. Não move as notas para um contexto: elas continuam no layout, e a seção 6.3 explica por que esse é o lugar delas. Não usa Redux nem nenhuma biblioteca de gerenciamento de estado: o curso não precisa disso, e a seção 6.3 discute quando faria sentido cogitar uma. Não memoiza os valores dos contextos com `useMemo` nem `useCallback`: aqui se mede quantas vezes cada componente é renderizado, e a medição não exige isso; medir com o Profiler é tema da [Lição 9](09-rendimiento-publicacion.md). Não salva as preferências no navegador: ao recarregar a página, elas voltam aos valores iniciais (o exercício 4 discute onde deveriam ficar se a ideia fosse preservá-las). E não monta uma suíte de testes: o reducer é testado aqui com uma figura que o executa sem o React; suítes com o Vitest são o tema da [Lição 8](08-pruebas-de-componentes.md).

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas do `package.json` desta lição; esta lição não adiciona nenhuma dependência. O ponto de controle foi instalado do zero com `npm ci`, e `npm run lint` e `npm run build` terminaram sem erros e geraram `dist/assets/index-BYYbMpFE.js`. O ponto de controle também foi instalado do zero com `npm ci` em um contêiner Linux (Debian 12, imagem oficial `node:24.22.0-bookworm`), e ali `npm run lint` e `npm run build` deram o mesmo nome de arquivo. Nada foi executado em um Linux Mint real, mas nada do que se mostra depende do sistema operacional. As capturas do navegador de 6.3.5 foram feitas com uma `PaginaServicio` que, se uma atualização falhava, escondia o detalhe e o editor da nota; a que aparece em 6.2.6 corrige isso e entrega o mesmo quando as requisições dão certo, que é tudo o que essas capturas registram. Se o `npm ci` imprimir no macOS um aviso de `install-scripts` sobre `fsevents@2.3.3`, trata-se de uma dependência opcional que só é instalada no macOS para monitorar arquivos: não é preciso aprová-la, e no Linux Mint ela nem vai aparecer. O que se vê «no navegador» foi medido com o Chrome em modo *headless* acessando o `vite preview`, controlado pelo protocolo de depuração para poder clicar e ler a página após cada clique: é um navegador de verdade, não uma simulação. Como na máquina das execuções havia outros processos ativos, o servidor de prática escutou na porta 3106 (`PUERTO=3106 npm run servidor`) e a prévia na 4106, com uma configuração temporária apontando o *proxy* para essa porta; na máquina local, use as portas de sempre, 3100 e 4173, e o resultado será o mesmo. Os horários do registro do servidor de prática estão em UTC. As figuras foram executadas com o próprio `package.json` em [`programas/06-reducer-contexto/`](../programas/06-reducer-contexto), ao lado de `revisor/`; a figura 1 é executada com `node` diretamente sobre o arquivo `.ts`, sem compilar, e as demais são compiladas com `tsc`, como nas lições anteriores. Os caminhos longos são exibidos a partir de `~/curso-react`. O servidor de prática (o mesmo arquivo desde a lição 4) responde `400` com `{"detalle":"nombre de servicio inválido"}` a um endereço com um `%` malformado, como `/api/servicios/%`, e à sua rota `/reintento`; antes respondia `500`. Isso foi medido com `curl` contra uma cópia, antes e depois, e o processo continuou vivo nos dois casos.

## Ao terminar, vai ser possível

- Escrever as ações de um reducer como uma união discriminada que descreve **o que aconteceu** (`agregado`, `descartado`), e fazer o TypeScript apontar o `switch` caso uma ação seja adicionada e seu tratamento seja esquecido.
- Testar um reducer sem o React, com `node` e uma lista de ações, comprovando que ele não modificou o estado recebido.
- Decidir, diante de um dado necessário para vários componentes, se basta repassar props, se convém reorganizar com `children`, ou se é necessário um contexto, justificando a decisão com o caso do `revisor`.
- Separar o estado e o despacho em dois contextos e medir, contando renderizações, quais componentes voltam a ser renderizados em cada caso.
- Escrever um hook de contexto que lance um erro claro quando faltar o provedor, mostrando o que acontece quando, em vez de lançar erro, o contexto adota um valor padrão.
- Classificar cada parte do estado do `revisor` em local, URL, servidor, layout ou contexto, com uma justificativa para cada uma.

## O porquê antes do como

As duas mensagens da cena parecem dois problemas distintos, mas na verdade são a mesma pergunta feita duas vezes: **quem guarda este dado e como ele chega a quem precisa dele?**

Comece pelo aviso perdido. Na Lição 5, o resultado de «Volver a revisar» era renderizado dentro de `PaginaServicio`, com um `<p role="alert">` exibido se a mutação falhasse. Isso funciona enquanto a pessoa permanecer nessa página. Mas a página é uma rota, e uma rota que deixa de ser exibida **é desmontada**: o estado dela, as mutações na tela e os avisos são destruídos. O aviso precisa ficar em um lugar que não seja desmontado na navegação, e esse lugar já existe: o layout, que envolve todas as páginas. O problema é a distância. Quem toma conhecimento do resultado é um hook, `useReintentar`, executado dentro de `PaginaServicio`, no interior do `Outlet`. Quem deve renderizá-lo está no topo, no layout. É necessário um caminho de baixo para cima.

E não se trata de um único aviso. Se o aviso vai viver mais do que a página, é preciso poder descartá-lo; se chegarem vários, é preciso impor um limite para que não cresçam indefinidamente; e cada um precisa de um identificador para que o React saiba qual remover. Com `useState`, isso representaria três funções (`agregar`, `descartar`, `descartarTodos`) manipulando o mesmo array, cada uma com a própria cópia das regras. A documentação do React descreve exatamente esse momento: quando um componente tem muitas atualizações de estado distribuídas por vários manipuladores de eventos, convém reunir toda essa lógica fora do componente, em uma única função ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). Essa função se chama **reducer**.

Agora, a segunda mensagem. `mostrarDuracion` não é um dado de uma página: ele é alterado por uma caixa de seleção no cabeçalho e lido por cada linha da lista. Entre a caixa de seleção e a linha há cinco componentes, e quatro deles não utilizam esse dado. Repassá-lo de mão em mão funciona, mas obriga a alterar a assinatura de componentes que não têm nada a ver com a preferência, e qualquer componente novo colocado no meio do caminho terá de se lembrar de repassá-lo. O React oferece uma ferramenta para que um dado «salte» os níveis intermediários: o **contexto**. E a documentação oficial, na mesma página em que o apresenta, adverte antes de usá-lo que é muito tentador usá-lo em excesso ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)). Por isso esta lição não começa pelo contexto, mas sim pelas duas alternativas que convém tentar antes.

A lição tem três partes. Em 6.1 constrói-se o reducer dos avisos e ele é testado sem o React. Em 6.2 ele é conectado com dois contextos, escreve-se o hook que se recusa a funcionar sem provedor e aplica-se o mesmo padrão às preferências. E em 6.3 faz-se o inventário completo: cada parte do estado do `revisor`, onde fica e por que fica ali. Ao terminar, isto é o que aparece na tela de detalhes de `pagos` após clicar em «Volver a revisar», e vai dar para saber de onde vem cada peça:

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div></section>
```

É a bandeja exatamente como o Chrome a entregou, e ela continua igual após voltar para a lista: o aviso já não depende da página que o originou.

## Os conceitos

### 6.1 `useReducer`: ações que descrevem o que aconteceu

#### 6.1.1 Um reducer é uma função já conhecida

O nome soa incomum, mas a ideia não é nova. Os arrays do JavaScript possuem um método, `reduce`, que percorre os elementos em ordem e vai repassando o resultado de cada etapa para a seguinte; a função fornecida a ele se chama, justamente, *reducer*, e o resultado final é um único valor ([MDN, `Array.prototype.reduce()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)). A documentação do React explica que os seus reducers levam esse nome pela mesma razão: o de um array recebe «o resultado acumulado até agora» e «o elemento atual», devolvendo o resultado seguinte; o do React recebe **o estado acumulado até agora** e **a ação**, devolvendo **o próximo estado** ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

Vale ter isso em mente, porque em 6.1.4 a gente vai usar literalmente o `reduce` de um array com o reducer dos avisos, e isso vai funcionar sem nenhuma alteração. Essa é a primeira grande vantagem de um reducer: **ele não sabe nada sobre o React**. Trata-se de uma função de dois argumentos que devolve um valor.

#### 6.1.2 As ações: o que aconteceu, não o que se deve fazer

Com `useState`, o componente diz ao React **o que fazer**: «defina este array». Com um reducer, o componente informa **o que aconteceu**: «um aviso foi adicionado», «a pessoa descartou o aviso 3». O acontecimento é descrito por um objeto chamado **ação**, e a regra para escrevê-lo corretamente, segundo a documentação do React, é que o tipo de uma ação descreva idealmente «o que a pessoa fez» e não «como se quer que o estado mude»; além disso, **cada ação deve descrever uma única interação**, mesmo que essa interação provoque várias mudanças nos dados ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

No `revisor`, as ações são três, e os seus nomes estão no particípio de propósito: `agregado`, `descartado`, `todos-descartados`. Eles se leem como um registro de fatos. Observe o que elas **não** são: não existe uma ação `recortar-a-cinco` nem uma `incrementar-id`. Quando um novo aviso chega, três coisas acontecem (ele é inserido no início, a lista é cortada em cinco itens e o contador de identificadores avança), mas a pessoa fez uma única ação: disparar um aviso. Essas três coisas são a *consequência*, e a consequência é da alçada do reducer.

No TypeScript, o conjunto de ações possíveis é uma **união discriminada**, assim como `EstadoPublico`, presente desde a Lição 0: cada membro tem um `tipo` distinto e os dados que esse tipo requer. `agregado` traz o nível e o texto; `descartado` traz o identificador; `todos-descartados` não precisa de mais nada.

#### 6.1.3 O reducer dos avisos

Este é o arquivo completo. Tudo o que é preciso saber sobre os avisos está aqui, e nenhuma linha importa nada do React:

```ts
// revisor/src/avisos/avisos.ts
export type NivelAviso = "exito" | "error";

export interface Aviso {
  readonly id: number;
  readonly nivel: NivelAviso;
  readonly texto: string;
}

export interface EstadoAvisos {
  readonly avisos: readonly Aviso[];
  readonly siguienteId: number;
}

export type AccionAvisos =
  | { readonly tipo: "agregado"; readonly nivel: NivelAviso; readonly texto: string }
  | { readonly tipo: "descartado"; readonly id: number }
  | { readonly tipo: "todos-descartados" };

export const estadoInicialAvisos: EstadoAvisos = { avisos: [], siguienteId: 1 };

export const MAXIMO_AVISOS = 5;

export function reducirAvisos(estado: EstadoAvisos, accion: AccionAvisos): EstadoAvisos {
  switch (accion.tipo) {
    case "agregado": {
      const nuevo: Aviso = { id: estado.siguienteId, nivel: accion.nivel, texto: accion.texto };
      return {
        avisos: [nuevo, ...estado.avisos].slice(0, MAXIMO_AVISOS),
        siguienteId: estado.siguienteId + 1,
      };
    }
    case "descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.id !== accion.id) };
    case "todos-descartados":
      return { ...estado, avisos: [] };
    default: {
      const sinAtender: never = accion;
      throw new Error(`acción sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

Leitura de cima para baixo:

- **Os tipos.** Um `Aviso` tem um `id`, um `nivel` (`exito` ou `error`) e um `texto`. O estado não é apenas a lista: `EstadoAvisos` armazena também `siguienteId`, o número que o próximo aviso vai receber. Poderia parecer que isso pode ser calculado («o maior identificador mais um»), mas não: se o aviso mais recente for descartado, o maior valor diminui, e o aviso seguinte repetiria um identificador que o React já usou como `key` para outro elemento. É um dado que não se deduz dos demais, portanto precisa ser guardado. Todos os campos são `readonly`, e a lista é `readonly Aviso[]`: o TypeScript não permite modificá-la, e na seção «O erro que vai aparecer» isso será comprovado.
- **`agregado`.** Monta o aviso novo com o `siguienteId`, insere-o **no início** de uma nova lista (`[nuevo, ...estado.avisos]`) e a corta com `slice(0, MAXIMO_AVISOS)`. Nem `[...]` nem `slice` modificam o array original: eles criam outro. O limite fica em uma constante nomeada, `MAXIMO_AVISOS = 5`, e não como um número mágico (`5`) no código, para que possa ser lido e testado com facilidade.
- **`descartado`.** `filter` devolve uma nova lista sem o aviso com aquele `id`. O restante do estado é copiado com `...estado`; `siguienteId` não muda, e por isso um identificador não é reutilizado enquanto a aplicação continuar carregada na aba (o estado vive em memória: ao recarregar, o contador volta a 1).
- **`todos-descartados`.** Uma lista vazia, com o contador intacto.
- **`default` com `never`.** Se o TypeScript chegou até aqui, já descartou os três tipos, e para `accion` não resta nenhum tipo possível: é `never`. Atribuí-la a uma variável `never` não custa nada enquanto isso for verdade. No dia em que alguém adicionar uma quarta ação à união e esquecer o respectivo `case`, essa atribuição deixará de compilar. É a mesma técnica que o manual do TypeScript chama de verificação exaustiva ([TypeScript, «Narrowing», *Exhaustiveness checking*](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)), e é a mesma que `ContenidoReporte` usava desde a Lição 0. O `throw` só seria executado se algo burlasse o sistema de tipos (por exemplo, uma ação montada manualmente com `as`); é a rede de segurança sob a rede de segurança.

Há uma condição que este arquivo cumpre e que não se nota à primeira vista: **o reducer é puro**. Ele recebe um estado e uma ação e devolve um estado; não faz requisições de rede, não agenda temporizadores, não escreve no console, não lê o relógio do sistema. A documentação do `useReducer` exige isso («deve ser pura») e explica como o React vigia essa pureza: em `StrictMode`, ele chama o reducer **duas vezes** para ajudar a encontrar impurezas acidentais ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Se o reducer provocasse um efeito colateral, como um `fetch`, essa chamada dupla o dispararia duas vezes em desenvolvimento, que é exatamente o que o `StrictMode` quer evidenciar. E há um detalhe neste reducer que é fácil quebrar sem querer: os identificadores. Se em vez de guardar `siguienteId` no estado fosse usado um contador fora da função (`let ultimo = 0` no topo do arquivo e `ultimo += 1` dentro da função), a chamada dupla do `StrictMode` pularia números, e dois reducers processando as mesmas ações produziriam resultados diferentes. Como o contador viaja no estado, a mesma ação aplicada ao mesmo estado produz sempre o mesmo resultado.

#### 6.1.4 Testá-lo sem o React

Como o reducer é uma função sem nenhuma dependência do React, ele é testado como qualquer função comum. Esta figura importa o arquivo **exatamente como está** e passa ações para ele. Ela é executada diretamente com `node`, sem compilar, porque o Node 24 executa arquivos `.ts` nativamente (como explicado em 0.2.2 na Lição 0); o `tsc` da primeira linha apenas verifica os tipos.

```ts
// fig06_01.ts
import {
  estadoInicialAvisos,
  reducirAvisos,
  type AccionAvisos,
  type EstadoAvisos,
} from "./avisos.ts";

function mostrar(titulo: string, estado: EstadoAvisos): void {
  const lista = estado.avisos.map((aviso) => `${aviso.id}:${aviso.texto}`).join(", ");
  console.log(`${titulo}: [${lista}] siguienteId=${estado.siguienteId}`);
}

const seis: AccionAvisos[] = ["a", "b", "c", "d", "e", "f"].map((letra) => ({
  tipo: "agregado",
  nivel: "exito",
  texto: letra,
}));

const conSeis = seis.reduce(reducirAvisos, estadoInicialAvisos);
mostrar("seis agregados", conSeis);

const sinElTres = reducirAvisos(conSeis, { tipo: "descartado", id: 3 });
mostrar("descartado el 3", sinElTres);

const sinNinguno = reducirAvisos(sinElTres, { tipo: "todos-descartados" });
mostrar("todos descartados", sinNinguno);

const otraVez = reducirAvisos(conSeis, { tipo: "descartado", id: 3 });
console.log(`la misma acción sobre el mismo estado da lo mismo: ${JSON.stringify(otraVez) === JSON.stringify(sinElTres)}`);
console.log(`el estado de antes sigue intacto: ${conSeis.avisos.length} avisos`);
console.log(`el estado inicial sigue vacío: ${estadoInicialAvisos.avisos.length} avisos`);
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --allowImportingTsExtensions --noEmit fig06_01.ts
$ node fig06_01.ts
seis agregados: [6:f, 5:e, 4:d, 3:c, 2:b] siguienteId=7
descartado el 3: [6:f, 5:e, 4:d, 2:b] siguienteId=7
todos descartados: [] siguienteId=7
la misma acción sobre el mismo estado da lo mismo: true
el estado de antes sigue intacto: 5 avisos
el estado inicial sigue vacío: 0 avisos
```

Cada linha da saída é uma afirmação que dá para conferir a olho nu:

- **`seis agregados`.** Seis ações, passadas com o `reduce` do array, o mesmo método de 6.1.1. Sobram cinco, a mais nova primeiro, e a letra `a` (identificador 1) saiu por ter ultrapassado o limite. `siguienteId` vale 7: foram distribuídos seis números.
- **`descartado el 3`.** A letra `c` é removida; os outros avisos preservam os seus identificadores.
- **`todos descartados`.** Lista vazia, e `siguienteId` continua em 7: o próximo aviso será o 7, e não o 1.
- **As três últimas linhas** são a pureza, medida na prática. A mesma ação sobre o mesmo estado gerou o mesmo resultado; o estado passado como entrada continua com os seus cinco avisos depois de o reducer «tê-lo descartado»; e o estado inicial, que serviu de ponto de partida para tudo, continua vazio. O reducer nunca tocou no que recebeu: sempre devolveu algo novo.

É isso o que a documentação do React aponta como vantagem do reducer quando o compara com o `useState`: como não depende do componente, ele pode ser exportado e testado isoladamente, e é possível adicionar a ele um `console.log` para enxergar cada alteração de estado e **por que** ela ocorreu, isto é, qual ação a provocou ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). A mesma página é transparente quanto ao custo: com um reducer, escreve-se mais código no início — a função e as ações. Para três ações com um teto e um contador, esse custo se paga com folga. Para uma caixa de seleção que apenas se marca e desmarca, não; por isso as preferências de 6.2.7 continuam com `useState`.

(A cópia de `avisos.ts` importada pela figura é idêntica à do ponto de controle: `cmp avisos.ts revisor/src/avisos/avisos.ts` não imprime nada. No computador local, copie o arquivo para a pasta de figuras.)

#### 6.1.5 `useReducer`: conectar o reducer com o React

O reducer decide; falta quem guarde o estado entre as renderizações e repasse as ações a ele. É isso o que faz o `useReducer`. A assinatura dele é `const [estado, despachar] = useReducer(reducer, valorInicial)`: ele devolve o estado atual e uma função, `despachar` (*dispatch*), que recebe uma ação ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Quando se chama `despachar({ tipo: "descartado", id: 3 })`, o React chama o reducer com o estado atual e essa ação, armazena o que o reducer devolver e agenda uma nova renderização. Se o retorno for **o mesmo objeto** (comparado via `Object.is`), o React pula a renderização do componente e de seus filhos; a documentação esclarece que às vezes o React ainda chama o componente mais uma vez antes de descartar o resultado, mas isso não altera o que se vê na tela.

No `revisor`, quem chama `useReducer` é um componente que não renderiza nada próprio, o **provedor** dos avisos:

```tsx
// revisor/src/avisos/ProveedorAvisos.tsx
import { useReducer, type ReactNode } from "react";
import { estadoInicialAvisos, reducirAvisos } from "./avisos";
import { ContextoAvisos, ContextoDespachoAvisos } from "./contextos";

export function ProveedorAvisos({ children }: { readonly children: ReactNode }) {
  const [estado, despachar] = useReducer(reducirAvisos, estadoInicialAvisos);

  return (
    <ContextoAvisos value={estado}>
      <ContextoDespachoAvisos value={despachar}>{children}</ContextoDespachoAvisos>
    </ContextoAvisos>
  );
}
```

Quatro linhas de lógica, e duas serão explicadas em 6.2. O que importa aqui é a garantia que o `useReducer` dá sobre `despachar`: a documentação afirma que essa função possui uma **identidade estável**, ou seja, é a mesma função em todas as renderizações ([React, `useReducer`](https://react.dev/reference/react/useReducer)). O estado muda a cada novo aviso recebido; `despachar`, nunca. Essa diferença é a base da decisão mais importante da seção seguinte.

### 6.2 Contexto: quando as props e `children` já não bastam

#### 6.2.1 Antes do contexto, duas perguntas

A documentação do React é direta: precisar repassar uma prop por vários níveis **não significa** que essa informação deva ser colocada em um contexto. Antes disso, ela propõe duas alternativas, nesta ordem ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)):

1. **Repassar props.** Pode parecer trabalhoso, mas deixa evidente qual componente consome qual dado, e quem mantiver o código no futuro vai agradecer.
2. **Extrair componentes e passar JSX como `children`.** Se um dado atravessa camadas que não o utilizam, muitas vezes é porque faltou extrair um componente: em vez de `<Disposicion avisos={avisos} />`, que força o layout a repassar os avisos para baixo, escreve-se `<Disposicion><Bandeja avisos={avisos} /></Disposicion>`, e o layout deixa de saber que existem avisos.

Apenas se nenhuma das duas servir, recorre-se ao contexto. Vale fazer o exercício com os dois casos do `revisor`.

**Os avisos.** Quem os renderiza, a bandeja, fica no layout. Quem os gera, `useReintentar`, fica em `PaginaServicio`, que é renderizada dentro do `<Outlet />`. Repassar props não funciona aqui por um motivo concreto: o layout **não instancia** `PaginaServicio`. Quem a instancia é o roteador, de acordo com a URL, no espaço do `Outlet`. Não há nenhum `<PaginaServicio despachar={…} />` escrito no código ao qual se possa adicionar uma prop. O único canal descendente oferecido pelo roteador é `<Outlet context>`, o mesmo utilizado para as notas. Seria possível colocar `despachar` nesse objeto, mas então apenas as páginas poderiam emitir avisos, e emitir avisos é uma necessidade da aplicação, não de uma rota: um componente que produz um aviso não deveria depender de estar ou não dentro do `Outlet`. E `children` também não resolve: não há nenhum componente intermediário para extrair, pois entre o layout e a página não há componentes da aplicação, há apenas o roteador.

**As preferências.** O caminho é diferente, mas o resultado é o mesmo. A caixa de seleção fica no cabeçalho do layout. A linha que renderiza os milissegundos é `Descripcion`, dentro de `FilaEstado`. Entre as duas estão: o `Outlet`, `PaginaReporte`, `ContenidoReporte`, `ListaEstados` e `FilaEstado`. Repassar a prop obrigaria a mudar a assinatura de quatro componentes que não a utilizam — exatamente a cena da abertura da lição. E `children`? Aqui vale a pena refletir, pois é a alternativa recomendada pela documentação antes do contexto. O problema é que as linhas não podem ser criadas a partir do topo: quem as cria é `ListaEstados` por meio de um `map` sobre os estados **já filtrados**, e o filtro depende da URL, que é lida por `PaginaReporte`. Para passar as linhas como `children`, seria necessário retirar o `map` de `ListaEstados` e elevá-lo até o layout, que então passaria a ter de conhecer filtros e consultas. Seria reorganizar metade da aplicação apenas para que um dado de apresentação chegasse ao seu destino. Quando a única forma de evitar o contexto é misturar responsabilidades, o contexto é a ferramenta correta.

Entre os usos que a documentação do React lista para o contexto estão, justamente, o **tema** da aplicação (como ela se parece) e **gerenciar estado** que muitos componentes distantes precisam alterar, «frequentemente usando um reducer junto com o contexto» ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)). As preferências se enquadram no primeiro caso; os avisos, no segundo.

#### 6.2.2 Criar, prover e ler um contexto

Um contexto tem três partes:

1. **É criado** com `createContext(valorPadrao)`. O argumento é o valor que quem ler o contexto receberá se **não houver nenhum provedor** acima dele na árvore; a documentação o chama de *fallback* de «último recurso», estático, que nunca muda ([React, `createContext`](https://react.dev/reference/react/createContext)).
2. **É provido** renderizando o contexto como um componente com uma prop `value`: `<ContextoAvisos value={estado}>…</ContextoAvisos>`. Tudo o que ficar dentro dele, em qualquer profundidade, pode ler esse valor. A partir do React 19, escreve-se assim, com o próprio contexto; antes se escrevia `<ContextoAvisos.Provider value={…}>`, uma sintaxe que a documentação já classifica como legada ([React, `createContext`](https://react.dev/reference/react/createContext)) e que a equipe do React anunciou que será descontinuada em versões futuras ([React, «React v19»](https://react.dev/blog/2024/12/05/react-19)). Ao ler códigos ou tutoriais mais antigos, vê-se `.Provider` por toda parte: o funcionamento é o mesmo.
3. **É lido** com `useContext(Contexto)`, que busca **o provedor mais próximo acima** do componente chamador, ignorando qualquer provedor que o próprio componente renderize ([React, `useContext`](https://react.dev/reference/react/useContext)).

Os contextos dos avisos ficam em um arquivo próprio, conforme recomenda a documentação quando vários arquivos precisam deles ([React, `createContext`](https://react.dev/reference/react/createContext)):

```ts
// revisor/src/avisos/contextos.ts
import { createContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";

export const ContextoAvisos = createContext<EstadoAvisos | null>(null);
export const ContextoDespachoAvisos = createContext<Dispatch<AccionAvisos> | null>(null);
```

Dois detalhes. O primeiro: o valor padrão é `null`, e o tipo explicita isso (`EstadoAvisos | null`). Trata-se de uma decisão deliberada, não de um descuido, e a seção 6.2.4 explica por que isso é melhor do que um valor «que funcione». O segundo: **são dois contextos**, não apenas um.

#### 6.2.3 Dois contextos: o estado e o despacho

Voltando a `ProveedorAvisos` de 6.1.5: o estado vai em `ContextoAvisos`; `despachar` vai em `ContextoDespachoAvisos`. Por que não usar um único contexto com um objeto `{ estado, despachar }`? O guia do React que combina reducer e contexto orienta justamente essa divisão: um contexto para a lista e outro para a função que despacha ações ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). Ele não justifica o porquê; a razão demonstrada nesta lição decorre de uma regra do `useContext`: o React volta a renderizar **todos os componentes que leem um contexto** sempre que o provedor recebe um `value` diferente, comparado com `Object.is`, e pular renderizações com `memo` não impede isso ([React, `useContext`](https://react.dev/reference/react/useContext)).

Com um único contexto, o `value` é um objeto novo a cada alteração de estado, de modo que qualquer componente que ler o contexto será renderizado novamente, **mesmo que só queira despachar ações**. No `revisor` há um componente assim: `useReintentar`, que produz avisos e nunca os lê; e qualquer formulário futuro que notifique sobre seu resultado seria outro. Com dois contextos, o de despacho armazena uma função estável e o seu `value` nunca muda. Isso não é apenas teoria; dá para medir na prática. Esta figura monta uma bandeja e um botão dentro de um provedor, clica no botão três vezes e conta quantas vezes cada um foi renderizado, primeiro com um contexto e depois com dois. Para fazer a contagem sem interferir na renderização, cada componente chama `useContarDibujos`, um hook com um Effect **sem** lista de dependências, executado após cada renderização confirmada:

```tsx
// fig06_03.tsx
import { JSDOM } from "jsdom";
import {
  act,
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ComponentType,
  type Dispatch,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Accion = { readonly tipo: "agregado" };
type Despachar = Dispatch<Accion>;

function contar(cuantos: number, accion: Accion): number {
  return accion.tipo === "agregado" ? cuantos + 1 : cuantos;
}

// Un Effect sin lista de dependencias corre después de cada dibujo confirmado:
// sirve para contar sin ensuciar el dibujo mismo.
const dibujos = { bandeja: 0, boton: 0 };

function useContarDibujos(quien: keyof typeof dibujos): void {
  useEffect(() => {
    dibujos[quien] += 1;
  });
}

// Uno: estado y despacho en el mismo valor.
const ContextoJunto = createContext<{ cuantos: number; despachar: Despachar } | null>(null);

function ProveedorJunto({ children }: { readonly children: ReactNode }) {
  const [cuantos, despachar] = useReducer(contar, 0);
  return <ContextoJunto value={{ cuantos, despachar }}>{children}</ContextoJunto>;
}

function BandejaJunta() {
  useContarDibujos("bandeja");
  return <p>{useContext(ContextoJunto)?.cuantos} avisos</p>;
}

function BotonJunto() {
  useContarDibujos("boton");
  const despachar = useContext(ContextoJunto)?.despachar;
  return (
    <button type="button" onClick={() => despachar?.({ tipo: "agregado" })}>
      Avisar
    </button>
  );
}

// Dos: un contexto para el estado y otro para el despacho.
const ContextoEstado = createContext<number | null>(null);
const ContextoDespacho = createContext<Despachar | null>(null);

function ProveedorSeparado({ children }: { readonly children: ReactNode }) {
  const [cuantos, despachar] = useReducer(contar, 0);
  return (
    <ContextoEstado value={cuantos}>
      <ContextoDespacho value={despachar}>{children}</ContextoDespacho>
    </ContextoEstado>
  );
}

function BandejaSeparada() {
  useContarDibujos("bandeja");
  return <p>{useContext(ContextoEstado)} avisos</p>;
}

function BotonSeparado() {
  useContarDibujos("boton");
  const despachar = useContext(ContextoDespacho);
  return (
    <button type="button" onClick={() => despachar?.({ tipo: "agregado" })}>
      Avisar
    </button>
  );
}

async function tresClics(
  titulo: string,
  Proveedor: ComponentType<{ children: ReactNode }>,
  Bandeja: ComponentType,
  Boton: ComponentType,
): Promise<void> {
  dibujos.bandeja = 0;
  dibujos.boton = 0;
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(
      <Proveedor>
        <Bandeja />
        <Boton />
      </Proveedor>,
    );
  });

  const boton = contenedor.querySelector("button");
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      boton?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }

  console.log(titulo);
  console.log(`  en pantalla: "${contenedor.querySelector("p")?.textContent}"`);
  console.log(`  dibujos de la bandeja: ${dibujos.bandeja}   dibujos del botón: ${dibujos.boton}`);
  await act(async () => {
    raiz.unmount();
  });
}

await tresClics("un contexto con { cuantos, despachar }:", ProveedorJunto, BandejaJunta, BotonJunto);
await tresClics("dos contextos, estado y despacho:", ProveedorSeparado, BandejaSeparada, BotonSeparado);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig06_03.tsx
$ node fig06_03.js
un contexto con { cuantos, despachar }:
  en pantalla: "3 avisos"
  dibujos de la bandeja: 4   dibujos del botón: 4
dos contextos, estado y despacho:
  en pantalla: "3 avisos"
  dibujos de la bandeja: 4   dibujos del botón: 1
```

A bandeja é renderizada quatro vezes nos dois casos: uma ao montar e uma para cada aviso. É o comportamento correto, pois ela exibe o número. A diferença está no botão. Com um único contexto, ele é renderizado quatro vezes, exatamente como a bandeja, sem nunca ter exibido nada novo; com dois contextos, apenas uma vez, ao montar. Em uma tela com um único botão isso passa despercebido. Em uma tela com cinquenta componentes que apenas despacham ações, seriam cinquenta renderizações a mais a cada aviso — todas desnecessárias.

Duas observações sobre a figura, pois elas explicam o código do `revisor`. A primeira: o botão e a bandeja **não** voltam a ser renderizados pelo simples fato de o provedor ter sido renderizado. O provedor recebe ambos como `children`, e `children` é um valor instanciado pelo chamador do provedor, uma única vez; quando o provedor altera o próprio estado e é renderizado novamente, `children` continua sendo a mesma referência e o React não tem motivos para renderizá-lo outra vez. A única coisa que obriga um filho a renderizar novamente é a leitura de um contexto cujo valor mudou. É a composição da Lição 1 trabalhando a favor da aplicação. A segunda observação: a figura monta os componentes sem o `StrictMode` para que as contagens sejam exatas (com ele, o ciclo adicional dos Effects ao montar somaria uma unidade a mais para cada componente, sem alterar a diferença observada). E uma terceira observação sobre o instrumento de medição: o contador é uma variável externa ao React, e o Effect incrementa um valor nela. Fazer isso no corpo do componente (`dibujos.boton += 1` durante a renderização) seria a impureza que a Lição 1 ensinou a caçar, e o linter a rejeita com `react-hooks/immutability`. Dentro de um Effect é permitido: o Effect existe para interagir com o que está fora do React. Ainda assim, trata-se de um instrumento de medição da figura, e não de código para o `revisor`; para medir renderizações em uma aplicação de verdade, a ferramenta apropriada é o Profiler das ferramentas de desenvolvimento. O comando `npx eslint` sobre as figuras desta lição não emite nenhum aviso.

E não seria mais simples envolver o objeto em um `useMemo`? A documentação do `useContext` sugere essa alternativa para casos em que o valor é um objeto contendo funções: trata-se de uma otimização de desempenho, e ela mesma ressalva que em aplicações pequenas isso não costuma ser um problema ([React, `useContext`](https://react.dev/reference/react/useContext)). Separar em dois contextos não é uma otimização acrescentada depois: é a estrutura natural dos dados, pois o estado e o despacho mudam em ritmos diferentes. E não exige memoizar nada. É a diferença entre estruturar corretamente desde o início e aplicar remendos com ferramentas que têm o próprio custo — o princípio fundamental deste curso.

#### 6.2.4 Um hook que se recusa a funcionar sem provedor

Nenhum arquivo no `revisor` chama `useContext` diretamente. Isso é feito por dois hooks, um para cada contexto:

```ts
// revisor/src/avisos/usarAvisos.ts
import { useContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";
import { ContextoAvisos, ContextoDespachoAvisos } from "./contextos";

export function useAvisos(): EstadoAvisos {
  const estado = useContext(ContextoAvisos);

  if (estado === null) {
    throw new Error("useAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }

  return estado;
}

export function useDespachoAvisos(): Dispatch<AccionAvisos> {
  const despachar = useContext(ContextoDespachoAvisos);

  if (despachar === null) {
    throw new Error("useDespachoAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }

  return despachar;
}
```

Os dois fazem a mesma coisa: leem o contexto e, se receberem `null`, **lançam um erro explicando o que falta e onde falta**. O valor `null` só pode ter uma origem: o valor padrão de `createContext`, que o React utiliza unicamente quando não encontra nenhum provedor acima na árvore. Se chegar `null`, significa que alguém renderizou um componente que utiliza avisos fora de `ProveedorAvisos`. Como o `if` descarta o `null`, o retorno do hook já possui o tipo exato, `EstadoAvisos` ou `Dispatch<AccionAvisos>`, e quem consome o hook não precisa fazer nenhuma checagem adicional.

O guia do React sugere exportar hooks como esses, explicando que eles não alteram o comportamento, mas permitem dividir os contextos no futuro ou «adicionar alguma lógica» a essas funções ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). A validação do provedor é exatamente essa lógica. Por que lançar um erro em vez de definir um valor padrão que «funcione», como uma lista vazia e uma função vazia? Porque esse valor padrão esconde o erro em vez de revelá-lo. Esta figura monta as duas abordagens **sem provedor**:

```tsx
// fig06_02.tsx
import { JSDOM } from "jsdom";
import { act, createContext, useContext, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

interface ValorAvisos {
  readonly avisos: readonly string[];
  readonly avisar: (texto: string) => void;
}

// A: un valor por omisión que "funciona" sin proveedor.
const ContextoConOmision = createContext<ValorAvisos>({ avisos: [], avisar: () => {} });

function BandejaA() {
  const { avisos, avisar } = useContext(ContextoConOmision);
  return (
    <button type="button" onClick={() => avisar("pagos se volvió a revisar")}>
      {avisos.length} avisos
    </button>
  );
}

// B: null por omisión y un hook que se niega a seguir sin proveedor.
const ContextoSinOmision = createContext<ValorAvisos | null>(null);

function useAvisos(): ValorAvisos {
  const valor = useContext(ContextoSinOmision);
  if (valor === null) {
    throw new Error("useAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }
  return valor;
}

function BandejaB() {
  const { avisos } = useAvisos();
  return <p>{avisos.length} avisos</p>;
}

async function montarSinProveedor(titulo: string, arbol: ReactNode): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  try {
    await act(async () => {
      raiz.render(arbol);
    });
  } catch (error: unknown) {
    console.log(`  error al dibujar: ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log(`  en pantalla: "${contenedor.textContent}"`);

  const boton = contenedor.querySelector("button");
  if (boton !== null) {
    await act(async () => {
      boton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    console.log(`  después del clic: "${contenedor.textContent}"`);
  }

  await act(async () => {
    raiz.unmount();
  });
}

await montarSinProveedor("A, con valor por omisión:", <BandejaA />);
await montarSinProveedor("B, con el hook que lanza:", <BandejaB />);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig06_02.tsx
$ node fig06_02.js
A, con valor por omisión:
  en pantalla: "0 avisos"
  después del clic: "0 avisos"
B, con el hook que lanza:
  error al dibujar: useAvisos necesita un <ProveedorAvisos> más arriba en el árbol
  en pantalla: ""
```

A versão A não falha. Ela exibe «0 avisos», e o clique no botão também não falha: ele chama a função vazia do valor padrão, que não faz nada, e a tela continua mostrando «0 avisos». É o pior cenário possível, pois tudo **parece** funcionar: a pessoa clica em «Volver a revisar» e nunca vê o aviso, e ninguém descobre o porquê, já que nenhum erro é registrado em lugar nenhum. A versão B é interrompida logo na primeira renderização com uma mensagem que identifica o componente que está faltando. Um erro que se manifesta logo na primeira execução do código, com a causa explicitada, vale muito mais do que uma tela que mente em silêncio.

Onde esse erro iria parar no `revisor`? Depende de onde estivesse o componente sem o provedor. Se fosse uma página, seria capturado pelo limite de erro da rota raiz adicionado na Lição 5, e a tela de erro, com a mensagem do hook, ocuparia o espaço de todo o layout; se estivesse fora do roteador, seria capturado por `LimiteDeError`. Em ambos os casos, a mensagem exibida seria a do hook. E no ponto de controle isso não tem como acontecer, porque os provedores envolvem a aplicação inteira (como se vê em 6.2.8). Onde isso poderia acontecer é em um teste que monte uma página isolada: se alguém esquecesse de incluir os provedores na montagem, o erro apontaria isso com todas as letras.

Mais um detalhe de `useContext` que convém conhecer: se o provedor existir mas a prop `value` for esquecida, o React não utiliza o valor padrão; o comportamento equivale a passar `value={undefined}` ([React, `useContext`](https://react.dev/reference/react/useContext)). O hook do `revisor` compara com `null` e deixaria passar esse `undefined`, mas o TypeScript impede isso antes: o contexto foi criado com o tipo `EstadoAvisos | null`, e um provedor sem `value` não compila.

#### 6.2.5 A bandeja, uma região ativa

Com os hooks preparados, o componente da bandeja é sucinto:

```tsx
// revisor/src/avisos/BandejaAvisos.tsx
import { useAvisos, useDespachoAvisos } from "./usarAvisos";

export function BandejaAvisos() {
  const { avisos } = useAvisos();
  const despachar = useDespachoAvisos();

  return (
    <section className="bandeja" aria-label="Avisos">
      <div role="status">
        {avisos.length > 0 && (
          <ul>
            {avisos.map((aviso) => (
              <li key={aviso.id} className={`aviso-${aviso.nivel}`}>
                {aviso.texto}{" "}
                <button
                  type="button"
                  aria-label={`Descartar: ${aviso.texto}`}
                  onClick={() => despachar({ tipo: "descartado", id: aviso.id })}
                >
                  Descartar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {avisos.length > 1 && (
        <button type="button" onClick={() => despachar({ tipo: "todos-descartados" })}>
          Descartar todos
        </button>
      )}
    </section>
  );
}
```

Ele lê os avisos com `useAvisos()` e obtém `despachar` com `useDespachoAvisos()`. Cada botão «Descartar» despacha a ação `descartado` com o identificador do respectivo aviso, e esse mesmo identificador serve de `key` para a linha, estável e única graças ao contador do reducer. O botão «Descartar todos» só aparece se houver mais de um aviso.

A parte projetada com atenção redobrada foi a acessibilidade. Um aviso surge na tela sem que a pessoa tenha solicitado nada naquele ponto específico: ela clicou em um botão em outra parte da página, ou navegou para outra rota. Quem enxerga a tela percebe a mudança; quem utiliza um leitor de tela, não — a menos que o aviso esteja inserido dentro de uma **região ativa** (*live region*). O papel `status` define uma região ativa com informações de aviso que não chegam a ter a gravidade de um alerta; ele traz implícitos os atributos `aria-live="polite"` e `aria-atomic="true"`, fazendo com que o leitor anuncie a novidade assim que a pessoa terminar a ação em curso, sem interrompê-la ([MDN, papel `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).

Observe **onde** fica o `role="status"`: em uma `div` que existe sempre, mesmo quando não há avisos. O que aparece e desaparece é a lista interna. Não se trata de capricho: o guia de regiões ativas da MDN explica que as tecnologias assistivas, em geral, só anunciam alterações **dinâmicas** dentro de uma região pré-existente, sendo recomendável definir a região vazia antes de preenchê-la, e que a abordagem mais confiável é mantê-la presente na marcação inicial ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Se a região fosse renderizada junto com o seu primeiro aviso, esse aviso poderia nunca ser anunciado. O botão «Descartar todos» fica **fora** da região pela mesma lógica invertida: surgir ou sumir não é uma novidade que precise ser narrada em voz alta. E o `aria-label` de cada botão «Descartar» informa qual aviso ele descarta, impedindo que um leitor de tela leia cinco botões com rótulos idênticos.

Duas consequências dessa região que vale a pena conhecer, pois têm implicações reais. A primeira decorre do `aria-atomic="true"` implícito: com ele, quando a região muda, o leitor de tela a anuncia **por completo**, mesmo que apenas uma parte tenha sido alterada ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Com cinco avisos na bandeja, a chegada do sexto pode fazer com que os cinco restantes sejam lidos novamente, junto aos nomes dos respectivos botões. Se isso se tornar incômodo durante testes com leitores de tela, adicionar `aria-atomic="false"` na `div` faz com que apenas o item novo seja anunciado; o ponto de controle desta lição preserva o comportamento padrão do papel. A segunda é uma decisão de design: os avisos de nível `error` também vão para essa região `polite`, que aguarda a conclusão da tarefa atual da pessoa, e não para um `role="alert"`, que interrompe o fluxo imediatamente. O resultado de uma nova tentativa de verificação não justifica uma interrupção; um erro que impeça a continuidade do trabalho, sim.

Uma limitação a mais, e esta não se resolve nesta lição. Quando alguém ativa «Descartar» com o teclado, o botão que tinha o foco desaparece junto com o seu aviso, e sem nenhum elemento focado o navegador deixa `document.activeElement` em `document.body` ([MDN, `Document.activeElement`](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement)): a pessoa que navega com Tab teria de recomeçar do início da página. Isso não foi medido em um navegador para esta lição; convém conferir: tabular até um «Descartar», ativá-lo com Enter e voltar a pressionar Tab. A [Lição 7](07-formularios-accesibilidad.md) mede o mesmo mecanismo com um botão que é desabilitado enquanto tem o foco (o foco cai no `body`), mas o ponto de controle desta lição e das seguintes não move o foco ao descartar um aviso. Se fosse necessário, o caminho seria dar à bandeja um contêiner com `tabindex="-1"` e chamar `.focus()` nele ou no aviso seguinte, que é a técnica que essa lição menciona para as mensagens de erro.

Com essa alteração, o `revisor` passa a ter dois elementos com `role="status"`: o da bandeja e o «Cargando…» das páginas. Vale ter isso em mente caso algum dia seja necessário buscar um elemento pelo papel ARIA: o `status` da página já não é único.

#### 6.2.6 Despachar a partir da mutação

O produtor de avisos é o hook `useReintentar`, que gerencia a mutação vista na Lição 4:

```ts
// revisor/src/detalle/useReintentar.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDespachoAvisos } from "../avisos/usarAvisos";
import { claves } from "../consultas/claves";
import { reintentarServicio } from "./reintentar";

export function useReintentar(nombre: string) {
  const clienteConsultas = useQueryClient();
  const despachar = useDespachoAvisos();

  return useMutation({
    mutationFn: () => reintentarServicio(nombre),
    onSuccess: async (estado) => {
      despachar({
        tipo: "agregado",
        nivel: estado.tipo === "disponible" ? "exito" : "error",
        texto:
          estado.tipo === "disponible"
            ? `${nombre} se volvió a revisar: disponible`
            : `${nombre} se volvió a revisar: sigue en falla`,
      });
      await Promise.all([
        clienteConsultas.invalidateQueries({ queryKey: claves.reporte }),
        clienteConsultas.invalidateQueries({ queryKey: claves.servicio(nombre) }),
      ]);
    },
    onError: (error) => {
      despachar({
        tipo: "agregado",
        nivel: "error",
        texto: `No se pudo volver a revisar ${nombre}: ${error.message}`,
      });
    },
  });
}
```

Ele obtém `despachar` por meio do hook e o utiliza nos dois desfechos possíveis da mutação. Em `onSuccess`, o servidor respondeu com o novo estado do serviço, e o aviso comunica o ocorrido: `disponible`, com nível `exito`, ou `sigue en falla`, com nível `error`. Em `onError`, a requisição falhou e o aviso traz a mensagem de erro. As invalidações da Lição 4 continuam ali, executadas após o aviso. O hook não lê nenhum aviso; apenas despacha. É o consumidor citado em 6.2.3: graças aos dois contextos separados, a chegada de novos avisos não o força a ser renderizado novamente.

Há uma característica importante desses callbacks que faz com que o aviso sobreviva à navegação entre páginas. O TanStack Query faz distinção entre os callbacks passados para `useMutation`, como feito aqui, e os passados para `mutate()`: estes últimos **não são executados** caso o componente seja desmontado antes do término da mutação ([TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)). Os callbacks de `useMutation` são os recomendados para efeitos colaterais como a invalidação de consultas, motivo pelo qual foram definidos ali desde a Lição 4. Para o aviso, o efeito é exatamente o exigido pelo cenário da lição: a pessoa clica em «Volver a revisar» e navega para a lista; a mutação é concluída; o aviso é despachado para uma bandeja localizada no layout, que jamais foi desmontada. São dois momentos possíveis, e os dois funcionam: se a pessoa sai **antes** de o servidor responder, o aviso chega quando a mutação termina, já com a lista à vista; se ela espera o aviso e **depois** sai, o aviso já estava na bandeja, e a única coisa que se corta é o recarregamento do detalhe que ninguém mais olha. O percurso de 6.3.5 é deste segundo tipo.

E como o resultado agora chega diretamente à bandeja, a página do serviço deixa de renderizar o seu próprio alerta:

```tsx
// revisor/src/detalle/PaginaServicio.tsx
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { useNotas } from "../app/contextoNotas";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { EditorNota } from "../reporte/EditorNota";
import { consultaDetalle } from "./consultas";
import { useReintentar } from "./useReintentar";

export function PaginaServicio() {
  const { nombre = "" } = useParams();
  const consulta = useQuery(consultaDetalle(nombre));
  const reintento = useReintentar(nombre);
  const { notas, guardarNota } = useNotas();
  useTituloDocumento(`${nombre} · Revisor`);

  return (
    <Tarjeta titulo={`Servicio ${nombre}`}>
      {consulta.isPending && <p role="status">Cargando detalle…</p>}
      {consulta.isError && consulta.data === undefined && (
        <p role="alert">No se pudo cargar el detalle: {consulta.error.message}</p>
      )}
      {consulta.isError && consulta.data !== undefined && (
        <p role="alert" className="viejo">
          Mostrando el último detalle que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      {consulta.data !== undefined && (
        <>
          <dl>
            <dt>Estado</dt>
            <dd>
              {consulta.data.estado.tipo === "disponible"
                ? `Disponible: HTTP ${consulta.data.estado.codigoHttp} en ${consulta.data.estado.duracionMs} ms`
                : `En falla: ${consulta.data.estado.detalle}`}
            </dd>
            <dt>Revisiones</dt>
            <dd>{consulta.data.revisiones}</dd>
            <dt>Última revisión</dt>
            <dd>{consulta.data.ultimaRevision}</dd>
          </dl>
          <button type="button" disabled={reintento.isPending} onClick={() => reintento.mutate()}>
            {reintento.isPending ? "Revisando…" : "Volver a revisar"}
          </button>
          <EditorNota
            key={nombre}
            nombre={nombre}
            notaGuardada={notas[nombre] ?? ""}
            alGuardar={guardarNota}
          />
        </>
      )}
      <p>
        <Link to="/">Volver al reporte</Link>
      </p>
    </Tarjeta>
  );
}
```

A única diferença em relação à Lição 5 é o que foi retirado (e o bloco de dados, que já renderiza o detalhe antigo se uma atualização falha, é o da Lição 4): o bloco `{reintento.isError && <p role="alert">…</p>}` que ficava logo abaixo do botão. Se ele tivesse sido mantido, um erro seria anunciado duas vezes — uma na página e outra na bandeja —, e a mensagem da página sumiria com a navegação. Um fato, um único lugar.

#### 6.2.7 As preferências: o mesmo padrão, sem reducer

As preferências seguem a mesma estrutura dos avisos (um contexto com `null` como padrão, um provedor e um hook que lança erro), com duas diferenças que são decisões de projeto e merecem ser compreendidas. O tipo e os valores iniciais:

```ts
// revisor/src/preferencias/preferencias.ts
export interface Preferencias {
  readonly mostrarDuracion: boolean;
  readonly compacto: boolean;
}

export const preferenciasIniciales: Preferencias = { mostrarDuracion: true, compacto: false };

export interface ValorPreferencias {
  readonly preferencias: Preferencias;
  readonly cambiarPreferencias: (cambio: Partial<Preferencias>) => void;
}
```

O contexto, no arquivo correspondente:

```ts
// revisor/src/preferencias/contexto.ts
import { createContext } from "react";
import type { ValorPreferencias } from "./preferencias";

export const ContextoPreferencias = createContext<ValorPreferencias | null>(null);
```

O provedor:

```tsx
// revisor/src/preferencias/ProveedorPreferencias.tsx
import { useState, type ReactNode } from "react";
import { ContextoPreferencias } from "./contexto";
import { preferenciasIniciales, type Preferencias } from "./preferencias";

export function ProveedorPreferencias({ children }: { readonly children: ReactNode }) {
  const [preferencias, establecerPreferencias] = useState<Preferencias>(preferenciasIniciales);

  function cambiarPreferencias(cambio: Partial<Preferencias>): void {
    establecerPreferencias((actuales) => ({ ...actuales, ...cambio }));
  }

  return (
    <ContextoPreferencias value={{ preferencias, cambiarPreferencias }}>
      {children}
    </ContextoPreferencias>
  );
}
```

**Primeira diferença: `useState` em vez de `useReducer`.** Existem apenas duas caixas de seleção, e a única operação é «atualizar estas preferências». Uma função `cambiarPreferencias` que recebe um `Partial<Preferencias>` e o mescla usando a forma atualizadora da Lição 2 resolve o problema em três linhas. Um reducer com uma ação `cambiado` seria o mesmo código com cerimônia desnecessária. A documentação sintetiza bem esse critério: `useState` é muito mais legível quando as atualizações são simples ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). O reducer conquistou o seu espaço nos avisos por causa do teto, do contador e das três formas distintas de alterar a lista — nada disso existe aqui.

**Segunda diferença: um único contexto, com um objeto.** O `value` é `{ preferencias, cambiarPreferencias }`, um objeto novo a cada renderização do provedor, e `cambiarPreferencias` também passa a ser uma função recriada a cada vez. Não seria esse o problema apontado em 6.2.3? Veja quem lê esse contexto: `PanelPreferencias`, que exibe as caixas de seleção e também as altera; `Descripcion`, que lê `mostrarDuracion`; e o layout, que lê `compacto`. **Todos eles leem as preferências.** Não há nenhum consumidor que apenas escreva dados, de modo que separar o despacho não economizaria renderização alguma: quando as preferências mudam, todos precisam ser renderizados novamente de qualquer maneira. E quanto ao novo objeto a cada renderização? `ProveedorPreferencias` só volta a ser renderizado quando o seu próprio estado muda, já que recebe o conteúdo como `children`; e quando o estado muda, o novo objeto representa exatamente a informação que se quer propagar. Não há nenhuma renderização a ser evitada via memoização.

Uma precisão para não ler demais o que vem a seguir: «não tocar nos componentes intermediários» é um ganho de **código**, não de renderizações. `Disposicion` também lê as preferências (para a classe `compacto`), então é renderizada de novo quando qualquer uma das duas caixas muda; e como a cada renderização ela monta um objeto `contexto` novo para o `<Outlet context>` (5.1.4), as páginas que o leem com `useNotas()` também são renderizadas de novo, e com elas o que depende delas. Isso é o que se deduz da regra do `useContext` de 6.2.3 e não foi medido com contadores; se um dia pesasse, a medição seria com o Profiler (Lição 9), e as saídas seriam separar `compacto` de `mostrarDuracion` ou memoizar o valor das notas.

O hook segue idêntico ao dos avisos:

```ts
// revisor/src/preferencias/usarPreferencias.ts
import { useContext } from "react";
import { ContextoPreferencias } from "./contexto";
import type { ValorPreferencias } from "./preferencias";

export function usePreferencias(): ValorPreferencias {
  const valor = useContext(ContextoPreferencias);

  if (valor === null) {
    throw new Error("usePreferencias necesita un <ProveedorPreferencias> más arriba en el árbol");
  }

  return valor;
}
```

O painel com as duas caixas de seleção, localizado no cabeçalho:

```tsx
// revisor/src/preferencias/PanelPreferencias.tsx
import { usePreferencias } from "./usarPreferencias";

export function PanelPreferencias() {
  const { preferencias, cambiarPreferencias } = usePreferencias();

  return (
    <fieldset className="preferencias">
      <legend>Preferencias</legend>
      <label>
        <input
          type="checkbox"
          checked={preferencias.mostrarDuracion}
          onChange={(evento) => cambiarPreferencias({ mostrarDuracion: evento.target.checked })}
        />{" "}
        Mostrar duración
      </label>
      <label>
        <input
          type="checkbox"
          checked={preferencias.compacto}
          onChange={(evento) => cambiarPreferencias({ compacto: evento.target.checked })}
        />{" "}
        Vista compacta
      </label>
    </fieldset>
  );
}
```

São caixas de seleção **controladas**: o que elas exibem decorre de `preferencias`, e cada alteração é processada por `cambiarPreferencias`. Elas ficam dentro de um `fieldset` com `legend`, a marcação semântica nativa do HTML para controles correlatos, fornecendo aos leitores de tela o nome do agrupamento, «Preferencias», antes de cada item. E cada `input` está contido dentro do respectivo `label`, fazendo com que o texto do rótulo funcione como seu nome acessível e que o clique no texto marque ou desmarque a caixa.

E o consumidor profundo, o motivo de tudo isso:

```tsx
// revisor/src/reporte/FilaEstado.tsx
import { Link } from "react-router";
import type { EstadoPublico } from "../compartido/contrato";
import { usePreferencias } from "../preferencias/usarPreferencias";

function Descripcion({ estado }: { readonly estado: EstadoPublico }) {
  const { preferencias } = usePreferencias();

  if (estado.tipo === "disponible") {
    return preferencias.mostrarDuracion ? (
      <>
        disponible (HTTP {estado.codigoHttp}, {estado.duracionMs} ms)
      </>
    ) : (
      <>disponible (HTTP {estado.codigoHttp})</>
    );
  }

  return <>falla ({estado.detalle})</>;
}

export function FilaEstado({
  estado,
  tieneNota,
}: {
  readonly estado: EstadoPublico;
  readonly tieneNota: boolean;
}) {
  return (
    <li className={estado.tipo}>
      <Link to={`/servicios/${encodeURIComponent(estado.nombre)}`}>{estado.nombre}</Link>
      : <Descripcion estado={estado} />
      {tieneNota && <span className="marca-nota"> · con nota</span>}
    </li>
  );
}
```

`usePreferencias()` é invocado em `Descripcion`, que é exatamente quem renderiza a duração, e em nenhum outro componente da lista. `ListaEstados`, `ContenidoReporte` e `PaginaReporte` não tiveram uma única linha alterada. Basta comparar com a cena da abertura: o mesmo resultado, sem encostar nos três arquivos intermediários. E `FilaEstado` manteve a assinatura intacta: continua recebendo `estado` e `tieneNota`, e nada além disso.

À folha de estilos são adicionadas, ao final, as regras da bandeja, do grupo de preferências e da visualização compacta:

```css
/* agregado al final de revisor/src/reporte/panel.css */
.preferencias {
  border: none;
  display: flex;
  gap: 1rem;
  padding: 0;
}

.bandeja ul {
  margin: 0.5rem 0;
}

.bandeja li.aviso-exito {
  border-color: #1a7f37;
}

.bandeja li.aviso-error {
  border-color: #cf222e;
}

main.compacto li {
  margin: 0.125rem 0;
  padding: 0.125rem 0.5rem;
}
```

#### 6.2.8 Onde ficam os provedores

Um provedor só atende ao que estiver **dentro** dele. A pergunta que se coloca, portanto, é em que nível da árvore posicioná-lo. O layout precisa das preferências (para aplicar a classe `compacto`) e renderiza a bandeja (que depende dos avisos). `PaginaServicio` precisa despachar ações. Ambos os componentes vivem dentro do roteador, o que significa que os provedores precisam ficar **acima** do `RouterProvider`. Eles são reunidos em um único componente:

```tsx
// revisor/src/app/Proveedores.tsx
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ProveedorAvisos } from "../avisos/ProveedorAvisos";
import { ProveedorPreferencias } from "../preferencias/ProveedorPreferencias";

export function Proveedores({
  clienteConsultas,
  children,
}: {
  readonly clienteConsultas: QueryClient;
  readonly children: ReactNode;
}) {
  return (
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorPreferencias>
        <ProveedorAvisos>{children}</ProveedorAvisos>
      </ProveedorPreferencias>
    </QueryClientProvider>
  );
}
```

A ordem dos provedores tem um motivo. `QueryClientProvider` fica do lado de fora, como na Lição 4. As preferências e os avisos são independentes entre si, de modo que a ordem relativa entre eles não faz diferença; o importante é que ambos fiquem dentro do cliente de consultas e fora do roteador. O cliente de consultas é recebido como prop, em vez de ser instanciado internamente, permitindo que quem montar a aplicação decida qual instância utilizar. Um teste automatizado, por exemplo, poderia exigir um `QueryClient` novo a cada caso de teste, sem tentativas automáticas de repetição, e com esse componente conseguiria reaproveitar exatamente os mesmos provedores da aplicação real. Se no futuro for adicionado um quarto provedor, ele será incluído aqui, e tudo o que consumir `Proveedores` passará a recebê-lo sem qualquer alteração.

O arquivo `main.tsx` passa a utilizar `Proveedores` no lugar do `QueryClientProvider` anterior:

```tsx
// revisor/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Proveedores } from "./app/Proveedores";
import { rutas } from "./app/rutas";
import { LimiteDeError } from "./compartido/LimiteDeError";
import { crearClienteConsultas } from "./consultas/cliente";

const raiz = document.getElementById("raiz");

if (raiz === null) {
  throw new Error("falta el elemento #raiz en la página");
}

const clienteConsultas = crearClienteConsultas();
const enrutador = createBrowserRouter(rutas);

createRoot(raiz).render(
  <StrictMode>
    <LimiteDeError>
      <Proveedores clienteConsultas={clienteConsultas}>
        <RouterProvider router={enrutador} />
      </Proveedores>
    </LimiteDeError>
  </StrictMode>,
);
```

E o layout renderiza o painel de preferências no cabeçalho, a bandeja entre o cabeçalho e o conteúdo, e aplica a classe `compacto`:

```tsx
// revisor/src/app/Disposicion.tsx
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { BandejaAvisos } from "../avisos/BandejaAvisos";
import { PanelPreferencias } from "../preferencias/PanelPreferencias";
import { usePreferencias } from "../preferencias/usarPreferencias";
import { conNota, type Notas } from "../reporte/notas";
import "../reporte/panel.css";
import type { ContextoNotas } from "./contextoNotas";

export function Disposicion() {
  const [notas, establecerNotas] = useState<Notas>({});
  const { preferencias } = usePreferencias();

  const contexto: ContextoNotas = {
    notas,
    guardarNota: (nombre, texto) => establecerNotas((actuales) => conNota(actuales, nombre, texto)),
  };

  return (
    <>
      <header>
        <h1>Revisor</h1>
        <nav aria-label="Principal">
          <NavLink to="/" end>
            Reporte
          </NavLink>
        </nav>
        <PanelPreferencias />
      </header>
      <BandejaAvisos />
      <main className={preferencias.compacto ? "compacto" : undefined}>
        <Outlet context={contexto} />
      </main>
    </>
  );
}
```

A bandeja fica **fora** de `<main>` e fora do `Outlet`: não pertence a nenhuma página em particular e, por essa razão, nenhuma página a leva consigo ao ser desmontada. As notas continuam exatamente onde a Lição 5 as deixou, no `useState` do layout, descendo via `<Outlet context>`. A seção seguinte esclarece por que elas devem permanecer ali.

### 6.3 Que estado fica onde

#### 6.3.1 O inventário

Com esta lição, o `revisor` passa a ter estado armazenado em cinco locais diferentes. Cada um tem a sua justificativa, e convém ser capaz de resumi-la em uma única frase:

| Estado | Onde fica | Por que fica ali |
|---|---|---|
| rascunho de uma nota | **local**: `useState` em `EditorNota` | só interessa a quem está escrevendo, e é reiniciado ao trocar de serviço via `key={nombre}` |
| «Solo fallas» e texto pesquisado | **URL**: `?fallas=1&q=` | descrevem a visualização; são compartilhados ao copiar o link e sobrevivem à recarga |
| serviço exibido na tela | **URL**: `/servicios/:nombre` | representa a própria página |
| lista de serviços e detalhe | **servidor**: TanStack Query, `["reporte"]` e `["servicio", nombre]` | pertencem ao servidor; a tela mantém uma cópia em cache atualizada automaticamente |
| notas salvas | **layout**: `useState` em `Disposicion`, descem por `<Outlet context>` | utilizadas por duas páginas (lista e detalhe), e por ninguém fora das páginas |
| avisos | **contexto**: `useReducer` em `ProveedorAvisos` | produzidos pelas páginas e exibidos pelo layout; precisam sobreviver à mudança de página |
| preferências | **contexto**: `useState` em `ProveedorPreferencias` | alteradas no cabeçalho e lidas por uma linha cinco níveis abaixo |

A regra que organiza a tabela é a mesma da Lição 2, agora com mais camadas. A documentação do React a chama de manter **uma única fonte da verdade**: para cada fatia de estado, escolhe-se o componente que é o seu «proprietário», o que não significa que todo o estado deva viver em um único lugar, mas sim que cada pedaço resida em um componente específico ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)). O que esta lição introduz são dois novos destinos para escolha — a URL e o servidor já estavam disponíveis — e um critério estruturado para decidir.

#### 6.3.2 As perguntas, em ordem

Diante de um novo dado, faça as seguintes perguntas nesta ordem e adote a primeira resposta afirmativa:

1. **Dá para calcular a partir de outro estado ou das props?** Então não é estado. Deve ser calculado durante a renderização. É a regra da Lição 2 («evite estado redundante», [React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)); a contagem de falhas do título e a lista filtrada do relatório são calculadas, não armazenadas.
2. **Pertence ao servidor?** Então deve viver no servidor, e a tela o solicita com o TanStack Query. Duplicá-lo em um `useState` gera duas fontes da verdade propensas a dessincronização.
3. **Descreve o que a pessoa está vendo, de forma que ela queira compartilhar o link ou recarregar a tela?** Então deve ir para a URL.
4. **É utilizado por um único componente?** Então é estado local.
5. **É compartilhado por vários componentes?** Eleve-o ao ancestral comum mais próximo e repasse-o por props. Se o ancestral comum for o layout e os consumidores forem páginas, o canal adequado é `<Outlet context>`.
6. **Repassar props obriga a atravessar componentes que não usam o dado, e reorganizar com `children` não resolve sem misturar responsabilidades?** Então, utilize contexto.

O contexto é a última pergunta da lista, não a primeira. Não por ser ruim, mas por ser o mecanismo que mais oculta dependências: um componente que consome um contexto depende de algo invisível em sua assinatura de props. A documentação do React defende o uso de props exatamente por essa razão: elas deixam explícito qual componente consome qual dado ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)).

#### 6.3.3 Por que as notas não passam para um contexto

Esta é a pergunta natural diante desta lição. As notas já sobem até o layout, já são compartilhadas por duas páginas e agora há contextos espalhados pela aplicação. Por que não criar um `ProveedorNotas` ao lado dos outros dois? Basta submeter as notas às seis perguntas para que a resposta apareça: elas param na quinta. Elas são usadas por vários componentes, sim, mas **todos são páginas**, e o ancestral comum das páginas é o layout. O canal para isso já existe e é exatamente o que o roteador oferece para essa finalidade: o React Router apresenta `<Outlet context>` como a solução integrada para casos em que uma rota pai gerencia estado compartilhado com rotas filhas, destacando que embora seja possível criar um contexto próprio, o caso de uso é tão comum que já vem nativo no `Outlet` ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)).

Há três razões concretas adicionais:

- **O escopo é o correto.** Com o `Outlet`, as notas só chegam às páginas. Um contexto colocado em `Proveedores` as tornaria visíveis para tudo: a bandeja, o painel de preferências, qualquer componente futuro. Ninguém fora das páginas precisa delas, e conceder a um dado mais visibilidade do que ele necessita é convite para acoplamentos indevidos.
- **Os consumidores não estão distantes.** `PaginaReporte` lê as notas e as repassa para `ListaEstados`, que as utiliza para calcular `tieneNota`. No meio do caminho há apenas um componente intermediário, `ContenidoReporte`, que as recebe e repassa sem utilizá-las. Um único nível intermediário não configura o cenário do início da lição, onde três componentes apenas transportavam dados sem utilidade: é o caso típico em que a documentação recomenda o uso de props normais, pois deixam evidente quem consome o quê.
- **A mudança, se um dia for necessária, envolverá um único arquivo.** As páginas não chamam `useOutletContext`: elas chamam `useNotas()`, o hook criado na Lição 5 seguindo as boas práticas do React Router. Se um componente que não é página (a bandeja, por exemplo) vier a precisar das notas, cria-se um contexto, e `useNotas()` passa a lê-lo, e nenhuma página precisará ser alterada. Esse é o sinal concreto que mudaria a decisão de projeto: **um consumidor localizado fora do `Outlet`**. Enquanto ele não existir, o contexto não resolve problema algum.

E um esclarecimento sincero: nem o `Outlet` nem o contexto resolvem o fato de as notas se perderem ao recarregar a página. Ambas as soluções armazenam dados na memória da aba. Se as notas tivessem de ser persistidas, o destino correto seria o servidor (a segunda pergunta), e a API de prática não disponibiliza uma rota para isso. Mover as notas para um contexto não as aproximaria dessa persistência; apenas trocaria o canal por onde elas passam.

#### 6.3.4 E o Redux, quando?

O README do curso esclarece que o Redux não é ensinado, e a tabela anterior explica por que ele não se faz necessário: o estado do servidor — que em muitas aplicações representava a maior parte do que se colocava em uma store global — já é gerenciado pelo TanStack Query; a URL preserva a visualização da tela; e o pouco que resta compartilhado são duas partes pequenas, com um reducer e um contexto cada. O guia do React conclui exatamente assim: uma aplicação pode perfeitamente conter múltiplos pares de contexto e reducer ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). Uma biblioteca de gerenciamento de estado global começa a fazer sentido quando há um volume muito expressivo de estado de cliente compartilhado, com alterações frequentes e muitos componentes leitores, cada um interessado em fatias restritas. Trata-se de um critério de arquitetura, não de uma imposição do React; e o `revisor` está muito longe desse patamar de complexidade.

#### 6.3.5 O percurso completo

Com tudo em seu devido lugar, o percurso prático utiliza dois terminais, como nas lições anteriores: `npm run servidor` em um e `npm run build` seguido de `npm run preview` no outro. A compilação é concluída assim:

```text
$ npm run build

> revisor@0.6.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 183 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-D-tTS2ut.css    1.11 kB │ gzip:   0.52 kB
dist/assets/index-BYYbMpFE.js   362.57 kB │ gzip: 112.99 kB

✓ built in 258ms
```

Abra `http://localhost:4173/`. O cabeçalho agora traz o grupo de preferências e, abaixo dele, a bandeja vazia. Isto foi o que o Chrome entregou para essas duas peças:

```text
<header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header>
<section class="bandeja" aria-label="Avisos"><div role="status"></div></section>
```

A região ativa existe mesmo estando vazia, atendendo ao que foi exigido em 6.2.5. Clique em `pagos`, aguarde os detalhes (o servidor de prática demora um segundo e meio de propósito) e clique em «Volver a revisar». A bandeja recebe o aviso visto no início da lição. Agora clique em «Volver al reporte»: a página do serviço é desmontada, a lista é montada e o aviso **continua lá**, com `pagos` já listado como disponível:

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200, 42 ms)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200, 95 ms)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

Desmarque «Mostrar duración». As linhas disponíveis perdem a informação de milissegundos, sem que nenhuma outra alteração ocorra:

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

E clicar em «Descartar» deixa a bandeja como no início: `<div role="status"></div>`, vazia, mas presente na árvore. O registro do servidor de prática anotou o percurso completo:

```text
08:37:54.148 GET /api/estados 200
08:37:57.289 GET /api/servicios/pagos 200
08:37:58.601 POST /api/servicios/pagos/reintento 200
08:37:59.809 GET /api/servicios/pagos cancelada por el cliente
08:38:00.110 GET /api/estados 200
```

Leitura de cima para baixo, pois ela conta uma história que comprova dois conceitos essenciais da lição. O `POST` é a mutação. O `GET` do detalhe logo em seguida é a invalidação de `["servicio", "pagos"]` executada por `useReintentar` no callback `onSuccess`, que acabou **cancelada**: o servidor leva um segundo e meio para responder ao detalhe de `pagos`, e antes desse tempo a pessoa já havia retornado para a lista; a página de detalhes foi desmontada e o TanStack Query cancelou a requisição que ninguém mais aguardava: quando uma consulta se torna inativa durante a busca, o seu `signal` dispara o cancelamento (*abort*) e, como `consultaDetalle` repassa esse `signal` para o `fetch`, a requisição é interrompida ([TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). O fato mais importante é o que não aconteceu: o aviso não esperou por essa requisição. Ele chegou à bandeja antes de a pessoa sair da página, porque `useReintentar` despacha a ação **primeiro** e aguarda as invalidações **depois**. Se a ordem fosse inversa, o aviso teria demorado o tempo da recarga mais lenta. O último `GET /api/estados` corresponde à lista, requisitada novamente ao montar porque a invalidação a havia marcado como desatualizada. E observa-se apenas um único `GET /api/estados` ao carregar a página: a versão compilada para produção não executa o ciclo extra do `StrictMode`.

## O erro que vai aparecer

A lição apresenta dois erros principais — a falta do provedor e o aviso do React quando o reducer modifica o estado — e dois erros auxiliares emitidos pelo compilador.

**O erro principal: um hook de contexto sem o respectivo provedor.** Isso já foi visto na figura 2, em um DOM de teste. Em uma aplicação real, esse erro é provocado ao mover um componente para fora de seu provedor ou ao montá-lo isoladamente em um teste. A mensagem é exatamente a que foi programada no hook:

```text
useAvisos necesita un <ProveedorAvisos> más arriba en el árbol
```

A leitura é direta: o componente que chamou `useAvisos` não possui nenhum `ProveedorAvisos` entre seus ancestrais. A correção jamais consiste em remover a validação ou em fornecer um valor padrão complacente ao contexto: a solução é posicionar o provedor no local devido, acima do componente. Se o erro surgir em um teste automatizado, monte o componente com `Proveedores`, que existe justamente para esse propósito. E caso ocorra um comportamento anômalo **sem** mensagem de erro — como uma tela estática exibindo «0 avisos» sem reagir aos cliques —, suspeite de um contexto configurado com um valor padrão enganoso (como na versão A da figura 2).

**Os dois erros de apoio: modificar o estado e esquecer uma ação.** Esta figura reproduz o reducer dos avisos com duas alterações propositais: inclui-se uma quarta ação na união, `fijado`, sem o correspondente `case`; e a ação `agregado` executa um `push` direto na lista recebida, em vez de gerar uma nova.

```ts
// fig06_04.ts
export type NivelAviso = "exito" | "error";

export interface Aviso {
  readonly id: number;
  readonly nivel: NivelAviso;
  readonly texto: string;
}

export interface EstadoAvisos {
  readonly avisos: readonly Aviso[];
  readonly siguienteId: number;
}

export type AccionAvisos =
  | { readonly tipo: "agregado"; readonly nivel: NivelAviso; readonly texto: string }
  | { readonly tipo: "descartado"; readonly id: number }
  | { readonly tipo: "todos-descartados" }
  | { readonly tipo: "fijado"; readonly id: number };

export const estadoInicialAvisos: EstadoAvisos = { avisos: [], siguienteId: 1 };

export const MAXIMO_AVISOS = 5;

export function reducirAvisos(estado: EstadoAvisos, accion: AccionAvisos): EstadoAvisos {
  switch (accion.tipo) {
    case "agregado": {
      const nuevo: Aviso = { id: estado.siguienteId, nivel: accion.nivel, texto: accion.texto };
      estado.avisos.push(nuevo);
      return { ...estado, siguienteId: estado.siguienteId + 1 };
    }
    case "descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.id !== accion.id) };
    case "todos-descartados":
      return { ...estado, avisos: [] };
    default: {
      const sinAtender: never = accion;
      throw new Error(`acción sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --noEmit fig06_04.ts
fig06_04.ts(29,21): error TS2339: Property 'push' does not exist on type 'readonly Aviso[]'.
fig06_04.ts(37,13): error TS2322: Type '{ readonly tipo: "fijado"; readonly id: number; }' is not assignable to type 'never'.
```

O primeiro erro, `TS2339`, indica que `push` não existe no tipo `readonly Aviso[]`. Trata-se do modificador `readonly` cumprindo seu papel: uma lista somente de leitura não dispõe de métodos mutadores como `push`, `splice` ou `sort`. Sem essa proteção do `readonly`, o código compilaria e o problema resultante seria muito mais grave, pois surgiria sem qualquer aviso prévio do compilador. O que acontece nessa situação é o erro seguinte.

**O erro do React: dois avisos com a mesma chave.** Para reproduzi-lo, é preciso contornar o `readonly` intencionalmente. Em uma cópia do ponto de controle, o `case "agregado"` de `avisos.ts` foi substituído por `(estado.avisos as Aviso[]).push(nuevo); return { ...estado, siguienteId: estado.siguienteId + 1 };`. O operador `as` força o TypeScript a confiar na instrução, permitindo a compilação. Com essa cópia rodando sob `npm run dev`, na página de `pagos`, um único clique em «Volver a revisar» gerou o seguinte HTML na bandeja:

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div><button type="button">Descartar todos</button></section>
```

E no console do navegador surgiu este erro emitido pelo React (a mensagem original traz um `%s` que o console substitui pelo valor `1`, enviado separadamente; exibe-se aqui a versão já substituída):

```text
Encountered two children with the same key, `1`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

Um clique, um aviso despachado e dois avisos idênticos na tela com a mesma chave. A causa é a invocação dupla descrita em 6.1.3. Sob `StrictMode`, o React invoca o reducer **duas vezes com o mesmo estado** e descarta um dos resultados ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Com um reducer estritamente puro, isso passa despercebido: as duas execuções devolvem objetos equivalentes e um é descartado. Com o método `push`, cada execução alterou **o mesmo array em memória** contido no estado, fazendo com que o aviso fosse inserido duas vezes, ambas com o mesmo `id`, já que as duas chamadas leram o mesmo valor de `siguienteId`. O React detectou a irregularidade ao encontrar dois nós filhos com a mesma `key`. Há ainda um dano invisível: o primeiro `push` incidiu sobre `estadoInicialAvisos`, o objeto de escopo de módulo que funciona como ponto de partida da aplicação, corrompendo-o para quaisquer usos posteriores. E na versão compilada para produção, sem `StrictMode`, essa duplicação não apareceria na tela: o defeito permaneceria latente, apenas privado do aviso que o denuncia. A documentação do `useReducer` é categórica: o estado é estritamente somente de leitura; nunca modifique objetos ou arrays do estado ([React, `useReducer`](https://react.dev/reference/react/useReducer)). A correção correta é a adotada no ponto de controle: criar uma nova lista com `[nuevo, ...estado.avisos]`. A lição é dupla: o `readonly` intercepta o erro antes da execução, e o `StrictMode` o desmascara em tempo de execução caso alguém tente burlar o sistema de tipos.

O segundo erro, `TS2322`, representa a verificação exaustiva de 6.1.3 cumprindo o prometido: o tipo `fijado` chegou ao bloco `default` e não pôde ser atribuído a `never`. A mensagem cita explicitamente a ação pendente e a linha do `switch`. A solução consiste em escrever o `case` correspondente. Observe que o erro não se manifesta onde a ação foi adicionada, mas sim onde **se esqueceu** de tratá-la: esse é o verdadeiro ganho.

## O que se costuma fazer de errado

**Colocar tudo em contexto «por garantia».** Cada contexto adicionado representa uma dependência oculta que não consta na assinatura do componente. Se um dado é compartilhado apenas entre dois componentes vizinhos, repasse-o por props. O contexto justifica a sua presença quando as props precisam atravessar componentes alheios ao dado e `children` não resolve a questão de forma limpa.

**Um único contexto com `{ estado, despachar }` quando há componentes que apenas despacham ações.** Cada atualização de estado força a renderização de todos os consumidores daquele contexto, inclusive daqueles que jamais leem o estado. A figura 3 mediu essa diferença: quatro renderizações versus apenas uma. Separe em dois contextos.

**Adotar um valor padrão complacente que «funcione».** Fornecer uma lista vazia e uma função vazia como fallback transforma o esquecimento de um provedor em uma tela inoperante que falha em silêncio. Use `null` e crie um hook que lance um erro explícito.

**Inserir efeitos colaterais dentro do reducer.** Chamadas `fetch`, temporizadores `setTimeout`, instruções `console.log` com lógica condicional ou variáveis de contagem fora da função. O reducer é chamado duas vezes sob `StrictMode` e precisa retornar sempre a mesma saída para uma dada entrada. Qualquer operação externa ao React deve ficar em manipuladores de eventos ou, quando se tratar de sincronização, em um Effect (como demonstrado no exercício 3).

**Ações que dão comandos imperativos.** Formatos como `{ tipo: "establecer-lista", avisos: [...] }` reduzem o reducer a um mero `useState` disfarçado, espalhando a lógica de negócios por quem despacha as ações. As ações devem relatar fatos acontecidos; as regras de transição pertencem exclusivamente ao reducer.

**Mutar o estado diretamente.** Ao executar `estado.avisos.push(nuevo)` e retornar a mesma referência de `estado`, o React realiza a checagem via `Object.is`, deduz que nada mudou e não agenda uma nova renderização. Se for retornado um novo objeto contendo a lista modificada internamente, a tela renderiza, mas a execução dupla do `StrictMode` duplicará o item com a mesma chave, como demonstrado na seção de erros. O uso de `readonly` nas tipagens impede que o TypeScript permita essa mutação.

**Renderizar o mesmo fato em dois locais simultâneos.** Se a falha de uma nova tentativa for exibida na página e também na bandeja, ela será anunciada duas vezes e a mensagem da página será perdida na navegação. Um fato deve ter um único local de exibição.

**Criar a região ativa dinamicamente junto com o seu conteúdo.** Condicionais como `{avisos.length > 0 && <div role="status">…</div>}` fazem com que a região seja inserida no DOM já com o primeiro aviso em seu interior, aumentando a chance de ele ser ignorado por tecnologias assistivas. A região deve permanecer presente continuamente no DOM; apenas o conteúdo interno deve variar.

**Memoizar o valor do contexto por reflexo automático.** Hooks como `useMemo` e `useCallback` acarretam um custo computacional próprio. Antes de adotá-los, meça: no `revisor`, a separação entre estado e despacho solucionou o problema estruturalmente, e o provedor de preferências não tem renderizações redundantes a economizar.

## Exercícios

### Exercício 1 — Prever o reducer

Sem executar o código, preveja o que será impresso na primeira linha da figura 1 caso sejam passadas sete letras (`"a"` a `"g"`) em vez de seis, e o que ocorre se logo em seguida for despachada a ação `{ tipo: "descartado", id: 1 }`. O valor de `siguienteId` é alterado? O reducer devolve o mesmo objeto recebido na entrada? Confira as previsões alterando a figura e executando o teste.

### Exercício 2 — Uma ação nova, guiada pelo compilador

Adicione aos avisos uma nova ação encarregada de descartar todos os avisos pertencentes a determinado nível: `{ tipo: "nivel-descartado", nivel: NivelAviso }`. Faça isso na cópia de `avisos.ts` da pasta de figuras. **Primeiro**, adicione apenas a nova variante à união de tipos e execute `tsc`: preveja qual linha o compilador apontará. Em seguida, implemente o `case` correspondente e comprove, por meio de uma variação da figura 1, que ao partir de três avisos de sucesso e dois de erro, descartar o nível `error` preserva exatamente três itens.

### Exercício 3 — Avisos que desaparecem sozinhos

Faça com que cada aviso de **sucesso** seja descartado automaticamente após cinco segundos; os de erro devem permanecer até que a pessoa os descarte manualmente. **Antes de escrever qualquer código**, decida onde o temporizador deve residir: no reducer, em `useReintentar` ou na bandeja? Anote no diário de bordo a justificativa da escolha. A implementação não deve silenciar regras do linter, e o temporizador precisa ser devidamente cancelado caso o aviso seja descartado antes do tempo limite.

### Exercício 4 — Mais uma coluna na tabela

Sem consultar a seção 6.3.1, determine onde seria alocado cada um dos seguintes dados novos, justificando cada caso: (a) a preferência de modo escuro da tela; (b) o foco de teclado atual dentro da lista de serviços; (c) o nome do usuário autenticado, consumido no cabeçalho e no formulário de cadastro; (d) as preferências de 6.2.7, caso devessem sobreviver ao recarregamento da página; (e) o número de avisos que continuam na bandeja, para exibição no título da aba do navegador.

## Soluções

### Solução 1

Ao processar sete letras, restam cinco avisos, do 7 ao 3: `[7:g, 6:f, 5:e, 4:d, 3:c] siguienteId=8`. Os dois itens mais antigos são descartados pelo teto. Se logo em seguida for descartado o identificador 1, o reducer não encontra nenhum item correspondente e a lista permanece inalterada, mantendo `siguienteId` em 8: a ação de descarte jamais altera o contador. O reducer devolve a mesma referência de objeto? **Não**: a instrução `{ ...estado, avisos: estado.avisos.filter(…) }` gera invariavelmente um novo objeto e um novo array, mesmo quando os conteúdos coincidem. Esse comportamento é correto (o reducer preservou a imutabilidade), mas implica que o React agendará uma nova renderização da bandeja ainda que nada visual tenha mudado, pois `Object.is` verifica identidades de referência e não igualdade estrutural. Se em algum momento medições reais indicarem que isso causa impacto perceptível, a correção seria retornar `estado` diretamente quando o `id` não for localizado. No momento, não há qualquer medição que justifique essa intervenção. Para comprovar, compare as referências com `===` na figura: `console.log(reducirAvisos(conSiete, { tipo: "descartado", id: 1 }) === conSiete)` imprime `false`.

### Solução 2

Ao inserir somente o novo membro na união de tipos, o comando `tsc` aponta a linha `const sinAtender: never = accion;` com o erro `TS2322` citando o novo tipo, exatamente como ilustrado na figura 4. O `case` faltante:

```ts
// avisos.ts con la acción nueva (fragmento)
    case "nivel-descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.nivel !== accion.nivel) };
```

No escopo desse `case`, o TypeScript já refinou a tipagem e sabe que `accion` é a variante contendo `nivel`, permitindo acessar `accion.nivel` sem a necessidade de asserções via `as`. A validação prática: ao iniciar com três ações `agregado` de nível `exito` e duas de nível `error`, o estado acumula cinco avisos; após processar `{ tipo: "nivel-descartado", nivel: "error" }`, restam os três avisos de sucesso, com seus identificadores originais preservados e `siguienteId` em 6. Observe o critério de nomenclatura: `nivel-descartado` descreve o que a pessoa fez, e não «filtrar a lista».

### Solução 3

O temporizador **não** deve ficar no reducer: a chamada a `setTimeout` é um efeito colateral, e o reducer precisa ser rigorosamente puro (6.1.3). Tampouco deve residir em `useReintentar`, pois o tempo de vida do temporizador deve coincidir com o do próprio aviso, e o aviso reside na bandeja, não na página que o gerou. Ele pertence à bandeja e configura um Effect legítimo, como os da Lição 3: **sincroniza** cada aviso visível com um temporizador, que é um sistema externo ao React. A estrutura mais elegante consiste em encapsular cada aviso em um componente dedicado, de forma que o Effect seja iniciado na montagem e limpo na desmontagem:

```tsx
// BandejaAvisos.tsx con descarte automático (fragmento)
function FilaAviso({ aviso }: { readonly aviso: Aviso }) {
  const despachar = useDespachoAvisos();

  useEffect(() => {
    if (aviso.nivel !== "exito") {
      return;
    }
    const temporizador = setTimeout(() => despachar({ tipo: "descartado", id: aviso.id }), 5_000);
    return () => clearTimeout(temporizador);
  }, [aviso.id, aviso.nivel, despachar]);

  return (
    <li className={`aviso-${aviso.nivel}`}>
      {aviso.texto}{" "}
      <button
        type="button"
        aria-label={`Descartar: ${aviso.texto}`}
        onClick={() => despachar({ tipo: "descartado", id: aviso.id })}
      >
        Descartar
      </button>
    </li>
  );
}
```

E em `BandejaAvisos`, o método `map` renderiza `<FilaAviso key={aviso.id} aviso={aviso} />`. Três aspectos relevantes merecem destaque. A lista de dependências declara tudo o que o Effect consome internamente, inclusive `despachar`; a documentação do `useReducer` esclarece que, por possuir identidade estável, incluir `despachar` nas dependências não provocará reexecuções indevidas do Effect ([React, `useReducer`](https://react.dev/reference/react/useReducer)), não havendo qualquer motivo para removê-lo ou silenciar o linter. Se a pessoa descartar o aviso antes dos cinco segundos, a linha é desmontada, a função de limpeza cancela o temporizador e nenhuma ação excedente é despachada (e mesmo que fosse, despachar `descartado` para um `id` inexistente não causa falha, como verificado na solução 1). Sob o `StrictMode`, o temporizador é instanciado, cancelado e recriado durante a montagem — a comprovação prática apresentada na Lição 0 de que o mecanismo de limpeza opera devidamente. Esse trecho foi auditado pelo linter do curso em uma cópia da bandeja e não gerou nenhum aviso.

Uma ressalva fundamental de acessibilidade: um aviso que desaparece automaticamente configura um limite de tempo sob as diretrizes WCAG, que definem como tal qualquer processo que ocorra automaticamente após um intervalo fixo, sem ação do usuário ([W3C, «Understanding SC 2.2.1: Timing Adjustable»](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)). No caso analisado, a abordagem é admissível porque o resultado da ação também é refletido na lista de serviços, razão pela qual apenas os avisos de sucesso contam com descarte automático. Se um aviso fosse o único meio de tomar conhecimento de um evento, cinco segundos não seriam suficientes para todos os usuários: evite esse padrão ou ofereça uma opção explícita para desativar o temporizador.

### Solução 4

(a) **Modo escuro**: contexto, da mesma forma que as preferências e pelo mesmo motivo: é controlado por uma configuração e lido por componentes distribuídos por toda a interface; é o primeiro exemplo citado pela documentação do React para o uso de contextos. (b) **Foco de teclado**: em nenhum estado gerenciado pelo React; o foco pertence nativamente ao navegador, e armazená-lo no React cria duas fontes da verdade concorrentes. Caso um componente precise alterar o foco, deve-se utilizar uma referência direta ao elemento (`ref`), não estado. (c) **Usuário autenticado**: contexto, correspondendo ao segundo exemplo clássico da documentação; contudo, a origem primária do dado é o servidor, tornando mais adequado tratá-lo via consulta no TanStack Query (acessível em qualquer componente por meio de `useQuery`), o que pode tornar desnecessário um contexto dedicado. (d) **Preferências que sobrevivem à recarga**: o contexto continua atuando como canal de distribuição, mas a persistência deve residir fora da memória da aba: no armazenamento local do navegador (`localStorage`), caso fiquem restritas à máquina local, ou no servidor, caso devam acompanhar o usuário em outros dispositivos. Ler e gravar nesse meio externo configura sincronização, cabendo ao provedor orquestrar esse processo. (e) **Avisos na bandeja, no título da aba**: **não é estado**. Esse valor é calculado a partir de `avisos.length`, que já está no contexto (primeira pergunta de 6.3.2), e a atualização de `document.title` compete a `useTituloDocumento`, o Effect introduzido na Lição 3. Se, em vez disso, fosse preciso distinguir os avisos «não lidos» dos «já vistos», o modelo de dados ainda não permite: `Aviso` não tem um campo para isso, e seria preciso acrescentar um (com sua ação no reducer), ou seja, estado novo.

## Como saber se deu certo

- [ ] Os comandos `npm ci`, `npm run lint` e `npm run build` são concluídos com sucesso em `~/curso-react/revisor/`, e `npm run build` gera o arquivo `dist/assets/index-BYYbMpFE.js` caso o código esteja idêntico ao do ponto de controle.
- [ ] O comando `grep -rn "eslint-disable" src/` não retorna nenhuma ocorrência.
- [ ] A figura 1 imprime `seis agregados: [6:f, 5:e, 4:d, 3:c, 2:b] siguienteId=7` e termina com as três linhas que comprovam que o reducer não modificou os dados recebidos.
- [ ] Em uma cópia com a instrução `push` rodando sob `npm run dev`, um clique em «Volver a revisar» gera dois avisos idênticos e o erro `Encountered two children with the same key` no console, sendo possível explicar por que esse comportamento é disparado pelo `StrictMode`.
- [ ] É possível reproduzir os dois erros da figura 4 em uma cópia do reducer e explicar cada um deles: `TS2339` pela mutação de uma lista `readonly` e `TS2322` pelo encaminhamento de uma ação não tratada ao bloco `default`.
- [ ] A figura 3 evidencia o botão sendo renderizado 4 vezes com um único contexto e apenas 1 vez com dois contextos, sendo possível justificar por que a bandeja é renderizada 4 vezes em ambos os cenários.
- [ ] A figura 2 exibe «0 avisos» sem nenhum erro na versão A e a mensagem de erro do hook na versão B, sabendo explicar por que a abordagem B é preferível.
- [ ] Com o servidor de prática e `npm run preview` ativos, a página `/` exibe no cabeçalho as caixas de seleção «Mostrar duración» (marcada) e «Vista compacta», acompanhadas abaixo de uma bandeja vazia com `role="status"`.
- [ ] Em `/servicios/pagos`, o clique em «Volver a revisar» insere na bandeja a mensagem `pagos se volvió a revisar: disponible`, e o aviso permanece visível após o retorno à lista por meio de «Volver al reporte».
- [ ] Ao desmarcar «Mostrar duración», as linhas disponíveis deixam de exibir os milissegundos sem que `ListaEstados`, `ContenidoReporte` ou `PaginaReporte` tenham sofrido qualquer alteração.
- [ ] É possível recitar a tabela da seção 6.3.1 de memória, com a respectiva justificativa para cada linha, e explicar o que precisaria ocorrer para que as notas fossem migradas para um contexto.
- [ ] Foram anotados no [diário de bordo](bitacora.md) onde fica cada estado do `revisor` e a justificativa para a escolha do local do temporizador no exercício 3.

## Resumo

Responda sem consultar a lição:

1. Por que um reducer tem esse nome e qual é a sua relação com `Array.prototype.reduce`?
2. O que uma ação deve descrever? Por que nomear como `agregado` em vez de `recortar-a-cinco`?
3. Para que serve o bloco `default` com `never` no reducer e em que momento ele oferece auxílio?
4. Por que o reducer mantém `siguienteId` dentro do estado em vez de utilizar uma variável de contagem fora da função?
5. Quais são as duas abordagens recomendadas antes de recorrer a um contexto? Por que nenhuma delas resolve as preferências do `revisor`?
6. Por que os avisos utilizam dois contextos enquanto as preferências utilizam apenas um?
7. O que acontece quando um componente consome um contexto sem provedor, comparando o caso com fallback `null` e sem ele? Por que o hook lança um erro?
8. Por que o elemento com `role="status"` da bandeja existe continuamente, mesmo quando não há avisos a exibir?
9. Por que as notas continuam no layout em vez de migrarem para um contexto? O que precisaria mudar para justificar essa migração?

## Leituras complementares

- [React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer): ações que descrevem o que a pessoa fez, reducers puros, a origem do nome e a comparação com `useState`. Consultado em 21 de outubro de 2026.
- [React, `useReducer`](https://react.dev/reference/react/useReducer): assinatura do hook, a chamada dupla do reducer sob `StrictMode`, estado somente de leitura, comparação com `Object.is` e a estabilidade de identidade do `dispatch`. Consultado em 21 de outubro de 2026.
- [React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context): as duas alternativas prévias ao contexto, o aviso contra o uso excessivo e casos de uso típicos (tema, conta, roteamento, estado). Consultado em 21 de outubro de 2026.
- [React, `createContext`](https://react.dev/reference/react/createContext): valor padrão como último recurso, `<Contexto>` como provedor a partir do React 19 e contextos em arquivos dedicados. Consultado em 21 de outubro de 2026.
- [React, `useContext`](https://react.dev/reference/react/useContext): busca pelo provedor ancestral mais próximo, nova renderização de consumidores via `Object.is`, otimização com `useMemo` e o caso de omissão da prop `value`. Consultado em 21 de outubro de 2026.
- [React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context): dois contextos distintos (estado e despacho), hooks personalizados e o provedor integrador. Consultado em 21 de outubro de 2026.
- [React, «React v19»](https://react.dev/blog/2024/12/05/react-19): `<Context>` como provedor e o plano de descontinuação de `<Context.Provider>`. Consultado em 21 de outubro de 2026.
- [React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components): elevação de estado ao ancestral comum e fonte única da verdade. Consultado em 21 de outubro de 2026.
- [React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure): princípios de modelagem de estado, incluindo não armazenar dados calculáveis. Consultado em 21 de outubro de 2026.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext): compartilhamento de estado da rota pai com as rotas filhas e o hook customizado recomendado com TypeScript. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations): `onSuccess`, `onError` e a distinção entre callbacks de `useMutation` e de `mutate` durante a desmontagem de componentes. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): cancelamento (*abort*) do `signal` quando uma consulta se torna inativa durante a requisição. Consultado em 21 de outubro de 2026.
- [TypeScript, «Narrowing»](https://www.typescriptlang.org/docs/handbook/2/narrowing.html): o tipo `never` e a verificação exaustiva em estruturas `switch`. Consultado em 21 de outubro de 2026.
- [MDN, papel `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) e [«ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions): a região ativa de aviso com `aria-live="polite"` e `aria-atomic="true"` implícitos; o comportamento de `aria-atomic` e a necessidade de a região existir antes de receber conteúdo. Consultado em 21 de outubro de 2026.
- [W3C, «Understanding SC 2.2.1: Timing Adjustable»](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html): definição de limites de tempo e critérios para ajustes necessários. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| reducer | função pura que recebe o estado atual e uma ação e devolve o próximo estado |
| ação | objeto que descreve o que aconteceu (`{ tipo: "descartado", id: 3 }`); o reducer determina a consequência correspondente |
| despachar (*dispatch*) | a função retornada por `useReducer` para enviar uma ação ao reducer; mantém identidade estável entre renderizações |
| verificação exaustiva | o bloco `default` que atribui a ação ao tipo `never`, fazendo o TypeScript avisar se alguma ação for deixada sem tratamento |
| contexto | canal do React que permite que um valor chegue a qualquer componente descendente sem passar por props |
| provedor | o componente que injeta um valor em um contexto para toda a subárvore interna: `<Contexto value={…}>` |
| valor padrão | o valor recebido por quem lê um contexto na ausência de um provedor ancestral; neste curso, `null` |
| consumidor | componente que consome um contexto; volta a ser renderizado quando o `value` do provedor é alterado |
| região ativa | área da interface cujas alterações são anunciadas por leitores de tela; `role="status"` representa a variante `polite`, que não interrompe |
| fonte única da verdade | princípio segundo o qual cada fração de estado reside em um único local, do qual todos os demais realizam a leitura |

---

**Próxima:** [Lição 7 — Formulários, actions e acessibilidade](07-formularios-accesibilidad.md)
