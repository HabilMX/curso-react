# Lesson 1 — Pure components and composition

*It is 6:50 in the evening and the operations lead wants, by early tomorrow morning, a single line above the dashboard: how many services were checked and how many are failing. It seems like a five-minute change. You open `Panel.tsx` and find a file where the row, the list, the three loading states, and the button all live together; to add one line you have to understand all four things at once. You add it as best you can and test it with the usual data: it looks fine. At 7:30 someone on the night shift restarts the API with all services healthy, and at the end of the new line, stuck right to “revisados”, a `0` that nobody wrote appears: `4 servicios revisados0`. Later, when sorting the list “so it looks pretty”, the list held by another part of the program also ends up sorted, without anyone asking for it. And when a teammate puts a counter inside a “helper” component defined inside the dashboard, the counter resets to zero every ten seconds, with each update. None of this breaks compilation or the linter. This lesson splits the dashboard into pieces that can be understood separately and teaches you the three rules that avoid those three scares.*

**Time:** 2 × 45 min (the natural break is between sections 1.3 and 1.4)

**What you build:** the dashboard split into pieces that can be understood and changed separately: a `Tarjeta` that wraps any content, a failure summary calculated with pure functions, and the list, the row, and the three loading states in their own files

**What you learn:** render and *commit*; purity: same inputs, same output; three planted impurities to find; `children` and composition; `key` with a stable identifier; the trap of the `0` rendered by `&&`; why a component is never defined inside another

**Where you are coming from.** From [Lesson 0](00-un-proyecto-de-verdad.md). Your `revisor` is already a Vite project with the React linter enabled, `StrictMode` active, a proxy to the practice server, and a `Panel.tsx` that does everything: it defines `FilaEstado`, defines `Contenido` with the `switch` for the three loading states, and puts together the page. It works and passes the linter. What it lacks is shape: it is a single file with three responsibilities. You work in the same folder, `~/curso-react/revisor/`.

**What this lesson does not do.** It does not add new state: there are no filters, no selection, and no notes; that arrives in [Lesson 2](02-estado-instantanea-forma.md). It does not touch `useReporte` or the network boundary: the hook and `cargar.ts` remain identical. It does not change the practice server, which continues in its first version (`GET /salud` and `GET /api/estados`). And it does not do optimizations: you will see that React calls your components again more times than you expect, and this lesson's answer is not “memoize it”, but “make sure that calling it extra times does no harm”. Measuring and optimizing is the topic of [Lesson 9](09-rendimiento-publicacion.md).

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions pinned by the checkpoint's `package.json` (the same ones from Lesson 0: React 19.3.1, Vite 8.3.5, ESLint 10.13.0, `eslint-plugin-react-hooks` 7.1.1). Except for the `fsevents` warning explained in section 1.7, nothing shown depends on the operating system. In the course's runs, this checkpoint was reinstalled from scratch in a Linux container (`node:24.22.0-bookworm`) and produced the same file name in `dist/` shown here, `index-Dezp5bTH.js`; since that name comes from a fragment of the content hash, it is very likely that both machines produced the same bundle. The figures were run only on macOS; nothing was run on a real Linux Mint. The exercise solutions were run separately, with Node.js 24.22.0, and their programs and outputs are in [`programas/01-componentes-puros-composicion/ejercicios/`](../programas/01-componentes-puros-composicion/ejercicios). What is seen “in the browser” was measured with headless Chrome (`--headless --dump-dom`), which executes the page's JavaScript and delivers the resulting document. The figures are run in `~/curso-react/figuras/`, the same folder as Lesson 0, with the same `package.json`; long paths printed by ESLint are shown starting from `~/curso-react`. The practice server log times are in UTC. The programs are in [`programas/01-componentes-puros-composicion/`](../programas/01-componentes-puros-composicion): `revisor/` is the checkpoint and the figures sit alongside it.

## By the end you will be able to

- Distinguish in a real output which part is *render* (React calls your functions) and which part is *commit* (React touches the DOM), and explain why an additional render does not change the screen.
- Find the three impurities of a component—changing something outside, mutating a prop, reading the clock—and fix each one without changing what the user sees.
- Split a large component into pieces with a single responsibility, and write a component that receives `children` to wrap content it does not know.
- Choose the `key` for a list and demonstrate with a run what happens to the state of each row when the `key` is the index, when it changes with the index, and when it is the identifier.
- Recognize the trap of the `0` in an `&&` and write the condition so it never renders a stray number.
- Read the linter's `static-components` error and explain, with a run, why a component defined inside another loses its state.

## The why before the how

Open `Panel.tsx` from Lesson 0 and count how many different questions it answers. What does an available service look like, and what does a failing one look like? That is `FilaEstado`. What is shown while loading, if loading fails, and when there is data? That is `Contenido`. What surrounds the page, the title and the button? That is `Panel`. Three questions in a sixty-line file. Today it is readable; the problem is what is coming. In future lessons the dashboard will gain a filter, a selection, notes, the detail view for each service, notifications, and a form. If all of that goes into the same file, the operations lead from the opening scene will ask for a line and you will have to read three hundred.

The obvious answer is “split it into components”. And it is the right one, but splitting without understanding what a component is to React produces pieces that break in strange ways: the `0` that appears on its own, the list that sorts itself without anyone touching it, the counter that resets to zero on every update. Those three flaws share the same root: **React does not call your components when you think, nor the number of times you think.** It calls them every time something might have changed, sometimes twice in a row, and trusts that calling them has no consequences. If a component honors that deal, you can split it, move it, and reuse it without fear. If it does not, each new piece multiplies the surprises.

That is why this lesson does not begin by splitting files, but with three ideas, one per major section:

1. **Purity** (1.1 and 1.2). What React does when it “renders” and why your components must be pure functions: same inputs, same output, and never changing what existed before calling them.
2. **Composition** (1.3). How a component is split by responsibilities and how a component can wrap content it does not know, with `children`.
3. **Identity** (1.4 to 1.6). How React knows that the `pagos` row in this render is the same one from the previous one: the `key`, position in the tree, and the reason why a component is never defined inside another. The trap of the `0` fits here too, because it is a case of “React rendered something you did not expect”.

Section 1.7 walks through the complete path: verifying the checkpoint and viewing it in the browser. In the end, this is the build you will get, and you will know why the JavaScript bundle changed its name compared to Lesson 0 even though the dashboard “does the same thing”:

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

