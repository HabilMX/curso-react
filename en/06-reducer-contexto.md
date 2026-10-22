# Lesson 6 — Shared state: reducer and context

*Friday, 6:50 PM. The release of the week goes out at 7:30 PM. In the chat, two messages arrive almost together. The first is from operations: “I clicked 'Volver a revisar' on pagos, went back to the list to see if it changed, and I never found out if it worked.” You have the answer: the error notice lived inside the service page, and when leaving the page, the notice left with it. The second is from the on-call room: “On the big screen, the milliseconds are piling up; can you hide them?”. It looks like a ten-minute change. You open `FilaEstado.tsx`, which is the one rendering the milliseconds, and add a `mostrarDuracion` prop to it. But `FilaEstado` receives it from `ListaEstados`, which receives it from `ContenidoReporte`, which receives it from `PaginaReporte`, which would have to receive it from the layout through the `Outlet`. By 7:05 PM your change touches five files, and three of them do nothing with that data: they just pass it to the next one. And the checkbox to toggle it is still missing. This lesson solves both messages with two React tools, and explains why neither of them is for everything.*

**Time:** 2 × 45 min (the natural break is between sections 6.1 and 6.2)

**What you build:** the `revisor`'s notice tray, which lives in the layout and therefore survives page navigation; the “Volver a revisar” button leaves its result there, both on success and on failure. And the display preferences, “Mostrar duración” and “Vista compacta”, which are changed in the header and read by a list row five levels down, without passing through the intermediate components.

**What you learn:** `useReducer`: actions describing what happened and a pure reducer tested without React; context only when props and `children` are no longer enough; two contexts, one for state and one for dispatch; a hook that fails if the provider is missing; **what state lives where**: local, URL, server, or context.

**Where you are coming from.** From [Lesson 5](05-rutas-url-como-estado.md). Your `revisor` already has routes: the list at `/`, with filters in the URL (`?fallas=1&q=`); the details at `/servicios/:nombre`; and a “not found” page for everything else. A layout, `Disposicion`, wraps all pages with the header and navigation, and stores notes, which reach pages via `<Outlet context>` and the `useNotas()` hook. Since that lesson, the root route also has its own error boundary, because React Router catches page errors before they reach `LimiteDeError`. Data continues to be fetched by TanStack Query, and “Volver a revisar” is a mutation that invalidates both the report and the details. You start from the checkpoint [`programas/05-rutas-url-como-estado/revisor/`](../programas/05-rutas-url-como-estado/revisor).

**What this lesson does not do.** It does not touch the practice server or the routes: the API remains on version C and the route array is the same as in Lesson 5. It does not move notes into a context: they stay in the layout, and section 6.3 explains why that is their place. It does not use Redux or any state library: the course does not need one, and section 6.3 discusses when it would make sense to consider it. It does not memoize context values with `useMemo` or `useCallback`: here we measure how many times each component renders, and the measurement does not require it; measuring with the Profiler is the subject of [Lesson 9](09-rendimiento-publicacion.md). It does not persist preferences in the browser: upon reloading, they return to their initial values (Exercise 4 discusses where they should live if they were to be preserved). And it does not set up a test suite: the reducer is tested here with a figure running it without React; test suites with Vitest are the subject of [Lesson 8](08-pruebas-de-componentes.md).

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions from this lesson's `package.json`; this lesson adds no dependencies. The checkpoint was installed from scratch with `npm ci`, and `npm run lint` and `npm run build` finished cleanly and produced `dist/assets/index-BYYbMpFE.js`. The checkpoint was also installed from scratch with `npm ci` in a Linux container (Debian 12, official `node:24.22.0-bookworm` image), where `npm run lint` and `npm run build` produced the same filename. It was not run on real Linux Mint, but nothing shown depends on the OS. The browser captures in 6.3.5 were taken with a `PaginaServicio` that, if a refresh failed, hid the detail and the note editor; the one you see in 6.2.6 fixes that and delivers the same thing when the requests succeed, which is all those captures record. On macOS, if `npm ci` prints an `install-scripts` warning about `fsevents@2.3.3`, it is an optional dependency installed only on macOS for file watching: there is no need to approve it, and it will not appear on your Mint. What is seen “in the browser” was measured with headless Chrome against `vite preview`, controlled via its debugging protocol to click and read the page after each click: it is a real browser, not a simulation. Because other processes were running on the test machine, the practice server listened on port 3106 (`PUERTO=3106 npm run servidor`) and the preview on 4106, with a one-time configuration pointing its proxy to that port; on your machine use the usual ones, 3100 and 4173, and you will see the same thing. Practice server log timestamps are in UTC. The figures were run with their own `package.json` in [`programas/06-reducer-contexto/`](../programas/06-reducer-contexto), alongside `revisor/`; Figure 1 runs with `node` directly on the `.ts` file without compiling, and the others are compiled with `tsc` as in previous lessons. Long paths are shown starting from `~/curso-react`. The practice server (the same file since Lesson 4) responds `400` with `{"detalle":"nombre de servicio inválido"}` to an address with a malformed `%`, such as `/api/servicios/%`, and to its `/reintento` route; it used to respond `500`. It was measured with `curl` against a copy, before and after, and the process stayed alive in both cases.

## By the end you will be able to

- Write reducer actions as a discriminated union describing **what happened** (`agregado`, `descartado`), and have TypeScript flag the `switch` when you add an action and forget to handle it.
- Test a reducer without React, using `node` and an array of actions, and verify that it did not mutate the state it received.
- Decide, when facing data needed by multiple components, whether passing props is enough, whether rearranging with `children` is better, or whether a context is needed, and explain the decision using the `revisor` case.
- Separate state and dispatch into two contexts and measure, by counting renders, which components re-render in each case.
- Write a context hook that throws a clear error when the provider is missing, and show what happens when, instead of throwing, the context has a default value.
- Classify each piece of `revisor` state into local, URL, server, layout, or context, with a reason for each.

## The why before the how

The two messages from the scene look like two different problems, but they are really the same question asked twice: **who holds this data, and how does it reach whoever needs it?**

Start with the lost notice. In Lesson 5, the result of “Volver a revisar” was rendered inside `PaginaServicio`, with a `<p role="alert">` that appeared if the mutation failed. That works as long as the user stays on that page. But the page is a route, and a route that you navigate away from **unmounts**: its state, its on-screen mutations, and its notices are destroyed. The notice needs to live somewhere that does not unmount upon navigation, and that place already exists: the layout, which wraps all pages. The problem is the distance. The one that learns the result is a hook, `useReintentar`, running inside `PaginaServicio`, inside the `Outlet`. The one that must render it is up above, in the layout. An upward path from bottom to top is needed.

And it is not just a single notice. If the notice is to outlive the page, it must be possible to dismiss it; if several arrive, a cap must be set so they do not grow indefinitely; and each one needs an identifier so React knows which one to remove. With `useState`, that means three functions (`agregar`, `descartar`, `descartarTodos`) touching the same array, each with its own copy of the rules. React's documentation describes this exact moment: when a component has many state updates spread across many event handlers, it helps to consolidate all that logic outside the component into a single function ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). That function is called a **reducer**.

Now the second message. `mostrarDuracion` is not data belonging to a page: it is toggled by a checkbox in the header and read by each row in the list. Between the checkbox and the row are five components, and four of them do not use the data. Passing it hand to hand works, but forces you to change the signatures of components that have nothing to do with the preference, and every new component placed in between will have to remember to pass it along. React has a tool for data to “jump” intermediate levels: **context**. And its documentation, on the very page where it introduces it, warns before using it that it is very tempting to overuse it ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)). That is why this lesson does not start with context, but with the two things worth trying first.

