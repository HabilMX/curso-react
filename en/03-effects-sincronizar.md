# Lesson 3 — Effects: Synchronizing, Not “On Mount”

*It is 9:52 AM and the morning shift is checking the dashboard before the 10:00 AM meeting. In the new `revisor`, you can now pick a service and see its details. The operator clicks on `pagos`, instantly regrets it, and selects `inventario`. The header “inventario” appears and, below it, “Disponible: HTTP 200 en 118 ms”. She breathes. A second later, without anyone touching anything, that same box changes to “En falla: HTTP 503”. She phones the inventory team, who spend fifteen minutes checking their servers and find nothing. Inventory never failed. What was displayed was the slower response from `pagos`, which arrived late and overwrote `inventario`. Nobody had written an error in the conventional sense: every line of code did what it said. What was missing was a line that said what to do when the question no longer matters. This lesson writes that line and explains why it is necessary.*

**Time:** 2 × 45 min (the natural break is between sections 3.3 and 3.4)

**What you build:** a details panel that requests data for the selected service from the server and resets on its own when you choose another; the tab title with the failure count, `(2) Revisor`; and the line “Actualizado a las …”, which indicates when the latest report arrived without restarting the 10-second polling

**What you learn:** the lifecycle of an Effect: starting and stopping synchronization; cleanup; the race condition between responses, reproduced and resolved; `StrictMode` as a free test that cleanup exists; dependencies that describe the code (**the linter is not silenced**); `useEffectEvent`; cases where an Effect is not needed

**Where you are coming from.** From [Lesson 2](02-estado-instantanea-forma.md). Your `revisor` already has the “Solo fallas” checkbox, service names as buttons with `aria-pressed`, a note per service, and a details box, `DetalleSeleccion`, which is **calculated** from the list: it asks the server nothing, merely displaying again what the report already contained. Since [Lesson 0](00-un-proyecto-de-verdad.md), the dashboard has featured an Effect, the one in `useReporte`, which requests `GET /api/estados` every 10 seconds and which `StrictMode` mounts twice in development. That lesson showed you the “cancelada por el cliente” + “200” pair in the server log and promised a thorough explanation here. You work in `~/curso-react/revisor/`, which at the start is identical to the Lesson 2 checkpoint.

**What this lesson does not do.** It does not add browser routes: the details still appear within the same page, below the list, and the `/servicios/pagos` URL arrives in [Lesson 5](05-rutas-url-como-estado.md). It does not replace manual data fetching with a library: here you write the Effect that requests the details by hand, along with its cleanup, to understand what problem it solves; according to the course syllabus, in [Lesson 4](04-estado-del-servidor.md) that same job will move to TanStack Query. Nor does it have automated tests: those arrive in [Lesson 8](08-pruebas-de-componentes.md). And it does not use `useMemo`, `useCallback`, or `memo`: the course never introduces them without measurements that call for them, and in 3.6 you will see that the issue typically “patched” with `useCallback` has a more direct solution here.

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 and npm 11.19.1, on macOS, with the exact versions from the checkpoint's `package.json`. In this lesson, it was not reinstalled inside a Linux container: runs across the course yielded the exact same filenames in `dist/` on macOS and in a `node:24.22.0` container for all checkpoints, and building the checkpoint for this lesson produced the same name here (`index-CTkBRgQQ.js`). Nothing shown depends on the operating system. What is seen “in the browser” was measured with headless Chrome (`--headless`), driven via its debugging protocol: a script opened the page, waited, dispatched real mouse clicks (the exact events your hand produces), and read the text in the details box. Experiments that deliberately break the code were conducted on a **copy** of the checkpoint, and because other processes were running on the machine using the usual ports, that copy used port 3103 for the practice server, 5103 for Vite, and 9303 for Chrome's debugging protocol. On your machine they are 3100 and 5173, and nothing else changes. An initial batch of browser runs was discarded and repeated entirely because another process on the machine was using the same debugging port, making it impossible to guarantee that the clicks came solely from the script; the outputs shown are all from the second batch, repeating line for line the exact behavior of the first. Server log timestamps are in UTC; the timestamp in “Actualizado a las …” is the browser's local time, which was in the Mexico City time zone (UTC−6), explaining why the two clocks do not match. Long paths printed by ESLint are shown starting from `~/curso-react`. The programs are in [`programas/03-effects-sincronizar/`](../programas/03-effects-sincronizar): `revisor/` is the checkpoint and the figures sit alongside it.

## By the end you will be able to

- Explain in your own words what each of the three Effects in the `revisor` synchronizes (polling, details, and title), what its body does, and what its cleanup undoes.
- Reproduce the response race condition in a copy of the dashboard, read it in the server log, and fix it using `AbortController` in the cleanup.
- Explain why `<PanelDetalle key={seleccionado}>` resets the entire panel, and why that is the correct way to return to “Cargando detalle…” instead of a `setState` inside the Effect.
- Read the “cancelada por el cliente” + “200” pair produced by `StrictMode` in the log and explain what it proves.
- When faced with an `exhaustive-deps` warning, modify the code so the dependency list tells the truth without silencing the rule, and recognize when that truth means a function should not restart the Effect.
- Use `useEffectEvent` to read the freshest function from an Effect without restarting it, and name the two things the linter prevents you from doing with it.
- Identify an unnecessary Effect in a component (a calculation or a response to a click) and move it to its proper place.

## The why before the how

In Lesson 2, the details box asked for nothing. It displayed the same `EstadoPublico` that was already in the list. That has an enormous advantage: there is no way for it to display something different from the list, because it is the list. But the operations team asked for more: how many times that service has been checked and when the last check was. Those data points do not come in the report. They must be requested from the server **per service**, and at that moment the box ceases to be a calculation and becomes a conversation with something living outside React.

Ask that box three questions and you will see why a tool is needed.

**When is the detail requested?** The tempting answer is “when the component loads”. That answer is what this lesson comes to dismantle. The detail is not requested “on load”: it is requested **while** the box displays a service, and ceases to matter as soon as it displays another. If you choose `pagos`, the screen must agree with the server about `pagos`. If you switch to `inventario`, the agreement about `pagos` is no longer valid and a new one begins. That is not an event that happens once; it is a **synchronization** that starts and stops.

**What happens to the old question when you ask a new one?** The practice server takes 1.5 seconds to respond with details for `pagos` and 0.2 seconds for the others. If you choose `pagos` and immediately `inventario`, there are two questions in flight, and the one you asked first arrives last. If nobody tells the first one that it no longer matters, when it arrives it will write its result in the box, on top of the correct one. That is what the operator in the opening scene saw.

**Who finds out when something changes outside React?** The browser tab has a title. If the dashboard could display the failure count there, `(2) Revisor`, the operator would see it even while on another tab. But the title is not part of the React tree; it is a document property, `document.title`. Someone must keep it in sync with the dashboard's state, and restore it to what it was when the dashboard no longer controls it.

All three questions share the same shape: there is something outside React (the server, the document, a timer) and the screen must agree with that something. That is what Effects exist for. The React documentation defines them like this: Effects let you run code after rendering to **synchronize** your component with some system outside React ([React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects)). Look at the verb. It does not say “run code when the component appears”. It says synchronize. This course repeats a rule of thumb in every lesson, and this is the lesson where it is born: **an Effect is for synchronizing with something outside React; not for calculating, not for reacting to a click, and not for “on mount”.**

The lesson has seven parts: what an Effect is, using the tab title as an example (3.1); the detail requested from the server and its cleanup (3.2); the response race condition, reproduced and fixed (3.3); `StrictMode` as a free test (3.4); dependencies that describe the code (3.5); `useEffectEvent` (3.6); and cases where an Effect is not needed (3.7). This is what changes in your project:

```text
revisor/
├── package.json                      ~ version 0.3.0
├── servidor/practica.ts              ~ adds GET /api/servicios/:nombre
└── src/
    ├── compartido/
    │   ├── contrato.ts               ~ adds DetalleServicio and esDetalleServicio
    │   └── useTituloDocumento.ts     + Effect that synchronizes document.title
    ├── detalle/
    │   ├── cargar.ts                 + cargarDetalle(nombre, senal)
    │   ├── useDetalle.ts             + Effect with [nombre] dependencies and aborting cleanup
    │   └── PanelDetalle.tsx          + details box, with "Cargando detalle…"
    └── reporte/
        ├── ContenidoReporte.tsx      ~ mounts <PanelDetalle key={seleccionado}>
        ├── DetalleSeleccion.tsx      − replaced by PanelDetalle
        ├── Panel.tsx                 ~ "Actualizado a las …" and the (2) Revisor title
        └── useReporte.ts             ~ third parameter alRecibir, with useEffectEvent
```

The markers are those of the course: **+** new file, **~** modified file, and **−** deleted file.

## The concepts

### 3.1 What an Effect is: starting and stopping synchronization

#### 3.1.1 Two functions, not a single moment

Let us start with the smallest piece the new `revisor` has: the tab title. This is the complete hook:

```ts
// revisor/src/compartido/useTituloDocumento.ts
import { useEffect } from "react";

export function useTituloDocumento(titulo: string): void {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo;

    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
```

An Effect consists of **two functions** and a list. The first is the one you pass to `useEffect`: it says how to **start** synchronizing. Here, it saves the current title and sets the new one. The second is what that first one **returns**, the cleanup: it says how to **stop** synchronizing. Here, it restores the previous title. The list, `[titulo]`, specifies which values the synchronization depends on.

