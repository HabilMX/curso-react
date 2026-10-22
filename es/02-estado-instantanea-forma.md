# Lección 2 — Estado: instantánea, inmutabilidad y forma

*Son las 18:05 y la guardia nocturna empieza a las 18:30. Antes de irte, quieres dejarle a tu compañera una nota en el `revisor`: «pagos: el proveedor dice que vuelve a las 20:00, no escalar». Eliges `pagos`, escribes la nota, la guardas… y la fila no cambia. Repasas mentalmente lo que hiciste: el código agrega la nota al objeto de notas y lo vuelve a guardar en el estado. La nota está ahí, en memoria; la consola lo confirma. Pero la pantalla no se entera. Diez segundos después llega el siguiente sondeo, el panel se vuelve a dibujar y, de pronto, la marca «con nota» aparece, como si alguien la hubiera puesto a destiempo. Y al elegir `reportes`, el cuadro de texto todavía dice «pagos: el proveedor dice que vuelve…». Si tu compañera guarda sin leer, la nota de `pagos` termina pegada en `reportes`. Quedan veinticinco minutos. Las dos fallas vienen del mismo error: pensar el estado de React como una variable que se cambia. No lo es: es una fotografía que se reemplaza, y React la guarda en un lugar preciso del árbol. Esta lección explica esa frase y la convierte en código.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 2.3 y 2.4)

**Qué construyes:** el filtro «Solo fallas», la selección de un servicio con su detalle y una nota por servicio, con un borrador que no se arrastra de un servicio a otro

**Qué aprendes:** el estado es una fotografía por dibujo; la forma actualizadora `establecerN((n) => n + 1)`; copiar en vez de mutar; las cinco reglas de forma del estado (entre ellas: un `tipo` y no tres banderas, guardar el identificador y no el objeto, y no guardar lo que se puede calcular); elevar el estado; `key` para reiniciarlo

**De dónde vienes.** De la [Lección 1](01-componentes-puros-composicion.md). Tu `revisor` ya está partido en piezas puras: `Tarjeta` recibe un título y sus `children`; `ResumenFallas` pinta «4 servicios revisados · 2 servicios con falla» con funciones puras de `resumen.ts`; `ContenidoReporte` decide qué dibujar según la carga; `ListaEstados` recorre los estados con `key={estado.nombre}`; y `FilaEstado` pinta una fila. `Panel` solo compone. Lo único que cambia con el tiempo es lo que trae `useReporte`, el hook de la lección 0 que pide `GET /api/estados` cada diez segundos. Hasta hoy, la persona que mira el panel no puede hacer nada con él más que oprimir «Actualizar». Hoy el panel empieza a recordar lo que esa persona hace.

**Qué no hace esta lección.** No trae datos nuevos de la API: el detalle de un servicio se arma con lo que ya llegó en el reporte, y pedirle a la API el detalle de un solo servicio es el tema de la [Lección 3](03-effects-sincronizar.md), con su carrera de respuestas. Las notas viven en memoria: si recargas la página, se pierden, y está bien así por ahora. El filtro y la selección tampoco viajan en la dirección de la página; que un filtro se pueda compartir copiando el enlace es la [Lección 5](05-rutas-url-como-estado.md). No hay contexto ni reducer, que son la [Lección 6](06-reducer-contexto.md), ni formularios con `action`, que son la [Lección 7](07-formularios-accesibilidad.md). Y no hay ningún Effect nuevo: la lección entera se resuelve con `useState`, cálculos durante el dibujo y una `key`.

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas del `package.json` de esta lección (React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 para `tsc`, ESLint 10.13.0 y `eslint-plugin-react-hooks` 7.1.1). Como el curso supone Linux Mint, este punto de control se reinstaló desde cero en un contenedor `node:24.22.0-bookworm` y dio el mismo nombre de archivo en `dist/` que se ve aquí, `index-7jh0TEYR.js`; no se corrió en una Linux Mint real, pero nada de lo que se muestra depende del sistema operativo, salvo el aviso de `fsevents` que sigue. En macOS, `npm ci` imprime además un aviso de `install-scripts`: se refiere a `fsevents`, un paquete opcional que solo se instala en macOS y que en tu Mint no aparece; no hace falta aprobarlo. Las figuras se corren en `~/curso-react/figuras/`, la misma carpeta de las lecciones anteriores; su `package.json` no cambia. Se compilan con `tsc` y se ejecutan con `node` sobre un DOM de prueba (jsdom), como en la lección 0. Lo que se ve «en el navegador» se midió con Chrome sin ventana (`--headless`), manejado desde un guion que oprime botones y lee la página por el protocolo de depuración de Chrome: es un navegador real ejecutando el JavaScript de `dist/`, no una simulación. El guion está junto a las figuras, en `medir.mjs`, y su primer comentario dice cómo correrlo. Necesita Google Chrome o Chromium, que Linux Mint no instala por omisión; si no lo tienes, no hace falta para seguir la lección: haz los mismos pasos a mano en tu navegador y deberías ver lo mismo. Las salidas de cada medición y de cada error provocado, con los cambios exactos de cada copia, están en [`programas/02-estado-instantanea-forma/ejercicios/`](../programas/02-estado-instantanea-forma/ejercicios). Las rutas largas que imprimen ESLint y `tsc` se muestran a partir de `~/curso-react`, y en una salida de ESLint se recortaron los espacios con que el formateador alinea la columna de la regla. Los errores de «El error que vas a ver» se provocaron en una copia del punto de control, nunca en el original, que después de todo volvió a pasar `npm ci`, `npm run lint` y `npm run build`. Los programas están en [`programas/02-estado-instantanea-forma/`](../programas/02-estado-instantanea-forma): `revisor/` es el punto de control y las figuras están junto a él.

## Al terminar vas a poder

- Predecir el valor que muestra un componente después de llamar varias veces a una función `establecer…` en el mismo clic, y comprobar tu predicción con una figura.
- Escribir una actualización con la forma actualizadora cuando el estado siguiente depende del anterior, y explicar cuándo da un resultado distinto de pasar el valor.
- Actualizar un objeto del estado creando una copia, y demostrar con una figura que mutarlo y pasarlo de vuelta no vuelve a dibujar nada.
- Revisar el estado de un componente con las cinco reglas de forma y señalar en el `revisor` un ejemplo de cada una (uno puede servir para dos).
- Decidir en qué componente vive cada pedazo de estado, elevarlo al ancestro común y pasar hacia abajo el valor y la función que lo cambia.
- Usar una `key` para que un componente empiece desde cero cuando cambia aquello que representa, y reproducir el error que aparece si falta.

## El porqué antes del cómo

Abre el `revisor` de la lección 1 y pídele tres cosas que un operador pediría el primer día.

**«Muéstrame solo lo que está fallando.»** Con cuatro servicios no hace falta, pero el `revisor` real de una empresa vigila decenas. Una casilla «Solo fallas» tiene que recordar si está marcada, y dos piezas distintas necesitan saberlo: la propia casilla, para pintarse marcada, y la lista, para decidir qué filas dibuja.

**«Quiero ver un servicio en detalle.»** La persona elige `pagos` y aparece un recuadro con su estado. Diez segundos después llega el siguiente sondeo y `pagos` se recuperó: el recuadro tiene que decir «Disponible», no lo que decía hace diez segundos. Eso depende de **qué** guardas cuando alguien elige: el servicio entero o solo su nombre.

**«Déjame anotar algo.»** Una nota por servicio, que sobreviva a cambiar de servicio y volver, y que marque la fila para que el siguiente turno la vea. Y mientras escribes, un borrador que no se cuele en la nota de otro servicio.

Las tres piden lo mismo: que el panel **recuerde** algo entre un dibujo y el siguiente. En React, eso que se recuerda se llama **estado**, y la herramienta es `useState`, que ya usaste en la lección 0 dentro de `useReporte`. La lección 9 de TypeScript te enseñó a escribirlo; esta lección te enseña a **pensarlo**, porque casi todos los errores con el estado vienen de pensarlo como una variable. Una variable se cambia y el cambio se ve en el renglón siguiente. El estado no: cada dibujo recibe una fotografía fija, y pedir un cambio no toca esa fotografía, sino que le pide a React que tome otra ([React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot)). Pensar el estado como una variable explica las dos fallas de la escena, aunque cada una por su lado: la nota que no aparece viene de la fotografía (le diste a React la misma, retocada, y React no vio nada nuevo), y el borrador que se arrastra viene del lugar donde React guarda el estado (conservó el del editor porque, para él, en esa posición seguía estando el mismo editor).

