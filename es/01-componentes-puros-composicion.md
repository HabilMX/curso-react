# Lección 1 — Componentes puros y composición

*Son las 6:50 de la tarde y la jefa de operación quiere, para mañana temprano, una sola línea arriba del panel: cuántos servicios se revisaron y cuántos fallan. Parece un cambio de cinco minutos. Abres `Panel.tsx` y te encuentras con un archivo donde viven juntas la fila, la lista, los tres estados de la carga y el botón; para agregar un renglón tienes que entender las cuatro cosas a la vez. Lo agregas como puedes y lo pruebas con los datos de siempre: se ve bien. A las 7:30 alguien del turno de noche reinicia la API con todos los servicios sanos, y al final del renglón nuevo, pegado a «revisados», aparece un `0` que nadie escribió: `4 servicios revisados0`. Más tarde, al ordenar la lista «para que se vea bonita», la lista que guardaba otra parte del programa también queda ordenada, sin que nadie se lo pidiera. Y cuando un compañero mete un contador en un componente «de ayuda» definido dentro del panel, el contador vuelve a cero cada diez segundos, con cada actualización. Nada de esto rompe la compilación ni el linter. Esta lección parte el panel en piezas que se entienden por separado y te enseña las tres reglas que evitan esos tres sustos.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 1.3 y 1.4)

**Qué construyes:** el panel partido en piezas que se pueden entender y cambiar por separado: una `Tarjeta` que envuelve cualquier contenido, un resumen de fallas calculado con funciones puras, y la lista, la fila y los tres estados de la carga en archivos propios

**Qué aprendes:** render y *commit*; pureza: mismas entradas, misma salida; tres impurezas plantadas que hay que encontrar; `children` y composición; `key` con un identificador estable; la trampa del `0` pintado por `&&`; por qué un componente jamás se define dentro de otro

**De dónde vienes.** De la [Lección 0](00-un-proyecto-de-verdad.md). Tu `revisor` ya es un proyecto de Vite con el linter de React encendido, `StrictMode` activo, un *proxy* hacia el servidor de práctica y un `Panel.tsx` que hace todo: define `FilaEstado`, define `Contenido` con el `switch` de los tres estados de la carga, y arma la página. Funciona y pasa el linter. Lo que no tiene es forma: es un solo archivo con tres responsabilidades. Trabajas en la misma carpeta, `~/curso-react/revisor/`.

**Qué no hace esta lección.** No agrega estado nuevo: no hay filtros, ni selección, ni notas; eso llega en la [Lección 2](02-estado-instantanea-forma.md). No toca `useReporte` ni la frontera de red: el hook y `cargar.ts` quedan idénticos. No cambia el servidor de práctica, que sigue en su primera versión (`GET /salud` y `GET /api/estados`). Y no hace optimizaciones: verás que React vuelve a llamar a tus componentes más veces de las que esperas, y la respuesta de esta lección no es «memoízalo», sino «asegúrate de que llamarlo de más no haga daño». Medir y optimizar es tema de la [Lección 9](09-rendimiento-publicacion.md).

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas que fija el `package.json` del punto de control (las mismas de la Lección 0: React 19.3.1, Vite 8.3.5, ESLint 10.13.0, `eslint-plugin-react-hooks` 7.1.1). Salvo el aviso de `fsevents` que explica la sección 1.7, nada de lo que se muestra depende del sistema operativo. En las corridas del curso, este punto de control se volvió a instalar desde cero en un contenedor Linux (`node:24.22.0-bookworm`) y dio el mismo nombre de archivo en `dist/` que se muestra aquí, `index-Dezp5bTH.js`; como ese nombre sale del contenido, las dos máquinas produjeron el mismo paquete. Las figuras se corrieron solo en macOS; no se corrió nada en una Linux Mint real. Lo que se ve «en el navegador» se midió con Chrome sin ventana (`--headless --dump-dom`), que ejecuta el JavaScript de la página y entrega el documento resultante. Las figuras se corren en `~/curso-react/figuras/`, la misma carpeta de la Lección 0, con el mismo `package.json`; las rutas largas que imprime ESLint se muestran a partir de `~/curso-react`. Las horas de la bitácora del servidor de práctica están en UTC. Los programas están en [`programas/01-componentes-puros-composicion/`](../programas/01-componentes-puros-composicion): `revisor/` es el punto de control y las figuras están junto a él.

## Al terminar vas a poder

- Distinguir en una salida real qué parte es *render* (React llama a tus funciones) y qué parte es *commit* (React toca el DOM), y explicar por qué un render de más no cambia la pantalla.
- Encontrar las tres impurezas de un componente —cambiar algo de fuera, mutar una prop, leer el reloj— y corregir cada una sin cambiar lo que la persona ve.
- Partir un componente grande en piezas con una sola responsabilidad, y escribir un componente que reciba `children` para envolver contenido que no conoce.
- Elegir la `key` de una lista y demostrar con una corrida qué pasa con el estado de cada fila cuando la `key` es la posición, cuando cambia con la posición y cuando es el identificador.
- Reconocer la trampa del `0` en un `&&` y escribir la condición para que nunca pinte un número suelto.
- Leer el error `static-components` del linter y explicar, con una corrida, por qué un componente definido dentro de otro pierde su estado.

## El porqué antes del cómo

Abre el `Panel.tsx` de la Lección 0 y cuenta cuántas preguntas distintas responde. ¿Cómo se ve un servicio disponible y cómo uno en falla? Eso es `FilaEstado`. ¿Qué se muestra mientras carga, si falla la carga y cuando hay datos? Eso es `Contenido`. ¿Qué lleva la página alrededor, el título y el botón? Eso es `Panel`. Tres preguntas en un archivo de sesenta renglones. Hoy se lee; el problema es lo que viene. En las próximas lecciones el panel va a ganar un filtro, una selección, notas, el detalle de cada servicio, avisos y un formulario. Si todo eso entra al mismo archivo, la jefa de operación de la escena va a pedir un renglón y tú vas a tener que leer trescientos.

La respuesta obvia es «pártelo en componentes». Y es la correcta, pero partir sin entender qué es un componente para React produce piezas que se rompen de formas raras: el `0` que aparece solo, la lista que se ordena sin que nadie la toque, el contador que vuelve a cero en cada actualización. Esas tres fallas tienen la misma raíz: **React no llama a tus componentes cuando tú crees, ni las veces que tú crees.** Los llama cada vez que algo podría haber cambiado, a veces dos veces seguidas, y confía en que llamarlos no tenga consecuencias. Si un componente cumple ese trato, puedes partirlo, moverlo y reusarlo sin miedo. Si no lo cumple, cada pieza nueva multiplica las sorpresas.

Por eso esta lección no empieza partiendo archivos, sino con tres ideas, una por sección grande:

1. **Pureza** (1.1 y 1.2). Qué hace React cuando «dibuja» y por qué tus componentes tienen que ser funciones puras: mismas entradas, misma salida, y nada de cambiar lo que existía antes de llamarlos.
2. **Composición** (1.3). Cómo se parte un componente por responsabilidades y cómo un componente puede envolver contenido que no conoce, con `children`.
3. **Identidad** (1.4 a 1.6). Cómo sabe React que la fila de `pagos` de este dibujo es la misma del anterior: la `key`, la posición en el árbol y la razón por la que un componente jamás se define dentro de otro. La trampa del `0` cabe aquí también, porque es un caso de «React dibujó algo que no esperabas».

La sección 1.7 hace el recorrido completo: verificar el punto de control y verlo en el navegador. Al final, esta es la construcción que vas a obtener, y vas a saber por qué el JavaScript cambió de nombre respecto a la Lección 0 aunque el panel «haga lo mismo»:

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

