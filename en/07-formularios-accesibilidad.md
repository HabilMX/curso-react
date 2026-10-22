# Lesson 7 — Forms, actions, and accessibility

*It is 5:52 PM on a Friday and the change freeze is at 6:00 PM. The operations team needs to register the `correo` service in the internal tool before leaving, and the person on call is Raúl, who works with a screen reader. He fills in the three fields, presses Enter, and hears nothing. He presses Enter again: nothing. He does not know whether the registration went through, whether it went through twice, or whether the form is waiting for something. What happened is that the address did not start with `https://`: the page painted the field red and wrote the error below it, in a text nobody connected to the field or to an announcement. For anyone looking at the screen, the error was obvious. For Raúl it did not exist. Eight minutes left. The form he needs is the one this lesson builds, and the second Enter, the one nobody heard, is the one you are going to fix in exercise 3.*

**Time:** 2 × 45 min (the natural break is between sections 7.2 and 7.3)

**What you build:** service registration in the `revisor`: a new page at `/servicios/nuevo`, with a three-field form that is validated with the schema from the TypeScript course, submitted to the practice API, shows the errors next to each field, and reports the result to whoever uses a screen reader

**What you learn:** controlled versus uncontrolled; `<form action>`, `useActionState`, `useFormStatus`, and `useOptimistic`; validating with the schema from lesson 6 of the TypeScript course; `aria-invalid` with `aria-describedby`; live regions (`role="status"`, `role="alert"`); native HTML before ARIA; going through it with the keyboard

**Where you are coming from.** From the checkpoint of [Lesson 6](06-reducer-contexto.md): a `revisor` with routes (the list at `/`, the details at `/servicios/:nombre`, and a “not found” page), server data in TanStack Query, a notice tray with its reducer and its context, and some display preferences. Since [Lesson 4](04-estado-del-servidor.md), the practice API already has the route this lesson uses for the first time: `POST /api/servicios`, which responds `201` with the new service, `400` with the invalid fields, or `409` if the name already exists. From the TypeScript course you bring, if you took it, the idea of a **schema**: a value that knows how to read `unknown` and from which a type is derived. If you did not take it, it appears here in full.

**What this lesson does not do.** It does not use any form or validation library: everything comes from React and from the schema you already know, on purpose, so you can see what each piece solves. It does not use Server Functions or Server Components: `<form action>` receives here a function that runs in the browser (why the dashboard does not use Server Components is discussed in [Lesson 9](09-rendimiento-publicacion.md)). It does not add automated tests: the form's behavior is shown with figures that run in a test DOM and with the checkpoint open in a browser. And it is not an accessibility course: it teaches what this form needs, against the sources that define it, and names what cannot be verified without a person and a screen reader.

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions from this lesson's `package.json`. The checkpoints of this lesson and the next two were installed from scratch with `npm ci`, and `npm run lint` and `npm run build` finished cleanly; this lesson's produced `dist/assets/index-C_lOH5GL.js`. The checkpoint was also installed from scratch with `npm ci` in a Linux container (Debian 12, official `node:24.22.0-bookworm` image), where `npm run lint` and `npm run build` finished cleanly. The filename above was measured again on October 22, 2026, on macOS only. The compiler error in “The error you will see” was triggered in a copy of the checkpoint, not in the original. The figures were run with their own `package.json` in [`programas/07-formularios-accesibilidad/`](../programas/07-formularios-accesibilidad), alongside `revisor/`; they are compiled with `tsc` and run with `node`, as in previous lessons, and they add a single new dependency, `dom-accessibility-api` 0.7.1, which computes an element's accessible name and description following the W3C specification. What is seen “in the browser” was measured with headless Chrome: the HTML of `/servicios/nuevo` with `--headless --dump-dom` against `vite preview`, and the accessibility tree, focus, and live regions by driving Chrome through its debugging protocol (*Chrome DevTools Protocol*) with a Node script, against `npm run dev` and the practice API. Those runs used ports 4107, 5107, and 3107 instead of 4173, 5173, and 3100, because other things were running on the machine at the same time; to point the *proxy* to the API on 3107, `vite.config.ts` was changed in a **copy** of the checkpoint, not in the original. Nothing changes for you. The “before” measurements were taken with the form as it was before this lesson's fixes (success announced twice, no `required`, no `aria-atomic` on the tray, no `startTransition`, and `disabled={pending}` on the button), in that same copy; the “after” ones, with the checkpoint. It was not run on a real Linux Mint; nothing shown depends on the OS. **What was not measured**, and is stated where it appears: how the form sounds in a real screen reader (NVDA, Orca, or VoiceOver) and going through it with the keyboard in a real window. Those two checks are in “How I know I got it”, with step-by-step instructions to do them by hand. Long paths are shown starting from `~/curso-react`. The practice server (the same file since Lesson 4) responds `400` with `{"detalle":"nombre de servicio inválido"}` to an address with a malformed `%`, such as `/api/servicios/%`, and to its `/reintento` route; it used to respond `500`. It was measured with `curl` against a copy, before and after, and the process stayed alive in both cases.

## By the end you will be able to

- Explain the difference between a controlled and an uncontrolled field, trigger React's warning for a `value` without `onChange`, and decide which of the two suits a form that is submitted as a whole.
- Wire a `<form action>` to `useActionState`, read in the state what the last action returned, and show “Dando de alta…” with `useFormStatus` from a child component of the form.
- Show with a figure that React clears uncontrolled fields after an action, and keep what was typed when there were errors.
- Validate the three fields with a schema that collects **all** the errors, and verify with the compiler that the schema and the `NuevoServicio` type cannot drift apart without `tsc` noticing.
- Mark an invalid field with `aria-invalid` and `aria-describedby`, and measure with a figure the accessible name and description a screen reader receives.
- Choose between `role="status"` and `role="alert"` for a notice, and explain with the specification why the live region has to exist **before** the message arrives.
- Read in Chrome's accessibility tree whether a field is required or invalid and whether a live region is read in full, before and after a change.

## The why before the how

Up to lesson 6, the `revisor` only **read**: it requested the report, it requested the details, and the only change it sent to the API was a click on “Volver a revisar”, with no data. Registering a service is a different kind of problem, because the person types, and what they type can be wrong in many ways at once. Ask the dashboard four things and you will see what is missing.

**Where does what is typed live while it is being typed?** A text field already keeps its value; the browser has always done that. You can let it keep it and read it when submitting, or copy every keystroke into React state. Both ways work and both have a cost. Choosing without knowing which is which leads to forms that warn in the console, lose what was typed, or re-render on every keystroke for no reason.

**Who handles the submission?** Submitting is not a single line of code. It means preventing the browser from reloading the page, collecting the values, showing that something is in progress, not allowing a second submission meanwhile, waiting for the response, turning it into errors or success, and updating the list of services another page shows. React 19 brings pieces for each of those steps, and this lesson uses them instead of reinventing them.

**Who decides whether a value is valid?** The dashboard already validates what **arrives** from the API with guards like `esReportePublico`. What the person types is also an input at a boundary, and it deserves the same treatment. The TypeScript course taught how to do it with schemas; here they are reused, with one difference that matters: a form cannot stop at the first error.

**How does someone who cannot see the screen find out?** That is the opening scene. A red border and a text below the field are **visual** information. For a screen reader to announce it, the text has to be **associated** with the field, and the “revisa los campos” message has to live in a place the reader monitors. Good intentions do not achieve that: specific attributes do, defined in a W3C specification, and it can be measured.

The four answers fit into three concepts: the uncontrolled field (7.1), the form as an **action** (7.2), and the accessibility of the form and its notices (7.3). Section 7.4 brings everything together in the `revisor` and checks it against the sources, point by point. At the end, this is what `/servicios/nuevo` renders (headless Chrome output, form only):

```text
<form action="javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')" novalidate="" aria-describedby="resultado-alta"><div class="campo"><label for="nombre">Nombre</label><input id="nombre" required="" aria-invalid="false" aria-describedby="nombre-ayuda" type="text" value="" name="nombre"><p id="nombre-ayuda" class="ayuda">Un nombre corto y único, por ejemplo: correo</p></div><div class="campo"><label for="url">Dirección</label><input id="url" required="" aria-invalid="false" aria-describedby="url-ayuda" type="url" value="" name="url"><p id="url-ayuda" class="ayuda">La dirección que se va a revisar, con http:// o https://</p></div><div class="campo"><label for="timeoutMs">Tiempo límite (ms)</label><input id="timeoutMs" required="" aria-invalid="false" aria-describedby="timeoutMs-ayuda" type="text" value="" name="timeoutMs"><p id="timeoutMs-ayuda" class="ayuda">Cuántos milisegundos esperar antes de declarar la falla, por ejemplo: 1500</p></div><button type="submit" aria-disabled="false">Dar de alta</button></form><div id="resultado-alta"><div role="alert"></div></div>
```

Every attribute in that HTML has a reason, and by the end of the lesson you will be able to say which. Only one was not written by you: the `<form>`'s `action="javascript:throw new Error(…)"`. It is the marker React sets when `action` is a function. It never runs on a normal submission, because React intercepts the submission first; it would only fire if someone called `form.submit()` manually, which skips the submit event, and then the error explains what happened and suggests `requestSubmit()`. And the `value=""` attributes are `defaultValue` reflected in the HTML, not a controlled field.

## The concepts

### 7.1 Controlled or uncontrolled

#### 7.1.1 The browser already keeps what you type

