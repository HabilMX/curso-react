# Lección 7 — Formularios, acciones y accesibilidad

*Son las 17:52 de un viernes y el corte de cambios es a las 18:00. El equipo de operación necesita dar de alta el servicio `correo` en la herramienta interna antes de irse, y quien está de guardia es Raúl, que trabaja con un lector de pantalla. Llena los tres campos, presiona Enter y no escucha nada. Vuelve a presionar Enter: nada. No sabe si el alta se hizo, si se hizo dos veces o si el formulario está esperando algo. Lo que pasó es que la dirección no empezaba con `https://`: la página pintó el campo de rojo y escribió el error debajo, en un texto que nadie conectó con el campo ni con un aviso. Para quien mira la pantalla, el error era obvio. Para Raúl no existía. Faltan ocho minutos. El formulario que él necesita es el que esta lección construye, y el segundo Enter, el que nadie oyó, lo vas a arreglar tú en el ejercicio 3.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 7.2 y 7.3)

**Qué construyes:** el alta de un servicio en el `revisor`: una página nueva en `/servicios/nuevo`, con un formulario de tres campos que se valida con el esquema del curso de TypeScript, se envía a la API de práctica, muestra los errores junto a cada campo y avisa del resultado a quien usa un lector de pantalla

**Qué aprendes:** controlado frente a no controlado; `<form action>`, `useActionState`, `useFormStatus` y `useOptimistic`; validar con el esquema de la lección 6 de TypeScript; `aria-invalid` con `aria-describedby`; regiones vivas (`role="status"`, `role="alert"`); el HTML nativo antes que ARIA; recorrerlo con el teclado

**De dónde vienes.** Del punto de control de la [Lección 6](06-reducer-contexto.md): un `revisor` con rutas (la lista en `/`, el detalle en `/servicios/:nombre` y una página de «no encontrada»), los datos del servidor en TanStack Query, una bandeja de avisos con su reducer y su contexto, y unas preferencias de pantalla. La API de práctica ya tiene desde la [Lección 4](04-estado-del-servidor.md) la ruta que esta lección usa por primera vez: `POST /api/servicios`, que responde `201` con el servicio nuevo, `400` con los campos inválidos o `409` si el nombre ya existe. Del curso de TypeScript traes, si lo llevaste, la idea de **esquema**: un valor que sabe leer `unknown` y del que se deriva un tipo. Si no lo llevaste, aquí aparece completo.

**Qué no hace esta lección.** No usa ninguna librería de formularios ni de validación: todo sale de React y del esquema que ya conoces, a propósito, para que veas qué resuelve cada pieza. No usa Server Functions ni Server Components: `<form action>` recibe aquí una función que corre en el navegador (por qué el panel no usa Server Components se discute en la [Lección 9](09-rendimiento-publicacion.md)). No agrega pruebas automáticas: el comportamiento del formulario se muestra con figuras que corren en un DOM de prueba y con el punto de control abierto en un navegador. Y no es un curso de accesibilidad: enseña lo que este formulario necesita, contra las fuentes que lo definen, y nombra lo que no se puede comprobar sin una persona y un lector de pantalla.

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas del `package.json` de esta lección. Los puntos de control de esta lección y de las dos siguientes se instalaron desde cero con `npm ci`, y `npm run lint` y `npm run build` terminaron bien; el de esta lección produjo `dist/assets/index-WLyq37jn.js`. No se repitió en un contenedor Linux. El error del compilador de «El error que vas a ver» se provocó en una copia del punto de control, no en el original. Las figuras se ejecutaron con su propio `package.json` en [`programas/07-formularios-accesibilidad/`](../programas/07-formularios-accesibilidad), junto a `revisor/`; se compilan con `tsc` y se corren con `node`, como en las lecciones anteriores, y agregan una sola dependencia nueva, `dom-accessibility-api` 0.7.1, que calcula el nombre y la descripción accesibles de un elemento siguiendo la especificación del W3C. Lo que se ve «en el navegador» se midió con Chrome sin ventana: el HTML de `/servicios/nuevo` con `--headless --dump-dom` contra `vite preview`, y el árbol de accesibilidad, el foco y las regiones vivas manejando Chrome por su protocolo de depuración (*Chrome DevTools Protocol*) con un guion de Node, contra `npm run dev` y la API de práctica. Esas corridas usaron los puertos 4107, 5107 y 3107 en lugar de 4173, 5173 y 3100, porque en la máquina corrían otras cosas a la vez; para apuntar el *proxy* a la API en el 3107 se cambió `vite.config.ts` en una **copia** del punto de control, no en el original. Para ti no cambia nada. Las mediciones de «antes» se hicieron con el formulario como estaba antes de los arreglos de esta lección (el éxito anunciado dos veces, sin `required`, sin `aria-atomic` en la bandeja, sin `startTransition` y con `disabled={pending}` en el botón), en esa misma copia; las de «después», con el punto de control. No se corrió en una Linux Mint real; nada de lo que se muestra depende del sistema. **Lo que no se midió**, y se dice donde aparece: cómo suena el formulario en un lector de pantalla de verdad (NVDA, Orca o VoiceOver) y el recorrido con el teclado en una ventana real. Esas dos comprobaciones están en «Cómo sé que lo logré», con el paso a paso para hacerlas a mano. Las rutas largas se muestran a partir de `~/curso-react`.

## Al terminar vas a poder

- Explicar la diferencia entre un campo controlado y uno no controlado, provocar el aviso de React de un `value` sin `onChange` y decidir cuál de los dos conviene a un formulario que se envía completo.
- Conectar un `<form action>` con `useActionState`, leer en el estado lo que devolvió la última acción y mostrar «Dando de alta…» con `useFormStatus` desde un componente hijo del formulario.
- Demostrar con una figura que React vacía los campos no controlados después de una acción, y conservar lo escrito cuando hubo errores.
- Validar los tres campos con un esquema que junta **todos** los errores, y comprobar con el compilador que el esquema y el tipo `NuevoServicio` no pueden divergir.
- Marcar un campo inválido con `aria-invalid` y `aria-describedby`, y medir con una figura el nombre y la descripción accesibles que recibe un lector de pantalla.
- Elegir entre `role="status"` y `role="alert"` para un aviso, y explicar con la especificación por qué la región viva tiene que existir **antes** de que llegue el mensaje.
- Leer en el árbol de accesibilidad de Chrome si un campo es obligatorio o inválido y si una región viva se lee entera, antes y después de un cambio.

## El porqué antes del cómo

Hasta la lección 6, el `revisor` solo **leía**: pedía el reporte, pedía el detalle, y el único cambio que mandaba a la API era un clic en «Volver a revisar», sin datos. Dar de alta un servicio es otra clase de problema, porque la persona escribe, y lo que escribe puede estar mal de muchas formas a la vez. Pregúntale al panel cuatro cosas y verás qué falta.

**¿Dónde vive lo que se escribe mientras se escribe?** Un campo de texto ya guarda su valor; el navegador lo hace desde siempre. Puedes dejar que lo guarde él y leerlo al enviar, o copiar cada tecla a un estado de React. Las dos formas funcionan y las dos tienen costo. Elegir sin saber cuál es cuál lleva a formularios que avisan en la consola, que pierden lo escrito o que vuelven a dibujarse en cada tecla sin necesidad.

**¿Quién se encarga del envío?** Enviar no es una línea de código. Es evitar que el navegador recargue la página, juntar los valores, mostrar que algo está en curso, no permitir un segundo envío mientras tanto, esperar la respuesta, convertirla en errores o en éxito, y actualizar la lista de servicios que otra página muestra. React 19 trae piezas para cada uno de esos pasos, y esta lección las usa en lugar de reinventarlas.

**¿Quién decide si un valor es válido?** El panel ya valida lo que **llega** de la API con guardas como `esReportePublico`. Lo que la persona escribe también es una entrada de una frontera, y merece el mismo trato. El curso de TypeScript enseñó a hacerlo con esquemas; aquí se reutilizan, con una diferencia que importa: un formulario no puede detenerse en el primer error.

**¿Cómo se entera quien no ve la pantalla?** Es la escena del principio. Un borde rojo y un texto debajo del campo son información **visual**. Para que un lector de pantalla la anuncie, el texto tiene que estar **relacionado** con el campo, y el mensaje de «revisa los campos» tiene que vivir en un lugar que el lector vigila. Eso no se logra con buena intención: se logra con atributos concretos, definidos en una especificación del W3C, y se puede medir.

Las cuatro respuestas caben en tres conceptos: el campo no controlado (7.1), el formulario como **acción** (7.2) y la accesibilidad del formulario y de sus avisos (7.3). La sección 7.4 junta todo en el `revisor` y lo revisa contra las fuentes, punto por punto. Al final, esto es lo que dibuja `/servicios/nuevo` (salida de Chrome sin ventana, solo el formulario):

```text
<form action="javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')" novalidate="" aria-describedby="resultado-alta"><div class="campo"><label for="nombre">Nombre</label><input id="nombre" required="" aria-invalid="false" aria-describedby="nombre-ayuda" type="text" value="" name="nombre"><p id="nombre-ayuda" class="ayuda">Un nombre corto y único, por ejemplo: correo</p></div><div class="campo"><label for="url">Dirección</label><input id="url" required="" aria-invalid="false" aria-describedby="url-ayuda" type="url" value="" name="url"><p id="url-ayuda" class="ayuda">La dirección que se va a revisar, con http:// o https://</p></div><div class="campo"><label for="timeoutMs">Tiempo límite (ms)</label><input id="timeoutMs" required="" aria-invalid="false" aria-describedby="timeoutMs-ayuda" type="text" value="" name="timeoutMs"><p id="timeoutMs-ayuda" class="ayuda">Cuántos milisegundos esperar antes de declarar la falla, por ejemplo: 1500</p></div><button type="submit" aria-disabled="false">Dar de alta</button></form><div id="resultado-alta"><div role="alert"></div></div>
```

