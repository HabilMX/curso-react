# Lección 9 — Rendimiento, publicación y cuándo un framework

*Son las 17:40 de un viernes y el `revisor` se publica a las 18:00 en el servidor del equipo de operación. En el canal del proyecto hay tres mensajes sin responder. El primero: «el panel se siente lento, ¿le ponemos `useMemo` a todo antes de publicar?». El segundo, de quien preparó el servidor: «abro `/servicios/pagos` y funciona, pero si recargo la página me da 404». El tercero, de alguien que quiso que el panel preguntara «casi nunca» en el ambiente de pruebas: puso `VITE_CADA_MS=2147483648`, y la bitácora de la API se llenó de peticiones, una cada tres décimas de segundo. Nadie midió nada. Hay veinte minutos y tres opiniones distintas sobre qué hacer. Esta lección hace lo que faltó: medir primero, después decidir, y publicar con un servidor que sabe qué es una ruta del cliente.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 9.2 y 9.3)

**Qué construyes:** el `revisor` medido, optimizado y publicado: el compilador de React encendido en la construcción, un servidor de publicación propio que sirve `dist/` con reescritura a `index.html`, una política de seguridad de contenido y caché correcta, y cinco arreglos que salieron de medir el panel, cada uno con la prueba que se pone roja antes del arreglo y verde después

**Qué aprendes:** medir con el Profiler **antes** de memoizar; estructura primero; React Compiler 1.0; `vite build` y por qué `vite preview` no es un servidor de producción; reescritura a `index.html`; `VITE_` sin secretos; repaso de XSS; Server Components y Server Functions: qué son y por qué este panel no los usa; cuándo conviene migrar a un framework

**De dónde vienes.** Del punto de control de la [Lección 8](08-pruebas-de-componentes.md): un `revisor` con cuatro pantallas (la lista en `/`, el detalle en `/servicios/:nombre`, el alta en `/servicios/nuevo` y la página de «no encontrada»), datos del servidor en TanStack Query, avisos y preferencias en contexto, un formulario accesible y una suite de 26 pruebas en 7 archivos que se ponen rojas cuando alguien revierte un arreglo. Todo eso funciona en `npm run dev`. Lo que no se ha hecho es la pregunta del final: ¿qué tan rápido es, y cómo se entrega a quien lo va a usar?

**Qué no hace esta lección.** No agrega pantallas ni cambia lo que el panel hace. No usa `useMemo`, `useCallback` ni `memo` en el `revisor`: la medición no los pidió, y la sección 9.1 explica por qué. No migra el panel a un framework ni monta Server Components: la sección 9.3 explica qué son y por qué este panel no los necesita. No configura un servidor web de producción como nginx o Caddy: escribe uno pequeño en Node para que cada decisión quede a la vista, y nombra lo que un servidor de verdad agrega. Y no es un curso de seguridad: repasa las dos defensas que el panel ya tenía contra la inyección de código (React y el linter) y agrega la tercera, la política de seguridad de contenido.

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas del `package.json` de esta lección. El punto de control se instaló desde cero con `npm ci` en una copia fuera del repositorio, idéntica archivo por archivo al punto de control, y ahí `npm run lint`, `npm test` y `npm run build` terminaron con código 0: 34 de 34 pruebas en 11 archivos (leído del resumen de Vitest), `dist/assets/index-DaB3Njqx.js` y `dist/assets/index-CbqUABMA.css`. Las salidas de Vitest se tomaron con `--reporter=default`, que es lo que ves en tu terminal. Los cinco arreglos de 9.4 ya están en el punto de control. Su fase roja se midió en una **copia** del punto de control sin los arreglos, llamada `rojo`, y por eso esa salida dice `~/curso-react/rojo`; la fase verde, en el punto de control. Lo que se ve «en el navegador» se midió con Chrome sin ventana (`--headless`): el DOM de `/servicios/pagos` con `--dump-dom` y, para el sondeo y los reintentos, abriendo la página unos segundos mientras la API de práctica anotaba cada petición. Esas corridas usaron los puertos 3109 (API), 4109 (vista previa y servidor publicado) y 5109 (desarrollo) en lugar de 3100, 4173, 4180 y 5173, porque en la máquina corrían otras cosas a la vez; para apuntar el *proxy* de desarrollo al 3109 se cambió `vite.config.ts` en las copias, no en el original. Las salidas muestran los puertos que de verdad se usaron; tú usarás los del curso. Las figuras están en [`programas/09-rendimiento-publicacion/`](../programas/09-rendimiento-publicacion), junto a `revisor/`, con su propio `package.json`: se compilan con `tsc` y se corren con `node`, como en las lecciones anteriores, y agregan `@babel/core`, `babel-plugin-react-compiler` y `@types/convert-source-map` (este último porque los tipos de `@babel/core` 8.0.7 lo importan y `tsc --strict` sin `skipLibCheck` no compila sin él). No se corrió en una Linux Mint real; nada de lo que se muestra depende del sistema. Las horas de la bitácora de los servidores están en UTC; las de Vitest (`Start at`), en la hora local de la máquina. **Lo que no se midió**, y se dice donde aparece: el Profiler de las herramientas de desarrollo de React, que se lee con los ojos, y el panel publicado detrás de un servidor web de producción. Las rutas largas se muestran a partir de `~/curso-react`.

## Al terminar vas a poder

- Medir con `<Profiler>` cuántas veces se dibuja una parte del árbol y cuánto tarda, y decidir con ese número si hace falta optimizar.
- Quitar dibujos de más cambiando la **estructura** (bajar el estado, pasar JSX como `children`) antes de pensar en memoizar, y mostrar con la medición que funcionó.
- Encender React Compiler 1.0 en un proyecto de Vite, leer el código que produce y comprobar en `dist/` que actuó.
- Explicar por qué `vite preview` no es un servidor de producción, y comprobar con `curl` que el servidor de publicación reescribe las rutas del cliente a `index.html`, envía la política de seguridad de contenido y cachea bien cada archivo.
- Buscar secretos en `dist/` y **leer** el resultado, separando una coincidencia de una fuga.
- Explicar qué son los Server Components y las Server Functions, por qué el `revisor` no los usa, y qué señales dirían que conviene migrar a un framework.
- Escribir, para un defecto encontrado al medir, la prueba que se pone roja antes del arreglo y verde después.

## El porqué antes del cómo

Los tres mensajes de la escena son tres preguntas distintas, y las tres tienen la misma trampa: se pueden contestar con una opinión.

**«Se siente lento».** ¿Qué es lento? ¿El primer dibujo, la escritura en un campo, el cambio de página, la respuesta de la API? En el `revisor`, la API de práctica tarda 300 ms en responder el reporte y 1.5 s el detalle de `pagos`, a propósito. Si eso es lo que «se siente», ningún `useMemo` lo arregla, porque el tiempo no se gasta en React. Y si el tiempo sí se gasta en React, hay que saber **en qué componente** y **cuántas veces**, porque memoizar el componente equivocado agrega código y no quita nada. React trae una herramienta para medirlo y la documentación pide usarla antes de memoizar. Esta lección la usa.

**«Si recargo me da 404».** En la Lección 5 viste por qué: `/servicios/pagos` no es un archivo, es una ruta que decide React Router en el navegador. Mientras navegas dentro de la aplicación, el servidor nunca se entera. Cuando recargas, el navegador le pide `/servicios/pagos` al servidor, y un servidor de archivos que no sabe nada de rutas del cliente responde lo que es verdad para él: ese archivo no existe. La vista previa de Vite ya lo resuelve, y eso confunde, porque hace pensar que «en producción va a funcionar igual». La documentación de Vite dice lo contrario: la vista previa no es un servidor de producción. El que publica tiene que decidir qué responde cada dirección.

**«Puse un número grande y se llenó la bitácora».** Ese no es un problema de rendimiento: es un defecto. `leerCadaMs` acepta cualquier entero positivo, y un número que parecía «casi nunca» terminó en «todo el tiempo». Nadie lo vio hasta que alguien lo midió. La sección 9.4 junta cinco defectos como este, encontrados al medir el panel para esta lección, y los cierra con la costumbre de la Lección 8: primero la prueba roja, después el arreglo, después la prueba verde.

Los conceptos nuevos son tres: medir y dejar que el compilador memoice (9.1), publicar lo que `vite build` deja en `dist/` (9.2) y saber cuándo el panel necesitaría un servidor de React (9.3). La sección 9.4 es la cosecha.

## Los conceptos

### 9.1 Medir antes de memoizar

#### 9.1.1 Qué cuesta un dibujo de más

Cuando cambia el estado de un componente, React lo vuelve a dibujar (llama otra vez a la función), y con él a todos los componentes que dibuja adentro, aunque sus props no hayan cambiado. Lo viste en la Lección 1: dibujar es calcular un árbol, y luego React compara ese árbol con el anterior y solo toca el DOM donde hubo diferencias. Casi siempre eso es barato. Un componente que devuelve cuatro `<li>` se dibuja en microsegundos, y dibujarlo diez veces de más no se nota.

