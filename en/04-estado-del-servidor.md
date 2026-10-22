# Lesson 4 — Server state with TanStack Query

*It is 4:50 PM and at 5:00 PM operations closes the shift with a question: “has pagos recovered yet?”. On your dashboard, `pagos` is still in the red. Someone from the infrastructure team swears they restarted it five minutes ago. You open the details for `pagos`: it says “En falla”. You close the details, open the ones for `catálogo`, go back to `pagos`… and the dashboard fetches everything from scratch again, with its usual “Cargando…”, as if it had never seen it before. You click “Actualizar”: the list turns green, but the details you had open still say “En falla”. Two parts of the same screen tell two different stories about the same service, and you have ten minutes to say which one is the truth. The problem is not the API. It is that each component fetches its data on its own and neither knows what the other knows. This lesson gives the dashboard a single place where what arrived from the server lives.*

(You cannot trigger this scene yet with the practice server from Lesson 3: there `pagos` never recovers. This lesson gives the server the route that “checks it again”, and in 4.6.1 you will see the full scene, resolved.)

**Time:** 2 × 45 min (the natural break is between sections 4.4 and 4.5)

**What you build:** the `revisor` report with caching, background updates, the four states of a query plus the “stale data” state, a “Volver a revisar” button that asks the server to check a service again and leaves both the list and the details up to date, and an error boundary that catches whatever fails during rendering

**What you learn:** why fetching data by hand does not scale (caching, waterfalls, races); `useQuery`, `queryKey` and `signal`; `status` versus `fetchStatus`; `staleTime`, retries and `refetchInterval`; `useMutation` and invalidation; **the fourth state: empty**; what Suspense does not do; the Error Boundary, the only class in the course

**Where you are coming from.** From [Lesson 3](03-effects-sincronizar.md). Your `revisor` fetches the report with a custom hook, `useReporte`, which polls every 10 seconds with an Effect, an `AbortController` and a `useEffectEvent` so that polling does not restart when `Panel` passes it a new function. Service details are fetched by another hook, `useDetalle`, with its own Effect that aborts when the name changes, and `ContenidoReporte` mounts `<PanelDetalle key={seleccionado}>` so that switching services resets the entire panel. All of that works, and it works for good reasons: Lesson 3 reproduced the response race and fixed it. In this lesson you are going to delete both hooks. Not because they were wrong, but because they were solving by hand, one by one, a problem that has a name and a tool. You work on the same project, `~/curso-react/revisor/`.

**What this lesson does not do.** It does not add screens or URLs: the list and details remain on the same page, and selection remains a state in `Panel`; routes arrive in [Lesson 5](05-rutas-url-como-estado.md). It does not use Suspense for data fetching: it explains what it would do and why this dashboard does not need it. It does not write automated tests: those for the four states arrive in [Lesson 8](08-pruebas-de-componentes.md). It does not register services: the practice server already knows how to do so as of this lesson, but the form belongs to [Lesson 7](07-formularios-accesibilidad.md). And it does not explain the practice server, which here grows to its final version: it only states what new routes it has.

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions from this lesson's `package.json`. The checkpoint was reinstalled with `npm ci` and passed `npm run lint` and `npm run build`, with the same filename in `dist/` that the course runs also obtained in a Linux container (`index-CHheidKQ.js`); that is why what you see here is what you will see on your Linux Mint, except for an `npm ci` warning about `fsevents` that only appears on macOS and is explained where it comes up. After the checkpoint's last change (the row button that toggles and the `%` guard on the practice server) it was reinstalled from scratch with `npm ci` in a Linux container (the official `node:24.22.0-bookworm` image) and produced the same name on macOS and on Linux. What is seen “in the browser” was measured with headless Chrome (`--headless`), controlled via its debugging protocol: a small program opened the page, clicked buttons just as you would, and recorded, in milliseconds since the page opened, every request sent to `/api/` and every change on the screen. It is the same log you see in the “Network” tab of developer tools, described in writing. The browser captures from 4.5, 4.6.1, and 4.9 were taken with a version of `PanelDetalle` that, if refreshing the detail failed, showed only the error and hid the data; the one you see in 4.6 fixes that, and it was verified that it still delivers the same thing when the requests succeed, which is all those captures record. The timestamps in the practice server log are in UTC; the time displayed by the dashboard (“Actualizado a las 2:11:47 a.m.”) is the machine's local time, which was in Central Mexico time. Long paths are shown starting from `~/curso-react`. To compare sizes, the Lesson 3 checkpoint was also built, with the same result that the course runs record for it (`index-CTkBRgQQ.js`). The programs are in [`programas/04-estado-del-servidor/`](../programas/04-estado-del-servidor): `revisor/` is the checkpoint and the three figures are beside it, with their own `package.json`, which is the one from the figures in Lesson 0 plus `@tanstack/react-query`. All three were re-run from scratch in a new folder, starting from the Lesson 0 `package.json` and adding only Query, as indicated in 4.1, producing identical outputs to those shown. Each lesson in the course was written with its own ports to avoid colliding with other runs on the same machine; you should use the usual ones: 3100 for the practice server, 5173 for `npm run dev` and 4173 for `npm run preview`.

## By the end you will be able to

- Show, with a figure that counts calls, how many requests a piece of data fetched by hand by two components makes and how many it makes with TanStack Query, and explain where the difference comes from.
- Configure a `QueryClient` with `staleTime` and `retry`, mount it with `QueryClientProvider` and write a query using `queryOptions`, a key and a function that receives the `signal`.
- Distinguish `status` from `fetchStatus`, name the five combinations triggered by figure 2 and point out which one prints “· actualizando…” in the dashboard footer.
- Render the four query states (loading, error, empty and with data) plus the “stale data” state, and trigger each one using the practice server.
- Write a mutation with `useMutation` that, upon successful completion, invalidates the affected queries, and read in the log the `POST` request followed by the two caused by invalidation.
- Explain which errors an Error Boundary catches and which ones it does not, and why it is the only class in the course.

## The why before the how

Look at what `revisor` does today, at the end of Lesson 3, through the eyes of someone operating the dashboard.

**The same data is requested twice.** `Panel` needs the report for the list; the tab title, `(2) Revisor`, needs the same report to count failures. Today it works because both live in the same component and share the result of a single `useReporte`. But as soon as the header in [Lesson 5](05-rutas-url-como-estado.md) wants to display “2 servicios con falla” from another part of the tree, you will have two options: lift the state up to a common ancestor and pass it down via props, or call `useReporte` twice and make two requests for the same data. Neither scales.

**Leaving and returning costs the same as entering.** When you select `pagos`, `useDetalle` requests it; when you select `catálogo` and go back to `pagos`, it requests it all over again from scratch, with its 1.5-second “Cargando detalle…”, even though you just saw it five seconds ago. The hook has no memory: its state lives in the component, and the component unmounts. The React documentation puts it in these words: fetching data directly in an Effect usually means you do not preload or cache it, so if the component unmounts and remounts, it has to fetch it again ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)).

**What you change in one place is not known in the other.** If tomorrow the detail view had a button asking the server to check `pagos` again, the response would arrive at the detail view… and the list would keep displaying `pagos` in red until the next polling cycle, ten seconds later. To notify the list, you would have to pass a `recargarLista` function to `PanelDetalle` from `Panel`, and another one for every screen that depends on that service.

