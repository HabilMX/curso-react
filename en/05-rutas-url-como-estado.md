# Lesson 5 — Routes and the URL as State

*It is 11:10 PM and you are on call. At 11:04 PM `pagos` started failing, and the operations person handling the incident messages you in chat: “Can you send me the dashboard already filtered, just with what's failing?”. You paste the URL you have in your browser. She opens it and sees all four services, unfiltered, because the “Solo fallas” checkbox lived in your browser tab's memory and not in the URL. You explain in writing: “check the box, then click on pagos”. She does so, sees the details, and to get fresh data hits F5. The browser responds with a server error page: `404 File not found`. At 11:12 PM she calls to ask if the dashboard is down too. It wasn't down. It was missing two things: a URL that says what you are seeing and a server that knows what to answer when someone reloads that URL. This lesson builds both.*

**Time:** 2 × 45 min (the natural break is between sections 5.2 and 5.3)

**What you build:** the `revisor` with three linkable screens: the list at `/`, each service's details at `/servicios/:nombre`, and a “not found” page for any other URL; the “Solo fallas” and “Buscar por nombre” filters travel in the URL (`?fallas=1&q=pag`), and notes survive navigating back and forth between screens; and if a page breaks during rendering, the dashboard displays its own notice rather than an error page in English

**What you learn:** routes as objects with `createBrowserRouter`, nested under a layout with `<Outlet />`; route parameters with `useParams` and search parameters with `useSearchParams`; a filter shared by copying the link; `Link` and `NavLink`; route error boundaries with `ErrorBoundary` and `useRouteError`; **what happens when someone reloads a client-side route and why the server must respond with `index.html`**

**Where you are coming from.** From [Lesson 4](04-estado-del-servidor.md). Your `revisor` already fetches data with TanStack Query: the report is requested with `useQuery`, cached, updated in the background every 10 seconds, and has its four states plus one (loading, error, empty, with data, and stale data with a warning). Service details appear below the list, in a `PanelDetalle`, when you click its name, and the “Volver a revisar” button is a mutation that invalidates both the report and the details. All of that lives on a single screen, governed by the `Panel` component, which stores three states with `useState`: `soloFallas`, `seleccionado`, and `notas`. You start from the checkpoint [`programas/04-estado-del-servidor/revisor/`](../programas/04-estado-del-servidor/revisor).

**What this lesson does not do.** It does not touch the practice server: it stays at version C, the same one from Lesson 4, with the same routes. It does not use React Router loaders or actions: data continues to be fetched by TanStack Query, for reasons explained in 5.1. It does not move notes into a React context: they move up one level, to the route layout, and [Lesson 6](06-reducer-contexto.md) discusses whether that is their permanent home. It does not add the creation screen, which arrives with its `/servicios/nuevo` route in [Lesson 7](07-formularios-accesibilidad.md). It does not test routes with an in-memory router inside a test suite: that is [Lesson 8](08-pruebas-de-componentes.md), although this lesson's figures already use that router. And it does not write the server that serves `dist/` with URL rewriting: this lesson demonstrates why it is needed; [Lesson 9](09-rendimiento-publicacion.md) writes it.

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions from this lesson's `package.json`, and with Python 3.12 for the static server in 5.3. The checkpoint was installed from scratch with `npm ci`; `npm run lint` and `npm run build` finished cleanly and produced `dist/assets/index-CLDgPzLo.js`, the same name produced by the checkpoint when verified inside a Linux container (Debian 12, `node:24.22.0-bookworm` image). It was not run on real Linux Mint; nothing shown here depends on the OS. On macOS, `npm ci` prints an `install-scripts` warning about `fsevents@2.3.3`: this is an optional dependency installed only on macOS for file watching; there is no need to approve it, and it will not appear on your Mint. What is seen “in the browser” was measured using headless Chrome (`--headless --dump-dom`) against `vite preview`, with the `--virtual-time-budget` option, which advances the page clocks so there is no real-time waiting: because of this, the practice server log timestamps (in UTC) cannot be used to measure latency in this lesson, only to count requests. The runs for the error boundary (5.1.6, Exercise 3) and the `curl` runs in 5.3 were performed with the practice API on port 3199 and with `vite preview` and the Python server on port 4199, because on the test machine the usual ports were occupied by other processes; the lesson displays them with the course's standard ports (3100, 4173, and 4190), which is the only thing that changes. The figures were run with their own `package.json` in [`programas/05-rutas-url-como-estado/`](../programas/05-rutas-url-como-estado), alongside `revisor/`; long paths are shown starting from `~/curso-react`.

## By the end you will be able to

- Declare an application's routes as an array of objects (`RouteObject[]`), nest them under a layout with `<Outlet />`, and predict which component renders each URL, including one that does not exist.
- Read a route parameter with `useParams`, explain why TypeScript types it as `string | undefined`, and verify that it arrives decoded (`cat%C3%A1logo` → `catálogo`).
- Store filters in the URL with `useSearchParams`, explain using a figure the difference between `replace: true` and a normal navigation for the Back button, and share a filter by copying the link.
- Use `Link` and `NavLink`, and point out in the HTML the `aria-current="page"` attribute and the `active` class applied by `NavLink`.
- Explain why a route component preserves its state when only the parameter changes, and reset it with `key`.
- Explain why the `LimiteDeError` from Lesson 4 stops seeing page errors once the router enters, trigger the `Unexpected Application Error!`, and declare an `ErrorBoundary` on the root route that displays the same notice.
- Demonstrate with `curl` that a static server without rewriting responds with 404 when reloading `/servicios/pagos`, and that `vite preview` responds with `index.html`.

## The why before the how

The `revisor` from Lesson 4 works, but it has **a single URL**: `http://localhost:5173/`. Everything else—whether you are filtering, which service you selected, what note you wrote—lives inside the tab, in the state of `Panel`. Ask that screen four questions and you will see the gaps.

**Can you share what you are seeing?** No. The URL is always the same, so whoever opens it sees the full list, unfiltered, and with no service selected. To “share” a view, you have to send instructions. That is the scene from the beginning.

**Does the Back button work?** Not either. If you select `pagos` and then `inventario`, and hit Back, the browser does not return to `pagos`: it exits the dashboard, because as far as the browser is concerned, there was never more than one page. The user clicks the button they use most in their daily life and the application does something unexpected.

**What happens if you reload?** Everything that was not in the URL is lost: the filter and the selected service reset to their initial values. On an on-call dashboard, where reloading is a reflex, that means clicking through everything all over again each time.

**How does it grow?** In Lesson 7, a creation screen arrives. With a single URL, `Panel` would have to decide what to render with more and more `if` statements, and each new screen would be another branch of state that someone forgets to reset.

All four questions share the same answer: **what the user is seeing must be written in the URL.** The URL is state, just like a `useState`, with three advantages no `useState` has: it can be copied, the browser preserves its history (which is why Back exists), and it survives a reload. And it carries a consequence that is easy to overlook: if the URL `/servicios/pagos` can be copied, someone is going to paste it into a freshly opened browser, and that browser is going to request it **from the server**, which has never heard of `pagos`.

