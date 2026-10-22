# Lección 4 — Estado del servidor con TanStack Query

*Son las 16:50 y a las 17:00 operación cierra el turno con una pregunta: «¿ya se recuperó pagos?». En tu panel, `pagos` sigue en rojo. Alguien del equipo de infraestructura jura que lo reinició hace cinco minutos. Abres el detalle de `pagos`: dice «En falla». Cierras el detalle, abres el de `catálogo`, regresas a `pagos`… y el panel vuelve a pedir todo desde cero, con su «Cargando…» de siempre, como si nunca lo hubiera visto. Pulsas «Actualizar»: la lista cambia a verde, pero el detalle que tenías abierto sigue diciendo «En falla». Dos partes de la misma pantalla cuentan dos historias distintas sobre el mismo servicio, y tienes diez minutos para decir cuál es la verdad. El problema no es la API. Es que cada componente trae sus datos por su cuenta y ninguno sabe lo que sabe el otro. Esta lección le da al panel un solo lugar donde vive lo que llegó del servidor.*

(La escena todavía no la puedes provocar con el servidor de práctica de la Lección 3: ahí `pagos` nunca se recupera. Esta lección le da al servidor la ruta que lo «revisa otra vez», y en 4.6.1 vas a ver la escena completa, y resuelta.)

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 4.4 y 4.5)

**Qué construyes:** el reporte del `revisor` con caché, actualización en segundo plano, los cuatro estados de una consulta más el de «datos viejos», un botón «Volver a revisar» que le pide al servidor revisar un servicio y deja la lista y el detalle al día, y un límite de error que atrapa lo que falle al dibujar

**Qué aprendes:** por qué traer datos a mano no escala (caché, cascadas, carreras); `useQuery`, `queryKey` y `signal`; `status` frente a `fetchStatus`; `staleTime`, reintentos y `refetchInterval`; `useMutation` e invalidación; **el cuarto estado: vacío**; lo que Suspense no hace; el Error Boundary, la única clase del curso

**De dónde vienes.** De la [Lección 3](03-effects-sincronizar.md). Tu `revisor` pide el reporte con un hook propio, `useReporte`, que sondea cada 10 segundos con un Effect, un `AbortController` y un `useEffectEvent` para que el sondeo no se reinicie cuando `Panel` le pasa una función nueva. El detalle de un servicio lo trae otro hook, `useDetalle`, con su propio Effect que aborta cuando cambia el nombre, y `ContenidoReporte` monta `<PanelDetalle key={seleccionado}>` para que cambiar de servicio reinicie el panel completo. Todo eso funciona, y funciona por buenas razones: la Lección 3 reprodujo la carrera de respuestas y la arregló. En esta lección vas a borrar los dos hooks. No porque estuvieran mal, sino porque resolvían a mano, uno por uno, un problema que tiene nombre y herramienta. Trabajas sobre el mismo proyecto, `~/curso-react/revisor/`.

**Qué no hace esta lección.** No agrega pantallas ni direcciones: la lista y el detalle siguen en la misma página, y la selección sigue siendo un estado de `Panel`; las rutas llegan en la [Lección 5](05-rutas-url-como-estado.md). No usa Suspense para cargar datos: explica qué haría y por qué este panel no lo necesita. No escribe pruebas automáticas: las de los cuatro estados llegan en la [Lección 8](08-pruebas-de-componentes.md). No da de alta servicios: el servidor de práctica ya sabe hacerlo desde esta lección, pero el formulario es de la [Lección 7](07-formularios-accesibilidad.md). Y no explica el servidor de práctica, que crece aquí a su versión final: solo dice qué rutas nuevas tiene.

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas del `package.json` de esta lección. El punto de control se reinstaló con `npm ci` y pasó `npm run lint` y `npm run build`, con el mismo nombre de archivo en `dist/` que las corridas del curso obtuvieron también en un contenedor Linux (`index-CHheidKQ.js`); por eso lo que ves aquí es lo que verás en tu Linux Mint, salvo un aviso de `npm ci` sobre `fsevents` que solo aparece en macOS y se explica donde sale. Tras el último cambio del punto de control (el botón de fila que alterna y la guarda de `%` en el servidor de práctica) se volvió a instalar desde cero con `npm ci` en un contenedor Linux (imagen oficial `node:24.22.0-bookworm`) y dio el mismo nombre en macOS y en Linux. Lo que se ve «en el navegador» se midió con Chrome sin ventana (`--headless`), manejado por su protocolo de depuración: un programa pequeño abría la página, pulsaba los botones como lo harías tú y anotaba, con milisegundos desde que abrió la página, cada petición que salía a `/api/` y cada cambio en la pantalla. Es el mismo registro que ves en la pestaña «Red» de las herramientas de desarrollo, contado por escrito. Las capturas del navegador de 4.5, 4.6.1 y 4.9 se tomaron con una versión de `PanelDetalle` que, si fallaba la actualización del detalle, mostraba solo el error y escondía los datos; la que ves en 4.6 corrige eso, y se comprobó que sigue entregando lo mismo cuando las peticiones salen bien, que es todo lo que esas capturas registran. Las horas de la bitácora del servidor de práctica están en UTC; la hora que pinta el panel («Actualizado a las 2:11:47 a.m.») es la local de la máquina, que estaba en el horario del centro de México. Las rutas largas se muestran a partir de `~/curso-react`. Para comparar tamaños se construyó también el punto de control de la Lección 3, con el mismo resultado que las corridas del curso registran para él (`index-CTkBRgQQ.js`). Los programas están en [`programas/04-estado-del-servidor/`](../programas/04-estado-del-servidor): `revisor/` es el punto de control y las tres figuras están junto a él, con su propio `package.json`, que es el de las figuras de la Lección 0 más `@tanstack/react-query`. Las tres se volvieron a correr desde cero en una carpeta nueva, partiendo del `package.json` de la Lección 0 y agregando solo Query, como se indica en 4.1, y dieron salidas idénticas a las que se muestran. Cada lección del curso se escribió con sus propios puertos para no chocar con otras corridas en la misma máquina; tú usa los de siempre: 3100 para el servidor de práctica, 5173 para `npm run dev` y 4173 para `npm run preview`.

## Al terminar vas a poder

- Mostrar, con una figura que cuenta llamadas, cuántas peticiones hace un dato pedido a mano por dos componentes y cuántas hace con TanStack Query, y explicar de dónde sale la diferencia.
- Configurar un `QueryClient` con `staleTime` y `retry`, montarlo con `QueryClientProvider` y escribir una consulta con `queryOptions`, una clave y una función que recibe el `signal`.
- Distinguir `status` de `fetchStatus`, nombrar las cinco combinaciones que provoca la figura 2 y señalar cuál pinta «· actualizando…» en el pie del panel.
- Dibujar los cuatro estados de una consulta (cargando, error, vacío y con datos) más el de «datos viejos», y provocar cada uno con el servidor de práctica.
- Escribir una mutación con `useMutation` que, al terminar bien, invalide las consultas afectadas, y leer en la bitácora la petición `POST` seguida de las dos que provoca la invalidación.
- Explicar qué errores atrapa un Error Boundary y cuáles no, y por qué es la única clase del curso.

## El porqué antes del cómo

Mira lo que el `revisor` hace hoy, al final de la Lección 3, con los ojos de quien opera el panel.

**El mismo dato se pide dos veces.** `Panel` necesita el reporte para la lista; el título de la pestaña, `(2) Revisor`, necesita el mismo reporte para contar fallas. Hoy funciona porque los dos viven en el mismo componente y comparten el resultado de un solo `useReporte`. Pero en cuanto el encabezado de la [Lección 5](05-rutas-url-como-estado.md) quiera mostrar «2 servicios con falla» desde otra parte del árbol, tendrás dos opciones: subir el estado hasta un ancestro común y bajarlo por propiedades, o llamar `useReporte` dos veces y hacer dos peticiones por el mismo dato. Ninguna escala.

**Salir y volver cuesta lo mismo que entrar.** Cuando eliges `pagos`, `useDetalle` lo pide; cuando eliges `catálogo` y regresas a `pagos`, lo pide otra vez desde cero, con su «Cargando detalle…» de 1.5 segundos, aunque lo viste hace cinco. El hook no tiene memoria: su estado vive en el componente, y el componente se desmonta. La documentación de React lo dice con estas palabras: pedir datos directamente en un Effect suele significar que no los cargas por adelantado ni los guardas, así que si el componente se desmonta y se vuelve a montar, tiene que pedirlos otra vez ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)).

**Lo que cambias en un lugar no se entera en el otro.** Si mañana el detalle tuviera un botón que le pide al servidor volver a revisar `pagos`, la respuesta llegaría al detalle… y la lista seguiría pintando `pagos` en rojo hasta el siguiente sondeo, diez segundos después. Para avisarle a la lista tendrías que pasarle a `PanelDetalle` una función `recargarLista` desde `Panel`, y otra más por cada pantalla que dependa de ese servicio.

