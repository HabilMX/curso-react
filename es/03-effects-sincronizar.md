# Lección 3 — Effects: sincronizar, no «cuando cargue»

*Son las 9:52 y la guardia de la mañana revisa el panel antes de la junta de las 10. En el `revisor` nuevo ya se puede elegir un servicio y ver su detalle. La operadora hace clic en `pagos`, se arrepiente al instante y elige `inventario`. Aparece el encabezado «inventario» y, debajo, «Disponible: HTTP 200 en 118 ms». Respira. Un segundo después, sin que nadie toque nada, el mismo recuadro cambia a «En falla: HTTP 503». Ella llama por teléfono al equipo de inventario, que revisa sus servidores durante quince minutos y no encuentra nada. Inventario nunca falló. Lo que se vio fue la respuesta de `pagos`, más lenta, que llegó tarde y se escribió encima de la de `inventario`. Nadie había escrito un error en el sentido de siempre: cada renglón del código hacía lo que decía. Faltaba un renglón que dijera qué hacer cuando la pregunta ya no importa. Esta lección escribe ese renglón y explica por qué hace falta.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 3.3 y 3.4)

**Qué construyes:** un panel de detalle que pide al servidor los datos del servicio elegido y se reinicia solo cuando eliges otro; el título de la pestaña con el número de fallas, `(2) Revisor`; y el renglón «Actualizado a las …», que avisa cuándo llegó el último reporte sin reiniciar el sondeo de cada 10 segundos

**Qué aprendes:** el ciclo de un Effect: empezar y dejar de sincronizar; la limpieza; la carrera de respuestas, reproducida y arreglada; `StrictMode` como prueba gratuita de que la limpieza existe; dependencias que describen el código (**el linter no se silencia**); `useEffectEvent`; los casos en que no se necesita un Effect

**De dónde vienes.** De la [Lección 2](02-estado-instantanea-forma.md). Tu `revisor` ya tiene la casilla «Solo fallas», los nombres de los servicios como botones con `aria-pressed`, una nota por servicio y un recuadro de detalle, `DetalleSeleccion`, que se **calcula** a partir de la lista: no pregunta nada al servidor, solo vuelve a mostrar lo que el reporte ya traía. El panel tiene desde la [Lección 0](00-un-proyecto-de-verdad.md) un Effect, el de `useReporte`, que pide `GET /api/estados` cada 10 segundos y que `StrictMode` monta dos veces en desarrollo. Esa lección te mostró la pareja «cancelada por el cliente» + «200» en la bitácora del servidor y prometió que aquí se explicaría a fondo. Trabajas en `~/curso-react/revisor/`, que al empezar es igual al punto de control de la Lección 2.

**Qué no hace esta lección.** No agrega rutas del navegador: el detalle sigue apareciendo dentro de la misma página, debajo de la lista, y la dirección `/servicios/pagos` llega en la [Lección 5](05-rutas-url-como-estado.md). No cambia la forma de traer datos a mano por una librería: aquí escribes con tus manos el Effect que pide el detalle, con su limpieza, para entender qué problema resuelve; según el plan del curso, en la [Lección 4](04-estado-del-servidor.md) ese mismo trabajo pasaría a TanStack Query. Tampoco tiene pruebas automáticas: llegan en la [Lección 8](08-pruebas-de-componentes.md). Y no usa `useMemo`, `useCallback` ni `memo`: el curso no los presenta sin una medición que los pida, y en 3.6 vas a ver que el problema que normalmente se «tapa» con `useCallback` tiene aquí una solución más directa.

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas del `package.json` del punto de control. En esta lección no se volvió a instalar en un contenedor Linux: las corridas del curso dieron los mismos nombres de archivo en `dist/` en macOS y en un contenedor `node:24.22.0` para todos los puntos de control, y la construcción del punto de control de esta lección dio aquí ese mismo nombre (`index-CTkBRgQQ.js`). Nada de lo que se muestra depende del sistema operativo. Lo que se ve «en el navegador» se midió con Chrome 155 sin ventana (`--headless`), conducido por su protocolo de depuración: un guion abría la página, esperaba, enviaba clics de ratón reales (los mismos eventos que produce tu mano) y leía el texto del recuadro de detalle. Los experimentos que rompen el código a propósito se hicieron en una **copia** del punto de control, y como en la misma máquina corrían otros procesos en los puertos de siempre, esa copia usó el 3103 para el servidor de práctica, el 5103 para Vite y el 9303 para el protocolo de depuración de Chrome. En tu máquina son el 3100 y el 5173, y nada más cambia. Una primera tanda de corridas en el navegador se descartó y se repitió completa, porque otro proceso de la máquina usaba el mismo puerto de depuración y no se podía garantizar que los clics fueran solo del guion; las salidas que se muestran son todas de la segunda tanda, y repitieron renglón por renglón el mismo comportamiento de la primera. Las horas de la bitácora del servidor están en UTC; la hora de «Actualizado a las …» es la hora local del navegador, que estaba en la zona de la Ciudad de México (UTC−6), y por eso los dos relojes no coinciden. Las rutas largas que imprime ESLint se muestran a partir de `~/curso-react`. Los programas están en [`programas/03-effects-sincronizar/`](../programas/03-effects-sincronizar): `revisor/` es el punto de control y las figuras están junto a él.

## Al terminar vas a poder

- Explicar con tus palabras qué sincroniza cada uno de los tres Effects del `revisor` (el sondeo, el detalle y el título), qué hace su cuerpo y qué deshace su limpieza.
- Reproducir la carrera de respuestas en una copia del panel, leerla en la bitácora del servidor y arreglarla con `AbortController` en la limpieza.
- Explicar por qué `<PanelDetalle key={seleccionado}>` reinicia el panel completo, y por qué esa es la forma correcta de volver a «Cargando detalle…» en lugar de un `setState` dentro del Effect.
- Leer en la bitácora la pareja «cancelada por el cliente» + «200» que produce `StrictMode` y decir qué demuestra.
- Ante un aviso de `exhaustive-deps`, cambiar el código para que la lista de dependencias diga la verdad, sin silenciar la regla, y reconocer cuándo la verdad es que una función no debe reiniciar el Effect.
- Usar `useEffectEvent` para leer la función más reciente desde un Effect sin que el Effect se reinicie, y nombrar las dos cosas que el linter no te deja hacer con ella.
- Señalar en un componente un Effect que no hace falta (un cálculo o la respuesta a un clic) y moverlo al lugar que le corresponde.

## El porqué antes del cómo

En la Lección 2, el recuadro de detalle no preguntaba nada. Mostraba el mismo `EstadoPublico` que ya venía en la lista. Eso tiene una ventaja enorme: no hay manera de que muestre algo distinto de la lista, porque es la lista. Pero el equipo de operación pidió más: cuántas veces se ha revisado ese servicio y cuándo fue la última revisión. Esos datos no vienen en el reporte. Hay que pedírselos al servidor **por servicio**, y en ese momento el recuadro deja de ser un cálculo y se vuelve una conversación con algo que vive fuera de React.

Pregúntale a ese recuadro tres cosas y verás por qué hace falta una herramienta.

**¿Cuándo se pide el detalle?** La respuesta tentadora es «cuando cargue el componente». Esa respuesta es la que esta lección viene a desarmar. El detalle no se pide «al cargar»: se pide **mientras** el recuadro muestra un servicio, y deja de importar en cuanto muestra otro. Si eliges `pagos`, la pantalla tiene que estar de acuerdo con el servidor sobre `pagos`. Si cambias a `inventario`, el acuerdo sobre `pagos` ya no vale y empieza uno nuevo. Eso no es un evento que pasa una vez; es una **sincronización** que empieza y termina.

**¿Qué pasa con la pregunta vieja cuando haces una nueva?** El servidor de práctica tarda 1.5 segundos en responder el detalle de `pagos` y 0.2 segundos en responder los demás. Si eliges `pagos` y enseguida `inventario`, hay dos preguntas en el aire, y la que hiciste primero llega al último. Si nadie le dice a la primera que ya no importa, cuando llegue va a escribir su resultado en el recuadro, encima del bueno. Eso es lo que vio la guardia de la escena.

**¿Quién se entera cuando algo cambia fuera de React?** La pestaña del navegador tiene un título. Si el panel pudiera ponerle ahí el número de fallas, `(2) Revisor`, la guardia lo vería aunque estuviera en otra pestaña. Pero el título no es parte del árbol de React; es una propiedad del documento, `document.title`. Alguien tiene que mantenerlo de acuerdo con el estado del panel, y devolverlo como estaba cuando el panel ya no lo controle.

Las tres preguntas tienen la misma forma: hay algo fuera de React (el servidor, el documento, un temporizador) y la pantalla tiene que estar de acuerdo con ese algo. Para eso existe el Effect. La documentación de React lo define así: los Effects te dejan ejecutar código después de dibujar para **sincronizar** tu componente con algún sistema fuera de React ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). Fíjate en el verbo. No dice «ejecutar código cuando el componente aparece». Dice sincronizar. Este curso repite un criterio en todas las lecciones, y esta es la lección donde nace: **un Effect es para sincronizarse con algo que está fuera de React; no para calcular, no para reaccionar a un clic y no para «cuando cargue».**

La lección tiene siete partes: qué es un Effect, con el título de la pestaña como ejemplo (3.1); el detalle que se pide al servidor y su limpieza (3.2); la carrera de respuestas, reproducida y arreglada (3.3); `StrictMode` como prueba gratuita (3.4); las dependencias que describen el código (3.5); `useEffectEvent` (3.6); y los casos en que no se necesita un Effect (3.7). Esto es lo que cambia en tu proyecto:

