# Lição 4 — Estado do servidor com TanStack Query

*São 16:50 e às 17:00 a operação fecha o turno com uma pergunta: «pagos já se recuperou?». No painel, `pagos` continua em vermelho. Alguém da equipe de infraestrutura jura que reiniciou o serviço há cinco minutos. Abre-se o detalhe de `pagos`: diz «En falla». Fecha-se o detalhe, abre-se o de `catálogo`, volta-se a `pagos`… e o painel volta a pedir tudo do zero, com o «Cargando…» de sempre, como se nunca o tivesse visto. Clica-se em «Actualizar»: a lista muda para verde, mas o detalhe que estava aberto continua dizendo «En falla». Duas partes da mesma tela contam duas histórias diferentes sobre o mesmo serviço, e restam dez minutos para dizer qual é a verdade. O problema não é a API. É que cada componente busca os dados por conta própria e nenhum sabe o que o outro sabe. Esta lição dá ao painel um único lugar onde vive o que veio do servidor.*

(A cena ainda não pode ser provocada com o servidor de prática da Lição 3: lá `pagos` nunca se recupera. Esta lição dá ao servidor a rota que o «revisa outra vez», e em 4.6.1 vai dar para ver a cena completa, e resolvida.)

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 4.4 e 4.5)

**O que se constrói:** o relatório do `revisor` com cache, atualização em segundo plano, os quatro estados de uma consulta mais o de «dados velhos», um botão «Volver a revisar» que pede ao servidor para revisar um serviço e deixa a lista e o detalhe em dia, e um limite de erro que captura o que falhar ao renderizar

**O que se aprende:** por que buscar dados manualmente não escala (cache, cascatas, condições de corrida); `useQuery`, `queryKey` e `signal`; `status` versus `fetchStatus`; `staleTime`, novas tentativas e `refetchInterval`; `useMutation` e invalidação; **o quarto estado: vazio**; o que o Suspense não faz; o Error Boundary, a única classe do curso

**De onde se vem.** Da [Lição 3](03-effects-sincronizar.md). O `revisor` busca o relatório com um hook próprio, `useReporte`, que faz polling a cada 10 segundos com um Effect, um `AbortController` e um `useEffectEvent` para que o polling não se reinicie quando `Panel` passa uma função nova. O detalhe de um serviço é trazido por outro hook, `useDetalle`, com o próprio Effect que cancela a requisição (*abort*) quando o nome muda, e `ContenidoReporte` monta `<PanelDetalle key={seleccionado}>` para que a troca de serviço reinicie o painel completo. Tudo isso funciona, e funciona por boas razões: a Lição 3 reproduziu a condição de corrida (*race condition*) e a corrigiu. Nesta lição, os dois hooks vão ser apagados. Não porque estivessem errados, mas porque resolviam manualmente, um por um, um problema que tem nome e ferramenta. O trabalho continua sobre o mesmo projeto, `~/curso-react/revisor/`.

**O que esta lição não faz.** Não adiciona telas nem rotas: a lista e o detalhe continuam na mesma página, e a seleção continua sendo um estado de `Panel`; as rotas chegam na [Lição 5](05-rutas-url-como-estado.md). Não usa Suspense para carregar dados: explica o que ele faria e por que este painel não precisa dele. Não escreve testes automatizados: os dos quatro estados chegam na [Lição 8](08-pruebas-de-componentes.md). Não cadastra serviços: o servidor de prática já sabe fazer isso a partir desta lição, mas o formulário é da [Lição 7](07-formularios-accesibilidad.md). E não explica o servidor de prática, que aqui cresce para a versão final: apenas diz quais rotas novas ele tem.

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas do `package.json` desta lição. O ponto de controle foi reinstalado com `npm ci` e passou em `npm run lint` e `npm run build`, com o mesmo nome de arquivo em `dist/` que as execuções do curso obtiveram também em um contêiner Linux (`index-BzO-N0-M.js`); por isso o que se vê aqui é o que vai aparecer no Linux Mint, salvo um aviso do `npm ci` sobre `fsevents` que só aparece no macOS e é explicado onde ocorre. O que se vê «no navegador» foi medido com o Chrome em modo headless (`--headless`), controlado pelo protocolo de depuração: um programa pequeno abria a página, clicava nos botões como qualquer pessoa faria e anotava, com milissegundos desde a abertura da página, cada requisição que saía para `/api/` e cada mudança na tela. É o mesmo registro visto na aba «Rede» das ferramentas de desenvolvedor, relatado por escrito. Os horários do log do servidor de prática estão em UTC; a hora que o painel exibe («Actualizado a las 2:11:47 a.m.») é a local da máquina, que estava no fuso horário do centro do México. Os caminhos longos são mostrados a partir de `~/curso-react`. Para comparar tamanhos, também foi construído o ponto de controle da Lição 3, com o mesmo resultado registrado nas execuções do curso (`index-CTkBRgQQ.js`). Os programas estão em [`programas/04-estado-del-servidor/`](../programas/04-estado-del-servidor): `revisor/` é o ponto de controle e as três figuras estão ao lado dele, com o próprio `package.json`, que é o das figuras da Lição 0 mais `@tanstack/react-query`. As três foram executadas novamente do zero em uma pasta nova, partindo do `package.json` da Lição 0 e adicionando apenas o Query, como indicado em 4.1, e produziram saídas idênticas às exibidas. Cada lição do curso foi escrita com as próprias portas para não conflitar com outras execuções na mesma máquina; recomenda-se usar as portas de sempre: 3100 para o servidor de prática, 5173 para `npm run dev` e 4173 para `npm run preview`.

## Ao terminar, vai ser possível

- Mostrar, com uma figura que conta chamadas, quantas requisições um dado buscado manualmente faz por dois componentes e quantas faz com TanStack Query, e explicar de onde vem a diferença.
- Configurar um `QueryClient` com `staleTime` e `retry`, montá-lo com `QueryClientProvider` e escrever uma consulta com `queryOptions`, uma chave e uma função que recebe o `signal`.
- Distinguir `status` de `fetchStatus`, nomear as cinco combinações provocadas pela figura 2 e apontar qual renderiza «· actualizando…» no rodapé do painel.
- Renderizar os quatro estados de uma consulta (carregando, erro, vazio e com dados) mais o de «dados velhos», e provocar cada um com o servidor de prática.
- Escrever uma mutação com `useMutation` que, ao terminar com sucesso, invalide as consultas afetadas, e interpretar no log a requisição `POST` seguida das duas provocadas pela invalidação.
- Explicar quais erros um Error Boundary captura e quais não, e por que é a única classe do curso.

## O porquê antes do como

Observe o que o `revisor` faz hoje, ao final da Lição 3, com os olhos de quem opera o painel.

**O mesmo dado é pedido duas vezes.** `Panel` precisa do relatório para a lista; o título da aba, `(2) Revisor`, precisa do mesmo relatório para contar falhas. Hoje isso funciona porque os dois vivem no mesmo componente e compartilham o resultado de um único `useReporte`. Mas assim que o cabeçalho da [Lição 5](05-rutas-url-como-estado.md) quiser mostrar «2 servicios con falla» a partir de outra parte da árvore, restam duas opções: subir o estado até um ancestral comum e descê-lo via props, ou chamar `useReporte` duas vezes e fazer duas requisições para o mesmo dado. Nenhuma escala.

**Sair e voltar custa o mesmo que entrar.** Ao selecionar `pagos`, `useDetalle` faz a requisição; ao selecionar `catálogo` e voltar para `pagos`, faz a requisição outra vez do zero, com o «Cargando detalle…» de 1.5 segundos, mesmo tendo sido exibido há cinco segundos. O hook não tem memória: o estado vive no componente, e o componente é desmontado. A documentação do React expressa isso claramente: buscar dados diretamente em um Effect costuma significar que eles não são pré-carregados nem guardados em cache, de modo que, se o componente for desmontado e montado novamente, precisará buscá-los outra vez ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)).

**O que muda em um lugar não é refletido no outro.** Se amanhã o detalhe tivesse um botão que pede ao servidor para revisar `pagos` novamente, a resposta chegaria ao detalhe… e a lista continuaria exibindo `pagos` em vermelho até o polling seguinte, dez segundos depois. Para avisar a lista, seria preciso passar a `PanelDetalle` uma função `recargarLista` a partir de `Panel`, e mais outra para cada tela que dependesse desse serviço.

**E cada hook volta a escrever a mesma coisa.** `useReporte` e `useDetalle` têm, cada um, o próprio `AbortController`, o próprio `try`/`catch`, o `if (control.signal.aborted) return`, a união `cargando`/`listo`/`error`. É o código que a Lição 3 ensinou a escrever direito, e precisamente por isso convém notar o peso disso: a própria página do React o descreve como «pouco ergonômico», com bastante código repetido para não cair em erros como as condições de corrida (*race conditions*).

Essa página não para na crítica: recomenda, caso não se use um framework, «usar ou construir um cache no lado do cliente», e cita três soluções abertas; a primeira é o **TanStack Query**. E acrescenta algo que vale ler com calma: ao construir uma solução própria, Effects serão usados por baixo dos panos, mas será necessário adicionar a lógica para não repetir requisições, armazenar respostas em cache e evitar cascatas. Isso é o que a biblioteca faz. Por baixo continua havendo um `fetch` com um `signal`; o que muda é **quem é o dono do dado**. Até hoje, o dono do relatório era o componente que o solicitava. A partir desta lição, o dono é um cache que vive fora dos componentes, e os componentes apenas se **inscrevem** no que precisam.

Essa mudança tem um nome que dá título à lição: **estado do servidor**. O estado que a Lição 2 ensinou a gerenciar — a caixa «Solo fallas», o serviço selecionado, o rascunho de uma anotação — é local da aplicação: nasce na tela, só a tela o altera e ele está sempre em dia. O relatório é outra coisa. É uma **cópia** de algo que vive em outro computador, que outras pessoas podem alterar sem aviso, que demora a chegar, que pode falhar ao ser solicitado e que começa a envelhecer no instante em que chega. Tratá-lo com `useState` é tratar uma fotografia como se fosse uma janela.

A lição tem nove partes: o problema medido (4.1); a instalação e o cliente (4.2); chaves, funções de consulta e polling (4.3); `status` versus `fetchStatus` (4.4); os quatro estados mais um (4.5); mutações e invalidação (4.6); o que o Suspense não faz (4.7); o limite de erro (4.8); e o percurso completo (4.9). Ao final, o resultado da compilação vai ser este, e vai ficar claro por que o JavaScript aumentou cerca de 36 kilobytes:

```text
$ npm run build

> revisor@0.4.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 83 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-Bjb9BrLB.css    0.75 kB │ gzip:  0.40 kB
dist/assets/index-BzO-N0-M.js   262.38 kB │ gzip: 81.53 kB

✓ built in 263ms
```

## Os conceitos

