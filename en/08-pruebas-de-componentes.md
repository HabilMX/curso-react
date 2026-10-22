# Lesson 8 — Component tests

*It is 12:15 on a Thursday and the new version of the `revisor` ships at 13:00. Someone on the team pushed a “cleanup” change: they removed a `> 0` from the summary that was “unnecessary”, and they gave the registration button its `disabled={pending}` back because “`aria-disabled` is a weird invention”. The linter says nothing. `npm run build` finishes fine. Code review approves it in two minutes, because each change, taken alone, looks reasonable. Nobody has time to open the five screens, empty the API to see the report with no failures, and go through the registration form with the keyboard. If it ships like that, the dashboard will paint a stray `0` every time everything is fine, and Raúl, the on-call teammate who works with a screen reader, will lose focus again at the exact moment of submitting, as in Lesson 7. Forty-five minutes remain. What you need is something that does that walkthrough for you in two seconds, every time someone changes a line, and that turns red in exactly those two places. That is what this lesson builds. And you will also see which part of that walkthrough no test in Node can do for you.*

**Time:** 2 × 45 min (the natural break is between sections 8.2 and 8.3)

**What you build:** the dashboard's suite with Vitest and Testing Library: 27 tests in 7 files, which mount the complete application in a test DOM, with an in-memory router and a mocked `fetch`, and which cover the pure functions, the reducer, the schema, the report states, the detail, the routes, the error boundary, and the registration form

**What you learn:** queries by role and why they matter for accessibility; `getBy`, `queryBy`, `findBy`; `user-event`; mocked `fetch`; the four states, the form, and a route with an in-memory router; **the test that turns red when you revert the fix**; what jsdom can NOT check

**Where you are coming from.** From the checkpoint of [Lesson 7](07-formularios-accesibilidad.md): a `revisor` with the list at `/`, the detail at `/servicios/:nombre`, the registration at `/servicios/nuevo`, and a “not found” page; server data in TanStack Query; a notice tray with its reducer and its context; and a form that is validated with a schema, marks its errors with `aria-invalid` and `aria-describedby`, and does not take focus away from the button while submitting. Up to here, all of that was checked with figures that ran in a test DOM and with headless Chrome, once, by hand. From the TypeScript course you bring, if you took it, a test with jsdom. It is not repeated here: you change tools and, above all, questions. No longer “does this function return what I say?”, but “does this screen do what a person expects?”.

**What this lesson does not do.** It does not change a single line of the application: the JavaScript that `npm run build` produces is identical, byte for byte, to Lesson 7's. Everything new is tests, the configuration that runs them, and four helper files. It does not use `@testing-library/jest-dom`, the library that adds matchers like `toBeInTheDocument()`: the tests compare `textContent` and attributes with Vitest's `expect`, which is enough and forces you to say exactly what is expected. It does not use `vi.mock` to replace the application's modules: the only fake thing is the network, for reasons explained in 8.3. It does not write end-to-end tests with a real browser (Playwright, Cypress, Vitest's browser mode): it names what those tools would solve and says what is left to check by hand. And it does not measure coverage: a percentage of executed lines does not say whether a test would turn red in the face of the error that matters, and this lesson teaches you to check that other thing.

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions from this lesson's `package.json`. The checkpoint was installed from scratch with `npm ci` in a copy outside the repository, and there `npm run lint`, `npm run build`, and `npm test` finished with code 0; `npm run build` produced `dist/assets/index-C_lOH5GL.js` (measured again on October 22, 2026, on macOS), the same name as in Lesson 7. The test count was read from Vitest's summary, not from the exit code. The third test in `PaginaServicio.test.tsx` (the one for the old detail, 8.3.4) was added when reviewing the lesson: it was seen red with the previous page (`1 failed | 26 passed (27)`) and green with the checkpoint, and the outputs of exercise 3 and of the complete suite were rerun with the new checkpoint. All the Vitest outputs in the lesson were taken with `--reporter=default` (or `--reporter=verbose`, where stated), which is what you would see in an interactive terminal; the reporter was pinned on purpose because, outside a terminal, Vitest may choose another one that hides the console output of passing tests (see “The error you will see”). The working copy also had the files for exercises 3 and 4; for the complete run, Vitest was given the paths of the checkpoint's seven files, which is the same as running `npx vitest run` in the checkpoint. Each test that “turns red” was triggered in that copy, changing a single file, running only the affected test file, and restoring afterward; at the end, the copy was compared with the checkpoint using `diff -r` and had no differences, except for the test files of exercises 3 and 4, which are not part of the checkpoint. The checkpoint was also installed from scratch in a Linux container (Debian 12, official `node:24.22.0-bookworm` image): there `npm run build` gave the same filename and `npm test` finished with code 0 and `Tests  27 passed (27)`. It was not run on a real Linux Mint; nothing shown depends on the system, except the pixel measurements of the twin page in Chrome (row 3 of figure 3), which depend on the installed fonts. What matters there is that Chrome measures and jsdom returns zeros. The figures were run with their own `package.json` in [`programas/08-pruebas-de-componentes/`](../programas/08-pruebas-de-componentes), next to `revisor/`, as in earlier lessons: they are compiled with `tsc` and run with `node`. Figure 3 also has a twin HTML page that was opened in headless Chrome 155.0.8059.85, with `--headless --dump-dom` on the local file, to compare what jsdom does with what a browser does; that run opened no port. What was **not** measured in this lesson, and is stated where it appears: going through the form with the keyboard in a real window and the sound of a screen reader. Both were measured or described in Lesson 7 and return here in “How I know I got it”. In the outputs, long paths are shown starting from `~/curso-react`. The exercise test files and the outputs of the suite, of the negative control, and of each reversion are in `programas/08-pruebas-de-componentes/ejercicios/` (they were rerun when applying the review, so their times and durations differ from those pasted here). The practice server (the same file since Lesson 4) responds `400` with `{"detalle":"nombre de servicio inválido"}` to an address with a malformed `%`, such as `/api/servicios/%`, and to its `/reintento` route; it used to respond `500`. It was measured with `curl` against a copy, before and after, and the process stayed alive in both cases.

## By the end you will be able to

- Install Vitest, jsdom, and Testing Library in a Vite project, configure the test environment, and explain why `cleanup` has to be called by hand when Vitest does not expose its functions as globals.
- Find an element by its role and accessible name, and demonstrate with a figure that a query by role does not find a button made with a `<span>` or a field without a label.
- Choose between `getBy`, `queryBy`, and `findBy` according to what the test asserts (that something is there, that something is not there, that something is going to arrive), and read the error each one gives when it fails.
- Simulate a person with `user-event`: typing, pressing Tab and Space, clicking, and explain why those actions are awaited with `await`.
- Mount the complete application at an address with an in-memory router, a fresh cache, and a mocked `fetch`, and use that to test the report states, a route, and the registration form.
- Check that a test protects a fix: revert the fix in a copy, see the test red with the exact message, and restore, and recognize a green test that does not turn red.
- Name what jsdom does not compute (layout, the focus that is lost when a button is disabled) and design the test so that it checks the cause when the effect cannot be seen.

## The why before the how

Up to Lesson 7, every time the `revisor` changed, someone checked that it still worked. They did it well: with figures that rendered a component in a test DOM, with `curl` against the practice API, with headless Chrome driven by a script. But they did it **once**, at the moment of writing the lesson. The opening scene is what happens the second time: the code changes, the linter and the compiler stay green, and nobody goes through the walkthrough again. Ask the dashboard four things and you will see what is missing.

**Who remembers the odd cases?** The stray `0` from Lesson 1 only appears when **no** service is failing. The practice API always starts with two failing. To see the error you would have to register healthy services, retry the failed ones, or empty the API, and then look at the summary. Nobody does that before every release. A test does, because it decides what the API answers.

**How do you test what depends on the network without depending on the network?** The report has four states plus one: loading, error, empty, with data, and with stale data when the refresh fails. Seeing “loading” in a browser requires a slow API; seeing the error, a downed API; the empty one, yet another API. The practice API has the `ESCENARIO` variable for that, but starting it three times with three values is not something that runs in two seconds. If the test controls what `fetch` answers, each state is one line.

**How do you know the test looks at the same thing the person looks at?** A test that looks for `.boton-enviar` or `div > button:nth-child(2)` passes even if the button has turned into a `<span>` that a screen reader does not announce and the keyboard cannot reach. Testing Library's queries start from somewhere else: the **role** and the **accessible name**, which are what the browser hands to assistive technology. If a test finds “the button named Dar de alta”, that button is in the accessibility tree with that role and that name: a screen reader announces it that way. What the query does **not** check is that it can be reached with Tab or that it responds to Enter or Space; that is guaranteed by the native `<button>` (Lesson 7) and, in this suite, exercised by the focus test with `usuario.tab()` and `usuario.keyboard(" ")`. It is the same habit as in Lesson 7, now automatic.

**How do you know the test is any good?** This is the question almost nobody asks. A green test says that the current code does what the test asserts. It does not say that the test would turn red if the fix disappeared. There are tests that pass with the good code **and** with the bad: they protect nothing and give false reassurance. The only way to know is to run the experiment: remove the fix, see the red, restore. This lesson does it with three tests from the suite (and a fourth in exercise 2) and teaches you to recognize one that fails the exam.

The four answers fit in three concepts: querying the page the way a person does (8.2), mounting the complete application without a network or a browser (8.3), and the test that turns red when you revert the fix (8.4). Installation comes first (8.1) and afterward, with the same frankness, what jsdom cannot check (8.5). At the end, this is what `npm test` says with the detailed reporter, which prints one line per test:

```bash
$ npx vitest run --reporter=verbose
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/avisos/avisos.test.ts > reducirAvisos > agrega al principio con un identificador nuevo 1ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > descarta uno por su identificador y no toca los demás 0ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > conserva solo los 5 más recientes 0ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > descartar todos vacía la bandeja y conserva el contador 0ms
 ✓ src/reporte/resumen.test.ts > resumen > cuenta solo los servicios en falla 1ms
 ✓ src/reporte/resumen.test.ts > resumen > usa singular y plural 0ms
 ✓ src/reporte/resumen.test.ts > resumen > filtra por falla y por nombre, sin importar mayúsculas 0ms
 ✓ src/compartido/esquema.test.ts > validarCampos con el esquema del alta > convierte el texto del formulario en un NuevoServicio 2ms
 ✓ src/compartido/esquema.test.ts > validarCampos con el esquema del alta > informa todos los campos inválidos a la vez 0ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > cargando: anuncia la carga mientras la API no responde 157ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > sin datos marca los tres campos y lo anuncia 447ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > error: muestra el motivo y un botón para reintentar 395ms
 ✓ src/app/rutas.test.tsx > las rutas > una dirección desconocida muestra la página de no encontrada 629ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > muestra el detalle del servicio de la dirección 581ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > volver a revisar deja un aviso en la bandeja 86ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > vacío: lo dice en lugar de dejar la lista en blanco 134ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > con datos: un enlace por servicio y el resumen de fallas 53ms
 ✓ src/app/rutas.test.tsx > las rutas > el menú marca la página actual 113ms
 ✓ src/app/rutas.test.tsx > las rutas > una página que se rompe al dibujar muestra el aviso del revisor 122ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > sin fallas no pinta un 0 suelto en el resumen 34ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > con datos válidos envía el alta y confirma 546ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > si la actualización del detalle falla, conserva el detalle y la nota que se escribía 518ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > el filtro «solo fallas» viaja en la dirección 401ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > una dirección con el filtro ya puesto abre filtrada 72ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > declara los obligatorios y la bandeja anuncia solo el aviso nuevo 176ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora 613ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > un nombre repetido se marca en su campo con el mensaje de la API 550ms

 Test Files  7 passed (7)
      Tests  27 passed (27)
   Start at  16:08:16
   Duration  4.69s (environment 54%, tests 29%, setup 8%, transform 4%, import 4%, worker 1%)
```

That is 27 lines with `✓`, and the summary confirms it: `Tests  27 passed (27)`. Notice how the names read: “el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora”. Each test says what behavior it protects, in the language of whoever uses the dashboard, not of whoever programmed it. When one turns red, the name will tell you what broke before you read a line of code. And notice the milliseconds: the tests that mount the application took from 34 to 629 ms in this run; those for pure functions, from 0 to 2. The complete suite, including jsdom startup, took 4.69 s. Those milliseconds depend on what the machine has running (the previous run, with the machine freer, gave 8 to 112 ms and 1.06 s), so read them as an order of magnitude: what holds is that pure functions take almost nothing and mounting the application costs hundreds of times more.

## The concepts

### 8.1 Installation: Vitest, jsdom, and Testing Library

#### 8.1.1 Five dependencies and one script