**And each hook writes the same thing all over again.** `useReporte` and `useDetalle` each have their own `AbortController`, their own `try`/`catch`, their own `if (control.signal.aborted) return`, their own `cargando`/`listo`/`error` union. It is the code that Lesson 3 taught you to write properly, and precisely because of that, it is worth noting its weight: that same React page describes it as “not ergonomic”, with quite a bit of boilerplate code to avoid bugs like response races.

That page does not stop at complaining: it recommends, if you do not use a framework, “using or building a client-side cache”, and names three open-source solutions; the first is **TanStack Query**. And it adds something worth reading slowly: if you build your own, you will use Effects under the hood, but you will also need to add logic to deduplicate requests, cache responses, and avoid network waterfalls. That is what the library does. Underneath, there is still a `fetch` with a `signal`; what changes is **who owns the data**. Until today, the owner of the report was the component requesting it. From this lesson onward, the owner is a cache that lives outside components, and components only **subscribe** to what they need.

That shift has a name that gives this lesson its title: **server state**. The state that Lesson 2 taught you to manage—the “Solo fallas” checkbox, the selected service, the draft of a note—is yours: it originates on the screen, only the screen changes it, and it does not go stale on its own. The report is something else. It is a **copy** of something that lives on another computer, which other people can change without notifying you, which takes time to arrive, which can fail when requested, and which begins to grow stale the moment it arrives. Treating it with `useState` is treating a photograph as if it were a window.

There are three new concepts. The first is **the query: a piece of server data with a key and a cache**, and it takes three sections: the problem measured (4.1), installation and the client (4.2), and keys, query functions, and polling (4.3). The second is **the states of a query and how the screen renders them**: `status` versus `fetchStatus` (4.4) and the four states plus one (4.5); they are completed, after the third, by what Suspense does not do with those states (4.7) and the error boundary, which catches the error state when it escapes the component (4.8). The third is **mutation and invalidation**: changing data on the server and telling the cache (4.6). Section 4.9 adds no concept: it is the complete walkthrough, where the three are seen together. At the end you will build this, and you will know why the JavaScript grew by about 37 kilobytes:

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
dist/assets/index-CHheidKQ.js   262.59 kB │ gzip: 81.55 kB