Cada atributo de ese HTML tiene una razón, y al terminar la lección vas a poder decir cuál. Solo uno no lo escribiste tú: el `action="javascript:throw new Error(…)"` del `<form>`. Es la marca que React pone cuando `action` es una función. Nunca se ejecuta en un envío normal, porque React intercepta el envío antes; solo se dispararía si alguien llamara a `form.submit()` a mano, que se salta el evento de envío, y entonces el error explica qué pasó y sugiere `requestSubmit()`. Y los `value=""` son el reflejo de `defaultValue` en el HTML, no un campo controlado.

## Los conceptos

### 7.1 Controlado o no controlado

#### 7.1.1 El navegador ya guarda lo que escribes

Un `<input>` del navegador tiene su propio valor. Si escribes en él, el valor cambia sin que nadie programe nada. React te deja trabajar de dos maneras con ese hecho, y la documentación de `<input>` las nombra así ([React, `<input>`](https://react.dev/reference/react-dom/components/input)):

- **No controlado.** Escribes `<input defaultValue="correo" />`. React pone el valor **inicial** y después se aparta: lo que la persona escriba vive en el elemento del DOM, y lo lees cuando lo necesitas (al enviar, por ejemplo). La documentación lo dice con precisión: aunque pases un valor inicial, tu JSX «solo especifica el valor inicial; no controla cuál debe ser el valor ahora».
- **Controlado.** Escribes `<input value={nombre} onChange={…} />`. React fuerza al campo a mostrar **siempre** el valor que le pasas. Cada tecla dispara `onChange`, tú actualizas el estado, React vuelve a dibujar y el campo muestra el valor nuevo. Si no actualizas el estado, el campo no cambia.

La primera figura pone los dos lado a lado, más un tercero que mezcla mal las dos ideas: un `value` sin `onChange`. En los tres, la figura «escribe» `correo2` como lo haría una persona (cambia el valor y dispara el evento `input`) y lee qué quedó. El controlado tiene una vuelta de tuerca para que se note quién manda: su `onChange` guarda el texto en mayúsculas.

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
      <input aria-label="controlado" value={nombre} onChange={(e) => establecerNombre(e.target.value.toUpperCase())} />
      <output>{nombre}</output>
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
  console.log(`  escribí «${texto}» → el campo dice «${campo.value}»`);
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
  escribí «correo2» → el campo dice «CORREO2»
3. value sin onChange:
  [aviso de React] You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
  escribí «correo2» → el campo dice «correo»
```

Lee los tres renglones de abajo hacia arriba, que es como se entienden mejor:

- **El tercero** recibió `correo2` y volvió a `correo`. React lo devolvió, porque `value="correo"` dice que el campo vale `correo` **siempre**, y nadie cambia ese valor. Antes de eso, React avisó en la consola con un mensaje que vale la pena leer entero: diste un `value` sin `onChange`, eso deja el campo de solo lectura; si debe poder cambiar, usa `defaultValue`; si no, agrega `onChange` o `readOnly`. Es el aviso de esta sección, y su arreglo depende de lo que querías.
- **El segundo** recibió `correo2` y muestra `CORREO2`. El valor del campo es el que **tu** estado decidió, no el que se escribió. Eso es «controlado»: puedes transformar, rechazar o limitar cada tecla.
- **El primero** recibió `correo2` y muestra `correo2`. React no intervino.

Hay un cuarto caso que la figura no provoca, pero que la documentación nombra: un campo no puede pasar de no controlado a controlado durante su vida. Si un `value` empieza en `undefined` (por ejemplo, porque el estado aún no tiene dato) y luego recibe un texto, React avisa que un componente «está cambiando un campo no controlado a controlado». El arreglo es que `value` sea un texto desde el primer dibujo, aunque sea `""`.

#### 7.1.2 Cuál conviene a este formulario

La documentación de React no declara un ganador, y este curso tampoco: es un criterio propio, con una regla práctica. **Controla un campo cuando la pantalla necesita su valor mientras se escribe**: un buscador que filtra la lista con cada letra (como el de la Lección 5, que además guarda el texto en la dirección), un contador de caracteres, un botón que se habilita cuando el campo deja de estar vacío. **Déjalo sin controlar cuando solo importa al enviar.**

El alta del `revisor` es del segundo tipo. Nadie necesita el nombre del servicio mientras se escribe; se necesita completo, junto con los otros dos campos, en el momento de enviar. Controlar los tres significaría tres estados, tres `onChange` y un dibujo del formulario completo por cada tecla, para terminar haciendo lo mismo que hace el navegador gratis. Por eso el `Campo` del punto de control es **no controlado**, con `defaultValue`. La siguiente sección muestra la pieza que lo vuelve cómodo: React lee los valores por ti al enviar, en un `FormData`, y además usa `defaultValue` de una manera que no es obvia y que la figura 3 mide.

### 7.2 El formulario como acción

#### 7.2.1 `<form action>` recibe una función

En HTML, el atributo `action` de un formulario es una **dirección**: al enviar, el navegador manda los campos a esa dirección y carga la respuesta como página nueva. React 19 extiende ese atributo: si en lugar de una dirección le pasas una **función**, React intercepta el envío, junta los campos en un `FormData` y llama a tu función con él. La documentación de `<form>` lo describe en tres frases que conviene leer juntas ([React, `<form>`](https://react.dev/reference/react-dom/components/form)): la función maneja el envío dentro de una *Transition*; puede ser asíncrona y recibe un solo argumento con los datos del formulario; y, a diferencia de `onSubmit`, no hace falta llamar a `e.preventDefault()`.

Una *Transition* es la forma en que React marca una actualización como «no urgente»: mientras dura, React puede seguir respondiendo a la persona y sabe que hay algo **pendiente**. Cuando la función que corre dentro de una *Transition* se llama «acción» (*Action*), React le da tres regalos que esta lección usa: un estado que guarda lo que devolvió la última acción (`useActionState`), una bandera de «pendiente» para los componentes de adentro del formulario (`useFormStatus`) y un estado temporal que se muestra mientras la acción no termina (`useOptimistic`).

Hay dos detalles más del mismo documento que vas a ver en el código. El primero: cuando `action` es una función, el método HTTP es `POST` sin importar el atributo `method`. Esto es casi siempre irrelevante, porque el navegador no envía nada por su cuenta; tu función decide qué pedir y cómo. El segundo, y el que más sorprende: **«después de que la función `action` termina bien, todos los campos no controlados del formulario se reinician»**. La figura 3 lo pone a prueba.

#### 7.2.2 `useActionState`: el resultado de la última acción

Un formulario necesita recordar qué pasó con el último envío: si hubo errores y cuáles, o si el alta salió bien. `useActionState` es el hook que lo guarda ([React, `useActionState`](https://react.dev/reference/react/useActionState)). Recibe una función y un estado inicial, y devuelve tres cosas: el estado actual, una función para disparar la acción y una bandera `isPending`.

```tsx
// fragmento
const [estado, accion] = useActionState(enviar, estadoInicialFormulario);
// …
<form action={accion}>
```

La función que le pasas recibe **dos** argumentos: el estado anterior y lo que se envió (aquí, el `FormData`). Lo que devuelve se convierte en el estado nuevo. Si te suena a un reducer, es porque lo es, con una diferencia: puede ser asíncrono y puede tener efectos, como pedirle algo a la API. La documentación lo dice al revés de lo que esperarías de la Lección 6: esta función **no** se llama dos veces bajo `StrictMode`, precisamente porque está pensada para tener efectos. Un detalle que confunde a mucha gente la primera vez: como el estado anterior es el primer argumento, el `FormData` es el **segundo**. La documentación lo aclara en su sección de problemas comunes, porque es justo lo contrario de lo que pasa cuando le das a `action` una función suelta, sin `useActionState`, que recibe el `FormData` como único argumento. En el punto de control, el primer argumento se llama `_previo`: el guion bajo dice «lo recibo, pero no lo uso».

Dos reglas más de la misma página que el punto de control respeta. El tipo de lo que devuelve la función tiene que ser el mismo que el del estado inicial: por eso existe un tipo `EstadoFormulario` con sus tres variantes, y el estado inicial es una de ellas. Y **si la función lanza un error, React cancela las acciones en cola y muestra el límite de error más cercano**. En el `revisor`, la función atrapa todo lo que puede fallar y lo convierte en un estado `con-errores`, así que ese camino no se recorre; pero si algún día se escapa un error, quien lo atrapa es el límite de error de la ruta de la [Lección 5](05-rutas-url-como-estado.md), no una pantalla en blanco.

Este es el estado del formulario. Tres variantes, una por cada cosa que puede haber pasado:

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

`textos` guarda **lo que la persona escribió**, tal cual, como texto. No es lo mismo que el valor validado: `timeoutMs` se escribe como `"1500"` y se envía como el número `1500`. Guardar los textos sirve para devolvérselos a los campos cuando hay errores, y ahí entra el reinicio.

#### 7.2.3 El reinicio que borra lo escrito

La frase de la documentación de `<form>` tiene una consecuencia práctica inmediata: «termina bien» quiere decir «la función no lanzó un error», **no** «el alta salió bien». Si tu función valida, encuentra tres errores y devuelve un estado `con-errores`, para React terminó bien, y React reinicia los campos. La persona ve sus errores… y los campos vacíos. Tiene que volver a escribir todo, incluido lo que estaba bien.

¿A qué valor se reinicia un campo? Al de `defaultValue`. Y aquí está el truco que usa el punto de control: React vuelve a dibujar el formulario con el estado nuevo **antes** de reiniciarlo, así que si `defaultValue` sale del estado, el campo se reinicia a lo que la persona había escrito. La figura 3 lo mide con un formulario mínimo: escribe `correo`, envía, y lee el campo cuando la acción terminó. Lo hace dos veces, con `defaultValue` fijo en `""` y con `defaultValue` tomado del estado. De paso, anota qué vio `useFormStatus` desde dos lugares, que es el tema de 7.2.4.

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

Con `defaultValue` fijo, el campo quedó vacío; con `defaultValue` desde el estado, conservó `correo`. Es exactamente lo que hace el `revisor`: cuando el estado es `con-errores`, cada `Campo` recibe como `valorInicial` el texto que la persona escribió. Cuando el estado es `agregado`, los textos vuelven a `""` y el formulario queda limpio para la siguiente alta, que es lo que quieres después de un éxito.

Para que el formulario de la figura se pudiera enviar en un DOM de prueba, hubo que decirle a Node que use el `FormData` de jsdom (`FormData: dom.window.FormData`): sin esa línea, React construye el `FormData` con el de Node, que no sabe leer un formulario de jsdom, y el envío falla con `FormData constructor: Argument 1 could not be converted`. Es un detalle de la figura, no del navegador, pero si alguna vez lo ves, ya sabes de dónde sale.

#### 7.2.4 `useFormStatus`: el botón sabe que hay un envío en curso

Mientras la acción espera a la API, la persona tiene que ver que algo está pasando, y no debe poder enviar dos veces. `useFormStatus` responde a la pregunta «¿el formulario en el que estoy tiene un envío pendiente?» ([React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)). Se importa de `react-dom`, no de `react`, y devuelve `pending`, `data`, `method` y `action`.

La palabra que importa es **en el que estoy**. La documentación lo advierte con un título propio: `useFormStatus` solo informa sobre un `<form>` **padre**, y no sobre un `<form>` dibujado en el mismo componente que llama al hook. La figura 3 lo midió en los dos lugares: el componente `Formulario`, que dibuja el `<form>`, vio siempre `mismo=false`; el componente `Boton`, que se dibuja **dentro** del `<form>`, vio `hijo=false` y después `hijo=true`. Por eso el botón de envío del `revisor` es un componente aparte:

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

El texto cambia a «Dando de alta…» para quien mira, y el botón cierra la puerta al segundo envío. Es un `<button type="submit">` de HTML: se activa con Enter desde cualquier campo y con Espacio o Enter cuando tiene el foco, sin una línea de JavaScript. Esa es la primera aparición de una idea que vuelve en 7.3: lo nativo trae comportamiento que ARIA no trae.

Lo que **no** usa es `disabled`, y la razón se midió. La forma obvia de impedir el segundo envío es `disabled={pending}`, y así estaba escrito al principio. Un botón desactivado no puede tener el foco, y eso tiene un costo que solo se ve con el teclado. Con Chrome manejado por su protocolo de depuración, el formulario lleno con datos válidos, el foco en el botón y la tecla Espacio, esto midió el guion con `disabled={pending}`:

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
pendiente: foco en body; «Dando de alta…» disabled=true aria-disabled=null opacity=1 cursor=default
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=(ausente) focused=(ausente)
segundo Espacio mientras está pendiente
al terminar: foco en body; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

Mientras el alta estaba pendiente, el foco ya estaba en el `body` y el árbol de accesibilidad dejó de decir que el botón tenía el foco; al terminar, el foco no volvió. Para un lector de pantalla, el foco desapareció de la página en el momento de enviar. (Mayús+Tab sí regresó a «Tiempo límite (ms)», porque Chrome recuerda desde dónde se fue el foco; aun así, quien escucha ya no sabe dónde está.) Con Enter **desde un campo** no pasa, porque el foco se queda en el campo.

El botón del punto de control usa `aria-disabled`, que **anuncia** «no disponible» sin quitarle el foco, y cancela el clic mientras hay un envío pendiente. Cancelar el clic basta: Espacio y Enter sobre el botón llegan como un clic, y el estándar HTML define el envío implícito con Enter desde un campo como un evento `click` sobre el botón de envío del formulario ([WHATWG, HTML, «Implicit submission»](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)). El mismo guion, con el punto de control:

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
pendiente: foco en button; «Dando de alta…» disabled=false aria-disabled=true opacity=0.6 cursor=not-allowed
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=true focused=true
segundo Espacio mientras está pendiente
al terminar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

El foco se quedó en el botón durante y después del envío; el árbol de accesibilidad lo da como `disabled=true` (que el lector anuncia como «no disponible» o «atenuado») y a la vez `focusable=true` y `focused=true`; y el botón **se ve** desactivado, con `opacity=0.6` y el cursor `not-allowed`, por una regla nueva de la hoja de estilos (`button[aria-disabled="true"]`). Ojo con lo que `aria-disabled` no hace: no desactiva nada, solo lo dice. MDN lo explica así: a diferencia de `disabled`, `aria-disabled="true"` **solo** expone el elemento como desactivado; quien desarrolla tiene que suprimir su funcionamiento y cambiar su aspecto, y el atributo no cambia que se pueda enfocar ([MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)). La misma página advierte que el estilo de «desactivado» debe seguir cumpliendo el contraste de color; el `opacity: 0.6` del punto de control no se midió contra ese criterio. Se comprobó quitando `onClick={alPulsar}` en una copia: el segundo Espacio sí se envió, y la bitácora de la API registró dos altas seguidas, la segunda rechazada por repetida:

```text
09:10:21.186 POST /api/servicios 201
09:10:21.491 POST /api/servicios 409
```

(Los dos primeros renglones son de las corridas anteriores; los dos últimos, de la copia sin la guarda.) Con la guarda, cada corrida dejó un solo `POST`. Es la misma idea de 7.3.1 vista desde el otro lado: ARIA describe, no actúa, y el comportamiento lo tienes que escribir tú. Todo esto se midió solo en Chrome.

#### 7.2.5 `useOptimistic`: mostrar lo que todavía no confirma la API

El alta tarda 300 ms en la API de práctica, y en una red lenta puede tardar mucho más. Mientras tanto, la persona puede ver el servicio en una lista «Altas de esta sesión», marcado como pendiente. Ese estado que se muestra **antes** de la confirmación es lo que la documentación llama optimista ([React, `useOptimistic`](https://react.dev/reference/react/useOptimistic)).

`useOptimistic(valor, reductor)` devuelve un par: el estado que se muestra y una función para cambiarlo. Su regla central es una frase de la documentación: el estado optimista **solo se dibuja mientras una acción está en curso; si no, se dibuja `valor`**. No hay que «limpiarlo»: cuando la acción termina, el estado optimista y el real coinciden en el mismo dibujo. Y la función que lo cambia tiene que llamarse **dentro de una acción**; si la llamas fuera, React avisa con `An optimistic state update occurred outside a Transition or Action` y el estado optimista aparece y desaparece en un instante.

En el `revisor`, el valor real es `altas`, un estado con las altas confirmadas de esta sesión, y el reductor agrega un nombre marcado como `pendiente`. El reductor ignora un nombre que ya está en la lista. Así, si el alta de `correo` se confirmó una vez y alguien vuelve a intentar `correo`, la lista no muestra una segunda fila pendiente mientras la API decide (y la API responderá `409`).

#### 7.2.6 El estado que cambia después de un `await`

La frase «el estado optimista y el real coinciden en el mismo dibujo» tiene una condición, y la documentación de `useActionState` la escribe en sus advertencias: si cambias el estado **después de un `await`** dentro de la acción, por ahora tienes que envolver ese cambio en un `startTransition` adicional ([React, `useActionState`](https://react.dev/reference/react/useActionState)). La razón es que lo que viene después de un `await` ya no corre «dentro» de la acción a los ojos de React: es una actualización urgente que se dibuja de inmediato, aunque la acción siga pendiente.

En el alta, `establecerAltas` va después de `await darDeAlta(…)`. Para ver qué pasa sin `startTransition`, se quitó en una copia el descarte de duplicados del reductor (que, si no, lo tapa) y se dio de alta un servicio en Chrome, con el servidor de desarrollo, registrando cada versión de la lista «Altas de esta sesión» y la consola:

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo3 (agregando…)»]
  [«correo3», «correo3 (agregando…)»]
  [«correo3»]
consola:
  error: Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. correo3
```

En medio aparecieron **dos** filas con el mismo nombre, una confirmada y otra todavía «agregando…», y React avisó en la consola que dos hijos tenían la misma `key` (el `` `%s` `` es el hueco del mensaje donde va la clave; la herramienta de medición lo imprimió tal cual y puso la clave, `correo3`, al final). Es la actualización urgente dibujándose encima del estado optimista, que seguía vivo porque la acción no había terminado. La misma copia, sin descarte de duplicados pero con el cambio envuelto en `startTransition`:

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo4 (agregando…)»]
  [«correo4»]
consola:
```

Una fila pendiente y luego la confirmada, sin pasos intermedios y sin aviso. El punto de control lleva `startTransition` alrededor de los dos cambios que siguen al `await` (las altas y el aviso de la bandeja), y conserva el descarte de duplicados para lo que sí le toca: el nombre repetido del párrafo anterior. Es una medición de una corrida en Chrome; lo que la respalda en general es la advertencia de la documentación.

#### 7.2.7 El formulario completo

Este es el componente que junta las piezas. Léelo de arriba abajo con esta guía: los dos hooks de estado (`altas` y su versión optimista); la función `enviar`, que es la acción; `useActionState`; y el JSX, con el formulario, la región de errores y la lista optimista.

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

La función `enviar` sigue el orden de una frontera, el mismo que `cargarReporte` sigue con la respuesta de la API: primero lee (`textosDe`), después valida (`validarCampos`), y solo con datos válidos hace algo. Si la validación falla, la API **no se llama**: los errores se devuelven en el estado y no hay ninguna petición. Si la validación pasa, se agrega la fila optimista, se envía, y la respuesta se traduce en uno de tres finales:

1. La API rechazó el alta (`400` o `409`): estado `con-errores`, con los errores **de la API** por campo y los textos para no perder lo escrito.
2. La API aceptó (`201`): dentro de `startTransition`, se agrega el alta confirmada y se manda el aviso de éxito a la bandeja de la Lección 6, que es el **único** anuncio del éxito (7.3.3 explica por qué); después se invalida la consulta `["reporte"]` para que la lista de `/` traiga el servicio nuevo la próxima vez que se vea, y el estado pasa a `agregado`.
3. Algo falló de otra forma (la red, una respuesta inesperada): el `catch` la convierte en `con-errores` con un mensaje general, sin errores por campo.

`noValidate` en el `<form>` apaga la validación del navegador. La documentación de MDN describe el atributo como «el formulario no se debe validar al enviarse» ([MDN, `<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)). Se apaga porque el formulario hace la suya, con los mensajes del esquema y con todos los errores a la vez; si se dejara encendida, el navegador detendría el envío en el primer campo con un globo propio, distinto en cada navegador, y la acción no se ejecutaría.