```text
revisor/
├── package.json                      ~ versión 0.3.0
├── servidor/practica.ts              ~ agrega GET /api/servicios/:nombre
└── src/
    ├── compartido/
    │   ├── contrato.ts               ~ agrega DetalleServicio y esDetalleServicio
    │   └── useTituloDocumento.ts     + Effect que sincroniza document.title
    ├── detalle/
    │   ├── cargar.ts                 + cargarDetalle(nombre, senal)
    │   ├── useDetalle.ts             + Effect con dependencias [nombre] y limpieza que aborta
    │   └── PanelDetalle.tsx          + el recuadro, con «Cargando detalle…»
    └── reporte/
        ├── ContenidoReporte.tsx      ~ monta <PanelDetalle key={seleccionado}>
        ├── DetalleSeleccion.tsx      − lo reemplaza PanelDetalle
        ├── Panel.tsx                 ~ «Actualizado a las …» y el título (2) Revisor
        └── useReporte.ts             ~ tercer parámetro alRecibir, con useEffectEvent
```

Las marcas son las del curso: **+** archivo nuevo, **~** archivo modificado y **−** archivo eliminado.

## Los conceptos

### 3.1 Qué es un Effect: empezar y dejar de sincronizar

#### 3.1.1 Dos funciones, no un momento

Empecemos por lo más pequeño que tiene el `revisor` nuevo: el título de la pestaña. Este es el hook completo:

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

Un Effect son **dos funciones** y una lista. La primera es la que le pasas a `useEffect`: dice cómo **empezar** a sincronizar. Aquí, guarda el título que había y pone el nuevo. La segunda es la que esa primera **devuelve**, la limpieza: dice cómo **dejar** de sincronizar. Aquí, devuelve el título que había. La lista, `[titulo]`, dice de qué valores depende la sincronización.