Se nota cuando se juntan dos cosas: un componente **caro** (una lista de miles de filas, un cálculo pesado, un gráfico) y un estado que cambia **seguido** (cada tecla, cada movimiento del ratón) y que vive **arriba** de él. La documentación de `memo` lo dice con una frase que conviene memorizar: optimizar con `memo` solo vale la pena cuando el componente se vuelve a dibujar seguido con exactamente las mismas props y su dibujo es caro; si no hay un retraso perceptible, `memo` sobra ([React, `memo`](https://react.dev/reference/react/memo)). Las dos condiciones se miden. Ninguna se adivina.

#### 9.1.2 `<Profiler>`: medir con un programa

React trae un componente para medir: `<Profiler>`. Envuelves una parte del árbol, le das un `id` y una función `onRender`, y React llama a esa función cada vez que esa parte del árbol se confirma (*commit*). La documentación lista lo que recibe ([React, `<Profiler>`](https://react.dev/reference/react/Profiler)):

- `id`: el del `<Profiler>`, para saber cuál fue si tienes varios;
- `phase`: `"mount"` la primera vez; `"update"` cuando se volvió a dibujar por un cambio de props, de estado o de hooks; y `"nested-update"`, un caso que no aparece en esta lección;
- `actualDuration`: los milisegundos que se gastaron dibujando ese subárbol en esta actualización; según la documentación, idealmente baja mucho después del montaje si la memoización funciona;
- `baseDuration`: una estimación de cuánto tardaría dibujar el subárbol completo sin ninguna optimización; compararla con `actualDuration` dice si la memoización sirve;
- `startTime` y `commitTime`: marcas de tiempo.

Una advertencia de la misma página: medir tiene un costo, así que **el Profiler está apagado en la construcción de producción**. Mides en desarrollo, o con una construcción especial de React que lo enciende.

La figura 1 reproduce la escena del primer mensaje con un panel mínimo. Tiene un campo para escribir una nota y una lista que tarda 20 ms en dibujarse; el costo es a propósito, para que se vea. La figura mide la lista con un `<Profiler>` mientras «escribe» la palabra `caído`, cinco teclas, en dos versiones del panel. En la versión A, el borrador de la nota vive en el panel, que es el padre de la lista. En la versión B, el borrador baja a un componente propio, `CampoNota`, el único que lo usa.

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

Lee las dos mediciones con calma, porque dicen más de lo que parece:

- **En la versión A**, cinco teclas produjeron seis dibujos de la lista: el montaje y uno por tecla. Cada uno tardó lo que tarda la lista, 20 ms o más. La lista no cambió nunca (siempre son los mismos cuatro servicios), pero se volvió a dibujar porque su padre cambió de estado. Si la lista tardara 200 ms, cada tecla congelaría la pantalla una quinta de segundo: eso es «se siente lento».
- **En la versión B**, la lista se dibujó una vez, al montar. Escribir cambió el estado de `CampoNota`, y React solo volvió a dibujar a `CampoNota`, porque la lista no es su hija. No hubo `memo`, ni `useMemo`, ni compilador: hubo un estado puesto en el lugar correcto.

Fíjate en el detalle de `gastar`: la espera vive en una función aparte. La primera versión de la figura la tenía dentro de `ListaLenta`, y el linter la rechazó. Moverla **no la vuelve pura**: `gastar` sigue leyendo el reloj durante el dibujo, y el linter ya no la ve solo porque no revisa dentro de las funciones que llamas. Se acepta aquí porque la figura simula un costo y no dibuja nada que dependa del reloj; el comentario del código lo dice. Lo verás completo en «El error que vas a ver».

#### 9.1.3 El Profiler de las herramientas de desarrollo

`<Profiler>` es para medir con un programa. Para mirar una aplicación entera existe la pestaña **Profiler** de las herramientas de desarrollo de React (React Developer Tools, la extensión del navegador). Graba lo que pasa mientras usas la página y te dibuja cada *commit* como una gráfica de barras: qué componentes se dibujaron, cuánto tardó cada uno y, si activas la opción de registrar por qué se dibujó cada componente, la causa (cambió una prop, cambió el estado, cambió un hook, se dibujó el padre). La documentación de `memo` manda ahí cuando una interacción todavía se siente lenta: usa el Profiler para ver qué componentes se beneficiarían más de memoizar, y memoiza solo esos ([React, `memo`](https://react.dev/reference/react/memo)).

Esta medición **no se corrió para la lección**: el Profiler de la extensión se lee con los ojos, y una corrida automática no lo puede comprobar. El paso a paso para hacerla tú está en el ejercicio 1, y la manera de saber si lo lograste, en «Cómo sé que lo logré».

#### 9.1.4 La estructura primero

La versión B de la figura no es un truco: es la segunda de cinco recomendaciones que la documentación de `memo` da para que la mayor parte de la memoización sea innecesaria ([React, `memo`](https://react.dev/reference/react/memo)). Las cinco, con lo que significan en el `revisor`:

1. **Si un componente envuelve visualmente a otros, que los reciba como `children`.** Cuando el envoltorio cambia su propio estado, React sabe que los hijos que llegaron como `children` no necesitan dibujarse otra vez, porque los creó otro componente. Es `Tarjeta`, desde la Lección 1.
2. **Prefiere el estado local y no lo subas más de lo necesario.** El borrador de una nota es de `EditorNota`, no de la página; desde la Lección 2 vive ahí, y por eso escribir una nota no dibuja la lista. La figura 1 es este punto medido.
3. **Mantén puro el dibujo.** Si dibujar otra vez causa un problema visible, es un defecto del componente y se arregla, no se tapa con memoización. La Lección 1 entera trata de esto.
4. **Evita Effects que solo actualizan estado.** La documentación dice que la mayoría de los problemas de rendimiento en aplicaciones de React vienen de cadenas de actualizaciones que salen de Effects y que dibujan los componentes una y otra vez. La Lección 3 enseñó a reconocer los Effects que sobran.
5. **Quita las dependencias innecesarias de los Effects.** Con TanStack Query, desde la Lección 4, el panel ya no tiene Effects propios para traer datos.

Por eso el curso no puso `useMemo` en ninguna lección. No fue un olvido: cada vez que la tentación apareció, la estructura ya había quitado el dibujo de más. El criterio que atraviesa el curso, «primero se mide y después se optimiza», no dice «nunca memoices»; dice que la memoización es una herramienta con costo (código más difícil de leer, dependencias que hay que mantener al día y que pueden romperla) y que la medición decide cuándo vale ese costo.

#### 9.1.5 React Compiler 1.0: la memoización que no escribes

Hay un camino más, y el punto de control lo toma. React Compiler es una herramienta de construcción que memoiza los componentes y los hooks por su cuenta: lee tu código, entiende las reglas de React, y escribe el equivalente de `memo`, `useMemo` y `useCallback` donde hacen falta ([React, «Introduction to React Compiler»](https://react.dev/learn/react-compiler/introduction)). Su primera versión estable, la 1.0, salió el 7 de octubre de 2025; el anuncio dice que ya se probó en aplicaciones grandes de Meta y que está listo para producción ([React, «React Compiler v1.0»](https://react.dev/blog/2025/10/07/react-compiler-1)). Para código nuevo, la documentación recomienda dejarle la memoización al compilador y usar `useMemo` o `useCallback` solo cuando necesites control preciso, por ejemplo un valor memoizado que es dependencia de un Effect.

En un proyecto de Vite se enciende como un *preset* de Babel. La documentación de instalación da exactamente esta forma para `@vitejs/plugin-react` 6 o posterior ([React, «Installation»](https://react.dev/learn/react-compiler/installation)), y es el cambio principal de configuración del punto de control (las líneas de `css` dentro de `test` se explican en 9.4.4):

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

Con tres dependencias de desarrollo nuevas, fijadas con versión exacta: `@rolldown/plugin-babel` 0.2.4 (el *plugin* que corre Babel dentro de la construcción de Vite), `@babel/core` 8.0.7 y `babel-plugin-react-compiler` 1.0.0. El README de `@vitejs/plugin-react` también menciona un camino nativo, sin Babel, pero lo marca como experimental, y el punto de control no lo usa.

¿Qué escribe el compilador? La figura 2 se lo pregunta directamente. Le da a Babel, con el *plugin* del compilador, el panel A de la figura 1 como texto, y además un componente que rompe una regla de React: cambia un objeto que recibió como prop.

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

El panel compilado se lee de arriba abajo:

- `const $ = _c(6)` pide a React una caché de seis casillas para este componente. `_c` viene de `react/compiler-runtime`, que React 19 ya trae.
- La función del `onChange` (`t0`) se crea una sola vez: la casilla `$[0]` empieza con un valor especial, `Symbol.for("react.memo_cache_sentinel")`, que significa «todavía vacía»; la primera vez se guarda la función y las siguientes se reutiliza. Es un `useCallback` que no escribiste.
- El `<input>` (`t1`) solo se vuelve a crear si cambió `borrador`.
- `<ListaMedida />` (`t2`) se crea **una sola vez**, porque no depende de nada. Cuando React encuentra en el árbol nuevo exactamente el mismo elemento que en el anterior, no vuelve a dibujar ese componente. El compilador consiguió lo mismo que la versión B de la figura 1, sin mover el estado.

El segundo resultado es igual de importante: **el componente impuro salió sin tocar**. No hay `_c`, ni caché, ni aviso. La documentación lo explica: cuando el compilador encuentra código que podría romper las reglas de React, se salta la optimización en lugar de arriesgarse a cambiar el comportamiento de tu aplicación ([React, «Debugging and Troubleshooting»](https://react.dev/learn/react-compiler/debugging)). El compilador no arregla un componente impuro; lo deja como estaba, y quien lo detecta es el linter, que desde `eslint-plugin-react-hooks` 7 trae las reglas del compilador en su configuración recomendada.

#### 9.1.6 Comprobar que el compilador actuó en el `revisor`

Una configuración que no falla no prueba que algo funcione. La documentación de instalación sugiere dos comprobaciones: la insignia «Memo ✨» junto a los componentes en las herramientas de desarrollo, y buscar en el código construido la lógica que el compilador agrega. La segunda se puede correr. Esta es la construcción del punto de control:

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
dist/assets/index-DaB3Njqx.js   374.36 kB │ gzip: 117.22 kB

✓ built in 1.28s
```

Y esta, la de una copia idéntica con una sola diferencia: en `vite.config.ts`, `plugins: [react()]`, sin el compilador.

```text
$ npx vite build
...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-CbqUABMA.css    1.27 kB │ gzip:   0.59 kB
dist/assets/index-D9CAggQp.js   367.02 kB │ gzip: 114.49 kB
```

La misma prueba, hecha antes de los cinco arreglos de 9.4, dio sin el compilador `index-WLyq37jn.js`: el mismo nombre que producen los puntos de control 7 y 8, porque hasta ahí el código de la aplicación era idéntico al de esas lecciones, byte por byte. Ahora se cuentan las marcas del compilador en cada uno:

```text
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # con el compilador
      18
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # sin el compilador
       1
```

Sin el compilador hay una, que viene de React DOM: es la constante `Symbol.for("react.memo_cache_sentinel")` con la que React marca, por dentro, una caché todavía vacía (medido: aparece en `react-dom-client.production.js` y no en el `compiler-runtime` de React, que solo pide la caché). Con el compilador hay 18: esa misma más 17 que agregó el compilador, una por cada valor que guarda la primera vez y ya no vuelve a calcular porque no depende de nada, como `t0` y `t2` en la figura 2. No es la cuenta de casillas: en este paquete el compilador pidió 24 cachés (24 llamadas a `c(…)`, la `_c` de la figura ya minificada) con 255 casillas en total, medido sumando sus argumentos. Para saber si actuó basta con que el número suba. Una advertencia de medición: `grep -c` **no** sirve para esto, porque cuenta **líneas** con coincidencias y no coincidencias, y el JavaScript minificado tiene casi todo en pocas líneas. Medido sobre el mismo archivo, `grep -c memo_cache_sentinel` dice `2`: las 18 marcas están en dos líneas. Un número que sale sin error no es un número correcto.

Y una cuenta más, que es la que la documentación no te va a dar: la memoización no es gratis ni en bytes. El paquete creció de 367.02 kB a 374.36 kB (de 114.49 a 117.22 kB comprimido): 7.34 kB más de código que corre en cada dibujo para decidir qué reutilizar. En el `revisor`, donde ningún componente es caro, eso es casi seguro una pérdida pequeña, no una ganancia; el punto de control lo enciende porque el plan del curso pide enseñar el compilador y porque las 34 pruebas pasan igual con él, no porque una medición lo haya pedido. **Esa es una decisión de criterio, y se dice como tal.** En una aplicación con listas largas o interacciones finas, la cuenta se invierte, y el anuncio de la versión 1.0 reporta mejoras de hasta 12 % en cargas y navegaciones en aplicaciones de Meta ([React, «React Compiler v1.0»](https://react.dev/blog/2025/10/07/react-compiler-1)).

### 9.2 Publicar

#### 9.2.1 Lo que queda en `dist/`

`npm run build` hace dos cosas, en orden: `tsc -b`, que revisa los tipos y no escribe nada, y `vite build`, que empaqueta. Lo que queda en `dist/` son tres archivos: un `index.html` que apunta a un JavaScript y a una hoja de estilos, y esos dos en `dist/assets/`, con un pedazo de su contenido en el nombre (`DaB3Njqx`, `CbqUABMA`). Ese pedazo cambia cada vez que cambia el contenido, y es lo que permite una caché agresiva: el navegador puede guardar `index-DaB3Njqx.js` un año entero, porque si el código cambia, el archivo nuevo se llamará distinto. El que **no** puede guardarse sin preguntar es `index.html`, que es el que dice qué archivos tocan hoy.

`dist/` es todo lo que se publica. No hay servidor de React, ni Node, ni nada que se ejecute del lado del servidor: son archivos estáticos. La documentación de Vite lo dice así: puedes desplegar la carpeta `dist` en la plataforma que prefieras ([Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy)). Lo que esa frase no dice es qué tiene que hacer esa plataforma, y ahí empiezan los problemas.

#### 9.2.2 `vite preview` no es un servidor de producción

`npm run preview` levanta un servidor que sirve `dist/` en el puerto 4173. La documentación de Vite es explícita sobre para qué: es para previsualizar la construcción en tu máquina y **no está pensado como servidor de producción** ([Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy)). En la Lección 5 viste que sí devuelve `index.html` cuando recargas una ruta del cliente. Entonces, ¿qué le falta? Se mide. Tres preguntas a la vista previa del punto de control:

```text
$ npx vite preview --port 4109 --strictPort
$ curl -sI http://localhost:4109/servicios/pagos
HTTP/1.1 200 OK
Vary: Origin
Content-Type: text/html
Cache-Control: no-cache
Etag: W/"188-SSYsd1lEG7nYr91W/nNjQMAIxfU"
Date: Wed, 21 Oct 2026 13:10:57 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4109/assets/no-existe.js
200 text/html
$ curl -sI http://localhost:4109/assets/index-DaB3Njqx.js | grep -i "cache-control\|content-type"
Content-Type: text/javascript
Cache-Control: no-cache
```

Tres hallazgos, y ninguno es un error de Vite, porque la vista previa no promete nada de esto:

1. **No hay política de seguridad de contenido.** La respuesta no trae `Content-Security-Policy`. Si algún día se cuela HTML ajeno en la página (9.2.5), el navegador no tiene ninguna regla para negarse a ejecutarlo.
2. **Un archivo que no existe responde `200` con HTML.** Pediste `/assets/no-existe.js` y la vista previa te dio `index.html`. Imagina que publicas una versión nueva mientras alguien tiene abierta la vieja, y su página pide un JavaScript que ya no está: en lugar de un `404` claro, el navegador recibe HTML donde esperaba JavaScript y falla con un error de tipo de contenido que nadie entiende. La reescritura es correcta para las rutas del cliente y equivocada para los archivos.
3. **El JavaScript con nombre de contenido no se cachea.** `no-cache` en `index-DaB3Njqx.js` obliga al navegador a preguntar cada vez, aunque ese archivo no puede cambiar nunca.

#### 9.2.3 El servidor de publicación del `revisor`

El punto de control trae un servidor propio, `servidor/publicar.ts`, de 145 líneas, que sirve `dist/` y resuelve justo esas tres cosas. No es para que lo uses tal cual en producción: es para que veas cada decisión que un servidor de verdad (nginx, Caddy, el de tu plataforma de alojamiento) tiene que tomar, escrita en un lenguaje que ya lees. Se arranca con un script nuevo, `"publicado": "node servidor/publicar.ts"`, en el puerto 4180, y reenvía `/api/*` a la API de práctica, como el *proxy* de Vite en desarrollo.

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

const PUERTO = Number(process.env.PUERTO ?? "4180");
const API_URL = process.env.API_URL ?? "http://127.0.0.1:3100";
const RAIZ = new URL("../dist/", import.meta.url).pathname;

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

Lo que hay que entender, decisión por decisión:

- **Una lista cerrada de archivos.** Al arrancar, `listarArchivos` lee **todo** `dist/` a memoria, en un `Map` cuya llave es la ruta pública (`/assets/index-DaB3Njqx.js`). Después, ninguna petición toca el disco: el servidor busca la dirección en el `Map` y, si no está, no existe. Así, ninguna dirección que escriba alguien (`/../../etc/passwd`, por ejemplo) se convierte en una ruta de archivo. Es la defensa más simple contra el recorrido de directorios, porque el ataque no tiene dónde aplicarse.
- **La reescritura, con una excepción.** Cualquier dirección que no sea un archivo responde `index.html`, para que React Router decida; **salvo** las que empiezan con `/assets/`, que responden `404`. Ahí sí un archivo faltante es un error y se dice.
- **La política de seguridad de contenido.** `default-src 'none'` prohíbe todo, y cada directiva siguiente abre solo lo necesario: scripts, estilos, imágenes y conexiones desde el mismo origen (`'self'`), formularios que solo se envían al mismo origen, ninguna etiqueta `<base>` y ningún sitio que pueda meter el panel en un `<iframe>`. No hay `'unsafe-inline'`: un `<script>` escrito dentro del HTML no se ejecuta. La construcción de Vite no pone ningún script en línea en `index.html`, y por eso esta política no rompe el panel.
- **`nosniff`.** Le dice al navegador que crea el `content-type` que declara el servidor y no intente adivinarlo por el contenido.
- **Caché por tipo de archivo.** `/assets/*` lleva `public, max-age=31536000, immutable`: un año, y la promesa de que no va a cambiar. `index.html` lleva `no-cache`: el navegador puede guardarlo, pero tiene que preguntar antes de usarlo.

Con la API de práctica y el servidor de publicación encendidos, seis preguntas:

```text
$ PUERTO=3109 npm run servidor
$ PUERTO=4109 API_URL=http://127.0.0.1:3109 npm run publicado
$ curl -sI http://127.0.0.1:4109/servicios/pagos
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
cache-control: no-cache
content-security-policy: default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
x-content-type-options: nosniff
Date: Wed, 21 Oct 2026 13:10:50 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4109/assets/no-existe.js
404 text/plain; charset=utf-8
$ curl -sI http://127.0.0.1:4109/assets/index-DaB3Njqx.js | grep -i cache-control
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

La primera es la recarga de la escena, resuelta: `200` con `index.html`, la política y `no-cache`. La segunda es el archivo faltante: `404`, ya no HTML disfrazado. La tercera, la caché larga. La cuarta merece una lectura cuidadosa: `--path-as-is` le pide a `curl` que **no** limpie los `..` y los mande tal cual, como haría alguien que intenta salirse de la carpeta. El servidor respondió `200` con `index.html`, no con el archivo del sistema. La bitácora del servidor dice por qué:

```text
13:10:49.359 revisor publicado en http://127.0.0.1:4109 (API en http://127.0.0.1:3109)
13:10:50.846 HEAD /servicios/pagos 200
13:10:50.884 GET /assets/no-existe.js 404
13:10:50.922 HEAD /assets/index-DaB3Njqx.js 200
13:10:50.942 GET /etc/passwd 200
13:10:51.276 POST /api/servicios 201
13:10:51.286 HEAD /favicon.ico 200
13:10:53.003 GET /servicios/pagos 200
13:10:53.009 GET /assets/index-DaB3Njqx.js 200
13:10:53.010 GET /assets/index-CbqUABMA.css 200
13:10:54.538 GET /api/servicios/pagos 200
13:10:54.540 GET /favicon.ico 200
```

`new URL()` normalizó `/../../etc/passwd` a `/etc/passwd`, que no está en el `Map`, así que es «una ruta del cliente» y responde `index.html`. Dos defensas encimadas: la normalización de la URL y la lista cerrada. Y la quinta pregunta, el `POST` del alta, llegó a la API a través del reenvío con su `201`. La sexta, `/favicon.ico`, la vas a necesitar en el ejercicio 3; no la leas todavía.

Las últimas cinco líneas de la bitácora son Chrome sin ventana abriendo `/servicios/pagos` en el servidor publicado: pide la página, el JavaScript, la hoja de estilos, y ya con React corriendo, el detalle a la API y el ícono de la pestaña. Este es el `#raiz` que dibujó, con el encabezado, la bandeja vacía y el detalle de `pagos`:

```text
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a><a class="" href="/servicios/nuevo" data-discover="true">Dar de alta</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header><section class="bandeja" aria-label="Avisos"><div role="status" aria-atomic="false"></div></section><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><dl><dt>Estado</dt><dd>En falla: HTTP 503</dd><dt>Revisiones</dt><dd>0</dd><dt>Última revisión</dt><dd>2026-10-21T13:10:49.204Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre pagos<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

El título de la pestaña, en el `<head>` del mismo volcado, era `pagos · Revisor`: el Effect de `useTituloDocumento` de la Lección 3, funcionando en la versión publicada, con la política de seguridad encendida.

Lo que este servidor **no** hace, y un servidor de producción sí: HTTPS, compresión (gzip o brotli), registros con rotación, límites de tamaño y de tiempo para las peticiones, y reiniciarse solo si se cae. Para eso se pone nginx, Caddy o la plataforma de tu elección delante, o en su lugar, con las mismas reglas: reescritura salvo `/assets/`, la misma política y la misma caché. Las reglas son lo que esta sección enseña; el programa que las aplica se puede cambiar.

#### 9.2.4 `VITE_` sin secretos, ahora en lo publicado

La Lección 0 lo demostró en desarrollo: lo que empieza con `VITE_` queda escrito en el JavaScript que descarga cualquiera, y lo que no empieza así no llega ([Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode)). En la publicación se cierra el círculo con una costumbre: **antes de publicar, se busca en `dist/`**. Sobre el punto de control:

```text
$ grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js dist/index.html | sort | uniq -c
   2 dist/assets/index-DaB3Njqx.js:password
$ grep -ioE ".{60}password.{60}" dist/assets/*.js
datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0
.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var Qr=An&&`
```

Dos coincidencias, en una sola línea del archivo (`grep -c` diría `1`), y ninguna es una fuga. Las dos son código de React DOM que enumera los tipos de `<input>` (`email`, `number`, `password`, `url`…) para saber cómo tratar cada uno. La lección importante no es el número: **un resultado de búsqueda se lee, no se cuenta**. Cero coincidencias tampoco habría probado nada, porque una clave real casi nunca se llama `clave`.

Por eso la búsqueda que sí sirve es la de **los valores**. Para verlo, una copia del punto de control lee dos variables que no debería (una con prefijo y otra sin él), las declara en `vite-env.d.ts` e imprime las dos desde `main.tsx` para que la construcción no las descarte:

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

Y se construye con valores de mentira:

```text
$ VITE_CLAVE_MONITOREO=mon_prueba_7f3a91 CLAVE_MONITOREO=mon_secreta_c0ffee npm run build
...
dist/assets/index-D1lyPurv.js   374.42 kB │ gzip: 117.26 kB
$ grep -o '.\{30\}mon_prueba_7f3a91.\{10\}' dist/assets/*.js
s?t:ds}var hs=ms(`10000`),gs=`mon_prueba_7f3a91`;async fu
$ grep -c mon_secreta_c0ffee dist/assets/*.js
0
```

La de `VITE_` quedó escrita junto a `ms(`10000`)`, que es `leerCadaMs` con el valor del `.env`. La otra no. Si tu equipo guarda los valores reales de sus claves en un gestor de secretos, la búsqueda que vale es esa: tomar cada valor y buscarlo en `dist/`. Si aparece, la clave ya no es secreta y hay que cambiarla, no solo quitarla del paquete.

#### 9.2.5 Repaso de XSS: tres capas

El curso de TypeScript enseñó el ataque: si una página inserta como HTML un texto que vino de afuera, ese texto puede traer un `<script>` o un `onerror` que se ejecute con los permisos de quien abrió la página. Eso se llama *cross-site scripting* (XSS). En el `revisor`, «de afuera» es la API: los nombres de servicio los escribe quien da de alta, y llegan a la pantalla de todos. La figura 3 le da a React un nombre de servicio con un ataque, y una dirección `javascript:` en un enlace:

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

**Primera capa: React escapa el texto.** En los casos 1 y 2, el `<img onerror>` llegó como texto: `&lt;img …&gt;`. El navegador lo pinta como letras y no crea ninguna imagen. Esto pasa siempre que el dato va como hijo de JSX o como valor de un atributo de texto (`title`, `aria-label`, `value`), que es como el `revisor` pinta todo. Los atributos que el navegador trata como dirección o como documento (`href`, `src`, `formAction`, `srcDoc` de un `<iframe>`) son otra historia: escapar no los protege, porque una dirección peligrosa no lleva ningún carácter que escapar. React 19 bloquea `javascript:`, como muestra el caso 3, pero lo demás no lo revisa. Una dirección que viene de afuera se valida antes de usarla, por ejemplo exigiendo que empiece con `https://`, como hace el esquema del alta de la Lección 7 con `urlHttp`. La única puerta para insertar HTML es `dangerouslySetInnerHTML`, y la documentación de React lo dice sin rodeos: si el HTML no es de confianza, por ejemplo si se basa en datos de usuarios, te arriesgas a una vulnerabilidad de XSS ([React, componentes comunes](https://react.dev/reference/react-dom/components/common)). En el caso 3, React 19 reemplazó la dirección `javascript:` por una que lanza un error: «React has blocked a javascript: URL as a security precaution». React 16.9 había anunciado que lo haría en una versión mayor futura ([React, «React v16.9.0»](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html)); la figura muestra que la 19.3.1 ya lo hace.

**Segunda capa: el linter.** El `eslint.config.js` del `revisor` trae desde la Lección 0 una regla `no-restricted-syntax` que rechaza `dangerouslySetInnerHTML` y las asignaciones a `innerHTML`. Si alguien la abre, `npm run lint` se pone rojo y la verificación del curso no pasa.

**Tercera capa: la política de seguridad de contenido.** Si las dos primeras fallaran (una librería que inserta HTML por su cuenta, un descuido), la política del servidor de publicación todavía prohíbe ejecutar scripts que no vengan de un archivo del mismo origen. Un `onerror` escrito en el HTML es código en línea, y sin `'unsafe-inline'` el navegador no lo ejecuta. Es la única de las tres capas que **no** vive en tu código: vive en el servidor. Por eso importa quién publica y cómo.

### 9.3 Server Components, Server Functions y cuándo un framework

#### 9.3.1 Qué son

Todo lo que el `revisor` dibuja, lo dibuja el navegador. React 19 tiene otra posibilidad. Los **Server Components** son componentes que se dibujan antes, en un entorno separado de la aplicación del navegador: pueden correr una vez al construir, en el servidor de integración continua, o en cada petición, en un servidor web ([React, «Server Components»](https://react.dev/reference/rsc/server-components)). Como corren en el servidor, pueden leer una base de datos o un archivo directamente, sin una API de por medio, y lo que llega al navegador es el resultado ya dibujado, no el código que lo produjo. Las **Server Functions** son el camino de vuelta: funciones asíncronas que se ejecutan en el servidor y que un componente del navegador puede llamar. Se marcan con la directiva `"use server"`; el framework crea una referencia que viaja al navegador, y al llamarla, React manda una petición al servidor para ejecutarla y devuelve el resultado ([React, «Server Functions»](https://react.dev/reference/rsc/server-functions)). Hasta septiembre de 2024 se llamaban «Server Actions»; hoy ese nombre queda para las que se pasan a un `action` o se llaman desde una acción, como el `<form action>` de la Lección 7.

Dos aclaraciones de la documentación que evitan confusiones comunes. La primera: **no hay directiva para los Server Components**; `"use server"` es para Server Functions, no para marcar un componente. La segunda, que decide mucho: aunque los Server Components de React 19 son estables entre versiones menores, las piezas internas que usan los empaquetadores y los frameworks para implementarlos **no siguen versionado semántico** y pueden romperse entre versiones menores de React 19.x. Por eso la documentación le recomienda a quien construye esa integración fijar una versión exacta de React o usar la versión *Canary*. Lo que sigue ya es criterio de este curso, no de la documentación: los Server Components se usan a través de un framework que mantiene esa integración por ti. Vite tiene un *plugin* oficial para ellos, `@vitejs/plugin-rsc` (versión 0.5.38 el 21 de octubre de 2026, todavía antes de la 1.0), que se describe como agnóstico del framework y entrega las piezas de bajo nivel para construir uno encima; es una base para quien hace frameworks, no una pieza para una aplicación como el `revisor`.

Y una advertencia de seguridad que vale para cualquier diseño con servidor: los argumentos de una Server Function **los controla por completo el cliente**. La documentación pide tratarlos siempre como entrada no confiable, validarlos, y comprobar en cada Server Function que la persona que la llama tiene permiso para lo que pide ([React, `"use server"`](https://react.dev/reference/rsc/use-server)). Una Server Function es, en la práctica, una ruta pública de tu servidor con otro nombre. El antecedente más fuerte es reciente: el 3 de diciembre de 2025, el equipo de React publicó una vulnerabilidad crítica en los Server Components, la CVE-2025-55182, con calificación CVSS de 10.0, que permitía ejecutar código en el servidor sin autenticarse aprovechando un defecto en cómo React decodificaba las peticiones a las Server Functions. Según el aviso, una aplicación podía ser vulnerable aunque no definiera ninguna Server Function, con solo admitir Server Components; y una aplicación cuyo código de React no usa un servidor no estaba afectada ([React, «Critical Security Vulnerability in React Server Components»](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)). El `revisor` es de las segundas. Es la otra cara de «piezas internas que no siguen versionado semántico»: quien las usa tiene que actualizarlas en cuanto sale el parche.

#### 9.3.2 Por qué este panel no los usa

El `revisor` no usa Server Components por tres razones, y conviene decirlas con precisión, porque «no los necesita» sin razones es solo una opinión:

1. **Sus datos ya tienen un servidor, y es otro.** El reporte y el detalle vienen de una API que no es del panel: en el curso es el servidor de práctica; en la vida real sería el revisor del curso de Go o el de TypeScript. Un Server Component brilla cuando el componente puede leer los datos de cerca. Aquí tendría que pedírselos a esa misma API por HTTP, que es lo que ya hace el navegador, solo que desde otra máquina.
2. **Sus datos cambian solos, cada diez segundos.** El reporte se sondea con `refetchInterval` (Lección 4) y se invalida al reintentar (Lección 4) o al dar de alta (Lección 7). Eso es estado del servidor **en el navegador**, y TanStack Query lo resuelve con caché, reintentos y actualización en segundo plano. Un dibujo del lado del servidor sirve para la primera carga, no para los diez segundos siguientes.
3. **No necesita aparecer en buscadores ni cargar sin JavaScript.** Es una herramienta interna, detrás de un acceso. Las dos ganancias más citadas de dibujar en el servidor (que el contenido esté en el primer HTML para los buscadores, y que algo se vea antes de que llegue el JavaScript) no le pagan nada.

Hay una cuarta razón, que es de este curso y no del panel: Server Components requieren un framework, y aprender un framework mientras aprendes React esconde qué hace cada uno. Por eso el curso enseñó primero el React que corre en el navegador.

#### 9.3.3 Cuándo conviene migrar a un framework

La documentación de React es clara en su recomendación: para una aplicación nueva, **empezar con un framework** (menciona el App Router de Next.js, React Router en su modo de framework y Expo para aplicaciones nativas, entre otros), porque traen resueltos el enrutamiento, la carga de datos y el dibujo en el servidor; empezar desde cero, con una herramienta como Vite, da más flexibilidad a cambio de tomar esas decisiones tú ([React, «Creating a React App»](https://react.dev/learn/creating-a-react-app)). La misma página reconoce las razones para empezar desde cero: restricciones que los frameworks no resuelven bien, querer construir tu propia estructura, o querer aprender lo básico de una aplicación de React. Este curso es la tercera. Y hay un detalle que conviene saber: esos frameworks también producen aplicaciones de una sola página sin servidor, que se pueden publicar como archivos estáticos, y te dejan agregar funciones de servidor ruta por ruta cuando las necesites.

El criterio para migrar el `revisor`, o cualquier aplicación parecida, es propio de este curso, no de la documentación, y se escribe en forma de señales que se pueden comprobar:

| Señal | Cómo se ve en el `revisor` | ¿Migrar? |
|---|---|---|
| Hay páginas públicas que deben aparecer en buscadores | No: es una herramienta interna | No |
| La primera carga es lenta y la medición lo demuestra (JavaScript grande, cascadas de peticiones al abrir) | 117 kB comprimidos y una petición al abrir; no medido como problema | No |
| Los datos están en una base de datos propia y la API existe solo para la pantalla | No: la API es de otro programa y tiene otros clientes | No |
| Hay datos o claves que no pueden llegar al navegador y hoy obligan a escribir una API solo para eso | No: no hay secretos en la pantalla (9.2.4) | No |
| El equipo reinventa con esfuerzo el enrutamiento, la carga de datos por ruta y el manejo de errores | No: React Router y TanStack Query lo resuelven | No |

Si un día dos o tres renglones cambian de «No» a «Sí», la migración empieza a pagar su costo, que es real: un servidor de Node que hay que operar, un modelo mental nuevo (qué corre dónde), y piezas que dependen de versiones del framework. Hasta entonces, el `revisor` es lo que la documentación llama una aplicación de una sola página, y está bien que lo sea.

### 9.4 Lo que encontramos al medir

Escribir esta lección obligó a medir el panel de punta a punta, y la medición encontró cinco defectos que ninguna lección anterior había visto. Ninguno rompe una prueba de la Lección 8, porque ninguna prueba los buscaba. Se cierran todos igual, con la costumbre de esa lección: primero se escribe la prueba que describe el comportamiento correcto y se ve **roja** contra el código de hoy; después se arregla, y la misma prueba se ve **verde**. Las ocho pruebas nuevas viven en cuatro archivos y cubren los cinco defectos (los dos de CSS comparten archivo).

Los cinco arreglos y sus cuatro archivos de prueba son parte del punto de control de esta lección. Para ver la fase roja, los cuatro archivos de prueba se corrieron en una copia del punto de control **sin** los arreglos, es decir, contra el código como lo dejó la Lección 8:

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

Cinco rojas, una por defecto, y tres verdes que ya protegían lo que sí funcionaba. Cada sección siguiente muestra su prueba, el mensaje de su fallo y el arreglo, tal como quedaron en el punto de control.

#### 9.4.1 `VITE_CADA_MS` sin límite

**Lo que se midió.** Es el tercer mensaje de la escena. Con el punto de control en `npm run dev`, `VITE_CADA_MS=2147483648` y Chrome sin ventana abierto en `/` durante cinco segundos, la bitácora de la API de práctica:

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

(La primera línea es la pareja de `StrictMode` de siempre.) Diez peticiones en menos de tres segundos, una cada ~305 ms, que es justo lo que tarda la API en responder: el panel pregunta en cuanto le contestan. Quien escribió ese número quería unos 25 días entre preguntas. ¿Por qué? El sondeo de TanStack Query usa `setInterval`, y MDN explica el límite: el retraso se convierte en un entero con signo de 32 bits, así que el máximo es 2,147,483,647 ms (unos 24.8 días); un valor mayor **se desborda** y puede dar un número negativo, que el navegador trata como «sin espera» ([MDN, `setTimeout`, «Maximum delay value»](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value)). 2,147,483,648 es exactamente uno más que el máximo: al desbordarse se vuelve −2,147,483,648, un retraso negativo. Y el desborde no siempre es tan escandaloso: con `VITE_CADA_MS=99999999999`, en la misma prueba de cinco segundos hubo una sola petición, porque ese número, al desbordarse, da unos 14 días. Un defecto que a veces se ve y a veces no es el peor tipo.

El otro extremo también existe: `VITE_CADA_MS=1` pasa el filtro de `leerCadaMs` (es un entero positivo) y le pide al navegador un sondeo sin pausa. La misma corrida de cinco segundos:

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

El mismo resultado práctico: una pregunta en cuanto llega la respuesta. (La última línea es la petición en curso cuando se cerró Chrome.)

**La prueba.** Un archivo nuevo junto a `configuracion.ts`:

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

La fase roja: `expected 999 to be 10000`. Hoy `leerCadaMs("999")` devuelve 999; la prueba dice que un intervalo menor a un segundo no se acepta.

**El arreglo.** Dos límites, con su razón escrita al lado. Fuera de ellos, se usa el valor de siempre, igual que con un texto que no es número: la configuración inválida no rompe el panel, se ignora.

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

El mínimo de un segundo y el máximo de una hora son un criterio propio del curso, no una norma: un segundo es más de tres veces lo que tarda la API en responder, y más de una hora deja de ser un sondeo. Lo que **no** es criterio es que el máximo quede por debajo de 2,147,483,647: eso lo exige `setInterval`. La misma medición con el arreglo, el mismo número y los mismos cinco segundos:

```text
10:10:59.307 GET /api/estados cancelada por el cliente
10:10:59.610 GET /api/estados 200
```

Una petición: el valor se ignoró y el panel volvió a sus diez segundos.

#### 9.4.2 El singular de «servicios»

**Lo que se midió.** Con un solo servicio en el reporte, el resumen dice «1 servicios revisados». La Lección 1 cuidó el singular de las fallas con `textoFallas` («1 servicio con falla»), pero el total quedó escrito a mano en el componente, `{estados.length} servicios revisados`, y nadie lo probó con uno. La prueba de la Lección 8 que protege el `0` suelto usa dos servicios, así que tampoco lo veía.

**La prueba.** Monta solo `ResumenFallas` con un servicio en falla, porque el defecto es de ese componente y no hace falta la aplicación entera:

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

La fase roja lo dice letra por letra:

```text
Expected: "1 servicio revisado · 1 servicio con falla"
Received: "1 servicios revisados · 1 servicio con falla"
```

**El arreglo.** El texto sale a una función pura, al lado de `textoFallas`, y el componente la usa:

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

La prueba existente «sin fallas no pinta un 0 suelto en el resumen» sigue verde, porque con dos servicios el texto es el mismo de antes.

#### 9.4.3 El reintento ante un 404

**Lo que se midió.** Abrir `/servicios/nada`, un servicio que no existe, con Chrome sin ventana y la API de práctica:

```text
10:11:05.994 GET /api/servicios/nada cancelada por el cliente
10:11:06.195 GET /api/servicios/nada 404
10:11:07.401 GET /api/servicios/nada 404
10:11:09.607 GET /api/servicios/nada 404
```

Tres peticiones, con 1.2 y 2.2 segundos entre ellas, y la persona viendo «Cargando detalle…» durante más de tres segundos antes de enterarse de que el servicio no existe. Es `retry: 2` de la Lección 4, que se aplica a **todo** error, más la espera que TanStack Query pone entre intentos: empieza en un segundo y se duplica cada vez ([TanStack Query, «Query Retries»](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries)). Reintentar tiene sentido ante un `503` (el servicio puede volver en un segundo) o una red caída. Ante un `404`, la respuesta es la respuesta: el servicio no va a aparecer por insistir. Una precisión antes de generalizar: en el `revisor` la API solo responde `400`, `404` y `409`, y ninguno cambia por insistir, así que la regla del punto de control es «no reintentar ningún 4xx». En una API real hay dos 4xx que sí son pasajeros, el `408` (se agotó el tiempo de la petición) y el `429` (demasiadas peticiones, que suele traer `Retry-After`), y una regla de reintento de verdad los separa.

¿Por qué la Lección 8 no lo vio? Porque `montarEn` crea su propio `QueryClient` con `retry: false`, a propósito, para que un error se vea de inmediato en las pruebas. Eso es correcto para probar las pantallas, y deja sin probar la configuración real. La prueba nueva usa el cliente de verdad, `crearClienteConsultas()`:

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

La fase roja: `expected "vi.fn()" to be called 1 times, but got 3 times`. La segunda prueba, la del `503`, está verde desde antes, y es la que impide el arreglo perezoso: `retry: false` pondría verde la primera y roja la segunda. Las dos juntas describen la regla completa. (Tarda tres segundos de verdad, por las esperas entre intentos; por eso lleva `timeout: 10_000`.)

**El arreglo.** El error lleva el código HTTP como su causa (`cause`, una propiedad estándar de `Error`), y el cliente decide con una función en lugar de un número:

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

La misma medición en el navegador, con el arreglo:

```text
10:11:13.704 GET /api/servicios/nada cancelada por el cliente
10:11:13.905 GET /api/servicios/nada 404
```

Una petición, y el aviso «No se pudo cargar el detalle: la API respondió 404» aparece en cuanto llega la respuesta.

#### 9.4.4 CSS sin usar

**Lo que se midió.** `panel.css` tiene dos reglas que ningún componente usa desde la Lección 5: `.seleccionar` (el botón con `aria-pressed` de la Lección 2, que la 5 cambió por un enlace) y `.detalle` (el panel de detalle de la Lección 3, que la 5 cambió por una página). Son 19 líneas que viajan a cada navegador y que confunden a quien lee la hoja, porque parecen vivas.

**La prueba, y la trampa que se encontró al escribirla.** La prueba lee la hoja de estilos y el texto de los componentes, saca las clases de la hoja y comprueba que cada una aparezca en algún `className`. Para leer archivos como texto sin Node, usa dos funciones de Vite que Vitest entiende: `import hoja from "./panel.css?raw"` y `import.meta.glob(…, { query: "?raw" })`.

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

La primera versión de esta prueba **pasó en verde contra el código con el defecto**. No es que el defecto no existiera: es que la hoja llegaba vacía. Vitest, por omisión, no procesa los archivos `.css`; su documentación dice que los archivos excluidos se reemplazan por un texto vacío, y que `css.include` (vacío por omisión) es la lista de los que sí se procesan ([Vitest, `css`](https://vitest.dev/config/css)). Lo demás se midió, no lo dice la documentación: un archivo que no está en esa lista también llegó vacío, aun con `?raw`: `hoja.length` era `0`. Una hoja vacía no tiene clases sin usar, y la prueba concluía, sin error, que todo estaba bien. Es la clase de verde más peligrosa, la que no midió nada.

Por eso la prueba tiene dos cambios. El primero es en `vite.config.ts`, dentro de `test`:

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

El segundo es el **control positivo** dentro de la propia prueba: antes de buscar clases sin usar, comprueba que encontró al menos una que sí se usa, `tarjeta`, en la hoja y en los componentes. Sin `css.include`, la prueba ahora falla donde debe, en lugar de pasar:

```text
 FAIL  src/reporte/panel.test.ts > la hoja de estilos > cada clase de la hoja la usa algún componente
AssertionError: expected [] to include 'tarjeta'
```

Con la hoja leída de verdad, la fase roja es la que interesa:

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

Fíjate en `DINAMICAS`. Hay clases que ningún `className` escribe con todas sus letras: `disponible` y `falla` salen de `estado.tipo`, y `active` la pone `NavLink` en el enlace de la página actual. Una prueba así no puede adivinarlas; hay que declararlas, y la lista es parte del código que se revisa. Es el mismo problema que tienen las herramientas que borran CSS sin usar de forma automática, y por eso suelen aceptar una lista de excepciones (en PurgeCSS se llama *safelist*). El arreglo, en este caso, es borrar esas 19 líneas.

#### 9.4.5 El CSS de `.actualizado`

**Lo que se midió.** Es el defecto al revés: `PaginaReporte` dibuja `<p className="actualizado">` desde la Lección 3, y `panel.css` nunca tuvo una regla para esa clase. La línea «Actualizado a las … · actualizando…» se ve con el mismo tamaño y el mismo color que los datos, compitiendo con lo que importa. Una clase que el componente pone y la hoja ignora es una promesa sin cumplir.

**La prueba.** Ya la viste en `panel.test.ts`: busca la regla `.actualizado`, toma su `color` y calcula el contraste contra el fondo blanco con la fórmula de WCAG 2.2. Exige dos cosas: que sea al menos 4.5 a 1, el mínimo para texto normal según el criterio 1.4.3 ([W3C, «Understanding SC 1.4.3: Contrast (Minimum)»](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)), y que sea menor que 21 a 1, que es negro puro. Esa cota de arriba solo descarta el negro exacto (un `#111111` da 18.88 a 1 y pasaría): que la línea se vea **secundaria** lo decide el ojo, y la prueba solo garantiza que la regla exista, que declare un color y que se lea. La fase roja: `falta el color de .actualizado: expected undefined to be defined`.

**El arreglo.** Una regla, en el lugar donde estaban las dos que se borraron, con el mismo gris que ya usaban las ayudas del formulario de la Lección 7:

```css
/* fragmento: revisor/src/reporte/panel.css, solo la regla nueva */
.actualizado {
  color: #57606a;
  font-size: 0.875rem;
}
```

El contraste de `#57606a` sobre blanco, calculado con la misma fórmula: 6.39 a 1. Para comparar, un gris que «se ve bien» a primera vista, `#999999`, da 2.85 a 1 y la prueba lo rechazaría.

#### 9.4.6 La fase verde y la suite completa

Los mismos cuatro archivos de prueba, en el punto de control, con los cinco arreglos:

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

Y la suite completa, para comprobar que ningún arreglo rompió lo que ya estaba protegido:

```text
$ npm test -- --reporter=default

> revisor@0.9.0 test
> vitest run --reporter=default


 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/ResumenFallas.test.tsx (1 test) 68ms
 ✓ src/reporte/resumen.test.ts (3 tests) 12ms
 ✓ src/configuracion.test.ts (3 tests) 2ms
 ✓ src/compartido/esquema.test.ts (2 tests) 4ms
 ✓ src/app/rutas.test.tsx (3 tests) 95ms
 ✓ src/detalle/PaginaServicio.test.tsx (2 tests) 128ms
 ✓ src/reporte/panel.test.ts (2 tests) 2ms
 ✓ src/reporte/PaginaReporte.test.tsx (7 tests) 176ms
 ✓ src/avisos/avisos.test.ts (4 tests) 2ms
 ✓ src/alta/FormularioAlta.test.tsx (5 tests) 394ms
 ✓ src/consultas/cliente.test.ts (2 tests) 3013ms
   ✓ el cliente de consultas (2)
     ✓ reintenta dos veces un 503: puede ser pasajero 3004ms

 Test Files  11 passed (11)
      Tests  34 passed (34)
   Start at  07:23:24
   Duration  5.06s (environment 64%, tests 19%, setup 7%, transform 6%, import 4%)

Environment  jsdom was created 11 times · 13.00s total, 64% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
```

34 de 34 en 11 archivos: las 26 de la Lección 8 más las 8 nuevas. Las dos líneas de `Isolate` del final son una sugerencia de Vitest sobre su propia velocidad, no un aviso de las pruebas; pueden salirte o no. En el punto de control, `npm run lint` terminó sin avisos y `npm run build` dejó `index-DaB3Njqx.js` (374.36 kB) y `index-CbqUABMA.css`, de 1.27 kB: 223 bytes menos que la hoja de antes de los arreglos (1.50 kB). El compilador siguió actuando: 18 marcas.

## El error que vas a ver

**El error principal: leer el reloj mientras se dibuja.** La primera versión de la figura 1 tenía la espera dentro del componente, así:

```tsx
// fragmento: la primera versión de ListaLenta, la que el linter rechazó
function ListaLenta() {
  const hasta = performance.now() + 20;
  while (performance.now() < hasta) {
    // espera activa
  }
  // …
```

Y `npx eslint` respondió:

```text
~/curso-react/figuras-09/fig09_01.tsx
  19:17  error  Error: Cannot call impure function during render

`performance.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

~/curso-react/figuras-09/fig09_01.tsx:19:17
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

Es la regla `react-hooks/purity`, una de las que `eslint-plugin-react-hooks` 7 trae del compilador. Dice algo que ya sabes desde la Lección 1: un componente tiene que dar el mismo resultado con las mismas entradas, y `performance.now()` da un número distinto cada vez. Si el compilador memoizara un componente que lee el reloj, la segunda vez reutilizaría la hora de la primera. Por eso las dos herramientas comparten reglas: el linter avisa de lo que haría que el compilador se equivocara (o se saltara el componente, como en la figura 2). El arreglo de la figura saca la espera a una función aparte. Ojo: eso no la vuelve pura, solo la esconde del linter, que no revisa dentro de las funciones que llamas. Se acepta aquí **únicamente** porque simula un costo y no produce nada que se dibuje, y el comentario de `gastar` lo advierte; hacer lo mismo con una impureza de verdad sería callar al linter por otro camino. En un componente de verdad, una hora que se muestra se guarda en el estado o llega como prop.

**El silencioso: el archivo que no existe y responde HTML.** En la vista previa, `/assets/no-existe.js` respondió `200 text/html` (9.2.2). En el navegador eso se ve como una página en blanco y, en la consola, un error que dice que se esperaba un módulo de JavaScript y el servidor respondió con el tipo MIME `text/html`. No dice qué archivo faltaba ni por qué. Si lo ves después de publicar, la pregunta es: ¿mi servidor reescribe también las direcciones de `/assets/`? El arreglo es el de `publicar.ts`: la reescritura es para las rutas del cliente, nunca para los archivos.

**El otro silencioso: la prueba verde que no leyó nada.** Lo viste en 9.4.4. Si una prueba lee un archivo y concluye «no hay problemas», pregúntate qué habría dicho con el archivo vacío. Si la respuesta es «lo mismo», le falta un control positivo.

## Lo que se hace mal

**`useMemo` y `memo` en todo, «por si acaso».** La figura 1 mostró que la causa de los dibujos de más era un estado en el lugar equivocado. Memoizar habría escondido el síntoma y dejado la causa, con más código que mantener.

**Optimizar sin medir.** Si no sabes cuántas veces se dibuja un componente ni cuánto tarda, no sabes si lo que cambiaste sirvió. `<Profiler>` o la pestaña Profiler responden las dos preguntas en minutos.

**Medir en la construcción de producción con `<Profiler>`.** Está apagado ahí, a propósito. Las mediciones de dibujo se hacen en desarrollo, y las de la experiencia completa (carga, red) en la versión publicada, con las herramientas del navegador.

**Encender el compilador y no comprobar que actuó.** Una configuración que no da error no prueba nada. Busca sus marcas en `dist/`, y cuéntalas con `grep -o … | wc -l`, no con `grep -c`.

**Callar al linter para que el compilador «funcione».** Si una regla del compilador se queja, el componente rompe una regla de React. Se arregla el componente. Silenciarla deja un componente que el compilador se salta, o peor, que optimiza mal.

**Publicar con `vite preview`.** No está hecho para eso: sin política de seguridad, sin caché para los archivos con nombre de contenido, y respondiendo HTML donde falta un archivo.

**Reescribir todo a `index.html`, incluidos los archivos.** Convierte un `404` claro en un error de tipo de contenido que nadie entiende.

**Servir archivos armando la ruta de disco con lo que pide el cliente.** Abre la puerta al recorrido de directorios. La lista cerrada de `publicar.ts` no tiene esa puerta.

**Contar coincidencias al buscar secretos.** El `password` de React DOM es una coincidencia que no es fuga; una clave real casi nunca se llama `clave`. Se lee cada resultado, y se buscan los **valores**.

**Una prueba que lee un archivo sin control positivo.** Si el archivo llega vacío, pasa. Agrega una comprobación de que encontró algo que sabes que está.

**`retry: false` para «arreglar» un reintento de más.** Deja de reintentar lo que sí convenía reintentar. Por eso la prueba del `503` acompaña a la del `404`.

**Migrar a un framework porque es lo que recomienda la documentación para proyectos nuevos.** El `revisor` no es un proyecto nuevo, y la tabla de 9.3.3 no tiene un solo «Sí». Una migración se justifica con señales, no con una tendencia.

## Ejercicios

### Ejercicio 1 — El Profiler con tus ojos

Instala la extensión React Developer Tools en tu navegador. Con la API de práctica y `npm run dev` encendidos, abre `http://localhost:5173/`, abre la pestaña **Profiler**, y en su configuración activa la opción de registrar por qué se dibujó cada componente. **Antes de grabar, predice:** si escribes `pag` en «Buscar por nombre», ¿qué componentes se van a dibujar con cada letra?, ¿se dibuja `EditorNota`?, ¿se dibuja `BandejaAvisos`? Graba, escribe las tres letras, detén la grabación y comprueba tu predicción en cada *commit*. Después, mira la pestaña **Components**: ¿qué componentes llevan la insignia «Memo ✨»?

### Ejercicio 2 — La otra dirección

La prueba de 9.4.4 busca clases de la hoja que ningún componente usa. Haz la pregunta al revés, a mano: ¿hay algún `className` escrito en un componente que no tenga ninguna regla en `panel.css`? Usa `grep -rn 'className' src` en la copia con los arreglos. **Predice primero** cuántas vas a encontrar, además de `actualizado`, que ya se arregló. Después decide, para cada una, si le falta una regla o si está bien sin ella, y escribe tu razón en la bitácora.

### Ejercicio 3 — El ícono que respondió `200`

En la bitácora del servidor publicado de 9.2.3 aparece `GET /favicon.ico 200`, pero `dist/` no tiene ningún `favicon.ico`. Sin correr nada, explica qué respondió el servidor y con qué tipo de contenido. Después compruébalo con `curl -sI http://127.0.0.1:4180/favicon.ico`. ¿Es un defecto? ¿Qué cambiarías en `publicar.ts`, si cambiaras algo?

### Ejercicio 4 — ¿Migrar o no?

Un equipo te describe su aplicación: una tienda en línea con 4,000 productos, cada uno con su página, que hoy es una aplicación de una sola página hecha con Vite y React Router; el área de mercadotecnia se queja de que las páginas de producto no aparecen bien en los buscadores, y la primera carga en teléfono tarda, medido, cuatro segundos. Llena la tabla de 9.3.3 para esa aplicación y decide si conviene migrar a un framework. Escribe qué medirías antes de empezar.

## Soluciones

### Solución 1

Lo que deberías ver, deducido del código: con cada letra se dibujan al menos `PaginaReporte` (porque cambió la dirección: el texto de búsqueda vive en `?q=`, Lección 5, y lo lee con `useSearchParams`, así que la razón que muestre el Profiler será un cambio de hook), `FiltroFallas`, `ContenidoReporte`, `ListaEstados` y las `FilaEstado` que quedan en la lista. `EditorNota` no aparece: en la lista no se dibuja, solo en la página de detalle. `BandejaAvisos` tampoco: vive en la disposición, y su contexto no cambió. Si el compilador está encendido, varios componentes de la pestaña **Components** llevan «Memo ✨», y en el Profiler es probable que algunos hijos cuyas props no cambiaron aparezcan sin dibujarse en un *commit*. Si alguna predicción falló, anota cuál y por qué: es exactamente lo que el Profiler enseña. Esta medición no se corrió para la lección; tu resultado es el que vale.

### Solución 2

Además de `actualizado`, aparece `marca-nota`, en `FilaEstado`: el texto « · con nota» que marca un servicio con nota desde la Lección 2, sin regla en `panel.css`. Las clases dinámicas (`disponible` y `falla` de `estado.tipo`, `aviso-${aviso.nivel}`) sí tienen regla. ¿Le falta una regla a `marca-nota`? Es una decisión, no un hecho: el texto se lee bien junto al nombre, así que puede quedarse sin estilo, y la clase sirve para encontrarla en una prueba o en las herramientas de desarrollo. Si decides que se vea distinta (por ejemplo, en el gris de `.actualizado`), escribe su prueba antes, como en 9.4.5. Lo que no vale es dejar la pregunta sin contestar: una clase sin regla tiene que ser una decisión, no un olvido.

### Solución 3

`/favicon.ico` no está en la lista de archivos ni empieza con `/assets/`, así que el servidor lo trató como una ruta del cliente y respondió `index.html`: `200`, `text/html; charset=utf-8`, con la política y `no-cache` (es la sexta pregunta de 9.2.3: `200`, `content-type: text/html; charset=utf-8` y `cache-control: no-cache`). El navegador recibe HTML donde esperaba un ícono, no lo puede dibujar y deja la pestaña sin ícono; no hay más daño. Es un defecto menor de la misma familia que el de la vista previa (9.2.2): la reescritura se aplicó a algo que es un archivo. Hay dos arreglos razonables. El más simple, agregar un `favicon.ico` (o un `<link rel="icon">` a un archivo en `/assets/`) para que exista. El más general, que la reescritura solo aplique a direcciones sin extensión, de modo que `/favicon.ico` responda `404`; pero si haces eso, comprueba que ninguna ruta del cliente tenga un punto (`/servicios/v1.2` dejaría de recargar). Elegir entre los dos es criterio; medir el efecto, no.

### Solución 4

La tabla cambia casi entera. Páginas públicas que deben aparecer en buscadores: **Sí**, 4,000. Primera carga lenta y medida: **Sí**, cuatro segundos en teléfono. Datos propios (el catálogo es suyo): probablemente **Sí**. Secretos: depende (precios especiales, inventario), por comprobar. Reinventar carga de datos por ruta: probable. Con dos o tres «Sí» medidos, un framework con dibujo en el servidor por ruta empieza a pagar su costo: las páginas de producto llegarían ya dibujadas en el HTML. Antes de empezar, medirías: qué parte de los cuatro segundos es descargar JavaScript y qué parte es esperar datos (pestaña de red del navegador), cuánto pesa el paquete, y si el problema de los buscadores es de contenido (no está en el HTML) o de otra cosa (títulos, enlaces). Y una advertencia: la migración puede ser ruta por ruta, empezando por la página de producto, sin reescribir el carrito ni la cuenta.

## Cómo sé que lo logré

- [ ] `npm ci`, `npm run lint`, `npm test` y `npm run build` terminan con código 0 dentro de `~/curso-react/revisor/`; el resumen de `npm test -- --reporter=default` dice `Tests  34 passed (34)` en `11 passed (11)` archivos, y `npm run build` deja `dist/assets/index-DaB3Njqx.js` y `dist/assets/index-CbqUABMA.css` si tu código es idéntico al del punto de control.
- [ ] `grep -o memo_cache_sentinel dist/assets/*.js | wc -l` da `18`, y en una copia sin el compilador da `1`.
- [ ] Las figuras 1, 2 y 3 dan en tu máquina la misma salida que en la lección.
- [ ] Con `npm run servidor` y `npm run publicado`, `curl -sI http://127.0.0.1:4180/servicios/pagos` responde `200` con `content-security-policy` y `cache-control: no-cache`; `/assets/no-existe.js` responde `404`; y al abrir `http://127.0.0.1:4180/servicios/pagos` en tu navegador y **recargar**, se ve el detalle de `pagos`.
- [ ] `grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js` encuentra solo las coincidencias de React DOM, y sabes explicar por qué no son una fuga.
- [ ] En una copia tuya **sin** los cinco arreglos de 9.4 (con las pruebas nuevas y la línea `css` de `vite.config.ts`), los cuatro archivos de prueba nuevos se ven rojos, con 5 pruebas fallidas de 8; en el punto de control, verdes.
- [ ] **A mano, con las herramientas de desarrollo:** hiciste el ejercicio 1 y anotaste en tu [bitácora](bitacora.md) qué componentes se dibujaron con cada letra y cuáles llevan «Memo ✨».
- [ ] Puedes explicar, sin mirar, por qué el `revisor` no usa Server Components.

## Resumen

Responde sin mirar la lección:

1. ¿Qué dos condiciones tienen que cumplirse para que `memo` valga la pena? ¿Cómo mides cada una?
2. ¿Qué diferencia hay entre `actualDuration` y `baseDuration` en `onRender`? ¿Por qué no puedes usar `<Profiler>` en la construcción de producción?
3. En la figura 1, ¿por qué la versión B no volvió a dibujar la lista, si no usa `memo`? ¿Cuál de las cinco recomendaciones de la documentación aplica?
4. ¿Qué hace React Compiler con un componente que respeta las reglas de React, y qué hace con uno que las rompe? ¿Cómo compruebas que actuó en tu construcción?
5. ¿Por qué `grep -c` daba 2 y `grep -o … | wc -l` daba 18 sobre el mismo archivo?
6. ¿Qué tres cosas le faltaban a `vite preview` para publicar? ¿Cómo las resuelve `publicar.ts`?
7. ¿Por qué la reescritura a `index.html` no se aplica a `/assets/*`?
8. ¿Qué son las tres capas contra XSS del `revisor`, y cuál de ellas no vive en tu código?
9. ¿Qué es un Server Component y qué es una Server Function? ¿Por qué el `revisor` no los usa?
10. De los cinco defectos de 9.4, ¿cuál tenía una prueba verde que no había medido nada, y qué la arregló?

## Para leer más

- [React, `<Profiler>`](https://react.dev/reference/react/Profiler): `onRender` y sus parámetros, `actualDuration` frente a `baseDuration`, y por qué está apagado en producción. Consultado el 21 de octubre de 2026.
- [React, `memo`](https://react.dev/reference/react/memo): cuándo vale la pena memoizar, las cinco recomendaciones para que no haga falta, y el aviso sobre React Compiler. Consultado el 21 de octubre de 2026.
- [React, «React Compiler v1.0»](https://react.dev/blog/2025/10/07/react-compiler-1), [«Introduction»](https://react.dev/learn/react-compiler/introduction), [«Installation»](https://react.dev/learn/react-compiler/installation) y [«Debugging and Troubleshooting»](https://react.dev/learn/react-compiler/debugging): la versión estable del 7 de octubre de 2025, qué memoiza, qué hacer con `useMemo` y `useCallback`, la configuración con `reactCompilerPreset` en Vite, cómo comprobar que actuó, y que se salta el código que podría romper las reglas de React. Consultado el 21 de octubre de 2026.
- [Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy): `vite build`, la carpeta `dist` y la advertencia de que `vite preview` no es un servidor de producción. Consultado el 21 de octubre de 2026.
- [Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode): el prefijo `VITE_`, el reemplazo estático al construir y la advertencia sobre información sensible. Consultado el 21 de octubre de 2026.
- [React, componentes comunes: `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common) y [«React v16.9.0»](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html): el riesgo de XSS con HTML que no es de confianza, y el anuncio de que React dejaría de aceptar direcciones `javascript:`. Consultado el 21 de octubre de 2026.
- [React, «Server Components»](https://react.dev/reference/rsc/server-components), [«Server Functions»](https://react.dev/reference/rsc/server-functions) y [`"use server"`](https://react.dev/reference/rsc/use-server): qué son, dónde corren, por qué sus piezas internas no siguen versionado semántico, y por qué los argumentos de una Server Function son entrada no confiable; y el aviso de la [CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components). Consultado el 21 de octubre de 2026.
- [React, «Creating a React App»](https://react.dev/learn/creating-a-react-app): la recomendación de empezar con un framework y las razones para empezar desde cero. Consultado el 21 de octubre de 2026.
- [MDN, `setTimeout`, «Maximum delay value»](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value) y [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval): el retraso como entero con signo de 32 bits y el desborde. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Query Retries»](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries): `retry` como número o función, y la espera que se duplica entre intentos. Consultado el 21 de octubre de 2026.
- [Vitest, `css`](https://vitest.dev/config/css): `css.include` y los archivos de estilos que se reemplazan por texto vacío. Consultado el 21 de octubre de 2026.
- [W3C, «Understanding SC 1.4.3: Contrast (Minimum)»](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): el contraste mínimo de 4.5 a 1 y la fórmula de luminancia relativa. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| dibujo de más | volver a dibujar un componente cuyo resultado no cambió, porque cambió el estado de un padre |
| `<Profiler>` | componente de React que mide cuántas veces y cuánto tarda en dibujarse una parte del árbol |
| `actualDuration` / `baseDuration` | lo que tardó el dibujo de esta actualización / lo que tardaría sin ninguna memoización |
| memoizar | guardar un resultado para reutilizarlo mientras sus entradas no cambien |
| React Compiler | herramienta de construcción que memoiza componentes y hooks por su cuenta, y se salta los que rompen las reglas de React |
| `memo_cache_sentinel` | la marca de «caché todavía vacía» de React; el compilador la escribe en cada valor que guarda una sola vez, así que contarla en `dist/` dice si actuó |
| reescritura a `index.html` | responder la página de la aplicación para cualquier dirección que sea una ruta del cliente |
| política de seguridad de contenido (CSP) | encabezado que le dice al navegador de dónde puede cargar y ejecutar cada tipo de recurso |
| `immutable` | indicación de caché que promete que el archivo no va a cambiar nunca |
| recorrido de directorios | ataque que usa `..` en una dirección para leer archivos fuera de la carpeta publicada |
| Server Component | componente que se dibuja en el servidor o al construir, antes de llegar al navegador |
| Server Function | función que corre en el servidor y que un componente del navegador puede llamar |
| control positivo | comprobación, dentro de una prueba, de que encontró algo que sabes que existe, para que un archivo vacío no dé verde |
| desborde (*overflow*) | un número que no cabe en el tamaño donde se guarda y se convierte en otro |

---

**Fin del curso.** Si llegaste hasta aquí con tu `revisor`, vuelve a [«Cómo sabes que terminaste»](../README.md#cómo-sabes-que-terminaste) en el README y comprueba las cinco condiciones. La quinta habla de «la vista previa», pero se comprueba con `npm run publicado` (puerto 4180), el servidor con reescritura de 9.2.3, no con `vite preview`. Y abre tu [bitácora](bitacora.md): lo que anotaste en estas diez lecciones es lo que vale la pena repasar.