The tool for the first part is a **router**: a component that reads the URL, decides which components to render, and updates the URL without reloading the page as the user navigates. The course uses **React Router**, version 8.5.0, and installs it as a single package, `react-router`: version 8 stopped publishing `react-router-dom`, the package you see in older tutorials, and browser-specific pieces are now imported from `react-router/dom` ([React Router, «Upgrading from v7»](https://reactrouter.com/upgrading/v7)). The same guide establishes its requirements: Node 22.22 or higher and React 19.2.7 or higher; the course uses Node 24 and React 19.3.1. For the second part, no library is needed—just an understanding of what the browser asks of the server and what the server must answer; that is 5.3.

The lesson has three parts, one per concept: routes as objects, the layout wrapping them, and the error boundary protecting them (5.1); parameters and search, that is, the URL as state (5.2); and reloading a client route (5.3). In the end, this is what `revisor` renders when you open `http://localhost:4173/?fallas=1` in a fresh browser, without having clicked a single thing (the title and container are shown exactly as headless Chrome delivered them):

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox" checked=""> Solo fallas</label><label>Buscar por nombre <input type="search" value=""></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="falla"><a href="/servicios/pagos" data-discover="true">pagos</a>: falla (HTTP 503)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul><p class="actualizado">Actualizado a las 2:14:52 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

The checkbox arrives checked (`checked=""`) and the list brings only `pagos` and `reportes`. Nobody checked it: the URL checked it.

## The concepts

### 5.1 Routes are objects, and the layout wraps them

#### 5.1.1 Installing the router, and which mode to use

From `~/curso-react/revisor/`, with the exact version fixed by the course:

```bash
npm install --save-exact react-router@8.5.0
```

The checkpoint's `package.json` looks like this; the version changes, tracking the lesson, along with the new dependency:

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

React Router can be used in three ways, which its documentation calls **modes** and which stack on top of each other ([React Router, «Picking a Mode»](https://reactrouter.com/start/modes)). In **declarative mode**, you wrap the application in a `<BrowserRouter>` and write routes as components inside the tree. In **data mode**, you declare routes **outside** of React as an array of objects passed to `createBrowserRouter`, and render them with `<RouterProvider>`; in return, you gain loaders, actions, and navigation states. And **framework mode** wraps data mode with a Vite plugin that adds file conventions, code splitting, and server-side rendering.

The course uses data mode, but not its loaders. The reason for the former is practical: an array of objects can be **exported**, and Lesson 8 mounts that very array inside an in-memory router to test screens without a browser; this lesson's figures already do so. The reason for the latter is that `revisor` already solved data fetching in Lesson 4: TanStack Query manages caching, background updates, and sharing queries across screens. Introducing loaders on top would leave two systems responsible for the same thing. This is a design decision of the course, not a limitation of React Router; in an application without a data library, loaders are a sound solution. Framework mode is omitted for the same reason Lesson 9 discusses when talking about frameworks: the course wants you to see every piece.

#### 5.1.2 The `revisor` routes

This is the most important new file of the lesson. It is an array of objects, and each object specifies **which URL** and **which component**:

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

Read it from the outside in, because that is how React Router reads it:

- **The outer route**, `path: "/"`, renders `Disposicion`: the header, the navigation, and the outlet where the page goes. All other routes are its **children** (`children`), so the layout always renders, regardless of the page. The documentation states it like this: the parent route's path is automatically prepended to each child's, and children render inside the parent's `<Outlet />` ([React Router, «Routing»](https://reactrouter.com/start/data/routing)).
- **The index route**, `index: true`, has no `path`: it is the page that renders in the `<Outlet />` when the URL matches the parent exactly, `/`. That is the report.
- **`servicios/:nombre`** does not start with `/` because it is relative to the parent: the full path is `/servicios/:nombre`. The colon marks a **dynamic segment**: when the URL matches, whatever is in that position is delivered as the `nombre` parameter.
- **`*`** matches anything that no sibling route caught. It is the “not found” page.
- **`ErrorBoundary: ErrorDeRuta`** is not a URL: it specifies what to render if something in this route, or any of its children, breaks during rendering. It is the final piece of 5.1, and has its own section, 5.1.6.

Notice that the routes use `Component: PaginaReporte` rather than `element: <PaginaReporte />`. Both forms exist; with `Component`, you pass the component reference and React Router renders it when needed, without instantiating elements in advance. This is the convention used in current documentation examples.

What about route order? You might think `*` has to go at the end to avoid “swallowing” the others. That is not necessary: React Router does not test routes in the order they were written; instead, it **ranks** them by specificity: a static segment beats a dynamic one, and a dynamic one beats `*`. The documentation page intended to explain the algorithm, [«Route Matching»](https://reactrouter.com/explanation/route-matching), is empty in this version (accessed October 21, 2026), so it was verified by hand: using `react-router`'s `matchRoutes` function with three routes declared in reverse order (`*`, then `servicios/:nombre`, then `servicios/nuevo`), `/servicios/nuevo` matched the static route, `/servicios/pagos` matched the dynamic one, and `/otra` matched the wildcard. Even so, the course writes them from most specific to least, because it reads better. Lesson 7 adds `servicios/nuevo` right before `servicios/:nombre` for that very reason.

The first figure verifies these four rules without a browser. It builds a route tree shaped just like `revisor`'s, using components that simply print what they are, and renders it with `createMemoryRouter`, the sibling of `createBrowserRouter` that keeps the URL in memory rather than reading it from the browser address bar:

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

Five URLs, five responses, and across all five `[disposición]` appears: the outer route always renders. The third line previews something from 5.2: the URL carried `cat%C3%A1logo`, percent-encoded, and the parameter arrived as `catálogo`. The last two show that a dynamic segment is **exactly one segment**: `/servicios` (missing a segment) and `/servicios/pagos/extra` (having an extra one) do not match `servicios/:nombre`, and are caught by `*`.

#### 5.1.3 Creating the router once, outside React

Startup changes very little. `Panel` disappears from `main.tsx` and the router takes its place:

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

Two details matter. First: **`createBrowserRouter(rutas)` is called only once, on module load, outside of any component.** The documentation is explicit: data routers are not stored in React state; they are created once outside the tree and passed to `<RouterProvider>` ([React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter)). If you created it inside a component, every render of that component would create a brand new router, starting from scratch. It is the same principle Lesson 0 observed with `cargarReporte`: what must stay consistent is declared at the module level. And note where each piece comes from: `createBrowserRouter` from `react-router`, and `RouterProvider` from `react-router/dom`, as outlined in the data mode installation guide ([React Router, «Installation»](https://reactrouter.com/start/data/installation)).

The second detail is the **wrapper order**. The TanStack Query cache lives inside the `clienteConsultas` object created once by `main.tsx`; `QueryClientProvider` simply makes it accessible to the components beneath it. By placing it **outside** of `RouterProvider`, all pages can reach it: when you navigate from the list to the details, `PaginaReporte` unmounts, but the report remains in the cache, and upon returning the list can render with that data immediately while Query determines whether to refetch (what Lesson 4 called `staleTime`). If you placed the provider inside `PaginaReporte`, `PaginaServicio` would be left without a client and its `useQuery` would throw an error. And if you also created the client inside the page, the cache would indeed be destroyed every time the page unmounted.

What does “rendering with the browser router” actually mean? `createBrowserRouter` updates the URL using `history.pushState` and `history.replaceState`, two browser APIs that modify what the address bar displays **without requesting anything from the server**. MDN puts it like this regarding `pushState`: the browser will not attempt to load this URL after calling it, though it might attempt to load it later, for example after restarting ([MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)). Keep that phrase in mind, “it might attempt to load it later”, because all of section 5.3 is about it.

#### 5.1.4 The layout and `<Outlet />`

The layout is the component for the outer route. It renders what does not change between pages and leaves a placeholder for what does:

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

The `<Outlet />` is that placeholder. When the URL is `/`, `PaginaReporte` renders there; when it is `/servicios/pagos`, `PaginaServicio`. The header and navigation do not remount when navigating between pages: they remain the same components with the same state. And that is exactly what we leverage for notes.

In Lesson 2, notes lived in `Panel`, alongside the list and the details, because both needed them. Now the list and details are **different pages**, and when you navigate from one to the other, the first unmounts. If notes still lived in `PaginaReporte`, you would write a note on the `pagos` detail page, return to the list, and the “con nota” indicator would be gone, because the list's state was destroyed upon leaving and created empty upon returning. The rule from Lesson 2 still holds, just one level higher: **state rises to the closest common ancestor of the components that use it**, and the common ancestor of both pages is the layout.

To pass the value down to pages, `<Outlet>` accepts a `context` prop, and pages read it with the `useOutletContext` hook. The documentation presents it precisely for this use case: parent routes often manage state they want to share with their child routes, and this pattern is so common that it comes built into `<Outlet>`, without needing to create a dedicated React context ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)). The same page recommends that, with TypeScript, the parent provide **a custom hook** to consume it, ensuring consumers receive the correct type and making it clear who uses it. That is `contextoNotas.ts`:

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

`useNotas()` is the only place in the codebase that calls `useOutletContext`, and the only place that informs TypeScript of the value's shape. Pages import `useNotas` without knowing where notes come from. If in Lesson 6 notes move elsewhere, only this file changes.

An honest observation about `Disposicion`: the `contexto` object and the `guardarNota` function are recreated on every render. That means whenever the layout re-renders, any page consuming the context does as well. This has not shown up as a measurable problem, and the course does not memoize without measurement showing the need; Lesson 9 teaches how to measure it.

#### 5.1.5 The “not found” page

The `*` route renders this page:

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

`useLocation()` returns the current location; from it, only `pathname` is needed, to tell the user which URL does not exist. The page renders **inside** the layout, so the header and navigation remain in place: the user has a way out. And it sets its own document title using the hook from Lesson 3. Here is what Chrome delivered for `/no-existe`:

```text
<title>Página no encontrada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Página no encontrada"><h2>Página no encontrada</h2><p>No existe ninguna página en /no-existe.</p><p><a href="/" data-discover="true">Ir al reporte</a></p></section></main></div>
```

#### 5.1.6 When a page breaks: the route error boundary

There is another kind of “broken page”, and it is worth distinguishing from the previous one: the page that **exists** but throws an error while rendering. In Lesson 4, you wrote `LimiteDeError` specifically for that: it wrapped `Panel`, and if anything broke during rendering, instead of a blank screen, a notice appeared with the message and a button to reload. In `main.tsx`, it is still there, now wrapped around `RouterProvider`. It looks like nothing changed. It did change, and the only way to believe it is to see it.

To see it, we need a page that breaks. In a **copy** of the checkpoint—never in the original—add an error to `PaginaReporte`, right after `useTituloDocumento`, triggered from the URL:

```tsx
// en una copia: revisor/src/reporte/PaginaReporte.tsx (fragmento)
  if (filtros.texto === "romper") {
    throw new Error("la página se rompió al dibujar");
  }
```

It goes after the hooks, rather than as the first line of the component, for a reason you already know: with a `throw` before `useQuery`, subsequent hooks would only be called “sometimes”, and `react-hooks/rules-of-hooks` rejects it with an error per hook (measured: four). With `npm run build`, the practice server, and `npm run preview` running, open `http://localhost:4173/?q=romper`. Here is what Chrome delivered with the code `revisor` had prior to this section (the error stack, ten lines containing machine paths, is trimmed with `…`):

```text
<title>Revisor</title>
<div id="raiz"><h2>Unexpected Application Error!</h2><h3 style="font-style: italic;">la página se rompió al dibujar</h3><pre style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);">Error: la página se rompió al dibujar
    at …</pre></div>
```

No sign of `LimiteDeError`: neither its `role="alert"`, nor “Algo salió mal al dibujar el panel”, nor the reload button. In its place is an English error page displaying the raw error stack to anyone, which your code never rendered. And with it went the header and navigation. That is what the on-call engineer in our scene would see at 11:10 PM if the dashboard had a flaw.

The reason: React Router places **its own error boundary on every route**. When a page throws, React looks upward for the nearest boundary, and the nearest one is no longer `LimiteDeError`: it is React Router's, positioned between your boundary and the page. The documentation explains it like this: route errors are caught automatically and the nearest `ErrorBoundary` renders; if a route does not define one, the error bubbles up to the parent route ([React Router, «Error Boundaries»](https://reactrouter.com/how-to/error-boundary)). If no route declares one, React Router renders its default fallback, which is what you just saw. The error never reaches `LimiteDeError`, because someone caught it first.

Figure 6 reproduces both scenarios without a browser, using a minimal layout and a page that throws. First without a custom boundary, then with one on the root route reading the error via `useRouteError`:

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

Three takeaways emerge from that run. Without a custom boundary, `Unexpected Application Error!` stays on screen with no `role="alert"`: a screen reader announces nothing. With the boundary on the root, your notice renders, complete with `role="alert"`. And in both cases **the header is gone**, because a route's boundary renders **in place of** what that route would have rendered, and here the route with the boundary is the outer one, the one rendering the layout. (The two console warnings appear in both cases: catching an error does not hide it from the developer.)

The fix is to declare that boundary. The same documentation page urges that every application have at least one on the root route. In data mode, it is declared via the route object's `ErrorBoundary` property, and the component reads the error with `useRouteError()`, since it receives no props. `errorElement` also exists, taking a pre-instantiated element; it mirrors the distinction between `Component` and `element`, and the course uses `ErrorBoundary` for the same reason it uses `Component`.

What should it display? In `revisor`, it is idiomatic to show **the exact same notice** as `LimiteDeError`. For someone using the dashboard, “something broke while rendering” means the same thing regardless of where it came from, and maintaining two different notices for the same situation would be unnecessary overhead. To avoid writing the notice twice, presentation moves out of the class into its own component:

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

`LimiteDeError` does what it did in Lesson 4; it simply delegates rendering:

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

And here is the route boundary:

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

`useRouteError` delivers whatever was thrown, and its type is `unknown`, not `Error`, because in JavaScript anything can be thrown: a string, a number, an object. That is why `describirError` checks before reading. The documentation distinguishes three cases, and `describirError` handles them in order: a React Router error response, identified with `isRouteErrorResponse` and containing `status` and `statusText` (thrown by loaders and actions; `revisor` does not use them, so none arrives today, but covering it takes three lines); an `Error`, with its `message`; and anything else. Note that `ErrorDeRuta` is a **function** component: the only class in the course remains `LimiteDeError`, because React Router already implemented the class for you, asking only for what to render.

Finally, we wire it up: the `ErrorBoundary: ErrorDeRuta` line in `rutas.tsx`, which you already saw in 5.1.2. With it, the same rebuilt copy delivered this on `/?q=romper`:

```text
<title>Revisor</title>
<div id="raiz"><div role="alert" class="limite-de-error"><h2>Algo salió mal al dibujar el panel</h2><p>la página se rompió al dibujar</p><button type="button">Recargar la página</button></div></div>
```

It is the notice from Lesson 4, word for word, with its `role="alert"` and button. And in the same copy, `/?q=pag` continued rendering the list with its header: the boundary only appears when something breaks. Two more details: the document title remained `Revisor`, the one from `index.html`: the page that threw never finished rendering, and its `useTituloDocumento` Effect never ran. And the header disappeared, just as in Figure 6: this boundary is the last line of defense, replacing everything. If you want the user to retain the header and navigation when **one** page breaks, the boundary must be placed further down; that is Exercise 3.

Is `LimiteDeError` redundant then? No. Route boundaries only see what renders **inside** routes. Anything outside them, such as `QueryClientProvider`, falls outside their reach, and `LimiteDeError` in `main.tsx` remains in place to guard that layer. Each watches its own floor, and both present the same notice.

### 5.2 Parameters and search: the URL as state

A URL has parts, and React Router delivers two of them as data. In `http://localhost:5173/servicios/pagos`, the relevant part is the **path** (`/servicios/pagos`), and the dynamic segment is read with `useParams`. In `http://localhost:5173/?fallas=1&q=pag`, the path is `/` and what comes after the `?` is the **search query** (*query string*), read with `useSearchParams`. Both are state: they change what renders, and changing them constitutes navigation.

#### 5.2.1 The route parameter: `useParams`

The service detail view stops being a panel below the list and becomes a full page. `PanelDetalle` disappears, replaced by `PaginaServicio`:

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

The first line of the component is the key to understand: `const { nombre = "" } = useParams();`. `useParams` returns the URL's dynamic segments as an object; here, `{ nombre: "pagos" }` ([React Router, `useParams`](https://reactrouter.com/api/hooks/useParams)). Its TypeScript type indicates that each value is `string | undefined`, and this is not pessimism: the hook does not know which route you are calling it in, and a component could be used in a route without `:nombre`. The `= ""` provides a default value so the rest of the component works with a `string`. In “The error you will see”, you will remove it to observe the four compiler errors that arise. In practice, this page is only ever rendered at `servicios/:nombre`, so `nombre` never arrives empty.

With that name, the page does what `PanelDetalle` used to do: it requests details using the same query from Lesson 4, `consultaDetalle(nombre)`, whose key `["servicio", nombre]` isolates each service's cache, and offers the “Volver a revisar” mutation. What is new is what is no longer needed. In Lesson 4, `ContenidoReporte` verified that the selected service existed in the list before displaying its panel. Now anyone can type `/servicios/nada` into the address bar, and the page has no list against which to check. Nor does it need one: the API responds with 404 for a non-existent service, `cargarDetalle` turns that into an error, and the page renders the alert. Here is what Chrome delivered:

```text
<title>nada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio nada"><h2>Servicio nada</h2><p role="alert">No se pudo cargar el detalle: la API respondió 404</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

And here is what the practice server log recorded:

```text
08:15:01.057 GET /api/servicios/nada 404
08:15:01.263 GET /api/servicios/nada 404
08:15:01.468 GET /api/servicios/nada 404
```

Three requests for a single visit. This is not `StrictMode`, because this is the production build where no extra cycle runs: it is the `retry: 2` configured on the query client in Lesson 4, which retries **any** error, including a 404 that is never going to change. (The timestamps are clustered because of Chrome's accelerated virtual clock; with a normal browser, retries arrive spaced out.) This is a behavior you can refine—retrying only when an error is transient—but it is beyond this lesson's scope; note it in your logbook as something you observed.

#### 5.2.2 Encoding when writing, decoding when reading

The `catálogo` service has an accented `á`. In a URL, characters outside a small set travel **percent-encoded**: `á` represents two bytes in UTF-8, written as `%C3%A1`. Whoever constructs the URL encodes; whoever reads it decodes. In `revisor` there are three stages:

1. `FilaEstado` constructs the link with `encodeURIComponent(estado.nombre)`, converting `catálogo` into `cat%C3%A1logo`. `encodeURIComponent` is used rather than `encodeURI` because it also encodes characters that hold syntactic meaning in a URL, such as `/`, `?`, and `#` ([MDN, `encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)). If a service were ever named `a/b`, unencoded the path would be `/servicios/a/b`, which is a different route entirely, falling into the “not found” handler.
2. `useParams` delivers the parameter **already decoded**. You saw it in Figure 1: `cat%C3%A1logo` arrived as `catálogo`. The hook's documentation does not state this explicitly; the run confirms it, which is why the figure exists.
3. `cargarDetalle`, since Lesson 3, encodes the name again when requesting it from the API. The log confirms it: `GET /api/servicios/cat%C3%A1logo 200`.

Encoding twice in a row is an error (`%C3` would become `%25C3`), and not encoding at all is also an error. The rule is simple: **text traveling inside a URL is encoded right as it is inserted and decoded right as it is extracted**, and everywhere in between you work with standard text. This is what Chrome rendered when opening `/servicios/cat%C3%A1logo`:

```text
<title>catálogo · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio catálogo"><h2>Servicio catálogo</h2><dl><dt>Estado</dt><dd>Disponible: HTTP 200 en 42 ms</dd><dt>Revisiones</dt><dd>2</dd><dt>Última revisión</dt><dd>2026-10-21T08:14:55.465Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre catálogo<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

#### 5.2.3 The same page, another parameter: why `key={nombre}`

In Lesson 3, `<PanelDetalle key={seleccionado}>` reset the entire panel whenever the selected service changed. In `PaginaServicio`, the `key` is placed lower down, on `<EditorNota key={nombre}>`. Is it really necessary? To answer that, you have to know what React Router does when the URL transitions from `/servicios/pagos` to `/servicios/inventario`: **the route is the same** (`servicios/:nombre`), so the component that renders it is the same, in the exact same position in the tree. React does not see a new page; it sees the same `PaginaServicio` with a different parameter. And React's documentation is clear on what that means: the same component at the same position preserves its state ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

Figure 2 demonstrates this with a component that, like `EditorNota`, initializes its state from a prop. It navigates from `pagos` to `inventario` twice: once without `key` and once with it.

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

Without `key`, the address indicates `inventario` but the draft still says `nota sobre pagos`: `useState` only consumes its initial value the very first time the component mounts, and here it was never remounted. With `key={nombre}`, React treats each name as a completely distinct component, unmounting the old one and creating a fresh one. In `revisor`, without that `key`, the draft note for `pagos` would persist on the `inventario` page, ready to be saved under the wrong service.

Why is the `key` placed on `EditorNota` rather than on the entire page? Because the draft note is the only part that maintains internal local state. The detail query does not need resetting: its query key includes the name, so upon changing names TanStack Query switches cache entries automatically. Furthermore, today `revisor`'s interface does not offer a direct link from one service detail page to another: you always transition through the list, which unmounts the page anyway. The `key` guards against the day someone introduces a “next service” link, and it is so lightweight that waiting for that day to add it is not worth the risk.

#### 5.2.4 Filters in the search query: `useSearchParams`

Filters represent the quintessential case of “state that belongs in the URL”: they describe what you are looking at, and someone else will want to see the exact same thing. The course plan places them in the search query, using two parameters: `fallas=1` for “Solo fallas” and `q=texto` for “Buscar por nombre”. First, the type and the pure filtering function, in `resumen.ts`:

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

`Filtros` bundles both filters into a single object, and `filtrarEstados` applies them simultaneously: a service passes if it satisfies “solo fallas” (or the filter is disabled) **and** if its name contains the searched text (or nothing is being searched). The search ignores casing and leading/trailing whitespace, and uses `toLocaleLowerCase("es-MX")` so comparisons adhere to Spanish linguistic rules. It remains a pure function: same inputs, same output, and Lesson 8 tests it without React.

Now the new piece: the hook that translates between the URL and the filters:

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

`useSearchParams` returns two things, just like `useState`: the current parameters as a browser `URLSearchParams` object, and a setter function that **triggers a navigation** to the new URL ([React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams)). `URLSearchParams` is a standard browser interface with methods for reading and writing search parameters; its `get` returns `null` when a parameter is missing ([MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)). Five design decisions in this file deserve explicit attention:

- **Filters are computed, not stored.** There is no `useState` holding the filters that is then “synchronized” with the URL: every render reads them directly from the URL. This is the Lesson 2 rule, “do not store what you can compute”, applied to a new source of truth. If there were a `useState` alongside the URL, you would have two sources of truth that could diverge, and the temptation to keep them aligned using an Effect—precisely what the course's primary principle forbids.
- **`fallas` is `"1"` or does not exist.** It is read as `parametros.get("fallas") === "1"`, and disabling the filter **deletes** the parameter rather than setting `fallas=0`. The same applies to an empty `q`. This ensures the URL with no active filters remains a clean `/`, rather than `/?fallas=0&q=`.
- **The updater function takes only what changed.** Calling `cambiarFiltros({ soloFallas: true })` leaves the search query untouched, because `{ ...filtros, ...cambio }` merges the change into the existing state. Hence the parameter type `Partial<Filtros>`.
- **Copying instead of mutating.** The functional form, `establecerParametros((actuales) => …)`, receives the current parameters; the code creates a copy with `new URLSearchParams(actuales)` and mutates the copy. The documentation cautions that the object returned by the hook is mutable, and that mutating it without invoking the setter function causes values to change across renders without the URL updating. Copying prevents that trap while preserving any other parameters the URL might carry. The same page notes another contrast with `useState`: consecutive synchronous calls do **not** batch like React's functional updater. In `revisor`, each event invokes the function once, so this does not bite.
- **`replace: true`.** This is the most noticeable UX decision, and has its own dedicated figure.

#### 5.2.5 `replace: true`: writing to the URL without bloating history

Every time you change the URL using `pushState`, the browser appends an entry to its history stack, and hitting Back returns to the preceding one. When moving from the list to the details, that is exactly what you want. For a search input, it is not: every keystroke updates `q`, and if every keystroke created a history entry, typing `pagos` would create five entries, requiring the user to press Back five times just to leave the list. With `replace: true`, the navigation **replaces** the current history entry rather than appending a new one: it invokes `replaceState`, which MDN describes as the method that modifies the current history entry ([MDN, `History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)). The `Link` documentation illustrates this with diagrams: with history `A → B`, a normal link yields `A → B → C`; with `replace`, `A → C` ([React Router, `Link`](https://reactrouter.com/api/components/Link)).

Figure 3 measures this. Starting on the list after viewing the `pagos` detail (a two-entry history stack), it types `p`, `pa`, and `pag` into a search input modeled on `revisor`'s, and presses Back. It does this twice: once with normal navigation and once with `replace: true`.

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

With normal navigation, each keystroke produced a `PUSH`, and Back leaves you at `/?q=pa`: it undoes a single character. With `replace: true`, each keystroke was a `REPLACE`, and Back returns you directly to the `pagos` detail view, which is where the user intended to go. The URL is identical in both cases; what changes is the history stack. Two technical notes on the figure: React DOM is imported **after** creating the test DOM because it determines at load time whether a browser environment exists, without which keyboard events never trigger `onChange` (Figures 1, 2, and 5 do not dispatch events, only rendering and inspecting text, which is why they can import at top level); and the figure writes to the field using `HTMLInputElement.prototype.value`'s descriptor setter so React detects the modification, which is what Lesson 8 will automate with `user-event`.

This is a design choice, not an immutable law: in `revisor`, “Solo fallas” also uses `replace: true`. You could argue that checking a box deserves its own entry in browser history; the course opted to treat both filters identically, as a unified “how I am viewing the list” configuration where Back consistently means “return to the previous screen”.

What about spaces? If you search for `pago s` (with a space), `URLSearchParams` encodes the space as `+`: MDN explains that it percent-encodes as needed, encoding spaces as `+`, and decodes `+` back into spaces upon reading. You do not need to do anything: the hook writes and reads following the exact same rules. Just don't be surprised when you see `?q=pago+s` in your address bar.

#### 5.2.6 The report, now as a page

`Panel` disappears and `PaginaReporte` takes its place. It no longer holds any `useState`: the query is the same one from Lesson 4, filters are read from the URL, and notes come from the layout.

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

`cadaMs` no longer arrives as a prop from `main.tsx`: the page imports it directly from `configuracion.ts`, because `main.tsx` no longer renders pages—it renders the router. The remaining responsibilities are divided as follows:

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

`ContenidoReporte` drops three props (`seleccionado`, `alSeleccionar`, `alGuardarNota`) along with the detail panel: it no longer belongs here. Its four states plus one remain identical. It receives the filters as an object and passes them to `filtrarEstados`. Notice a detail visible in Chrome's output for `/?q=inv`: the summary states `4 servicios revisados · 2 servicios con falla` even though the list renders only a single service. This is intentional: `ResumenFallas` receives all `estados`, not the filtered ones. The summary describes the overall report; the filter determines solely which rows you see.

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox"> Solo fallas</label><label>Buscar por nombre <input type="search" value="inv"></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li></ul><p class="actualizado">Actualizado a las 2:14:55 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

The filter component gains a second field:

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

Both fields are **controlled components**: their value derives from `filtros`, which derives from the URL, and each change triggers a new URL. The complete lifecycle of a single keystroke is: the user types, `onChange` triggers `alCambiar`, the hook navigates using `replace`, the URL updates, React Router re-renders the page, `useFiltrosEnUrl` extracts the new text, and the input reflects it. It sounds lengthy, but happens within a single frame. The search input uses `type="search"`, HTML's native control for searches, which screen readers announce as a search field.

The list component now distinguishes between two empty conditions:

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

“No hay servicios configurados todavía.” (in `ContenidoReporte`) indicates that the server has no configured services: this is the fourth state from Lesson 4. “Ningún servicio coincide con los filtros.” indicates that services do exist, but your filters hide them. These are two distinct situations requiring distinct user actions—waiting for services to be configured versus clearing a filter—which is why they present distinct messages.

#### 5.2.7 `Link` and `NavLink`

The list row replaces the selection button with a link that navigates:

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

`Link` renders a standard `<a>` tag with its `href`: the documentation describes it as “a progressively enhanced `<a href>` wrapper” for client-side navigation ([React Router, `Link`](https://reactrouter.com/api/components/Link)). Chrome's output confirms this: `<a href="/servicios/pagos" data-discover="true">pagos</a>`. On click, `Link` prevents the browser from requesting the page from the server and instructs the router to navigate via `pushState`. Because it is a genuine `<a>` tag, everything a user expects from a link functions as usual: opening in a new tab via Ctrl+click or middle-click, copying its address, viewing the destination on hover. With Lesson 2's button, none of that was possible. Furthermore, screen readers announce it as a “link”, which accurately describes its behavior: it takes you elsewhere. The `data-discover` attribute is appended by React Router for route discovery, a feature of framework mode ([React Router, «Lazy Route Discovery»](https://reactrouter.com/explanation/lazy-route-discovery)); in data mode, you can safely ignore it.

Client-side navigation carries a cost that full-page reloads do not. When a browser loads a new document, screen readers announce the new page and focus resets to the top. With `pushState`, neither occurs automatically: the page changes beneath the user, while keyboard focus remains where it was. React Router offers to restore scroll position with `ScrollRestoration` (“emulates browser scroll restoration”, states its documentation, [React Router, `ScrollRestoration`](https://reactrouter.com/api/components/ScrollRestoration)), though that page does not address focus. The per-page document title set by `useTituloDocumento` provides part of the solution; the rest—managing focus to the beginning of the newly rendered page—is your responsibility. Lesson 7, focused on accessibility, revisits keyboard navigation and focus management. For now, tab through `revisor` after clicking a service and record in your logbook where focus ended up.

Navigation in the layout uses `NavLink`, a specialized `Link` aware of whether its destination matches the current URL. When it matches, it adds the `active` class and the `aria-current="page"` attribute, informing screen readers “this is the current page” ([React Router, `NavLink`](https://reactrouter.com/api/components/NavLink)). Compare the two Chrome outputs: at `/?fallas=1`, the anchor includes `aria-current="page" class="active"`; at `/servicios/pagos`, it renders `class=""`. The stylesheet applies bold styling to the active link:

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

What about `end` in `<NavLink to="/" end>`? By default, a `NavLink` remains active for any URL that **starts with** its destination: a link to `/servicios` would remain active on `/servicios/pagos`. `end` alters that behavior: it is only active if the URL **ends** at that exact path. However, the documentation highlights a special case: because **every** path starts with `/`, a `NavLink` to `/` already behaves as if `end` were specified. Figure 5 verifies this:

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

On `/servicios/pagos`, only “servicios sin end” is active; neither link to the root is active, regardless of whether `end` is present. Therefore, in `revisor`, `end` does not alter the output, but is written nonetheless: it clarifies intent (“this link is strictly for the list”) for anyone reading the code, avoiding reliance on remembering an edge-case exception.

A closing note: `.seleccionar` and `.detalle` in the stylesheet are no longer referenced by any component. They belonged to Lesson 2's button and Lesson 3's panel. The checkpoint preserves them; mark them in your notes as pending cleanup.

### 5.3 Reloading a client route: the server must respond with `index.html`

#### 5.3.1 Two paths to the same URL

There are two ways to arrive at `/servicios/pagos`, and from the server's perspective they are completely different.

**Navigating within the application.** You open `/`, the server delivers `index.html`, JavaScript executes, and you click on `pagos`. `Link` calls `pushState`, the address bar updates to `/servicios/pagos`, and React Router renders `PaginaServicio`. **The server was never involved**: the only new network request was to the API, `GET /api/servicios/pagos`.

**Arriving from the outside.** You reload with F5, paste the link into a fresh browser window, or open it from an email. Now there is no application loaded in memory. The browser does what it does with any URL: it issues a `GET /servicios/pagos` request **to the server**. This is MDN's “it might attempt to load it later”. And the server must respond with something the browser can use to bootstrap the application, allowing React Router to read the URL and render the detail page. That something is `index.html`, the exact same file served for `/`: the page itself does not change, only the initial URL with which it boots.

If the server searches for a file named `servicios/pagos` inside `dist/`, it cannot find it, because it does not exist: `dist/` contains only `index.html`, a `.js` file, and a `.css` file. So it responds with 404.

#### 5.3.2 What `vite dev` and `vite preview` return

Until now, you never encountered that 404 because both Vite servers already do the right thing. Vite includes an option, `appType`, whose default value is `'spa'` (single-page application), which enables what its documentation terms *SPA fallback*: the fallback mechanism that serves `index.html` when a requested URL does not match a physical static file ([Vite, «Shared Options», `appType`](https://vite.dev/config/shared-options)). In `vite dev`, this is handled by Vite middleware; in `vite preview`, the documentation explains that it configures `sirv`, the underlying file server, with `single: true`, the option that returns `index.html` for missing paths. Lesson 0 touched on this in Exercise 3 when `curl http://localhost:5173/salud` returned HTML. Here is what `vite preview` responded in this lesson:

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

It is `index.html`, with a 200 status code. And pay close attention to the asset paths: `/assets/index-CLDgPzLo.js`, with a leading slash `/`. That matters more than it might seem. If it were `assets/index-CLDgPzLo.js`, without the slash, the browser would resolve it **relative to the current path**, and from `/servicios/pagos` it would request `/servicios/assets/index-CLDgPzLo.js`, which does not exist. The leading slash ensures JavaScript is always requested from the exact same location, regardless of URL depth.

The fallback in `vite preview` is generous, perhaps overly so. Here is how it answered three other URLs:

```text
/no-existe → 200 text/html
/assets/no-existe.js → 200 text/html
/servicios/pagos?x=1 → 200 text/html
```

The first is expected: `/no-existe` is a client-side route, and the “not found” page is rendered by React. Notice it arrives with status **200**: the server cannot know which routes exist in `rutas.tsx`, so it cannot return 404. The second is the questionable part: a non-existent JavaScript file also receives HTML with status 200, so a browser expecting executable script receives a markup document. The production server written in Lesson 9 distinguishes between the two cases: it rewrites client-side routes to `index.html`, but responds with 404 for anything missing under `/assets/`.

#### 5.3.3 The server that does not rewrite

To observe the 404, we need a server that serves static files and nothing else. Python includes one: `python3 -m http.server`, with `--directory` to select the folder and `--bind` to listen strictly on your local machine. Its documentation warns that it is not recommended for production and explains that if a request does not map to a file, it responds with `404 File not found` ([Python, `http.server`](https://docs.python.org/3/library/http.server.html)). It is perfect for this, precisely because it is simple and dumb. With `npm run build` already executed, from `~/curso-react/revisor/`:

```text
$ python3 -m http.server 4190 --bind 127.0.0.1 --directory dist
```

And from another terminal:

```text
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/
200 text/html
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/servicios/pagos
404 text/html;charset=utf-8
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/assets/index-CLDgPzLo.js
200 text/javascript
```

The root works because `dist/index.html` exists; the JavaScript works too. But `/servicios/pagos`, which returned 200 under `vite preview`, returns 404 here. If you open the root in your browser and click on `pagos`, everything works, because the click never touches the server. If you then reload, the browser displays this, which is what the person in our opening scene saw:

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

The Python log documents it in plain text:

```text
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /assets/index-CLDgPzLo.js HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
```

There is a `GET` entry for each of the four `curl` calls, with each 404 preceded by its explanation; the final pair corresponds to the `curl` that retrieved the complete error page. (Timestamps in this log are machine local time, not UTC.) Stop the server with Ctrl+C.

The takeaway is direct: **the moment an application adopts client-side routing, the server hosting it assumes a new responsibility.** For any URL that does not map to a physical file, it must serve `index.html` and let the client-side router decide. How this is configured depends on the hosting environment: a traditional web server uses a rewrite rule, a cloud hosting platform offers a “single-page app” setting, and a custom server handles it with a few lines of code—which Lesson 9 writes. What never changes is the verification test: **reload a deep route on the real server.** Testing exclusively with `vite preview` proves nothing about production, because `vite preview` performs rewriting automatically and, as Vite's documentation has cautioned since Lesson 0, is not a production server.

There is another workaround, worth understanding only to dismiss with sound reasoning: placing the route after a `#` (`/#/servicios/pagos`). The browser never sends the fragment following `#` to the server, so the server always receives `/` and always returns `index.html`. React Router supports this via `createHashRouter`. It functions on any static server, but URLs look clunky, `#` can no longer be used for in-page section anchors, and the underlying problem—a server that cannot properly serve a modern web app—is swept under the rug rather than solved. The course uses standard URLs and configures the server properly.

## The error you will see

The lesson features one primary error—the 404 on reload, which you saw in 5.3—and two supporting errors that appear when writing pages.

**The main error: “Works on my machine.”** It works in `npm run dev`, it works in `npm run preview`, it works when clicking through the interface. It fails only when someone **reloads** or **opens a direct link** on the deployed server, failing with a page outside your application: `Error code: 404`, `File not found`, or your server's equivalent. The signature to recognize it is that the root path `/` always succeeds while everything else fails, and in the browser's Network tab the failing request is for the **document** (`/servicios/pagos`), not the API (`/api/servicios/pagos`). If the API request fails, the issue lies elsewhere. The solution is not in React: it requires configuring the server to respond with `index.html` for client-side routes.

**A route component outside the router.** Figure 4 renders two trees inside a custom error boundary modeled on `revisor`'s `LimiteDeError`. The first calls `useSearchParams` without any enclosing router, which is what happens if you render a page in isolation, such as in a test that forgot to mount it inside a router. The second is a route that throws an error while rendering inside `RouterProvider`:

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

The first message says `useLocation() may be used only in the context of a <Router> component.` even though the code invoked `useSearchParams`: internally, `useSearchParams` calls `useLocation`, and the error is raised by whichever detects the missing context first. Read it as: “this hook requires a router above it and found none”. The fix is never to alter the hook, but to render the component within a router; in Lesson 8, `montarEn(direccion)` does exactly that with `createMemoryRouter(rutas)`.

The second case is the scenario from 5.1.6. The custom boundary was bypassed: React logs that it will use the `RenderErrorBoundary` boundary provided by React Router, and the screen displays `Unexpected Application Error!` followed by the message. (The figure strips the stack trace block from the output, which includes local machine paths. In a development build, React Router also appends an advisory paragraph inviting developers to provide a custom `ErrorBoundary`; the figure runs with the production build, which omits it.) This is identical to what you saw in `revisor` in 5.1.6, and the fix is that section's remedy: an `ErrorBoundary` on the route.

**The parameter that can be missing.** Remove the default value in `PaginaServicio` and write `const { nombre } = useParams();`. This is what `tsc -b` outputs:

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

Four errors, one for each site that **requires** a `string`: the detail query, the mutation, the `nombre` prop on `EditorNota`, and the index `notas[nombre]`. The other three usages (the tab title, the card heading, and the `key`) do not complain: template string interpolation converts `undefined` into the string `"undefined"` and renders it silently—a bug that TypeScript does not catch. This is the exact warning from 5.2.1 viewed through the compiler: `useParams` cannot guarantee that the parameter exists. There are three sensible solutions: the default value `= ""` used by the checkpoint; an early guard clause rendering an alternative UI if missing; or, in framework mode, route-generated types. What is not sensible is silencing it with `nombre!`: that exclamation mark tells TypeScript “trust me”, defeating the very safeguard the compiler was providing. (This error was triggered in a copy of the checkpoint; the original passes `tsc -b` cleanly.)

## What gets done wrong

**Copying the URL into a `useState` and synchronizing them with an Effect.** “I read `?q=` on mount, store it in state, and an Effect writes state back to the URL when it changes.” That introduces two sources of truth, an unnecessary extra render per change, and an Effect synchronizing with no external system. The URL already is state: read it directly on every render.

**Using `<a href>` to navigate within the application.** It works, which is why it misleads: each click triggers a full-page reload, discarding the TanStack Query cache, wiping out notes stored in the layout, and forcing the browser to re-request the page and reboot the entire application from scratch. Within the app, use `Link`; reserve bare `<a>` exclusively for leaving the app.

**A button with an `onClick` that navigates, rather than a link.** It forfeits everything a link provides for free: opening in a new tab, copying the URL, and having screen readers announce it as a link. If it takes the user somewhere else, it is a link.

**Writing to history on every keystroke.** Without `replace: true`, a search field leaves an entry per character, turning Back into a character-by-character “undo” action (Figure 3).

**Constructing URLs without encoding.** `` `/servicios/${nombre}` `` works with `pagos` and fails the day a name includes `/`, `?`, or `#`. Encode when inserting text using `encodeURIComponent`, and let `useParams` decode it.

**Relying on the outer error boundary for page errors.** `LimiteDeError` in `main.tsx` cannot see what happens inside routes: React Router catches errors beforehand. Without a custom route `ErrorBoundary`, users see `Unexpected Application Error!` along with raw stack traces (5.1.6).

**Creating the router inside a component.** Every render would instantiate a new router starting from scratch. It must be created once at module scope, as specified by the documentation.

**Installing `react-router-dom`.** The package remains on npm, but halted at version 7 (measured: its `latest` release is 7.18.4, depending on `react-router` 7.18.4); version 8 no longer publishes it. Because of this, `npm install react-router-dom` does not fail: it silently pulls in a secondary copy, `react-router@7`, alongside version 8. Mixing imports between the two causes each copy to search for its own router context and fail to find the other's, yielding the first error shown in Figure 4. Everything is imported from `react-router`, with `RouterProvider` imported from `react-router/dom`.

**Assuming deployment works because `vite preview` succeeds.** `vite preview` handles rewrites to `index.html` automatically. The only valid test is reloading a deep route on the actual hosting server.

**Storing state in the URL that does not describe the view.** A half-written note draft, a password, an authentication token: URLs are copied, stored in browsing history, logged in server access logs, and transmitted in the `Referer` header. The URL should contain only what a user would want to share; nothing else.

## Exercises

### Exercise 1 — Predict the URL

With the practice server and `npm run dev` running, open `http://localhost:5173/`. **Before touching anything**, write in your logbook what URL you expect after performing the following actions in order: type `rep` into “Buscar por nombre”, then check “Solo fallas”. Write down which services you expect to see, and where the browser's Back button will take you. Perform the actions and compare. Then repeat in reverse order (checkbox first, then text) starting from `/`. Is the URL identical? Does it matter?

### Exercise 2 — Remove `replace` and count

In a copy of the checkpoint, delete `{ replace: true }` from `filtrosEnUrl.ts` (along with its preceding comma). **Predict** how many times you will have to click Back to return to the `pagos` detail view if, starting from that detail view, you navigate to the list and type `inventario` into the search box. Verify in the browser. Does it match what Figure 3 demonstrated? Restore the line upon completion and run `npm run lint` and `npm run build`.

### Exercise 3 — A custom error boundary for details

The root route boundary is a last resort: when it appears, it tears down the header and navigation. For a service detail view, you can do better. In a copy of the checkpoint, add a custom boundary to the `servicios/:nombre` route in a new file `src/detalle/ErrorDeServicio.tsx` that renders a `Tarjeta` titled `Servicio <nombre>`, a paragraph with `role="alert"` saying “No se pudo mostrar este servicio:” followed by the error message, and a “Volver al reporte” link. To verify it, have `PaginaServicio` throw an error **only** when `nombre` is `pagos`; consider where the `throw` belongs so that `npm run lint` accepts it.

**Before testing**, predict three outcomes: on `/servicios/pagos`, does the “Revisor” header with its navigation remain visible?; what title does the browser tab display?; and on `/servicios/inventario`, does anything change? Verify with `npm run build` and `npm run preview`, and discard the copy when finished.

### Exercise 4 — Where does each piece of state live?

Without looking at the code, classify each piece of state in `revisor` into one of four categories: **local** (a `useState` inside a component), **URL**, **server** (TanStack Query), or **layout** (`Outlet context`). The pieces: a note draft; a saved note; “Solo fallas”; search text; the service whose details you are viewing; the service list; service details; whether an update is in progress (“· actualizando…”). For each, write a one-line justification. Then verify against the code.

## Solutions

### Solution 1

When typing `rep`, the URL passes through `/?q=r`, `/?q=re`, and `/?q=rep`, and the list displays only `reportes`. Checking the box yields `/?q=rep&fallas=1`, and you continue seeing `reportes`, which is failing. Back takes you out of the list to wherever you were before opening it (if you opened the tab directly at `/`, back to the browser's previous page), because all four changes replaced the history entry rather than appending new ones. In reverse order, the URL becomes `/?fallas=1&q=rep`. The strings differ because `cambiarFiltros` copies current parameters and `set` appends any new parameter to the end, preserving the order of existing ones. But it does not matter: `useFiltrosEnUrl` looks up each parameter by name using `get`, so both URLs render the exact same view. If you share either link, whoever opens it sees your exact view.

### Solution 2

Without `replace`, starting from the `pagos` detail view the history stack looks like this: the detail view, the list upon clicking “Volver al reporte”, and an entry for each of the ten letters in `inventario`. Returning to the detail view requires eleven Back clicks: ten to undo the typed letters and one to exit the list. This mirrors what Figure 3 showed with three letters, where a single Back only erased one character. With `replace: true` restored, a single click suffices. This exercise is verified visually in a real browser; Figure 3 represents its automated counterpart.

### Solution 3

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

In `rutas.tsx`, the detail route receives its boundary (and the file imports `ErrorDeServicio`):

```tsx
// en una copia: revisor/src/app/rutas.tsx (fragmento)
      { path: "servicios/:nombre", Component: PaginaServicio, ErrorBoundary: ErrorDeServicio },
```

And the deliberate error is placed in `PaginaServicio` after all hooks, right before the `return`, for the same reason as in 5.1.6:

```tsx
// en una copia: revisor/src/detalle/PaginaServicio.tsx (fragmento)
  if (nombre === "pagos") {
    throw new Error("el detalle se rompió al dibujar");
  }
```

With that, the copy passed `npm run lint` and `npm run build`, and Chrome produced this on `/servicios/pagos`:

```text
<title>Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><p role="alert">No se pudo mostrar este servicio: el detalle se rompió al dibujar</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

The three predictions: **Yes**, the header and navigation remain in place: the error bubbled to the nearest boundary upward, which is now the detail route's boundary, replacing only `PaginaServicio`; `Disposicion` was untouched. The tab title is `Revisor` rather than `pagos · Revisor`: the page threw before completing its render, so its `useTituloDocumento` Effect never ran. If you want the title updated, the boundary must set it itself. And on `/servicios/inventario`, nothing changes: the detail rendered completely (`Disponible: HTTP 200 en 118 ms`), because the boundary only activates when something breaks.

`useParams` works inside the boundary because the boundary renders in place of the route, with access to the same route parameters. And having a tailored message is intentional: “No se pudo mostrar este servicio” clarifies which section failed while providing an immediate exit link, whereas the root notice refers to the entire panel. If you placed the `throw` on the first line of the component, `npm run lint` failed with `rules-of-hooks`, raising an error for every subsequent hook; and `tsc` also complains, because following an unconditional `throw` it can no longer narrow `consulta.data`.

### Solution 4

| State | Where it lives | Why |
|---|---|---|
| note draft | local (`EditorNota`) | only matters to the person writing it, and must reset on service change (`key`) |
| saved note | layout (`Outlet context`) | needed by two pages, the list (“con nota” badge) and details, and must survive navigation |
| “Solo fallas” | URL (`?fallas=1`) | describes the view and is intended to be shared |
| search text | URL (`?q=`) | same as above |
| service currently viewed | URL (`/servicios/:nombre`) | is the page itself; in Lesson 2 it was the `seleccionado` `useState` |
| service list | server (`["reporte"]`) | belongs to the server; the UI maintains a cached copy |
| service details | server (`["servicio", nombre]`) | same, with one cache entry per service |
| “· actualizando…” | server (`isFetching` on the query) | stored by no one: derived by TanStack Query |

If you placed notes in the URL, consider what would happen when sharing the link: your private notes would travel to the other person, bloating the URL without bounds. If you placed them on the server, you are correct in the long term—today they are lost on reload—but the practice API provides no endpoint to persist them. [Lesson 6](06-reducer-contexto.md) revisits this table and adds another column: context.

## How do I know I succeeded

- [ ] `npm ci`, `npm run lint`, and `npm run build` finish cleanly within `~/curso-react/revisor/`, and `npm run build` outputs `dist/assets/index-CLDgPzLo.js` if your code matches the checkpoint.
- [ ] `npm ls react-router` shows `react-router@8.5.0`, and `npm ls react-router-dom` outputs `└── (empty)` and exits with code 1, which is expected here: the package was not found.
- [ ] With the practice server and `npm run preview` running, opening `http://localhost:4173/?fallas=1` in a new tab displays the checkbox checked and lists only `pagos` and `reportes`; the tab title reads `(2) Revisor`.
- [ ] `http://localhost:4173/servicios/pagos` displays the `pagos` detail view with the tab title `pagos · Revisor`; `http://localhost:4173/no-existe` displays “Página no encontrada” with the `revisor` header above it.
- [ ] In the browser: you write a note on the `pagos` detail page, save it, return to the report via “Volver al reporte”, and the row for `pagos` displays “· con nota”. (This is verified by hand: automated runs in this lesson do not click.)
- [ ] When typing in “Buscar por nombre”, the URL updates with each keystroke, and a single Back click takes you out of the list.
- [ ] In the page HTML (via developer tools or headless Chrome), the “Reporte” link carries `aria-current="page"` at `/` and does not have it at `/servicios/pagos`.
- [ ] With `python3 -m http.server 4190 --bind 127.0.0.1 --directory dist`, `curl` to `/servicios/pagos` returns `404`, while under `vite preview` the same route returns `200 text/html`. You can explain why, and you stopped both servers.
- [ ] In a copy with the `throw` from 5.1.6, `/?q=romper` displays “Algo salió mal al dibujar el panel” with `role="alert"` rather than `Unexpected Application Error!`; in the checkpoint without the `throw`, the list renders normally. You can explain why that notice is not rendered by `LimiteDeError`.
- [ ] All six figures compile with `tsc` and their output matches the lesson.
- [ ] You recorded in your [logbook](bitacora.md) which state moved to the URL, which state moved up to the layout, and the 404 you observed with Python.

## Summary

Answer without looking at the lesson:

1. What four shortcomings of a single-URL dashboard are resolved by persisting the view in the URL?
2. What does an index route render? Why does `servicios/:nombre` not begin with `/`? What does `*` catch?
3. Why is the router created at module scope, and why is `QueryClientProvider` placed outside `RouterProvider`?
4. Why did notes move up to the layout, and how do pages read them?
5. Why does `useParams` type parameters as `string | undefined`? At what point is `catálogo` encoded, and at what point is it decoded?
6. Why does `PaginaServicio` not remount when navigating from `/servicios/pagos` to `/servicios/inventario`, and what does `key={nombre}` do on `EditorNota`?
7. Why are filters read from the URL on every render rather than stored in `useState`? What does `replace: true` change?
8. What does the browser request from the server when reloading `/servicios/pagos`, what must the server return, and why does testing with `vite preview` prove nothing about production?
9. Why did `LimiteDeError` stop seeing page errors once the router was introduced? Where is the boundary that catches them declared, why does its fallback replace the header, and why does `LimiteDeError` remain in `main.tsx`?

## Further reading

- [React Router, «Picking a Mode»](https://reactrouter.com/start/modes) and [«Installation» (data mode)](https://reactrouter.com/start/data/installation): declarative, data, and framework modes, what each adds, and where `createBrowserRouter` and `RouterProvider` are imported from. Accessed October 21, 2026.
- [React Router, «Routing» (data mode)](https://reactrouter.com/start/data/routing): routes as objects, nested routes with `<Outlet />`, index routes, dynamic segments, and `*`. Accessed October 21, 2026.
- [React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter): usage of `pushState` and `replaceState`, and creating the router once outside the React tree. Accessed October 21, 2026.
- [React Router, `useParams`](https://reactrouter.com/api/hooks/useParams): dynamic URL parameters and their typing. Accessed October 21, 2026.
- [React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams): the parameter and updater function pair, functional updater form, warnings regarding consecutive synchronous calls and mutating the object. Accessed October 21, 2026.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext): sharing state from parent to child routes, and the recommendation of a custom hook with TypeScript. Accessed October 21, 2026.
- [React Router, `Link`](https://reactrouter.com/api/components/Link) and [`NavLink`](https://reactrouter.com/api/components/NavLink): progressive `<a href>` wrapper, `replace`, the `active` class, `aria-current="page"`, `end`, and the special case of `/`. Accessed October 21, 2026.
- [React Router, «Error Boundaries»](https://reactrouter.com/how-to/error-boundary): catching route errors, the required root boundary, `ErrorBoundary` with `useRouteError` in data mode, the three cases (`isRouteErrorResponse`, `Error`, anything else), and how errors bubble to the nearest boundary. Accessed October 21, 2026.
- [React Router, «Upgrading from v7»](https://reactrouter.com/upgrading/v7): why version 8 no longer publishes `react-router-dom`, and minimum Node and React versions. Accessed October 21, 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): the same component at the same tree position preserves its state, and `key` resets it. Accessed October 21, 2026.
- [MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) and [`History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState): adding or replacing a history entry without loading the URL. Accessed October 21, 2026.
- [MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) and [`encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent): reading and writing search parameters, spaces as `+`, and characters encoded in a URL component. Accessed October 21, 2026.
- [Vite, «Shared Options», `appType`](https://vite.dev/config/shared-options): the `'spa'` default and fallback to `index.html` in `vite dev` and `vite preview`. Accessed October 21, 2026.
- [Python, `http.server`](https://docs.python.org/3/library/http.server.html): static command-line server, `--directory`, `--bind`, 404 on missing files, and the warning against production usage. Accessed October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| router | the component that reads the URL, decides which components to render, and updates the URL without reloading the page |
| client-side route | a URL existing solely for the router, such as `/servicios/pagos`; no physical file by that name exists on the server |
| layout (*disposición*) | the component for a parent route: renders what stays constant across pages and provides an `<Outlet />` for the active page |
| index route | the child route without a `path` that renders when the URL matches the parent route exactly |
| dynamic segment | the portion of a route starting with `:`, such as `:nombre`; whatever occupies that position is delivered as a parameter |
| search query (*query string*) | everything following the `?` in a URL, such as `fallas=1&q=pag`; read with `useSearchParams` |
| percent-encoding | writing special characters in a URL as `%` followed by two hexadecimal digits per byte, such as `á` → `%C3%A1` |
| `replace` | navigating by overwriting the current history entry rather than appending a new one |
| error boundary (*límite de error*) | the component rendered in place of its subtree when something within throws during rendering; React Router attaches one to each route, and yours is declared with `ErrorBoundary` |
| rewriting (SPA fallback) | the server rule returning `index.html` for any URL that is not a static file, enabling the application to boot and the router to take over |

---

**Next:** [Lesson 6 — Shared State: Reducer and Context](06-reducer-contexto.md)
