# Lección 5 — Rutas y la URL como estado

*Son las 23:10 y estás de guardia. A las 23:04 empezó a fallar `pagos`, y la persona de operación que lleva la incidencia te escribe por el chat: «¿me pasas el panel ya filtrado, nada más con lo que falla?». Le pegas la dirección que tienes en el navegador. Ella la abre y ve los cuatro servicios, sin filtro, porque la casilla «Solo fallas» vivía en la memoria de tu pestaña y no en la dirección. Le explicas por escrito: «marca la casilla, luego haz clic en pagos». Lo hace, ve el detalle, y para tener datos frescos presiona F5. El navegador le responde con una página de error del servidor: `404 File not found`. A las 23:12 te llama para preguntarte si el panel también se cayó. No se cayó. Le faltaban dos cosas: una dirección que diga lo que estás viendo y un servidor que sepa qué contestar cuando alguien recarga esa dirección. Esta lección construye las dos.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 5.2 y 5.3)

**Qué construyes:** el `revisor` con tres pantallas que se pueden enlazar: la lista en `/`, el detalle de cada servicio en `/servicios/:nombre` y una página «no encontrada» para cualquier otra dirección; los filtros «Solo fallas» y «Buscar por nombre» viajan en la dirección (`?fallas=1&q=pag`), y las notas sobreviven al ir y venir entre pantallas; y si una página se rompe al dibujarse, el panel muestra su propio aviso y no una página de error en inglés

**Qué aprendes:** rutas como objetos con `createBrowserRouter`, anidadas con `<Outlet />`; parámetros de ruta con `useParams` y de búsqueda con `useSearchParams`; un filtro que se comparte copiando el enlace; `Link` y `NavLink`; el límite de error de una ruta con `ErrorBoundary` y `useRouteError`; **qué pasa cuando alguien recarga una ruta del cliente y por qué el servidor debe responder `index.html`**

**De dónde vienes.** De la [Lección 4](04-estado-del-servidor.md). Tu `revisor` ya trae los datos con TanStack Query: el reporte se pide con `useQuery`, se guarda en caché, se actualiza en segundo plano cada 10 segundos y tiene sus cuatro estados más uno (cargando, error, vacío, con datos, y datos viejos con aviso). El detalle de un servicio aparece debajo de la lista, en un `PanelDetalle`, cuando haces clic en su nombre, y el botón «Volver a revisar» es una mutación que invalida el reporte y el detalle. Todo eso vive en una sola pantalla, gobernada por el componente `Panel`, que guarda tres estados con `useState`: `soloFallas`, `seleccionado` y `notas`. Partes del punto de control [`programas/04-estado-del-servidor/revisor/`](../programas/04-estado-del-servidor/revisor).

**Qué no hace esta lección.** No toca el servidor de práctica: sigue en su versión C, la misma de la lección 4, con las mismas rutas. No usa los *loaders* ni las *actions* de React Router: los datos los sigue trayendo TanStack Query, por razones que se explican en 5.1. No mueve las notas a un contexto de React: suben un nivel, a la disposición de las rutas, y la [Lección 6](06-reducer-contexto.md) discute si ese es su lugar definitivo. No agrega la pantalla de alta, que llega con su ruta `/servicios/nuevo` en la [Lección 7](07-formularios-accesibilidad.md). No prueba las rutas con un enrutador en memoria dentro de una suite: eso es la [Lección 8](08-pruebas-de-componentes.md), aunque las figuras de esta lección ya usan ese enrutador. Y no escribe el servidor que publica `dist/` con reescritura: esta lección demuestra por qué hace falta; la [Lección 9](09-rendimiento-publicacion.md) lo escribe.

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas del `package.json` de esta lección, y con Python 3.12 para el servidor estático de 5.3. El punto de control se instaló desde cero con `npm ci`; `npm run lint` y `npm run build` terminaron bien y produjeron `dist/assets/index-CLDgPzLo.js`, el mismo nombre que dio el punto de control al verificarse en un contenedor Linux (Debian 12, imagen `node:24.22.0-bookworm`). No se corrió en una Linux Mint real; nada de lo que se muestra depende del sistema. `npm ci` imprime en macOS un aviso de `install-scripts` sobre `fsevents@2.3.3`: es una dependencia opcional que solo se instala en macOS para vigilar archivos, no hace falta aprobarla y en tu Mint no aparecerá. Lo que se ve «en el navegador» se midió con Chrome sin ventana (`--headless --dump-dom`) contra `vite preview`, con la opción `--virtual-time-budget`, que adelanta los relojes de la página para no esperar de verdad: por eso las horas de la bitácora del servidor de práctica (en UTC) no sirven para medir demoras en esta lección, solo para contar peticiones. Las corridas del límite de error (5.1.6, ejercicio 3) y las de `curl` de 5.3 se hicieron con la API de práctica en el puerto 3199 y con `vite preview` y el servidor de Python en el 4199, porque en la máquina de las corridas los puertos de siempre estaban ocupados por otros procesos; la lección las muestra con los puertos del curso (3100, 4173 y 4190), que es lo único que cambia. Las figuras se ejecutaron con su propio `package.json` en [`programas/05-rutas-url-como-estado/`](../programas/05-rutas-url-como-estado), junto a `revisor/`; las rutas largas se muestran a partir de `~/curso-react`.

## Al terminar vas a poder

- Declarar las rutas de una aplicación como un arreglo de objetos (`RouteObject[]`), anidarlas bajo una disposición con `<Outlet />` y predecir qué componente dibuja cada dirección, incluida una que no existe.
- Leer un parámetro de ruta con `useParams`, explicar por qué TypeScript lo tipa como `string | undefined` y comprobar que llega decodificado (`cat%C3%A1logo` → `catálogo`).
- Guardar filtros en la dirección con `useSearchParams`, explicar con una figura la diferencia entre `replace: true` y una navegación normal para el botón «Atrás», y compartir un filtro copiando el enlace.
- Usar `Link` y `NavLink`, y señalar en el HTML el `aria-current="page"` y la clase `active` que pone `NavLink`.
- Explicar por qué un componente de ruta conserva su estado cuando solo cambia el parámetro, y reiniciarlo con `key`.
- Explicar por qué el `LimiteDeError` de la lección 4 deja de ver los errores de las páginas cuando entra el enrutador, provocar el `Unexpected Application Error!` y declarar un `ErrorBoundary` en la ruta raíz que muestre el mismo aviso.
- Demostrar con `curl` que un servidor estático sin reescritura responde 404 al recargar `/servicios/pagos`, y que `vite preview` responde `index.html`.

## El porqué antes del cómo

El `revisor` de la lección 4 funciona, pero tiene **una sola dirección**: `http://localhost:5173/`. Todo lo demás —si estás filtrando, qué servicio elegiste, qué nota escribiste— vive dentro de la pestaña, en el estado de `Panel`. Pregúntale a esa pantalla cuatro cosas y verás los huecos.

**¿Puedes mandar lo que estás viendo?** No. La dirección siempre es la misma, así que quien la abre ve la lista completa, sin filtro y sin ningún servicio elegido. Para «mandar» una vista tienes que mandar instrucciones. Es la escena del principio.

**¿Funciona el botón «Atrás»?** Tampoco. Si eliges `pagos` y luego `inventario`, y presionas «Atrás», el navegador no regresa a `pagos`: sale del panel, porque para él nunca hubo más de una página. La persona usa el botón que más usa en la vida y la aplicación hace algo que no esperaba.

**¿Qué pasa si recargas?** Se pierde todo lo que no estaba en la dirección: el filtro y el servicio elegido vuelven a su valor inicial. En una pantalla de guardia, donde recargar es un reflejo, eso significa volver a hacer clics cada vez.

**¿Cómo crece?** En la lección 7 llega una pantalla de alta. Con una sola dirección, `Panel` tendría que decidir con más y más `if` qué dibujar, y cada pantalla nueva sería otra rama de estado que alguien olvida reiniciar.

Las cuatro preguntas tienen la misma respuesta: **lo que la persona está viendo tiene que estar escrito en la dirección.** La dirección es estado, igual que un `useState`, con tres ventajas que ningún `useState` tiene: se puede copiar, el navegador guarda su historia (por eso existe «Atrás») y sobrevive a una recarga. Y tiene una consecuencia que es fácil olvidar: si la dirección `/servicios/pagos` se puede copiar, alguien la va a pegar en un navegador recién abierto, y ese navegador se la va a pedir **al servidor**, que nunca oyó hablar de `pagos`.

