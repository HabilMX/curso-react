# Lesson 9 — Performance, publishing, and when to use a framework

*It is 5:40 PM on a Friday and the `revisor` goes live at 6:00 PM on the operations team's server. In the project channel there are three unanswered messages. The first: "the dashboard feels slow, shall we put `useMemo` on everything before publishing?". The second, from whoever prepared the server: "I open `/servicios/pagos` and it works, but if I reload the page I get a 404". The third, from someone who wanted the dashboard to ask "almost never" in the test environment: they set `VITE_CADA_MS=2147483648`, and the API log filled up with requests, one every three tenths of a second. Nobody measured anything. There are twenty minutes and three different opinions about what to do. This lesson does what was missing: measure first, then decide, and publish with a server that knows what a client route is.*

**Time:** 2 × 45 min (the natural break is between sections 9.2 and 9.3)

**What you build:** the `revisor` measured, optimized, and published: the React compiler enabled in the build, a publishing server of its own that serves `dist/` with a rewrite to `index.html`, a content security policy and correct caching, and five fixes that came out of measuring the dashboard, each with the test that goes red before the fix and green after

**What you learn:** measuring with the Profiler **before** memoizing; structure first; React Compiler 1.0; `vite build` and why `vite preview` is not a production server; rewriting to `index.html`; `VITE_` without secrets; an XSS refresher; Server Components and Server Functions: what they are and why this dashboard does not use them; when it makes sense to migrate to a framework

**Where you are coming from.** From the checkpoint of [Lesson 8](08-pruebas-de-componentes.md): a `revisor` with four screens (the list at `/`, the detail at `/servicios/:nombre`, the registration at `/servicios/nuevo`, and the "not found" page), server data in TanStack Query, notices and preferences in context, an accessible form, and a suite of 27 tests in 7 files that turn red when someone reverts a fix. All of that works in `npm run dev`. What has not been done is the question at the end: how fast is it, and how is it delivered to whoever is going to use it?