### 4.1 O problema, medido: dois componentes, um dado

Antes de instalar qualquer coisa, mede-se o problema. A primeira figura monta duas vezes o mesmo componente — pense no cabeçalho e no resumo, que precisam do mesmo relatório —, conta quantas vezes uma «API» simulada que demora 50 ms é chamada, depois os desmonta (a pessoa sai da tela) e os monta novamente (a pessoa retorna). O procedimento é feito duas vezes: com um Effect por componente, como na Lição 3, e com TanStack Query.

As figuras desta lição importam o TanStack Query, então a pasta de figuras também precisa dele. Em `~/curso-react/figuras/`, criada na Lição 0, adicione o pacote com a versão exata:

```bash
npm install --save-dev --save-exact @tanstack/react-query@5.104.5
```

Ou copie o `package.json` e o `package-lock.json` de `programas/04-estado-del-servidor/` e execute `npm ci`. As duas formas foram testadas a partir de uma pasta vazia e as três figuras produziram exatamente as saídas exibidas aqui. Se esse passo for ignorado, o primeiro `npx tsc` reclama de não encontrar o módulo `@tanstack/react-query`.

```tsx
// fig04_01.tsx
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// Una «API» de mentira que cuenta cuántas veces la llamaron y tarda 50 ms.
let llamadas = 0;

async function cargarNombres(senal: AbortSignal): Promise<readonly string[]> {
  llamadas += 1;
  await new Promise((resolver) => setTimeout(resolver, 50));
  senal.throwIfAborted();
  return ["catálogo", "pagos", "inventario", "reportes"];
}

// Forma 1: cada componente trae sus datos con su propio Effect.
function ConteoAMano() {
  const [nombres, establecerNombres] = useState<readonly string[] | null>(null);

  useEffect(() => {
    const control = new AbortController();
    cargarNombres(control.signal).then(establecerNombres, () => {});
    return () => control.abort();
  }, []);

  return <p>{nombres === null ? "cargando" : `${nombres.length} servicios`}</p>;
}

// Forma 2: los dos componentes piden la misma clave a TanStack Query.
function ConteoConQuery() {
  const consulta = useQuery({
    queryKey: ["reporte"],
    queryFn: ({ signal }) => cargarNombres(signal),
    staleTime: 5_000,
  });

  return <p>{consulta.data === undefined ? "cargando" : `${consulta.data.length} servicios`}</p>;
}

const esperar = (ms: number) => act(() => new Promise<void>((resolver) => setTimeout(resolver, ms)));

async function medir(titulo: string, Conteo: ComponentType): Promise<void> {
  console.log(titulo);
  llamadas = 0;
  const clienteConsultas = new QueryClient();
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  // El encabezado y el resumen necesitan el mismo dato: dos componentes, un reporte.
  const dibujar = (visible: boolean) =>
    raiz.render(
      <QueryClientProvider client={clienteConsultas}>
        {visible && (
          <>
            <Conteo />
            <Conteo />
          </>
        )}
      </QueryClientProvider>,
    );

  await act(async () => dibujar(true));
  await esperar(100);
  console.log(`  al abrir:          ${llamadas} llamada(s) a la API`);

  // La persona sale de la pantalla y vuelve un momento después.
  await act(async () => dibujar(false));
  llamadas = 0;
  await act(async () => dibujar(true));
  console.log(`  al volver, de inmediato se ve: «${contenedor.textContent}»`);
  await esperar(100);
  console.log(`  al volver:         ${llamadas} llamada(s) a la API`);

  await act(async () => raiz.unmount());
  clienteConsultas.clear();
}

await medir("a mano, un Effect por componente:", ConteoAMano);
await medir("con TanStack Query, misma clave:", ConteoConQuery);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig04_01.tsx
$ node fig04_01.js
a mano, un Effect por componente:
  al abrir:          2 llamada(s) a la API
  al volver, de inmediato se ve: «cargandocargando»
  al volver:         2 llamada(s) a la API
con TanStack Query, misma clave:
  al abrir:          1 llamada(s) a la API
  al volver, de inmediato se ve: «4 servicios4 servicios»
  al volver:         0 llamada(s) a la API
```

Leia as duas metades linha por linha.

**Manualmente, dois componentes são duas chamadas.** Cada `ConteoAMano` tem o próprio Effect, o próprio estado e o próprio `AbortController`. Não há como um saber que o outro já está solicitando o mesmo dado: os Effects são privados de cada componente. Ao retornar, os dois começam outra vez em `cargando` e fazem outras duas chamadas, porque o estado foi perdido na desmontagem.

**Com o Query, dois componentes são uma chamada.** Os dois `ConteoConQuery` solicitam a chave `["reporte"]`. Na primeira vez que alguém a pede, o Query dispara a função; quando o segundo pede enquanto a primeira chamada ainda está em andamento, o Query não dispara outra: ele o **inscreve** na mesma requisição. Isso se chama *deduplicação* de requisições (*deduplication*). E ao retornar, a tela exibe «4 servicios» **imediatamente**, sem passar por `cargando`, e não faz nenhuma chamada. O dado não vivia nos componentes: vivia no cache do `QueryClient`, que permaneceu ativo enquanto a tela estava desmontada.

Por que nenhuma chamada ao retornar? Pela linha `staleTime: 5_000`. Ela diz ao Query que, durante cinco segundos após chegar, o dado é considerado **fresco** e não vale a pena buscá-lo novamente. Quando esse prazo expira, o dado se torna **velho** (*stale*), e na próxima vez que um componente se inscrever, o Query exibirá o que já tem e, em paralelo, fará a busca de novo. No exercício 2, remove-se essa linha para comprovar o comportamento.

O planejamento deste curso resume em três termos por que buscar dados manualmente não escala: **cache**, **cascatas** e **condições de corrida**. A figura acabou de medir o primeiro. A página do React citada em «O porquê» lista quatro problemas: os Effects não rodam no servidor, as cascatas, o fato de não haver pré-carregamento nem cache, e o design pouco ergonômico, com propensão a erros como condições de corrida. O primeiro não se aplica a este painel, que não é renderizado em um servidor; os outros três são os do planejamento. O segundo termo se refere às **cascatas** (*network waterfalls*), o segundo problema dessa lista: um componente pai pede dados, é renderizado, e só então os filhos começam a pedir os deles; em uma rede lenta, cada nível soma tempo de espera ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). A figura não mede isso e o `revisor` ainda não sofre com isso, porque o detalhe só é solicitado quando alguém escolhe um serviço. O que o Query traz contra as cascatas é que uma consulta pode ser disparada **de fora de um componente** — por exemplo, quando o roteador já sabe para qual tela a navegação vai, antes de renderizá-la —, e é isso que a Lição 5 aproveitaria se precisasse. Aqui basta saber que o problema existe e tem solução. O terceiro termo, as **condições de corrida**, foi visto de perto na Lição 3; como o Query as evita será explicado em 4.3.2, quando o `signal` entrar em cena.

### 4.2 A instalação e o cliente

O TanStack Query é uma biblioteca de pacote único para React. Instala-se em `dependencies`, pois vai para o navegador, com a versão exata:

```bash
npm install --save-exact @tanstack/react-query@5.104.5
```

Essa versão foi publicada em 19 de outubro de 2026 e é a mais recente retornada por `npm view @tanstack/react-query version` no dia da execução. Na instalação no macOS, `npm ci` ou `npm install` terminam com um aviso semelhante a este:

```text
npm warn install-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn install-scripts   fsevents@2.3.3 (install: (install scripts present))
```

Esse aviso não vem do Query. `fsevents` é uma dependência opcional, exclusiva para macOS, usada pelas ferramentas de desenvolvimento para detectar rapidamente quais arquivos mudaram; no npm 11, os scripts de instalação de dependências ficam bloqueados enquanto ninguém os aprova explicitamente, e o npm conclui a instalação avisando quais foram ignorados ([npm, «npm install-scripts»](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts)). No caso do `fsevents`, não é necessário aprovar nada: o pacote já vem com o arquivo binário compilado `fsevents.node` (visível em `node_modules/fsevents/`), a instalação termina com sucesso e o Vite funciona perfeitamente. Quando um pacote de fato precisa executar scripts, confere-se com `npm install-scripts ls` e aprova-se com `npm install-scripts approve <pacote>`; aprovar é uma decisão de segurança, pois o script roda com as permissões do usuário do sistema. No Linux isso não ocorre, porque o pacote declara no `package.json` que é exclusivo para `darwin` (macOS), e o npm nem chega a instalá-lo.

O `package.json` fica assim; a única linha nova, além do número de versão, é a do Query:

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.4.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "servidor": "node servidor/practica.ts"
  },
  "dependencies": {
    "@tanstack/react-query": "5.104.5",
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "npm:typescript@7.0.2",
    "@vitejs/plugin-react": "6.1.2",
    "eslint": "10.13.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "typescript-eslint": "8.72.0",
    "vite": "8.3.5"
  }
}
```

A biblioteca possui duas peças que se configuram uma única vez. A primeira é o **`QueryClient`**: o objeto que guarda o cache e as regras. O ponto de controle o cria com uma função, em arquivo próprio, para que os testes da Lição 8 possam criar uma nova instância em cada teste:

```ts
// revisor/src/consultas/cliente.ts
import { QueryClient } from "@tanstack/react-query";

export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: 2,
      },
    },
  });
}
```

Essas duas opções alteram dois padrões que a documentação do Query destaca na página de configurações importantes ([TanStack Query, «Important Defaults»](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)):

- **`staleTime`** vale `0` por padrão: um dado é considerado velho no mesmo instante em que chega. Com `0`, a cada novo componente que se inscreve, a cada retorno de foco para a janela e a cada reconexão de rede, o Query busca o dado novamente. Para um painel que já se atualiza a cada dez segundos de qualquer forma, cinco segundos de frescor evitam requisições inúteis: se o relatório acabou de chegar, abrir o detalhe ou voltar para a aba não precisa de outra requisição. É um critério do projeto, não uma regra universal: o valor correto depende do ritmo de alteração do dado e do custo de mostrá-lo ligeiramente defasado.
- **`retry`** vale `3` por padrão: uma consulta com falha é tentada novamente três vezes, em silêncio, com um intervalo que dobra a cada tentativa. O curso reduz para `2` para que, com a API fora do ar, o alerta apareça em cerca de quatro segundos em vez de oito. Na seção 4.5 isso será visto no log, tentativa por tentativa.

Existem outros dois valores que convém conhecer, embora o ponto de controle não os altere. **`gcTime`** (de *garbage collection*) define quanto tempo um dado que não está em uso por nenhum componente sobrevive no cache: cinco minutos. Por isso, na figura 1, o dado continuava presente ao retornar. E **`refetchOnWindowFocus`** vem habilitado: quando se volta à aba do painel, as consultas velhas são buscadas novamente. Isso faz com que um painel esquecido por meia hora em segundo plano se atualize no instante em que a aba volta a ser visualizada. Conforme documentado: consultas velhas são atualizadas em segundo plano quando uma nova instância é montada, quando a janela ganha foco ou quando a rede é restabelecida.

A segunda peça é o **`QueryClientProvider`**, que disponibiliza o cliente para toda a árvore de componentes. `main.tsx` o instancia **uma única vez, fora de qualquer componente**, e envolve o painel:

```tsx
// revisor/src/main.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LimiteDeError } from "./compartido/LimiteDeError";
import { cadaMs } from "./configuracion";
import { crearClienteConsultas } from "./consultas/cliente";
import { Panel } from "./reporte/Panel";