Twenty-six modules instead of twenty: these are the six new files in this lesson. The dashboard displays the same as before, plus a card with its header and a summary line; the big difference is not seen on the screen, it is seen when someone has to change it.

## The concepts

### 1.1 Render and *commit*: what React does when it “renders”

#### 1.1.1 Three steps, not one

Until now you have said “React renders the component” as if it were a single thing. React's documentation separates it into three steps, using a restaurant analogy: someone **triggers** the order, the kitchen **prepares** it, and the waiter **serves** it to the table. In React they are called *trigger*, *render*, and *commit*, and every screen update goes through all three ([React, “Render and Commit”](https://react.dev/learn/render-and-commit)):

1. **Trigger.** Something requests a render: the initial `createRoot(...).render(...)` when opening the page, or a state change, like `useReporte`'s `establecerCarga` when the response arrives.
2. **Render.** React **calls your component functions**. It calls `Panel`, `Panel` returns JSX that mentions `Tarjeta`, React calls `Tarjeta`, and so on down. The documentation says the process is recursive: it continues until there are no nested components left and React knows exactly what should be displayed. The result of this step is not the screen; it is a description of how it should look.
3. ***Commit.*** React applies to the DOM the differences it already calculated during rendering, and **touches the DOM only where there is a difference**. The comparison between the new description and the previous one occurs while rendering; in the *commit* only the changes are executed. In the words of the documentation: React only changes DOM nodes if there’s a difference between renders, and applies the minimal necessary operations, “calculated while rendering”.

After the *commit*, the browser paints the screen again. The documentation calls this last step *painting* to avoid confusing it with React's render. In this course the same distinction is used: **render** is when React calls your functions; **painting** is when the browser draws pixels. In Spanish, “dibujar” (drawing) a component has been used up to this point as a synonym for render, and continues to be used that way.