Son tres conceptos nuevos. El primero es **el estado como fotografía**, con la forma actualizadora (2.1). El segundo es **un estado que se copia y tiene forma**: copiar en vez de mutar (2.2) y las cinco reglas de forma del estado (2.3). El tercero es **quién es dueño del estado y cuándo se reinicia**: elevar el estado al componente que lo comparte (2.4) y `key` para reiniciarlo (2.5). La sección 2.6 no agrega un concepto: es el recorrido completo, donde los tres se ven juntos. Así se ve el resultado, medido con Chrome sin ventana sobre el punto de control, eligiendo `pagos`, guardando una nota y cambiando de servicio (son los pasos 3 a 6 del recorrido de 2.6):

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

Al final de la lección vas a saber de dónde sale cada renglón, y por qué el último dice lo que dice.

## Los conceptos

### 2.1 El estado es una fotografía

#### 2.1.1 Lo que pasa cuando llamas a `establecer…`

Cuando escribes `const [revisiones, establecerRevisiones] = useState(0)`, React te entrega dos cosas: el valor que tiene guardado **para este dibujo** y una función para pedirle otro. Lo importante está en la palabra «pedir». La documentación de React lo dice así: el estado se comporta como una fotografía; cambiarlo no cambia la variable que ya tienes, sino que provoca un nuevo dibujo ([React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot)). Y en la referencia de `useState`, con todas sus letras: la función `set` solo actualiza la variable de estado **para el siguiente dibujo** ([React, `useState`](https://react.dev/reference/react/useState)).

La primera figura lo pone a prueba con lo más simple que hay: un botón que, en un solo clic, llama tres veces a la función que suma una revisión. Hay dos versiones. La primera le pasa a React el valor, `revisiones + 1`; la segunda le pasa una función, `(actual) => actual + 1`. Las dos imprimen, dentro del clic, cuánto vale `revisiones`, y la figura lee lo que dice el botón al terminar.

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

Antes de leer la explicación, mira los dos renglones que dicen «dentro del clic»: en las dos versiones, `revisiones` vale `0`, aunque ya se llamó tres veces a `establecerRevisiones`. Esa es la fotografía. El manejador del clic es una función que se creó durante el dibujo en que `revisiones` valía `0`, y para esa función `revisiones` es `0` para siempre, como una constante. React no reescribe tus variables; lo que hace es volver a llamar a tu componente, y en esa nueva llamada `useState` devuelve el valor nuevo. La documentación lo resume en una regla: **el valor de una variable de estado nunca cambia dentro de un dibujo**, aunque el código del manejador sea asíncrono ([React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot)).

Con eso, la primera versión se explica sola. Las tres llamadas dicen lo mismo: «en el siguiente dibujo, `revisiones` vale `0 + 1`». Tres veces `1` es `1`. El botón dice `1`, no `3`. Es exactamente el ejemplo que usa la documentación de React con su botón «+3» ([React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot)).

#### 2.1.2 La fila de actualizaciones y la forma actualizadora

¿Por qué no se dibujó el botón tres veces, una por llamada? Porque React **espera a que termine todo el código del manejador** antes de procesar las actualizaciones de estado. A eso se le llama **agrupar** (*batching*), y es lo que evita dibujos de más y pantallas a medio actualizar ([React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates)). Mientras el manejador corre, cada llamada a `establecer…` se forma en una fila. Cuando termina, React recorre la fila en orden para calcular el valor del siguiente dibujo.

Ahí entra la segunda versión. Si en lugar de un valor le pasas una **función**, React no la ejecuta en el momento: la forma en la fila, y al procesarla le entrega el resultado de la anterior. La documentación llama a esto **función actualizadora** (*updater function*) ([React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates)). La primera recibe `0` y devuelve `1`; la segunda recibe `1` y devuelve `2`; la tercera recibe `2` y devuelve `3`. El botón dice `3`. Fíjate en que, aun así, el renglón «dentro del clic» sigue diciendo `0`: la forma actualizadora no cambia la fotografía, cambia **cómo se calcula la siguiente**.

Tres detalles para llevarte:

- **El nombre del parámetro.** La documentación sugiere nombrarlo con las iniciales de la variable (`n => n + 1`) o, si prefieres algo más largo, repitiendo el nombre completo o anteponiéndole un prefijo como `prev` ([React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates)). Este curso usa un nombre en español que diga qué es: `actual`, `actuales`. Es un criterio propio, pensado para que se lea igual que el resto del código.
- **Tiene que ser pura.** La función actualizadora corre durante el dibujo, así que solo debe calcular y devolver: nada de pedir datos, imprimir ni llamar a otra función `establecer…`. En `StrictMode`, y solo mientras desarrollas, React la llama **dos veces** y se queda con uno de los resultados (en la versión construida la llama una vez), justamente para destapar las impuras ([React, `useState`](https://react.dev/reference/react/useState)). Es la misma prueba gratuita de la lección 0, aplicada al estado.
- **Si necesitas el valor nuevo enseguida, calcúlalo tú.** Si después de `establecerRevisiones(revisiones + 1)` quieres usar el valor nuevo en el mismo manejador, guárdalo antes en una constante: `const siguiente = revisiones + 1`. Leer `revisiones` te va a dar la fotografía vieja; la referencia de `useState` lo trae como el primer caso de su sección de problemas comunes ([React, `useState`](https://react.dev/reference/react/useState)).

#### 2.1.3 En el `revisor`: `establecerNotas((actuales) => …)`

En el punto de control, la forma actualizadora aparece una vez, en `Panel`, al guardar una nota:

```tsx
// revisor/src/reporte/Panel.tsx (fragmento)
  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }
```

Sé honesto con lo que esto demuestra: en el panel de hoy, `establecerNotas(conNota(notas, nombre, texto))` daría el mismo resultado, porque `guardarNota` se llama una sola vez por clic. Entonces, ¿por qué la forma actualizadora? Porque **el estado siguiente depende del anterior**: una nota nueva se agrega a las que ya había. Con la forma actualizadora, el cálculo se hace con lo último que hay en la fila, no con la fotografía que tenía el manejador cuando se creó. El día que alguien agregue un botón que guarde dos notas en el mismo clic, o que la nota llegue desde una función que se creó en un dibujo anterior, este código sigue siendo correcto sin que nadie lo vuelva a pensar. La documentación de React no exige la forma actualizadora en todos los casos; el criterio del curso es más corto de recordar: **si el valor nuevo se calcula a partir del viejo, pásale a React una función**. Si el valor nuevo no depende del viejo, como `establecerSoloFallas(true)` o `establecerSeleccionado("pagos")`, pásale el valor.

### 2.2 Copiar en vez de mutar

#### 2.2.1 React compara la fotografía, no su contenido

¿Cómo sabe React que el estado cambió? No recorre tu objeto campo por campo: compara el valor nuevo con el actual usando `Object.is`, y si son **el mismo**, se salta el dibujo de ese componente y de sus hijos ([React, `useState`](https://react.dev/reference/react/useState)). Para los números y el texto, «el mismo» significa lo que esperas. Para los objetos y los arreglos significa otra cosa: `Object.is` dice que dos objetos son el mismo solo si son **la misma referencia en memoria**, no si tienen los mismos campos ([MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)). Dos objetos con el mismo contenido son distintos; un objeto al que le cambiaste un campo sigue siendo el mismo.

La segunda figura reproduce la primera falla de la escena. Un bloc de notas guarda un objeto en el estado y tiene dos botones. «mutar» le agrega la nota al objeto que ya existe y lo pasa de vuelta. «copiar» crea un objeto nuevo con todo lo anterior más la nota. Un `<Profiler>` de React cuenta cuántas veces se completó un dibujo; es la forma de contar sin meter un efecto secundario dentro del componente (la Lección 9 vuelve sobre el Profiler).

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

Después de «mutar», el contador de dibujos sigue en `1` y la pantalla sigue diciendo `0`. El objeto sí cambió: tiene la nota de `pagos`. Pero lo que le pasaste a React es **el mismo objeto** que ya tenía, `Object.is` dijo «igual» y React no hizo nada. La documentación lo explica con el ejemplo de un punto que sigue al ratón: sin la función que cambia el estado, React no tiene idea de que el objeto cambió y no responde ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)); y la referencia de `useState` lo trae como el problema «actualicé el estado, pero la pantalla no cambia» ([React, `useState`](https://react.dev/reference/react/useState)).

Mira ahora el último renglón: después de «copiar», hay un dibujo nuevo y la pantalla dice `1`. Fíjate en que el objeto nuevo tiene la nota de `pagos` por dos caminos: la mutación anterior, que seguía escondida dentro del objeto viejo y se copió con `...notas`, y la propia copia. La pantalla mostró la mutación **cuando otra cosa provocó el dibujo**. Eso es justo lo que viste en la escena con el sondeo de diez segundos: la marca «con nota» apareció a destiempo, cuando el siguiente reporte forzó un dibujo y la mutación escondida salió a la luz. Una mutación no siempre se pierde; a veces aparece tarde, y eso es peor, porque parece funcionar.

#### 2.2.2 Copiar: la sintaxis de propagación

La regla de la documentación es directa: **trata cualquier objeto que pongas en el estado como de solo lectura**; en lugar de cambiarlo, reemplázalo por otro ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)). La herramienta de JavaScript para eso es la **sintaxis de propagación** (`...`): en un objeto literal, `{ ...notas, pagos: "texto" }` copia las propiedades propias enumerables de `notas` (para un objeto como este, todas) a un objeto nuevo y luego escribe `pagos`; si `pagos` ya existía, se queda con el último valor ([MDN, «Spread syntax»](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)).

Una advertencia que importa en cuanto tu estado crezca: la propagación es **superficial**. Copia un nivel; si una propiedad es a su vez un objeto, la copia apunta al mismo objeto interno, y cambiarlo sería otra vez una mutación. La documentación de React lo marca así y muestra cómo copiar nivel por nivel ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)). Es una de las razones de la quinta regla de forma (2.3): el estado plano se copia en un solo paso.

En el `revisor`, la copia vive en una función pura, fuera de los componentes, en su propio archivo:

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

Léela renglón por renglón:

- **`Notas` es `Readonly<Record<string, string>>`.** Un registro cuyas llaves son nombres de servicio y cuyos valores son el texto de la nota, marcado como de solo lectura. `Record<K, T>` construye un tipo de objeto con llaves `K` y valores `T`, y `Readonly<T>` hace que sus propiedades no se puedan reasignar ([TypeScript, «Utility Types»](https://www.typescriptlang.org/docs/handbook/utility-types.html)). Es una revisión de tipos, no una protección en tiempo de ejecución: el objeto no se congela, pero `tsc` rechaza cualquier asignación. En «El error que vas a ver» lo vas a ver detener la mutación de la escena antes de que llegue al navegador.
- **`texto.trim()`.** Una nota hecha solo de espacios no es una nota. Se limpia una vez, aquí, y nadie más tiene que acordarse.
- **Si el texto queda vacío, la nota se quita.** `Object.entries` convierte el objeto en una lista de parejas `[llave, valor]`, `filter` deja fuera la del servicio, y `Object.fromEntries` vuelve a armar un objeto con las que quedan. Las tres funciones crean objetos nuevos; ninguna toca `notas`. Así, «borrar el texto y guardar» quita la marca «con nota» de la fila, que es lo que una persona esperaría.
- **Si hay texto, se copia y se escribe.** `{ ...notas, [nombre]: limpio }` es la propagación de arriba, con una llave calculada entre corchetes.

¿Por qué una función aparte y no tres renglones dentro de `Panel`? Por la misma razón que `contarFallas` en la lección 1: una función pura —mismas entradas, misma salida, sin tocar nada de fuera— se entiende sola, se puede probar sin React (lo verás con `resumen.ts` en la Lección 8) y se puede llamar desde la función actualizadora sin miedo a que `StrictMode` la llame dos veces.

#### 2.2.3 Por qué tanta ceremonia

Podría parecer que copiar es más caro y más largo que mutar. La documentación de React da cinco razones para hacerlo de todos modos ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)), y tres se notan desde hoy en el `revisor`:

1. **Depurar.** Si imprimes el estado con `console.log` y nunca lo mutas, los registros viejos siguen diciendo lo que decían en su momento; con mutaciones, un registro de hace cinco segundos te muestra el valor de ahora.
2. **Optimizar.** Si el objeto anterior es el mismo que el nuevo, nada dentro pudo cambiar. Esa comparación de un paso es la que hace React con `Object.is`, y la que usará la memoización cuando la Lección 9 la mida.
3. **Las funciones nuevas de React lo suponen.** La documentación dice que las funciones que React está construyendo dependen de que el estado se trate como fotografía. En este curso lo vas a notar con `useOptimistic` en la Lección 7.

Si un día tu estado es tan anidado que copiar a mano se vuelve ilegible, la documentación menciona Immer, una librería que te deja escribir con forma de mutación y produce las copias por ti ([React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state)). Este curso no la usa: el estado del `revisor` es plano a propósito, y la siguiente sección explica por qué.

### 2.3 La forma del estado: cinco reglas

#### 2.3.1 Las cinco reglas, y lo que cada una evita

Saber cambiar el estado no basta; también importa **qué** guardas. La documentación de React propone cinco principios para dar forma al estado ([React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)). Se presentan con el `revisor` al lado, porque cada una tiene un ejemplo en el punto de control:

1. **Agrupa el estado relacionado.** Si siempre cambias dos variables a la vez, júntalas en una. En el `revisor`: el resultado de una carga es un solo valor `Carga`, no un «reporte» por un lado y un «detalle del error» por otro que siempre se cambian juntos. `Carga` es el ejemplo de las reglas 1 y 2 a la vez: agrupa el reporte y el detalle del error (regla 1) y, por ser una unión, impide que se contradigan (regla 2).
2. **Evita las contradicciones.** Si varias piezas de estado pueden «no estar de acuerdo», dejas espacio para errores. El ejemplo de la documentación son dos banderas, `isSending` e `isSent`, que nunca deberían ser verdaderas a la vez y que se reemplazan por un solo `status` con tres valores. En el `revisor` es `Carga` desde la lección 0: un `tipo` que vale `"cargando"`, `"listo"` o `"error"`. Con tres banderas `cargando`, `listo` y `conError` habría ocho combinaciones y solo tres tendrían sentido; con una unión discriminada, las cinco imposibles ni siquiera se pueden escribir. La documentación lo plantea como meta: que nunca haya en memoria un estado que no corresponda a ninguna pantalla válida ([React, «Reacting to Input with State»](https://react.dev/learn/reacting-to-input-with-state)).
3. **Evita el estado redundante.** Si algo se puede calcular durante el dibujo a partir de las propiedades o del estado que ya existe, no lo guardes. En el `revisor`: la lista filtrada, el servicio elegido, el número de fallas y si una fila tiene nota. Ninguno es estado; los cuatro se calculan.
4. **Evita la duplicación.** Si el mismo dato vive en dos lugares, mantenerlos de acuerdo es tu problema. En el `revisor`: se guarda el **nombre** del servicio elegido, no el servicio.
5. **Evita el estado muy anidado.** El estado jerárquico es incómodo de copiar. En el `revisor`: las notas son un registro plano por nombre, `{ pagos: "…", reportes: "…" }`, separado de los estados del reporte; no se meten dentro de cada servicio.

Las reglas 3 y 4 son las que más errores evitan, y las dos tienen su prueba.

#### 2.3.2 Guardar el identificador, no el objeto

Cuando la persona elige `pagos`, la tentación es guardar el objeto que se eligió: `{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }`. Ya lo tienes en la mano, y para pintar el detalle es justo lo que necesitas. El problema es que ese objeto **ya está guardado** en otro lugar: dentro del reporte. La documentación lo dice así: el contenido del elemento elegido es el mismo objeto que uno de la lista, así que su información está duplicada en dos lugares ([React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)). Mientras nada cambie, no se nota. En el `revisor`, algo cambia cada diez segundos.

La cuarta figura pone las dos estrategias lado a lado. Una pantalla recibe la lista de estados; un componente guarda el objeto elegido y otro guarda solo el nombre y busca el objeto al dibujar. Luego llega un reporte nuevo en el que `pagos` se recuperó:

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

La lista dice que `pagos` está disponible, y el componente que guardó el objeto sigue diciendo que está en falla: tiene una fotografía de hace un sondeo, y nadie la va a actualizar, porque el estado solo se inicializa en el primer dibujo. El que guardó el nombre dice la verdad sin hacer nada especial: en cada dibujo busca `pagos` en la lista que acaba de llegar. Imagina al operador de la escena leyendo «En falla» en el detalle y «disponible» en la fila de al lado, con la guardia a punto de empezar.

Por eso, en el punto de control, `seleccionado` es `string | null` —el nombre, o nada— y el servicio elegido se busca al dibujar, en `ContenidoReporte`:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx (fragmento)
      const { estados } = carga.reporte;
      const visibles = filtrarEstados(estados, soloFallas);
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

`elegido` no es estado: es una constante que vive lo que dura el dibujo. La documentación propone exactamente esto con su `selectedId`: guardar solo el identificador, que es lo esencial, y calcular el resto durante el dibujo ([React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)). Y trae un regalo: si el servicio desaparece del reporte, `find` devuelve `undefined` y el detalle simplemente no se dibuja; no hay que «limpiar» la selección con ningún código ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). Es seguro buscar por nombre mientras la API cumpla su regla de que no haya dos servicios con el mismo nombre, la misma regla en que se apoya la `key={estado.nombre}` de la lección 1; si algún día la API la rompiera, `find` devolvería el primero que encuentre y React avisaría en la consola de las `key` repetidas.

#### 2.3.3 No guardar lo que se puede calcular

La tercera regla tiene una versión que la documentación repite en dos páginas: **cuando algo se puede calcular a partir de las propiedades o del estado que ya existen, no lo pongas en el estado; calcúlalo durante el dibujo** ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). En el punto de control hay cuatro cálculos así, y ninguno pide estado:

- **La lista filtrada.** `filtrarEstados(estados, soloFallas)` es una función pura nueva de `resumen.ts`. Si la casilla está marcada, deja solo las fallas; si no, devuelve la misma lista sin copiarla.

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

- **El servicio elegido**, que acabas de ver.
- **El resumen.** `ResumenFallas` recibe la lista **completa**, no la filtrada, a propósito: «4 servicios revisados · 2 servicios con falla» describe lo que revisó el sondeo, no lo que dejaste visible. La medición de Chrome lo confirma: con la casilla marcada, el resumen sigue diciendo 4 y 2.
- **Si una fila tiene nota.** `ListaEstados` le pasa a cada fila `tieneNota={notas[estado.nombre] !== undefined}`. No existe una lista aparte de «servicios con nota» que haya que mantener al día.

¿Y si calcular fuera caro? Filtrar cuatro, o cuatrocientos, elementos en cada dibujo no lo es. El criterio del curso es el de su README: primero se mide y después se optimiza, y la Lección 9 trae la medición. Guardar un cálculo en el estado «para no repetirlo» no es una optimización: es una copia que alguien tiene que mantener sincronizada, y la forma más común de sincronizarla —un Effect que la recalcula— es la que el linter rechaza, como vas a ver en «El error que vas a ver».

### 2.4 Elevar el estado

#### 2.4.1 Cada pedazo de estado tiene un dueño

Ya sabes cómo cambiar el estado y qué guardar. Falta decidir **dónde**. La documentación lo plantea como un principio: para cada pedazo de estado único eliges el componente que es su «dueño», y eso es tener una **sola fuente de verdad**; no significa que todo el estado viva en un solo lugar, sino que cada pedazo tiene un componente específico que lo guarda ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)). Cuando dos componentes necesitan el mismo dato, el dueño es su **ancestro común más cercano**: se quita el estado de los hijos, se pone en el padre y se les pasa hacia abajo por propiedades, junto con las funciones que lo cambian. A eso la documentación lo llama **elevar el estado** (*lifting state up*), y dice que es de lo que más vas a hacer en React ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)).