✓ built in 263ms
```

## The concepts

### 4.1 The problem, measured: two components, one piece of data

Before installing anything, measure the problem. The first figure mounts the same component twice—think of the header and the summary, which both need the same report—counts how many times a dummy “API” that takes 50 ms is called, then unmounts them (the user leaves the screen) and remounts them (returns). It does this twice: with one Effect per component, as in Lesson 3, and with TanStack Query.

The figures in this lesson import TanStack Query, so your figures folder needs it too. In `~/curso-react/figuras/`, the one you set up in Lesson 0, add it with its exact version:

```bash
npm install --save-dev --save-exact @tanstack/react-query@5.104.5
```

Or copy `package.json` and `package-lock.json` from `programas/04-estado-del-servidor/` and run `npm ci`. Both methods were tested from an empty folder, and all three figures produced exactly the outputs you see here. If you skip this step, the first `npx tsc` complains that it cannot find the module `@tanstack/react-query`.

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

Read the two halves line by line.

**By hand, two components are two calls.** Each `ConteoAMano` has its own Effect, its own state and its own `AbortController`. There is no way for one to know that the other is already fetching the same thing: Effects are private to each component. Upon returning, both start again in `cargando` and make another two calls, because their state was lost when unmounted.

**With Query, two components are one call.** Both `ConteoConQuery` request the key `["reporte"]`. The first time someone requests it, Query starts the function; when the second requests it while the first is still in flight, Query does not start another: it **subscribes** it to the same one. This is called request *deduplication*. And upon returning, the screen displays “4 servicios” **immediately**, without passing through `cargando`, and makes zero calls. The data did not live in the components: it lived in the `QueryClient` cache, which remained there while the screen was empty.

Why zero calls upon returning? Because of the line `staleTime: 5_000`. It tells Query that, for five seconds after arriving, that data is considered **fresh** and is not worth fetching again. When that window expires, the data becomes **stale**, and the next time a component subscribes, Query will display what it has and, in parallel, fetch it again. In exercise 2 you remove that line and verify this.

The course plan summarizes in three words why fetching data by hand does not scale: **caching**, **waterfalls**, and **races**. The figure just measured the first. The React page cited in “The why” lists four problems: that Effects do not run on the server, waterfalls, that nothing is preloaded or cached, and that it is unergonomic, with bugs such as races. The first does not apply to this dashboard, which is not rendered on a server; the other three are those in the plan. The second word is **waterfalls** (*network waterfalls*), the second problem on that list: a parent requests its data, renders, and only then do its children begin requesting theirs; on a slow network, each level adds to the wait ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). The figure does not measure it and `revisor` does not suffer from it yet, because its detail is only requested when someone selects a service. What Query contributes against waterfalls is that a query can be requested **from outside a component**—for example, when the router knows which screen you are navigating to, before rendering it—and that is what Lesson 5 would take advantage of if needed. Here it is enough to know that the problem exists and that there is a way out. The third word, **races**, you saw up close in Lesson 3; how Query prevents them is explained in 4.3.2, when `signal` appears.

### 4.2 Installation and the client

TanStack Query is a single-package library for React. It is installed in `dependencies`, because it travels to the browser, with its exact version:

```bash
npm install --save-exact @tanstack/react-query@5.104.5
```

That version was published on October 19, 2026 and is the most recent one returned by `npm view @tanstack/react-query version` on the day of the run. If you install on macOS, `npm ci` or `npm install` ends with a warning similar to this:

```text
npm warn install-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn install-scripts   fsevents@2.3.3 (install: (install scripts present))
```

Query does not cause it. `fsevents` is an optional dependency, only for macOS, used by build tools to quickly detect which file changed; in npm 11, dependency install scripts remain blocked until approved, and npm finishes installation warning which ones were skipped ([npm, «npm install-scripts»](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts)). With `fsevents` there is no need to approve anything: the package already includes its compiled `fsevents.node` file (you can see it in `node_modules/fsevents/`), installation finishes successfully, and Vite works just the same. When a package does need its script, you inspect it with `npm install-scripts ls` and approve it with `npm install-scripts approve <paquete>`; approving is a security decision, because that script runs with your permissions. On Linux it does not appear, because that package declares in its `package.json` that it is only for `darwin` (macOS), and npm does not even install it.

`package.json` looks like this; the only new line, besides the version number, is the one for Query:

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

The library has two pieces that are set up once. The first is the **`QueryClient`**: the object that holds the cache and the rules. The checkpoint creates it with a function, in its own file, so that the tests in Lesson 8 can create a new one for each test:

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

Those two options change two defaults that the Query documentation lists on its “Important Defaults” page ([TanStack Query, «Important Defaults»](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)):

- **`staleTime`** defaults to `0`: a piece of data is considered stale the moment it arrives. With `0`, every new component that subscribes, every time the window regains focus, and every time the network reconnects, Query fetches the data again. For a dashboard that updates every ten seconds anyway, five seconds of freshness avoids requests that contribute nothing: if you just received the report, opening the details or returning to the tab does not need another. It is this course's choice, not a hard rule: the right number depends on how long your data takes to change and how costly it is to display it slightly stale.
- **`retry`** defaults to `3`: a failed query is retried three times, silently, with an exponentially doubling backoff between attempts. The course lowers it to `2` so that, when the API is down, the alert appears in about four seconds rather than eight. In section 4.5 you will see it in the log, attempt by attempt.

There are two other values worth knowing even though the checkpoint does not touch them. **`gcTime`** (for *garbage collection*) is how long unused data survives in the cache when no component is using it: five minutes. That is why in figure 1 the data was still there upon returning. And **`refetchOnWindowFocus`** is enabled: when the user returns to the dashboard tab, stale queries are refetched. This is what keeps a dashboard that spent half an hour behind another window up to date as soon as you look at it. The same page states it: stale queries are refetched automatically in the background when a new instance mounts, when the window regains focus, or when the network reconnects.

The second piece is **`QueryClientProvider`**, which makes the client available to the entire tree. `main.tsx` creates it **only once, outside of any component**, and wraps the dashboard:

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

Having `crearClienteConsultas()` called at the module level, rather than inside a component, is not a stylistic detail. If you created it inside a component, every render of that component would create a brand new, empty cache, and you would lose everything figure 1 just demonstrated. In `main.tsx` it runs once, when the browser loads the module. (The `LimiteDeError` wrapping everything is explained in 4.8.)

And here is the size mentioned at the end of “The why”. The Lesson 3 checkpoint was also built for comparison: its JavaScript weighed 225.86 kB (70.67 kB gzipped) and came from 33 modules; this lesson's weighs 262.59 kB (81.55 kB gzipped) and comes from 83. Between one lesson and the next, `revisor`'s own code barely grew—two hooks were even deleted—so those extra 37 kB and 50 modules are, for the most part, the library. It is worth asking whether it is worth it. For a dashboard that only requested one thing once, probably not; for one that has caching, polling, retries, deduplication, invalidation, and stale data while updating, what weighs is what you save yourself from writing and maintaining.

### 4.3 Keys, query functions, and polling

A query has two required parts: a **key** that identifies it and a **function** that fetches the data. Everything else is options.

#### 4.3.1 The key: the data's name in the cache

The key is an array. The documentation sets three rules: it must be an array at top level, it must be serializable to JSON, and it must be unique to that data; and it adds a fourth that prevents the most mistakes: **if the function depends on a variable, that variable goes into the key** ([TanStack Query, «Query Keys»](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)). The details for `pagos` and those for `catálogo` are different data, so their keys must be different: `["servicio", "pagos"]` and `["servicio", "catálogo"]`.

The checkpoint brings all keys together in a single file, so no one writes `["reportes"]` in one place and `["reporte"]` in another:

```ts
// revisor/src/consultas/claves.ts
export const claves = {
  reporte: ["reporte"] as const,
  servicio: (nombre: string) => ["servicio", nombre] as const,
};
```

The `as const` makes TypeScript remember the exact shape of the array (`readonly ["reporte"]` rather than `string[]`), and `servicio` is a function because its key depends on the name. Writing them this way has an advantage that appears in 4.6: keys are matched **by prefix**. Invalidating `["servicio"]` would reach all detail views; invalidating `["servicio", "pagos"]`, only one.

Notice what this rule replaces. In Lesson 3, `useDetalle` had `[nombre]` in its dependency array, and `exhaustive-deps` ensured you did not forget it. The Query key plays the same role: when `nombre` changes, the key changes, and Query fetches the new data. The difference is that the React linter does not check Query keys. If you forget to include the name in the key, no one warns you; exercise 4 shows you what you see on screen when that happens.

#### 4.3.2 The function: the same network boundary, with the `signal` provided by Query

The query function for the report is `cargarReporte`, the network boundary from Lesson 0, with a single change: it drops the `Cargar` type, which existed to pass the function as a prop to `Panel` and is no longer used.

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

It still receives an `AbortSignal`, and that matters. Query passes each query function its own `AbortSignal`, and aborts it when the query is no longer needed before finishing: because the key changed, or because no subscribed components remain ([TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). You no longer write `new AbortController()` or `control.abort()`: Query writes them for you, and you only need to pass the `signal` to `fetch`. The documentation adds a detail: if your function **uses** the `signal`, Query cancels the promise and returns the query to its previous state; if it does not use it, the response is stored in the cache even if no one is waiting for it anymore.

In section 4.9 you will see that cancellation in the log, with the same pair `cancelada por el cliente` + `200` that `StrictMode` produced in Lesson 0. It is no coincidence: `StrictMode` unmounts and remounts the panel, the query spends an instant with no subscribers, Query aborts the `signal`, and refetches upon remounting. Cleanup still exists; it only changed owners.

And this closes the race condition from Lesson 3, from two angles. What you saw in Lesson 3 is that the late response from `pagos` only reached the screen when both defenses were missing at once: the `abort` in cleanup and the `key` that unmounts the panel. Query brings its own version of each. The first is the `signal`: if you choose `pagos` and immediately `catálogo`, the query for `pagos` is left with no subscribers and Query aborts its request. The second is the key: even if the request were not aborted, its response would be stored under the `["servicio", "pagos"]` entry in the cache, not `catálogo`'s. Each key is its own drawer, and a late response has no way of landing in the wrong drawer. The `catálogo` component only reads the `catálogo` drawer.

#### 4.3.3 `queryOptions`: the query in a single place

With the key and function, the query is assembled. The checkpoint does not write it inside the component, but in a feature file, using `queryOptions`:

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

`queryOptions` does nothing at runtime: it returns the exact object you pass it. What it provides is type safety. It packages key, function, and options into an object that can be shared across multiple places—a component, a test, a prefetch—and TypeScript infers the data type, `ReportePublico`, from the function for all of them ([TanStack Query, «Query Options»](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)). If tomorrow Lesson 8 wants to ask the cache what lies under `["reporte"]`, it uses the same object and gets the right type without repeating anything.

The new option is **`refetchInterval: cadaMs`**: as long as a component is subscribed, Query refetches the data at that interval, in milliseconds ([TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)). It is the ten-second polling from Lesson 0, the same `VITE_CADA_MS`, without `setInterval` or `clearInterval`. And it introduces a rule that manual polling lacked: with its companion `refetchIntervalInBackground` set to `false`, which is its default, polling pauses while the tab is in the background. A dashboard forgotten in a background tab no longer polls the API every ten seconds all night long.

The detail query takes the same shape, with the name in the key and in the function:

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

Its `cargarDetalle` does not change from Lesson 3. With this, `src/reporte/useReporte.ts` and `src/detalle/useDetalle.ts` disappear from the project, and with `useReporte` goes the `useEffectEvent` that Lesson 3 gave it so polling would not restart. That was not a misuse: it was the correct way to solve that problem with a hand-written Effect. Quite simply, there is no longer a hand-written Effect.

And what about `useTituloDocumento`, the other Effect from Lesson 3? That one stays. It synchronizes `document.title` with what React knows, which is exactly why an Effect exists. Not every Effect goes away: the one that fetched data goes away.


### 4.4 `status` versus `fetchStatus`

`useQuery` returns an object with many fields. The two most important to understand are `status` and `fetchStatus`, because they answer **two different questions**, and the documentation summarizes it in a rule of thumb: `status` tells you about the **data**—do I have any or not?—and `fetchStatus` tells you about the **function**—is it running or not? ([TanStack Query, «Queries»](https://tanstack.com/query/latest/docs/framework/react/guides/queries)).

| Field | Value | What it means |
|---|---|---|
| `status` | `pending` | there is no data yet |
| | `error` | the last attempt failed |
| | `success` | there is data |
| `fetchStatus` | `fetching` | the function is running |
| | `paused` | it wanted to run, but there is no network |
| | `idle` | it is not doing anything |

Why two fields instead of one? Because with caching and background refetching **all combinations are possible**, and a single variable cannot express them. The second figure triggers them one by one: it mounts a component with no network, restores the network, and then makes the API fail and refetches. The component logs a line each time either field changes.

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

Five lines, five situations that the dashboard must know how to render:

1. **`pending` + `paused`.** There is no data and nothing is even being fetched: Query detected that there is no network (`onlineManager.setOnline(false)` simulates this) and paused. If your screen only checked “is it loading?”, here it would say no, and if it only checked “do I have data?”, it would also say no. Both are true.
2. **`pending` + `fetching`.** The initial load: there is no data and it is being fetched. This is “Cargando…”.
3. **`success` + `idle`.** There is data and nothing is being fetched. The screen at rest.
4. **`success` + `fetching`.** There is data **and** it is being refetched. This is the case that a union like `cargando`/`listo`/`error` from Lesson 0 could not express: there, updating meant resetting to `cargando` and erasing the list. Here the list stays and, at most, a note indicates that it is updating.
5. **`error` + `idle` with “4 servicios”.** The last attempt failed, **but the previous data is still there**. Query does not erase it. `status` says `error` and `data` still holds the earlier report.

The fifth line is the most surprising and the most important for a monitoring dashboard: when the API fails for a moment, the worst thing you can do is leave the user with nothing to see. Query gives you both things at once, the error and the last good data, and it is your UI that decides how to present them.

Besides the two fields, `useQuery` provides boolean shortcuts: `isPending` is `status === "pending"`, `isError` is `status === "error"`, `isSuccess` is `status === "success"`, and `isFetching` is `fetchStatus === "fetching"`. The documentation for `useQuery` describes `isFetching` precisely: it is `true` whenever the function is running, **including** the initial load. The checkpoint uses the shortcuts, which also assist TypeScript: after an `if (consulta.isPending) return …`, TypeScript knows that `consulta.data` can no longer be `undefined`. In “The error you will see” you remove that `if` and TypeScript reminds you.

Here is `Panel`, which now only receives `cadaMs`:

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

Three things changed compared to Lesson 3:

- **The query replaces the hook.** `useQuery(consultaReporte(cadaMs))` returns the complete object, and `Panel` passes it as-is to `ContenidoReporte`. There is no longer a `cargar` prop: the component does not receive the data-fetching function, because the function lives in the query.
- **“Actualizado a las” comes from `dataUpdatedAt`.** In Lesson 3 it was its own state, `actualizadoEn`, written in an `alRecibir` wrapped in `useEffectEvent`. Now Query already tracks the timestamp when the last good data arrived, as a millisecond timestamp ([TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)), and it is `0` until any arrives. It is state that stopped being stored because it could already be read: the Lesson 2 rule of “do not store what you can calculate”, applied to the cache.
- **The “Actualizar” button calls `refetch`** and is disabled while `isFetching` is `true`. The `void` in `onClick={() => void consulta.refetch()}` is the JavaScript operator that evaluates an expression and discards its result ([MDN, “void”](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)): `refetch` returns a promise, and writing `void` makes it visible that here it is neither awaited nor used, instead of leaving it dangling by oversight. And the footer adds “· actualizando…” in exactly the fourth case of the figure: data exists and is being refetched. That is the difference between `status` and `fetchStatus`, rendered in a single line.

### 4.5 The four states, plus one

Data coming from a server has, at a minimum, **four states** that the screen must render: loading, error, empty, and with data. The first three are the ones people forget. The error state, because on the developer's machine the API always responds. And the **empty** state, because on the developer's machine there is always test data: an empty list renders as a list with no rows, which on screen looks indistinguishable from a broken UI. That is why the course plan calls it “the fourth state” and highlights it in bold.

The fifth, which only exists thanks to caching, is **with data and with error**: the last update failed, but there is an earlier report to display. That is row 5 of figure 2. `ContenidoReporte` renders all five, in this order (the detail in 4.6 does the same, on its own scale):

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

Read the order of the `if`s, because each one rules out a case and leaves the next with fewer possibilities:

1. **`isPending`** → “Cargando…”, inside `role="status"`, which a screen reader announces without interrupting. If there is no data yet, there is nothing else to render.
2. **`isError` without data** → the alert and a “Reintentar” button that calls `refetch`. This is the real error: it failed and there is nothing to show in its place. `role="alert"` causes the screen reader to announce it immediately.
3. **An empty list** → “No hay servicios configurados todavía.” Notice that it is neither an error nor a loading state: it is a valid response, `{"estados":[]}`, which means something different. The text tells the user what is happening, instead of leaving them guessing whether the screen broke.
4. **With data** → the summary, the list, and the details, just like in Lesson 3.
5. **With data and with error** → same as 4, with a notice at the top: “Mostrando el último reporte que llegó: la actualización falló ({consulta.error.message}).”. The `viejo` class gives it an amber border, so it stands out from the list without hiding it.

After the second `if`, TypeScript knows that `consulta.data` exists: if `isPending` were true it would have returned already, and if there were an error without data it would have returned as well. That is why `const { estados } = consulta.data;` compiles without a `?.` or a `!`. The order of the `if` statements is not just for readability: it is what enables the compiler to keep you safe.

The stylesheet adds a rule, which it shares with the error boundary from 4.8:

```css
.viejo,
.limite-de-error {
  border-left: 0.5rem solid #bf8700;
  padding-left: 0.75rem;
}
```

Now trigger them with the practice server, which as of this lesson accepts an `ESCENARIO` environment variable: `normal` (the usual), `vacio` (starts with no services), or `caido` (`GET /api/estados` always returns `503`). With `ESCENARIO=vacio npm run servidor` and `npm run dev`, this is what headless Chrome showed on screen (the visible text of the container):

```text
Revisor
Estado de los servicios
 Solo fallas