**What this lesson does not do.** It adds no screens and changes nothing about what the dashboard does. It uses no `useMemo`, `useCallback`, or `memo` in the `revisor`: the measurement did not ask for them, and section 9.1 explains why. It does not migrate the dashboard to a framework or set up Server Components: section 9.3 explains what they are and why this dashboard does not need them. It does not configure a production web server such as nginx or Caddy: it writes a small one in Node so each decision stays in view, and names what a real server adds. And it is not a security course: it reviews the two defenses the dashboard already had against code injection (React and the linter) and adds the third, the content security policy.

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions in this lesson's `package.json`. The checkpoint was installed from scratch with `npm ci` in a copy outside the repository, identical file by file to the checkpoint, and there `npm run lint`, `npm test`, and `npm run build` finished with code 0: 35 out of 35 tests in 11 files (read from Vitest's summary), `dist/assets/index-Cs1CcfeN.js` (the bundle name and the outputs of 9.1 and 9.2 were measured again on October 22, 2026, on macOS) and `dist/assets/index-CbqUABMA.css`. Vitest's outputs were taken with `--reporter=default`, which is what you see in your terminal. The five fixes in 9.4 are already in the checkpoint. Their red phase was measured in a **copy** of the checkpoint without the fixes, called `rojo`, and that is why that output says `~/curso-react/rojo`; the green phase, in the checkpoint. What is seen "in the browser" was measured with headless Chrome (`--headless`): the DOM of `/servicios/pagos` with `--dump-dom` and, for polling and retries, opening the page for a few seconds while the practice API logged each request. Those runs used ports 3109 (API), 4109 (preview and published server), and 5109 (development) instead of 3100, 4173, 4180, and 5173, because other things were running on the machine at the same time; to point the development *proxy* at 3109, `vite.config.ts` was changed in the copies, not in the original. The outputs show the ports that were really used; you will use the course's. The figures are in [`programas/09-rendimiento-publicacion/`](../programas/09-rendimiento-publicacion), next to `revisor/`, with their own `package.json`: they are compiled with `tsc` and run with `node`, as in the earlier lessons, and add `@babel/core`, `babel-plugin-react-compiler`, and `@types/convert-source-map`, which are installed in `~/curso-react/figuras/` with `npm install --save-dev --save-exact @babel/core@8.0.7 babel-plugin-react-compiler@1.0.0 @types/convert-source-map@2.0.3` (the last because the types of `@babel/core` 8.0.7 import it and `tsc --strict` without `skipLibCheck` does not compile without it). **Archived outputs.** Next to the figures, in `programas/09-rendimiento-publicacion/`, are the outputs of this lesson that can be repeated with a command, rerun when it was reviewed: `build.salida.txt`, `build-sin-compilador.salida.txt`, `secretos.grep.txt` (the compiler's marks and the search in 9.2.4), `preview.curl.txt`, `publicado.curl.txt`, and `suite.vitest.txt`. Only the times and the header dates change. **They are not archived**, and are measured in a single run of the lesson with no copy in `programas/`: the red phase of 9.4 (it needs a copy without the fixes), the logs and the DOM dump measured with Chrome (9.2.3, 9.4.1, and 9.4.3), the build with fake keys from 9.2.4, and the ESLint output in "The error you will see".

The checkpoint was also installed from scratch in a Linux container (Debian 12, official `node:24.22.0-bookworm` image): `npm run build` produced the same filename and `npm test` finished with code 0 and `Tests  35 passed (35)`. After the last change to `PaginaServicio` (keeping the old detail if a refresh fails), the following were repeated on macOS against the new checkpoint: the two builds of 9.1.6, the searches in `dist/` from 9.1.6 and 9.2.4, the `curl` responses and the log from 9.2.2 and 9.2.3, the published DOM dump, and the build with fake keys. It was not run on a real Linux Mint; nothing shown depends on the system. The times in the servers' logs are in UTC; Vitest's (`Start at`), in the machine's local time. **What was not measured**, and is said where it appears: the Profiler of React's developer tools, which is read with the eyes, and the published dashboard behind a production web server. Long paths are shown starting from `~/curso-react`.

## By the end you will be able to

- Measure with `<Profiler>` how many times a part of the tree renders and how long it takes, and decide with that number whether optimization is needed.
- Remove additional renders by changing the **structure** (moving state down, passing JSX as `children`) before thinking of memoizing (saving the result of a computation or a render to reuse it as long as its inputs do not change), and show with the measurement that it worked.
- Enable React Compiler 1.0 in a Vite project, read the code it produces, and check in `dist/` that it took effect.
- Explain why `vite preview` is not a production server, and check with `curl` that the publishing server rewrites client routes to `index.html`, sends the content security policy, and caches each file correctly.
- Search for secrets in `dist/` and **read** the result, telling a match from a leak.
- Explain what Server Components and Server Functions are, why the `revisor` does not use them, and what signals would say it is time to migrate to a framework.
- Write, for a defect found while measuring, the test that goes red before the fix and green after.

## The why before the how

The scene's three messages are three different questions, and all three have the same trap: they can be answered with an opinion.

**"It feels slow".** What is slow? The first render, typing in a field, changing page, the API's response? In the `revisor`, the practice API takes 300 ms to answer the report and 1.5 s the `pagos` detail, on purpose. If that is what "feels" slow, no `useMemo` fixes it, because the time is not spent in React. And if the time is spent in React, you need to know **in which component** and **how many times**, because memoizing the wrong component adds code and removes nothing. React comes with a tool to measure it and the documentation asks to use it before memoizing. This lesson uses it.

**"If I reload I get a 404".** In Lesson 5 you saw why: `/servicios/pagos` is not a file, it is a route that React Router decides in the browser. While you navigate inside the application, the server never finds out. When you reload, the browser asks the server for `/servicios/pagos`, and a file server that knows nothing about client routes answers what is true for it: that file does not exist. Vite's preview already solves it, and that is confusing, because it makes you think "in production it will work the same". Vite's documentation says the opposite: the preview is not a production server. Whoever publishes has to decide what each address answers.

**"I put in a big number and the log filled up".** That is not a performance problem: it is a defect. `leerCadaMs` accepts any positive integer, and a number that looked like "almost never" ended up as "all the time". Nobody saw it until someone measured it. Section 9.4 gathers five defects like this one, found while measuring the dashboard for this lesson, and closes them with Lesson 8's habit: first the red test, then the fix, then the green test.

There are three new concepts: measuring and letting the compiler memoize (9.1), publishing what `vite build` leaves in `dist/` (9.2), and knowing when the dashboard would need a React server (9.3). Section 9.4 is the harvest.

## The concepts

### 9.1 Measure before memoizing

#### 9.1.1 What an additional render costs

When a component's state changes, React renders it again (calls the function again), and with it all the components it renders inside, even if their props did not change. You saw it in Lesson 1: rendering is computing a tree, and then React compares that tree with the previous one and only touches the DOM where there were differences. Almost always that is cheap. A component that returns four `<li>`s renders in microseconds, and rendering it ten times too many is not noticeable.

It becomes noticeable when two things come together: an **expensive** component (a list of thousands of rows, a heavy computation, a chart) and a state that changes **often** (every keystroke, every mouse movement) and lives **above** it. The `memo` documentation says it in a sentence worth memorizing: optimizing with `memo` is only worth it when the component re-renders often with exactly the same props and its render is expensive; if there is no perceptible lag, `memo` is superfluous ([React, `memo`](https://react.dev/reference/react/memo)). Both conditions are measured. Neither is guessed.

#### 9.1.2 `<Profiler>`: measuring with a program

React comes with a component for measuring: `<Profiler>`. You wrap a part of the tree, give it an `id` and an `onRender` function, and React calls that function every time that part of the tree commits. The documentation lists what it receives ([React, `<Profiler>`](https://react.dev/reference/react/Profiler)):

- `id`: the `<Profiler>`'s, to know which one it was if you have several;
- `phase`: `"mount"` the first time; `"update"` when it re-rendered because of a change in props, state, or hooks; and `"nested-update"`, a case that does not appear in this lesson;
- `actualDuration`: the milliseconds spent rendering that subtree in this update; according to the documentation, it should ideally drop a lot after mount if memoization works;
- `baseDuration`: an estimate of how long rendering the whole subtree would take without any optimization; comparing it with `actualDuration` tells whether memoization helps;
- `startTime` and `commitTime`: timestamps.

A warning from the same page: measuring has a cost, so **the Profiler is disabled in the production build**. You measure in development, or with a special React build that enables it.

Figure 1 reproduces the first message's scene with a minimal dashboard. It has a field for typing a note and a list that takes 20 ms to render; the cost is on purpose, so it can be seen. The figure measures the list with a `<Profiler>` while "typing" the word `caído`, five keystrokes, in two versions of the dashboard. In version A, the note's draft lives in the dashboard, which is the list's parent. In version B, the draft moves down to a component of its own, `CampoNota`, the only one that uses it.

```tsx
// fig09_01.tsx
import { JSDOM } from "jsdom";
import { act, Profiler, useState, type ProfilerOnRenderCallback } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");

const SERVICIOS = ["catálogo", "pagos", "inventario", "reportes"];

// Gasta tiempo sin hacer nada útil: simula un dibujo caro. Sigue siendo impuro (lee el
// reloj); el linter no lo ve porque está en otra función. Se acepta solo porque no
// produce nada que se dibuje: nunca escondas así una impureza de verdad.
function gastar(ms: number): void {
  const hasta = performance.now() + ms;
  while (performance.now() < hasta) {
    // espera activa
  }
}

// Una lista que tarda 20 ms en dibujarse: el costo es a propósito, para que se vea.
function ListaLenta() {
  gastar(20);
  return (
    <ul>
      {SERVICIOS.map((nombre) => (
        <li key={nombre}>{nombre}</li>
      ))}
    </ul>
  );
}

// Lo que mide el Profiler: cuántos dibujos hubo de la lista y cuánto tardaron.
const medidas: { fase: string; ms: number }[] = [];
const anotar: ProfilerOnRenderCallback = (_id, fase, duracionReal) => {
  medidas.push({ fase, ms: duracionReal });
};

function ListaMedida() {
  return (
    <Profiler id="lista" onRender={anotar}>
      <ListaLenta />
    </Profiler>
  );
}

// A. El borrador de la nota vive en el panel: cada tecla dibuja el panel completo.
function PanelArriba() {
  const [borrador, establecerBorrador] = useState("");
  return (
    <>
      <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />
      <ListaMedida />
    </>
  );
}

// B. Estructura primero: el borrador baja al único componente que lo usa.
function CampoNota() {
  const [borrador, establecerBorrador] = useState("");
  return <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />;
}

function PanelAbajo() {
  return (
    <>
      <CampoNota />
      <ListaMedida />
    </>
  );
}

function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function medir(titulo: string, Panel: () => React.ReactNode): Promise<void> {
  medidas.length = 0;
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(<Panel />));
  const campo = contenedor.querySelector("input");

  if (campo === null) {
    throw new Error("no hay campo");
  }

  let texto = "";
  for (const letra of "caído") {
    texto += letra;
    await act(async () => escribir(campo, texto));
  }

  const fases = medidas.map((medida) => medida.fase).join(", ");
  const lentas = medidas.filter((medida) => medida.ms >= 20).length;
  console.log(titulo);
  const veces = medidas.length === 1 ? "1 vez" : `${medidas.length} veces`;
  console.log(`  5 teclas → la lista se dibujó ${veces}: ${fases}`);
  console.log(`  dibujos de la lista que tardaron 20 ms o más: ${lentas}`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await medir("A. el borrador vive en el panel:", PanelArriba);
await medir("B. el borrador vive en CampoNota:", PanelAbajo);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_01.tsx
$ node fig09_01.js
A. el borrador vive en el panel:
  5 teclas → la lista se dibujó 6 veces: mount, update, update, update, update, update
  dibujos de la lista que tardaron 20 ms o más: 6
B. el borrador vive en CampoNota:
  5 teclas → la lista se dibujó 1 vez: mount
  dibujos de la lista que tardaron 20 ms o más: 1
```

Read the two measurements calmly, because they say more than they seem to:

- **In version A**, five keystrokes produced six renders of the list: the mount and one per keystroke. Each took as long as the list takes, 20 ms or more. The list never changed (it is always the same four services), but it rendered again because its parent changed state. If the list took 200 ms, each keystroke would freeze the screen for a fifth of a second: that is "feels slow".
- **In version B**, the list rendered once, at mount. Typing changed `CampoNota`'s state, and React only rendered `CampoNota` again, because the list is not its child. There was no `memo`, no `useMemo`, no compiler: there was a state put in the right place.

Notice the detail of `gastar`: the wait lives in a separate function. The figure's first version had it inside `ListaLenta`, and the linter rejected it. Moving it **does not make it pure**: `gastar` still reads the clock during rendering, and the linter no longer sees it only because it does not check inside the functions you call. It is accepted here because the figure simulates a cost and renders nothing that depends on the clock; the code's comment says so. You will see it in full in "The error you will see".

#### 9.1.3 The developer tools' Profiler

`<Profiler>` is for measuring with a program. To look at a whole application there is the **Profiler** tab of React's developer tools (React Developer Tools, the browser extension). It records what happens while you use the page and draws each commit as a bar chart: which components rendered, how long each took and, if you enable the option to record why each component rendered, the cause (a prop changed, state changed, a hook changed, the parent rendered). The `memo` documentation sends you there when an interaction still feels slow: use the Profiler to see which components would benefit most from memoizing, and memoize only those ([React, `memo`](https://react.dev/reference/react/memo)).

This measurement was **not run for the lesson**: the extension's Profiler is read with the eyes, and an automated run cannot verify it. The step-by-step to do it yourself is in exercise 1, and the way to know whether you succeeded, in "How I know I succeeded".

#### 9.1.4 Structure first

Figure 1's version B is no trick: it is the second of five recommendations that the `memo` documentation gives to make most memoization unnecessary ([React, `memo`](https://react.dev/reference/react/memo)). The five, with what they mean in the `revisor`:

1. **If a component visually wraps others, have it receive them as `children`.** When the wrapper changes its own state, React knows the children that arrived as `children` do not need to render again, because another component created them. It is `Tarjeta`, since Lesson 1.
2. **Prefer local state and do not lift it more than necessary.** A note's draft belongs to `EditorNota`, not to the page; since Lesson 2 it lives there, and that is why typing a note does not render the list. Figure 1 is this point, measured.
3. **Keep rendering pure.** If rendering again causes a visible problem, it is a defect of the component and is fixed, not covered up with memoization. All of Lesson 1 is about this.
4. **Avoid Effects that only update state.** The documentation says most performance problems in React applications come from chains of updates that start in Effects and render components over and over. Lesson 3 taught you to recognize the Effects that are not needed.
5. **Remove unnecessary dependencies from Effects.** With TanStack Query, since Lesson 4, the dashboard no longer has Effects of its own for fetching data.

That is why the course put `useMemo` in no lesson. It was not an oversight: every time the temptation appeared, the structure had already removed the additional render. The principle that runs through the course, "first you measure and then you optimize", does not say "never memoize"; it says memoization is a tool with a cost (code that is harder to read, dependencies you have to keep up to date and that can break it) and that measurement decides when that cost is worth it.

#### 9.1.5 React Compiler 1.0: the memoization you do not write

There is one more path, and the checkpoint takes it. React Compiler is a build tool that memoizes components and hooks on its own: it reads your code, understands React's rules, and writes the equivalent of `memo`, `useMemo`, and `useCallback` where they are needed ([React, "Introduction to React Compiler"](https://react.dev/learn/react-compiler/introduction)). Its first stable version, 1.0, came out on October 7, 2025; the announcement says it has already been tested on Meta's large applications and is ready for production ([React, "React Compiler v1.0"](https://react.dev/blog/2025/10/07/react-compiler-1)). For new code, the documentation recommends leaving memoization to the compiler and using `useMemo` or `useCallback` where precise control is needed, for example a memoized value that is an Effect's dependency.

In a Vite project it is enabled as a Babel *preset*. The installation documentation gives exactly this form for `@vitejs/plugin-react` 6 or later ([React, "Installation"](https://react.dev/learn/react-compiler/installation)), and it is the checkpoint's main configuration change (the `css` lines inside `test` are explained in 9.4.4):

```ts
// revisor/vite.config.ts
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3100",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/pruebas/preparar.ts"],
    // Sin esto, Vitest entrega cada .css como un texto vacío, también con `?raw`,
    // y la prueba de la hoja de estilos pasaría sin haber leído nada.
    css: { include: [/panel\.css/] },
  },
});
```

With three new development dependencies, pinned to exact versions: `@rolldown/plugin-babel` 0.2.4 (the *plugin* that runs Babel inside Vite's build), `@babel/core` 8.0.7, and `babel-plugin-react-compiler` 1.0.0. They are installed from `~/curso-react/revisor/`:

```bash
npm install --save-dev --save-exact @rolldown/plugin-babel@0.2.4 @babel/core@8.0.7 babel-plugin-react-compiler@1.0.0
```

In `package.json` two more things change: `"version": "0.9.0"`, as in every lesson, and the new script from 9.2.3, `"publicado": "node servidor/publicar.ts"`. The `@vitejs/plugin-react` README also mentions a native path, without Babel, but marks it as experimental, and the checkpoint does not use it.

What does the compiler write? Figure 2 asks it directly. It gives Babel, with the compiler's *plugin*, figure 1's dashboard A as text, and also a component that breaks a React rule: it mutates an object it received as a prop.

```ts
// fig09_02.ts
import { transformAsync } from "@babel/core";

// El panel A de la figura 1, tal cual, como texto: lo que el compilador recibe.
const panel = `
function PanelArriba() {
  const [borrador, establecerBorrador] = useState("");
  return (
    <>
      <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />
      <ListaMedida />
    </>
  );
}
`;

// Un componente que rompe una regla de React: cambia un objeto que recibió como prop.
const impuro = `
function FilaContada({ estado }) {
  estado.vecesDibujada = (estado.vecesDibujada ?? 0) + 1;
  return <li>{estado.nombre}</li>;
}
`;

async function compilar(titulo: string, codigo: string): Promise<void> {
  const resultado = await transformAsync(codigo, {
    filename: "panel.jsx",
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["jsx"] },
    plugins: [["babel-plugin-react-compiler", {}]],
  });
  console.log(`=== ${titulo}`);
  console.log(resultado?.code ?? "(sin salida)");
}

await compilar("el panel A, compilado", panel);
await compilar("un componente impuro, compilado", impuro);
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_02.ts
$ node fig09_02.js
=== el panel A, compilado
import { c as _c } from "react/compiler-runtime";
function PanelArriba() {
  const $ = _c(6);
  const [borrador, establecerBorrador] = useState("");
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = e => establecerBorrador(e.target.value);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] !== borrador) {
    t1 = <input aria-label="Nota" value={borrador} onChange={t0} />;
    $[1] = borrador;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <ListaMedida />;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1) {
    t3 = <>{t1}{t2}</>;
    $[4] = t1;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}
=== un componente impuro, compilado
function FilaContada({
  estado
}) {
  estado.vecesDibujada = (estado.vecesDibujada ?? 0) + 1;
  return <li>{estado.nombre}</li>;
}
```

The compiled dashboard reads from top to bottom:

- `const $ = _c(6)` asks React for a cache of six slots for this component. `_c` comes from `react/compiler-runtime`, which React 19 already carries.
- The `onChange` function (`t0`) is created only once: slot `$[0]` starts with a special value, `Symbol.for("react.memo_cache_sentinel")`, meaning "still empty"; the first time the function is stored and the following times it is reused. It is a `useCallback` you did not write.
- The `<input>` (`t1`) is only created again if `borrador` changed.
- `<ListaMedida />` (`t2`) is created **only once**, because it depends on nothing. When React finds in the new tree exactly the same element as in the previous one, it does not render that component again. The compiler achieved the same as figure 1's version B, without moving the state.

The second result is just as important: **the impure component came out untouched**. There is no `_c`, no cache, no warning. The documentation explains it: when the compiler finds code that could break React's rules, it skips the optimization instead of risking changing your application's behavior ([React, "Debugging and Troubleshooting"](https://react.dev/learn/react-compiler/debugging)). The compiler does not fix an impure component; it leaves it as it was, and the one that detects it is the linter, which since `eslint-plugin-react-hooks` 7 carries the compiler's rules in its recommended configuration.

#### 9.1.6 Checking that the compiler took effect in the `revisor`

A configuration that does not fail does not prove that something works. The installation documentation suggests two checks: the "Memo ✨" badge next to components in the developer tools, and searching the built code for the logic the compiler adds. The second can be run. This is the checkpoint's build:

```text
$ npm run build
> revisor@0.9.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 193 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-CbqUABMA.css    1.27 kB │ gzip:   0.59 kB
dist/assets/index-Cs1CcfeN.js   374.65 kB │ gzip: 117.28 kB

✓ built in 282ms
```

And this one, that of an identical copy with a single difference: in `vite.config.ts`, `plugins: [react()]`, without the compiler.

```text
$ npx vite build
...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-CbqUABMA.css    1.27 kB │ gzip:   0.59 kB
dist/assets/index-DuGgkiHN.js   367.32 kB │ gzip: 114.56 kB
```

The same test, done before the five fixes of 9.4, gave without the compiler `index-WLyq37jn.js`: the same name that checkpoints 7 and 8 produced back then, because up to there the application's code was identical to those lessons', byte for byte. Since that measurement, checkpoints 7, 8, and 9 changed one condition in `PaginaServicio` (keeping the old detail if a refresh fails), and 7 and 8 are now called `index-C_lOH5GL.js`; the comparison with the pre-fix 9 was not repeated. Now the compiler's marks are counted in each:

```text
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # con el compilador
      18
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # sin el compilador
       1
```

Without the compiler there is one, which comes from React DOM: it is the constant `Symbol.for("react.memo_cache_sentinel")` with which React marks, internally, a still-empty cache (measured: it appears in `react-dom-client.production.js` and not in React's `compiler-runtime`, which only requests the cache). With the compiler there are 18: that same one plus 17 that the compiler added, one for each value it stores the first time and never computes again because it depends on nothing, like `t0` and `t2` in figure 2. It is not the count of slots: in this bundle the compiler requested 24 caches (24 calls to `c(…)`, figure 2's `_c` already minified) with 255 slots in total, measured by adding up their arguments. To know whether it took effect, it is enough for the number to go up. A measurement warning: `grep -c` does **not** work for this, because it counts **lines** with matches and not matches, and minified JavaScript has almost everything on a few lines. Measured on the same file, `grep -c memo_cache_sentinel` says `2`: the 18 marks are on two lines. A number that comes out without error is not a correct number.

And one more count, which the documentation will not give you: memoization is not free, not even in bytes. The bundle grew from 367.32 kB to 374.65 kB (from 114.56 to 117.28 kB compressed): 7.33 kB more code that runs on every render to decide what to reuse. In the `revisor`, where no component is expensive, that is almost surely a small loss, not a gain; the checkpoint enables it because the course plan asks to teach the compiler and because the 35 tests pass the same with it, not because a measurement asked for it. **That is a judgment call, and it is said as such.** In an application with long lists or fine-grained interactions, the account reverses, and the 1.0 announcement reports improvements of up to 12% in loads and navigations in Meta applications ([React, "React Compiler v1.0"](https://react.dev/blog/2025/10/07/react-compiler-1)).

### 9.2 Publishing

#### 9.2.1 What is left in `dist/`

`npm run build` does two things, in order: `tsc -b`, which checks the types and generates no JavaScript (it only leaves a state file in `node_modules/.tmp/` so the next check is faster), and `vite build`, which bundles. What is left in `dist/` is three files: an `index.html` that points to a JavaScript and a stylesheet, and those two in `dist/assets/`, with a piece of their content in the name (`Cs1CcfeN`, `CbqUABMA`). That piece changes every time the content changes, and it is what allows aggressive caching: the browser can store `index-Cs1CcfeN.js` for a whole year, because if the code changes, the new file will be named differently. The one that **cannot** be stored without asking is `index.html`, which is the one that says which files apply today.

`dist/` is everything that gets published. There is no React server, or Node, or anything that runs on the server side: they are static files. Vite's documentation puts it this way: you can deploy the `dist` folder on the platform of your choice ([Vite, "Deploying a Static Site"](https://vite.dev/guide/static-deploy)). What that sentence does not say is what that platform has to do, and that is where the problems begin.

#### 9.2.2 `vite preview` is not a production server

`npm run preview` starts a server that serves `dist/` on port 4173. Vite's documentation is explicit about what for: it is for previewing the build on your machine and it is **not meant as a production server** ([Vite, "Deploying a Static Site"](https://vite.dev/guide/static-deploy)). In Lesson 5 you saw that it does return `index.html` when you reload a client route. So what is it missing? It is measured. Three questions to the checkpoint's preview:

```text
$ npx vite preview --port 4109 --strictPort
$ curl -sI http://localhost:4109/servicios/pagos
HTTP/1.1 200 OK
Vary: Origin
Content-Type: text/html
Cache-Control: no-cache
Etag: W/"188-NTjMluUw3sCMmwdKb29psG22o7w"
Date: Thu, 22 Oct 2026 19:29:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4109/assets/no-existe.js
200 text/html
$ curl -sI http://localhost:4109/assets/index-Cs1CcfeN.js | grep -i "cache-control\|content-type"
Content-Type: text/javascript
Cache-Control: no-cache
```

Three findings, and none is a Vite bug, because the preview promises none of this:

1. **There is no content security policy.** The response carries no `Content-Security-Policy`. If someday foreign HTML sneaks into the page (9.2.5), the browser has no rule for refusing to run it.
2. **A file that does not exist answers `200` with HTML.** You asked for `/assets/no-existe.js` and the preview gave you `index.html`. Imagine you publish a new version while someone has the old one open, and their page requests a JavaScript that is no longer there: instead of a clear `404`, the browser receives HTML where it expected JavaScript and fails with a content type error nobody understands. The rewrite is right for client routes and wrong for files.
3. **The JavaScript with a content name is not cached.** `no-cache` on `index-Cs1CcfeN.js` forces the browser to ask every time, even though that file can never change.

#### 9.2.3 The `revisor`'s publishing server

The checkpoint carries a server of its own, `servidor/publicar.ts`, 146 lines long, that serves `dist/` and resolves exactly those three things. It is not for you to use as is in production: it is for you to see each decision that a real server (nginx, Caddy, your hosting platform's) has to make, written in a language you already read. It is started with a new script, `"publicado": "node servidor/publicar.ts"`, on port 4180, and forwards `/api/*` to the practice API, like Vite's development *proxy*.

```ts
// revisor/servidor/publicar.ts
// Servidor de la versión publicada del `revisor` (Lección 9). Sirve lo que
// `npm run build` dejó en dist/, con tres cosas que `vite preview` no garantiza:
//   1. Reescritura: una ruta del cliente (/servicios/pagos) responde index.html.
//   2. Encabezados de seguridad: CSP sin 'unsafe-inline' y nosniff.
//   3. Una lista CERRADA de archivos: solo se entrega lo que había en dist/ al
//      arrancar; ninguna ruta que escriba el cliente se convierte en una ruta de disco.
// Las peticiones a /api se reenvían a la API (API_URL), como hacía el proxy de Vite.
import { readdir, readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PUERTO = Number(process.env.PUERTO ?? "4180");
const API_URL = process.env.API_URL ?? "http://127.0.0.1:3100";
const RAIZ = fileURLToPath(new URL("../dist/", import.meta.url));

const TIPOS: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const POLITICA = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "img-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

function registrar(linea: string): void {
  console.log(`${new Date().toISOString().slice(11, 23)} ${linea}`);
}

async function listarArchivos(carpeta: string): Promise<Map<string, Buffer>> {
  const archivos = new Map<string, Buffer>();
  const entradas = await readdir(carpeta, { recursive: true, withFileTypes: true });

  for (const entrada of entradas) {
    if (entrada.isFile()) {
      const ruta = join(entrada.parentPath, entrada.name);
      archivos.set(`/${relative(carpeta, ruta).split(sep).join("/")}`, await readFile(ruta));
    }
  }

  return archivos;
}

function enviar(
  respuesta: ServerResponse,
  codigo: number,
  tipo: string,
  cuerpo: Buffer | string,
  cache: string,
): void {
  respuesta.writeHead(codigo, {
    "content-type": tipo,
    "cache-control": cache,
    "content-security-policy": POLITICA,
    "x-content-type-options": "nosniff",
  });
  respuesta.end(cuerpo);
}

const archivos = await listarArchivos(RAIZ);
const indice = archivos.get("/index.html");

if (indice === undefined) {
  registrar("no existe dist/index.html: corre `npm run build` antes de `npm run publicado`");
  process.exit(1);
}

const servidor = createServer((solicitud, respuesta) => {
  const url = new URL(solicitud.url ?? "/", "http://revisor.local");
  const metodo = solicitud.method ?? "?";

  respuesta.once("finish", () => registrar(`${metodo} ${url.pathname} ${respuesta.statusCode}`));

  if (url.pathname.startsWith("/api/")) {
    const cuerpo = metodo === "GET" || metodo === "HEAD" ? undefined : solicitud;

    fetch(new URL(url.pathname + url.search, API_URL), {
      method: metodo,
      headers: { "content-type": solicitud.headers["content-type"] ?? "application/json" },
      body: cuerpo,
      duplex: "half",
    } as RequestInit)
      .then(async (deLaApi) => {
        respuesta.writeHead(deLaApi.status, {
          "content-type": deLaApi.headers.get("content-type") ?? "application/json",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        respuesta.end(Buffer.from(await deLaApi.arrayBuffer()));
      })
      .catch(() => {
        respuesta.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        respuesta.end(JSON.stringify({ detalle: "la API no responde" }));
      });
    return;
  }

  if (metodo !== "GET" && metodo !== "HEAD") {
    respuesta.writeHead(405, { allow: "GET, HEAD" });
    respuesta.end();
    return;
  }

  const archivo = archivos.get(url.pathname);

  if (archivo !== undefined && url.pathname !== "/index.html") {
    const inmutable = url.pathname.startsWith("/assets/");
    enviar(
      respuesta,
      200,
      TIPOS[extname(url.pathname)] ?? "application/octet-stream",
      archivo,
      inmutable ? "public, max-age=31536000, immutable" : "no-cache",
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    enviar(respuesta, 404, "text/plain; charset=utf-8", "no existe", "no-store");
    return;
  }

  // Reescritura: cualquier otra ruta es del cliente, y la decide React Router.
  enviar(respuesta, 200, TIPOS[".html"] ?? "text/html", indice, "no-cache");
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  registrar(`revisor publicado en http://127.0.0.1:${PUERTO} (API en ${API_URL})`);
});

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    servidor.close(() => registrar("servidor detenido"));
    servidor.closeAllConnections();
  });
}
```

What to understand, decision by decision:

- **The path of `dist/` comes from `fileURLToPath`.** `import.meta.url` is a `file:///…` address, and the `pathname` property of a `URL` leaves spaces and accents encoded (`Mis%20cursos`), which are not a disk path: with your folder at `~/Mis cursos/` the server would fail with `ENOENT` without saying why. `fileURLToPath` ([Node.js, `url`](https://nodejs.org/api/url.html#urlfileurltopathurl)) decodes. It was measured: with the server copied to a folder called "con espacios y acentós", `pathname` does not find `dist/` and `fileURLToPath` does.
- **A closed list of files.** At startup, `listarArchivos` reads **all** of `dist/` into memory, in a `Map` whose key is the public path (`/assets/index-Cs1CcfeN.js`). After that, no request touches the disk: the server looks the address up in the `Map` and, if it is not there, it does not exist. That way, no address someone writes (`/../../etc/passwd`, for example) becomes a file path. It is the simplest defense against directory traversal, because the attack has nowhere to apply.
- **The rewrite, with one exception.** Any address that is not a file answers `index.html`, so React Router decides; **except** those that start with `/assets/`, which answer `404`. There, a missing file is indeed an error and it says so.
- **The content security policy.** `default-src 'none'` forbids everything, and each following directive opens only what is needed: scripts, styles, images, and connections from the same origin (`'self'`), forms that only submit to the same origin, no `<base>` tag, and no site that can put the dashboard in an `<iframe>`. There is no `'unsafe-inline'`: a `<script>` written inside the HTML does not run. Vite's build puts no inline script in `index.html`, and that is why this policy does not break the dashboard.
- **`nosniff`.** It tells the browser to believe the `content-type` the server declares and not to try to guess it from the content.
- **Caching by file type.** `/assets/*` carries `public, max-age=31536000, immutable`: a year, and the promise that it will not change. `index.html` carries `no-cache`: the browser may store it, but has to ask before using it. This server sends no `ETag` or `Last-Modified`, so that "question" always ends in a full download: it is 392 bytes and does not matter; a production server adds the validator and answers `304` when the file did not change.

With the practice API and the publishing server on, six questions:

```text
$ PUERTO=3109 npm run servidor
$ PUERTO=4109 API_URL=http://127.0.0.1:3109 npm run publicado
$ curl -sI http://127.0.0.1:4109/servicios/pagos
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
cache-control: no-cache
content-security-policy: default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
x-content-type-options: nosniff
Date: Thu, 22 Oct 2026 19:29:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4109/assets/no-existe.js
404 text/plain; charset=utf-8
$ curl -sI http://127.0.0.1:4109/assets/index-Cs1CcfeN.js | grep -i cache-control
cache-control: public, max-age=31536000, immutable
$ curl -s --path-as-is -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4109/../../etc/passwd
200 text/html; charset=utf-8
$ curl -s -X POST -H "content-type: application/json" -d '{"nombre":"correo","url":"https://correo.example/","timeoutMs":1500}' -w " → %{http_code}\n" http://127.0.0.1:4109/api/servicios
{"nombre":"correo","tipo":"disponible","codigoHttp":200,"duracionMs":75} → 201
$ curl -sI http://127.0.0.1:4109/favicon.ico | head -3
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
cache-control: no-cache
```

The first is the scene's reload, resolved: `200` with `index.html`, the policy, and `no-cache`. The second is the missing file: `404`, no longer HTML in disguise. The third, the long cache. The fourth deserves a careful reading: `--path-as-is` asks `curl` **not** to clean up the `..` and to send them as they are, as someone trying to get out of the folder would. The server answered `200` with `index.html`, not with the system file. The server's log says why:

```text
19:29:32.997 revisor publicado en http://127.0.0.1:4109 (API en http://127.0.0.1:3109)
19:29:34.967 HEAD /servicios/pagos 200
19:29:34.976 GET /assets/no-existe.js 404
19:29:34.985 HEAD /assets/index-Cs1CcfeN.js 200
19:29:34.992 GET /etc/passwd 200
19:29:35.314 POST /api/servicios 201
19:29:35.322 HEAD /favicon.ico 200
19:29:36.676 GET /servicios/pagos 200
19:29:36.683 GET /assets/index-CbqUABMA.css 200
19:29:36.684 GET /assets/index-Cs1CcfeN.js 200
19:29:36.720 GET /favicon.ico 200
19:29:38.213 GET /api/servicios/pagos 200
```

`new URL()` normalized `/../../etc/passwd` to `/etc/passwd`, which is not in the `Map`, so it is "a client route" and answers `index.html`. Two defenses on top of each other: URL normalization and the closed list. And the fifth question, the registration `POST`, reached the API through the forwarding with its `201`. The sixth, `/favicon.ico`, you will need in exercise 3; do not read it yet.

The log's last five lines are headless Chrome opening `/servicios/pagos` on the published server: it requests the page, the stylesheet, the JavaScript, and the tab's icon, and, with React already running, the detail from the API. This is the `#raiz` it rendered, with the header, the empty tray, and the `pagos` detail:

```text
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a><a class="" href="/servicios/nuevo" data-discover="true">Dar de alta</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header><section class="bandeja" aria-label="Avisos"><div role="status" aria-atomic="false"></div></section><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><dl><dt>Estado</dt><dd>En falla: HTTP 503</dd><dt>Revisiones</dt><dd>0</dd><dt>Última revisión</dt><dd>2026-10-22T19:29:17.619Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre pagos<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

The tab's title, in the `<head>` of the same dump, was `pagos · Revisor`: the `useTituloDocumento` Effect from Lesson 3, working in the published version, with the security policy enabled.

What this server does **not** do, and a production server does: HTTPS, compression (gzip or brotli), logs with rotation, size and time limits for requests, and restarting itself if it goes down. For that you put nginx, Caddy, or the platform of your choice in front, or in its place, with the same rules: rewrite except `/assets/`, the same policy, and the same caching. The rules are what this section teaches; the program that applies them can be changed.

#### 9.2.4 `VITE_` without secrets, now in what is published

Lesson 0 demonstrated it in development: what starts with `VITE_` ends up written in the JavaScript that anyone downloads, and what does not start that way does not get there ([Vite, "Env Variables and Modes"](https://vite.dev/guide/env-and-mode)). In publishing the circle closes with a habit: **before publishing, search `dist/`**. On the checkpoint:

```text
$ grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js dist/index.html | sort | uniq -c
   1 dist/assets/index-Cs1CcfeN.js:clave
   3 dist/assets/index-Cs1CcfeN.js:password
$ grep -ioE ".{60}password.{60}" dist/assets/*.js
datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0
.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var Qr=An&&`
===`http:`||t.protocol===`https:`)return t.username!==``||t.password!==``?{ok:!1,detalle:`quita el usuario y la clave de la dire
```

Four matches, on two lines of the file (`grep -c` would say `2`), and none is a leak. Two are React DOM code that enumerates the types of `<input>` (`email`, `number`, `password`, `url`…) to know how to treat each. The other two belong to the `revisor` itself: the registration schema from Lesson 7 reads `url.password` to reject an address with a user or a password, and its message says «quita el usuario y la clave de la dirección». The important lesson is not the number: **a search result is read, not counted**. Zero matches would have proved nothing either, because a real key is almost never called `clave`.

That is why the search that does work is the one for **the values**. To see it, a copy of the checkpoint reads two variables it should not (one with the prefix and one without it), declares them in `vite-env.d.ts`, and prints both from `main.tsx` so the build does not discard them:

```ts
// fragmento: la copia, al final de src/configuracion.ts
// ⛔ SOLO PARA LA DEMOSTRACIÓN: una clave en una variable VITE_ y otra sin el prefijo.
export const claveConPrefijo = import.meta.env.VITE_CLAVE_MONITOREO;
export const claveSinPrefijo = import.meta.env.CLAVE_MONITOREO;

// fragmento: la copia, en src/vite-env.d.ts, dentro de ImportMetaEnv
  readonly VITE_CLAVE_MONITOREO?: string;
  readonly CLAVE_MONITOREO?: string;

// fragmento: la copia, en src/main.tsx, después de los import
import { claveConPrefijo, claveSinPrefijo } from "./configuracion";

console.info("monitoreo:", claveConPrefijo, claveSinPrefijo);
```

And it is built with fake values:

```text
$ VITE_CLAVE_MONITOREO=mon_prueba_7f3a91 CLAVE_MONITOREO=mon_secreta_c0ffee npm run build
...
dist/assets/index-DfHw2mrm.js   374.71 kB │ gzip: 117.32 kB
$ grep -o '.\{30\}mon_prueba_7f3a91.\{10\}' dist/assets/*.js
s?t:ds}var hs=ms(`10000`),gs=`mon_prueba_7f3a91`;async fu
$ grep -c mon_secreta_c0ffee dist/assets/*.js
0
```

The `VITE_` one was left written next to `ms(`10000`)`, which is `leerCadaMs` with the `.env` value. The other was not. If your team keeps its keys' real values in a secrets manager, the search that counts is that one: take each value and search for it in `dist/`. If it appears, the key is no longer secret and has to be changed, not just removed from the bundle.

#### 9.2.5 An XSS refresher: three layers

The TypeScript course taught the attack: if a page inserts as HTML a text that came from outside, that text can carry a `<script>` or an `onerror` that runs with the permissions of whoever opened the page. That is called *cross-site scripting* (XSS). In the `revisor`, "outside" is the API: the service names are written by whoever registers, and they reach everyone's screen. Figure 3 gives React a service name with an attack, and a `javascript:` address in a link:

```tsx
// fig09_03.tsx
import { renderToStaticMarkup } from "react-dom/server";

// Lo que un atacante escribiría como nombre de servicio, si la API se lo dejara pasar.
const nombre = '<img src=x onerror="alert(1)">';
const enlace = "javascript:alert(1)";

// Los avisos de React salen por console.error: se imprimen recortados al primer renglón.
console.error = (formato: unknown) => {
  console.log(`  [aviso de React] ${String(formato).split("\n")[0]}`);
};

console.log("1. texto como hijo de JSX:");
console.log(`  ${renderToStaticMarkup(<strong>{nombre}</strong>)}`);

console.log("2. texto en un atributo:");
console.log(`  ${renderToStaticMarkup(<li title={nombre}>pagos</li>)}`);

console.log("3. una URL javascript: en href:");
console.log(`  ${renderToStaticMarkup(<a href={enlace}>pagos</a>)}`);
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_03.tsx
$ node fig09_03.js
1. texto como hijo de JSX:
  <strong>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</strong>
2. texto en un atributo:
  <li title="&lt;img src=x onerror=&quot;alert(1)&quot;&gt;">pagos</li>
3. una URL javascript: en href:
  <a href="javascript:throw new Error(&#x27;React has blocked a javascript: URL as a security precaution.&#x27;)">pagos</a>
```

Notice that no `[aviso de React]` came out in this run: React 19.3.1 replaced the address without printing anything to `console.error`. The hook above is left so you can see it for yourself.

**First layer: React escapes the text.** In cases 1 and 2, the `<img onerror>` arrived as text: `&lt;img …&gt;`. The browser paints it as letters and creates no image. This happens whenever the data goes as a JSX child or as the value of a text attribute (`title`, `aria-label`, `value`), which is how the `revisor` paints everything. The attributes the browser treats as an address or as a document (`href`, `src`, `formAction`, `srcDoc` of an `<iframe>`) are another story: escaping does not protect them, because a dangerous address carries no character to escape. React 19 blocks `javascript:`, as case 3 shows, but it does not check anything else. An address that comes from outside is validated before use, for example by requiring it to start with `https://`, as Lesson 7's registration schema does with `urlHttp`. The door React offers for inserting HTML is `dangerouslySetInnerHTML` (outside React, with a `ref`, `innerHTML`, `outerHTML`, and `insertAdjacentHTML` are also left; Lesson 0's linter rule covers the first two, and the other two are checked by eye), and React's documentation says it bluntly: if the HTML is not trusted, for example if it is based on user data, you risk an XSS vulnerability ([React, common components](https://react.dev/reference/react-dom/components/common)). In case 3, React 19 replaced the `javascript:` address with one that throws an error: "React has blocked a javascript: URL as a security precaution". React 16.9 had announced it would do so in a future major version ([React, "React v16.9.0"](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html)); the figure shows that 19.3.1 already does.

**Second layer: the linter.** The `revisor`'s `eslint.config.js` has carried since Lesson 0 a `no-restricted-syntax` rule that rejects `dangerouslySetInnerHTML` and assignments to `innerHTML`. If someone opens it, `npm run lint` turns red and the course's verification does not pass.

**Third layer: the content security policy.** If the first two failed (a library that inserts HTML on its own, an oversight), the publishing server's policy still forbids running scripts that do not come from a file of the same origin. An `onerror` written in the HTML is inline code, and without `'unsafe-inline'` the browser does not run it. It is the only one of the three layers that does **not** live in your code: it lives on the server. That is why it matters who publishes and how.

### 9.3 Server Components, Server Functions, and when a framework

#### 9.3.1 What they are

Everything the `revisor` renders, the browser renders. React 19 has another possibility. **Server Components** are components that render ahead of time, in an environment separate from the browser application: they can run once at build time, on the continuous integration server, or on each request, on a web server ([React, "Server Components"](https://react.dev/reference/rsc/server-components)). Since they run on the server, they can read a database or a file directly, without an API in between, and what reaches the browser is the already rendered result, not the code that produced it. **Server Functions** are the way back: asynchronous functions that run on the server and that a browser component can call. They are marked with the `"use server"` directive; the framework creates a reference that travels to the browser, and when it is called, React sends a request to the server to run it and returns the result ([React, "Server Functions"](https://react.dev/reference/rsc/server-functions)). Until September 2024 they were called "Server Actions"; today that name is kept for those passed to an `action` or called from an action, like Lesson 7's `<form action>`.

Two clarifications from the documentation that prevent common confusions. The first: **there is no directive for Server Components**; `"use server"` is for Server Functions, not for marking a component. The second, which decides a lot: although React 19's Server Components are stable between minor versions, the internal pieces that bundlers and frameworks use to implement them **do not follow semantic versioning** and may break between React 19.x minor versions. That is why the documentation recommends to whoever builds that integration to pin an exact React version or use the *Canary* version. What follows is already this course's judgment, not the documentation's: Server Components are used through a framework that maintains that integration for you. Vite has an official *plugin* for them, `@vitejs/plugin-rsc` (version 0.5.38 on October 21, 2026, still before 1.0), described as framework-agnostic and delivering the low-level pieces to build one on top; it is a base for those who make frameworks, not a piece for an application like the `revisor`.

And a security warning that holds for any design with a server: a Server Function's arguments are **fully controlled by the client**. The documentation asks to always treat them as untrusted input, validate them, and check in every Server Function that the person calling it has permission for what they ask ([React, `"use server"`](https://react.dev/reference/rsc/use-server)). A Server Function is, in practice, a public route of your server under another name. The strongest precedent is recent: on December 3, 2025, the React team published a critical vulnerability in Server Components, CVE-2025-55182, with a CVSS score of 10.0 (CVSS is the standard severity scale; 10.0 is the maximum), which allowed running code on the server without authenticating by exploiting a flaw in how React decoded requests to Server Functions. According to the advisory, an application could be vulnerable even if it defined no Server Function, merely by supporting Server Components; and an application whose React code does not use a server was not affected ([React, "Critical Security Vulnerability in React Server Components"](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)). The `revisor` is among the latter. It is the other face of "internal pieces that do not follow semantic versioning": whoever uses them has to update them as soon as the patch comes out. Among the packages the advisory lists as affected is `@vitejs/plugin-rsc`, the same *plugin* as above.

#### 9.3.2 Why this dashboard does not use them

The `revisor` does not use Server Components for three reasons, and it is worth stating them precisely, because "it doesn't need them" without reasons is just an opinion:

1. **Its data already has a server, and it is another one.** The report and the detail come from an API that is not the dashboard's: in the course it is the practice server; in real life it would be the Go course's or the TypeScript course's revisor. A Server Component shines when the component can read the data from up close. Here it would have to ask that same API over HTTP, which is what the browser already does, only from another machine.
2. **Its data changes on its own, every ten seconds.** The report is polled with `refetchInterval` (Lesson 4) and invalidated on retry (Lesson 4) or on registration (Lesson 7). That is server state **in the browser**, and TanStack Query solves it with a cache, retries, and background refresh. Server-side rendering is good for the first load, not for the next ten seconds.
3. **It does not need to appear in search engines or load without JavaScript.** It is an internal tool, behind a login. The two most-cited gains of rendering on the server (that the content is in the first HTML for search engines, and that something shows before the JavaScript arrives) pay it nothing.

There is a fourth reason, which belongs to this course and not to the dashboard: Server Components require a framework, and learning a framework while you learn React hides what each does. That is why the course taught first the React that runs in the browser.

#### 9.3.3 When it makes sense to migrate to a framework

React's documentation is clear in its recommendation: for a new application, **start with a framework** (it mentions Next.js's App Router, React Router in its framework mode, and Expo for native applications, among others), because they come with routing, data loading, and server rendering solved; starting from scratch, with a tool such as Vite, gives more flexibility in exchange for you making those decisions ([React, "Creating a React App"](https://react.dev/learn/creating-a-react-app)). The same page recognizes the reasons for starting from scratch: constraints that frameworks do not handle well, wanting to build your own structure, or wanting to learn the basics of a React application. This course is the third. And there is a detail worth knowing: those frameworks also produce single-page applications without a server, which can be published as static files, and let you add server functions route by route when you need them.

The criterion for migrating the `revisor`, or any similar application, is this course's own, not the documentation's, and is written in the form of signals that can be checked:

| Signal | How it looks in the `revisor` | Migrate? |
|---|---|---|
| There are public pages that must appear in search engines | No: it is an internal tool | No |
| The first load is slow and measurement proves it (large JavaScript, request waterfalls on opening) | 117 kB compressed and one request on opening; not measured as a problem | No |
| The data is in a database of its own and the API exists only for the screen | No: the API belongs to another program and has other clients | No |
| There is data or keys that cannot reach the browser and today force writing an API just for that | No: there are no secrets on screen (9.2.4) | No |
| The team laboriously reinvents routing, per-route data loading, and error handling | No: React Router and TanStack Query solve it | No |

If one day two or three rows change from "No" to "Yes", the migration starts to pay its cost, which is real: a Node server that has to be operated, a new mental model (what runs where), and pieces that depend on the framework's versions. Until then, the `revisor` is what the documentation calls a single-page application, and it is fine for it to be one.

### 9.4 What we found when measuring

Writing this lesson forced measuring the dashboard from end to end, and the measurement found five defects that no earlier lesson had seen. None breaks a Lesson 8 test, because no test was looking for them. They are all closed the same way, with that lesson's habit: first the test that describes the correct behavior is written and seen **red** against today's code; then it is fixed, and the same test is seen **green**. The eight new tests live in four files and cover the five defects (the two CSS ones share a file).

The five fixes and their four test files are part of this lesson's checkpoint. To see the red phase, the four test files were run in a copy of the checkpoint **without** the fixes, that is, against the code as Lesson 8 left it:

```text
$ npx vitest run --reporter=default src/configuracion.test.ts src/reporte/ResumenFallas.test.tsx src/consultas/cliente.test.ts src/reporte/panel.test.ts

 RUN  v5.0.5 ~/curso-react/rojo

 ❯ src/configuracion.test.ts (3 tests | 1 failed) 4ms
   ❯ leerCadaMs (3)
     ✓ acepta un intervalo razonable 1ms
     ✓ usa diez segundos si el valor no es un entero positivo 0ms
     × usa diez segundos si el intervalo se sale de los límites 2ms
 ❯ src/reporte/ResumenFallas.test.tsx (1 test | 1 failed) 14ms
   ❯ el resumen de fallas (1)
     × un solo servicio se dice en singular 13ms
 ❯ src/reporte/panel.test.ts (2 tests | 2 failed) 6ms
   ❯ la hoja de estilos (2)
     × cada clase de la hoja la usa algún componente 5ms
     × la hora de actualización se ve secundaria y se lee bien 0ms
 ❯ src/consultas/cliente.test.ts (2 tests | 1 failed) 6017ms
   ❯ el cliente de consultas (2)
     × no reintenta un 404: el servicio no va a aparecer por insistir 3011ms
     ✓ reintenta dos veces un 503: puede ser pasajero 3006ms
...
 Test Files  4 failed (4)
      Tests  5 failed | 3 passed (8)
```

Five red, one per defect, and three green that already protected what did work. Each following section shows its test, its failure message, and the fix, as they ended up in the checkpoint.

#### 9.4.1 `VITE_CADA_MS` without a limit

**What was measured.** It is the scene's third message. With the checkpoint on `npm run dev`, `VITE_CADA_MS=2147483648`, and headless Chrome open on `/` for five seconds, the practice API's log:

```text
$ VITE_CADA_MS=2147483648 npx vite --port 5109 --strictPort
10:10:47.922 GET /api/estados cancelada por el cliente
10:10:48.225 GET /api/estados 200
10:10:48.537 GET /api/estados 200
10:10:48.842 GET /api/estados 200
10:10:49.151 GET /api/estados 200
10:10:49.457 GET /api/estados 200
10:10:49.761 GET /api/estados 200
10:10:50.066 GET /api/estados 200
10:10:50.371 GET /api/estados 200
10:10:50.675 GET /api/estados 200
10:10:50.978 GET /api/estados 200
```

(The first line is the usual `StrictMode` pair.) Ten requests in under three seconds, one every ~305 ms, which is exactly how long the API takes to answer: the dashboard asks as soon as it is answered. Whoever wrote that number wanted about 25 days between questions. Why? TanStack Query's polling uses `setInterval`, and MDN explains the limit: the delay is converted to a 32-bit signed integer, so the maximum is 2,147,483,647 ms (about 24.8 days); a larger value **overflows** and can produce a negative number, which the browser treats as "no wait" ([MDN, `setTimeout`, "Maximum delay value"](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value)). 2,147,483,648 is exactly one more than the maximum: on overflowing it becomes −2,147,483,648, a negative delay. And the overflow is not always so scandalous: with `VITE_CADA_MS=99999999999`, in the same five-second test there was a single request, because that number, when overflowing, gives about 14 days. A defect that is sometimes seen and sometimes not is the worst kind.

The other extreme exists too: `VITE_CADA_MS=1` passes `leerCadaMs`'s filter (it is a positive integer) and asks the browser for polling without a pause. The same five-second run:

```text
$ VITE_CADA_MS=1 npx vite --port 5109 --strictPort
13:22:56.829 GET /api/estados cancelada por el cliente
13:22:57.131 GET /api/estados 200
13:22:57.452 GET /api/estados 200
13:22:57.759 GET /api/estados 200
13:22:58.066 GET /api/estados 200
13:22:58.371 GET /api/estados 200
13:22:58.678 GET /api/estados 200
13:22:58.988 GET /api/estados 200
13:22:59.299 GET /api/estados 200
13:22:59.606 GET /api/estados 200
13:22:59.912 GET /api/estados 200
13:23:00.218 GET /api/estados 200
13:23:00.461 GET /api/estados cancelada por el cliente
```

The same practical result: a question as soon as the answer arrives. (The last line is the request in progress when Chrome was closed.)

**The test.** A new file next to `configuracion.ts`:

```ts
// revisor/src/configuracion.test.ts
import { describe, expect, test } from "vitest";
import { leerCadaMs } from "./configuracion";

describe("leerCadaMs", () => {
  test("acepta un intervalo razonable", () => {
    expect(leerCadaMs("5000")).toBe(5_000);
  });

  test("usa diez segundos si el valor no es un entero positivo", () => {
    for (const valor of [undefined, "", "abc", "0", "-5", "1e4", "10s"]) {
      expect(leerCadaMs(valor)).toBe(10_000);
    }
  });

  test("usa diez segundos si el intervalo se sale de los límites", () => {
    expect(leerCadaMs("999")).toBe(10_000);
    expect(leerCadaMs("1000")).toBe(1_000);
    expect(leerCadaMs("3600000")).toBe(3_600_000);
    expect(leerCadaMs("3600001")).toBe(10_000);
    expect(leerCadaMs("99999999999")).toBe(10_000);
  });
});
```

The red phase: `expected 999 to be 10000`. Today `leerCadaMs("999")` returns 999; the test says an interval shorter than one second is not accepted.

**The fix.** Two limits, with their reason written beside them. Outside them, the usual value is used, as with a text that is not a number: invalid configuration does not break the dashboard, it is ignored.

```ts
// revisor/src/configuracion.ts
const CADA_MS_PREDETERMINADO = 10_000;

// Menos de un segundo entre preguntas no deja respirar a la API (cada respuesta tarda
// 300 ms), y más de una hora ya no es un sondeo. Además, setInterval guarda el intervalo
// en un entero de 32 bits: arriba de 2_147_483_647 ms se desborda, y la espera queda en
// cualquier valor, a veces cero.
const CADA_MS_MINIMO = 1_000;
const CADA_MS_MAXIMO = 3_600_000;

export function leerCadaMs(valor: string | undefined): number {
  if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
    return CADA_MS_PREDETERMINADO;
  }

  const ms = Number(valor);
  return ms >= CADA_MS_MINIMO && ms <= CADA_MS_MAXIMO ? ms : CADA_MS_PREDETERMINADO;
}

export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
```

The one-second minimum and the one-hour maximum are this course's own judgment, not a norm: one second is more than three times how long the API takes to answer, and more than an hour stops being polling. What is **not** a judgment call is the maximum staying below 2,147,483,647: `setInterval` demands that. The same measurement with the fix, the same number, and the same five seconds:

```text
10:10:59.307 GET /api/estados cancelada por el cliente
10:10:59.610 GET /api/estados 200
```

One request: the value was ignored and the dashboard went back to its ten seconds.

#### 9.4.2 The singular of "servicios"

**What was measured.** With a single service in the report, the summary says "1 servicios revisados". Lesson 1 took care of the singular for failures with `textoFallas` ("1 servicio con falla"), but the total was left written by hand in the component, `{estados.length} servicios revisados`, and nobody tested it with one. The Lesson 8 test that protects the loose `0` uses two services, so it did not see it either.

**The test.** It mounts only `ResumenFallas` with one failing service, because the defect belongs to that component and the whole application is not needed:

```tsx
// revisor/src/reporte/ResumenFallas.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ResumenFallas } from "./ResumenFallas";

describe("el resumen de fallas", () => {
  test("un solo servicio se dice en singular", () => {
    render(<ResumenFallas estados={[{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }]} />);
    expect(screen.getByText(/revisad/).textContent).toBe("1 servicio revisado · 1 servicio con falla");
  });
});
```

The red phase says it letter by letter:

```text
Expected: "1 servicio revisado · 1 servicio con falla"
Received: "1 servicios revisados · 1 servicio con falla"
```

**The fix.** The text goes out to a pure function, next to `textoFallas`, and the component uses it:

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

export function textoRevisados(total: number): string {
  return total === 1 ? "1 servicio revisado" : `${total} servicios revisados`;
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

```tsx
// revisor/src/reporte/ResumenFallas.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { contarFallas, textoFallas, textoRevisados } from "./resumen";

export function ResumenFallas({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  const fallas = contarFallas(estados);

  return (
    <p className="resumen">
      {textoRevisados(estados.length)}
      {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
    </p>
  );
}
```

The existing test "sin fallas no pinta un 0 suelto en el resumen" stays green, because with two services the text is the same as before.

#### 9.4.3 The retry on a 404

**What was measured.** Opening `/servicios/nada`, a service that does not exist, with headless Chrome and the practice API:

```text
10:11:05.994 GET /api/servicios/nada cancelada por el cliente
10:11:06.195 GET /api/servicios/nada 404
10:11:07.401 GET /api/servicios/nada 404
10:11:09.607 GET /api/servicios/nada 404
```

Three requests, with 1.2 and 2.2 seconds between them, and the person seeing "Cargando detalle…" for more than three seconds before finding out that the service does not exist. It is Lesson 4's `retry: 2`, which applies to **every** error, plus the wait TanStack Query puts between attempts: it starts at one second and doubles each time, up to a cap of 30 seconds ([TanStack Query, "Query Retries"](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries)). Retrying makes sense on a `503` (the service may come back in a second) or a downed network. On a `404`, the answer is the answer: the service will not appear by insisting. A precision before generalizing: in the `revisor` the API only answers `400`, `404`, and `409`, and none changes by insisting, so the checkpoint's rule is "do not retry any 4xx". In a real API there are two 4xx that are transient, the `408` (the request timed out) and the `429` (too many requests, which usually carries `Retry-After`), and a real retry rule separates them.

Why did Lesson 8 not see it? Because `montarEn` creates its own `QueryClient` with `retry: false`, on purpose, so an error shows up immediately in tests. That is right for testing screens, and leaves the real configuration untested. The new test uses the real client, `crearClienteConsultas()`:

```ts
// revisor/src/consultas/cliente.test.ts
import { describe, expect, test } from "vitest";
import { consultaDetalle } from "../detalle/consultas";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { crearClienteConsultas } from "./cliente";

describe("el cliente de consultas", () => {
  test("no reintenta un 404: el servicio no va a aparecer por insistir", async () => {
    const fetchFalso = instalarFetchFalso({});
    const cliente = crearClienteConsultas();
    await expect(cliente.fetchQuery(consultaDetalle("nada"))).rejects.toThrow("la API respondió 404");
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  test("reintenta dos veces un 503: puede ser pasajero", { timeout: 10_000 }, async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 503, cuerpo: { detalle: "caída" } },
    });
    const cliente = crearClienteConsultas();
    await expect(cliente.fetchQuery(consultaDetalle("pagos"))).rejects.toThrow("la API respondió 503");
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });
});
```

The red phase: `expected "vi.fn()" to be called 1 times, but got 3 times`. The second test, the `503` one, has been green from before, and it is the one that prevents the lazy fix: `retry: false` would turn the first green and the second red. The two together describe the complete rule. (It takes three real seconds, because of the waits between attempts; that is why it carries `timeout: 10_000`.)

**The fix.** The error carries the HTTP code as its cause (`cause`, a standard property of `Error`), and the client decides with a function instead of a number:

```ts
// revisor/src/detalle/cargar.ts
import { esDetalleServicio, type DetalleServicio } from "../compartido/contrato";

export async function cargarDetalle(nombre: string, senal: AbortSignal): Promise<DetalleServicio> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}`, { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`, { cause: respuesta.status });
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esDetalleServicio(cuerpo)) {
    throw new Error("la API no entregó un detalle válido");
  }

  return cuerpo;
}
```

```ts
// revisor/src/consultas/cliente.ts
import { QueryClient } from "@tanstack/react-query";

// Un 4xx es una respuesta, no una falla pasajera: preguntar otra vez da lo mismo.
// Lo demás (un 503, la red caída) se reintenta dos veces, como antes.
function convieneReintentar(fallas: number, error: Error): boolean {
  const status = error.cause;

  if (typeof status === "number" && status >= 400 && status < 500) {
    return false;
  }

  return fallas < 2;
}

export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: convieneReintentar,
      },
    },
  });
}
```

The same measurement in the browser, with the fix:

```text
10:11:13.704 GET /api/servicios/nada cancelada por el cliente
10:11:13.905 GET /api/servicios/nada 404
```

One request, and the notice "No se pudo cargar el detalle: la API respondió 404" appears as soon as the response arrives.

#### 9.4.4 Unused CSS

**What was measured.** `panel.css` has two rules that no component has used since Lesson 5: `.seleccionar` (the button with `aria-pressed` from Lesson 2, which 5 replaced with a link) and `.detalle` (the detail panel from Lesson 3, which 5 replaced with a page). They are 19 lines that travel to every browser and that confuse whoever reads the stylesheet, because they look alive.

**The test, and the trap found while writing it.** The test reads the stylesheet and the components' text, extracts the classes from the stylesheet, and checks that each one appears in some `className`. To read files as text without Node, it uses two Vite functions that Vitest understands: `import hoja from "./panel.css?raw"` and `import.meta.glob(…, { query: "?raw" })`.

```ts
// revisor/src/reporte/panel.test.ts
import { describe, expect, test } from "vitest";
import hoja from "./panel.css?raw";

// El texto de cada componente, tal como está escrito (sin las pruebas).
const fuentes = Object.values(
  import.meta.glob<string>(["/src/**/*.tsx", "!/src/**/*.test.tsx"], {
    query: "?raw",
    import: "default",
    eager: true,
  }),
);

// Clases que ningún className escribe con todas sus letras: `disponible` y `falla`
// salen de `estado.tipo` (FilaEstado), y `active` la pone el NavLink de React Router.
const DINAMICAS = ["disponible", "falla", "active"];

function clasesDeLaHoja(css: string): string[] {
  const selectores = css.replace(/\{[^}]*\}/g, " ");
  return [...new Set([...selectores.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1] ?? ""))];
}

// Los textos entre comillas o acentos graves que aparecen después de `className=`.
function usosDeClassName(codigo: string): string[] {
  return codigo
    .split("\n")
    .filter((linea) => linea.includes("className="))
    .flatMap((linea) =>
      [...linea.slice(linea.indexOf("className=")).matchAll(/"([^"]*)"|`([^`]*)`/g)].map(
        (m) => m[1] ?? m[2] ?? "",
      ),
    );
}

function seUsa(clase: string, usos: readonly string[]): boolean {
  return (
    DINAMICAS.includes(clase) ||
    usos.some((uso) =>
      uso
        .split(/\s+/)
        .some((pieza) => new RegExp(`^${pieza.replace(/\$\{[^}]*\}/g, "[a-z0-9-]+")}$`).test(clase)),
    )
  );
}

// Contraste entre dos colores #rrggbb, con la fórmula de WCAG 2.2.
function contraste(uno: string, otro: string): number {
  const luminancia = (hex: string): number => {
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [clara, oscura] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
  return ((clara ?? 0) + 0.05) / ((oscura ?? 0) + 0.05);
}

describe("la hoja de estilos", () => {
  test("cada clase de la hoja la usa algún componente", () => {
    const clases = clasesDeLaHoja(hoja);
    const usos = fuentes.flatMap(usosDeClassName);
    // Control positivo: si la hoja o los componentes llegaran vacíos, no habría nada que revisar.
    expect(clases).toContain("tarjeta");
    expect(usos).toContain("tarjeta");
    expect(clases.filter((clase) => !seUsa(clase, usos))).toEqual([]);
  });

  test("la hora de actualización se ve secundaria y se lee bien", () => {
    const regla = /\.actualizado\s*\{([^}]*)\}/.exec(hoja)?.[1] ?? "";
    const color = /(?:^|;|\s)color:\s*(#[0-9a-f]{6})/i.exec(regla)?.[1];
    expect(color, "falta el color de .actualizado").toBeDefined();
    expect(contraste(color ?? "#000000", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contraste(color ?? "#000000", "#ffffff")).toBeLessThan(21);
  });
});
```

The first version of this test **passed green against the code with the defect**. It is not that the defect did not exist: it is that the stylesheet arrived empty. Vitest, by default, does not process `.css` files; its documentation says excluded files are replaced with an empty string, and that `css.include` (empty by default) is the list of those that are processed ([Vitest, `css`](https://vitest.dev/config/css)). The rest was measured, the documentation does not say it: a file that is not in that list also arrived empty, even with `?raw`: `hoja.length` was `0`. An empty stylesheet has no unused classes, and the test concluded, without error, that everything was fine. It is the most dangerous kind of green, the kind that measured nothing.

That is why the test has two changes. The first is in `vite.config.ts`, inside `test`:

```ts
// fragmento: revisor/vite.config.ts, solo la parte de `test`
  test: {
    environment: "jsdom",
    setupFiles: ["./src/pruebas/preparar.ts"],
    // Sin esto, Vitest entrega cada .css como un texto vacío, también con `?raw`,
    // y la prueba de la hoja de estilos pasaría sin haber leído nada.
    css: { include: [/panel\.css/] },
  },
```

The second is the **positive control** inside the test itself: before looking for unused classes, it checks that it found at least one that is used, `tarjeta`, in the stylesheet and in the components. Without `css.include`, the test now fails where it should, instead of passing:

```text
 FAIL  src/reporte/panel.test.ts > la hoja de estilos > cada clase de la hoja la usa algún componente
AssertionError: expected [] to include 'tarjeta'
```

With the stylesheet really read, the red phase is the interesting one:

```text
AssertionError: expected [ 'seleccionar', 'detalle' ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "seleccionar",
+   "detalle",
+ ]
```

Notice `DINAMICAS`. There are classes that no `className` writes with all its letters: `disponible` and `falla` come from `estado.tipo`, and `active` is set by `NavLink` on the current page's link. A test like this cannot guess them; they have to be declared, and the list is part of the code that gets reviewed. It is the same problem that tools that automatically delete unused CSS have, and that is why they usually accept a list of exceptions (in PurgeCSS it is called a *safelist*). The fix, in this case, is to delete those 19 lines.

#### 9.4.5 The CSS for `.actualizado`

**What was measured.** It is the defect in reverse: `PaginaReporte` has rendered `<p className="actualizado">` since Lesson 3, and `panel.css` never had a rule for that class. The line "Actualizado a las … · actualizando…" looks the same size and color as the data, competing with what matters. A class that the component sets and the stylesheet ignores is an unkept promise.

**The test.** You already saw it in `panel.test.ts`: it looks for the `.actualizado` rule, takes its `color`, and computes the contrast against the white background with the WCAG 2.2 formula. It demands two things: that it be at least 4.5 to 1, the minimum for normal text according to criterion 1.4.3 ([W3C, "Understanding SC 1.4.3: Contrast (Minimum)"](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)), and that it be less than 21 to 1, which is pure black. That upper bound only rules out exact black (a `#111111` gives 18.88 to 1 and would pass): whether the line looks **secondary** is decided by the eye, and the test only guarantees that the rule exists, that it declares a color, and that it is legible. The red phase: `falta el color de .actualizado: expected undefined to be defined`.

**The fix.** One rule, in the place where the two deleted ones were, with the same gray the form's help texts from Lesson 7 already used:

```css
/* fragmento: revisor/src/reporte/panel.css, solo la regla nueva */
.actualizado {
  color: #57606a;
  font-size: 0.875rem;
}
```

The contrast of `#57606a` on white, computed with the same formula: 6.39 to 1. For comparison, a gray that "looks fine" at first glance, `#999999`, gives 2.85 to 1 and the test would reject it.

#### 9.4.6 The green phase and the full suite

The same four test files, on the checkpoint, with the five fixes:

```text
$ npx vitest run --reporter=default src/configuracion.test.ts src/reporte/ResumenFallas.test.tsx src/consultas/cliente.test.ts src/reporte/panel.test.ts
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/ResumenFallas.test.tsx (1 test) 22ms
 ✓ src/configuracion.test.ts (3 tests) 3ms
 ✓ src/reporte/panel.test.ts (2 tests) 3ms
 ✓ src/consultas/cliente.test.ts (2 tests) 3012ms
   ✓ el cliente de consultas (2)
     ✓ reintenta dos veces un 503: puede ser pasajero 3005ms

 Test Files  4 passed (4)
      Tests  8 passed (8)
   Start at  07:11:08
   Duration  4.09s (tests 47%, environment 44%, setup 7%, transform 1%, import 1%)
```

And the full suite, to check that no fix broke what was already protected:

```text
$ npm test -- --reporter=default

> revisor@0.9.0 test
> vitest run --reporter=default

 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/avisos/avisos.test.ts (4 tests) 8ms
 ✓ src/reporte/ResumenFallas.test.tsx (1 test) 153ms
 ✓ src/reporte/resumen.test.ts (3 tests) 67ms
 ✓ src/reporte/panel.test.ts (2 tests) 5ms
 ✓ src/app/rutas.test.tsx (3 tests) 486ms
   ✓ las rutas (3)
     ✓ una dirección desconocida muestra la página de no encontrada 414ms
 ✓ src/detalle/PaginaServicio.test.tsx (3 tests) 778ms
   ✓ la página de un servicio (3)
     ✓ muestra el detalle del servicio de la dirección 428ms
 ✓ src/reporte/PaginaReporte.test.tsx (7 tests) 791ms
   ✓ la página del reporte (7)
     ✓ error: muestra el motivo y un botón para reintentar 331ms
 ✓ src/compartido/esquema.test.ts (2 tests) 6ms
 ✓ src/configuracion.test.ts (3 tests) 4ms
 ✓ src/alta/FormularioAlta.test.tsx (5 tests) 1259ms
   ✓ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 554ms
 ✓ src/consultas/cliente.test.ts (2 tests) 3020ms
   ✓ el cliente de consultas (2)
     ✓ reintenta dos veces un 503: puede ser pasajero 3005ms

 Test Files  11 passed (11)
      Tests  35 passed (35)
   Start at  16:13:56
   Duration  6.23s (environment 53%, tests 18%, transform 13%, import 8%, setup 7%)

Environment  jsdom was created 11 times · 19.53s total, 53% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
```

35 out of 35 in 11 files: Lesson 8's 27 plus the 8 new ones. The three-line `Environment` block at the end is a Vitest suggestion about its own speed (creating jsdom once per process instead of eleven times), not a test warning; it may or may not appear for you. On the checkpoint, `npm run lint` finished without warnings and `npm run build` left `index-Cs1CcfeN.js` (374.65 kB) and `index-CbqUABMA.css`, of 1.27 kB: about 230 bytes less than the stylesheet before the fixes (1.50 kB; Vite rounds to hundredths, and if you want the exact number, `wc -c` on the two files). The compiler kept acting: 18 marks.

## The error you will see

**The main error: reading the clock while rendering.** Figure 1's first version had the wait inside the component, like this:

```tsx
// fragmento: la primera versión de ListaLenta, la que el linter rechazó
function ListaLenta() {
  const hasta = performance.now() + 20;
  while (performance.now() < hasta) {
    // espera activa
  }
  // …
```

And `npx eslint` answered:

```text
~/curso-react/figuras/fig09_01.tsx
  19:17  error  Error: Cannot call impure function during render

`performance.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

~/curso-react/figuras/fig09_01.tsx:19:17
  17 | // Una lista que tarda 20 ms en dibujarse: el costo es a propósito, para que se vea.
  18 | function ListaLenta() {
> 19 |   const hasta = performance.now() + 20;
     |                 ^^^^^^^^^^^^^^^^^ Cannot call impure function
  20 |   while (performance.now() < hasta) {
  21 |     // espera activa
  22 |   }  react-hooks/purity
  20:10  error  Error: Cannot call impure function during render
…
✖ 2 problems (2 errors, 0 warnings)
```

It is the `react-hooks/purity` rule, one of those that `eslint-plugin-react-hooks` 7 brings from the compiler. It says something you already know from Lesson 1: a component has to give the same result with the same inputs, and `performance.now()` gives a different number each time. If the compiler memoized a component that reads the clock, the second time it would reuse the first time's hour. That is why the two tools share rules: the linter warns about what would make the compiler wrong (or make it skip the component, as in figure 2). The figure's fix moves the wait to a separate function. Careful: that does not make it pure, it only hides it from the linter, which does not check inside the functions you call. It is accepted here **only** because it simulates a cost and produces nothing that gets rendered, and `gastar`'s comment warns of it; doing the same with a real impurity would be silencing the linter by another route. In a real component, an hour that is shown is stored in state or arrives as a prop.

**The silent one: the file that does not exist and answers HTML.** In the preview, `/assets/no-existe.js` answered `200 text/html` (9.2.2). In the browser that looks like a blank page and, in the console, an error saying a JavaScript module was expected and the server answered with the MIME type `text/html`. It does not say which file was missing or why. If you see it after publishing, the question is: does my server also rewrite the addresses under `/assets/`? The fix is `publicar.ts`'s: the rewrite is for client routes, never for files.

**The other silent one: the green test that read nothing.** You saw it in 9.4.4. If a test reads a file and concludes "there are no problems", ask yourself what it would have said with the file empty. If the answer is "the same", it lacks a positive control.

## Common mistakes

**`useMemo` and `memo` on everything, "just in case".** Figure 1 showed that the cause of the additional renders was a state in the wrong place. Memoizing would have hidden the symptom and left the cause, with more code to maintain.

**Optimizing without measuring.** If you do not know how many times a component renders or how long it takes, you do not know whether what you changed helped. `<Profiler>` or the Profiler tab answer both questions in minutes.

**Measuring in the production build with `<Profiler>`.** It is turned off there, on purpose. Render measurements are made in development, and those of the complete experience (load, network) in the published version, with the browser's tools.

**Enabling the compiler and not checking that it took effect.** A configuration that gives no error proves nothing. Look for its marks in `dist/`, and count them with `grep -o … | wc -l`, not with `grep -c`.

**Silencing the linter so the compiler "works".** If a compiler rule complains, the component breaks a React rule. The component is fixed. Silencing it leaves a component the compiler skips, or worse, that it optimizes wrongly.

**Publishing with `vite preview`.** It is not made for that: no security policy, no caching for files with content names, and answering HTML where a file is missing.

**Rewriting everything to `index.html`, files included.** It turns a clear `404` into a content type error nobody understands.

**Serving files by building the disk path from what the client asks for.** It opens the way to directory traversal. `publicar.ts`'s closed list has no such opening.

**Counting matches when searching for secrets.** React DOM's `password` is a match that is not a leak; a real key is almost never called `clave`. Each result is read, and the **values** are searched for.

**A test that reads a file without a positive control.** If the file arrives empty, it passes. Add a check that it found something you know is there.

**`retry: false` to "fix" an extra retry.** It stops retrying what was worth retrying. That is why the `503` test accompanies the `404` one.

**Migrating to a framework because it is what the documentation recommends for new projects.** The `revisor` is not a new project, and the table in 9.3.3 does not have a single "Yes". A migration is justified with signals, not with a trend.

## Exercises

### Exercise 1 — The Profiler with your own eyes

Install the React Developer Tools extension in your browser. With the practice API and `npm run dev` on, open `http://localhost:5173/`, open the **Profiler** tab, and in its settings enable the option to record why each component rendered. **Before recording, predict:** if you type `pag` in "Buscar por nombre", which components will render with each letter? Does `EditorNota` render? Does `BandejaAvisos`? Record, type the three letters, stop recording, and check your prediction in each commit. Then, look at the **Components** tab: which components carry the "Memo ✨" badge? Finally, repeat the recording in a copy with `plugins: [react()]`, without the compiler, and note whether any component shows up extra.

### Exercise 2 — The other direction

9.4.4's test looks for classes in the stylesheet that no component uses. Ask the question the other way around, by hand: is there any `className` written in a component that has no rule in `panel.css`? Use `grep -rn 'className' src` in the copy with the fixes. **Predict first** how many you will find, besides `actualizado`, which has already been fixed. Then decide, for each one, whether it lacks a rule or is fine without one, and write your reason in the log.

### Exercise 3 — The icon that answered `200`

In the published server's log from 9.2.3 `GET /favicon.ico 200` appears, but `dist/` has no `favicon.ico`. Without running anything, explain what the server answered and with what content type. Then check it with `curl -sI http://127.0.0.1:4180/favicon.ico`. Is it a defect? What would you change in `publicar.ts`, if you changed anything?

### Exercise 4 — Migrate or not?

A team describes their application to you: an online store with 4,000 products, each with its own page, which today is a single-page application built with Vite and React Router; the marketing department complains that the product pages do not show up well in search engines, and the first load on a phone takes, measured, four seconds. Fill in the table from 9.3.3 for that application and decide whether it makes sense to migrate to a framework. Write down what you would measure before starting.

## Solutions

### Solution 1

What you should see, deduced from the code: with each letter at least `PaginaReporte` renders (because the address changed: the search text lives in `?q=`, Lesson 5, and it reads it with `useSearchParams`, so the reason the Profiler shows will be a hook change, or "the parent rendered", depending on the tools' version), `FiltroFallas`, `ContenidoReporte`, `ListaEstados`, and the `FilaEstado`s that remain in the list. `EditorNota` does not appear: it is not rendered in the list, only on the detail page. `BandejaAvisos` neither, nor `PanelPreferencias`: they live in `Disposicion`, and `Disposicion` does **not** render again with each letter, because the one that reads `?q=` is `PaginaReporte` and the change happens there, not in the layout that surrounds it. It is not memoization or a context that did not change: it is 9.1.4's structure. It was measured with a counter in each component and two letters typed: `PaginaReporte` went from 1 to 3 renders and `Disposicion`, `BandejaAvisos`, and `PanelPreferencias` stayed at 1, **with the compiler and without it**. If in your Profiler any of the three appears, something in your copy lifted the state to the layout, and that is the clue. If the compiler is on, several components in the **Components** tab carry "Memo ✨", and in the Profiler it is likely that some children whose props did not change appear as not rendered in a commit. If any prediction failed, note which and why: it is exactly what the Profiler teaches. This measurement was not run for the lesson; your result is the one that counts.

### Solution 2

Besides `actualizado`, `marca-nota` appears, in `FilaEstado`: the text " · con nota" that marks a service with a note since Lesson 2, with no rule in `panel.css`. The dynamic classes (`disponible` and `falla` from `estado.tipo`, `aviso-${aviso.nivel}`) do have a rule. Does `marca-nota` lack a rule? It is a decision, not a fact: the text reads well next to the name, so it can stay unstyled, and the class is used to find it in a test or in the developer tools. If you decide it should look different (for example, in `.actualizado`'s gray), write its test first, as in 9.4.5. What does not work is leaving the question unanswered: a class without a rule has to be a decision, not an oversight.

### Solution 3

`/favicon.ico` is not in the list of files and does not start with `/assets/`, so the server treated it as a client route and answered `index.html`: `200`, `text/html; charset=utf-8`, with the policy and `no-cache` (it is the sixth question of 9.2.3: `200`, `content-type: text/html; charset=utf-8`, and `cache-control: no-cache`). The browser receives HTML where it expected an icon, cannot render it, and leaves the tab without an icon; there is no further harm. It is a minor defect of the same family as the preview's (9.2.2): the rewrite was applied to something that is a file. There are two reasonable fixes. The simplest, adding a `favicon.ico` (or a `<link rel="icon">` to a file under `/assets/`) so that it exists. The more general one, making the rewrite apply only to addresses without an extension, so that `/favicon.ico` answers `404`; but if you do that, check that no client route has a dot (`/servicios/v1.2` would stop reloading). Choosing between the two is judgment; measuring the effect is not.

### Solution 4

The table changes almost entirely. Public pages that must appear in search engines: **Yes**, 4,000. Slow, measured first load: **Yes**, four seconds on a phone. Own data (the catalog is theirs): probably **Yes**. Secrets: it depends (special prices, inventory), to be checked. Reinventing per-route data loading: likely. With two or three measured "Yes"es, a framework with per-route server rendering begins to pay its cost: the product pages would arrive already rendered in the HTML. Before starting, you would measure: how much of the four seconds is downloading JavaScript and how much is waiting for data (the browser's network tab), how much the bundle weighs, and whether the search engine problem is one of content (it is not in the HTML) or of something else (titles, links). And a warning: the migration can be route by route, starting with the product page, without rewriting the cart or the account.

## How I know I succeeded

- [ ] `npm ci`, `npm run lint`, `npm test`, and `npm run build` finish with code 0 inside `~/curso-react/revisor/`; the summary of `npm test -- --reporter=default` says `Tests  35 passed (35)` in `11 passed (11)` files, and `npm run build` leaves `dist/assets/index-Cs1CcfeN.js` and `dist/assets/index-CbqUABMA.css` if your code is identical to the checkpoint's.
- [ ] `grep -o memo_cache_sentinel dist/assets/*.js | wc -l` gives `18`, and in a copy without the compiler it gives `1`.
- [ ] Figures 1, 2, and 3 give on your machine the same output as in the lesson.
- [ ] With `npm run servidor` and `npm run publicado`, `curl -sI http://127.0.0.1:4180/servicios/pagos` answers `200` with `content-security-policy` and `cache-control: no-cache`; `/assets/no-existe.js` answers `404`; and when you open `http://127.0.0.1:4180/servicios/pagos` in your browser and **reload**, the `pagos` detail shows.
- [ ] `grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js` finds only React DOM's matches and those of the registration schema, and you can explain why they are not a leak.
- [ ] In a copy of your own **without** the five fixes of 9.4 (with the new tests and the `css` line of `vite.config.ts`), the four new test files show red, with 5 failed tests out of 8; on the checkpoint, green.
- [ ] **By hand, with the developer tools:** you did exercise 1 and noted in your [log](bitacora.md) which components rendered with each letter and which carry "Memo ✨".
- [ ] You can explain, without looking, why the `revisor` does not use Server Components.

## Summary

Answer without looking at the lesson:

1. What two conditions must be met for `memo` to be worth it? How do you measure each?
2. What is the difference between `actualDuration` and `baseDuration` in `onRender`? Why can you not use `<Profiler>` in the production build?
3. In figure 1, why did version B not render the list again, if it does not use `memo`? Which of the documentation's five recommendations applies?
4. What does React Compiler do with a component that respects React's rules, and what does it do with one that breaks them? How do you check that it took effect in your build?
5. Why did `grep -c` give 2 and `grep -o … | wc -l` give 18 on the same file?
6. What three things was `vite preview` missing for publishing? How does `publicar.ts` solve them?
7. Why does the rewrite to `index.html` not apply to `/assets/*`?
8. What are the `revisor`'s three layers against XSS, and which of them does not live in your code?
9. What is a Server Component and what is a Server Function? Why does the `revisor` not use them?
10. Of the five defects in 9.4, which had a green test that had measured nothing, and what fixed it?

## Further reading

- [React, `<Profiler>`](https://react.dev/reference/react/Profiler): `onRender` and its parameters, `actualDuration` versus `baseDuration`, and why it is off in production. Consulted on October 21, 2026.
- [React, `memo`](https://react.dev/reference/react/memo): when memoizing is worth it, the five recommendations so it is not needed, and the note about React Compiler. Consulted on October 21, 2026.
- [React, "React Compiler v1.0"](https://react.dev/blog/2025/10/07/react-compiler-1), ["Introduction"](https://react.dev/learn/react-compiler/introduction), ["Installation"](https://react.dev/learn/react-compiler/installation), and ["Debugging and Troubleshooting"](https://react.dev/learn/react-compiler/debugging): the stable version of October 7, 2025, what it memoizes, what to do with `useMemo` and `useCallback`, the configuration with `reactCompilerPreset` in Vite, how to check that it took effect, and that it skips code that could break React's rules. Consulted on October 21, 2026.
- [Vite, "Deploying a Static Site"](https://vite.dev/guide/static-deploy): `vite build`, the `dist` folder, and the warning that `vite preview` is not a production server. Consulted on October 21, 2026.
- [Vite, "Env Variables and Modes"](https://vite.dev/guide/env-and-mode): the `VITE_` prefix, static replacement at build time, and the warning about sensitive information. Consulted on October 21, 2026.
- [React, common components: `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common) and ["React v16.9.0"](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html): the XSS risk with untrusted HTML, and the announcement that React would stop accepting `javascript:` addresses. Consulted on October 21, 2026.
- [React, "Server Components"](https://react.dev/reference/rsc/server-components), ["Server Functions"](https://react.dev/reference/rsc/server-functions), and [`"use server"`](https://react.dev/reference/rsc/use-server): what they are, where they run, why their internal pieces do not follow semantic versioning, and why a Server Function's arguments are untrusted input; and the [CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) advisory. Consulted on October 21, 2026.
- [React, "Creating a React App"](https://react.dev/learn/creating-a-react-app): the recommendation to start with a framework and the reasons to start from scratch. Consulted on October 21, 2026.
- [MDN, `setTimeout`, "Maximum delay value"](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value) and [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval): the delay as a 32-bit signed integer and the overflow. Consulted on October 21, 2026.
- [TanStack Query, "Query Retries"](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries): `retry` as a number or a function, and the wait that doubles between attempts. Consulted on October 21, 2026.
- [Vitest, `css`](https://vitest.dev/config/css): `css.include` and the style files that are replaced with an empty string. Consulted on October 21, 2026.
- [W3C, "Understanding SC 1.4.3: Contrast (Minimum)"](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): the 4.5 to 1 minimum contrast and the relative luminance formula. Consulted on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| additional render | rendering again a component whose result did not change, because a parent's state changed |
| `<Profiler>` | React component that measures how many times and how long a part of the tree takes to render |
| `actualDuration` / `baseDuration` | how long this update's render took / how long it would take without any memoization |
| memoize | save a result to reuse it as long as its inputs do not change |
| React Compiler | build tool that memoizes components and hooks on its own, and skips those that break React's rules |
| `memo_cache_sentinel` | React's "cache still empty" mark; the compiler writes it in every value it stores only once, so counting it in `dist/` tells whether it took effect |
| rewrite to `index.html` | answering the application's page for any address that is a client route |
| content security policy (CSP) | header that tells the browser where it may load and run each type of resource from |
| `immutable` | cache hint that promises the file will never change |
| directory traversal | attack that uses `..` in an address to read files outside the published folder |
| Server Component | component that renders on the server or at build time, before reaching the browser |
| Server Function | function that runs on the server and that a browser component can call |
| positive control | check, inside a test, that it found something you know exists, so an empty file does not give green |
| overflow | a number that does not fit in the size where it is stored and turns into another |

---

**End of the course.** If you got this far with your `revisor`, go back to ["How you know you are done"](README.md#how-you-know-you-are-done) in the README and check the five conditions. And open your [log](bitacora.md): what you noted down over these ten lessons is what is worth reviewing.
