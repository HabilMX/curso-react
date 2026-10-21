# Lição 5 — Rotas e a URL como estado

*São 23h10 e o plantão é nosso. Às 23h04, `pagos` começou a falhar, e a pessoa de operação que acompanha o incidente escreve pelo chat: «pode me passar o painel já filtrado, só com o que está falhando?». A gente cola o endereço que está no navegador. Ela abre e vê os quatro serviços, sem filtro, porque a caixa «Solo fallas» vivia na memória da nossa aba, e não no endereço. A gente explica por escrito: «marque a caixa e depois clique em pagos». Ela faz isso, vê o detalhe e, para ter dados atualizados, aperta F5. O navegador responde com uma página de erro do servidor: `404 File not found`. Às 23h12 ela liga para perguntar se o painel também caiu. Não caiu. Faltavam duas coisas: um endereço que diga o que se está vendo e um servidor que saiba o que responder quando alguém recarrega esse endereço. Esta lição constrói as duas.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 5.2 e 5.3)

**O que se constrói:** o `revisor` com três telas que podem ser linkadas: a lista em `/`, o detalhe de cada serviço em `/servicios/:nombre` e uma página «não encontrada» para qualquer outro endereço; os filtros «Solo fallas» e «Buscar por nombre» viajam no endereço (`?fallas=1&q=pag`), e as notas sobrevivem às idas e vindas entre telas; e se uma página quebra ao renderizar, o painel mostra o próprio aviso, e não uma página de erro em inglês

**O que se aprende:** rotas como objetos com `createBrowserRouter`, aninhadas com `<Outlet />`; parâmetros de rota com `useParams` e de busca com `useSearchParams`; um filtro que se compartilha copiando o link; `Link` e `NavLink`; o error boundary de uma rota com `ErrorBoundary` e `useRouteError`; **o que acontece quando alguém recarrega uma rota do cliente e por que o servidor deve responder `index.html`**

**De onde a gente vem.** Da [Lição 4](04-estado-del-servidor.md). O `revisor` já busca os dados com TanStack Query: o relatório é pedido com `useQuery`, guardado em cache, atualizado em segundo plano a cada 10 segundos e tem seus quatro estados mais um (carregando, erro, vazio, com dados, e dados antigos com aviso). O detalhe de um serviço aparece abaixo da lista, em um `PanelDetalle`, ao clicar no nome dele, e o botão «Volver a revisar» é uma mutação que invalida o relatório e o detalhe. Tudo isso vive em uma única tela, governada pelo componente `Panel`, que guarda três estados com `useState`: `soloFallas`, `seleccionado` e `notas`. O ponto de partida é o ponto de controle [`programas/04-estado-del-servidor/revisor/`](../programas/04-estado-del-servidor/revisor).

**O que esta lição não faz.** Não mexe no servidor de prática: ele continua na versão C, a mesma da lição 4, com as mesmas rotas. Não usa os *loaders* nem as *actions* do React Router: os dados continuam vindo do TanStack Query, por motivos explicados em 5.1. Não move as notas para um contexto do React: elas sobem um nível, para o layout das rotas, e a [Lição 6](06-reducer-contexto.md) discute se esse é o lugar definitivo delas. Não acrescenta a tela de cadastro, que chega com sua rota `/servicios/nuevo` na [Lição 7](07-formularios-accesibilidad.md). Não testa as rotas com um roteador em memória dentro de uma suíte: isso é a [Lição 8](08-pruebas-de-componentes.md), embora as figuras desta lição já usem esse roteador. E não escreve o servidor que publica `dist/` com reescrita: esta lição demonstra por que ele é necessário; a [Lição 9](09-rendimiento-publicacion.md) o escreve.

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas do `package.json` desta lição, e com Python 3.12 para o servidor estático de 5.3. O ponto de controle foi instalado do zero com `npm ci`; `npm run lint` e `npm run build` terminaram bem e produziram `dist/assets/index-CLDgPzLo.js`, o mesmo nome que o ponto de controle deu ao ser verificado em um contêiner Linux (Debian 12, imagem `node:24.22.0-bookworm`). Nada foi executado em um Linux Mint real; nada do que se mostra depende do sistema. No macOS, `npm ci` imprime um aviso de `install-scripts` sobre `fsevents@2.3.3`: é uma dependência opcional que só é instalada no macOS para observar arquivos, não precisa ser aprovada e no Mint não vai aparecer. O que se vê «no navegador» foi medido com o Chrome *headless* (`--headless --dump-dom`) contra `vite preview`, com a opção `--virtual-time-budget`, que adianta os relógios da página para não esperar de verdade: por isso os horários do registro do servidor de prática (em UTC) não servem para medir demoras nesta lição, só para contar requisições. As execuções do error boundary (5.1.6, exercício 3) e as de `curl` de 5.3 foram feitas com a API de prática na porta 3199 e com `vite preview` e o servidor Python na 4199, porque na máquina das execuções as portas de sempre estavam ocupadas por outros processos; a lição as mostra com as portas do curso (3100, 4173 e 4190), que é a única coisa que muda. As figuras foram executadas com seu próprio `package.json` em [`programas/05-rutas-url-como-estado/`](../programas/05-rutas-url-como-estado), ao lado de `revisor/`; os caminhos longos são mostrados a partir de `~/curso-react`.

## Ao terminar, vai ser possível

- Declarar as rotas de uma aplicação como um array de objetos (`RouteObject[]`), aninhá-las sob um layout com `<Outlet />` e prever que componente cada endereço renderiza, inclusive um que não existe.
- Ler um parâmetro de rota com `useParams`, explicar por que o TypeScript o tipa como `string | undefined` e comprovar que ele chega decodificado (`cat%C3%A1logo` → `catálogo`).
- Guardar filtros no endereço com `useSearchParams`, explicar com uma figura a diferença entre `replace: true` e uma navegação normal para o botão «Voltar», e compartilhar um filtro copiando o link.
- Usar `Link` e `NavLink`, e apontar no HTML o `aria-current="page"` e a classe `active` que o `NavLink` coloca.
- Explicar por que um componente de rota preserva seu estado quando só o parâmetro muda, e reiniciá-lo com `key`.
- Explicar por que o `LimiteDeError` da lição 4 deixa de ver os erros das páginas quando o roteador entra, provocar o `Unexpected Application Error!` e declarar um `ErrorBoundary` na rota raiz que mostre o mesmo aviso.
- Demonstrar com `curl` que um servidor estático sem reescrita responde 404 ao recarregar `/servicios/pagos`, e que `vite preview` responde `index.html`.

## O porquê antes do como

O `revisor` da lição 4 funciona, mas tem **um único endereço**: `http://localhost:5173/`. Todo o resto — se há um filtro ativo, que serviço foi escolhido, que nota foi escrita — vive dentro da aba, no estado de `Panel`. Basta fazer quatro perguntas a essa tela para enxergar as lacunas.

**Dá para enviar o que se está vendo?** Não. O endereço é sempre o mesmo, então quem o abre vê a lista completa, sem filtro e sem nenhum serviço escolhido. Para «enviar» uma visão, é preciso enviar instruções. É a cena do começo.

**O botão «Voltar» funciona?** Também não. Ao escolher `pagos` e depois `inventario` e apertar «Voltar», o navegador não volta para `pagos`: sai do painel, porque para ele nunca houve mais de uma página. A pessoa usa o botão que mais usa na vida e a aplicação faz algo que ela não esperava.

**O que acontece ao recarregar?** Perde-se tudo o que não estava no endereço: o filtro e o serviço escolhido voltam ao valor inicial. Em uma tela de plantão, onde recarregar é um reflexo, isso significa refazer os cliques toda vez.

**Como ela cresce?** Na lição 7 chega uma tela de cadastro. Com um único endereço, `Panel` teria de decidir com cada vez mais `if` o que renderizar, e cada tela nova seria outro ramo de estado que alguém esquece de reiniciar.

As quatro perguntas têm a mesma resposta: **o que a pessoa está vendo precisa estar escrito no endereço.** O endereço é estado, igual a um `useState`, com três vantagens que nenhum `useState` tem: pode ser copiado, o navegador guarda seu histórico (é por isso que existe «Voltar») e sobrevive a uma recarga. E tem uma consequência fácil de esquecer: se o endereço `/servicios/pagos` pode ser copiado, alguém vai colá-lo em um navegador recém-aberto, e esse navegador vai pedi-lo **ao servidor**, que nunca ouviu falar de `pagos`.