**Y cada hook vuelve a escribir lo mismo.** `useReporte` y `useDetalle` tienen, cada uno, su `AbortController`, su `try`/`catch`, su `if (control.signal.aborted) return`, su unión `cargando`/`listo`/`error`. Es el código que la Lección 3 te enseñó a escribir bien, y precisamente por eso conviene notar lo que pesa: la misma página de React lo describe como «poco ergonómico», con bastante código repetido para no caer en errores como las carreras de respuestas.

Esa página no se queda en la queja: recomienda, si no usas un framework, «usar o construir una caché del lado del cliente», y nombra tres soluciones abiertas; la primera es **TanStack Query**. Y agrega algo que conviene leer despacio: si construyes la tuya, usarás Effects por debajo, pero tendrás que agregar la lógica para no repetir peticiones, guardar respuestas y evitar cascadas. Eso es lo que hace la librería. Por debajo sigue habiendo un `fetch` con un `signal`; lo que cambia es **quién es dueño del dato**. Hasta hoy, el dueño del reporte era el componente que lo pedía. A partir de esta lección, el dueño es una caché que vive fuera de los componentes, y los componentes solo se **suscriben** a lo que necesitan.

Ese cambio tiene un nombre que da título a la lección: **estado del servidor**. El estado que la Lección 2 te enseñó a manejar —la casilla «Solo fallas», el servicio elegido, el borrador de una nota— es tuyo: nace en la pantalla, solo la pantalla lo cambia y no envejece por su cuenta. El reporte es otra cosa. Es una **copia** de algo que vive en otra computadora, que otras personas pueden cambiar sin avisarte, que tarda en llegar, que puede fallar al pedirlo y que empieza a envejecer en el instante en que llega. Tratarlo con `useState` es tratar una fotografía como si fuera una ventana.

Son tres conceptos nuevos. El primero es **la consulta: un dato del servidor con una clave y una caché**, y ocupa tres secciones: el problema medido (4.1), la instalación y el cliente (4.2), y las claves, las funciones de consulta y el sondeo (4.3). El segundo es **los estados de una consulta y cómo los dibuja la pantalla**: `status` frente a `fetchStatus` (4.4) y los cuatro estados más uno (4.5); lo completan, después del tercero, lo que Suspense no hace con esos estados (4.7) y el límite de error, que atrapa el estado de error cuando se escapa del componente (4.8). El tercero es **la mutación y la invalidación**: cambiar un dato en el servidor y avisarle a la caché (4.6). La sección 4.9 no agrega un concepto: es el recorrido completo, donde los tres se ven juntos. Al final vas a construir esto, y vas a saber por qué el JavaScript creció unos 37 kilobytes:

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

## Los conceptos

### 4.1 El problema, medido: dos componentes, un dato

Antes de instalar nada, mide el problema. La primera figura monta dos veces el mismo componente —piensa en el encabezado y en el resumen, que necesitan el mismo reporte—, cuenta cuántas veces se llama a una «API» de mentira que tarda 50 ms, luego los desmonta (la persona sale de la pantalla) y los vuelve a montar (regresa). Lo hace dos veces: con un Effect por componente, como en la Lección 3, y con TanStack Query.

Las figuras de esta lección importan TanStack Query, así que tu carpeta de figuras también lo necesita. En `~/curso-react/figuras/`, la que armaste en la Lección 0, agrégalo con su versión exacta:

```bash
npm install --save-dev --save-exact @tanstack/react-query@5.104.5
```

O copia el `package.json` y el `package-lock.json` de `programas/04-estado-del-servidor/` y corre `npm ci`. Las dos formas se probaron desde una carpeta vacía y las tres figuras dieron exactamente las salidas que ves aquí. Si te saltas este paso, el primer `npx tsc` se queja de que no encuentra el módulo `@tanstack/react-query`.

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

Lee las dos mitades renglón por renglón.

**A mano, dos componentes son dos llamadas.** Cada `ConteoAMano` tiene su propio Effect, su propio estado y su propio `AbortController`. No hay forma de que uno sepa que el otro ya está pidiendo lo mismo: los Effects son privados de cada componente. Al volver, los dos empiezan otra vez en `cargando` y hacen otras dos llamadas, porque su estado se perdió al desmontarse.

**Con Query, dos componentes son una llamada.** Los dos `ConteoConQuery` piden la clave `["reporte"]`. La primera vez que alguien la pide, Query arranca la función; cuando el segundo la pide mientras la primera sigue en vuelo, Query no arranca otra: lo **suscribe** a la misma. Esto se llama *deduplicación* de peticiones. Y al volver, la pantalla muestra «4 servicios» **de inmediato**, sin pasar por `cargando`, y no hace ninguna llamada. El dato no vivía en los componentes: vivía en la caché del `QueryClient`, que siguió ahí mientras la pantalla estaba vacía.

¿Por qué ninguna llamada al volver? Por la línea `staleTime: 5_000`. Le dice a Query que, durante cinco segundos después de llegar, ese dato se considera **fresco** y no vale la pena volver a pedirlo. Cuando se vence ese plazo, el dato se vuelve **viejo** (*stale*), y la siguiente vez que un componente se suscriba, Query mostrará lo que tiene y, en paralelo, lo pedirá otra vez. En el ejercicio 2 quitas esa línea y lo compruebas.

El plan de este curso resume en tres palabras por qué traer datos a mano no escala: **caché**, **cascadas** y **carreras**. La figura acaba de medir la primera. La página de React que se citó en «El porqué» enumera cuatro problemas: que los Effects no corren en el servidor, las cascadas, que no se precarga ni se guarda nada en caché, y que es poco ergonómico, con errores como las carreras. El primero no aplica a este panel, que no se dibuja en un servidor; los otros tres son los del plan. La segunda palabra son las **cascadas** (*network waterfalls*), el segundo problema de esa lista: un padre pide sus datos, se dibuja, y hasta entonces sus hijos empiezan a pedir los suyos; con una red lenta, cada nivel suma su espera ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). La figura no lo mide y el `revisor` no lo sufre todavía, porque su detalle solo se pide cuando alguien elige un servicio. Lo que Query aporta contra las cascadas es que una consulta se puede pedir **desde fuera de un componente** —por ejemplo, cuando el enrutador sabe a qué pantalla vas, antes de dibujarla—, y eso es lo que la Lección 5 aprovecharía si lo necesitara. Aquí basta con saber que el problema existe y que tiene salida. La tercera palabra, las **carreras**, la viste de cerca en la Lección 3; cómo las evita Query se explica en 4.3.2, cuando aparezca el `signal`.

### 4.2 La instalación y el cliente

TanStack Query es una librería de un solo paquete para React. Se instala en `dependencies`, porque viaja al navegador, con su versión exacta:

```bash
npm install --save-exact @tanstack/react-query@5.104.5
```

Esa versión se publicó el 19 de octubre de 2026 y es la más reciente que `npm view @tanstack/react-query version` respondió el día de la corrida. Si instalas en macOS, `npm ci` o `npm install` terminan con un aviso parecido a este:

```text
npm warn install-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn install-scripts   fsevents@2.3.3 (install: (install scripts present))
```

No lo provoca Query. `fsevents` es una dependencia opcional, solo para macOS, que usan las herramientas de desarrollo para enterarse rápido de qué archivo cambió; en npm 11, los guiones de instalación de las dependencias quedan bloqueados mientras nadie los apruebe, y npm termina la instalación avisando cuáles se saltó ([npm, «npm install-scripts»](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts)). Con `fsevents` no hace falta aprobar nada: el paquete ya trae compilado su archivo `fsevents.node` (lo puedes ver en `node_modules/fsevents/`), la instalación termina bien y Vite funciona igual. Cuando un paquete sí necesite su guion, se revisa con `npm install-scripts ls` y se aprueba con `npm install-scripts approve <paquete>`; aprobar es una decisión de seguridad, porque ese guion corre con tus permisos. En Linux no sale, porque ese paquete declara en su `package.json` que es solo para `darwin` (macOS) y npm ni siquiera lo instala.

El `package.json` queda así; la única línea nueva, además del número de versión, es la de Query:

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

La librería tiene dos piezas que se instalan una vez. La primera es el **`QueryClient`**: el objeto que guarda la caché y las reglas. El punto de control lo crea con una función, en su propio archivo, para que las pruebas de la Lección 8 puedan crear uno nuevo en cada prueba:

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

Esas dos opciones cambian dos valores por omisión que la documentación de Query enumera en su página de «valores por omisión importantes» ([TanStack Query, «Important Defaults»](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)):