const raiz = document.getElementById("raiz");

if (raiz === null) {
  throw new Error("falta el elemento #raiz en la página");
}

const clienteConsultas = crearClienteConsultas();

createRoot(raiz).render(
  <StrictMode>
    <LimiteDeError>
      <QueryClientProvider client={clienteConsultas}>
        <Panel cadaMs={cadaMs} />
      </QueryClientProvider>
    </LimiteDeError>
  </StrictMode>,
);
```

Chamar `crearClienteConsultas()` no nível do módulo, e não dentro de um componente, não é mero capricho de estilo. Se fosse criado dentro de um componente, cada renderização geraria um cache novo e vazio, descartando tudo o que a figura 1 demonstrou. Em `main.tsx`, a execução acontece uma vez, quando o navegador carrega o módulo. (O `LimiteDeError` que envolve tudo será explicado em 4.8.)

E aqui surge o impacto de tamanho mencionado ao final de «O porquê». Também foi construído o ponto de controle da Lição 3 para comparação: o JavaScript ocupava 225.86 kB (70.67 kB compactado) a partir de 33 módulos; o desta lição ocupa 262.38 kB (81.53 kB compactado) a partir de 83. Entre uma lição e outra, o código próprio do `revisor` quase não aumentou — na verdade, dois hooks foram removidos —, de modo que esses 36 kB e 50 módulos a mais vêm, majoritariamente, da biblioteca. Cabe avaliar se vale o custo. Para um painel que apenas buscasse um dado uma única vez, provavelmente não; para um que requer cache, polling, novas tentativas, deduplicação, invalidação e exibição de dados prévios durante atualizações, o que a biblioteca pesa é compensado pelo código que se deixa de escrever e manter.

### 4.3 Chaves, funções de consulta e polling

Uma consulta tem duas partes obrigatórias: uma **chave** que a identifica e uma **função** que busca o dado. Todo o restante são opções.

#### 4.3.1 A chave: o nome do dado no cache

A chave é um array. A documentação estabelece três regras: deve ser um array no nível superior, precisa ser serializável em JSON e deve ser única para aquele dado; e adiciona uma quarta regra fundamental para evitar defeitos: **se a função depende de uma variável, essa variável precisa estar na chave** ([TanStack Query, «Query Keys»](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)). O detalhe de `pagos` e o de `catálogo` são dados diferentes, portanto suas chaves devem ser distintas: `["servicio", "pagos"]` e `["servicio", "catálogo"]`.

O ponto de controle centraliza todas as chaves em um único arquivo, evitando que alguém escreva `["reportes"]` em um ponto e `["reporte"]` em outro:

```ts
// revisor/src/consultas/claves.ts
export const claves = {
  reporte: ["reporte"] as const,
  servicio: (nombre: string) => ["servicio", nombre] as const,
};
```

O `as const` faz com que o TypeScript preserve o formato exato do array (`readonly ["reporte"]` em vez de `string[]`), e `servicio` é uma função porque sua chave depende do nome. Essa estrutura traz uma vantagem visível em 4.6: as chaves são comparadas **por prefixo**. Invalidar `["servicio"]` atinge todos os detalhes; invalidar `["servicio", "pagos"]`, apenas um.

Note o que essa regra substitui. Na Lição 3, `useDetalle` incluía `[nombre]` na lista de dependências, com `exhaustive-deps` monitorando omissões. A chave do Query cumpre o mesmo papel: quando `nombre` muda, a chave muda, e o Query solicita o novo dado. A diferença é que o linter do React não verifica chaves do Query. Caso o nome seja esquecido na chave, nenhum aviso é emitido; o exercício 4 demonstra o que acontece na tela nessa situação.

#### 4.3.2 A função: a mesma fronteira de rede, com o `signal` fornecido pelo Query

A função de consulta do relatório é `cargarReporte`, a fronteira de rede da Lição 0, com uma única mudança: perde o tipo `Cargar`, que existia para passar a função como prop para `Panel` e agora não tem mais utilidade.

```ts
// revisor/src/reporte/cargar.ts
import { esReportePublico, type ReportePublico } from "../compartido/contrato";