The React documentation insists on a mindset that takes some effort at first: an Effect can only do two things, start synchronizing something and, later, stop synchronizing it ([React, “Lifecycle of Reactive Effects”](https://react.dev/learn/lifecycle-of-reactive-effects)). The same page suggests thinking from the Effect's perspective rather than the component's: “always focus on a single start/stop cycle at a time. It shouldn’t matter whether a component is mounting, updating, or unmounting”. That sentence marks the difference between this course and explanations that describe `useEffect` as “the `componentDidMount` of functions”. There is no “on mount” or “on unmount”. There is a cycle that starts and a cycle that stops, repeating whenever the list indicates something changed.

When does each function run? The `useEffect` reference states it precisely: React runs the setup function when the component is committed to the screen (the *commit* phase from Lesson 1); when dependencies change, it first runs the old cleanup, with the old values, and then the new setup, with the new values; and when the component is removed, it runs the cleanup one last time ([React, “useEffect”](https://react.dev/reference/react/useEffect)). To compare dependencies it uses `Object.is`, which compares values for numbers and strings, and **referential identity** for objects and functions: whether it is the same object in memory, not whether it has the same content. Keep that detail in mind; in 3.5 it becomes the root of a serious issue.

Trace the `revisor`'s title with that rule. Upon opening the page, the report has not arrived yet, so `Panel` calculates the title `"Revisor"`. The Effect starts: it saves `"Revisor"` (the one in `index.html`'s `<title>`) and sets `"Revisor"`. The report arrives with two failures and `Panel` calculates `"(2) Revisor"`. The list changed, so React runs the old cleanup (restores `"Revisor"`) and the new setup (saves `"Revisor"` and sets `"(2) Revisor"`). Each cycle leaves things as it found them before the next one starts. That is what makes the order not matter.

#### 3.1.2 In the `revisor`

`Panel` uses the hook with a value that is **computed during rendering**, not stored in state:

```tsx
// revisor/src/reporte/Panel.tsx
import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
import "./panel.css";
import { contarFallas } from "./resumen";
import { useReporte } from "./useReporte";

export function Panel({
  cargar,
  cadaMs = 10_000,
}: {
  readonly cargar: Cargar;
  readonly cadaMs?: number;
}) {
  const [actualizadoEn, establecerActualizadoEn] = useState<Date | null>(null);
  const { carga, recargar } = useReporte(cargar, cadaMs, () => establecerActualizadoEn(new Date()));
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

  const fallas = carga.tipo === "listo" ? contarFallas(carga.reporte.estados) : 0;
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
          carga={carga}
          soloFallas={soloFallas}
          seleccionado={seleccionado}
          notas={notas}
          alSeleccionar={establecerSeleccionado}
          alGuardarNota={guardarNota}
        />
        {actualizadoEn !== null && (
          <p className="actualizado">Actualizado a las {actualizadoEn.toLocaleTimeString("es-MX")}</p>
        )}
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Notice `fallas`. It is not state: it is a constant calculated on every render with `contarFallas`, the pure function from Lesson 1. The Effect calculates nothing; it only **copies** a value that React already knows to the document. That division of labor is what you will see in all good Effects: React calculates, the Effect synchronizes. In 3.7 you will see what happens when someone reverses this. (`actualizadoEn` and the third argument to `useReporte` are explained in 3.6.)

This is what headless Chrome read in `document.title`, one and a half seconds after opening the dashboard with the practice server running:

```text
08:28:18.814 document.title = "(2) Revisor"
```

`document.title` is exactly what its name says: the property that reads or sets the document's title—the one appearing on the tab—and also updates the content of the `<title>` element ([MDN, “Document: title property”](https://developer.mozilla.org/en-US/docs/Web/API/Document/title)). React does not touch it on its own, because `<title>` lives in the `<head>` and the dashboard renders inside `<div id="raiz">`. It is, in the exact sense of the definition, a system outside React.

React 19 also introduces a `<title>` component that you can render from any component and that React always hoists to `<head>` ([React, “<title>”](https://react.dev/reference/react-dom/components/title)). With it, the title would cease to be an external system and no Effect would be needed. It is not used here for a specific reason: `index.html` already brings its `<title>Revisor</title>`, and that same documentation warns against rendering more than one `<title>` at a time, because with two, browser and search engine behavior is undefined. The Effect updates the title that already exists and restores it when finished. If one day the title lived purely in React (without the one in `index.html`), the native `<title>` would be the option without an Effect; its only requirement is that the child be a single string, for instance ``{`(${fallas}) Revisor`}``.

Why does the cleanup restore the previous title instead of leaving it as is? Because the Effect must be undoable. If tomorrow the dashboard only renders on one of several screens (the course syllabus plans this for Lesson 5), navigating away should not leave the title saying `(2) Revisor` on a screen that displays no failures. A cleanup that mirrors setup makes the hook work regardless of where it is used.

### 3.2 The detail requested from the server

#### 3.2.1 The practice server's new route

The practice server advances to its second version. It is not explained line by line (this is a frontend course), but it helps to know what new route it has and what it returns: `GET /api/servicios/:nombre` returns the details of a service, or a `404` if it does not exist. It takes 1.5 seconds for `pagos` and 0.2 seconds for the rest; that difference is introduced deliberately so that in 3.3 you can reproduce the race condition. Query it with `curl` before wiring it to anything:

```text
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/pagos
{"nombre":"pagos","estado":{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},"revisiones":0,"ultimaRevision":"2026-10-21T08:11:47.421Z"}
200 en 1.507730 s
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/inventario
{"nombre":"inventario","estado":{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},"revisiones":0,"ultimaRevision":"2026-10-21T08:11:47.421Z"}
200 en 0.207895 s
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/nada
{"detalle":"no existe el servicio nada"}
404 en 0.203791 s
```

(The run was performed on port 3103, as explained in “About the runs”.) `revisiones` counts how many times the full report has been requested since the server started, and `ultimaRevision` is the timestamp of the last time. Since nobody had yet requested `GET /api/estados`, they come out as `0` and with the startup timestamp.

`contrato.ts` adds the type and its guard, just like `esReportePublico` in Lesson 0: what arrives over the network is `unknown` until proven otherwise. The complete file looks like this:

```ts
// revisor/src/compartido/contrato.ts
export type EstadoPublico =
  | {
      readonly nombre: string;
      readonly tipo: "disponible";
      readonly codigoHttp: number;
      readonly duracionMs: number;
    }
  | {
      readonly nombre: string;
      readonly tipo: "falla";
      readonly detalle: string;
    };

export interface ReportePublico {
  readonly estados: readonly EstadoPublico[];
}

export function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function esEstadoPublico(valor: unknown): valor is EstadoPublico {
  if (!esRegistro(valor) || typeof valor.nombre !== "string") {
    return false;
  }

  if (valor.tipo === "disponible") {
    return typeof valor.codigoHttp === "number" && typeof valor.duracionMs === "number";
  }

  return valor.tipo === "falla" && typeof valor.detalle === "string";
}

export function esReportePublico(valor: unknown): valor is ReportePublico {
  return esRegistro(valor) && Array.isArray(valor.estados) && valor.estados.every(esEstadoPublico);
}

export interface DetalleServicio {
  readonly nombre: string;
  readonly estado: EstadoPublico;
  readonly revisiones: number;
  readonly ultimaRevision: string;
}

export function esDetalleServicio(valor: unknown): valor is DetalleServicio {
  return (
    esRegistro(valor) &&
    typeof valor.nombre === "string" &&
    esEstadoPublico(valor.estado) &&
    typeof valor.revisiones === "number" &&
    typeof valor.ultimaRevision === "string"
  );
}
```

`esDetalleServicio` reuses `esEstadoPublico` for the `estado` field: the detail contains the same `EstadoPublico` as the list, and it is validated with the same guard. Because the practice server imports these types, `tsc -b` also verifies that the server and the frontend agree.

#### 3.2.2 The network boundary

The function requesting the detail follows the blueprint of `cargarReporte`: a single responsibility, the network, and zero React code.

```ts
// revisor/src/detalle/cargar.ts
import { esDetalleServicio, type DetalleServicio } from "../compartido/contrato";

export async function cargarDetalle(nombre: string, senal: AbortSignal): Promise<DetalleServicio> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}`, { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esDetalleServicio(cuerpo)) {
    throw new Error("la API no entregó un detalle válido");
  }

  return cuerpo;
}
```

Two details. The first is `encodeURIComponent(nombre)`. One of the services is named `catálogo`, with an accent mark, and in a URL characters outside the English alphabet travel encoded; the server log shows it as `GET /api/servicios/cat%C3%A1logo`, and the server decodes it back. If one day a service were named `a/b`, without encoding, the slash would alter the route. The second detail is the `senal` parameter, an `AbortSignal`. The function does not decide when to cancel; it merely accepts that someone, from the outside, may do so. That “someone” is the Effect's cleanup.

What happens when someone aborts? MDN describes `AbortController.abort()` like this: it interrupts an asynchronous operation before it completes, including `fetch` requests, reading their body, and streams; if no reason is provided, the reason is a `DOMException` named `AbortError` ([MDN, “AbortController: abort() method”](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)). In short: the promise returned by `fetch` (or by `respuesta.json()`, if the body was already being read) is **rejected**. And the browser severs the connection, which is what the practice server records as `cancelada por el cliente`.

#### 3.2.3 The Effect that requests the detail

This is the core of the lesson. Read it with the concept from 3.1 in mind: a cycle that starts and a cycle that stops.

```ts
// revisor/src/detalle/useDetalle.ts
import { useEffect, useState } from "react";
import type { DetalleServicio } from "../compartido/contrato";
import { cargarDetalle } from "./cargar";

export type CargaDetalle =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "listo"; readonly detalle: DetalleServicio }
  | { readonly tipo: "error"; readonly detalle: string };

export function useDetalle(nombre: string): CargaDetalle {
  const [carga, establecerCarga] = useState<CargaDetalle>({ tipo: "cargando" });

  useEffect(() => {
    const control = new AbortController();

    cargarDetalle(nombre, control.signal).then(
      (detalle) => establecerCarga({ tipo: "listo", detalle }),
      (error: unknown) => {
        if (control.signal.aborted) {
          return;
        }

        const detalle = error instanceof Error ? error.message : "falló la carga";
        establecerCarga({ tipo: "error", detalle });
      },
    );

    return () => control.abort();
  }, [nombre]);

  return carga;
}
```

It starts: it creates an `AbortController` **belonging to this cycle**, requests the detail for `nombre`, and passes its signal. When the response arrives, it writes `listo`; if it fails, it writes `error`. It stops: it aborts. And the list says `[nombre]`, because `nombre` is the only value coming from outside the Effect that changes between renders.

The shape of the state follows the rule from Lesson 2: a single `CargaDetalle` union with three cases, not three flags (`cargando`, `error`, `datos`) that could contradict one another. It is the same shape as `Carga` in `useReporte`.

Look at the line `if (control.signal.aborted) return;`. When the cleanup aborts, the promise is rejected with `AbortError`. Without that line, in development you would see it on every service you choose: `StrictMode`'s extra cycle (3.4) aborts the first request, and its rejection reaches the very box you are looking at, because `StrictMode` cleans up and re-runs setup for the Effect **of the same component**, which preserves its state. This was measured in a copy without that line, with headless Chrome, selecting `pagos` and, once loaded, `inventario`:

```text
08:39:27.086 clic en pagos
08:39:27.237 aside:
pagos

No se pudo cargar el detalle: signal is aborted without reason

Nota sobre pagos
Guardar nota
Cerrar detalle
08:39:28.939 aside:
pagos
Estado
En falla: HTTP 503
Revisiones
1
Última revisión
2026-10-21T08:39:25.997Z
Nota sobre pagos
Guardar nota
Cerrar detalle
08:39:28.945 clic en inventario
08:39:29.045 aside:
inventario

No se pudo cargar el detalle: signal is aborted without reason

Nota sobre inventario
Guardar nota
Cerrar detalle
08:39:29.547 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:39:25.997Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

A bogus error on screen for 1.7 seconds with `pagos` and 0.5 with `inventario`, until the correct response replaces it. The text “signal is aborted without reason” is Chrome's; other browsers print something else. In production, without the extra cycle, you would not see it with this checkpoint, because the `key` unmounts the old panel and its rejection has nowhere to write; but without the `key` you would also see it on every service switch. An abort **is not an error**: it is how this cycle says “I no longer care”. That is why it is recognized and ignored. Notice what is being checked: not the error type, but whether **my** controller aborted. If the server crashes and at the same time the user switches services, the correct question is “is this cycle still current?”, not “what kind of error is it?”.

And notice what it **does not** do: it does not call `establecerCarga({ tipo: "cargando" })` at the beginning. When you switch services, the box must return to “Cargando detalle…”, but that is not done by the Effect. It is done by the `key`, and the reasoning occupies all of section 3.3.4. For now, keep the clue: the initial state is `{ tipo: "cargando" }`, and the only time it is used is when the component is born.

`establecerCarga` is indeed called inside the Effect, but only within the callbacks passed to `.then(...)`—that is, when the response **arrives from outside**. That is precisely the form Lesson 0 showed as permissible: an Effect that subscribes to something external and updates state when that external thing responds.

The box uses the hook and renders the three cases:

```tsx
// revisor/src/detalle/PanelDetalle.tsx
import { EditorNota } from "../reporte/EditorNota";
import { useDetalle } from "./useDetalle";

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
  const carga = useDetalle(nombre);

  return (
    <aside className="detalle" aria-label={`Detalle de ${nombre}`}>
      <h3>{nombre}</h3>
      {carga.tipo === "cargando" && <p role="status">Cargando detalle…</p>}
      {carga.tipo === "error" && <p role="alert">No se pudo cargar el detalle: {carga.detalle}</p>}
      {carga.tipo === "listo" && (
        <dl>
          <dt>Estado</dt>
          <dd>
            {carga.detalle.estado.tipo === "disponible"
              ? `Disponible: HTTP ${carga.detalle.estado.codigoHttp} en ${carga.detalle.estado.duracionMs} ms`
              : `En falla: ${carga.detalle.estado.detalle}`}
          </dd>
          <dt>Revisiones</dt>
          <dd>{carga.detalle.revisiones}</dd>
          <dt>Última revisión</dt>
          <dd>{carga.detalle.ultimaRevision}</dd>
        </dl>
      )}
      <EditorNota nombre={nombre} notaGuardada={notaGuardada} alGuardar={alGuardarNota} />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
```

Compare it with `DetalleSeleccion` from Lesson 2, which this file replaces. That one received the already-resolved `estado` and placed `key={estado.nombre}` on `EditorNota` so the draft would not drag over from one service to another. This one receives only `nombre` and the saved note text, and `EditorNota` no longer carries a `key`. That is not an oversight: the `key` moved up one level, to `PanelDetalle` as a whole, and from there resets everything inside, editor included. The text “Cargando detalle…” with `role="status"` and the error with `role="alert"` follow the course's accessibility convention: a screen reader announces changes to those two regions without the user having to hunt for them.

Finally, `ContenidoReporte` mounts the box:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { PanelDetalle } from "../detalle/PanelDetalle";
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
      const existe = estados.some((estado) => estado.nombre === seleccionado);

      return (
        <>
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
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

The selection remains an identifier, `seleccionado: string | null`, as required in Lesson 2. `existe` is **computed**: if the chosen service disappears from the list in the next report, the box vanishes automatically, without anyone having to remember to clear the selection. And there it is, on a single line, the piece doing half the work of this lesson: `key={seleccionado}`.

Taken together, this is what the panel does when you select `pagos` and, 300 milliseconds later, `inventario` (measured with headless Chrome on the unmodified checkpoint):

```text
08:28:18.833 clic en pagos
08:28:19.136 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:19.140 clic en inventario
08:28:19.642 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:28:17.762Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:21.644 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:28:17.762Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Half a second after the second click the box already displays `inventario`, and two seconds later, when the response for `pagos` would have had plenty of time to arrive, it still displays the correct information. And here is the server log throughout the entire test, from the moment the page opened:

```text
08:28:17.462 GET /api/estados cancelada por el cliente
08:28:17.763 GET /api/estados 200
08:28:18.836 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/inventario cancelada por el cliente
08:28:19.347 GET /api/servicios/inventario 200
```

Six lines, and each one has a cause you can now name. The first two are `StrictMode`'s pair for the report, the same ones from Lesson 0. The third is the first cycle of `pagos`'s details, which `StrictMode` started and immediately cleaned up (3.4). The fourth is the second cycle of `pagos`—the real one—cancelled 310 milliseconds later because you selected `inventario`: **that** is cleanup resolving the race condition. The fifth and sixth are `StrictMode`'s pair for `inventario`, whose box was born anew thanks to the `key`. No response from `pagos` ever reached the panel, because it never finished.

### 3.3 The response race condition

#### 3.3.1 The race condition in miniature

Before breaking the `revisor`, look at the race condition in isolation, without a server, without a network, and without a `key`. The first figure mounts two versions of the same component in a test DOM. Both request details using a mock function that takes 300 ms for `pagos` and 20 ms for the rest. The only difference is that one has cleanup and the other does not. Each is given `pagos` and, immediately after, `inventario`:

```tsx
// fig03_01.tsx
import { JSDOM } from "jsdom";
import { act, useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// pagos takes 300 ms and the others 20 ms, as on the practice server (there, 1500 and 200).
const DEMORA_MS: Readonly<Record<string, number>> = { pagos: 300 };

function cargarDetalle(nombre: string, senal: AbortSignal): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const temporizador = setTimeout(() => resolver(`detalle de ${nombre}`), DEMORA_MS[nombre] ?? 20);
    senal.addEventListener("abort", () => {
      clearTimeout(temporizador);
      rechazar(new Error(`${nombre}: petición cancelada`));
    });
  });
}

function DetalleSinLimpieza({ nombre }: { readonly nombre: string }) {
  const [texto, establecerTexto] = useState("cargando…");

  useEffect(() => {
    const control = new AbortController();
    cargarDetalle(nombre, control.signal).then(establecerTexto);
  }, [nombre]);

  return <p>{nombre}: {texto}</p>;
}

function DetalleConLimpieza({ nombre }: { readonly nombre: string }) {
  const [texto, establecerTexto] = useState("cargando…");

  useEffect(() => {
    const control = new AbortController();
    cargarDetalle(nombre, control.signal).then(establecerTexto, (error: unknown) => {
      if (control.signal.aborted) {
        console.log(`  (${error instanceof Error ? error.message : "cancelada"})`);
      }
    });

    return () => control.abort();
  }, [nombre]);

  return <p>{nombre}: {texto}</p>;
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function elegirPagosYLuegoInventario(
  titulo: string,
  Detalle: ComponentType<{ readonly nombre: string }>,
): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => raiz.render(<Detalle nombre="pagos" />));
  await act(async () => raiz.render(<Detalle nombre="inventario" />));
  await act(async () => esperar(100));
  console.log(`  a los 100 ms: ${contenedor.textContent}`);
  await act(async () => esperar(400));
  console.log(`  a los 500 ms: ${contenedor.textContent}`);
  await act(async () => raiz.unmount());
}

await elegirPagosYLuegoInventario("sin limpieza:", DetalleSinLimpieza);
await elegirPagosYLuegoInventario("con limpieza:", DetalleConLimpieza);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig03_01.tsx
$ node fig03_01.js
sin limpieza:
  a los 100 ms: inventario: detalle de inventario
  a los 500 ms: inventario: detalle de pagos
con limpieza:
  (pagos: petición cancelada)
  a los 100 ms: inventario: detalle de inventario
  a los 500 ms: inventario: detalle de inventario
```

Both versions display the correct content at 100 ms. The difference emerges later. **Without cleanup**, at 500 ms the paragraph reads `inventario: detalle de pagos`: the header belongs to one service and the data belongs to another. That is the opening scene in four words. **With cleanup**, switching from `pagos` to `inventario` executed the first cycle's cleanup, which aborted the request for `pagos`; its promise was rejected (hence the parenthesized line printed by the rejection handler) and never called `establecerTexto`.

Why does the stale response win? Because both questions were dispatched almost simultaneously, and each arrives whenever it arrives. The React documentation calls them precisely that: **race condition** bugs, because two asynchronous operations “race” against each other and may arrive in an unexpected order ([React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects)). The `useEffect` reference summarizes it in a sentence worth memorizing: network responses may arrive in a different order than you sent them ([React, “useEffect”](https://react.dev/reference/react/useEffect)). No single line of code is wrong; what is missing is a line saying what to do with the question that no longer matters.

#### 3.3.2 Abort or ignore

The React documentation offers two ways to clean up an Effect that fetches data: “if your Effect fetches something, the cleanup function should either **abort** the fetch or **ignore** its result” ([React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects)). Its examples use the second, with a local variable:

```ts
// flag form, as in the React documentation (fragment)
useEffect(() => {
  let ignorar = false;

  cargarDetalle(nombre, new AbortController().signal).then((detalle) => {
    if (!ignorar) {
      establecerCarga({ tipo: "listo", detalle });
    }
  });

  return () => {
    ignorar = true;
  };
}, [nombre]);
```

The flag prevents the stale response from writing to state, and the same page notes that an explicit boolean flag is the most reliable way to fix this class of bug. It also provides the rationale: after `fetch`, further asynchronous steps may be chained ([React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects)). Aborting only halts whatever listens to the signal; the flag stops any write, regardless of where it comes from. The `revisor` uses the other form, `AbortController`, for three concrete reasons. First: the `revisor` had already been using it since lesson 9 of TypeScript, in `useReporte`, and keeping both hooks aligned is valuable. Second: aborting does not just ignore the result; it **cuts the network connection**, and the server stops wasting work on a response nobody will read; with the flag, the old request travels in its entirety. Third: you can observe it, because the server logs `cancelada por el cliente`. Both approaches satisfy the golden rule of the documentation: that a request that no longer matters must not continue affecting the application. Aborting additionally respects the server. And here aborting suffices for a specific reason: in `cargarDetalle`, all asynchronous operations listen to the signal (`fetch` and `respuesta.json()`), followed only by synchronous code. If you ever add another `await` that does not receive the signal, the documentation's argument becomes yours: check `control.signal.aborted` before writing success as well, or combine both approaches.

The price of aborting is the line `if (control.signal.aborted) return;`: because the promise is rejected, one must distinguish an intentional abort from a real failure. With the flag there is no rejection to distinguish. That is a small price, which is why both approaches are valid. What is never valid is doing neither.

#### 3.3.3 Reproducing it in the `revisor`

Now break the `revisor`. Do it in a copy or revert the file when finished: the checkpoint must remain untouched. The obvious experiment is removing the cleanup from `useDetalle`—the line `return () => control.abort();`—selecting `pagos`, and immediately `inventario`. **Before reading further, predict what the box will display at the two-second mark.**

Here is what headless Chrome measured with that single change:

```text
08:28:25.305 clic en pagos
08:28:25.606 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:25.609 clic en inventario
08:28:26.110 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
2
Última revisión
2026-10-21T08:28:24.150Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:28.113 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
2
Última revisión
2026-10-21T08:28:24.150Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

If you predicted “En falla: HTTP 503”, you missed the mark just like the first draft of these course notes. The box reports the correct state at both points in time: at 500 ms and at two and a half seconds. Is the race condition gone? Look at the log:

```text
08:28:23.850 GET /api/estados cancelada por el cliente
08:28:24.150 GET /api/estados 200
08:28:25.812 GET /api/servicios/inventario 200
08:28:26.014 GET /api/servicios/inventario 200
08:28:26.807 GET /api/servicios/pagos 200
08:28:28.122 GET /api/servicios/pagos cancelada por el cliente
```

The race condition **did** occur on the network: nobody cancels anything anymore, and the response for `pagos` arrived in full at 26.807, nearly a second **after** the first response for `inventario`. But it never made it to the screen. The reason is `key={seleccionado}`. When you selected `inventario`, the `key` changed and React did not update `pagos`'s `PanelDetalle`: it **unmounted** it and mounted a brand new one. The documentation puts it like this: when you remove a component, React destroys its state ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)). The response for `pagos` invoked `establecerCarga` on a component that no longer existed, and that call has no target to update. (The final line, the `pagos` cancelled at 28.122, represents the script closing the tab. It is explained in 3.4.)

So, is cleanup redundant? No, and to see why, one must remove the other defense as well. With the `key` deleted from `ContenidoReporte` **and** without `control.abort()`, the same script measured this:

```text
08:28:31.746 clic en pagos
08:28:32.048 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:32.051 clic en inventario
08:28:32.553 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
3
Última revisión
2026-10-21T08:28:30.592Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:34.555 aside:
inventario
Estado
En falla: HTTP 503
Revisiones
3
Última revisión
2026-10-21T08:28:30.592Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

There is the operator's incident, measured: at 500 ms the box displays the truth about `inventario`, and at two and a half seconds it displays “En falla: HTTP 503”, the status of `pagos`, beneath the “inventario” header. The log explains why:

```text
08:28:30.292 GET /api/estados cancelada por el cliente
08:28:30.592 GET /api/estados 200
08:28:32.252 GET /api/servicios/inventario 200
08:28:33.247 GET /api/servicios/pagos 200
08:28:34.563 GET /api/servicios/pagos cancelada por el cliente
```

Without the `key`, `PanelDetalle` is **the exact same component** before and after the second click: only its `nombre` prop changed. `useDetalle`'s Effect ran a fresh cycle for `inventario`, but the `pagos` cycle was never cleaned up, and when its response arrived it wrote to the state of the very component now displaying `inventario`. It is figure 1 reproduced with a real network.

When you restore cleanup while leaving the panel without a `key`, the race condition disappears: the change in `nombre` executes the cleanup of the `pagos` cycle, which aborts, and the stale response never lands. The script confirmed this both via the log (the `pagos` from the second cycle shows up as `cancelada por el cliente` four milliseconds after clicking `inventario`, at 38.511) and via the box, which remained on “Disponible: HTTP 200 en 118 ms”. But that version has another flaw, which is why the checkpoint employs both defenses. Measured in the same run, selecting `pagos`, waiting for it to load, and then switching to `catálogo`:

```text
08:28:43.036 clic en catálogo
08:28:43.077 aside:
catálogo
Estado
En falla: HTTP 503
Revisiones
4
Última revisión
2026-10-21T08:28:37.059Z
Nota sobre catálogo
Guardar nota
Cerrar detalle
08:28:43.678 aside:
catálogo
Estado
Disponible: HTTP 200 en 42 ms
Revisiones
4
Última revisión
2026-10-21T08:28:37.059Z
Nota sobre catálogo
Guardar nota
Cerrar detalle
```

Forty milliseconds after the click, the box reads “catálogo” and below it “En falla: HTTP 503”: the data from `pagos`, lingering because nothing reset the state to `cargando`. Two hundred milliseconds later the correct response arrives and corrects it. It is not a race condition (there is no stale response writing late), but for an instant the screen lies just the same. The operator from the opening scene, glancing at that exact moment, would also call inventory.

#### 3.3.4 Two defenses, and why `key` is not a trick

Recap what was measured:

| `key={seleccionado}` | cleanup that aborts | What is seen upon switching services |
|---|---|---|
| no | no | stale response overwrites the new one (the opening scene) |
| no | yes | no race condition, but previous service data remains visible until the new response arrives |
| yes | no | screen is correct; stale response travels in full and is discarded |
| yes | yes | “Cargando detalle…” followed by correct data; stale request is cut short |

The last row is the checkpoint. Why use the `key` instead of calling `establecerCarga({ tipo: "cargando" })` at the start of the Effect, which would seem natural for the second row? Because the linter forbids it, and rightly so. That attempt triggers the `set-state-in-effect` error that you will see in full under “The error you will see”. The rule explains that updating state synchronously inside an Effect forces React to restart the render cycle entirely before the browser paints ([React, “set-state-in-effect”](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)): React renders the box with stale data, commits it, runs the Effect, the Effect requests another render, and React renders all over again. A discarded render.

The `key` suffers from no such problem because it does not correct state after the fact: it ensures state **is born** clean. The React documentation suggests it for this exact scenario in the section “Resetting all state when a prop changes”: when the `key` changes, React re-creates the component and resets its state along with that of all its children ([React, “You Might Not Need an Effect”](https://react.dev/learn/you-might-not-need-an-effect)). And its page on preserving state explains the same concept from the other angle: specifying a `key` tells React to use the `key` itself as part of the component's position rather than its position in the parent ([React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state)). To React, `<PanelDetalle key="pagos">` and `<PanelDetalle key="inventario">` are two distinct components that share nothing. Lesson 2 used this tool for the note draft; here it is used for the entire panel: loading state, editor draft, and the Effect itself.

The `key` introduces a side effect you should understand: the box is mounted anew, and with `StrictMode` that means `useDetalle`'s Effect runs its extra cycle on every service switch. You saw it in the log: each service you select typically leaves a `cancelada` + `200` pair. That is the development cost of the free test, and in production it does not exist. (It says “typically”: as clarified in Lesson 0, the `cancelada` line only appears if the connection managed to reach the server before the abort.)

And why keep cleanup if the `key` already safeguards the screen? Because the `key` protects **this** screen, mounted **this way**. Cleanup protects the hook wherever it may be consumed. If details became a standalone page with its own URL, as envisioned in the plan for Lesson 5, the same component could receive a different `nombre` without unmounting when navigating from `/servicios/pagos` to `/servicios/inventario`. A hook that only works if its consumer remembers to provide a `key` is a hook with a hidden booby trap. Furthermore, with the `key` alone, the response for `pagos` travelled completely: 1.5 seconds of server and network effort thrown away. The rule in the React documentation admits no exceptions: “your cleanup function should make sure that the request that no longer matters does not continue affecting your application” ([React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects)). The `key` fixes what is seen; cleanup fixes what happens.


### 3.4 `StrictMode`: the free test

#### 3.4.1 What it does with Effects

Lesson 0 taught you to read the “cancelada por el cliente” + “200” pair. Now you can understand what it is testing. The `useEffect` reference puts it in these words: with `StrictMode` enabled, React executes one extra cycle of setup and cleanup, **only in development**, before the first real setup; it is a stress test that verifies that cleanup mirrors setup and halts or undoes whatever setup is doing ([React, “useEffect”](https://react.dev/reference/react/useEffect)). And it provides a rule to know if you passed the test: **the user should not be able to tell the difference between the Effect running once (as in production) and the setup → cleanup → setup sequence (as in development).**

Apply the rule to the details box. In development, upon choosing `pagos`:

1. React mounts `PanelDetalle`. The Effect starts: it creates `control₁` and requests `pagos` with its signal.
2. `StrictMode` simulates that the component unmounted: it runs cleanup, which aborts `control₁`. The server logs `cancelada por el cliente`.
3. `StrictMode` simulates that the component returned: the Effect starts again, creates `control₂`, and requests `pagos` once more. That is the request that fills the box.

Can the user tell that apart from a single request? No: they see “Cargando detalle…” and then the details, exactly as in production. Test passed. Now imagine the Effect **without** cleanup (the 3.3.3 experiment with `key`). In step 2 nothing is aborted; both requests travel and both arrive. In this dashboard both responses are identical and it goes unnoticed, but the server did twice the work and the second `200` in the log gives it away. With an Effect that subscribed to something (an interval, a connection) instead of fetching data, step 2 would leave **two** live subscriptions, which definitely would be noticed.

That is why the documentation urges changing the question: the right question is not “how do I make the Effect run once?”, but rather “how do I fix my Effect so that it works after being remounted?” ([React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects)). The same page warns against the workaround everyone tries first—a ref that prevents the second execution: simply making the Effect run once is not enough, because the bug `StrictMode` exposes also happens in production every time the user navigates away from the screen and comes back.

#### 3.4.2 Reading the log with what you now know

Return to the checkpoint log without modifications, in 3.2.3. Every line now tells a complete story (with the precision from Lesson 0: a `cancelada` line from the extra cycle only appears if the connection reached the server before the abort; if it is missing on your machine, it does not mean `StrictMode` is off):

- `GET /api/estados cancelada por el cliente` and `GET /api/estados 200`, upon opening: the polling's extra cycle. `useReporte`'s cleanup aborts and also clears the interval; if it did not clear it, there would be two intervals querying every ten seconds.
- `GET /api/servicios/pagos cancelada por el cliente`, upon the first click: the extra cycle for `pagos`'s details.
- `GET /api/servicios/pagos cancelada por el cliente`, 310 ms later: this is not `StrictMode`. It is the real cleanup running because you selected another service and the `key` unmounted the panel.
- The `inventario` pair: the extra cycle for the new panel, and then the request that populates the screen.

Notice something the log does not show: the `200` from the second `pagos` cycle is missing. It never arrived because cleanup cut it off halfway. That absence is the race condition resolved.

There is one more detail in the logs of 3.3.3 worth explaining so it does not confuse you if encountered. In the experiment with `key` and without cleanup, the two requests for `inventario` (the extra cycle one and the real one, identical) did not hit the server together, but rather 200 ms apart, and the second identical request for `pagos` was still pending when the script closed the tab, which is why it appears as `cancelada por el cliente` at 28.122. What was observed is that Chrome did not send the second request to the same URL until the first completed. This matches Chromium's HTTP cache lock behavior, which permits only one write request at a time per URL to avoid downloading identical resources twice ([Chromium, change 8aacaf3](https://chromium.googlesource.com/chromium/src.git/+/8aacaf38e85c45876c72ea77e36ef17e5ab69c26)); Chrome does not document this as official behavior and it was not investigated further because it is outside the course scope, and it alters none of the lesson's conclusions: what matters is which response reaches the screen, and that was measured in the box, not in the log.

#### 3.4.3 The temptation to remove it

The initial reaction to duplicate requests is removing `StrictMode`. The documentation allows it and discourages it in the same breath: you can turn it off, but the React team recommends keeping it on ([React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects)). Now you have measured the reason. In the experiment without cleanup, `StrictMode` revealed two `200`s where there should have been a `cancelada` and a `200`, **before** anyone ever selected two services in succession. Removing it would have hidden that very signal.

The extra cycle does not exist in built code either. Lesson 0 measured this with `npm run preview`: a single request when opening the page.

### 3.5 Dependencies describe the code

#### 3.5.1 You do not choose your dependencies

Up to this point, the dependency lists in the `revisor` have been straightforward: `[nombre]`, `[titulo]`, `[cargar, cadaMs, intento]`. Now comes a case that is not, and it provides the rationale for the principle this course repeats in every lesson.

The operations team requested a line: “Actualizado a las 2:28:53 a.m.”, below the list, indicating when the last report arrived. The information that “a report arrived” lives in `useReporte`; the place where the line is rendered is `Panel`. The way to connect them is standard in React: `Panel` passes a function, `alRecibir`, to the hook, and the hook calls it when a report arrives. The name follows the course convention: callback function props begin with `al`.

The initial attempt is calling `alRecibir` inside the Effect, after `establecerCarga`, without touching anything else. ESLint responds like this (measured in a copy):

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  43:6  warning  React Hook useEffect has a missing dependency: 'alRecibir'. Either include it or remove the dependency array. If 'alRecibir' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

The warning tells the truth: the Effect **uses** `alRecibir` and the list does not name it. If you left it like that (or silenced it with a comment), the Effect would be stuck with the `alRecibir` from the initial render forever. Here you would not notice, because all versions of the function do the same thing, but the day the function reads something from `Panel`'s state, it would read the value from the initial render. The React documentation has a name for that, **stale values**, and a promise: if you never silence the linter, you will never see stale value bugs ([React, “Lifecycle of Reactive Effects”](https://react.dev/learn/lifecycle-of-reactive-effects)).

That same page is categorical about the underlying idea: **you cannot “choose” your dependencies.** They must include every reactive value the Effect reads, and the linter enforces it. Reactive values are props, state, and everything declared inside the component, because they are calculated during rendering and can change from one render to the next. The page on removing dependencies says it the other way around, with a sentence that serves as the course rule: the list **describes** your code; to change the list, change the code ([React, “Removing Effect Dependencies”](https://react.dev/learn/removing-effect-dependencies)).

#### 3.5.2 Blindly obeying the linter: the loop

So obey the warning literally and add `alRecibir` to the list: `[cargar, cadaMs, intento, alRecibir]`. The linter is satisfied:

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0

```

Green. Now open the dashboard. Here is what the practice server logged during the first five seconds of the page being open in headless Chrome, without a single click:

```text
08:28:45.991 GET /api/estados cancelada por el cliente
08:28:46.292 GET /api/estados 200
08:28:46.602 GET /api/estados 200
08:28:46.907 GET /api/estados 200
08:28:47.210 GET /api/estados 200
08:28:47.514 GET /api/estados 200
08:28:47.819 GET /api/estados 200
08:28:48.123 GET /api/estados 200
08:28:48.428 GET /api/estados 200
08:28:48.730 GET /api/estados 200
08:28:49.036 GET /api/estados 200
08:28:49.340 GET /api/estados 200
08:28:49.645 GET /api/estados 200
...
08:28:50.565 GET /api/estados 200
08:28:50.870 GET /api/estados 200
08:28:50.944 GET /api/estados cancelada por el cliente
```

Eighteen lines total: **sixteen** `200` responses and two cancellations, in five seconds, when the panel was supposed to request **one** (polling is every ten). That is one request every 300 ms, which is exactly the server delay: the panel requests, waits for the response, and the moment it arrives, requests again. Forever. (The last cancellation is the script closing the tab.)

Trace the chain with what you know from 3.1:

1. A report arrives and the Effect calls `alRecibir`.
2. `alRecibir` is `() => establecerActualizadoEn(new Date())`: it updates `Panel`'s state.
3. `Panel` re-renders, and upon re-rendering creates **another** arrow function for `alRecibir`. It has the same text, but it is a distinct object in memory.
4. React compares dependencies using `Object.is`. For functions, that compares referential identity: the new function **is not** the old one. The list changed.
5. React runs cleanup (aborts and stops the interval) and restarts the Effect, which immediately requests a report. Go back to step 1.

The React documentation describes this exact mechanism with an `options` object: each freshly created object and function is considered distinct from all others, regardless of whether their contents match, which is why an Effect depending on them resynchronizes more often than necessary ([React, “Removing Effect Dependencies”](https://react.dev/learn/removing-effect-dependencies)). And notice what that means for the question “how many times does the interval restart?”: **on every render of `Panel`**. In this `Panel`, on every incoming report, which turns the restart into an infinite loop. Without the loop (if `alRecibir` did not update state), every click on the “Solo fallas” checkbox or on a service would also re-render `Panel` and restart the interval: the ten-second polling would start counting from zero every time someone clicks.

This is the most critical takeaway of the section: **a green linter does not mean your code is right. It means your list is not lying.** The list was lying when `alRecibir` was missing, and the linter warned you. Adding it stopped the lie, and then the truth was laid bare: as written, this Effect **does** depend on a function that changes on every render. The linter did its job. What is broken is the design, and it is fixed by changing the code.

#### 3.5.3 The ways out offered by the documentation

The page “Lifecycle of Reactive Effects” lists what to do when the linter's suggestion causes an infinite loop or resynchronizes too frequently. Summarized, there are four options: check whether the Effect is actually a single synchronization process or two mixed together, and split them; move non-reactive values outside the component or inside the Effect; use Effect Events to read the freshest props and state without resynchronizing; and avoid objects and functions created during rendering as dependencies ([React, “Lifecycle of Reactive Effects”](https://react.dev/learn/lifecycle-of-reactive-effects)). See which apply here:

- **Move the function inside the Effect?** Impossible: it is written by `Panel`, which is a different component.
- **Move the function outside `Panel`?** Nor can we: it calls `establecerActualizadoEn`, which exists only inside.
- **`useCallback` in `Panel`?** That is what the warning itself suggests. It would work here, because `establecerActualizadoEn` never changes, but it offloads the problem onto consumers of the hook: every component using `useReporte` would have to remember to wrap its function, or polling would become an infinite loop again. And the course does not introduce memoization out of habit. A hook that relies on its consumers remembering a rule is fragile.
- **An Effect Event?** This is the one that belongs, for a fundamental reason covered in the next section.

The deciding question is not technical; it is about meaning: **is notifying that a report arrived part of synchronizing with the server, or is it something that happens *during* synchronization?** If tomorrow `Panel` passes a different function, should we stop asking the server and start over? No. Polling depends on which function loads the data (`cargar`), how often (`cadaMs`), and whether someone requested a reload (`intento`). Whom we notify when something arrives changes none of that.

### 3.6 `useEffectEvent`: reading the latest without restarting

#### 3.6.1 A function that behaves like an event

The React documentation distinguishes two kinds of logic. Event handler logic is **not reactive**: it only runs when the user repeats the interaction, such as another click. Effect logic **is reactive**: if it reads a prop or state, that value belongs in dependencies, and if it changes, the Effect runs again ([React, “Separating Events from Effects”](https://react.dev/learn/separating-events-from-effects)). The “report arrived” notification blends both natures: it triggers from the Effect (when the server responds), but it must not cause the Effect to restart. That is what `useEffectEvent` is for. Its reference describes it like this: it is a hook that lets you separate events from Effects; Effect Events are part of the Effect's logic, but behave more like an event handler: they always “see” the freshest values from the render (props and state) without resynchronizing the Effect, and therefore **stay out of the dependencies** ([React, “useEffectEvent”](https://react.dev/reference/react/useEffectEvent)). It arrived as part of React 19.2, released on October 1, 2025 ([React, “React 19.2”](https://react.dev/blog/2025/10/01/react-19-2)); this course uses 19.3.1.

Here is the updated `useReporte`:

```ts
// revisor/src/reporte/useReporte.ts
import { useEffect, useEffectEvent, useState } from "react";
import type { ReportePublico } from "../compartido/contrato";
import type { Cargar } from "./cargar";

export type Carga =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "listo"; readonly reporte: ReportePublico }
  | { readonly tipo: "error"; readonly detalle: string };

export function useReporte(
  cargar: Cargar,
  cadaMs: number,
  alRecibir: (reporte: ReportePublico) => void,
): { readonly carga: Carga; readonly recargar: () => void } {
  const [carga, establecerCarga] = useState<Carga>({ tipo: "cargando" });
  const [intento, establecerIntento] = useState(0);
  const avisarRecibido = useEffectEvent(alRecibir);

  useEffect(() => {
    const control = new AbortController();

    async function pedir(): Promise<void> {
      try {
        const reporte = await cargar(control.signal);
        establecerCarga({ tipo: "listo", reporte });
        avisarRecibido(reporte);
      } catch (error: unknown) {
        if (control.signal.aborted) {
          return;
        }

        const detalle = error instanceof Error ? error.message : "falló la carga";
        establecerCarga({ tipo: "error", detalle });
      }
    }

    void pedir();
    const temporizador = setInterval(() => void pedir(), cadaMs);

    return () => {
      control.abort();
      clearInterval(temporizador);
    };
  }, [cargar, cadaMs, intento]);

  function recargar(): void {
    establecerCarga({ tipo: "cargando" });
    establecerIntento((actual) => actual + 1);
  }

  return { carga, recargar };
}
```

Compared to Lesson 2, four lines change: the `import` adds `useEffectEvent`, the hook accepts the `alRecibir` parameter, wraps it in `avisarRecibido`, and the Effect calls `avisarRecibido(reporte)` (in the attempt from 3.5 it called `alRecibir` directly). The dependency list **does not change**: it remains `[cargar, cadaMs, intento]`, and the linter accepts it because the function the Effect now uses is an Effect Event, and those do not go in the list. The value of `alRecibir` that runs is always the one from the latest render, even if the Effect started several renders earlier.

In `Panel` (3.1.2) nothing you wrote changes: it continues passing a fresh arrow function on every render, `() => establecerActualizadoEn(new Date())`. It no longer matters. That is the advantage over `useCallback`: the hook protects itself and the consumer does not need to know anything.

#### 3.6.2 Counting restarts

The third figure answers the question “how many times does the interval restart?” with a number. Two identical pollers—one with the function in dependencies and the other with `useEffectEvent`—render three times, each time with a new function, just as `Panel` does:

```tsx
// fig03_03.tsx
import { JSDOM } from "jsdom";
import { act, useEffect, useEffectEvent, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type PropsSondeo = { readonly alRecibir: () => void };

function SondeoConDependencia({ alRecibir }: PropsSondeo) {
  useEffect(() => {
    console.log("  arranca el intervalo");
    const temporizador = setInterval(alRecibir, 10_000);
    return () => {
      console.log("  detiene el intervalo");
      clearInterval(temporizador);
    };
  }, [alRecibir]);

  return null;
}

function SondeoConEvento({ alRecibir }: PropsSondeo) {
  const avisarRecibido = useEffectEvent(alRecibir);

  useEffect(() => {
    console.log("  arranca el intervalo");
    const temporizador = setInterval(() => avisarRecibido(), 10_000);
    return () => {
      console.log("  detiene el intervalo");
      clearInterval(temporizador);
    };
  }, []);

  return null;
}

async function dibujarTresVeces(titulo: string, Sondeo: ComponentType<PropsSondeo>): Promise<void> {
  console.log(titulo);
  const raiz = createRoot(dom.window.document.createElement("div"));

  for (const dibujo of [1, 2, 3]) {
    console.log(` dibujo ${dibujo}`);
    // As in Panel: a new function on every render.
    await act(async () => raiz.render(<Sondeo alRecibir={() => console.log("  recibido")} />));
  }

  console.log(" desmontar");
  await act(async () => raiz.unmount());
}

await dibujarTresVeces("con alRecibir en las dependencias:", SondeoConDependencia);
await dibujarTresVeces("con useEffectEvent:", SondeoConEvento);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig03_03.tsx
$ node fig03_03.js
con alRecibir en las dependencias:
 dibujo 1
  arranca el intervalo
 dibujo 2
  detiene el intervalo
  arranca el intervalo
 dibujo 3
  detiene el intervalo
  arranca el intervalo
 desmontar
  detiene el intervalo
con useEffectEvent:
 dibujo 1
  arranca el intervalo
 dibujo 2
 dibujo 3
 desmontar
  detiene el intervalo
```

With the function in dependencies, the interval starts **three** times across three renders: one per render, even though nothing that matters changed. With `useEffectEvent`, it starts **once** and stops once, upon unmounting. (The figure does not use `StrictMode`, so the count can be read without the extra cycle; “recibido” does not appear because the figure exits long before the ten-second interval expires.)

And in the `revisor`, with real clicks. This script opened the unmodified checkpoint and, over twenty-one seconds, clicked the “Solo fallas” checkbox four times (checking and unchecking it twice) and selected two services. Every one of those clicks re-renders `Panel`:

```text
08:28:53.073 abre http://localhost:5103/
08:28:54.581 document.querySelector(".actualizado").textContent → "Actualizado a las 2:28:53 a.m."
08:28:54.588 clic en la casilla
08:28:56.593 clic en la casilla
08:28:58.602 clic en catálogo
08:29:00.611 clic en inventario
08:29:05.611 document.querySelector(".actualizado").textContent → "Actualizado a las 2:29:03 a.m."
08:29:05.615 clic en la casilla
08:29:07.620 clic en la casilla
08:29:14.620 document.querySelector(".actualizado").textContent → "Actualizado a las 2:29:13 a.m."
```

The server log during those twenty-one seconds:

```text
08:28:53.138 GET /api/estados cancelada por el cliente
08:28:53.440 GET /api/estados 200
08:28:58.612 GET /api/servicios/cat%C3%A1logo cancelada por el cliente
08:28:58.814 GET /api/servicios/cat%C3%A1logo 200
08:29:00.611 GET /api/servicios/inventario cancelada por el cliente
08:29:00.813 GET /api/servicios/inventario 200
08:29:03.443 GET /api/estados 200
08:29:13.443 GET /api/estados 200
```

The report arrived at 53.440, 03.443, and 13.443: every ten seconds within three thousandths of a second, as if nobody had touched anything. Six clicks, zero polling restarts. And the “Actualizado a las …” line advanced from 2:28:53 to 2:29:03 and to 2:29:13, tracking each report (remember it is the browser's local time). The two detail pairs are those from 3.4: the `key` mounting a fresh panel per service.

#### 3.6.3 What `useEffectEvent` is not

It is tempting to view `useEffectEvent` as a way to kick anything inconvenient out of the list. The documentation prohibits this explicitly: do not use `useEffectEvent` to avoid declaring dependencies of your Effect; it hides bugs and makes code harder to understand. Use it only for logic that is genuinely an event triggered from an Effect; if a value should make the Effect run again, keep it as a dependency ([React, “useEffectEvent”](https://react.dev/reference/react/useEffectEvent)). The React 19.2 release announcement echoes the idea: there is no need to wrap everything in `useEffectEvent`, nor to use it solely to quiet the warning, because that can lead to bugs ([React, “React 19.2”](https://react.dev/blog/2025/10/01/react-19-2)).

The test for the `revisor` is the question from 3.5.3. If you wrapped `cadaMs` in an Effect Event to remove it from the list, the day someone changes the interval from 10 to 5 seconds the Effect would never know, and you would be back in the opening scene of Lesson 0. `cadaMs` is part of synchronization. `alRecibir` is not.

The reference also sets three boundaries. It is a hook, so it must be called at the top level of your component or custom hook, never inside an `if` or a loop. Effect Events can only be called from inside Effects or other Effect Events: never during rendering, and they are not passed to other components or hooks. And their identity changes **deliberately** on every render ([React, “useEffectEvent”](https://react.dev/reference/react/useEffectEvent)). That last point explains what happens if, out of habit, you place `avisarRecibido` in the list. The linter stops it (measured in a copy):

```text
~/curso-react/revisor/src/reporte/useReporte.ts
  44:32  warning  Functions returned from `useEffectEvent` must not be included in the dependency array. Remove `avisarRecibido` from the list  react-hooks/exhaustive-deps
```

If you ignored it, since its identity changes on every render, you would recreate the infinite loop from 3.5.2. The `useEffectEvent` reference states that the linter enforces these restrictions, and the 19.2 announcement notes that a recent version of `eslint-plugin-react-hooks` is required so the linter does not attempt to put Effect Events in the list; the course's 7.1.1 knows them, as you just witnessed.

### 3.7 When an Effect is not needed

#### 3.7.1 Two unnecessary Effects

You now have three Effects in the `revisor` and all three synchronize with something external: the server (twice) and the document. Now comes the other half of the rule of thumb: what does **not** belong in an Effect. The React documentation dedicates an entire page to this, beginning with two sentences worth the whole lesson: you do not need Effects to transform data for rendering, and you do not need Effects to handle user events ([React, “You Might Not Need an Effect”](https://react.dev/learn/you-might-not-need-an-effect)).

The second figure bundles both errors in a single file. It is not part of the `revisor`, but it closely resembles what someone might write in it: a summary counting failures inside an Effect, and a button that, on click, flips a boolean flag so an Effect sends the retry.

```tsx
// fig03_02.tsx
import { useEffect, useState } from "react";

type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

export function Resumen({ estados }: { readonly estados: readonly Estado[] }) {
  const [fallas, establecerFallas] = useState(0);

  useEffect(() => {
    establecerFallas(estados.filter((estado) => estado.tipo === "falla").length);
  }, [estados]);

  return <p>{fallas} servicios con falla</p>;
}

export function BotonReintento({ nombre }: { readonly nombre: string }) {
  const [pedido, establecerPedido] = useState(false);

  useEffect(() => {
    if (pedido) {
      void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
      establecerPedido(false);
    }
  }, [pedido, nombre]);

  return (
    <button type="button" onClick={() => establecerPedido(true)}>
      Volver a revisar
    </button>
  );
}
```
```bash
$ npx eslint fig03_02.tsx

~/curso-react/figuras/fig03_02.tsx
  10:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/figuras/fig03_02.tsx:10:5
   8 |
   9 |   useEffect(() => {
> 10 |     establecerFallas(estados.filter((estado) => estado.tipo === "falla").length);
     |     ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  11 |   }, [estados]);
  12 |
  13 |   return <p>{fallas} servicios con falla</p>;              react-hooks/set-state-in-effect
  22:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/figuras/fig03_02.tsx:22:7
  20 |     if (pedido) {
  21 |       void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
> 22 |       establecerPedido(false);
     |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  23 |     }
  24 |   }, [pedido, nombre]);
  25 |  react-hooks/set-state-in-effect

✖ 2 problems (2 errors, 0 warnings)
```

(The practice server for this lesson has no retry route; here the figure is only inspected with the linter, never executed.) The message is the same one Lesson 0 taught you to read, and it explains everything: an Effect should update external systems with React state, or subscribe to an external system and update state when that system responds. Neither case in the figure does that.

**The first computes.** `fallas` can be obtained from `estados` at render time. Storing it in state and copying it via an Effect produces a render with the old count, an Effect that corrects it, and another render with the correct count: a wasted render, and an instant where the screen displays falsehoods. The documentation states it as a rule: when something can be calculated from existing props or state, don’t put it into state; compute it during rendering instead ([React, “You Might Not Need an Effect”](https://react.dev/learn/you-might-not-need-an-effect)). It is the third shape rule from Lesson 2, “do not store what can be computed”, viewed from the Effects perspective. And it is what the `revisor` already does in `Panel`: `const fallas = … contarFallas(…)`, a constant, and the Effect merely copies it to the document.

**The second reacts to a click.** The retry is not caused by the button rendering, but by the user pressing it. The documentation uses almost the exact same example, buying a product: you don't want to buy it twice, and for that very reason it must not live in an Effect, because buying is not caused by rendering but by a specific interaction, and should run only when the user presses the button ([React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects)). Think also of `StrictMode`: if the request lived in an Effect without a flag, the development extra cycle would fire the retry twice. The fix is moving it to the click handler, where the flag ceases to exist. Exercise 4 asks you to do this.

#### 3.7.2 The pocket reference table

The page “You Might Not Need an Effect” enumerates twelve situations where people write redundant Effects. Those that have already appeared in the `revisor`, alongside where each actually belongs:

| Temptation | Where it actually goes | In the `revisor` |
|---|---|---|
| updating state based on other state | compute during rendering | `fallas` in `Panel`, `visibles` and `existe` in `ContenidoReporte` |
| resetting all state when a prop changes | a `key` | `<PanelDetalle key={seleccionado}>` |
| sending a `POST` request on click | the event handler | not yet in the `revisor`; the plan envisions it for retrying and adding |
| notifying the parent that something changed | call the parent's function in the same event | `alSeleccionar`, `alCambiar`, `alGuardarNota` |
| fetching data | yes, an Effect, with cleanup (or a library) | `useDetalle` and `useReporte` |

Notice the last row. Fetching data **is** synchronizing, which is why the `revisor` does it in an Effect. But the `useEffect` reference is frank about its shortcomings: fetching data manually in Effects does not run on the server, tends to produce waterfalls (parent fetches, renders, then each child fetches its own), does not cache anything, and demands substantial boilerplate to avoid bugs like race conditions; and it recommends using a client-side caching library, TanStack Query among them ([React, “useEffect”](https://react.dev/reference/react/useEffect)). You already wrote that boilerplate twice: `useReporte` and `useDetalle` look very similar. According to the course roadmap, Lesson 4 takes off from there.

#### 3.7.3 What was already done right

Before moving on, look at what the `revisor` was already doing right before anyone explained it. The “Actualizar” button sets `cargando` in `recargar`, inside the click handler, and only then increments `intento` so the Effect restarts: the screen state is updated by the event, the synchronization is handled by the Effect. `cargarReporte` and `cargarDetalle` are module-level functions, identical across renders, so `cargar` in `useReporte`'s list does not restart anything. And `alSeleccionar` updates selection on click; nobody “watches” the selection with an Effect to perform an action afterward. All of that is the exact same principle applied before it had a name.


## The error you will see

The lesson features one primary error, which appears when attempting to reset to “Cargando detalle…” without a `key`, and two supporting ones already shown in 3.5 and 3.6.

**The primary error: “resetting state inside an Effect”.** Remove the `key` from `<PanelDetalle>` and, to make the box return to “Cargando detalle…” when switching services, add `establecerCarga({ tipo: "cargando" })` as the first line of `useDetalle`'s Effect. The linter rejects it (measured in a copy):

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/detalle/useDetalle.ts
  14:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/revisor/src/detalle/useDetalle.ts:14:5
  12 |
  13 |   useEffect(() => {
> 14 |     establecerCarga({ tipo: "cargando" });
     |     ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  15 |     const control = new AbortController();
  16 |
  17 |     cargarDetalle(nombre, control.signal).then(  react-hooks/set-state-in-effect
```

(In that run there was a second intentional change in another file, the one from 3.6.3, which is why the final summary reported `✖ 2 problems (1 error, 1 warning)`; only the block for this error is shown here.) Read it from top to bottom: file, line 14, column 5, the error title, general explanation (the same from figure 2), the code with an arrow pointing to the call, and at the end the rule name, `react-hooks/set-state-in-effect`. It is an **error**, not a warning: it halts `npm run lint` even without `--max-warnings 0`.

The fix is not silencing the rule or moving the call where the linter cannot see it (such as a zero-millisecond `setTimeout` inside the Effect, which is merely the same wasted render in disguise). The fix is asking what you mean. You mean “when the service changes, the box starts from scratch”. In React, that is expressed with `key` (3.3.4), and the Effect remains clean because it no longer has to correct anything.

**The missing dependency warning.** `React Hook useEffect has a missing dependency: 'alRecibir'` (3.5.1). The fix is not blindly adding it, because that produced the loop of sixteen requests in five seconds; nor is it following the suggestion at the end of the message to wrap the function in `useCallback` in the parent. It is asking yourself whether that function is part of synchronization. If it is not, `useEffectEvent`.

**The Effect Event in the list.** `Functions returned from useEffectEvent must not be included in the dependency array` (3.6.3). The fix is what the message says: remove it. Its identity changes on every render intentionally.

## What gets done wrong

**Thinking in terms of “on mount”.** Writing `useEffect(() => { … }, [])` with the mindset of “this runs once, when it loads” leads to Effects without cleanup, and `StrictMode` exposes them with its extra cycle. Think in start and stop synchronization cycles.

**Fetching data without cleanup.** The stale response arrives late and overwrites the correct one. Having a `key` mask it on one screen does not fix it in the hook, and the request travels in full only to be discarded.

**Treating aborts as errors.** Without `if (control.signal.aborted) return;`, cleanup aborts are rendered as failures: in development, via `StrictMode`'s extra cycle, on every service you select (measured in 3.2.3); without a `key`, also on every service switch. An abort is cleanup working as intended.

**Resetting state with `setState` inside an Effect.** It causes a wasted render and the linter rejects it. To reset all state of a component when what it displays changes, use a `key`.

**Silencing `exhaustive-deps`.** An `// eslint-disable-next-line react-hooks/exhaustive-deps` comment leaves the list lying and guarantees stale values down the road. If the warning bothers you, the code has a design flaw.

**Believing a green linter means “correct”.** Adding `alRecibir` to the list left the linter clean while the panel polled every 300 ms. The linter guarantees that the list tells the truth, not that the truth suits you.

**Using `useEffectEvent` to hide dependencies.** If a value should restart synchronization, such as `cadaMs`, it belongs in the list. `useEffectEvent` is for what happens during synchronization, not for what defines it.

**Computing inside an Effect.** Copying to state something that can be computed during rendering causes an extra render and a split second of false UI. Compute it as a constant.

**Triggering a request from a click via an Effect.** The click is an event; the request belongs in its handler. In an Effect, `StrictMode` fires it twice in development, and any dependency change repeats it.

**Removing `StrictMode` because it duplicates requests.** The extra cycle is the proof that cleanup exists, and in production it does not happen.

## Exercises

### Exercise 1 — Read the log before seeing it

With the unmodified checkpoint, the practice server, and `npm run dev` running, you will open the page, wait for it to load, select `catálogo`, wait two seconds, and select `inventario`. **Before doing so**, write in your logbook how many lines the server will append for the two details, in what order, and which ones will say `cancelada por el cliente`. Then do it and compare. Would anything change if you selected `inventario` just 100 ms after `catálogo`?

### Exercise 2 — The obvious experiment, and the complete one

In a copy of the `revisor`, remove only the line `return () => control.abort();` from `useDetalle`. Select `pagos` and, immediately after, `inventario`. Note what the box displays at two seconds and what the server records. Then remove `key={seleccionado}` from `ContenidoReporte` as well and repeat. Explain in three sentences why the first experiment does not display the race condition while the second does. Does the linter warn in either case?

### Exercise 3 — The flag instead of aborting

Rewrite `useDetalle` using the flag form from 3.3.2 (`let ignorar = false` and a cleanup that sets it to `true`), without `AbortController`. Verify that `npm run lint` raises no warnings and that, without a `key`, the race condition remains resolved on screen. **Predict** what changes in the server log when selecting `pagos` and then `inventario`, and verify it. Restore the file when finished.

### Exercise 4 — Fix figure 2 without Effects

Fix `fig03_02.tsx` so that `npx eslint fig03_02.tsx` reports nothing, **without** silencing any rules and without keeping any `useEffect`. `Resumen` must continue displaying the number of failures, and `BotonReintento` must continue sending the `POST` on click.

## Solutions

### Solution 1

Upon selecting `catálogo`, the `key` mounts a new `PanelDetalle` and `StrictMode` runs the extra cycle: a line `GET /api/servicios/cat%C3%A1logo cancelada por el cliente` and, roughly 200 ms later, `GET /api/servicios/cat%C3%A1logo 200`. Two seconds later, selecting `inventario` produces the same: `cancelada` and `200`. Four lines, two cancelled, in the order cancelada, 200, cancelada, 200. That is how it was measured with the checkbox, `catálogo`, and `inventario` in the run from 3.6.2: `08:28:58.612 … cat%C3%A1logo cancelada por el cliente`, `08:28:58.814 … cat%C3%A1logo 200`, `08:29:00.611 … inventario cancelada por el cliente`, and `08:29:00.813 … inventario 200`. Notice that the accented name travels encoded (3.2.2). If you selected `inventario` just 100 ms later, the real request for `catálogo` would not yet have finished (it takes 200 ms), so it would also come out `cancelada`: you would see three `cancelada` lines and a single `200`, the one for `inventario`. That is the race condition resolved, the same one 3.2.3 measured with `pagos`. This latter case was not measured; it is the prediction derived from the rule, and verifying it is your task. And remember the precision from Lesson 0: the `cancelada` line from the extra cycle only appears if the connection managed to reach the server before the abort. If any are missing on your machine, it does not mean `StrictMode` is off.

### Solution 2

This is the experiment measured in 3.3.3. With only cleanup removed, the box reads “Disponible: HTTP 200 en 118 ms” at two seconds, the correct data for `inventario`; the log shows two `GET /api/servicios/inventario 200` lines and one `GET /api/servicios/pagos 200` that arrived almost a second after the first `inventario` (plus another `pagos` that stayed pending until the tab closed, as explained in 3.4.2). The race occurred on the network, but not on screen, because the `key` unmounted the `pagos` panel and its response wrote to a component that no longer existed. Without `key` and without cleanup, the box reads “En falla: HTTP 503” at two seconds under “inventario”: the same component received the stale response. The linter warns in neither case: a missing cleanup breaks no syntax rule, and removing a `key` does not either. That is why this lesson measures in the browser and not just with ESLint.

### Solution 3

One correct form:

```ts
// useDetalle with flag (fragment for the exercise)
useEffect(() => {
  let ignorar = false;

  cargarDetalle(nombre, new AbortController().signal).then(
    (detalle) => {
      if (!ignorar) {
        establecerCarga({ tipo: "listo", detalle });
      }
    },
    (error: unknown) => {
      if (ignorar) {
        return;
      }

      const detalle = error instanceof Error ? error.message : "falló la carga";
      establecerCarga({ tipo: "error", detalle });
    },
  );

  return () => {
    ignorar = true;
  };
}, [nombre]);
```

The screen remains equally protected: the stale response arrives, but its cycle's flag is already `true` and writes nothing. What changes is the log: there is no longer any `cancelada por el cliente` (neither `StrictMode`'s nor from switching services), and in their place appear complete `200` responses for requests nobody uses, including the one for `pagos`—1.5 seconds of server work discarded. That is the difference from 3.3.2: the flag ignores, while aborting also cuts the connection. The course retains aborting. Note that `cargarDetalle` still requires a signal; here it is passed one that nobody aborts.

### Solution 4

Neither component synchronizes anything with an external system, so neither needs an Effect:

```tsx
// fig03_02.tsx corrected (fragment)
type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

export function Resumen({ estados }: { readonly estados: readonly Estado[] }) {
  const fallas = estados.filter((estado) => estado.tipo === "falla").length;

  return <p>{fallas} servicios con falla</p>;
}

export function BotonReintento({ nombre }: { readonly nombre: string }) {
  function reintentar(): void {
    void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
  }

  return (
    <button type="button" onClick={reintentar}>
      Volver a revisar
    </button>
  );
}
```

`fallas` is a constant computed on every render, eliminating state, the Effect, and the wasted render. The `POST` lives in the click handler, eliminating the `pedido` flag and the risk of dispatching it twice. Notice `encodeURIComponent`: it is the same rule from 3.2.2, already present in the figure. With this version, `npx eslint` reports nothing. Notice that the corrected file does not even import `useEffect` or `useState`: the safest way to avoid mistakes with an Effect is not writing one when it is not needed.

## How I know I got it

- [ ] `npm run lint` completes without printing any issues, and there is not a single `eslint-disable` comment in all of `src/`.
- [ ] `npm run build` completes with `✓ built` and leaves an `index-CTkBRgQQ.js` file in `dist/assets/`, matching the course checkpoint filename (provided your project is byte-for-byte identical; if you changed text, the name changes and is not an error).
- [ ] With the practice server running, `curl` to `/api/servicios/pagos` takes around 1.5 s and responds with `200`, and `curl` to `/api/servicios/nada` responds with `404` and `{"detalle":"no existe el servicio nada"}`.
- [ ] With the dashboard open in `npm run dev` and two failures in the report, the tab reads `(2) Revisor`.
- [ ] Upon selecting `pagos` and immediately `inventario`, the box ends up displaying “Disponible: HTTP 200 en 118 ms”, and in the log the real request for `pagos` appears as `cancelada por el cliente`.
- [ ] In a copy without `key` and without `control.abort()`, you reproduced the race condition: the box ends up displaying “En falla: HTTP 503” beneath “inventario”. And you can explain why removing only `control.abort()` is not enough to see it.
- [ ] With the page open for twenty seconds and multiple clicks on the “Solo fallas” checkbox, the log records a `GET /api/estados 200` every ten seconds, and not one more.
- [ ] You can state, for each of the three Effects in the `revisor`, which external system it synchronizes with, what it does when starting, and what its cleanup undoes.
- [ ] You recorded in your [logbook](bitacora.md) the race condition you reproduced, the request loop produced by blindly obeying the linter, and what changed in how you read `useEffect`.

## Summary

Answer without looking at the lesson:

1. What two functions does an Effect have and what does each do? Why does the documentation urge thinking from the perspective of the Effect rather than the component?
2. What is a response race condition? Why can the response for `pagos` arrive after `inventario`, even if requested earlier?
3. What is the difference between aborting a request and ignoring its result? What does the server see in each case?
4. Why does the `revisor` reset details with a `key` rather than a `setState` inside the Effect? What does the linter say if you try?
5. What does `StrictMode` do with an Effect in development, and what is the rule to know whether your Effect passes that test?
6. Why did adding `alRecibir` to the list leave the linter green while the panel requested a report every 300 ms? What role does `Object.is` play?
7. What does `useEffectEvent` do, where can it be called, and why can it not be used to remove `cadaMs` from the list?
8. Give two examples of code that should not be in an Effect and state where each belongs.

## Further reading

- [React, “Synchronizing with Effects”](https://react.dev/learn/synchronizing-with-effects): what an Effect is, cleanup, why `StrictMode` mounts twice in development, response race conditions, and the purchase example that does not belong in an Effect. Consulted on October 21, 2026.
- [React, “Lifecycle of Reactive Effects”](https://react.dev/learn/lifecycle-of-reactive-effects): starting and stopping synchronization, thinking from the Effect's perspective, reactive values, “you cannot choose your dependencies”, and why the linter is not silenced. Consulted on October 21, 2026.
- [React, “Separating Events from Effects”](https://react.dev/learn/separating-events-from-effects): reactive vs. non-reactive logic, Effect Events, and their limitations. Consulted on October 21, 2026.
- [React, “Removing Effect Dependencies”](https://react.dev/learn/removing-effect-dependencies): functions and objects as dependencies, the list that describes code, and strategies for removing dependencies. Consulted on October 21, 2026.
- [React, “You Might Not Need an Effect”](https://react.dev/learn/you-might-not-need-an-effect): computing during rendering, resetting state with `key`, requests triggered by events, and race conditions during data fetching. Consulted on October 21, 2026.
- [React, “useEffect”](https://react.dev/reference/react/useEffect): signature, dependency comparison with `Object.is`, `StrictMode`'s extra cycle, and the limitations of manual data fetching. Consulted on October 21, 2026.
- [React, “useEffectEvent”](https://react.dev/reference/react/useEffectEvent): what it does, its limitations, and warnings against using it to hide dependencies. Consulted on October 21, 2026.
- [React, “React 19.2”](https://react.dev/blog/2025/10/01/react-19-2): the `useEffectEvent` announcement on October 1, 2025, and the need for a recent linter version. Consulted on October 21, 2026.
- [React, “Preserving and Resetting State”](https://react.dev/learn/preserving-and-resetting-state): `key` as part of position and state destruction upon component removal. Consulted on October 21, 2026.
- [React, “set-state-in-effect”](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect): what the rule rejects and why. Consulted on October 21, 2026.
- [React, “<title>”](https://react.dev/reference/react-dom/components/title): the React 19 `<title>` component, hoisted to `<head>`, and the warning against rendering two simultaneously. Consulted on October 21, 2026.
- [MDN, “AbortController: abort() method”](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort): what `abort()` interrupts and the `AbortError` exception. Consulted on October 21, 2026.
- [MDN, “Document: title property”](https://developer.mozilla.org/en-US/docs/Web/API/Document/title): reading and updating document title. Consulted on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| Effect | code that runs after rendering to synchronize a component with something outside React: a server, the document, a timer |
| cleanup | the function returned by an Effect; undoes what the Effect started, before the next cycle and upon component removal |
| Effect cycle | starting synchronization and, later, stopping synchronization; repeats whenever anything in the list changes |
| dependencies | the list of reactive values used by the Effect; describes the code, not chosen by hand |
| reactive value | a prop, state, or any value calculated inside the component that can change between renders |
| response race condition | two in-flight requests that arrive in a different order than sent, where the older one overwrites the newer one |
| `AbortController` | browser object that allows cancelling a `fetch` request from the outside via its signal |
| stale value | the value from an earlier render that an Effect continues using because its list omitted it |
| Effect Event | function created with `useEffectEvent`: called from an Effect, always sees the freshest values, and does not go in the dependency list |

---

**Next:** [Lesson 4 — Server State with TanStack Query](04-estado-del-servidor.md)