This lesson's checkpoint adds five development dependencies and one script. This is the complete `package.json`:

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.8.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "servidor": "node servidor/practica.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@tanstack/react-query": "5.104.5",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "react-router": "8.5.0"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@testing-library/dom": "10.4.2",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.8",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "npm:typescript@7.0.2",
    "@vitejs/plugin-react": "6.1.2",
    "eslint": "10.13.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "jsdom": "30.1.3",
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "typescript-eslint": "8.72.0",
    "vite": "8.3.5",
    "vitest": "5.0.5"
  }
}
```

Each piece has a different job, and it is worth not confusing them:

- **`vitest`** is what runs the tests: it finds the `*.test.ts` and `*.test.tsx` files, transforms them with the same Vite configuration the project already uses (that is why it understands TypeScript and JSX without a separate step), and provides the `test`, `describe`, `expect`, and `vi` functions.
- **`jsdom`** is a DOM written in JavaScript: `document`, `window`, elements, events, forms. It is not a browser; it is the part of the browser that can be imitated without drawing anything. You already used it in the figures of earlier lessons.
- **`@testing-library/dom`** brings the queries (`getByRole`, `findByText`…) and the waiting (`waitFor`). It knows nothing about React. It is installed separately because `@testing-library/react` declares it as a peer dependency and does not bring it; its documentation asks to install both together. The figures import it directly for `logRoles` (8.2.2).
- **`@testing-library/react`** is a thin layer on top: `render`, which renders a React component into the test DOM, and `cleanup`, which unmounts it. It wraps its functions in `act` for you, which is React's tool for applying all pending changes before comparing ([React, `act`](https://react.dev/reference/react/act)). React's documentation adds that, with React Testing Library, the `IS_REACT_ACT_ENVIRONMENT` variable “is already set”. That is half true: the library turns it on **permanently** only when the runner exposes `beforeAll` as a global, just as happens with `cleanup`; without globals, it turns it on only for the duration of each `render` or each event that it itself wraps in `act`, and turns it off during each wait. An update that happens outside those stretches (a timer, a response that arrives late) would never warn. That is why `preparar.ts` turns it on by hand (8.1.3). And that is why `act` hardly appears in this suite: the only time it is used by hand is in exercise 3, to navigate with the router from outside a click.
- **`@testing-library/user-event`** simulates a person: typing, clicking, pressing keys. It is explained in 8.2.3.

The new script is `"test": "vitest run"`. The word `run` matters: without it, in your terminal `vitest` stays watching your files and reruns the tests on every change, which is convenient while you program and gets in the way of a check that has to finish. (It runs only once on its own on a continuous integration server, in a non-interactive terminal, or when it detects that a programming assistant is running it.) With `run`, it runs once anywhere and exits with code 0 if everything passed, or 1 if something failed.

As throughout the course, versions are exact. They were measured by `npm view` on October 21, 2026 and are the same as in the README's “Versions this was written with” table. If someday they differ, the checkpoint's `package.json` rules.

#### 8.1.2 The configuration lives in `vite.config.ts`

Vitest reads Vite's configuration. A separate file is not needed; a `test` section is enough:

```ts
// revisor/vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
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
  },
});
```

Compared with Lesson 7, two things change. The first: `defineConfig` is imported from `vitest/config` and not from `vite`. It is the same function with a wider type, which knows the `test` section; with the one from `vite`, TypeScript would reject that key. (Vitest's documentation also shows the other way out, which is to keep the `vite` import and add a triple-slash type reference at the top of the file; the checkpoint chose the import, which reads without knowing what a triple slash is.)

The second: the `test` section, with two options.

- **`environment: "jsdom"`.** By default, Vitest runs tests in the `node` environment, with no `document` or `window` ([Vitest, “Test Environment”](https://vitest.dev/guide/environment.html)). With `jsdom`, before each test file it creates a DOM and puts its objects in the global scope, as if the file ran on a page. That is why `jsdom` has to be installed: Vitest uses it, but does not bring it.
- **`setupFiles`.** A list of files that Vitest runs before each test file. Here it is just one, `preparar.ts`, and what it does deserves its own section.

What does not change matters too: `plugins: [react()]` is the same as always, so the tests see the transformed code the same way the development server sees it. And the `proxy` to the API plays no part in the tests: in them nobody goes to the network.

#### 8.1.3 What has to be cleaned up after each test

```ts
// revisor/src/pruebas/preparar.ts
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// React solo avisa de las actualizaciones fuera de act() si esta variable está encendida.
// Testing Library la enciende sola cuando el ejecutor expone `beforeAll` como global; con
// `globals` apagado no lo hace, y hay que hacerlo aquí.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
```

There are three statements, and each has a reason.

**`cleanup()`** unmounts everything that `render` rendered. Without it, the second test in a file would find in the DOM the first one's application **and** its own: two “Dar de alta” buttons, two trays, and a query like `getByRole("button", { name: "Dar de alta" })` would fail with “found multiple”. React Testing Library's documentation says that `cleanup` is called automatically if the test environment provides a global `afterEach` function, and that otherwise it has to be called after each test ([Testing Library, React API](https://testing-library.com/docs/react-testing-library/api)). And Vitest, by default, does **not** expose its functions as globals: the `globals` option is `false`, and its documentation warns of exactly this, that some libraries, such as `@testing-library/react`, depend on those globals to clean up on their own ([Vitest, `globals`](https://vitest.dev/config/globals.html)). The course leaves `globals` off on purpose: each test file imports `test`, `expect`, and `vi` explicitly, and you can see where each thing comes from. The price is this file.

**`vi.unstubAllGlobals()`** undoes what `vi.stubGlobal` did. The tests replace the global `fetch` with a fake one (8.3.1), and that change must not outlive the test that made it. According to the documentation, `vi.stubGlobal` changes the value of a global variable and `vi.unstubAllGlobals` restores the original values; with jsdom, the change is also visible on `window` ([Vitest, `vi`](https://vitest.dev/api/vi.html)).

**`IS_REACT_ACT_ENVIRONMENT = true`** turns on React's warnings about `act`. React only warns about a state update that happened outside `act` if that global variable is `true`; React's documentation asks to set it in the tests' setup file. React Testing Library turns it on by itself, but it does so from a global `beforeAll`, which does not exist with `globals` off: it is the same problem as `cleanup`. Without this line, the suite would never print an `act` warning, and “there is no warning” would prove nothing. The `as { IS_REACT_ACT_ENVIRONMENT?: boolean }` is for TypeScript, which does not know that property of `globalThis`.

That the line is worth it was measured with a negative control, a throwaway test that is not part of the checkpoint: a component changes its state with a timer, and the test waits with another timer, not with `findBy`, so nobody wraps the change in `act`. (`screen`, which appears in the test, queries the whole document; it is explained in 8.3.2.)

```tsx
// fragmento: una prueba de control, fuera del punto de control (programas/08-pruebas-de-componentes/ejercicios/control.test.tsx)
import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { expect, test } from "vitest";

function Tardio() {
  const [texto, establecerTexto] = useState("esperando");
  useEffect(() => {
    const temporizador = setTimeout(() => establecerTexto("listo"), 10);
    return () => clearTimeout(temporizador);
  }, []);
  return <p>{texto}</p>;
}

test("una actualización fuera de act", async () => {
  render(<Tardio />);
  // Se espera con un temporizador simple, no con findBy: nadie envuelve el cambio en act.
  await new Promise((listo) => setTimeout(listo, 50));
  expect(screen.getByText("listo")).toBeDefined();
});
```

With `preparar.ts` without the line:

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:10
   Duration  362ms (environment 66%, tests 20%, setup 10%, transform 3%, import 1%, worker 1%)
```

With the line:

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/pruebas/control.test.tsx > una actualización fuera de act
An update to Tardio inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:11
   Duration  349ms (environment 67%, tests 20%, setup 10%, transform 1%, import 1%, worker 1%)
```

The test passes in both cases, because the text does reach “listo”. What changes is that, with the line, React warns in the error output (`stderr`) that there was an update without `act`. That is the warning the `revisor` suite must not have, and does not have: with the line in place, the 27 tests pass without a single `stderr`.

Why `afterEach` and not `beforeEach`? Because cleaning up at the end leaves the DOM empty also after the **last** test, and because that way each test starts with what the cleanup left, not with what another test left. The tests do not depend on their order, which is the property that lets you run a single file, as you will do in 8.4.

#### 8.1.4 The first test does not need React

Before rendering anything, the easiest pieces to test are pure functions. Lesson 1 extracted the failure count to `resumen.ts` precisely for this: same inputs, same output, no DOM. Its test:

```ts
// revisor/src/reporte/resumen.test.ts
import { describe, expect, test } from "vitest";
import { reporteDeEjemplo } from "../pruebas/datos";
import { contarFallas, filtrarEstados, textoFallas } from "./resumen";

describe("resumen", () => {
  test("cuenta solo los servicios en falla", () => {
    expect(contarFallas(reporteDeEjemplo.estados)).toBe(2);
    expect(contarFallas([])).toBe(0);
  });

  test("usa singular y plural", () => {
    expect(textoFallas(1)).toBe("1 servicio con falla");
    expect(textoFallas(2)).toBe("2 servicios con falla");
  });

  test("filtra por falla y por nombre, sin importar mayúsculas", () => {
    const nombres = (soloFallas: boolean, texto: string) =>
      filtrarEstados(reporteDeEjemplo.estados, { soloFallas, texto }).map((estado) => estado.nombre);

    expect(nombres(false, "")).toEqual(["catálogo", "pagos", "inventario", "reportes"]);
    expect(nombres(true, "")).toEqual(["pagos", "reportes"]);
    expect(nombres(false, "PAG")).toEqual(["pagos"]);
    expect(nombres(true, "catá")).toEqual([]);
  });
});
```

Read the shape, because it is the shape of the whole suite. `describe` groups tests under a name; `test` defines one, with a name and a function; `expect(valor).toBe(esperado)` compares with `Object.is`, which for numbers and strings is the usual equality; `toEqual` compares the **shape** of arrays and objects, element by element. The third test uses a helper function, `nombres`, so that each line says only what changes: with or without “solo fallas”, with what text. The last case, `nombres(true, "catá")`, checks that the two filters combine: `catálogo` matches the text but is not failing, and that is why the list ends up empty.

The other two tests without React follow the same idea. The one for Lesson 6's notices reducer, which tests it without mounting a single component, as that lesson's figure had already done:

```ts
// revisor/src/avisos/avisos.test.ts
import { describe, expect, test } from "vitest";
import { estadoInicialAvisos, MAXIMO_AVISOS, reducirAvisos, type EstadoAvisos } from "./avisos";

function agregar(estado: EstadoAvisos, texto: string): EstadoAvisos {
  return reducirAvisos(estado, { tipo: "agregado", nivel: "exito", texto });
}

describe("reducirAvisos", () => {
  test("agrega al principio con un identificador nuevo", () => {
    const estado = agregar(agregar(estadoInicialAvisos, "primero"), "segundo");
    expect(estado.avisos.map((aviso) => [aviso.id, aviso.texto])).toEqual([
      [2, "segundo"],
      [1, "primero"],
    ]);
  });

  test("descarta uno por su identificador y no toca los demás", () => {
    const estado = agregar(agregar(estadoInicialAvisos, "primero"), "segundo");
    const despues = reducirAvisos(estado, { tipo: "descartado", id: 1 });
    expect(despues.avisos.map((aviso) => aviso.texto)).toEqual(["segundo"]);
    expect(estado.avisos).toHaveLength(2);
  });

  test(`conserva solo los ${MAXIMO_AVISOS} más recientes`, () => {
    let estado = estadoInicialAvisos;
    for (let numero = 1; numero <= MAXIMO_AVISOS + 2; numero += 1) {
      estado = agregar(estado, `aviso ${numero}`);
    }
    expect(estado.avisos).toHaveLength(MAXIMO_AVISOS);
    expect(estado.avisos[0]?.texto).toBe(`aviso ${MAXIMO_AVISOS + 2}`);
  });

  test("descartar todos vacía la bandeja y conserva el contador", () => {
    const estado = reducirAvisos(agregar(estadoInicialAvisos, "uno"), { tipo: "todos-descartados" });
    expect(estado).toEqual({ avisos: [], siguienteId: 2 });
  });
});
```

The second test asserts something a person would never see on screen: `expect(estado.avisos).toHaveLength(2)` after dismissing. It checks that the reducer **did not mutate** the state it received, which is the immutability rule from Lesson 2. And the third uses the `MAXIMO_AVISOS` constant instead of writing `5`: if the maximum changes tomorrow, the test keeps telling the truth.

And the one for Lesson 7's schema, which checks the difference that lesson explained: all the errors at once, not just the first.

```ts
// revisor/src/compartido/esquema.test.ts
import { describe, expect, test } from "vitest";
import { camposAlta } from "../alta/esquemaAlta";
import { validarCampos } from "./esquema";

describe("validarCampos con el esquema del alta", () => {
  test("convierte el texto del formulario en un NuevoServicio", () => {
    expect(
      validarCampos(camposAlta, { nombre: " correo ", url: "https://correo.example", timeoutMs: "1500" }),
    ).toEqual({
      ok: true,
      valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 },
    });
  });

  test("informa todos los campos inválidos a la vez", () => {
    expect(validarCampos(camposAlta, { nombre: "  ", url: "ftp://x", timeoutMs: "1.5" })).toEqual({
      ok: false,
      errores: {
        nombre: "escribe un valor",
        url: "escribe una dirección que empiece con http:// o https://",
        timeoutMs: "escribe un número entero mayor que cero",
      },
    });
  });
});
```

These nine tests cost almost nothing (0 to 2 ms each) and protect the logic that does not depend on React. But they do not see the screen. The stray `0` from the opening scene does not live in `contarFallas`, which correctly returns `0`: it lives in how `ResumenFallas` uses that `0` in JSX. To see it you have to render.

### 8.2 Querying the way a person does

#### 8.2.1 `getBy`, `queryBy`, `findBy`

Before seeing why it pays to search by role (8.2.2), you need to know the ways you can ask. Each query comes in three families, and the difference is not one of style: each asserts something different. The documentation summarizes it like this: `getBy` returns the element and throws a descriptive error if there is none; `queryBy` returns the element or `null`; `findBy` returns a promise that resolves when it appears. All three have an `All` version (`getAllBy`, `queryAllBy`, `findAllBy`) that returns an array. And the versions without `All` also fail if they find **more than one**.

Figure 1 shows it with a reduced copy of what `/` renders: an empty notice tray (a `role="status"` with no content, like the `revisor`'s) and the report content, which says “Cargando…” and a hundred milliseconds later shows the list.

```tsx
// fig08_01.tsx
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { useEffect, useState } from "react";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Una copia reducida de lo que dibuja `/`: la bandeja de avisos (un `status` vacío)
// y el contenido del reporte, que dice «Cargando…» y 100 ms después muestra la lista.
function Reporte() {
  const [estados, establecerEstados] = useState<readonly string[] | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerEstados(["catálogo", "pagos"]), 100);
    return () => clearTimeout(temporizador);
  }, []);

  return (
    <>
      <section aria-label="Avisos">
        <div role="status" aria-atomic="false"></div>
      </section>
      {estados === null ? (
        <p role="status">Cargando…</p>
      ) : (
        <ul>
          {estados.map((nombre) => (
            <li key={nombre}>{nombre}</li>
          ))}
        </ul>
      )}
    </>
  );
}

// Solo la primera línea del mensaje: el resto es el DOM completo, que aquí estorba.
function primeraLinea(error: unknown): string {
  return error instanceof Error ? error.message.split("\n")[0] : String(error);
}

const pantalla = render(<Reporte />);

console.log("1. antes de que lleguen los datos");
try {
  pantalla.getByRole("list");
} catch (error) {
  console.log(`   getByRole("list")   lanza: ${primeraLinea(error)}`);
}
console.log(`   queryByRole("list") devuelve: ${String(pantalla.queryByRole("list"))}`);
try {
  pantalla.getByRole("status");
} catch (error) {
  console.log(`   getByRole("status") lanza: ${primeraLinea(error)}`);
}
console.log(`   getAllByRole("status") encuentra: ${pantalla.getAllByRole("status").length}`);
const cargando = pantalla.getByText("Cargando…");
console.log(`   getByText("Cargando…") tiene role="${cargando.getAttribute("role")}"`);

console.log("2. esperando con findBy");
const lista = await pantalla.findByRole("list");
console.log(`   findByRole("list") la encontró, con ${lista.children.length} elementos`);
console.log(`   queryByText("Cargando…") ahora devuelve: ${String(pantalla.queryByText("Cargando…"))}`);

console.log("3. lo que nunca aparece");
try {
  await pantalla.findByRole("table", {}, { timeout: 300 });
} catch (error) {
  console.log(`   findByRole("table") rechaza: ${primeraLinea(error)}`);
}

pantalla.unmount();
dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_01.tsx
$ node fig08_01.js
1. antes de que lleguen los datos
   getByRole("list")   lanza: Unable to find an accessible element with the role "list"
   queryByRole("list") devuelve: null
   getByRole("status") lanza: Found multiple elements with the role "status"
   getAllByRole("status") encuentra: 2
   getByText("Cargando…") tiene role="status"
2. esperando con findBy
   findByRole("list") la encontró, con 2 elementos
   queryByText("Cargando…") ahora devuelve: null
3. lo que nunca aparece
   findByRole("table") rechaza: Unable to find role="table"