- **`staleTime`** vale `0` por omisión: un dato se considera viejo en cuanto llega. Con `0`, cada componente nuevo que se suscribe, cada vez que la ventana recupera el foco y cada vez que vuelve la red, Query pide el dato otra vez. Para un panel que de todos modos se actualiza cada diez segundos, cinco segundos de frescura evitan peticiones que no aportan nada: si acabas de recibir el reporte, abrir el detalle o regresar a la pestaña no necesita otro. Es un criterio de este curso, no una regla: el número correcto depende de cuánto tarda en cambiar tu dato y de cuánto te cuesta mostrarlo un poco viejo.
- **`retry`** vale `3` por omisión: una consulta que falla se reintenta tres veces, en silencio, con una espera que se duplica entre intentos. El curso lo baja a `2` para que, cuando la API esté caída, la alerta aparezca en unos cuatro segundos y no en ocho. En la sección 4.5 lo vas a ver en la bitácora, intento por intento.

Hay otros dos valores que conviene conocer aunque el punto de control no los toque. **`gcTime`** (de *garbage collection*) es cuánto tiempo sobrevive en la caché un dato que ningún componente está usando: cinco minutos. Por eso en la figura 1 el dato seguía ahí al volver. Y **`refetchOnWindowFocus`** está encendido: cuando la persona regresa a la pestaña del panel, las consultas viejas se vuelven a pedir. Es lo que hace que un panel que estuvo media hora detrás de otra ventana se ponga al día en cuanto lo miras. Lo dice la misma página: las consultas viejas se vuelven a pedir en segundo plano cuando se monta una instancia nueva, cuando la ventana recupera el foco o cuando se reconecta la red.

La segunda pieza es el **`QueryClientProvider`**, que pone el cliente a disposición de todo el árbol. `main.tsx` lo crea **una sola vez, fuera de cualquier componente**, y envuelve el panel:

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

Que `crearClienteConsultas()` se llame a nivel de módulo, y no dentro de un componente, no es un detalle de estilo. Si lo crearas dentro de un componente, cada dibujo de ese componente crearía una caché nueva y vacía, y perderías todo lo que la figura 1 acaba de mostrar. En `main.tsx` se ejecuta una vez, cuando el navegador carga el módulo. (El `LimiteDeError` que envuelve todo se explica en 4.8.)

Y aquí está el tamaño que aparecía al final del «porqué». Se construyó también el punto de control de la Lección 3 para compararlo: su JavaScript medía 225.86 kB (70.67 kB comprimido) y salía de 33 módulos; el de esta lección mide 262.59 kB (81.55 kB comprimido) y sale de 83. Entre una lección y otra, el código propio del `revisor` casi no crece —hasta se borran dos hooks—, así que esos 37 kB y 50 módulos de más son, en su mayoría, la librería. Vale preguntarse si lo vale. Para un panel que solo pidiera una cosa una vez, probablemente no; para uno que tiene caché, sondeo, reintentos, deduplicación, invalidación y datos viejos mientras actualiza, lo que pesa es lo que te ahorras escribir y mantener tú.

### 4.3 Claves, funciones de consulta y sondeo

Una consulta tiene dos partes obligatorias: una **clave** que la identifica y una **función** que trae el dato. Todo lo demás son opciones.

#### 4.3.1 La clave: el nombre del dato en la caché

La clave es un arreglo. La documentación pone tres reglas: tiene que ser un arreglo en el nivel superior, tiene que poder convertirse a JSON y tiene que ser única para ese dato; y agrega una cuarta que es la que más errores evita: **si la función depende de una variable, esa variable va en la clave** ([TanStack Query, «Query Keys»](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)). El detalle de `pagos` y el de `catálogo` son datos distintos, así que sus claves tienen que ser distintas: `["servicio", "pagos"]` y `["servicio", "catálogo"]`.

El punto de control reúne todas las claves en un solo archivo, para que nadie escriba `["reportes"]` en un lado y `["reporte"]` en otro:

```ts
// revisor/src/consultas/claves.ts
export const claves = {
  reporte: ["reporte"] as const,
  servicio: (nombre: string) => ["servicio", nombre] as const,
};
```

El `as const` hace que TypeScript recuerde la forma exacta del arreglo (`readonly ["reporte"]` y no `string[]`), y `servicio` es una función porque su clave depende del nombre. Esta forma de escribirlas tiene una ventaja que aparece en 4.6: las claves se comparan **por prefijo**. Invalidar `["servicio"]` alcanzaría a todos los detalles; invalidar `["servicio", "pagos"]`, solo a uno.

Fíjate en lo que esta regla reemplaza. En la Lección 3, `useDetalle` tenía `[nombre]` en su lista de dependencias, y `exhaustive-deps` vigilaba que no se te olvidara. La clave de Query cumple el mismo papel: cuando `nombre` cambia, la clave cambia, y Query pide el dato nuevo. La diferencia es que el linter de React no revisa claves de Query. Si te olvidas de poner el nombre en la clave, nadie te avisa; el ejercicio 4 te muestra qué ves en pantalla cuando pasa.

#### 4.3.2 La función: la misma frontera de red, con el `signal` que pone Query

La función de consulta del reporte es `cargarReporte`, la frontera de red de la Lección 0, con un solo cambio: pierde el tipo `Cargar`, que existía para pasar la función como propiedad a `Panel` y ya no se usa.

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