The lesson has three parts. In 6.1 you build the notices reducer and test it without React. In 6.2 you connect it with two contexts, write the hook that refuses to work without a provider, and apply the same pattern to preferences. And in 6.3 you take full inventory: each piece of state in `revisor`, where it lives and why there. When finished, this is what is visible on the `pagos` detail screen after clicking “Volver a revisar”, and you will know where every piece comes from:

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div></section>
```

This is the tray exactly as Chrome delivered it, and it remains the same after returning to the list: the notice no longer depends on the page that produced it.

## The concepts

### 6.1 `useReducer`: actions that describe what happened

#### 6.1.1 A reducer is a function you already know

The name sounds strange, but the idea is not. JavaScript arrays have a method, `reduce`, which iterates through elements in order, passing the result of each step to the next; the function you give it is called, precisely, a *reducer*, and the end result is a single value ([MDN, `Array.prototype.reduce()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)). React documentation explains that its reducers take that name from the same idea: an array reducer receives “the result so far” and “the current item” and returns the next result; React's receives **the state so far** and **the action** and returns **the next state** ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

Keep this in mind, because in 6.1.4 you will literally use array `reduce` with the notices reducer, and it will work without changing a thing. That is the first advantage of a reducer: **it knows nothing about React**. It is a two-argument function that returns a value.

#### 6.1.2 Actions: what happened, not what to do

With `useState`, the component tells React **what to do**: “set this array”. With a reducer, the component tells it **what happened**: “a notice was added”, “the user dismissed notice 3”. What happened is described with an object called an **action**, and the rule for writing it well, according to React's documentation, is that an action's type should ideally describe “what the user did” rather than “how you want the state to change”; and that **each action should describe a single interaction**, even if that interaction leads to multiple changes in the data ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

In `revisor`, there are three actions, and their names are intentionally past participles: `agregado`, `descartado`, `todos-descartados`. They read like a log of events. Notice what they are **not**: there is no `recortar-a-cinco` action nor an `incrementar-id` action. When a new notice arrives, three things happen (it is placed at the front, the list is capped at five, and the ID counter increments), but the user did only one thing: trigger a notice. Those three things are the *consequence*, and the consequence is the reducer's business.

In TypeScript, the set of possible actions is a **discriminated union**, just like `EstadoPublico` since Lesson 0: each member has a distinct `tipo` and the data that type needs. `agregado` carries the level and text; `descartado` carries the identifier; `todos-descartados` needs nothing else.

#### 6.1.3 The notices reducer

This is the complete file. Everything there is to know about notices is here, and none of it imports anything from React:

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

Read it from top to bottom:

- **The types.** An `Aviso` has an `id`, a `nivel` (`exito` or `error`), and a `texto`. State is not just the list: `EstadoAvisos` also stores `siguienteId`, the number the next notice will receive. It might seem that this could be computed (“the highest ID plus one”), but no: if you dismiss the newest notice, the highest drops, and the next notice would reuse an ID that React already used as a `key` for another element. It is data that cannot be derived from the rest, so it is stored. All fields are `readonly`, and the list is `readonly Aviso[]`: TypeScript will not let you mutate it, and in “The error you will see” you will verify this.
- **`agregado`.** Builds the new notice with `siguienteId`, puts it **at the beginning** of a new list (`[nuevo, ...estado.avisos]`), and trims it with `slice(0, MAXIMO_AVISOS)`. Neither `[...]` nor `slice` mutates the original array: they create another one. The cap is in a named constant, `MAXIMO_AVISOS = 5`, rather than a bare `5`, so it can be read and tested.
- **`descartado`.** `filter` returns a new list without the notice for that `id`. The rest of the state is copied with `...estado`; `siguienteId` does not change, which is why an identifier is not reused as long as the application stays loaded in the tab (the state lives in memory: on reload, the counter goes back to 1).
- **`todos-descartados`.** An empty list, counter intact.
- **`default` with `never`.** If TypeScript reached this point, it has already ruled out all three types, and `accion` has no remaining possible type: it is `never`. Assigning it to a `never` variable costs nothing as long as that holds true. The day someone adds a fourth action to the union and forgets its `case`, that assignment stops compiling. It is the same technique the TypeScript handbook calls exhaustiveness checking ([TypeScript, «Narrowing», *Exhaustiveness checking*](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)), and it is the same one `ContenidoReporte` used since Lesson 0. The `throw` would only execute if something bypassed the type system (for instance, an action manually cast with `as`); it is the safety net beneath the net.