La herramienta para lo primero es un **enrutador**: una pieza que lee la dirección, decide qué componentes dibujar y cambia la dirección sin recargar la página cuando la persona navega. El curso usa **React Router**, en su versión 8.5.0, y lo instala como un solo paquete, `react-router`: la versión 8 dejó de publicar `react-router-dom`, el paquete que verás en tutoriales viejos, y las piezas propias del navegador se importan ahora de `react-router/dom` ([React Router, «Upgrading from v7»](https://reactrouter.com/upgrading/v7)). La misma guía fija lo que pide: Node 22.22 o superior y React 19.2.7 o superior; el curso usa Node 24 y React 19.3.1. Para lo segundo no hace falta ninguna librería, sino entender qué le pide el navegador al servidor y qué debe responder; eso es 5.3.

La lección tiene tres partes, una por concepto: las rutas como objetos, la disposición que las envuelve y el límite de error que las protege (5.1); los parámetros y la búsqueda, es decir, la dirección como estado (5.2); y la recarga de una ruta del cliente (5.3). Al final, esto es lo que dibuja el `revisor` cuando abres `http://localhost:4173/?fallas=1` en un navegador nuevo, sin haber hecho un solo clic (se muestra el título y el contenedor, tal como los entregó Chrome sin ventana):

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox" checked=""> Solo fallas</label><label>Buscar por nombre <input type="search" value=""></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="falla"><a href="/servicios/pagos" data-discover="true">pagos</a>: falla (HTTP 503)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul><p class="actualizado">Actualizado a las 2:14:52 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

La casilla llega marcada (`checked=""`) y la lista trae solo `pagos` y `reportes`. Nadie la marcó: la marcó la dirección.

## Los conceptos

### 5.1 Las rutas son objetos, y la disposición las envuelve

#### 5.1.1 Instalar el enrutador, y en qué modo usarlo

Desde `~/curso-react/revisor/`, con la versión exacta que fija el curso:

```bash
npm install --save-exact react-router@8.5.0
```

El `package.json` del punto de control queda así; cambian la versión, que sigue a la lección, y la dependencia nueva:

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

React Router se puede usar de tres maneras, que su documentación llama **modos** y que se apilan una sobre otra ([React Router, «Picking a Mode»](https://reactrouter.com/start/modes)). En el **modo declarativo**, envuelves la aplicación en un `<BrowserRouter>` y escribes las rutas como componentes dentro del árbol. En el **modo de datos**, declaras las rutas **fuera** de React, como un arreglo de objetos que le das a `createBrowserRouter`, y las dibujas con `<RouterProvider>`; a cambio ganas *loaders*, *actions* y estados de navegación. Y el **modo framework** envuelve al de datos con un complemento de Vite que agrega convenciones de archivos, división de código y dibujo en el servidor.

El curso usa el modo de datos, pero no sus *loaders*. La razón de lo primero es práctica: un arreglo de objetos se puede **exportar**, y la lección 8 monta ese mismo arreglo en un enrutador en memoria para probar las pantallas sin navegador; las figuras de esta lección ya lo hacen. La razón de lo segundo es que el `revisor` ya resolvió en la lección 4 cómo traer datos: TanStack Query guarda el caché, actualiza en segundo plano y comparte una consulta entre pantallas. Meter además los *loaders* daría dos sistemas responsables de lo mismo. Es un criterio del curso, no una regla de React Router; en una aplicación sin una librería de datos, los *loaders* son una buena respuesta. Y el modo framework queda fuera por la misma razón que la lección 9 discute al hablar de frameworks: el curso quiere que veas cada pieza.

#### 5.1.2 Las rutas del `revisor`

Este es el archivo nuevo más importante de la lección. Es un arreglo de objetos, y cada objeto dice **qué dirección** y **qué componente**:

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

Léelo de afuera hacia adentro, porque así lo lee React Router:

- **La ruta de afuera**, `path: "/"`, dibuja `Disposicion`: el encabezado, la navegación y el lugar donde va la página. Todas las demás rutas son sus **hijas** (`children`), así que la disposición se dibuja siempre, sea cual sea la página. La documentación lo dice así: la ruta del padre se agrega automáticamente a la de cada hija, y las hijas se dibujan en el `<Outlet />` del padre ([React Router, «Routing»](https://reactrouter.com/start/data/routing)).
- **La ruta índice**, `index: true`, no tiene `path`: es la página que se dibuja en el `<Outlet />` cuando la dirección es exactamente la del padre, `/`. Es el reporte.
- **`servicios/:nombre`** no empieza con `/` porque es relativa al padre: la dirección completa es `/servicios/:nombre`. Los dos puntos marcan un **segmento dinámico**: cuando la dirección coincide, lo que haya en esa posición se entrega como el parámetro `nombre`.
- **`*`** coincide con cualquier cosa que ninguna hermana atrapó. Es la página «no encontrada».
- **`ErrorBoundary: ErrorDeRuta`** no es una dirección: dice qué dibujar si algo de esta ruta, o de sus hijas, se rompe al dibujarse. Es la última pieza de 5.1, y tiene su propia sección, la 5.1.6.

Fíjate en que las rutas usan `Component: PaginaReporte` y no `element: <PaginaReporte />`. Las dos formas existen; con `Component` le pasas el componente y React Router lo dibuja cuando hace falta, sin crear elementos de antemano. Es la forma que usan los ejemplos actuales de la documentación.

¿Y el orden? Podrías pensar que `*` tiene que ir al final para no «tragarse» a las demás. No hace falta: React Router no prueba las rutas en el orden en que las escribiste, sino que las **clasifica** por qué tan específicas son: un segmento fijo gana a uno dinámico, y uno dinámico gana a `*`. La página de la documentación que debería explicar el algoritmo, [«Route Matching»](https://reactrouter.com/explanation/route-matching), está vacía en esta versión (consultada el 21 de octubre de 2026), así que se comprobó a mano: con la función `matchRoutes` de `react-router` y tres rutas declaradas al revés (`*`, luego `servicios/:nombre`, luego `servicios/nuevo`), `/servicios/nuevo` eligió la fija, `/servicios/pagos` la dinámica y `/otra` el comodín. Aun así, el curso las escribe de la más específica a la menos, porque así se leen mejor. La lección 7 agrega `servicios/nuevo` justo antes de `servicios/:nombre` por la misma razón.

La primera figura comprueba esas cuatro reglas sin navegador. Arma un árbol de rutas con la misma forma que el del `revisor`, con componentes que solo escriben qué son, y lo dibuja con `createMemoryRouter`, el hermano de `createBrowserRouter` que guarda la dirección en memoria en lugar de leerla de la barra del navegador:

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

Cinco direcciones, cinco respuestas, y en las cinco aparece `[disposición]`: la ruta de afuera siempre se dibuja. El tercer renglón adelanta algo de 5.2: la dirección traía `cat%C3%A1logo`, codificada, y el parámetro llegó como `catálogo`. Los dos últimos muestran que un segmento dinámico es **exactamente un segmento**: `/servicios` (le falta) y `/servicios/pagos/extra` (le sobra) no coinciden con `servicios/:nombre`, y los atrapa `*`.

#### 5.1.3 Crear el enrutador una sola vez, fuera de React

El arranque cambia poco. `Panel` desaparece de `main.tsx` y en su lugar entra el enrutador:

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

Dos detalles importan. El primero: **`createBrowserRouter(rutas)` se llama una sola vez, al cargar el módulo, fuera de cualquier componente.** La documentación es explícita: los enrutadores de datos no se guardan en el estado de React; se crean una vez fuera del árbol y se le pasan a `<RouterProvider>` ([React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter)). Si lo crearas dentro de un componente, cada dibujo de ese componente crearía un enrutador nuevo, que empezaría de cero. Es la misma idea que la lección 0 cuidó con `cargarReporte`: lo que debe ser siempre lo mismo se declara a nivel de módulo. Y fíjate en de dónde viene cada pieza: `createBrowserRouter` de `react-router`, y `RouterProvider` de `react-router/dom`, como indica la guía de instalación del modo de datos ([React Router, «Installation»](https://reactrouter.com/start/data/installation)).

El segundo detalle es el **orden de los envoltorios**. El caché de TanStack Query vive en el objeto `clienteConsultas`, que `main.tsx` crea una sola vez; `QueryClientProvider` solo lo pone al alcance de los componentes que tiene debajo. Al ponerlo **afuera** de `RouterProvider`, todas las páginas lo alcanzan: cuando vas de la lista al detalle, `PaginaReporte` desaparece, pero el reporte sigue en el caché, y al volver la lista puede dibujarse con esos datos mientras Query decide si hace falta pedirlos otra vez (lo que la lección 4 llamó `staleTime`). Si pusieras el proveedor dentro de `PaginaReporte`, `PaginaServicio` quedaría sin cliente y su `useQuery` lanzaría un error. Y si además crearas el cliente dentro de la página, el caché sí moriría cada vez que la página se desmonta.

¿Qué significa «dibujar con el enrutador del navegador»? `createBrowserRouter` cambia la dirección con `history.pushState` y `history.replaceState`, dos funciones del navegador que cambian lo que dice la barra de direcciones **sin pedirle nada al servidor**. MDN lo dice así de `pushState`: el navegador no intentará cargar esa dirección después de la llamada, aunque puede intentar cargarla más tarde, por ejemplo después de reiniciarse ([MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)). Guarda esa frase, «puede intentar cargarla más tarde», porque toda la sección 5.3 trata de ella.

#### 5.1.4 La disposición y el `<Outlet />`

La disposición es el componente de la ruta de afuera. Dibuja lo que no cambia entre páginas y deja un hueco para lo que sí:

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

El `<Outlet />` es ese hueco. Cuando la dirección es `/`, ahí se dibuja `PaginaReporte`; cuando es `/servicios/pagos`, `PaginaServicio`. El encabezado y la navegación no se vuelven a montar al cambiar de página: siguen siendo los mismos componentes, con el mismo estado. Y eso es justo lo que se aprovecha con las notas.

En la lección 2 las notas vivían en `Panel`, junto a la lista y al detalle, porque los dos las necesitaban. Ahora la lista y el detalle son **páginas distintas**, y cuando navegas de una a otra, la primera se desmonta. Si las notas siguieran en `PaginaReporte`, escribirías una nota en el detalle de `pagos`, volverías a la lista y la marca «con nota» no estaría, porque el estado de la lista se destruyó al salir y se creó vacío al volver. La regla de la lección 2 sigue valiendo, solo que con un nivel más: **el estado sube hasta el antepasado común más cercano de quienes lo usan**, y el antepasado común de las dos páginas es la disposición.

Para bajar el valor a las páginas, `<Outlet>` acepta una propiedad `context`, y las páginas la leen con el hook `useOutletContext`. La documentación lo presenta justo para este caso: las rutas padre a menudo manejan estado que quieren compartir con sus hijas, y es tan común que viene integrado en `<Outlet>`, sin que tengas que crear un contexto propio ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)). La misma página recomienda que, con TypeScript, el padre ofrezca **un hook propio** para leerlo, porque así quienes lo consumen tienen el tipo correcto y se sabe quién lo usa. Eso es `contextoNotas.ts`:

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

`useNotas()` es el único lugar del código que llama a `useOutletContext`, y el único que le dice a TypeScript qué forma tiene ese valor. Las páginas importan `useNotas` y no saben de dónde salen las notas. Si en la lección 6 las notas cambiaran de lugar, solo cambiaría este archivo.

Una observación honesta sobre `Disposicion`: el objeto `contexto` y la función `guardarNota` se crean de nuevo en cada dibujo. Eso significa que cada vez que la disposición se vuelve a dibujar, la página que lee el contexto también. No es un problema que se haya medido, y el curso no memoiza sin una medición que lo pida; la lección 9 enseña a medirlo.

#### 5.1.5 La página «no encontrada»

La ruta `*` dibuja esta página:

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

`useLocation()` entrega la dirección actual; de ella solo interesa `pathname`, para decirle a la persona qué dirección no existe. La página se dibuja **dentro** de la disposición, así que el encabezado y la navegación siguen ahí: la persona tiene por dónde salir. Y pone su propio título con el hook de la lección 3. Esto es lo que entregó Chrome para `/no-existe`:

```text
<title>Página no encontrada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Página no encontrada"><h2>Página no encontrada</h2><p>No existe ninguna página en /no-existe.</p><p><a href="/" data-discover="true">Ir al reporte</a></p></section></main></div>
```

#### 5.1.6 Cuando una página se rompe: el límite de error de las rutas

Hay otra clase de «página que no funciona», y conviene distinguirla de la anterior: la que **existe** pero lanza un error al dibujarse. En la lección 4 escribiste `LimiteDeError` justo para eso: envolvía al `Panel`, y si algo se rompía al dibujar, en lugar de una pantalla en blanco aparecía un aviso con el mensaje y un botón para recargar. En `main.tsx` sigue ahí, ahora alrededor de `RouterProvider`. Parece que nada cambió. Cambió, y la única forma de creerlo es verlo.

Para eso hace falta una página que se rompa. En una **copia** del punto de control, nunca en el original, agrega a `PaginaReporte`, justo después de `useTituloDocumento`, un error que se dispara desde la dirección:

```tsx
// en una copia: revisor/src/reporte/PaginaReporte.tsx (fragmento)
  if (filtros.texto === "romper") {
    throw new Error("la página se rompió al dibujar");
  }
```

Va después de los hooks, y no como primera línea del componente, por una razón que ya conoces: con un `throw` antes de `useQuery`, los hooks de abajo se llamarían «a veces», y `react-hooks/rules-of-hooks` lo rechaza con un error por hook (se midió: cuatro). Con `npm run build`, el servidor de práctica y `npm run preview` encendidos, abre `http://localhost:4173/?q=romper`. Esto entregó Chrome con el código que tenía el `revisor` antes de esta sección (la pila del error, diez renglones con direcciones de la máquina, se recorta con `…`):

```text
<title>Revisor</title>
<div id="raiz"><h2>Unexpected Application Error!</h2><h3 style="font-style: italic;">la página se rompió al dibujar</h3><pre style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);">Error: la página se rompió al dibujar
    at …</pre></div>
```

Ni rastro de `LimiteDeError`: ni su `role="alert"`, ni «Algo salió mal al dibujar el panel», ni el botón para recargar. En su lugar, una página en inglés, con la pila del error a la vista de cualquiera, que tu código nunca dibujó. Y con ella se fueron el encabezado y la navegación. Es lo que vería la persona de guardia de la escena, a las 23:10, si el panel tuviera un defecto.

La razón: React Router coloca **su propio límite de error en cada ruta**. Cuando una página lanza, React busca hacia arriba el límite más cercano, y el más cercano ya no es `LimiteDeError`: es el de React Router, que quedó entre tu límite y la página. La documentación lo explica así: los errores de una ruta se atrapan automáticamente y se dibuja el `ErrorBoundary` más cercano, y si una ruta no tiene el suyo, el error sube a la ruta padre ([React Router, «Error Boundaries»](https://reactrouter.com/how-to/error-boundary)). Si ninguna ruta declara uno, React Router dibuja el suyo por omisión, que es el que acabas de ver. El error nunca llega a `LimiteDeError`, porque alguien lo atrapó antes.

La figura 6 reproduce los dos casos sin navegador, con una disposición mínima y una página que lanza. Primero sin límite propio, y luego con uno en la ruta raíz que lee el error con `useRouteError`:

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

Tres cosas salen de esa corrida. Sin límite propio, en pantalla queda `Unexpected Application Error!` y no hay ningún `role="alert"`: un lector de pantalla no anuncia nada. Con el límite en la raíz, queda tu aviso, con su `role="alert"`. Y en los dos casos **el encabezado no está**, porque el límite de una ruta se dibuja **en lugar de** lo que esa ruta dibujaría, y aquí la ruta con límite es la de afuera, la que dibuja la disposición. (Los dos avisos de consola aparecen en ambos casos: atrapar un error no lo esconde de quien programa.)

El arreglo es declarar ese límite. La misma página de la documentación pide que toda aplicación tenga, como mínimo, uno en la ruta raíz. En el modo de datos se declara con la propiedad `ErrorBoundary` del objeto de ruta, y el componente lee el error con `useRouteError()`, porque no recibe propiedades. También existe `errorElement`, que recibe un elemento ya creado; es la misma diferencia que hay entre `Component` y `element`, y el curso usa `ErrorBoundary` por la misma razón que usa `Component`.

¿Y qué debe mostrar? Lo idiomático en el `revisor` es que muestre **el mismo aviso** que `LimiteDeError`. Para quien usa el panel, «algo se rompió al dibujar» es lo mismo venga de donde venga, y dos avisos distintos para lo mismo serían dos cosas que mantener. Para no escribir el aviso dos veces, la presentación sale de la clase a un componente propio:

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

`LimiteDeError` hace lo mismo que en la lección 4; solo delega el dibujo:

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

Y este es el límite de las rutas:

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

`useRouteError` entrega lo que se lanzó, y su tipo es `unknown`, no `Error`, porque en JavaScript se puede lanzar cualquier cosa: un texto, un número, un objeto. Por eso `describirError` pregunta antes de leer. La documentación distingue tres casos y `describirError` los sigue en el mismo orden: una respuesta de error de React Router, que se reconoce con `isRouteErrorResponse` y trae `status` y `statusText` (la lanzan los *loaders* y las *actions*; el `revisor` no los usa, así que hoy no llega ninguna, pero cubrirla cuesta tres líneas); un `Error`, con su `message`; y cualquier otra cosa. Fíjate en que `ErrorDeRuta` es un componente de **función**: la única clase del curso sigue siendo `LimiteDeError`, porque React Router ya escribió la clase por ti y te pide solo lo que se dibuja.

Lo último es conectarlo: la línea `ErrorBoundary: ErrorDeRuta` de `rutas.tsx`, que ya viste en 5.1.2. Con ella, la misma copia, reconstruida, entregó esto en `/?q=romper`:

```text
<title>Revisor</title>
<div id="raiz"><div role="alert" class="limite-de-error"><h2>Algo salió mal al dibujar el panel</h2><p>la página se rompió al dibujar</p><button type="button">Recargar la página</button></div></div>
```

Es el aviso de la lección 4, palabra por palabra, con su `role="alert"` y su botón. Y en la misma copia, `/?q=pag` siguió dibujando la lista con su encabezado: el límite solo aparece cuando algo se rompe. Dos detalles más. El título se quedó en `Revisor`, el de `index.html`: la página que lanzó nunca terminó de dibujarse, y su Effect de `useTituloDocumento` nunca llegó a ejecutarse. Y el encabezado desapareció, igual que en la figura 6: este límite es el último recurso, el que reemplaza todo. Si quieres que la persona conserve el encabezado y la navegación cuando se rompe **una** página, el límite tiene que estar más adentro; es el ejercicio 3.

¿Sobra entonces `LimiteDeError`? No. Los límites de ruta solo ven lo que se dibuja **dentro** de las rutas. Lo que está afuera, como `QueryClientProvider`, queda fuera de su alcance, y para eso sigue `LimiteDeError` en `main.tsx`. Cada uno cuida su piso, y los dos muestran el mismo aviso.

### 5.2 Parámetros y búsqueda: la dirección como estado

Una dirección tiene partes, y React Router entrega dos de ellas como datos. En `http://localhost:5173/servicios/pagos` la parte que importa es el **camino** (`/servicios/pagos`), y el segmento dinámico se lee con `useParams`. En `http://localhost:5173/?fallas=1&q=pag`, el camino es `/` y lo que viene después del `?` es la **búsqueda** (*query string*), que se lee con `useSearchParams`. Las dos son estado: cambian lo que se dibuja, y cambiarlas es navegar.

#### 5.2.1 El parámetro de ruta: `useParams`

El detalle de un servicio deja de ser un panel debajo de la lista y se vuelve una página. `PanelDetalle` desaparece, y en su lugar entra `PaginaServicio`:

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

La primera línea del componente es la que más hay que entender: `const { nombre = "" } = useParams();`. `useParams` devuelve los segmentos dinámicos de la dirección como un objeto; aquí, `{ nombre: "pagos" }` ([React Router, `useParams`](https://reactrouter.com/api/hooks/useParams)). Su tipo dice que cada valor es `string | undefined`, y no es pesimismo de TypeScript: el hook no sabe en qué ruta lo estás llamando, y un componente podría usarse en una ruta sin `:nombre`. El `= ""` le da un valor por omisión para que el resto del componente trabaje con un `string`. En «El error que vas a ver» vas a quitarlo para ver los cuatro errores que aparecen. En la práctica, esta página solo se dibuja en `servicios/:nombre`, así que `nombre` nunca llega vacío.

Con ese nombre, la página hace lo que hacía `PanelDetalle`: pide el detalle con la misma consulta de la lección 4, `consultaDetalle(nombre)`, cuya clave `["servicio", nombre]` distingue el caché de cada servicio, y ofrece la mutación «Volver a revisar». Lo nuevo es lo que ya no hace falta. En la lección 4, `ContenidoReporte` comprobaba que el servicio elegido existiera en la lista antes de mostrar su panel. Ahora cualquiera puede escribir `/servicios/nada` en la barra de direcciones, y la página no tiene una lista contra la cual comprobar. No hace falta: la API responde 404 para un servicio que no existe, `cargarDetalle` lo convierte en error, y la página muestra la alerta. Así lo entregó Chrome:

```text
<title>nada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio nada"><h2>Servicio nada</h2><p role="alert">No se pudo cargar el detalle: la API respondió 404</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

Y así lo vio la bitácora del servidor de práctica:

```text
08:15:01.057 GET /api/servicios/nada 404
08:15:01.263 GET /api/servicios/nada 404
08:15:01.468 GET /api/servicios/nada 404
```

Tres peticiones para una sola visita. No es `StrictMode`, porque esto es la versión construida, donde no hay ciclo extra: es el `retry: 2` que la lección 4 configuró en el cliente de consultas, que reintenta **cualquier** error, también un 404 que nunca va a cambiar. (Las horas están apretadas por el reloj adelantado de Chrome; con un navegador normal, los reintentos llegan espaciados.) Es una decisión que se puede afinar —reintentar solo cuando el error lo merece—, pero no es tema de esta lección; anótalo en tu bitácora como algo que viste.

#### 5.2.2 Codificar al escribir, decodificar al leer

El servicio `catálogo` tiene una `á`. En una dirección, los caracteres fuera de un conjunto pequeño viajan **codificados por porcentaje**: la `á` son dos bytes en UTF-8, que se escriben `%C3%A1`. Quien arma la dirección codifica; quien la lee, decodifica. En el `revisor` hay tres momentos:

1. `FilaEstado` arma el enlace con `encodeURIComponent(estado.nombre)`, que convierte `catálogo` en `cat%C3%A1logo`. Se usa `encodeURIComponent` y no `encodeURI` porque codifica también los caracteres que tienen significado en una dirección, como `/`, `?` y `#` ([MDN, `encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)). Si algún día un servicio se llamara `a/b`, sin codificar la dirección sería `/servicios/a/b`, que es otro camino, y caería en «no encontrada».
2. `useParams` entrega el parámetro **ya decodificado**. Lo viste en la figura 1: `cat%C3%A1logo` llegó como `catálogo`. La documentación del hook no lo dice con esas palabras; lo dice la corrida, y por eso la figura existe.
3. `cargarDetalle`, desde la lección 3, vuelve a codificar el nombre para pedírselo a la API. La bitácora lo confirma: `GET /api/servicios/cat%C3%A1logo 200`.

Codificar dos veces seguidas sería un error (`%C3` se volvería `%25C3`), y no codificar ninguna también. La regla es simple: **el texto que viaja dentro de una dirección se codifica justo al meterlo y se decodifica justo al sacarlo**, y en medio se trabaja con el texto normal. Así lo dibujó Chrome al abrir `/servicios/cat%C3%A1logo`:

```text
<title>catálogo · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio catálogo"><h2>Servicio catálogo</h2><dl><dt>Estado</dt><dd>Disponible: HTTP 200 en 42 ms</dd><dt>Revisiones</dt><dd>2</dd><dt>Última revisión</dt><dd>2026-10-21T08:14:55.465Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre catálogo<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

#### 5.2.3 La misma página, otro parámetro: por qué `key={nombre}`

En la lección 3, `<PanelDetalle key={seleccionado}>` reiniciaba todo el panel al cambiar de servicio. En `PaginaServicio` la `key` está más abajo, en `<EditorNota key={nombre}>`. ¿Hace falta? Para contestarlo hay que saber qué hace React Router cuando la dirección pasa de `/servicios/pagos` a `/servicios/inventario`: **la ruta es la misma** (`servicios/:nombre`), así que el componente que la dibuja es el mismo, en la misma posición del árbol. React no ve una página nueva; ve la misma `PaginaServicio` con otro parámetro. Y la documentación de React es clara sobre lo que eso significa: el mismo componente en la misma posición conserva su estado ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

La figura 2 lo muestra con un componente que, como `EditorNota`, inicia su estado a partir de una propiedad. Navega de `pagos` a `inventario` dos veces: sin `key` y con ella.

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

Sin `key`, la dirección dice `inventario` pero el borrador sigue hablando de `pagos`: `useState` solo usa su valor inicial la primera vez que el componente se monta, y aquí no se volvió a montar. Con `key={nombre}`, React trata cada nombre como un componente distinto, destruye el viejo y crea uno nuevo. En el `revisor`, sin esa `key`, el borrador de la nota de `pagos` aparecería en la página de `inventario`, listo para guardarse en el servicio equivocado.

¿Y por qué la `key` está en `EditorNota` y no en toda la página? Porque lo único que guarda estado propio es el borrador. La consulta del detalle no necesita reiniciarse: su clave incluye el nombre, así que al cambiar el nombre TanStack Query cambia de entrada de caché por sí solo. Y hoy, honestamente, la interfaz del `revisor` no ofrece un camino directo de un detalle a otro: siempre pasas por la lista, y eso desmonta la página. La `key` protege contra el día en que alguien agregue un enlace «servicio siguiente», y es tan barata que no vale la pena esperar a ese día para ponerla.

#### 5.2.4 Los filtros en la búsqueda: `useSearchParams`

Los filtros son el caso de libro de «estado que debe vivir en la dirección»: describen lo que estás viendo, y alguien más querrá ver lo mismo. El plan del curso los pone en la búsqueda, con dos parámetros: `fallas=1` para «Solo fallas» y `q=texto` para «Buscar por nombre». Primero, el tipo y la función pura que filtra, en `resumen.ts`:

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

`Filtros` junta los dos filtros en un objeto, y `filtrarEstados` aplica los dos a la vez: un servicio pasa si cumple «solo fallas» (o el filtro está apagado) **y** si su nombre contiene el texto buscado (o no se busca nada). La búsqueda ignora mayúsculas y espacios de los extremos, y usa `toLocaleLowerCase("es-MX")` para que la comparación siga las reglas del español. Sigue siendo una función pura: mismas entradas, misma salida, y la lección 8 la prueba sin React.

Ahora la pieza nueva, el hook que traduce entre la dirección y los filtros:

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

`useSearchParams` devuelve dos cosas, igual que `useState`: los parámetros actuales, como un objeto `URLSearchParams` del navegador, y una función para cambiarlos que **provoca una navegación** a la dirección nueva ([React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams)). `URLSearchParams` es una interfaz estándar con métodos para leer y escribir la búsqueda; su `get` devuelve `null` cuando el parámetro no está ([MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)). Cinco decisiones de este archivo merecen su propio renglón:

- **Los filtros se calculan, no se guardan.** No hay un `useState` con los filtros que se «sincronice» con la dirección: cada dibujo los lee de la dirección. Es la regla de la lección 2, «no guardes lo que puedes calcular», aplicada a una fuente de verdad nueva. Si hubiera un `useState` además de la dirección, tendrías dos verdades que pueden discrepar, y la tentación de mantenerlas de acuerdo con un Effect, que es justo lo que el primer criterio del curso prohíbe.
- **`fallas` vale `"1"` o no existe.** La lectura es `parametros.get("fallas") === "1"`, y al apagar el filtro se **borra** el parámetro en lugar de escribir `fallas=0`. Lo mismo con `q` vacío. Así la dirección sin filtros es `/`, limpia, y no `/?fallas=0&q=`.
- **La función que cambia recibe solo lo que cambió.** `cambiarFiltros({ soloFallas: true })` no toca el texto, porque `{ ...filtros, ...cambio }` mezcla el cambio con lo que ya había. Por eso el tipo es `Partial<Filtros>`.
- **Se copia en vez de mutar.** La forma con función, `establecerParametros((actuales) => …)`, recibe los parámetros actuales; el código crea una copia con `new URLSearchParams(actuales)` y cambia la copia. La documentación advierte que el objeto que entrega el hook es mutable, y que si lo cambias sin llamar a la función de cambio, sus valores cambian entre dibujos sin que la dirección lo refleje. Copiar evita esa trampa y conserva cualquier otro parámetro que la dirección traiga. La misma página advierte otra diferencia con `useState`: dos llamadas seguidas en el mismo instante **no** se encadenan como lo haría la forma actualizadora de React. En el `revisor` cada evento llama una sola vez, así que no muerde.
- **`replace: true`.** Es la decisión que más se nota, y tiene figura propia.

#### 5.2.5 `replace: true`: escribir en la dirección sin llenar la historia

Cada vez que cambias la dirección con `pushState`, el navegador agrega una entrada a su historia, y «Atrás» regresa a la anterior. Para pasar de la lista al detalle eso es justo lo que quieres. Para un cuadro de búsqueda, no: cada tecla cambia `q`, y si cada tecla fuera una entrada, escribir `pagos` crearía cinco, y la persona tendría que presionar «Atrás» cinco veces para salir de la lista. Con `replace: true`, el cambio **reemplaza** la entrada actual en lugar de agregar otra: es `replaceState`, que MDN describe como la función que modifica la entrada actual de la historia ([MDN, `History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)). La documentación de `Link` lo dibuja con letras: con una historia `A → B`, un enlace normal deja `A → B → C`; con `replace`, `A → C` ([React Router, `Link`](https://reactrouter.com/api/components/Link)).

La figura 3 lo mide. Empieza en la lista, después de haber visto el detalle de `pagos` (una historia de dos entradas), teclea `p`, `pa` y `pag` en un buscador como el del `revisor`, y presiona «Atrás». Lo hace dos veces: con navegación normal y con `replace: true`.

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

Con navegación normal, cada tecla fue un `PUSH`, y «Atrás» te deja en `/?q=pa`: deshace una letra. Con `replace: true`, cada tecla fue un `REPLACE`, y «Atrás» te regresa al detalle de `pagos`, que es a donde la persona quería volver. La dirección es la misma en los dos casos; lo que cambia es la historia. Dos notas sobre la figura: React DOM se importa **después** de crear el DOM de prueba, porque decide al cargarse si hay un navegador, y sin eso los eventos de teclado no llegan a `onChange` (las figuras 1, 2 y 5 no disparan eventos, solo dibujan y leen texto, y por eso pueden importarlo arriba); y la figura escribe en el campo con el `set` del prototipo de `HTMLInputElement` para que React note el cambio, que es lo que la lección 8 va a hacer por ti con `user-event`.

Es un criterio, no una ley: en el `revisor`, «Solo fallas» también reemplaza. Podrías defender que marcar la casilla sí merece su propia entrada en la historia; el curso eligió tratar los dos filtros igual, como un solo «cómo estoy mirando la lista», y que «Atrás» signifique «a la pantalla anterior».

¿Y los espacios? Si buscas `pago s` (con espacio), `URLSearchParams` escribe el espacio como `+`: MDN explica que codifica por porcentaje lo necesario y el espacio como `+`, y que al leer interpreta el `+` como espacio. No tienes que hacer nada: el hook escribe y lee con las mismas reglas. Solo no te sorprendas si ves `?q=pago+s` en la barra.

#### 5.2.6 El reporte, ahora como página

`Panel` desaparece y su lugar lo toma `PaginaReporte`. Ya no tiene ningún `useState`: la consulta es la misma de la lección 4, los filtros salen de la dirección y las notas, de la disposición.

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

`cadaMs` ya no llega como propiedad desde `main.tsx`: la página lo importa de `configuracion.ts`, porque `main.tsx` ya no dibuja páginas, dibuja el enrutador. El resto se reparte así:

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

`ContenidoReporte` pierde tres propiedades (`seleccionado`, `alSeleccionar`, `alGuardarNota`) y el panel de detalle: ya no le toca. Sus cuatro estados más uno siguen idénticos. Recibe los filtros como un objeto y se los pasa a `filtrarEstados`. Fíjate en un detalle que se ve en la salida de Chrome para `/?q=inv`: el resumen dice `4 servicios revisados · 2 servicios con falla` aunque la lista muestre un solo servicio. Es a propósito: `ResumenFallas` recibe `estados`, todos, y no los filtrados. El resumen describe el reporte; el filtro solo decide qué renglones ves.

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox"> Solo fallas</label><label>Buscar por nombre <input type="search" value="inv"></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li></ul><p class="actualizado">Actualizado a las 2:14:55 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

El filtro gana un segundo campo:

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

Los dos campos son **controlados**: su valor sale de `filtros`, que sale de la dirección, y cada cambio pide una dirección nueva. El ciclo completo de una tecla es: la persona teclea, `onChange` llama a `alCambiar`, el hook navega con `replace`, la dirección cambia, React Router vuelve a dibujar la página, `useFiltrosEnUrl` lee el texto nuevo y el campo lo muestra. Parece largo, y sucede en el mismo instante. El campo de búsqueda es `type="search"`, el control nativo de HTML para eso, que los lectores de pantalla anuncian como campo de búsqueda.

La lista distingue ahora dos vacíos:

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

«No hay servicios configurados todavía.» (en `ContenidoReporte`) significa que el servidor no tiene servicios: es el cuarto estado de la lección 4. «Ningún servicio coincide con los filtros.» significa que sí hay, pero tus filtros los esconden. Son dos situaciones distintas que piden acciones distintas —esperar a que alguien configure servicios, o quitar un filtro—, y por eso tienen dos mensajes.

#### 5.2.7 `Link` y `NavLink`

La fila deja de tener un botón que elige y pasa a tener un enlace que lleva:

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

`Link` dibuja una etiqueta `<a>` normal, con su `href`: la documentación lo llama «un envoltorio de `<a href>` mejorado progresivamente» para navegar del lado del cliente ([React Router, `Link`](https://reactrouter.com/api/components/Link)). En la salida de Chrome se ve: `<a href="/servicios/pagos" data-discover="true">pagos</a>`. Cuando haces clic, `Link` evita que el navegador pida la página al servidor y le pide al enrutador que navegue con `pushState`. Como es un `<a>` de verdad, todo lo que la persona espera de un enlace funciona: abrirlo en otra pestaña con Ctrl+clic o con el botón central, copiar su dirección, verla al pasar el ratón. Con el botón de la lección 2 nada de eso era posible. Y el lector de pantalla lo anuncia como «enlace», que es lo que es: lleva a otra parte. El atributo `data-discover` lo agrega React Router a sus enlaces para su descubrimiento de rutas, una función del modo framework ([React Router, «Lazy Route Discovery»](https://reactrouter.com/explanation/lazy-route-discovery)); en el modo de datos puedes ignorarlo.

Navegar en el cliente tiene un costo que una recarga no tiene. Cuando el navegador carga una página entera, el lector de pantalla anuncia la página nueva y el foco empieza arriba. Con `pushState` no pasa ninguna de las dos cosas por sí sola: la página cambia debajo de la persona, y el foco se queda donde estaba. React Router ofrece restaurar la posición del desplazamiento con `ScrollRestoration` («emula la restauración del desplazamiento del navegador», dice su documentación, [React Router, `ScrollRestoration`](https://reactrouter.com/api/components/ScrollRestoration)), y esa página no menciona el foco. El título por página que pone `useTituloDocumento` es una parte de la respuesta; la otra, llevar el foco a donde empieza la página nueva, es trabajo tuyo. La lección 7, la de accesibilidad, vuelve al teclado y al foco. Por ahora, recorre el `revisor` con Tab después de hacer clic en un servicio y anota en tu bitácora dónde quedó el foco.

La navegación de la disposición usa `NavLink`, un `Link` que sabe si su destino coincide con la dirección actual. Cuando coincide, le agrega la clase `active` y el atributo `aria-current="page"`, que les dice a los lectores de pantalla «esta es la página en la que estás» ([React Router, `NavLink`](https://reactrouter.com/api/components/NavLink)). Compara las dos salidas de Chrome: en `/?fallas=1` el enlace dice `aria-current="page" class="active"`; en `/servicios/pagos` dice `class=""`. La hoja de estilos pone en negritas el enlace activo:

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

¿Y el `end` de `<NavLink to="/" end>`? Normalmente un `NavLink` está activo también en las direcciones que **empiezan** con su destino: uno a `/servicios` estaría activo en `/servicios/pagos`. `end` cambia eso: solo está activo si la dirección **termina** ahí. Pero la documentación señala un caso especial: como **todas** las direcciones empiezan con `/`, un `NavLink` a `/` ya se comporta como si tuviera `end`. La figura 5 lo comprueba:

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

En `/servicios/pagos` solo está activo «servicios sin end»; los dos enlaces a la raíz no, tengan o no `end`. Así que en el `revisor` el `end` no cambia el resultado, y aun así se escribe: dice la intención («este enlace es solo la lista») a quien lee el código, y no depende de recordar una excepción.

Y una despedida: el `.seleccionar` y el `.detalle` de la hoja de estilos ya no los usa ningún componente. Eran del botón de la lección 2 y del panel de la lección 3. El punto de control los conserva; anótalo como limpieza pendiente.

### 5.3 Recargar una ruta del cliente: el servidor debe responder `index.html`

#### 5.3.1 Dos caminos para llegar a la misma dirección

Hay dos maneras de llegar a `/servicios/pagos`, y para el servidor son completamente distintas.

**Navegando dentro de la aplicación.** Abres `/`, el servidor entrega `index.html`, el JavaScript arranca, y haces clic en `pagos`. `Link` llama a `pushState`, la barra dice `/servicios/pagos` y React Router dibuja `PaginaServicio`. **El servidor no se enteró**: la única petición nueva fue la de la API, `GET /api/servicios/pagos`.

**Llegando desde afuera.** Recargas con F5, o pegas el enlace en un navegador nuevo, o lo abres desde un correo. Ahora no hay aplicación cargada. El navegador hace lo que hace con cualquier dirección: le pide `GET /servicios/pagos` **al servidor**. Es el «puede intentar cargarla más tarde» de MDN. Y el servidor tiene que contestar algo con lo que el navegador pueda arrancar la aplicación, para que React Router lea la dirección y dibuje el detalle. Ese algo es `index.html`, el mismo de `/`: la página no cambia, solo cambia la dirección con la que arranca.

Si el servidor busca un archivo llamado `servicios/pagos` dentro de `dist/`, no lo encuentra, porque no existe: en `dist/` solo hay un `index.html`, un `.js` y un `.css`. Y responde 404.

#### 5.3.2 Lo que responden `vite dev` y `vite preview`

Hasta ahora nunca viste ese 404 porque los dos servidores de Vite ya hacen lo correcto. Vite tiene una opción, `appType`, cuyo valor por omisión es `'spa'` (aplicación de una sola página), y que activa lo que su documentación llama *SPA fallback*: el respaldo que entrega `index.html` cuando la dirección no es un archivo ([Vite, «Shared Options», `appType`](https://vite.dev/config/shared-options)). En `vite dev` lo hace un *middleware* de Vite; en `vite preview`, la misma documentación dice que configura `sirv`, el servidor de archivos que usa por dentro, con `single: true`, la opción que responde `index.html` a lo que no encuentra. La lección 0 ya lo había rozado en su ejercicio 3, cuando `curl http://localhost:5173/salud` devolvió el HTML de la página. Esto respondió `vite preview` en esta lección:

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

Es `index.html`, con código 200. Y fíjate en las rutas de los archivos: `/assets/index-CLDgPzLo.js`, con `/` al principio. Eso importa más de lo que parece. Si dijera `assets/index-CLDgPzLo.js`, sin la barra, el navegador la resolvería **relativa a la dirección actual**, y desde `/servicios/pagos` pediría `/servicios/assets/index-CLDgPzLo.js`, que no existe. La barra inicial hace que el JavaScript se pida siempre al mismo lugar, sea cual sea la profundidad de la dirección.

El respaldo de `vite preview` es generoso, quizá demasiado. Esto respondió a tres direcciones más:

```text
/no-existe → 200 text/html
/assets/no-existe.js → 200 text/html
/servicios/pagos?x=1 → 200 text/html
```

El primero es lo esperado: `/no-existe` es una ruta del cliente, y la página «no encontrada» la dibuja React. Nota que llega con código **200**: el servidor no sabe qué rutas existen en `rutas.tsx`, así que no puede decir 404. El segundo es la parte cuestionable: un archivo de JavaScript que no existe también recibe HTML con 200, y un navegador que esperaba código recibe una página. El servidor que escribe la lección 9 distingue los dos casos: reescribe a `index.html` las rutas del cliente, pero responde 404 a lo que falte bajo `/assets/`.

#### 5.3.3 El servidor que no reescribe

Para ver el 404 hace falta un servidor que sirva archivos y nada más. Python trae uno: `python3 -m http.server`, con `--directory` para elegir la carpeta y `--bind` para escuchar solo en tu máquina. Su documentación advierte que no se recomienda para producción, y explica que si la petición no corresponde a un archivo, responde `404 File not found` ([Python, `http.server`](https://docs.python.org/3/library/http.server.html)). Es perfecto para esto, justo porque es tonto. Con `npm run build` ya hecho, desde `~/curso-react/revisor/`:

```text
$ python3 -m http.server 4190 --bind 127.0.0.1 --directory dist
```

Y desde otra terminal:

```text
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/
200 text/html
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/servicios/pagos
404 text/html;charset=utf-8
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/assets/index-CLDgPzLo.js
200 text/javascript
```

La raíz funciona, porque `dist/index.html` existe; el JavaScript también. Pero `/servicios/pagos`, que con `vite preview` era un 200, aquí es un 404. Si abres la raíz en el navegador y haces clic en `pagos`, todo funciona, porque el clic no llega al servidor. Si en ese momento recargas, el navegador te muestra esto, que es lo que vio la persona de la escena:

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

La bitácora de Python lo deja por escrito:

```text
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /assets/index-CLDgPzLo.js HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
```

Hay un renglón `GET` por cada uno de los cuatro `curl`, y cada 404 viene precedido de su explicación; la última pareja es la del `curl` que trajo la página de error completa. (Las horas de esta bitácora son las de la máquina, no UTC.) Apaga el servidor con Ctrl+C.

La lección es directa: **en cuanto una aplicación usa rutas del cliente, el servidor que la publica tiene una tarea nueva.** Para cualquier dirección que no sea un archivo real, debe responder `index.html`, y dejar que el enrutador decida. Cómo se configura depende del servidor: un servidor web clásico tiene una regla de reescritura, una plataforma de publicación tiene una opción de «aplicación de una sola página», y un servidor propio lo hace con unas líneas de código, que son las que escribe la lección 9. Lo que no cambia es la prueba: **recarga una ruta profunda en el servidor real.** Probar solo con `vite preview` no prueba nada sobre producción, porque `vite preview` ya hace la reescritura por ti y, como recuerda la documentación de Vite desde la lección 0, no es un servidor de producción.

Existe otra salida, que vale la pena conocer para descartarla con razones: poner la ruta después de un `#` (`/#/servicios/pagos`). El navegador nunca le manda al servidor lo que va después del `#`, así que el servidor siempre ve `/` y siempre entrega `index.html`. React Router lo ofrece con `createHashRouter`. Funciona en cualquier servidor estático, pero las direcciones quedan feas, el `#` deja de servir para saltar a una sección de la página, y el problema real —un servidor que no sabe servir una aplicación— queda escondido en lugar de resuelto. El curso usa direcciones normales y resuelve el servidor.

## El error que vas a ver

La lección tiene un error principal, el 404 al recargar, que ya viste en 5.3, y dos de apoyo, que aparecen al escribir las páginas.

**El error principal: «a mí sí me funciona».** Funciona en `npm run dev`, funciona en `npm run preview`, funciona al hacer clic. Falla solo cuando alguien **recarga** o **abre un enlace** en el servidor donde se publicó, y falla con una página que no es de tu aplicación: `Error code: 404`, `File not found` o el equivalente de tu servidor. La señal para reconocerlo es que la raíz `/` siempre funciona y lo que falla es todo lo demás, y que en la pestaña de red del navegador la petición que falla es la del **documento** (`/servicios/pagos`), no la de la API (`/api/servicios/pagos`). Si falla la de la API, el problema es otro. El arreglo no está en React: es configurar el servidor para que responda `index.html` en las rutas del cliente.

**Un componente de ruta fuera del enrutador.** La figura 4 dibuja dos árboles dentro de un límite de error propio, como el `LimiteDeError` del `revisor`. El primero usa `useSearchParams` sin ningún enrutador alrededor, que es lo que pasa si dibujas una página suelta, por ejemplo en una prueba que olvidó montarla dentro de un enrutador. El segundo es una ruta que lanza un error al dibujarse, dentro de `RouterProvider`:

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

El primer mensaje dice `useLocation() may be used only in the context of a <Router> component.` aunque el código llamó a `useSearchParams`: por dentro, `useSearchParams` usa `useLocation`, y el error lo lanza el que primero se da cuenta. Léelo así: «este hook necesita un enrutador arriba y no lo encontró». El arreglo nunca es tocar el hook, sino dibujar el componente dentro de un enrutador; en la lección 8, `montarEn(direccion)` hace exactamente eso con `createMemoryRouter(rutas)`.

El segundo caso es el de 5.1.6. El límite propio no se enteró: React dice en la consola que usará el límite `RenderErrorBoundary`, que es de React Router, y en pantalla aparece `Unexpected Application Error!` seguido del mensaje. (La figura quita de la salida el bloque con la pila del error, que trae rutas de la máquina. Y en una corrida de desarrollo React Router agrega un párrafo para quien programa, que invita a declarar un `ErrorBoundary` propio; la figura corre con la versión de producción del paquete, que no lo trae.) Es lo mismo que viste en el `revisor` en 5.1.6, y el arreglo es el de esa sección: un `ErrorBoundary` en la ruta.

**El parámetro que puede faltar.** Quita el valor por omisión en `PaginaServicio` y escribe `const { nombre } = useParams();`. Esto responde `tsc -b`:

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

Cuatro errores, uno por cada lugar que **exige** un `string`: la consulta del detalle, la mutación, la propiedad `nombre` de `EditorNota` y el índice `notas[nombre]`. Los otros tres usos (el título de la pestaña, el de la tarjeta y la `key`) no se quejan: una plantilla de texto convierte `undefined` en la palabra `"undefined"` y la pinta en pantalla sin avisar, y ese es un error que TypeScript no atrapa. Es el mismo aviso de 5.2.1 visto desde el compilador: `useParams` no puede prometer que el parámetro existe. Hay tres arreglos razonables: el valor por omisión `= ""` que usa el punto de control; una comprobación al principio que dibuje otra cosa si falta; o, en el modo framework, los tipos generados por ruta. Lo que no es razonable es silenciarlo con `nombre!`: esa admiración le dice a TypeScript «confía en mí», y es exactamente lo que el compilador estaba evitando. (Este error se provocó en una copia del punto de control; el original pasa `tsc -b` limpio.)

## Lo que se hace mal

**Copiar la dirección a un `useState` y sincronizarlos con un Effect.** «Leo `?q=` al montar, lo guardo en un estado, y un Effect escribe el estado en la dirección cuando cambia.» Son dos fuentes de verdad, un dibujo extra por cada cambio y un Effect que no se sincroniza con nada externo. La dirección ya es el estado: léela en cada dibujo.

**Usar `<a href>` para navegar dentro de la aplicación.** Funciona, y por eso engaña: cada clic recarga la página entera: se pierde el caché de TanStack Query, se pierden las notas de la disposición, y el navegador vuelve a pedir la página y a arrancar toda la aplicación desde cero. Dentro de la aplicación, `Link`; `<a>` a secas solo para salir de ella.

**Un botón con `onClick` que navega, en lugar de un enlace.** Pierde todo lo que un enlace da gratis: abrir en otra pestaña, copiar la dirección, que el lector de pantalla lo anuncie como enlace. Si lleva a otra parte, es un enlace.

**Escribir en la historia con cada tecla.** Sin `replace: true`, un cuadro de búsqueda deja una entrada por letra, y «Atrás» se vuelve un «deshacer» letra por letra (figura 3).

**Armar direcciones sin codificar.** `` `/servicios/${nombre}` `` funciona con `pagos` y falla el día que un nombre trae `/`, `?` o `#`. Codifica al meter el texto, con `encodeURIComponent`, y deja que `useParams` decodifique.

**Confiar en el límite de afuera para los errores de las páginas.** `LimiteDeError` en `main.tsx` no ve lo que pasa dentro de las rutas: React Router lo atrapa antes. Sin un `ErrorBoundary` propio, la persona ve `Unexpected Application Error!` y la pila del error (5.1.6).

**Crear el enrutador dentro de un componente.** Cada dibujo crearía un enrutador nuevo que arranca de cero. Se crea una vez, a nivel de módulo, como pide la documentación.

**Instalar `react-router-dom`.** El paquete sigue en npm, pero se quedó en la versión 7 (medido: su versión `latest` es la 7.18.4, y depende de `react-router` 7.18.4); la 8 ya no lo publica. Por eso `npm install react-router-dom` no falla: te trae en silencio una segunda copia, `react-router@7`, junto a la 8. Si mezclas importaciones de los dos paquetes, cada copia busca su propio enrutador y no encuentra el de la otra, y el resultado es el primer error de la figura 4. Todo sale de `react-router`, y `RouterProvider` de `react-router/dom`.

**Dar por probada la publicación porque `vite preview` funciona.** `vite preview` reescribe a `index.html` por su cuenta. La única prueba que vale es recargar una ruta profunda en el servidor donde se publica.

**Guardar en la dirección lo que no describe la vista.** Un borrador a medio escribir, una contraseña, un token: la dirección se copia, se guarda en el historial, aparece en las bitácoras de los servidores y viaja en el encabezado `Referer`. Va en la dirección lo que alguien querría compartir; lo demás, no.

## Ejercicios

### Ejercicio 1 — Predice la dirección

Con el servidor de práctica y `npm run dev` encendidos, abre `http://localhost:5173/`. **Antes de tocar nada**, escribe en tu bitácora qué dirección vas a tener después de hacer, en este orden: escribir `rep` en «Buscar por nombre» y luego marcar «Solo fallas». Escribe también qué servicios vas a ver, y a dónde te lleva el botón «Atrás» del navegador. Hazlo y compara. Luego repite en el orden contrario (primero la casilla, luego el texto) desde `/`. ¿La dirección es la misma? ¿Importa?

### Ejercicio 2 — Quita `replace` y cuenta

En una copia del punto de control, borra `{ replace: true }` de `filtrosEnUrl.ts` (con su coma). **Predice** cuántas veces tendrás que presionar «Atrás» para volver al detalle de `pagos` si, desde ese detalle, vas a la lista y escribes `inventario` en el buscador. Compruébalo en el navegador. ¿Coincide con lo que mostró la figura 3? Restaura la línea al terminar y corre `npm run lint` y `npm run build`.

### Ejercicio 3 — Un límite propio para el detalle

El límite de la raíz es el último recurso: cuando aparece, se lleva el encabezado y la navegación. Para el detalle de un servicio puedes hacerlo mejor. En una copia del punto de control, agrega a la ruta `servicios/:nombre` un límite propio, en un archivo nuevo `src/detalle/ErrorDeServicio.tsx`, que dibuje una `Tarjeta` con el título `Servicio <nombre>`, un párrafo con `role="alert"` que diga «No se pudo mostrar este servicio:» seguido del mensaje del error, y un enlace «Volver al reporte». Para comprobarlo, haz que `PaginaServicio` lance un error **solo** cuando `nombre` sea `pagos`; piensa dónde va el `throw` para que `npm run lint` lo acepte.

**Antes de probar**, predice tres cosas: en `/servicios/pagos`, ¿se ve el encabezado «Revisor» con su navegación?; ¿qué título tiene la pestaña?; y en `/servicios/inventario`, ¿cambia algo? Compruébalo con `npm run build` y `npm run preview`, y desecha la copia al terminar.

### Ejercicio 4 — ¿Dónde vive cada estado?

Sin mirar el código, clasifica cada pedazo de estado del `revisor` en uno de cuatro lugares: **local** (un `useState` dentro de un componente), **dirección**, **servidor** (TanStack Query) o **disposición** (`Outlet context`). Los pedazos: el borrador de una nota; la nota ya guardada; «Solo fallas»; el texto buscado; el servicio cuyo detalle estás viendo; la lista de servicios; el detalle de un servicio; si hay una actualización en curso («· actualizando…»). Para cada uno, escribe una razón de una línea. Luego compruébalo contra el código.

## Soluciones

### Solución 1

Al escribir `rep`, la dirección pasa por `/?q=r`, `/?q=re` y `/?q=rep`, y la lista muestra solo `reportes`. Al marcar la casilla queda `/?q=rep&fallas=1`, y sigues viendo `reportes`, que está en falla. «Atrás» te saca de la lista hacia donde estabas antes de abrirla (si abriste la pestaña directo en `/`, a la página anterior del navegador), porque los cuatro cambios reemplazaron la entrada en lugar de agregar otras. En el orden contrario, la dirección queda `/?fallas=1&q=rep`. No es la misma cadena, porque `cambiarFiltros` copia los parámetros actuales y `set` agrega al final un parámetro que no existía, conservando el orden de los que ya estaban. Pero no importa: `useFiltrosEnUrl` lee cada parámetro por su nombre con `get`, así que las dos direcciones dibujan exactamente lo mismo. Si compartes cualquiera de las dos, quien la abra ve tu vista.

### Solución 2

Sin `replace`, desde el detalle de `pagos` la historia queda así: el detalle, la lista al hacer clic en «Volver al reporte», y una entrada por cada una de las diez letras de `inventario`. Para volver al detalle hacen falta once «Atrás»: diez para deshacer las letras y uno para salir de la lista. Es lo mismo que mostró la figura 3 con tres letras, donde un «Atrás» solo deshizo una. Con `replace: true` restaurado, basta uno. Este ejercicio se comprueba con los ojos en un navegador real; la figura 3 es su versión automática.

### Solución 3

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

En `rutas.tsx`, la ruta de detalle gana su límite (y el archivo, la importación de `ErrorDeServicio`):

```tsx
// en una copia: revisor/src/app/rutas.tsx (fragmento)
      { path: "servicios/:nombre", Component: PaginaServicio, ErrorBoundary: ErrorDeServicio },
```

Y el error a propósito va en `PaginaServicio` después de todos sus hooks, justo antes del `return`, por la misma razón que el de 5.1.6:

```tsx
// en una copia: revisor/src/detalle/PaginaServicio.tsx (fragmento)
  if (nombre === "pagos") {
    throw new Error("el detalle se rompió al dibujar");
  }
```

Con eso, la copia pasó `npm run lint` y `npm run build`, y Chrome entregó esto en `/servicios/pagos`:

```text
<title>Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><p role="alert">No se pudo mostrar este servicio: el detalle se rompió al dibujar</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

Las tres predicciones. **Sí**, el encabezado y la navegación siguen ahí: el error buscó el límite más cercano hacia arriba, y el más cercano ahora es el de la ruta de detalle, que reemplaza solo a `PaginaServicio`; `Disposicion` no se enteró. El título de la pestaña es `Revisor` y no `pagos · Revisor`: la página lanzó antes de terminar de dibujarse, y su Effect de `useTituloDocumento` nunca se ejecutó. Si quieres el título, el límite tiene que ponerlo él mismo. Y en `/servicios/inventario` no cambia nada: el detalle se dibujó completo (`Disponible: HTTP 200 en 118 ms`), porque el límite solo aparece cuando algo se rompe.

`useParams` funciona dentro del límite porque el límite se dibuja en el lugar de la ruta, con sus mismos parámetros. Y el mensaje es propio a propósito: «No se pudo mostrar este servicio» le dice a la persona qué parte falló y le deja la salida a la mano, mientras que el aviso de la raíz habla del panel entero. Si el `throw` lo pusiste como primera línea del componente, `npm run lint` respondió con `rules-of-hooks`, un error por cada hook de abajo; y `tsc` también se queja, porque después de un `throw` incondicional ya no puede deducir que `consulta.data` existe.

### Solución 4

| Estado | Dónde vive | Por qué |
|---|---|---|
| borrador de una nota | local (`EditorNota`) | solo le importa a quien lo escribe, y debe reiniciarse al cambiar de servicio (`key`) |
| nota guardada | disposición (`Outlet context`) | la necesitan dos páginas, la lista (marca «con nota») y el detalle, y debe sobrevivir al ir y venir |
| «Solo fallas» | dirección (`?fallas=1`) | describe la vista y se quiere compartir |
| texto buscado | dirección (`?q=`) | igual que el anterior |
| servicio que estás viendo | dirección (`/servicios/:nombre`) | es la página misma; en la lección 2 era el `useState` `seleccionado` |
| lista de servicios | servidor (`["reporte"]`) | es del servidor; la pantalla guarda una copia en caché |
| detalle de un servicio | servidor (`["servicio", nombre]`) | igual, con una entrada de caché por servicio |
| «· actualizando…» | servidor (`isFetching` de la consulta) | no lo guarda nadie: lo calcula TanStack Query |

Si pusiste las notas en la dirección, piensa en lo que pasaría al compartir el enlace: tus notas viajarían a la otra persona, y crecerían la dirección sin límite. Si las pusiste en el servidor, tienes razón en el largo plazo —hoy se pierden al recargar—, pero la API de práctica no tiene una ruta para guardarlas. La [Lección 6](06-reducer-contexto.md) vuelve a esta tabla y agrega una columna: el contexto.

## Cómo sé que lo logré

- [ ] `npm ci`, `npm run lint` y `npm run build` terminan bien dentro de `~/curso-react/revisor/`, y `npm run build` deja `dist/assets/index-CLDgPzLo.js` si tu código es idéntico al del punto de control.
- [ ] `npm ls react-router` muestra `react-router@8.5.0`, y `npm ls react-router-dom` responde `└── (empty)` y sale con código 1, que aquí es lo esperado: no encontró el paquete.
- [ ] Con el servidor de práctica y `npm run preview` encendidos, abrir `http://localhost:4173/?fallas=1` en una pestaña nueva muestra la casilla marcada y solo `pagos` y `reportes`; el título de la pestaña es `(2) Revisor`.
- [ ] `http://localhost:4173/servicios/pagos` muestra el detalle de `pagos` y el título `pagos · Revisor`; `http://localhost:4173/no-existe` muestra «Página no encontrada» con el encabezado del `revisor` arriba.
- [ ] En el navegador: escribes una nota en el detalle de `pagos`, la guardas, vuelves al reporte con «Volver al reporte» y la fila de `pagos` dice «· con nota». (Esto se comprueba a mano: las corridas de esta lección no hacen clics.)
- [ ] Al escribir en «Buscar por nombre», la dirección cambia con cada tecla, y un solo «Atrás» te saca de la lista.
- [ ] En el HTML de la página (con las herramientas de desarrollo, o con Chrome sin ventana), el enlace «Reporte» tiene `aria-current="page"` en `/` y no lo tiene en `/servicios/pagos`.
- [ ] Con `python3 -m http.server 4190 --bind 127.0.0.1 --directory dist`, `curl` a `/servicios/pagos` responde `404`, y con `vite preview` la misma ruta responde `200 text/html`. Puedes explicar por qué, y apagaste los dos servidores.
- [ ] En una copia con el `throw` de 5.1.6, `/?q=romper` muestra «Algo salió mal al dibujar el panel» con `role="alert"` y no `Unexpected Application Error!`; en el punto de control, sin el `throw`, la lista se ve como siempre. Puedes decir por qué ese aviso no lo dibuja `LimiteDeError`.
- [ ] Las seis figuras compilan con `tsc` y su salida coincide con la de la lección.
- [ ] Anotaste en tu [bitácora](bitacora.md) qué estado se fue a la dirección, qué estado subió a la disposición, y el 404 que viste con Python.

## Resumen

Responde sin mirar la lección:

1. ¿Qué cuatro cosas que le faltaban al panel de una sola dirección resuelve guardar la vista en la dirección?
2. ¿Qué dibuja una ruta índice? ¿Por qué `servicios/:nombre` no empieza con `/`? ¿Qué atrapa `*`?
3. ¿Por qué el enrutador se crea a nivel de módulo, y por qué `QueryClientProvider` va afuera de `RouterProvider`?
4. ¿Por qué las notas subieron a la disposición, y cómo las leen las páginas?
5. ¿Por qué `useParams` tipa el parámetro como `string | undefined`? ¿En qué momento se codifica y en qué momento se decodifica `catálogo`?
6. ¿Por qué `PaginaServicio` no se vuelve a montar al pasar de `/servicios/pagos` a `/servicios/inventario`, y qué hace `key={nombre}` en `EditorNota`?
7. ¿Por qué los filtros se leen de la dirección en cada dibujo en lugar de guardarse en un `useState`? ¿Qué cambia `replace: true`?
8. ¿Qué le pide el navegador al servidor cuando recargas `/servicios/pagos`, qué debe responder, y por qué probar con `vite preview` no demuestra nada sobre producción?
9. ¿Por qué `LimiteDeError` dejó de ver los errores de las páginas cuando entró el enrutador? ¿Dónde se declara el límite que los atrapa, por qué su aviso reemplaza al encabezado, y para qué sigue `LimiteDeError` en `main.tsx`?

## Para leer más

- [React Router, «Picking a Mode»](https://reactrouter.com/start/modes) e [«Installation» (modo de datos)](https://reactrouter.com/start/data/installation): los modos declarativo, de datos y framework, qué agrega cada uno, y de dónde se importan `createBrowserRouter` y `RouterProvider`. Consultado el 21 de octubre de 2026.
- [React Router, «Routing» (modo de datos)](https://reactrouter.com/start/data/routing): rutas como objetos, rutas anidadas con `<Outlet />`, rutas índice, segmentos dinámicos y `*`. Consultado el 21 de octubre de 2026.
- [React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter): que usa `pushState` y `replaceState`, y que el enrutador se crea una vez fuera del árbol de React. Consultado el 21 de octubre de 2026.
- [React Router, `useParams`](https://reactrouter.com/api/hooks/useParams): los parámetros dinámicos de la dirección y su tipo. Consultado el 21 de octubre de 2026.
- [React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams): la pareja de parámetros y función, la forma con función, la advertencia sobre llamadas seguidas y sobre mutar el objeto. Consultado el 21 de octubre de 2026.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext): compartir estado del padre con las rutas hijas, y la recomendación de un hook propio con TypeScript. Consultado el 21 de octubre de 2026.
- [React Router, `Link`](https://reactrouter.com/api/components/Link) y [`NavLink`](https://reactrouter.com/api/components/NavLink): el `<a href>` mejorado, `replace`, la clase `active`, `aria-current="page"`, `end` y el caso especial de `/`. Consultado el 21 de octubre de 2026.
- [React Router, «Error Boundaries»](https://reactrouter.com/how-to/error-boundary): cómo se atrapan los errores de una ruta, el límite mínimo en la ruta raíz, `ErrorBoundary` con `useRouteError` en el modo de datos, los tres casos (`isRouteErrorResponse`, `Error`, cualquier otra cosa) y cómo sube el error al límite más cercano. Consultado el 21 de octubre de 2026.
- [React Router, «Upgrading from v7»](https://reactrouter.com/upgrading/v7): por qué la versión 8 ya no publica `react-router-dom`, y las versiones mínimas de Node y React. Consultado el 21 de octubre de 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): el mismo componente en la misma posición conserva su estado, y `key` lo reinicia. Consultado el 21 de octubre de 2026.
- [MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) y [`History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState): agregar o reemplazar una entrada de la historia sin cargar la dirección. Consultado el 21 de octubre de 2026.
- [MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) y [`encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent): leer y escribir la búsqueda, el espacio como `+`, y qué caracteres se codifican en un pedazo de dirección. Consultado el 21 de octubre de 2026.
- [Vite, «Shared Options», `appType`](https://vite.dev/config/shared-options): el valor `'spa'` por omisión y el respaldo a `index.html` de `vite dev` y `vite preview`. Consultado el 21 de octubre de 2026.
- [Python, `http.server`](https://docs.python.org/3/library/http.server.html): el servidor estático de la línea de comandos, `--directory`, `--bind`, el 404 de un archivo que no existe y la advertencia de no usarlo en producción. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| enrutador | la pieza que lee la dirección, decide qué componentes dibujar y cambia la dirección sin recargar la página |
| ruta del cliente | una dirección que existe solo para el enrutador, como `/servicios/pagos`; en el servidor no hay ningún archivo con ese nombre |
| disposición (*layout*) | el componente de una ruta padre: dibuja lo que no cambia entre páginas y deja un `<Outlet />` para la página |
| ruta índice | la ruta hija sin `path` que se dibuja cuando la dirección es exactamente la del padre |
| segmento dinámico | la parte de una ruta que empieza con `:`, como `:nombre`; lo que haya en esa posición se entrega como parámetro |
| búsqueda (*query string*) | lo que va después del `?` en una dirección, como `fallas=1&q=pag`; se lee con `useSearchParams` |
| codificación por porcentaje | escribir en una dirección los caracteres especiales como `%` y dos dígitos hexadecimales por byte, como `á` → `%C3%A1` |
| `replace` | navegar reemplazando la entrada actual de la historia en lugar de agregar otra |
| límite de error (*error boundary*) | el componente que se dibuja en lugar de lo que tiene debajo cuando algo ahí lanza un error al dibujarse; React Router pone uno en cada ruta, y el tuyo se declara con `ErrorBoundary` |
| reescritura (respaldo SPA) | la regla del servidor que responde `index.html` a cualquier dirección que no sea un archivo, para que la aplicación arranque y el enrutador decida |

---

**Siguiente:** [Lección 6 — Estado compartido: reducer y contexto](06-reducer-contexto.md)