#### 7.2.8 Validar con el esquema: todos los errores a la vez

El esquema llega del curso de TypeScript casi igual. Un `Esquema<T>` es un objeto con un método `leer` que recibe `unknown` y devuelve un resultado: o un valor de tipo `T`, o un detalle del error. `Inferir` saca el tipo `T` de un esquema, para no escribirlo dos veces. A los esquemas de allá se suman dos que este formulario necesita: `urlHttp`, que acepta solo direcciones `http:` o `https:` y las normaliza con `URL`, y `enteroPositivoDeTexto`, que lee un número escrito como texto, porque **todo lo que sale de un `FormData` es texto**.

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

La diferencia que importa está al final, en `validarCampos`. En TypeScript, el esquema de un objeto se detenía en el primer campo inválido, y para una API eso está bien: rechaza la petición y explica la primera razón. Un formulario no puede hacer eso. Si la persona dejó vacío el nombre **y** escribió mal la dirección, decirle solo lo primero la obliga a enviar, corregir, enviar otra vez y descubrir el segundo error. La figura 2 compara las dos estrategias con el mismo envío inválido:

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

Tres errores encontrados de una vez contra uno. Y el último renglón muestra la normalización: `" https://correo.example "` sale como `https://correo.example/`, sin espacios y con la `/` final que agrega `URL`. Ese es el valor que viaja a la API.