Aplica la pregunta «¿quién lo necesita?» a los tres estados nuevos del `revisor`:

| Estado | Quién lo lee | Quién lo cambia | Ancestro común |
|---|---|---|---|
| `soloFallas` | `FiltroFallas` (para pintarse) y `ContenidoReporte` (para filtrar) | `FiltroFallas` | `Panel` |
| `seleccionado` | `FilaEstado` (para `aria-pressed`) y `ContenidoReporte` (para el detalle) | `FilaEstado` y el botón «Cerrar detalle» | `Panel` |
| `notas` | `FilaEstado` (la marca) y `EditorNota` (lo guardado) | `EditorNota` | `Panel` |
| `borrador` | solo `EditorNota` | solo `EditorNota` | `EditorNota` |

Los tres primeros suben a `Panel`. El cuarto se queda abajo, y es igual de importante entender por qué: el borrador es lo que la persona está escribiendo **antes** de decidir guardarlo. Nadie más lo necesita, y si subiera a `Panel`, cada tecla volvería a dibujar el panel entero en lugar de solo el editor. Elevar no es una virtud en sí misma: el estado sube **hasta donde lo necesitan, y ni un nivel más**.

Así queda `Panel`, que ahora es el dueño:

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

Tres `useState`, uno por pedazo de estado, cada uno con su tipo: `false` le basta a TypeScript para inferir `boolean`; `seleccionado` necesita `<string | null>` porque arranca en `null` y luego guardará un nombre; `notas` arranca en `{}` con el tipo `Notas`. Las funciones bajan con el prefijo `al` (`alCambiar`, `alSeleccionar`, `alGuardarNota`), que es la regla de nombres del curso para las propiedades que son funciones. Fíjate en que dos de ellas son directamente las funciones de React: `alCambiar={establecerSoloFallas}` y `alSeleccionar={establecerSeleccionado}`. Las funciones `establecer…` que entrega `useState` son estables —la referencia de `useState` dice que tienen una identidad estable, la misma en cada dibujo ([React, `useState`](https://react.dev/reference/react/useState))— y su forma coincide con lo que el hijo espera, así que no hace falta envolverlas.

#### 2.4.2 La casilla: un componente controlado

`FiltroFallas` no tiene estado. Recibe el valor y una función, y se limita a pintar y a avisar:

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

Un `<input>` al que le pasas `checked` es un **campo controlado**: React decide si está marcado, no el navegador. Por eso la documentación exige que, junto con `checked`, pases un `onChange` que actualice ese valor de forma síncrona; sin él, el campo queda de solo lectura y React lo avisa en la consola con «You provided a `checked` prop to a form field without an `onChange` handler» ([React, `<input>`](https://react.dev/reference/react-dom/components/input)). Para una casilla se lee `evento.target.checked`, no `evento.target.value`, que es otro descuido que la misma página señala. Y la casilla va dentro de su `<label>`: así, hacer clic en el texto «Solo fallas» también la marca, y un lector de pantalla anuncia la casilla con su nombre. Es HTML nativo, sin ARIA.

La palabra «controlado» también se usa para componentes enteros: la documentación llama controlado al componente cuya información importante viene de sus propiedades y no de su propio estado, y no controlado al que la guarda él mismo ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)). `FiltroFallas` es controlado; `EditorNota`, con su borrador, es no controlado. Ojo con la doble palabra: el `<textarea>` de `EditorNota` es un campo controlado (su valor lo pone `borrador`), pero el componente es no controlado, porque ese `borrador` vive dentro de él y `Panel` no puede tocarlo. La primera palabra habla del campo; la segunda, del componente; la propia documentación aclara que «controlado» y «no controlado» no son términos técnicos estrictos. Ninguna de las dos es mejor: el controlado deja al padre coordinar; el no controlado es más fácil de usar. La Lección 7 vuelve sobre esta distinción con los formularios.

#### 2.4.3 La fila: un botón que dice si está elegido

Para elegir un servicio, el nombre de cada fila se vuelve un botón:

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

Varias decisiones en pocas líneas:

- **Un `<button>`, no un `<span>` con `onClick`.** Un botón nativo se alcanza con el tabulador, se oprime con Enter o con la barra espaciadora y un lector de pantalla lo anuncia como botón. Con un `<span>` tendrías que fabricar todo eso a mano.
- **`aria-pressed`, y un botón que de verdad alterna.** Indica el estado «oprimido» de un botón de alternancia: con `true` o `false`, el botón se anuncia como algo que se puede oprimir y dice si lo está ([MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)). Por eso el clic dice `seleccionado ? null : estado.nombre`: según MDN, un botón de alternancia pasa a `true` al oprimirlo una vez y vuelve a `false` al oprimirlo otra vez, y un lector de pantalla que anuncia «oprimido» invita a oprimirlo de nuevo. Si el clic repitiera siempre el mismo nombre, el botón diría que se puede alternar y no alternaría. Medido: al pulsar `pagos` dos veces, el detalle aparece y desaparece, y `aria-pressed` va de `true` a `false` (`node medir.mjs alternar`, salida en `ejercicios/medir-alternar.salida.txt`). MDN pide además no cambiar el texto del botón cuando cambia ese estado, y el `revisor` lo respeta: el botón dice `pagos` esté elegido o no. La hoja de estilos usa ese mismo atributo para engrosar el subrayado, con el selector `.seleccionar[aria-pressed="true"]`: lo que ve la vista y lo que oye el lector de pantalla salen del mismo dato.
- **`className={estado.tipo}`.** La clase de la fila, `disponible` o `falla`, es el mismo texto que el tipo, así que ya no hace falta un `if` con dos `<li>` casi iguales. El `if` que distingue los dos casos se mudó a `Descripcion`, un componente pequeño que solo pinta el texto. Está definido **fuera** de `FilaEstado`, nunca dentro, por la regla de la lección 1: un componente definido dentro de otro es un componente nuevo en cada dibujo, y su estado se reiniciaría sin aviso ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).
- **`{tieneNota && …}`.** Aquí `&&` es seguro porque `tieneNota` es un booleano; la trampa del `0` de la lección 1 aparece solo cuando la condición es un número.
- **La fila no sabe qué hay seleccionado.** Recibe `seleccionado: boolean`, ya calculado por la lista. La fila es pura: mismas propiedades, mismo dibujo.

La lista hace los cálculos por fila y no guarda nada:

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

Su `alSeleccionar` acepta `string | null`, igual que el de `Panel`: el `null` significa «ninguno elegido». Lo envía la fila cuando se vuelve a pulsar el servicio ya elegido y lo envía también otra pieza, el botón «Cerrar detalle».

#### 2.4.4 El que reparte

`ContenidoReporte` recibe todo y decide qué dibujar. El caso `"listo"` ahora tiene llaves propias para declarar las tres constantes calculadas que viste en 2.3:

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

Fíjate en dos cosas. La primera: el detalle se busca en `estados`, la lista completa, no en `visibles`. Es una decisión, no un descuido, y el ejercicio 3 te pide pensarla. La segunda: `alCerrar={() => alSeleccionar(null)}` es la única función nueva que se crea aquí; «cerrar» no es más que elegir nada.

### 2.5 `key` para reiniciar el estado

#### 2.5.1 El estado vive en una posición, no en el componente

Queda la segunda falla de la escena: el borrador que se arrastra. Para entenderla hace falta saber **dónde** guarda React el estado de un componente. No lo guarda «dentro» de la función ni dentro del JSX: lo asocia a la **posición** que ocupa el componente en el árbol que se dibuja. Mientras en esa posición se siga dibujando el mismo componente, React conserva su estado; si se quita, o si en esa posición se dibuja otro, lo descarta ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

Piensa en el editor de notas. Eliges `pagos`: en la posición del editor se dibuja un `EditorNota` con `nombre="pagos"`. Escribes. Eliges `reportes`: en **la misma posición** se dibuja **el mismo componente**, `EditorNota`, ahora con `nombre="reportes"`. Para React, nada indica que sea otro editor: cambió una propiedad, como cambia cualquier propiedad, y el estado `borrador` se conserva. La documentación usa un caso casi idéntico, un chat en el que el texto que escribiste para una persona sigue ahí cuando eliges a otra, y lo dice con claridad: en muchas aplicaciones eso es lo deseado, pero no en un chat, porque alguien podría enviarle a la persona equivocada un mensaje ya escrito ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). En el `revisor`, es una nota de `pagos` guardada en `reportes`.