A ferramenta para o primeiro ponto é um **roteador**: uma peça que lê o endereço, decide que componentes renderizar e muda o endereço sem recarregar a página quando a pessoa navega. O curso usa o **React Router**, na versão 8.5.0, e o instala como um único pacote, `react-router`: a versão 8 deixou de publicar `react-router-dom`, o pacote que aparece em tutoriais antigos, e as peças próprias do navegador agora são importadas de `react-router/dom` ([React Router, «Upgrading from v7»](https://reactrouter.com/upgrading/v7)). O mesmo guia fixa o que ele exige: Node 22.22 ou superior e React 19.2.7 ou superior; o curso usa Node 24 e React 19.3.1. Para o segundo ponto não é preciso nenhuma biblioteca, e sim entender o que o navegador pede ao servidor e o que este deve responder; isso é 5.3.

A lição tem três partes, uma por conceito: as rotas como objetos, o layout que as envolve e o error boundary que as protege (5.1); os parâmetros e a busca, ou seja, o endereço como estado (5.2); e a recarga de uma rota do cliente (5.3). No final, isto é o que o `revisor` renderiza ao abrir `http://localhost:4173/?fallas=1` em um navegador novo, sem um único clique (mostra-se o título e o contêiner, tal como o Chrome *headless* os entregou):

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox" checked=""> Solo fallas</label><label>Buscar por nombre <input type="search" value=""></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="falla"><a href="/servicios/pagos" data-discover="true">pagos</a>: falla (HTTP 503)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul><p class="actualizado">Actualizado a las 2:14:52 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

A caixa já chega marcada (`checked=""`) e a lista traz só `pagos` e `reportes`. Ninguém a marcou: quem a marcou foi o endereço.

## Os conceitos

### 5.1 As rotas são objetos, e o layout as envolve

#### 5.1.1 Instalar o roteador, e em que modo usá-lo

A partir de `~/curso-react/revisor/`, com a versão exata que o curso fixa:

```bash
npm install --save-exact react-router@8.5.0
```

O `package.json` do ponto de controle fica assim; mudam a versão, que acompanha a lição, e a dependência nova:

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.5.0",
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
    "react-dom": "19.3.1",
    "react-router": "8.5.0"
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

O React Router pode ser usado de três maneiras, que a documentação chama de **modos** e que se empilham uma sobre a outra ([React Router, «Picking a Mode»](https://reactrouter.com/start/modes)). No **modo declarativo**, a aplicação é envolvida em um `<BrowserRouter>` e as rotas são escritas como componentes dentro da árvore. No **modo de dados**, as rotas são declaradas **fora** do React, como um array de objetos passado a `createBrowserRouter`, e renderizadas com `<RouterProvider>`; em troca, ganham-se *loaders*, *actions* e estados de navegação. E o **modo framework** envolve o de dados com um plugin do Vite que acrescenta convenções de arquivos, divisão de código e renderização no servidor.

O curso usa o modo de dados, mas não seus *loaders*. O motivo do primeiro é prático: um array de objetos pode ser **exportado**, e a lição 8 monta esse mesmo array em um roteador em memória para testar as telas sem navegador; as figuras desta lição já fazem isso. O motivo do segundo é que o `revisor` já resolveu na lição 4 como buscar dados: o TanStack Query guarda o cache, atualiza em segundo plano e compartilha uma consulta entre telas. Colocar também os *loaders* daria dois sistemas responsáveis pela mesma coisa. É um princípio do curso, não uma regra do React Router; em uma aplicação sem biblioteca de dados, os *loaders* são uma boa resposta. E o modo framework fica de fora pelo mesmo motivo que a lição 9 discute ao falar de frameworks: o curso quer que cada peça fique visível.

#### 5.1.2 As rotas do `revisor`

Este é o arquivo novo mais importante da lição. É um array de objetos, e cada objeto diz **que endereço** e **que componente**:

```tsx
// revisor/src/app/rutas.tsx
import type { RouteObject } from "react-router";
import { PaginaServicio } from "../detalle/PaginaServicio";
import { PaginaReporte } from "../reporte/PaginaReporte";
import { Disposicion } from "./Disposicion";
import { ErrorDeRuta } from "./ErrorDeRuta";
import { PaginaNoEncontrada } from "./PaginaNoEncontrada";

export const rutas: RouteObject[] = [
  {
    path: "/",
    Component: Disposicion,
    ErrorBoundary: ErrorDeRuta,
    children: [
      { index: true, Component: PaginaReporte },
      { path: "servicios/:nombre", Component: PaginaServicio },
      { path: "*", Component: PaginaNoEncontrada },
    ],
  },
];
```

Leia de fora para dentro, porque é assim que o React Router lê:

- **A rota de fora**, `path: "/"`, renderiza `Disposicion`: o cabeçalho, a navegação e o lugar onde vai a página. Todas as outras rotas são **filhas** dela (`children`), então o layout é sempre renderizado, seja qual for a página. A documentação diz assim: a rota do pai é acrescentada automaticamente à de cada filha, e as filhas são renderizadas no `<Outlet />` do pai ([React Router, «Routing»](https://reactrouter.com/start/data/routing)).
- **A rota índice**, `index: true`, não tem `path`: é a página renderizada no `<Outlet />` quando o endereço é exatamente o do pai, `/`. É o relatório.
- **`servicios/:nombre`** não começa com `/` porque é relativa ao pai: o endereço completo é `/servicios/:nombre`. Os dois-pontos marcam um **segmento dinâmico**: quando o endereço coincide, o que estiver nessa posição é entregue como o parâmetro `nombre`.
- **`*`** coincide com qualquer coisa que nenhuma irmã capturou. É a página «não encontrada».
- **`ErrorBoundary: ErrorDeRuta`** não é um endereço: diz o que renderizar se algo desta rota, ou das filhas dela, quebrar ao renderizar. É a última peça de 5.1 e tem sua própria seção, a 5.1.6.

Repare que as rotas usam `Component: PaginaReporte` e não `element: <PaginaReporte />`. As duas formas existem; com `Component` se passa o componente e o React Router o renderiza quando necessário, sem criar elementos de antemão. É a forma usada pelos exemplos atuais da documentação.

E a ordem? Poderia parecer que `*` precisa ir no final para não «engolir» as outras. Não é necessário: o React Router não testa as rotas na ordem em que foram escritas, mas as **classifica** pelo quanto são específicas: um segmento fixo vence um dinâmico, e um dinâmico vence `*`. A página da documentação que deveria explicar o algoritmo, [«Route Matching»](https://reactrouter.com/explanation/route-matching), está vazia nesta versão (consultada em 21 de outubro de 2026), então isso foi comprovado manualmente: com a função `matchRoutes` de `react-router` e três rotas declaradas ao contrário (`*`, depois `servicios/:nombre`, depois `servicios/nuevo`), `/servicios/nuevo` escolheu a fixa, `/servicios/pagos` a dinâmica e `/otra` o curinga. Mesmo assim, o curso as escreve da mais específica para a menos específica, porque assim se leem melhor. A lição 7 acrescenta `servicios/nuevo` logo antes de `servicios/:nombre` pelo mesmo motivo.

A primeira figura comprova essas quatro regras sem navegador. Monta uma árvore de rotas com a mesma forma da do `revisor`, com componentes que só escrevem o que são, e a renderiza com `createMemoryRouter`, o irmão de `createBrowserRouter` que guarda o endereço em memória em vez de lê-lo da barra do navegador:

```tsx
// fig05_01.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, Outlet, useLocation, useParams, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Disposicion() {
  return (
    <>
      [disposición] <Outlet />
    </>
  );
}

function Reporte() {
  return <>reporte</>;
}

function Servicio() {
  const { nombre } = useParams();
  return <>servicio «{nombre}»</>;
}

function NoEncontrada() {
  return <>no existe {useLocation().pathname}</>;
}

const rutas: RouteObject[] = [
  {
    path: "/",
    Component: Disposicion,
    children: [
      { index: true, Component: Reporte },
      { path: "servicios/:nombre", Component: Servicio },
      { path: "*", Component: NoEncontrada },
    ],
  },
];

for (const direccion of ["/", "/servicios/pagos", "/servicios/cat%C3%A1logo", "/servicios", "/servicios/pagos/extra"]) {
  const enrutador = createMemoryRouter(rutas, { initialEntries: [direccion] });
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  console.log(`${direccion.padEnd(26)} → ${contenedor.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_01.tsx
$ node fig05_01.js
/                          → [disposición] reporte
/servicios/pagos           → [disposición] servicio «pagos»
/servicios/cat%C3%A1logo   → [disposición] servicio «catálogo»
/servicios                 → [disposición] no existe /servicios
/servicios/pagos/extra     → [disposición] no existe /servicios/pagos/extra
```

Cinco endereços, cinco respostas, e nos cinco aparece `[disposición]`: a rota de fora é sempre renderizada. A terceira linha antecipa algo de 5.2: o endereço trazia `cat%C3%A1logo`, codificado, e o parâmetro chegou como `catálogo`. As duas últimas mostram que um segmento dinâmico é **exatamente um segmento**: `/servicios` (falta um) e `/servicios/pagos/extra` (sobra um) não coincidem com `servicios/:nombre`, e quem os captura é `*`.

#### 5.1.3 Criar o roteador uma única vez, fora do React

A inicialização muda pouco. `Panel` sai de `main.tsx` e no lugar dele entra o roteador:

```tsx
// revisor/src/main.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
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
      <QueryClientProvider client={clienteConsultas}>
        <RouterProvider router={enrutador} />
      </QueryClientProvider>
    </LimiteDeError>
  </StrictMode>,
);
```

Dois detalhes importam. O primeiro: **`createBrowserRouter(rutas)` é chamado uma única vez, ao carregar o módulo, fora de qualquer componente.** A documentação é explícita: os roteadores de dados não são guardados no estado do React; são criados uma vez fora da árvore e passados a `<RouterProvider>` ([React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter)). Se ele fosse criado dentro de um componente, cada render desse componente criaria um roteador novo, que começaria do zero. É a mesma ideia que a lição 0 cuidou com `cargarReporte`: o que deve ser sempre o mesmo é declarado no nível do módulo. E repare de onde vem cada peça: `createBrowserRouter` de `react-router`, e `RouterProvider` de `react-router/dom`, como indica o guia de instalação do modo de dados ([React Router, «Installation»](https://reactrouter.com/start/data/installation)).

O segundo detalhe é a **ordem dos envoltórios**. O cache do TanStack Query vive no objeto `clienteConsultas`, que `main.tsx` cria uma única vez; o `QueryClientProvider` só o coloca ao alcance dos componentes que estão abaixo dele. Colocando-o **fora** de `RouterProvider`, todas as páginas o alcançam: ao ir da lista para o detalhe, `PaginaReporte` desaparece, mas o relatório continua no cache, e ao voltar a lista pode ser renderizada com esses dados enquanto o Query decide se é preciso pedi-los de novo (o que a lição 4 chamou de `staleTime`). Se o provider ficasse dentro de `PaginaReporte`, `PaginaServicio` ficaria sem cliente e seu `useQuery` lançaria um erro. E se, além disso, o cliente fosse criado dentro da página, o cache de fato morreria toda vez que a página fosse desmontada.

O que significa «renderizar com o roteador do navegador»? `createBrowserRouter` muda o endereço com `history.pushState` e `history.replaceState`, duas funções do navegador que mudam o que a barra de endereços diz **sem pedir nada ao servidor**. A MDN diz assim sobre `pushState`: o navegador não tentará carregar esse endereço depois da chamada, mas pode tentar carregá-lo mais tarde, por exemplo depois de reiniciar ([MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)). Guarde essa frase, «pode tentar carregá-lo mais tarde», porque toda a seção 5.3 trata dela.

#### 5.1.4 O layout e o `<Outlet />`

O layout é o componente da rota de fora. Renderiza o que não muda entre páginas e deixa um espaço para o que muda:

```tsx
// revisor/src/app/Disposicion.tsx
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { conNota, type Notas } from "../reporte/notas";
import "../reporte/panel.css";
import type { ContextoNotas } from "./contextoNotas";

export function Disposicion() {
  const [notas, establecerNotas] = useState<Notas>({});

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
      </header>
      <main>
        <Outlet context={contexto} />
      </main>
    </>
  );
}
```

O `<Outlet />` é esse espaço. Quando o endereço é `/`, ali é renderizado `PaginaReporte`; quando é `/servicios/pagos`, `PaginaServicio`. O cabeçalho e a navegação não são montados de novo ao trocar de página: continuam sendo os mesmos componentes, com o mesmo estado. E é exatamente isso que se aproveita com as notas.

Na lição 2, as notas viviam em `Panel`, junto da lista e do detalhe, porque os dois precisavam delas. Agora a lista e o detalhe são **páginas diferentes**, e ao navegar de uma para a outra, a primeira é desmontada. Se as notas continuassem em `PaginaReporte`, uma nota escrita no detalhe de `pagos` sumiria: ao voltar para a lista, a marca «com nota» não estaria lá, porque o estado da lista foi destruído ao sair e criado vazio ao voltar. A regra da lição 2 continua valendo, só que com um nível a mais: **o estado sobe até o ancestral comum mais próximo de quem o usa**, e o ancestral comum das duas páginas é o layout.

Para passar o valor às páginas, o `<Outlet>` aceita uma prop `context`, e as páginas a leem com o hook `useOutletContext`. A documentação o apresenta justamente para este caso: as rotas pai muitas vezes gerenciam estado que querem compartilhar com as filhas, e isso é tão comum que vem integrado ao `<Outlet>`, sem precisar criar um contexto próprio ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)). A mesma página recomenda que, com TypeScript, o pai ofereça **um hook próprio** para lê-lo, porque assim quem consome tem o tipo correto e fica claro quem o usa. Isso é `contextoNotas.ts`:

```ts
// revisor/src/app/contextoNotas.ts
import { useOutletContext } from "react-router";
import type { Notas } from "../reporte/notas";

export interface ContextoNotas {
  readonly notas: Notas;
  readonly guardarNota: (nombre: string, texto: string) => void;
}

export function useNotas(): ContextoNotas {
  return useOutletContext<ContextoNotas>();
}
```

`useNotas()` é o único lugar do código que chama `useOutletContext`, e o único que diz ao TypeScript que forma esse valor tem. As páginas importam `useNotas` e não sabem de onde vêm as notas. Se na lição 6 as notas mudassem de lugar, só este arquivo mudaria.

Uma observação honesta sobre `Disposicion`: o objeto `contexto` e a função `guardarNota` são criados de novo a cada render. Isso significa que toda vez que o layout é renderizado de novo, a página que lê o contexto também é. Não é um problema que tenha sido medido, e o curso não faz memoização sem uma medição que a peça; a lição 9 ensina a medir isso.

#### 5.1.5 A página «não encontrada»

A rota `*` renderiza esta página:

```tsx
// revisor/src/app/PaginaNoEncontrada.tsx
import { Link, useLocation } from "react-router";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";

export function PaginaNoEncontrada() {
  const { pathname } = useLocation();
  useTituloDocumento("Página no encontrada · Revisor");

  return (
    <Tarjeta titulo="Página no encontrada">
      <p>No existe ninguna página en {pathname}.</p>
      <p>
        <Link to="/">Ir al reporte</Link>
      </p>
    </Tarjeta>
  );
}
```

`useLocation()` entrega o endereço atual; dele só interessa `pathname`, para dizer à pessoa que endereço não existe. A página é renderizada **dentro** do layout, então o cabeçalho e a navegação continuam ali: a pessoa tem por onde sair. E ela coloca o próprio título com o hook da lição 3. Isto foi o que o Chrome entregou para `/no-existe`:

```text
<title>Página no encontrada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Página no encontrada"><h2>Página no encontrada</h2><p>No existe ninguna página en /no-existe.</p><p><a href="/" data-discover="true">Ir al reporte</a></p></section></main></div>
```

#### 5.1.6 Quando uma página quebra: o error boundary das rotas

Há outro tipo de «página que não funciona», e convém distingui-lo do anterior: a que **existe**, mas lança um erro ao renderizar. Na lição 4, `LimiteDeError` foi escrito exatamente para isso: envolvia o `Panel` e, se algo quebrasse ao renderizar, em vez de uma tela em branco aparecia um aviso com a mensagem e um botão para recarregar. Em `main.tsx` ele continua ali, agora em volta de `RouterProvider`. Parece que nada mudou. Mudou, e a única forma de acreditar nisso é ver.

Para isso é preciso uma página que quebre. Em uma **cópia** do ponto de controle, nunca no original, acrescente a `PaginaReporte`, logo depois de `useTituloDocumento`, um erro disparado a partir do endereço:

```tsx
// en una copia: revisor/src/reporte/PaginaReporte.tsx (fragmento)
  if (filtros.texto === "romper") {
    throw new Error("la página se rompió al dibujar");
  }
```

Ele vai depois dos hooks, e não como primeira linha do componente, por um motivo já conhecido: com um `throw` antes de `useQuery`, os hooks de baixo seriam chamados «às vezes», e `react-hooks/rules-of-hooks` rejeita isso com um erro por hook (foi medido: quatro). Com `npm run build`, o servidor de prática e `npm run preview` rodando, abra `http://localhost:4173/?q=romper`. Isto foi o que o Chrome entregou com o código que o `revisor` tinha antes desta seção (o stack trace do erro, dez linhas com caminhos da máquina, é cortado com `…`):

```text
<title>Revisor</title>
<div id="raiz"><h2>Unexpected Application Error!</h2><h3 style="font-style: italic;">la página se rompió al dibujar</h3><pre style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);">Error: la página se rompió al dibujar
    at …</pre></div>
```

Nem sinal de `LimiteDeError`: nem o `role="alert"` dele, nem «Algo salió mal al dibujar el panel», nem o botão para recarregar. No lugar, uma página em inglês, com o stack trace do erro à vista de qualquer um, que o nosso código nunca renderizou. E com ela foram embora o cabeçalho e a navegação. É o que a pessoa de plantão da cena veria, às 23h10, se o painel tivesse um defeito.

O motivo: o React Router coloca **seu próprio error boundary em cada rota**. Quando uma página lança, o React procura para cima o boundary mais próximo, e o mais próximo já não é `LimiteDeError`: é o do React Router, que ficou entre o nosso boundary e a página. A documentação explica assim: os erros de uma rota são capturados automaticamente e o `ErrorBoundary` mais próximo é renderizado, e se uma rota não tem o seu, o erro sobe para a rota pai ([React Router, «Error Boundaries»](https://reactrouter.com/how-to/error-boundary)). Se nenhuma rota declara um, o React Router renderiza o seu padrão, que é o que acabou de aparecer. O erro nunca chega a `LimiteDeError`, porque alguém o capturou antes.

A figura 6 reproduz os dois casos sem navegador, com um layout mínimo e uma página que lança. Primeiro sem boundary próprio, e depois com um na rota raiz que lê o erro com `useRouteError`:

```tsx
// fig05_06.tsx
import { JSDOM } from "jsdom";
import { act, type ReactNode } from "react";
import { createMemoryRouter, Outlet, useRouteError, type RouteObject } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

// Los avisos de consola se esperan; aquí solo se cuentan.
let avisosDeConsola = 0;
console.error = () => {
  avisosDeConsola += 1;
};

function Disposicion() {
  return (
    <>
      <header>
        <h1>Revisor</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

function PaginaRota(): ReactNode {
  throw new Error("la página se rompió al dibujar");
}

function ErrorDeRuta() {
  const error = useRouteError();

  return (
    <div role="alert" className="limite-de-error">
      <h2>Algo salió mal al dibujar el panel</h2>
      <p>{error instanceof Error ? error.message : "error desconocido"}</p>
    </div>
  );
}

async function dibujar(titulo: string, raizDeRutas: RouteObject): Promise<void> {
  console.log(titulo);
  avisosDeConsola = 0;
  const enrutador = createMemoryRouter([raizDeRutas]);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  // Sin el <pre> de la pila, que trae rutas de la máquina.
  const copia = contenedor.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("pre").forEach((pila) => pila.remove());
  console.log(`  pantalla:    ${copia.textContent}`);
  console.log(`  encabezado:  ${copia.querySelector("header") === null ? "no está" : "está"}`);
  console.log(`  role=alert:  ${copia.querySelector('[role="alert"]') === null ? "no está" : "está"}`);
  console.log(`  avisos de consola: ${avisosDeConsola}`);
  await act(async () => {
    raiz.unmount();
  });
}

const hijas: RouteObject[] = [{ index: true, Component: PaginaRota }];

await dibujar("1. sin ErrorBoundary:", { path: "/", Component: Disposicion, children: hijas });
await dibujar("2. con ErrorBoundary en la ruta raíz:", {
  path: "/",
  Component: Disposicion,
  ErrorBoundary: ErrorDeRuta,
  children: hijas,
});
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_06.tsx
$ node fig05_06.js
1. sin ErrorBoundary:
  pantalla:    Unexpected Application Error!la página se rompió al dibujar
  encabezado:  no está
  role=alert:  no está
  avisos de consola: 2
2. con ErrorBoundary en la ruta raíz:
  pantalla:    Algo salió mal al dibujar el panella página se rompió al dibujar
  encabezado:  no está
  role=alert:  está
  avisos de consola: 2
```

Três coisas saem dessa execução. Sem boundary próprio, fica na tela `Unexpected Application Error!` e não há nenhum `role="alert"`: um leitor de tela não anuncia nada. Com o boundary na raiz, fica o nosso aviso, com seu `role="alert"`. E nos dois casos **o cabeçalho não está lá**, porque o boundary de uma rota é renderizado **no lugar** do que essa rota renderizaria, e aqui a rota com boundary é a de fora, a que renderiza o layout. (Os dois avisos de console aparecem nos dois casos: capturar um erro não o esconde de quem programa.)

A correção é declarar esse boundary. A mesma página da documentação pede que toda aplicação tenha, no mínimo, um na rota raiz. No modo de dados, ele é declarado com a propriedade `ErrorBoundary` do objeto de rota, e o componente lê o erro com `useRouteError()`, porque não recebe props. Também existe `errorElement`, que recebe um elemento já criado; é a mesma diferença que existe entre `Component` e `element`, e o curso usa `ErrorBoundary` pelo mesmo motivo que usa `Component`.

E o que ele deve mostrar? O idiomático no `revisor` é que mostre **o mesmo aviso** que `LimiteDeError`. Para quem usa o painel, «algo quebrou ao renderizar» é a mesma coisa venha de onde vier, e dois avisos diferentes para a mesma coisa seriam duas coisas a manter. Para não escrever o aviso duas vezes, a apresentação sai da classe para um componente próprio:

```tsx
// revisor/src/compartido/AvisoDeError.tsx
// Lo que ve la persona cuando algo se rompe al dibujar. Lo comparten los dos
// límites del revisor: LimiteDeError, afuera del enrutador, y ErrorDeRuta,
// dentro de él.
export function AvisoDeError({ mensaje }: { readonly mensaje: string }) {
  return (
    <div role="alert" className="limite-de-error">
      <h2>Algo salió mal al dibujar el panel</h2>
      <p>{mensaje}</p>
      <button type="button" onClick={() => window.location.reload()}>
        Recargar la página
      </button>
    </div>
  );
}
```

`LimiteDeError` faz o mesmo que na lição 4; só delega a renderização:

```tsx
// revisor/src/compartido/LimiteDeError.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AvisoDeError } from "./AvisoDeError";

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
      return <AvisoDeError mensaje={this.state.error.message} />;
    }

    return this.props.children;
  }
}
```

E este é o boundary das rotas:

```tsx
// revisor/src/app/ErrorDeRuta.tsx
import { isRouteErrorResponse, useRouteError } from "react-router";
import { AvisoDeError } from "../compartido/AvisoDeError";

// React Router atrapa los errores de sus rutas antes de que lleguen a
// LimiteDeError. Este es el límite que dibuja en su lugar: el mismo aviso.
export function ErrorDeRuta() {
  const error = useRouteError();

  return <AvisoDeError mensaje={describirError(error)} />;
}

// En JavaScript se puede lanzar cualquier cosa, no solo un Error.
function describirError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "error desconocido";
}
```

`useRouteError` entrega o que foi lançado, e seu tipo é `unknown`, não `Error`, porque em JavaScript se pode lançar qualquer coisa: um texto, um número, um objeto. Por isso `describirError` pergunta antes de ler. A documentação distingue três casos e `describirError` os segue na mesma ordem: uma resposta de erro do React Router, reconhecida com `isRouteErrorResponse`, que traz `status` e `statusText` (lançada pelos *loaders* e pelas *actions*; o `revisor` não os usa, então hoje não chega nenhuma, mas cobri-la custa três linhas); um `Error`, com sua `message`; e qualquer outra coisa. Repare que `ErrorDeRuta` é um componente de **função**: a única classe do curso continua sendo `LimiteDeError`, porque o React Router já escreveu a classe e pede só o que é renderizado.

O último passo é conectá-lo: a linha `ErrorBoundary: ErrorDeRuta` de `rutas.tsx`, já vista em 5.1.2. Com ela, a mesma cópia, reconstruída, entregou isto em `/?q=romper`:

```text
<title>Revisor</title>
<div id="raiz"><div role="alert" class="limite-de-error"><h2>Algo salió mal al dibujar el panel</h2><p>la página se rompió al dibujar</p><button type="button">Recargar la página</button></div></div>
```

É o aviso da lição 4, palavra por palavra, com seu `role="alert"` e seu botão. E na mesma cópia, `/?q=pag` continuou renderizando a lista com o cabeçalho: o boundary só aparece quando algo quebra. Mais dois detalhes. O título ficou em `Revisor`, o de `index.html`: a página que lançou nunca terminou de renderizar, e o Effect de `useTituloDocumento` dela nunca chegou a ser executado. E o cabeçalho desapareceu, igual à figura 6: este boundary é o último recurso, o que substitui tudo. Para que a pessoa preserve o cabeçalho e a navegação quando **uma** página quebra, o boundary precisa estar mais para dentro; é o exercício 3.

Então `LimiteDeError` sobra? Não. Os boundaries de rota só enxergam o que é renderizado **dentro** das rotas. O que está fora, como o `QueryClientProvider`, fica fora do alcance deles, e para isso `LimiteDeError` continua em `main.tsx`. Cada um cuida do seu andar, e os dois mostram o mesmo aviso.

### 5.2 Parâmetros e busca: o endereço como estado

Um endereço tem partes, e o React Router entrega duas delas como dados. Em `http://localhost:5173/servicios/pagos` a parte que importa é o **caminho** (`/servicios/pagos`), e o segmento dinâmico é lido com `useParams`. Em `http://localhost:5173/?fallas=1&q=pag`, o caminho é `/` e o que vem depois do `?` é a **busca** (*query string*), lida com `useSearchParams`. As duas são estado: mudam o que é renderizado, e mudá-las é navegar.

#### 5.2.1 O parâmetro de rota: `useParams`

O detalhe de um serviço deixa de ser um painel abaixo da lista e vira uma página. `PanelDetalle` desaparece, e no lugar dele entra `PaginaServicio`:

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
      {consulta.isError && (
        <p role="alert">No se pudo cargar el detalle: {consulta.error.message}</p>
      )}
      {consulta.isSuccess && (
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
          {reintento.isError && (
            <p role="alert">No se pudo volver a revisar: {reintento.error.message}</p>
          )}
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

A primeira linha do componente é a que mais precisa ser entendida: `const { nombre = "" } = useParams();`. `useParams` retorna os segmentos dinâmicos do endereço como um objeto; aqui, `{ nombre: "pagos" }` ([React Router, `useParams`](https://reactrouter.com/api/hooks/useParams)). O tipo dele diz que cada valor é `string | undefined`, e não é pessimismo do TypeScript: o hook não sabe em que rota está sendo chamado, e um componente poderia ser usado em uma rota sem `:nombre`. O `= ""` dá um valor padrão para que o resto do componente trabalhe com uma `string`. Em «O erro que vai aparecer», ele vai ser removido para ver os quatro erros que surgem. Na prática, esta página só é renderizada em `servicios/:nombre`, então `nombre` nunca chega vazio.

Com esse nome, a página faz o que `PanelDetalle` fazia: pede o detalhe com a mesma consulta da lição 4, `consultaDetalle(nombre)`, cuja chave `["servicio", nombre]` separa o cache de cada serviço, e oferece a mutação «Volver a revisar». O novo é o que já não é necessário. Na lição 4, `ContenidoReporte` verificava se o serviço escolhido existia na lista antes de mostrar seu painel. Agora qualquer pessoa pode escrever `/servicios/nada` na barra de endereços, e a página não tem uma lista contra a qual verificar. Não é preciso: a API responde 404 para um serviço que não existe, `cargarDetalle` converte isso em erro e a página mostra o alerta. Assim o Chrome entregou:

```text
<title>nada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio nada"><h2>Servicio nada</h2><p role="alert">No se pudo cargar el detalle: la API respondió 404</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

E assim o registro do servidor de prática viu:

```text
08:15:01.057 GET /api/servicios/nada 404
08:15:01.263 GET /api/servicios/nada 404
08:15:01.468 GET /api/servicios/nada 404
```

Três requisições para uma única visita. Não é o `StrictMode`, porque esta é a versão construída, onde não há ciclo extra: é o `retry: 2` que a lição 4 configurou no cliente de consultas, que tenta de novo **qualquer** erro, inclusive um 404 que nunca vai mudar. (Os horários estão apertados por causa do relógio adiantado do Chrome; com um navegador normal, as novas tentativas chegam espaçadas.) É uma decisão que pode ser ajustada — tentar de novo só quando o erro merece —, mas não é tema desta lição; anote no diário de bordo como algo que apareceu.

#### 5.2.2 Codificar ao escrever, decodificar ao ler

O serviço `catálogo` tem um `á`. Em um endereço, os caracteres fora de um conjunto pequeno viajam **codificados por porcentagem**: o `á` são dois bytes em UTF-8, escritos `%C3%A1`. Quem monta o endereço codifica; quem o lê, decodifica. No `revisor` há três momentos:

1. `FilaEstado` monta o link com `encodeURIComponent(estado.nombre)`, que converte `catálogo` em `cat%C3%A1logo`. Usa-se `encodeURIComponent` e não `encodeURI` porque ele codifica também os caracteres que têm significado em um endereço, como `/`, `?` e `#` ([MDN, `encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)). Se um dia um serviço se chamasse `a/b`, sem codificar o endereço seria `/servicios/a/b`, que é outro caminho, e cairia em «não encontrada».
2. `useParams` entrega o parâmetro **já decodificado**. Isso apareceu na figura 1: `cat%C3%A1logo` chegou como `catálogo`. A documentação do hook não diz isso com essas palavras; quem diz é a execução, e por isso a figura existe.
3. `cargarDetalle`, desde a lição 3, codifica o nome de novo para pedi-lo à API. O registro confirma: `GET /api/servicios/cat%C3%A1logo 200`.

Codificar duas vezes seguidas seria um erro (`%C3` viraria `%25C3`), e não codificar nenhuma também. A regra é simples: **o texto que viaja dentro de um endereço é codificado no momento de colocá-lo e decodificado no momento de tirá-lo**, e no meio se trabalha com o texto normal. Assim o Chrome renderizou ao abrir `/servicios/cat%C3%A1logo`:

```text
<title>catálogo · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio catálogo"><h2>Servicio catálogo</h2><dl><dt>Estado</dt><dd>Disponible: HTTP 200 en 42 ms</dd><dt>Revisiones</dt><dd>2</dd><dt>Última revisión</dt><dd>2026-10-21T08:14:55.465Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre catálogo<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

#### 5.2.3 A mesma página, outro parâmetro: por que `key={nombre}`

Na lição 3, `<PanelDetalle key={seleccionado}>` reiniciava o painel inteiro ao trocar de serviço. Em `PaginaServicio`, a `key` está mais abaixo, em `<EditorNota key={nombre}>`. Ela é necessária? Para responder é preciso saber o que o React Router faz quando o endereço passa de `/servicios/pagos` para `/servicios/inventario`: **a rota é a mesma** (`servicios/:nombre`), então o componente que a renderiza é o mesmo, na mesma posição da árvore. O React não vê uma página nova; vê a mesma `PaginaServicio` com outro parâmetro. E a documentação do React é clara sobre o que isso significa: o mesmo componente na mesma posição preserva seu estado ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

A figura 2 mostra isso com um componente que, como `EditorNota`, inicia seu estado a partir de uma prop. Navega de `pagos` para `inventario` duas vezes: sem `key` e com ela.

```tsx
// fig05_02.tsx
import { JSDOM } from "jsdom";
import { act, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Borrador({ nombre }: { readonly nombre: string }) {
  // El estado inicial solo se usa la PRIMERA vez que se monta el componente.
  const [borrador] = useState(`nota sobre ${nombre}`);
  return <>dirección: {nombre} · borrador: {borrador}</>;
}

function SinKey() {
  const { nombre = "" } = useParams();
  return <Borrador nombre={nombre} />;
}

function ConKey() {
  const { nombre = "" } = useParams();
  return <Borrador key={nombre} nombre={nombre} />;
}

async function recorrer(titulo: string, Pagina: ComponentType): Promise<void> {
  console.log(titulo);
  const enrutador = createMemoryRouter([{ path: "/servicios/:nombre", Component: Pagina }], {
    initialEntries: ["/servicios/pagos"],
  });
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  console.log(`  ${contenedor.textContent}`);
  await act(async () => {
    await enrutador.navigate("/servicios/inventario");
  });
  console.log(`  ${contenedor.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await recorrer("sin key:", SinKey);
await recorrer("con key={nombre}:", ConKey);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_02.tsx
$ node fig05_02.js
sin key:
  dirección: pagos · borrador: nota sobre pagos
  dirección: inventario · borrador: nota sobre pagos
con key={nombre}:
  dirección: pagos · borrador: nota sobre pagos
  dirección: inventario · borrador: nota sobre inventario
```

Sem `key`, o endereço diz `inventario`, mas o rascunho continua falando de `pagos`: `useState` só usa o valor inicial na primeira vez que o componente é montado, e aqui ele não foi montado de novo. Com `key={nombre}`, o React trata cada nome como um componente diferente, destrói o antigo e cria um novo. No `revisor`, sem essa `key`, o rascunho da nota de `pagos` apareceria na página de `inventario`, pronto para ser salvo no serviço errado.

E por que a `key` está em `EditorNota` e não na página inteira? Porque a única coisa que guarda estado próprio é o rascunho. A consulta do detalhe não precisa ser reiniciada: a chave dela inclui o nome, então ao mudar o nome o TanStack Query troca de entrada de cache sozinho. E hoje, honestamente, a interface do `revisor` não oferece um caminho direto de um detalhe a outro: sempre se passa pela lista, e isso desmonta a página. A `key` protege contra o dia em que alguém acrescentar um link «próximo serviço», e é tão barata que não vale a pena esperar esse dia para colocá-la.

#### 5.2.4 Os filtros na busca: `useSearchParams`

Os filtros são o caso clássico de «estado que deve viver no endereço»: descrevem o que se está vendo, e outra pessoa vai querer ver o mesmo. O plano do curso os coloca na busca, com dois parâmetros: `fallas=1` para «Solo fallas» e `q=texto` para «Buscar por nombre». Primeiro, o tipo e a função pura que filtra, em `resumen.ts`:

```ts
// revisor/src/reporte/resumen.ts
import type { EstadoPublico } from "../compartido/contrato";

export interface Filtros {
  readonly soloFallas: boolean;
  readonly texto: string;
}

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}

export function filtrarEstados(
  estados: readonly EstadoPublico[],
  filtros: Filtros,
): readonly EstadoPublico[] {
  const buscado = filtros.texto.trim().toLocaleLowerCase("es-MX");

  return estados.filter(
    (estado) =>
      (!filtros.soloFallas || estado.tipo === "falla") &&
      (buscado === "" || estado.nombre.toLocaleLowerCase("es-MX").includes(buscado)),
  );
}
```

`Filtros` junta os dois filtros em um objeto, e `filtrarEstados` aplica os dois ao mesmo tempo: um serviço passa se cumpre «só falhas» (ou o filtro está desativado) **e** se seu nome contém o texto buscado (ou nada é buscado). A busca ignora maiúsculas e os espaços das pontas, e usa `toLocaleLowerCase("es-MX")` para que a comparação siga as regras do espanhol. Continua sendo uma função pura: mesmas entradas, mesma saída, e a lição 8 a testa sem React.

Agora a peça nova, o hook que traduz entre o endereço e os filtros:

```ts
// revisor/src/reporte/filtrosEnUrl.ts
import { useSearchParams } from "react-router";
import type { Filtros } from "./resumen";

export function useFiltrosEnUrl(): {
  readonly filtros: Filtros;
  readonly cambiarFiltros: (cambio: Partial<Filtros>) => void;
} {
  const [parametros, establecerParametros] = useSearchParams();
  const filtros: Filtros = {
    soloFallas: parametros.get("fallas") === "1",
    texto: parametros.get("q") ?? "",
  };

  function cambiarFiltros(cambio: Partial<Filtros>): void {
    const siguientes = { ...filtros, ...cambio };

    establecerParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales);

        if (siguientes.soloFallas) {
          nuevos.set("fallas", "1");
        } else {
          nuevos.delete("fallas");
        }

        if (siguientes.texto === "") {
          nuevos.delete("q");
        } else {
          nuevos.set("q", siguientes.texto);
        }

        return nuevos;
      },
      { replace: true },
    );
  }

  return { filtros, cambiarFiltros };
}
```

`useSearchParams` retorna duas coisas, igual a `useState`: os parâmetros atuais, como um objeto `URLSearchParams` do navegador, e uma função para mudá-los que **provoca uma navegação** para o endereço novo ([React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams)). `URLSearchParams` é uma interface padrão com métodos para ler e escrever a busca; seu `get` retorna `null` quando o parâmetro não está presente ([MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)). Cinco decisões deste arquivo merecem uma linha própria:

- **Os filtros são calculados, não guardados.** Não há um `useState` com os filtros que se «sincronize» com o endereço: cada render os lê do endereço. É a regra da lição 2, «não guardar o que se pode calcular», aplicada a uma nova fonte de verdade. Se houvesse um `useState` além do endereço, haveria duas verdades que podem divergir, e a tentação de mantê-las de acordo com um Effect, que é justamente o que o primeiro princípio do curso proíbe.
- **`fallas` vale `"1"` ou não existe.** A leitura é `parametros.get("fallas") === "1"`, e ao desativar o filtro o parâmetro é **apagado** em vez de escrever `fallas=0`. O mesmo com `q` vazio. Assim, o endereço sem filtros é `/`, limpo, e não `/?fallas=0&q=`.
- **A função que muda recebe só o que mudou.** `cambiarFiltros({ soloFallas: true })` não toca no texto, porque `{ ...filtros, ...cambio }` mistura a mudança com o que já havia. Por isso o tipo é `Partial<Filtros>`.
- **Copia-se em vez de mutar.** A forma com função, `establecerParametros((actuales) => …)`, recebe os parâmetros atuais; o código cria uma cópia com `new URLSearchParams(actuales)` e muda a cópia. A documentação adverte que o objeto entregue pelo hook é mutável e que, se for mudado sem chamar a função de mudança, seus valores mudam entre renders sem que o endereço reflita isso. Copiar evita essa armadilha e preserva qualquer outro parâmetro que o endereço traga. A mesma página adverte outra diferença em relação ao `useState`: duas chamadas seguidas no mesmo instante **não** se encadeiam como faria a forma atualizadora do React. No `revisor`, cada evento chama uma única vez, então isso não pega.
- **`replace: true`.** É a decisão que mais se nota, e tem figura própria.

#### 5.2.5 `replace: true`: escrever no endereço sem encher o histórico

Toda vez que o endereço muda com `pushState`, o navegador acrescenta uma entrada ao histórico, e «Voltar» retorna à anterior. Para ir da lista ao detalhe, é exatamente o que se quer. Para uma caixa de busca, não: cada tecla muda `q`, e se cada tecla fosse uma entrada, digitar `pagos` criaria cinco, e a pessoa teria de apertar «Voltar» cinco vezes para sair da lista. Com `replace: true`, a mudança **substitui** a entrada atual em vez de acrescentar outra: é o `replaceState`, que a MDN descreve como a função que modifica a entrada atual do histórico ([MDN, `History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)). A documentação de `Link` desenha isso com letras: com um histórico `A → B`, um link normal deixa `A → B → C`; com `replace`, `A → C` ([React Router, `Link`](https://reactrouter.com/api/components/Link)).

A figura 3 mede isso. Começa na lista, depois de ter visto o detalhe de `pagos` (um histórico de duas entradas), digita `p`, `pa` e `pag` em um campo de busca como o do `revisor` e aperta «Voltar». Faz isso duas vezes: com navegação normal e com `replace: true`.

```tsx
// fig05_03.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createMemoryRouter, useSearchParams } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// React DOM decide al cargarse si hay un navegador; por eso se importa DESPUÉS de crear el DOM.
const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

function Buscador({ reemplazar }: { readonly reemplazar: boolean }) {
  const [parametros, establecerParametros] = useSearchParams();

  return (
    <input
      type="search"
      value={parametros.get("q") ?? ""}
      onChange={(evento) => establecerParametros({ q: evento.target.value }, { replace: reemplazar })}
    />
  );
}

function Detalle() {
  return null;
}

const escribirValor = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;

async function teclear(reemplazar: boolean): Promise<void> {
  console.log(`replace: ${reemplazar}`);
  const enrutador = createMemoryRouter(
    [
      { path: "/", element: <Buscador reemplazar={reemplazar} /> },
      { path: "/servicios/:nombre", Component: Detalle },
    ],
    { initialEntries: ["/servicios/pagos", "/"], initialIndex: 1 },
  );
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });

  const caja = contenedor.querySelector("input")!;
  for (const texto of ["p", "pa", "pag"]) {
    await act(async () => {
      escribirValor.call(caja, texto);
      caja.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    const { pathname, search } = enrutador.state.location;
    console.log(`  tecleó «${texto}»: ${pathname}${search} (${enrutador.state.historyAction})`);
  }

  await act(async () => {
    await enrutador.navigate(-1);
  });
  const { pathname, search } = enrutador.state.location;
  console.log(`  botón Atrás:  ${pathname}${search}`);

  await act(async () => {
    raiz.unmount();
  });
  contenedor.remove();
}

await teclear(false);
await teclear(true);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_03.tsx
$ node fig05_03.js
replace: false
  tecleó «p»: /?q=p (PUSH)
  tecleó «pa»: /?q=pa (PUSH)
  tecleó «pag»: /?q=pag (PUSH)
  botón Atrás:  /?q=pa
replace: true
  tecleó «p»: /?q=p (REPLACE)
  tecleó «pa»: /?q=pa (REPLACE)
  tecleó «pag»: /?q=pag (REPLACE)
  botón Atrás:  /servicios/pagos
```

Com navegação normal, cada tecla foi um `PUSH`, e «Voltar» deixa em `/?q=pa`: desfaz uma letra. Com `replace: true`, cada tecla foi um `REPLACE`, e «Voltar» leva de volta ao detalhe de `pagos`, que é para onde a pessoa queria voltar. O endereço é o mesmo nos dois casos; o que muda é o histórico. Duas notas sobre a figura: o React DOM é importado **depois** de criar o DOM de teste, porque decide ao carregar se há um navegador, e sem isso os eventos de teclado não chegam a `onChange` (as figuras 1, 2 e 5 não disparam eventos, só renderizam e leem texto, e por isso podem importá-lo no topo); e a figura escreve no campo com o `set` do protótipo de `HTMLInputElement` para que o React perceba a mudança, que é o que a lição 8 vai fazer com `user-event`.

É um princípio, não uma lei: no `revisor`, «Solo fallas» também substitui. Daria para defender que marcar a caixa merece, sim, sua própria entrada no histórico; o curso escolheu tratar os dois filtros da mesma forma, como um único «como estou olhando a lista», e que «Voltar» signifique «para a tela anterior».

E os espaços? Ao buscar `pago s` (com espaço), `URLSearchParams` escreve o espaço como `+`: a MDN explica que ele codifica por porcentagem o necessário e o espaço como `+`, e que ao ler interpreta o `+` como espaço. Não é preciso fazer nada: o hook escreve e lê com as mesmas regras. Só não estranhe ao ver `?q=pago+s` na barra.

#### 5.2.6 O relatório, agora como página

`Panel` desaparece e seu lugar é ocupado por `PaginaReporte`. Já não tem nenhum `useState`: a consulta é a mesma da lição 4, os filtros saem do endereço e as notas, do layout.

```tsx
// revisor/src/reporte/PaginaReporte.tsx
import { useQuery } from "@tanstack/react-query";
import { useNotas } from "../app/contextoNotas";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { cadaMs } from "../configuracion";
import { consultaReporte } from "./consultas";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { useFiltrosEnUrl } from "./filtrosEnUrl";
import { contarFallas } from "./resumen";

export function PaginaReporte() {
  const consulta = useQuery(consultaReporte(cadaMs));
  const { filtros, cambiarFiltros } = useFiltrosEnUrl();
  const { notas } = useNotas();

  const fallas = consulta.data === undefined ? 0 : contarFallas(consulta.data.estados);
  useTituloDocumento(fallas > 0 ? `(${fallas}) Revisor` : "Revisor");

  return (
    <Tarjeta titulo="Estado de los servicios">
      <FiltroFallas filtros={filtros} alCambiar={cambiarFiltros} />
      <ContenidoReporte consulta={consulta} filtros={filtros} notas={notas} />
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
  );
}
```

`cadaMs` já não chega como prop vinda de `main.tsx`: a página o importa de `configuracion.ts`, porque `main.tsx` já não renderiza páginas, renderiza o roteador. O resto se distribui assim:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReportePublico } from "../compartido/contrato";
import { ListaEstados } from "./ListaEstados";
import type { Notas } from "./notas";
import { filtrarEstados, type Filtros } from "./resumen";
import { ResumenFallas } from "./ResumenFallas";

export function ContenidoReporte({
  consulta,
  filtros,
  notas,
}: {
  readonly consulta: UseQueryResult<ReportePublico>;
  readonly filtros: Filtros;
  readonly notas: Notas;
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

  return (
    <>
      {consulta.isError && (
        <p role="alert" className="viejo">
          Mostrando el último reporte que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      <ResumenFallas estados={estados} />
      <ListaEstados estados={filtrarEstados(estados, filtros)} notas={notas} />
    </>
  );
}
```

`ContenidoReporte` perde três props (`seleccionado`, `alSeleccionar`, `alGuardarNota`) e o painel de detalhe: isso já não é com ele. Seus quatro estados mais um continuam idênticos. Recebe os filtros como um objeto e os passa a `filtrarEstados`. Repare em um detalhe que aparece na saída do Chrome para `/?q=inv`: o resumo diz `4 servicios revisados · 2 servicios con falla`, embora a lista mostre um único serviço. É de propósito: `ResumenFallas` recebe `estados`, todos, e não os filtrados. O resumo descreve o relatório; o filtro só decide quais linhas aparecem.

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox"> Solo fallas</label><label>Buscar por nombre <input type="search" value="inv"></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li></ul><p class="actualizado">Actualizado a las 2:14:55 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

O filtro ganha um segundo campo:

```tsx
// revisor/src/reporte/FiltroFallas.tsx
import type { Filtros } from "./resumen";

export function FiltroFallas({
  filtros,
  alCambiar,
}: {
  readonly filtros: Filtros;
  readonly alCambiar: (cambio: Partial<Filtros>) => void;
}) {
  return (
    <div className="filtros">
      <label>
        <input
          type="checkbox"
          checked={filtros.soloFallas}
          onChange={(evento) => alCambiar({ soloFallas: evento.target.checked })}
        />{" "}
        Solo fallas
      </label>
      <label>
        Buscar por nombre{" "}
        <input
          type="search"
          value={filtros.texto}
          onChange={(evento) => alCambiar({ texto: evento.target.value })}
        />
      </label>
    </div>
  );
}
```

Os dois campos são **controlados**: o valor deles sai de `filtros`, que sai do endereço, e cada mudança pede um endereço novo. O ciclo completo de uma tecla é: a pessoa digita, `onChange` chama `alCambiar`, o hook navega com `replace`, o endereço muda, o React Router renderiza a página de novo, `useFiltrosEnUrl` lê o texto novo e o campo o mostra. Parece longo, e acontece no mesmo instante. O campo de busca é `type="search"`, o controle nativo do HTML para isso, que os leitores de tela anunciam como campo de busca.

A lista agora distingue dois vazios:

```tsx
// revisor/src/reporte/ListaEstados.tsx
import type { EstadoPublico } from "../compartido/contrato";
import type { Notas } from "./notas";
import { FilaEstado } from "./FilaEstado";

export function ListaEstados({
  estados,
  notas,
}: {
  readonly estados: readonly EstadoPublico[];
  readonly notas: Notas;
}) {
  if (estados.length === 0) {
    return <p>Ningún servicio coincide con los filtros.</p>;
  }

  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado
          key={estado.nombre}
          estado={estado}
          tieneNota={notas[estado.nombre] !== undefined}
        />
      ))}
    </ul>
  );
}
```

«No hay servicios configurados todavía.» (em `ContenidoReporte`) significa que o servidor não tem serviços: é o quarto estado da lição 4. «Ningún servicio coincide con los filtros.» significa que há serviços, mas os filtros os escondem. São duas situações diferentes que pedem ações diferentes — esperar que alguém configure serviços, ou remover um filtro —, e por isso têm duas mensagens.

#### 5.2.7 `Link` e `NavLink`

A linha deixa de ter um botão que escolhe e passa a ter um link que leva:

```tsx
// revisor/src/reporte/FilaEstado.tsx
import { Link } from "react-router";
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

`Link` renderiza uma tag `<a>` normal, com seu `href`: a documentação o chama de «um wrapper de `<a href>` progressivamente aprimorado» para navegar do lado do cliente ([React Router, `Link`](https://reactrouter.com/api/components/Link)). Na saída do Chrome isso se vê: `<a href="/servicios/pagos" data-discover="true">pagos</a>`. Ao clicar, `Link` impede que o navegador peça a página ao servidor e pede ao roteador que navegue com `pushState`. Como é um `<a>` de verdade, tudo o que a pessoa espera de um link funciona: abri-lo em outra aba com Ctrl+clique ou com o botão do meio, copiar o endereço, vê-lo ao passar o mouse. Com o botão da lição 2 nada disso era possível. E o leitor de tela o anuncia como «link», que é o que ele é: leva a outro lugar. O atributo `data-discover` é acrescentado pelo React Router aos seus links para a descoberta de rotas, uma função do modo framework ([React Router, «Lazy Route Discovery»](https://reactrouter.com/explanation/lazy-route-discovery)); no modo de dados, dá para ignorá-lo.

Navegar no cliente tem um custo que uma recarga não tem. Quando o navegador carrega uma página inteira, o leitor de tela anuncia a página nova e o foco começa no topo. Com `pushState`, nenhuma das duas coisas acontece sozinha: a página muda debaixo da pessoa, e o foco fica onde estava. O React Router oferece restaurar a posição de rolagem com `ScrollRestoration` («emula a restauração de rolagem do navegador», diz a documentação, [React Router, `ScrollRestoration`](https://reactrouter.com/api/components/ScrollRestoration)), e essa página não menciona o foco. O título por página que `useTituloDocumento` coloca é uma parte da resposta; a outra, levar o foco para onde a página nova começa, é trabalho de quem programa. A lição 7, a de acessibilidade, volta ao teclado e ao foco. Por enquanto, percorra o `revisor` com Tab depois de clicar em um serviço e anote no diário de bordo onde o foco ficou.

A navegação do layout usa `NavLink`, um `Link` que sabe se seu destino coincide com o endereço atual. Quando coincide, acrescenta a classe `active` e o atributo `aria-current="page"`, que diz aos leitores de tela «esta é a página em que se está» ([React Router, `NavLink`](https://reactrouter.com/api/components/NavLink)). Compare as duas saídas do Chrome: em `/?fallas=1` o link diz `aria-current="page" class="active"`; em `/servicios/pagos` diz `class=""`. A folha de estilos coloca o link ativo em negrito:

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

.viejo,
.limite-de-error {
  border-left: 0.5rem solid #bf8700;
  padding-left: 0.75rem;
}

header nav a {
  margin-right: 1rem;
}

header nav a.active {
  font-weight: bold;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
}
```

E o `end` de `<NavLink to="/" end>`? Normalmente um `NavLink` também fica ativo nos endereços que **começam** com seu destino: um para `/servicios` estaria ativo em `/servicios/pagos`. `end` muda isso: só fica ativo se o endereço **termina** ali. Mas a documentação aponta um caso especial: como **todos** os endereços começam com `/`, um `NavLink` para `/` já se comporta como se tivesse `end`. A figura 5 comprova:

```tsx
// fig05_05.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, NavLink } from "react-router";
import { RouterProvider } from "react-router/dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Menu() {
  return (
    <nav>
      <NavLink to="/">raíz sin end</NavLink>
      <NavLink to="/" end>raíz con end</NavLink>
      <NavLink to="/servicios">servicios sin end</NavLink>
      <NavLink to="/servicios" end>servicios con end</NavLink>
    </nav>
  );
}

for (const direccion of ["/", "/servicios", "/servicios/pagos"]) {
  const enrutador = createMemoryRouter([{ path: "*", Component: Menu }], { initialEntries: [direccion] });
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  const activos = [...contenedor.querySelectorAll("a.active")].map((enlace) => enlace.textContent);
  console.log(`${direccion.padEnd(17)} activos: ${activos.join(" · ") || "ninguno"}`);
  await act(async () => {
    raiz.unmount();
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_05.tsx
$ node fig05_05.js
/                 activos: raíz sin end · raíz con end
/servicios        activos: servicios sin end · servicios con end
/servicios/pagos  activos: servicios sin end
```

Em `/servicios/pagos` só fica ativo «servicios sin end»; os dois links para a raiz não, tenham ou não `end`. Então no `revisor` o `end` não muda o resultado, e mesmo assim é escrito: diz a intenção («este link é só a lista») a quem lê o código, e não depende de lembrar uma exceção.

E uma despedida: o `.seleccionar` e o `.detalle` da folha de estilos já não são usados por nenhum componente. Eram do botão da lição 2 e do painel da lição 3. O ponto de controle os mantém; anote como limpeza pendente.

### 5.3 Recarregar uma rota do cliente: o servidor deve responder `index.html`

#### 5.3.1 Dois caminhos para chegar ao mesmo endereço

Há duas maneiras de chegar a `/servicios/pagos`, e para o servidor elas são completamente diferentes.

**Navegando dentro da aplicação.** Abre-se `/`, o servidor entrega `index.html`, o JavaScript inicia, e clica-se em `pagos`. `Link` chama `pushState`, a barra diz `/servicios/pagos` e o React Router renderiza `PaginaServicio`. **O servidor nem ficou sabendo**: a única requisição nova foi a da API, `GET /api/servicios/pagos`.

**Chegando de fora.** Recarrega-se com F5, ou cola-se o link em um navegador novo, ou ele é aberto a partir de um e-mail. Agora não há aplicação carregada. O navegador faz o que faz com qualquer endereço: pede `GET /servicios/pagos` **ao servidor**. É o «pode tentar carregá-lo mais tarde» da MDN. E o servidor precisa responder algo com que o navegador consiga iniciar a aplicação, para que o React Router leia o endereço e renderize o detalhe. Esse algo é `index.html`, o mesmo de `/`: a página não muda, só muda o endereço com que ela inicia.

Se o servidor procura um arquivo chamado `servicios/pagos` dentro de `dist/`, não o encontra, porque ele não existe: em `dist/` só há um `index.html`, um `.js` e um `.css`. E responde 404.

#### 5.3.2 O que `vite dev` e `vite preview` respondem

Até agora esse 404 nunca apareceu porque os dois servidores do Vite já fazem o correto. O Vite tem uma opção, `appType`, cujo valor padrão é `'spa'` (aplicação de página única), e que ativa o que a documentação chama de *SPA fallback*: o fallback que entrega `index.html` quando o endereço não é um arquivo ([Vite, «Shared Options», `appType`](https://vite.dev/config/shared-options)). Em `vite dev` quem faz isso é um *middleware* do Vite; em `vite preview`, a mesma documentação diz que ele configura o `sirv`, o servidor de arquivos que usa por dentro, com `single: true`, a opção que responde `index.html` ao que não encontra. A lição 0 já tinha esbarrado nisso no exercício 3, quando `curl http://localhost:5173/salud` retornou o HTML da página. Isto foi o que `vite preview` respondeu nesta lição:

```text
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "http://localhost:4173/servicios/cat%C3%A1logo"
200 text/html
$ curl -s "http://localhost:4173/servicios/cat%C3%A1logo" | head -12
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Revisor</title>
    <script type="module" crossorigin src="/assets/index-CLDgPzLo.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-yYL09Z4k.css">
  </head>
  <body>
    <div id="raiz"></div>
  </body>
```

É `index.html`, com código 200. E repare nos caminhos dos arquivos: `/assets/index-CLDgPzLo.js`, com `/` no início. Isso importa mais do que parece. Se dissesse `assets/index-CLDgPzLo.js`, sem a barra, o navegador o resolveria **em relação ao endereço atual**, e a partir de `/servicios/pagos` pediria `/servicios/assets/index-CLDgPzLo.js`, que não existe. A barra inicial faz com que o JavaScript seja pedido sempre no mesmo lugar, seja qual for a profundidade do endereço.

O fallback de `vite preview` é generoso, talvez demais. Isto foi o que ele respondeu a mais três endereços:

```text
/no-existe → 200 text/html
/assets/no-existe.js → 200 text/html
/servicios/pagos?x=1 → 200 text/html
```

O primeiro é o esperado: `/no-existe` é uma rota do cliente, e a página «não encontrada» é renderizada pelo React. Repare que ela chega com código **200**: o servidor não sabe que rotas existem em `rutas.tsx`, então não tem como dizer 404. O segundo é a parte questionável: um arquivo JavaScript que não existe também recebe HTML com 200, e um navegador que esperava código recebe uma página. O servidor que a lição 9 escreve distingue os dois casos: reescreve para `index.html` as rotas do cliente, mas responde 404 ao que faltar em `/assets/`.

#### 5.3.3 O servidor que não reescreve

Para ver o 404 é preciso um servidor que sirva arquivos e nada mais. O Python traz um: `python3 -m http.server`, com `--directory` para escolher a pasta e `--bind` para escutar só na máquina local. A documentação dele adverte que não é recomendado para produção, e explica que, se a requisição não corresponde a um arquivo, ele responde `404 File not found` ([Python, `http.server`](https://docs.python.org/3/library/http.server.html)). É perfeito para isto, justamente por ser simplório. Com o `npm run build` já feito, a partir de `~/curso-react/revisor/`:

```text
$ python3 -m http.server 4190 --bind 127.0.0.1 --directory dist
```

E de outro terminal:

```text
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/
200 text/html
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/servicios/pagos
404 text/html;charset=utf-8
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/assets/index-CLDgPzLo.js
200 text/javascript
```

A raiz funciona, porque `dist/index.html` existe; o JavaScript também. Mas `/servicios/pagos`, que com `vite preview` era um 200, aqui é um 404. Ao abrir a raiz no navegador e clicar em `pagos`, tudo funciona, porque o clique não chega ao servidor. Ao recarregar nesse momento, o navegador mostra isto, que é o que a pessoa da cena viu:

```text
$ curl -s http://127.0.0.1:4190/servicios/pagos
<!DOCTYPE HTML>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Error response</title>
    </head>
    <body>
        <h1>Error response</h1>
        <p>Error code: 404</p>
        <p>Message: File not found.</p>
        <p>Error code explanation: 404 - Nothing matches the given URI.</p>
    </body>
</html>
```

O registro do Python deixa isso por escrito:

```text
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /assets/index-CLDgPzLo.js HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
```

Há uma linha `GET` para cada um dos quatro `curl`, e cada 404 vem precedido de sua explicação; o último par é o do `curl` que trouxe a página de erro completa. (Os horários deste registro são os da máquina, não UTC.) Encerre o servidor com Ctrl+C.

A lição é direta: **assim que uma aplicação usa rotas do cliente, o servidor que a publica ganha uma tarefa nova.** Para qualquer endereço que não seja um arquivo real, ele deve responder `index.html` e deixar o roteador decidir. Como configurar isso depende do servidor: um servidor web clássico tem uma regra de reescrita, uma plataforma de hospedagem tem uma opção de «aplicação de página única», e um servidor próprio faz isso com algumas linhas de código, que são as que a lição 9 escreve. O que não muda é o teste: **recarregue uma rota profunda no servidor real.** Testar só com `vite preview` não prova nada sobre produção, porque o `vite preview` já faz a reescrita sozinho e, como a documentação do Vite lembra desde a lição 0, não é um servidor de produção.

Existe outra saída, que vale a pena conhecer para descartá-la com argumentos: colocar a rota depois de um `#` (`/#/servicios/pagos`). O navegador nunca envia ao servidor o que vem depois do `#`, então o servidor sempre vê `/` e sempre entrega `index.html`. O React Router oferece isso com `createHashRouter`. Funciona em qualquer servidor estático, mas os endereços ficam feios, o `#` deixa de servir para pular para uma seção da página, e o problema real — um servidor que não sabe servir uma aplicação — fica escondido em vez de resolvido. O curso usa endereços normais e resolve o servidor.

## O erro que vai aparecer

A lição tem um erro principal, o 404 ao recarregar, já visto em 5.3, e dois de apoio, que aparecem ao escrever as páginas.

**O erro principal: «na minha máquina funciona».** Funciona em `npm run dev`, funciona em `npm run preview`, funciona ao clicar. Falha só quando alguém **recarrega** ou **abre um link** no servidor onde foi publicado, e falha com uma página que não é da aplicação: `Error code: 404`, `File not found` ou o equivalente do servidor. O sinal para reconhecê-lo é que a raiz `/` sempre funciona e o que falha é todo o resto, e que na aba de rede do navegador a requisição que falha é a do **documento** (`/servicios/pagos`), não a da API (`/api/servicios/pagos`). Se a da API falha, o problema é outro. A correção não está no React: é configurar o servidor para responder `index.html` nas rotas do cliente.

**Um componente de rota fora do roteador.** A figura 4 renderiza duas árvores dentro de um error boundary próprio, como o `LimiteDeError` do `revisor`. A primeira usa `useSearchParams` sem nenhum roteador em volta, que é o que acontece ao renderizar uma página solta, por exemplo em um teste que esqueceu de montá-la dentro de um roteador. A segunda é uma rota que lança um erro ao renderizar, dentro de `RouterProvider`:

```tsx
// fig05_04.tsx
import { JSDOM } from "jsdom";
import { act, Component, type ReactNode } from "react";
import { createMemoryRouter, useSearchParams } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

// Los avisos de consola de React traen pilas largas: aquí solo se muestra su primer renglón.
console.error = (...partes: unknown[]) => {
  const [formato, ...resto] = partes;
  const texto = typeof formato === "string" && formato.startsWith("%o") ? resto : partes;
  const primero = texto.map((parte) => (parte instanceof Error ? parte.message : String(parte))).join(" ");
  console.log(`  [consola] ${primero.split("\n")[0]}`);
};

class Limite extends Component<{ readonly children: ReactNode }, { readonly error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error === null ? this.props.children : <>[límite propio] {this.state.error.message}</>;
  }
}

function Filtros() {
  const [parametros] = useSearchParams();
  return <>q = {parametros.get("q")}</>;
}

function Rota(): ReactNode {
  throw new Error("la página se rompió al dibujar");
}

async function dibujar(titulo: string, arbol: ReactNode): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Limite>{arbol}</Limite>);
  });
  // Sin el <pre> de la pila, que trae rutas de la máquina.
  const copia = contenedor.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("pre").forEach((pila) => pila.remove());
  console.log(`  pantalla: ${copia.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await dibujar("1. useSearchParams sin enrutador:", <Filtros />);

const enrutador = createMemoryRouter([{ path: "/", Component: Rota }]);
await dibujar("2. una ruta que lanza, dentro de RouterProvider:", <RouterProvider router={enrutador} />);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_04.tsx
$ node fig05_04.js
1. useSearchParams sin enrutador:
  [consola] useLocation() may be used only in the context of a <Router> component. The above error occurred in the <Filtros> component. React will try to recreate this component tree from scratch using the error boundary you provided, Limite.
  pantalla: [límite propio] useLocation() may be used only in the context of a <Router> component.
2. una ruta que lanza, dentro de RouterProvider:
  [consola] la página se rompió al dibujar The above error occurred in the <Rota> component. React will try to recreate this component tree from scratch using the error boundary you provided, RenderErrorBoundary.
  [consola] React Router caught the following error during render la página se rompió al dibujar
  pantalla: Unexpected Application Error!la página se rompió al dibujar
```

A primeira mensagem diz `useLocation() may be used only in the context of a <Router> component.` embora o código tenha chamado `useSearchParams`: por dentro, `useSearchParams` usa `useLocation`, e quem lança o erro é o primeiro que percebe. Leia assim: «este hook precisa de um roteador acima e não o encontrou». A correção nunca é mexer no hook, e sim renderizar o componente dentro de um roteador; na lição 8, `montarEn(direccion)` faz exatamente isso com `createMemoryRouter(rutas)`.

O segundo caso é o de 5.1.6. O boundary próprio nem ficou sabendo: o React diz no console que vai usar o boundary `RenderErrorBoundary`, que é do React Router, e na tela aparece `Unexpected Application Error!` seguido da mensagem. (A figura tira da saída o bloco com o stack trace do erro, que traz caminhos da máquina. E em uma execução de desenvolvimento o React Router acrescenta um parágrafo para quem programa, que convida a declarar um `ErrorBoundary` próprio; a figura roda com a versão de produção do pacote, que não o traz.) É o mesmo que apareceu no `revisor` em 5.1.6, e a correção é a daquela seção: um `ErrorBoundary` na rota.

**O parâmetro que pode faltar.** Remova o valor padrão em `PaginaServicio` e escreva `const { nombre } = useParams();`. Isto é o que `tsc -b` responde:

```text
$ npx tsc -b
src/detalle/PaginaServicio.tsx(12,45): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(13,35): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(45,13): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(46,33): error TS2538: Type 'undefined' cannot be used as an index type.
```

Quatro erros, um para cada lugar que **exige** uma `string`: a consulta do detalhe, a mutação, a prop `nombre` de `EditorNota` e o índice `notas[nombre]`. Os outros três usos (o título da aba, o do cartão e a `key`) não reclamam: uma template string converte `undefined` na palavra `"undefined"` e a exibe na tela sem avisar, e esse é um erro que o TypeScript não pega. É o mesmo aviso de 5.2.1 visto pelo compilador: `useParams` não pode prometer que o parâmetro existe. Há três correções razoáveis: o valor padrão `= ""` que o ponto de controle usa; uma verificação no início que renderize outra coisa se ele faltar; ou, no modo framework, os tipos gerados por rota. O que não é razoável é silenciá-lo com `nombre!`: essa exclamação diz ao TypeScript «confie em mim», e é exatamente o que o compilador estava evitando. (Este erro foi provocado em uma cópia do ponto de controle; o original passa limpo no `tsc -b`.)

## O que se faz errado

**Copiar o endereço para um `useState` e sincronizá-los com um Effect.** «Leio `?q=` ao montar, guardo em um estado, e um Effect escreve o estado no endereço quando ele muda.» São duas fontes de verdade, um render extra a cada mudança e um Effect que não se sincroniza com nada externo. O endereço já é o estado: leia-o a cada render.

**Usar `<a href>` para navegar dentro da aplicação.** Funciona, e por isso engana: cada clique recarrega a página inteira: perde-se o cache do TanStack Query, perdem-se as notas do layout, e o navegador volta a pedir a página e a iniciar toda a aplicação do zero. Dentro da aplicação, `Link`; `<a>` puro só para sair dela.

**Um botão com `onClick` que navega, em vez de um link.** Perde tudo o que um link dá de graça: abrir em outra aba, copiar o endereço, ser anunciado como link pelo leitor de tela. Se leva a outro lugar, é um link.

**Escrever no histórico a cada tecla.** Sem `replace: true`, uma caixa de busca deixa uma entrada por letra, e «Voltar» vira um «desfazer» letra por letra (figura 3).

**Montar endereços sem codificar.** `` `/servicios/${nombre}` `` funciona com `pagos` e falha no dia em que um nome traz `/`, `?` ou `#`. Codifique ao colocar o texto, com `encodeURIComponent`, e deixe `useParams` decodificar.

**Confiar no boundary de fora para os erros das páginas.** `LimiteDeError` em `main.tsx` não vê o que acontece dentro das rotas: o React Router captura antes. Sem um `ErrorBoundary` próprio, a pessoa vê `Unexpected Application Error!` e o stack trace do erro (5.1.6).

**Criar o roteador dentro de um componente.** Cada render criaria um roteador novo que começa do zero. Ele é criado uma vez, no nível do módulo, como a documentação pede.

**Instalar `react-router-dom`.** O pacote continua no npm, mas ficou na versão 7 (medido: sua versão `latest` é a 7.18.4, e depende de `react-router` 7.18.4); a 8 já não o publica. Por isso `npm install react-router-dom` não falha: traz em silêncio uma segunda cópia, `react-router@7`, ao lado da 8. Misturando importações dos dois pacotes, cada cópia procura seu próprio roteador e não encontra o da outra, e o resultado é o primeiro erro da figura 4. Tudo vem de `react-router`, e `RouterProvider` de `react-router/dom`.

**Dar a publicação como testada porque o `vite preview` funciona.** O `vite preview` reescreve para `index.html` por conta própria. O único teste que vale é recarregar uma rota profunda no servidor onde se publica.

**Guardar no endereço o que não descreve a visão.** Um rascunho pela metade, uma senha, um token: o endereço é copiado, guardado no histórico, aparece nos logs dos servidores e viaja no cabeçalho `Referer`. Vai no endereço o que alguém gostaria de compartilhar; o resto, não.

## Exercícios

### Exercício 1 — Prever o endereço

Com o servidor de prática e `npm run dev` rodando, abra `http://localhost:5173/`. **Antes de mexer em qualquer coisa**, escreva no diário de bordo que endereço vai aparecer depois de fazer, nesta ordem: digitar `rep` em «Buscar por nombre» e depois marcar «Solo fallas». Escreva também que serviços vão aparecer, e para onde o botão «Voltar» do navegador leva. Faça e compare. Depois repita na ordem contrária (primeiro a caixa, depois o texto) a partir de `/`. O endereço é o mesmo? Isso importa?

### Exercício 2 — Remover `replace` e contar

Em uma cópia do ponto de controle, apague `{ replace: true }` de `filtrosEnUrl.ts` (com a vírgula). **Preveja** quantas vezes será preciso apertar «Voltar» para voltar ao detalhe de `pagos` se, a partir desse detalhe, se for para a lista e se digitar `inventario` na busca. Confira no navegador. Coincide com o que a figura 3 mostrou? Restaure a linha ao terminar e rode `npm run lint` e `npm run build`.

### Exercício 3 — Um boundary próprio para o detalhe

O boundary da raiz é o último recurso: quando aparece, leva junto o cabeçalho e a navegação. Para o detalhe de um serviço, dá para fazer melhor. Em uma cópia do ponto de controle, acrescente à rota `servicios/:nombre` um boundary próprio, em um arquivo novo `src/detalle/ErrorDeServicio.tsx`, que renderize um `Tarjeta` com o título `Servicio <nombre>`, um parágrafo com `role="alert"` que diga «No se pudo mostrar este servicio:» seguido da mensagem do erro, e um link «Volver al reporte». Para comprovar, faça `PaginaServicio` lançar um erro **só** quando `nombre` for `pagos`; pense onde vai o `throw` para que `npm run lint` o aceite.

**Antes de testar**, preveja três coisas: em `/servicios/pagos`, aparece o cabeçalho «Revisor» com a navegação?; que título tem a aba?; e em `/servicios/inventario`, algo muda? Confira com `npm run build` e `npm run preview`, e descarte a cópia ao terminar.

### Exercício 4 — Onde vive cada estado?

Sem olhar o código, classifique cada pedaço de estado do `revisor` em um de quatro lugares: **local** (um `useState` dentro de um componente), **endereço**, **servidor** (TanStack Query) ou **layout** (`Outlet context`). Os pedaços: o rascunho de uma nota; a nota já salva; «Solo fallas»; o texto buscado; o serviço cujo detalhe está na tela; a lista de serviços; o detalhe de um serviço; se há uma atualização em andamento («· actualizando…»). Para cada um, escreva um motivo de uma linha. Depois confira com o código.

## Soluções

### Solução 1

Ao digitar `rep`, o endereço passa por `/?q=r`, `/?q=re` e `/?q=rep`, e a lista mostra só `reportes`. Ao marcar a caixa, fica `/?q=rep&fallas=1`, e `reportes` continua aparecendo, porque está em falha. «Voltar» tira da lista para onde se estava antes de abri-la (se a aba foi aberta direto em `/`, para a página anterior do navegador), porque as quatro mudanças substituíram a entrada em vez de acrescentar outras. Na ordem contrária, o endereço fica `/?fallas=1&q=rep`. Não é a mesma string, porque `cambiarFiltros` copia os parâmetros atuais e `set` acrescenta no final um parâmetro que não existia, preservando a ordem dos que já estavam. Mas não importa: `useFiltrosEnUrl` lê cada parâmetro pelo nome com `get`, então os dois endereços renderizam exatamente a mesma coisa. Compartilhando qualquer um dos dois, quem o abrir vê a mesma visão.

### Solução 2

Sem `replace`, a partir do detalhe de `pagos` o histórico fica assim: o detalhe, a lista ao clicar em «Volver al reporte», e uma entrada para cada uma das dez letras de `inventario`. Para voltar ao detalhe são necessários onze «Voltar»: dez para desfazer as letras e um para sair da lista. É o mesmo que a figura 3 mostrou com três letras, onde um «Voltar» só desfez uma. Com `replace: true` restaurado, basta um. Este exercício se comprova com os olhos em um navegador real; a figura 3 é a versão automatizada dele.

### Solução 3

```tsx
// en una copia: revisor/src/detalle/ErrorDeServicio.tsx
import { Link, useParams, useRouteError } from "react-router";
import { Tarjeta } from "../compartido/Tarjeta";

export function ErrorDeServicio() {
  const { nombre = "" } = useParams();
  const error = useRouteError();

  return (
    <Tarjeta titulo={`Servicio ${nombre}`}>
      <p role="alert">
        No se pudo mostrar este servicio: {error instanceof Error ? error.message : "error desconocido"}
      </p>
      <p>
        <Link to="/">Volver al reporte</Link>
      </p>
    </Tarjeta>
  );
}
```

Em `rutas.tsx`, a rota de detalhe ganha seu boundary (e o arquivo, a importação de `ErrorDeServicio`):

```tsx
// en una copia: revisor/src/app/rutas.tsx (fragmento)
      { path: "servicios/:nombre", Component: PaginaServicio, ErrorBoundary: ErrorDeServicio },
```

E o erro proposital vai em `PaginaServicio` depois de todos os hooks dela, logo antes do `return`, pelo mesmo motivo que o de 5.1.6:

```tsx
// en una copia: revisor/src/detalle/PaginaServicio.tsx (fragmento)
  if (nombre === "pagos") {
    throw new Error("el detalle se rompió al dibujar");
  }
```

Com isso, a cópia passou em `npm run lint` e `npm run build`, e o Chrome entregou isto em `/servicios/pagos`:

```text
<title>Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><p role="alert">No se pudo mostrar este servicio: el detalle se rompió al dibujar</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

As três previsões. **Sim**, o cabeçalho e a navegação continuam ali: o erro procurou o boundary mais próximo para cima, e o mais próximo agora é o da rota de detalhe, que substitui só `PaginaServicio`; `Disposicion` nem ficou sabendo. O título da aba é `Revisor` e não `pagos · Revisor`: a página lançou antes de terminar de renderizar, e o Effect de `useTituloDocumento` dela nunca foi executado. Para ter o título, o próprio boundary precisa colocá-lo. E em `/servicios/inventario` nada muda: o detalhe foi renderizado completo (`Disponible: HTTP 200 en 118 ms`), porque o boundary só aparece quando algo quebra.

`useParams` funciona dentro do boundary porque o boundary é renderizado no lugar da rota, com os mesmos parâmetros dela. E a mensagem é própria de propósito: «No se pudo mostrar este servicio» diz à pessoa que parte falhou e deixa a saída à mão, enquanto o aviso da raiz fala do painel inteiro. Se o `throw` foi colocado como primeira linha do componente, `npm run lint` respondeu com `rules-of-hooks`, um erro para cada hook de baixo; e o `tsc` também reclama, porque depois de um `throw` incondicional ele já não consegue deduzir que `consulta.data` existe.

### Solução 4

| Estado | Onde vive | Por quê |
|---|---|---|
| rascunho de uma nota | local (`EditorNota`) | só importa a quem o escreve, e deve ser reiniciado ao trocar de serviço (`key`) |
| nota salva | layout (`Outlet context`) | duas páginas precisam dela, a lista (marca «com nota») e o detalhe, e ela deve sobreviver às idas e vindas |
| «Solo fallas» | endereço (`?fallas=1`) | descreve a visão e se quer compartilhá-lo |
| texto buscado | endereço (`?q=`) | igual ao anterior |
| serviço na tela | endereço (`/servicios/:nombre`) | é a própria página; na lição 2 era o `useState` `seleccionado` |
| lista de serviços | servidor (`["reporte"]`) | é do servidor; a tela guarda uma cópia em cache |
| detalhe de um serviço | servidor (`["servicio", nombre]`) | igual, com uma entrada de cache por serviço |
| «· actualizando…» | servidor (`isFetching` da consulta) | ninguém o guarda: quem o calcula é o TanStack Query |

Quem colocou as notas no endereço deve pensar no que aconteceria ao compartilhar o link: as notas viajariam para a outra pessoa, e o endereço cresceria sem limite. Quem as colocou no servidor tem razão a longo prazo — hoje elas se perdem ao recarregar —, mas a API de prática não tem uma rota para salvá-las. A [Lição 6](06-reducer-contexto.md) volta a esta tabela e acrescenta uma coluna: o contexto.

## Como saber se deu certo

- [ ] `npm ci`, `npm run lint` e `npm run build` terminam bem dentro de `~/curso-react/revisor/`, e `npm run build` deixa `dist/assets/index-CLDgPzLo.js` se o código for idêntico ao do ponto de controle.
- [ ] `npm ls react-router` mostra `react-router@8.5.0`, e `npm ls react-router-dom` responde `└── (empty)` e sai com código 1, que aqui é o esperado: não encontrou o pacote.
- [ ] Com o servidor de prática e `npm run preview` rodando, abrir `http://localhost:4173/?fallas=1` em uma aba nova mostra a caixa marcada e só `pagos` e `reportes`; o título da aba é `(2) Revisor`.
- [ ] `http://localhost:4173/servicios/pagos` mostra o detalhe de `pagos` e o título `pagos · Revisor`; `http://localhost:4173/no-existe` mostra «Página no encontrada» com o cabeçalho do `revisor` em cima.
- [ ] No navegador: escreve-se uma nota no detalhe de `pagos`, salva-se, volta-se ao relatório com «Volver al reporte» e a linha de `pagos` diz «· con nota». (Isso se comprova manualmente: as execuções desta lição não fazem cliques.)
- [ ] Ao digitar em «Buscar por nombre», o endereço muda a cada tecla, e um único «Voltar» tira da lista.
- [ ] No HTML da página (com as ferramentas de desenvolvimento, ou com o Chrome *headless*), o link «Reporte» tem `aria-current="page"` em `/` e não o tem em `/servicios/pagos`.
- [ ] Com `python3 -m http.server 4190 --bind 127.0.0.1 --directory dist`, um `curl` para `/servicios/pagos` responde `404`, e com `vite preview` a mesma rota responde `200 text/html`. Dá para explicar por quê, e os dois servidores foram encerrados.
- [ ] Em uma cópia com o `throw` de 5.1.6, `/?q=romper` mostra «Algo salió mal al dibujar el panel» com `role="alert"` e não `Unexpected Application Error!`; no ponto de controle, sem o `throw`, a lista aparece como sempre. Dá para dizer por que esse aviso não é renderizado por `LimiteDeError`.
- [ ] As seis figuras compilam com `tsc` e a saída delas coincide com a da lição.
- [ ] No [diário de bordo](bitacora.md) ficaram anotados que estado foi para o endereço, que estado subiu para o layout, e o 404 que apareceu com o Python.

## Resumo

Responda sem olhar a lição:

1. Que quatro coisas que faltavam ao painel de endereço único são resolvidas ao guardar a visão no endereço?
2. O que uma rota índice renderiza? Por que `servicios/:nombre` não começa com `/`? O que `*` captura?
3. Por que o roteador é criado no nível do módulo, e por que `QueryClientProvider` fica fora de `RouterProvider`?
4. Por que as notas subiram para o layout, e como as páginas as leem?
5. Por que `useParams` tipa o parâmetro como `string | undefined`? Em que momento `catálogo` é codificado e em que momento é decodificado?
6. Por que `PaginaServicio` não é montada de novo ao passar de `/servicios/pagos` para `/servicios/inventario`, e o que `key={nombre}` faz em `EditorNota`?
7. Por que os filtros são lidos do endereço a cada render em vez de serem guardados em um `useState`? O que `replace: true` muda?
8. O que o navegador pede ao servidor ao recarregar `/servicios/pagos`, o que o servidor deve responder, e por que testar com `vite preview` não demonstra nada sobre produção?
9. Por que `LimiteDeError` deixou de ver os erros das páginas quando o roteador entrou? Onde se declara o boundary que os captura, por que seu aviso substitui o cabeçalho, e para que `LimiteDeError` continua em `main.tsx`?

## Leituras complementares

- [React Router, «Picking a Mode»](https://reactrouter.com/start/modes) e [«Installation» (modo de dados)](https://reactrouter.com/start/data/installation): os modos declarativo, de dados e framework, o que cada um acrescenta, e de onde se importam `createBrowserRouter` e `RouterProvider`. Consultado em 21 de outubro de 2026.
- [React Router, «Routing» (modo de dados)](https://reactrouter.com/start/data/routing): rotas como objetos, rotas aninhadas com `<Outlet />`, rotas índice, segmentos dinâmicos e `*`. Consultado em 21 de outubro de 2026.
- [React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter): que usa `pushState` e `replaceState`, e que o roteador é criado uma vez fora da árvore do React. Consultado em 21 de outubro de 2026.
- [React Router, `useParams`](https://reactrouter.com/api/hooks/useParams): os parâmetros dinâmicos do endereço e seu tipo. Consultado em 21 de outubro de 2026.
- [React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams): o par de parâmetros e função, a forma com função, a advertência sobre chamadas seguidas e sobre mutar o objeto. Consultado em 21 de outubro de 2026.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext): compartilhar estado do pai com as rotas filhas, e a recomendação de um hook próprio com TypeScript. Consultado em 21 de outubro de 2026.
- [React Router, `Link`](https://reactrouter.com/api/components/Link) e [`NavLink`](https://reactrouter.com/api/components/NavLink): o `<a href>` aprimorado, `replace`, a classe `active`, `aria-current="page"`, `end` e o caso especial de `/`. Consultado em 21 de outubro de 2026.
- [React Router, «Error Boundaries»](https://reactrouter.com/how-to/error-boundary): como os erros de uma rota são capturados, o boundary mínimo na rota raiz, `ErrorBoundary` com `useRouteError` no modo de dados, os três casos (`isRouteErrorResponse`, `Error`, qualquer outra coisa) e como o erro sobe até o boundary mais próximo. Consultado em 21 de outubro de 2026.
- [React Router, «Upgrading from v7»](https://reactrouter.com/upgrading/v7): por que a versão 8 já não publica `react-router-dom`, e as versões mínimas de Node e React. Consultado em 21 de outubro de 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): o mesmo componente na mesma posição preserva seu estado, e `key` o reinicia. Consultado em 21 de outubro de 2026.
- [MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) e [`History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState): acrescentar ou substituir uma entrada do histórico sem carregar o endereço. Consultado em 21 de outubro de 2026.
- [MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) e [`encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent): ler e escrever a busca, o espaço como `+`, e que caracteres são codificados em um pedaço de endereço. Consultado em 21 de outubro de 2026.
- [Vite, «Shared Options», `appType`](https://vite.dev/config/shared-options): o valor `'spa'` padrão e o fallback para `index.html` de `vite dev` e `vite preview`. Consultado em 21 de outubro de 2026.
- [Python, `http.server`](https://docs.python.org/3/library/http.server.html): o servidor estático de linha de comando, `--directory`, `--bind`, o 404 de um arquivo que não existe e a advertência de não usá-lo em produção. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| roteador | a peça que lê o endereço, decide que componentes renderizar e muda o endereço sem recarregar a página |
| rota do cliente | um endereço que existe só para o roteador, como `/servicios/pagos`; no servidor não há nenhum arquivo com esse nome |
| layout | o componente de uma rota pai: renderiza o que não muda entre páginas e deixa um `<Outlet />` para a página |
| rota índice | a rota filha sem `path` que é renderizada quando o endereço é exatamente o do pai |
| segmento dinâmico | a parte de uma rota que começa com `:`, como `:nombre`; o que estiver nessa posição é entregue como parâmetro |
| busca (*query string*) | o que vem depois do `?` em um endereço, como `fallas=1&q=pag`; é lida com `useSearchParams` |
| codificação por porcentagem | escrever em um endereço os caracteres especiais como `%` e dois dígitos hexadecimais por byte, como `á` → `%C3%A1` |
| `replace` | navegar substituindo a entrada atual do histórico em vez de acrescentar outra |
| error boundary | o componente renderizado no lugar do que está abaixo dele quando algo ali lança um erro ao renderizar; o React Router coloca um em cada rota, e o nosso é declarado com `ErrorBoundary` |
| reescrita (fallback de SPA) | a regra do servidor que responde `index.html` a qualquer endereço que não seja um arquivo, para que a aplicação inicie e o roteador decida |

---

**Próxima:** [Lição 6 — Estado compartilhado: reducer e contexto](06-reducer-contexto.md)