Sigue recibiendo un `AbortSignal`, y eso importa. Query le entrega a cada función de consulta su propio `AbortSignal`, y lo aborta cuando la consulta deja de hacer falta antes de terminar: porque cambió la clave, o porque ya no queda ningún componente suscrito ([TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). Ya no escribes `new AbortController()` ni `control.abort()`: Query los escribe por ti, y tú solo tienes que pasarle el `signal` a `fetch`. La documentación agrega un detalle: si tu función **usa** el `signal`, Query cancela la promesa y regresa la consulta a su estado anterior; si no lo usa, la respuesta se guarda en la caché aunque ya nadie la espere.

En la sección 4.9 vas a ver esa cancelación en la bitácora, con la misma pareja `cancelada por el cliente` + `200` que `StrictMode` producía en la Lección 0. No es casualidad: `StrictMode` desmonta y vuelve a montar el panel, la consulta se queda un instante sin nadie suscrito, Query aborta el `signal` y vuelve a pedir al remontarse. La limpieza sigue existiendo; solo cambió de dueño.

Y esto cierra la carrera de la Lección 3, por dos lados. Lo que viste en la Lección 3 es que la respuesta tardía de `pagos` solo llegaba a la pantalla cuando faltaban las dos defensas a la vez: el `abort` de la limpieza y la `key` que desmonta el panel. Query trae su propia versión de cada una. La primera es el `signal`: si eliges `pagos` y enseguida `catálogo`, la consulta de `pagos` se queda sin nadie suscrito y Query aborta su petición. La segunda es la clave: aunque la petición no se abortara, su respuesta se guardaría en la entrada `["servicio", "pagos"]` de la caché, no en la de `catálogo`. Cada clave es su propio cajón, y una respuesta tardía no tiene cómo caer en el cajón equivocado. El componente de `catálogo` solo lee el cajón de `catálogo`.

#### 4.3.3 `queryOptions`: la consulta en un solo lugar

Con la clave y la función se arma la consulta. El punto de control no la escribe dentro del componente, sino en un archivo de la funcionalidad, con `queryOptions`:

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

`queryOptions` no hace nada en tiempo de ejecución: devuelve el mismo objeto que le das. Lo que aporta es tipo. Junta clave, función y opciones en un objeto que se puede compartir entre varios lugares —un componente, una prueba, una precarga— y TypeScript deduce desde la función el tipo del dato, `ReportePublico`, para todos ellos ([TanStack Query, «Query Options»](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)). Si mañana la Lección 8 quiere preguntarle a la caché qué hay bajo `["reporte"]`, usa el mismo objeto y recibe el tipo correcto sin repetir nada.

La opción nueva es **`refetchInterval: cadaMs`**: mientras haya un componente suscrito, Query vuelve a pedir el dato con esa frecuencia, en milisegundos ([TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)). Es el sondeo cada diez segundos de la Lección 0, el mismo `VITE_CADA_MS`, sin `setInterval` ni `clearInterval`. Y trae una regla que el sondeo a mano no tenía: con su compañera `refetchIntervalInBackground` en `false`, que es su valor por omisión, el sondeo se detiene mientras la pestaña está en segundo plano. Un panel olvidado en una pestaña ya no le pregunta a la API cada diez segundos durante toda la noche.

La consulta del detalle tiene la misma forma, con el nombre en la clave y en la función:

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

Su `cargarDetalle` no cambia respecto a la Lección 3. Con esto, `src/reporte/useReporte.ts` y `src/detalle/useDetalle.ts` desaparecen del proyecto, y con `useReporte` se va también el `useEffectEvent` que la Lección 3 le puso para que el sondeo no se reiniciara. No era un mal uso: era la forma correcta de resolver ese problema con un Effect escrito a mano. Simplemente, ya no hay Effect escrito a mano.

¿Y `useTituloDocumento`, el otro Effect de la Lección 3? Ese se queda. Sincroniza `document.title` con lo que React sabe, que es exactamente para lo que existe un Effect. No todo Effect se va: se va el que traía datos.

### 4.4 `status` frente a `fetchStatus`

`useQuery` devuelve un objeto con muchos campos. Los dos que más conviene entender son `status` y `fetchStatus`, porque responden **dos preguntas distintas**, y la documentación lo resume en una regla de bolsillo: `status` te informa sobre los **datos** —¿tengo o no tengo?— y `fetchStatus` te informa sobre la **función** —¿está corriendo o no? ([TanStack Query, «Queries»](https://tanstack.com/query/latest/docs/framework/react/guides/queries)).

| Campo | Valor | Qué significa |
|---|---|---|
| `status` | `pending` | todavía no hay datos |
| | `error` | el último intento falló |
| | `success` | hay datos |
| `fetchStatus` | `fetching` | la función está corriendo |
| | `paused` | quería correr, pero no hay red |
| | `idle` | no está haciendo nada |

¿Por qué dos campos y no uno? Porque con caché y actualización en segundo plano **todas las combinaciones son posibles**, y una sola variable no puede contarlas. La segunda figura las provoca una por una: monta un componente sin red, devuelve la red, y luego hace que la API falle y vuelve a pedir. El componente escribe una línea cada vez que cambia alguno de los dos campos.

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

Cinco renglones, cinco situaciones que el panel tiene que saber dibujar:

1. **`pending` + `paused`.** No hay datos y ni siquiera se está pidiendo nada: Query vio que no hay red (`onlineManager.setOnline(false)` lo simula) y esperó. Si tu pantalla solo mirara «¿está cargando?», aquí diría que no, y si solo mirara «¿tengo datos?», también diría que no. Las dos cosas son ciertas.
2. **`pending` + `fetching`.** La primera carga: no hay datos y se están pidiendo. Es el «Cargando…».
3. **`success` + `idle`.** Hay datos y no se está pidiendo nada. La pantalla en reposo.
4. **`success` + `fetching`.** Hay datos **y** se están pidiendo otra vez. Es el caso que una unión `cargando`/`listo`/`error` como la de la Lección 0 no podía expresar: ahí, actualizar significaba volver a `cargando` y borrar la lista. Aquí la lista se queda y, a lo más, se avisa que se está actualizando.
5. **`error` + `idle` con «4 servicios».** El último intento falló, **pero los datos anteriores siguen ahí**. Query no los borra. `status` dice `error` y `data` sigue teniendo el reporte de antes.

El quinto renglón es el que más sorprende y el que más importa para un panel de monitoreo: cuando la API falla un momento, lo peor que puedes hacer es dejar a la persona sin nada que ver. Query te da las dos cosas a la vez, el error y el último dato bueno, y es tu pantalla la que decide cómo mostrarlas.

Además de los dos campos, `useQuery` trae atajos booleanos: `isPending` es `status === "pending"`, `isError` es `status === "error"`, `isSuccess` es `status === "success"` e `isFetching` es `fetchStatus === "fetching"`. La documentación de `useQuery` lo dice de `isFetching` con precisión: vale `true` siempre que la función esté corriendo, **incluida** la carga inicial. El punto de control usa los atajos, porque además ayudan a TypeScript: después de un `if (consulta.isPending) return …`, TypeScript sabe que `consulta.data` ya no puede ser `undefined`. En «El error que vas a ver» quitas ese `if` y TypeScript te lo recuerda.

Así queda `Panel`, que ahora solo recibe `cadaMs`:

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

Tres cosas cambiaron respecto a la Lección 3:

- **La consulta reemplaza al hook.** `useQuery(consultaReporte(cadaMs))` devuelve el objeto completo, y `Panel` se lo pasa tal cual a `ContenidoReporte`. Ya no hay propiedad `cargar`: el componente no recibe la función que trae datos, porque la función vive en la consulta.
- **«Actualizado a las» sale de `dataUpdatedAt`.** En la Lección 3 era un estado propio, `actualizadoEn`, que se escribía en un `alRecibir` envuelto en `useEffectEvent`. Ahora Query ya guarda el momento en que llegó el último dato bueno, como un número de milisegundos ([TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)), y vale `0` mientras no haya llegado ninguno. Es un estado que se dejó de guardar porque ya se podía leer: la regla de la Lección 2 de «no guardes lo que puedes calcular», aplicada a la caché.
- **El botón «Actualizar» llama a `refetch`** y se deshabilita mientras `isFetching` es `true`. El `void` de `onClick={() => void consulta.refetch()}` es el operador de JavaScript que evalúa una expresión y descarta su resultado ([MDN, «void»](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)): `refetch` devuelve una promesa, y escribir `void` deja a la vista que aquí no se espera ni se usa, en lugar de dejarla suelta por descuido. Y el pie agrega «· actualizando…» exactamente en el cuarto caso de la figura: hay datos y se están pidiendo. Esa es la diferencia entre `status` y `fetchStatus`, pintada en un renglón.

### 4.5 Los cuatro estados, más uno

Un dato que viene de un servidor tiene, como mínimo, **cuatro estados** que la pantalla tiene que dibujar: cargando, error, vacío y con datos. Los tres primeros son los que se olvidan. El de error, porque en la máquina de quien programa la API siempre responde. Y el **vacío**, porque en la máquina de quien programa siempre hay datos de prueba: una lista vacía se dibuja como una lista sin renglones, que en pantalla no se distingue de una pantalla rota. Por eso el plan del curso lo llama «el cuarto estado» y lo marca en negritas.

El quinto, que solo existe gracias a la caché, es **con datos y con error**: la última actualización falló, pero hay un reporte anterior que mostrar. Es el renglón 5 de la figura 2. `ContenidoReporte` dibuja los cinco, en este orden (el detalle de 4.6 hace lo mismo, a su escala):

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

Lee el orden de los `if`, porque cada uno descarta un caso y deja al siguiente con menos posibilidades:

1. **`isPending`** → «Cargando…», dentro de `role="status"`, que un lector de pantalla anuncia sin interrumpir. Si no hay datos todavía, no hay nada más que dibujar.
2. **`isError` sin datos** → la alerta y un botón «Reintentar» que llama a `refetch`. Es el error de verdad: falló y no hay nada que mostrar en su lugar. `role="alert"` hace que el lector de pantalla lo anuncie de inmediato.
3. **Una lista vacía** → «No hay servicios configurados todavía.» Fíjate en que no es un error ni una carga: es una respuesta válida, `{"estados":[]}`, que significa algo distinto. El texto le dice a la persona qué pasa, en vez de dejarla adivinar si la pantalla se rompió.
4. **Con datos** → el resumen, la lista y el detalle, como en la Lección 3.
5. **Con datos y con error** → lo mismo que el 4, con un aviso arriba: «Mostrando el último reporte que llegó». La clase `viejo` lo pinta con un borde ámbar, para que se distinga de la lista sin esconderla.

Después del segundo `if`, TypeScript sabe que `consulta.data` existe: si `isPending` fuera verdadero ya habría salido, y si hubiera error sin datos también. Por eso `const { estados } = consulta.data;` compila sin un `?.` ni un `!`. El orden de los `if` no es solo legibilidad: es lo que le permite al compilador acompañarte.

La hoja de estilos agrega una regla, que comparte con el límite de error de 4.8:

```css
.viejo,
.limite-de-error {
  border-left: 0.5rem solid #bf8700;
  padding-left: 0.75rem;
}
```

Ahora provócalos con el servidor de práctica, que desde esta lección acepta una variable `ESCENARIO`: `normal` (lo de siempre), `vacio` (arranca sin servicios) o `caido` (`GET /api/estados` responde siempre `503`). Con `ESCENARIO=vacio npm run servidor` y `npm run dev`, esto es lo que dejó en pantalla Chrome sin ventana (el texto visible del contenedor):

```text
Revisor
Estado de los servicios
 Solo fallas

No hay servicios configurados todavía.

Actualizado a las 2:11:47 a.m.

Actualizar
```

Y esta, la bitácora del servidor: la pareja de `StrictMode` y una respuesta buena, vacía.

```text
08:11:44.790 servidor de práctica en http://127.0.0.1:3100 (escenario: vacio)
08:11:47.090 GET /api/estados cancelada por el cliente
08:11:47.395 GET /api/estados 200
```

Fíjate en que aparece «Actualizado a las…»: para Query, una lista vacía es un éxito, y lo es. Con `ESCENARIO=caido`, en cambio, la pantalla quedó así:

```text
Revisor
Estado de los servicios
 Solo fallas

No se pudo cargar el reporte: la API respondió 503

Reintentar
Actualizar
```

La parte interesante está en la bitácora, y en el registro de red que anotó el navegador, con milisegundos desde que se abrió la página:

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

Tres `503` después de la cancelada: el intento original y los **dos reintentos** de `retry: 2`. Mira los huecos entre una respuesta y la siguiente petición: unos 1,000 ms y luego unos 2,000 ms. Es la espera por omisión de Query, que empieza en un segundo y se duplica en cada intento, sin pasar de 30 segundos ([TanStack Query, «Query Retries»](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries)). Mientras tanto, la pantalla siguió en «Cargando…»: los reintentos son silenciosos, y la alerta solo aparece cuando se agotan. Con el `retry: 3` de omisión, la persona habría esperado unos ocho segundos para enterarse de que la API está caída; con `2`, unos cuatro. (Un detalle de lectura: en el registro del navegador, entre la primera petición y su `503` hay solo 33 ms, cuando el servidor tarda 300. No es que el servidor haya contestado antes; la bitácora del servidor sí muestra los 300 ms. Es que, mientras la página se abría, el navegador entregó juntos los primeros avisos al programa que los anotaba, y el programa les puso la hora en que los recibió. Desde la segunda petición los avisos llegan uno por uno y los 300 ms reaparecen: de 1373 a 1685 y de 3682 a 3986.)

Fíjate también en que en esa pantalla hay dos botones, «Reintentar» y «Actualizar», y los dos llaman a `consulta.refetch()`. No es un descuido de maquetación: pertenecen a dueños distintos. «Reintentar» es de `ContenidoReporte` y existe solo en el estado de error sin datos, donde es la única salida que la persona tiene a la vista. «Actualizar» es de `Panel` y está siempre, porque refrescar un reporte que sí se ve es una acción de la tarjeta, no del error. Que coincidan en este único estado es el precio de que cada componente sepa solo de lo suyo; si en tu producto te molesta, la salida es esconder «Actualizar» cuando no hay datos, y es una decisión de diseño, no de Query.

Y una observación que no está en ningún renglón: «Actualizado a las…» no aparece, porque `dataUpdatedAt` sigue en `0`. Nunca llegó un dato bueno. Si el servidor se hubiera caído **después** de una carga buena, verías el quinto estado, la lista con el aviso ámbar encima.

### 4.6 Mutaciones e invalidación

Hasta aquí todo es lectura. Pero el detalle de un servicio tiene ahora un botón que **cambia** algo en el servidor: «Volver a revisar» le pide al servidor de práctica que revise el servicio otra vez. El servidor tiene una ruta nueva para eso, `POST /api/servicios/:nombre/reintento`, que, si el servicio existe, lo encuentra recuperado: responde `200` con `{"nombre":"pagos","tipo":"disponible","codigoHttp":200,"duracionMs":95}` y, lo que importa, **cambia lo que tiene guardado**, de modo que el siguiente `GET /api/estados` ya trae a `pagos` en verde. (Si el servicio no existe, responde `404`; si el nombre de la dirección no se puede decodificar, como en `/api/servicios/%`, responde `400` con `{"detalle":"nombre de servicio inválido"}`; y desde esta lección tiene la ruta `POST /api/servicios` para dar de alta servicios; esa la usa la Lección 7.)

Una operación que cambia datos en el servidor se llama **mutación**, y en Query tiene su propio hook, `useMutation`. La frontera de red es como las otras dos: pide, revisa el código, valida la forma.

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

Para validar la respuesta usa `esEstadoPublico`, la guarda que existe desde la Lección 0 y que hasta ahora `contrato.ts` no exportaba, porque solo la usaba `esReportePublico`. El único cambio en `contrato.ts` es esa palabra, `export`, más la interfaz `NuevoServicio` que el servidor necesita para el alta:

```ts
// revisor/src/compartido/contrato.ts (fragmento)
export function esEstadoPublico(valor: unknown): valor is EstadoPublico {
```

El hook es corto, y cada renglón tiene una razón:

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

- **`useMutation` no corre solo.** A diferencia de `useQuery`, que pide en cuanto se monta, una mutación espera a que alguien llame a `mutate()`. Una lectura se puede repetir sin consecuencias; una escritura, no, y por eso solo pasa cuando la persona lo pide.
- **`useQueryClient()`** devuelve el mismo cliente que `main.tsx` puso en el proveedor. Es la forma de hablarle a la caché desde un componente.
- **`onSuccess` invalida dos claves.** `invalidateQueries` hace dos cosas: marca como viejas las consultas cuya clave coincide y, si alguna se está dibujando en ese momento, la vuelve a pedir en segundo plano ([TanStack Query, «Query Invalidation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)). Las dos claves son `["reporte"]`, porque la lista cambió, y `["servicio", nombre]`, porque el detalle también.
- **`onSuccess` devuelve una promesa** (es `async` y espera a `Promise.all`). Eso cambia cuándo termina la mutación. La guía de invalidación desde mutaciones lo dice en una línea: devolver una promesa en `onSuccess` asegura que los datos se actualicen antes de que la mutación termine del todo, e `isPending` sigue en `true` hasta que esa promesa se cumple ([TanStack Query, «Invalidations from Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)). Sin el `await`, el botón volvería a decir «Volver a revisar» mientras la pantalla todavía muestra lo de antes.

Esto es lo que el `revisor` no podía hacer en la Lección 3 sin pasar funciones de un componente a otro: `PanelDetalle` no sabe que existe una lista, ni dónde está, ni quién la dibuja. Solo sabe que, al cambiar un servicio, el dato `["reporte"]` ya no es confiable. La caché se encarga de avisarle a quien lo esté usando.

`PanelDetalle` usa las dos piezas, la consulta y la mutación:

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

El botón se deshabilita y cambia su texto a «Revisando…» mientras `reintento.isPending` es verdadero, para que nadie mande el mismo `POST` cinco veces por impaciencia. Si la mutación falla, `reintento.isError` muestra la alerta debajo del botón. Y nota que la consulta del detalle usa `isPending` y la presencia de `data`, no `isFetching`: mientras se vuelve a pedir el detalle después de la invalidación, la persona sigue viendo el dato anterior y no un «Cargando detalle…» que lo borre.

El detalle también dibuja el quinto estado de 4.5. Si la actualización falla pero ya había un detalle, `status` es `error` y `data` sigue ahí; por eso el bloque de datos depende de `consulta.data !== undefined` y no de `consulta.isSuccess`, que en ese caso valdría `false` y haría desaparecer justo lo que la persona necesita para decidir. Con un detalle que nunca llegó, en cambio, solo se ve la alerta de error, como en `ContenidoReporte`.

#### 4.6.1 Lo que pasa al pulsar «Volver a revisar», medido

Esta es la parte de la lección que más conviene ver con los ojos y no creer de oídas. Con el servidor en escenario normal y `npm run dev`, el programa que maneja a Chrome eligió `pagos`, esperó su detalle y pulsó «Volver a revisar». Anotó cada petición a `/api/` y, cada vez que algo cambió, cuatro cosas de la pantalla: la fila de `pagos` en la lista, el estado en el detalle, el botón y el pie. La hora del pie se reemplazó por `HH:MM:SS` para que se lea mejor. Este es el registro completo:

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

Y la bitácora del servidor, de la misma corrida:

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

Lee el registro desde el clic en «Volver a revisar» (3111 ms):

- **El `POST` sale una sola vez** y el botón cambia a «Revisando… [deshabilitado]» dos milisegundos después. Esa es «la mutación en la pestaña de red»: un `POST`, sin pareja de `StrictMode`, porque no lo dispara un Effect sino un clic.
- **Al llegar su `200` (3418 ms), salen en el mismo milisegundo dos `GET`**: `/api/estados` y `/api/servicios/pagos`. Son las dos invalidaciones de `onSuccess`. Nadie las escribió como peticiones; se escribieron como «este dato ya no es confiable», y Query las convirtió en peticiones porque los dos datos estaban en pantalla.
- **Mientras llegan, la pantalla no se vacía.** A los 3428 ms la lista sigue diciendo `falla (HTTP 503)`, el detalle sigue diciendo `En falla` y el pie agrega «· actualizando…». Es el cuarto renglón de la figura 2, `success` + `fetching`, en el panel de verdad.
- **La lista se pone al día primero (3741 ms)**, porque `GET /api/estados` tarda 300 ms. Durante 1.2 segundos la lista dice `disponible` y el detalle todavía dice `En falla`: el detalle de `pagos` tarda 1.5 s a propósito, desde la Lección 3. Son dos datos distintos en la caché, cada uno con su propio viaje. La escena con la que empezó la lección —dos partes de la pantalla contando historias distintas— dura aquí un segundo y se resuelve sola, en lugar de durar hasta que alguien pulse «Actualizar».
- **El botón vuelve a «Volver a revisar» hasta los 4965 ms**, cuando también llegó el detalle. Es el `await Promise.all` de `onSuccess`: la mutación no se da por terminada hasta que las dos consultas se volvieron a pedir. El botón dice la verdad sobre cuándo la pantalla está al día.

Hay dos detalles más en la parte de arriba del registro. Al elegir `pagos` aparece la pareja `cancelada` + `200` del detalle: `StrictMode` monta, desmonta y vuelve a montar `PanelDetalle`, y como `cargarDetalle` usa el `signal`, Query cancela la primera petición. Y el detalle tardó 1.5 s en llegar, igual que en la Lección 3, porque era la primera vez que se pedía. Si lo cierras y lo vuelves a abrir antes de cinco segundos, ya no hay petición: está en la caché y está fresco.

### 4.7 Lo que Suspense no hace

Si buscas cómo mostrar «Cargando…» en React, tarde o temprano te encuentras con `<Suspense fallback={…}>`. La tentación es pensar que envolver el panel en un `Suspense` hace que aparezca el `fallback` mientras se pide el reporte. No es así, y conviene saber por qué antes de que te cueste una tarde.

`Suspense` muestra su `fallback` mientras algo **dentro de él** no está listo para dibujarse. La documentación de React enumera qué cuenta como «no listo»: el código de un componente cargado con `lazy`, una promesa leída con `use` (por ejemplo, datos que llegan de Server Components o de un framework preparado para Suspense), una hoja de estilos con `precedence`, y algunos casos más del dibujo en el servidor y de las transiciones. Y agrega una advertencia que es la que importa aquí: **Suspense no detecta los datos que se piden dentro de un Effect o de un manejador de eventos** ([React, «Suspense»](https://react.dev/reference/react/Suspense)). `useQuery` pide sus datos fuera del dibujo y avisa por su objeto de resultado, así que un `Suspense` alrededor de este panel nunca mostraría su `fallback`: el panel se dibujaría de inmediato con `isPending` en `true`.

Query sí tiene una forma de trabajar con Suspense: un hook aparte, `useSuspenseQuery`, que **suspende** el dibujo mientras no hay datos. Con él, `data` siempre está definido, porque la carga y el error **sin datos** los resuelven el `Suspense` y el límite de error que lo rodeen ([TanStack Query, «Suspense»](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)). Esa misma guía precisa que no todo error llega al límite: solo se lanza cuando no hay otros datos que mostrar. Si una actualización falla con un reporte en la caché, `useSuspenseQuery` sigue dibujando el componente con `data` y con `isError` en `true`, así que el quinto estado, «con datos y con error», sí se queda en su lugar. Es una forma válida de escribir una pantalla, pero tiene un costo para lo que esta lección enseña: «cargando» y «error sin datos» ya no se ven en el componente, sino repartidos entre un `fallback` arriba y un límite de error más arriba. Para un panel cuyo valor es justamente mostrar bien los cinco estados, el curso prefiere tenerlos todos juntos, en `ContenidoReporte`, a la vista. Por eso el punto de control no usa Suspense; es un criterio propio, no una regla.

### 4.8 El límite de error: la única clase del curso

Todo lo anterior trata errores **esperados**: la API respondió 503, la red se fue. Esos se dibujan como estados. Pero hay otra clase de error: un componente que, al dibujarse, lanza una excepción. Un `undefined` que nadie esperaba, un `.map` sobre algo que no es arreglo. En React, un error así durante el dibujo desmonta todo el árbol: la pantalla queda en blanco.

Para atraparlo existe el **Error Boundary**, que en este curso se llama `LimiteDeError`. La documentación de React describe cómo se escribe: un componente que define `static getDerivedStateFromError`, que React llama cuando un hijo —incluso uno lejano— lanza un error al dibujarse, para que en vez de borrar la pantalla muestres un mensaje; y, si quieres, `componentDidCatch`, para registrar el error en algún servicio. Y dice también por qué este curso, que no enseña componentes de clase, hace aquí una excepción: **hoy no hay forma de escribir un Error Boundary como componente de función** ([React, «Component»](https://react.dev/reference/react/Component)).

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

Se lee en tres partes:

- **`getDerivedStateFromError`** es estática: no tiene acceso a `this`, solo recibe el error y devuelve el estado nuevo. React la llama durante el dibujo, así que tiene que ser pura, como cualquier dibujo (Lección 1).
- **`componentDidCatch`** se llama después, cuando React ya terminó, y por eso puede hacer cosas con efectos: aquí, escribir en la consola el error y la pila de componentes. En un sistema publicado, este sería el lugar para enviarlo a un servicio de registro de errores.
- **`render`** dibuja la alerta si hubo error, o a los hijos si no. El botón recarga la página entera: un error de dibujo casi siempre es un defecto del código, y en el nivel más alto del panel, empezar otra vez es la salida más directa para recuperar un árbol sano. (Un límite más pequeño, alrededor de una sola sección, podría ofrecer volver a dibujar solo esa parte sin perder lo que la persona tiene en el resto; el curso usa uno solo, arriba.) Una precisión sobre el tipo: `getDerivedStateFromError(error: Error)` supone que lo lanzado es un `Error`, pero en JavaScript se puede lanzar cualquier valor ([MDN, «throw»](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw)). Si un hijo lanzara un texto suelto, `error.message` valdría `undefined` y la alerta saldría sin mensaje. Con eso, el límite del curso se mantiene corto; la Lección 5 vuelve sobre el tipo `unknown` de lo lanzado. Fíjate en que la alerta pinta `error.message` tal cual. Como va como texto hijo de JSX, no abre un hueco de XSS, pero sí enseña a cualquiera el mensaje crudo de una excepción, que puede revelar detalles internos: nombres de campos, rutas, partes de una consulta. En este panel de práctica ayuda a depurar; en una aplicación abierta al público conviene mostrar un texto genérico y dejar el detalle solo para el registro de `componentDidCatch`.

Lo que un límite de error **no** atrapa importa tanto como lo que atrapa. Según la misma página: los errores en manejadores de eventos (un `onClick` que lanza), el código asíncrono (un `setTimeout`, una promesa suelta), el dibujo en el servidor y los errores del propio límite. La página agrega una excepción que vas a encontrar en la [Lección 7](07-formularios-accesibilidad.md): lo que se lanza dentro de una transición, como una acción de formulario, sí llega al límite. Eso explica el reparto de este panel: un `fetch` que falla no es un error de dibujo, es un dato que llegó mal, y lo maneja Query como estado; el límite de error queda para lo que nadie previó.

¿Dónde va? En `main.tsx`, por **fuera** del `QueryClientProvider`, envolviendo todo. Así atrapa también los errores del proveedor y de cualquier cosa que esté debajo. La figura 3 de «El error que vas a ver» te muestra el primer error que vas a cometer con Query, y cómo este límite lo convierte en un mensaje en lugar de una pantalla en blanco.

### 4.9 El recorrido completo

Con dos terminales, como en la Lección 0. En la primera, el servidor de práctica; desde esta lección dice en qué escenario arrancó:

```text
08:11:23.119 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
```

En la segunda, `npm run dev`, y abre `http://localhost:5173/`. Debes ver la lista de cuatro servicios, el resumen «4 servicios revisados · 2 servicios con falla», «Actualizado a las…» y, cada diez segundos, un «· actualizando…» de un instante en el pie. Elige `pagos`, espera su detalle y pulsa «Volver a revisar»: la fila se pone verde, luego el detalle, y el botón regresa a su texto. Es el registro de 4.6.1. Y una comprobación más, de la fila misma: el botón `pagos` es un botón de alternancia (`aria-pressed`, Lección 2), así que pulsarlo **otra vez** cierra el detalle. Se midió en Chrome sin ventana, manejado por su protocolo de depuración: `aria-pressed` valía `false` al abrir, `true` tras el primer clic (con el detalle a la vista), `false` tras el segundo (sin detalle) y `true` tras el tercero. Con el código anterior, que siempre mandaba el nombre, el segundo clic dejaba `true` y el detalle abierto.

Después, construye y mira la versión que se publicaría, con el servidor todavía encendido: `npm run build` y `npm run preview`, en `http://localhost:4173/`. Esto registró la bitácora cuando Chrome abrió esa versión:

```text
08:13:08.422 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
08:13:10.768 GET /api/estados 200
```

Una sola petición. Sin `StrictMode` no hay montaje extra, y la consulta se pide una vez. Y la pantalla, con el título de la pestaña en `(2) Revisor`:

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

Apaga todo con Ctrl+C. Para terminar, la verificación del punto de control, la que corre cualquier revisión automática: `npm ci`, `npm run lint` y `npm run build`, los tres con código de salida 0. El linter no avisó nada, y la construcción dio el mismo nombre de archivo que las corridas del curso obtuvieron en macOS y en Linux, `index-CHheidKQ.js`.

## El error que vas a ver

La lección tiene un error principal, el que casi todo el mundo comete la primera vez que usa Query, y uno de apoyo, que TypeScript atrapa por ti.

**El error principal: falta el proveedor.** `useQuery` necesita un `QueryClient`, y lo busca en el `QueryClientProvider` más cercano hacia arriba. Si no hay ninguno —olvidaste envolver el árbol, o montaste un componente en una prueba sin él—, `useQuery` lanza un error **al dibujarse**. La tercera figura lo provoca a propósito, con un límite de error del mismo patrón que `LimiteDeError`, y le pide a React que avise cuando un límite atrape algo (`onCaughtError`):

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

El mensaje se explica solo: «no hay ningún `QueryClient`; usa `QueryClientProvider` para poner uno». Y se lee también lo que hizo el límite: en lugar de una pantalla en blanco, la persona ve un mensaje. Sin el límite, React habría desmontado el árbol entero y en la consola habría aparecido el mismo error como no atrapado. El arreglo es el `QueryClientProvider` de `main.tsx`. En las pruebas de la Lección 8, el mismo error es la razón de que exista un ayudante que monta cada componente ya dentro de su proveedor.

**El error de apoyo: usar `data` antes de saber si existe.** En `ContenidoReporte`, borra el primer `if`, el de `isPending`, y revisa los tipos. Se hizo en una copia del punto de control:

```text
$ npx tsc -b
src/reporte/ContenidoReporte.tsx(35,11): error TS2339: Property 'estados' does not exist on type 'ReportePublico | undefined'.
src/reporte/ContenidoReporte.tsx(42,32): error TS7006: Parameter 'estado' implicitly has an 'any' type.
```

Sin ese `if`, `consulta.data` puede ser `undefined` —es justo el caso `pending`— y TypeScript se niega a desarmarlo. (Los dos avisos dependen de `"strict": true` en el `tsconfig`, el que fijó la Lección 0: sin él, `undefined` se colaría sin queja.) El segundo error es consecuencia del primero: como no sabe qué es `estados`, tampoco sabe qué es cada `estado`. Lo valioso aquí es que el aviso llega **antes** de ejecutar: en el navegador, ese olvido sería un `TypeError` durante el primer dibujo, justo el tipo de error que acaba en el límite de 4.8. El arreglo no es `consulta.data!.estados` ni `consulta.data?.estados ?? []`: el primero miente, y el segundo convierte «todavía no sé» en «no hay servicios», que es el cuarto estado y significa otra cosa. El arreglo es dibujar el caso `pending`.

## Lo que se hace mal

**Copiar los datos de Query a un `useState`.** `const [reporte, establecerReporte] = useState(consulta.data)` y un Effect que los sincroniza. Es la tentación de quien viene de traer datos a mano. Ahora hay dos copias del mismo dato, una se queda vieja, y el Effect es exactamente el que la Lección 3 te enseñó a no escribir. Lee `consulta.data` donde lo necesites.

**Crear el `QueryClient` dentro de un componente.** Cada dibujo crea una caché nueva y vacía: se pierde la deduplicación, el dato que sobrevive al volver y todo lo de la figura 1. Va a nivel de módulo, en `main.tsx`, o en una función que se llama una vez.

**Dejar fuera de la clave una variable que la función usa.** `queryKey: ["servicio"]` con una función que pide `nombre` hace que todos los detalles compartan una sola entrada de la caché. El linter no lo ve. La regla: lo que la función usa, va en la clave.

**Tratar `isFetching` como «cargando».** Si escondes la lista cada vez que `isFetching` es verdadero, la vacías cada diez segundos con el sondeo. «Cargando» es `isPending`; `isFetching` es, a lo más, un aviso discreto.

**Mostrar solo el error y esconder los datos viejos.** Cuando `status` es `error` pero `data` existe, tienes algo útil que mostrar. Un panel de monitoreo que se queda en blanco porque una actualización falló es peor que uno que dice «esto es de hace un minuto».

**Olvidar el estado vacío.** Una lista sin renglones no se distingue de una pantalla rota. Una frase como «No hay servicios configurados todavía.» cuesta un renglón.

**Invalidar en el componente después de `mutate()`.** Llamar a `invalidateQueries` justo después de `mutate()`, en el `onClick`, invalida **antes** de que el servidor haya respondido: la lista se vuelve a pedir y puede traer el dato viejo. La invalidación va en `onSuccess`, que corre cuando la respuesta ya llegó.

**Subir `retry` para «arreglar» una API inestable.** Más reintentos no hacen que la API falle menos: hacen que la persona tarde más en enterarse de que falla. Con la espera que se duplica, cada reintento extra suma segundos al «Cargando…».

**Poner un `Suspense` alrededor de `useQuery` esperando un `fallback`.** No aparece: `useQuery` no suspende. Si quieres Suspense, es otro hook, `useSuspenseQuery`, con otro reparto de los estados.

**Usar el límite de error para los errores de red.** Un `fetch` que falla es un estado que se dibuja junto a la lista, con su botón «Reintentar». El límite de error es para lo que nadie previó.

## Ejercicios

### Ejercicio 1 — Predice la bitácora sin reintentos

Con el servidor en `ESCENARIO=caido`, la bitácora de 4.5 registró una cancelada y tres `503`. **Antes de cambiar nada**, predice qué registra si en `cliente.ts` cambias `retry: 2` por `retry: 0`, y cuánto tarda la alerta en aparecer. Después compruébalo con `npm run dev`, y restaura el `2` al terminar.

### Ejercicio 2 — Sin `staleTime`

En `fig04_01.tsx`, borra la línea `staleTime: 5_000,` de `ConteoConQuery`. Predice qué cambia en los tres renglones de la mitad de Query: las llamadas al abrir, lo que se ve de inmediato al volver y las llamadas al volver. Compílala y córrela.

### Ejercicio 3 — Invalida solo el detalle

En `useReintentar.ts`, deja en el `Promise.all` solo la invalidación de `claves.servicio(nombre)`. Antes de probar, predice qué muestra la **lista** después de pulsar «Volver a revisar» en `pagos`, y cuándo se pone al día. ¿Qué parte de la escena del principio de la lección vuelve a aparecer? Restaura el archivo al terminar.

### Ejercicio 4 — La clave que olvidó el nombre

En `src/detalle/consultas.ts`, cambia `queryKey: claves.servicio(nombre)` por `queryKey: ["servicio"]`. Abre el detalle de `pagos`, espera a que cargue y, antes de que pasen cinco segundos, elige `catálogo`. ¿Qué dice el detalle bajo el encabezado «catálogo»? ¿Te avisó el linter o TypeScript? Explica qué regla de 4.3.1 rompiste. Restaura el archivo al terminar.

## Soluciones

### Solución 1

Con `retry: 0`, Query no reintenta: la bitácora registra la pareja de `StrictMode` y **un solo** `503`, es decir, `GET /api/estados cancelada por el cliente` seguida de `GET /api/estados 503`. La alerta aparece en cuanto llega esa respuesta, unos 300 ms después de abrir la página, en lugar de los cuatro segundos que tardó con `retry: 2`. La predicción sale de dos datos ya medidos: cada `503` de 4.5 corresponde a un intento, y los huecos de 1 y 2 segundos entre ellos son la espera de los reintentos, que con cero reintentos no existe. Si en tu corrida no aparece la `cancelada`, es por lo que explicó la Lección 0: depende de si la conexión alcanzó a llegar al servidor antes del aborto. Cero reintentos tiene su costo: un tropiezo de un instante en la red se vuelve, de inmediato, una alerta en pantalla. Por eso el curso no usa `0` sino `2`.

### Solución 2

Esta es la salida real de la figura sin esa línea:

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

Cambia un solo número: **al volver hay una llamada**. Al abrir sigue habiendo una sola, porque la deduplicación no depende de `staleTime`. Y al volver se sigue viendo «4 servicios» de inmediato, porque el dato sigue en la caché (lo guarda `gcTime`, no `staleTime`). Lo que cambia es que, con `staleTime` en `0`, ese dato ya es viejo, así que Query lo muestra **y** lo vuelve a pedir en segundo plano, una sola vez para los dos componentes. Es la estrategia que se suele llamar «muestra lo que tienes mientras confirmas» (*stale-while-revalidate*): la persona nunca ve un «cargando» innecesario y el dato se pone al día solo. `staleTime` no decide si hay caché; decide cuándo vale la pena confirmarla.

### Solución 3

La lista **sigue diciendo `pagos: falla (HTTP 503)`** después de que el detalle ya dice «Disponible». Se pone al día hasta el siguiente sondeo de `refetchInterval`, a lo más diez segundos después, o antes si la ventana pierde y recupera el foco (porque el dato de la lista se vuelve viejo a los cinco segundos y `refetchOnWindowFocus` está encendido). Es la escena del principio de la lección: el detalle y la lista contando dos historias distintas sobre el mismo servicio. Nada en el código está «mal» en el sentido de que no compile o de que el linter lo note; lo que falta es avisarle a la caché que el dato `["reporte"]` también cambió. La invalidación describe **qué datos afecta una escritura**, y esa lista es responsabilidad de quien escribe la mutación. En la bitácora lo ves directo: después del `POST` sale un solo `GET`, el del detalle.

### Solución 4

Bajo el encabezado «catálogo» aparece el detalle **de `pagos`**: «En falla: HTTP 503». Con `["servicio"]` como clave, los detalles de todos los servicios comparten una sola entrada en la caché. Al elegir `catálogo`, `PanelDetalle` se monta de nuevo (por la `key={seleccionado}` de `ContenidoReporte`) y pide la clave `["servicio"]`; Query encuentra ahí lo de `pagos`, todavía fresco porque no han pasado los cinco segundos de `staleTime`, y lo entrega sin pedir nada. Pasados esos cinco segundos, al volver a montarse lo pediría otra vez y mostraría `catálogo`, pero con un instante de dato equivocado antes. Ni el linter ni TypeScript avisan: la clave es un arreglo válido y el tipo del dato es el correcto, solo que es el de otro servicio. Rompiste la regla de 4.3.1, «si la función depende de una variable, esa variable va en la clave»: `cargarDetalle(nombre, signal)` depende de `nombre`, así que `nombre` tiene que estar en la clave. Es el equivalente, en Query, de la dependencia que faltaba en el Effect de la Lección 0, con una diferencia que conviene recordar: aquí no hay `exhaustive-deps` que te cuide.

## Cómo sé que lo logré

- [ ] `npm ls @tanstack/react-query`, dentro de `~/curso-react/revisor/`, imprime `@tanstack/react-query@5.104.5`, y en `src/` ya no existen `useReporte.ts` ni `useDetalle.ts`.
- [ ] `npm run lint` termina sin escribir ningún problema, y `npm run build` termina con `✓ built` y deja en `dist/assets/` un archivo llamado `index-CHheidKQ.js`: si tu código es idéntico al del punto de control, el nombre coincide.
- [ ] `node fig04_01.js` imprime `1 llamada(s)` al abrir y `0 llamada(s)` al volver en la mitad de Query, y sabes explicar de dónde sale cada número.
- [ ] Con `ESCENARIO=vacio`, el panel dice «No hay servicios configurados todavía.»; con `ESCENARIO=caido`, muestra la alerta con «Reintentar» y la bitácora registra tres `503` (más, si alcanza a llegar, una `cancelada por el cliente` antes).
- [ ] En el navegador, el botón de la fila de `pagos` alterna: un clic muestra el detalle (`aria-pressed="true"`) y un segundo clic lo oculta (`aria-pressed="false"`).
- [ ] Con el escenario normal, al pulsar «Volver a revisar» en `pagos` la bitácora registra un `POST /api/servicios/pagos/reintento 200` seguido de un `GET /api/estados 200` y un `GET /api/servicios/pagos 200`, y la fila de `pagos` se pone verde sin pulsar «Actualizar».
- [ ] Puedes nombrar las cinco combinaciones de `status` y `fetchStatus` de la figura 2 y decir cuál pinta «· actualizando…» en el pie.
- [ ] Con `npm run preview`, abrir la página produce una sola petición `GET /api/estados` en la bitácora.
- [ ] Quitando el `QueryClientProvider` de `main.tsx` (y restaurándolo), ves el mensaje de `LimiteDeError` en lugar de una pantalla en blanco.
- [ ] Anotaste en tu [bitácora](bitacora.md) cuántas peticiones hacías a mano frente a cuántas hace ahora, algo que Query hizo solo y te sorprendió, y cuándo te convino un `staleTime` distinto de cero.

## Resumen

Responde sin mirar la lección:

1. Según el plan del curso, traer datos a mano no escala por tres razones: caché, cascadas y carreras. ¿Qué dice la documentación de React de cada una, y cómo responde Query a cada una? ¿Cuál midió la figura 1?
2. ¿Por qué el `QueryClient` se crea en `main.tsx` y no dentro de un componente? ¿Qué guarda?
3. ¿Qué es una clave de consulta y qué regla evita que dos datos distintos compartan entrada en la caché?
4. ¿Quién crea ahora el `AbortController`, y cuándo aborta Query el `signal`?
5. ¿Qué pregunta responde `status` y cuál `fetchStatus`? ¿Qué combinación significa «tengo datos y estoy pidiendo otra vez»?
6. ¿Cuáles son los cuatro estados de una consulta, y cuál es el quinto que solo existe gracias a la caché?
7. ¿Qué hacen `staleTime`, `retry` y `refetchInterval` en este panel? ¿Por qué tres `503` en la bitácora con `retry: 2`?
8. ¿Qué hace `invalidateQueries` y por qué va en `onSuccess`? ¿Por qué el botón dice «Revisando…» hasta que también llegó el detalle?
9. ¿Por qué un `Suspense` alrededor de `useQuery` no muestra su `fallback`?
10. ¿Qué errores atrapa un Error Boundary, cuáles no, y por qué es una clase?

## Para leer más

- [React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects), sección «What are good alternatives to data fetching in Effects?»: los costos de pedir datos en un Effect (sin servidor, cascadas, sin caché, poco ergonómico) y la recomendación de una caché del lado del cliente. Consultado el 21 de octubre de 2026.
- [React, «Suspense»](https://react.dev/reference/react/Suspense): qué activa un límite de Suspense y la advertencia de que no detecta datos pedidos en un Effect o en un manejador de eventos. Consultado el 21 de octubre de 2026.
- [React, «Component»](https://react.dev/reference/react/Component), sección «Catching rendering errors with an Error Boundary»: `getDerivedStateFromError`, `componentDidCatch`, qué errores no atrapa y por qué todavía no hay versión de función. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Important Defaults»](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults): `staleTime` en cero, `gcTime` de cinco minutos, tres reintentos y las actualizaciones al montar, al recuperar el foco y al reconectar. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Queries»](https://tanstack.com/query/latest/docs/framework/react/guides/queries): `status` frente a `fetchStatus` y sus valores. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Query Keys»](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys): las claves como arreglos serializables y la regla de incluir las variables de la función. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Query Options»](https://tanstack.com/query/latest/docs/framework/react/guides/query-options): `queryOptions` para compartir clave y función con su tipo. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): el `AbortSignal` que recibe cada función y cuándo se aborta. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Query Retries»](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries): el número de reintentos y la espera que se duplica desde un segundo hasta 30. Consultado el 21 de octubre de 2026.
- [TanStack Query, «useQuery»](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery): `refetchInterval`, `refetchIntervalInBackground`, `dataUpdatedAt`, `isFetching`, `isPending` y `refetch`. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations): `useMutation`, sus estados y las funciones que devuelven promesas. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Query Invalidation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation): qué hace `invalidateQueries` y la coincidencia por prefijo de clave. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Invalidations from Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations): devolver la promesa en `onSuccess` y que `isPending` sigue en `true` hasta que se cumple. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Suspense»](https://tanstack.com/query/latest/docs/framework/react/guides/suspense): `useSuspenseQuery`, el dato siempre definido y qué errores llegan al límite de error. Consultado el 21 de octubre de 2026.
- [npm, «npm install-scripts»](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts): los guiones de instalación de las dependencias, bloqueados hasta aprobarlos, y cómo se revisan y se aprueban. Consultado el 21 de octubre de 2026.
- [npm, `@tanstack/react-query`](https://www.npmjs.com/package/@tanstack/react-query): la versión 5.104.5, publicada el 19 de octubre de 2026. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| estado del servidor | la copia, en la pantalla, de un dato que vive en otra computadora: tarda en llegar, puede fallar y envejece |
| caché | el lugar, fuera de los componentes, donde Query guarda lo que llegó del servidor, una entrada por clave |
| clave de consulta | el arreglo que identifica un dato en la caché, como `["servicio", "pagos"]` |
| deduplicación | cuando dos componentes piden la misma clave a la vez, se hace una sola petición |
| fresco / viejo (*stale*) | un dato es fresco durante `staleTime` después de llegar; después, se muestra pero se vuelve a pedir cuando hace falta |
| `status` / `fetchStatus` | si hay datos (`pending`, `error`, `success`) / si la función está corriendo (`fetching`, `paused`, `idle`) |
| mutación | una operación que cambia datos en el servidor; en Query, `useMutation`, que solo corre al llamar a `mutate()` |
| invalidar | marcar como viejas las consultas de una clave y volver a pedir las que estén en pantalla |
| estado vacío | una respuesta válida sin datos, que la pantalla tiene que distinguir de una carga y de un error |
| Error Boundary (límite de error) | un componente de clase que atrapa los errores que lanzan sus hijos al dibujarse y muestra algo en su lugar |

---

**Siguiente:** [Lección 5 — Rutas y la URL como estado](05-rutas-url-como-estado.md)