Rendering produces a **tree**: `Panel` at the top, `Tarjeta` below, then `ContenidoReporte`, and so on. The documentation calls it the render tree, and clarifies that it is made only of React components ([React, “Understanding Your UI as a Tree”](https://react.dev/learn/understanding-your-ui-as-a-tree)). That tree will matter in 1.4 and 1.6, when the question is how React knows that a component in this render is the same one from the previous one.

#### 1.1.2 Seeing it in a run

The first figure makes it visible. A two-row list prints a line each time React calls a component (render), and a `MutationObserver`—the browser API that reports when something changes in the DOM—counts how many mutation records the container received in each *commit* (the “DOM changes” in the output). It is rendered three times: the first time, another with the same data, and another with a different number.

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

Read the three parts calmly, because the whole lesson rests on them:

- **The first time**, React called all three components and the *commit* produced a single mutation record: the insertion of the entire `<ul>`, with its two rows inside, at once. (A `MutationObserver` delivers records of what changed in the container, not a list of React's internal operations; that is why the `1` means “the `<ul>` was inserted”, not “React performed exactly one operation”. [MDN, `MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).)
- **With the same data**, React called all three components again—the render happened completely—and the *commit* made **zero** changes. React compared, found no differences, and did not touch the DOM.
- **With a different number**, all three were called again, including the `catálogo` row, which did not change. The *commit* produced a single mutation record: the text `118` changed to `97`. It did not replace the row or the list; it changed a text node.

Two conclusions emerge from this, and both run counter to intuition. The first: **just because React calls your component does not mean the screen changes.** A render is a question (“what should this look like now?”), not an order to repaint. The second: **React calls your components more than you would need**: the `catálogo` row was calculated three times, two of them without anything of its own having changed. That is not a flaw to hunt down with `memo` (Lesson 9 explains when to do so, and always after measuring); it is part of the design. React can afford to call extra times because it relies on a condition: that calling your component has no consequences. That condition has a name.

#### 1.1.3 Why this matters for splitting the dashboard

When the dashboard was a single piece, each render called `Panel`, `Contenido`, and four `FilaEstado`s. Now that you are going to split it, there will be more components, and each one will be called on every render of its parent. If any of them “does something” when called—incrementing a counter, mutating an array, reading the clock—that something will repeat as many times as React decides to call it, and you do not control how many that is. That is why purity comes before splitting: it is what makes having many pieces safe.

### 1.2 Purity: same inputs, same output

#### 1.2.1 The two conditions

React's documentation defines a pure component with two conditions, taken from the definition of a pure function in mathematics and programming ([React, “Keeping Components Pure”](https://react.dev/learn/keeping-components-pure)):

- **It minds its own business.** It does not change any objects or variables that existed before it was called.
- **Same inputs, same output.** Given the same inputs, it always returns the same result.

What are a component's inputs? The same page says it: in React there are three types of input that you can read while rendering: props, state, and context, and all three are treated **as read-only**. Today you only use props; state arrives in Lesson 2 and context in Lesson 6, and the rule will be the same for all three. The React rules reference states it with a technical term: components must be **idempotent**, always returning the same output given their inputs, because React can render a component multiple times to provide the best possible user experience ([React, “Components and Hooks must be pure”](https://react.dev/reference/rules/components-and-hooks-must-be-pure)).

What is allowed is changing what the component itself just created. The documentation calls this **local mutation**: if inside the component you create a new array and push items into it, nobody outside sees it, and the next call creates a fresh one. The problem is never mutating; the problem is mutating something that **already existed** before the call.

#### 1.2.2 Three planted impurities

The second figure has a component with three impurities hidden in three consecutive lines. Before reading the explanation, look at the code and the output and try to find them yourself. The clues are in the output: each of lines 2, 3, and 4 is the symptom of one.

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

`renderToStaticMarkup` is a function from `react-dom/server` that renders a tree and returns the HTML as text, without a browser or DOM; here it is used to render the same component twice, one second apart, and compare. If you already found all three, compare with the list. If not, re-read the first three lines of `ResumenImpuro`'s body before continuing.

**Impurity 1: changes an outside variable.** `revision = revision + 1` modifies a variable that existed before calling the component. The symptom is line 3: it mounted **once** and the counter says **2**. Why? Because `StrictMode`, in development, calls every component twice precisely to uncover this; the documentation puts it like this: by calling component functions twice, `StrictMode` helps find components that break these rules ([React, “Keeping Components Pure”](https://react.dev/learn/keeping-components-pure)). In Lesson 0 you saw the additional cycle of effects; this is its sibling, the additional render. In production there would be no double call, but you are not off the hook either: React can call the component whenever its parent renders, and the number would stop meaning “reviews” and start meaning “times React found it convenient to call me”.

**Impurity 2: mutates a prop.** `servicios.sort(...)` looks like it “calculates a sorted version”, but `sort` sorts the array **in place** and returns the same array ([MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). The symptom is line 2: the array belonging to whoever called the component ended up reordered. That is the second scare from the scene, the list that sorted itself. Props are, in the words of the documentation, immutable snapshots of a moment: they are not changed ([React, “Passing Props to a Component”](https://react.dev/learn/passing-props-to-a-component)).

**Impurity 3: reads the clock.** `new Date()` returns something different on every call even though the props are the same. The symptom is line 4: same props, two renders, two different times. The React reference uses this very example: `new Date()` is not idempotent, because it returns the current date and changes every time it is called; the same goes for `Math.random()` ([React, “Components and Hooks must be pure”](https://react.dev/reference/rules/components-and-hooks-must-be-pure)). With a clock in render, the output depends on **when** React decided to call the component, something you do not control.

#### 1.2.3 Who warns you about each one?

The practical question is which of your tools catches each impurity before it reaches the user. It was measured with the course's three tools, and the result is not what one would expect.

**The linter catches the first one.** This is what ESLint says about the figure:

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

It is the `globals` rule, one of the fourteen that come from the React Compiler and that Lesson 0 turned on: it validates that global variables are not assigned or mutated during rendering ([React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals)). The message even suggests the two ways out: if the value is used for rendering, make it state; if not, update it in an effect.

**The other two, the linter did not see.** This was verified by deleting the `revision` line in a copy and running ESLint again: the only warning left was `prefer-const` (because `revision` was no longer reassigned), nothing from React. Neither the `sort` on the prop nor `new Date()` produced an error. The second deserves a comment: the page for the `purity` rule mentions `new Date()` among its examples ([React, lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity)), but in version 7.1.1 of the package, measured that day, the rule triggers with `Date.now()` and not with `new Date()`. When changing `new Date()` to `new Date(Date.now())` in the copy, `Error: Cannot call impure function during render` appeared, with rule `react-hooks/purity`. The page itself presents its list as “usual examples” (*usual examples*, with `Date.now()` and `new Date()` on the same line), not as an inventory of what the installed version detects. The practical lesson: **the linter is a net, not a wall.** It catches a lot, and what it does not catch remains your responsibility.

**TypeScript catches the second, if you ask it to.** Look at the prop's type: `Servicio[]`, without `readonly`. It was written that way on purpose so that the figure would compile. If you change the type to `readonly Servicio[]`, which is how `contrato.ts` in the `revisor` has declared its lists since Lesson 0 (`readonly estados: readonly EstadoPublico[]`), compilation halts:

```text
fig01_02.tsx(20,31): error TS2339: Property 'sort' does not exist on type 'readonly Servicio[]'.
```

(It is the first of the four errors in that run; the full output is in `ejercicios/fig01_02.tipos-esperado.txt`.)

A `readonly` array in TypeScript does not have mutating methods: no `sort`, no `push`, no `splice`. That word, which seemed like decoration in `contrato.ts`, is in reality the defense against the second impurity. The three type errors accompanying it in that run (`TS7006`, parameters with implicit `any` type) are a consequence of the first: since `sort` does not exist, TypeScript no longer knows what type `a` and `b` have, nor the `ordenados` result, and therefore neither does `s` in the `map` on line 25.

**`StrictMode` catches those that change something with each call.** The counter that says 2 was uncovered by `StrictMode`. In a real application you would see it as “the review jumps by two in development”, and that oddity is your clue.

Summary of the defense: **the linter** for what is visible in the code's text, **TypeScript with `readonly`** for mutations of data you receive, **`StrictMode`** for repeating effects, and **your eyes** for everything else. None is enough on its own. Exercise 1 asks you to fix all three.

#### 1.2.4 Where the impure stuff goes

If a component cannot read the clock or change anything, where do those things get done? React's documentation answers with an order of preference: side effects usually belong in **event handlers** (a button's `onClick`, for example), which React does not call during render; and if there is no corresponding event, as a last resort, in a `useEffect` ([React, “Keeping Components Pure”](https://react.dev/learn/keeping-components-pure)). Your dashboard already does this right: the API request lives in `useReporte`'s effect, because it is synchronizing with something outside, and the `establecerCarga({ tipo: "cargando" })` in “Actualizar” lives in `recargar`, which runs on a click. Lesson 3 returns to effects in depth.

And what can be **calculated** from props is not a side effect: it is precisely what a pure component does. Counting how many services are failing is a calculation. That is why the first new file in the checkpoint is not a component, but two pure functions:

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

Both meet both conditions. `contarFallas` receives a `readonly` list, so it could not mutate it even if it wanted to, and `filter` returns a new array (a local mutation that nobody sees). `textoFallas` resolves the singular, because “1 servicios con falla” reads awkwardly. Neither knows about React, JSX, or the DOM, and that is why they can be tested with a `console.log` or, in Lesson 8, with a three-line test, without mounting anything. **Separating calculation from presentation** is the first move in this lesson: what is calculation goes into a pure function in a `.ts` file; what is presentation goes into a component that calls it.

### 1.3 Composition: splitting the dashboard by responsibilities

#### 1.3.1 When to split and where

React's documentation, in its guide to thinking in UI, suggests splitting using the same techniques you use when deciding whether to write a new function; one of them is separation of concerns: ideally, a component only does one thing, and if it grows, it decomposes into smaller subcomponents ([React, “Thinking in React”](https://react.dev/learn/thinking-in-react)). Applied to `Panel.tsx` from Lesson 0, the responsibilities were already in plain sight; they just lived in the same file. The checkpoint separates them like this, from bottom to top:

| File | Question it answers | Receives |
|---|---|---|
| `FilaEstado.tsx` | What does **one** service look like? | an `EstadoPublico` |
| `ListaEstados.tsx` | What does the **list** of services look like? | the list |
| `ResumenFallas.tsx` | What does the **summary** line say? | the list |
| `ContenidoReporte.tsx` | What is displayed depending on the **loading state**: waiting, error, or data? | a `Carga` |
| `Tarjeta.tsx` | What does a **box with a title** look like, whatever its content? | a title and `children` |
| `Panel.tsx` | How is the page **assembled**? | `cargar` and `cadaMs` |

Notice the “Receives” column: each piece receives only what it needs. `FilaEstado` does not know a loading state exists; `ListaEstados` does not know there is a button; `ResumenFallas` does not know how the report is fetched. That ignorance is what is valuable: if tomorrow you change what a row looks like, you open an eighteen-line file and do not have to understand anything else.

The first two come out of the old `Panel.tsx` almost untouched. `FilaEstado` is identical to the one from Lesson 0, now exported from its own file:

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

`ListaEstados` is the `<ul>` with its `map`, which previously lived inside `case "listo"`. It has one change compared to Lesson 0, in the `key`, which section 1.4 explains with a run:

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

The summary is new, and it is the line the operations lead was asking for. It uses the two pure functions from 1.2.4 and contains, already solved, the `0` trap that 1.5 explains:

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

A detail of JSX that explains why the text comes out attached as it should: the line break and indentation between `servicios revisados` and the brace `{fallas > 0 && …}` do **not** produce a space on the page, because JSX discards whitespace that includes a line break. That is why the `·` separator carries its space inside the `<strong>`: `<strong> · …</strong>`. If you removed that space, on screen you would see `revisados· 2 servicios`.

`ContenidoReporte` is the old `Contenido`, with its full name and `case "listo"` converted into two pieces. The `<>` and `</>` are a **fragment**: a way to return two sibling elements without wrapping them in a meaningless `<div>`:

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

The `default` with `never` is the same one from Lesson 0, and stays for the same reason: if tomorrow someone adds a fourth type to `Carga` (Lesson 4 adds the empty state, albeit in a different way), TypeScript flags this `switch` as incomplete. Notice also what was **not** done: `ResumenFallas` and `ListaEstados` receive the same list and each does its own thing with it. Neither stores it, neither copies it into state, neither modifies it. Both are pure, which is why sharing the same list is safe.

#### 1.3.2 `children`: the hole the parent fills

The piece that teaches the most is still missing. The operations lead wants the report to look like a card: a box with a title. And it is easy to guess that, as soon as it exists, someone will want another identical card for a service's detail view, another for notifications, and another for the form. You could write `TarjetaReporte`, `TarjetaDetalle`, and `TarjetaAvisos`, three nearly identical components. Or you can write **one** card that does not know what it holds inside.

React solves this with a special prop. When you nest content inside a JSX tag, the parent component receives that content in a prop called `children`. The documentation suggests picturing it like this: a component with `children` has a “hole” that components using it can fill with whatever JSX they want, without needing to know what is rendered inside ([React, “Passing Props to a Component”](https://react.dev/learn/passing-props-to-a-component)). That is **composition**: building large pieces by combining pieces that do not know each other.

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

Three decisions in this file:

- **It lives in `src/compartido/`, not in `src/reporte/`.** It knows nothing about the report. It is the first piece of the application designed for multiple features, and the folder says so. It is the folder-by-feature criterion from Lesson 0: what a single feature uses lives with it; what multiple features use, in `compartido/`.
- **`children` has type `ReactNode`.** It is the type React exports for “anything that can be rendered”: a JSX element, a string, a number, a list of elements, `null`. That way the card accepts whatever you put inside it, and TypeScript warns you if you pass it something React does not know how to render, like a loose object.
- **It uses `<section>` with an accessible name.** An ordinary `<section>` means nothing special to a screen reader. But, according to MDN, a `<section>` communicates the `region` role (a named landmark to which a user can navigate) when it has an accessible name ([MDN, `region` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role)). Here the name is provided by `aria-label={titulo}`. MDN prefers, when there is a visible heading, `aria-labelledby` pointing to the heading instead of repeating the text; the checkpoint uses `aria-label` for simplicity: the text is the same as the `<h2>`, and MDN's preferred form, `aria-labelledby`, requires a unique `id` per card, which in React is generated with `useId`, a hook the course has not introduced yet. It is a decision of the course, not a rule: both forms produce the same accessible name. Accessibility, as the course README states, is a habit taught wherever it appears; Lesson 8 queries the page by role and name, and this region is one of the things it finds.

And `Panel` ends up like this, with no presentation logic of its own:

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

Read `Panel`'s JSX like a sentence: “the page has a title and a card called Estado de los servicios, containing the report content and a button”. What goes between `<Tarjeta>` and `</Tarjeta>`—the content and the button—is exactly what `Tarjeta` receives as `children` and places below its `<h2>`. `Tarjeta` does not know there is a button or that a loading state exists; `Panel` does not know the card uses a `<section>`. If tomorrow the card changes its style, you change one file and all cards inherit it.

There is a less visible and very useful effect: the button **travels with the state that controls it**. `recargar` comes from `useReporte`, which lives in `Panel`; the button is in `Panel`'s JSX. `Tarjeta` renders it, but does not know it. If instead of `children` you had passed `recargar` as a prop to `Tarjeta` so it could render the button, the card would cease to be generic: it would know about reloads. `children` lets each piece know only its own concern, and Lesson 6 returns to this when asking whether a context is needed: many times, the answer is “no, `children` is enough”.

The stylesheet grows with two rules, one for the card and another to highlight the number of failures:

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

The `.tarjeta` rule lives in the report stylesheet even though `Tarjeta` is in `compartido/`. The course uses **a single stylesheet** that grows lesson by lesson; it is a conscious simplification so you do not have to chase styles across files. When a real project grows, each shared component usually brings its own stylesheet; here it is not needed yet.

`useReporte.ts`, `cargar.ts`, `main.tsx`, `contrato.ts`, `configuracion.ts`, and the practice server do not change. In `package.json` only the version number changes, from `0.0.0` to `0.1.0`: the course uses `0.N.0` in checkpoint lesson N.

### 1.4 `key`: how React knows a row is the same

#### 1.4.1 The problem it solves

Return to Figure 1. In the third render, React changed a piece of text and did not replace the row. How did it know that the `inventario` row in the third render was **the same** one from the second, and that updating its number was enough? With a list that always brings the same items in the same order, it could use the index. But lists change: a new service appears at the top, one is removed, the order changes. To pair items in a list between one render and another, React uses the `key`.

The documentation sets two rules ([React, “Rendering Lists”](https://react.dev/learn/rendering-lists)):

- **Keys must be unique among siblings.** Two elements in the same list cannot share one (in different lists they can repeat).
- **Keys must not change**, or their purpose is lost; that is why they are not generated during rendering.

And it clarifies a confusing detail: your component **does not receive** `key` as a prop. It is a hint for React; if `FilaEstado` needed the name, you would pass it separately (here it already has it, inside `estado`).

#### 1.4.2 Three `key`s for the same list

In Lesson 0, the row had `` key={`${posicion}-${estado.nombre}`} ``. It worked and had no duplicates. Why change it? Figure 3 answers by measuring. A list of four services receives a fifth, `correo`, **at the beginning**, and three forms of `key` are tested. Each row stores in its state the name it was born with—a `useState` with an initial value, explained in depth in Lesson 2; here it is enough to know that React preserves it as long as the row is “the same”—and displays a warning if it now has to render another name. Additionally, it counts how many `<li>` DOM nodes are new after the change.

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

Three outcomes, three lessons:

- **`key={posicion}`: the wrong identity.** React matched by index: the row at index 0 (the `catálogo` one) now receives `correo`, the one at index 1 (`pagos`) receives `catálogo`, and so on. It only created one new row, the last one. The DOM ended up with the correct text, but **each row's state stayed in place while the data shifted**: the row saying `correo` is, for React, the one born as `catálogo`. If the `pagos` row held in its own state something the user typed, that text would now appear next to `catálogo`. The documentation warns of this: using the index as a `key` (which is what React does if you provide none) often leads to subtle and confusing bugs when inserting, deleting, or reordering items ([React, “Rendering Lists”](https://react.dev/learn/rendering-lists)).
- **`` key={`${posicion}-${nombre}`} ``: the identity that is lost.** The `key` from Lesson 0. As long as names are not repeated, it does not confuse one row with another, because it includes the name. But it also includes the index, and upon inserting `correo` at the top, **all** indices changed: `0-catálogo` became `1-catálogo`, a `key` React had never seen. Result: five rows created from scratch out of five, and the four old ones destroyed along with all their state. It is the same flaw the documentation points out for `key={Math.random()}`, to a lesser degree: keys do not match between renders and components and the DOM are recreated. In the `revisor` this goes unnoticed because `FilaEstado` holds no local state, and Lesson 2 keeps it that way on purpose: notes will live in `Panel` and the “has note” indicator for each row will be derived from them, so recreating a row deletes nothing. But the performance cost remains (five rows destroyed and recreated where creating one was enough), and the day a row does store something in its own state, such as a half-typed text field, that data would be lost across all rows. A stable `key` is one that does not depend on anyone remembering that constraint.
- **`key={nombre}`: the correct identity.** A single new row, `correo`, and the four usual ones preserved, each with its own state. It is the checkpoint's `key`.

#### 1.4.3 Why the name is a safe `key`

The documentation recommends deriving the `key` from the data: if it comes from a database, its identifiers are naturally unique ([React, “Rendering Lists”](https://react.dev/learn/rendering-lists)). The API types, in `contrato.ts`, do not carry a numeric identifier; they carry the service name. Is it unique? In this system's design, yes: the name is the service's identity (the detail route, starting in Lesson 3, is `/api/servicios/:nombre`), and starting in Lesson 4, when the practice server accepts additions, attempting to register a name that already exists responds `409` with `ya existe un servicio llamado X`. The UI relies on that rule because the API is what enforces it; the UI does not invent it. And like any rule belonging to another system, it holds only as long as that system keeps it: that is why it pays to know what happens if one day it does not.

And what if the API made a mistake and sent two services with the same name? React warns you in development. Figure 4 triggers the two `key` warnings you will see in the browser console: a list without a `key` and a duplicate `key`. React's messages go to `console.error`; the figure captures them to print them with a prefix.

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

The first warning says “each child in a list should have a unique "key" prop” and points you to the offending component: “check the render method of `SinLlave`”. The second says “encountered two children with the same key, `pagos`”, and warns that with duplicate keys, React may duplicate or omit elements, and that this behavior is unsupported. A measured fact worth knowing: **neither TypeScript nor the course linter detects a missing `key`.** `npx eslint fig01_04.tsx` finishes without warnings, because `eslint-plugin-react-hooks` checks hook and compiler rules, not list rules. The warning only appears at runtime, in the console, and only in development. That is why the browser console is never ignored: a React `console.error` is a bug, even if the page looks fine.

### 1.5 The trap of the `0`

This is the most famous pitfall in JSX and the easiest to avoid once you understand it. JavaScript's `&&` operator does not return `true` or `false`: it returns **the first decisive value**. `a && b` returns `a` if `a` is “falsy” (`false`, `0`, `""`, `null`, `undefined`), and `b` otherwise. With a boolean on the left, `false && <strong>…</strong>` returns `false`, and React renders nothing for `false`. With a number on the left, `0 && <strong>…</strong>` returns `0`… and React **does render numbers**. The documentation issues an explicit warning: do not put numbers on the left side of `&&`, because if the left side is `0`, the whole expression evaluates to `0` and React will render `0` instead of nothing ([React, “Conditional Rendering”](https://react.dev/learn/conditional-rendering)).

Figure 5 shows this with the dashboard summary, in two versions that differ by only one line:

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

With two failures, both versions are identical: that is why the trap survives manual testing with the usual test data, where `pagos` and `reportes` fail. With zero failures, the first renders `4 servicios revisados0`: the `0` that appeared in the opening scene when the night shift restarted the API with everything healthy. The second renders nothing extra.

The fix is the one suggested by the documentation: **make the left side a boolean.** `fallas > 0` is `true` or `false`, never a number. That is exactly what `ResumenFallas` does in the checkpoint. Other forms that work: `Boolean(fallas) && …`, `!!fallas && …`, or a ternary, `fallas > 0 ? <strong>…</strong> : null`. The course uses the comparison because it reads like what it means: “if there are failures”. Here too there is no net: TypeScript accepts `fallas && …` without complaint (a `number` is a valid JSX child) and the course linter does not flag it either; this was verified by running `npx eslint fig01_05.tsx`, which exits with no warnings. The defense is habit: **on the left of `&&`, always a boolean.** In Lesson 8, a course test deliberately uses `fallas &&` and verifies that the text comes out with the `0` stuck to it; it is the test that turns red when reverting the fix.

### 1.6 Never a component inside another

#### 1.6.1 The temptation

When splitting a component, a natural temptation arises: defining the small piece **inside** the large one, so it has access to the parent's variables without having them passed as props. Something like this, inside `Panel`:

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

It seems convenient: `BotonActualizar` sees `recargar` without anyone passing it. The documentation forbids it unequivocally: components can render other components, but **never** nest their definitions; every component is defined at the top level of the file, and if the child needs data from the parent, pass it via props ([React, “Your First Component”](https://react.dev/learn/your-first-component)).

#### 1.6.2 Why: identity once again

The reason is the same as with `key`. To decide whether a component in this render is the same one from the previous one, React looks at **its position in the tree and its type**. The type of `<BotonActualizar />` is the function `BotonActualizar`. If that function is defined inside `Panel`, **each render of `Panel` creates a new function**: the same code, but a different object. For React it is a different component type. So it destroys the old one, along with its state and its DOM nodes, and mounts a new one. The documentation explains this in terms of state: React preserves state as long as the same component is rendered in the same position, and state disappears because a different function is created on each render ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)).

Figure 6 measures this. Two identical dashboards; in one, the click counter is defined outside, and in the other, inside. Two clicks are given to the counter, and then the parent updates:

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

The counter defined outside preserves its two clicks when the parent updates. The one inside resets to zero, which is the third scare from the opening scene: rendering `PanelMal` created a new `ContadorDeDentro`, React saw it as a different type, unmounted the old one, and mounted another with initial state. Imagine that in the `revisor`: every ten seconds, `useReporte`'s polling updates the dashboard; if the row were defined inside the dashboard, every ten seconds everything the user had typed into it would be wiped. Besides losing state, work is wasted: React destroys and recreates DOM nodes on every render, whereas Figure 1 showed that the norm is touching only what changed.

This time the linter is on your side. It is the `static-components` rule, another one from the compiler:

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

The message points to two places: where the component created during render is **used** (line 51) and where it is **defined** (lines 37 to 44). And it states the consequence in one sentence: components created during render reset their state each time they are created. The rule's documentation page adds why: React sees each as a new component type, unmounts the old one, and mounts the new one, destroying all state and DOM nodes ([React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components)). Since it is an error and not a warning, `npm run lint` halts even without `--max-warnings 0`.

The usual fix is to move the definition to the top level of the file (or to its own file) and pass via props what it used from the parent. For the button in the snippet in 1.6.1, that means `function BotonActualizar({ alPulsar }: { readonly alPulsar: () => void })` outside `Panel`, and `<BotonActualizar alPulsar={recargar} />` inside. The name `alPulsar` introduces a course convention: props that receive an **event handler** (something that runs when the person does something) begin with `al`, like `alPulsar` here and `alCambiar` or `alSeleccionar` in Lesson 2. `cargar`, on the other hand, does not begin with `al`: it does not respond to an event, it is the work the panel asks of the hook. In the checkpoint that component was not even necessary: the button lives directly in `Panel`'s JSX, which is where `recargar` lives, and travels to the card as `children`. Sometimes the best way not to nest a component is not to create it.

### 1.7 The complete walkthrough

With all six pieces in place, verify the checkpoint as done in every automated check in the course: clean install, linter, and build. All three exited with code 0:

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

`npm run lint` prints nothing after the header: zero problems. (In the `npm ci` run for this lesson, npm also printed an `install-scripts` warning. It comes from `fsevents`, an optional dependency that only installs on macOS for file watching and includes an install script; nothing needs to be approved. On Linux that dependency is not installed, so the warning is not expected to appear; whether it did or not was not measured in the course's Linux container, so if you see it or do not see it, it is not a mistake of yours.) The build is the one you saw in “The why before the how”: twenty-six modules, a slightly larger stylesheet due to the two new rules, and a JavaScript bundle whose name changed. That name change is no fluke: Vite computes the name from the content, and the content changed. It is the `index-Dezp5bTH.js` that the course documents for this checkpoint; if you get a different name, something differs: your code or your dependency versions (compare against `package-lock.json`).

To view it in the browser, use the same two terminals from Lesson 0: `npm run servidor` in one, and in the other, `npm run dev` for development or `npm run preview` to view the built version. This is what headless Chrome delivered upon opening the built version (only the container is shown):

```text
<div id="raiz"><main><h1>Revisor</h1><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></section></main></div>
```

Compare it with Lesson 0. The rows are identical, character by character: splitting `FilaEstado` into its own file did not change what it renders. What is new is the `<section>` with its accessible name, the `<h2>`, and the summary paragraph, with `4 servicios revisados` and, in red, `· 2 servicios con falla`. The “Actualizar” button ended up inside the card, as `children`. And the practice server log recorded a single request, as expected for the production build: `StrictMode` remains in `main.tsx`, but its checks only run in development:

```text
08:14:17.848 GET /api/estados 200
```

With `npm run dev`, in contrast, you will see the pair from Lesson 0 (one `cancelada por el cliente` and one `200`) if the connection gets through. And now you know that, in addition to the effect's additional cycle, `StrictMode` is calling each of your six components twice on every render. You do not notice because all six are pure: calling them twice yields the same result twice. That is the free test from Lesson 0, applied to components.

## The error you will see

**The main error: `Cannot create components during render`.** It is the one from 1.6. It appears as soon as you define a component inside another, and since it is an error (not a warning), `npm run lint` stops. It reads in three parts: the line where you use the component (`This component is created during render`), the block where you define it (`The component is created during render here`), and the rule, `react-hooks/static-components`. It is fixed by moving the definition to the top level and passing via props what it took from the parent. React's documentation asks you not to nest component definitions ([React, “Your First Component”](https://react.dev/learn/your-first-component)); if you think you need to, almost always what you want is to pass the content as `children`.

**The warning that only appears at runtime: `Each child in a list should have a unique "key" prop.`** It is the one from Figure 4. Neither TypeScript nor the course linter reports it; it appears in the browser console, in development, the first time the list renders. It tells you which component to look in (`Check the render method of …`). It is fixed with a stable `key` taken from the data, never with the index and never with a value generated during render. Its relative, `Encountered two children with the same key`, means your data does not satisfy the uniqueness you assumed: the fix is not inventing another `key`, but investigating why the API sent duplicates.

**The type error that saves you from mutating: `Property 'sort' does not exist on type 'readonly …[]'`.** It is the one from 1.2.3. If you see it, TypeScript is telling you that you tried to change a list that does not belong to you. Do not remove `readonly` to make it compile: copy before sorting, with `[...lista].sort(…)`, or use `toSorted`, which returns a new array and leaves the original intact ([MDN, `Array.prototype.toSorted()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted); `sort`, which changes the original, is covered in [MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). `toSorted` is part of ES2023; the `revisor`'s `tsconfig.app.json` declares `"lib": ["ES2023", "DOM"]`, so you can use it there.

## What gets done wrong

**Changing something outside during render.** A module counter, a global variable, a `document.title = …` in the component body. It runs as many times as React calls the component, which is not the same as “every time the screen changes”. In development, `StrictMode` doubles it and gives you the clue; in production, the number simply lies.

**Mutating props.** `props.estados.sort()`, `props.estados.push(…)`, `estado.nombre = …`. You change data that belongs to another component, and that other component has no way of knowing it changed. The cost is a bug far from where it was committed: the list sorts itself “somewhere else”. Declare props with `readonly` and TypeScript prevents it.

**Reading the clock or randomness during render.** `new Date()`, `Date.now()`, `Math.random()`. The output depends on when React decided to call you. If the component needs the time, have it receive it as a prop or store it in state and update it from an effect, as shown in the React reference.

**Using the index as a `key`, or a `key` that changes with the index.** The former confuses rows with each other when the list changes; the latter destroys all of them. Neither is noticeable as long as the rows have no state, which is why both survive until the day the row gains a note or a text field.

**Generating the `key` during render.** `key={Math.random()}` or `key={crypto.randomUUID()}` inside the `map`. Each render produces new keys, and React recreates all components and the entire list DOM every time.

**A number on the left side of `&&`.** `{fallas && …}`, `{lista.length && …}`. It works with test data and renders a `0` the day there is nothing. On the left side of `&&`, always a boolean.

**Defining a component inside another.** It loses its state and its DOM on every render of the parent. The linter catches it with `static-components`; do not silence it.

**Splitting just for the sake of splitting.** One component for each HTML tag is not better design: it is just more files to read. The criterion is responsibility, “what question does this piece answer?”, and not size. `Tarjeta` exists because “a box with a title” is a recurring question; a one-line `TextoRevisados` used by no one else would not be.

**Making a card that knows too much.** Passing `recargar`, the loading state, or the content type to `Tarjeta` so it can decide what to render ties it to a single feature. With `children`, whoever uses it decides what goes inside.

## Exercises

### Exercise 1 — Clean up the three impurities

Copy `fig01_02.tsx` into `~/curso-react/figuras/` and fix `ResumenImpuro` so that it is pure, without losing what it displays: a review number, a time, and the sorted names. **Before changing anything, predict** what the four lines of output will say once the component is pure. When finished, the output must confirm your prediction and `npx eslint` must report no problems. Hint: a pure component cannot invent the review number or the time; someone must pass them to it.

### Exercise 2 — Removing instead of adding

In Figure 3, `correo` was added at the beginning. Change one line so that, instead of that, `catálogo`, the first in the list, is **removed**: `const despues = antes.slice(1);`. **Before running it, predict** for each of the three `key` options how many rows are created from scratch and what text each row displays. Then run it and compare. Which of the three results would be most dangerous if each row stored, in its own state, a note typed by the user? (In the `revisor` this will not be the case: starting in Lesson 2 notes live in `Panel`. The question is so you recognize the risk when a row actually does hold state.)

### Exercise 3 — The missing singular

The checkpoint summary handles the singular for failures (“1 servicio con falla”), but not for checked services: with a single service it would say `1 servicios revisados`. Write, in a file `textoRevisados.ts` inside `~/curso-react/figuras/` (not in the `revisor`, so your project stays identical to the checkpoint), a pure function `textoRevisados(total: number): string` following the model of `textoFallas`, and test it with `node textoRevisados.ts` for 0, 1, and 4. **Before running it, write down** the three outputs you expect. Why can this function be tested without React, without jsdom, and without a browser?

### Exercise 4 — Spot the trap

A teammate suggests, for Lesson 4, rendering the list only if there are services: `{carga.reporte.estados.length && <ListaEstados estados={carga.reporte.estados} />}` inside a `<section>`. **Without running anything**, write down what HTML it produces when the API responds `{"estados":[]}`. Then verify it with `renderToStaticMarkup`, as in Figure 5, and write the correct version.

## Solutions

### Solution 1

The prediction, with the pure component: line 2 shows the array **unchanged** (`pagos, catálogo, reportes`), because nothing sorts it in place anymore; line 3 says `0`, because the component no longer touches the module variable; and line 4 says `sí`, because the time arrives as a prop and is the same across both renders. The three fixes, one per impurity:

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

The review number and the time are now props: whoever uses the component decides what they are (in the figure's calls, for example, `revision={1} hora="10:00:00"`), and the component merely displays them. The list is copied with `[...servicios]` before sorting: it is a local mutation, on an array the component just created, and is allowed. The type `readonly Servicio[]` prevents anyone from writing `servicios.sort(…)` again without TypeScript stopping it. One detail remains from the rest of the figure: line 3 continues to print the module variable `revision`, which nobody changes anymore. If you leave it as `let revision = 0;`, ESLint warns with `prefer-const`, precisely because nobody reassigns it; change it to `const revision = 0;`. Exactly this version was measured (`ejercicios/fig01_02.corregida.tsx`, with its output in `ejercicios/fig01_02.corregida.salida.txt`), compiled with the usual command: all four lines came out `pagos, catálogo, reportes` (before), `pagos, catálogo, reportes` (after), `0`, and `sí`, and `npx eslint` exited cleanly. In the `revisor`, where would the review number and time actually come from? From data that changes over time, that is, from state; Lesson 2 introduces it.

### Solution 2

Measured upon running it (`ejercicios/fig01_03.ejercicio2.tsx` and its output in `ejercicios/fig01_03.ejercicio2.salida.txt`):

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

With the index, React creates nothing and **removes the last row**, the one born as `reportes`; the three remaining rows preserve their own state (that of the row born in that slot), but now render the name of their lower neighbor: the one born as `catálogo` says `pagos`, and so on. With index and name, the three remaining rows are recreated from scratch, because their indices changed. With the name, nothing is created: React removes the `catálogo` row and the other three remain the same. The most dangerous result is the first one, because it is invisible: the screen displays the correct names and the wrong state. The note the user typed for `pagos` would appear next to `inventario`, and nobody would notice until it was too late. The second at least “only” wipes work; the first shifts it to the wrong place.

### Solution 3

The expected outputs are `0 servicios revisados`, `1 servicio revisado`, and `4 servicios revisados`. One solution:

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

(The file and its output are in `ejercicios/textoRevisados.ts` and `ejercicios/textoRevisados.salida.txt`.)

Node 24 executes the `.ts` file directly, just like the practice server (Lesson 0). It can be tested without React because it is a pure function that knows nothing about React: it receives a number and returns a string. That is the advantage of separating calculation from presentation: what is calculated is tested with a `console.log`. Notice that `0` takes the plural form («0 servicios»), which is how it is phrased in Spanish. If you wanted to bring it into the `revisor`, the function would go in `resumen.ts`, alongside `textoFallas`, and `ResumenFallas` would call it; do not do this in your copy of the checkpoint, so that it continues to match the course's.

### Solution 4

With the empty list, `estados.length` is `0`, `0 && …` evaluates to `0`, and React renders the number. Verified with `renderToStaticMarkup` on a `<section>` with that same `&&` and an empty list (`ejercicios/solucion4.tsx` and `ejercicios/solucion4.salida.txt`):

```text
<section>0</section>
<section></section>
```

The first line is the teammate's version: a lonely `0` inside the section. The second is the correct version, with a boolean on the left: `{carga.reporte.estados.length > 0 && <ListaEstados estados={carga.reporte.estados} />}`. A design note for your logbook: an empty list, in the `revisor`, should not be displayed as “nothing”, but with a message stating that there are no services. That is the fourth state, “empty”, which Lesson 4 adds with its own copy.

## How I know I got it

- [ ] In `~/curso-react/revisor/`, `npm ci`, `npm run lint`, and `npm run build` finish with exit code 0, `npm run lint` reports no issues, and the build leaves in `dist/assets/` a file named `index-Dezp5bTH.js`.
- [ ] With the practice server and `npm run dev` running, `http://localhost:5173/` displays a card with heading “Estado de los servicios”, the line `4 servicios revisados · 2 servicios con falla` above the list, and the “Actualizar” button inside the card. The browser console has no React errors.
- [ ] You can point out, in the output of Figure 1, which lines are render and which are *commit*, and explain why the second render makes zero changes to the DOM.
- [ ] You found the three impurities in Figure 2 and know which one is caught by the linter, which by TypeScript with `readonly`, and which is only seen in the output.
- [ ] When temporarily defining a component inside `Panel`, `npm run lint` fails with `react-hooks/static-components`; when moving it outside, it passes again. (Restore the file when finished.)
- [ ] When copying `fig01_05.tsx` and changing `[2, 0]` to `[0]`, you predict before running it the two lines it prints, and the run proves you right: with `fallas &&` it produces `4 servicios revisados0`, and with `fallas > 0 &&`, `4 servicios revisados`. (This lesson's practice server does not have a zero-failure scenario; Lesson 8 tests it on the `revisor`.)
- [ ] You can explain, using the output of Figure 3, why the `revisor` uses `key={estado.nombre}` and why that is safe with the course's API.
- [ ] You wrote down in your [logbook](bitacora.md) the three impurities and how you found them, a component you split and what you gained, and a `0` that appeared on screen without being asked for.

## Summary

Answer without looking at the lesson:

1. What happens during render and what happens during *commit*? Why can React call your component without the screen changing?
2. What are the two conditions of a pure component? What is a local mutation and why is it allowed?
3. Name three typical impurities and, for each, which tool in the course detects it (or that none detects it).
4. What does a component receive in `children`? Why does `Tarjeta` live in `compartido/` and not in `reporte/`?
5. What happens to the state of rows if the `key` is the index and an item is inserted at the beginning? What if the `key` combines index and name?
6. Why can `{fallas && …}` render a `0`, and how do you write it so that does not happen?
7. Why does a component defined inside another lose its state on every render of the parent? What linter rule detects it?

## Further reading

- [React, “Render and Commit”](https://react.dev/learn/render-and-commit): the three steps of an update, recursive rendering, and why React only touches the DOM where there are differences. Accessed on October 21, 2026.
- [React, “Keeping Components Pure”](https://react.dev/learn/keeping-components-pure): the two conditions of purity, local mutation, `StrictMode`'s double render, and where side effects go. Accessed on October 21, 2026.
- [React, “Components and Hooks must be pure”](https://react.dev/reference/rules/components-and-hooks-must-be-pure): idempotency, `new Date()` and `Math.random()`, immutable props and state, effects outside of render. Accessed on October 21, 2026.
- [React, “Passing Props to a Component”](https://react.dev/learn/passing-props-to-a-component): `children` as a hole filled by the parent, and props as immutable snapshots. Accessed on October 21, 2026.
- [React, “Understanding Your UI as a Tree”](https://react.dev/learn/understanding-your-ui-as-a-tree): the render tree, made only of components. Accessed on October 21, 2026.
- [React, “Thinking in React”](https://react.dev/learn/thinking-in-react): splitting a UI into components by separation of concerns. Accessed on October 21, 2026.
- [React, “Rendering Lists”](https://react.dev/learn/rendering-lists): rules for `key`, the danger of index and on-the-fly keys, and where to derive them from. Accessed on October 21, 2026.
- [React, “Conditional Rendering”](https://react.dev/learn/conditional-rendering): the warning about numbers on the left of `&&`. Accessed on October 21, 2026.
- [React, “Your First Component”](https://react.dev/learn/your-first-component): never nest component definitions; capitalize component names. Accessed on October 21, 2026.
- [React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state): state tied to position in the tree and why a nested component loses it. Accessed on October 21, 2026.
- [React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components): the rule that detects components created during render. Accessed on October 21, 2026.
- [React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals) and [lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity): rules that detect changes to outside variables and impure functions during render. Accessed on October 21, 2026.
- [MDN, `MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver): what the figure 1 observer delivers: mutation records of the container. Accessed on October 21, 2026.
- [MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) and [`toSorted()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted): `sort` sorts in place; `toSorted` returns a new array. Accessed on October 21, 2026.
- [MDN, ARIA `region` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role): when a `<section>` is a region and how it is named. Accessed on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| render | the step in which React calls your component functions to determine what the screen should look like; it does not touch the DOM |
| *commit* | the step in which React applies to the DOM only the differences between the new render and the previous one |
| painting | what the browser does after the *commit*: drawing pixels |
| pure component | changes nothing that existed before it was called and, given the same inputs, returns the same output |
| local mutation | modifying an object or array that the component itself just created; it is allowed because nobody outside sees it |
| idempotent | returning the same result every time it is called with the same inputs |
| composition | building large components by combining pieces that do not know each other |
| `children` | the prop where a component receives content nested between its opening and closing tags |
| fragment (`<>…</>`) | a way to return multiple sibling elements without wrapping them in an additional DOM element |
| `key` | the hint React uses to match elements in a list across renders; unique among siblings and stable |
| region | a named area of the page that a screen reader can navigate to; a `<section>` with an accessible name is one |

---

**Next:** [Lesson 2 — State: snapshot, immutability, and shape](02-estado-instantanea-forma.md)