El esquema del alta junta tres esquemas en un objeto y deriva de él los tres tipos que usa el formulario: los valores validados, los errores por campo y los textos crudos.

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

// Si el contrato y el esquema dejan de coincidir, esta línea deja de compilar.
export const comprobarContrato: (valores: ValoresAlta) => NuevoServicio = (valores) => valores;
```

La última línea merece una lectura lenta, porque no hace nada en ejecución y, sin embargo, es la más importante del archivo. `comprobarContrato` es una función que recibe `ValoresAlta` y lo devuelve como `NuevoServicio`, el tipo que la API espera según `src/compartido/contrato.ts`. Si alguien cambia el esquema (agrega un campo, lo renombra o cambia su tipo) y deja de coincidir con el tipo de la API, esa asignación deja de compilar y `npm run build` se detiene en `tsc -b`. En «El error que vas a ver» lo vas a provocar.

#### 7.2.9 La frontera de red del alta

`darDeAlta` hace con la respuesta del `POST` lo mismo que `cargarReporte` hace con la del `GET`: no confía en ella. Traduce los tres códigos que la API documenta y lanza un error para cualquier otro. Hay un caso que se escapa antes: si el cuerpo no es JSON (por ejemplo, porque el servidor de práctica está apagado y el que responde es el *proxy* de Vite), el error lo lanza `respuesta.json()`, y el mensaje que verás en la región de errores es el de JavaScript, no «la API respondió …». Esto se deduce del código; no se midió.

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

El caso interesante es el `409`. La API responde `{"detalle":"ya existe un servicio llamado correo","campos":{"nombre":"ese nombre ya existe"}}`, y `erroresDe` convierte `campos` en un `ErroresAlta`. Así, un error que **solo la API puede saber** (el formulario no conoce los nombres que ya existen) aparece junto al campo correcto, con el mismo aspecto y la misma accesibilidad que un error de validación local. Para el formulario no hay diferencia entre «el esquema dijo que no» y «la API dijo que no»: los dos llegan como errores por campo.

### 7.3 Accesibilidad: lo nativo primero, ARIA donde lo nativo no alcanza

#### 7.3.1 La primera regla de ARIA

ARIA (*Accessible Rich Internet Applications*) es una especificación del W3C que agrega atributos al HTML para describir a las tecnologías de asistencia —un lector de pantalla, por ejemplo— lo que un elemento **es** (`role`), en qué **estado** está (`aria-invalid`) y con qué **se relaciona** (`aria-describedby`). La guía del W3C para usarla empieza con una regla, la primera, que este curso toma al pie de la letra: si puedes usar un elemento o atributo nativo de HTML que ya trae la semántica y el comportamiento que necesitas, en lugar de reutilizar otro elemento y agregarle un rol, un estado o una propiedad de ARIA, hazlo ([W3C, «Using ARIA»](https://www.w3.org/TR/using-aria/)). La segunda regla complementa: no cambies la semántica nativa salvo que de verdad tengas que hacerlo.

La razón está en una frase de la guía de prácticas de ARIA: a diferencia de los elementos de formulario de HTML, los roles de ARIA **no hacen que el navegador agregue comportamiento de teclado ni estilos** ([W3C, «ARIA Authoring Practices Guide: Read Me First»](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)). Un `<div role="button">` le dice al lector de pantalla «soy un botón», pero no responde a Enter, no entra en el orden de tabulación y no envía el formulario. Un `<button type="submit">` hace las tres cosas sin pedir nada. La misma guía lo resume en el título de su sección: «ningún ARIA es mejor que un mal ARIA».

En el formulario del `revisor`, lo nativo resuelve casi todo:

- **`<label htmlFor>`** da nombre a cada campo. MDN describe dos ventajas: el lector de pantalla lee la etiqueta cuando el campo recibe el foco, y al hacer clic en la etiqueta el foco pasa al campo, lo que agranda la zona donde se puede tocar ([MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)). En JSX, el atributo `for` se escribe `htmlFor`.
- **`<button type="submit">`** envía con Enter desde cualquier campo, entra solo en el orden de tabulación y se puede desactivar con `disabled`.
- **El orden del documento** es el orden de tabulación. MDN lo dice para los elementos enfocables sin `tabindex` positivo: el orden de navegación del foco es el orden en el código fuente ([MDN, `tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex)). Por eso el formulario no usa un solo `tabindex`: los campos están escritos en el orden en que se llenan.
- **`:focus-visible`** marca dónde está el foco cuando la persona navega con el teclado. MDN lo define como la pseudoclase que aplica cuando el elemento tiene el foco y el navegador determina, por heurística, que ese foco debe hacerse evidente ([MDN, `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)). En la práctica: en un botón o un enlace aparece al tabular y no al hacer clic con el ratón; en un campo de texto aparece también con el clic, porque el navegador supone que vas a escribir y necesitas ver dónde. MDN pone justo ese ejemplo: un botón que se pulsa con el ratón en general no muestra el foco, y un campo de texto que espera lo que escribas, sí.

ARIA entra en dos lugares donde HTML no tiene un equivalente: relacionar un campo con su error, y avisar de un cambio que ocurrió lejos del foco.

#### 7.3.2 El campo: `aria-invalid` y `aria-describedby`

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

Una relación o un estado por atributo:

- **`htmlFor={nombre}` con `id={nombre}`**: el nombre accesible del campo es su etiqueta.
- **`required`**: el campo es obligatorio. Es el atributo nativo de HTML, y por eso no se escribe `aria-required`: WAI-ARIA define `aria-required` como «se necesita una entrada en el elemento antes de enviar el formulario» y nombra como concepto relacionado el `required` de HTML ([W3C, WAI-ARIA 1.2, `aria-required`](https://www.w3.org/TR/wai-aria-1.2/#aria-required)), y la especificación que traduce HTML a la API de accesibilidad de cada sistema operativo expone `required` igual que `aria-required` ([W3C, «HTML Accessibility API Mappings»](https://www.w3.org/TR/html-aam-1.0/)). Con `noValidate` en el formulario, el navegador ya no detiene el envío por un campo vacío, pero el atributo sigue diciendo «obligatorio». Se midió en el árbol de accesibilidad de Chrome (7.4.2): sin el atributo, los tres campos salían con `required=false`; con él, con `required=true`.
- **`aria-invalid`**: el estado. La especificación lo define como «el valor ingresado no tiene el formato que la aplicación espera» y pide al autor que lo ponga en `true` cuando el valor se calcula inválido ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). El lector lo anuncia como «inválido» o «entrada no válida», según el lector.
- **`aria-describedby`**: la explicación. La especificación lo define como el atributo que identifica el elemento, o los elementos, que **describen** al objeto, y distingue la etiqueta, que debe ser concisa, de la descripción, pensada para dar información más detallada ([W3C, WAI-ARIA 1.2, `aria-describedby`](https://www.w3.org/TR/wai-aria-1.2/#aria-describedby)). Recibe una lista de identificadores separados por espacios, y la especificación que calcula los textos accesibles los junta **en ese orden**, separados por un espacio ([W3C, «Accessible Name and Description Computation 1.2»](https://www.w3.org/TR/accname-1.2/)). Por eso el error va primero: `nombre-error nombre-ayuda` se lee «escribe un valor», y después la ayuda.

La figura 4 dibuja una copia reducida del `Campo` (las mismas relaciones, sin `type`, `required` ni clases) sin error, con error y, para comparar, una versión «a la antigua» con un texto encima y otro debajo, sin `<label>` ni relaciones. Para cada uno calcula el nombre y la descripción accesibles con `dom-accessibility-api`, una librería que implementa ese cálculo del W3C:

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

Lo que lee un lector de pantalla al llegar al campo es, en esencia, esos dos renglones más el rol y el estado: «Nombre, campo de texto, inválido, escribe un valor. Un nombre corto y único, por ejemplo: correo». La versión sin relaciones tiene **nombre vacío y descripción vacía**: visualmente dice lo mismo, pero para quien no ve la pantalla es un campo de texto sin nombre. Esa es la escena del principio, medida. (La figura calcula lo que **la especificación** dice que el navegador debe exponer; cómo lo pronuncia cada lector de pantalla no se puede medir con una corrida, y se comprueba a mano.)

Hay tres decisiones del componente que tienen su fuente:

- **`aria-invalid` vale `false` hasta que se intenta enviar.** El campo arranca sin error, así que el atributo sale como `aria-invalid="false"`, y solo pasa a `true` cuando un envío devolvió un error para ese campo. La especificación lo recomienda para los obligatorios vacíos: si la persona no ha intentado enviar el formulario, el autor **no debería** marcar como inválido un campo obligatorio solo porque todavía no tiene datos ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). Es un «no debería» (*SHOULD NOT*), no una prohibición, y habla del campo vacío: marcar un formato inválido antes de enviar, por ejemplo al salir del campo, es otra decisión que la especificación no cierra. MDN lo explica con otras palabras: la persona puede seguir llenándolo ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). Con `required` había una duda: la misma tabla de HTML-AAM permite al navegador exponer un campo obligatorio vacío como inválido por su cuenta después de que la persona lo tocó. Se midió en Chrome: al entrar a «Nombre» y salir con Tab sin escribir, el árbol de accesibilidad siguió diciendo `invalid=false` en los tres campos. Otros navegadores no se midieron.
- **El texto del error está escrito, no solo pintado.** El borde rojo (`input[aria-invalid="true"]` en la hoja de estilos) ayuda a quien ve, pero el criterio 3.3.1 de las pautas WCAG 2.2 pide que, si se detecta un error de captura, el elemento con error se identifique y el error **se describa en texto** ([W3C, «Understanding SC 3.3.1: Error Identification»](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)). Y un color no llega a quien no distingue el rojo.
- **`aria-describedby` y no `aria-errormessage`.** ARIA 1.2 tiene un atributo específico para el mensaje de error, `aria-errormessage`, que MDN describe como el que identifica el elemento que contiene el mensaje de error y que solo se usa cuando `aria-invalid` es `true` ([MDN, `aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage)). El punto de control usa `aria-describedby` porque el campo ya necesita una descripción para su ayuda, y porque es el patrón que muestra el tutorial de formularios del W3C para asociar un campo con su mensaje de error ([W3C WAI, «Forms Tutorial: User Notifications»](https://www.w3.org/WAI/tutorials/forms/notifications/)). Es una elección del curso; las dos formas tienen respaldo.

#### 7.3.3 El aviso: regiones vivas

El campo resuelve el error **donde está el foco**. Pero después de presionar Enter, el foco sigue en el botón o en el último campo, y el mensaje «Revisa los campos marcados.» aparece en otra parte de la página. Si nada lo anuncia, Raúl no se entera. Es para esto que existen las **regiones vivas** (*live regions*): partes de la página que la tecnología de asistencia vigila, y cuyos **cambios** anuncia aunque el foco esté en otro lado.

El criterio 4.1.3 de WCAG 2.2 lo pide para los mensajes de estado: deben poder determinarse por rol o propiedades, para que la tecnología de asistencia los presente **sin que reciban el foco** ([W3C, «Understanding SC 4.1.3: Status Messages»](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)). ARIA ofrece dos roles para eso, y el formulario usa los dos:

- **`role="status"`**: según la especificación, una región viva con información de aviso que no es tan importante como para justificar una alerta, con `aria-live` implícito en `polite` y `aria-atomic` implícito en `true` ([W3C, WAI-ARIA 1.2, `status`](https://www.w3.org/TR/wai-aria-1.2/#status)). «Educado» quiere decir que el lector espera a terminar lo que está diciendo. MDN agrega una indicación: no le des el foco al estado cuando su contenido cambia ([MDN, rol `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).
- **`role="alert"`**: una región viva con información importante y, en general, urgente; `aria-live` implícito en `assertive` y `aria-atomic` en `true` ([W3C, WAI-ARIA 1.2, `alert`](https://www.w3.org/TR/wai-aria-1.2/#alert)). «Asertiva» quiere decir que interrumpe. MDN advierte que, por su naturaleza intrusiva, debe usarse con moderación y solo cuando se requiere la atención inmediata de la persona ([MDN, rol `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)).

El formulario usa `alert` para «Revisa los campos marcados.» y para los rechazos de la API, porque la persona no puede seguir sin atenderlos. El éxito es una buena noticia que puede esperar a que el lector termine, así que va en un `status`, y aquí hay una decisión que se tomó midiendo. La bandeja de la Lección 6 ya es un `role="status"`, y el alta le manda su aviso. Si el formulario tuviera además su propio `status` con «Se dio de alta correo.», el éxito llegaría **dos veces**. Así se midió en Chrome, observando las regiones vivas mientras se daba de alta un servicio, con el formulario que tenía las dos:

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo Descartar»
  status (formulario): «Se dio de alta correo.»
```

Y con el formulario del punto de control, que deja el éxito solo a la bandeja:

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo5 Descartar»
```

Un solo cambio, en un solo lugar. MDN advierte, a propósito de las alertas, que varios avisos a la vez crean una mala experiencia ([MDN, rol `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)); con avisos educados el problema es más suave, pero es el mismo: la persona escucha la misma noticia dos veces. Se eligió la bandeja y no el formulario porque la bandeja es el lugar de los avisos de toda la aplicación (también recibe los del reintento) y porque el aviso sobrevive si la persona se va de la página.

`aria-atomic` decide **cuánto** se lee. Con `true`, implícito en `alert` y en `status`, el lector presenta la región **entera** cada vez que cambia, aunque solo haya cambiado una parte ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Para el mensaje de una línea del formulario es lo que se quiere. Para la bandeja, no: es una lista que crece hasta cinco avisos, cada uno con su botón «Descartar», y con `true` el quinto aviso haría que el lector repitiera los cinco. Por eso la región de la bandeja lleva `aria-atomic="false"`, que deja anunciar solo lo agregado. El árbol de accesibilidad de Chrome lo confirma: antes, la región de la bandeja salía con `atomic=true`; con el atributo, con `atomic=false`, y la región de errores del formulario sigue con `atomic=true` (7.4.2 tiene las dos lecturas).

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

La regla que más se rompe con las regiones vivas está en la guía de MDN, y explica la forma del JSX: la tecnología de asistencia en general solo anuncia los cambios **dinámicos** del contenido de una región viva; hay que **establecer la región antes** de actualizar su contenido, empezar con la región vacía, y la forma más confiable es incluirla en el marcado inicial ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Por eso el punto de control no escribe esto:

```tsx
// fragmento: la región nace junto con su mensaje (no lo hagas así)
{estado.tipo === "con-errores" && <div role="alert">{estado.detalle}</div>}
```

sino esto, donde el `div` existe desde el primer dibujo y solo cambia lo de adentro (la bandeja hace lo mismo con su `role="status"`):

```tsx
// fragmento de FormularioAlta.tsx
<div role="alert">{estado.tipo === "con-errores" && <p>{estado.detalle}</p>}</div>
```

La misma guía de MDN reconoce que con `role="alert"` el contenido se anuncia «en la mayoría de los casos» aunque la región aparezca de golpe; pero «la mayoría de los casos» no es una regla, y con `status` no hay esa excepción. Escribir las regiones vacías desde el principio funciona para los dos roles.

El `<form>` tiene además `aria-describedby="resultado-alta"`, que apunta al contenedor de la región de errores. No es lo que hace el anuncio (eso lo hace el rol); es una descripción del formulario para quien llega a él navegando, que incluye el último error. Cuándo lee cada lector de pantalla la descripción de un formulario no está definido y no se midió: compruébalo a mano, y si oyes el error dos veces, es este atributo.

#### 7.3.4 Lo que una región viva no anuncia

Una región viva anuncia **cambios**. La figura 5 hace de oído: dibuja una región `role="alert"`, la observa con un `MutationObserver` (la API del navegador que avisa cuando el DOM cambia) y le manda tres envíos seguidos: dos con el mismo mensaje y uno distinto.

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

El componente se dibujó en los tres envíos, pero el DOM de la región solo cambió en el primero y en el tercero. En el segundo, React comparó el texto nuevo con el anterior, vio que eran iguales y no tocó nada: es la reconciliación de la Lección 1 haciendo exactamente su trabajo. Para un lector de pantalla, eso significa que **un segundo envío con el mismo error no se anuncia**. La figura mide el DOM, no el lector; que el lector calle cuando el DOM no cambia es lo que se deduce de la guía de MDN (anuncia cambios dinámicos), y se comprueba a mano. En el formulario del `revisor`, esto pasa si la persona presiona Enter dos veces sin corregir nada: la segunda vez el campo sigue marcado y su descripción sigue diciendo el error al llegar a él, pero no hay anuncio. Es el segundo Enter de Raúl, y el ejercicio 3 te pide resolverlo.

### 7.4 El alta en el `revisor` y su revisión contra las fuentes

#### 7.4.1 La página, la ruta y el enlace

La página es corta: pone el título de la pestaña con el hook de la Lección 3 y envuelve el formulario en la `Tarjeta` de la Lección 1, que le da un encabezado `<h2>` y una sección con nombre.

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

La ruta nueva se agrega entre las hijas de la disposición. El orden en el arreglo no decide cuál gana (React Router clasifica las rutas y un segmento fijo gana a uno dinámico, como se comprobó en la Lección 5), pero escribirla **antes** de `servicios/:nombre` deja a la vista, para quien lee, que `nuevo` es una dirección fija y no el nombre de un servicio. Fíjate también en `ErrorBoundary: ErrorDeRuta` en la ruta de afuera: es el límite de error de la Lección 5, el que atraparía un error que se escapara de la acción del formulario.

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

La disposición agrega un enlace en la navegación principal. Es un `NavLink` de la Lección 5, así que React Router le pone `aria-current="page"` cuando estás en `/servicios/nuevo`, y un lector de pantalla anuncia que es la página actual:

```tsx
// fragmento de revisor/src/app/Disposicion.tsx: lo único que cambia
<NavLink to="/servicios/nuevo">Dar de alta</NavLink>
```

Y la hoja de estilos crece con lo que el formulario necesita. Este es el bloque que se agrega al final de `src/reporte/panel.css`:

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

Tres reglas cuentan para la accesibilidad. `.campo input[aria-invalid="true"]` pinta el borde rojo **a partir del atributo de ARIA**, así que lo que ve quien mira y lo que oye quien escucha salen del mismo dato y no pueden contradecirse; es el selector que recomienda MDN para dar estilo a los campos inválidos ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). Y `:focus-visible` dibuja un contorno azul de 3 píxeles alrededor de lo que tiene el foco cuando el navegador decide que debe verse: siempre al navegar con Tab, y también al hacer clic en un campo de texto (7.3.1). Sin él, quien navega con el teclado depende del contorno por omisión de cada navegador, que en algunos fondos casi no se ve. Y `button[aria-disabled="true"]` atenúa el botón mientras hay un envío pendiente: con `disabled`, el navegador lo atenuaba solo; con `aria-disabled` no, y sin esta regla quien mira no sabría que el botón no responde (7.2.4).

El `package.json` solo cambia su versión a `0.7.0`: esta lección no agrega dependencias.

Con todo en su lugar, el punto de control pasa las dos revisiones del curso. `npm run lint` no escribe nada (las reglas de React aceptan los hooks nuevos y `startTransition` tal como se usan) y la construcción termina bien:

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
dist/assets/index-WLyq37jn.js   366.82 kB │ gzip: 114.40 kB

✓ built in 312ms
```

#### 7.4.2 La revisión, punto por punto

Esta tabla revisa el formulario y sus avisos contra lo que dicen WAI-ARIA y MDN. La columna «Cómo se sabe» separa lo que se midió de lo que se deduce del código o se comprueba a mano.

| Qué pide la fuente | Qué hace el `revisor` | Cómo se sabe |
|---|---|---|
| Usar el elemento nativo antes que ARIA (Using ARIA, regla 1) | `<label>`, `<input>`, `<button type="submit">`, `<form>`; ningún `role` en los controles | Lectura del código |
| Cada campo con nombre (WCAG 3.3.2) | `label htmlFor` con `id` igual al `name` | Medido: figura 4, nombre «Nombre» |
| El error identificado y descrito en texto (WCAG 3.3.1) | Texto del error en un `<p>` enlazado por `aria-describedby`, más el borde | Medido: figura 4, descripción con el error |
| `aria-invalid` en `true` solo tras intentar enviar (WAI-ARIA 1.2) | `false` al dibujar; `true` cuando el estado trae un error para ese campo | Medido: figura 4 y el HTML de `/servicios/nuevo` |
| Mensajes de estado sin recibir el foco (WCAG 4.1.3; MDN, `status`) | `role="alert"` para errores en el formulario, `role="status"` de la bandeja para el éxito; ninguno recibe el foco | Lectura del código |
| La región viva existe antes del mensaje (MDN, *Live regions*) | La región de errores y la de la bandeja se dibujan vacías desde el primer render | Medido: el HTML de `/servicios/nuevo` las trae vacías |
| Varios avisos a la vez son una mala experiencia (MDN, `alert`) | El éxito se anuncia una vez, en la bandeja | Medido en Chrome: antes, dos regiones cambiaban; ahora, una |
| Declarar los obligatorios (WAI-ARIA, `aria-required`; HTML-AAM, `required`) | `required` en los tres campos | Medido en el árbol de accesibilidad: `required=false` antes, `required=true` ahora |
| Leer la región entera solo cuando conviene (WAI-ARIA, `status`; MDN, `aria-atomic`) | `aria-atomic="false"` en la bandeja; el `alert` del formulario conserva `true` | Medido en el árbol de accesibilidad: la bandeja pasó de `atomic=true` a `atomic=false` |
| `alert` con moderación (MDN, `alert`) | Solo para errores que impiden seguir | Lectura del código |
| Orden de foco igual al orden del documento, sin `tabindex` positivo (MDN, `tabindex`) | Ningún `tabindex`; campos en el orden de llenado | Medido el orden del documento en el HTML de `/servicios/nuevo`; recorrerlo es manual |
| Foco visible al navegar con teclado | `:focus-visible` con contorno de 3 px | Se comprueba a mano |
| `aria-disabled` solo expone el estado; el autor suprime la función y cambia el aspecto (MDN, `aria-disabled`) | `aria-disabled={pending}`, clic cancelado mientras está pendiente y `button[aria-disabled="true"]` atenuado | Medido en Chrome: el foco se queda en el botón, el árbol lo da como `disabled=true` y `focused=true`, `opacity=0.6`, un solo `POST` |

Las lecturas del árbol de accesibilidad salieron de Chrome sin ventana, con `Accessibility.getFullAXTree`, el mismo árbol que el navegador entrega a los lectores de pantalla. Con el formulario de antes de los arreglos:

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

Y con el punto de control:

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

El primer `status` es el de la bandeja; con el formulario de antes había un segundo `status`, el del éxito en el formulario, que ya no existe. Los tres campos pasaron a `required=true`, y ninguno se volvió `invalid` por haberlo tocado sin escribir.

Y un punto donde el formulario se queda corto, dicho con la misma franqueza:

1. **Un error repetido no se vuelve a anunciar.** Medido en la figura 5 sobre una región igual a la del formulario; el efecto en el lector se deduce, no se midió. Es el segundo Enter de Raúl, y es el ejercicio 3.

## El error que vas a ver

La lección tiene un error principal, el que se ve en la consola, y tres de apoyo que no se ven a simple vista.

**El error principal: un `value` sin `onChange`.** Si cambias `defaultValue` por `value` en `Campo.tsx`, pensando que «así el campo muestra el valor del estado», React escribe en la consola del navegador el aviso que la figura 1 capturó:

```text
You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
```

Y el campo se vuelve de solo lectura: escribes y no pasa nada, como el tercer caso de la figura. El mensaje ofrece las tres salidas y la que corresponde a este formulario es la primera, `defaultValue`. No es un error de compilación ni del linter: TypeScript acepta `value` en un `<input>`, y `npm run build` termina bien. Se ve en la consola del navegador en desarrollo, y en la pantalla, porque no se puede escribir.

**El error del compilador: el esquema se separó de la API.** En una copia del punto de control, cambia en `esquemaAlta.ts` la clave `timeoutMs` por `tiempoMs` y corre `npx tsc -b`:

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

Renombraste una clave y el compilador encontró seis lugares en cuatro archivos donde eso rompe algo, y terminó con código 1. Ese código es el que importa: por eso `npm run build`, que es `tsc -b && vite build`, nunca llega a `vite build`. Se leen en dos grupos. Los dos `TS2741` dicen lo mismo desde dos sitios: `ValoresAlta` ya no tiene `timeoutMs`, así que no se puede usar como `NuevoServicio`. Uno está en `esquemaAlta.ts(21,…)`, que es `comprobarContrato`, y el otro en `FormularioAlta.tsx(40,…)`, la llamada a `darDeAlta(validacion.valor)`. Los otros cuatro son lugares que todavía escriben `timeoutMs` a mano (los dos atributos del `Campo` del tiempo límite en `FormularioAlta`, `textosDe` y `erroresDe`) y que ahora no coinciden con los tipos derivados del esquema. Sin esos tipos derivados, el formulario enviaría a la API un cuerpo con `tiempoMs` y la API respondería `400` por un campo `timeoutMs` que el formulario ya no sabe mostrar. Con ellos, el error aparece antes de ejecutar nada. `comprobarContrato` es la línea que garantiza ese aviso aunque algún día nadie más llame a `darDeAlta` con los valores del esquema.

**El silencioso: `useFormStatus` en el componente equivocado.** Si mueves `useFormStatus` a `FormularioAlta` para «ahorrarte un componente», `pending` es `false` siempre: el botón nunca dice «Dando de alta…», nunca se marca como no disponible y nunca ignora el segundo envío, así que un doble clic envía dos veces. No hay aviso en la consola ni en el linter. La figura 3 lo midió (`mismo=false` en las dos corridas) y la documentación lo marca como advertencia. El arreglo es el del punto de control: el hook va en un componente que se dibuja **dentro** del `<form>`.

**El otro silencioso: los campos que se vacían.** Si `Campo` recibiera un `defaultValue` fijo, cada envío con errores dejaría los campos vacíos, como en la primera corrida de la figura 3. Tampoco avisa nadie. La señal es la queja de quien llena el formulario: «me borró todo».

## Lo que se hace mal

**Controlar todos los campos por costumbre.** Tres estados y tres `onChange` para un formulario que solo se lee al enviar es trabajo que el navegador ya hacía, con un dibujo completo por tecla. Controla cuando la pantalla necesita el valor mientras se escribe.

**Validar con `onSubmit` y `e.preventDefault()` y un `useState` para «enviando».** Funciona, y es reinventar `<form action>`, `useActionState` y `useFormStatus`, con más lugares donde equivocarse (olvidar desactivar el botón, olvidar reactivarlo cuando hay error).

**Detenerse en el primer error.** Obliga a la persona a descubrir los errores de uno en uno, con un envío por cada uno. Un formulario junta todos.

**Llamar a la API sin validar antes.** El esquema rechaza en el navegador lo que la API rechazaría, sin una petición y con mensajes junto a cada campo. La API sigue validando, porque no puede confiar en la pantalla; las dos validaciones no compiten, se cubren. Y hay validaciones que solo el servidor puede hacer: un revisor real que visita las direcciones que alguien da de alta tiene que rechazar las de su propia red (`127.0.0.1`, `169.254.169.254`, `10.x`…), o cualquiera podría usarlo para asomarse adentro. Ese ataque se llama falsificación de peticiones del lado del servidor (SSRF), y el curso de HTTP de esta casa lo trata en el recuadro de seguridad de su lección 1. `urlHttp` acepta esas direcciones sin protestar: el esquema del navegador no protege de eso, ni lo pretende.

**Errores que solo son color.** Un borde rojo sin texto no le dice nada a un lector de pantalla ni a quien no distingue el rojo. WCAG 3.3.1 pide el error en texto.

**Un texto de error suelto, sin `aria-describedby`.** Se ve, pero no está relacionado con el campo: la figura 4 mostró que un lector no lo asocia.

**`aria-invalid="true"` desde el primer dibujo.** Grita «inválido» antes de que la persona haya escrito nada. La especificación recomienda no marcar un obligatorio vacío antes de que se intente enviar.

**Desactivar el botón que tiene el foco.** `disabled` impide el doble envío, pero se lleva el foco: medido en Chrome, cae al `body` y no vuelve. `aria-disabled` con el clic cancelado conserva el foco (7.2.4).

**`aria-disabled` sin la guarda.** El atributo dice «no disponible» pero no impide nada: medido, el segundo Espacio se envió.

**Anunciar lo mismo en dos regiones vivas.** Un éxito en el formulario y otro igual en la bandeja se oyen dos veces. Un aviso, un lugar.

**La región viva que nace con su mensaje.** `{error && <div role="alert">…</div>}` puede no anunciarse. La región va vacía desde el principio y lo que cambia es su contenido.

**`role="alert"` para todo.** Interrumpe. Un éxito, un «guardado» o un «cargando» son `status`.

**ARIA donde hay un elemento nativo.** Un `<div role="button" onClick>` en lugar de un `<button>` pierde el teclado, el orden de tabulación y el envío del formulario. La primera regla de ARIA existe por esto.

**Mover el foco al mensaje de error con `tabindex` positivo o con trucos de orden.** Desordena la navegación de todos. Si alguna vez decides mover el foco, que sea con `tabindex="-1"` y `.focus()` sobre el mensaje, y que sea una decisión tomada, no un parche.

## Ejercicios

### Ejercicio 1 — Predice el `FormData`

Sin correr nada, escribe en tu bitácora el `FormData` que recibe `enviar` si la persona escribe ` correo ` (con espacios), `https://correo.example` y `1500`, y lo que devuelve `validarCampos` con esos textos. ¿Qué tipo tiene `timeoutMs` en cada uno de los dos? Después compruébalo: agrega un `console.log(textos, validacion)` temporal en `enviar`, envía el formulario con `npm run dev` y lee la consola del navegador. Quita el renglón al terminar.

### Ejercicio 2 — El `409` de cerca

Con el servidor de práctica y `npm run dev` encendidos, da de alta `correo` dos veces. **Antes** del segundo envío, predice: ¿qué campo queda marcado, qué dice su descripción, qué anuncia la región `alert` y qué queda escrito en los tres campos? ¿Aparece una segunda fila «(agregando…)» en «Altas de esta sesión»? Comprueba cada predicción en el navegador. Para ver el atributo, usa las herramientas de desarrollo (pestaña de elementos) sobre el campo «Nombre».

### Ejercicio 3 — Que el segundo error también se anuncie

La figura 5 mostró que un segundo envío con el mismo mensaje no cambia el DOM de la región `alert`. Cambia `FormularioAlta` para que **cada** envío con errores produzca un cambio en esa región, sin cambiar el texto que se ve. Pista: el estado `con-errores` puede llevar un número que crece en cada envío, y React reemplaza un elemento cuando cambia su `key`. Comprueba tu solución adaptando la figura 5 antes de tocar el `revisor`. Restaura el punto de control al terminar, o guarda tu cambio en una copia.

### Ejercicio 4 — El árbol de accesibilidad con tus ojos

Abre `http://localhost:5173/servicios/nuevo` en Chrome, con las herramientas de desarrollo, y en la pestaña de elementos busca el panel de accesibilidad. **Antes de mirar, predice** qué dice ese panel de tres elementos: el campo «Nombre» (¿es obligatorio?, ¿es inválido?), la región de errores del formulario y la región de la bandeja (¿qué tan educada es cada una y si se lee entera). Compruébalo. Después, envía el formulario vacío y vuelve a mirar «Nombre». Por último, en una copia del punto de control, quita `required` de `Campo.tsx` y repite la primera lectura. Restaura la copia al terminar.

## Soluciones

### Solución 1

El `FormData` trae tres textos, tal cual: `nombre` es `" correo "`, `url` es `"https://correo.example"` y `timeoutMs` es `"1500"`; `textosDe` los copia sin cambiarlos, y por eso `textos.timeoutMs` es un `string`. `validarCampos` devuelve `{ ok: true, valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 } }`: `textoNoVacio` quitó los espacios, `urlHttp` normalizó la dirección con su `/` final y `enteroPositivoDeTexto` convirtió el texto en el número `1500`. Es el cuerpo que viaja a la API: `{"nombre":"correo","url":"https://correo.example/","timeoutMs":1500}`. Si en la consola ves el `FormData` como un objeto opaco, es normal: imprime `textos`, que es un objeto simple.

### Solución 2

El segundo envío pasa la validación local (el formulario no sabe qué nombres existen), así que se llama a la API, que responde `409` con `campos.nombre`. Queda marcado **solo** «Nombre», con `aria-invalid="true"` y `aria-describedby="nombre-error nombre-ayuda"`, y su descripción empieza con «ese nombre ya existe». La región `alert` anuncia el `detalle` de la API, «ya existe un servicio llamado correo». Los tres campos conservan lo que escribiste, porque el estado `con-errores` lleva los `textos` y `Campo` los usa como `defaultValue` (la figura 3). Y no aparece una segunda fila pendiente: el reductor de `useOptimistic` ignora un nombre que ya está en `altas`, y `correo` ya estaba confirmado desde el primer envío. Si en lugar de eso reinicias el servidor de práctica entre los dos envíos, el segundo da `201`: el servidor guarda los datos en memoria y vuelve a los cuatro de siempre.

### Solución 3

Una forma es que el estado `con-errores` lleve un contador de envíos y que el párrafo use ese contador como `key`:

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

Con una `key` distinta en cada envío, React no reutiliza el `<p>`: quita el viejo y pone uno nuevo, y la región `alert` cambia aunque el texto sea el mismo. Al adaptar la figura 5 (darle al `<p>` una `key={envio}`), el segundo envío debe contar cambios, no `0`. Fíjate en que el primer argumento de `enviar`, que el punto de control ignora con el nombre `_previo`, es justo el que da el contador: es el estado anterior que te entrega `useActionState`. Si lo usas, quítale el guion bajo al nombre, porque ya no es un argumento ignorado.

### Solución 4

El panel muestra lo mismo que las lecturas de `Accessibility.getFullAXTree` de 7.4.2, porque es el mismo árbol. «Nombre» es obligatorio (por `required`) y no es inválido (por `aria-invalid="false"`); su nombre es «Nombre» y su descripción, la ayuda. La región de errores es asertiva y se lee entera (`role="alert"`, con `aria-atomic` implícito en `true`); la de la bandeja es educada y no se lee entera (`role="status"` con `aria-atomic="false"`). Después de enviar vacío, «Nombre» pasa a inválido y su descripción empieza con «escribe un valor»: es el estado `con-errores` llegando al campo. Sin `required`, la propiedad de obligatorio desaparece o queda en falso, que es lo que el árbol decía antes de los arreglos de esta lección (`required=false`). Si tu predicción falló en la bandeja, vuelve a 7.3.3: `status` trae `aria-atomic="true"` de fábrica, y lo que lo cambia es el atributo explícito. El panel puede nombrar las propiedades de otra forma según la versión de Chrome; lo que importa es el valor.

## Cómo sé que lo logré

- [ ] `npm ci`, `npm run lint` y `npm run build` terminan bien dentro de `~/curso-react/revisor/`, y `npm run build` deja `dist/assets/index-WLyq37jn.js` si tu código es idéntico al del punto de control.
- [ ] Con `npm run dev`, abrir `http://localhost:5173/servicios/nuevo` muestra el enlace «Dar de alta» marcado como actual en la navegación y el formulario con tres campos; en las herramientas de desarrollo, cada campo tiene `aria-invalid="false"` y `aria-describedby` con su ayuda.
- [ ] Enviar vacío marca los tres campos, escribe «Revisa los campos marcados.» y, en la pestaña de red, **no** aparece ninguna petición a `/api/servicios`.
- [ ] Con el servidor de práctica encendido, dar de alta `correo` con `https://correo.example` y `1500` muestra «Se dio de alta correo» en la bandeja de avisos (y en ningún otro lugar), agrega la fila en «Altas de esta sesión», deja los campos vacíos, y la lista de `/` ya incluye `correo`.
- [ ] Repetir el alta de `correo` marca solo «Nombre» y conserva lo escrito en los tres campos.
- [ ] **A mano, con el teclado:** desde la barra de direcciones, Tab recorre en orden los enlaces «Reporte» y «Dar de alta», las dos casillas de preferencias, los tres campos y el botón (es el orden en que aparecen en el HTML de «El porqué antes del cómo» y en el de la disposición, con la bandeja de avisos vacía), y cada uno muestra el contorno azul; Enter en cualquier campo envía el formulario. Nada recibe el foco fuera de ese orden. Y una prueba más: lleva el foco al botón con Tab y envía con Espacio. Mientras dice «Dando de alta…», el botón se ve atenuado, un segundo Espacio no hace nada, y el contorno azul sigue en él; al terminar, el foco sigue ahí (7.2.4).
- [ ] **A mano, con un lector de pantalla** (Orca en tu Mint, NVDA en Windows o VoiceOver en macOS): al enviar vacío, el lector anuncia «Revisa los campos marcados.» sin que muevas el foco; al llegar a «Nombre», lee la etiqueta, el estado inválido y la descripción con el error primero; al dar de alta, anuncia el éxito **una sola vez**; con varios avisos en la bandeja, lee solo el nuevo. Anota en tu bitácora qué escuchaste en cada caso.
- [ ] Las figuras 1 a 5 dan en tu máquina la misma salida que en la lección.
- [ ] Anotaste en tu [bitácora](bitacora.md) qué hace cada atributo del HTML que se mostró en «El porqué antes del cómo».

## Resumen

Responde sin mirar la lección:

1. ¿Qué diferencia hay entre `defaultValue` y `value` en un `<input>`? ¿Qué avisa React si pasas `value` sin `onChange`, y cuáles son sus tres salidas?
2. ¿Por qué el alta del `revisor` usa campos no controlados? ¿En qué caso controlarías uno?
3. ¿Qué recibe la función de `useActionState` y en qué orden? ¿Qué pasa con lo que devuelve?
4. ¿Por qué React vacía los campos después de una acción con errores, y cómo evita el `revisor` que se pierda lo escrito?
5. ¿Desde dónde hay que llamar a `useFormStatus` para que `pending` llegue a ser `true`?
6. ¿Cuándo se dibuja el estado de `useOptimistic` y cuándo deja de dibujarse? ¿Por qué un cambio de estado que va después de un `await` dentro de la acción se envuelve en `startTransition`, y qué se vio en Chrome cuando no se hacía?
7. ¿Por qué `validarCampos` junta todos los errores, y qué protege `comprobarContrato`?
8. ¿Qué anuncia un lector de pantalla gracias a `aria-invalid` y a `aria-describedby`, y en qué orden lee la descripción?
9. ¿Qué diferencia hay entre `role="status"` y `role="alert"`? ¿Por qué la región tiene que existir antes de que llegue el mensaje? ¿Por qué la bandeja lleva `aria-atomic="false"` y el `alert` del formulario no?
10. ¿Qué dice la primera regla de ARIA, y qué pierde un `<div role="button">` frente a un `<button>`?

## Para leer más

- [React, `<form>`](https://react.dev/reference/react-dom/components/form): `action` como función, la *Transition*, el `POST` implícito y el reinicio de los campos no controlados después de la acción. Consultado el 21 de octubre de 2026.
- [React, `useActionState`](https://react.dev/reference/react/useActionState): la firma, los dos argumentos de la acción, el tipo del estado, el límite de error si la acción lanza y por qué no se llama dos veces bajo `StrictMode`. Consultado el 21 de octubre de 2026.
- [React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus): `pending`, `data`, `method` y `action`, y por qué solo informa del `<form>` padre. Consultado el 21 de octubre de 2026.
- [React, `useOptimistic`](https://react.dev/reference/react/useOptimistic): el estado optimista que solo existe mientras la acción está en curso y el aviso si se cambia fuera de una acción. Consultado el 21 de octubre de 2026.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input): campos controlados y no controlados, `defaultValue`, el aviso de `value` sin `onChange` y el cambio de no controlado a controlado. Consultado el 21 de octubre de 2026.
- [W3C, «Accessible Rich Internet Applications (WAI-ARIA) 1.2»](https://www.w3.org/TR/wai-aria-1.2/): los roles `status` y `alert` con sus valores implícitos, y los atributos `aria-invalid`, `aria-describedby` y `aria-required`. Consultado el 21 de octubre de 2026.
- [W3C, «Using ARIA»](https://www.w3.org/TR/using-aria/): la primera y la segunda regla del uso de ARIA. Consultado el 21 de octubre de 2026.
- [W3C, «ARIA Authoring Practices Guide: Read Me First»](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/): «ningún ARIA es mejor que un mal ARIA» y por qué los roles no agregan teclado. Consultado el 21 de octubre de 2026.
- [W3C, «Accessible Name and Description Computation 1.2»](https://www.w3.org/TR/accname-1.2/): cómo se calcula la descripción a partir de los identificadores de `aria-describedby`, en orden. Consultado el 21 de octubre de 2026.
- [W3C, «HTML Accessibility API Mappings 1.0»](https://www.w3.org/TR/html-aam-1.0/): el atributo `required` expuesto como `aria-required`. Consultado el 21 de octubre de 2026.
- [W3C WAI, «Forms Tutorial: User Notifications»](https://www.w3.org/WAI/tutorials/forms/notifications/): asociar un campo con su mensaje de error mediante `aria-describedby`. Consultado el 21 de octubre de 2026.
- [W3C, WCAG 2.2: «Understanding SC 3.3.1: Error Identification»](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [«SC 3.3.2: Labels or Instructions»](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) y [«SC 4.1.3: Status Messages»](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): el error descrito en texto, las etiquetas y los mensajes de estado sin foco. Consultado el 21 de octubre de 2026.
- [MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions): establecer la región antes de actualizarla, `polite` frente a `assertive` y `aria-atomic`. Consultado el 21 de octubre de 2026.
- [MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid), [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby), [`aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage), [rol `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) y [rol `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role): cuándo marcar un campo inválido, cómo se relaciona con su descripción y cuándo usar cada región viva. Consultado el 21 de octubre de 2026.
- [MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled) y [WHATWG, HTML, «Implicit submission»](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission): lo que `aria-disabled` hace y no hace, y el Enter desde un campo como un clic en el botón de envío. Consultado el 21 de octubre de 2026.
- [Chrome DevTools Protocol, dominio `Accessibility`](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/): `Accessibility.getFullAXTree`, el árbol de accesibilidad que se leyó antes y después de los arreglos. Consultado el 21 de octubre de 2026.
- [MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label), [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form), [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex) y [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible): la etiqueta asociada, `novalidate`, el orden de tabulación y el foco visible. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| campo no controlado | un `<input>` cuyo valor guarda el navegador; React solo pone el inicial con `defaultValue` |
| campo controlado | un `<input>` cuyo valor decide React en cada dibujo con `value` y `onChange` |
| acción (*Action*) | una función que React ejecuta dentro de una *Transition*; con `<form action>`, recibe el `FormData` |
| `useActionState` | hook que guarda lo que devolvió la última acción y entrega la función para dispararla |
| `useFormStatus` | hook que, desde un componente dentro de un `<form>`, dice si ese formulario tiene un envío pendiente |
| estado optimista | lo que se muestra mientras una acción no termina, antes de que la API confirme |
| `startTransition` | función de React que marca una actualización como parte de una *Transition*; dentro de una acción, devuelve a ella lo que va después de un `await` |
| árbol de accesibilidad | la versión de la página que el navegador entrega a los lectores de pantalla: roles, nombres, descripciones y estados |
| nombre accesible | el texto con que la tecnología de asistencia identifica un elemento; en un campo, su etiqueta |
| descripción accesible | el texto adicional que se lee después del nombre; aquí, el error y la ayuda de `aria-describedby` |
| región viva | una parte de la página cuyos cambios anuncia la tecnología de asistencia sin mover el foco |
| `role="status"` / `role="alert"` | región viva educada, que espera / región viva asertiva, que interrumpe |
| `aria-disabled` | atributo que anuncia «no disponible» sin quitar el foco ni desactivar nada; el comportamiento lo escribe quien desarrolla |
| `aria-atomic` | si una región viva se lee entera (`true`) o solo lo que cambió (`false`) cada vez que cambia |
| `:focus-visible` | pseudoclase de CSS que aplica cuando el foco debe verse, típicamente al navegar con teclado |

---

**Siguiente:** [Lección 8 — Pruebas de componentes](08-pruebas-de-componentes.md)