La tercera figura lo reproduce con un editor mínimo que guarda su borrador, y lo dibuja dos veces: sin `key` y con `key={nombre}`.

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

Sin `key`, el título del editor cambia a «Nota sobre reportes», pero el borrador sigue diciendo «llamar al proveedor»: la propiedad cambió y el estado se quedó. Con `key={nombre}`, el borrador queda vacío. (Una nota sobre la figura: a diferencia de las de la lección 0, importa `react-dom/client` **después** de crear `window`. react-dom comprueba al cargarse si existe `window.document` y si el documento admite el evento `input`, y con ese resultado decide cómo detectar que alguien escribe en un `<textarea>` (se leyó en el código del paquete instalado, `react-dom-client.development.js`: las variables `canUseDOM` e `isInputEventSupported`; no es algo que la documentación de React describa). Si se carga antes de que exista una ventana, esa comprobación sale negativa y la escritura que la figura provoca no llega bien a `onChange`. En un navegador real la ventana siempre existe primero, así que en el `revisor` no hace falta nada de esto.)

#### 2.5.2 Lo que hace la `key`

En la lección 1 usaste `key` dentro de una lista, para que React reconozca cada fila entre un dibujo y otro. Es la misma herramienta: **una `key` le dice a React que use la propia `key` como parte de la posición**, en lugar de usar solo el orden dentro del padre ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). Y la documentación lo subraya: las `key` no son solo para listas. Con `key="pagos"` y luego `key="reportes"`, para React son **dos editores distintos**: desmonta el primero con todo su estado y monta uno nuevo, que arranca desde `useState(…)` como el primer día. Las `key` no tienen que ser únicas en toda la aplicación; solo distinguen posiciones dentro del mismo padre ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