No hay servicios configurados todavía.

Actualizado a las 2:11:47 a.m.

Actualizar
```

And this is the server log: the `StrictMode` pair and a good, empty response.

```text
08:11:44.790 servidor de práctica en http://127.0.0.1:3100 (escenario: vacio)
08:11:47.090 GET /api/estados cancelada por el cliente
08:11:47.395 GET /api/estados 200
```

Notice that “Actualizado a las…” appears: to Query, an empty list is a success, and indeed it is. With `ESCENARIO=caido`, on the other hand, the screen looked like this:

```text
Revisor
Estado de los servicios
 Solo fallas

No se pudo cargar el reporte: la API respondió 503

Reintentar
Actualizar
```

The interesting part is in the log, and in the network trace recorded by the browser, with milliseconds since the page opened:

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

Three `503`s after the canceled one: the original attempt and the **two retries** from `retry: 2`. Look at the gaps between a response and the next request: about 1,000 ms and then about 2,000 ms. That is Query's default backoff, starting at one second and doubling on each attempt, capped at 30 seconds ([TanStack Query, «Query Retries»](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries)). Meanwhile, the screen remained on “Cargando…”: retries are silent, and the alert only appears when they are exhausted. With the default `retry: 3`, the user would have waited about eight seconds to find out the API was down; with `2`, about four. (A detail when reading: in the browser log, between the first request and its `503` there are only 33 ms, even though the server takes 300. It is not that the server answered earlier; the server log does show the 300 ms. Rather, as the page was opening, the browser delivered the first notifications together to the program recording them, and the program timestamped when it received them. From the second request onward, notifications arrived one by one and the 300 ms reappears: from 1373 to 1685 and from 3682 to 3986.)

Notice also that on that screen there are two buttons, “Reintentar” and “Actualizar”, and both call `consulta.refetch()`. This is not a layout oversight: they belong to different owners. “Reintentar” belongs to `ContenidoReporte` and exists only in the error-without-data state, where it is the only way out the person has in sight. “Actualizar” belongs to `Panel` and is always there, because refreshing a report that is visible is an action of the card, not of the error. That they coincide in this single state is the price of each component knowing only about its own business; if it bothers you in your product, the way out is to hide “Actualizar” when there is no data, and that is a design decision, not a Query one.

And an observation not found on any single line: “Actualizado a las…” does not appear, because `dataUpdatedAt` remains at `0`. Good data never arrived. If the server had gone down **after** a successful load, you would see the fifth state, the list with the amber notice above it.

### 4.6 Mutations and invalidation

Up to this point, everything has been reads. But the detail view for a service now has a button that **changes** something on the server: “Volver a revisar” asks the practice server to check the service again. The server has a new route for this, `POST /api/servicios/:nombre/reintento`, which, if the service exists, finds it recovered: it returns `200` with `{"nombre":"pagos","tipo":"disponible","codigoHttp":200,"duracionMs":95}` and, crucially, **changes what it has stored**, so that the next `GET /api/estados` already returns `pagos` in green. (If the service does not exist, it returns `404`; if the name in the URL cannot be decoded, as in `/api/servicios/%`, it returns `400` with `{"detalle":"nombre de servicio inválido"}`; and as of this lesson it has the route `POST /api/servicios` to register services; that one is used in Lesson 7.)

An operation that changes data on the server is called a **mutation**, and in Query it has its own hook, `useMutation`. The network boundary is like the other two: fetch, check the status code, validate the shape.

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

To validate the response it uses `esEstadoPublico`, the guard that has existed since Lesson 0 and which `contrato.ts` previously did not export because only `esReportePublico` used it. The only change in `contrato.ts` is that word, `export`, plus the `NuevoServicio` interface that the server needs for registration:

```ts
// revisor/src/compartido/contrato.ts (fragmento)
export function esEstadoPublico(valor: unknown): valor is EstadoPublico {
```

The hook is concise, and every line has a reason:

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

- **`useMutation` does not run on its own.** Unlike `useQuery`, which fetches as soon as it mounts, a mutation waits until someone calls `mutate()`. A read can be repeated without consequence; a write cannot, and therefore only happens when the user asks for it.
- **`useQueryClient()`** returns the same client that `main.tsx` placed in the provider. It is how a component communicates with the cache.
- **`onSuccess` invalidates two keys.** `invalidateQueries` does two things: marks queries with matching keys as stale, and if any are currently rendered, refetches them in the background ([TanStack Query, «Query Invalidation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)). The two keys are `["reporte"]`, because the list changed, and `["servicio", nombre]`, because the details did as well.
- **`onSuccess` returns a promise** (it is `async` and awaits `Promise.all`). That affects when the mutation completes. The guide on invalidations from mutations states it in one line: returning a promise in `onSuccess` ensures data is updated before the mutation fully settles, and `isPending` remains `true` until that promise resolves ([TanStack Query, «Invalidations from Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)). Without `await`, the button would flip back to “Volver a revisar” while the screen still showed the previous state.

This is what `revisor` could not do in Lesson 3 without passing callbacks between components: `PanelDetalle` does not know a list exists, nor where it is, nor who renders it. It only knows that, having changed a service, the data at `["reporte"]` is no longer trustworthy. The cache takes care of notifying whoever is using it.

`PanelDetalle` uses both pieces, the query and the mutation:

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
      {consulta.isError && consulta.data === undefined && (
        <p role="alert">No se pudo cargar el detalle: {consulta.error.message}</p>
      )}
      {consulta.isError && consulta.data !== undefined && (
        <p role="alert" className="viejo">
          Mostrando el último detalle que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      {consulta.data !== undefined && (
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

The button is disabled and changes its text to “Revisando…” while `reintento.isPending` is true, so that no one sends the same `POST` five times out of impatience. If the mutation fails, `reintento.isError` displays the alert beneath the button. And notice that the detail query uses `isPending` and the presence of `data`, not `isFetching`: while the details are refetched following invalidation, the user continues seeing the previous data rather than a “Cargando detalle…” that erases it.

The detail also renders the fifth state from 4.5. If the refresh fails but a detail was already there, `status` is `error` and `data` is still present; that is why the data block depends on `consulta.data !== undefined` and not on `consulta.isSuccess`, which in that case would be `false` and would make disappear exactly what the person needs in order to decide. With a detail that never arrived, on the other hand, only the error alert is shown, as in `ContenidoReporte`.

#### 4.6.1 What happens when clicking “Volver a revisar”, measured

This is the part of the lesson best seen with your own eyes rather than taken on faith. With the server in normal scenario and `npm run dev`, the program controlling Chrome selected `pagos`, waited for its details, and clicked “Volver a revisar”. It recorded every request to `/api/` and, whenever anything changed, four things on screen: the row for `pagos` in the list, the status in the details, the button, and the footer. The timestamp in the footer was replaced with `HH:MM:SS` for readability. This is the complete trace:

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

And the server log from the same run:

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

Read the trace from the click on “Volver a revisar” (3111 ms):

- **The `POST` goes out once**, and the button flips to “Revisando… [deshabilitado]” two milliseconds later. That is “the mutation in the network tab”: a `POST`, with no `StrictMode` pair, because it is triggered by a click rather than an Effect.
- **Upon receiving its `200` (3418 ms), two `GET` requests fire in the very same millisecond**: `/api/estados` and `/api/servicios/pagos`. These are the two invalidations from `onSuccess`. No one wrote them as fetch requests; they were written as “this data is no longer trustworthy”, and Query converted them into requests because both pieces of data were currently on screen.
- **While they are in transit, the screen does not go blank.** At 3428 ms the list still says `falla (HTTP 503)`, the details still say `En falla`, and the footer adds “· actualizando…”. This is the fourth row of figure 2, `success` + `fetching`, in the real dashboard.
- **The list updates first (3741 ms)**, because `GET /api/estados` takes 300 ms. For 1.2 seconds the list says `disponible` while the details still say `En falla`: the details for `pagos` take 1.5 s on purpose, since Lesson 3. They are two distinct pieces of data in the cache, each on its own journey. The scene that opened the lesson—two parts of the screen telling conflicting stories—lasts here for a second and resolves itself, instead of lasting until someone clicks “Actualizar”.
- **The button reverts to “Volver a revisar” only at 4965 ms**, when the details have also arrived. That is the `await Promise.all` in `onSuccess`: the mutation is not considered settled until both queries have been refetched. The button tells the truth about when the screen is actually up to date.

There are two more details near the top of the trace. When selecting `pagos`, the `cancelada` + `200` pair for the details appears: `StrictMode` mounts, unmounts, and remounts `PanelDetalle`, and because `cargarDetalle` uses the `signal`, Query cancels the first request. And the details took 1.5 s to arrive, just like in Lesson 3, because it was the first time they were requested. If you close them and reopen them within five seconds, there is no request: they are in the cache and fresh.


### 4.7 What Suspense does not do

If you search for how to show “Cargando…” in React, sooner or later you encounter `<Suspense fallback={…}>`. The temptation is to think that wrapping the dashboard in a `Suspense` will make the `fallback` appear while the report is being requested. That is not how it works, and it is worth knowing why before it costs you an afternoon.

`Suspense` displays its `fallback` while something **inside it** is not ready to render. The React documentation lists what counts as “not ready”: code for a component loaded with `lazy`, a promise read with `use` (for example, data arriving from Server Components or a Suspense-enabled framework), a stylesheet with `precedence`, and a few other server rendering and transition cases. And it adds a warning that is the one that matters here: **Suspense does not detect data fetched inside an Effect or event handler** ([React, «Suspense»](https://react.dev/reference/react/Suspense)). `useQuery` fetches its data outside of rendering and communicates via its result object, so a `Suspense` around this dashboard would never display its `fallback`: the dashboard would render immediately with `isPending` set to `true`.

Query does offer a way to work with Suspense: a separate hook, `useSuspenseQuery`, which **suspends** rendering while data is missing. With it, `data` is always defined, because loading and errors **without data** are handled by the surrounding `Suspense` and error boundary ([TanStack Query, «Suspense»](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)). That same guide clarifies that not every error reaches the boundary: it is only thrown when there is no other data to show. If an update fails while a report is in the cache, `useSuspenseQuery` continues rendering the component with `data` and with `isError` set to `true`, so the fifth state, “with data and with error”, remains in place. It is a valid way to write a screen, but it comes at a cost for what this lesson teaches: “loading” and “error without data” are no longer visible in the component, but split between a `fallback` above and an error boundary further above. For a dashboard whose value lies precisely in rendering all five states well, the course prefers to keep them all together, in `ContenidoReporte`, in plain view. That is why the checkpoint does not use Suspense; it is our own design choice, not an absolute rule.

### 4.8 The error boundary: the only class in the course

Everything above deals with **expected** errors: the API returned 503, the network dropped. Those are rendered as UI states. But there is another category of error: a component that throws an exception during rendering. An unexpected `undefined`, a `.map` over something that is not an array. In React, such an error during rendering unmounts the entire tree: the screen goes blank.

To catch it, there is the **Error Boundary**, which in this course is called `LimiteDeError`. The React documentation describes how it is written: a component that defines `static getDerivedStateFromError`, which React calls when a child—even a deeply nested one—throws an error during rendering, so that instead of blanking the screen you can render a message; and, optionally, `componentDidCatch`, to log the error to a service. And it also explains why this course, which does not teach class components, makes an exception here: **today there is no way to write an Error Boundary as a function component** ([React, «Component»](https://react.dev/reference/react/Component)).

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

Read it in three parts:

- **`getDerivedStateFromError`** is static: it has no access to `this`, only receives the error and returns the new state. React calls it during rendering, so it must be pure, just like any render (Lesson 1).
- **`componentDidCatch`** is called later, once React has finished rendering, and therefore can perform side effects: here, logging the error and the component stack to the console. In a production system, this would be the place to send it to an error-tracking service.
- **`render`** renders the alert if an error occurred, or the children if not. The button reloads the entire page: a render error is almost always a bug in the code, and at the top level of the dashboard, starting over is the most direct way to recover a healthy tree. (A smaller boundary, around a single section, could offer to re-render only that part without losing what the person has in the rest; the course uses a single one, at the top.) A precision about the type: `getDerivedStateFromError(error: Error)` assumes that what was thrown is an `Error`, but in JavaScript anything can be thrown ([MDN, “throw”](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw)). If a child threw a bare string, `error.message` would be `undefined` and the alert would appear without a message. With that, the course's boundary stays short; Lesson 5 returns to the `unknown` type of what is thrown. Notice that the alert displays `error.message` as-is. Because it is rendered as text children in JSX, it does not open an XSS vulnerability, but it does expose the raw exception message to anyone, which might reveal internal details: field names, routes, query fragments. In this practice dashboard it aids debugging; in a public-facing application, it is better to display a generic message and keep details confined to `componentDidCatch` logging.

What an error boundary does **not** catch is just as important as what it does catch. According to the same page: errors in event handlers (an `onClick` that throws), asynchronous code (a `setTimeout`, a dangling promise), server rendering, and errors within the boundary itself. The page adds an exception that you will encounter in [Lesson 7](07-formularios-accesibilidad.md): what is thrown inside a transition, such as a form action, does reach the boundary. That explains the division of responsibilities in this dashboard: a failed `fetch` is not a rendering error, it is data that failed to arrive, and Query handles it as state; the error boundary is reserved for what no one anticipated.

Where does it go? In `main.tsx`, **outside** of `QueryClientProvider`, wrapping everything. That way it also catches errors from the provider and anything beneath it. Figure 3 in “The error you will see” shows you the first mistake you will make with Query, and how this boundary turns it into an informative message rather than a blank screen.

### 4.9 The complete walkthrough

Using two terminals, just like in Lesson 0. In the first, the practice server; as of this lesson it indicates which scenario it started in:

```text
08:11:23.119 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
```

In the second, `npm run dev`, and open `http://localhost:5173/`. You should see the list of four services, the summary “4 servicios revisados · 2 servicios con falla”, “Actualizado a las…”, and every ten seconds, a momentary “· actualizando…” in the footer. Select `pagos`, wait for its details, and click “Volver a revisar”: the row turns green, then the details, and the button reverts to its original text. That is the log from 4.6.1. And one more check, on the row itself: the `pagos` button is a toggle button (`aria-pressed`, Lesson 2), so pressing it **again** closes the detail. It was measured in headless Chrome, driven through its debugging protocol: `aria-pressed` was `false` on opening, `true` after the first click (with the detail in view), `false` after the second (without the detail), and `true` after the third. With the earlier code, which always sent the name, the second click left it `true` and the detail open.

Then, build and inspect the production version, with the server still running: `npm run build` and `npm run preview`, at `http://localhost:4173/`. This is what the log recorded when Chrome opened that version:

```text
08:13:08.422 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
08:13:10.768 GET /api/estados 200
```

A single request. Without `StrictMode` there is no extra mount, and the query is requested once. And the screen, with the tab title at `(2) Revisor`:

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

Shut everything down with Ctrl+C. Finally, the checkpoint verification, the one that any automated CI run executes: `npm ci`, `npm run lint`, and `npm run build`, all three with exit code 0. The linter reported nothing, and the build produced the exact same filename that the course runs obtained on macOS and Linux: `index-CHheidKQ.js`.

## The error you will see

The lesson has one main error, the one almost everyone makes the first time they use Query, and one supporting error that TypeScript catches for you.

**The main error: missing provider.** `useQuery` needs a `QueryClient`, and looks for it in the nearest `QueryClientProvider` up the tree. If there is none—you forgot to wrap the tree, or mounted a component in a test without it—`useQuery` throws an error **during rendering**. The third figure triggers it on purpose, with an error boundary following the same pattern as `LimiteDeError`, and asks React to notify when a boundary catches something (`onCaughtError`):

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

The message is self-explanatory: “no `QueryClient` set, use `QueryClientProvider` to set one”. And you can also see what the boundary did: instead of a blank screen, the user sees a message. Without the boundary, React would have unmounted the entire tree and the same error would have appeared in the console as uncaught. The fix is the `QueryClientProvider` in `main.tsx`. In the tests in Lesson 8, this very error is why a test helper exists that mounts each component already wrapped in its provider.

**The supporting error: using `data` before knowing whether it exists.** In `ContenidoReporte`, delete the first `if`, the one for `isPending`, and check types. This was done in a copy of the checkpoint:

```text
$ npx tsc -b
src/reporte/ContenidoReporte.tsx(35,11): error TS2339: Property 'estados' does not exist on type 'ReportePublico | undefined'.
src/reporte/ContenidoReporte.tsx(42,32): error TS7006: Parameter 'estado' implicitly has an 'any' type.
```

Without that `if`, `consulta.data` can be `undefined`—which is precisely the `pending` case—and TypeScript refuses to destructure it. (Both warnings depend on `"strict": true` in the `tsconfig`, the one set in Lesson 0: without it, `undefined` would slip through without complaint.) The second error is a consequence of the first: not knowing what `estados` is, it also cannot know what each `estado` is. What is valuable here is that the warning arrives **before** running: in the browser, that oversight would be a `TypeError` during the initial render, exactly the kind of error that ends up in the error boundary from 4.8. The fix is not `consulta.data!.estados` nor `consulta.data?.estados ?? []`: the first lies, and the second turns “I don't know yet” into “there are no services”, which is the fourth state and means something completely different. The fix is rendering the `pending` case.

## What gets done wrong

**Copying Query data into `useState`.** `const [reporte, establecerReporte] = useState(consulta.data)` and an Effect to synchronize them. This is the temptation for anyone coming from manual data fetching. Now there are two copies of the same data, one grows stale, and the Effect is precisely the one Lesson 3 taught you not to write. Read `consulta.data` wherever you need it.

**Creating the `QueryClient` inside a component.** Every render creates a new, empty cache: request deduplication, data surviving upon return, and everything from figure 1 is lost. It belongs at module level, in `main.tsx`, or in a function called once.

**Leaving a variable that the function uses out of the key.** `queryKey: ["servicio"]` with a function that requests `nombre` makes all detail views share a single cache entry. The linter will not catch it. The rule: whatever the function uses belongs in the key.

**Treating `isFetching` as “loading”.** If you hide the list whenever `isFetching` is true, you blank it every ten seconds during polling. “Loading” is `isPending`; `isFetching` is, at most, a subtle indicator.

**Showing only the error and hiding stale data.** When `status` is `error` but `data` exists, you have something useful to display. A monitoring dashboard that goes blank because an update failed is worse than one that says “this is from a minute ago”.

**Forgetting the empty state.** A list without rows is indistinguishable from a broken screen. A sentence like “No hay servicios configurados todavía.” costs one line.

**Invalidating in the component right after `mutate()`.** Calling `invalidateQueries` immediately after `mutate()`, in the `onClick` handler, invalidates **before** the server has responded: the list is refetched and may return stale data. Invalidation belongs in `onSuccess`, which runs after the response has arrived.

**Increasing `retry` to “fix” an unstable API.** More retries do not make the API fail less: they make the user take longer to find out it failed. With exponential backoff, each extra retry adds seconds to “Cargando…”.

**Wrapping `useQuery` in `Suspense` expecting a `fallback`.** It will not appear: `useQuery` does not suspend. If you want Suspense, that is another hook, `useSuspenseQuery`, with a different distribution of states.

**Using an error boundary for network errors.** A failed `fetch` is a state rendered alongside the list, with its “Reintentar” button. An error boundary is for what no one anticipated.


## Exercises

### Exercise 1 — Predict the log without retries

With the server in `ESCENARIO=caido`, the log from 4.5 recorded one cancellation and three `503`s. **Before changing anything**, predict what it records if in `cliente.ts` you change `retry: 2` to `retry: 0`, and how long the alert takes to appear. Then verify it with `npm run dev`, and restore `2` when finished.

### Exercise 2 — Without `staleTime`

In `fig04_01.tsx`, delete the line `staleTime: 5_000,` from `ConteoConQuery`. Predict what changes across the three lines of the Query half: calls upon opening, what is immediately visible upon returning, and calls upon returning. Compile and run it.

### Exercise 3 — Invalidate only the details

In `useReintentar.ts`, leave only the invalidation of `claves.servicio(nombre)` inside `Promise.all`. Before testing, predict what the **list** displays after clicking “Volver a revisar” on `pagos`, and when it gets updated. Which part of the opening scene from the lesson reappears? Restore the file when finished.

### Exercise 4 — The key that forgot the name

In `src/detalle/consultas.ts`, change `queryKey: claves.servicio(nombre)` to `queryKey: ["servicio"]`. Open the details for `pagos`, wait for them to load, and before five seconds pass, select `catálogo`. What do the details say under the “catálogo” heading? Did the linter or TypeScript warn you? Explain which rule from 4.3.1 you broke. Restore the file when finished.

## Solutions

### Solution 1

With `retry: 0`, Query does not retry: the log records the `StrictMode` pair and **a single** `503`—that is, `GET /api/estados cancelada por el cliente` followed by `GET /api/estados 503`. The alert appears as soon as that response arrives, about 300 ms after opening the page, instead of the four seconds it took with `retry: 2`. The prediction comes from two previously measured facts: each `503` in 4.5 corresponds to an attempt, and the 1- and 2-second gaps between them are the retry backoffs, which with zero retries do not exist. If in your run the `cancelada` does not appear, it is due to what Lesson 0 explained: it depends on whether the connection reached the server before the abort. Zero retries has its cost: a momentary network glitch immediately becomes an alert on screen. That is why the course uses `2` rather than `0`.

### Solution 2

This is the actual output of the figure without that line:

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

A single number changes: **upon returning there is one call**. Upon opening there is still only one, because deduplication does not depend on `staleTime`. And upon returning, “4 servicios” is still visible immediately, because the data remains in the cache (retained by `gcTime`, not `staleTime`). What changes is that, with `staleTime` at `0`, that data is already stale, so Query displays it **and** refetches it in the background, just once for both components. This is the strategy commonly known as “stale-while-revalidate”: the user never sees an unnecessary loading indicator and the data updates automatically. `staleTime` does not decide whether caching exists; it decides when it is worth revalidating.

### Solution 3

The list **keeps saying `pagos: falla (HTTP 503)`** after the details already say “Disponible”. It only updates at the next `refetchInterval` polling cycle, at most ten seconds later, or earlier if the window loses and regains focus (because the list data becomes stale after five seconds and `refetchOnWindowFocus` is active). This is the scene from the beginning of the lesson: the details and the list telling two different stories about the same service. Nothing in the code is “wrong” in the sense of failing to compile or triggering linter errors; what is missing is notifying the cache that the `["reporte"]` data has also changed. Invalidation describes **what data a write affects**, and that list is the responsibility of whoever writes the mutation. In the log you see it directly: after the `POST`, a single `GET` goes out, the one for the details.

### Solution 4

Under the “catálogo” heading, the details **for `pagos`** appear: “En falla: HTTP 503”. With `["servicio"]` as the key, details for all services share a single cache entry. When selecting `catálogo`, `PanelDetalle` mounts again (due to `key={seleccionado}` in `ContenidoReporte`) and requests the key `["servicio"]`; Query finds the data for `pagos` there, still fresh because five seconds of `staleTime` have not elapsed, and delivers it without fetching anything. Once those five seconds pass, remounting would fetch it again and show `catálogo`, but preceded by a moment of incorrect data. Neither the linter nor TypeScript warns you: the key is a valid array and the data type matches, it's just the data for another service. You broke the rule from 4.3.1, “if the function depends on a variable, that variable goes into the key”: `cargarDetalle(nombre, signal)` depends on `nombre`, so `nombre` must be in the key. This is the Query equivalent of the missing dependency in the Effect from Lesson 0, with one difference worth remembering: here there is no `exhaustive-deps` watching your back.

## How do I know I succeeded

- [ ] `npm ls @tanstack/react-query`, inside `~/curso-react/revisor/`, prints `@tanstack/react-query@5.104.5`, and `src/` no longer contains `useReporte.ts` or `useDetalle.ts`.
- [ ] `npm run lint` finishes without reporting any issues, and `npm run build` finishes with `✓ built` leaving in `dist/assets/` a file named `index-CHheidKQ.js`: if your code is identical to the checkpoint, the filename matches.
- [ ] `node fig04_01.js` prints `1 llamada(s)` upon opening and `0 llamada(s)` upon returning in the Query half, and you can explain where each number comes from.
- [ ] With `ESCENARIO=vacio`, the dashboard says “No hay servicios configurados todavía.”; with `ESCENARIO=caido`, it displays the alert with “Reintentar” and the log records three `503`s (plus, if it gets through in time, a `cancelada por el cliente` beforehand).
- [ ] In the browser, the `pagos` row button toggles: one click shows the detail (`aria-pressed="true"`) and a second click hides it (`aria-pressed="false"`).
- [ ] Under the normal scenario, clicking “Volver a revisar” on `pagos` logs a `POST /api/servicios/pagos/reintento 200` followed by a `GET /api/estados 200` and a `GET /api/servicios/pagos 200`, and the row for `pagos` turns green without clicking “Actualizar”.
- [ ] You can name the five combinations of `status` and `fetchStatus` from figure 2 and identify which one prints “· actualizando…” in the footer.
- [ ] With `npm run preview`, opening the page produces a single `GET /api/estados` request in the log.
- [ ] Removing `QueryClientProvider` from `main.tsx` (and then restoring it), you see the `LimiteDeError` message instead of a blank screen.
- [ ] You noted in your [logbook](bitacora.md) how many requests you were making by hand versus how many it makes now, something Query did on its own that surprised you, and when a non-zero `staleTime` worked to your advantage.

## Summary

Answer without looking at the lesson:

1. According to the course plan, fetching data by hand does not scale for three reasons: caching, waterfalls, and races. What does the React documentation say about each one, and how does Query respond to each? Which one did figure 1 measure?
2. Why is `QueryClient` created in `main.tsx` and not inside a component? What does it store?
3. What is a query key and what rule prevents two different pieces of data from sharing a cache entry?
4. Who creates the `AbortController` now, and when does Query abort the `signal`?
5. What question does `status` answer and which one does `fetchStatus` answer? Which combination means “I have data and I am fetching again”?
6. What are the four states of a query, and what is the fifth that only exists thanks to the cache?
7. What do `staleTime`, `retry`, and `refetchInterval` do in this dashboard? Why are there three `503`s in the log with `retry: 2`?
8. What does `invalidateQueries` do and why does it go in `onSuccess`? Why does the button say “Revisando…” until the details have arrived as well?
9. Why does a `Suspense` wrapping `useQuery` not show its `fallback`?
10. What errors does an Error Boundary catch, which ones does it not, and why is it a class?

## Further reading

- [React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects), “What are good alternatives to data fetching in Effects?” section: the costs of fetching data in an Effect (no server, waterfalls, un-cached, unergonomic) and the recommendation of a client-side cache. Accessed October 21, 2026.
- [React, «Suspense»](https://react.dev/reference/react/Suspense): what activates a Suspense boundary and the warning that it does not detect data fetched inside an Effect or event handler. Accessed October 21, 2026.
- [React, «Component»](https://react.dev/reference/react/Component), “Catching rendering errors with an Error Boundary” section: `getDerivedStateFromError`, `componentDidCatch`, which errors it does not catch, and why there is no function version yet. Accessed October 21, 2026.
- [TanStack Query, «Important Defaults»](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults): `staleTime` at zero, `gcTime` of five minutes, three retries, and refetching on mount, window focus, and network reconnect. Accessed October 21, 2026.
- [TanStack Query, «Queries»](https://tanstack.com/query/latest/docs/framework/react/guides/queries): `status` versus `fetchStatus` and their values. Accessed October 21, 2026.
- [TanStack Query, «Query Keys»](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys): keys as serializable arrays and the rule to include variables used by the query function. Accessed October 21, 2026.
- [TanStack Query, «Query Options»](https://tanstack.com/query/latest/docs/framework/react/guides/query-options): `queryOptions` to share key and function with their type. Accessed October 21, 2026.
- [TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): the `AbortSignal` each function receives and when it is aborted. Accessed October 21, 2026.
- [TanStack Query, «Query Retries»](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries): the number of retries and the doubling backoff from one second up to 30. Accessed October 21, 2026.
- [TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery): `refetchInterval`, `refetchIntervalInBackground`, `dataUpdatedAt`, `isFetching`, `isPending`, and `refetch`. Accessed October 21, 2026.
- [TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations): `useMutation`, its states, and functions returning promises. Accessed October 21, 2026.
- [TanStack Query, «Query Invalidation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation): what `invalidateQueries` does and prefix matching on keys. Accessed October 21, 2026.
- [TanStack Query, «Invalidations from Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations): returning the promise in `onSuccess` and `isPending` remaining `true` until it resolves. Accessed October 21, 2026.
- [TanStack Query, «Suspense»](https://tanstack.com/query/latest/docs/framework/react/guides/suspense): `useSuspenseQuery`, data always defined, and which errors reach the error boundary. Accessed October 21, 2026.
- [npm, «npm install-scripts»](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts): dependency installation scripts, blocked until approved, and how to inspect and approve them. Accessed October 21, 2026.
- [npm, `@tanstack/react-query`](https://www.npmjs.com/package/@tanstack/react-query): version 5.104.5, published October 19, 2026. Accessed October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| server state | the screen's copy of data living on another computer: takes time to arrive, can fail, and grows stale |
| cache | the place, outside of components, where Query stores what arrived from the server, one entry per key |
| query key | the array identifying a piece of data in the cache, such as `["servicio", "pagos"]` |
| deduplication | when two components request the same key at the same time, a single request is made |
| fresh / stale | data is fresh for the duration of `staleTime` after arriving; afterward, it is displayed but refetched when needed |
| `status` / `fetchStatus` | whether there is data (`pending`, `error`, `success`) / whether the function is running (`fetching`, `paused`, `idle`) |
| mutation | an operation that changes data on the server; in Query, `useMutation`, which only runs when calling `mutate()` |
| invalidate | mark queries for a key as stale and refetch those currently on screen |
| empty state | a valid response with no data, which the screen must distinguish from loading and from an error |
| Error Boundary | a class component that catches errors thrown by its children during rendering and renders a fallback in their place |

---

**Next:** [Lesson 5 — Routes and the URL as state](05-rutas-url-como-estado.md)