export async function cargarReporte(senal: AbortSignal): Promise<ReportePublico> {
  const respuesta = await fetch("/api/estados", { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esReportePublico(cuerpo)) {
    throw new Error("la API no entregó un reporte válido");
  }

  return cuerpo;
}
```

A função continua recebendo um `AbortSignal`, e isso é essencial. O Query fornece a cada função de consulta o próprio `AbortSignal` e o cancela (*abort*) quando a consulta deixa de ser necessária antes de terminar: seja porque a chave mudou, seja porque nenhum componente continuou inscrito ([TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). Não é mais necessário escrever `new AbortController()` nem `control.abort()`: o Query gerencia isso internamente, restando apenas repassar o `signal` para o `fetch`. A documentação pontua: se a função **utiliza** o `signal`, o Query cancela a promise e retorna a consulta ao estado anterior; se não utiliza, a resposta é gravada no cache mesmo que ninguém mais a espere.

Na seção 4.9, esse cancelamento será observado no log, com o mesmo par `cancelada por el cliente` + `200` que o `StrictMode` produzia na Lição 0. Não é coincidência: o `StrictMode` desmonta e remonta o painel, a consulta fica por um instante sem assinantes, o Query cancela o `signal` e repete a requisição ao remontar. A limpeza continua ocorrendo; apenas mudou de responsável.

Isso elimina a condição de corrida da Lição 3 por duas frentes. Na Lição 3, viu-se que a resposta atrasada de `pagos` só chegava à tela quando faltavam duas defesas simultaneamente: o `abort` da limpeza e a `key` que desmonta o painel. O Query implementa sua versão de cada uma. A primeira é o `signal`: se `pagos` for selecionado e imediatamente depois `catálogo`, a consulta de `pagos` fica sem inscritos e o Query cancela a requisição. A segunda é a chave: mesmo se a requisição não fosse cancelada, a resposta seria armazenada na entrada `["servicio", "pagos"]` do cache, e não na de `catálogo`. Cada chave é um compartimento isolado, impedindo que uma resposta atrasada caia no lugar errado. O componente de `catálogo` só lê o compartimento de `catálogo`.

#### 4.3.3 `queryOptions`: a consulta em um único lugar

Com a chave e a função, monta-se a consulta. O ponto de controle não a define diretamente no componente, mas em um arquivo do próprio recurso, usando `queryOptions`:

```ts
// revisor/src/reporte/consultas.ts
import { queryOptions } from "@tanstack/react-query";
import { claves } from "../consultas/claves";
import { cargarReporte } from "./cargar";

export function consultaReporte(cadaMs: number) {
  return queryOptions({
    queryKey: claves.reporte,
    queryFn: ({ signal }) => cargarReporte(signal),
    refetchInterval: cadaMs,
  });
}
```

`queryOptions` não altera nada em tempo de execução: devolve exatamente o objeto fornecido. O ganho está na tipagem. Reúne chave, função e opções em um objeto compartilhável entre vários pontos — um componente, um teste, um pré-carregamento — e o TypeScript infere a partir da função o tipo do dado, `ReportePublico`, para todos eles ([TanStack Query, «Query Options»](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)). Se na Lição 8 for necessário consultar o cache sob `["reporte"]`, usa-se o mesmo objeto e obtém-se o tipo correto sem duplicar definições.

A opção nova é **`refetchInterval: cadaMs`**: enquanto houver algum componente inscrito, o Query repete a busca do dado nessa frequência, em milissegundos ([TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)). É o mesmo polling a cada dez segundos da Lição 0, usando `VITE_CADA_MS`, sem `setInterval` nem `clearInterval`. E traz uma regra que o polling manual não tinha: com a opção correlata `refetchIntervalInBackground` em `false` (seu padrão), o polling pausa enquanto a aba estiver em segundo plano. Um painel esquecido em uma aba não fica consultando a API a cada dez segundos a noite toda.

A consulta do detalhe segue a mesma estrutura, com o nome na chave e na função:

```ts
// revisor/src/detalle/consultas.ts
import { queryOptions } from "@tanstack/react-query";
import { claves } from "../consultas/claves";
import { cargarDetalle } from "./cargar";

export function consultaDetalle(nombre: string) {
  return queryOptions({
    queryKey: claves.servicio(nombre),
    queryFn: ({ signal }) => cargarDetalle(nombre, signal),
  });
}
```

A função `cargarDetalle` não sofre alterações em relação à Lição 3. Com isso, `useReporte.ts` e `useDetalle.ts` deixam de existir no projeto e, junto com `useReporte`, elimina-se o `useEffectEvent` introduzido na Lição 3 para evitar reinicializações do polling. Não era uma implementação incorreta: era a maneira certa de contornar o problema com um Effect manual. Agora, simplesmente não há mais Effect manual.

E quanto a `useTituloDocumento`, o outro Effect da Lição 3? Esse permanece. Ele sincroniza o `document.title` com o estado do React, exatamente a finalidade de um Effect. Nem todo Effect deve ser removido: remove-se o que buscava dados.

### 4.4 `status` versus `fetchStatus`

O hook `useQuery` retorna um objeto com diversas propriedades. As duas mais importantes de compreender são `status` e `fetchStatus`, pois respondem a **duas perguntas distintas**. A documentação resume em uma regra prática: `status` informa sobre os **dados** — há ou não há dados? — e `fetchStatus` informa sobre a **função** — ela está em execução ou não? ([TanStack Query, «Queries»](https://tanstack.com/query/latest/docs/framework/react/guides/queries)).

| Campo | Valor | O que significa |
|---|---|---|
| `status` | `pending` | ainda não há dados |
| | `error` | a última tentativa falhou |
| | `success` | há dados disponíveis |
| `fetchStatus` | `fetching` | a função está em execução |
| | `paused` | deveria executar, mas não há rede |
| | `idle` | não está executando nada |

Por que dois campos em vez de um? Porque, com cache e atualização em segundo plano, **todas as combinações são possíveis**, e uma única variável não consegue expressá-las. A segunda figura provoca essas combinações uma a uma: monta um componente sem rede, restabelece a conexão, depois simula a falha da API e dispara nova busca. O componente registra uma linha a cada alteração em qualquer um dos dois campos.

```tsx
// fig04_02.tsx
import { onlineManager, QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// La «API» responde bien o falla según esta variable.
let apiCaida = false;

async function cargarNombres(): Promise<readonly string[]> {
  await new Promise((resolver) => setTimeout(resolver, 50));

  if (apiCaida) {
    throw new Error("la API respondió 503");
  }

  return ["catálogo", "pagos", "inventario", "reportes"];
}

function Observador() {
  const consulta = useQuery({ queryKey: ["reporte"], queryFn: cargarNombres, retry: false });
  const datos = consulta.data === undefined ? "sin datos" : `${consulta.data.length} servicios`;

  // Escribir en la consola es sincronizarse con algo de fuera de React: un Effect.
  useEffect(() => {
    console.log(`  status=${consulta.status.padEnd(7)} fetchStatus=${consulta.fetchStatus.padEnd(8)} ${datos}`);
  }, [consulta.status, consulta.fetchStatus, datos]);

  return null;
}

const esperar = (ms: number) => act(() => new Promise<void>((resolver) => setTimeout(resolver, ms)));
const clienteConsultas = new QueryClient();
const raiz = createRoot(dom.window.document.createElement("div"));

console.log("1. sin red, se monta el componente:");
onlineManager.setOnline(false);
await act(async () =>
  raiz.render(
    <QueryClientProvider client={clienteConsultas}>
      <Observador />
    </QueryClientProvider>,
  ),
);
await esperar(100);

console.log("2. vuelve la red:");
await act(async () => onlineManager.setOnline(true));
await esperar(100);

console.log("3. la API se cae y se pide otra vez:");
apiCaida = true;
await act(async () => void clienteConsultas.refetchQueries({ queryKey: ["reporte"] }));
await esperar(100);

await act(async () => raiz.unmount());
clienteConsultas.clear();
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig04_02.tsx
$ node fig04_02.js
1. sin red, se monta el componente:
  status=pending fetchStatus=paused   sin datos
2. vuelve la red:
  status=pending fetchStatus=fetching sin datos
  status=success fetchStatus=idle     4 servicios
3. la API se cae y se pide otra vez:
  status=success fetchStatus=fetching 4 servicios
  status=error   fetchStatus=idle     4 servicios
```

Cinco linhas, cinco cenários que a interface precisa saber renderizar:

1. **`pending` + `paused`.** Não há dados e a função nem sequer está sendo executada: o Query detectou a falta de rede (`onlineManager.setOnline(false)` faz a simulação) e aguardou. Se a tela apenas checasse «está carregando?», a resposta seria não; se checasse «há dados?», a resposta também seria não. Ambas são verdadeiras.
2. **`pending` + `fetching`.** O primeiro carregamento: não há dados e a busca está em andamento. É o «Cargando…».
3. **`success` + `idle`.** Há dados e não há requisição ocorrendo. A tela em estado de repouso.
4. **`success` + `fetching`.** Há dados **e** uma nova busca está acontecendo. É o caso que uma união simples `cargando`/`listo`/`error` da Lição 0 não conseguia representar: nela, atualizar significava voltar para `cargando` e apagar a lista. Aqui a lista permanece visível e apenas se sinaliza que uma atualização ocorre em segundo plano.
5. **`error` + `idle` com «4 servicios».** A última tentativa falhou, **mas os dados anteriores continuam disponíveis**. O Query não os descarta. `status` indica `error` e `data` preserva o relatório anterior.

A quinta linha é a que mais surpreende e a mais crucial para um painel de monitoramento: se a API falha por um instante, o pior caminho é deixar a tela vazia. O Query entrega ambos os estados simultaneamente — o erro e o último dado íntegro —, cabendo à interface decidir como apresentá-los.

Além dos dois campos, `useQuery` oferece atalhos booleanos: `isPending` equivale a `status === "pending"`, `isError` a `status === "error"`, `isSuccess` a `status === "success"` e `isFetching` a `fetchStatus === "fetching"`. A documentação de `useQuery` define `isFetching` com precisão: vale `true` sempre que a função de busca estiver em execução, **incluindo** a carga inicial. O ponto de controle utiliza os atalhos, que também auxiliam o TypeScript: após um `if (consulta.isPending) return …`, o TypeScript infere que `consulta.data` não pode mais ser `undefined`. Em «O erro que vai aparecer», a remoção desse `if` faz o TypeScript apontar a inconsistência.


Assim fica `Panel`, que agora só recebe `cadaMs`:

```tsx
// revisor/src/reporte/Panel.tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { consultaReporte } from "./consultas";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
import "./panel.css";
import { contarFallas } from "./resumen";

export function Panel({ cadaMs = 10_000 }: { readonly cadaMs?: number }) {
  const consulta = useQuery(consultaReporte(cadaMs));
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

  const fallas = consulta.data === undefined ? 0 : contarFallas(consulta.data.estados);
  useTituloDocumento(fallas > 0 ? `(${fallas}) Revisor` : "Revisor");

  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <ContenidoReporte
          consulta={consulta}
          soloFallas={soloFallas}
          seleccionado={seleccionado}
          notas={notas}
          alSeleccionar={establecerSeleccionado}
          alGuardarNota={guardarNota}
        />
        {consulta.dataUpdatedAt > 0 && (
          <p className="actualizado">
            Actualizado a las {new Date(consulta.dataUpdatedAt).toLocaleTimeString("es-MX")}
            {consulta.isFetching && " · actualizando…"}
          </p>
        )}
        <button type="button" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Três coisas mudaram em relação à Lição 3:

- **A consulta substitui o hook.** `useQuery(consultaReporte(cadaMs))` retorna o objeto completo, e `Panel` o repassa diretamente para `ContenidoReporte`. Não há mais a prop `cargar`: o componente não recebe a função de busca, pois ela vive dentro da consulta.
- **«Actualizado a las» sai de `dataUpdatedAt`.** Na Lição 3 era um estado próprio, `actualizadoEn`, preenchido em um `alRecibir` envolvido por `useEffectEvent`. Agora o Query já armazena o momento em que o último dado válido chegou, como um número em milissegundos ([TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)), valendo `0` enquanto nenhum tiver chegado. É um estado que deixou de ser armazenado porque passou a ser lido: a regra da Lição 2 de «não guarde o que dá para calcular», aplicada ao cache.
- **O botão «Actualizar» chama `refetch`** e fica desabilitado enquanto `isFetching` for `true`. E o rodapé acrescenta «· actualizando…» exatamente no quarto caso da figura: há dados e uma nova busca está em andamento. Essa é a diferença entre `status` e `fetchStatus`, expressa em uma única linha.

### 4.5 Os quatro estados, mais um

Um dado vindo de um servidor tem, no mínimo, **quatro estados** que a interface precisa renderizar: carregando, erro, vazio e com dados. Os três primeiros costumam ser esquecidos. O de erro, porque na máquina de quem programa a API sempre responde. E o **vazio**, porque no ambiente de desenvolvimento sempre há dados de teste: uma lista vazia é renderizada como uma lista sem linhas, o que visualmente não se distingue de uma tela com defeito. Por isso o planejamento do curso o chama de «o quarto estado» e o destaca em negrito.

O quinto, que só existe graças ao cache, é **com dados e com erro**: a última atualização falhou, mas há um relatório anterior para exibir. É a linha 5 da figura 2. `ContenidoReporte` renderiza os cinco, nesta ordem:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReportePublico } from "../compartido/contrato";
import { PanelDetalle } from "../detalle/PanelDetalle";
import { ListaEstados } from "./ListaEstados";
import type { Notas } from "./notas";
import { filtrarEstados } from "./resumen";
import { ResumenFallas } from "./ResumenFallas";

export function ContenidoReporte({
  consulta,
  soloFallas,
  seleccionado,
  notas,
  alSeleccionar,
  alGuardarNota,
}: {
  readonly consulta: UseQueryResult<ReportePublico>;
  readonly soloFallas: boolean;
  readonly seleccionado: string | null;
  readonly notas: Notas;
  readonly alSeleccionar: (nombre: string | null) => void;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
}) {
  if (consulta.isPending) {
    return <p role="status">Cargando…</p>;
  }

  if (consulta.isError && consulta.data === undefined) {
    return (
      <div role="alert">
        <p>No se pudo cargar el reporte: {consulta.error.message}</p>
        <button type="button" onClick={() => void consulta.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const { estados } = consulta.data;

  if (estados.length === 0) {
    return <p>No hay servicios configurados todavía.</p>;
  }

  const visibles = filtrarEstados(estados, soloFallas);
  const existe = estados.some((estado) => estado.nombre === seleccionado);

  return (
    <>
      {consulta.isError && (
        <p role="alert" className="viejo">
          Mostrando el último reporte que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      <ResumenFallas estados={estados} />
      <ListaEstados
        estados={visibles}
        seleccionado={seleccionado}
        notas={notas}
        alSeleccionar={alSeleccionar}
      />
      {seleccionado !== null && existe && (
        <PanelDetalle
          key={seleccionado}
          nombre={seleccionado}
          notaGuardada={notas[seleccionado] ?? ""}
          alGuardarNota={alGuardarNota}
          alCerrar={() => alSeleccionar(null)}
        />
      )}
    </>
  );
}
```

Leia a ordem dos `if`, pois cada um descarta um caso e deixa o seguinte com menos possibilidades:

1. **`isPending`** → «Cargando…», dentro de `role="status"`, anunciado por leitores de tela sem interromper o usuário. Se ainda não há dados, não há mais nada a renderizar.
2. **`isError` sem dados** → o alerta e um botão «Reintentar» que chama `refetch`. É o erro autêntico: a requisição falhou e não há dado substituto. `role="alert"` faz com que o leitor de tela o anuncie imediatamente.
3. **Lista vazia** → «No hay servicios configurados todavía.» Observe que não se trata de erro nem de carregamento: é uma resposta válida, `{"estados":[]}`, que significa outra coisa. A mensagem informa o que está acontecendo, em vez de deixar a dúvida se a tela quebrou.
4. **Com dados** → o resumo, a lista e o detalhe, como na Lição 3.
5. **Com dados e com erro** → o mesmo que o caso 4, com um aviso acima: «Mostrando el último reporte que llegó». A classe `viejo` aplica uma borda âmbar, destacando-o da lista sem ocultá-la.

Após o segundo `if`, o TypeScript sabe que `consulta.data` existe: se `isPending` fosse verdadeiro, já teria havido retorno; se houvesse erro sem dados, também. Por isso `const { estados } = consulta.data;` compila sem necessidade de `?.` ou `!`. A ordem dos `if` não melhora apenas a legibilidade: ela permite que o compilador acompanhe o raciocínio.

A folha de estilos adiciona uma regra, compartilhada com o limite de erro de 4.8:

```css
.viejo,
.limite-de-error {
  border-left: 0.5rem solid #bf8700;
  padding-left: 0.75rem;
}
```

Agora, simula-se cada um com o servidor de prática, que a partir desta lição aceita uma variável `ESCENARIO`: `normal` (comportamento padrão), `vacio` (inicia sem serviços) ou `caido` (`GET /api/estados` responde sempre `503`). Com `ESCENARIO=vacio npm run servidor` e `npm run dev`, o resultado em tela no Chrome headless (o texto visível do contêiner) foi:

```text
Revisor
Estado de los servicios
 Solo fallas

No hay servicios configurados todavía.

Actualizado a las 2:11:47 a.m.

Actualizar
```

E no log do servidor: o par do `StrictMode` e uma resposta válida, porém vazia.

```text
08:11:44.790 servidor de práctica en http://127.0.0.1:3100 (escenario: vacio)
08:11:47.090 GET /api/estados cancelada por el cliente
08:11:47.395 GET /api/estados 200
```

Note que surge «Actualizado a las…»: para o Query, uma lista vazia é um sucesso, e de fato é. Já com `ESCENARIO=caido`, a tela exibiu:

```text
Revisor
Estado de los servicios
 Solo fallas

No se pudo cargar el reporte: la API respondió 503

Reintentar
Actualizar
```

A parte interessante está no log e no registro de rede anotado pelo navegador, com milissegundos a partir da abertura da página:

```text
08:11:53.455 servidor de práctica en http://127.0.0.1:3100 (escenario: caido)
08:11:55.655 GET /api/estados cancelada por el cliente
08:11:55.955 GET /api/estados 503
08:11:57.262 GET /api/estados 503
08:11:59.571 GET /api/estados 503
```
```text
  342 ms  red  → GET /api/estados
  343 ms  red  → GET /api/estados
  343 ms  red  ✗ GET /api/estados net::ERR_ABORTED
  376 ms  red  ← GET /api/estados 503
 1373 ms  red  → GET /api/estados
 1685 ms  red  ← GET /api/estados 503
 3682 ms  red  → GET /api/estados
 3986 ms  red  ← GET /api/estados 503
```

Três `503` após a requisição cancelada: a tentativa inicial e as **duas novas tentativas** configuradas em `retry: 2`. Observe os intervalos entre uma resposta e a requisição seguinte: cerca de 1.000 ms e depois cerca de 2.000 ms. É o backoff exponencial padrão do Query, que começa em um segundo e dobra a cada tentativa, com limite em 30 segundos ([TanStack Query, «Query Retries»](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries)). Enquanto isso, a tela continuou em «Cargando…»: as novas tentativas são silenciosas, e o alerta só surge quando elas se esgotam. Com o padrão de `retry: 3`, o tempo de espera para saber que a API estava fora do ar seria de cerca de oito segundos; com `2`, cai para cerca de quatro. (Um detalhe de leitura: no registro do navegador, entre a primeira requisição e o respectivo `503` há apenas 33 ms, embora o servidor demore 300 ms. Não significa que o servidor respondeu mais rápido; o log do servidor confirma os 300 ms. Ocorre que, durante o carregamento inicial, o navegador entregou os primeiros eventos em lote ao programa de captura, que registrou o horário em que os recebeu. Da segunda requisição em diante, os eventos chegaram individualmente e os 300 ms reapareceram: de 1373 a 1685 e de 3682 a 3986.)

E uma observação não explícita em nenhuma linha: «Actualizado a las…» não aparece, pois `dataUpdatedAt` permaneceu em `0`. Nenhum dado válido chegou a ser recebido. Se o servidor ficasse indisponível **após** uma carga com sucesso, o quinto estado ficaria visível: a lista com o aviso âmbar no topo.

### 4.6 Mutações e invalidação

Até aqui tudo foi leitura. Contudo, o detalhe de um serviço passa a ter um botão que **altera** algo no servidor: «Volver a revisar» solicita ao servidor de prática que verifique o serviço novamente. O servidor disponibiliza uma rota nova para isso, `POST /api/servicios/:nombre/reintento`, que sempre encontra o serviço recuperado: responde `200` com `{"nombre":"pagos","tipo":"disponible","codigoHttp":200,"duracionMs":95}` e, crucialmente, **atualiza o estado salvo**, de modo que o `GET /api/estados` subsequente já traz `pagos` em verde. (Também responde `404` se o serviço não existir, e a partir desta lição conta com a rota `POST /api/servicios` para cadastrar serviços, usada na Lição 7.)

Uma operação que altera dados no servidor é chamada de **mutação**, e no Query conta com um hook dedicado, `useMutation`. A fronteira de rede segue o mesmo padrão das outras duas: executa a requisição, confere o status e valida a estrutura.

```ts
// revisor/src/detalle/reintentar.ts
import { esEstadoPublico, type EstadoPublico } from "../compartido/contrato";

export async function reintentarServicio(nombre: string): Promise<EstadoPublico> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, {
    method: "POST",
  });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esEstadoPublico(cuerpo)) {
    throw new Error("la API no entregó un estado válido");
  }

  return cuerpo;
}
```

Para validar a resposta, usa-se `esEstadoPublico`, a função de validação (*type guard*) existente desde a Lição 0 e que até então não era exportada por `contrato.ts`, pois só era utilizada por `esReportePublico`. A única alteração em `contrato.ts` é a inclusão da palavra `export`, além da interface `NuevoServicio` necessária para o cadastro de serviços no servidor:

```ts
// revisor/src/compartido/contrato.ts (fragmento)
export function esEstadoPublico(valor: unknown): valor is EstadoPublico {
```

O hook é conciso, e cada linha tem uma razão de existir:

```ts
// revisor/src/detalle/useReintentar.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claves } from "../consultas/claves";
import { reintentarServicio } from "./reintentar";

export function useReintentar(nombre: string) {
  const clienteConsultas = useQueryClient();

  return useMutation({
    mutationFn: () => reintentarServicio(nombre),
    onSuccess: async () => {
      await Promise.all([
        clienteConsultas.invalidateQueries({ queryKey: claves.reporte }),
        clienteConsultas.invalidateQueries({ queryKey: claves.servicio(nombre) }),
      ]);
    },
  });
}
```

- **`useMutation` não executa sozinho.** Diferentemente de `useQuery`, que dispara a busca assim que é montado, uma mutação aguarda uma chamada explícita a `mutate()`. Uma leitura pode ser repetida sem efeitos colaterais; uma escrita, não, por isso só ocorre sob comando do usuário.
- **`useQueryClient()`** retorna a mesma instância de cliente que `main.tsx` colocou no provedor. É o canal para interagir com o cache a partir de um componente.
- **`onSuccess` invalida duas chaves.** `invalidateQueries` realiza duas ações: marca como obsoletas as consultas cuja chave corresponda ao padrão e, caso alguma esteja sendo renderizada no momento, dispara nova busca em segundo plano ([TanStack Query, «Query Invalidation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)). As duas chaves são `["reporte"]`, porque a lista mudou, e `["servicio", nombre]`, porque o detalhe também mudou.
- **`onSuccess` retorna uma promise** (é `async` e aguarda `Promise.all`). Isso determina quando a mutação é considerada concluída. O guia de invalidação em mutações destaca: retornar uma promise em `onSuccess` garante que os dados sejam atualizados antes do encerramento completo da mutação, mantendo `isPending` em `true` até a resolução dessa promise ([TanStack Query, «Invalidations from Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)). Sem o `await`, o botão voltaria a exibir «Volver a revisar» enquanto a tela ainda mostrasse os dados desatualizados.

Isso é o que o `revisor` não conseguia realizar na Lição 3 sem repassar funções entre componentes: `PanelDetalle` não sabe da existência de uma lista, onde ela fica nem quem a renderiza. Apenas sabe que, ao alterar um serviço, o dado sob `["reporte"]` deixa de ser confiável. O cache se encarrega de notificar quem estiver consumindo essa informação.

`PanelDetalle` integra as duas peças, a consulta e a mutação:

```tsx
// revisor/src/detalle/PanelDetalle.tsx
import { useQuery } from "@tanstack/react-query";
import { EditorNota } from "../reporte/EditorNota";
import { consultaDetalle } from "./consultas";
import { useReintentar } from "./useReintentar";

export function PanelDetalle({
  nombre,
  notaGuardada,
  alGuardarNota,
  alCerrar,
}: {
  readonly nombre: string;
  readonly notaGuardada: string;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
  readonly alCerrar: () => void;
}) {
  const consulta = useQuery(consultaDetalle(nombre));
  const reintento = useReintentar(nombre);

  return (
    <aside className="detalle" aria-label={`Detalle de ${nombre}`}>
      <h3>{nombre}</h3>
      {consulta.isPending && <p role="status">Cargando detalle…</p>}
      {consulta.isError && (
        <p role="alert">No se pudo cargar el detalle: {consulta.error.message}</p>
      )}
      {consulta.isSuccess && (
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
      )}
      <button type="button" disabled={reintento.isPending} onClick={() => reintento.mutate()}>
        {reintento.isPending ? "Revisando…" : "Volver a revisar"}
      </button>
      {reintento.isError && (
        <p role="alert">No se pudo volver a revisar: {reintento.error.message}</p>
      )}
      <EditorNota nombre={nombre} notaGuardada={notaGuardada} alGuardar={alGuardarNota} />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
```

O botão é desabilitado e tem o texto alterado para «Revisando…» enquanto `reintento.isPending` for verdadeiro, impedindo múltiplos envios do mesmo `POST` por cliques repetidos. Se a mutação falhar, `reintento.isError` exibe o alerta abaixo do botão. Observe ainda que a consulta de detalhe continua utilizando `isPending` e `isSuccess`, em vez de `isFetching`: enquanto o detalhe é buscado novamente após a invalidação, a tela preserva o dado anterior em vez de substituí-lo por um «Cargando detalle…».


#### 4.6.1 O que acontece ao clicar em «Volver a revisar», medido

Esta é a parte da lição que mais convém conferir visualmente e não aceitar apenas por teoria. Com o servidor no cenário normal e `npm run dev`, o programa que controla o Chrome selecionou `pagos`, aguardou o detalhe e clicou em «Volver a revisar». Foram anotadas cada requisição enviada para `/api/` e, a cada alteração, quatro aspectos da interface: a linha de `pagos` na lista, o status no detalhe, o botão e o rodapé. O horário do rodapé foi substituído por `HH:MM:SS` para facilitar a leitura. Este é o registro completo:

```text
  188 ms  red  → GET /api/estados
  190 ms  red  → GET /api/estados
  191 ms  red  ✗ GET /api/estados net::ERR_ABORTED
  499 ms  red  ← GET /api/estados 200
  551 ms  pantalla: lista dibujada
  557 ms  red  → GET /api/servicios/pagos
  557 ms  red  → GET /api/servicios/pagos
  557 ms  clic en «pagos»
  558 ms  red  ✗ GET /api/servicios/pagos net::ERR_ABORTED
  558 ms  pantalla: fila: pagos: falla (HTTP 503) | detalle: Cargando detalle… | botón: Volver a revisar | pie: Actualizado a las HH:MM:SS
 2061 ms  red  ← GET /api/servicios/pagos 200
 2070 ms  pantalla: fila: pagos: falla (HTTP 503) | detalle: En falla: HTTP 503 | botón: Volver a revisar | pie: Actualizado a las HH:MM:SS
 3110 ms  red  → POST /api/servicios/pagos/reintento
 3111 ms  clic en «Volver a revisar»
 3113 ms  pantalla: fila: pagos: falla (HTTP 503) | detalle: En falla: HTTP 503 | botón: Revisando… [deshabilitado] | pie: Actualizado a las HH:MM:SS
 3418 ms  red  ← POST /api/servicios/pagos/reintento 200
 3418 ms  red  → GET /api/estados
 3419 ms  red  → GET /api/servicios/pagos
 3428 ms  pantalla: fila: pagos: falla (HTTP 503) | detalle: En falla: HTTP 503 | botón: Revisando… [deshabilitado] | pie: Actualizado a las HH:MM:SS · actualizando…
 3723 ms  red  ← GET /api/estados 200
 3741 ms  pantalla: fila: pagos: disponible (HTTP 200, 95 ms) | detalle: En falla: HTTP 503 | botón: Revisando… [deshabilitado] | pie: Actualizado a las HH:MM:SS
 4940 ms  red  ← GET /api/servicios/pagos 200
 4965 ms  pantalla: fila: pagos: disponible (HTTP 200, 95 ms) | detalle: Disponible: HTTP 200 en 95 ms | botón: Volver a revisar | pie: Actualizado a las HH:MM:SS
```

E o log do servidor, da mesma execução:

```text
08:11:23.119 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
08:11:26.236 GET /api/estados cancelada por el cliente
08:11:26.539 GET /api/estados 200
08:11:26.599 GET /api/servicios/pagos cancelada por el cliente
08:11:28.100 GET /api/servicios/pagos 200
08:11:29.454 POST /api/servicios/pagos/reintento 200
08:11:29.761 GET /api/estados 200
08:11:30.962 GET /api/servicios/pagos 200
```

Acompanhe o registro a partir do clique em «Volver a revisar» (3111 ms):

- **O `POST` sai uma única vez** e o botão muda para «Revisando… [deshabilitado]» dois milissegundos depois. Essa é «a mutação na aba de rede»: um `POST`, sem duplicidade de `StrictMode`, pois não é disparado por um Effect, e sim por uma ação de clique.
- **Ao receber o status `200` (3418 ms), disparam-se no mesmo milissegundo dois `GET`**: `/api/estados` e `/api/servicios/pagos`. São as duas invalidações declaradas em `onSuccess`. Ninguém as programou como requisições explícitas; declarou-se apenas «este dado não é mais confiável», e o Query as converteu em requisições porque ambos os dados estavam ativos na tela.
- **Enquanto chegam, a tela não fica vazia.** Aos 3428 ms a lista ainda indica `falla (HTTP 503)`, o detalhe ainda indica `En falla` e o rodapé acrescenta «· actualizando…». É a quarta linha da figura 2, `success` + `fetching`, no painel real.
- **A lista se atualiza primeiro (3741 ms)**, pois `GET /api/estados` leva 300 ms. Durante 1.2 segundos a lista exibe `disponible` e o detalhe ainda exibe `En falla`: o detalhe de `pagos` demora 1.5 s de propósito, desde a Lição 3. São dois dados distintos no cache, cada um com o próprio ciclo de busca. A cena do início da lição — duas partes da tela relatando fatos divergentes — aqui dura apenas um segundo e se resolve por conta própria, sem depender de um clique manual em «Actualizar».
- **O botão só retorna para «Volver a revisar» aos 4965 ms**, momento em que o detalhe também foi recebido. É o efeito do `await Promise.all` em `onSuccess`: a mutação só é considerada finalizada quando ambas as consultas foram refeitas. O botão reflete com precisão o momento em que a tela está totalmente atualizada.

Há mais dois detalhes na parte superior do registro. Ao selecionar `pagos`, surge o par `cancelada` + `200` do detalhe: o `StrictMode` monta, desmonta e remonta `PanelDetalle`, e como `cargarDetalle` faz uso do `signal`, o Query cancela a primeira requisição. Além disso, o detalhe levou 1.5 s para responder, assim como na Lição 3, por ser a primeira requisição desse recurso. Ao fechar e abrir novamente antes de transcorridos cinco segundos, não há nova requisição: o dado está no cache e permanece fresco.

### 4.7 O que o Suspense não faz

Ao procurar como exibir «Cargando…» no React, a gente logo se depara com `<Suspense fallback={…}>`. A tentação comum é supor que envolver o painel em um `Suspense` fará o `fallback` aparecer automaticamente enquanto o relatório é buscado. Isso não acontece, e vale entender o motivo antes que isso custe horas de depuração.

O `Suspense` exibe o `fallback` apenas quando algo **dentro dele** suspende a renderização por não estar pronto. A documentação do React define o que se enquadra nessa condição: código de componentes carregados com `lazy`, promises lidas com o hook `use` (como dados originados de Server Components ou frameworks com suporte a Suspense), folhas de estilo com `precedence` declarada e certos fluxos de renderização no servidor ou transições. E adiciona um alerta essencial: **o Suspense não detecta dados requisitados dentro de Effects ou de manipuladores de eventos** ([React, «Suspense»](https://react.dev/reference/react/Suspense)). Como `useQuery` busca dados fora da renderização e notifica alterações pelo objeto retornado, colocar um `Suspense` em volta deste painel nunca ativaria o `fallback`: o painel renderizaria imediatamente com `isPending` em `true`.

O Query possui uma integração própria com o Suspense: um hook dedicado, `useSuspenseQuery`, que **suspende** a renderização enquanto não houver dados disponíveis. Nele, `data` é sempre definido, já que o carregamento e o erro **sem dados** são tratados pelo `Suspense` e pelo limite de erro que o envolvem ([TanStack Query, «Suspense»](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)). O mesmo guia ressalta que nem todo erro alcança o limite de erro: o erro só é lançado caso não existam dados a exibir. Se uma atualização falhar com um relatório já presente no cache, `useSuspenseQuery` continua renderizando o componente com `data` e com `isError` em `true`, mantendo o quinto estado («com dados e com erro») no próprio componente. É uma estratégia válida de composição, mas traz um custo didático para esta lição: os estados «carregando» e «erro sem dados» deixam de residir no componente, ficando fragmentados entre um `fallback` superior e um limite de erro mais acima. Para um painel cujo objetivo central é demonstrar com clareza o tratamento dos cinco estados, a escolha deste curso é mantê-los reunidos em `ContenidoReporte`. Por isso, o ponto de controle opta por não utilizar Suspense.

### 4.8 O limite de erro: a única classe do curso

Até este ponto, foram tratados erros **esperados**: a API retornou 503, a conexão caiu. Esses cenários são renderizados como estados de interface. Há, contudo, outra categoria de falha: um componente que, durante a renderização, dispara uma exceção. Um `undefined` imprevisto, um `.map` executado sobre algo que não é array. No React, uma falha desse tipo durante a renderização desmonta a árvore inteira: a tela fica em branco.

Para capturar esse tipo de falha existe o **Error Boundary**, denominado neste curso como `LimiteDeError`. A documentação do React orienta sua implementação: um componente que define `static getDerivedStateFromError`, invocado pelo React quando qualquer componente filho — mesmo em níveis profundos — lança um erro na renderização, permitindo renderizar uma interface de contingência em vez de tela branca; e, opcionalmente, `componentDidCatch`, para registrar a falha em um serviço de telemetria. A documentação esclarece também por que este curso, que não ensina componentes baseados em classe, abre aqui uma exceção: **atualmente não é possível escrever um Error Boundary como componente de função** ([React, «Component»](https://react.dev/reference/react/Component)).

```tsx
// revisor/src/compartido/LimiteDeError.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Propiedades {
  readonly children: ReactNode;
}

interface Estado {
  readonly error: Error | null;
}

// La única clase del curso: React todavía no ofrece una forma de función para
// atrapar los errores que ocurren al dibujar.
export class LimiteDeError extends Component<Propiedades, Estado> {
  state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  componentDidCatch(error: Error, informacion: ErrorInfo): void {
    console.error("error al dibujar", error, informacion.componentStack);
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div role="alert" className="limite-de-error">
          <h2>Algo salió mal al dibujar el panel</h2>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recargar la página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

A estrutura se divide em três partes:

- **`getDerivedStateFromError`** é estático: não acessa `this`, recebe apenas o erro lançado e retorna o novo estado. O React o executa durante a renderização, exigindo que seja uma função pura, como toda renderização (Lição 1).
- **`componentDidCatch`** é chamado posteriormente, após o término da reconciliação do React, permitindo operações com efeitos colaterais: neste exemplo, emitir no console o erro e o stack trace de componentes (*component stack*). Em um sistema de produção, seria o ponto de envio para ferramentas de monitoramento de erros.
- **`render`** exibe a mensagem de alerta em caso de falha, ou os componentes filhos em caso de normalidade. O botão recarrega a página completa: uma falha de renderização quase invariavelmente decorre de um defeito no código, sendo o reinício a ação mais recomendada. Note que o alerta renderiza `error.message` diretamente. Por ser inserido como texto filho em JSX, não gera brecha de XSS, mas expõe abertamente a mensagem bruta da exceção, podendo revelar detalhes internos da aplicação como nomes de propriedades, caminhos ou parâmetros de consultas. No painel didático isso auxilia a depuração; em uma aplicação aberta ao público, convém exibir um texto genérico, preservando os detalhes técnicos apenas para o log de `componentDidCatch`.

O que um Error Boundary **não** captura é tão importante quanto o que ele captura. De acordo com a documentação oficial: erros em manipuladores de eventos (um `onClick` que dispara exceção), código assíncrono (um `setTimeout`, uma promise sem tratamento), renderização no servidor e falhas ocorridas no próprio componente de limite de erro. Uma exceção a essa regra, abordada na [Lição 7](07-formularios-accesibilidad.md), são erros disparados no interior de transições, como ações de formulário, que alcançam o Error Boundary. Isso esclarece a divisão de papéis neste painel: falhas em `fetch` não constituem erros de renderização, mas estados normais de rede, tratados pelo Query; o Error Boundary existe para acolher exceções imprevistas de código.

Onde posicioná-lo? Em `main.tsx`, do lado de **fora** do `QueryClientProvider`, envolvendo a aplicação por completo. Dessa forma, captura também falhas no provedor ou em qualquer elemento abaixo dele. A figura 3 de «O erro que vai aparecer» demonstra o erro mais clássico ao utilizar o Query, e como esse limite o converte em mensagem explicativa em vez de uma tela vazia.

### 4.9 O percurso completo

Utilizam-se dois terminais, como na Lição 0. No primeiro, inicia-se o servidor de prática, que a partir desta lição informa em qual cenário começou:

```text
08:11:23.119 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
```

No segundo terminal, executa-se `npm run dev` e abre-se `http://localhost:5173/`. Deve-se ver a lista de quatro serviços, o resumo «4 servicios revisados · 2 servicios con falla», a linha «Actualizado a las…» e, a cada dez segundos, um aviso breve «· actualizando…» no rodapé. Selecione `pagos`, aguarde o detalhe e clique em «Volver a revisar»: a linha fica verde, em seguida o detalhe se atualiza e o botão retorna ao texto original. É a sequência documentada em 4.6.1.

Em seguida, compile e execute a versão final de produção, mantendo o servidor ligado: `npm run build` e `npm run preview`, acessando `http://localhost:4173/`. Este foi o registro do log quando o Chrome acessou essa versão:

```text
08:13:08.422 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
08:13:10.768 GET /api/estados 200
```

Uma única requisição. Sem o `StrictMode`, não ocorre a dupla montagem inicial e a consulta é executada apenas uma vez. E a tela exibe o título da aba como `(2) Revisor`:

```text
Revisor
Estado de los servicios
 Solo fallas

4 servicios revisados · 2 servicios con falla

catálogo: disponible (HTTP 200, 42 ms)
pagos: falla (HTTP 503)
inventario: disponible (HTTP 200, 118 ms)
reportes: falla (tiempo límite agotado)

Actualizado a las 2:13:10 a.m.

Actualizar
```

Encerre os processos com Ctrl+C. Para finalizar, executa-se a verificação padrão de integridade do projeto: `npm ci`, `npm run lint` e `npm run build`, os três concluindo com código de saída 0. O linter não emite nenhum aviso, e a compilação gera o mesmo nome de arquivo obtido no macOS e no Linux durante os testes do curso, `index-BzO-N0-M.js`.

## O erro que vai aparecer

A lição apresenta um erro principal, cometido comumente no primeiro contato com o Query, e um erro auxiliar, apontado diretamente pelo TypeScript.

**O erro principal: falta o provedor.** O hook `useQuery` requer uma instância de `QueryClient`, buscando-a no `QueryClientProvider` mais próximo acima na hierarquia. Se nenhum provedor for encontrado — por esquecimento ao envolver a árvore de componentes ou ao montar um componente isolado em testes —, `useQuery` dispara um erro **durante a renderização**. A terceira figura reproduz esse caso intencionalmente, utilizando um limite de erro baseado no padrão de `LimiteDeError` e instruindo o React a relatar erros capturados (`onCaughtError`):

```tsx
// fig04_03.tsx
import { useQuery } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// El mismo patrón que LimiteDeError del revisor, reducido a lo indispensable.
class Limite extends Component<{ readonly children: ReactNode }, { readonly error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      return <p role="alert">Algo salió mal al dibujar el panel: {this.state.error.message}</p>;
    }

    return this.props.children;
  }
}

function Panel() {
  const consulta = useQuery({ queryKey: ["reporte"], queryFn: async () => ["catálogo"] });
  return <p>{consulta.data?.length ?? 0} servicios</p>;
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor, {
  onCaughtError: (error) => console.log(`React atrapó: ${error instanceof Error ? error.message : error}`),
});

// Falta <QueryClientProvider> alrededor de <Panel />.
await act(async () =>
  raiz.render(
    <Limite>
      <Panel />
    </Limite>,
  ),
);
console.log(`En pantalla: ${contenedor.textContent}`);

await act(async () => raiz.unmount());
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig04_03.tsx
$ node fig04_03.js
React atrapó: No QueryClient set, use QueryClientProvider to set one
En pantalla: Algo salió mal al dibujar el panel: No QueryClient set, use QueryClientProvider to set one
```

A mensagem é autoexplicativa: «nenhum `QueryClient` foi configurado; use `QueryClientProvider` para definir um». E nota-se o papel desempenhado pelo limite de erro: em vez de tela branca, uma mensagem é exibida. Sem o limite, o React teria desmontado a árvore completa e lançado o erro como não tratado no console. A correção consiste em assegurar o `QueryClientProvider` em `main.tsx`. Nos testes da Lição 8, essa mesma restrição motiva a criação de uma função auxiliar que monta componentes já envolvidos no provedor.

**O erro auxiliar: consumir `data` antes de verificar sua existência.** Em `ContenidoReporte`, experimente remover o primeiro `if`, o de checagem de `isPending`, e verifique a tipagem. O teste foi executado em uma cópia do código:

```text
$ npx tsc -b
src/reporte/ContenidoReporte.tsx(35,11): error TS2339: Property 'estados' does not exist on type 'ReportePublico | undefined'.
src/reporte/ContenidoReporte.tsx(42,32): error TS7006: Parameter 'estado' implicitly has an 'any' type.
```

Sem esse `if`, `consulta.data` pode ser `undefined` — exatamente o estado `pending` — e o TypeScript impede o acesso às suas propriedades. O segundo erro decorre do primeiro: sem conhecer a estrutura de `estados`, a tipagem de cada `estado` não pode ser inferida. O grande benefício é que esse alerta surge **antes** da execução: no navegador, essa omissão geraria um `TypeError` na renderização inicial, caindo diretamente no Error Boundary de 4.8. A solução não é recorrer a `consulta.data!.estados` nem a `consulta.data?.estados ?? []`: o primeiro mascara o problema, e o segundo converte um estado de «dado ainda não disponível» em «não há serviços cadastrados», que representa o quarto estado e tem significado completamente distinto. A solução correta é renderizar explicitamente a condição `pending`.

## O que se faz de errado

**Copiar os dados do Query para um `useState`.** Escrever `const [reporte, establecerReporte] = useState(consulta.data)` acompanhado de um Effect de sincronização. É um vício comum de quem migra do modelo de busca manual. O resultado são duas cópias do mesmo dado, uma delas desatualizada, recriando exatamente o tipo de Effect que a Lição 3 ensinou a evitar. Leia `consulta.data` diretamente onde for necessário.

**Instanciar o `QueryClient` dentro de um componente.** Cada ciclo de renderização gerará um cache novo e vazio: perdem-se a deduplicação, a retenção de dados ao alternar telas e todas as vantagens mostradas na figura 1. A criação deve ocorrer no nível do módulo, em `main.tsx`, ou em uma função executada uma única vez.

**Omitir da chave variáveis utilizadas pela função de busca.** Definir `queryKey: ["servicio"]` para uma função que consome `nombre` faz com que todos os detalhes compartilhem a mesma entrada no cache. O linter não detecta essa falha. A regra: tudo o que a função utiliza deve compor a chave.

**Tratar `isFetching` como sinônimo de carregamento inicial.** Ocultar a lista sempre que `isFetching` for verdadeiro fará a tela esvaziar a cada dez segundos, a cada execução do polling. O carregamento inicial é representado por `isPending`; `isFetching` serve, no máximo, para exibir um indicador sutil de atualização.

**Exibir apenas erro e descartar dados anteriores.** Quando `status` é `error`, mas `data` existe, há informação útil a ser apresentada. Um painel de monitoramento que fica em branco por causa de uma falha momentânea de rede é pior do que um que informa «estes dados são de um minuto atrás».

**Esquecer o estado vazio.** Uma lista sem itens é visualmente idêntica a uma tela com falha. Uma frase simples como «No hay servicios configurados todavía.» custa apenas uma linha de código.

**Disparar invalidação diretamente no manipulador após `mutate()`.** Chamar `invalidateQueries` logo após `mutate()` dentro do `onClick` invalida a consulta **antes** da resposta do servidor: a lista será requisitada novamente e poderá retornar ainda o dado desatualizado. A invalidação deve ocorrer em `onSuccess`, executado quando a alteração já foi confirmada.

**Aumentar `retry` na tentativa de compensar uma API instável.** Mais tentativas automáticas não tornam a API mais confiável: apenas aumentam o tempo que o usuário leva para ser notificado da instabilidade. Com o backoff exponencial, cada tentativa adicional soma segundos à espera em «Cargando…».

**Envolver `useQuery` com `Suspense` esperando ativação de `fallback`.** O `fallback` não aparece: `useQuery` não suspende a renderização. Para utilizar Suspense, deve-se adotar o hook específico, `useSuspenseQuery`, que redistribui o gerenciamento de estados.

**Usar Error Boundary para capturar falhas de rede.** Um `fetch` sem sucesso é um estado esperado de aplicação, renderizado junto à interface com o respectivo botão de nova tentativa. O Error Boundary destina-se a exceções imprevistas de renderização.

## Exercícios

### Exercício 1 — Prever o log sem novas tentativas

Com o servidor em `ESCENARIO=caido`, o log de 4.5 registrou uma requisição cancelada e três códigos `503`. **Antes de alterar o código**, deduza o que será registrado se em `cliente.ts` o valor de `retry: 2` for alterado para `retry: 0`, e quanto tempo levará para o alerta surgir. Depois, confira com `npm run dev` e restaure o valor `2` ao concluir.

### Exercício 2 — Sem `staleTime`

Em `fig04_01.tsx`, remova a linha `staleTime: 5_000,` de `ConteoConQuery`. Deduza o que muda nas três linhas do bloco do Query: chamadas ao abrir, conteúdo imediato ao retornar e chamadas ao retornar. Compile e execute o arquivo.

### Exercício 3 — Invalidar apenas o detalhe

Em `useReintentar.ts`, mantenha em `Promise.all` apenas a invalidação de `claves.servicio(nombre)`. Antes de testar, deduza o que a **lista** exibirá após clicar em «Volver a revisar» no serviço `pagos`, e em que momento ela será atualizada. Qual elemento da cena do início da lição reaparece? Restaure o arquivo ao terminar.

### Exercício 4 — A chave que esqueceu o nome

Em `src/detalle/consultas.ts`, altere `queryKey: claves.servicio(nombre)` para `queryKey: ["servicio"]`. Abra o detalhe de `pagos`, espere carregar e, antes de passarem cinco segundos, selecione `catálogo`. O que aparece no detalhe sob o título «catálogo»? O linter ou o TypeScript emitiram algum aviso? Explique qual regra de 4.3.1 foi violada. Restaure o arquivo ao concluir.

## Soluções

### Solução 1

Com `retry: 0`, o Query não realiza novas tentativas: o log registra o par do `StrictMode` e **um único** `503`, isto é, `GET /api/estados cancelada por el cliente` seguido de `GET /api/estados 503`. O alerta surge assim que essa resposta chega, cerca de 300 ms após a abertura da página, em contraste com os quatro segundos observados com `retry: 2`. Essa dedução decorre de dois pontos medidos: cada `503` em 4.5 corresponde a uma tentativa, e os intervalos de 1 e 2 segundos entre eles correspondem às esperas de repetição, inexistentes com zero repetições. Se na execução local a linha `cancelada` não aparecer, deve-se ao comportamento explicado na Lição 0: depende de a conexão ter alcançado o servidor antes do cancelamento pelo cliente. Zero repetições tem seu contraponto: qualquer oscilação momentânea de rede converte-se instantaneamente em alerta na tela. Por isso o curso adota `2` em vez de `0`.

### Solução 2

Esta é a saída real da execução da figura sem essa linha:

```text
a mano, un Effect por componente:
  al abrir:          2 llamada(s) a la API
  al volver, de inmediato se ve: «cargandocargando»
  al volver:         2 llamada(s) a la API
con TanStack Query, misma clave:
  al abrir:          1 llamada(s) a la API
  al volver, de inmediato se ve: «4 servicios4 servicios»
  al volver:         1 llamada(s) a la API
```

Altera-se um único número: **ao retornar, ocorre uma chamada**. Ao abrir, continua ocorrendo apenas uma chamada, pois a deduplicação não depende de `staleTime`. E ao retornar, «4 servicios» continua visível imediatamente, pois o dado segue presente no cache (retido por `gcTime`, não por `staleTime`). A mudança reside em que, com `staleTime` em `0`, o dado já é considerado obsoleto; logo, o Query o apresenta **e** dispara nova busca em segundo plano, em chamada única para ambos os componentes. Trata-se do padrão *stale-while-revalidate* («exiba o que tem enquanto revalida»): o usuário não visualiza carregamentos desnecessários e os dados se sincronizam sozinhos. `staleTime` não determina se há cache; determina quando vale a pena revalidá-lo.

### Solução 3

A lista **continua exibindo `pagos: falla (HTTP 503)`** mesmo após o detalhe já indicar «Disponible». Ela só se alinhará no polling seguinte de `refetchInterval`, em até dez segundos, ou antes caso a janela perca e recupere o foco (já que o dado da lista se torna obsoleto após cinco segundos e `refetchOnWindowFocus` está ativo). É a cena de abertura da lição: o detalhe e a lista contando versões diferentes para o mesmo serviço. Não há erro sintático nem aviso do linter; falta apenas comunicar ao cache que o dado sob `["reporte"]` também foi alterado. A invalidação descreve **quais dados são afetados por uma operação de escrita**, sendo essa relação de dependência responsabilidade de quem programa a mutação. No log a constatação é direta: após o `POST`, surge apenas um `GET`, o do detalhe.

### Solução 4

Sob o título «catálogo», é renderizado o detalhe **de `pagos`**: «En falla: HTTP 503». Ao definir `["servicio"]` como chave comum, os detalhes de todos os serviços passam a compartilhar a mesma entrada no cache. Ao clicar em `catálogo`, `PanelDetalle` é remontado (devido à prop `key={seleccionado}` em `ContenidoReporte`) e consulta a chave `["servicio"]`; o Query localiza ali os dados de `pagos`, ainda considerados frescos pelos cinco segundos de `staleTime`, e os devolve sem emitir requisição. Passados esses cinco segundos, em uma remontagem posterior uma nova requisição seria disparada trazendo `catálogo`, mas com exibição prévia incorreta. Nem o linter nem o TypeScript acusam problema: a chave é um array válido e a tipagem do dado é compatível, apenas pertence a outro registro. Violou-se a regra de 4.3.1: «se a função depende de uma variável, essa variável precisa estar na chave»: como `cargarDetalle(nombre, signal)` recebe `nombre`, o valor de `nombre` precisa compor a chave. Trata-se do equivalente, no Query, à omissão de dependências em Effects vista na Lição 0, com uma advertência: aqui não há `exhaustive-deps` emitindo alertas.

## Como saber se deu certo

- [ ] `npm ls @tanstack/react-query`, executado dentro de `~/curso-react/revisor/`, imprime `@tanstack/react-query@5.104.5`, e em `src/` não existem mais `useReporte.ts` nem `useDetalle.ts`.
- [ ] `npm run lint` encerra sem relatar nenhum problema, e `npm run build` termina com `✓ built` gerando em `dist/assets/` o arquivo `index-BzO-N0-M.js`: se o código estiver rigorosamente alinhado ao ponto de controle, o nome coincide.
- [ ] `node fig04_01.js` imprime `1 llamada(s)` ao abrir e `0 llamada(s)` ao retornar no bloco do Query, sabendo-se explicar a razão de cada número.
- [ ] Com `ESCENARIO=vacio`, o painel exibe «No hay servicios configurados todavía.»; com `ESCENARIO=caido`, exibe o alerta com «Reintentar» e o log registra três códigos `503` (além de, se houver tempo de conexão, uma linha `cancelada por el cliente` anterior).
- [ ] No cenário normal, ao clicar em «Volver a revisar» no serviço `pagos`, o log registra um `POST /api/servicios/pagos/reintento 200` seguido de um `GET /api/estados 200` e um `GET /api/servicios/pagos 200`, com a linha de `pagos` passando para verde sem necessidade de clicar em «Actualizar».
- [ ] É possível listar as cinco combinações de `status` e `fetchStatus` da figura 2 e apontar qual renderiza «· actualizando…» no rodapé.
- [ ] Com `npm run preview`, a abertura da página gera uma única requisição `GET /api/estados` no log.
- [ ] Ao remover temporariamente o `QueryClientProvider` de `main.tsx` (restaurando-o em seguida), visualiza-se a mensagem de `LimiteDeError` em vez de tela em branco.
- [ ] Foram anotadas no [diário de bordo](bitacora.md) a quantidade de requisições manuais versus as realizadas pelo Query, um comportamento automático do Query que chamou a atenção e as situações em que foi vantajoso utilizar um `staleTime` diferente de zero.

## Resumo

Responda sem consultar a lição:

1. De acordo com o planejamento do curso, buscar dados manualmente não escala por três motivos: cache, cascatas e condições de corrida. O que a documentação do React pontua sobre cada um, e como o Query resolve cada um? Qual deles foi demonstrado pela figura 1?
2. Por que o `QueryClient` deve ser instanciado em `main.tsx` e não dentro de um componente? O que ele armazena?
3. O que é uma chave de consulta e qual regra previne que dados distintos compartilhem a mesma entrada no cache?
4. Quem passa a instanciar o `AbortController`, e em que circunstâncias o Query cancela o `signal`?
5. Qual pergunta é respondida por `status` e qual por `fetchStatus`? Qual combinação representa «existem dados e uma nova busca está acontecendo»?
6. Quais são os quatro estados de uma consulta, e qual é o quinto estado possibilitado pela existência do cache?
7. Qual é o papel de `staleTime`, `retry` e `refetchInterval` neste painel? Por que surgem três `503` no log ao configurar `retry: 2`?
8. O que faz `invalidateQueries` e por que essa chamada deve ficar em `onSuccess`? Por que o botão preserva o texto «Revisando…» até a conclusão do detalhe?
9. Por que um `Suspense` em volta de `useQuery` não ativa o `fallback`?
10. Quais erros são capturados por um Error Boundary, quais ficam de fora, e por que ele é estruturado como classe?

## Para ler mais

- [React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects), seção «What are good alternatives to data fetching in Effects?»: desvantagens de buscar dados em Effects (ausência de suporte em servidor, cascatas, falta de cache, ergonomia deficiente) e a recomendação de caches no cliente. Consultado em 21 de outubro de 2026.
- [React, «Suspense»](https://react.dev/reference/react/Suspense): elementos que acionam limites de Suspense e a ressalva de que não monitora buscas feitas em Effects ou manipuladores de eventos. Consultado em 21 de outubro de 2026.
- [React, «Component»](https://react.dev/reference/react/Component), seção «Catching rendering errors with an Error Boundary»: `getDerivedStateFromError`, `componentDidCatch`, exceções não capturadas e a razão da inexistência de equivalente em funções. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Important Defaults»](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults): `staleTime` zerado, `gcTime` de cinco minutos, três tentativas automáticas e atualizações na montagem, foco e reconexão. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Queries»](https://tanstack.com/query/latest/docs/framework/react/guides/queries): distinção entre `status` e `fetchStatus` e os possíveis valores. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Query Keys»](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys): chaves como arrays serializáveis e a regra de inclusão das variáveis da função de busca. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Query Options»](https://tanstack.com/query/latest/docs/framework/react/guides/query-options): uso de `queryOptions` para compartilhar chave e função com inferência de tipos. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): o `AbortSignal` repassado a cada função e as condições de cancelamento. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Query Retries»](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries): quantidade de novas tentativas e backoff exponencial de 1 até 30 segundos. Consultado em 21 de outubro de 2026.
- [TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery): `refetchInterval`, `refetchIntervalInBackground`, `dataUpdatedAt`, `isFetching`, `isPending` e `refetch`. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations): funcionamento de `useMutation`, os estados e funções com retorno de promises. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Query Invalidation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation): comportamento de `invalidateQueries` e correspondência por prefixo de chave. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Invalidations from Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations): retorno de promises em `onSuccess` e retenção de `isPending` em `true`. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Suspense»](https://tanstack.com/query/latest/docs/framework/react/guides/suspense): `useSuspenseQuery`, garantia de dado definido e propagação de erros ao Error Boundary. Consultado em 21 de outubro de 2026.
- [npm, «npm install-scripts»](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts): bloqueio preventivo de scripts de instalação e procedimentos de auditoria e aprovação. Consultado em 21 de outubro de 2026.
- [npm, `@tanstack/react-query`](https://www.npmjs.com/package/@tanstack/react-query): versão 5.104.5, publicada em 19 de outubro de 2026. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| estado do servidor | cópia, na interface, de um dado residente em outro computador: leva tempo para chegar, pode falhar e envelhece |
| cache | local, externo aos componentes, onde o Query armazena respostas do servidor, indexadas por chave |
| chave de consulta | array que identifica univocamente um dado no cache, como `["servicio", "pagos"]` |
| deduplicação (*deduplication*) | compartilhamento de uma única requisição quando múltiplos componentes solicitam a mesma chave ao mesmo tempo |
| fresco / velho (*stale*) | dado considerado fresco durante `staleTime`; após isso, continua visível, mas é revalidado quando necessário |
| `status` / `fetchStatus` | presença de dados (`pending`, `error`, `success`) / estado de execução da busca (`fetching`, `paused`, `idle`) |
| mutação | operação que realiza alterações de dados no servidor; no Query, `useMutation`, acionada apenas via `mutate()` |
| invalidar | marcar consultas de uma chave como obsoletas e disparar nova busca para as que estiverem ativas na tela |
| estado vazio | resposta válida sem registros, que a interface deve distinguir de carregamento e de falha |
| Error Boundary (limite de erro) | componente de classe que captura exceções lançadas por seus descendentes na renderização, exibindo interface de contingência |

---

**Seguinte:** [Lição 5 — Rotas e a URL como estado](05-rutas-url-como-estado.md)