La documentación da a este uso un nombre preciso en «You Might Not Need an Effect»: **reiniciar todo el estado cuando cambia una propiedad**. Su ejemplo es un perfil que recibe `key={userId}` para que, al cambiar de usuario, se reinicien el comentario a medio escribir y cualquier otro estado de abajo; y marca como «evitar» la alternativa de reiniciar el estado desde un Effect ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). Ese es el segundo criterio del curso asomándose antes de la Lección 3: lo que se puede resolver con estructura no se resuelve con un Effect.

En el punto de control, la `key` está en `DetalleSeleccion`, el recuadro del servicio elegido:

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

`key={estado.nombre}` dice exactamente lo que significa: un editor de la nota de `pagos` y un editor de la nota de `reportes` son, conceptualmente, dos editores distintos. Lo mismo que dice la documentación de su chat: una conversación con una persona es distinta de una conversación con otra, así que tiene sentido darle una `key` según con quién hablas ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). Un detalle de accesibilidad: el recuadro es un `<aside>` con `aria-label="Detalle de pagos"`, así que un lector de pantalla lo anuncia como contenido complementario con nombre, «Detalle de pagos». El `aria-label` no es adorno: como el `<aside>` está dentro de la `<section>` de `Tarjeta`, sin nombre perdería ese papel y quedaría como un contenedor genérico ([MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside)). Y la descripción del estado usa el operador ternario sobre `estado.tipo`, que TypeScript estrecha en cada rama: en la primera sabe que existen `codigoHttp` y `duracionMs`, en la segunda, `detalle`.

#### 2.5.3 El editor: estado local con un valor inicial

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

`borrador` arranca con `notaGuardada`, la nota que ya existía o `""`. Esto merece una aclaración, porque la documentación advierte contra algo que se le parece: copiar una propiedad en el estado. Su ejemplo es un mensaje que hace `useState(messageColor)`: si el padre luego pasa otro color, el estado no se entera, porque **el estado solo se inicializa en el primer dibujo** ([React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)). La misma página dice cuándo sí tiene sentido: cuando **quieres** ignorar los cambios posteriores de la propiedad, y entonces conviene que su nombre empiece con `initial` o `default` para que se note.

