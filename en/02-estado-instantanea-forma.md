# Lesson 2 — State: snapshot, immutability, and shape

*It is 6:05 PM and the night shift starts at 6:30 PM. Before leaving, you want to leave your teammate a note in the `revisor`: “pagos: provider says it will be back at 20:00, do not escalate”. You select `pagos`, type the note, save it… and the row does not change. You mentally retrace what you did: the code adds the note to the notes object and saves it back into state. The note is right there, in memory; the console confirms it. But the screen has no clue. Ten seconds later the next poll arrives, the panel re-renders, and suddenly the “con nota” badge appears, as if someone had placed it out of step. And upon selecting `reportes`, the text box still says “pagos: provider says it will be back…”. If your teammate saves without reading, the note for `pagos` ends up pasted onto `reportes`. Twenty-five minutes left. Both bugs stem from the same mistake: thinking of React state as a variable that changes. It is not: it is a snapshot that gets replaced, and React stores it in a precise spot in the tree. This lesson explains that phrase and turns it into code.*

**Time:** 2 × 45 min (the natural break is between sections 2.3 and 2.4)

**What you build:** the “Solo fallas” (“Failures only”) filter, selecting a service along with its details, and one note per service, with a draft that does not drag over from one service to another

**What you learn:** state is a snapshot per render; the updater form `establecerN((n) => n + 1)`; copying instead of mutating; the five rules of state shape (among them: one `tipo` instead of three flags, storing the identifier and not the object, and not storing what can be computed); lifting state up; `key` to reset it

**Where you are coming from.** From [Lesson 1](01-componentes-puros-composicion.md). Your `revisor` is already split into pure pieces: `Tarjeta` receives a title and its `children`; `ResumenFallas` renders “4 servicios revisados · 2 servicios con falla” with pure functions from `resumen.ts`; `ContenidoReporte` decides what to render based on the loading state; `ListaEstados` iterates over statuses with `key={estado.nombre}`; and `FilaEstado` renders a row. `Panel` only composes. The only thing that changes over time is what `useReporte` brings, the hook from Lesson 0 that polls `GET /api/estados` every ten seconds. Until today, the person looking at the panel cannot do anything with it other than clicking “Actualizar”. Today the panel begins to remember what that person does.

**What this lesson does not do.** It does not fetch new data from the API: a service's details are assembled from what already arrived in the report, and asking the API for the details of a single service is the topic of [Lesson 3](03-effects-sincronizar.md), with its race conditions. Notes live in memory: if you reload the page, they are lost, and that is fine for now. The filter and selection do not travel in the page URL either; sharing a filter by copying the link belongs to [Lesson 5](05-rutas-url-como-estado.md). There is no context or reducer, which belong to [Lesson 6](06-reducer-contexto.md), nor forms with `action`, which belong to [Lesson 7](07-formularios-accesibilidad.md). And there is no new Effect: the entire lesson is solved with `useState`, computations during rendering, and a `key`.

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions from this lesson's `package.json` (React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 for `tsc`, ESLint 10.13.0, and `eslint-plugin-react-hooks` 7.1.1). Since the course assumes Linux Mint, this checkpoint was reinstalled from scratch inside a `node:24.22.0-bookworm` container and produced the same filename in `dist/` seen here, `index-7jh0TEYR.js`; it was not run on a real Linux Mint, but nothing shown depends on the operating system, except the `fsevents` warning that follows. On macOS, `npm ci` also prints an `install-scripts` warning: it refers to `fsevents`, an optional package that only installs on macOS and does not appear on your Mint; there is no need to approve it. The figures are run in `~/curso-react/figuras/`, the same folder as previous lessons; its `package.json` does not change. They are compiled with `tsc` and executed with `node` over a test DOM (jsdom), as in Lesson 0. What is seen “in the browser” was measured with headless Chrome (`--headless`), driven by a script that clicks buttons and reads the page through the Chrome DevTools Protocol: it is a real browser executing the JavaScript in `dist/`, not a simulation. The script sits next to the figures in `medir.mjs`, and its first comment explains how to run it. It needs Google Chrome or Chromium, which Linux Mint does not install by default; if you do not have it, it is not required to follow the lesson: perform the same steps manually in your browser and you should see the same thing. The outputs of each measurement and of each triggered error, with the exact changes made in each copy, are in [`programas/02-estado-instantanea-forma/ejercicios/`](../programas/02-estado-instantanea-forma/ejercicios). Long paths printed by ESLint and `tsc` are shown relative to `~/curso-react`, and in one ESLint output the spaces used by the formatter to align the rule column were trimmed. The errors in “The error you will see” were triggered in a copy of the checkpoint, never in the original, which afterward passed `npm ci`, `npm run lint`, and `npm run build` once again. The programs are in [`programas/02-estado-instantanea-forma/`](../programas/02-estado-instantanea-forma): `revisor/` is the checkpoint and the figures sit right next to it.

## By the end you will be able to

- Predict the value a component displays after calling a `establecer…` function multiple times in the same click, and verify your prediction with a figure.
- Write an update using the updater form when the next state depends on the previous one, and explain when it yields a different result from passing the value directly.
- Update an object in state by creating a copy, and demonstrate with a figure that mutating it and passing it back does not re-render anything.
- Review a component's state against the five shape rules and point out an example of each in the `revisor` (one example can serve for two).
- Decide which component owns each piece of state, lift it to the common ancestor, and pass down the value and the function that changes it.
- Use a `key` so a component starts from scratch when the entity it represents changes, and reproduce the bug that appears if it is missing.

## The why before the how

Open the `revisor` from Lesson 1 and ask it for three things an operator would ask for on day one.

**“Show me only what is failing.”** With four services you do not need it, but a company's real `revisor` monitors dozens. A “Solo fallas” (“Failures only”) checkbox has to remember whether it is checked, and two different pieces need to know: the checkbox itself, to render as checked, and the list, to decide which rows to render.

**“I want to see a service in detail.”** The user selects `pagos` and a box appears with its status. Ten seconds later the next poll arrives and `pagos` has recovered: the box must say “Disponible” (“Available”), not what it said ten seconds ago. That depends on **what** you store when someone makes a selection: the entire service or only its name.

**“Let me jot something down.”** One note per service, which survives switching to another service and coming back, and marks the row so the next shift sees it. And while you are typing, a draft that does not leak into another service's note.