Veintiséis módulos en lugar de veinte: son los seis archivos nuevos de esta lección. El panel muestra lo mismo que antes, más una tarjeta con su encabezado y una línea de resumen; la diferencia grande no se ve en la pantalla, se ve cuando alguien tiene que cambiarlo.

## Los conceptos

### 1.1 Render y *commit*: qué hace React cuando «dibuja»

#### 1.1.1 Tres pasos, no uno

Hasta ahora has dicho «React dibuja el componente» como si fuera una sola cosa. La documentación de React lo separa en tres pasos, con una comparación de restaurante: alguien **dispara** el pedido, la cocina lo **prepara** y el mesero lo **lleva** a la mesa. En React se llaman *trigger*, *render* y *commit*, y toda actualización de la pantalla pasa por los tres ([React, «Render and Commit»](https://react.dev/learn/render-and-commit)):

1. **Disparar** (*trigger*). Algo pide un dibujo: el primer `createRoot(...).render(...)` al abrir la página, o un cambio de estado, como el `establecerCarga` de `useReporte` cuando llega la respuesta.
2. **Render.** React **llama a tus funciones de componente**. Llama a `Panel`, `Panel` devuelve JSX que menciona a `Tarjeta`, React llama a `Tarjeta`, y así hacia abajo. La documentación dice que el proceso es recursivo: sigue hasta que ya no quedan componentes anidados y React sabe exactamente qué debe mostrarse. El resultado de este paso no es la pantalla; es una descripción de cómo debería verse.
3. ***Commit.*** React aplica al DOM las diferencias que ya calculó durante el render, y **toca el DOM solo donde hay diferencia**. La comparación entre la descripción nueva y la anterior ocurre mientras dibuja; en el *commit* solo se ejecutan los cambios. En palabras de la documentación: React solo cambia los nodos del DOM si hay una diferencia entre un render y otro, y aplica las operaciones mínimas necesarias, «calculadas durante el render».

Después del *commit*, el navegador vuelve a pintar la pantalla. La documentación llama a ese último paso *painting* (pintar) para no confundirlo con el render de React. En este curso se usa la misma distinción: **render** es cuando React llama a tus funciones; **pintar** es cuando el navegador dibuja píxeles. En español, «dibujar» un componente se ha usado hasta aquí como sinónimo de render, y así se sigue usando.

El render produce un **árbol**: `Panel` arriba, `Tarjeta` debajo, luego `ContenidoReporte`, y así. La documentación lo llama árbol de render, y aclara que está hecho solo de componentes de React ([React, «Understanding Your UI as a Tree»](https://react.dev/learn/understanding-your-ui-as-a-tree)). Ese árbol va a importar en 1.4 y 1.6, cuando la pregunta sea cómo sabe React que un componente de este render es el mismo del anterior.

#### 1.1.2 Verlo en una corrida

La primera figura lo hace visible. Una lista de dos filas imprime un renglón cada vez que React llama a un componente (render), y un `MutationObserver` —la API del navegador que avisa cuando algo cambia en el DOM— cuenta cuántos cambios hizo el *commit*. Se dibuja tres veces: la primera vez, otra con los mismos datos y otra con un número distinto.

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

Lee las tres partes con calma, porque toda la lección se apoya en ellas:

- **La primera vez**, React llamó a los tres componentes y el *commit* hizo un solo cambio: insertó la `<ul>` completa, con sus dos filas adentro, de una vez.
- **Con los mismos datos**, React volvió a llamar a los tres componentes —el render ocurrió completo— y el *commit* hizo **cero** cambios. React comparó, no encontró diferencias y no tocó el DOM.
- **Con un número distinto**, otra vez se llamó a los tres, incluida la fila de `catálogo`, que no cambió. El *commit* hizo un solo cambio: el texto `118` pasó a `97`. No reemplazó la fila ni la lista; cambió un nodo de texto.

Dos conclusiones salen de aquí, y las dos van contra la intuición. La primera: **que React llame a tu componente no significa que la pantalla cambie.** Un render es una pregunta («¿cómo debería verse esto ahora?»), no una orden de repintar. La segunda: **React llama a tus componentes más de lo que necesitarías**: la fila de `catálogo` se calculó tres veces, dos de ellas sin que nada suyo hubiera cambiado. Eso no es un defecto que haya que perseguir con `memo` (la Lección 9 explica cuándo sí, y siempre después de medir); es parte del diseño. React puede permitirse llamar de más porque cuenta con una condición: que llamar a tu componente no tenga consecuencias. Esa condición tiene nombre.

#### 1.1.3 Por qué esto importa para partir el panel

Cuando el panel era una sola pieza, cada render llamaba a `Panel`, `Contenido` y cuatro `FilaEstado`. Ahora que lo vas a partir, serán más componentes, y cada uno se va a llamar en cada render de su padre. Si alguno de ellos «hace algo» al ser llamado —sumar un contador, cambiar un arreglo, leer la hora—, ese algo se va a repetir tantas veces como React decida llamarlo, y tú no controlas cuántas son. Por eso la pureza va antes de partir: es lo que hace seguro tener muchas piezas.

### 1.2 Pureza: mismas entradas, misma salida

#### 1.2.1 Las dos condiciones

La documentación de React define un componente puro con dos condiciones, tomadas de la definición de función pura en matemáticas y en programación ([React, «Keeping Components Pure»](https://react.dev/learn/keeping-components-pure)):

- **Se ocupa de sus asuntos.** No cambia ningún objeto ni variable que existiera antes de que lo llamaran.
- **Mismas entradas, misma salida.** Con las mismas entradas, devuelve siempre el mismo resultado.

¿Cuáles son las entradas de un componente? La misma página lo dice: en React hay tres tipos de entrada que puedes leer mientras se dibuja, que son las props, el estado y el contexto, y las tres se tratan **como de solo lectura**. Hoy solo usas props; el estado llega en la Lección 2 y el contexto en la 6, y la regla será la misma para los tres. La referencia de las reglas de React lo formula con una palabra técnica: los componentes tienen que ser **idempotentes**, devolver siempre la misma salida respecto a sus entradas, porque React puede dibujar un componente varias veces para dar la mejor experiencia posible ([React, «Components and Hooks must be pure»](https://react.dev/reference/rules/components-and-hooks-must-be-pure)).

Lo que sí está permitido es cambiar lo que el propio componente acaba de crear. La documentación lo llama **mutación local**: si dentro del componente creas un arreglo nuevo y le agregas elementos, nadie de fuera lo ve, y la siguiente llamada crea uno nuevo. El problema nunca es mutar; el problema es mutar algo que **ya existía** antes de la llamada.

#### 1.2.2 Tres impurezas plantadas

La segunda figura tiene un componente con tres impurezas escondidas en tres renglones seguidos. Antes de leer la explicación, mira el código y la salida e intenta encontrarlas tú. Las pistas están en la salida: cada uno de los renglones 2, 3 y 4 es el síntoma de una.

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

`renderToStaticMarkup` es una función de `react-dom/server` que dibuja un árbol y devuelve el HTML como texto, sin navegador ni DOM; aquí sirve para dibujar el mismo componente dos veces, con un segundo de diferencia, y comparar. Si ya encontraste las tres, compara con la lista. Si no, vuelve a leer los tres primeros renglones del cuerpo de `ResumenImpuro` antes de seguir.

**Impureza 1: cambia una variable de fuera.** `revision = revision + 1` modifica una variable que existía antes de llamar al componente. El síntoma es el renglón 3: se montó **una** vez y el contador dice **2**. ¿Por qué? Porque `StrictMode`, en desarrollo, llama a cada componente dos veces justo para destapar esto; la documentación lo dice así: al llamar dos veces a las funciones de componente, `StrictMode` ayuda a encontrar los componentes que rompen estas reglas ([React, «Keeping Components Pure»](https://react.dev/learn/keeping-components-pure)). En la Lección 0 viste el ciclo extra de los efectos; este es su hermano, el render extra. En producción no habría doble llamada, pero tampoco te salvas: React puede llamar al componente cada vez que su padre se dibuje, y el número dejaría de significar «revisiones» para significar «veces que a React le convino llamarme».

**Impureza 2: muta una prop.** `servicios.sort(...)` parece que «calcula una versión ordenada», pero `sort` ordena el arreglo **en su lugar** y devuelve el mismo arreglo ([MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). El síntoma es el renglón 2: el arreglo que pertenecía a quien llamó al componente quedó reordenado. Es el segundo susto de la escena, la lista que se ordenó sola. Las props son, en palabras de la documentación, fotografías inmutables de un momento: no se cambian ([React, «Passing Props to a Component»](https://react.dev/learn/passing-props-to-a-component)).

**Impureza 3: lee el reloj.** `new Date()` devuelve algo distinto en cada llamada aunque las props sean las mismas. El síntoma es el renglón 4: mismas props, dos dibujos, dos horas distintas. La referencia de React usa este mismo ejemplo: `new Date()` no es idempotente, porque devuelve la fecha actual y cambia cada vez que se llama; lo mismo pasa con `Math.random()` ([React, «Components and Hooks must be pure»](https://react.dev/reference/rules/components-and-hooks-must-be-pure)). Con un reloj en el render, la salida depende de **cuándo** React decidió llamar al componente, algo que tú no controlas.

#### 1.2.3 ¿Quién te avisa de cada una?

La pregunta práctica es cuál de tus herramientas atrapa cada impureza antes de que llegue a la persona usuaria. Se midió con las tres herramientas del curso, y el resultado no es el que uno esperaría.

**El linter atrapa la primera.** Esto es lo que dice ESLint sobre la figura:

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

Es la regla `globals`, una de las catorce que vienen del React Compiler y que la Lección 0 encendió: valida que no se asignen ni muten variables globales durante el render ([React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals)). El mensaje incluso propone las dos salidas: si el valor se usa para dibujar, que sea estado; si no, que se actualice en un efecto.

**Las otras dos, el linter no las vio.** Se comprobó borrando el renglón de `revision` en una copia y volviendo a correr ESLint: el único aviso que quedó fue `prefer-const` (porque `revision` ya no se reasignaba), nada de React. Ni el `sort` sobre la prop ni el `new Date()` produjeron error. Lo segundo merece un comentario: la página de la regla `purity` menciona `new Date()` entre sus ejemplos ([React, lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity)), pero en la versión 7.1.1 del paquete, medido ese día, la regla se dispara con `Date.now()` y no con `new Date()`. Al cambiar en la copia `new Date()` por `new Date(Date.now())`, apareció `Error: Cannot call impure function during render`, con la regla `react-hooks/purity`. La propia página presenta su lista como «ejemplos usuales» (*usual examples*, con `Date.now()` y `new Date()` en el mismo renglón), no como un inventario de lo que la versión instalada detecta. La lección práctica: **el linter es una red, no un muro.** Atrapa mucho, y lo que no atrapa sigue siendo tu responsabilidad.

**TypeScript atrapa la segunda, si se lo pides.** Fíjate en el tipo de la prop: `Servicio[]`, sin `readonly`. Se escribió así a propósito, para que la figura compilara. Si cambias el tipo a `readonly Servicio[]`, que es como `contrato.ts` del `revisor` declara sus listas desde la Lección 0 (`readonly estados: readonly EstadoPublico[]`), la compilación se detiene:

```text
fig01_02.tsx(20,31): error TS2339: Property 'sort' does not exist on type 'readonly Servicio[]'.
```

Un arreglo `readonly` en TypeScript no tiene los métodos que mutan: ni `sort`, ni `push`, ni `splice`. Esa palabra que parecía decoración en `contrato.ts` es, en realidad, la defensa contra la segunda impureza. Los tres errores de tipo que la acompañan en esa corrida (`TS7006`, parámetros con tipo `any` implícito) son consecuencia del primero: como `sort` no existe, TypeScript ya no sabe qué tipo tienen `a` y `b`, ni el resultado `ordenados`, y por eso tampoco el `s` del `map` del renglón 25.

**`StrictMode` atrapa las que cambian algo con cada llamada.** El contador que dice 2 lo destapó `StrictMode`. En una aplicación real lo verías como «la revisión salta de dos en dos en desarrollo», y esa rareza es la pista.

Resumen de la defensa: **el linter** para lo que se ve en el texto del código, **TypeScript con `readonly`** para las mutaciones de datos que recibes, **`StrictMode`** para los efectos que se repiten, y **tus ojos** para lo demás. Ninguna sola basta. El ejercicio 1 te pide arreglar las tres.

#### 1.2.4 Dónde va lo impuro

Si un componente no puede leer el reloj ni cambiar nada, ¿dónde se hacen esas cosas? La documentación de React responde con un orden de preferencia: los efectos secundarios van normalmente en **los manejadores de eventos** (el `onClick` de un botón, por ejemplo), que React no llama durante el render; y si no hay ningún evento que corresponda, como último recurso, en un `useEffect` ([React, «Keeping Components Pure»](https://react.dev/learn/keeping-components-pure)). Tu panel ya lo hace bien: la petición a la API vive en el efecto de `useReporte`, porque es sincronizarse con algo de fuera, y el `establecerCarga({ tipo: "cargando" })` de «Actualizar» vive en `recargar`, que se ejecuta por un clic. La Lección 3 vuelve sobre los efectos a fondo.

Y lo que se puede **calcular** a partir de las props no es un efecto secundario: es justo lo que un componente puro hace. Contar cuántos servicios fallan es un cálculo. Por eso el primer archivo nuevo del punto de control no es un componente, sino dos funciones puras:

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

Las dos cumplen las dos condiciones. `contarFallas` recibe una lista `readonly`, así que no podría mutarla aunque quisiera, y `filter` devuelve un arreglo nuevo (una mutación local que nadie ve). `textoFallas` resuelve el singular, porque «1 servicios con falla» se lee mal. Ninguna sabe de React, de JSX ni del DOM, y por eso se pueden probar con un `console.log` o, en la Lección 8, con una prueba de tres renglones, sin montar nada. **Separar el cálculo de la presentación** es el primer movimiento de esta lección: lo que es cálculo va a una función pura en un archivo `.ts`; lo que es presentación va a un componente que la llama.

### 1.3 Composición: partir el panel por responsabilidades

#### 1.3.1 Cuándo partir y por dónde

La documentación de React, en su guía para pensar una interfaz, propone partir con las mismas técnicas con que decides si escribir una función nueva; una de ellas es la separación de responsabilidades: un componente idealmente se ocupa de una sola cosa, y si crece, se descompone en subcomponentes más pequeños ([React, «Thinking in React»](https://react.dev/learn/thinking-in-react)). Aplicado al `Panel.tsx` de la Lección 0, las responsabilidades ya estaban a la vista; solo vivían en un mismo archivo. El punto de control las separa así, de abajo hacia arriba:

| Archivo | Pregunta que responde | Recibe |
|---|---|---|
| `FilaEstado.tsx` | ¿Cómo se ve **un** servicio? | un `EstadoPublico` |
| `ListaEstados.tsx` | ¿Cómo se ve la **lista** de servicios? | la lista |
| `ResumenFallas.tsx` | ¿Qué dice la línea de **resumen**? | la lista |
| `ContenidoReporte.tsx` | ¿Qué se muestra según la **carga**: esperando, error o datos? | una `Carga` |
| `Tarjeta.tsx` | ¿Cómo se ve una **caja con título**, sea cual sea su contenido? | un título y `children` |
| `Panel.tsx` | ¿Cómo se **arma** la página? | `cargar` y `cadaMs` |

Fíjate en la columna «Recibe»: cada pieza recibe solo lo que necesita. `FilaEstado` no sabe que existe una carga; `ListaEstados` no sabe que hay un botón; `ResumenFallas` no sabe cómo se pide el reporte. Esa ignorancia es lo valioso: si mañana cambias cómo se ve una fila, abres un archivo de dieciocho renglones y no tienes que entender nada más.

Los dos primeros salen del viejo `Panel.tsx` casi sin tocar. `FilaEstado` es idéntica a la de la Lección 0, ahora exportada desde su propio archivo:

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

`ListaEstados` es el `<ul>` con su `map`, que antes vivía dentro del `case "listo"`. Tiene un cambio respecto a la Lección 0, en la `key`, que la sección 1.4 explica con una corrida:

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

El resumen es nuevo, y es el renglón que pedía la jefa de operación. Usa las dos funciones puras de 1.2.4 y contiene, ya resuelta, la trampa del `0` que 1.5 explica:

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

Un detalle de JSX que explica por qué el texto sale pegado como debe: el salto de línea y la sangría entre `servicios revisados` y la llave `{fallas > 0 && …}` **no** producen un espacio en la página, porque JSX descarta los espacios en blanco que incluyen un salto de línea. Por eso el separador `·` lleva su espacio adentro del `<strong>`: `<strong> · …</strong>`. Si quitaras ese espacio, en la pantalla verías `revisados· 2 servicios`.

`ContenidoReporte` es el viejo `Contenido`, con su nombre completo y el `case "listo"` convertido en dos piezas. Los `<>` y `</>` son un **fragmento**: una forma de devolver dos elementos hermanos sin envolverlos en un `<div>` que no significa nada:

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

El `default` con `never` es el mismo de la Lección 0, y se queda por la misma razón: si mañana alguien agrega un cuarto tipo a `Carga` (la Lección 4 agrega el estado vacío, aunque de otra forma), TypeScript señala este `switch` como incompleto. Nota también lo que **no** se hizo: `ResumenFallas` y `ListaEstados` reciben la misma lista y cada uno hace con ella lo suyo. Ninguno la guarda, ninguno la copia en un estado, ninguno la modifica. Los dos son puros, y por eso compartir la misma lista es seguro.

#### 1.3.2 `children`: el hueco que llena el padre

Falta la pieza que más enseña. La jefa de operación quiere que el reporte se vea como una tarjeta: un recuadro con un título. Y es fácil adivinar que, en cuanto exista, alguien querrá otra tarjeta igual para el detalle de un servicio, otra para los avisos y otra para el formulario. Podrías escribir `TarjetaReporte`, `TarjetaDetalle` y `TarjetaAvisos`, tres componentes casi iguales. O puedes escribir **una** tarjeta que no sepa qué lleva adentro.

React lo resuelve con una prop especial. Cuando anidas contenido dentro de una etiqueta JSX, el componente padre recibe ese contenido en una prop llamada `children`. La documentación propone imaginarlo así: un componente con `children` tiene un «hueco» que los componentes que lo usan pueden llenar con el JSX que quieran, y no necesita saber qué se dibuja adentro ([React, «Passing Props to a Component»](https://react.dev/learn/passing-props-to-a-component)). Esa es la **composición**: armar piezas grandes juntando piezas que no se conocen entre sí.

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

Tres decisiones de este archivo:

- **Vive en `src/compartido/`, no en `src/reporte/`.** No sabe nada del reporte. Es la primera pieza de la aplicación que está pensada para varias funcionalidades, y la carpeta lo dice. Es el criterio de carpetas por funcionalidad de la Lección 0: lo que usa una sola funcionalidad vive con ella; lo que usan varias, en `compartido/`.
- **`children` tiene tipo `ReactNode`.** Es el tipo que React exporta para «cualquier cosa que se pueda dibujar»: un elemento JSX, un texto, un número, una lista de elementos, `null`. Así la tarjeta acepta lo que le pongas adentro y TypeScript te avisa si le pasas algo que React no sabe dibujar, como un objeto suelto.
- **Usa `<section>` con un nombre accesible.** Un `<section>` cualquiera no significa nada especial para un lector de pantalla. Pero, según MDN, un `<section>` comunica el rol `region` (una zona con nombre a la que la persona puede saltar) cuando tiene un nombre accesible ([MDN, rol `region`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role)). Aquí el nombre se lo da `aria-label={titulo}`. MDN prefiere, cuando hay un encabezado visible, `aria-labelledby` apuntando al encabezado en lugar de repetir el texto; el punto de control usa `aria-label` por simplicidad: el texto es el mismo del `<h2>`, y la forma que prefiere MDN, `aria-labelledby`, pide un `id` único por tarjeta, que en React se genera con `useId`, un hook que el curso todavía no presenta. Es una decisión del curso, no una regla: las dos formas producen el mismo nombre. La accesibilidad, como dice el plan del curso, es una costumbre que se enseña donde aparece; la Lección 8 consulta la página por rol y por nombre, y esta región es una de las cosas que encuentra.

Y `Panel` queda así, sin ninguna lógica de presentación propia:

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

Lee el JSX de `Panel` como una frase: «la página tiene un título y una tarjeta llamada Estado de los servicios, que contiene el contenido del reporte y un botón». Lo que va entre `<Tarjeta>` y `</Tarjeta>` —el contenido y el botón— es exactamente lo que `Tarjeta` recibe como `children` y coloca debajo de su `<h2>`. `Tarjeta` no sabe que hay un botón ni que existe una carga; `Panel` no sabe que la tarjeta usa un `<section>`. Si mañana la tarjeta cambia de estilo, cambias un archivo y todas las tarjetas lo heredan.

Hay un efecto menos visible y muy útil: el botón **viaja con el estado que lo controla**. `recargar` sale de `useReporte`, que vive en `Panel`; el botón está en el JSX de `Panel`. `Tarjeta` lo dibuja, pero no lo conoce. Si en lugar de `children` hubieras pasado `recargar` como prop a `Tarjeta` para que ella dibujara el botón, la tarjeta dejaría de ser genérica: sabría de recargas. `children` deja que cada pieza sepa solo lo suyo, y la Lección 6 vuelve sobre esto cuando se pregunte si hace falta un contexto: muchas veces, la respuesta es «no, basta con `children`».

La hoja de estilos crece con dos reglas, una para la tarjeta y otra para resaltar el número de fallas:

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

La regla `.tarjeta` vive en la hoja del reporte aunque `Tarjeta` esté en `compartido/`. El curso usa **una sola hoja de estilos** que crece lección a lección; es una simplificación consciente para que no haya que perseguir estilos entre archivos. Cuando un proyecto crece de verdad, cada componente compartido suele traer su hoja; aquí no hace falta todavía.

`useReporte.ts`, `cargar.ts`, `main.tsx`, el contrato, la configuración y el servidor de práctica no cambian. En `package.json` solo cambia el número de versión, de `0.0.0` a `0.1.0`: el curso usa `0.N.0` en el punto de control de la lección N.

### 1.4 `key`: cómo sabe React que una fila es la misma

#### 1.4.1 El problema que resuelve

Vuelve a la figura 1. En el tercer dibujo, React cambió un texto y no reemplazó la fila. ¿Cómo supo que la fila de `inventario` del tercer dibujo era **la misma** del segundo, y que bastaba cambiarle el número? Con una lista que siempre trae los mismos elementos en el mismo orden, podría usar la posición. Pero las listas cambian: un servicio nuevo aparece arriba, uno se da de baja, el orden cambia. Para emparejar los elementos de una lista entre un render y otro, React usa la `key`.

La documentación pone dos reglas ([React, «Rendering Lists»](https://react.dev/learn/rendering-lists)):

- **Las `key` son únicas entre hermanos.** Dos elementos de la misma lista no pueden compartirla (en listas distintas sí pueden repetirse).
- **Las `key` no deben cambiar**, o se pierde su propósito; por eso no se generan durante el render.

Y aclara un detalle que confunde: tu componente **no recibe** `key` como prop. Es una pista para React; si `FilaEstado` necesitara el nombre, se lo pasarías aparte (aquí ya lo tiene, dentro de `estado`).

#### 1.4.2 Tres `key` para la misma lista

En la Lección 0, la fila llevaba `` key={`${posicion}-${estado.nombre}`} ``. Funcionaba y no tenía repetidos. ¿Por qué cambiarla? La figura 3 responde midiendo. Una lista de cuatro servicios recibe un quinto, `correo`, **al principio**, y se prueban tres formas de `key`. Cada fila guarda en su estado el nombre con el que nació —un `useState` con un valor inicial, que se explica a fondo en la Lección 2; aquí basta saber que React lo conserva mientras la fila sea «la misma»— y muestra una advertencia si ahora le toca dibujar otro nombre. Además, se cuenta cuántos `<li>` del DOM son nuevos después del cambio.

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

Tres resultados, tres lecciones:

- **`key={posicion}`: la identidad equivocada.** React emparejó por posición: la fila que estaba en el lugar 0 (la de `catálogo`) ahora recibe `correo`, la del lugar 1 (la de `pagos`) recibe `catálogo`, y así. Solo creó una fila nueva, la última. El DOM quedó con los textos correctos, pero **el estado de cada fila se quedó en su lugar mientras los datos se recorrieron**: la fila que dice `correo` es, para React, la que nació como `catálogo`. Si la fila de `pagos` guardara en su propio estado algo que la persona escribió, ahora ese texto aparecería junto a `catálogo`. La documentación lo advierte: usar la posición como `key` (que es lo que React hace si no pones ninguna) suele llevar a errores sutiles y confusos cuando se insertan, borran o reordenan elementos ([React, «Rendering Lists»](https://react.dev/learn/rendering-lists)).
- **`` key={`${posicion}-${nombre}`} ``: la identidad que se pierde.** La `key` de la Lección 0. Nunca confunde una fila con otra, porque incluye el nombre. Pero incluye también la posición, y al insertar `correo` arriba, **todas** las posiciones cambiaron: `0-catálogo` pasó a ser `1-catálogo`, una `key` que React nunca había visto. Resultado: cinco filas creadas desde cero de cinco, y las cuatro viejas destruidas con todo su estado. Es el mismo defecto que la documentación señala para `key={Math.random()}`, en menor grado: las `key` no coinciden entre renders y los componentes y el DOM se recrean. En el `revisor` no se nota porque `FilaEstado` no guarda estado propio, y la Lección 2 lo mantiene así a propósito: las notas vivirán en `Panel` y la marca «con nota» de cada fila se calculará a partir de ellas, así que recrear una fila no borra nada. Pero el costo de trabajo sigue ahí (cinco filas destruidas y recreadas donde bastaba crear una), y el día que una fila sí guarde algo en su propio estado, como un campo de texto a medio escribir, ese algo se perdería en todas las filas. La `key` estable es la que no depende de que nadie recuerde esa condición.
- **`key={nombre}`: la identidad correcta.** Una sola fila nueva, la de `correo`, y las cuatro de siempre conservadas, cada una con su propio estado. Es la `key` del punto de control.

#### 1.4.3 Por qué el nombre es una `key` segura

La documentación recomienda tomar la `key` de los datos: si vienen de una base de datos, sus identificadores son únicos por naturaleza ([React, «Rendering Lists»](https://react.dev/learn/rendering-lists)). El contrato de la API, en `contrato.ts`, no trae un identificador numérico; trae el nombre del servicio. ¿Es único? Lo es porque la API lo garantiza: el nombre es la identidad del servicio en todo el sistema (la ruta del detalle, desde la Lección 3, es `/api/servicios/:nombre`), y desde la Lección 4, cuando el servidor de práctica acepte altas, intentar dar de alta un nombre que ya existe responde `409` con `ya existe un servicio llamado X`. La pantalla puede confiar en esa garantía porque la API la hace cumplir; no la inventa la pantalla.

¿Y si la API se equivocara y mandara dos servicios con el mismo nombre? React te avisa en desarrollo. La figura 4 provoca los dos avisos de `key` que vas a ver en la consola del navegador: la lista sin `key` y la `key` repetida. Los mensajes de React salen por `console.error`; la figura los captura para imprimirlos con un prefijo.

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

El primer aviso dice «cada hijo de una lista debe tener una prop `key` única» y te señala el componente culpable: «revisa el método de render de `SinLlave`». El segundo dice «se encontraron dos hijos con la misma `key`, `pagos`», y advierte que, con `key` repetidas, React puede duplicar u omitir elementos, y que ese comportamiento no está soportado. Un dato que se midió y conviene saber: **ni TypeScript ni el linter del curso detectan la `key` que falta.** `npx eslint fig01_04.tsx` termina sin avisos, porque `eslint-plugin-react-hooks` revisa las reglas de los hooks y del compilador, no las de las listas. El aviso solo aparece al ejecutar, en la consola, y solo en desarrollo. Por eso la consola del navegador no se ignora: un `console.error` de React es un defecto, aunque la página se vea bien.

### 1.5 La trampa del `0`

Esta es la falla más famosa de JSX y la más fácil de evitar una vez que la entiendes. El operador `&&` de JavaScript no devuelve `true` o `false`: devuelve **el primer valor que decide**. `a && b` devuelve `a` si `a` es «falso» (`false`, `0`, `""`, `null`, `undefined`), y `b` en otro caso. Con un booleano a la izquierda, `false && <strong>…</strong>` devuelve `false`, y React no dibuja nada para `false`. Con un número a la izquierda, `0 && <strong>…</strong>` devuelve `0`… y React **sí dibuja los números**. La documentación lo pone como advertencia con todas sus letras: no pongas números del lado izquierdo de `&&`, porque si el lado izquierdo es `0`, toda la expresión vale `0` y React dibujará `0` en lugar de nada ([React, «Conditional Rendering»](https://react.dev/learn/conditional-rendering)).

La figura 5 lo muestra con el resumen del panel, en dos versiones que solo difieren en un renglón:

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

Con dos fallas, las dos versiones son idénticas: por eso la trampa sobrevive a las pruebas a mano con los datos de siempre, en los que `pagos` y `reportes` fallan. Con cero fallas, la primera pinta `4 servicios revisados0`: el `0` que apareció en la escena cuando el turno de noche reinició la API con todo sano. La segunda no pinta nada extra.

El arreglo es el que propone la documentación: **haz que el lado izquierdo sea un booleano.** `fallas > 0` es `true` o `false`, nunca un número. Es exactamente lo que hace `ResumenFallas` en el punto de control. Otras formas que funcionan: `Boolean(fallas) && …`, `!!fallas && …` o un ternario, `fallas > 0 ? <strong>…</strong> : null`. El curso usa la comparación porque se lee como lo que significa: «si hay fallas». Tampoco aquí hay red: TypeScript acepta `fallas && …` sin protestar (un `number` es un hijo válido de JSX) y el linter del curso tampoco lo marca; se comprobó corriendo `npx eslint fig01_05.tsx`, que termina sin avisos. La defensa es la costumbre: **a la izquierda de `&&`, siempre un booleano.** En la Lección 8, una prueba del curso pone `fallas &&` a propósito y comprueba que el texto sale con el `0` pegado; es la prueba que se pone roja al revertir el arreglo.

### 1.6 Nunca un componente dentro de otro

#### 1.6.1 La tentación

Cuando partes un componente, aparece una tentación natural: definir la pieza pequeña **dentro** de la grande, para que tenga a mano las variables del padre sin pasárselas como props. Algo así, dentro de `Panel`:

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

Parece cómodo: `BotonActualizar` ve `recargar` sin que nadie se la pase. La documentación lo prohíbe sin matices: los componentes pueden dibujar otros componentes, pero **nunca** se anidan sus definiciones; cada componente se define en el nivel superior del archivo, y si el hijo necesita datos del padre, se los pasa por props ([React, «Your First Component»](https://react.dev/learn/your-first-component)).

#### 1.6.2 Por qué: identidad otra vez

La razón es la misma de la `key`. Para decidir si un componente de este render es el mismo del anterior, React mira **su posición en el árbol y su tipo**. El tipo de `<BotonActualizar />` es la función `BotonActualizar`. Si esa función se define dentro de `Panel`, **cada render de `Panel` crea una función nueva**: el mismo código, pero otro objeto. Para React es otro tipo de componente. Entonces destruye el viejo, con su estado y sus nodos del DOM, y monta uno nuevo. La documentación lo explica con el estado: React conserva el estado mientras el mismo componente se dibuja en la misma posición, y el estado desaparece porque en cada render se crea una función distinta ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)).

La figura 6 lo mide. Dos paneles iguales; en uno, el contador de clics está definido fuera, y en el otro, dentro. Se dan dos clics al contador y luego se actualiza el padre:

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

El contador de fuera conserva sus dos clics cuando el padre se actualiza. El de dentro vuelve a cero, que es el tercer susto de la escena: el render de `PanelMal` creó un `ContadorDeDentro` nuevo, React lo vio como un tipo distinto, desmontó el viejo y montó otro con estado inicial. Imagina eso en el `revisor`: cada diez segundos, el sondeo de `useReporte` actualiza el panel; si la fila estuviera definida dentro del panel, cada diez segundos se borraría todo lo que la persona hubiera escrito en ella. Además del estado, se pierde trabajo: React destruye y recrea los nodos del DOM en cada render, cuando la figura 1 mostró que lo normal es tocar solo lo que cambió.

Esta vez el linter sí está de tu lado. Es la regla `static-components`, otra de las del compilador:

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

El mensaje señala dos lugares: dónde se **usa** el componente creado durante el render (renglón 51) y dónde se **define** (renglones 37 a 44). Y dice la consecuencia en una frase: los componentes creados durante el render reinician su estado cada vez que se crean. La página de la regla agrega el porqué: React ve cada uno como un tipo de componente nuevo, desmonta el viejo y monta el nuevo, destruyendo todo el estado y los nodos del DOM ([React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components)). Como es un error y no un aviso, `npm run lint` se detiene aunque no uses `--max-warnings 0`.

El arreglo siempre es el mismo: sacar la definición al nivel superior del archivo (o a su propio archivo) y pasarle por props lo que usaba del padre. Para el botón del fragmento de 1.6.1, eso significa `function BotonActualizar({ alPulsar }: { readonly alPulsar: () => void })` afuera de `Panel`, y `<BotonActualizar alPulsar={recargar} />` adentro. El nombre `alPulsar` sigue la regla de nombres del curso: las props que son funciones empiezan con `al`. En el punto de control ni siquiera hizo falta ese componente: el botón vive directamente en el JSX de `Panel`, que es donde vive `recargar`, y viaja a la tarjeta como `children`. A veces la mejor forma de no anidar un componente es no crearlo.

### 1.7 El recorrido completo

Con las seis piezas en su lugar, verifica el punto de control como lo hace cualquier verificación automática del curso: instalación limpia, linter y construcción. Los tres terminaron con código 0:

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

`npm run lint` no imprime nada después del encabezado: ningún problema. (En la corrida de `npm ci` de esta lección, npm imprimió además un aviso de `install-scripts`. Viene de `fsevents`, una dependencia opcional que solo se instala en macOS para vigilar archivos y que trae un guion de instalación; no hace falta aprobar nada. En tu Mint esa dependencia no se instala, así que lo normal es que el aviso no salga.) La construcción es la que viste en «El porqué antes del cómo»: veintiséis módulos, una hoja de estilos un poco más grande por las dos reglas nuevas y un JavaScript que cambió de nombre. Ese cambio de nombre no es un capricho: Vite calcula el nombre a partir del contenido, y el contenido cambió. Es el `index-Dezp5bTH.js` que el curso documenta para este punto de control; si te sale otro nombre, algo de tu código no es idéntico al del curso.

Para verlo en el navegador, usa las mismas dos terminales de la Lección 0: `npm run servidor` en una y, en la otra, `npm run dev` para desarrollar o `npm run preview` para ver la versión construida. Esto es lo que entregó Chrome sin ventana al abrir la versión construida (se muestra solo el contenedor):

```text
<div id="raiz"><main><h1>Revisor</h1><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></section></main></div>
```

Compáralo con el de la Lección 0. Las filas son idénticas, carácter por carácter: partir `FilaEstado` en su propio archivo no cambió lo que dibuja. Lo nuevo es la `<section>` con su nombre accesible, el `<h2>` y el párrafo del resumen, con `4 servicios revisados` y, en rojo, `· 2 servicios con falla`. El botón «Actualizar» quedó dentro de la tarjeta, como `children`. Y la bitácora del servidor de práctica registró una sola petición, como corresponde a la versión construida: `StrictMode` sigue en `main.tsx`, pero sus comprobaciones solo actúan en desarrollo:

```text
08:14:17.848 GET /api/estados 200
```

Con `npm run dev`, en cambio, verás la pareja de la Lección 0 (una `cancelada por el cliente` y un `200`) si la conexión alcanza a llegar. Y ahora sabes que, además del ciclo extra del efecto, `StrictMode` está llamando dos veces a cada uno de tus seis componentes en cada render. No lo notas porque los seis son puros: llamarlos dos veces da dos veces el mismo resultado. Esa es la prueba gratuita de la Lección 0, aplicada a los componentes.

## El error que vas a ver

**El error principal: `Cannot create components during render`.** Es el de 1.6. Aparece en cuanto defines un componente dentro de otro, y como es un error (no un aviso), `npm run lint` se detiene. Se lee en tres partes: el renglón donde usas el componente (`This component is created during render`), el bloque donde lo defines (`The component is created during render here`) y la regla, `react-hooks/static-components`. Se arregla sacando la definición al nivel superior y pasándole por props lo que tomaba del padre. No hay excepción razonable: si te parece que la necesitas, casi siempre lo que quieres es pasar el contenido como `children`.

**El aviso que solo sale al ejecutar: `Each child in a list should have a unique "key" prop.`** Es el de la figura 4. No lo dan ni TypeScript ni el linter del curso; sale en la consola del navegador, en desarrollo, la primera vez que la lista se dibuja. Te dice en qué componente buscar (`Check the render method of …`). Se arregla con una `key` estable tomada de los datos, nunca con la posición y nunca con un valor generado en el render. Su pariente, `Encountered two children with the same key`, significa que tus datos no cumplen la unicidad que supusiste: el arreglo no es inventar otra `key`, sino averiguar por qué la API mandó repetidos.

**El error de tipos que te salva de mutar: `Property 'sort' does not exist on type 'readonly …[]'`.** Es el de 1.2.3. Si lo ves, TypeScript te está diciendo que intentaste cambiar una lista que no es tuya. No quites el `readonly` para que compile: copia antes de ordenar, con `[...lista].sort(…)`, o usa `toSorted`, que devuelve un arreglo nuevo y deja el original intacto ([MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). `toSorted` es parte de ES2023; el `tsconfig.app.json` del `revisor` declara `"lib": ["ES2023", "DOM"]`, así que ahí la puedes usar.

## Lo que se hace mal

**Cambiar algo de fuera durante el render.** Un contador de módulo, una variable global, un `document.title = …` en el cuerpo del componente. Se ejecuta tantas veces como React llame al componente, que no es lo mismo que «cada vez que la pantalla cambia». En desarrollo, `StrictMode` lo duplica y te da la pista; en producción, el número simplemente miente.

**Mutar las props.** `props.estados.sort()`, `props.estados.push(…)`, `estado.nombre = …`. Cambias datos que pertenecen a otro componente, y ese otro componente no se entera de que cambiaron. El costo es una falla lejos de donde se cometió: la lista se ordena sola «en otro lado». Declara las props con `readonly` y TypeScript lo impide.

**Leer el reloj o el azar en el render.** `new Date()`, `Date.now()`, `Math.random()`. La salida depende de cuándo React decidió llamarte. Si el componente necesita la hora, que la reciba como prop o que la guarde en estado y la actualice desde un efecto, como muestra la referencia de React.

**Usar la posición como `key`, o una `key` que cambia con la posición.** La primera confunde las filas entre sí cuando la lista cambia; la segunda las destruye todas. Ninguna se nota mientras las filas no tengan estado, y por eso las dos sobreviven hasta el día en que la fila gana una nota o un campo de texto.

**Generar la `key` durante el render.** `key={Math.random()}` o `key={crypto.randomUUID()}` dentro del `map`. Cada render produce `key` nuevas, y React recrea todos los componentes y todo el DOM de la lista cada vez.

**Un número a la izquierda de `&&`.** `{fallas && …}`, `{lista.length && …}`. Funciona con los datos de prueba y pinta un `0` el día que no hay nada. A la izquierda de `&&`, siempre un booleano.

**Definir un componente dentro de otro.** Pierde su estado y su DOM en cada render del padre. El linter lo detiene con `static-components`; no lo silencies.

**Partir por partir.** Un componente por cada etiqueta HTML no es mejor diseño: es más archivos que leer. El criterio es la responsabilidad, «¿qué pregunta responde esta pieza?», y no el tamaño. `Tarjeta` existe porque «una caja con título» es una pregunta que se repite; un `TextoRevisados` de una línea que nadie más usa no lo sería.

**Hacer una tarjeta que sabe demasiado.** Pasarle a `Tarjeta` el `recargar`, la carga o el tipo de contenido para que ella decida qué dibujar la ata a una sola funcionalidad. Con `children`, quien la usa decide qué va adentro.

## Ejercicios

### Ejercicio 1 — Limpia las tres impurezas

Copia `fig01_02.tsx` en `~/curso-react/figuras/` y corrige `ResumenImpuro` para que sea puro, sin perder lo que muestra: un número de revisión, una hora y los nombres ordenados. **Antes de cambiar nada, predice** qué dirán los cuatro renglones de la salida cuando el componente sea puro. Al terminar, la salida debe confirmar tu predicción y `npx eslint` no debe informar problemas. Pista: un componente puro no puede inventar la revisión ni la hora; alguien tiene que dárselas.

### Ejercicio 2 — Quitar en lugar de agregar

En la figura 3, `correo` se agregaba al principio. Cambia una línea para que, en lugar de eso, se **quite** `catálogo`, el primero de la lista: `const despues = antes.slice(1);`. **Antes de correrla, predice** para cada una de las tres `key` cuántas filas se crean desde cero y qué texto muestra cada fila. Después córrela y compara. ¿Cuál de los tres resultados sería más peligroso si cada fila guardara, en su propio estado, una nota escrita por la persona? (En el `revisor` no será así: desde la Lección 2 las notas viven en `Panel`. La pregunta es para que reconozcas el riesgo cuando una fila sí guarde estado.)

### Ejercicio 3 — El singular que falta

El resumen del punto de control resuelve el singular de las fallas («1 servicio con falla»), pero no el de los revisados: con un solo servicio diría `1 servicios revisados`. Escribe, en un archivo `textoRevisados.ts` dentro de `~/curso-react/figuras/` (no en el `revisor`, para que tu proyecto siga igual al punto de control), una función pura `textoRevisados(total: number): string` siguiendo el modelo de `textoFallas`, y pruébala con `node textoRevisados.ts` para 0, 1 y 4. **Antes de correrla, escribe** las tres salidas que esperas. ¿Por qué esta función se puede probar sin React, sin jsdom y sin navegador?

### Ejercicio 4 — Encuentra la trampa

Un compañero propone, para la Lección 4, mostrar la lista solo si hay servicios: `{carga.reporte.estados.length && <ListaEstados estados={carga.reporte.estados} />}` dentro de una `<section>`. **Sin correr nada**, escribe qué HTML produce cuando la API responde `{"estados":[]}`. Después compruébalo con `renderToStaticMarkup`, como en la figura 5, y escribe la versión correcta.

## Soluciones

### Solución 1

La predicción, con el componente puro: el renglón 2 muestra el arreglo **sin cambios** (`pagos, catálogo, reportes`), porque ya nadie lo ordena en su lugar; el renglón 3 dice `0`, porque el componente ya no toca la variable de módulo; y el renglón 4 dice `sí`, porque la hora llega como prop y es la misma en los dos dibujos. Las tres correcciones, una por impureza:

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

La revisión y la hora ahora son props: quien usa el componente decide cuáles son (en las llamadas de la figura, por ejemplo, `revision={1} hora="10:00:00"`), y el componente solo las muestra. La lista se copia con `[...servicios]` antes de ordenarla: es una mutación local, sobre un arreglo que el componente acaba de crear, y está permitida. El tipo `readonly Servicio[]` impide que alguien vuelva a escribir `servicios.sort(…)` sin que TypeScript lo detenga. Queda un detalle del resto de la figura: el renglón 3 sigue imprimiendo la variable de módulo `revision`, que ya nadie cambia. Si la dejas como `let revision = 0;`, ESLint avisa con `prefer-const`, justamente porque nadie la reasigna; cámbiala a `const revision = 0;`. Se midió exactamente esta versión, compilada con el mismo comando de siempre: los cuatro renglones salieron `pagos, catálogo, reportes` (antes), `pagos, catálogo, reportes` (después), `0` y `sí`, y `npx eslint` terminó sin problemas. En el `revisor`, ¿de dónde saldrían de verdad la revisión y la hora? De datos que cambian con el tiempo, es decir, de estado; la Lección 2 lo trae.

### Solución 2

Medido al correrlo:

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

Con la posición, React no crea nada y **quita la última fila**, la que había nacido como `reportes`; las tres que quedan conservan su propio estado (el de la fila que nació en ese lugar), pero ahora dibujan el nombre de la vecina de abajo: la que nació como `catálogo` dice `pagos`, y así. Con posición y nombre, las tres filas que quedan se recrean desde cero, porque sus posiciones cambiaron. Con el nombre, no se crea nada: React quita la fila de `catálogo` y las otras tres siguen siendo las mismas. El resultado más peligroso es el primero, porque no se ve: la pantalla muestra los nombres correctos y el estado equivocado. La nota que la persona escribió para `pagos` aparecería junto a `inventario` y nadie lo notaría hasta que fuera tarde. El segundo al menos «solo» borra el trabajo; el primero lo cambia de lugar.

### Solución 3

Las salidas esperadas son `0 servicios revisados`, `1 servicio revisado` y `4 servicios revisados`. Una solución:

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

Node 24 ejecuta el archivo `.ts` directamente, como el servidor de práctica (Lección 0). Se puede probar sin React porque es una función pura que no sabe de React: recibe un número y devuelve un texto. Es la ventaja de separar el cálculo de la presentación: lo que se calcula se prueba con un `console.log`. Fíjate en que el `0` va en plural («0 servicios»), que es como se dice en español. Si quisieras llevarlo al `revisor`, la función iría en `resumen.ts`, junto a `textoFallas`, y `ResumenFallas` la llamaría; no lo hagas en tu copia del punto de control, para que siga coincidiendo con el del curso.

### Solución 4

Con la lista vacía, `estados.length` vale `0`, `0 && …` vale `0`, y React dibuja el número. Comprobado con `renderToStaticMarkup` sobre un `<section>` con ese mismo `&&` y una lista vacía:

```text
<section>0</section>
<section></section>
```

El primer renglón es la versión del compañero: un `0` solitario dentro de la sección. El segundo es la versión correcta, con un booleano a la izquierda: `{carga.reporte.estados.length > 0 && <ListaEstados estados={carga.reporte.estados} />}`. Una observación de diseño para tu bitácora: una lista vacía, en el `revisor`, no debería mostrarse como «nada», sino con un mensaje que diga que no hay servicios. Es el cuarto estado, «vacío», que la Lección 4 agrega con su propio texto.

## Cómo sé que lo logré

- [ ] En `~/curso-react/revisor/`, `npm ci`, `npm run lint` y `npm run build` terminan con código 0, `npm run lint` no informa ningún problema, y la construcción deja en `dist/assets/` un archivo llamado `index-Dezp5bTH.js`.
- [ ] Con el servidor de práctica y `npm run dev` encendidos, `http://localhost:5173/` muestra una tarjeta con el encabezado «Estado de los servicios», la línea `4 servicios revisados · 2 servicios con falla` sobre la lista, y el botón «Actualizar» dentro de la tarjeta. La consola del navegador no tiene ningún error de React.
- [ ] Puedes señalar, en la salida de la figura 1, qué renglones son render y cuáles son *commit*, y explicar por qué el segundo dibujo hace cero cambios en el DOM.
- [ ] Encontraste las tres impurezas de la figura 2 y sabes cuál atrapa el linter, cuál atrapa TypeScript con `readonly` y cuál solo se ve en la salida.
- [ ] Al definir temporalmente un componente dentro de `Panel`, `npm run lint` falla con `react-hooks/static-components`; al sacarlo, vuelve a pasar. (Restaura el archivo al terminar.)
- [ ] Al copiar `fig01_05.tsx` y cambiar `[2, 0]` por `[0]`, predices antes de correrla las dos líneas que imprime, y la corrida te da la razón: con `fallas &&` sale `4 servicios revisados0`, y con `fallas > 0 &&`, `4 servicios revisados`. (El servidor de práctica de esta lección no tiene un escenario sin fallas; la Lección 8 lo prueba sobre el `revisor`.)
- [ ] Puedes explicar, con la salida de la figura 3, por qué el `revisor` usa `key={estado.nombre}` y por qué eso es seguro con la API del curso.
- [ ] Anotaste en tu [bitácora](bitacora.md) las tres impurezas y cómo las encontraste, un componente que partiste y qué ganaste, y un `0` que apareció en pantalla sin que lo pidieras.

## Resumen

Responde sin mirar la lección:

1. ¿Qué pasa en el render y qué pasa en el *commit*? ¿Por qué React puede llamar a tu componente sin que la pantalla cambie?
2. ¿Cuáles son las dos condiciones de un componente puro? ¿Qué es una mutación local y por qué sí está permitida?
3. Nombra tres impurezas típicas y, para cada una, qué herramienta del curso la detecta (o que ninguna la detecta).
4. ¿Qué recibe un componente en `children`? ¿Por qué `Tarjeta` vive en `compartido/` y no en `reporte/`?
5. ¿Qué pasa con el estado de las filas si la `key` es la posición y se inserta un elemento al principio? ¿Y si la `key` combina posición y nombre?
6. ¿Por qué `{fallas && …}` puede pintar un `0`, y cómo se escribe para que no pase?
7. ¿Por qué un componente definido dentro de otro pierde su estado en cada render del padre? ¿Qué regla del linter lo detecta?

## Para leer más

- [React, «Render and Commit»](https://react.dev/learn/render-and-commit): los tres pasos de una actualización, el render recursivo y por qué React solo toca el DOM donde hay diferencias. Consultado el 21 de octubre de 2026.
- [React, «Keeping Components Pure»](https://react.dev/learn/keeping-components-pure): las dos condiciones de la pureza, la mutación local, el doble render de `StrictMode` y dónde van los efectos secundarios. Consultado el 21 de octubre de 2026.
- [React, «Components and Hooks must be pure»](https://react.dev/reference/rules/components-and-hooks-must-be-pure): idempotencia, `new Date()` y `Math.random()`, props y estado inmutables, efectos fuera del render. Consultado el 21 de octubre de 2026.
- [React, «Passing Props to a Component»](https://react.dev/learn/passing-props-to-a-component): `children` como un hueco que llena el padre, y las props como fotografías inmutables. Consultado el 21 de octubre de 2026.
- [React, «Understanding Your UI as a Tree»](https://react.dev/learn/understanding-your-ui-as-a-tree): el árbol de render, hecho solo de componentes. Consultado el 21 de octubre de 2026.
- [React, «Thinking in React»](https://react.dev/learn/thinking-in-react): partir una interfaz en componentes por separación de responsabilidades. Consultado el 21 de octubre de 2026.
- [React, «Rendering Lists»](https://react.dev/learn/rendering-lists): las reglas de `key`, el peligro de la posición y de las `key` generadas al vuelo, y de dónde tomarlas. Consultado el 21 de octubre de 2026.
- [React, «Conditional Rendering»](https://react.dev/learn/conditional-rendering): la advertencia sobre los números a la izquierda de `&&`. Consultado el 21 de octubre de 2026.
- [React, «Your First Component»](https://react.dev/learn/your-first-component): nunca anidar definiciones de componentes; nombres con mayúscula inicial. Consultado el 21 de octubre de 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): el estado atado a la posición en el árbol y por qué un componente anidado lo pierde. Consultado el 21 de octubre de 2026.
- [React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components): la regla que detecta componentes creados durante el render. Consultado el 21 de octubre de 2026.
- [React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals) y [lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity): las reglas que detectan cambios a variables de fuera y funciones impuras durante el render. Consultado el 21 de octubre de 2026.
- [MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort): `sort` ordena en su lugar; `toSorted` devuelve un arreglo nuevo. Consultado el 21 de octubre de 2026.
- [MDN, rol ARIA `region`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role): cuándo un `<section>` es una región y cómo se le da nombre. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| render | el paso en que React llama a tus funciones de componente para saber cómo debería verse la pantalla; no toca el DOM |
| *commit* | el paso en que React aplica al DOM solo las diferencias entre el render nuevo y el anterior |
| pintar | lo que hace el navegador después del *commit*: dibujar los píxeles |
| componente puro | no cambia nada que existiera antes de llamarlo y, con las mismas entradas, devuelve la misma salida |
| mutación local | cambiar un objeto o arreglo que el propio componente acaba de crear; está permitida porque nadie de fuera lo ve |
| idempotente | que devuelve lo mismo cada vez que se le llama con las mismas entradas |
| composición | armar componentes grandes juntando piezas que no se conocen entre sí |
| `children` | la prop donde un componente recibe el contenido anidado entre su etiqueta de apertura y la de cierre |
| fragmento (`<>…</>`) | una forma de devolver varios elementos hermanos sin envolverlos en otro elemento |
| `key` | la pista con que React empareja los elementos de una lista entre un render y otro; única entre hermanos y estable |
| región | una zona de la página con nombre propio a la que un lector de pantalla puede saltar; un `<section>` con nombre accesible lo es |

---

**Siguiente:** [Lección 2 — Estado: instantánea, inmutabilidad y forma](02-estado-instantanea-forma.md)