Aquí es justo lo que se quiere. Mientras la persona escribe, el borrador no debe cambiar porque llegue un reporte nuevo; solo debe volver a empezar cuando cambia el servicio. Y de eso se encarga la `key` de `DetalleSeleccion`: cada vez que cambia el servicio, el editor se monta de nuevo y `useState(notaGuardada)` vuelve a leer la nota guardada de **ese** servicio. Por eso, en la medición con Chrome, regresar a `pagos` muestra «llamar al proveedor», la nota guardada, y no el borrador que se quedó sin guardar. La pareja «valor inicial + `key`» es el patrón completo; quitar cualquiera de los dos lo rompe.

¿Y si quisieras **conservar** el borrador sin guardar de cada servicio, para recuperarlo al volver? La documentación da tres caminos: dibujar todos los editores y ocultar los inactivos, guardar los borradores en otro lado, o elevar el estado al padre, que llama la solución más común ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). En el `revisor`, «elevar» ya existe para lo que importa: la nota guardada vive en `Panel`. El borrador sin guardar se descarta a propósito.

### 2.6 El recorrido completo

Con el estado elevado y la `key` en su lugar, falta la hoja de estilos. Estas son las reglas que se agregan al final de `panel.css`, la única hoja del curso, que crece lección a lección:

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

`.seleccionar` quita al botón su aspecto de botón y lo deja como un nombre en negritas, subrayado para que se note que se puede oprimir; `font: inherit` hace que use la misma letra que el resto de la fila, porque los botones no la heredan por omisión. El resto del archivo es el de la lección 1. Los demás archivos del punto de control —`main.tsx`, `useReporte.ts`, `cargar.ts`, `contrato.ts`, `Tarjeta`, `ResumenFallas`, la configuración y el servidor de práctica— no cambian en esta lección; el `package.json` solo cambia su versión a `0.2.0`.

La verificación del punto de control es la de siempre, desde `~/curso-react/revisor/`:

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

El linter no dice nada y la construcción termina con `index-7jh0TEYR.js`, el mismo nombre que salió en macOS y en Linux. Como ese nombre sale del contenido, si tu `revisor` es idéntico al punto de control, verás el mismo. Con `npm run servidor` en una terminal y `npm run dev` (o `npm run preview`) en otra, abre la página y recórrela. Esto es lo que midió Chrome sin ventana sobre la versión construida, servida con `vite preview`, paso por paso, con `node medir.mjs recorrido`:

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

Cada renglón tiene su explicación en la lección. El paso 1 muestra los botones con `aria-pressed="false"` (2.4.3). El 2, la lista filtrada con el resumen intacto (2.3.3). El 3, el botón elegido en `true` y el detalle buscado por nombre (2.3.2). El 4, la nota copiada en el estado y la marca «con nota» en la fila (2.2). El 5, el borrador sin guardar que **no** se arrastra a `reportes` (2.5). El 6, la nota guardada que vuelve al regresar a `pagos`, leída por el editor recién montado (2.5.3). Y el 7, «cerrar» como elegir nada (2.4.4). Apaga todo con Ctrl+C en cada terminal.

## El error que vas a ver

Esta lección tiene dos errores que las herramientas detienen y uno que ninguna herramienta ve.

**La mutación de la escena.** En una copia del punto de control, cambia `guardarNota` de `Panel.tsx` para que agregue la nota al objeto que ya existe:

```tsx
// guardarNota mutando (fragmento; en una copia, nunca en el punto de control)
  function guardarNota(nombre: string, texto: string): void {
    notas[nombre] = texto;
    establecerNotas(notas);
  }
```

Dos defensas distintas lo detienen, cada una a su manera. Primero, `tsc`:

(Los cambios exactos de la copia están en `ejercicios/copia-mutando.diff.txt` y las salidas completas en `ejercicios/copia-mutando.lint-tsc.salida.txt`.)

```text
$ npx tsc -b
src/reporte/Panel.tsx(6,10): error TS6133: 'conNota' is declared but its value is never read.
src/reporte/Panel.tsx(23,5): error TS2542: Index signature in type 'Readonly<Record<string, string>>' only permits reading.
```

El segundo renglón es el que importa: el tipo `Notas` es `Readonly`, así que su índice «solo permite leer». (El primero es una consecuencia: `conNota` dejó de usarse.) Y ESLint, con la regla `immutability` del paquete de React:

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

«Modificar un valor que devolvió `useState()`, que no debe modificarse directamente. Usa la función que lo cambia.» La regla valida que no se muten propiedades, estado ni otros valores que React trata como inmutables; su documentación dice que las propiedades y el estado de un componente son fotografías inmutables ([React, «immutability»](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability)). Fíjate en que la detiene aunque el tipo no fuera `Readonly`: la figura 2 usa un `Record<string, string>` sin `Readonly`, y `tsc` la compila sin quejarse, pero el linter la rechaza igual:

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

Por eso el `revisor` tiene las dos: el tipo te avisa en el editor mientras escribes, y el linter atrapa la mutación aunque alguien olvide el `Readonly`. El arreglo es el de 2.2: `establecerNotas((actuales) => conNota(actuales, nombre, texto))`.

**Guardar lo que se puede calcular, y sincronizarlo con un Effect.** En otra copia, en lugar de pasarle al editor `notas[estado.nombre] ?? ""` directamente, `DetalleSeleccion` guarda la nota en un estado propio y lo «mantiene al día» con un Effect:

```tsx
// DetalleSeleccion con estado redundante (fragmento; en una copia)
  const [notaGuardada, establecerNotaGuardada] = useState("");

  useEffect(() => {
    establecerNotaGuardada(notas[estado.nombre] ?? "");
  }, [notas, estado.nombre]);
```

`tsc -b` no dice nada: los tipos están bien. El linter sí (`ejercicios/copia-efecto.diff.txt` y `ejercicios/copia-efecto.lint-tsc.salida.txt`):

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

Es la regla `set-state-in-effect`, la misma que la lección 0 te mostró en `useReporte`. Aquí aparece por la razón de 2.3.3: `notaGuardada` es una copia de algo que ya está en `notas`, y el Effect existe solo para mantener la copia de acuerdo con el original. Cuesta un dibujo extra en cada cambio —primero con la copia vieja, luego con la nueva— y, peor, tiene un error que se ve. Al cambiar de servicio, `DetalleSeleccion` no se vuelve a montar: está en la misma posición y es el mismo componente, así que en ese dibujo su `notaGuardada` todavía tiene el valor del servicio **anterior**. El editor, que sí se monta de nuevo por su `key`, arranca con ese valor viejo y, como se explica en 2.5.3, ya no hace caso de lo que llega después, cuando el Effect corrige la copia. Construida esa copia y medida con Chrome sin ventana (`node medir.mjs efecto`):

```text
a. guardas una nota en pagos, eliges catálogo y regresas: Detalle de pagos · borrador: ""
b. guardas una nota en catálogo y eliges pagos: Detalle de pagos · borrador: "revisar el disco"
   filas: catálogo: disponible (HTTP 200, 42 ms) · con nota | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
```

En el paso a, `catálogo` no tenía nota, así que el editor de `pagos` arranca vacío: la fila dice «con nota» y la persona no ve la nota. En el paso b, `catálogo` sí tiene una, y el editor de `pagos` arranca con **la nota de `catálogo`**: es la falla de la escena, una nota de un servicio a punto de guardarse en otro, con otra causa. El arreglo no es silenciar la regla, sino borrar el estado y el Effect: lo que se puede calcular, se calcula.

**El error que nadie ve: quitar la `key`.** En una tercera copia, borra el renglón `key={estado.nombre}` de `DetalleSeleccion.tsx`:

(Salida en `ejercicios/copia-sin-key.lint-tsc.salida.txt`; el cambio, en `ejercicios/copia-sin-key.diff.txt`.)

```text
$ npx tsc -b; echo "tsc: $?"
tsc: 0
$ npx eslint . --max-warnings 0; echo "lint: $?"
lint: 0
```