All three ask for the same thing: for the panel to **remember** something between one render and the next. In React, that remembered thing is called **state**, and the tool is `useState`, which you already used in Lesson 0 inside `useReporte`. Lesson 9 of TypeScript taught you how to write it; this lesson teaches you how to **think** about it, because almost all mistakes with state come from thinking of it as a variable. A variable is modified, and the change is visible on the very next line. State is not: each render receives a fixed snapshot, and requesting a change does not touch that snapshot, but rather asks React to take another one ([React, “State as a Snapshot”](https://react.dev/learn/state-as-a-snapshot)). Thinking of state as a variable explains both bugs in the scene, though each from a different angle: the note that does not appear comes from the snapshot (you gave React the same snapshot, retouched, and React saw nothing new), and the draft that drags over comes from where React stores state (it preserved the editor's state because, to React, the exact same editor was still sitting in that position).

There are three new concepts. The first is **state as a snapshot**, with the updater form (2.1). The second is **state that is copied and has a shape**: copying instead of mutating (2.2) and the five rules for the shape of state (2.3). The third is **who owns the state and when it resets**: lifting state up to the component that shares it (2.4) and `key` to reset it (2.5). Section 2.6 adds no concept: it is the complete walkthrough, where the three are seen together. This is what the result looks like, measured with headless Chrome on the checkpoint, selecting `pagos`, saving a note, and switching services (these are steps 3 to 6 of the walkthrough in 2.6):

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

By the end of the lesson you will know where each line comes from, and why the last one says what it says.

## The concepts

### 2.1 State is a snapshot

#### 2.1.1 What happens when you call `establecer…`

When you write `const [revisiones, establecerRevisiones] = useState(0)`, React gives you two things: the value it has stored **for this render** and a function to request another. The key lies in the word “request”. React's documentation puts it like this: state behaves like a snapshot; changing it does not change the variable you already have, but instead triggers a new render ([React, “State as a Snapshot”](https://react.dev/learn/state-as-a-snapshot)). And in the reference for `useState`, in plain terms: the `set` function only updates the state variable **for the next render** ([React, `useState`](https://react.dev/reference/react/useState)).

The first figure puts this to the test with the simplest thing there is: a button that, in a single click, calls the function that increments a review three times. There are two versions. The first passes the value to React, `revisiones + 1`; the second passes a function, `(actual) => actual + 1`. Both print, inside the click handler, what `revisiones` holds, and the figure reads what the button displays when finished.

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

Before reading the explanation, look at the two lines that say “dentro del clic”: in both versions, `revisiones` is `0`, even though `establecerRevisiones` was already called three times. That is the snapshot. The click handler is a function that was created during the render in which `revisiones` was `0`, and to that function `revisiones` is `0` forever, like a constant. React does not overwrite your variables; what it does is call your component again, and in that new call `useState` returns the new value. The documentation sums it up in a rule: **a state variable's value never changes within a render**, even if the handler's code is asynchronous ([React, “State as a Snapshot”](https://react.dev/learn/state-as-a-snapshot)).

With that, the first version explains itself. All three calls say the same thing: “in the next render, `revisiones` is `0 + 1`”. Three times `1` is `1`. The button says `1`, not `3`. It is exactly the example React's documentation uses with its “+3” button ([React, “State as a Snapshot”](https://react.dev/learn/state-as-a-snapshot)).

#### 2.1.2 The update queue and the updater function

Why was the button not rendered three times, once per call? Because React **waits until all code in the event handler has run** before processing the state updates. This is called **batching**, and it is what prevents unnecessary renders and half-updated screens ([React, “Queueing a Series of State Updates”](https://react.dev/learn/queueing-a-series-of-state-updates)). While the handler runs, each call to `establecer…` queues up. When it finishes, React iterates through the queue in order to compute the value for the next render.

That is where the second version comes in. If instead of a value you pass it a **function**, React does not execute it on the spot: it places it in the queue, and when processing it, passes the result of the previous one. The documentation calls this an **updater function** ([React, “Queueing a Series of State Updates”](https://react.dev/learn/queueing-a-series-of-state-updates)). The first receives `0` and returns `1`; the second receives `1` and returns `2`; the third receives `2` and returns `3`. The button says `3`. Notice that, even so, the line “dentro del clic” still says `0`: the updater form does not change the snapshot, it changes **how the next one is computed**.

Three details to take with you:

- **The parameter name.** The documentation suggests naming it with the initials of the state variable (`n => n + 1`) or, if you prefer something longer, repeating the full name or prefixing it with `prev` ([React, “Queueing a Series of State Updates”](https://react.dev/learn/queueing-a-series-of-state-updates)). This course uses a name in Spanish that conveys what it is: `actual`, `actuales`. It is an intentional choice, designed so that it reads the same as the rest of the code.
- **It must be pure.** The updater function runs during rendering, so it should only compute and return: no fetching data, no printing, and no calling another `establecer…` function. In `StrictMode`, and only during development, React calls it **twice** and keeps one of the results (in the production build it calls it once), precisely to expose impure ones ([React, `useState`](https://react.dev/reference/react/useState)). It is the same free check from Lesson 0, applied to state.
- **If you need the new value right away, compute it yourself.** If after `establecerRevisiones(revisiones + 1)` you want to use the new value in the same handler, store it in a constant first: `const siguiente = revisiones + 1`. Reading `revisiones` will give you the old snapshot; the reference for `useState` features this as the first case in its common pitfalls section ([React, `useState`](https://react.dev/reference/react/useState)).

#### 2.1.3 In the `revisor`: `establecerNotas((actuales) => …)`

In the checkpoint, the updater form appears once, in `Panel`, when saving a note:

```tsx
// revisor/src/reporte/Panel.tsx (fragment)
  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }
```

Be honest about what this proves: in today's panel, `establecerNotas(conNota(notas, nombre, texto))` would yield the same result, because `guardarNota` is called only once per click. Why the updater form, then? Because **the next state depends on the previous one**: a new note is added to the existing ones. With the updater form, the computation is performed using the latest item in the queue, not the snapshot the handler held when it was created. The day someone adds a button that saves two notes in the same click, or when a note arrives from a function created in an earlier render, this code remains correct without anyone having to rethink it. React's documentation does not mandate the updater form in every case; the course's guideline is simpler to remember: **if the new value is computed from the old one, pass React a function**. If the new value does not depend on the old one, like `establecerSoloFallas(true)` or `establecerSeleccionado("pagos")`, pass the value directly.

### 2.2 Copying instead of mutating

#### 2.2.1 React compares the snapshot, not its contents

How does React know that state changed? It does not traverse your object property by property: it compares the new value with the current one using `Object.is`, and if they are **the same**, it skips rendering that component and its children ([React, `useState`](https://react.dev/reference/react/useState)). For numbers and strings, “the same” means what you expect. For objects and arrays it means something else: `Object.is` says two objects are the same only if they are **the exact same reference in memory**, not if they have the same fields ([MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)). Two objects with identical contents are distinct; an object whose field you modified is still the same object.

The second figure reproduces the first bug from the opening scene. A notepad stores an object in state and has two buttons. “mutar” adds the note to the existing object and passes it back. “copiar” creates a new object with everything from before plus the note. A React `<Profiler>` counts how many times a render was completed; it is the way to count without introducing a side effect inside the component (Lesson 9 returns to the Profiler).

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

After clicking “mutar”, the render counter remains at `1` and the screen still displays `0`. The object did change: it has the note for `pagos`. But what you passed to React is **the exact same object** it already had; `Object.is` reported “equal” and React did nothing. The documentation explains this with the example of a pointer tracking the mouse: without the state-setting function, React has no idea that the object changed and does not respond ([React, “Updating Objects in State”](https://react.dev/learn/updating-objects-in-state)); and the `useState` reference includes it under the issue “I’ve updated the state, but the screen doesn’t update” ([React, `useState`](https://react.dev/reference/react/useState)).

Now look at the last line: after clicking “copiar”, there is a new render and the screen displays `1`. Notice that the new object contains the note for `pagos` through two paths: the previous mutation, which remained hidden inside the old object and was copied with `...notas`, and the copy itself. The screen displayed the mutation **when something else triggered a render**. That is precisely what you saw in the scene with the ten-second poll: the “con nota” badge appeared out of step, when the next report forced a render and brought the hidden mutation to light. A mutation is not always lost; sometimes it shows up late, and that is worse, because it seems to work.

#### 2.2.2 Copying: the spread syntax

The documentation's rule is straightforward: **treat any object you put into state as read-only**; instead of mutating it, replace it with a new one ([React, “Updating Objects in State”](https://react.dev/learn/updating-objects-in-state)). JavaScript's tool for this is the **spread syntax** (`...`): in an object literal, `{ ...notas, pagos: "texto" }` copies the own enumerable properties of `notas` (for an object like this, all of them) into a new object and then writes `pagos`; if `pagos` already existed, it retains the latest value ([MDN, “Spread syntax”](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)).

A warning that matters as soon as your state grows: spread is **shallow**. It copies one level; if a property is itself an object, the copy points to the same inner object, and mutating it would once again be a mutation. React's documentation points this out and shows how to copy level by level ([React, “Updating Objects in State”](https://react.dev/learn/updating-objects-in-state)). This is one of the reasons for the fifth shape rule (2.3): flat state is copied in a single step.

In the `revisor`, copying lives in a pure function, outside of components, in its own file:

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

Read it line by line:

- **`Notas` is `Readonly<Record<string, string>>`.** A record whose keys are service names and whose values are the note text, marked as read-only. `Record<K, T>` constructs an object type with keys `K` and values `T`, and `Readonly<T>` makes its properties non-reassignable ([TypeScript, “Utility Types”](https://www.typescriptlang.org/docs/handbook/utility-types.html)). It is a type check, not a runtime defense: the object is not frozen, but `tsc` rejects any assignment. In “The error you will see” you will see it stop the scene's mutation before it ever reaches the browser.
- **`texto.trim()`.** A note made entirely of whitespace is not a note. It is sanitized once, right here, and nobody else has to remember to do it.
- **If the text is empty, the note is removed.** `Object.entries` turns the object into an array of `[key, value]` pairs, `filter` excludes the one for the service, and `Object.fromEntries` reconstructs an object with the remaining ones. All three functions create new objects; none of them touch `notas`. Thus, “clearing the text and saving” removes the “con nota” badge from the row, which is what a person would expect.
- **If there is text, it is copied and written.** `{ ...notas, [nombre]: limpio }` is the spread shown above, with a computed key in square brackets.

Why a separate function rather than three lines inside `Panel`? For the same reason as `contarFallas` in Lesson 1: a pure function—same inputs, same output, touching nothing outside—stands on its own, can be tested without React (you will see this with `resumen.ts` in Lesson 8), and can be called from an updater function without fear of `StrictMode` calling it twice.

#### 2.2.3 Why so much ceremony

It might seem that copying is more expensive and verbose than mutating. React's documentation gives five reasons to do it anyway ([React, “Updating Objects in State”](https://react.dev/learn/updating-objects-in-state)), and three are evident today in the `revisor`:

1. **Debugging.** If you log state with `console.log` and never mutate it, past logs still reflect what they held at that moment; with mutations, a log from five seconds ago shows the value from right now.
2. **Optimizing.** If the previous object is the exact same reference as the new one, nothing inside could have changed. That one-step comparison is what React performs with `Object.is`, and what memoization will rely on when Lesson 9 measures it.
3. **New React features assume it.** The documentation states that the features React is building depend on state being treated as a snapshot. In this course you will notice this with `useOptimistic` in Lesson 7.

If one day your state becomes so deeply nested that copying by hand turns unreadable, the documentation mentions Immer, a library that lets you write with mutation syntax and produces copies for you ([React, “Updating Objects in State”](https://react.dev/learn/updating-objects-in-state)). This course does not use it: the `revisor`'s state is flat on purpose, and the next section explains why.

### 2.3 The shape of state: five rules

#### 2.3.1 The five rules, and what each one avoids

Knowing how to change state is not enough; **what** you store also matters. React's documentation proposes five principles for structuring state ([React, “Choosing the State Structure”](https://react.dev/learn/choosing-the-state-structure)). They are presented alongside the `revisor`, because each has an example in the checkpoint:

1. **Group related state.** If you always update two variables together, merge them into one. In the `revisor`: the result of a load is a single `Carga` value, not a “report” on one side and an “error detail” on the other that always change together. `Carga` exemplifies rules 1 and 2 at the same time: it groups the report and the error detail (rule 1) and, as a union, prevents them from contradicting each other (rule 2).
2. **Avoid contradictions in state.** If several pieces of state can “disagree”, you leave room for bugs. The documentation's example features two flags, `isSending` and `isSent`, which should never both be true at once and are replaced by a single `status` with three values. In the `revisor`, it is `Carga` since Lesson 0: a `tipo` that is `"cargando"`, `"listo"`, or `"error"`. With three flags `cargando`, `listo`, and `conError`, there would be eight combinations and only three would make sense; with a discriminated union, the five impossible states cannot even be written. The documentation frames this as a goal: never have a state in memory that does not correspond to any valid screen ([React, “Reacting to Input with State”](https://react.dev/learn/reacting-to-input-with-state)).
3. **Avoid redundant state.** If something can be computed during rendering from existing props or state, do not put it in state. In the `revisor`: the filtered list, the selected service, the number of failures, and whether a row has a note. None of them are state; all four are computed.
4. **Avoid duplication in state.** If the same data lives in two places, keeping them in sync becomes your problem. In the `revisor`: we store the **name** of the selected service, not the service itself.
5. **Avoid deeply nested state.** Hierarchical state is painful to copy. In the `revisor`: notes are a flat record keyed by name, `{ pagos: "…", reportes: "…" }`, separate from the report's statuses; they are not tucked inside each service.

Rules 3 and 4 prevent the most bugs, and both have their own proof.

#### 2.3.2 Storing the identifier, not the object

When the user selects `pagos`, the temptation is to store the selected object: `{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }`. You already have it in hand, and to render the details it is exactly what you need. The problem is that this object **is already stored** somewhere else: inside the report. The documentation puts it like this: the content of the selected item is the same object as one in the list, so its information is duplicated in two places ([React, “Choosing the State Structure”](https://react.dev/learn/choosing-the-state-structure)). As long as nothing changes, you will not notice. In the `revisor`, something changes every ten seconds.

The fourth figure places both strategies side by side. A screen receives the list of statuses; one component stores the selected object, while another stores only the name and searches for the object during rendering. Then a new report arrives in which `pagos` has recovered:

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

The list says that `pagos` is available, and the component that stored the object still says it is in failure: it holds a snapshot from one poll ago, and nothing will update it, because state is only initialized on the first render. The one that stored the name tells the truth without doing anything special: on every render it searches for `pagos` in the list that just arrived. Imagine the operator in the opening scene reading “En falla” in the details box and “disponible” in the adjacent row, with the shift about to begin.

That is why, in the checkpoint, `seleccionado` is `string | null`—the name, or nothing—and the selected service is looked up during rendering, in `ContenidoReporte`:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx (fragment)
      const { estados } = carga.reporte;
      const visibles = filtrarEstados(estados, soloFallas);
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

`elegido` is not state: it is a constant that lives for the duration of the render. The documentation proposes exactly this with its `selectedId`: store only the identifier, which is essential, and compute the rest during rendering ([React, “Choosing the State Structure”](https://react.dev/learn/choosing-the-state-structure)). And it brings a bonus: if the service disappears from the report, `find` returns `undefined` and the details simply do not render; there is no need to “clean up” the selection with any code ([React, “You Might Not Need an Effect”](https://react.dev/learn/you-might-not-need-an-effect)). It is safe to look up by name as long as the API keeps its rule that no two services share the same name—the same rule that `key={estado.nombre}` from Lesson 1 relies on; if the API ever broke it, `find` would return the first match and React would warn in the console about duplicate keys.

#### 2.3.3 Do not store what can be computed

The third rule has a version that the documentation repeats across two pages: **when something can be calculated from existing props or state, don’t put it into state; compute it during rendering instead** ([React, “You Might Not Need an Effect”](https://react.dev/learn/you-might-not-need-an-effect)). In the checkpoint there are four such calculations, and none require state:

- **The filtered list.** `filtrarEstados(estados, soloFallas)` is a new pure function in `resumen.ts`. If the checkbox is checked, it keeps only failures; otherwise, it returns the same list without copying it.

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

- **The selected service**, which you just saw.
- **The summary.** `ResumenFallas` receives the **full** list, not the filtered one, on purpose: “4 servicios revisados · 2 servicios con falla” describes what the poll reviewed, not what you left visible. The Chrome measurement confirms it: with the checkbox checked, the summary still says 4 and 2.
- **Whether a row has a note.** `ListaEstados` passes each row `tieneNota={notas[estado.nombre] !== undefined}`. There is no separate list of “services with notes” that has to be kept up to date.

And what if computing were expensive? Filtering four, or four hundred, items on each render is not. The course's criterion is that of its README: measure first and optimize later, and Lesson 9 brings the measurement. Storing a computation in state “so as not to repeat it” is not an optimization: it is a duplicate that someone has to keep in sync, and the most common way of synchronizing it—an Effect that recalculates it—is what the linter rejects, as you will see in “The error you will see”.

### 2.4 Lifting state up

#### 2.4.1 Each piece of state has an owner

You already know how to change state and what to store. What remains is deciding **where**. The documentation frames this as a principle: for each unique piece of state, you choose the component that “owns” it, and that is having a **single source of truth**; it does not mean all state lives in a single place, but that each piece has a specific component holding it ([React, “Sharing State Between Components”](https://react.dev/learn/sharing-state-between-components)). When two components need the same data, the owner is their **closest common ancestor**: state is removed from the children, placed in the parent, and passed down through props, along with the functions that change it. The documentation calls this **lifting state up**, and says it is one of the most common things you will do in React ([React, “Sharing State Between Components”](https://react.dev/learn/sharing-state-between-components)).

Apply the question “who needs it?” to the three new states in the `revisor`:

| State | Who reads it | Who changes it | Common ancestor |
|---|---|---|---|
| `soloFallas` | `FiltroFallas` (to render itself) and `ContenidoReporte` (to filter) | `FiltroFallas` | `Panel` |
| `seleccionado` | `FilaEstado` (for `aria-pressed`) and `ContenidoReporte` (for the details) | `FilaEstado` and the “Cerrar detalle” button | `Panel` |
| `notas` | `FilaEstado` (the badge) and `EditorNota` (the saved note) | `EditorNota` | `Panel` |
| `borrador` | only `EditorNota` | only `EditorNota` | `EditorNota` |

The first three move up to `Panel`. The fourth stays down, and understanding why is just as important: the draft is what the user is typing **before** deciding to save it. Nobody else needs it, and if it were lifted to `Panel`, every keystroke would re-render the entire panel instead of just the editor. Lifting state up is not a virtue in itself: state moves up **only as far as it is needed, and not a single level higher**.

Here is `Panel`, which is now the owner:

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

Three `useState` calls, one per piece of state, each with its type: `false` is enough for TypeScript to infer `boolean`; `seleccionado` requires `<string | null>` because it starts as `null` and will later hold a name; `notas` starts as `{}` with type `Notas`. The functions are passed down with the `al` prefix (`alCambiar`, `alSeleccionar`, `alGuardarNota`), which is the course's naming convention for callback props. Notice that two of them are directly React's state setters: `alCambiar={establecerSoloFallas}` and `alSeleccionar={establecerSeleccionado}`. The `set` functions returned by `useState` are stable—the `useState` reference notes they have a stable identity, remaining the same across renders ([React, `useState`](https://react.dev/reference/react/useState))—and their signature matches what the child expects, so there is no need to wrap them.

#### 2.4.2 The checkbox: a controlled component

`FiltroFallas` has no state. It receives a value and a function, and limits itself to rendering and notifying:

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

An `<input>` to which you pass `checked` is a **controlled input**: React determines whether it is checked, not the browser. That is why the documentation requires that, along with `checked`, you provide an `onChange` handler that updates that value synchronously; without it, the input remains read-only and React warns in the console with “You provided a `checked` prop to a form field without an `onChange` handler” ([React, `<input>`](https://react.dev/reference/react-dom/components/input)). For a checkbox you read `evento.target.checked`, not `evento.target.value`, which is another slip that the same page highlights. And the checkbox sits inside its `<label>`: that way, clicking the text “Solo fallas” also toggles it, and a screen reader announces the checkbox with its label. It is native HTML, without ARIA.

The word “controlled” is also used for entire components: the documentation calls a component controlled when its important information is driven by props rather than its own local state, and uncontrolled when it stores it internally ([React, “Sharing State Between Components”](https://react.dev/learn/sharing-state-between-components)). `FiltroFallas` is controlled; `EditorNota`, with its draft, is uncontrolled. Beware of the dual terminology: the `<textarea>` in `EditorNota` is a controlled form field (its value is set by `borrador`), but the component is uncontrolled, because that `borrador` lives inside it and `Panel` cannot touch it. The first term speaks of the field; the second, of the component; the documentation itself clarifies that “controlled” and “uncontrolled” are not strict technical terms. Neither is inherently better: controlled components allow the parent to coordinate; uncontrolled ones are easier to consume. Lesson 7 returns to this distinction with forms.

#### 2.4.3 The row: a button that says whether it is selected

To select a service, each row's name becomes a button:

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
  readonly alSeleccionar: (nombre: string | null) => void;
}) {
  return (
    <li className={estado.tipo}>
      <button
        type="button"
        className="seleccionar"
        aria-pressed={seleccionado}
        onClick={() => alSeleccionar(seleccionado ? null : estado.nombre)}
      >
        {estado.nombre}
      </button>
      : <Descripcion estado={estado} />
      {tieneNota && <span className="marca-nota"> · con nota</span>}
    </li>
  );
}
```

Several decisions packed into few lines:

- **A `<button>`, not a `<span>` with `onClick`.** A native button is reachable with the Tab key, can be triggered with Enter or the Space bar, and a screen reader announces it as a button. With a `<span>` you would have to craft all of that by hand.
- **`aria-pressed`, and a button that really toggles.** Indicates the “pressed” state of a toggle button: with `true` or `false`, the button is announced as something that can be toggled and states whether it currently is ([MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)). That is why the click says `seleccionado ? null : estado.nombre`: according to MDN, a toggle button switches to `true` when pressed once and back to `false` when pressed again, and a screen reader that announces “pressed” invites the person to press it again. If the click always repeated the same name, the button would claim it can be toggled and would not toggle. Measured: pressing `pagos` twice makes the details appear and disappear, and `aria-pressed` goes from `true` to `false` (`node medir.mjs alternar`, output in `ejercicios/medir-alternar.salida.txt`). MDN also advises against changing the button's label when its pressed state changes, and the `revisor` adheres to this: the button says `pagos` whether it is selected or not. The stylesheet uses this exact attribute to thicken the underline, with the selector `.seleccionar[aria-pressed="true"]`: what the eyes see and what the screen reader announces stem from the same data.
- **`className={estado.tipo}`.** The row class, `disponible` or `falla`, matches the type name verbatim, so there is no longer any need for an `if` branching between two almost identical `<li>` elements. The `if` that distinguishes between the two cases moved into `Descripcion`, a small component that only renders the text. It is defined **outside** `FilaEstado`, never inside, following the rule from Lesson 1: a component defined inside another is a new component on every render, and its state would reset unexpectedly ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)).
- **`{tieneNota && …}`.** Here `&&` is safe because `tieneNota` is a boolean; the `0` trap from Lesson 1 appears only when the condition is a number.
- **The row does not know what is selected.** It receives `seleccionado: boolean`, precomputed by the list. The row is pure: same props, same render.

The list performs row-level calculations and stores nothing:

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
  readonly alSeleccionar: (nombre: string | null) => void;
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

Its `alSeleccionar` accepts `string | null`, just like `Panel`'s: `null` means “none selected”. It is sent by the row when the already selected service is pressed again, and also by another piece, the “Cerrar detalle” button.

#### 2.4.4 The distributor

`ContenidoReporte` receives everything and decides what to render. The `"listo"` case now has its own block scope to declare the three computed constants you saw in 2.3:

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

Notice two things. First: the details are looked up in `estados`, the full list, not in `visibles`. This is a deliberate decision, not an oversight, and Exercise 3 asks you to reflect on it. Second: `alCerrar={() => alSeleccionar(null)}` is the only new function created here; “closing” is nothing more than selecting nothing.

### 2.5 `key` to reset state

#### 2.5.1 State lives in a position, not in the component

There remains the second bug from the opening scene: the draft that drags over. To understand it, one needs to know **where** React keeps a component's state. It does not store it “inside” the function or inside the JSX: it associates it with the **position** the component occupies in the render tree. As long as the same component continues to be rendered in that position, React preserves its state; if it is removed, or if another component is rendered in that position, React discards it ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)).

Think of the note editor. You select `pagos`: in the editor's position, an `EditorNota` is rendered with `nombre="pagos"`. You type. You select `reportes`: in **the exact same position**, **the exact same component** is rendered, `EditorNota`, now with `nombre="reportes"`. To React, nothing suggests it is a different editor: a prop changed, as any prop does, and the `borrador` state is preserved. The documentation uses an almost identical scenario: a chat where the text you typed for one person remains there when you select another, and states it plainly: in many apps this is desirable, but not in a chat, because someone might send an already drafted message to the wrong person ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)). In the `revisor`, it is a note meant for `pagos` saved onto `reportes`.

The third figure reproduces this with a minimal editor that stores its draft, rendering it twice: without a `key` and with `key={nombre}`.

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

// react-dom comprueba al cargarse si existe `window.document` y si el documento
// admite el evento `input`, así que se importa después de que exista `window`
// (los import de arriba se cargan antes).
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

Without a `key`, the editor's label updates to “Nota sobre reportes”, but the draft still says “llamar al proveedor”: the prop changed and the state stayed behind. With `key={nombre}`, the draft is empty. (A note regarding the figure: unlike those in Lesson 0, it imports `react-dom/client` **after** creating `window`. Upon loading, react-dom checks whether `window.document` exists and whether the document supports the `input` event, and with that result decides how to detect that someone is typing in a `<textarea>` (this was read in the installed package's code, `react-dom-client.development.js`: the variables `canUseDOM` and `isInputEventSupported`; it is not something React's documentation describes). If it loads before a window exists, that check comes out negative and the typing the figure triggers does not reach `onChange` properly. In a real browser the window always exists first, so in the `revisor` none of this is needed.)

#### 2.5.2 What `key` does

In Lesson 1 you used `key` within a list, so that React could recognize each row between renders. It is the exact same tool: **a `key` tells React to use the `key` itself as part of the position**, instead of relying solely on the order inside the parent ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)). And the documentation underscores it: keys are not just for lists. With `key="pagos"` and then `key="reportes"`, to React they are **two distinct editors**: it unmounts the first along with all its state and mounts a brand new one, which starts from `useState(…)` as if on day one. Keys do not need to be globally unique across the whole app; they only distinguish positions among siblings within the same parent ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)).

The documentation gives this pattern a precise name in “You Might Not Need an Effect”: **resetting all state when a prop changes**. Its example is a profile receiving `key={userId}` so that, when the user changes, half-written comments and any other nested state are reset; and it marks as “avoid” the alternative of resetting state from within an Effect ([React, “You Might Not Need an Effect”](https://react.dev/learn/you-might-not-need-an-effect)). That is the course's second guiding principle surfacing before Lesson 3: what can be resolved through structure is not resolved with an Effect.

In the checkpoint, the `key` is placed on `DetalleSeleccion`, the container for the selected service:

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

`key={estado.nombre}` conveys exactly what it means: an editor for the note on `pagos` and an editor for the note on `reportes` are, conceptually, two distinct editors. This mirrors what the documentation notes about its chat example: a conversation with one person is distinct from a conversation with another, so it makes sense to key it according to who you are talking to ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)). An accessibility detail: the container is an `<aside>` with `aria-label="Detalle de pagos"`, so a screen reader announces it as named complementary content, “Detalle de pagos”. The `aria-label` is not decorative: since the `<aside>` is nested within the `<section>` of `Tarjeta`, without an accessible name it would lose that landmark role and behave as a generic container ([MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside)). And the status description uses a ternary operator over `estado.tipo`, which TypeScript narrows in each branch: in the first it knows `codigoHttp` and `duracionMs` exist; in the second, `detalle`.

#### 2.5.3 The editor: local state with an initial value

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

`borrador` initializes with `notaGuardada`, the note that already existed or `""`. This deserves clarification, because the documentation cautions against something that looks similar: copying props into state. Its example is a message doing `useState(messageColor)`: if the parent later passes a different color, state remains unaware, because **state is only initialized during the first render** ([React, “Choosing the State Structure”](https://react.dev/learn/choosing-the-state-structure)). The same page explains when this does make sense: when you **want** to ignore subsequent changes to the prop, in which case it is best to prefix its name with `initial` or `default` to make that clear.

Here, that is precisely what is desired. While the person is typing, the draft must not change just because a new report arrives; it should only reset when the service itself changes. And that is handled by the `key` in `DetalleSeleccion`: every time the service changes, the editor mounts anew and `useState(notaGuardada)` reads the saved note for **that** service from scratch. That is why, in the Chrome measurement, returning to `pagos` displays “llamar al proveedor”, the saved note, and not the unsaved draft that was abandoned. The pair “initial value + `key`” forms the complete pattern; removing either piece breaks it.

What if you wanted to **preserve** each service's unsaved draft to recover it upon returning? The documentation outlines three approaches: rendering all editors and hiding the inactive ones, storing drafts elsewhere, or lifting state to the parent, which it calls the most common solution ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)). In the `revisor`, “lifting” already exists for what matters: the saved note lives in `Panel`. Unsaved drafts are discarded intentionally.

### 2.6 The complete walkthrough

With state lifted and the `key` in place, the stylesheet is all that remains. These are the rules added to the end of `panel.css`, the course's single stylesheet, which grows lesson by lesson:

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

`.seleccionar` strips the button of its default browser styling, leaving it as bold text underlined to indicate it can be clicked; `font: inherit` ensures it uses the same font family as the rest of the row, since buttons do not inherit it by default. The rest of the file is identical to Lesson 1. The remaining files in the checkpoint—`main.tsx`, `useReporte.ts`, `cargar.ts`, `contrato.ts`, `Tarjeta`, `ResumenFallas`, configuration, and the practice server—do not change in this lesson; `package.json` only bumps its version to `0.2.0`.

Checkpoint verification proceeds as always, from `~/curso-react/revisor/`:

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
dist/assets/index-7jh0TEYR.js   224.30 kB │ gzip: 70.28 kB

✓ built in 189ms
```

The linter produces no output and the build completes with `index-7jh0TEYR.js`, the exact same name produced on macOS and Linux. Because this name is derived from content, if your `revisor` is identical to the checkpoint, you will see the same one. With `npm run servidor` running in one terminal and `npm run dev` (or `npm run preview`) in another, open the page and walk through it. This is what headless Chrome measured against the production build served with `vite preview`, step by step, using `node medir.mjs recorrido`:

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

Each line has its explanation in the lesson. Step 1 shows the buttons with `aria-pressed="false"` (2.4.3). Step 2 shows the filtered list with the summary intact (2.3.3). Step 3 shows the selected button set to `true` and the details looked up by name (2.3.2). Step 4 shows the note copied into state and the “con nota” badge on the row (2.2). Step 5 shows the unsaved draft **not** dragging over to `reportes` (2.5). Step 6 shows the saved note reappearing upon returning to `pagos`, read by the freshly mounted editor (2.5.3). And Step 7 shows “closing” as selecting nothing (2.4.4). Stop everything with Ctrl+C in each terminal.

## The error you will see

This lesson features two errors caught by tools and one that no tool detects.

**The mutation from the scene.** In a copy of the checkpoint, modify `guardarNota` in `Panel.tsx` so that it appends the note directly to the existing object:

```tsx
// guardarNota mutando (fragmento; en una copia, nunca en el punto de control)
  function guardarNota(nombre: string, texto: string): void {
    notas[nombre] = texto;
    establecerNotas(notas);
  }
```

Two separate lines of defense stop it, each in its own way. First, `tsc`:

(The exact changes made in the copy are in `ejercicios/copia-mutando.diff.txt` and the complete outputs in `ejercicios/copia-mutando.lint-tsc.salida.txt`.)

```text
$ npx tsc -b
src/reporte/Panel.tsx(6,10): error TS6133: 'conNota' is declared but its value is never read.
src/reporte/Panel.tsx(23,5): error TS2542: Index signature in type 'Readonly<Record<string, string>>' only permits reading.
```

The second line is what matters: the `Notas` type is `Readonly`, so its index signature “only permits reading”. (The first is a consequence: `conNota` was left unused.) And ESLint, with the `immutability` rule from the React plugin:

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

“Modifying a value returned from 'useState()', which should not be modified directly. Use the setter function to update instead.” The rule ensures props, state, and other values treated by React as immutable are not mutated; its documentation states that a component's props and state are immutable snapshots ([React, “immutability”](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability)). Notice that it stops the mutation even if the type were not `Readonly`: Figure 2 uses a `Record<string, string>` without `Readonly`, and `tsc` compiles it without protest, yet the linter rejects it all the same:

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

That is why the `revisor` employs both: the type alerts you in the editor as you type, and the linter catches the mutation even if someone forgets `Readonly`. The fix is the one from 2.2: `establecerNotas((actuales) => conNota(actuales, nombre, texto))`.

**Storing what can be computed, and syncing it with an Effect.** In another copy, instead of passing `notas[estado.nombre] ?? ""` directly to the editor, `DetalleSeleccion` stores the note in local state and “keeps it in sync” with an Effect:

```tsx
// DetalleSeleccion con estado redundante (fragmento; en una copia)
  const [notaGuardada, establecerNotaGuardada] = useState("");

  useEffect(() => {
    establecerNotaGuardada(notas[estado.nombre] ?? "");
  }, [notas, estado.nombre]);
```

`tsc -b` says nothing: types are valid. The linter does (`ejercicios/copia-efecto.diff.txt` and `ejercicios/copia-efecto.lint-tsc.salida.txt`):

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

This is the `set-state-in-effect` rule, the same one Lesson 0 showed you in `useReporte`. Here it appears for the reason outlined in 2.3.3: `notaGuardada` is a copy of data already present in `notas`, and the Effect exists solely to keep the duplicate aligned with the original. It costs an additional render on every change—first with the stale copy, then with the updated one—and worse, it causes a visible bug. When switching services, `DetalleSeleccion` does not unmount: it remains in the same position and is the same component, so during that render its `notaGuardada` still holds the value from the **previous** service. The editor, which does mount anew due to its `key`, initializes with that stale value and, as explained in 2.5.3, subsequently ignores what arrives later when the Effect adjusts the copy. Built in that copy and measured with headless Chrome (`node medir.mjs efecto`):

```text
a. guardas una nota en pagos, eliges catálogo y regresas: Detalle de pagos · borrador: ""
b. guardas una nota en catálogo y eliges pagos: Detalle de pagos · borrador: "revisar el disco"
   filas: catálogo: disponible (HTTP 200, 42 ms) · con nota | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
```

In step a, `catálogo` had no note, so the editor for `pagos` starts blank: the row says “con nota” yet the user sees no note. In step b, `catálogo` does have one, and the editor for `pagos` starts with **`catálogo`'s note**: this is the scene's bug—a note from one service about to be saved into another—arising from a different cause. The fix is not silencing the rule, but eliminating the state and the Effect: what can be computed, is computed.

**The error nobody sees: removing the `key`.** In a third copy, delete the line `key={estado.nombre}` from `DetalleSeleccion.tsx`:

(Output in `ejercicios/copia-sin-key.lint-tsc.salida.txt`; the change, in `ejercicios/copia-sin-key.diff.txt`.)

```text
$ npx tsc -b; echo "tsc: $?"
tsc: 0
$ npx eslint . --max-warnings 0; echo "lint: $?"
lint: 0
```

Both pass cleanly, yet the panel exhibits the bug from the opening scene: drafts drag over from one service to another. No rule in the course's linter detects that, to you, an editor for `pagos` and an editor for `reportes` are different entities; that is a decision of meaning, not syntax. You only catch it by using the panel, or with a component test that exercises it on your behalf: Lesson 8 teaches how to write them. This echoes the cleanup lesson from Lesson 0: the linter and types are two lines of defense, not the entire fortress.

## What gets done wrong

**Reading state right after setting it.** `establecerX(nuevo); console.log(x)` prints the value from the snapshot of the current render, which is the old one (in an event handler, like these). If you need the new value in the same handler, store it in a constant first.

**Passing the value directly when the next depends on the previous.** `establecerN(n + 1)` works until the day it is called twice within the same click, or from a function created in an earlier render. If the new value is computed from the old, pass a function.

**Mutating and passing back the same object.** React compares using `Object.is`; a retouched object remains the same object, and the screen will not update. Or it updates late, when something else triggers a render, which is worse because it falsely appears to work.

**Copying only the top level of nested state.** Spread syntax is shallow. If your state contains objects inside objects, every level that changes must be copied; better yet, flatten it.

**Using three flags where one `tipo` belongs.** `cargando`, `listo`, and `conError` as separate booleans permit combinations that correspond to no valid screen. A discriminated union makes them impossible to write.

**Storing the selected object.** It is a duplicate of an item in the list that becomes stale with the very next poll. Store the identifier and find the object during rendering.

**Storing what can be computed, and worse, syncing it with an Effect.** A filtered list, a total, or a selected item are not state. Computing them during rendering is simpler, faster, and impossible to desynchronize.

**Lifting state too high.** Lifting a text box draft all the way to the root causes every single keystroke to re-render the entire screen. State lifts to the common ancestor of those who need it, not a level higher.

**Resetting state with an Effect when a prop changes.** An Effect that resets the draft to `""` when `nombre` changes renders first with the old draft and only then with the empty one. A `key` accomplishes it in a single step, and states its intent right in the code.

**Defining a component inside another.** It creates a brand new component on every render: React encounters something new at the same position and discards its state without warning. That is the rule from Lesson 1, and now you understand what is lost when it is broken.

## Exercises

### Exercise 1 — Predict the button

Save a copy of `fig02_01.tsx` as `ejercicio1.tsx` in `~/curso-react/figuras/` and replace, in it, the three calls in `ConValor` with these:

```tsx
// ejercicio 1 (fragmento)
    establecerRevisiones(revisiones + 5);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones(revisiones + 1);
```

Also update the label of the call so the output reflects what was run: `await hacerClic("ejercicio (+5, actualizadora, +1):", ConValor);`.

**Before running it**, write down in your logbook what number the button will display after the click and why, stepping through the update queue line by line. Then compile and run it.

### Exercise 2 — Count notes without new state

Add to the card's title, or directly below the summary, text reading “Notas guardadas: N” displaying the number of services that have a note. The requirement: **you cannot add any `useState`**. Before writing, answer: which shape rule prohibits a `cuantasNotas` state, and what would you have to remember to do in `guardarNota` if you had one?

### Exercise 3 — The detail and the filter

With the panel open, select `catálogo` and then check “Solo fallas”. **Before doing so**, predict: does the detail box for `catálogo` remain visible? Verify it and explain why, pointing out the line in `ContenidoReporte` responsible. Afterward, modify the panel so that the detail disappears when the selected service falls outside the filter, **without adding state and without clearing `seleccionado`**. What happens to the selection if you uncheck the box?

### Exercise 4 — The missing `key`, by hand

In a copy of the checkpoint, remove `key={estado.nombre}` from `DetalleSeleccion.tsx`. Verify that `npm run lint` and `npm run build` remain green. Open the panel, select `pagos`, type a draft **without saving it**, and select `reportes`. Note what you observe. Next, save a note on `pagos`, select `catálogo`, and return to `pagos`: what does the editor display and why? Restore the `key` when finished.

## Solutions

### Solution 1

The button displays `1`. The update queue, in order:

| In the queue | Receives | Result |
|---|---|---|
| “replace with `revisiones + 5`”, with `revisiones` at `0` | — | `5` |
| `(actual) => actual + 1` | `5` | `6` |
| “replace with `revisiones + 1`”, with `revisiones` at `0` | — | `1` |

The last call does not depend on prior updates: it replaces the value with `0 + 1`, because the handler's snapshot still says `0`. This is the resulting output (the file and its output are in `ejercicios/ejercicio1.tsx` and `ejercicios/ejercicio1.salida.txt`):

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

The second half matches the figure, which did not change. React's documentation includes an exercise structured identically, with a replacement following an updater function ([React, “Queueing a Series of State Updates”](https://react.dev/learn/queueing-a-series-of-state-updates)). The takeaway: mixing both approaches on the same state variable in a single handler is legal, but anyone reading it must construct this mental table. If you find yourself having to trace it, stick to a single form.

### Solution 2

The count is computed during rendering, derived from `notas`, in `Panel`:

```tsx
// Panel.tsx (fragmento de la solución)
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <p>Notas guardadas: {Object.keys(notas).length}</p>
```

A `cuantasNotas` state would violate Rule 3, redundant state: it is information derived from `notas`. If you maintained it, `guardarNota` would have to update two states every time, and additionally decide whether to increment by one (a new note), leave it unchanged (updating an existing note), or decrement by one (clearing a note with empty text). By computing it, `conNota` handles all of that, and the count always comes from `notas`, so it cannot fall out of sync with them. Notice also that `&&` is unnecessary: here, a `0` is precisely what you want to render.

### Solution 3

Yes: `catálogo`'s detail box remains visible even though its row is no longer rendered. Headless Chrome measured this on the checkpoint (`node medir.mjs filtro`):

```text
a. eliges catálogo: Detalle de catálogo
b. marcas «Solo fallas»: pagos: falla (HTTP 503) | reportes: falla (tiempo límite agotado) · Detalle de catálogo
c. desmarcas: Detalle de catálogo
```

The responsible line is this one in `ContenidoReporte`:

```tsx
// ContenidoReporte.tsx (fragmento)
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

It looks up the service in `estados`, the complete list, rather than `visibles`. To have the detail hide when filtered out, simply search within the filtered list:

```tsx
// ContenidoReporte.tsx (fragmento de la solución)
      const elegido = visibles.find((estado) => estado.nombre === seleccionado);
```

Upon unchecking the box, `catálogo`'s detail **reappears**, because `seleccionado` continued holding `"catálogo"` the entire time; only the value derived from it changed. This is the benefit from 2.3.2 in another light: because the detail is computed, there is nothing to “clean up”. Which behavior is better? That is a product decision, not a React constraint: the checkpoint keeps the detail visible because the user explicitly selected it, and hiding it during filtering might be jarring. What is indisputable is that neither approach requires new state.

### Solution 4

Lint and build remain green, as shown in “The error you will see”. This is what headless Chrome measured against that copy, built for production (`node medir.mjs sin-key`):

```text
a. escribes en pagos sin guardar y eliges reportes: Detalle de reportes · borrador: "borrador de pagos"
b. guardas una nota en pagos y eliges catálogo: Detalle de catálogo · borrador: "llamar al proveedor"
c. cierras el detalle y eliges reportes: Detalle de reportes · borrador: ""
```

In step a, the title updates to “Detalle de reportes” while the input retains `pagos`'s draft: Figure 3 brought to life inside the `revisor`. Step b is more subtle: with a note saved on `pagos`, moving to `catálogo` causes the editor to **continue showing `pagos`'s note**. `useState(notaGuardada)` only read its initial value the very first time the editor mounted; without a `key`, the editor never unmounts as long as any service remains selected, so `notaGuardada` changes while the draft ignores it. This is precisely the documentation's warning against copying props into state (2.5.3). With `key`, each service mounts its own editor, restoring the “initial value + `key`” pattern. And step c illustrates an exception: if you close the details box and select another service, the editor does mount anew, because closing removed it from the tree entirely, leaving the draft empty. That makes the bug intermittent—the most troublesome kind of bug.

## How I know I got it

- [ ] `npm run lint` completes without printing any issues and `npm run build` concludes with `✓ built`, producing an `index-….js` file in `dist/assets/`.
- [ ] With the practice server and `npm run dev` running, the “Solo fallas” checkbox filters down to only `pagos` and `reportes`, while the summary continues reporting “4 servicios revisados · 2 servicios con falla”.
- [ ] Selecting a service toggles its button to `aria-pressed="true"` (inspect it in DevTools under the Elements tab) and displays its details; “Cerrar detalle” removes it and sets the button back to `false`; pressing the same service again also removes it.
- [ ] A saved note marks the row with “· con nota”, and saving empty text removes the badge.
- [ ] An unsaved draft does not drag over when selecting another service, and upon returning, the saved note appears.
- [ ] You can run all four figures and explain every line of their output without referencing the lesson.
- [ ] In a copy, mutating in `guardarNota` is rejected by both `tsc` (TS2542) and `npm run lint` (`react-hooks/immutability`), and you can articulate why both defenses are necessary.
- [ ] You can point to an example of each of the five shape rules in the `revisor` (one example may cover two).
- [ ] You recorded your prediction for Exercise 1 in your [logbook](bitacora.md) before running it, and noted whether your prediction was correct.

## Summary

Answer without looking at the lesson:

1. Why does `revisiones` hold the same value before and after calling `establecerRevisiones` within a click handler? What does it mean for state to be a snapshot?
2. What is batching and what does it have to do with the update queue?
3. What changes if you pass a function to `establecer…` instead of a value? When does this course use each form?
4. Why does mutating an object and passing it back fail to trigger a re-render? What does React compare, and with which JavaScript function?
5. What are the five rules of state shape? Give an example from the `revisor` for each.
6. Why does `seleccionado` store a name rather than a service object? What would look wrong if it stored the service?
7. How do you decide which component owns a piece of state? Why is the draft not lifted to `Panel`?
8. Where does React store a component's state? What does a `key` do with that, and why does no tool warn you if it is missing?

## Further reading

- [React, “State as a Snapshot”](https://react.dev/learn/state-as-a-snapshot): state as a snapshot, the “+3” button example, and why values do not change within a render. Consulted on October 21, 2026.
- [React, “Queueing a Series of State Updates”](https://react.dev/learn/queueing-a-series-of-state-updates): batching, the update queue, updater functions, and parameter naming conventions. Consulted on October 21, 2026.
- [React, `useState`](https://react.dev/reference/react/useState): the `set` function, comparison with `Object.is`, double invocation in `StrictMode`, and common issues (“logging displays old value”, “screen doesn't update”). Consulted on October 21, 2026.
- [React, “Updating Objects in State”](https://react.dev/learn/updating-objects-in-state): treating state as read-only, shallow copying with spread syntax, rationale for immutability, and Immer. Consulted on October 21, 2026.
- [React, “Choosing the State Structure”](https://react.dev/learn/choosing-the-state-structure): the five shape rules, using `selectedId` instead of storing objects, and warnings against mirroring props in state. Consulted on October 21, 2026.
- [React, “Reacting to Input with State”](https://react.dev/learn/reacting-to-input-with-state): impossible states and favoring a single `status` over multiple boolean flags. Consulted on October 21, 2026.
- [React, “Sharing State Between Components”](https://react.dev/learn/sharing-state-between-components): lifting state up, controlled vs. uncontrolled components, and the single source of truth. Consulted on October 21, 2026.
- [React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state): state tied to tree position, using `key` outside lists, and the chat box example. Consulted on October 21, 2026.
- [React, “You Might Not Need an Effect”](https://react.dev/learn/you-might-not-need-an-effect): computing during rendering, resetting all state with a `key`, and storing selected identifiers. Consulted on October 21, 2026.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input): controlled inputs, pairing `checked` with `onChange`, and reading `evento.target.checked` on checkboxes. Consulted on October 21, 2026.
- [React, “immutability”](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability): the linter rule that forbids mutating props and state. Consulted on October 21, 2026.
- [MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is): defining “the same value” and why two objects are identical only if they share reference identity. Consulted on October 21, 2026.
- [MDN, “Spread syntax”](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax): spread in object literals, shallow copying, and property override precedence. Consulted on October 21, 2026.
- [MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed): toggle button state semantics and why button text should remain stable. Consulted on October 21, 2026.
- [MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside): the complementary landmark role and why it requires an accessible name inside a section. Consulted on October 21, 2026.
- [TypeScript, “Utility Types”](https://www.typescriptlang.org/docs/handbook/utility-types.html): `Readonly<Type>` and `Record<Keys, Type>`. Consulted on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| state | what a component remembers between one render and the next; React manages it and provides it via `useState` |
| snapshot | the fixed state value during a render; updating it requests a new render rather than modifying the variable |
| batching | waiting until an event handler finishes to process all state updates in a single render pass |
| updater function | a function passed to `establecer…` to calculate the next state from the pending value in the queue |
| mutate | modifying an existing object in place rather than creating a new one |
| spread (`...`) | syntax that copies properties from an existing object into a new one; performs a shallow copy |
| redundant state | data kept in state that could otherwise be computed from existing state or props |
| lifting state up | moving state to the common ancestor of the components that need it and passing it down via props |
| controlled component | a component whose primary data is supplied via props rather than stored in local state |
| `key` (for resetting) | an identifier React incorporates into tree position; changing it unmounts the component and mounts a fresh one |

---

**Next:** [Lesson 3 — Effects: synchronizing, not “when it loads”](03-effects-sincronizar.md)