There is one condition this file meets that is not obvious at first glance: **the reducer is pure**. It takes a state and an action and returns a state; it does not request anything over the network, schedule timers, write to the console, or read the clock. The `useReducer` documentation requires it (“must be pure”) and explains how React checks it: in `StrictMode`, it calls your reducer **twice** to help you uncover accidental impurities ([React, `useReducer`](https://react.dev/reference/react/useReducer)). If the reducer had a side effect, such as a `fetch`, that double call would fire it twice in development, which is exactly what `StrictMode` wants you to see. And there is a detail in this reducer that is easy to break unintentionally: identifiers. If instead of storing `siguienteId` in state you used an external counter (`let ultimo = 0` at the top of the file, and `ultimo += 1` inside), the double call from `StrictMode` would skip numbers, and two reducers processing the same actions would produce different results. Because the counter travels in state, the same action applied to the same state always yields the same result.

#### 6.1.4 Testing it without React

Because the reducer is a function without React, it can be tested like any function. This figure imports the file **as is** and passes actions to it. It runs with `node` directly without compiling, because Node 24 runs `.ts` files (Lesson 0 explained this in 0.2.2); the `tsc` on the first line only checks types.

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

Each line is a statement you can verify by eye:

- **`seis agregados`.** Six actions, passed with array `reduce`, the same method from 6.1.1. Five remain, the newest first, and `a` (ID 1) was dropped due to the cap. `siguienteId` is 7: six numbers were handed out.
- **`descartado el 3`.** `c` is removed; the others keep their identifier.
- **`todos descartados`.** Empty list, and `siguienteId` remains at 7: the next notice will be 7, not 1.
- **The last three lines** are purity, measured. The same action on the same state yielded the same result; the state passed as input still has its five notices after the reducer “dismissed it”; and the initial state, used as the starting point for everything, remains empty. The reducer never touched what it received: it always returned something new.

This is what React documentation places in favor of the reducer when comparing it to `useState`: because it does not depend on your component, it can be exported and tested separately, and you can add a `console.log` to see each state update and **why** it happened—that is, which action triggered it ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). The same page is honest about the cost: with a reducer you write more code upfront—the function and the actions. For three actions with a cap and a counter, that cost pays for itself. For a checkbox that toggles on and off, it does not; that is why the preferences in 6.2.7 stick with `useState`.

(The `avisos.ts` copy imported by the figure is identical to the one in the checkpoint: `cmp avisos.ts revisor/src/avisos/avisos.ts` prints nothing. On your machine, copy the file into your figures folder.)

#### 6.1.5 `useReducer`: connecting the reducer to React

The reducer decides; what is missing is something to hold state between renders and pass actions to it. That is what `useReducer` does. Its form is `const [estado, despachar] = useReducer(reducer, valorInicial)`: it returns the current state and a function, `despachar` (*dispatch*), which accepts an action ([React, `useReducer`](https://react.dev/reference/react/useReducer)). When you call `despachar({ tipo: "descartado", id: 3 })`, React calls the reducer with its current state and that action, stores whatever the reducer returns, and re-renders. If what it returns is **the same object** (compared with `Object.is`), React skips rendering the component and its children; documentation clarifies that it might still call the component once before discarding the result, but that does not change what you see.

In `revisor`, the one calling `useReducer` is a component that renders nothing of its own, the notices **provider**:

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

Four lines of logic, and two are explained in 6.2. What matters here is what `useReducer` guarantees about `despachar`: the documentation states that this function has a **stable identity**, meaning it is the same function across all renders ([React, `useReducer`](https://react.dev/reference/react/useReducer)). State changes whenever a notice arrives; `despachar`, never. That distinction is the basis of the most important decision in the next section.

### 6.2 Context: when props and `children` are no longer enough

#### 6.2.1 Before context, two questions

React documentation is direct: needing to pass a prop through multiple levels **does not mean** you must put that information in context. First, consider two alternatives in this order ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)):

1. **Pass props.** It can feel like a chore, but it makes it clear which component uses which data, and whoever maintains the code will appreciate it.
2. **Extract components and pass JSX as `children`.** If data passes through layers that do not use it, often it is because component extraction was missed: instead of `<Disposicion avisos={avisos} />`, which forces the layout to pass notices down, you write `<Disposicion><Bandeja avisos={avisos} /></Disposicion>`, and the layout no longer knows notices exist.

Only if neither works, context. Try the exercise with both `revisor` cases.

**The notices.** The one rendering them, the tray, lives in the layout. The one producing them, `useReintentar`, lives in `PaginaServicio`, which renders inside `<Outlet />`. Passing props does not work here for a concrete reason: the layout **does not create** `PaginaServicio`. The router creates it, according to the URL, in the slot of the `Outlet`. There is no `<PaginaServicio despachar={…} />` written in code where you could add a prop. The only downward channel the router provides is `<Outlet context>`, the same one for notes. You could put `despachar` into that object, but then only pages could notify, and notifying is an application-wide concern, not a route-specific one: a component producing a notice should not depend on whether it is inside the `Outlet`. And `children` does not help either: there are no intermediate components to extract, because between the layout and the page there are no components of yours—there is a router.

**The preferences.** The path is different and the result is the same. The checkbox lives in the layout's header. The row rendering milliseconds is `Descripcion`, inside `FilaEstado`. Between the two: `Outlet`, `PaginaReporte`, `ContenidoReporte`, `ListaEstados`, and `FilaEstado`. Passing the prop forces changing the signature of four components that do not use it, which is the scene from the lesson opening. And `children`? Here it is worth considering, because it is the alternative the docs recommend before context. The problem is that rows cannot be created from above: `ListaEstados` creates them with a `map` over **already filtered** statuses, and the filter depends on the URL, read by `PaginaReporte`. To pass rows as `children`, you would have to pull the `map` out of `ListaEstados` and lift it all the way to the layout, which would then need to know about filters and queries. That is reorganizing half the application just so a presentation value reaches its destination. When the only way to avoid context is to tangle responsibilities, context is the right tool.

Among the use cases React docs list for context are, precisely, application **theming** (how it looks) and **managing state** that many distant components need to change, “often using a reducer together with context” ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)). Preferences are the former; notices, the latter.

#### 6.2.2 Creating, providing, and reading a context

A context has three parts:

1. **Created** with `createContext(defaultValue)`. The argument is the value received by whoever reads the context if **there is no provider** above it in the tree; documentation calls it a “last resort” fallback, static, that never changes ([React, `createContext`](https://react.dev/reference/react/createContext)).
2. **Provided** by rendering the context as a component with a `value` prop: `<ContextoAvisos value={estado}>…</ContextoAvisos>`. Everything inside, at any depth, can read that value. Since React 19 it is written like this, using the context itself; previously it was written `<ContextoAvisos.Provider value={…}>`, a form the documentation now calls legacy ([React, `createContext`](https://react.dev/reference/react/createContext)) and which the React team announced will be deprecated in future releases ([React, «React v19»](https://react.dev/blog/2024/12/05/react-19)). If you read older code or tutorials, you will see `.Provider` everywhere: it does the same thing.
3. **Read** with `useContext(Contexto)`, which searches for **the nearest provider above** the component calling it, ignoring any provider that the component itself renders ([React, `useContext`](https://react.dev/reference/react/useContext)).

The notices contexts live in their own file, as recommended by docs when multiple files need them ([React, `createContext`](https://react.dev/reference/react/createContext)):

```ts
// revisor/src/avisos/contextos.ts
import { createContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";

export const ContextoAvisos = createContext<EstadoAvisos | null>(null);
export const ContextoDespachoAvisos = createContext<Dispatch<AccionAvisos> | null>(null);
```

Two details. First: the default value is `null`, and the type says so (`EstadoAvisos | null`). It is a deliberate choice, not an oversight, and 6.2.4 explains why it is better than a fallback that “works”. Second: **there are two contexts**, not one.

#### 6.2.3 Two contexts: state and dispatch

Return to `ProveedorAvisos` from 6.1.5. State goes in `ContextoAvisos`; `despachar` goes in `ContextoDespachoAvisos`. Why not a single context with an object `{ estado, despachar }`? The React guide combining reducer and context requests this exact separation, one context for the list and another for the dispatch function ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). It doesn't explain why; the reason given in this lesson is deduced from a rule of `useContext`: React re-renders **all components reading a context** when its provider receives a different `value`, compared with `Object.is`, and skipping renders with `memo` does not prevent it ([React, `useContext`](https://react.dev/reference/react/useContext)).

With a single context, `value` is a new object every time state changes, so everyone reading the context re-renders, **even if they only want to dispatch**. In `revisor` there is one like that: `useReintentar`, which produces notices and never reads them; and any form announcing its result would be another. With two contexts, the dispatch context holds a stable function and its `value` never changes. That is not theory; it can be counted. This figure mounts a tray and a button inside a provider, clicks the button three times, and counts how many times each rendered, first with one context and then with two. To count without interfering with rendering, each component calls `useContarDibujos`, a hook with an Effect **without** a dependency array, which runs after each committed render:

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

The tray renders four times in both cases: once on mount and once per notice. That is correct, because it displays the count. The button is the difference. With a single context it renders four times, like the tray, without ever showing anything new; with two, only once, on mount. On a screen with one button, you won't notice. On a screen with fifty components that only dispatch, that is fifty additional renders per notice, all unnecessary.

Two observations on the figure, because they explain the code of `revisor`. First: the button and tray do **not** re-render just because the provider renders. The provider receives both as `children`, and `children` is a value created by whoever called the provider, once; when the provider updates its state and re-renders, `children` is still the same object and React has no reason to re-render it. The only thing forcing a child to re-render is reading a context that changed. That is composition from Lesson 1 working in your favor. Second: the figure mounts without `StrictMode` so counts are exact (with it, the extra Effect cycle on mount would add one more to each component, without changing the difference). And a third, regarding the instrument: the counter is a variable outside React, and the Effect increments it. Doing so in the component body (`dibujos.boton += 1` during render) would be the impurity Lesson 1 taught you to catch, rejected by the linter with `react-hooks/immutability`. Inside an Effect it is legal: Effects exist to touch what lies outside React. Even so, it is a measurement tool for the figure, not code for `revisor`; to measure renders in a real app, the tool is the React DevTools Profiler. Running `npx eslint` on this lesson's figures yields no warnings.

And wouldn't it be easier to wrap the object in `useMemo`? Documentation for `useContext` suggests this when the value is an object with functions: it is a performance optimization, clarifying that in small apps it is not an issue ([React, `useContext`](https://react.dev/reference/react/useContext)). Splitting into two contexts is not an optimization added after the fact: it is the natural shape of the data, because state and dispatch change at different rates. And it requires memoizing nothing. It is the difference between structuring things well from the start and patching with a tool that carries its own cost, which is the philosophy of this course.

#### 6.2.4 A hook that refuses to work without a provider

Nobody in `revisor` calls `useContext` directly. Two hooks do, one per context:

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

Both do the same thing: read the context, and if they receive `null`, **throw an error stating what is missing and where**. `null` can only come from one place: the default value of `createContext`, which React uses only when it finds no provider above. If `null` arrives, someone rendered a component using notices outside of `ProveedorAvisos`. Since the `if` eliminates `null`, what the hook returns already has the exact type, `EstadoAvisos` or `Dispatch<AccionAvisos>`, and whoever uses it doesn't have to check anything.

The React guide suggests exporting hooks like these and notes that they do not change behavior, but allow you later to split contexts or “add some logic” to those functions ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). The provider check is that logic. Why throw, rather than giving context a default value that “works”, like an empty list and a no-op function? Because that value conceals the error instead of revealing it. This figure mounts both versions **without a provider**:

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

Version A does not fail. It says “0 avisos”, and clicking the button does not fail either: it calls the no-op function from the default value, which does nothing, and the screen continues to say “0 avisos”. It is the worst possible outcome, because everything **seems** to work: the user clicks “Volver a revisar” and never sees the notice, and no one knows why because there is no error anywhere. Version B halts on the first render with a message naming the missing component. An error appearing the first time you run the code, with its cause written out, is worth far more than a screen that lies in silence.

Where would that error end up in `revisor`? Depends on where the component without a provider was. If it were a page, it would be caught by the root route's error boundary added in Lesson 5, and its notice with the hook's message would take the place of the entire layout; if outside the router, it would be caught by `LimiteDeError`. In both cases, the message you would see is the hook's. And in the checkpoint this cannot happen, because providers wrap the whole application (as seen in 6.2.8). Where it could happen is in a test mounting an isolated page: if someone forgot providers on mount, the error would say so plainly.

One more detail of `useContext` worth knowing: if a provider exists but you forgot to write `value`, React does not use the default value; it is as if you passed `value={undefined}` ([React, `useContext`](https://react.dev/reference/react/useContext)). The `revisor` hook checks for `null` and would let that `undefined` through, but TypeScript catches it beforehand: the context was created with type `EstadoAvisos | null`, and a provider without `value` does not compile.

#### 6.2.5 The tray, a live region

With hooks in place, the tray is short:

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

It reads notices with `useAvisos()` and gets `despachar` with `useDespachoAvisos()`. Each “Descartar” button dispatches `descartado` with its notice ID, and that same ID is the row's `key`, stable and unique thanks to the reducer counter. “Descartar todos” only appears if there is more than one.

The part designed with care is accessibility. A notice appears on screen without the user having requested it at that spot: they clicked a button elsewhere on the page, or navigated to another page. Sighted users notice; screen reader users do not, unless the notice is inside a **live region**. The `status` role defines a live region with advisory information that is not important enough to be an alert; it has implicit `aria-live="polite"` and `aria-atomic="true"`, so the screen reader announces it when the user pauses other tasks, without interrupting ([MDN, `status` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).

Notice **where** the `role="status"` is: on a `div` that always exists, even when there are no notices. What appears and disappears is the inner list. This is not arbitrary: MDN's live regions guide explains that assistive technologies generally only announce **dynamic** changes within an already existing region, that it is best to establish the empty region before filling it, and that having it in the initial markup is most reliable ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). If the region appeared alongside its first notice, that notice might never be announced. The “Descartar todos” button stays **outside** the region by the same logic in reverse: appearing or disappearing is not news that needs announcing. And the `aria-label` on each “Descartar” button specifies which notice it dismisses, so a screen reader does not read five identical buttons.

Two consequences of this region worth knowing, because they aren't free. The first comes from the implicit `aria-atomic="true"`: with it, when the region changes, the screen reader presents it in its **entirety**, even if only a part changed ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). With five notices in the tray, a sixth can cause all five remaining ones to be read aloud, along with their button names. If that becomes annoying when testing with a screen reader, `aria-atomic="false"` on the `div` causes only what is new to be announced; this lesson's checkpoint sticks with the role's default behavior. The second is a decision: `error` level notices also go into this polite region, which waits for the user to finish what they are doing, rather than a `role="alert"`, which interrupts. The outcome of a retry does not warrant an interruption; an error preventing further work would.

One more limitation, and this one is not resolved in this lesson. When someone activates “Descartar” with the keyboard, the button that had focus disappears along with its notice, and with no element focused the browser leaves `document.activeElement` on `document.body` ([MDN, `Document.activeElement`](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement)): a person navigating with Tab would have to start over from the beginning of the page. It was not measured in a browser for this lesson; check it yourself: tab to a “Descartar”, activate it with Enter, and press Tab again. [Lesson 7](07-formularios-accesibilidad.md) measures the same mechanism with a button that becomes disabled while it has focus (focus falls to the `body`), but this lesson's checkpoint and the following ones do not move focus when dismissing a notice. If you needed it, the way would be to give the tray a container with `tabindex="-1"` and call `.focus()` on it or on the next notice, which is the technique that lesson mentions for error messages.

With this change, `revisor` has two `role="status"` elements: the tray's and the “Cargando…” of the pages. Keep that in mind if you ever query an element by role: “the” `status` on the page is no longer unique.

#### 6.2.6 Dispatching from the mutation

The producer of notices is `useReintentar`, the mutation hook from Lesson 4:

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

It obtains `despachar` via the hook and uses it in both outcomes of the mutation. In `onSuccess`, the server responded with the new service status, and the notice states which it was: `disponible`, with level `exito`, or `sigue en falla`, with level `error`. In `onError`, the request failed and the notice brings the error message. The invalidations from Lesson 4 remain there, after the notice. The hook reads no notices; it only dispatches. It is the consumer discussed in 6.2.3: thanks to two contexts, incoming new notices do not force it to re-render.

There is a property of these callbacks that makes the notice survive page navigation, and it is worth knowing. TanStack Query distinguishes between callbacks passed to `useMutation`, as here, and those passed to `mutate()`: the latter **do not execute** if the component unmounted before the mutation completed ([TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)). The ones on `useMutation` are used for side effects like invalidating queries, which is why they were written there since Lesson 4. For the notice, the consequence is exactly what the opening scene asked for: the user clicks “Volver a revisar” and leaves for the list; the mutation finishes; the notice is dispatched to a tray in the layout, which was never unmounted. There are two possible moments, and both work: if the person leaves **before** the server answers, the notice arrives when the mutation finishes, with the list already in view; if they wait for the notice and **then** leave, the notice was already in the tray, and the only thing cut off is the reload of the detail that nobody is looking at anymore. The walkthrough in 6.3.5 is of this second kind.

And because the result reaches the tray, the service page stops rendering its own alert:

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

The only change compared to Lesson 5 is what is missing (and the data block, which already renders the old detail if a refresh fails, is the one from Lesson 4): the `{reintento.isError && <p role="alert">…</p>}` block that was beneath the button. Had it remained, an error would be announced twice—once on the page and once in the tray—and the page's copy would die upon navigating away. One event, one place.

#### 6.2.7 Preferences: the same pattern, without a reducer

Preferences use the same structure as notices (a context with `null` default, a provider, a throwing hook), with two differences that are deliberate choices and worth understanding. The type and initial values:

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

The context, in its file:

```ts
// revisor/src/preferencias/contexto.ts
import { createContext } from "react";
import type { ValorPreferencias } from "./preferencias";

export const ContextoPreferencias = createContext<ValorPreferencias | null>(null);
```

The provider:

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

**First difference: `useState` and not `useReducer`.** There are two checkboxes, and the only operation is “change these preferences”. A `cambiarPreferencias` function receiving a `Partial<Preferencias>` and merging it with the updater form from Lesson 2 resolves it in three lines. A reducer with a `cambiado` action would be the same code with more ceremony. Documentation puts the criterion this way: `useState` reads very clearly when updates are simple ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). The reducer earned its place in notices due to the cap, counter, and three different ways of altering the list; none of that exists here.

**Second difference: a single context, with an object.** The `value` is `{ preferencias, cambiarPreferencias }`, a new object on every render of the provider, and `cambiarPreferencias` is also a new function each time. Isn't that the problem from 6.2.3? Look at who reads this context: `PanelPreferencias`, which displays the checkboxes and also changes them, `Descripcion`, which reads `mostrarDuracion`, plus the layout, which reads `compacto`. **Everyone reads preferences.** There is no consumer that only writes, so separating dispatch would save no renders: when preferences change, everyone must re-render anyway. And the new object on every render? `ProveedorPreferencias` only re-renders when its own state changes, because it receives its content as `children`; and when its state changes, the new object is exactly what needs to be announced. There are no renders to memoize.

A clarification so you do not read too much into what follows: “not touching the components in between” is a gain in **code**, not in renders. `Disposicion` also reads the preferences (for the `compacto` class), so it re-renders when either of the two checkboxes changes; and since on every render it builds a new `contexto` object for the `<Outlet context>` (5.1.4), the pages that read it with `useNotas()` also re-render, and with them whatever hangs from them. This is what follows from the `useContext` rule in 6.2.3 and was not measured with counters; if it ever weighed, the measurement would be done with the Profiler (Lesson 9), and the ways out would be to separate `compacto` from `mostrarDuracion` or to memoize the notes value.

The hook, identical to the notices one:

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

The panel with the two checkboxes, living in the header:

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

These are **controlled** checkboxes: what they display comes from `preferencias`, and every change flows through `cambiarPreferencias`. They go inside a `fieldset` with `legend`, HTML's native grouping element for related controls, giving a screen reader the group name, “Preferencias”, before each checkbox. And each `input` is wrapped in its `label`, so the label text serves as its accessible name and clicking the text checks the box.

And the deep consumer, the reason for all of this:

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

`usePreferencias()` is called in `Descripcion`, which is precisely what renders duration, and in no other component of the list. `ListaEstados`, `ContenidoReporte`, and `PaginaReporte` did not change a single line. Compare it to the opening scene: the same result, without touching the three files in the middle. And `FilaEstado` did not change its signature: it still receives `estado` and `tieneNota` and nothing else.

To the stylesheet, the rules for the tray, preferences group, and compact view are added at the end:

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

#### 6.2.8 Where providers go

A provider only serves what is **inside** it. The question is, then, how high up to place it. The layout needs preferences (for the `compacto` class) and renders the tray (which needs notices). `PaginaServicio` needs to dispatch. Both live inside the router, so providers must be **above** `RouterProvider`. They are brought together in a component:

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

The order has a reason. `QueryClientProvider` goes on the outside, as in Lesson 4. Preferences and notices are independent of each other, so their relative order does not matter; what matters is that both sit inside the query client and outside the router. The query client is accepted as a prop, rather than created internally, so whoever mounts the application decides which one to use. A test, for example, would want a fresh `QueryClient` for each case, without retries, and with this component could reuse the exact same providers as the real application. If tomorrow a fourth provider is added, it is added here, and everything using `Proveedores` receives it without modification.

`main.tsx` uses `Proveedores` instead of the `QueryClientProvider` it had previously:

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

And the layout renders the preferences panel in the header, the tray between the header and the content, and applies the `compacto` class:

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

The tray is **outside** `<main>` and outside the `Outlet`: it does not belong to any page, and therefore no page removes it upon unmounting. Notes remain exactly where Lesson 5 left them, in the layout's `useState`, flowing down through `<Outlet context>`. The next section explains why there.

### 6.3 What state lives where

#### 6.3.1 The inventory

With this lesson, `revisor` has state in five distinct places. Each has its reason, and it is helpful to be able to state it in a single sentence:

| State | Where it lives | Why there |
|---|---|---|
| draft of a note | **local**: `useState` in `EditorNota` | only matters to the writer, and resets upon switching services with `key={nombre}` |
| “Solo fallas” and search query | **URL**: `?fallas=1&q=` | describe the view; shared by copying the link and survive a reload |
| service you are viewing | **URL**: `/servicios/:nombre` | it is the page itself |
| list of services and details | **server**: TanStack Query, `["reporte"]` and `["servicio", nombre]` | belong to the server; the UI keeps a cached copy that updates itself |
| saved notes | **layout**: `useState` in `Disposicion`, passed down via `<Outlet context>` | used by two pages, list and details, and nobody outside pages |
| notices | **context**: `useReducer` in `ProveedorAvisos` | produced by pages and displayed by layout; must survive page navigation |
| preferences | **context**: `useState` in `ProveedorPreferencias` | toggled by header and read by a row five levels down |

The rule governing the table is the one from Lesson 2, with more tiers. React documentation calls this having a **single source of truth**: for each piece of state you choose the component that “owns” it, which does not mean all state lives in one place, but that each piece lives in a specific component ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)). What this lesson adds are two more locations to choose from—the URL and the server you already had—and a framework for deciding.

#### 6.3.2 The questions, in order

When facing a new piece of data, ask these questions in this order, and stick with the first answer that is “yes”:

1. **Can it be computed from other state or props?** Then it is not state. Compute it during rendering. This is the rule from Lesson 2 (“avoid redundant state”, [React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)); the failure count in the title and the filtered list in the report are computed, not stored.
2. **Does it belong to the server?** Then it lives on the server and the UI requests it with TanStack Query. Copying it to a `useState` creates two sources of truth that fall out of sync.
3. **Does it describe what the user is seeing, so that they would want to share or reload it?** Then it belongs in the URL.
4. **Is it used by a single component?** Then it is local.
5. **Is it used by multiple components?** Lift it to the nearest common ancestor and pass it via props. If the common ancestor is the layout and the consumers are pages, the channel is `<Outlet context>`.
6. **Do props force drilling through components that don't use it, and restructuring with `children` cannot solve it without tangling responsibilities?** Then, context.

Context is the last question, not the first. Not because it is bad, but because it hides the most: a component reading a context depends on something that does not appear in its signature. React documentation favors props for that very reason: they make it clear which component uses which data ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)).

#### 6.3.3 Why notes do not move to context

This is the obvious question of this lesson. Notes already bubble up to the layout, are already shared across two pages, and now contexts are everywhere. Why not a `ProveedorNotas` alongside the other two? Run notes through the six questions and the answer presents itself: they stop at question 5. Multiple components use them, yes, but **all of them are pages**, and the common ancestor of pages is the layout. The channel already exists and is the one the router provides for this: React Router presents `<Outlet context>` as the built-in solution for when a parent route manages state it wants to share with its children, stating that you could create your own context, but that the use case is so common it comes bundled into `Outlet` ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)).

There are three further reasons, and they are concrete:

- **The scope is right.** With `Outlet`, notes only reach pages. A context placed in `Proveedores` would make them visible to everything: the tray, preferences panel, any future component. Nobody outside the pages needs them, and giving data more scope than it requires invites someone to depend on it.
- **Consumers are not far.** `PaginaReporte` reads notes and passes them down to `ListaEstados`, which uses them to compute `tieneNota`. In between is a single component, `ContenidoReporte`, which receives and forwards them without using them. One intermediate step is not the opening scene of the lesson, with three components merely hauling data: it is the case where docs advise props, because they reveal which component uses which data.
- **The change, if ever needed, touches one file.** Pages do not call `useOutletContext`: they call `useNotas()`, the hook written in Lesson 5 following React Router's recommendation. If a non-page component (the tray, for example) ever came to need notes, a context would be created, `useNotas()` would switch to reading it, and not a single page would change. That is the concrete trigger that would change the decision: **a consumer outside the `Outlet`**. As long as none exists, context solves no problem.

And an honest clarification: neither `Outlet` nor context prevents notes from being lost on reload. Both options store data in tab memory. If notes needed to persist, their place would be the server (the second question), and the practice API does not have an endpoint for that. Moving notes to a context would not bring them any closer to that goal; it would only change the wire.

#### 6.3.4 And Redux, when?

The course README states that Redux is not taught, and this table explains why it is not needed: server state, which in many applications represents the bulk of what was put into a global store, is already handled by TanStack Query; the URL stores the view; and what little remains shared are two small pieces, with a reducer and a context each. The React guide concludes in just this way: you can have many reducer-and-context pairs in your app ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). A global state library begins to make sense when there is a large amount of shared client state that changes frequently and is read by many components, each reading only a fraction. That is an engineering assessment, not a rule of React; and `revisor` is nowhere near that point.

#### 6.3.5 The full walkthrough

With everything in place, the walkthrough uses two terminals, as in previous lessons: `npm run servidor` in one, and `npm run build` followed by `npm run preview` in the other. The build finishes like this:

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

Open `http://localhost:4173/`. The header now carries the preferences group, and beneath it, the empty tray. This is what Chrome delivered for those two pieces:

```text
<header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header>
<section class="bandeja" aria-label="Avisos"><div role="status"></div></section>
```

The live region exists even though it is empty, which is what 6.2.5 required. Click on `pagos`, wait for details (the practice server delays one and a half seconds intentionally), and click “Volver a revisar”. The tray receives the notice you saw at the beginning of the lesson. Now click “Volver al reporte”: the service page unmounts, the list mounts, and the notice **remains there**, with `pagos` now available in the list:

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200, 42 ms)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200, 95 ms)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