Los dos en verde, y el panel tiene la falla de la escena: el borrador se arrastra de un servicio a otro. Ninguna regla del linter del curso detecta que, para ti, un editor de `pagos` y uno de `reportes` son cosas distintas; esa es una decisión de significado, no de forma. Solo la ves usando el panel, o con una prueba de componente que lo use por ti: la Lección 8 enseña a escribirlas. Es la misma lección que dejó la limpieza que falta en la lección 0: el linter y los tipos son dos defensas, no todas.

## Lo que se hace mal

**Leer el estado justo después de cambiarlo.** `establecerX(nuevo); console.log(x)` imprime el valor de la fotografía del dibujo actual, que es el viejo (en un manejador de evento, como estos). Si necesitas el nuevo en el mismo manejador, guárdalo antes en una constante.

**Pasar el valor cuando el siguiente depende del anterior.** `establecerN(n + 1)` funciona hasta el día en que se llama dos veces en el mismo clic, o desde una función creada en un dibujo anterior. Si el valor nuevo se calcula a partir del viejo, pasa una función.

**Mutar y volver a pasar el mismo objeto.** React compara con `Object.is`; un objeto retocado sigue siendo el mismo, y la pantalla no cambia. O cambia tarde, cuando otra cosa provoca un dibujo, que es peor porque parece funcionar.

**Copiar solo el primer nivel de un estado anidado.** La propagación es superficial. Si tu estado tiene objetos dentro de objetos, cada nivel que cambia se copia; mejor aún, aplánalo.

**Tres banderas donde cabe un `tipo`.** `cargando`, `listo` y `conError` como booleanos separados permiten combinaciones que no corresponden a ninguna pantalla. Una unión discriminada no las deja escribir.

**Guardar el objeto elegido.** Es una copia de un elemento de la lista que se queda vieja con el siguiente sondeo. Guarda el identificador y busca el objeto al dibujar.

**Guardar lo que se puede calcular, y peor, sincronizarlo con un Effect.** Una lista filtrada, un total o un elemento elegido no son estado. Calcularlos durante el dibujo es más simple, más rápido y no se desincroniza.

**Elevar el estado de más.** Subir el borrador de un cuadro de texto hasta la raíz hace que cada tecla vuelva a dibujar toda la pantalla. El estado sube hasta el ancestro común de quienes lo usan, ni un nivel más.

**Reiniciar el estado con un Effect cuando cambia una propiedad.** Un Effect que pone el borrador en `""` cuando cambia `nombre` dibuja primero con el borrador viejo y luego con el vacío. Una `key` lo hace en un paso, y lo dice en el código.

**Definir un componente dentro de otro.** Es un componente nuevo en cada dibujo: React ve otra cosa en la misma posición y descarta su estado sin aviso. Es la regla de la lección 1, y ahora sabes qué pierde quien la rompe.

## Ejercicios

### Ejercicio 1 — Predice el botón

Guarda una copia de `fig02_01.tsx` como `ejercicio1.tsx` en `~/curso-react/figuras/` y cambia en ella las tres llamadas de `ConValor` por estas:

```tsx
// ejercicio 1 (fragmento)
    establecerRevisiones(revisiones + 5);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones(revisiones + 1);
```

Cambia también el título de la llamada, para que la salida diga lo que corriste: `await hacerClic("ejercicio (+5, actualizadora, +1):", ConValor);`.

**Antes de correrla**, escribe en tu bitácora qué número dirá el botón después del clic y por qué, recorriendo la fila de actualizaciones renglón por renglón. Luego compílala y córrela.

### Ejercicio 2 — Cuenta las notas sin estado nuevo

Agrega al título de la tarjeta, o justo debajo del resumen, un texto que diga «Notas guardadas: N» con el número de servicios que tienen nota. La condición: **no puedes agregar ningún `useState`**. Antes de escribir, responde: ¿qué regla de forma te prohíbe un estado `cuantasNotas`, y qué tendrías que acordarte de hacer en `guardarNota` si lo tuvieras?

### Ejercicio 3 — El detalle y el filtro

Con el panel abierto, elige `catálogo` y luego marca «Solo fallas». **Antes de hacerlo**, predice: ¿sigue visible el detalle de `catálogo`? Compruébalo y explica por qué, señalando el renglón de `ContenidoReporte` responsable. Después, cambia el panel para que el detalle desaparezca cuando el servicio elegido queda fuera del filtro, **sin agregar estado y sin borrar `seleccionado`**. ¿Qué pasa con la selección si desmarcas la casilla?

### Ejercicio 4 — La `key` que falta, a mano

En una copia del punto de control, quita `key={estado.nombre}` de `DetalleSeleccion.tsx`. Comprueba que `npm run lint` y `npm run build` siguen en verde. Abre el panel, elige `pagos`, escribe un borrador **sin guardarlo** y elige `reportes`. Anota lo que ves. Luego guarda una nota en `pagos`, elige `catálogo` y regresa a `pagos`: ¿qué muestra el editor y por qué? Restaura la `key` al terminar.

## Soluciones

### Solución 1

El botón dice `1`. La fila de actualizaciones, en orden:

| En la fila | Recibe | Resultado |
|---|---|---|
| «reemplazar por `revisiones + 5`», con `revisiones` en `0` | — | `5` |
| `(actual) => actual + 1` | `5` | `6` |
| «reemplazar por `revisiones + 1`», con `revisiones` en `0` | — | `1` |

La última llamada no depende de lo anterior: reemplaza el valor por `0 + 1`, porque la fotografía del manejador sigue diciendo `0`. Así salió la corrida (el archivo y su salida están en `ejercicios/ejercicio1.tsx` y `ejercicios/ejercicio1.salida.txt`):

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

La segunda mitad es la de la figura, que no cambió. La documentación de React trae un ejercicio de la misma forma, con un reemplazo después de una actualizadora ([React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates)). La lección para llevarte: mezclar las dos formas sobre el mismo estado en un mismo manejador es legal, pero quien lo lea tiene que hacer esta tabla en la cabeza. Si te descubres haciéndola, usa una sola forma.

### Solución 2

El número se calcula durante el dibujo, a partir de `notas`, en `Panel`:

```tsx
// Panel.tsx (fragmento de la solución)
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <p>Notas guardadas: {Object.keys(notas).length}</p>
```

Un estado `cuantasNotas` violaría la regla 3, el estado redundante: es información que se calcula de `notas`. Si lo tuvieras, `guardarNota` tendría que actualizar dos estados cada vez, y además decidir si sumar uno (nota nueva), dejar igual (nota que se reescribe) o restar uno (nota que se borra con texto vacío). Con el cálculo, `conNota` ya decide todo eso y el número sale siempre de `notas`, así que no puede quedar desfasado de ellas. Fíjate también en que no hace falta `&&`: un `0` aquí sí es lo que quieres mostrar.

### Solución 3

Sí: el detalle de `catálogo` sigue visible aunque su fila ya no aparezca. Así lo midió Chrome sin ventana sobre el punto de control (`node medir.mjs filtro`):

```text
a. eliges catálogo: Detalle de catálogo
b. marcas «Solo fallas»: pagos: falla (HTTP 503) | reportes: falla (tiempo límite agotado) · Detalle de catálogo
c. desmarcas: Detalle de catálogo
```

El responsable es este renglón de `ContenidoReporte`:

```tsx
// ContenidoReporte.tsx (fragmento)
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

Busca en `estados`, la lista completa, no en `visibles`. Para que el detalle desaparezca con el filtro, basta con buscar en la lista filtrada:

```tsx
// ContenidoReporte.tsx (fragmento de la solución)
      const elegido = visibles.find((estado) => estado.nombre === seleccionado);