```

Eight results, and each one teaches something.

**Before the data arrives, `getByRole("list")` throws and `queryByRole("list")` returns `null`.** It is the same question with two different answers for “it is not there”. Use `getBy` when the element **has to** be there: if it is missing, the test stops on that line with a message that says what you were looking for and, below it, the DOM that was there (it is printed by Testing Library, not Vitest, trimmed to 7,000 characters unless you change `DEBUG_PRINT_LIMIT`; the figure cuts it with `primeraLinea` because here it gets in the way). Use `queryBy` when you want to assert that something is **not** there: `expect(screen.queryByRole("list")).toBeNull()`. Writing that with `getBy` is impossible, because it would throw before reaching the `expect`. The `revisor`'s empty-state test uses exactly that line.

**`getByRole("status")` throws “Found multiple elements with the role "status"”.** On the screen there are **two** status regions: the notice tray, which is always there (Lesson 6), and the “Cargando…”. `getBy` demands one and only one. This detail is real in the `revisor` and explains a line in its suite that would otherwise look odd: the “loading” test looks for the text with `findByText("Cargando…")` and **afterwards** checks that its role is `status`. That way it finds the element without ambiguity and still asserts that it is announced as a status region. The other way out would be to filter by name, but a `status` does not take its name from its content, so “Cargando…” is not its name.

**`findByRole("list")` waits and finds the list with two elements**, and afterwards `queryByText("Cargando…")` is already `null`. `findBy` is the combination of `getBy` with `waitFor`: it repeats the query every 50 ms until it finds it or until 1000 ms pass, and it also retries every time the DOM changes ([Testing Library, “Async Methods”](https://testing-library.com/docs/dom-testing-library/api-async/)). In the `revisor` almost everything arrives late: the report depends on a `fetch`, the tray's notice depends on an action, the page depends on the router. That is why almost all of the suite's component tests begin with an `await screen.findBy…`: it is the way of saying “wait until the screen reaches this point”.

**`findByRole("table")` rejects “Unable to find role="table"”** after the timeout, which the figure lowered to 300 ms so as not to wait the full second. A `findBy` that never finds anything does not hang: it fails with a message.

A rule that follows from this: **do not wrap a `getBy` in a hand-written `waitFor`** if what you want is to wait for an element; `findBy` exists for that. And do not use `findBy` for something that is already there: it works, but it tells whoever reads the test that you were waiting for something you were not waiting for. Each family communicates an intention.

Why did the figure not warn about `act`? Because it runs with `node`, outside a test, and nobody turned on `IS_REACT_ACT_ENVIRONMENT`: without that variable, React does not warn. In the suite it is on (`preparar.ts`, 8.1.3). And there, while a `findBy` waits, React Testing Library turns it **off** on purpose, because the wait is already the right way of letting the screen get to where it is going. A warning that mentions `act(` appears when an update happens with nobody waiting, for example after the test has ended; in 8.4.3 you will see a real one. The `revisor` suite's complete output has none.

#### 8.2.2 By role and by name

When a person uses the dashboard they do not think “the second `<button>` inside the `<form>`”. They think “the Dar de alta button”. Someone using a screen reader hears the same: “Dar de alta, button”. Those two words are the **accessible name** and the **role**, the same ones from Lesson 7, and they are what the browser hands to assistive technology. Testing Library orders its queries by that criterion. On its queries page it puts first the ones it calls “accessible to everyone” (`getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`), because they reflect the experience of someone using the mouse and sight and also that of someone using assistive technology; then the semantic ones (`getByAltText`, `getByTitle`), and last, test IDs (`getByTestId`) ([Testing Library, “About Queries”](https://testing-library.com/docs/queries/about/)). Behind it is a principle that the library itself writes like this: the more your tests resemble the way your software is used, the more confidence they can give you ([Testing Library, “Guiding Principles”](https://testing-library.com/docs/guiding-principles)).

The practical consequence is stronger than it looks: **a query by role fails if the element does not have that role and that name in the accessibility tree**, or if it is hidden from it. It is not a complete accessibility test (a `<span role="button">` without `tabindex` would pass the query and still be out of the keyboard's reach), but it rules out the most common imitation, which is the one in figure 2. To see it, figure 2 renders the same thing twice: a tray notice with its “Descartar” button and a “Nombre” field. On top with native elements; below, an imitation that would look the same with a little CSS.

```tsx
// fig08_02.tsx
import { logRoles } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Dos versiones de lo mismo: un aviso de la bandeja con su botón y un campo.
// La de arriba usa los elementos nativos; la de abajo se ve igual con CSS, pero no lo es.
function Nativo() {
  return (
    <section aria-label="Nativo">
      <p>
        Se dio de alta correo{" "}
        <button type="button" aria-label="Descartar: Se dio de alta correo">
          Descartar
        </button>
      </p>
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" name="nombre" />
    </section>
  );
}

function Imitacion() {
  return (
    <section aria-label="Imitación">
      <p>
        Se dio de alta correo <span className="boton">Descartar</span>
      </p>
      <p>Nombre</p>
      <input name="nombre" />
    </section>
  );
}

function probar(descripcion: string, consulta: () => unknown): void {
  try {
    consulta();
    console.log(`   ${descripcion}: lo encuentra`);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(`   ${descripcion}: ${mensaje}`);
  }
}

for (const [titulo, Componente] of [
  ["nativo", Nativo],
  ["imitación", Imitacion],
] as const) {
  const pantalla = render(<Componente />);
  console.log(`${titulo}:`);
  probar('getByText("Descartar")', () => pantalla.getByText("Descartar"));
  probar('getByRole("button", { name: "Descartar: Se dio de alta correo" })', () =>
    pantalla.getByRole("button", { name: "Descartar: Se dio de alta correo" }),
  );
  probar('getByRole("button", { name: "Descartar" })', () =>
    pantalla.getByRole("button", { name: "Descartar" }),
  );
  probar('getByLabelText("Nombre")', () => pantalla.getByLabelText("Nombre"));
  probar('getByRole("textbox", { name: "Nombre" })', () =>
    pantalla.getByRole("textbox", { name: "Nombre" }),
  );
  pantalla.unmount();
}

// logRoles colorea su salida para la terminal; en un archivo, los colores estorban.
process.env.COLORS = "false";
console.log("logRoles del nativo:");
const nativo = render(<Nativo />);
logRoles(nativo.container);
nativo.unmount();
dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_02.tsx
$ node fig08_02.js
nativo:
   getByText("Descartar"): lo encuentra
   getByRole("button", { name: "Descartar: Se dio de alta correo" }): lo encuentra
   getByRole("button", { name: "Descartar" }): Unable to find an accessible element with the role "button" and name "Descartar"
   getByLabelText("Nombre"): lo encuentra
   getByRole("textbox", { name: "Nombre" }): lo encuentra
imitación:
   getByText("Descartar"): lo encuentra
   getByRole("button", { name: "Descartar: Se dio de alta correo" }): Unable to find an accessible element with the role "button" and name "Descartar: Se dio de alta correo"
   getByRole("button", { name: "Descartar" }): Unable to find an accessible element with the role "button" and name "Descartar"
   getByLabelText("Nombre"): Unable to find a label with the text of: Nombre
   getByRole("textbox", { name: "Nombre" }): Unable to find an accessible element with the role "textbox" and name "Nombre"
logRoles del nativo:
region:

Name "Nativo":
<section
  aria-label="Nativo"
/>

--------------------------------------------------
paragraph:

Name "":
<p />

--------------------------------------------------
button:

Name "Descartar: Se dio de alta correo":
<button
  aria-label="Descartar: Se dio de alta correo"
  type="button"
/>

--------------------------------------------------
textbox:

Name "Nombre":
<input
  id="nombre"
  name="nombre"
/>

--------------------------------------------------
```

Read the output by columns. **`getByText("Descartar")` finds both versions.** Searching by text does not know whether what it found is a button, a `<span>`, or a paragraph. A test written that way would pass with the imitation, which the keyboard cannot reach and which a screen reader does not announce as a button.

**`getByRole("button", { name: "Descartar: Se dio de alta correo" })` finds only the native one.** The `button` role belongs to the `<button>` without anyone writing `role="button"`: it is an implicit role, and the `ByRole` documentation says so with that same example ([Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole)). The imitation has no button role, so it does not exist for the query, just as it does not exist for a screen reader.

**`getByRole("button", { name: "Descartar" })` finds neither**, and this is surprising the first time. The native button **says** “Descartar” on the screen, but its accessible name is “Descartar: Se dio de alta correo”, because `aria-label` wins over the content. It is exactly what the Lesson 6 tray wanted: with five notices in the list, five buttons all named “Descartar” would be impossible to tell apart for whoever hears them. The test checks it without meaning to: if someone removed the `aria-label`, the form test that looks for “Descartar: Se dio de alta correo” would turn red.

**`getByLabelText("Nombre")` and `getByRole("textbox", { name: "Nombre" })` find the native field and not the imitation.** The “Nombre” paragraph above the field looks like a label, but it is not related to it: it is figure 4 from Lesson 7 seen from a test.

The last part of the output is `logRoles`, a Testing Library debugging function that prints the implicit roles of a tree and the name of each element ([Testing Library, “Debugging”](https://testing-library.com/docs/dom-testing-library/api-debugging)). When you do not know what something is called for a query, `logRoles(container)` tells you. Notice that `section` appears as `region` with the name “Nativo”: a `<section>` with an accessible name has the `region` role, which is exactly what Lesson 1 explained for `Tarjeta`, and that is why the suite can search `getByRole("region", { name: "Avisos" })`. Two details of the figure: `logRoles` colors its output for the terminal, and the line `process.env.COLORS = "false"` turns that off so that the `.salida.txt` file reads cleanly (the documentation names that variable); and the paragraph appears with an empty name because paragraphs do not take their name from their content.

This does not mean that only `getByRole` is used. The suite uses `getByLabelText` for the form fields, which is more direct and says the same thing (the field has that label), and `getByText` or `findByText` for texts that are not controls, such as “No hay servicios configurados todavía.”. What it does **not** use is `getByTestId` or CSS selectors. The practical rule: search by role first; if the element has no useful role (a paragraph, loose text), by text; and if you need a test ID to find something, first ask yourself whether a person could find it.

There is a cost worth knowing about. `ByRole` computes the accessibility tree, and the documentation warns that those computations can be expensive with large DOM trees. With the `revisor` it is not noticeable (the slowest test in the suite took 629 ms in the run from 8.1, with the complete application mounted), but if a suite of yours drags, that is a suspect.

#### 8.2.3 `user-event`: a person, not an event

To test a form you have to type in it and submit it. Testing Library ships `fireEvent`, which dispatches **one** DOM event: a `click`, an `input`. But a person who clicks produces several events in a row (the pointer goes down, the pointer goes up, focus changes, the click), and one who types produces, for each key, a sequence of keyboard and input events. `user-event` simulates the complete interaction. Its documentation says it like this: it simulates complete *interactions*, which may dispatch several events and make checks along the way; for example, it does not let you click a hidden element or type in a disabled field, just as the browser would not ([Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro)).

Three usage rules, all three visible in `montar.tsx` and in the tests:

1. **`userEvent.setup()` before rendering.** The documentation recommends it that way, and `montarEn` does it in that order. It returns an object, `usuario`, with the `click`, `type`, `tab`, and `keyboard` methods.
2. **Each method is awaited with `await`.** They return promises, because between one key and the next they let React and the DOM finish their work. A `usuario.click(…)` without `await` is a test that compares before the click has happened.
3. **You act on what the person would touch.** `usuario.type(campo, "correo")` types into the field you found by its label; `usuario.tab()` moves focus to the next focusable element, like the Tab key; `usuario.keyboard(" ")` presses Space on whatever has focus. In the [keyboard documentation](https://testing-library.com/docs/user-event/keyboard), printable characters are written as is and named keys go between braces (`{Shift}`).

The difference shows in the suite's finest test: “focus is not lost on submit”. It reaches the button with Tab from the last field and submits with Space, which is what a person using a keyboard does. With `fireEvent.click(boton)` it would have skipped precisely the part that matters: that focus was on the button when it was submitted.

### 8.3 The whole application, without a network or a browser

#### 8.3.1 The only fake thing is the network

To test a `revisor` screen you have to decide what is real and what is fake. The options run from one extreme to the other: render `ContenidoReporte` alone, passing it by hand an object that imitates the result of `useQuery`; replace the `cargar.ts` module with `vi.mock` with one that returns whatever you want; or render the complete application and replace only `fetch`.

The checkpoint chose the third, and the reason is the same rule as in 8.2: resemble how the program is used. If the test passes `ContenidoReporte` an invented object, it checks that `ContenidoReporte` knows how to render that object, but not that TanStack Query produces it that way, nor that the query key is the right one, nor that `cargarReporte` validates the response. If the test replaces `cargar.ts`, it skips the network boundary that Lesson 0 wrote and Lesson 4 connected. `fetch`, on the other hand, is the program's **outer** boundary: everything on this side (the components, Query, the router, the validation with `esReportePublico`, the notices reducer) runs for real, and the only thing decided is what “the API” answers. It is the same boundary that the practice server imitates, but inside the process and in zero milliseconds.

```ts
// revisor/src/pruebas/fetchFalso.ts
import { vi } from "vitest";

export interface RespuestaFalsa {
  readonly status: number;
  readonly cuerpo: unknown;
}

export type Rutas = Readonly<Record<string, RespuestaFalsa | (() => Promise<RespuestaFalsa>)>>;

// Sustituye `fetch` por una función que responde según "MÉTODO /ruta". Lo que no
// esté en la tabla responde 404, para que una ruta olvidada se note en la prueba.
export function instalarFetchFalso(rutas: Rutas) {
  const falso = vi.fn(async (entrada: RequestInfo | URL, opciones?: RequestInit) => {
    const url = new URL(String(entrada), "http://localhost");
    const clave = `${opciones?.method ?? "GET"} ${decodeURIComponent(url.pathname)}`;
    const definida = rutas[clave];
    const respuesta =
      definida === undefined
        ? { status: 404, cuerpo: { detalle: `sin ruta falsa para ${clave}` } }
        : typeof definida === "function"
          ? await definida()
          : definida;

    return new Response(JSON.stringify(respuesta.cuerpo), {
      status: respuesta.status,
      headers: { "content-type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", falso);
  return falso;
}

export function nuncaResponde(): Promise<RespuestaFalsa> {
  return new Promise(() => {});
}
```

Walk through the function from top to bottom.

- **The route table.** `instalarFetchFalso` receives an object whose keys are `"METHOD /path"`, such as `"GET /api/estados"` or `"POST /api/servicios"`, and whose values are a response (`status` and `cuerpo`) or a **function** that returns a promise of a response. The function is for what does not answer immediately: a response that never arrives, or one that the test delivers when it wants.
- **The key comes from the request.** `new URL(String(entrada), "http://localhost")` converts the relative address the dashboard uses (`/api/estados`) into a full URL so that its `pathname` can be read. `decodeURIComponent` matters with `catálogo`: when the URL is built, the accent is percent-encoded (`/api/servicios/cat%C3%A1logo`), and the table is written with the accent, as a person would write it. The method comes from `opciones?.method`, and if it is absent it is `GET`, just like in `fetch`.
- **What is not in the table answers 404.** It is a small decision with big consequences. If a test forgets to declare a route, the dashboard receives a 404 with a `detalle` that says `sin ruta falsa para GET /api/…`, and the most likely thing is that the test fails showing that text. The other option, throwing an error or returning `undefined`, would produce more confusing failures, or none.
- **The response is a real `Response`.** `new Response(JSON.stringify(…), { status, headers })` is the standard class the browser also uses, and Node 24 provides it. That way `cargarReporte` reads `respuesta.ok`, `respuesta.status`, and `respuesta.json()` just as in production.
- **`vi.fn` records every call.** The fake is not just any function: `vi.fn` wraps it and stores the arguments of each call in `mock.calls`, which is an array with the arguments of each call, one per element ([Vitest, `mock`](https://vitest.dev/api/mock.html)). That is why `instalarFetchFalso` returns the fake: tests can ask whether it was called, how many times, and with what body.
- **`vi.stubGlobal("fetch", falso)`** installs it as the global `fetch`, and `preparar.ts` removes it when the test ends.

`nuncaResponde` is the shortest function in the course: a promise that never resolves. With it, the API “keeps thinking” forever, and the screen stays in its loading state for as long as the test needs to look at it.

The sample data lives separately, so that all the tests use the same ones:

```ts
// revisor/src/pruebas/datos.ts
import type { DetalleServicio, ReportePublico } from "../compartido/contrato";

export const reporteDeEjemplo: ReportePublico = {
  estados: [
    { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
    { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
    { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
    { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
  ],
};

export const detallePagos: DetalleServicio = {
  nombre: "pagos",
  estado: { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
  revisiones: 3,
  ultimaRevision: "2026-10-21T08:00:00.000Z",
};
```

These are the four services the practice API starts with, with the same states, and the detail for `pagos`. That they match is no coincidence: that way a test can be compared with what you see in the browser with `npm run dev`. And they are typed as `ReportePublico` and `DetalleServicio`: if the API's types change (`src/compartido/contrato.ts`), `tsc -b` flags the test data before a test passes by accident with stale data.

#### 8.3.2 Mounting the application at an address

```tsx
// revisor/src/pruebas/montar.tsx
import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Proveedores } from "../app/Proveedores";
import { rutas } from "../app/rutas";

// Monta la aplicación completa en una dirección, con un enrutador en memoria y una
// caché nueva en cada prueba, sin reintentos para que un error se vea de inmediato.
export function montarEn(direccion: string) {
  const clienteConsultas = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const enrutador = createMemoryRouter(rutas, { initialEntries: [direccion] });
  const usuario = userEvent.setup();

  render(
    <Proveedores clienteConsultas={clienteConsultas}>
      <RouterProvider router={enrutador} />
    </Proveedores>,
  );

  return { enrutador, usuario };
}
```

`montarEn` is the piece that makes every screen test fit in five lines, and each of its lines has a reason.

**A fresh `QueryClient` in each test.** TanStack Query's cache stores what came from the API. If two tests shared a client, the second would see the first one's report before requesting anything, and the “loading” state would not exist. One client per test is one empty cache per test. And it has `retry: false` in queries and mutations: in the application, `crearClienteConsultas` asks for `retry: 2`, and Lesson 4 measured the three requests that this produces with the API down. In a test, those retries only delay the error with growing waits; with `retry: false`, a 503 response becomes the error state immediately.

**`createMemoryRouter(rutas, { initialEntries: [direccion] })`.** The application uses `createBrowserRouter`, which keeps its history in the window's address bar. In jsdom that bar exists (the `history` API works), but it is **a single one** for all the tests in the file: the address one test left would be the starting point of the next. `createMemoryRouter` creates a router that keeps its history in memory, one per test, and its documentation describes it as useful for environments that are not a browser ([React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter)). `initialEntries` are the initial entries of that history: the test says “start at `/servicios/nuevo`” and the application starts there. What matters is **which** routes it receives: the same `rutas` array that `main.tsx` uses. That is why Lesson 5 wrote it as an exported array and not as JSX inside `main.tsx`. The tests do not test a copy of the routes; they test the routes.

**`<Proveedores clienteConsultas={…}>`.** The same component that `main.tsx` mounts, with the cache, the preferences, and the notice tray. Lesson 6 extracted it into its own file for this, and Lesson 4 explained the error a `useQuery` gives without its provider: if the test mounted the pages without `Proveedores`, they would fail for the wrong reason.

**What it returns.** `{ enrutador, usuario }`. The `usuario` is for acting; the `enrutador`, for asking where the application ended up (`enrutador.state.location.search`) or for navigating from the outside, as in exercise 3. What it does **not** return are `render`'s queries: the tests use `screen`, which queries the whole `document.body`. The difference matters little here and something in the future: if tomorrow a component renders something with a portal outside its container, `screen` still finds it.

Notice what `montarEn` does **not** mount: `StrictMode` or `LimiteDeError`, which are in `main.tsx` around everything. The tests mount what is inside. `StrictMode` is left out on purpose: in development it mounts, unmounts, and remounts every component (Lesson 3), so the first request of each query would be canceled and repeated, and counting `fetch` calls would become ambiguous. If one day you want that double pass in a test, React Testing Library offers it with `configure({ reactStrictMode: true })` or with the `reactStrictMode` option of `render`. The routes' error boundary is there, because it comes inside `rutas`, and it has its test in 8.3.4.

#### 8.3.3 The report states

With `instalarFetchFalso` and `montarEn`, the report states are seven nearly identical tests, which change only in what the API answers and in what is expected to be seen:

```tsx
// revisor/src/reporte/PaginaReporte.test.tsx
import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { reporteDeEjemplo } from "../pruebas/datos";
import { instalarFetchFalso, nuncaResponde } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página del reporte", () => {
  test("cargando: anuncia la carga mientras la API no responde", async () => {
    instalarFetchFalso({ "GET /api/estados": nuncaResponde });
    montarEn("/");
    const cargando = await screen.findByText("Cargando…");
    expect(cargando.getAttribute("role")).toBe("status");
  });

  test("error: muestra el motivo y un botón para reintentar", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 503, cuerpo: { detalle: "caída" } } });
    montarEn("/");
    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("la API respondió 503");
    expect(within(alerta).getByRole("button", { name: "Reintentar" })).toBeDefined();
  });

  test("vacío: lo dice en lugar de dejar la lista en blanco", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: { estados: [] } } });
    montarEn("/");
    expect(await screen.findByText("No hay servicios configurados todavía.")).toBeDefined();
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("con datos: un enlace por servicio y el resumen de fallas", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    montarEn("/");
    const lista = await screen.findByRole("list");
    expect(within(lista).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual([
      "catálogo",
      "pagos",
      "inventario",
      "reportes",
    ]);
    expect(screen.getByText(/2 servicios con falla/)).toBeDefined();
  });

  test("sin fallas no pinta un 0 suelto en el resumen", async () => {
    const sinFallas = { estados: reporteDeEjemplo.estados.filter((estado) => estado.tipo === "disponible") };
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: sinFallas } });
    montarEn("/");
    const resumen = await screen.findByText(/servicios revisados/);
    expect(resumen.textContent).toBe("2 servicios revisados");
  });

  test("el filtro «solo fallas» viaja en la dirección", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    const { enrutador, usuario } = montarEn("/");
    await screen.findByRole("list");
    await usuario.click(screen.getByRole("checkbox", { name: "Solo fallas" }));
    expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(2);
    expect(enrutador.state.location.search).toBe("?fallas=1");
  });

  test("una dirección con el filtro ya puesto abre filtrada", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    montarEn("/?q=inv");
    const lista = await screen.findByRole("list");
    expect(within(lista).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual(["inventario"]);
  });
});
```

Go through them in order, because together they are the table of states that Lesson 4 promised.

**Loading.** The API never answers, so the screen stays in `isPending`. The test looks for “Cargando…” by text and checks that its `role` is `status`, for the reason in figure 1: there are two status regions and a bare `findByRole("status")` would fail. What it protects: that the loading is **announced**. If someone changed the `<p role="status">` to a plain `<p>`, the test would turn red even though the text stayed on the screen.

**Error.** The API answers 503. The test looks for the alert, checks that the message includes `la API respondió 503` (written by `cargarReporte`) and that **inside the alert** there is a “Reintentar” button. `within(alerta)` scopes the query to that element: the button has to be next to the message, not anywhere on the page. Thanks to `retry: false`, the error appears on the first attempt.

**Empty.** The API answers `{ "estados": [] }`. The test waits for the text “No hay servicios configurados todavía.” and asserts with `queryByRole("list")` that there is **no** list. That second `expect` is the one that tells “empty” apart from “a list with no items”: an empty `<ul>` tells nobody anything.

**With data.** The four services. The test takes the list, all the links inside it, and compares their texts **in order**. Then it looks for the summary with a regular expression, `/2 servicios con falla/`. It is needed because the `<strong>`'s text is not “2 servicios con falla” but “ · 2 servicios con falla”, with the separator in front (`ResumenFallas.tsx`, line 10), and `getByText` with fixed text requires the element's text to match in full. The regular expression looks for just the piece that matters.

**With no failures it does not paint a stray 0.** The one the opening scene needed. The API answers only the two available services, and the test compares the summary's complete `textContent` with `"2 servicios revisados"`, exactly, with `toBe`. If anything else appeared in that text, a `0`, a space, a period, the comparison would fail. It is the case that the practice API does not have and that nobody would check by hand. In 8.4 you see it fail.

**The filter travels in the address.** Here the test acts: it waits for the list, clicks the “Solo fallas” checkbox (found by its role, `checkbox`, and its name) and checks two things. That the list now has two links, and that the router's address ends in `?fallas=1`. The second is Lesson 5's promise: the filter is URL state, so if someone moved it to a `useState`, the list would filter all the same, the first assertion would pass, and the second would not.

**An address with the filter already set opens filtered.** The other half of the same promise: mounting at `/?q=inv` and seeing only `inventario`. It is what happens when someone pastes a shared link.

Two states from the table are missing, and I say so that you do not look for them. The “with data and error” state of the **report** (the refresh failed, but the last report is still shown) has no test in the checkpoint; the one for the **detail** does, and it is the third test in 8.3.4. The “stale data while refreshing” one, the `· actualizando…` next to the time, does not either: it depends on a second request in flight. You write the two tests yourself in exercise 4, and without them the third point of the course's “How you know you are done” is not met.

#### 8.3.4 Routes, with an in-memory router

Two files test navigation. The detail one:

```tsx
// revisor/src/detalle/PaginaServicio.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { detallePagos } from "../pruebas/datos";
import { instalarFetchFalso, type RespuestaFalsa } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página de un servicio", () => {
  test("muestra el detalle del servicio de la dirección", async () => {
    instalarFetchFalso({ "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos } });
    montarEn("/servicios/pagos");
    expect(await screen.findByText("En falla: HTTP 503")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Servicio pagos" })).toBeDefined();
  });

  test("volver a revisar deja un aviso en la bandeja", async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    await usuario.click(await screen.findByRole("button", { name: "Volver a revisar" }));
    expect(await screen.findByText("pagos se volvió a revisar: disponible")).toBeDefined();
    expect(fetchFalso.mock.calls.some(([, opciones]) => opciones?.method === "POST")).toBe(true);
  });

  test("si la actualización del detalle falla, conserva el detalle y la nota que se escribía", async () => {
    // El primer GET responde bien; los siguientes, 503. El clic en «Volver a revisar»
    // invalida el detalle, y esa segunda petición es la que falla.
    const detalles: RespuestaFalsa[] = [{ status: 200, cuerpo: detallePagos }];
    instalarFetchFalso({
      "GET /api/servicios/pagos": async () => detalles.shift() ?? { status: 503, cuerpo: { detalle: "caída" } },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    const nota = await screen.findByLabelText("Nota sobre pagos");
    await usuario.type(nota, "revisar con infraestructura");
    await usuario.click(screen.getByRole("button", { name: "Volver a revisar" }));

    expect(await screen.findByText(/Mostrando el último detalle que llegó/)).toBeDefined();
    expect(screen.getByText("En falla: HTTP 503")).toBeDefined();
    expect((screen.getByLabelText("Nota sobre pagos") as HTMLTextAreaElement).value).toBe("revisar con infraestructura");
  });
});
```

The first test mounts directly at `/servicios/pagos` and waits for the service's state and the “Servicio pagos” heading. It checks in one go three things that nobody would check together: that the `servicios/:nombre` route leads to `PaginaServicio`, that `useParams` delivers `pagos`, and that the query requests `GET /api/servicios/pagos`. If the route requested another address, the fake would answer 404 and the expected text would never appear.

The second clicks “Volver a revisar” and waits for the notice in the tray, which is what Lesson 6 connected with `useReintentar`. Its last line checks that some `fetch` call was a `POST`: it goes through `fetchFalso.mock.calls` and asks about each one's method.

The third test exists because of a defect that an external review found and that neither of the other two could see. While the first detail request answers fine and the following ones with `503` (a function in the fake's table keeps count, as in exercise 4), the test writes a draft in “Nota sobre pagos”, clicks “Volver a revisar”, and waits for the notice “Mostrando el último detalle que llegó”. The click invalidates the detail, the second request fails, and the query's state becomes `error` with the previous data still in the cache. The test checks three things: the notice, the “En falla: HTTP 503” state still in view, and the note's draft intact. That last one matters as much as the notice: with the previous version of the page, which rendered the detail only if `consulta.isSuccess`, the note editor was unmounted with the error and the draft was lost.

A new test is not worth anything until you see it red. With the previous page (the `consulta.isSuccess` condition and a single error notice) the suite gives `1 failed | 26 passed (27)`, and the file, the following:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/detalle/PaginaServicio.tsx src/detalle/PaginaServicio.tsx
20c20
<       {consulta.isError && consulta.data === undefined && (
---
>       {consulta.isError && (
23,28c23
<       {consulta.isError && consulta.data !== undefined && (
<         <p role="alert" className="viejo">
<           Mostrando el último detalle que llegó: la actualización falló ({consulta.error.message}).
<         </p>
<       )}
<       {consulta.data !== undefined && (
---
>       {consulta.isSuccess && (
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/detalle/PaginaServicio.test.tsx (3 tests | 1 failed)
   ❯ la página de un servicio (3)
     ✓ muestra el detalle del servicio de la dirección
     ✓ volver a revisar deja un aviso en la bandeja
     × si la actualización del detalle falla, conserva el detalle y la nota que se escribía

 FAIL  src/detalle/PaginaServicio.test.tsx > la página de un servicio > si la actualización del detalle falla, conserva el detalle y la nota que se escribía
TestingLibraryElementError: Unable to find an element with the text: /Mostrando el último detalle que llegó/.
[… el DOM que había: solo «No se pudo cargar el detalle: la API respondió 503», sin detalle ni editor …]

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
```

With the checkpoint, the same test passes and the complete suite gives `27 passed (27)`:

```bash
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/PaginaServicio.test.tsx (3 tests)

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

The complete outputs are in `programas/08-pruebas-de-componentes/ejercicios/` (`detalle-viejo-con-isSuccess.salida.txt` and `detalle-viejo-punto-de-control.salida.txt`, with the `diff` in `detalle-viejo-con-isSuccess.diff.txt`).

And the one for the routes in general:

```tsx
// revisor/src/app/rutas.test.tsx
import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";
import { Proveedores } from "./Proveedores";
import { rutas } from "./rutas";

function PaginaRota(): never {
  throw new Error("la página se rompió al dibujar");
}

describe("las rutas", () => {
  test("una dirección desconocida muestra la página de no encontrada", async () => {
    instalarFetchFalso({});
    montarEn("/no-existe");
    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeDefined();
    expect(screen.getByText("No existe ninguna página en /no-existe.")).toBeDefined();
  });

  test("el menú marca la página actual", async () => {
    instalarFetchFalso({});
    montarEn("/servicios/nuevo");
    const actual = await screen.findByRole("link", { name: "Dar de alta" });
    expect(actual.getAttribute("aria-current")).toBe("page");
  });

  test("una página que se rompe al dibujar muestra el aviso del revisor", async () => {
    // React y React Router anuncian el error en la consola; aquí se espera, así que se calla.
    const consola = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => consola.mockRestore());

    // La ruta raíz del revisor, con su límite de error, y una sola página: una que lanza.
    const enrutador = createMemoryRouter([
      { ...rutas[0], index: false, children: [{ index: true, Component: PaginaRota }] },
    ]);
    render(
      <Proveedores clienteConsultas={new QueryClient()}>
        <RouterProvider router={enrutador} />
      </Proveedores>,
    );

    const aviso = await screen.findByRole("alert");
    expect(aviso.querySelector("h2")?.textContent).toBe("Algo salió mal al dibujar el panel");
    expect(aviso.querySelector("p")?.textContent).toBe("la página se rompió al dibujar");
    expect(screen.queryByText("Unexpected Application Error!")).toBeNull();
  });
});
```

**The unknown address** mounts at `/no-existe` and waits for `PaginaNoEncontrada`'s heading and text, with the address included. It checks that the catch-all route `*` exists and is at the end.

**The menu marks the current page** mounts at `/servicios/nuevo` and checks that the “Dar de alta” link has `aria-current="page"`. `NavLink` puts that attribute on the active link (Lesson 5), and it is what a screen reader announces as “current page”. The test does not look at the `active` class, which is only for painting: it looks at the attribute that reaches assistive technology.

**A page that breaks while rendering shows the revisor's notice** is different from the others, and is worth reading slowly. It does not use `montarEn`, because it needs a route that does not exist in the application: a page that throws an error when rendered. It builds its own router with the `revisor`'s **real root route**, `rutas[0]`, with its `Component: Disposicion` and its `ErrorBoundary: ErrorDeRuta`, but replaces its children with a single one, `PaginaRota`. The `index: false` is for TypeScript: in the `RouteObject` type, an index route cannot have children, and by writing it explicitly the copy ends up on the side of the routes that can. Then it checks that the alert appears with `AvisoDeError`'s title and message, and that the “Unexpected Application Error!” that React Router renders when a route has no boundary of its own (Lesson 5) does **not** appear.

The first two lines of that test silence the console. When a component throws, React and React Router announce the error with `console.error`, even if a boundary catches it: it is information for whoever develops. Here that error is **the scenario** of the test, not a problem, and letting it out would fill the output with stack traces that look like failures. `vi.spyOn(console, "error")` wraps the method and `.mockImplementation(() => undefined)` leaves it without effect; `onTestFinished(() => consola.mockRestore())` restores it at the end. `mockRestore` gives back the original method of an object spied with `vi.spyOn`, and `onTestFinished` is always called after the test has finished running, after the `afterEach` hooks ([Vitest, “Hooks”](https://vitest.dev/api/hooks.html)). It is used instead of a `consola.mockRestore()` at the end of the body for one reason: if the test fails halfway, the end of the body never runs, and the console would stay silent for the following tests. It silences only what this test causes, and only while it lasts.

#### 8.3.5 The form

The Lesson 7 registration form has the longest suite, because it is the screen with the most behavior: validating, submitting, announcing, not losing focus, not submitting twice, translating the 409.

```tsx
// revisor/src/alta/FormularioAlta.test.tsx
import { screen, within } from "@testing-library/react";
import { describe, expect, onTestFinished, test } from "vitest";
import { instalarFetchFalso, type RespuestaFalsa } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("el formulario de alta", () => {
  test("sin datos marca los tres campos y lo anuncia", async () => {
    const fetchFalso = instalarFetchFalso({});
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.click(await screen.findByRole("button", { name: "Dar de alta" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Revisa los campos marcados.");
    for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)"]) {
      expect(screen.getByLabelText(etiqueta).getAttribute("aria-invalid")).toBe("true");
    }
    expect(screen.getByLabelText("Nombre").getAttribute("aria-describedby")).toBe(
      "nombre-error nombre-ayuda",
    );
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  test("con datos válidos envía el alta y confirma", async () => {
    const fetchFalso = instalarFetchFalso({
      "POST /api/servicios": {
        status: 201,
        cuerpo: { nombre: "correo", tipo: "disponible", codigoHttp: 200, duracionMs: 75 },
      },
    });
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "correo");
    await usuario.type(screen.getByLabelText("Dirección"), "https://correo.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));

    // El éxito se anuncia una sola vez: en la bandeja de avisos, no también en el formulario.
    expect(await screen.findByRole("button", { name: "Descartar: Se dio de alta correo" })).toBeDefined();
    expect(screen.queryByText("Se dio de alta correo.")).toBeNull();
    const [, opciones] = fetchFalso.mock.calls[0] ?? [];
    expect(JSON.parse(String(opciones?.body))).toEqual({
      nombre: "correo",
      url: "https://correo.example/",
      timeoutMs: 1500,
    });
  });

  test("declara los obligatorios y la bandeja anuncia solo el aviso nuevo", async () => {
    instalarFetchFalso({});
    montarEn("/servicios/nuevo");

    for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)"]) {
      const campo = (await screen.findByLabelText(etiqueta)) as HTMLInputElement;
      expect(campo.required).toBe(true);
    }
    const bandeja = screen.getByRole("region", { name: "Avisos" });
    expect(within(bandeja).getByRole("status").getAttribute("aria-atomic")).toBe("false");
  });

  test("el foco no se pierde al enviar y un segundo envío se ignora", async () => {
    // La respuesta se entrega a mano. Una acción que nunca terminara dejaría pendiente
    // la Transition y enredaría las acciones de las pruebas siguientes: por eso, aunque
    // esta prueba falle a la mitad, al terminar se responde lo que quede pendiente.
    const creado: RespuestaFalsa = {
      status: 201,
      cuerpo: { nombre: "correo", tipo: "disponible", codigoHttp: 200, duracionMs: 75 },
    };
    let responder: (respuesta: RespuestaFalsa) => void = () => {};
    const fetchFalso = instalarFetchFalso({
      "POST /api/servicios": () => new Promise<RespuestaFalsa>((listo) => (responder = listo)),
    });
    onTestFinished(() => responder(creado));
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "correo");
    await usuario.type(screen.getByLabelText("Dirección"), "https://correo.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Dar de alta" }));

    await usuario.keyboard(" ");
    const pendiente = await screen.findByRole("button", { name: "Dando de alta…" });
    // jsdom no saca el foco de un botón desactivado (Chrome sí: lo manda al body), así
    // que se comprueba la causa: el botón sigue habilitado y anuncia que no está disponible.
    expect(pendiente.hasAttribute("disabled")).toBe(false);
    expect(pendiente.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(pendiente);

    // Un segundo Espacio mientras está pendiente. Si no se ignorara, React lo pondría en
    // cola y lo enviaría en cuanto terminara el primero: por eso se cuenta al final.
    await usuario.keyboard(" ");
    responder(creado);

    expect(await screen.findByRole("button", { name: "Descartar: Se dio de alta correo" })).toBeDefined();
    expect(document.activeElement).toBe(await screen.findByRole("button", { name: "Dar de alta" }));
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  test("un nombre repetido se marca en su campo con el mensaje de la API", async () => {
    instalarFetchFalso({
      "POST /api/servicios": {
        status: 409,
        cuerpo: { detalle: "ya existe un servicio llamado pagos", campos: { nombre: "ese nombre ya existe" } },
      },
    });
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "pagos");
    await usuario.type(screen.getByLabelText("Dirección"), "https://pagos.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));

    expect(await screen.findByText("ese nombre ya existe")).toBeDefined();
    expect(screen.getByLabelText("Nombre").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Dirección").getAttribute("aria-invalid")).toBe("false");
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("pagos");
  });
});
```

**With no data it marks the three fields and announces it.** The API has no route declared (`instalarFetchFalso({})`), so any request would answer 404. The test clicks “Dar de alta” with the form empty and checks four things: the alert's text, `aria-invalid="true"` on the three fields (found by their label, in a `for`), the name's `aria-describedby` with the error **before** the help text (the order in which the reader reads them, Lesson 7), and that `fetch` was never called. That last one is what demonstrates that validation happens in the browser: if the form sent the request and waited for the API to complain, the test would still see errors (the fake API would answer 404) but `not.toHaveBeenCalled()` would turn red.

**With valid data it submits the registration and confirms.** The API answers 201. The test types in the three fields, clicks, and waits for the “Descartar: Se dio de alta correo” button, which only exists when there is a notice in the tray. Then it asserts that the text “Se dio de alta correo.” with a period, the one a form with its own success region would have (the version with two `status` regions that Lesson 7 discarded in 7.3.3), is **not** there: success is announced in a single place. Finally it reads the body of the first `fetch` call: `fetchFalso.mock.calls[0]` is the argument array `[entrada, opciones]`, and the destructuring `const [, opciones]` skips the first. The body is JSON, so it is converted with `JSON.parse` and compared with `toEqual`. Notice the URL: the person typed `https://correo.example` and `https://correo.example/` traveled, with the trailing slash that the schema adds. The test documents that normalization.

**It declares the required fields and the tray announces only the new notice.** Two of Lesson 7's fixes, in one test. `campo.required` is the DOM property that reflects the `required` attribute; the `as HTMLInputElement` tells TypeScript that what was found by label is an `<input>`, because `findByLabelText` only promises an `HTMLElement`. And the tray is found by its region role and its name, “Avisos”, and inside it the `status`, to read its `aria-atomic`. It is an attribute test, not a behavior test: jsdom has no screen reader, so the closest it can get is to check that the attribute the reader needs is set.

**Focus is not lost on submit and a second submit is ignored.** The suite's most careful test, and the one the opening scene needed for the button. It goes in steps.

1. *The response is delivered by hand.* The `POST /api/servicios` route is a function that returns a promise and stores its `listo` in the `responder` variable. As long as nobody calls `responder`, the registration is pending, and the test can look at the form in that state for as long as it wants. It is the controllable version of `nuncaResponde`.
2. *`onTestFinished(() => responder(creado))`.* If the test failed halfway, the registration would stay pending forever, and with it the React *Transition* that wraps it (Lesson 7). The file's comment says what would happen: that unfinished action would entangle the following tests' actions. That is why, whatever happens, at the end whatever is left pending is answered.
3. *Reaching the button the way Raúl would.* It types in the three fields and presses Tab: focus moves from the last field to the button. The test checks it with `document.activeElement`, the element that has focus.
4. *Submitting with Space.* `usuario.keyboard(" ")` on the focused button. The test waits for the “Dando de alta…” button, which only exists while `useFormStatus` says `pending`.
5. *Checking the cause, not the effect.* Here is the most important decision, and the comment says it: jsdom does not take focus away from a disabled button; Chrome does. If the test only checked `document.activeElement`, it would also pass with `disabled={pending}`, because in jsdom focus stays where it was even though in the browser it goes to the `body`. That is why it first checks what **causes** the focus to be kept: that the button does **not** have the `disabled` attribute and **does** have `aria-disabled="true"`. `activeElement` is also checked, but it is the weak assertion; the strong one is the previous one. Section 8.5 measures that difference between jsdom and Chrome.
6. *The second Space.* With the registration still pending, another `usuario.keyboard(" ")`. If `BotonEnviar`'s guard did not cancel the click, React would queue that second submit.
7. *Answering and counting.* `responder(creado)` finishes the registration. The test waits for the tray's notice, checks that focus is on the button, that it has gone back to saying “Dar de alta”, and that `fetch` was called **once**.

**A repeated name is marked on its field with the API's message.** The API answers 409 with `campos.nombre`. The test waits for the error text (“ese nombre ya existe”, which comes from the API and not from the schema), checks that only “Nombre” ends up invalid and that “Dirección” stays `false`, and that the field keeps what was typed. That last line protects the `defaultValue` from Lesson 7's state: if `Campo` received a fixed value, React would empty the field after the action, and the person would have to retype everything over a single error.

### 8.4 The test that turns red when you revert the fix

#### 8.4.1 The experiment

A green test answers “does the code do this?”. It does not answer “would this test notice if the fix disappeared?”. For the second question there is a direct experiment, and it is the one that gives the section its name:

1. Copy the checkpoint (or work on a branch you are going to throw away).
2. Undo **only** the fix that the test claims to protect, in a single file.
3. Run only the test file that covers it.
4. Read the red: does the test you expected fail, for the reason you expected, with a message that explains the problem?
5. Restore and run again.

If in step 4 everything is still green, the test does not protect that fix, however well written it may look. That is not a failure of the experiment: it is exactly what the experiment is used to discover. It was done with three fixes from the course, one of them undone in two ways, and all four reversions turned red. Exercise 2 adds a fourth fix. And in exercise 3 you will write a test that fails the exam.

Running a single file is `npx vitest run` followed by the path, or a piece of it: `npx vitest run src/alta` runs all the test files whose path contains `src/alta`. It is faster and the output does not mix with the rest.

#### 8.4.2 The stray zero

Lesson 1's fix: in `ResumenFallas.tsx`, the condition is `{fallas > 0 && …}`. In the copy it was changed to the “shorter” version from the opening scene:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ResumenFallas.tsx src/reporte/ResumenFallas.tsx
10c10
<       {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
---
>       {fallas && <strong> · {textoFallas(fallas)}</strong>}
$ npx vitest run src/reporte/PaginaReporte.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/PaginaReporte.test.tsx (7 tests | 1 failed) 256ms
   ❯ la página del reporte (7)
     ✓ cargando: anuncia la carga mientras la API no responde 36ms
     ✓ error: muestra el motivo y un botón para reintentar 58ms
     ✓ vacío: lo dice en lugar de dejar la lista en blanco 28ms
     ✓ con datos: un enlace por servicio y el resumen de fallas 25ms
     × sin fallas no pinta un 0 suelto en el resumen 16ms
     ✓ el filtro «solo fallas» viaja en la dirección 57ms
     ✓ una dirección con el filtro ya puesto abre filtrada 35ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/PaginaReporte.test.tsx > la página del reporte > sin fallas no pinta un 0 suelto en el resumen
AssertionError: expected '2 servicios revisados0' to be '2 servicios revisados' // Object.is equality

Expected: "2 servicios revisados"
Received: "2 servicios revisados0"

 ❯ src/reporte/PaginaReporte.test.tsx:48:33
     46|     montarEn("/");
     47|     const resumen = await screen.findByText(/servicios revisados/);
     48|     expect(resumen.textContent).toBe("2 servicios revisados");
       |                                 ^
     49|   });
     50|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  04:04:54
   Duration  1.13s (environment 53%, tests 25%, transform 8%, import 7%, setup 6%)
```

One red test out of seven, the one that should be. Read the message from the bottom up, which is how a failure reads best. The summary: `Tests  1 failed | 6 passed (7)`. The name: “sin fallas no pinta un 0 suelto en el resumen”, which already tells you what happened. The comparison: `Expected: "2 servicios revisados"` versus `Received: "2 servicios revisados0"`. And the place: line 48 of the test file, with an arrow under `toBe`.

The `0` stuck to the end is Lesson 1's error, seen from a test: when `fallas` is `0`, the expression `0 && <strong>…</strong>` is `0`, and React renders numbers (it does not render `false`, `null`, or `undefined`, but it does render `0`). The other six tests stay green, and that is information too: in particular, “with data” stays green, because with two failures `fallas && …` behaves the same as `fallas > 0 && …`. **Only one test in this file tells the fix from the error**, and it is the one with data without failures. If it did not exist, the suite would say “all good” with the opening scene's error inside.

With the file restored, the test file goes back to `7 passed (7)`, and the complete suite to 27 of 27.

#### 8.4.3 The button that takes the focus away

Lesson 7's fix: `BotonEnviar` carries `aria-disabled={pending}` and cancels the click while pending, instead of `disabled={pending}`. There are **two** ways of undoing it, and the test has to notice both.

The first is the opening scene's: going back to `disabled`.

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/BotonEnviar.tsx src/alta/BotonEnviar.tsx
17c17
<     <button type="submit" aria-disabled={pending} onClick={alPulsar}>
---
>     <button type="submit" disabled={pending} onClick={alPulsar}>
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 362ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 75ms
     ✓ con datos válidos envía el alta y confirma 96ms
     ✓ declara los obligatorios y la bandeja anuncia solo el aviso nuevo 9ms
     × el foco no se pierde al enviar y un segundo envío se ignora 94ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 87ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 ❯ src/alta/FormularioAlta.test.tsx:82:48
     80|     // jsdom no saca el foco de un botón desactivado (Chrome sí: lo ma…
     81|     // que se comprueba la causa: el botón sigue habilitado y anuncia …
     82|     expect(pendiente.hasAttribute("disabled")).toBe(false);
       |                                                ^
     83|     expect(pendiente.getAttribute("aria-disabled")).toBe("true");
     84|     expect(document.activeElement).toBe(pendiente);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:26
   Duration  1.31s (environment 43%, tests 29%, import 11%, transform 10%, setup 6%)
```

It fails on line 82, `expect(pendiente.hasAttribute("disabled")).toBe(false)`, with `expected true to be false`: the pending button has the `disabled` attribute. Notice **where** it fails: in the check of the cause, two lines before the focus one. If the test did not have that line, it would reach `expect(document.activeElement).toBe(pendiente)`, and in jsdom that would **pass**, because jsdom leaves focus on the button even though it is disabled (8.5). The test would be green with the error that Lesson 7 measured in Chrome. That line exists because someone ran this experiment.

Notice also what comes out **before** the red: a warning in `stderr`, “A suspended resource finished loading inside a test, but the event was not wrapped in act(...)”. It is the case that 8.2.1 announced, an update when nobody was waiting anymore. The test failed on line 82, before reaching `responder(creado)`; at the end, `onTestFinished` delivered the pending response, and the form's action finished outside any `act`. The message talks about a “suspended resource” because that is what React calls the promise that was waiting. With the checkpoint, the test reaches `responder(creado)` inside its body and the warning does not appear. It is the `IS_REACT_ACT_ENVIRONMENT` line in `preparar.ts` that makes this warning visible: without it, the red would come out all the same, but silent.

The second way of undoing it is subtler: keep `aria-disabled`, which looks fine in code review, and remove the guard that cancels the click.

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/BotonEnviar.tsx src/alta/BotonEnviar.tsx
17c17
<     <button type="submit" aria-disabled={pending} onClick={alPulsar}>
---
>     <button type="submit" aria-disabled={pending}>
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 1387ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 77ms
     ✓ con datos válidos envía el alta y confirma 97ms
     ✓ declara los obligatorios y la bandeja anuncia solo el aviso nuevo 9ms
     × el foco no se pierde al enviar y un segundo envío se ignora 1095ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 109ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
TestingLibraryElementError: Unable to find role="button" and name "Descartar: Se dio de alta correo"

Ignored nodes: comments, script, style
<body>
[… recortado: 141 líneas del DOM (encabezado, bandeja y los tres campos) …]
          <button
            aria-disabled="true"
            type="submit"
          >
            Dando de alta…
          </button>
        </form>
        <div
          id="resultado-alta"
        >
          <div
            role="alert"
          />
        </div>
        <section
          aria-label="Altas de esta sesión"
        >
          <h3>
            Altas de esta sesión
          </h3>
          <ul>
            <li
              class="pendiente"
            >
              correo
               (agregando…)
            </li>
          </ul>
        </section>
      </section>
    </main>
  </div>
</body>
[… recortado: la salida imprime el mismo DOM otra vez, 177 líneas …]
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ src/alta/FormularioAlta.test.tsx:91:25
     89|     responder(creado);
     90|
     91|     expect(await screen.findByRole("button", { name: "Descartar: Se di…
       |                         ^
     92|     expect(document.activeElement).toBe(await screen.findByRole("butto…
     93|     expect(fetchFalso).toHaveBeenCalledTimes(1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:27
   Duration  1.79s (tests 80%, environment 14%, import 3%, setup 2%, transform 2%)
```

This time it fails on line 91 (and the `act` warning comes out again, twice, for the same reason as before), `findByRole("button", { name: "Descartar: Se dio de alta correo" })`, with “Unable to find role="button"”. The real output prints the page's complete DOM, more than a hundred lines; the beginning and the end were left above, and the cut is marked. The end is what matters: after `responder(creado)` and a full second of waiting, the button **still** says “Dando de alta…” with `aria-disabled="true"`, and “Altas de esta sesión” still shows `correo (agregando…)`. The second Space was not ignored: it queued a second submit. That second submit called `fetch` again, which stored a new `responder` that nobody called, and the form stayed pending. What is seen in the DOM is that; what is deduced, and Lesson 7 explained, is that React batches the actions in progress, and the first one's notice is not committed to the screen until the second one finishes. It is the same reason the test counts `fetch` calls **at the end**: a queued second submit is not visible while the first is pending.

In Lesson 7 this same error was measured in Chrome, with the API's log: a `201` followed by a `409`. Here the same test detects it in under two seconds, with no API and no browser.

Both variants give `Tests  1 failed | 4 passed (5)` in `src/alta`. Restored, `5 passed (5)`.

#### 8.4.4 The routes' error boundary

Lesson 5's fix: `ErrorBoundary: ErrorDeRuta` on the root route. In the copy that line was deleted from `rutas.tsx`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/app/rutas.tsx src/app/rutas.tsx
13d12
<     ErrorBoundary: ErrorDeRuta,
$ npx vitest run src/app
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/app/rutas.test.tsx (3 tests | 1 failed) 1089ms
   ❯ las rutas (3)
     ✓ una dirección desconocida muestra la página de no encontrada 59ms
     ✓ el menú marca la página actual 8ms
     × una página que se rompe al dibujar muestra el aviso del revisor 1019ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/app/rutas.test.tsx > las rutas > una página que se rompe al dibujar muestra el aviso del revisor
TestingLibraryElementError: Unable to find role="alert"

Ignored nodes: comments, script, style
<body>
  <div>
    <h2>
      Unexpected Application Error!
    </h2>
    <h3
      style="font-style: italic;"
    >
      la página se rompió al dibujar
    </h3>
    <pre
      style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);"
    >
      Error: la página se rompió al dibujar
[… recortado: 10 renglones de la pila …]
    </pre>
    <p>
      💿 Hey developer 👋
    </p>
    <p>
      You can provide a way better UX than this when your app throws errors by providing your own
      <code
        style="padding: 2px 4px; background-color: rgba(200, 200, 200, 0.5);"
      >
        ErrorBoundary
      </code>
       or

      <code
        style="padding: 2px 4px; background-color: rgba(200, 200, 200, 0.5);"
      >
        errorElement
      </code>
       prop on your route.
    </p>
  </div>
</body>
[… recortado: la salida imprime el mismo DOM otra vez, 48 líneas …]
 ❯ PaginaRota src/app/rutas.test.tsx:11:9
      9|
     10| function PaginaRota(): never {
     11|   throw new Error("la página se rompió al dibujar");
       |         ^
     12| }
     13|
 ❯ Object.react_stack_bottom_frame node_modules/react-dom/cjs/react-dom-client.development.js:28571:20
 ❯ renderWithHooks node_modules/react-dom/cjs/react-dom-client.development.js:8030:22
 ❯ updateFunctionComponent node_modules/react-dom/cjs/react-dom-client.development.js:10569:19
 ❯ beginWork node_modules/react-dom/cjs/react-dom-client.development.js:12205:18
 ❯ runWithFiberInDEV node_modules/react-dom/cjs/react-dom-client.development.js:1048:13
 ❯ performUnitOfWork node_modules/react-dom/cjs/react-dom-client.development.js:19176:22
 ❯ workLoopSync node_modules/react-dom/cjs/react-dom-client.development.js:19004:41
 ❯ renderRootSync node_modules/react-dom/cjs/react-dom-client.development.js:18985:11
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ src/app/rutas.test.tsx:44:32

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  04:05:30
   Duration  2.20s (tests 56%, environment 36%, import 3%, transform 3%, setup 2%)
```

“Unable to find role="alert"”, and below it, the DOM that was there: React Router's default boundary, with “Unexpected Application Error!”, the message, the stack (trimmed above), and the paragraph that suggests putting your own `ErrorBoundary` or `errorElement` on the route. That paragraph exists only in the development version of React Router: Vitest does not run in production mode (`NODE_ENV` is `test`), so Vite loads that version, just as it loads React's (notice `react-dom-client.development.js` in the stack). It is the screen that Lesson 5 showed in Chrome, now as text in a test's output. The real output prints that DOM twice; the second copy was removed. `Tests  1 failed | 2 passed (3)`.

The three tests passed the exam, four times. What they have in common is worth more than each one: **each asserts exactly what the fix changed**. The summary is compared in full, not with a `toContain`. The button is checked by its attribute, not only by focus. The alert is looked up by its role, and it is also checked that the foreign boundary's text does not appear. When a test asserts something weaker than the fix, the error slips through the gap.

### 8.5 What jsdom cannot check

#### 8.5.1 A DOM that does not draw

jsdom implements the DOM, events, forms, and the reading of stylesheets (it knows which rule applies to each element, as row 4 of the figure shows). What it does not do is **draw**. Its README puts two things outside its scope: navigation (changing page by following a link or by assigning `location.href`) and layout, which it defines as the ability to compute where elements will end up as an effect of CSS. For layout there are placeholder values, and many properties return zeros ([jsdom, README](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform)).

That has a consequence that is not obvious: there are browser behaviors that depend on drawing even though they do not seem to be about drawing. Focus is one. Figure 3 asks jsdom four questions, without React, and a twin HTML page asks the same four of Chrome:

```tsx
// fig08_03.tsx
import { JSDOM } from "jsdom";

// Sin React a propósito: lo que se mide aquí es el DOM de prueba, no la biblioteca.
// `pretendToBeVisual` le da a jsdom un requestAnimationFrame, para esperar dos cuadros
// como en fig08_03.html, la misma página para Chrome.
const dom = new JSDOM(`<!doctype html>
<style>
  button[aria-disabled="true"] { opacity: 0.6; cursor: not-allowed; }
  .oculto { display: none; }
</style>
<button type="submit" id="enviar">Dar de alta</button>
<button type="button" id="escondido" class="oculto">Escondido</button>`, { pretendToBeVisual: true });

const { document } = dom.window;
const enviar = document.getElementById("enviar") as HTMLButtonElement;
const escondido = document.getElementById("escondido") as HTMLButtonElement;

function quienTieneElFoco(): string {
  const activo = document.activeElement;
  return activo === null ? "nadie" : activo.id === "" ? activo.tagName.toLowerCase() : `#${activo.id}`;
}

console.log("1. el foco en un botón que se desactiva");
enviar.focus();
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);
enviar.disabled = true;
console.log(`   después de disabled = true: foco en ${quienTieneElFoco()}`);
await new Promise((listo) => dom.window.requestAnimationFrame(() => dom.window.requestAnimationFrame(listo)));
console.log(`   dos cuadros después: foco en ${quienTieneElFoco()}`);
enviar.disabled = false;
enviar.focus();

console.log("2. el foco en un elemento con display: none");
escondido.focus();
console.log(`   display calculado: ${dom.window.getComputedStyle(escondido).display}`);
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);

console.log("3. el diseño");
const caja = enviar.getBoundingClientRect();
console.log(`   getBoundingClientRect(): ${caja.width} × ${caja.height} en (${caja.x}, ${caja.y})`);
console.log(`   offsetWidth: ${enviar.offsetWidth}`);

console.log("4. la hoja de estilos");
enviar.setAttribute("aria-disabled", "true");
const estilo = dom.window.getComputedStyle(enviar);
console.log(`   opacity: ${estilo.opacity}, cursor: ${estilo.cursor}`);

dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_03.tsx
$ node fig08_03.js
1. el foco en un botón que se desactiva
   después de focus(): foco en #enviar
   después de disabled = true: foco en #enviar
   dos cuadros después: foco en #enviar
2. el foco en un elemento con display: none
   display calculado: none
   después de focus(): foco en #enviar
3. el diseño
   getBoundingClientRect(): 0 × 0 en (0, 0)
   offsetWidth: 0
4. la hoja de estilos
   opacity: 0.6, cursor: not-allowed
```

And the twin page, `fig08_03.html` (it sits next to the figure, with the same HTML and the same steps written in browser JavaScript), opened in headless Chrome:

```bash
$ google-chrome --headless --disable-gpu --no-first-run \
    --user-data-dir="$PWD/perfil" --virtual-time-budget=3000 --dump-dom "file://$PWD/fig08_03.html"
1. el foco en un botón que se desactiva
   después de focus(): foco en #enviar
   después de disabled = true: foco en #enviar
   dos cuadros después: foco en body
2. el foco en un elemento con display: none
   display calculado: none
   después de focus(): foco en #enviar
3. el diseño
   getBoundingClientRect(): 81.21875 × 21 en (8, 8)
   offsetWidth: 81
4. la hoja de estilos
   opacity: 0.6, cursor: not-allowed
```

(What is shown is the content of the `<pre id="salida">` where the page writes its results; `--dump-dom` prints the whole page. In Chromium the executable is called `chromium`; on macOS, where this output was measured, the path is `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. `--virtual-time-budget` lets timers and animation frames run before printing. And `--user-data-dir` uses a fresh Chrome profile in the `perfil/` folder, so as not to touch yours: delete it when you finish and do not push it to the repository.)

Compare line by line.

**1. Focus on a button that gets disabled.** Right after `disabled = true`, **both** say focus is still on `#enviar`. Two animation frames later, Chrome says `body` and jsdom still says `#enviar`. The HTML specification explains the difference. Among the “update the rendering” steps, which the browser runs when it is about to draw a frame, there is one that says: if the document's focused area is no longer a focusable area, run the focusing steps on the document's viewport (in practice, focus falls to the `body`, which is what Chrome reports). And it gives as an example exactly this: a control getting `disabled` set on it ([WHATWG, HTML, “Update the rendering”](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)). The specification calls it an **asynchronous** fix: it does not happen when the attribute is set, but at the next rendering. jsdom does not draw, so that fix never arrives, even if `pretendToBeVisual` gives it `requestAnimationFrame`. It is the measurement from Lesson 7 (in Chrome, while the registration was pending, focus was already on the `body`), explained from the specification and seen in jsdom. And it is the reason for line 82 of the form test.

Notice a detail in Chrome's first row: even in a real browser, an **immediate** check would have said “focus is still on the button”. A test that looked at focus right after disabling the button would be wrong on both sides.

**2. Focus on an element with `display: none`.** Here jsdom gets it right: both reject the `focus()` and focus stays where it was. jsdom does apply the stylesheet to know the element is not displayed. It is worth knowing so as not to blame jsdom for what it does do.

**3. Layout.** Chrome measures the button: 81.21875 by 21 pixels, at position (8, 8), which is the `body`'s default margin. jsdom says `0 × 0 at (0, 0)` and `offsetWidth: 0`. Any test that depends on sizes or positions (whether something fits, whether it went off screen, whether two elements overlap) cannot be done in jsdom. It does not fail: it calmly returns zeros, which is worse.

**4. The stylesheet.** Both compute `opacity: 0.6` and `cursor: not-allowed` for the button with `aria-disabled="true"`, from the stylesheet's rule. jsdom resolves the CSS cascade for `getComputedStyle`. What it cannot tell you is whether that gray is **visible**, or whether it meets the contrast that MDN asks for in a disabled control (Lesson 7): that is design and perception.

#### 8.5.2 What to do about what jsdom does not see

The figure leaves three rules for writing tests, and a list of what is left to check by hand.

**When the effect cannot be seen, check the cause.** Lost focus is an effect of drawing. Its cause is an attribute, `disabled`, which jsdom does see. The form test checks the cause (without `disabled`, with `aria-disabled="true"`) and leaves the effect as a secondary assertion. It works because the relationship between cause and effect is measured in a browser (Lesson 7) and backed by the specification (8.5.1). Without that measurement, checking the cause would be an assumption.

**Do not write a test that passes for the wrong reason.** A jsdom test that asserted “focus is not lost” by looking only at `document.activeElement` would be green with the good code and with the bad. It is the test that fails the 8.4 exam, and the worst kind of test: the one that gives confidence without earning it.

**Name the gap.** The comment on line 80 of the test file says, in a sentence, what jsdom cannot see and what is checked instead. Whoever reads the test six months from now will not “simplify” it by removing the attribute line.

And what this suite does **not** check, even when it is green:

- **The real keyboard walkthrough**: that Tab goes through the elements in order, that the `:focus-visible` outline is visible, that focus is not lost in a browser. The form test covers one stretch (from the last field to the button, and the button during submission), with the caveat from 8.5.1.
- **What it sounds like in a screen reader.** The suite checks that the roles, names, `aria-invalid`, `aria-describedby`, `aria-atomic`, and `required` are set. Whether NVDA, Orca, or VoiceOver announce them as expected is another question, and it is answered by listening.
- **Layout**: that nothing overlaps, that the dimmed button is distinguishable, that the compact dashboard fits on a narrow screen.
- **The real network and server**: Vite's *proxy*, the practice API, Lesson 9's rewrite to `index.html`. The fake `fetch` answers what the test says; if the real API changed the shape of its responses, `tsc -b` would notice through the shared types, but none of these tests would.

For those things there are end-to-end tests, which drive a real browser. This course does not teach them; what it does is leave them written as steps to do by hand in “How I know I got it”. The order of cost is clear: a jsdom test takes milliseconds and runs on every change; a test in a browser takes seconds and needs an installed browser; a review with a screen reader takes minutes and needs a person. The three complement each other, and none replaces another.

## The error you will see

The lesson has one main error and two supporting ones.

**The main error: “Found multiple elements with the role "status"”.** If you write the “loading” test the natural way, `await screen.findByRole("status")`, it fails. Figure 1 showed it with `getByRole`: on the screen there are two status regions, the notice tray and the loading one. `findByRole` is `getByRole` with waiting, so it also demands a single one. The complete message, in a Vitest test, also prints the DOM with the two elements, and there you can see which is which. It is fixed in two ways: search by text and then check the role, as the suite does; or scope the search with `within` to the part of the page where the loading is. What fixes **nothing** is `getAllByRole("status")[1]`: it depends on DOM order, and the day the tray changes place the test will look at the wrong element without warning.

**The supporting one: “Unable to find role="…"” with a hundred-line DOM.** You saw it in 8.4.3 and 8.4.4. It looks scary because of its size, but it is the best help Testing Library gives you: when a `get` or `find` query fails, it prints the DOM's state ([Testing Library, “Debugging”](https://testing-library.com/docs/dom-testing-library/api-debugging)). Read it looking for what you expected to find. Almost always it is there under another name (a different `aria-label`), another role (a `<div>` with `onClick`), or it has not arrived yet (a `getBy` where a `findBy` belonged). If the DOM is too long, the documentation explains that it is cut at 7000 characters and that the `DEBUG_PRINT_LIMIT` variable changes that limit.

**The silent one: the test that cleans up halfway.** If you remove `cleanup()` from `preparar.ts`, the tests that mount the application start failing with “Found multiple elements…” in places that have nothing to do with each other, because each test finds in the DOM what the previous one left. If you remove `vi.unstubAllGlobals()`, one test's fake `fetch` stays for the following ones in the same file, and a test may pass with the routes another one declared. This second is the truly silent one: it does not fail, it just stops testing what it says.

**The tool's silent one: the reporter that hides the console.** If you run Vitest from an automated tool (a programming assistant, a script that identifies itself as an agent), Vitest may choose another reporter without telling you. Its documentation explains it: when no reporters are configured and it detects that it is running inside a programming agent, it uses the minimal reporter, which shows only the tests that fail, and suppresses the console of those that pass and the per-file summary ([Vitest, “Reporters”](https://vitest.dev/guide/reporters.html)). With that reporter, an `act` warning in a green test is not visible. In your terminal it does not happen, but if a tool ever tells you “no warnings”, ask it for `--reporter=default`.

## Common mistakes

**Searching by CSS classes or by DOM structure.** `container.querySelector(".resumen strong")` passes even if the summary stops being readable for a screen reader, and breaks when someone changes a class name without changing anything a person sees. Search by role, label, or text.

**`getByTestId` as the first option.** A `data-testid` is an attribute that exists only for the test: it finds the element even if it has no role or name. Testing Library puts it at the end of its list for that reason.

**Testing the implementation.** Reading a component's state, counting how many times it rendered, or checking that `establecerAltas` was called. Those tests break with every refactoring that changes nothing for the person, and stay green with errors that do change something for them. Test what is seen, heard, or sent.

**Mocking the application's modules with `vi.mock`.** Replacing `cargar.ts` or `useReintentar.ts` leaves out precisely the part that tends to break: the validation, the query key, the invalidation. Mock the outer boundary, `fetch`, and let everything else run.

**Sharing the `QueryClient` between tests.** One test's cache shows up in the next: the loading is not seen and a test passes with another test's data.

**Retries enabled in tests.** With `retry: 2`, each error test waits for the retries before showing the error, and an error test may exceed `findBy`'s one-second limit.

**`fireEvent` for what a person does.** A single event does not move focus nor respect a disabled field. Use `user-event` and await each action with `await`.

**Forgetting the `await`.** `usuario.click(boton)` without `await` compares before the click happens. The test may pass by chance and fail the day the machine is loaded.

**An `expect` that cannot fail.** `expect(screen.getByText("Dar de alta")).toBeDefined()` never fails in its `expect`: if the text is not there, the `getByText` already threw, and if it is, it is defined. The suite uses that form a few times, knowingly: what asserts is the `getBy` or the `findBy`, and the `expect` only makes the line read like an assertion. What is done wrong is believing that `toBeDefined()` checks something more.

**Accepting a test as good because it is green.** If you have not seen it red with the fix undone, you do not know whether it protects anything. Exercise 3 has one that does not.

**A test that passes in jsdom for the wrong reason.** Asserting focus in jsdom after disabling a button, measuring sizes, expecting an `<a href>` without a router to load another page. If jsdom does not compute the effect, check the cause and name the gap.

**Silencing the console for the whole suite.** A `console.error` silenced in `preparar.ts` hides React warnings that betray real errors (a repeated `key`, an update outside `act`). Silence only what a test causes on purpose, only during that test, and restore with `onTestFinished`.

## Exercises

### Exercise 1 — Choose the query

Without running anything, write in your log which query you would use (family `getBy`, `queryBy`, or `findBy`, and type `ByRole`, `ByLabelText`, or `ByText`) for each assertion, and why:

1. When loading finishes, the report shows a list.
2. With the API empty, there is **no** list.
3. The “Dirección” field ended up marked invalid after submitting empty (the form is already rendered).
4. The button to dismiss the `correo` registration notice appears.
5. The loading is announced as a status region.

Then look for each case in the checkpoint's suite and compare.

### Exercise 2 — The required attribute that disappears

In a copy of the checkpoint, remove the `required` attribute from `src/alta/Campo.tsx`. **Before** running anything, predict: how many tests turn red, which ones, on which line, and with what message? Run `npx vitest run src/alta` and compare. Restore when you finish. And one more question: what would change for a person, in the browser, if that attribute were missing? (Hint: Lesson 7, the accessibility tree.)

### Exercise 3 — The test that fails the exam

Lesson 2 fixed an error with `key`: a note's draft must not carry over from one service to another. Today it lives in `PaginaServicio.tsx`, in `<EditorNota key={nombre} …>`, and the checkpoint does **not** have a test for it. Write it in a new file, `src/detalle/EditorNota.test.tsx`: mount at `/servicios/pagos`, type a draft in the “Nota sobre pagos” field without saving it, navigate to `/servicios/reportes` with `await act(() => enrutador.navigate("/servicios/reportes"))` (import `act` from `@testing-library/react`), and check that the “Nota sobre reportes” field is empty. Declare the two detail routes in the fake `fetch`.

When it is green, take the 8.4 exam: remove `key={nombre}` in a copy and run it again. **Does it turn red?** If not, explain why and fix it until it does. Hint: look at what `PaginaServicio` renders while the new service's query is pending.

### Exercise 4 — The stale data

The checkpoint does not test the report's fifth state: the refresh fails, but the last report that arrived is still shown, with a notice. Write that test in `src/reporte/DatosViejos.test.tsx`. You need the first request to `/api/estados` to answer fine and the following ones with 503 (a function in the fake's table can keep count), and a way to trigger the second request without waiting for the polling's ten seconds (look in `PaginaReporte.tsx` for a button). Check the notice's exact text and that the list is still there with its four links. Then take the exam: in a copy, change in `ContenidoReporte.tsx` the condition `consulta.isError && consulta.data === undefined` to `consulta.isError` and check that your test turns red.

Second part, the “refreshing” state: in the same file, write another test where the first request answers fine and the second **never answers** (you already have `nuncaResponde`). After pressing “Actualizar”, check that `· actualizando…` appears next to the time, that the list still has its four links, and that “Cargando…” does **not** appear. This one's exam: in a copy, change `if (consulta.isPending)` to `if (consulta.isFetching)` in `ContenidoReporte.tsx`. Which Lesson 4 difference does this test protect?

## Solutions

### Solution 1

1. `findByRole("list")`: the list **is going to arrive** after a `fetch`, and it is an element with a role. It is the first line of “with data”.
2. `queryByRole("list")` inside `expect(…).toBeNull()`: an **absence** is asserted, and `getBy` would throw before the `expect`. But first a `findBy…` for something that does appear is needed (“No hay servicios configurados todavía.”): otherwise the test would assert the absence while the page is still loading, and would pass for the wrong reason. That is how “empty” does it.
3. `getByLabelText("Dirección")` and then its `aria-invalid`: the form is already rendered and the field **has to** be there; `getBy`. In the suite, the test first waits for the alert with `findByRole("alert")`, which is the signal that submission finished, and then uses `getByLabelText` on the three fields. `getByRole("textbox", { name: "Dirección" })` would also work.
4. `findByRole("button", { name: "Descartar: Se dio de alta correo" })`: it arrives after the action, and the accessible name is the `aria-label`'s, not the visible text “Descartar” (figure 2).
5. `findByText("Cargando…")` and then check `role="status"`: `findByRole("status")` fails because there are two status regions (figure 1 and “The error you will see”).

If in any case you chose another family, ask yourself what your version would assert that the suite's does not, or the other way around. The two things most often confused are “waits” versus “is already there” and “has to be there” versus “must not be there”.

### Solution 2

**One** test turns red, “declara los obligatorios y la bandeja anuncia solo el aviso nuevo”, on line 52, with `expected false to be true`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/Campo.tsx src/alta/Campo.tsx
26d25
<         required
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 363ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 72ms
     ✓ con datos válidos envía el alta y confirma 91ms
     × declara los obligatorios y la bandeja anuncia solo el aviso nuevo 7ms
     ✓ el foco no se pierde al enviar y un segundo envío se ignora 110ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 82ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > declara los obligatorios y la bandeja anuncia solo el aviso nuevo
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ src/alta/FormularioAlta.test.tsx:52:30
     50|     for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)…
     51|       const campo = (await screen.findByLabelText(etiqueta)) as HTMLIn…
     52|       expect(campo.required).toBe(true);
       |                              ^
     53|     }
     54|     const bandeja = screen.getByRole("region", { name: "Avisos" });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:33
   Duration  935ms (tests 44%, environment 39%, import 6%, setup 5%, transform 5%)
```

The test stops at the first field, “Nombre”, because the `expect` in the `for` loop's iteration throws when it fails; that is why you do not see the other two. The file's other tests stay green: the form has `noValidate`, so the browser never used `required` to prevent submission, and validation is done by the schema. What changes for the person is what Lesson 7 measured in the accessibility tree: without `required`, the three fields go from `required=true` to `required=false`, and a screen reader stops announcing “required” on reaching each one. Nothing changes visually. It is the perfect example of a fix that only a test (or a screen reader) can notice.

### Solution 3

The test as the statement asks for it:

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, versión ingenua
const { enrutador, usuario } = montarEn("/servicios/pagos");
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

It is green. And in a copy **without** `key={nombre}`, it stays green (to run both versions side by side, the naive one was saved as `EditorNotaIngenua.test.tsx`):

```bash
$ npx vitest run src/detalle/EditorNotaIngenua.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNotaIngenua.test.tsx (1 test) 116ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:37
   Duration  478ms (environment 49%, tests 27%, import 9%, setup 8%, transform 6%)
```

It fails the exam. The reason is in `PaginaServicio`: `EditorNota` is only rendered when the query already has data (`consulta.data !== undefined`). When navigating to `reportes`, that service's query does not have data yet, so the page shows “Cargando detalle…” and **unmounts** the editor. When the data arrives, it mounts a new one, with fresh state. The draft is lost for that reason, with `key` or without it. The test checks something true, but not what the `key` fixes.

The case the `key` fixes is when the page does **not** go through “loading”: when the destination service is already in the cache. Then the data is there from the first render, `EditorNota` stays in the same place in the tree, and without `key` React reuses it with its state. The good test visits `reportes` first so that its detail ends up in the cache:

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, la que pasa el examen
const { enrutador, usuario } = montarEn("/servicios/reportes");
await screen.findByRole("textbox", { name: "Nota sobre reportes" });
await act(() => enrutador.navigate("/servicios/pagos"));
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

The fake `fetch` declares the two routes; for `reportes` it is enough to copy `detallePagos` changing the name:

```tsx
// fragmento: la tabla del fetch falso en EditorNota.test.tsx
instalarFetchFalso({
  "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
  "GET /api/servicios/reportes": {
    status: 200,
    cuerpo: { ...detallePagos, nombre: "reportes", estado: { ...detallePagos.estado, nombre: "reportes" } },
  },
});
```

With the checkpoint, green:

```bash
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNota.test.tsx (1 test) 120ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:34
   Duration  522ms (environment 49%, tests 26%, import 10%, transform 8%, setup 7%)
```

And without `key={nombre}`, red, with `pagos`'s draft in `reportes`'s editor:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/detalle/PaginaServicio.tsx src/detalle/PaginaServicio.tsx
46d45
<             key={nombre}
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/detalle/EditorNota.test.tsx (1 test | 1 failed) 131ms
   × el borrador de una nota no se arrastra a otro servicio 131ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/detalle/EditorNota.test.tsx > el borrador de una nota no se arrastra a otro servicio
AssertionError: expected 'revisar el lunes' to be '' // Object.is equality

- Expected
+ Received

+ revisar el lunes

 ❯ src/detalle/EditorNota.test.tsx:24:24
     22|   await act(() => enrutador.navigate("/servicios/reportes"));
     23|   const editor = (await screen.findByRole("textbox", { name: "Nota sob…
     24|   expect(editor.value).toBe("");
       |                        ^
     25| });
     26|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:05:36
   Duration  695ms (environment 54%, tests 21%, import 9%, setup 8%, transform 7%, worker 1%)
```

`act` is needed here because `enrutador.navigate` changes the application's state from outside a Testing Library interaction, and wrapping it in `act` makes React apply all the changes before the next line. The version that passes the exam and the exercise 4 test passed `npx eslint` and `tsc` without warnings. What you take away is the idea, more than the test: **a test can check something true for a reason other than the one you think**, and the only way to know is the experiment.

### Solution 4

One way to write it:

```tsx
// fragmento: src/reporte/DatosViejos.test.tsx
test("datos viejos: si la actualización falla, conserva la lista y lo avisa", async () => {
  // La primera petición responde bien; las siguientes, 503.
  const respuestas: RespuestaFalsa[] = [{ status: 200, cuerpo: reporteDeEjemplo }];
  instalarFetchFalso({
    "GET /api/estados": async () => respuestas.shift() ?? { status: 503, cuerpo: { detalle: "caída" } },
  });
  const { usuario } = montarEn("/");
  await screen.findByRole("list");

  await usuario.click(screen.getByRole("button", { name: "Actualizar" }));

  const aviso = await screen.findByRole("alert");
  expect(aviso.textContent).toBe(
    "Mostrando el último reporte que llegó: la actualización falló (la API respondió 503).",
  );
  expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(4);
});
```

(Import `screen` and `within` from `@testing-library/react`, `expect` and `test` from `vitest`, `reporteDeEjemplo` from `../pruebas/datos`, `instalarFetchFalso` and the `RespuestaFalsa` type from `../pruebas/fetchFalso`, and `montarEn` from `../pruebas/montar`.)

The `respuestas` array is the count: `shift()` takes out the first response the first time and returns `undefined` afterward, and the `??` turns that `undefined` into the 503. The “Actualizar” button in `PaginaReporte` calls `consulta.refetch()`, which triggers the second request without waiting for the polling. With the checkpoint:

```bash
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (1 test) 137ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:35
   Duration  649ms (environment 42%, tests 24%, transform 14%, import 12%, setup 7%, worker 1%)
```

With the condition changed to `consulta.isError`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ContenidoReporte.tsx src/reporte/ContenidoReporte.tsx
21c21
<   if (consulta.isError && consulta.data === undefined) {
---
>   if (consulta.isError) {
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/DatosViejos.test.tsx (1 test | 1 failed) 88ms
   × datos viejos: si la actualización falla, conserva la lista y lo avisa 87ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/DatosViejos.test.tsx > datos viejos: si la actualización falla, conserva la lista y lo avisa
AssertionError: expected 'No se pudo cargar el reporte: la API …' to be 'Mostrando el último reporte que llegó…' // Object.is equality

Expected: "Mostrando el último reporte que llegó: la actualización falló (la API respondió 503)."
Received: "No se pudo cargar el reporte: la API respondió 503Reintentar"

 ❯ src/reporte/DatosViejos.test.tsx:19:29
     17|
     18|   const aviso = await screen.findByRole("alert");
     19|   expect(aviso.textContent).toBe(
       |                             ^
     20|     "Mostrando el último reporte que llegó: la actualización falló (la…
     21|   );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:05:38
   Duration  579ms (environment 56%, tests 18%, import 10%, setup 8%, transform 7%, worker 1%)
```

The `Received` tells the story: without `consulta.data === undefined`, any error sends the screen to the error state, and the person loses the list they already had because of a refresh that failed; the `Reintentar` stuck on the end is the button's text, which `textContent` joins with the paragraph's. The test's second assertion (the list with four links) never got to run, because the first had already failed; if you wanted to see both, swap their order. If your test used another route for the second request (for example, invalidating the query), that is also valid, as long as it passes the exam.

The second part, in the same file (add `nuncaResponde` to the import from `../pruebas/fetchFalso`):

```tsx
// fragmento: src/reporte/DatosViejos.test.tsx, segunda prueba
test("actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista", async () => {
  // La primera petición responde bien; la segunda no responde nunca.
  const respuestas: RespuestaFalsa[] = [{ status: 200, cuerpo: reporteDeEjemplo }];
  instalarFetchFalso({
    "GET /api/estados": () => {
      const siguiente = respuestas.shift();
      return siguiente === undefined ? nuncaResponde() : Promise.resolve(siguiente);
    },
  });
  const { usuario } = montarEn("/");
  await screen.findByRole("list");

  await usuario.click(screen.getByRole("button", { name: "Actualizar" }));

  expect((await screen.findByText(/· actualizando…/)).textContent).toMatch(/^Actualizado a las .+ · actualizando…$/);
  expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(4);
  expect(screen.queryByText("Cargando…")).toBeNull();
});
```

The time is not compared exactly, because it changes on every run: the regular expression requires the paragraph to start with “Actualizado a las”, have something in between, and end with `· actualizando…`. With the checkpoint, the file's two tests are green:

```bash
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (2 tests) 143ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  04:06:36
   Duration  784ms (environment 49%, tests 20%, import 11%, setup 10%, transform 10%)
```

With `consulta.isFetching` instead of `consulta.isPending`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ContenidoReporte.tsx src/reporte/ContenidoReporte.tsx
17c17
<   if (consulta.isPending) {
---
>   if (consulta.isFetching) {
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/DatosViejos.test.tsx (2 tests | 1 failed) 161ms
   ✓ datos viejos: si la actualización falla, conserva la lista y lo avisa 126ms
   × actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista 34ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/DatosViejos.test.tsx > actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista
TestingLibraryElementError: Unable to find an accessible element with the role "list"
[… recortado: la lista de roles accesibles y el principio del DOM, 218 líneas …]
        <p
          role="status"
        >
          Cargando…
        </p>
        <p
          class="actualizado"
        >
          Actualizado a las
          4:06:38 a.m.
           · actualizando…
        </p>
        <button
          disabled=""
          type="button"
        >
          Actualizar
        </button>
      </section>
    </main>
  </div>
</body>
 ❯ Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 ❯ src/reporte/DatosViejos.test.tsx:40:24
     38|
     39|   expect((await screen.findByText(/· actualizando…/)).textContent).toM…
     40|   expect(within(screen.getByRole("list")).getAllByRole("link")).toHave…
       |                        ^
     41|   expect(screen.queryByText("Cargando…")).toBeNull();
     42| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Start at  04:06:37
   Duration  600ms (environment 44%, tests 30%, import 9%, transform 9%, setup 7%)
```

In the trimmed DOM the problem is visible: while the new report arrives, the screen says “Cargando…” where the list was, even though the cache has the previous report. It is Lesson 4's difference between `status` (“is there data?”) and `fetchStatus` (“is a request in flight?”): `isPending` is “there is no data yet”, `isFetching` is “something is being requested”, and confusing them wipes out the list on every poll, every ten seconds. The file's first test stays green with that change: each one protects a different fix. Both passed `npx eslint` and `tsc`.

## How I know I got it

- [ ] `npm ci`, `npm run lint`, and `npm run build` finish cleanly inside `~/curso-react/revisor/`, and `npm run build` produces `dist/assets/index-C_lOH5GL.js`, **the same name as in Lesson 7**: the tests did not change the application.
- [ ] `npm test` finishes with `Test Files  7 passed (7)` and `Tests  27 passed (27)`, read from the summary, not from the exit code. With `npx vitest run --reporter=verbose`, you see the 27 lines with `✓` and their names.
- [ ] With `npx vitest run --reporter=default`, the suite's output has no `stderr` and no warning that mentions `act(`. And you checked that this means something: without the `IS_REACT_ACT_ENVIRONMENT` line in `preparar.ts`, the control test from 8.1.3 does not warn; with it, it does.
- [ ] You ran the 8.4 exam with at least two fixes, in a copy: `fallas > 0` in `ResumenFallas.tsx` and the `onClick={alPulsar}` guard in `BotonEnviar.tsx`. Each one left red the test the lesson says, with the message the lesson says; restored, everything went back to green.
- [ ] Figures 1, 2, and 3 give the same output on your machine as in the lesson, and the `fig08_03.html` page in your Chrome says `body` on the “two frames later” row.
- [ ] You wrote the exercise 3 test that **does** turn red without `key={nombre}`, and you saw the one that does not turn green.
- [ ] You wrote the two tests from exercise 4 (stale data with error and “actualizando…”), saw them green with the checkpoint and each one red with its change (`consulta.isError` and `isFetching`). With them, the report states all have their test.
- [ ] **By hand, with the keyboard, in Chrome**, with `npm run servidor` and `npm run dev`: at `/servicios/nuevo`, fill in the form, reach the button with Tab, and submit with Space. The blue outline stays on the button while it says “Dando de alta…” and afterward. It is the part of the focus test that jsdom cannot see (8.5); Lesson 7 has the complete step-by-step.
- [ ] **By hand, with a screen reader** (Orca on your Mint, NVDA on Windows, or VoiceOver on macOS): repeat Lesson 7's checks and note in your [log](bitacora.md) which attributes the suite checks and which you only checked by listening.

## Summary

Answer without looking at the lesson:

1. What does each of the five new dependencies do, and why does `jsdom` have to be installed if Vitest is the one that uses it?
2. Why does `preparar.ts` call `cleanup` by hand? What would happen without it, and what would happen without `vi.unstubAllGlobals`?
3. Why does a query by role and name say something about accessibility that a query by text does not? Why does `getByRole("button", { name: "Descartar" })` not find the tray's button?
4. What does each family, `getBy`, `queryBy`, and `findBy`, assert? Why does the “loading” test search by text and then check the role?
5. What does `user-event` do that `fireEvent` does not, and why does each action carry an `await`?
6. Why does the checkpoint mock `fetch` and not the application's modules? What does the fake answer to a route that was not declared, and why?
7. What three things does `montarEn` mount, and why does each test need a fresh `QueryClient` without retries?
8. What are the five steps of the 8.4 exam? What does a test that stays green with the fix undone tell you?
9. Why does the focus test check that the button has no `disabled`, if what matters is focus? What does the HTML specification say about when a disabled control loses focus?
10. Name three things the suite does not check even when it is green, and how each one is checked.

## Further reading

- [Testing Library, “About Queries”](https://testing-library.com/docs/queries/about/): the three families (`getBy`, `queryBy`, `findBy`) with their `All` versions, the priority of queries, and `findBy`'s timeout. Accessed on October 21, 2026.
- [Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole): the `name` option, implicit roles, the `hidden` option, and the cost of computing the accessibility tree. Accessed on October 21, 2026.
- [Testing Library, “Guiding Principles”](https://testing-library.com/docs/guiding-principles): the more tests resemble real use, the more confidence they give. Accessed on October 21, 2026.
- [Testing Library, “Async Methods”](https://testing-library.com/docs/dom-testing-library/api-async/): `findBy` as `getBy` plus `waitFor`, the 50 ms interval, and the 1000 ms timeout. Accessed on October 21, 2026.
- [Testing Library, “Debugging”](https://testing-library.com/docs/dom-testing-library/api-debugging): `logRoles`, `prettyDOM`, the DOM printed on failures, `DEBUG_PRINT_LIMIT`, and `COLORS`. Accessed on October 21, 2026.
- [Testing Library, React Testing Library API](https://testing-library.com/docs/react-testing-library/api): `render`, what it returns, and when `cleanup` is automatic and when it is not. Accessed on October 21, 2026.
- [Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro) and [its keyboard](https://testing-library.com/docs/user-event/keyboard): complete interactions versus loose events, `setup()` before rendering, and how keys are written. Accessed on October 21, 2026.
- [Vitest, “Test Environment”](https://vitest.dev/guide/environment.html): the `node` environment by default and the `jsdom` environment. Accessed on October 21, 2026.
- [Vitest, `globals`](https://vitest.dev/config/globals.html) and [“Reporters”](https://vitest.dev/guide/reporters.html): why `globals` is `false` by default and which libraries depend on globals to clean up on their own; which reporter Vitest chooses and which one hides the console of passing tests. Accessed on October 21, 2026.
- [Vitest, `vi`](https://vitest.dev/api/vi.html), [`mock`](https://vitest.dev/api/mock.html), and [“Hooks”](https://vitest.dev/api/hooks.html): `vi.fn`, `vi.spyOn`, `vi.stubGlobal`, `vi.unstubAllGlobals`, `mock.calls`, `mockRestore`, `afterEach`, and `onTestFinished`. Accessed on October 21, 2026.
- [React, `act`](https://react.dev/reference/react/act): applying pending changes before comparing, `IS_REACT_ACT_ENVIRONMENT`, and why React Testing Library already uses it for you. Accessed on October 21, 2026.
- [React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter): the router with in-memory history and `initialEntries`. Accessed on October 21, 2026.
- [jsdom, README, “Unimplemented parts of the web platform”](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform): navigation and layout outside its scope, the placeholder zeros, and `pretendToBeVisual`. Accessed on October 21, 2026.
- [WHATWG, HTML, “Update the rendering”](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering): the asynchronous focus fix when the focused element stops being focusable, for example when it becomes disabled. Accessed on October 21, 2026.
- [MDN, `disabled` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled): a disabled control does not receive focus or events such as click. Accessed on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| component test | a test that renders components in a test DOM and uses them the way a person would |
| Vitest | the test runner that uses Vite's configuration; provides `test`, `describe`, `expect`, and `vi` |
| jsdom | a DOM written in JavaScript, with no layout or drawing, where the tests run |
| query | a Testing Library function that searches for elements: `getBy…`, `queryBy…`, `findBy…`, and their `All` versions |
| implicit role | the role a native element has without writing `role`: `<button>` is `button`, `<ul>` is `list` |
| `user-event` | library that simulates a person's complete interactions: typing, clicking, pressing keys |
| mocked `fetch` | a `fetch` replaced in the test that answers according to a route table, with no network |
| in-memory router | a React Router router that keeps its history in memory, with no address bar |
| `act` | React tool that applies pending changes before comparing; Testing Library uses it for you |
| the test's exam | undoing the fix that a test protects, seeing it red, and restoring; if it stays green, it protects nothing |
| focus fix | the browser step that, when drawing the next frame, removes focus from an element that stopped being focusable |

---

**Next:** [Lesson 9 — Performance, publishing, and when to use a framework](09-rendimiento-publicacion.md)