Uncheck “Mostrar duración”. The available rows lose their milliseconds, and nothing else changes:

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

And “Descartar” leaves the tray as it was at the beginning: `<div role="status"></div>`, empty but present. The practice server log recorded the entire walkthrough:

```text
08:37:54.148 GET /api/estados 200
08:37:57.289 GET /api/servicios/pagos 200
08:37:58.601 POST /api/servicios/pagos/reintento 200
08:37:59.809 GET /api/servicios/pagos cancelada por el cliente
08:38:00.110 GET /api/estados 200
```

Read it from top to bottom, because it tells a story confirming two points from this lesson. The `POST` is the mutation. The subsequent `GET` for details is the invalidation of `["servicio", "pagos"]` performed by `useReintentar` in its `onSuccess`, and it ended up **cancelled**: the server takes a second and a half to answer `pagos` details, and before that the user had already returned to the list, the details page unmounted, and TanStack Query cancelled the request nobody was waiting for: when a query becomes inactive while fetching, its `signal` is aborted, and since `consultaDetalle` passes that `signal` to `fetch`, the request is cut short ([TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). What matters is what did not happen: the notice did not wait for that request. It arrived in the tray before the user navigated away, because `useReintentar` dispatches **first** and awaits invalidations **afterwards**. Had the order been reversed, the notice would have been delayed as long as the slowest refetch. The final `GET /api/estados` is the list, which was requested again upon mounting because invalidation had marked it as stale. And there is only one `GET /api/estados` on opening the page: the production build does not have the additional cycle of `StrictMode`.

## The error you will see

The lesson has two main errors—the missing provider and the React warning that appears when a reducer mutates state—and two supporting compiler errors.

**The main error: a context hook without its provider.** You already saw it in Figure 2, inside a test DOM. In an application it is caused by moving a component outside its provider, or mounting it by itself in a test. The message is the one you wrote in the hook:

```text
useAvisos necesita un <ProveedorAvisos> más arriba en el árbol
```

It reads like this: the component calling `useAvisos` has no `ProveedorAvisos` among its ancestors. The fix is never to remove the check or supply the context with a default value: it is to place the provider where it belongs, above the component. If the error appears in a test, mount with `Proveedores`, which exists for that exact purpose. And if it appears **without** a message, as a screen that displays “0 avisos” and fails to react, suspect a context with a default value masquerading as functional (version A in Figure 2).

**The two supporting errors: mutating state and forgetting an action.** This figure is the notices reducer with two intentional changes: a fourth action, `fijado`, is added to the union without its `case`; and `agregado` calls `push` on the list it received, rather than creating a new one.

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

The first, `TS2339`, states that `push` does not exist on `readonly Aviso[]`. This is the type's `readonly` doing its job: a read-only list lacks mutating methods—no `push`, `splice`, or `sort`. Without that `readonly`, the code would compile and the bug would be worse, arriving without any compiler warning. What happens then is the next error.

**The React error: two notices with the same key.** To see it, one must intentionally bypass `readonly`. In a copy of the checkpoint, the `case "agregado"` in `avisos.ts` was changed to `(estado.avisos as Aviso[]).push(nuevo); return { ...estado, siguienteId: estado.siguienteId + 1 };`. The `as` tells TypeScript “trust me”, and it compiles. With that copy in `npm run dev`, on the `pagos` page, a single click on “Volver a revisar” produced this in the tray:

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div><button type="button">Descartar todos</button></section>
```

And in the browser console, this React error (the message arrives with a `%s` replaced by the console with `1` sent separately; shown already substituted):

```text
Encountered two children with the same key, `1`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

One click, one notice dispatched, and two notices on screen with the same identifier. The cause is the double call from 6.1.3. In `StrictMode`, React calls the reducer **twice with the same state** and keeps one of the two outcomes ([React, `useReducer`](https://react.dev/reference/react/useReducer)). With a pure reducer, this goes unnoticed: both results are identical and one is discarded. With `push`, each call mutated **the same array**, the one residing in state, so the notice was appended twice with the same `id`, because both invocations read the same `siguienteId`. React caught it upon encountering two children with the same `key`. There is further collateral damage that goes unseen: the first `push` landed on `estadoInicialAvisos`, the module-level object serving as the baseline, corrupting it for anyone who reuses it. And in the production build, without `StrictMode`, the duplicate would not appear: the bug would still be there, only without the warning giving it away. Documentation for `useReducer` is unequivocal: state is read-only; do not mutate objects or arrays in state ([React, `useReducer`](https://react.dev/reference/react/useReducer)). The proper array handling is that of the checkpoint: a fresh list with `[nuevo, ...estado.avisos]`. The lesson is twofold: `readonly` catches it before running, and `StrictMode` catches it at runtime if someone bypasses `readonly`.

The second, `TS2322`, is the exhaustiveness check from 6.1.3 fulfilling its promise: the `fijado` type reached `default` and cannot be assigned to `never`. The message names the missing action and the line in the `switch`. The fix is to write its `case`. Notice that the error is not where you added the action, but where you **forgot** to handle it: that is where its value lies.

## What gets done wrong

**Putting everything into context “just in case”.** Every context is a dependency that does not appear in the component's signature. If data is used by two adjacent components, pass it through props. Context earns its keep when props traverse components that do not use the data and `children` cannot remedy it.

**A single context with `{ estado, despachar }` when some components only dispatch.** Every state change re-renders all readers of the context, including those that never display the state. Figure 3 measured it: four renders versus one. Split into two.

**A default value that “works”.** An empty list and a no-op function turn a forgotten provider into a screen that lies without throwing an error. Use `null` and a hook that throws.

**Side effects inside the reducer.** A `fetch`, a `setTimeout`, a `console.log` making decisions, or an external counter outside the function. The reducer is called twice in `StrictMode` and must always yield the same output for the same input. Whatever needs to happen outside React belongs in an event handler or, if synchronizing, in an Effect (Exercise 3 does this).

**Actions phrased as commands.** `{ tipo: "establecer-lista", avisos: [...] }` turns the reducer into a disguised `useState`: logic is once again scattered across whoever dispatches. Actions describe what happened; rules live inside the reducer.

**Mutating state.** If you execute `estado.avisos.push(nuevo)` and return the same `estado`, React compares using `Object.is`, concludes nothing changed, and skips rendering. If you return a new object with the mutated list inside, it renders, but the double call of `StrictMode` inserts the notice twice with the same key, as seen in “The error you will see”. With `readonly` in your types, TypeScript won't let you.

**Rendering the same event in two places.** If the retry error shows up on the page and in the tray, it is announced twice, and one of them vanishes upon navigation. One event, one place.

**Creating the live region along with its content.** An `{avisos.length > 0 && <div role="status">…</div>}` causes the region to appear with the first notice already inside, and that notice might not be announced. The region should always exist; what changes is its content.

**Memoizing context values by reflex.** `useMemo` and `useCallback` carry a cost. Before using them, measure: in `revisor`, separating state and dispatch resolved what needed resolving, and the preferences provider has no renders to save.

## Exercises

### Exercise 1 — Predict the reducer

Without running anything, predict what the first line of Figure 1 prints if you pass seven letters (`"a"` through `"g"`) instead of six, and what happens if you subsequently dispatch `{ tipo: "descartado", id: 1 }`. Does `siguienteId` change? Does the reducer return the exact same object it received? Verify your predictions by modifying the figure and running it.

### Exercise 2 — A new action, guided by the compiler

Add an action to notices that dismisses all notices of a given level: `{ tipo: "nivel-descartado", nivel: NivelAviso }`. Do this in your `avisos.ts` copy from the figures. **First**, add only the union member and run `tsc`: predict which line it will point to. Then write the `case` and verify, using a variation of Figure 1, that with three success notices and two error notices, dismissing the `error` level leaves three.

### Exercise 3 — Notices that dismiss themselves

Make every **success** notice dismiss itself after five seconds; error notices remain until the user dismisses them. **Before writing**, decide where the timer belongs: in the reducer, in `useReintentar`, or in the tray? Note in your logbook why. The solution must not silence the linter, and the timer must be cleaned up if the user dismisses the notice ahead of time.

### Exercise 4 — One more column in the table

Without looking at 6.3.1, where would you place each of these new pieces of data, and why: (a) dark mode for the screen; (b) which service currently holds keyboard focus in the list; (c) the name of the signed-in user, used in the header and the creation form; (d) the preferences from 6.2.7, if they were required to survive a page reload; (e) the number of notices still in the tray, to display in the tab title.

## Solutions

### Solution 1

With seven letters, five notices remain, 7 through 3: `[7:g, 6:f, 5:e, 4:d, 3:c] siguienteId=8`. The two oldest fall off due to the cap. If you then dismiss identifier 1, the reducer finds nothing to remove and the list remains unchanged, with `siguienteId` at 8: dismissing never increments the counter. Does it return the same object? **No**: `{ ...estado, avisos: estado.avisos.filter(…) }` always creates a new object and a new list, even if they share identical contents. This is correct (the reducer did not mutate anything), but it means React will re-render the tray even if nothing visible changed, because `Object.is` compares references, not contents. If a benchmark ever showed that this mattered, the remedy would be to return `estado` as is when the `id` is not found. Currently, no measurement justifies this. To check, compare with `===` in the figure: `console.log(reducirAvisos(conSiete, { tipo: "descartado", id: 1 }) === conSiete)` prints `false`.

### Solution 2

When adding only the union member, `tsc` highlights the line `const sinAtender: never = accion;` with a `TS2322` mentioning the new type, just like Figure 4. The missing `case`:

```ts
// avisos.ts con la acción nueva (fragmento)
    case "nivel-descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.nivel !== accion.nivel) };
```

Within that `case`, TypeScript already narrows `accion` to the variant with `nivel`, so `accion.nivel` compiles without any `as`. Verification: with three `agregado` of level `exito` and two of level `error`, the state holds five notices; after `{ tipo: "nivel-descartado", nivel: "error" }`, the three success notices remain, with IDs intact and `siguienteId` at 6. Notice the name: `nivel-descartado` describes what the user did, not “filter the list”.

### Solution 3

The timer does **not** belong in the reducer: a `setTimeout` is a side effect, and reducers must remain pure (6.1.3). Nor does it belong in `useReintentar`, because the timer must live as long as the notice lives, and the notice lives in the tray, not on the page that produced it. It belongs in the tray, and constitutes a legitimate Effect in the sense of Lesson 3: it **synchronizes** each visible notice with a timer, which is an external system outside React. The cleanest design gives each notice its own component, so its Effect starts when mounted and cleans up when unmounted:

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

And in `BandejaAvisos`, the `map` renders `<FilaAviso key={aviso.id} aviso={aviso} />`. Three things worth noting. The dependencies include everything the Effect touches, including `despachar`; `useReducer` documentation clarifies that, since its identity is stable, including it will not cause the Effect to re-run ([React, `useReducer`](https://react.dev/reference/react/useReducer)), so there is no reason to omit it and silence the linter. If the user dismisses the notice before five seconds elapse, the row unmounts, cleanup cancels the timer, and nothing extra is dispatched (and even if it were, `descartado` on an ID that no longer exists breaks nothing, as seen in Solution 1). And under `StrictMode`, the timer is created, cancelled, and recreated on mount: Lesson 0's free confirmation that cleanup works. This snippet was checked with the course linter on a tray copy and yielded zero warnings.

An accessibility warning: an automatically disappearing notice constitutes a time limit under WCAG guidelines, which categorize any process occurring without user initiation after a fixed duration as such ([W3C, «Understanding SC 2.2.1: Timing Adjustable»](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)). Here it is acceptable because the outcome is also visible in the list, which is why only success notices dismiss themselves. If a notice were the only way to become aware of an event, five seconds is insufficient for many users: do not do it, or allow users to turn it off.

### Solution 4

(a) **Dark mode**: context, just like preferences, and for the same reason: toggled by a control and read by components everywhere; it is the first example React documentation provides for context. (b) **Keyboard focus**: in no state of your own; focus is managed by the browser, and keeping it in React creates two sources of truth. If a component needs to shift focus, use an element `ref`, not state. (c) **Signed-in user**: context, which is the second example in documentation; but the data itself comes from the server, so the proper tool is a TanStack Query query (already accessible from any component via `useQuery`), and a custom context might not even be necessary. (d) **Preferences persisting across reloads**: context remains the communication channel, but the value must be persisted outside tab memory: in browser storage if specific to the machine, or on the server if following the user across devices. Reading and writing that storage is synchronizing with something external, which the provider would handle. (e) **Notices in the tray, in the tab title**: **not state**. It is computed from `avisos.length`, which is already in context (first question of 6.3.2), and writing it to `document.title` is the job of `useTituloDocumento`, the Effect from Lesson 3. If instead you wanted to distinguish “unread” notices from “already seen” ones, the data model does not allow it yet: `Aviso` has no field for that, and one would have to be added (with its action in the reducer), that is, new state.

## How I know I got it

- [ ] `npm ci`, `npm run lint`, and `npm run build` finish cleanly inside `~/curso-react/revisor/`, and `npm run build` outputs `dist/assets/index-BYYbMpFE.js` if your code matches the checkpoint.
- [ ] `grep -rn "eslint-disable" src/` finds nothing.
- [ ] Figure 1 prints `seis agregados: [6:f, 5:e, 4:d, 3:c, 2:b] siguienteId=7` and concludes with the three lines verifying that the reducer did not mutate what it received.
- [ ] In a copy using `push` under `npm run dev`, clicking “Volver a revisar” leaves two identical notices and the `Encountered two children with the same key` error in the console, and you can explain why `StrictMode` causes this.
- [ ] You can trigger both errors from Figure 4 in a reducer copy and explain each: `TS2339` for mutating a `readonly` list and `TS2322` for an unhandled action reaching `default`.
- [ ] Figure 3 shows the button rendered 4 times with one context and 1 time with two, and you can explain why the tray renders 4 times in both cases.
- [ ] Figure 2 shows “0 avisos” without errors in version A and the hook's message in version B, and you can state why B is preferable.
- [ ] With the practice server and `npm run preview` running, page `/` displays in the header the checkboxes “Mostrar duración” (checked) and “Vista compacta”, and below an empty tray with `role="status"`.
- [ ] At `/servicios/pagos`, “Volver a revisar” places `pagos se volvió a revisar: disponible` in the tray, and the notice remains there after returning to the list via “Volver al reporte”.
- [ ] Unchecking “Mostrar duración” strips milliseconds from available rows without changes to `ListaEstados`, `ContenidoReporte`, or `PaginaReporte`.
- [ ] You can recite the table in 6.3.1 from memory, with one reason per row, and state what would have to happen for notes to move to a context.
- [ ] You recorded in your [logbook](bitacora.md) where each piece of state in your `revisor` lives and why you chose that location for the timer in Exercise 3.

## Summary

Answer without looking at the lesson:

1. Why is a reducer called that, and what does it have to do with `Array.prototype.reduce`?
2. What does an action describe? Why `agregado` and not `recortar-a-cinco`?
3. What does the `default` with `never` do in the reducer, and when does it help you?
4. Why does the reducer store `siguienteId` in state rather than using an external counter outside the function?
5. What two things should you try before reaching for context? Why does neither work for `revisor` preferences?
6. Why do notices use two contexts while preferences use only one?
7. What happens when a component reads a context without a provider, with a `null` default value versus without one? Why does the hook throw an error?
8. Why does the tray's `role="status"` exist even when there are no notices?
9. Why do notes remain in the layout rather than moving to a context? What would have to happen to change that?

## Further reading

- [React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer): actions describing what the user did, pure reducers, origin of the name, and comparison with `useState`. Consulted on October 21, 2026.
- [React, `useReducer`](https://react.dev/reference/react/useReducer): signature, double invocation in `StrictMode`, read-only state, `Object.is` comparison, and stable identity of `dispatch`. Consulted on October 21, 2026.
- [React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context): the two alternatives before context, warnings against overuse, and standard use cases (theme, current account, routing, managing state). Consulted on October 21, 2026.
- [React, `createContext`](https://react.dev/reference/react/createContext): default value as fallback of last resort, `<Context>` as provider starting in React 19, and keeping contexts in dedicated files. Consulted on October 21, 2026.
- [React, `useContext`](https://react.dev/reference/react/useContext): nearest upward provider, re-rendering consumers compared via `Object.is`, optimizing with `useMemo`, and the forgotten `value` case. Consulted on October 21, 2026.
- [React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context): two contexts (state and dispatch), custom hooks, and the combined provider component. Consulted on October 21, 2026.
- [React, «React v19»](https://react.dev/blog/2024/12/05/react-19): `<Context>` as provider and plan to deprecate `<Context.Provider>`. Consulted on October 21, 2026.
- [React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components): lifting state to common ancestor and single source of truth. Consulted on October 21, 2026.
- [React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure): principles of state design, including avoiding redundant state that can be computed. Consulted on October 21, 2026.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext): parent route state shared with children and recommended custom hook with TypeScript. Consulted on October 21, 2026.
- [TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations): `onSuccess`, `onError`, and difference between `useMutation` callbacks and `mutate` callbacks when component unmounts. Consulted on October 21, 2026.
- [TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): aborting `signal` when a query becomes inactive during fetch. Consulted on October 21, 2026.
- [TypeScript, «Narrowing»](https://www.typescriptlang.org/docs/handbook/2/narrowing.html): `never` type and exhaustiveness checking in a `switch`. Consulted on October 21, 2026.
- [MDN, `status` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) and [«ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions): advisory live region, implicit `aria-live="polite"` and `aria-atomic="true"`; what `aria-atomic` does, and why the region must exist before dynamic updates occur. Consulted on October 21, 2026.
- [W3C, «Understanding SC 2.2.1: Timing Adjustable»](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html): what qualifies as a time limit and when adjustment must be provided. Consulted on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| reducer | pure function that receives current state and an action, returning the next state |
| action | object describing what happened (`{ tipo: "descartado", id: 3 }`); the reducer determines the consequence |
| dispatch (*despachar*) | function returned by `useReducer` to deliver an action; holds stable identity across renders |
| exhaustiveness checking (*comprobación exhaustiva*) | `default` assigning action to `never`, prompting TypeScript if an action is left unhandled |
| context | React channel delivering a value to any descendant component without prop drilling |
| provider | component supplying a value in a context for its entire subtree: `<Contexto value={…}>` |
| default value | value received by context consumers when no provider exists above; in this course, `null` |
| consumer | component reading a context; re-renders whenever its provider's `value` changes |
| live region | portion of the page whose dynamic updates are announced by screen readers; `role="status"` is polite, non-interrupting |
| single source of truth | each piece of state lives in a single place, and other components read it from there |

---

**Next:** [Lesson 7 — Forms, actions, and accessibility](07-formularios-accesibilidad.md)