```

Al desmarcar la casilla, el detalle de `catálogo` **vuelve a aparecer**, porque `seleccionado` siguió valiendo `"catálogo"` todo el tiempo; solo cambió lo que se calcula a partir de él. Es el regalo de 2.3.2 en otra forma: como el detalle se calcula, no hay que «limpiar» nada. ¿Cuál de las dos versiones es mejor? Es una decisión de producto, no de React: el punto de control conserva el detalle visible porque la persona lo eligió a propósito, y esconderlo al filtrar podría sorprenderla. Lo que no es opinable es que ninguna de las dos necesita estado nuevo.

### Solución 4

Lint y build siguen en verde, como en «El error que vas a ver». Esto midió Chrome sin ventana sobre esa copia, construida (`node medir.mjs sin-key`):

```text
a. escribes en pagos sin guardar y eliges reportes: Detalle de reportes · borrador: "borrador de pagos"
b. guardas una nota en pagos y eliges catálogo: Detalle de catálogo · borrador: "llamar al proveedor"
c. cierras el detalle y eliges reportes: Detalle de reportes · borrador: ""
```

En el paso a, el título cambia a «Detalle de reportes» y el cuadro conserva el borrador de `pagos`: es la figura 3 dentro del `revisor`. El paso b es más sutil: con una nota guardada en `pagos`, al ir a `catálogo` el editor **sigue mostrando la nota de `pagos`**. `useState(notaGuardada)` solo leyó su valor inicial la primera vez que se montó el editor; sin `key`, el editor nunca se vuelve a montar mientras haya un servicio elegido, así que `notaGuardada` cambia y el borrador la ignora. Es exactamente la advertencia de la documentación sobre copiar una propiedad en el estado (2.5.3). Con la `key`, cada servicio monta su propio editor y la pareja «valor inicial + `key`» vuelve a funcionar. Y el paso c muestra una excepción: si cierras el detalle y eliges otro servicio, el editor sí se monta de nuevo, porque al cerrar desapareció del árbol, y el borrador sale vacío. Eso hace que el error sea intermitente, que es la peor clase de error.

## Cómo sé que lo logré

- [ ] `npm run lint` termina sin escribir ningún problema y `npm run build` termina con `✓ built`, con un `index-….js` en `dist/assets/`.
- [ ] Con el servidor de práctica y `npm run dev` encendidos, la casilla «Solo fallas» deja solo `pagos` y `reportes`, y el resumen sigue diciendo «4 servicios revisados · 2 servicios con falla».
- [ ] Al elegir un servicio, su botón pasa a `aria-pressed="true"` (míralo en las herramientas de desarrollo, pestaña Elementos) y aparece su detalle; «Cerrar detalle» lo quita y el botón vuelve a `false`; volver a pulsar el mismo servicio también lo quita.
- [ ] Una nota guardada marca la fila con «· con nota», y guardar el texto vacío quita la marca.
- [ ] Un borrador sin guardar no se arrastra al elegir otro servicio, y al volver aparece la nota guardada.
- [ ] Puedes correr las cuatro figuras y explicar cada renglón de su salida sin mirar la lección.
- [ ] En una copia, la mutación de `guardarNota` la rechazan `tsc` (TS2542) y `npm run lint` (`react-hooks/immutability`), y puedes decir por qué hacen falta los dos.
- [ ] Puedes señalar en el `revisor` un ejemplo de cada una de las cinco reglas de forma (uno puede servir para dos).
- [ ] Anotaste en tu [bitácora](bitacora.md) tu predicción del ejercicio 1 antes de correrlo, y si acertaste.

## Resumen

Responde sin mirar la lección:

1. ¿Por qué `revisiones` vale lo mismo antes y después de llamar a `establecerRevisiones` dentro de un clic? ¿Qué significa que el estado sea una fotografía?
2. ¿Qué es agrupar (*batching*) y qué tiene que ver con la fila de actualizaciones?
3. ¿Qué cambia si le pasas a `establecer…` una función en lugar de un valor? ¿Cuándo usa el curso cada forma?
4. ¿Por qué mutar un objeto y pasarlo de vuelta no vuelve a dibujar? ¿Qué compara React y con qué función de JavaScript?
5. ¿Cuáles son las cinco reglas de forma del estado? Da un ejemplo del `revisor` para cada una.
6. ¿Por qué `seleccionado` guarda un nombre y no un servicio? ¿Qué se vería mal si guardara el servicio?
7. ¿Cómo decides en qué componente vive un pedazo de estado? ¿Por qué el borrador no sube a `Panel`?
8. ¿Dónde guarda React el estado de un componente? ¿Qué hace una `key` con eso, y por qué ninguna herramienta te avisa si falta?

## Para leer más

- [React, «State as a Snapshot»](https://react.dev/learn/state-as-a-snapshot): el estado como fotografía, el ejemplo del botón «+3» y por qué el valor no cambia dentro de un dibujo. Consultado el 21 de octubre de 2026.
- [React, «Queueing a Series of State Updates»](https://react.dev/learn/queueing-a-series-of-state-updates): el agrupamiento, la fila de actualizaciones, la función actualizadora y cómo nombrar su parámetro. Consultado el 21 de octubre de 2026.
- [React, `useState`](https://react.dev/reference/react/useState): la función `set`, la comparación con `Object.is`, la doble llamada en `StrictMode` y los problemas comunes («el registro da el valor viejo», «la pantalla no cambia»). Consultado el 21 de octubre de 2026.
- [React, «Updating Objects in State»](https://react.dev/learn/updating-objects-in-state): tratar el estado como de solo lectura, la propagación superficial, las razones de la inmutabilidad e Immer. Consultado el 21 de octubre de 2026.
- [React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure): las cinco reglas de forma, el `selectedId` en lugar del objeto y la advertencia sobre copiar propiedades en el estado. Consultado el 21 de octubre de 2026.
- [React, «Reacting to Input with State»](https://react.dev/learn/reacting-to-input-with-state): los estados «imposibles» y un `status` en lugar de varias banderas. Consultado el 21 de octubre de 2026.
- [React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components): elevar el estado, componentes controlados y no controlados, y la sola fuente de verdad. Consultado el 21 de octubre de 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): el estado atado a la posición en el árbol, `key` fuera de las listas y el ejemplo del chat. Consultado el 21 de octubre de 2026.
- [React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect): calcular durante el dibujo, reiniciar todo el estado con una `key` y guardar el identificador elegido. Consultado el 21 de octubre de 2026.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input): campos controlados, `checked` con `onChange` y `evento.target.checked` en las casillas. Consultado el 21 de octubre de 2026.
- [React, «immutability»](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability): la regla del linter que rechaza mutar propiedades y estado. Consultado el 21 de octubre de 2026.
- [MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is): qué significa «el mismo valor» y que dos objetos son el mismo solo si son la misma referencia. Consultado el 21 de octubre de 2026.
- [MDN, «Spread syntax»](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax): la propagación en objetos literales, la copia superficial y qué valor gana cuando se repite una propiedad. Consultado el 21 de octubre de 2026.
- [MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed): el estado de un botón de alternancia y por qué su texto no cambia. Consultado el 21 de octubre de 2026.
- [MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside): el papel de contenido complementario y por qué, dentro de una sección, necesita un nombre. Consultado el 21 de octubre de 2026.
- [TypeScript, «Utility Types»](https://www.typescriptlang.org/docs/handbook/utility-types.html): `Readonly<Type>` y `Record<Keys, Type>`. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| estado | lo que un componente recuerda entre un dibujo y el siguiente; React lo guarda y lo entrega con `useState` |
| fotografía (*snapshot*) | el valor fijo del estado durante un dibujo; cambiarlo pide un dibujo nuevo, no reescribe la variable |
| agrupar (*batching*) | esperar a que termine el manejador para procesar todas las actualizaciones de estado en un solo dibujo |
| función actualizadora | la función que se le pasa a `establecer…` para calcular el valor nuevo a partir del último que hay en la fila |
| mutar | cambiar un objeto que ya existe en lugar de crear uno nuevo |
| propagación (`...`) | la sintaxis que copia las propiedades de un objeto en otro nuevo; copia un solo nivel |
| estado redundante | información guardada en el estado que se podría calcular a partir de otro estado o de las propiedades |
| elevar el estado | mover un estado al ancestro común de los componentes que lo usan y pasarlo hacia abajo por propiedades |
| componente controlado | el que recibe su información importante por propiedades en lugar de guardarla él mismo |
| `key` (para reiniciar) | identificador que React usa como parte de la posición; si cambia, desmonta el componente y monta uno nuevo |

---

**Siguiente:** [Lección 3 — Effects: sincronizar, no «cuando cargue»](03-effects-sincronizar.md)