A browser `<input>` has its own value. If you type in it, the value changes without anyone programming anything. React lets you work with that fact in two ways, and the `<input>` documentation names them like this ([React, `<input>`](https://react.dev/reference/react-dom/components/input)):

- **Uncontrolled.** You write `<input defaultValue="correo" />`. React sets the **initial** value and then steps aside: what the person types lives in the DOM element, and you read it when you need it (when submitting, for example). The documentation says it precisely: even if you pass an initial value, your JSX “only specifies the initial value. It does not control what the value should be right now.”
- **Controlled.** You write `<input value={nombre} onChange={…} />`. React forces the field to **always** show the value you pass it. Every keystroke fires `onChange`, you update the state, React re-renders, and the field shows the new value. If you do not update the state, the field does not change.

The first figure puts both side by side, plus a third that badly mixes the two ideas: a `value` without `onChange`. In all three, the figure “types” `correo2` as a person would (it changes the value and fires the `input` event) and reads what was left. The controlled one also carries an `<output>` that shows the same value in uppercase, to make visible the difference between what the state **stores** and what the screen **computes** from it.

```tsx
// fig07_01.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// react-dom decide al CARGARSE si hay un DOM con eventos `input`; por eso se
// importa después de preparar `window`, y no arriba con los demás.
const { createRoot } = await import("react-dom/client");

// Los avisos de React salen por console.error: se imprimen recortados al primer renglón.
console.error = (formato: unknown) => {
  console.log(`  [aviso de React] ${String(formato).split("\n")[0]}`);
};

// Escribe en un <input> como lo haría una persona: cambia el valor y avisa con un evento.
function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

function NoControlado() {
  return <input aria-label="no controlado" defaultValue="correo" />;
}

function Controlado() {
  const [nombre, establecerNombre] = useState("correo");
  return (
    <>
      <input aria-label="controlado" value={nombre} onChange={(e) => establecerNombre(e.target.value)} />
      <output>{nombre.toUpperCase()}</output>
    </>
  );
}

function SinOnChange() {
  return <input aria-label="sin onChange" value="correo" />;
}

async function probar(titulo: string, arbol: React.ReactNode, texto: string): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(arbol));
  const campo = contenedor.querySelector("input");

  if (campo === null) {
    throw new Error("no hay campo");
  }

  await act(async () => escribir(campo, texto));
  const salida = contenedor.querySelector("output");
  const derivado = salida === null ? "" : `; el <output> dice «${salida.textContent}»`;
  console.log(`  escribí «${texto}» → el campo dice «${campo.value}»${derivado}`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await probar("1. no controlado (defaultValue):", <NoControlado />, "correo2");
await probar("2. controlado (value + onChange):", <Controlado />, "correo2");
await probar("3. value sin onChange:", <SinOnChange />, "correo2");
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_01.tsx
$ node fig07_01.js
1. no controlado (defaultValue):
  escribí «correo2» → el campo dice «correo2»
2. controlado (value + onChange):
  escribí «correo2» → el campo dice «correo2»; el <output> dice «CORREO2»
3. value sin onChange:
  [aviso de React] You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
  escribí «correo2» → el campo dice «correo»
```

Read the three lines from bottom to top, which is the best way to understand them:

- **The third** received `correo2` and went back to `correo`. React put it back, because `value="correo"` says the field is `correo` **always**, and nobody changes that value. Before that, React warned in the console with a message worth reading in full: you provided a `value` without `onChange`, which makes the field read-only; if it should be able to change, use `defaultValue`; if not, add `onChange` or `readOnly`. It is this section's warning, and its fix depends on what you wanted.
- **The second** received `correo2`, the field shows `correo2`, and the `<output>` shows `CORREO2`. The field says what **your** state says: `onChange` stored `e.target.value` as is and React rendered again with that value. That is “controlled”: the screen knows every keystroke at the moment it happens, and with it can compute whatever it wants—an uppercase version, a letter count, whether the button is enabled. The uppercase is **computed** while rendering, in the `<output>`; it is not stored, by the same rule as [Lesson 2](02-estado-instantanea-forma.md): what can be computed is not stored. And there is a stronger reason not to store it. The temptation is to write `establecerNombre(e.target.value.toUpperCase())` so that the field itself “corrects” as you type, and the `<input>` documentation uses exactly that line as an example of a **mistake**: a controlled field must update its state with `e.target.value`, synchronously, and with nothing else; otherwise the caret may jump to the beginning on every keystroke ([React, `<input>`, “My input caret jumps to the beginning on every keystroke”](https://react.dev/reference/react-dom/components/input#my-input-caret-jumps-to-the-beginning-on-every-keystroke)). This figure does not trigger it, because it “types” the word in one stroke and not key by key with the caret in the middle of a word; that is precisely why the rule is learned from the documentation and not from a run that comes out fine. If a value must end up in uppercase, normalize it on submit, not on every keystroke.
- **The first** received `correo2` and shows `correo2`. React did not intervene.

There is a fourth case the figure does not trigger, but the documentation names: a field cannot switch from uncontrolled to controlled during its lifetime. If a `value` starts as `undefined` (for example, because the state does not have data yet) and later receives a string, React warns that a component “is changing an uncontrolled input to be controlled”. The fix is for `value` to be a string from the first render, even if it is `""`.

#### 7.1.2 Which one suits this form

React's documentation does not declare a winner, and neither does this course: it is a criterion of our own, with a practical rule. **Control a field when the screen needs its value while it is being typed**: a search box that filters the list with every letter (like the one in Lesson 5, which also stores the text in the address), a character counter, a button that becomes enabled when the field stops being empty. **Leave it uncontrolled when it only matters on submit.**

The `revisor`'s registration is of the second kind. Nobody needs the service name while it is being typed; it is needed in full, together with the other two fields, at the moment of submitting. Controlling all three would mean three states, three `onChange` handlers, and a render of the whole form for every keystroke, only to end up doing what the browser does for free. That is why the checkpoint's `Campo` is **uncontrolled**, with `defaultValue`. The next section shows the piece that makes this convenient: React reads the values for you when submitting, into a `FormData`, and it also uses `defaultValue` in a way that is not obvious and that figure 3 measures.

### 7.2 The form as an action

#### 7.2.1 `<form action>` receives a function

In HTML, a form's `action` attribute is an **address**: when submitting, the browser sends the fields to that address and loads the response as a new page. React 19 extends that attribute: if instead of an address you pass it a **function**, React intercepts the submission, collects the fields into a `FormData`, and calls your function with it. The `<form>` documentation describes it in three sentences worth reading together ([React, `<form>`](https://react.dev/reference/react-dom/components/form)): the function handles the submission inside a *Transition*; it can be asynchronous and receives a single argument with the form data; and, unlike `onSubmit`, there is no need to call `e.preventDefault()`.

A *Transition* is React's way of marking an update as “non-urgent”: while it lasts, React can keep responding to the person and knows that something is **pending**. When the function running inside a *Transition* is called an “action” (*Action*), React gives it three gifts this lesson uses: a state that keeps what the last action returned (`useActionState`), a “pending” flag for the components inside the form (`useFormStatus`), and a temporary state shown while the action has not finished (`useOptimistic`).

There are two more details from the same document that you will see in the code. The first: when `action` is a function, the HTTP method is `POST` regardless of the `method` attribute. This is almost always irrelevant, because the browser does not send anything on its own; your function decides what to request and how. The second, and the most surprising: **“After the `action` function succeeds, all uncontrolled field elements in the form are reset.”** Figure 3 puts it to the test.

#### 7.2.2 `useActionState`: the result of the last action

A form needs to remember what happened with the last submission: whether there were errors and which ones, or whether the registration succeeded. `useActionState` is the hook that keeps it ([React, `useActionState`](https://react.dev/reference/react/useActionState)). It receives a function and an initial state, and returns three things: the current state, a function to trigger the action, and an `isPending` flag.

```tsx
// fragmento
const [estado, accion] = useActionState(enviar, estadoInicialFormulario);
// …
<form action={accion}>
```

The function you pass it receives **two** arguments: the previous state and what was submitted (here, the `FormData`). What it returns becomes the new state. If that sounds like a reducer, it is because it is one, with a difference: it can be asynchronous and it can have side effects, such as asking the API for something. The documentation says the opposite of what you would expect from Lesson 6: this function is **not** called twice under `StrictMode`, precisely because it is meant to have side effects. A detail that confuses many people the first time: since the previous state is the first argument, the `FormData` is the **second**. The documentation clarifies it in its troubleshooting section, because it is exactly the opposite of what happens when you give `action` a bare function, without `useActionState`, which receives the `FormData` as its only argument. In the checkpoint, the first argument is called `_previo`: the underscore says “I receive it, but I don't use it”.

Two more rules from the same page that the checkpoint follows. The type of what the function returns has to be the same as the initial state's: that is why there is an `EstadoFormulario` type with its three variants, and the initial state is one of them. And **if the function throws an error, React cancels the queued actions and shows the nearest error boundary**. In the `revisor`, the function catches everything that can fail and turns it into a `con-errores` state, so that path is never taken; but if an error ever escapes, what catches it is the route's error boundary from [Lesson 5](05-rutas-url-como-estado.md), not a blank screen.

This is the form's state. Three variants, one for each thing that may have happened:

```ts
// revisor/src/alta/estadoFormulario.ts
import type { ErroresAlta, TextosAlta } from "./esquemaAlta";

export type EstadoFormulario =
  | { readonly tipo: "inicial" }
  | {
      readonly tipo: "con-errores";
      readonly detalle: string;
      readonly errores: ErroresAlta;
      readonly textos: TextosAlta;
    }
  | { readonly tipo: "agregado"; readonly nombre: string };

export const estadoInicialFormulario: EstadoFormulario = { tipo: "inicial" };

export function textosDe(datos: FormData): TextosAlta {
  const texto = (clave: string): string => {
    const valor = datos.get(clave);
    return typeof valor === "string" ? valor : "";
  };

  return { nombre: texto("nombre"), url: texto("url"), timeoutMs: texto("timeoutMs") };
}
```

`textos` keeps **what the person typed**, as-is, as text. It is not the same as the validated value: `timeoutMs` is typed as `"1500"` and sent as the number `1500`. Keeping the texts is useful for handing them back to the fields when there are errors, and that is where the reset comes in.

#### 7.2.3 The reset that wipes what was typed

The sentence from the `<form>` documentation has an immediate practical consequence: “succeeds” means “the function did not throw an error”, **not** “the registration succeeded”. If your function validates, finds three errors, and returns a `con-errores` state, for React it succeeded, and React resets the fields. The person sees their errors… and empty fields. They have to type everything again, including what was right.

To what value is a field reset? To its `defaultValue`. And here is the trick the checkpoint uses: React re-renders the form with the new state **before** resetting it, so if `defaultValue` comes from the state, the field is reset to what the person had typed. Figure 3 measures it with a minimal form: it types `correo`, submits, and reads the field once the action has finished. It does so twice, with `defaultValue` fixed at `""` and with `defaultValue` taken from the state. Along the way, it records what `useFormStatus` saw from two places, which is the topic of 7.2.4.

```tsx
// fig07_03.tsx
import { JSDOM } from "jsdom";
import { act, useActionState } from "react";
import { createRoot } from "react-dom/client";
import { useFormStatus } from "react-dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  FormData: dom.window.FormData,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const vistos: string[] = [];

function Boton() {
  const { pending } = useFormStatus();
  vistos.push(`hijo=${pending}`);
  return <button type="submit">{pending ? "Dando de alta…" : "Dar de alta"}</button>;
}

type Estado = { readonly vueltas: number; readonly ultimo: string };

function Formulario({ conservar }: { readonly conservar: boolean }) {
  const [estado, accion] = useActionState(async (previo: Estado, datos: FormData): Promise<Estado> => {
    await new Promise((listo) => setTimeout(listo, 10));
    return { vueltas: previo.vueltas + 1, ultimo: String(datos.get("nombre")) };
  }, { vueltas: 0, ultimo: "" });
  const { pending } = useFormStatus();
  vistos.push(`mismo=${pending}`);

  return (
    <form action={accion}>
      <input name="nombre" aria-label="Nombre" defaultValue={conservar ? estado.ultimo : ""} />
      <Boton />
    </form>
  );
}

function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function enviar(conservar: boolean): Promise<void> {
  vistos.length = 0;
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(<Formulario conservar={conservar} />));
  const campo = contenedor.querySelector("input");
  const formulario = contenedor.querySelector("form");

  if (campo === null || formulario === null) {
    throw new Error("falta el formulario");
  }

  await act(async () => escribir(campo, "correo"));
  await act(async () => {
    formulario.requestSubmit();
    await new Promise((listo) => setTimeout(listo, 50));
  });

  console.log(`defaultValue ${conservar ? "desde el estado" : 'fijo en ""'}:`);
  console.log(`  pending visto: ${[...new Set(vistos)].join(", ")}`);
  console.log(`  después de la acción, el campo dice «${campo.value}»`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await enviar(false);
await enviar(true);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_03.tsx
$ node fig07_03.js
defaultValue fijo en "":
  pending visto: mismo=false, hijo=false, hijo=true
  después de la acción, el campo dice «»
defaultValue desde el estado:
  pending visto: mismo=false, hijo=false, hijo=true
  después de la acción, el campo dice «correo»
```

With a fixed `defaultValue`, the field was left empty; with `defaultValue` from the state, it kept `correo`. That is exactly what the `revisor` does: when the state is `con-errores`, each `Campo` receives as `valorInicial` the text the person typed. When the state is `agregado`, the texts go back to `""` and the form is left clean for the next registration, which is what you want after a success.

For the figure's form to be submittable in a test DOM, Node had to be told to use jsdom's `FormData` (`FormData: dom.window.FormData`): without that line, React builds the `FormData` with Node's, which cannot read a jsdom form, and the submission fails with `FormData constructor: Argument 1 could not be converted`. It is a detail of the figure, not of the browser, but if you ever see it, you now know where it comes from.

#### 7.2.4 `useFormStatus`: the button knows a submission is in progress

While the action waits for the API, the person has to see that something is happening, and must not be able to submit twice. `useFormStatus` answers the question “does the form I am in have a pending submission?” ([React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)). It is imported from `react-dom`, not from `react`, and it returns `pending`, `data`, `method`, and `action`.

The words that matter are **the form I am in**. The documentation warns about it under its own heading: `useFormStatus` only reports on a **parent** `<form>`, and not on a `<form>` rendered in the same component that calls the hook. Figure 3 measured it in both places: the `Formulario` component, which renders the `<form>`, always saw `mismo=false`; the `Boton` component, which renders **inside** the `<form>`, saw `hijo=false` and then `hijo=true`. That is why the `revisor`'s submit button is a separate component:

```tsx
// revisor/src/alta/BotonEnviar.tsx
import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";

export function BotonEnviar() {
  const { pending } = useFormStatus();

  // `disabled` le quitaría el foco al botón mientras está pendiente, y quien usa el
  // teclado perdería su lugar. `aria-disabled` lo anuncia como no disponible sin
  // sacarle el foco; el segundo envío se ignora aquí, cancelando el clic.
  function alPulsar(evento: MouseEvent<HTMLButtonElement>): void {
    if (pending) {
      evento.preventDefault();
    }
  }

  return (
    <button type="submit" aria-disabled={pending} onClick={alPulsar}>
      {pending ? "Dando de alta…" : "Dar de alta"}
    </button>
  );
}
```

The text changes to “Dando de alta…” for whoever is looking, and the button shuts the door on a second submission. It is an HTML `<button type="submit">`: it is activated with Enter from any field and with Space or Enter when it has focus, without a single line of JavaScript. That is the first appearance of an idea that comes back in 7.3: native elements bring behavior that ARIA does not.

What it does **not** use is `disabled`, and the reason was measured. The obvious way to prevent the second submission is `disabled={pending}`, and that is how it was written at first. A disabled button cannot have focus, and that has a cost you only see with the keyboard. With Chrome driven through its debugging protocol, the form filled in with valid data, focus on the button, and the Space key, this is what the script measured with `disabled={pending}`:

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
pendiente: foco en body; «Dando de alta…» disabled=true aria-disabled=null opacity=1 cursor=default
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=(ausente) focused=(ausente)
segundo Espacio mientras está pendiente
al terminar: foco en body; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

While the registration was pending, focus was already on `body` and the accessibility tree no longer said the button had focus; when it finished, focus did not come back. For a screen reader, focus vanished from the page at the moment of submitting. (Shift+Tab did go back to “Tiempo límite (ms)”, because Chrome remembers where focus left from; even so, the person listening no longer knows where they are.) With Enter **from a field** it does not happen, because focus stays on the field.

The checkpoint's button uses `aria-disabled`, which **announces** “unavailable” without taking focus away, and cancels the click while a submission is pending. Cancelling the click is enough: Space and Enter on the button arrive as a click, and the HTML standard defines implicit submission with Enter from a field as a `click` event on the form's submit button ([WHATWG, HTML, “Implicit submission”](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)). The same script, with the checkpoint:

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
pendiente: foco en button; «Dando de alta…» disabled=false aria-disabled=true opacity=0.6 cursor=not-allowed
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=true focused=true
segundo Espacio mientras está pendiente
al terminar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

Focus stayed on the button during and after the submission; the accessibility tree reports it as `disabled=true` (which the reader announces as “unavailable” or “dimmed”) and at the same time `focusable=true` and `focused=true`; and the button **looks** disabled, with `opacity=0.6` and the `not-allowed` cursor, thanks to a new rule in the stylesheet (`button[aria-disabled="true"]`). Watch out for what `aria-disabled` does not do: it disables nothing, it only says so. MDN explains it this way: unlike `disabled`, `aria-disabled="true"` **only** exposes the element as disabled; the developer has to suppress its functionality and change its appearance, and the attribute does not change whether it can be focused ([MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)). The same page warns that the “disabled” styling must still meet color contrast requirements; the checkpoint's `opacity: 0.6` was not measured against that criterion. It was verified by removing `onClick={alPulsar}` in a copy: the second Space did submit, and the API's log recorded two registrations in a row, the second rejected as a duplicate:

```text
09:10:21.186 POST /api/servicios 201
09:10:21.491 POST /api/servicios 409
```

(The first two lines come from the earlier runs; the last two, from the copy without the guard.) With the guard, each run left a single `POST`. It is the same idea as 7.3.1 seen from the other side: ARIA describes, it does not act, and you have to write the behavior yourself. All of this was measured only in Chrome.

#### 7.2.5 `useOptimistic`: showing what the API has not confirmed yet

The registration takes 300 ms on the practice API, and on a slow network it can take much longer. Meanwhile, the person can see the service in an “Altas de esta sesión” list, marked as pending. That state shown **before** confirmation is what the documentation calls optimistic ([React, `useOptimistic`](https://react.dev/reference/react/useOptimistic)).

`useOptimistic(valor, reductor)` returns a pair: the state to show and a function to change it. Its central rule is a sentence from the documentation: the optimistic state **is only rendered while an action is in progress; otherwise, `valor` is rendered**. There is no need to “clean it up”: when the action finishes, the optimistic and real states coincide in the same render. And the function that changes it has to be called **inside an action**; if you call it outside, React warns with `An optimistic state update occurred outside a Transition or Action` and the optimistic state appears and disappears in an instant.

In the `revisor`, the real value is `altas`, a state with this session's confirmed registrations, and the reducer adds a name marked as `pendiente`. The reducer ignores a name that is already on the list. That way, if the registration of `correo` was confirmed once and someone tries `correo` again, the list does not show a second pending row while the API decides (and the API will respond `409`).

#### 7.2.6 State that changes after an `await`

The sentence “the optimistic and real states coincide in the same render” has a condition, and the `useActionState` documentation writes it in its caveats: if you change state **after an `await`** inside the action, for now you have to wrap that change in an additional `startTransition` ([React, `useActionState`](https://react.dev/reference/react/useActionState)). The reason is that whatever comes after an `await` no longer runs “inside” the action in React's eyes: it is an urgent update that is rendered immediately, even though the action is still pending.

In the registration, `establecerAltas` comes after `await darDeAlta(…)`. To see what happens without `startTransition`, the reducer's duplicate filter (which would otherwise hide it) was removed in a copy and a service was registered in Chrome, with the development server, recording each version of the “Altas de esta sesión” list and the console:

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo3 (agregando…)»]
  [«correo3», «correo3 (agregando…)»]
  [«correo3»]
consola:
  error: Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. correo3
```

In the middle **two** rows with the same name appeared, one confirmed and another still “agregando…”, and React warned in the console that two children had the same `key` (the `` `%s` `` is the slot in the message where the key goes; the measurement tool printed it as-is and put the key, `correo3`, at the end). It is the urgent update rendering on top of the optimistic state, which was still alive because the action had not finished. The same copy, without the duplicate filter but with the change wrapped in `startTransition`:

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo4 (agregando…)»]
  [«correo4»]
consola:
```

One pending row and then the confirmed one, with no intermediate steps and no warning. The checkpoint has `startTransition` around the two changes that follow the `await` (the registrations and the tray notice), and keeps the duplicate filter for what it is really there for: the repeated name from the previous paragraph. It is a measurement from one run in Chrome; what backs it in general is the documentation's caveat.

#### 7.2.7 The complete form

This is the component that puts the pieces together. Read it from top to bottom with this guide: the two state hooks (`altas` and its optimistic version); the `enviar` function, which is the action; `useActionState`; and the JSX, with the form, the error region, and the optimistic list.

```tsx
// revisor/src/alta/FormularioAlta.tsx
import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useActionState, useOptimistic, useState } from "react";
import { useDespachoAvisos } from "../avisos/usarAvisos";
import { validarCampos } from "../compartido/esquema";
import { claves } from "../consultas/claves";
import { BotonEnviar } from "./BotonEnviar";
import { Campo } from "./Campo";
import { darDeAlta } from "./darDeAlta";
import { camposAlta } from "./esquemaAlta";
import { estadoInicialFormulario, textosDe, type EstadoFormulario } from "./estadoFormulario";

interface Alta {
  readonly nombre: string;
  readonly pendiente: boolean;
}

export function FormularioAlta() {
  const clienteConsultas = useQueryClient();
  const despachar = useDespachoAvisos();
  const [altas, establecerAltas] = useState<readonly Alta[]>([]);
  const [altasVisibles, agregarAltaOptimista] = useOptimistic(
    altas,
    (actuales, nombre: string) =>
      actuales.some((alta) => alta.nombre === nombre)
        ? actuales
        : [...actuales, { nombre, pendiente: true }],
  );

  async function enviar(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const textos = textosDe(datos);
    const validacion = validarCampos(camposAlta, textos);

    if (!validacion.ok) {
      return { tipo: "con-errores", detalle: "Revisa los campos marcados.", errores: validacion.errores, textos };
    }

    agregarAltaOptimista(validacion.valor.nombre);

    try {
      const respuesta = await darDeAlta(validacion.valor);

      if (!respuesta.ok) {
        return { tipo: "con-errores", detalle: respuesta.detalle, errores: respuesta.errores, textos };
      }

      // Después de un `await`, una actualización de estado ya no pertenece a la acción:
      // `startTransition` la devuelve a ella, y la fila optimista y la confirmada se
      // reemplazan en el mismo dibujo. El aviso de éxito lo da solo la bandeja.
      startTransition(() => {
        establecerAltas((actuales) => [...actuales, { nombre: respuesta.estado.nombre, pendiente: false }]);
        despachar({ tipo: "agregado", nivel: "exito", texto: `Se dio de alta ${respuesta.estado.nombre}` });
      });
      await clienteConsultas.invalidateQueries({ queryKey: claves.reporte });
      return { tipo: "agregado", nombre: respuesta.estado.nombre };
    } catch (error: unknown) {
      const detalle = error instanceof Error ? error.message : "falló el alta";
      return { tipo: "con-errores", detalle: `No se pudo dar de alta: ${detalle}`, errores: {}, textos };
    }
  }

  const [estado, accion] = useActionState(enviar, estadoInicialFormulario);
  const errores = estado.tipo === "con-errores" ? estado.errores : {};
  const textos = estado.tipo === "con-errores" ? estado.textos : { nombre: "", url: "", timeoutMs: "" };

  return (
    <>
      <form action={accion} noValidate aria-describedby="resultado-alta">
        <Campo
          nombre="nombre"
          etiqueta="Nombre"
          ayuda="Un nombre corto y único, por ejemplo: correo"
          valorInicial={textos.nombre}
          error={errores.nombre}
        />
        <Campo
          nombre="url"
          etiqueta="Dirección"
          tipo="url"
          ayuda="La dirección que se va a revisar, con http:// o https://"
          valorInicial={textos.url}
          error={errores.url}
        />
        <Campo
          nombre="timeoutMs"
          etiqueta="Tiempo límite (ms)"
          ayuda="Cuántos milisegundos esperar antes de declarar la falla, por ejemplo: 1500"
          valorInicial={textos.timeoutMs}
          error={errores.timeoutMs}
        />
        <BotonEnviar />
      </form>
      <div id="resultado-alta">
        <div role="alert">{estado.tipo === "con-errores" && <p>{estado.detalle}</p>}</div>
      </div>
      {altasVisibles.length > 0 && (
        <section aria-label="Altas de esta sesión">
          <h3>Altas de esta sesión</h3>
          <ul>
            {altasVisibles.map((alta) => (
              <li key={alta.nombre} className={alta.pendiente ? "pendiente" : undefined}>
                {alta.nombre}
                {alta.pendiente && " (agregando…)"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
```

The `enviar` function follows the order of a boundary, the same one `cargarReporte` follows with the API's response: first it reads (`textosDe`), then it validates (`validarCampos`), and only with valid data does it do anything. If validation fails, the API is **not called**: the errors are returned in the state and there is no request. If validation passes, the optimistic row is added, the data is sent, and the response is turned into one of three outcomes:

1. The API rejected the registration (`400` or `409`): state `con-errores`, with the **API's** errors per field and the texts so nothing typed is lost.
2. The API accepted (`201`): inside `startTransition`, the confirmed registration is added and the success notice is sent to Lesson 6's tray, which is the **only** announcement of success (7.3.3 explains why); then the `["reporte"]` query is invalidated so that the list at `/` fetches the new service the next time it is shown, and the state becomes `agregado`.
3. Something else failed (the network, an unexpected response): the `catch` turns it into `con-errores` with a general message, without per-field errors.

`noValidate` on the `<form>` turns off the browser's validation. MDN describes the attribute as “the form shouldn't be validated when submitted” ([MDN, `<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)). It is turned off because the form does its own, with the schema's messages and with all the errors at once; if it were left on, the browser would stop the submission at the first field with its own bubble, different in every browser, and the action would not run.

#### 7.2.8 Validating with the schema: all the errors at once

The schema comes from the TypeScript course almost unchanged. An `Esquema<T>` is an object with a `leer` method that receives `unknown` and returns a result: either a value of type `T`, or an error detail. `Inferir` extracts the type `T` from a schema, so you do not write it twice. Added to the schemas from there are two this form needs: `urlHttp`, which accepts only `http:` or `https:` addresses and normalizes them with `URL`, and `enteroPositivoDeTexto`, which reads a number written as text, because **everything that comes out of a `FormData` is text**. On top of that, `urlHttp` rejects an address that carries a user or a password, such as `https://usuario:clave@correo.example/`: that data is a secret. Its message, «quita el usuario y la clave de la dirección» (remove the user and the password from the address), says what to fix **without repeating the address**, because the message is painted next to the field and an error is no place for a secret. The practice server rejects the same thing, with the same message, in its `400`.

```ts
// revisor/src/compartido/esquema.ts
// Los esquemas de la lección 6 del curso de TypeScript: un valor que sabe leer
// `unknown` en ejecución y del que se deriva el tipo de su salida.
export type Resultado<T> = { ok: true; valor: T } | { ok: false; detalle: string };

export type Esquema<T> = {
  leer(valor: unknown): Resultado<T>;
};

export type Inferir<E extends Esquema<unknown>> = E extends Esquema<infer T> ? T : never;

export const textoNoVacio: Esquema<string> = {
  leer(valor) {
    if (typeof valor === "string" && valor.trim() !== "") {
      return { ok: true, valor: valor.trim() };
    }

    return { ok: false, detalle: "escribe un valor" };
  },
};

export const urlHttp: Esquema<string> = {
  leer(valor) {
    if (typeof valor !== "string") {
      return { ok: false, detalle: "escribe una dirección" };
    }

    try {
      const url = new URL(valor.trim());

      if (url.protocol === "http:" || url.protocol === "https:") {
        // Usuario y clave en la dirección son un secreto: se rechazan, y el mensaje
        // no repite la dirección, porque terminaría pintado junto al campo.
        if (url.username !== "" || url.password !== "") {
          return { ok: false, detalle: "quita el usuario y la clave de la dirección" };
        }

        return { ok: true, valor: url.href };
      }
    } catch {
      // cae al mensaje de abajo
    }

    return { ok: false, detalle: "escribe una dirección que empiece con http:// o https://" };
  },
};

export const enteroPositivoDeTexto: Esquema<number> = {
  leer(valor) {
    if (typeof valor === "string" && /^[1-9]\d*$/.test(valor.trim())) {
      const numero = Number(valor.trim());

      if (Number.isSafeInteger(numero)) {
        return { ok: true, valor: numero };
      }
    }

    return { ok: false, detalle: "escribe un número entero mayor que cero" };
  },
};

export type ValoresDe<T extends Record<string, Esquema<unknown>>> = {
  [K in keyof T]: Inferir<T[K]>;
};

export type ErroresDe<T> = Partial<Record<keyof T, string>>;

// A diferencia de `objeto` en TypeScript, que se detiene en el primer error, un
// formulario necesita TODOS los errores a la vez: uno junto a cada campo.
export function validarCampos<T extends Record<string, Esquema<unknown>>>(
  campos: T,
  valores: Readonly<Record<string, unknown>>,
): { ok: true; valor: ValoresDe<T> } | { ok: false; errores: ErroresDe<T> } {
  const salida: Record<string, unknown> = {};
  const errores: ErroresDe<T> = {};

  for (const clave of Object.keys(campos) as (keyof T & string)[]) {
    const resultado = campos[clave].leer(valores[clave]);

    if (resultado.ok) {
      salida[clave] = resultado.valor;
    } else {
      errores[clave] = resultado.detalle;
    }
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }

  return { ok: true, valor: salida as ValoresDe<T> };
}
```

The difference that matters is at the end, in `validarCampos`. In TypeScript, an object's schema stopped at the first invalid field, and for an API that is fine: it rejects the request and explains the first reason. A form cannot do that. If the person left the name empty **and** mistyped the address, telling them only the first forces them to submit, fix, submit again, and discover the second error. Figure 2 compares the two strategies with the same invalid submission:

```ts
// fig07_02.ts
type Resultado<T> = { ok: true; valor: T } | { ok: false; detalle: string };
type Esquema<T> = { leer(valor: unknown): Resultado<T> };

const textoNoVacio: Esquema<string> = {
  leer: (v) =>
    typeof v === "string" && v.trim() !== "" ? { ok: true, valor: v.trim() } : { ok: false, detalle: "escribe un valor" },
};

const urlHttp: Esquema<string> = {
  leer(v) {
    try {
      const url = new URL(String(v).trim());
      if (url.protocol === "http:" || url.protocol === "https:") {
        if (url.username !== "" || url.password !== "") {
          return { ok: false, detalle: "quita el usuario y la clave de la dirección" };
        }
        return { ok: true, valor: url.href };
      }
    } catch {
      // cae al mensaje de abajo
    }
    return { ok: false, detalle: "escribe una dirección que empiece con http:// o https://" };
  },
};

const enteroPositivoDeTexto: Esquema<number> = {
  leer: (v) =>
    typeof v === "string" && /^[1-9]\d*$/.test(v.trim())
      ? { ok: true, valor: Number(v.trim()) }
      : { ok: false, detalle: "escribe un número entero mayor que cero" },
};

const campos: Record<string, Esquema<unknown>> = { nombre: textoNoVacio, url: urlHttp, timeoutMs: enteroPositivoDeTexto };

// Como `objeto` en la lección 6 de TypeScript: se detiene en el primer error.
function primerError(valores: Record<string, unknown>): string {
  for (const [clave, esquema] of Object.entries(campos)) {
    const r = esquema.leer(valores[clave]);
    if (!r.ok) {
      return `${clave}: ${r.detalle}`;
    }
  }
  return "sin errores";
}

// Como `validarCampos` del revisor: junta todos.
function todosLosErrores(valores: Record<string, unknown>): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const [clave, esquema] of Object.entries(campos)) {
    const r = esquema.leer(valores[clave]);
    if (!r.ok) {
      errores[clave] = r.detalle;
    }
  }
  return errores;
}

const enviado = { nombre: "  ", url: "ftp://correo", timeoutMs: "1.5" };
console.log("primer error:     ", primerError(enviado));
console.log("todos los errores:", todosLosErrores(enviado));
console.log("válido:           ", urlHttp.leer(" https://correo.example "));
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_02.ts
$ node fig07_02.js
primer error:      nombre: escribe un valor
todos los errores: {
  nombre: 'escribe un valor',
  url: 'escribe una dirección que empiece con http:// o https://',
  timeoutMs: 'escribe un número entero mayor que cero'
}
válido:            { ok: true, valor: 'https://correo.example/' }
```

Three errors found at once versus one. And the last line shows the normalization: `" https://correo.example "` comes out as `https://correo.example/`, without spaces and with the trailing `/` that `URL` adds. That is the value that travels to the API.

The registration schema combines three schemas in an object and derives from it the three types the form uses: the validated values, the per-field errors, and the raw texts.

```ts
// revisor/src/alta/esquemaAlta.ts
import type { NuevoServicio } from "../compartido/contrato";
import {
  enteroPositivoDeTexto,
  textoNoVacio,
  urlHttp,
  type ErroresDe,
  type ValoresDe,
} from "../compartido/esquema";

export const camposAlta = {
  nombre: textoNoVacio,
  url: urlHttp,
  timeoutMs: enteroPositivoDeTexto,
};

export type ValoresAlta = ValoresDe<typeof camposAlta>;
export type ErroresAlta = ErroresDe<typeof camposAlta>;
export type TextosAlta = Readonly<Record<keyof typeof camposAlta, string>>;

// Si el tipo que la API espera y el esquema dejan de coincidir, esta línea deja de compilar.
export const comprobarContrato: (valores: ValoresAlta) => NuevoServicio = (valores) => valores;
```

The last line deserves a slow reading, because it does nothing at run time and yet it is the most important line in the file. `comprobarContrato` is a function that receives `ValoresAlta` and returns it as `NuevoServicio`, the type the API expects according to `src/compartido/contrato.ts`. If someone changes the schema (adds a field, renames it, or changes its type) and it stops matching the API's type, that assignment stops compiling and `npm run build` stops at `tsc -b`. In “The error you will see” you are going to trigger it.

#### 7.2.9 The registration's network boundary

`darDeAlta` does with the `POST`'s response the same thing `cargarReporte` does with the `GET`'s: it does not trust it. It translates the three codes the API documents and throws an error for any other. There is one case that escapes earlier: if the body is not JSON (for example, because the practice server is off and what responds is Vite's *proxy*), the error is thrown by `respuesta.json()`, and the message you will see in the error region is JavaScript's, not “la API respondió …”. This is deduced from the code; it was not measured.

```ts
// revisor/src/alta/darDeAlta.ts
import { esEstadoPublico, esRegistro, type EstadoPublico, type NuevoServicio } from "../compartido/contrato";
import type { ErroresAlta } from "./esquemaAlta";

export type RespuestaAlta =
  | { readonly ok: true; readonly estado: EstadoPublico }
  | { readonly ok: false; readonly detalle: string; readonly errores: ErroresAlta };

function erroresDe(valor: unknown): ErroresAlta {
  if (!esRegistro(valor)) {
    return {};
  }

  const errores: ErroresAlta = {};

  for (const clave of ["nombre", "url", "timeoutMs"] as const) {
    const texto = valor[clave];

    if (typeof texto === "string") {
      errores[clave] = texto;
    }
  }

  return errores;
}

export async function darDeAlta(nuevo: NuevoServicio): Promise<RespuestaAlta> {
  const respuesta = await fetch("/api/servicios", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(nuevo),
  });
  const cuerpo: unknown = await respuesta.json();

  if (respuesta.status === 201 && esEstadoPublico(cuerpo)) {
    return { ok: true, estado: cuerpo };
  }

  if ((respuesta.status === 400 || respuesta.status === 409) && esRegistro(cuerpo)) {
    return {
      ok: false,
      detalle: typeof cuerpo.detalle === "string" ? cuerpo.detalle : "la API rechazó el alta",
      errores: erroresDe(cuerpo.campos),
    };
  }

  throw new Error(`la API respondió ${respuesta.status}`);
}
```

The interesting case is the `409`. The API responds `{"detalle":"ya existe un servicio llamado correo","campos":{"nombre":"ese nombre ya existe"}}`, and `erroresDe` turns `campos` into an `ErroresAlta`. That way, an error **only the API can know** (the form does not know which names already exist) appears next to the right field, with the same look and the same accessibility as a local validation error. For the form there is no difference between “the schema said no” and “the API said no”: both arrive as per-field errors.

### 7.3 Accessibility: native first, ARIA where native falls short

#### 7.3.1 The first rule of ARIA

ARIA (*Accessible Rich Internet Applications*) is a W3C specification that adds attributes to HTML to describe to assistive technologies—a screen reader, for example—what an element **is** (`role`), what **state** it is in (`aria-invalid`), and what it **relates to** (`aria-describedby`). The W3C guide for using it starts with a rule, the first one, which this course takes literally: if you can use a native HTML element or attribute with the semantics and behavior you require already built in, instead of repurposing an element and adding an ARIA role, state, or property, do so ([W3C, “Using ARIA”](https://www.w3.org/TR/using-aria/)). The second rule complements it: do not change native semantics unless you really have to.

The reason is in a sentence from the ARIA practices guide: unlike HTML form elements, ARIA roles **do not cause browsers to provide keyboard behaviors or styling** ([W3C, “ARIA Authoring Practices Guide: Read Me First”](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)). A `<div role="button">` tells the screen reader “I am a button”, but it does not respond to Enter, does not enter the tab order, and does not submit the form. A `<button type="submit">` does all three without asking for anything. The same guide sums it up in the title of its section: “No ARIA is better than Bad ARIA”.

In the `revisor`'s form, native elements solve almost everything:

- **`<label htmlFor>`** gives each field a name. MDN describes two advantages: the screen reader reads the label when the field receives focus, and clicking the label moves focus to the field, which enlarges the clickable area ([MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)). In JSX, the `for` attribute is written `htmlFor`.
- **`<button type="submit">`** submits with Enter from any field, enters the tab order on its own, and can be disabled with `disabled`.
- **Document order** is tab order. MDN says so for focusable elements without a positive `tabindex`: the focus navigation order is the order in the source code ([MDN, `tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex)). That is why the form does not use a single `tabindex`: the fields are written in the order in which they are filled in.
- **`:focus-visible`** marks where focus is when the person navigates with the keyboard. MDN defines it as the pseudo-class that applies when the element has focus and the browser determines, via heuristics, that the focus should be made evident ([MDN, `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)). In practice: on a button or a link it appears when tabbing and not when clicking with the mouse; on a text field it also appears on click, because the browser assumes you are going to type and need to see where. MDN gives exactly that example: a button pressed with the mouse generally does not show focus, and a text field waiting for your input does.

ARIA comes in at two places where HTML has no equivalent: associating a field with its error, and announcing a change that happened away from focus.

#### 7.3.2 The field: `aria-invalid` and `aria-describedby`

```tsx
// revisor/src/alta/Campo.tsx
export function Campo({
  nombre,
  etiqueta,
  ayuda,
  tipo = "text",
  valorInicial,
  error,
}: {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly ayuda: string;
  readonly tipo?: "text" | "url";
  readonly valorInicial: string;
  readonly error: string | undefined;
}) {
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;

  return (
    <div className="campo">
      <label htmlFor={nombre}>{etiqueta}</label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        required
        defaultValue={valorInicial}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? idAyuda : `${idError} ${idAyuda}`}
      />
      {error !== undefined && (
        <p id={idError} className="error-campo">
          {error}
        </p>
      )}
      <p id={idAyuda} className="ayuda">
        {ayuda}
      </p>
    </div>
  );
}
```

One relationship or state per attribute:

- **`htmlFor={nombre}` with `id={nombre}`**: the field's accessible name is its label.
- **`required`**: the field is mandatory. It is the native HTML attribute, which is why `aria-required` is not written: WAI-ARIA defines `aria-required` as “user input is required on the element before a form may be submitted” and names HTML's `required` as a related concept ([W3C, WAI-ARIA 1.2, `aria-required`](https://www.w3.org/TR/wai-aria-1.2/#aria-required)), and the specification that maps HTML to each operating system's accessibility API exposes `required` the same way as `aria-required` ([W3C, “HTML Accessibility API Mappings”](https://www.w3.org/TR/html-aam-1.0/)). With `noValidate` on the form, the browser no longer stops the submission because of an empty field, but the attribute still says “required”. It was measured in Chrome's accessibility tree (7.4.2): without the attribute, all three fields came out as `required=false`; with it, as `required=true`.
- **`aria-invalid`**: the state. The specification defines it as “the value entered … does not conform to the format expected by the application” and asks the author to set it to `true` when the value is computed to be invalid ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). The reader announces it as “invalid” or “invalid entry”, depending on the reader.
- **`aria-describedby`**: the explanation. The specification defines it as the attribute that identifies the element, or elements, that **describe** the object, and distinguishes the label, which should be concise, from the description, intended to provide more detailed information ([W3C, WAI-ARIA 1.2, `aria-describedby`](https://www.w3.org/TR/wai-aria-1.2/#aria-describedby)). It takes a space-separated list of identifiers, and the specification that computes accessible texts joins them **in that order**, separated by a space ([W3C, “Accessible Name and Description Computation 1.2”](https://www.w3.org/TR/accname-1.2/)). That is why the error goes first: `nombre-error nombre-ayuda` is read as “escribe un valor”, and then the help text.

Figure 4 renders a reduced copy of `Campo` (the same relationships, without `type`, `required`, or classes) without an error, with an error, and, for comparison, an “old-school” version with one text above and another below, without `<label>` or relationships. For each one it computes the accessible name and description with `dom-accessibility-api`, a library that implements that W3C computation:

```tsx
// fig07_04.tsx
import { computeAccessibleDescription, computeAccessibleName } from "dom-accessibility-api";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// Una copia reducida del Campo del revisor (src/alta/Campo.tsx): las mismas relaciones de
// etiqueta, aria-invalid y aria-describedby; sin type, required, defaultValue ni clases,
// que no cambian el nombre ni la descripción accesibles.
function Campo({ nombre, etiqueta, ayuda, error }: {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly ayuda: string;
  readonly error: string | undefined;
}) {
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;

  return (
    <div className="campo">
      <label htmlFor={nombre}>{etiqueta}</label>
      <input
        id={nombre}
        name={nombre}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? idAyuda : `${idError} ${idAyuda}`}
      />
      {error !== undefined && <p id={idError}>{error}</p>}
      <p id={idAyuda}>{ayuda}</p>
    </div>
  );
}

// Lo mismo, a la antigua: un texto encima del campo, sin <label> ni aria-*.
function CampoSinRelaciones() {
  return (
    <div>
      <p>Nombre</p>
      <input name="nombre" />
      <p>escribe un valor</p>
    </div>
  );
}

const raiz = createRoot(dom.window.document.getElementById("raiz")!);

async function leer(titulo: string, arbol: React.ReactNode): Promise<void> {
  await act(async () => raiz.render(arbol));
  const campo = dom.window.document.querySelector("input")!;
  console.log(titulo);
  console.log(`  html:        ${campo.outerHTML}`);
  console.log(`  nombre:      «${computeAccessibleName(campo)}»`);
  console.log(`  descripción: «${computeAccessibleDescription(campo)}»`);
}

const ayuda = "Un nombre corto y único, por ejemplo: correo";
await leer("sin error:", <Campo nombre="nombre" etiqueta="Nombre" ayuda={ayuda} error={undefined} />);
await leer("con error:", <Campo nombre="nombre" etiqueta="Nombre" ayuda={ayuda} error="escribe un valor" />);
await leer("sin relaciones:", <CampoSinRelaciones />);
await act(async () => raiz.unmount());
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_04.tsx
$ node fig07_04.js
sin error:
  html:        <input id="nombre" aria-invalid="false" aria-describedby="nombre-ayuda" name="nombre">
  nombre:      «Nombre»
  descripción: «Un nombre corto y único, por ejemplo: correo»
con error:
  html:        <input id="nombre" aria-invalid="true" aria-describedby="nombre-error nombre-ayuda" name="nombre">
  nombre:      «Nombre»
  descripción: «escribe un valor Un nombre corto y único, por ejemplo: correo»
sin relaciones:
  html:        <input name="nombre">
  nombre:      «»
  descripción: «»
```

What a screen reader reads when it reaches the field is, in essence, those two lines plus the role and the state: “Nombre, edit text, invalid, escribe un valor. Un nombre corto y único, por ejemplo: correo”. The version without relationships has an **empty name and an empty description**: visually it says the same thing, but for someone who cannot see the screen it is a nameless text field. That is the opening scene, measured. (The figure computes what **the specification** says the browser must expose; how each screen reader pronounces it cannot be measured with a run, and is checked by hand.)

An improvement the checkpoint does not include, because it does not change the accessible name or description: the time-limit field is of type `text` and asks for a whole number, and on a phone the keyboard that appears is the letters one. The `inputmode="numeric"` attribute asks the browser for the numeric keyboard ([MDN, `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)); in JSX it is written `inputMode`. Adding it would require one more property on `Campo`, and it is a good extra exercise if you are going to use the form from a phone.

There are three decisions in the component that have a source:

- **`aria-invalid` is `false` until a submission is attempted.** The field starts without an error, so the attribute comes out as `aria-invalid="false"`, and only becomes `true` when a submission returned an error for that field. The specification recommends this for empty required fields: if the person has not attempted to submit the form, the author **should not** mark a required field as invalid just because it does not have data yet ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). It is a *SHOULD NOT*, not a prohibition, and it is about the empty field: marking an invalid format before submitting, for example when leaving the field, is another decision the specification does not settle. MDN explains it in other words: the person may still be filling it in ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). With `required` there was a doubt: the same HTML-AAM table allows the browser to expose an empty required field as invalid on its own after the person has interacted with it. It was measured in Chrome: after entering “Nombre” and leaving with Tab without typing, the accessibility tree still said `invalid=false` for all three fields. Other browsers were not measured.
- **The error text is written, not just painted.** The red border (`input[aria-invalid="true"]` in the stylesheet) helps whoever can see, but success criterion 3.3.1 of WCAG 2.2 requires that, if an input error is detected, the item in error be identified and the error **described in text** ([W3C, “Understanding SC 3.3.1: Error Identification”](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)). And a color does not reach someone who cannot distinguish red.
- **`aria-describedby` and not `aria-errormessage`.** ARIA 1.2 has a specific attribute for the error message, `aria-errormessage`, which MDN describes as the one that identifies the element containing the error message and that is only used when `aria-invalid` is `true` ([MDN, `aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage)). The checkpoint uses `aria-describedby` because the field already needs a description for its help text, and because it is the pattern the W3C forms tutorial shows for associating a field with its error message ([W3C WAI, “Forms Tutorial: User Notifications”](https://www.w3.org/WAI/tutorials/forms/notifications/)). It is a choice of the course; both ways are backed.

#### 7.3.3 The notice: live regions

The field solves the error **where focus is**. But after pressing Enter, focus is still on the button or on the last field, and the message “Revisa los campos marcados.” appears elsewhere on the page. If nothing announces it, Raúl does not find out. This is what **live regions** are for: parts of the page that assistive technology monitors, and whose **changes** it announces even if focus is elsewhere.

Success criterion 4.1.3 of WCAG 2.2 requires it for status messages: they must be programmatically determinable through role or properties, so that assistive technology can present them **without them receiving focus** ([W3C, “Understanding SC 4.1.3: Status Messages”](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)). ARIA offers two roles for that, and the form uses both:

- **`role="status"`**: according to the specification, a live region containing advisory information that is not important enough to justify an alert, with an implicit `aria-live` of `polite` and an implicit `aria-atomic` of `true` ([W3C, WAI-ARIA 1.2, `status`](https://www.w3.org/TR/wai-aria-1.2/#status)). “Polite” means the reader waits to finish what it is saying. MDN adds a guideline: do not move focus to the status when its content changes ([MDN, `status` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).
- **`role="alert"`**: a live region with important and, usually, time-sensitive information; implicit `aria-live` of `assertive` and `aria-atomic` of `true` ([W3C, WAI-ARIA 1.2, `alert`](https://www.w3.org/TR/wai-aria-1.2/#alert)). “Assertive” means it interrupts. MDN warns that, because of its intrusive nature, it should be used sparingly and only when the person's immediate attention is required ([MDN, `alert` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)).

The form uses `alert` for “Revisa los campos marcados.” and for the API's rejections, because the person cannot continue without dealing with them. Success is good news that can wait for the reader to finish, so it goes in a `status`, and here there is a decision that was made by measuring. Lesson 6's tray is already a `role="status"`, and the registration sends its notice there. If the form also had its own `status` with “Se dio de alta correo.”, the success would arrive **twice**. This is how it was measured in Chrome, observing the live regions while registering a service, with the form that had both:

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo Descartar»
  status (formulario): «Se dio de alta correo.»
```

And with the checkpoint's form, which leaves success to the tray alone:

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo5 Descartar»
```

A single change, in a single place. MDN warns, regarding alerts, that several notices at once create a bad experience ([MDN, `alert` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)); with polite notices the problem is milder, but it is the same: the person hears the same news twice. The tray was chosen over the form because the tray is the place for the whole application's notices (it also receives the ones from retrying) and because the notice survives if the person leaves the page.

`aria-atomic` decides **how much** is read. With `true`, implicit in `alert` and in `status`, the reader presents the **entire** region every time it changes, even if only part of it changed ([MDN, “ARIA live regions”](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). For the form's one-line message that is what you want. For the tray, it is not: it is a list that grows up to five notices, each with its “Descartar” button, and with `true` the fifth notice would make the reader repeat all five. That is why the tray's region has `aria-atomic="false"`, which lets it announce only what was added. Chrome's accessibility tree confirms it: before, the tray's region came out with `atomic=true`; with the attribute, with `atomic=false`, and the form's error region still has `atomic=true` (7.4.2 has both readings).

```tsx
// revisor/src/avisos/BandejaAvisos.tsx
import { useAvisos, useDespachoAvisos } from "./usarAvisos";

export function BandejaAvisos() {
  const { avisos } = useAvisos();
  const despachar = useDespachoAvisos();

  return (
    <section className="bandeja" aria-label="Avisos">
      {/* `status` trae aria-atomic="true": se leería la lista entera con cada aviso. */}
      <div role="status" aria-atomic="false">
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

The rule most often broken with live regions is in MDN's guide, and it explains the shape of the JSX: assistive technology generally only announces **dynamic** changes in the content of a live region; you have to **establish the region before** updating its content, start with the region empty, and the most reliable way is to include it in the initial markup ([MDN, “ARIA live regions”](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). That is why the checkpoint does not write this:

```tsx
// fragmento: la región nace junto con su mensaje (no lo hagas así)
{estado.tipo === "con-errores" && <div role="alert">{estado.detalle}</div>}
```

but this, where the `div` exists from the first render and only what is inside changes (the tray does the same with its `role="status"`):

```tsx
// fragmento de FormularioAlta.tsx
<div role="alert">{estado.tipo === "con-errores" && <p>{estado.detalle}</p>}</div>
```

The same MDN guide acknowledges that with `role="alert"` the content is announced “in most cases” even if the region appears all at once; but “in most cases” is not a rule, and with `status` there is no such exception. Writing the regions empty from the start works for both roles.

The `<form>` also has `aria-describedby="resultado-alta"`, which points to the error region's container. It is not what makes the announcement (the role does that); it is a description of the form for whoever reaches it by navigating, which includes the last error. When each screen reader reads a form's description is not defined and was not measured: check it by hand, and if you hear the error twice, it is this attribute.

#### 7.3.4 What a live region does not announce

A live region announces **changes**. Figure 5 plays the ear: it renders a `role="alert"` region, observes it with a `MutationObserver` (the browser API that reports when the DOM changes), and sends it three submissions in a row: two with the same message and one different.

```tsx
// fig07_05.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// Un lector de pantalla anuncia los CAMBIOS de una región viva. Aquí un
// MutationObserver hace de oído: cuenta qué cambió dentro de la región.
// `envio` no se dibuja: solo prueba que cada envío vuelve a dibujar el componente.
function Resultado({ envio, detalle }: { readonly envio: number; readonly detalle: string | null }) {
  console.log(`  (dibujo del envío ${envio})`);
  return (
    <div role="alert">
      {detalle !== null && <p>{detalle}</p>}
    </div>
  );
}

const contenedor = dom.window.document.getElementById("raiz")!;
const raiz = createRoot(contenedor);
await act(async () => raiz.render(<Resultado envio={0} detalle={null} />));

const region = contenedor.querySelector('[role="alert"]')!;
let cambios = 0;
const oido = new dom.window.MutationObserver((registros) => {
  cambios += registros.length;
});
oido.observe(region, { childList: true, subtree: true, characterData: true });

const envios: [number, string | null][] = [
  [1, "Revisa los campos marcados."],
  [2, "Revisa los campos marcados."],
  [3, "ya existe un servicio llamado correo"],
];

for (const [envio, detalle] of envios) {
  cambios = 0;
  await act(async () => raiz.render(<Resultado envio={envio} detalle={detalle} />));
  console.log(`envío ${envio}: «${region.textContent}» → cambios en role="alert": ${cambios}`);
}

oido.disconnect();
await act(async () => raiz.unmount());
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_05.tsx
$ node fig07_05.js
  (dibujo del envío 0)
  (dibujo del envío 1)
envío 1: «Revisa los campos marcados.» → cambios en role="alert": 1
  (dibujo del envío 2)
envío 2: «Revisa los campos marcados.» → cambios en role="alert": 0
  (dibujo del envío 3)
envío 3: «ya existe un servicio llamado correo» → cambios en role="alert": 1
```

The component rendered on all three submissions, but the region's DOM only changed on the first and the third. On the second, React compared the new text with the previous one, saw they were equal, and touched nothing: it is Lesson 1's reconciliation doing exactly its job. For a screen reader, that means **a second submission with the same error is not announced**. The figure measures the DOM, not the reader; that the reader stays silent when the DOM does not change is what follows from MDN's guide (it announces dynamic changes), and it is checked by hand. In the `revisor`'s form, this happens if the person presses Enter twice without fixing anything: the second time the field is still marked and its description still states the error when they reach it, but there is no announcement. It is Raúl's second Enter, and exercise 3 asks you to solve it.

### 7.4 Registration in the `revisor` and its review against the sources

#### 7.4.1 The page, the route, and the link

The page is short: it sets the tab title with the hook from Lesson 3 and wraps the form in the `Tarjeta` from Lesson 1, which gives it an `<h2>` heading and a named section.

```tsx
// revisor/src/alta/PaginaAlta.tsx
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { FormularioAlta } from "./FormularioAlta";

export function PaginaAlta() {
  useTituloDocumento("Dar de alta · Revisor");

  return (
    <Tarjeta titulo="Dar de alta un servicio">
      <FormularioAlta />
    </Tarjeta>
  );
}
```

The new route is added among the layout's children. The order in the array does not decide which one wins (React Router ranks routes and a static segment beats a dynamic one, as verified in Lesson 5), but writing it **before** `servicios/:nombre` makes it obvious, for whoever reads it, that `nuevo` is a fixed address and not the name of a service. Notice also `ErrorBoundary: ErrorDeRuta` on the outer route: it is Lesson 5's error boundary, the one that would catch an error escaping from the form's action.

```tsx
// revisor/src/app/rutas.tsx
import type { RouteObject } from "react-router";
import { PaginaAlta } from "../alta/PaginaAlta";
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
      { path: "servicios/nuevo", Component: PaginaAlta },
      { path: "servicios/:nombre", Component: PaginaServicio },
      { path: "*", Component: PaginaNoEncontrada },
    ],
  },
];
```

The layout adds a link to the main navigation. It is a `NavLink` from Lesson 5, so React Router sets `aria-current="page"` on it when you are at `/servicios/nuevo`, and a screen reader announces that it is the current page:

```tsx
// fragmento de revisor/src/app/Disposicion.tsx: lo único que cambia
<NavLink to="/servicios/nuevo">Dar de alta</NavLink>
```

And the stylesheet grows with what the form needs. This is the block added at the end of `src/reporte/panel.css`:

```css
/* fragmento: lo que se agrega al final de revisor/src/reporte/panel.css */
.campo {
  margin: 0 0 1rem;
}

.campo label {
  display: block;
  font-weight: bold;
}

.campo input {
  font: inherit;
  width: 100%;
}

.campo input[aria-invalid="true"] {
  border: 2px solid #cf222e;
}

.error-campo {
  color: #cf222e;
  margin: 0.25rem 0 0;
}

.ayuda {
  color: #57606a;
  margin: 0.25rem 0 0;
}

li.pendiente {
  opacity: 0.6;
}

:focus-visible {
  outline: 3px solid #0969da;
  outline-offset: 2px;
}

button[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.6;
}
```

Three rules matter for accessibility. `.campo input[aria-invalid="true"]` paints the red border **from the ARIA attribute**, so what someone looking sees and what someone listening hears come from the same value and cannot contradict each other; it is the selector MDN recommends for styling invalid fields ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). And `:focus-visible` draws a 3-pixel blue outline around whatever has focus when the browser decides it should be visible: always when navigating with Tab, and also when clicking a text field (7.3.1). Without it, keyboard users depend on each browser's default outline, which on some backgrounds is barely visible. And `button[aria-disabled="true"]` dims the button while a submission is pending: with `disabled`, the browser dimmed it on its own; with `aria-disabled` it does not, and without this rule whoever is looking would not know the button is not responding (7.2.4).

The `package.json` only changes its version to `0.7.0`: this lesson adds no dependencies.

With everything in place, the checkpoint passes the course's two checks. `npm run lint` prints nothing (React's rules accept the new hooks and `startTransition` as they are used) and the build finishes cleanly:

```text
$ npm run lint

> revisor@0.7.0 lint
> eslint . --max-warnings 0

$ npm run build

> revisor@0.7.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 191 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-BBxlOd8Z.css    1.50 kB │ gzip:   0.66 kB
dist/assets/index-C_lOH5GL.js   367.12 kB │ gzip: 114.47 kB

✓ built in 239ms
```

#### 7.4.2 The review, point by point

This table reviews the form and its notices against what WAI-ARIA and MDN say. The “How we know” column separates what was measured from what is deduced from the code or checked by hand.

| What the source asks for | What the `revisor` does | How we know |
|---|---|---|
| Use the native element before ARIA (Using ARIA, rule 1) | `<label>`, `<input>`, `<button type="submit">`, `<form>`; no `role` on the controls | Reading the code |
| Every field has a name (WCAG 3.3.2) | `label htmlFor` with an `id` equal to the `name` | Measured: figure 4, name “Nombre” |
| The error identified and described in text (WCAG 3.3.1) | Error text in a `<p>` linked by `aria-describedby`, plus the border | Measured: figure 4, description with the error |
| `aria-invalid` set to `true` only after attempting to submit (WAI-ARIA 1.2) | `false` on render; `true` when the state carries an error for that field | Measured: figure 4 and the HTML of `/servicios/nuevo` |
| Status messages without receiving focus (WCAG 4.1.3; MDN, `status`) | `role="alert"` for errors in the form, the tray's `role="status"` for success; neither receives focus | Reading the code |
| The live region exists before the message (MDN, *Live regions*) | The error region and the tray's are rendered empty from the first render | Measured: the HTML of `/servicios/nuevo` has them empty |
| Several notices at once are a bad experience (MDN, `alert`) | Success is announced once, in the tray | Measured in Chrome: before, two regions changed; now, one |
| Declare required fields (WAI-ARIA, `aria-required`; HTML-AAM, `required`) | `required` on all three fields | Measured in the accessibility tree: `required=false` before, `required=true` now |
| Read the whole region only when appropriate (WAI-ARIA, `status`; MDN, `aria-atomic`) | `aria-atomic="false"` on the tray; the form's `alert` keeps `true` | Measured in the accessibility tree: the tray went from `atomic=true` to `atomic=false` |
| `alert` sparingly (MDN, `alert`) | Only for errors that prevent continuing | Reading the code |
| Focus order equal to document order, no positive `tabindex` (MDN, `tabindex`) | No `tabindex`; fields in the order they are filled in | Document order measured in the HTML of `/servicios/nuevo`; going through it is manual |
| Visible focus when navigating with the keyboard | `:focus-visible` with a 3 px outline | Checked by hand |
| `aria-disabled` only exposes the state; the author suppresses the function and changes the appearance (MDN, `aria-disabled`) | `aria-disabled={pending}`, click cancelled while pending, and `button[aria-disabled="true"]` dimmed | Measured in Chrome: focus stays on the button, the tree reports it as `disabled=true` and `focused=true`, `opacity=0.6`, a single `POST` |

The accessibility tree readings came from headless Chrome, with `Accessibility.getFullAXTree`, the same tree the browser hands to screen readers. With the form before the fixes:

```text
al cargar:
  status: live=polite atomic=true relevant=additions text
  textbox «Nombre»: required=false invalid=false
  textbox «Dirección»: required=false invalid=false
  textbox «Tiempo límite (ms)»: required=false invalid=false
  alert: live=assertive atomic=true relevant=additions text
  status: live=polite atomic=true relevant=additions text
después de entrar a «Nombre» y salir con Tab sin escribir:
  status: live=polite atomic=true relevant=additions text
  textbox «Nombre»: required=false invalid=false
  textbox «Dirección»: required=false invalid=false
  textbox «Tiempo límite (ms)»: required=false invalid=false
  alert: live=assertive atomic=true relevant=additions text
  status: live=polite atomic=true relevant=additions text
```

And with the checkpoint:

```text
al cargar:
  status: live=polite atomic=false relevant=additions text
  textbox «Nombre»: required=true invalid=false
  textbox «Dirección»: required=true invalid=false
  textbox «Tiempo límite (ms)»: required=true invalid=false
  alert: live=assertive atomic=true relevant=additions text
después de entrar a «Nombre» y salir con Tab sin escribir:
  status: live=polite atomic=false relevant=additions text
  textbox «Nombre»: required=true invalid=false
  textbox «Dirección»: required=true invalid=false
  textbox «Tiempo límite (ms)»: required=true invalid=false
  alert: live=assertive atomic=true relevant=additions text
```

The first `status` is the tray's; with the earlier form there was a second `status`, the success one in the form, which no longer exists. All three fields became `required=true`, and none became `invalid` from being touched without typing.

And one point where the form falls short, stated just as frankly:

1. **A repeated error is not announced again.** Measured in figure 5 on a region identical to the form's; the effect on the reader is deduced, not measured. It is Raúl's second Enter, and it is exercise 3.

## The error you will see

The lesson has one main error, the one you see in the console, and three supporting ones that are not visible at first glance.

**The main error: a `value` without `onChange`.** If you change `defaultValue` to `value` in `Campo.tsx`, thinking that “this way the field shows the state's value”, React writes in the browser console the warning figure 1 captured:

```text
You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
```

And the field becomes read-only: you type and nothing happens, like the third case in the figure. The message offers three ways out and the one that suits this form is the first, `defaultValue`. It is not a compiler or linter error: TypeScript accepts `value` on an `<input>`, and `npm run build` finishes cleanly. You see it in the browser console in development, and on the screen, because you cannot type.

**The compiler error: the schema drifted from the API.** In a copy of the checkpoint, change the `timeoutMs` key to `tiempoMs` in `esquemaAlta.ts` and run `npx tsc -b`:

```text
$ npx tsc -b; echo "código de salida: $?"
src/alta/FormularioAlta.tsx(40,41): error TS2741: Property 'timeoutMs' is missing in type 'ValoresDe<{ nombre: Esquema<string>; url: Esquema<string>; tiempoMs: Esquema<number>; }>' but required in type 'NuevoServicio'.
src/alta/FormularioAlta.tsx(87,32): error TS2339: Property 'timeoutMs' does not exist on type 'Readonly<Record<"nombre" | "tiempoMs" | "url", string>> | { nombre: string; url: string; timeoutMs: string; }'.
  Property 'timeoutMs' does not exist on type 'Readonly<Record<"nombre" | "tiempoMs" | "url", string>>'.
src/alta/FormularioAlta.tsx(88,26): error TS2339: Property 'timeoutMs' does not exist on type 'Partial<Record<"nombre" | "tiempoMs" | "url", string>>'.
src/alta/darDeAlta.ts(19,7): error TS7053: Element implicitly has an 'any' type because expression of type '"nombre" | "timeoutMs" | "url"' can't be used to index type 'Partial<Record<"nombre" | "tiempoMs" | "url", string>>'.
  Property 'timeoutMs' does not exist on type 'Partial<Record<"nombre" | "tiempoMs" | "url", string>>'.
src/alta/esquemaAlta.ts(21,88): error TS2741: Property 'timeoutMs' is missing in type 'ValoresDe<{ nombre: Esquema<string>; url: Esquema<string>; tiempoMs: Esquema<number>; }>' but required in type 'NuevoServicio'.
src/alta/estadoFormulario.ts(21,56): error TS2353: Object literal may only specify known properties, and 'timeoutMs' does not exist in type 'Readonly<Record<"nombre" | "tiempoMs" | "url", string>>'.
código de salida: 1
```

You renamed one key and the compiler found six places in four files where that breaks something, and it ended with code 1. That code is what matters: it is why `npm run build`, which is `tsc -b && vite build`, never reaches `vite build`. They read in two groups. The two `TS2741` errors say the same thing from two places: `ValoresAlta` no longer has `timeoutMs`, so it cannot be used as `NuevoServicio`. One is in `esquemaAlta.ts(21,…)`, which is `comprobarContrato`, and the other in `FormularioAlta.tsx(40,…)`, the call to `darDeAlta(validacion.valor)`. The other four are places that still write `timeoutMs` by hand (the two attributes of the time-limit `Campo` in `FormularioAlta`, `textosDe`, and `erroresDe`) and that no longer match the types derived from the schema. Without those derived types, the form would send the API a body with `tiempoMs` and the API would respond `400` for a `timeoutMs` field the form no longer knows how to show. With them, the error appears before anything runs. `comprobarContrato` is the line that keeps that warning even if someday nobody else calls `darDeAlta` with the schema's values. Beware of what it does not cover: it compares TypeScript types at compile time, so it does not detect that the real API changes its shape later; that is what the run-time guard at the network boundary (7.2.9) is for.

**The silent one: `useFormStatus` in the wrong component.** If you move `useFormStatus` to `FormularioAlta` to “save yourself a component”, `pending` is always `false`: the button never says “Dando de alta…”, is never marked as unavailable, and never ignores the second submission, so a double click submits twice. There is no warning in the console or in the linter. Figure 3 measured it (`mismo=false` in both runs) and the documentation flags it as a caveat. The fix is the checkpoint's: the hook goes in a component rendered **inside** the `<form>`.

**The other silent one: fields that get cleared.** If `Campo` received a fixed `defaultValue`, every submission with errors would leave the fields empty, as in the first run of figure 3. Nobody warns about this either. The signal is the complaint from whoever fills in the form: “it wiped everything”.

## What gets done wrong

**Controlling every field out of habit.** Three states and three `onChange` handlers for a form that is only read on submit is work the browser already did, with a full render per keystroke. Control a field when the screen needs the value while it is being typed.

**Validating with `onSubmit`, `e.preventDefault()`, and a `useState` for “submitting”.** It works, and it is reinventing `<form action>`, `useActionState`, and `useFormStatus`, with more places to get it wrong (forgetting to disable the button, forgetting to re-enable it when there is an error).

**Stopping at the first error.** It forces the person to discover the errors one at a time, with one submission for each. A form collects them all.

**Calling the API without validating first.** The schema rejects in the browser what the API would reject, without a request and with messages next to each field. The API still validates, because it cannot trust the screen; the two validations do not compete, they cover each other. And there are validations only the server can do: a real `revisor` that visits the addresses someone registers has to reject those of its own network (`127.0.0.1`, `169.254.169.254`, `10.x`…), or anyone could use it to peek inside. That attack is called server-side request forgery (SSRF), and Hábil's HTTP course covers it in the security box of its lesson 1. `urlHttp` accepts those addresses without complaint: the browser's schema does not protect against that, nor does it claim to.

**Errors that are only color.** A red border without text tells nothing to a screen reader or to someone who cannot distinguish red. WCAG 3.3.1 requires the error in text.

**A loose error text, without `aria-describedby`.** It is visible, but it is not associated with the field: figure 4 showed that a reader does not link them.

**`aria-invalid="true"` from the first render.** It shouts “invalid” before the person has typed anything. The specification recommends not marking an empty required field before a submission is attempted.

**Disabling the button that has focus.** `disabled` prevents the double submission, but it takes focus away: measured in Chrome, it falls to `body` and does not come back. `aria-disabled` with the click cancelled keeps focus (7.2.4).

**`aria-disabled` without the guard.** The attribute says “unavailable” but prevents nothing: measured, the second Space did submit.

**Announcing the same thing in two live regions.** A success in the form and an identical one in the tray are heard twice. One notice, one place.

**The live region that is born with its message.** `{error && <div role="alert">…</div>}` may not be announced. The region is empty from the start and what changes is its content.

**`role="alert"` for everything.** It interrupts. A success, a “saved”, or a “loading” is a `status`.

**ARIA where there is a native element.** A `<div role="button" onClick>` instead of a `<button>` loses the keyboard, the tab order, and form submission. The first rule of ARIA exists for this.

**Moving focus to the error message with a positive `tabindex` or ordering tricks.** It scrambles navigation for everyone. If you ever decide to move focus, do it with `tabindex="-1"` and `.focus()` on the message, and let it be a deliberate decision, not a patch.

## Exercises

### Exercise 1 — Predict the `FormData`

Without running anything, write in your logbook the `FormData` that `enviar` receives if the person types ` correo ` (with spaces), `https://correo.example`, and `1500`, and what `validarCampos` returns with those texts. What type does `timeoutMs` have in each of the two? Then check it: add a temporary `console.log(textos, validacion)` in `enviar`, submit the form with `npm run dev`, and read the browser console. Remove the line when you finish.

### Exercise 2 — The `409` up close

With the practice server and `npm run dev` running, register `correo` twice. **Before** the second submission, predict: which field is marked, what does its description say, what does the `alert` region announce, and what is left written in the three fields? Does a second “(agregando…)” row appear in “Altas de esta sesión”? Check each prediction in the browser. To see the attribute, use the developer tools (elements tab) on the “Nombre” field.

### Exercise 3 — Make the second error get announced too

Figure 5 showed that a second submission with the same message does not change the `alert` region's DOM. Change `FormularioAlta` so that **every** submission with errors produces a change in that region, without changing the visible text. Hint: the `con-errores` state can carry a number that grows with each submission, and React replaces an element when its `key` changes. Verify your solution by adapting figure 5 before touching the `revisor`. Restore the checkpoint when you finish, or keep your change in a copy.

### Exercise 4 — The accessibility tree with your own eyes

Open `http://localhost:5173/servicios/nuevo` in Chrome, with the developer tools, and in the elements tab look for the accessibility panel. **Before looking, predict** what that panel says about three elements: the “Nombre” field (is it required?, is it invalid?), the form's error region, and the tray's region (how polite is each one and whether it is read in full). Check it. Then submit the form empty and look at “Nombre” again. Finally, in a copy of the checkpoint, remove `required` from `Campo.tsx` and repeat the first reading. Restore the copy when you finish.

## Solutions

### Solution 1

The `FormData` carries three texts, as-is: `nombre` is `" correo "`, `url` is `"https://correo.example"`, and `timeoutMs` is `"1500"`; `textosDe` copies them without changing them, which is why `textos.timeoutMs` is a `string`. `validarCampos` returns `{ ok: true, valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 } }`: `textoNoVacio` removed the spaces, `urlHttp` normalized the address with its trailing `/`, and `enteroPositivoDeTexto` converted the text into the number `1500`. That is the body that travels to the API: `{"nombre":"correo","url":"https://correo.example/","timeoutMs":1500}`. If you see the `FormData` in the console as an opaque object, that is normal: print `textos`, which is a plain object.

### Solution 2

The second submission passes local validation (the form does not know which names exist), so the API is called, and it responds `409` with `campos.nombre`. **Only** “Nombre” is marked, with `aria-invalid="true"` and `aria-describedby="nombre-error nombre-ayuda"`, and its description starts with “ese nombre ya existe”. The `alert` region announces the API's `detalle`, “ya existe un servicio llamado correo”. The three fields keep what you typed, because the `con-errores` state carries the `textos` and `Campo` uses them as `defaultValue` (figure 3). And no second pending row appears: the `useOptimistic` reducer ignores a name that is already in `altas`, and `correo` was already confirmed since the first submission. If instead you restart the practice server between the two submissions, the second gives `201`: the server keeps its data in memory and goes back to the usual four.

### Solution 3

One way is for the `con-errores` state to carry a submission counter and for the paragraph to use that counter as its `key`:

```tsx
// fragmento: estadoFormulario.ts y FormularioAlta.tsx
| {
    readonly tipo: "con-errores";
    readonly envio: number;
    // …los demás campos
  }

// en enviar: envio: (_previo.tipo === "con-errores" ? _previo.envio : 0) + 1

<div role="alert">
  {estado.tipo === "con-errores" && <p key={estado.envio}>{estado.detalle}</p>}
</div>
```

With a different `key` on each submission, React does not reuse the `<p>`: it removes the old one and inserts a new one, and the `alert` region changes even though the text is the same. What this demonstrates is a change in the DOM, which is what figure 5 measures; whether a particular screen reader pronounces again a text identical to one it just said depends on the reader and the browser, and was not measured here: check it by hand with the one you use, as in the screen reader checkbox of “How I know I got it”. When you adapt figure 5 (giving the `<p>` a `key={envio}`), the second submission must count changes, not `0`. Notice that `enviar`'s first argument, which the checkpoint ignores under the name `_previo`, is exactly the one that provides the counter: it is the previous state `useActionState` hands you. If you use it, remove the underscore from its name, because it is no longer an ignored argument.

### Solution 4

The panel shows the same as the `Accessibility.getFullAXTree` readings in 7.4.2, because it is the same tree. “Nombre” is required (because of `required`) and not invalid (because of `aria-invalid="false"`); its name is “Nombre” and its description, the help text. The error region is assertive and is read in full (`role="alert"`, with an implicit `aria-atomic` of `true`); the tray's is polite and is not read in full (`role="status"` with `aria-atomic="false"`). After submitting empty, “Nombre” becomes invalid and its description starts with “escribe un valor”: it is the `con-errores` state reaching the field. Without `required`, the required property disappears or becomes false, which is what the tree said before this lesson's fixes (`required=false`). If your prediction failed on the tray, go back to 7.3.3: `status` comes with `aria-atomic="true"` out of the box, and what changes it is the explicit attribute. The panel may name the properties differently depending on the Chrome version; what matters is the value.

## How I know I got it

- [ ] `npm ci`, `npm run lint`, and `npm run build` finish cleanly inside `~/curso-react/revisor/`, and `npm run build` produces `dist/assets/index-C_lOH5GL.js` if your code is identical to the checkpoint's.
- [ ] With `npm run dev`, opening `http://localhost:5173/servicios/nuevo` shows the “Dar de alta” link marked as current in the navigation and the form with three fields; in the developer tools, each field has `aria-invalid="false"` and `aria-describedby` with its help text.
- [ ] Submitting empty marks the three fields, writes “Revisa los campos marcados.”, and, in the network tab, **no** request to `/api/servicios` appears.
- [ ] With the practice server running, registering `correo` with `https://correo.example` and `1500` shows “Se dio de alta correo” in the notice tray (and nowhere else), adds the row in “Altas de esta sesión”, leaves the fields empty, and the list at `/` now includes `correo`.
- [ ] Repeating the registration of `correo` marks only “Nombre” and keeps what was typed in the three fields.
- [ ] **By hand, with the keyboard:** from the address bar, Tab goes in order through the “Reporte” and “Dar de alta” links, the two preference checkboxes, the three fields, and the button (it is the order in which they appear in the HTML in “The why before the how” and in the layout's, with the notice tray empty), and each one shows the blue outline; Enter in any field submits the form. Nothing receives focus outside that order. And one more test: move focus to the button with Tab and submit with Space. While it says “Dando de alta…”, the button looks dimmed, a second Space does nothing, and the blue outline stays on it; when it finishes, focus is still there (7.2.4).
- [ ] **By hand, with a screen reader** (Orca on your Mint, NVDA on Windows, or VoiceOver on macOS): when submitting empty, the reader announces “Revisa los campos marcados.” without you moving focus; when reaching “Nombre”, it reads the label, the invalid state, and the description with the error first; when registering, it announces the success **only once**; with several notices in the tray, it reads only the new one. Write in your logbook what you heard in each case.
- [ ] Figures 1 to 5 give the same output on your machine as in the lesson.
- [ ] You wrote in your [logbook](bitacora.md) what each attribute of the HTML shown in “The why before the how” does.

## Summary

Answer without looking at the lesson:

1. What is the difference between `defaultValue` and `value` on an `<input>`? What does React warn if you pass `value` without `onChange`, and what are its three ways out?
2. Why does the `revisor`'s registration use uncontrolled fields? In what case would you control one?
3. What does the `useActionState` function receive and in what order? What happens with what it returns?
4. Why does React clear the fields after an action with errors, and how does the `revisor` avoid losing what was typed?
5. From where do you have to call `useFormStatus` for `pending` to ever become `true`?
6. When is `useOptimistic`'s state rendered and when does it stop being rendered? Why is a state change that comes after an `await` inside the action wrapped in `startTransition`, and what was seen in Chrome when it was not?
7. Why does `validarCampos` collect all the errors, and what does `comprobarContrato` protect?
8. What does a screen reader announce thanks to `aria-invalid` and `aria-describedby`, and in what order does it read the description?
9. What is the difference between `role="status"` and `role="alert"`? Why does the region have to exist before the message arrives? Why does the tray have `aria-atomic="false"` and the form's `alert` does not?
10. What does the first rule of ARIA say, and what does a `<div role="button">` lose compared with a `<button>`?

## Further reading

- [React, `<form>`](https://react.dev/reference/react-dom/components/form): `action` as a function, the *Transition*, the implicit `POST`, and resetting uncontrolled fields after the action. Consulted on October 21, 2026.
- [React, `useActionState`](https://react.dev/reference/react/useActionState): the signature, the action's two arguments, the state's type, the error boundary if the action throws, and why it is not called twice under `StrictMode`. Consulted on October 21, 2026.
- [React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus): `pending`, `data`, `method`, and `action`, and why it only reports on the parent `<form>`. Consulted on October 21, 2026.
- [React, `useOptimistic`](https://react.dev/reference/react/useOptimistic): the optimistic state that only exists while the action is in progress and the warning if it is changed outside an action. Consulted on October 21, 2026.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input): controlled and uncontrolled fields, `defaultValue`, the warning for `value` without `onChange`, switching from uncontrolled to controlled, and why state is updated with `e.target.value` and not with a transformation of it. Consulted on October 21, 2026.
- [W3C, “Accessible Rich Internet Applications (WAI-ARIA) 1.2”](https://www.w3.org/TR/wai-aria-1.2/): the `status` and `alert` roles with their implicit values, and the `aria-invalid`, `aria-describedby`, and `aria-required` attributes. Consulted on October 21, 2026.
- [W3C, “Using ARIA”](https://www.w3.org/TR/using-aria/): the first and second rules of ARIA use. Consulted on October 21, 2026.
- [W3C, “ARIA Authoring Practices Guide: Read Me First”](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/): “No ARIA is better than Bad ARIA” and why roles do not add keyboard behavior. Consulted on October 21, 2026.
- [W3C, “Accessible Name and Description Computation 1.2”](https://www.w3.org/TR/accname-1.2/): how the description is computed from the `aria-describedby` identifiers, in order. Consulted on October 21, 2026.
- [W3C, “HTML Accessibility API Mappings 1.0”](https://www.w3.org/TR/html-aam-1.0/): the `required` attribute exposed as `aria-required`. Consulted on October 21, 2026.
- [W3C WAI, “Forms Tutorial: User Notifications”](https://www.w3.org/WAI/tutorials/forms/notifications/): associating a field with its error message via `aria-describedby`. Consulted on October 21, 2026.
- [W3C, WCAG 2.2: “Understanding SC 3.3.1: Error Identification”](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [“SC 3.3.2: Labels or Instructions”](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), and [“SC 4.1.3: Status Messages”](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): the error described in text, labels, and status messages without focus. Consulted on October 21, 2026.
- [MDN, “ARIA live regions”](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions): establishing the region before updating it, `polite` versus `assertive`, and `aria-atomic`. Consulted on October 21, 2026.
- [MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid), [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby), [`aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage), [`status` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role), and [`alert` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role): when to mark a field invalid, how it relates to its description, and when to use each live region. Consulted on October 21, 2026.
- [MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled) and [WHATWG, HTML, “Implicit submission”](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission): what `aria-disabled` does and does not do, and Enter from a field as a click on the submit button. Consulted on October 21, 2026.
- [Chrome DevTools Protocol, `Accessibility` domain](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/): `Accessibility.getFullAXTree`, the accessibility tree that was read before and after the fixes. Consulted on October 21, 2026.
- [MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label), [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form), [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex), and [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible): the associated label, `novalidate`, tab order, and visible focus. Consulted on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| uncontrolled field | an `<input>` whose value the browser keeps; React only sets the initial one with `defaultValue` |
| controlled field | an `<input>` whose value React decides on every render with `value` and `onChange` |
| action (*Action*) | a function React runs inside a *Transition*; with `<form action>`, it receives the `FormData` |
| `useActionState` | a hook that keeps what the last action returned and hands over the function to trigger it |
| `useFormStatus` | a hook that, from a component inside a `<form>`, says whether that form has a pending submission |
| optimistic state | what is shown while an action has not finished, before the API confirms |
| `startTransition` | a React function that marks an update as part of a *Transition*; inside an action, it returns to it whatever comes after an `await` |
| accessibility tree | the version of the page the browser hands to screen readers: roles, names, descriptions, and states |
| accessible name | the text assistive technology uses to identify an element; for a field, its label |
| accessible description | the additional text read after the name; here, the error and the help text from `aria-describedby` |
| live region | a part of the page whose changes assistive technology announces without moving focus |
| `role="status"` / `role="alert"` | polite live region, which waits / assertive live region, which interrupts |
| `aria-disabled` | an attribute that announces “unavailable” without removing focus or disabling anything; the developer writes the behavior |
| `aria-atomic` | whether a live region is read in full (`true`) or only what changed (`false`) each time it changes |
| `:focus-visible` | a CSS pseudo-class that applies when focus should be visible, typically when navigating with the keyboard |

---

**Next:** [Lesson 8 — Component tests](08-pruebas-de-componentes.md)