La documentación de React insiste en una forma de pensar que cuesta al principio: un Effect solo puede hacer dos cosas, empezar a sincronizar algo y, después, dejar de sincronizarlo ([React, «Lifecycle of Reactive Effects»](https://react.dev/learn/lifecycle-of-reactive-effects)). La misma página dice que conviene pensar desde el punto de vista del Effect y no del componente: «concéntrate siempre en un solo ciclo de empezar y parar a la vez; no debería importar si el componente se está montando, actualizando o desmontando». Esa frase es la diferencia entre este curso y las explicaciones que hablan de `useEffect` como «el `componentDidMount` de las funciones». No hay «al montar» ni «al desmontar». Hay un ciclo que empieza y un ciclo que termina, y se repite cada vez que la lista dice que algo cambió.

¿Cuándo corre cada función? La referencia de `useEffect` lo dice con precisión: React ejecuta la función de preparación cuando el componente se confirma en pantalla (el *commit* de la Lección 1); cuando cambian las dependencias, ejecuta primero la limpieza vieja, con los valores viejos, y después la preparación nueva, con los valores nuevos; y cuando el componente se quita, ejecuta la limpieza una última vez ([React, «useEffect»](https://react.dev/reference/react/useEffect)). Para comparar las dependencias usa `Object.is`, que para números y textos compara el valor, y para objetos y funciones compara **la identidad**: si es el mismo objeto en memoria, no el mismo contenido. Guarda ese detalle; en 3.5 es la causa de un problema serio.

Recorre el título del `revisor` con esa regla. Al abrir la página el reporte todavía no llega, así que `Panel` calcula el título `"Revisor"`. El Effect empieza: guarda `"Revisor"` (el del `<title>` de `index.html`) y pone `"Revisor"`. Llega el reporte con dos fallas y `Panel` calcula `"(2) Revisor"`. La lista cambió, así que React ejecuta la limpieza vieja (devuelve `"Revisor"`) y la preparación nueva (guarda `"Revisor"` y pone `"(2) Revisor"`). Cada ciclo deja las cosas como las encontró antes de que empiece el siguiente. Eso es lo que hace que el orden no importe.

#### 3.1.2 En el `revisor`

`Panel` usa el hook con un valor que **calcula al dibujar**, no que guarda:

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

Fíjate en `fallas`. No es estado: es una constante que se calcula en cada dibujo con `contarFallas`, la función pura de la Lección 1. El Effect no calcula nada; solo **copia** hacia el documento un valor que React ya conoce. Esa división del trabajo es la que vas a ver en todos los Effects buenos: React calcula, el Effect sincroniza. En 3.7 vas a ver lo que pasa cuando alguien la invierte. (`actualizadoEn` y el tercer argumento de `useReporte` se explican en 3.6.)

Esto es lo que leyó Chrome sin ventana en `document.title`, un segundo y medio después de abrir el panel con el servidor de práctica encendido:

```text
08:28:18.814 document.title = "(2) Revisor"
```

`document.title` es justo lo que su nombre dice: la propiedad que lee o cambia el título del documento, el que aparece en la pestaña, y que además cambia el contenido del elemento `<title>` ([MDN, «Document: title property»](https://developer.mozilla.org/en-US/docs/Web/API/Document/title)). React no la toca por su cuenta, porque `<title>` vive en el `<head>` y el panel se dibuja dentro de `<div id="raiz">`. Es, en el sentido exacto de la definición, un sistema fuera de React.

React 19 trae además un componente `<title>` que puedes dibujar desde cualquier componente y que React siempre coloca en el `<head>` ([React, «<title>»](https://react.dev/reference/react-dom/components/title)). Con él, el título dejaría de ser un sistema externo y no haría falta un Effect. Aquí no se usa por una razón concreta: `index.html` ya trae su `<title>Revisor</title>`, y esa misma documentación advierte que se dibuje un solo `<title>` a la vez, porque con dos el comportamiento de los navegadores y de los buscadores queda indefinido. El Effect cambia el título que ya existe y lo devuelve como estaba. Si algún día el título viviera solo en React (sin el de `index.html`), el `<title>` nativo sería la opción sin Effect; su único requisito es que el hijo sea un solo texto, por ejemplo ``{`(${fallas}) Revisor`}``.

¿Por qué la limpieza devuelve el título anterior en lugar de dejarlo como esté? Porque el Effect tiene que poder deshacerse. Si mañana el panel se dibuja solo en una de varias pantallas (el plan del curso lo prevé para la Lección 5), al salir de ella el título no debe quedarse diciendo `(2) Revisor` en una pantalla que no muestra fallas. Una limpieza que «espeja» la preparación hace que el hook funcione sin saber dónde lo van a usar.

### 3.2 El detalle que se pide al servidor

#### 3.2.1 La ruta nueva del servidor de práctica

El servidor de práctica pasa a su segunda versión. No se explica renglón por renglón (el curso es de pantalla), pero conviene saber qué ruta nueva tiene y qué responde: `GET /api/servicios/:nombre` devuelve el detalle de un servicio, o un `404` si no existe. Tarda 1.5 segundos para `pagos` y 0.2 segundos para los demás; esa diferencia está puesta a propósito, para que en 3.3 puedas reproducir la carrera. Pregúntaselo con `curl` antes de mezclarlo con nada:

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

(La corrida se hizo en el puerto 3103, como explica «Sobre las corridas».) `revisiones` cuenta cuántas veces se ha pedido el reporte completo desde que arrancó el servidor, y `ultimaRevision` es la hora de la última vez. Como todavía nadie había pedido `GET /api/estados`, salen en `0` y con la hora del arranque.

`contrato.ts` agrega el tipo y su guarda, igual que `esReportePublico` en la Lección 0: lo que llega por la red es `unknown` hasta que se demuestra lo contrario. El archivo completo queda así:

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

`esDetalleServicio` reutiliza `esEstadoPublico` para el campo `estado`: el detalle trae dentro el mismo `EstadoPublico` que la lista, y se valida con la misma guarda. Como el servidor de práctica importa estos tipos, `tsc -b` revisa también que el servidor y la pantalla estén de acuerdo.

#### 3.2.2 La frontera de red

La función que pide el detalle sigue el molde de `cargarReporte`: una sola responsabilidad, la red, y nada de React.

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

Dos detalles. El primero es `encodeURIComponent(nombre)`. Uno de los servicios se llama `catálogo`, con acento, y en una dirección los caracteres fuera del alfabeto inglés viajan codificados; la bitácora del servidor lo muestra como `GET /api/servicios/cat%C3%A1logo`, y el servidor lo decodifica de vuelta. Si algún día un servicio se llamara `a/b`, sin codificar la diagonal cambiaría la ruta. El segundo detalle es el parámetro `senal`, una `AbortSignal`. La función no decide cuándo cancelar; solo acepta que alguien, desde fuera, pueda hacerlo. Ese «alguien» es la limpieza del Effect.

¿Qué pasa cuando alguien aborta? MDN describe `AbortController.abort()` así: interrumpe una operación asíncrona antes de que termine, y eso incluye las peticiones `fetch`, la lectura de su cuerpo y los *streams*; si no se da una razón, la razón es una excepción `DOMException` llamada `AbortError` ([MDN, «AbortController: abort() method»](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)). Dicho en corto: la promesa que devolvió `fetch` (o la de `respuesta.json()`, si ya se estaba leyendo el cuerpo) se **rechaza**. Y el navegador corta la conexión, que es lo que el servidor de práctica anota como `cancelada por el cliente`.

#### 3.2.3 El Effect que pide el detalle

Este es el corazón de la lección. Léelo con la idea de 3.1 en la cabeza: un ciclo que empieza y uno que termina.

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

Empieza: crea un `AbortController` **propio de este ciclo**, pide el detalle de `nombre` y le da su señal. Cuando llega la respuesta, escribe `listo`; si falla, escribe `error`. Termina: aborta. Y la lista dice `[nombre]`, porque `nombre` es lo único que viene de fuera del Effect y cambia entre dibujos.

La forma del estado es la regla de la Lección 2: una sola unión `CargaDetalle` con tres casos, no tres banderas (`cargando`, `error`, `datos`) que podrían contradecirse. Es la misma forma que `Carga` en `useReporte`.

Mira el renglón `if (control.signal.aborted) return;`. Cuando la limpieza aborta, la promesa se rechaza con `AbortError`. Sin ese renglón, en desarrollo lo verías en cada servicio que elijas: el ciclo extra de `StrictMode` (3.4) aborta la primera petición, y su rechazo llega al mismo recuadro que tienes enfrente, porque `StrictMode` limpia y vuelve a preparar el Effect **del mismo componente**, que conserva su estado. Se midió en una copia sin ese renglón, con Chrome sin ventana, eligiendo `pagos` y, cuando ya había cargado, `inventario`:

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

Un error falso en pantalla durante 1.7 segundos con `pagos` y 0.5 con `inventario`, hasta que la respuesta buena lo reemplaza. El texto «signal is aborted without reason» es el de Chrome; otros navegadores escriben otro. En producción, sin el ciclo extra, no lo verías con este punto de control, porque la `key` desmonta el panel viejo y su rechazo no tiene a quién escribirle; pero sin `key` lo verías también en cada cambio de servicio. Un aborto **no es un error**: es la forma en que este ciclo dice «ya no me importa». Por eso se reconoce y se ignora. Fíjate en qué se pregunta: no el tipo del error, sino si **mi** controlador abortó. Si el servidor se cae y además el usuario cambia de servicio al mismo tiempo, la pregunta correcta es «¿este ciclo sigue vigente?», no «¿qué clase de error es?».

Y fíjate en lo que **no** hace: no escribe `establecerCarga({ tipo: "cargando" })` al empezar. Cuando cambias de servicio, el recuadro tiene que volver a «Cargando detalle…», pero eso no lo hace el Effect. Lo hace la `key`, y la razón ocupa toda la sección 3.3.4. Por ahora quédate con la pista: el estado inicial es `{ tipo: "cargando" }`, y el único momento en que se usa es cuando el componente nace.

`establecerCarga` sí se llama dentro del Effect, pero solo en las funciones que pasan a `.then(...)`, es decir, cuando la respuesta **llega de fuera**. Esa es exactamente la forma que la Lección 0 te mostró como permitida: un Effect que se suscribe a algo externo y cambia el estado cuando ese algo responde.

El recuadro usa el hook y dibuja los tres casos:

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

Compáralo con el `DetalleSeleccion` de la Lección 2, que este archivo reemplaza. Aquel recibía el `estado` ya resuelto y le ponía `key={estado.nombre}` al `EditorNota` para que el borrador no se arrastrara de un servicio a otro. Este recibe solo el `nombre` y el texto de la nota guardada, y el `EditorNota` ya no lleva `key`. No es un descuido: la `key` subió un piso, al `PanelDetalle` completo, y desde ahí reinicia todo lo que hay dentro, el editor incluido. Los textos «Cargando detalle…» con `role="status"` y el error con `role="alert"` siguen la costumbre de accesibilidad del curso: un lector de pantalla anuncia los cambios de esas dos regiones sin que la persona tenga que buscarlos.

Por último, `ContenidoReporte` monta el recuadro:

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

La selección sigue siendo el identificador, `seleccionado: string | null`, como pedía la Lección 2. `existe` se **calcula**: si el servicio elegido desaparece de la lista en el siguiente reporte, el recuadro se va solo, sin que nadie tenga que acordarse de limpiar la selección. Y ahí está, en un renglón, la pieza que hace la mitad del trabajo de esta lección: `key={seleccionado}`.

Con todo junto, esto es lo que hace el panel cuando eliges `pagos` y, 300 milisegundos después, `inventario` (medido con Chrome sin ventana sobre el punto de control sin cambios):

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

Medio segundo después del segundo clic el recuadro ya muestra `inventario`, y dos segundos después, cuando la respuesta de `pagos` ya habría tenido tiempo de sobra para llegar, sigue diciendo lo correcto. Y esta es la bitácora del servidor durante toda la prueba, desde que se abrió la página:

```text
08:28:17.462 GET /api/estados cancelada por el cliente
08:28:17.763 GET /api/estados 200
08:28:18.836 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/inventario cancelada por el cliente
08:28:19.347 GET /api/servicios/inventario 200
```

Seis renglones, y cada uno tiene una causa que ya puedes nombrar. Los dos primeros son la pareja de `StrictMode` del reporte, la misma de la Lección 0. El tercero es el primer ciclo del detalle de `pagos`, que `StrictMode` empezó y limpió de inmediato (3.4). El cuarto es el segundo ciclo de `pagos`, el de verdad, cancelado 310 milisegundos después porque elegiste `inventario`: **esa** es la limpieza arreglando la carrera. El quinto y el sexto son la pareja de `StrictMode` de `inventario`, cuyo recuadro nació de nuevo por la `key`. Ninguna respuesta de `pagos` llegó al panel, porque nunca terminó.

### 3.3 La carrera de respuestas

#### 3.3.1 La carrera en miniatura

Antes de romper el `revisor`, mira la carrera aislada, sin servidor, sin red y sin `key`. La primera figura monta dos versiones del mismo componente en un DOM de prueba. Las dos piden un detalle con una función falsa que tarda 300 ms para `pagos` y 20 ms para los demás. La única diferencia es que una tiene limpieza y la otra no. A cada una se le pide `pagos` e, inmediatamente, `inventario`:

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

// pagos tarda 300 ms y los demás 20 ms, como en el servidor de práctica (allá, 1500 y 200).
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

Las dos versiones muestran lo correcto a los 100 ms. La diferencia aparece después. **Sin limpieza**, a los 500 ms el párrafo dice `inventario: detalle de pagos`: el encabezado es de un servicio y los datos son de otro. Es la escena de la lección en cuatro palabras. **Con limpieza**, el cambio de `pagos` a `inventario` ejecutó la limpieza del primer ciclo, que abortó la petición de `pagos`; su promesa se rechazó (por eso aparece el renglón entre paréntesis, que imprime el manejador de rechazo) y nunca llegó a llamar a `establecerTexto`.

¿Por qué gana la respuesta vieja? Porque las dos preguntas salieron casi al mismo tiempo y cada una llega cuando llega. La documentación de React lo llama justo así: son errores de **condición de carrera**, porque dos operaciones asíncronas «compiten» entre sí y pueden llegar en un orden inesperado ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). La referencia de `useEffect` lo resume en una frase que conviene memorizar: las respuestas de la red pueden llegar en un orden distinto del orden en que las enviaste ([React, «useEffect»](https://react.dev/reference/react/useEffect)). Ningún renglón está mal; lo que falta es un renglón que diga qué hacer con la pregunta que ya no importa.

#### 3.3.2 Abortar o ignorar

La documentación de React da dos formas de limpiar un Effect que pide datos: «si tu Effect pide algo, la función de limpieza debe **abortar** la petición o **ignorar** su resultado» ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). Sus ejemplos usan la segunda, con una variable local:

```ts
// forma con bandera, como en la documentación de React (fragmento)
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

La bandera evita que la respuesta vieja escriba el estado, y la misma página dice que una bandera explícita es la forma más confiable de arreglar este tipo de problema. Da también el porqué: después del `fetch` se pueden encadenar más pasos asíncronos ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). El aborto solo detiene lo que escucha la señal; la bandera detiene cualquier escritura, venga de donde venga. El `revisor` usa la otra forma, `AbortController`, por tres razones concretas. La primera: el `revisor` ya la usaba desde la lección 9 de TypeScript, en `useReporte`, y conviene que los dos hooks se parezcan. La segunda: abortar no solo ignora el resultado, **corta la conexión**, y el servidor deja de trabajar en una respuesta que nadie va a leer; con la bandera, la petición vieja sigue viajando completa. La tercera: lo puedes ver, porque el servidor anota `cancelada por el cliente`. Las dos formas cumplen la regla de oro de la documentación, que la petición que ya no importa no siga afectando la aplicación. Abortar cumple además con el servidor. Y aquí el aborto basta por una razón concreta: en `cargarDetalle`, todo lo asíncrono escucha la señal (`fetch` y `respuesta.json()`), y después solo hay código síncrono. Si algún día agregas otro `await` que no la reciba, el argumento de la documentación se vuelve tuyo: pregunta `control.signal.aborted` también antes de escribir el éxito, o combina las dos formas.

El precio de abortar es el renglón `if (control.signal.aborted) return;`: como la promesa se rechaza, hay que distinguir el aborto de una falla. Con la bandera no hay rechazo que distinguir. Es un precio pequeño, y por eso las dos son correctas. Lo que no es correcto es ninguna de las dos.

#### 3.3.3 Reproducirla en el `revisor`

Ahora sí, rompe el `revisor`. Hazlo en una copia o regresa el archivo al terminar: el punto de control no se toca. El experimento obvio es quitar la limpieza de `useDetalle`, el renglón `return () => control.abort();`, elegir `pagos` y, enseguida, `inventario`. **Antes de seguir leyendo, predice qué va a mostrar el recuadro a los dos segundos.**

Esto es lo que midió Chrome sin ventana con ese único cambio:

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

Si predijiste «En falla: HTTP 503», fallaste igual que la primera versión de los apuntes de este curso. El recuadro dice lo correcto en los dos momentos, a los 500 ms y a los dos segundos y medio. ¿Ya no hay carrera? Mira la bitácora:

```text
08:28:23.850 GET /api/estados cancelada por el cliente
08:28:24.150 GET /api/estados 200
08:28:25.812 GET /api/servicios/inventario 200
08:28:26.014 GET /api/servicios/inventario 200
08:28:26.807 GET /api/servicios/pagos 200
08:28:28.122 GET /api/servicios/pagos cancelada por el cliente
```

La carrera **sí** ocurrió en la red: ya nadie cancela nada, y la respuesta de `pagos` llegó completa a las 26.807, casi un segundo **después** que la primera de `inventario`. Pero no llegó a la pantalla. La razón es `key={seleccionado}`. Cuando elegiste `inventario`, la `key` cambió y React no actualizó el `PanelDetalle` de `pagos`: lo **quitó** y montó uno nuevo. La documentación lo dice así: cuando quitas un componente, React destruye su estado ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). La respuesta de `pagos` llamó a `establecerCarga` de un componente que ya no existía, y esa llamada no tiene a quién cambiar. (El último renglón, el `pagos` cancelado a las 28.122, es el cierre de la pestaña del guion. Se explica en 3.4.)

Entonces, ¿la limpieza sobra? No, y para verlo hay que quitar también la otra defensa. Con la `key` borrada de `ContenidoReporte` **y** sin `control.abort()`, el mismo guion midió esto:

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

Ahí está la escena de la guardia, medida: a los 500 ms el recuadro dice la verdad sobre `inventario`, y a los dos segundos y medio dice «En falla: HTTP 503», el estado de `pagos`, debajo del encabezado «inventario». La bitácora cuenta por qué:

```text
08:28:30.292 GET /api/estados cancelada por el cliente
08:28:30.592 GET /api/estados 200
08:28:32.252 GET /api/servicios/inventario 200
08:28:33.247 GET /api/servicios/pagos 200
08:28:34.563 GET /api/servicios/pagos cancelada por el cliente
```

Sin `key`, el `PanelDetalle` es **el mismo** antes y después del segundo clic: solo cambió su propiedad `nombre`. El Effect de `useDetalle` corrió un ciclo nuevo para `inventario`, pero el ciclo de `pagos` nunca se limpió, y cuando su respuesta llegó escribió en el estado del mismo componente que ahora muestra `inventario`. Es exactamente la figura 1, con red de verdad.

Cuando restauras la limpieza y dejas el panel sin `key`, la carrera desaparece: el cambio de `nombre` ejecuta la limpieza del ciclo de `pagos`, que aborta, y la respuesta vieja ya no llega. El guion lo confirmó con la bitácora (el `pagos` del segundo ciclo sale `cancelada por el cliente` cuatro milisegundos después del clic en `inventario`, a las 38.511) y con el recuadro, que se quedó en «Disponible: HTTP 200 en 118 ms». Pero esa versión tiene otro defecto, y es la razón de que el punto de control use las dos defensas. Medido en la misma corrida, eligiendo `pagos`, esperando a que cargue y cambiando a `catálogo`:

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

Cuarenta milisegundos después del clic, el recuadro dice «catálogo» y debajo «En falla: HTTP 503»: los datos de `pagos`, que se quedaron ahí porque nadie volvió el estado a `cargando`. Doscientos milisegundos después llega la respuesta buena y se corrige. No es una carrera (no hay respuesta vieja escribiendo tarde), pero durante un instante la pantalla miente igual. La guardia de la escena, si mira en ese instante, también llama a inventario.

#### 3.3.4 Dos defensas, y por qué la `key` no es un truco

Recapitula lo medido:

| `key={seleccionado}` | limpieza que aborta | Lo que se ve al cambiar de servicio |
|---|---|---|
| no | no | la respuesta vieja pisa a la nueva (la escena) |
| no | sí | sin carrera, pero los datos del servicio anterior se ven hasta que llega la respuesta nueva |
| sí | no | la pantalla está bien; la respuesta vieja viaja completa y se tira |
| sí | sí | «Cargando detalle…» y luego el dato correcto; la petición vieja se corta |

La última fila es el punto de control. ¿Por qué la `key` y no un `establecerCarga({ tipo: "cargando" })` al principio del Effect, que parecería lo natural para la segunda fila? Porque el linter no te deja, y tiene razón. Ese intento produce el error `set-state-in-effect` que verás completo en «El error que vas a ver». La regla explica que cambiar el estado de forma inmediata dentro de un Effect obliga a React a reiniciar el ciclo de dibujo completo antes de que el navegador pinte ([React, «set-state-in-effect»](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)): React dibuja el recuadro con los datos viejos, lo confirma, corre el Effect, el Effect pide otro dibujo, y React dibuja otra vez. Un dibujo que se tira.

La `key` no tiene ese problema, porque no corrige el estado después: hace que el estado **nazca** bien. La documentación de React lo propone exactamente para este caso, en la sección «Reiniciar todo el estado cuando cambia una propiedad»: cuando la `key` cambia, React vuelve a crear el componente y reinicia su estado y el de todos sus hijos ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). Y su página sobre el estado dice lo mismo desde el otro lado: especificar una `key` le dice a React que use la `key` como parte de la posición del componente, y no su orden dentro del padre ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). Para React, `<PanelDetalle key="pagos">` y `<PanelDetalle key="inventario">` son dos componentes distintos que no comparten nada. La Lección 2 usó esta herramienta para el borrador de la nota; aquí la usa para todo el panel: el estado de la carga, el borrador del editor y el Effect.

La `key` tiene un efecto que debes conocer: el recuadro se monta de nuevo, y con `StrictMode` eso significa que el Effect de `useDetalle` hace su ciclo extra en cada cambio de servicio. Lo viste en la bitácora: cada servicio que eliges suele dejar una pareja `cancelada` + `200`. Es el costo de desarrollo de la prueba gratuita, y en producción no existe. (Dice «suele»: como precisó la Lección 0, el renglón `cancelada` aparece solo si la conexión alcanzó a llegar al servidor antes del aborto.)

¿Y por qué conservar la limpieza si la `key` ya protege la pantalla? Porque la `key` protege **esta** pantalla, montada **así**. La limpieza protege al hook en cualquier lugar donde lo uses. Si el detalle se volviera una página con su propia dirección, como prevé el plan para la Lección 5, el mismo componente podría recibir otro `nombre` sin desmontarse cuando navegas de `/servicios/pagos` a `/servicios/inventario`. Un hook que solo funciona si quien lo usa recuerda ponerle una `key` es un hook con una trampa escondida. Además, con la `key` sola, la respuesta de `pagos` viajó completa: 1.5 segundos de trabajo del servidor y de la red para tirarlo. La regla que da la documentación de React no tiene excepciones: «tu función de limpieza debe asegurarse de que la petición que ya no importa no siga afectando tu aplicación» ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). La `key` arregla lo que se ve; la limpieza arregla lo que pasa.

### 3.4 `StrictMode`: la prueba gratuita

#### 3.4.1 Qué hace con los Effects

La Lección 0 te enseñó a leer la pareja «cancelada por el cliente» + «200». Ahora puedes entender qué está probando. La referencia de `useEffect` lo dice con estas palabras: con `StrictMode` encendido, React ejecuta un ciclo extra de preparación y limpieza, **solo en desarrollo**, antes de la primera preparación real; es una prueba de esfuerzo que comprueba que la limpieza «espeja» a la preparación y detiene o deshace lo que la preparación está haciendo ([React, «useEffect»](https://react.dev/reference/react/useEffect)). Y da una regla para saber si pasaste la prueba: **la persona no debería poder distinguir entre el Effect corriendo una vez (como en producción) y la secuencia preparar → limpiar → preparar (como en desarrollo).**

Aplica la regla al detalle. En desarrollo, al elegir `pagos`:

1. React monta `PanelDetalle`. El Effect empieza: crea `control₁` y pide `pagos` con su señal.
2. `StrictMode` simula que el componente se fue: corre la limpieza, que aborta `control₁`. El servidor anota `cancelada por el cliente`.
3. `StrictMode` simula que regresó: el Effect empieza otra vez, crea `control₂` y pide `pagos` de nuevo. Esa es la petición que llena el recuadro.

¿Puede la persona distinguir eso de una sola petición? No: ve «Cargando detalle…» y luego el detalle, igual que en producción. Prueba pasada. Ahora imagina el Effect **sin** limpieza (el experimento de 3.3.3 con `key`). En el paso 2 no se aborta nada; las dos peticiones viajan y las dos llegan. En este panel las dos respuestas son iguales y no se nota, pero el servidor trabajó el doble y el segundo `200` de la bitácora sí lo delata. Con un Effect que, en lugar de pedir datos, se suscribiera a algo (un intervalo, una conexión), el paso 2 dejaría **dos** suscripciones vivas, y eso sí se vería.

Por eso la documentación pide cambiar la pregunta: la pregunta correcta no es «¿cómo hago que el Effect corra una sola vez?», sino «¿cómo arreglo mi Effect para que funcione después de volver a montarse?» ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). La misma página advierte contra el remedio que todo el mundo intenta primero, una referencia que impide la segunda ejecución: no basta con hacer que el Effect corra una vez, porque el problema que `StrictMode` destapa también pasa en producción cada vez que la persona sale de la pantalla y vuelve.

#### 3.4.2 Leer la bitácora con lo que ya sabes

Vuelve a la bitácora del punto de control sin cambios, en 3.2.3. Ahora cada renglón cuenta una historia completa (con la precisión de la Lección 0: un renglón `cancelada` del ciclo extra solo aparece si la conexión alcanzó a llegar al servidor antes del aborto; si en tu máquina falta, no es que `StrictMode` esté apagado):

- `GET /api/estados cancelada por el cliente` y `GET /api/estados 200`, al abrir: el ciclo extra del sondeo. La limpieza de `useReporte` aborta y además detiene el intervalo; si no lo detuviera, habría dos intervalos preguntando cada diez segundos.
- `GET /api/servicios/pagos cancelada por el cliente`, al primer clic: el ciclo extra del detalle de `pagos`.
- `GET /api/servicios/pagos cancelada por el cliente`, 310 ms después: no es `StrictMode`. Es la limpieza real, la que corre porque elegiste otro servicio y la `key` desmontó el panel.
- La pareja de `inventario`: el ciclo extra del panel nuevo, y luego la petición que llena la pantalla.

Fíjate en algo que la bitácora no muestra: falta el `200` del segundo ciclo de `pagos`. No llegó nunca, porque la limpieza lo cortó a mitad del camino. Esa ausencia es la carrera arreglada.

Hay un detalle más en las bitácoras de 3.3.3 que conviene explicar para que no te confunda si lo ves. En el experimento con `key` y sin limpieza, las dos peticiones de `inventario` (la del ciclo extra y la real, idénticas) no llegaron al servidor juntas, sino una 200 ms después de la otra, y la segunda petición idéntica de `pagos` seguía pendiente cuando el guion cerró la pestaña, por eso aparece como `cancelada por el cliente` a las 28.122. Lo que se observó es que Chrome no envió la segunda petición a la misma dirección hasta que terminó la primera. Coincide con el candado de la caché de HTTP de Chromium, que deja escribir una sola petición a la vez por dirección para no descargar dos veces lo mismo ([Chromium, cambio 8aacaf3](https://chromium.googlesource.com/chromium/src.git/+/8aacaf38e85c45876c72ea77e36ef17e5ab69c26)); Chrome no lo documenta como comportamiento oficial y no se investigó más, porque no es materia del curso, y no cambia ninguna conclusión de la lección: lo que importa es qué respuesta llega a la pantalla, y eso se midió en el recuadro, no en la bitácora.

#### 3.4.3 La tentación de quitarlo

La primera reacción ante dos peticiones es quitar `StrictMode`. La documentación lo permite y lo desaconseja en la misma frase: se puede apagar, pero el equipo de React recomienda dejarlo encendido ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). Ahora tienes la razón medida. En el experimento sin limpieza, `StrictMode` te mostró dos `200` donde debía haber un `cancelada` y un `200`, **antes** de que nadie eligiera dos servicios seguidos. Quitarlo habría escondido justo esa señal.

El ciclo extra tampoco existe en lo que se publica. La Lección 0 lo midió con `npm run preview`: una sola petición al abrir la página.

### 3.5 Las dependencias describen el código

#### 3.5.1 No eliges tus dependencias

Hasta aquí, las listas de dependencias del `revisor` han sido obvias: `[nombre]`, `[titulo]`, `[cargar, cadaMs, intento]`. Ahora llega un caso que no lo es, y que es la razón del criterio que el curso repite en cada lección.

El equipo de operación pidió una línea: «Actualizado a las 2:28:53 a.m.», debajo de la lista, que diga cuándo llegó el último reporte. La información de «llegó un reporte» la tiene `useReporte`; el lugar donde se dibuja la línea es `Panel`. La forma de conectarlos es la de siempre en React: `Panel` le pasa al hook una función, `alRecibir`, y el hook la llama cuando llega un reporte. El nombre sigue la regla del curso: las propiedades de función empiezan con `al`.

El primer intento es llamar a `alRecibir` dentro del Effect, después de `establecerCarga`, y no tocar nada más. ESLint responde así (medido en una copia):

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  43:6  warning  React Hook useEffect has a missing dependency: 'alRecibir'. Either include it or remove the dependency array. If 'alRecibir' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

El aviso dice la verdad: el Effect **usa** `alRecibir` y la lista no la nombra. Si lo dejaras así (o lo silenciaras con un comentario), el Effect se quedaría con la `alRecibir` del primer dibujo para siempre. Aquí no se notaría, porque todas las versiones de la función hacen lo mismo, pero el día que la función leyera algo del estado de `Panel` leería el valor del primer dibujo. La documentación de React tiene un nombre para eso, **valores viejos** (*stale values*), y una promesa: si nunca silencias el linter, nunca vas a ver problemas de valores viejos ([React, «Lifecycle of Reactive Effects»](https://react.dev/learn/lifecycle-of-reactive-effects)).

Esa misma página es tajante con la idea de fondo: **no puedes «elegir» tus dependencias.** Tienen que incluir cada valor reactivo que el Effect lee, y el linter lo hace cumplir. Los valores reactivos son las propiedades, el estado y todo lo que se declara dentro del componente, porque se calculan al dibujar y pueden cambiar de un dibujo a otro. La página sobre quitar dependencias lo dice al revés, con una frase que es el criterio del curso: la lista **describe** tu código; para cambiar la lista, cambia el código ([React, «Removing Effect Dependencies»](https://react.dev/learn/removing-effect-dependencies)).

#### 3.5.2 Obedecer al linter sin pensar: el lazo

Entonces obedece al aviso al pie de la letra y agrega `alRecibir` a la lista: `[cargar, cadaMs, intento, alRecibir]`. El linter queda conforme:

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0

```

Verde. Ahora abre el panel. Esto registró el servidor de práctica en los primeros cinco segundos de la página abierta en Chrome sin ventana, sin un solo clic:

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

Dieciocho renglones en total: **dieciséis** respuestas `200` y dos canceladas, en cinco segundos, cuando el panel debía pedir **una** (el sondeo es cada diez). Es una petición cada 300 ms, que es exactamente la demora del servidor: el panel pide, espera la respuesta, y en cuanto llega, vuelve a pedir. Para siempre. (La última cancelada es el guion cerrando la pestaña.)

Sigue la cadena con lo que sabes de 3.1:

1. Llega un reporte y el Effect llama a `alRecibir`.
2. `alRecibir` es `() => establecerActualizadoEn(new Date())`: cambia el estado de `Panel`.
3. `Panel` se vuelve a dibujar, y al dibujarse crea **otra** función flecha para `alRecibir`. Tiene el mismo texto, pero es otro objeto en memoria.
4. React compara las dependencias con `Object.is`. Para funciones, eso compara identidad: la función nueva **no es** la vieja. La lista cambió.
5. React ejecuta la limpieza (aborta y detiene el intervalo) y vuelve a empezar el Effect, que pide un reporte de inmediato. Vuelve al paso 1.

La documentación de React describe exactamente este mecanismo con un objeto `options`: cada objeto y cada función recién creados se consideran distintos de todos los demás, sin importar que su contenido sea igual, y por eso un Effect que depende de ellos se resincroniza más de lo necesario ([React, «Removing Effect Dependencies»](https://react.dev/learn/removing-effect-dependencies)). Y fíjate en lo que eso significa para la pregunta «¿cuántas veces se reinicia el intervalo?»: **en cada dibujo de `Panel`**. Con este `Panel`, en cada reporte que llega, lo que convierte el reinicio en un lazo. Sin el lazo (si `alRecibir` no cambiara el estado), cada clic en la casilla «Solo fallas» o en un servicio también dibujaría `Panel` de nuevo y reiniciaría el intervalo: el sondeo de diez segundos volvería a contar desde cero cada vez que alguien hace clic.

Esto es lo más importante de la sección: **el linter en verde no dice que el código esté bien. Dice que la lista no miente.** La lista mentía cuando faltaba `alRecibir`, y el linter avisó. Al agregarla dejó de mentir, y entonces la verdad quedó a la vista: tal como está escrito, este Effect **sí** depende de una función que cambia en cada dibujo. El linter cumplió su trabajo. Lo que está mal es el diseño, y se arregla cambiando el código.

#### 3.5.3 Las salidas que da la documentación

La página «Lifecycle of Reactive Effects» enumera qué hacer cuando la sugerencia del linter provoca un lazo o resincroniza demasiado. Resumidas, son cuatro: comprobar si el Effect es en realidad un solo proceso de sincronización o dos mezclados, y separarlos; mover los valores que no son reactivos fuera del componente o dentro del Effect; usar Effect Events para leer las propiedades y el estado más recientes sin resincronizar; y evitar objetos y funciones creados al dibujar como dependencias ([React, «Lifecycle of Reactive Effects»](https://react.dev/learn/lifecycle-of-reactive-effects)). Mira cuáles aplican aquí:

- **¿Mover la función dentro del Effect?** No se puede: la escribe `Panel`, que es otro componente.
- **¿Mover la función fuera de `Panel`?** Tampoco: llama a `establecerActualizadoEn`, que solo existe dentro.
- **¿`useCallback` en `Panel`?** Es lo que sugiere el propio aviso. Funcionaría aquí, porque `establecerActualizadoEn` nunca cambia, pero traslada el problema a quien usa el hook: cada componente que use `useReporte` tendría que acordarse de envolver su función, o el sondeo se volvería un lazo otra vez. Y el curso no presenta la memoización por costumbre. Un hook que depende de que sus usuarios recuerden algo es frágil.
- **¿Un Effect Event?** Esta es la que corresponde, por una razón de fondo que va en la siguiente sección.

La pregunta que decide no es técnica, es de significado: **¿avisar que llegó un reporte es parte de la sincronización con el servidor, o es algo que pasa *durante* la sincronización?** Si mañana `Panel` le pasa una función distinta, ¿hay que dejar de preguntarle al servidor y volver a empezar? No. El sondeo depende de con qué función se carga (`cargar`), de cada cuánto (`cadaMs`) y de si alguien pidió recargar (`intento`). A quién se le avisa cuando llega algo no cambia nada de eso.

### 3.6 `useEffectEvent`: leer lo último sin reiniciar

#### 3.6.1 Una función que se comporta como un evento

La documentación de React distingue dos clases de lógica. La de los manejadores de eventos **no es reactiva**: solo corre cuando la persona repite la interacción, por ejemplo otro clic. La de los Effects **sí es reactiva**: si lee una propiedad o un estado, ese valor va en las dependencias, y si cambia, el Effect corre otra vez ([React, «Separating Events from Effects»](https://react.dev/learn/separating-events-from-effects)). El aviso de «llegó un reporte» tiene las dos naturalezas mezcladas: se dispara desde el Effect (cuando el servidor responde), pero no debe hacer que el Effect se reinicie. Para eso existe `useEffectEvent`. Su referencia lo describe así: es un hook que te deja separar eventos de los Effects; los Effect Events forman parte de la lógica del Effect, pero se comportan más como un manejador de eventos: siempre «ven» los valores más recientes del dibujo (propiedades y estado) sin resincronizar el Effect, y por eso **quedan fuera de las dependencias** ([React, «useEffectEvent»](https://react.dev/reference/react/useEffectEvent)). Llegó como parte de React 19.2, publicado el 1 de octubre de 2025 ([React, «React 19.2»](https://react.dev/blog/2025/10/01/react-19-2)); este curso usa la 19.3.1.

Así queda `useReporte`:

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

Respecto a la Lección 2 cambian cuatro renglones: el `import` agrega `useEffectEvent`, el hook recibe el parámetro `alRecibir`, lo envuelve en `avisarRecibido`, y el Effect llama a `avisarRecibido(reporte)` (en el intento de 3.5 llamaba a `alRecibir` directamente). La lista de dependencias **no cambia**: sigue siendo `[cargar, cadaMs, intento]`, y el linter la acepta, porque la función que el Effect usa ahora es un Effect Event, y esas no van en la lista. El valor de `alRecibir` que corre es siempre el del último dibujo, aunque el Effect haya empezado varios dibujos antes.

En `Panel` (3.1.2) no cambia nada de lo que escribiste: sigue pasando una función flecha nueva en cada dibujo, `() => establecerActualizadoEn(new Date())`. Ya no importa. Esa es la ventaja frente a `useCallback`: el hook se defiende solo y quien lo usa no tiene que saber nada.

#### 3.6.2 Contar los reinicios

La tercera figura responde con un número la pregunta «¿cuántas veces se reinicia el intervalo?». Dos sondeos idénticos, uno con la función en las dependencias y otro con `useEffectEvent`, se dibujan tres veces, cada vez con una función nueva, como hace `Panel`:

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
    // Como en Panel: una función nueva en cada dibujo.
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

Con la función en las dependencias, el intervalo arranca **tres** veces en tres dibujos: uno por dibujo, aunque nada que importe haya cambiado. Con `useEffectEvent`, arranca **una** vez y se detiene una vez, al desmontar. (La figura no usa `StrictMode`, para que el conteo se lea sin el ciclo extra; «recibido» no aparece porque la figura termina mucho antes de los diez segundos del intervalo.)

Y en el `revisor`, con clics de verdad. Este guion abrió el punto de control sin cambios y, durante veintiún segundos, hizo cuatro clics en la casilla «Solo fallas» (la marcó y la desmarcó dos veces) y eligió dos servicios. Cada uno de esos clics dibuja `Panel` de nuevo:

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

La bitácora del servidor durante esos veintiún segundos:

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

El reporte llegó a las 53.440, 03.443 y 13.443: cada diez segundos con tres milésimas de diferencia, como si nadie hubiera tocado nada. Seis clics, cero reinicios del sondeo. Y la línea «Actualizado a las …» avanzó de 2:28:53 a 2:29:03 y a 2:29:13, siguiendo a cada reporte (recuerda que es hora local del navegador). Las dos parejas de detalle son las de 3.4: la `key` que monta un panel nuevo por servicio.

#### 3.6.3 Lo que `useEffectEvent` no es

Es tentador ver en `useEffectEvent` una forma de sacar de la lista cualquier cosa que estorbe. La documentación lo prohíbe con todas sus letras: no uses `useEffectEvent` para evitar declarar dependencias de tu Effect; esconde errores y hace el código más difícil de entender. Úsalo solo para lógica que de verdad es un evento disparado desde un Effect; si un valor debe hacer que el Effect corra otra vez, mantenlo como dependencia ([React, «useEffectEvent»](https://react.dev/reference/react/useEffectEvent)). El anuncio de React 19.2 repite la idea: no hace falta envolver todo en `useEffectEvent`, ni usarlo solo para callar el aviso, porque eso puede llevar a errores ([React, «React 19.2»](https://react.dev/blog/2025/10/01/react-19-2)).

La prueba para el `revisor` es la pregunta de 3.5.3. Si envolvieras `cadaMs` en un Effect Event para sacarlo de la lista, el día que alguien cambie el intervalo de 10 a 5 segundos el Effect no se enteraría, y estarías de vuelta en la escena de la Lección 0. `cadaMs` es parte de la sincronización. `alRecibir` no.

La referencia pone además tres límites. Es un hook, así que se llama en el primer nivel del componente o de tu hook, nunca dentro de un `if` o de un ciclo. Los Effect Events solo se llaman desde dentro de Effects o de otros Effect Events: no durante el dibujo, y no se pasan a otros componentes ni a otros hooks. Y su identidad cambia **a propósito** en cada dibujo ([React, «useEffectEvent»](https://react.dev/reference/react/useEffectEvent)). Esta última explica qué pasa si, por costumbre, pones `avisarRecibido` en la lista. El linter lo detiene (medido en una copia):

```text
~/curso-react/revisor/src/reporte/useReporte.ts
  44:32  warning  Functions returned from `useEffectEvent` must not be included in the dependency array. Remove `avisarRecibido` from the list  react-hooks/exhaustive-deps
```

Si lo ignoraras, como su identidad cambia en cada dibujo, tendrías otra vez el lazo de 3.5.2. La referencia de `useEffectEvent` dice que el linter hace cumplir estas restricciones, y el anuncio de 19.2 pide una versión reciente de `eslint-plugin-react-hooks` para que el linter no intente meter los Effect Events en la lista; la 7.1.1 del curso las conoce, como acabas de ver.

### 3.7 Cuándo no hace falta un Effect

#### 3.7.1 Dos Effects que sobran

Ya tienes tres Effects en el `revisor` y los tres sincronizan algo de fuera: el servidor (dos veces) y el documento. Toca la otra mitad del criterio: lo que **no** va en un Effect. La documentación de React le dedica una página entera, y empieza con dos frases que valen la lección: no necesitas Effects para transformar datos para el dibujo, y no necesitas Effects para manejar eventos de la persona ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)).

La segunda figura junta los dos errores en un archivo. No es parte del `revisor`, pero se parece mucho a lo que alguien escribiría en él: un resumen que cuenta las fallas en un Effect, y un botón que, al hacer clic, prende una bandera para que un Effect mande el reintento.

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

(El servidor de práctica de esta lección no tiene ruta de reintento; aquí la figura solo se revisa con el linter, nunca se ejecuta.) El mensaje es el mismo que la Lección 0 te enseñó a leer, y lo explica todo: un Effect debe actualizar sistemas externos con el estado de React, o suscribirse a un sistema externo y cambiar el estado cuando ese sistema responde. Ninguno de los dos casos de la figura hace eso.

**El primero calcula.** `fallas` se puede obtener a partir de `estados` en el momento de dibujar. Guardarlo en estado y copiarlo con un Effect produce un dibujo con el número viejo, un Effect que lo corrige y otro dibujo con el número bueno: un dibujo tirado, y un instante en que la pantalla dice algo falso. La documentación lo pone como regla: cuando algo se puede calcular a partir de las propiedades o el estado existentes, no lo pongas en el estado; calcúlalo al dibujar ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). Es la tercera regla de forma de la Lección 2, «no guardar lo que se puede calcular», vista desde el lado de los Effects. Y es lo que el `revisor` ya hace en `Panel`: `const fallas = … contarFallas(…)`, una constante, y el Effect solo la copia al documento.

**El segundo reacciona a un clic.** El reintento no lo causa que el botón se dibuje, sino que la persona lo apriete. La documentación usa casi el mismo ejemplo, comprar un producto: no quieres comprarlo dos veces, y por eso mismo no debe ir en un Effect, porque comprar no lo causa el dibujo sino una interacción concreta, y debe correr solo cuando la persona aprieta el botón ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). Piensa además en `StrictMode`: si la petición viviera en un Effect sin bandera, el ciclo extra de desarrollo mandaría el reintento dos veces. El arreglo es moverla al manejador del clic, donde la bandera deja de existir. El ejercicio 4 te pide hacerlo.

#### 3.7.2 La tabla de bolsillo

La página «You Might Not Need an Effect» enumera doce situaciones en que la gente escribe un Effect que sobra. Las que ya aparecieron en el `revisor`, con dónde vive cada una:

| Tentación | Dónde va en realidad | En el `revisor` |
|---|---|---|
| actualizar un estado a partir de otro | se calcula al dibujar | `fallas` en `Panel`, `visibles` y `existe` en `ContenidoReporte` |
| reiniciar todo el estado cuando cambia una propiedad | una `key` | `<PanelDetalle key={seleccionado}>` |
| mandar una petición `POST` por un clic | el manejador del evento | todavía no hay uno en el `revisor`; el plan lo prevé para el reintento y el alta |
| avisar al padre que algo cambió | se llama a la función del padre en el mismo evento | `alSeleccionar`, `alCambiar`, `alGuardarNota` |
| pedir datos | sí es un Effect, con limpieza (o una librería) | `useDetalle` y `useReporte` |

Fíjate en la última fila. Pedir datos **sí** es sincronizar, y por eso el `revisor` lo hace en un Effect. Pero la referencia de `useEffect` es honesta con sus límites: pedir datos a mano en Effects no corre en el servidor, tiende a producir cascadas (el padre pide, dibuja, y entonces cada hijo pide lo suyo), no guarda nada en caché y exige mucho código repetido para evitar errores como la carrera; y recomienda usar una librería de caché del lado del cliente, entre ellas TanStack Query ([React, «useEffect»](https://react.dev/reference/react/useEffect)). Ya escribiste ese código repetido dos veces: `useReporte` y `useDetalle` se parecen mucho. Según el plan del curso, de ahí parte la Lección 4.

#### 3.7.3 Lo que ya estaba bien

Antes de seguir, mira lo que el `revisor` hacía bien sin que nadie lo explicara. El botón «Actualizar» pone `cargando` en `recargar`, dentro del manejador del clic, y solo después cambia `intento` para que el Effect se reinicie: el estado de la pantalla lo cambia el evento, la sincronización la hace el Effect. `cargarReporte` y `cargarDetalle` son funciones de módulo, iguales en cada dibujo, así que `cargar` en la lista de `useReporte` no reinicia nada. Y `alSeleccionar` cambia la selección en el clic; nadie «observa» la selección con un Effect para hacer algo después. Todo eso es el mismo criterio aplicado antes de tener nombre.

## El error que vas a ver

La lección tiene un error principal, el que aparece al intentar volver a «Cargando detalle…» sin `key`, y dos de apoyo que ya viste en 3.5 y 3.6.

**El error principal: «reiniciar el estado dentro del Effect».** Quita la `key` de `<PanelDetalle>` y, para que el recuadro vuelva a «Cargando detalle…» al cambiar de servicio, escribe `establecerCarga({ tipo: "cargando" })` como primer renglón del Effect de `useDetalle`. El linter lo rechaza (medido en una copia):

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

(En esa corrida había un segundo cambio a propósito en otro archivo, el de 3.6.3, y por eso el resumen final dijo `✖ 2 problems (1 error, 1 warning)`; aquí se muestra solo el bloque de este error.) Se lee de arriba abajo: el archivo, el renglón 14 y la columna 5, el nombre del error, la explicación general (la misma de la figura 2), el código con una flecha que apunta a la llamada, y al final el nombre de la regla, `react-hooks/set-state-in-effect`. Es un **error**, no un aviso: detiene `npm run lint` aunque no existiera `--max-warnings 0`.

El arreglo no es silenciar la regla ni mover la llamada a un lugar donde el linter no la vea (por ejemplo, a un `setTimeout` de cero milisegundos dentro del Effect, que es el mismo dibujo tirado escondido). El arreglo es preguntar qué quieres decir. Quieres decir «cuando cambia el servicio, el recuadro empieza de cero». Eso, en React, se escribe con `key` (3.3.4), y el Effect queda limpio porque ya no tiene que corregir nada.

**El aviso de la dependencia que falta.** `React Hook useEffect has a missing dependency: 'alRecibir'` (3.5.1). El arreglo no es agregarla a ciegas, porque eso produjo el lazo de dieciséis peticiones en cinco segundos; tampoco es seguir la sugerencia del final del mensaje y envolver la función en `useCallback` en el padre. Es preguntarte si esa función es parte de la sincronización. Si no lo es, `useEffectEvent`.

**El Effect Event en la lista.** `Functions returned from useEffectEvent must not be included in the dependency array` (3.6.3). El arreglo es el que dice el mensaje: quitarla. Su identidad cambia en cada dibujo a propósito.

## Lo que se hace mal

**Pensar en «al montar».** Escribir `useEffect(() => { … }, [])` con la idea de «esto corre una vez, cuando carga» lleva a Effects sin limpieza, y `StrictMode` los delata con su ciclo extra. Piensa en ciclos de empezar y dejar de sincronizar.

**Pedir datos sin limpieza.** La respuesta vieja llega tarde y escribe encima de la buena. Que la `key` lo tape en una pantalla no lo arregla en el hook, y la petición viaja completa para tirarse.

**Tratar el aborto como error.** Sin `if (control.signal.aborted) return;`, el aborto de la limpieza se pinta como falla: en desarrollo, por el ciclo extra de `StrictMode`, en cada servicio que eliges (lo mediste en 3.2.3); sin `key`, también en cada cambio de servicio. Un aborto es la limpieza funcionando.

**Reiniciar el estado con un `setState` dentro del Effect.** Produce un dibujo tirado y el linter lo rechaza. Para reiniciar todo el estado de un componente cuando cambia lo que muestra, usa `key`.

**Silenciar `exhaustive-deps`.** Un `// eslint-disable-next-line react-hooks/exhaustive-deps` deja la lista mintiendo y garantiza valores viejos más adelante. Si el aviso te molesta, el código tiene un problema de diseño.

**Creer que el linter en verde significa «correcto».** Agregar `alRecibir` a la lista dejó el linter limpio y el panel pidiendo un reporte cada 300 ms. El linter garantiza que la lista dice la verdad, no que la verdad te convenga.

**Usar `useEffectEvent` para esconder dependencias.** Si un valor debe reiniciar la sincronización, como `cadaMs`, va en la lista. `useEffectEvent` es para lo que ocurre durante la sincronización, no para lo que la define.

**Calcular en un Effect.** Copiar a un estado algo que se puede calcular al dibujar produce un dibujo de más y un instante de pantalla falsa. Calcúlalo como constante.

**Mandar una petición por un clic desde un Effect.** El clic es un evento; la petición va en su manejador. En un Effect, `StrictMode` la manda dos veces en desarrollo y cualquier cambio de dependencias la repite.

**Quitar `StrictMode` porque duplica peticiones.** El ciclo extra es la prueba de que la limpieza existe, y en producción no ocurre.

## Ejercicios

### Ejercicio 1 — Lee la bitácora antes de verla

Con el punto de control sin cambios, el servidor de práctica y `npm run dev` encendidos, vas a abrir la página, esperar a que cargue, elegir `catálogo`, esperar dos segundos y elegir `inventario`. **Antes de hacerlo**, escribe en tu bitácora cuántos renglones va a agregar el servidor por los dos detalles, en qué orden, y cuáles dirán `cancelada por el cliente`. Después hazlo y compara. ¿Cambiaría algo si eligieras `inventario` solo 100 ms después de `catálogo`?

### Ejercicio 2 — El experimento obvio, y el completo

En una copia del `revisor`, quita solo el renglón `return () => control.abort();` de `useDetalle`. Elige `pagos` y, enseguida, `inventario`. Anota qué muestra el recuadro a los dos segundos y qué registra el servidor. Luego quita también `key={seleccionado}` de `ContenidoReporte` y repite. Explica en tres frases por qué el primer experimento no muestra la carrera y el segundo sí. ¿Avisa el linter en alguno de los dos?

### Ejercicio 3 — La bandera en lugar del aborto

Reescribe `useDetalle` con la forma de bandera de 3.3.2 (`let ignorar = false` y una limpieza que la pone en `true`), sin `AbortController`. Comprueba que `npm run lint` no avisa nada y que, sin `key`, la carrera sigue arreglada en la pantalla. **Predice** qué cambia en la bitácora del servidor al elegir `pagos` y luego `inventario`, y compruébalo. Restaura el archivo al terminar.

### Ejercicio 4 — Arregla la figura 2 sin Effects

Corrige `fig03_02.tsx` para que `npx eslint fig03_02.tsx` no informe nada, **sin** silenciar ninguna regla y sin conservar ningún `useEffect`. `Resumen` debe seguir mostrando el número de fallas, y `BotonReintento` debe seguir mandando el `POST` al hacer clic.

## Soluciones

### Solución 1

Al elegir `catálogo`, la `key` monta un `PanelDetalle` nuevo y `StrictMode` corre el ciclo extra: un renglón `GET /api/servicios/cat%C3%A1logo cancelada por el cliente` y, unos 200 ms después, `GET /api/servicios/cat%C3%A1logo 200`. Dos segundos después, al elegir `inventario`, pasa lo mismo: `cancelada` y `200`. Cuatro renglones, dos cancelados, en el orden cancelada, 200, cancelada, 200. Así salió medido con la casilla, `catálogo` e `inventario` en la corrida de 3.6.2: `08:28:58.612 … cat%C3%A1logo cancelada por el cliente`, `08:28:58.814 … cat%C3%A1logo 200`, `08:29:00.611 … inventario cancelada por el cliente` y `08:29:00.813 … inventario 200`. Fíjate en que el nombre con acento viaja codificado (3.2.2). Si eligieras `inventario` solo 100 ms después, la petición real de `catálogo` todavía no habría terminado (tarda 200 ms), así que también saldría `cancelada`: verías tres renglones `cancelada` y un solo `200`, el de `inventario`. Es la carrera arreglada, la misma que 3.2.3 midió con `pagos`. Este último caso no se midió; es la predicción que sale de la regla, y comprobarla es tu parte. Y recuerda la precisión de la Lección 0: el renglón `cancelada` del ciclo extra aparece solo si la conexión alcanzó a llegar al servidor antes del aborto. Si en tu máquina falta alguno, no es que `StrictMode` esté apagado.

### Solución 2

Es el experimento que 3.3.3 midió. Con solo la limpieza quitada, el recuadro dice a los dos segundos «Disponible: HTTP 200 en 118 ms», el dato correcto de `inventario`; la bitácora muestra dos `GET /api/servicios/inventario 200` y un `GET /api/servicios/pagos 200` que llegó casi un segundo después del primero de `inventario` (y otro `pagos` que quedó pendiente hasta que se cerró la pestaña, por lo que explica 3.4.2). La carrera ocurrió en la red, pero no en la pantalla, porque la `key` desmontó el panel de `pagos` y su respuesta escribió en un componente que ya no existía. Sin `key` y sin limpieza, el recuadro dice a los dos segundos «En falla: HTTP 503» debajo de «inventario»: el mismo componente recibió la respuesta vieja. El linter no avisa en ninguno de los dos casos: una limpieza que falta no rompe ninguna regla visible en el texto, y quitar una `key` tampoco. Por eso esta lección mide en el navegador y no solo con ESLint.

### Solución 3

Una forma correcta:

```ts
// useDetalle con bandera (fragmento para el ejercicio)
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

La pantalla queda igual de protegida: la respuesta vieja llega, pero la bandera de su ciclo ya está en `true` y no escribe nada. Lo que cambia es la bitácora: ya no hay ningún `cancelada por el cliente` (ni el de `StrictMode` ni el del cambio de servicio), y en su lugar aparecen respuestas `200` completas de peticiones que nadie usa, entre ellas la de `pagos`, 1.5 segundos de trabajo del servidor tirados. Es la diferencia de 3.3.2: la bandera ignora, el aborto además corta. El curso conserva el aborto. Nota que `cargarDetalle` sigue pidiendo una señal; aquí se le da una que nadie aborta.

### Solución 4

Ninguno de los dos componentes sincroniza nada con un sistema externo, así que ninguno necesita un Effect:

```tsx
// fig03_02.tsx corregida (fragmento)
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

`fallas` es una constante calculada en cada dibujo, y desaparecen el estado, el Effect y el dibujo tirado. El `POST` vive en el manejador del clic, y desaparecen la bandera `pedido` y el riesgo de mandarlo dos veces. Fíjate en `encodeURIComponent`: es la misma regla de 3.2.2, y la figura ya la traía. Con esta versión, `npx eslint` no informa nada. Fíjate en que el archivo corregido ni siquiera importa `useEffect` ni `useState`: la forma más segura de no equivocarse con un Effect es no escribirlo cuando no hace falta.

## Cómo sé que lo logré

- [ ] `npm run lint` termina sin escribir ningún problema, y en todo `src/` no hay un solo comentario `eslint-disable`.
- [ ] `npm run build` termina con `✓ built` y deja en `dist/assets/` un archivo `index-CTkBRgQQ.js`, el mismo nombre que el punto de control del curso (si tu proyecto es idéntico byte por byte; si cambiaste un texto, el nombre cambia y no es un error).
- [ ] Con el servidor de práctica encendido, `curl` a `/api/servicios/pagos` tarda cerca de 1.5 s y responde `200`, y `curl` a `/api/servicios/nada` responde `404` con `{"detalle":"no existe el servicio nada"}`.
- [ ] Con el panel abierto en `npm run dev` y dos fallas en el reporte, la pestaña dice `(2) Revisor`.
- [ ] Al elegir `pagos` y enseguida `inventario`, el recuadro termina diciendo «Disponible: HTTP 200 en 118 ms», y en la bitácora la petición real de `pagos` aparece como `cancelada por el cliente`.
- [ ] En una copia sin `key` y sin `control.abort()`, reprodujiste la carrera: el recuadro termina diciendo «En falla: HTTP 503» debajo de «inventario». Y sabes explicar por qué quitar solo `control.abort()` no basta para verla.
- [ ] Con la página abierta veinte segundos y varios clics en la casilla «Solo fallas», la bitácora registra un `GET /api/estados 200` cada diez segundos, ni uno más.
- [ ] Sabes decir, para cada uno de los tres Effects del `revisor`, con qué sistema externo se sincroniza, qué hace al empezar y qué deshace su limpieza.
- [ ] Anotaste en tu [bitácora](bitacora.md) la carrera que reprodujiste, el lazo de peticiones que produjo obedecer al linter sin pensar, y qué cambió en tu forma de leer `useEffect`.

## Resumen

Responde sin mirar la lección:

1. ¿Qué dos funciones tiene un Effect y qué hace cada una? ¿Por qué la documentación pide pensar desde el Effect y no desde el componente?
2. ¿Qué es la carrera de respuestas? ¿Por qué la respuesta de `pagos` puede llegar después de la de `inventario`, aunque se pidiera antes?
3. ¿Cuál es la diferencia entre abortar la petición e ignorar su resultado? ¿Qué ve el servidor en cada caso?
4. ¿Por qué el `revisor` reinicia el detalle con `key` y no con un `setState` dentro del Effect? ¿Qué dice el linter si lo intentas?
5. ¿Qué hace `StrictMode` con un Effect en desarrollo, y cuál es la regla para saber si tu Effect pasa esa prueba?
6. ¿Por qué agregar `alRecibir` a la lista dejó el linter en verde y el panel pidiendo un reporte cada 300 ms? ¿Qué papel juega `Object.is`?
7. ¿Qué hace `useEffectEvent`, dónde se puede llamar, y por qué no sirve para sacar `cadaMs` de la lista?
8. Da dos ejemplos de código que no debería estar en un Effect y di dónde va cada uno.

## Para leer más

- [React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects): qué es un Effect, la limpieza, por qué `StrictMode` monta dos veces en desarrollo, la carrera de respuestas y el ejemplo de la compra que no va en un Effect. Consultado el 21 de octubre de 2026.
- [React, «Lifecycle of Reactive Effects»](https://react.dev/learn/lifecycle-of-reactive-effects): empezar y dejar de sincronizar, pensar desde el Effect, los valores reactivos, «no puedes elegir tus dependencias» y por qué no se silencia el linter. Consultado el 21 de octubre de 2026.
- [React, «Separating Events from Effects»](https://react.dev/learn/separating-events-from-effects): lógica reactiva y no reactiva, los Effect Events y sus límites. Consultado el 21 de octubre de 2026.
- [React, «Removing Effect Dependencies»](https://react.dev/learn/removing-effect-dependencies): funciones y objetos como dependencias, la lista que describe el código, y las salidas para quitar una dependencia. Consultado el 21 de octubre de 2026.
- [React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect): calcular al dibujar, reiniciar el estado con `key`, las peticiones por un evento y la carrera al pedir datos. Consultado el 21 de octubre de 2026.
- [React, «useEffect»](https://react.dev/reference/react/useEffect): la firma, cómo se comparan las dependencias con `Object.is`, el ciclo extra de `StrictMode` y los límites de pedir datos a mano. Consultado el 21 de octubre de 2026.
- [React, «useEffectEvent»](https://react.dev/reference/react/useEffectEvent): qué hace, sus límites y la advertencia contra usarlo para esconder dependencias. Consultado el 21 de octubre de 2026.
- [React, «React 19.2»](https://react.dev/blog/2025/10/01/react-19-2): el anuncio de `useEffectEvent`, del 1 de octubre de 2025, y la necesidad de una versión reciente del linter. Consultado el 21 de octubre de 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): la `key` como parte de la posición y el estado que se destruye al quitar un componente. Consultado el 21 de octubre de 2026.
- [React, «set-state-in-effect»](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect): qué rechaza la regla y por qué. Consultado el 21 de octubre de 2026.
- [React, «<title>»](https://react.dev/reference/react-dom/components/title): el componente `<title>` de React 19, que se coloca en el `<head>`, y la advertencia de no dibujar dos a la vez. Consultado el 21 de octubre de 2026.
- [MDN, «AbortController: abort() method»](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort): qué interrumpe `abort()` y la excepción `AbortError`. Consultado el 21 de octubre de 2026.
- [MDN, «Document: title property»](https://developer.mozilla.org/en-US/docs/Web/API/Document/title): leer y cambiar el título del documento. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| Effect | código que corre después de dibujar para sincronizar un componente con algo fuera de React: un servidor, el documento, un temporizador |
| limpieza | la función que devuelve un Effect; deshace lo que el Effect empezó, antes del siguiente ciclo y al quitar el componente |
| ciclo de un Effect | empezar a sincronizar y, después, dejar de sincronizar; se repite cada vez que cambia algo de la lista |
| dependencias | la lista de valores reactivos que el Effect usa; describe el código, no se elige |
| valor reactivo | una propiedad, un estado o cualquier valor calculado dentro del componente, que puede cambiar entre dibujos |
| carrera de respuestas | dos peticiones en el aire que llegan en un orden distinto del que se enviaron, y la vieja escribe encima de la nueva |
| `AbortController` | objeto del navegador que permite cancelar una petición `fetch` desde fuera, a través de su señal |
| valor viejo (*stale*) | el valor de un dibujo anterior que un Effect sigue usando porque su lista no lo nombra |
| Effect Event | función creada con `useEffectEvent`: se llama desde un Effect, siempre ve los valores más recientes y no va en la lista de dependencias |

---

**Siguiente:** [Lección 4 — Estado del servidor con TanStack Query](04-estado-del-servidor.md)
