# Lección 6 — Estado compartido: reducer y contexto

*Viernes, 18:50. La versión de la semana sale a las 19:30. Por el chat llegan dos mensajes casi juntos. El primero es de operación: «Le di "Volver a revisar" a pagos, me regresé a la lista para ver si cambiaba, y nunca supe si funcionó». Tienes la respuesta: el aviso de error vivía dentro de la página del servicio, y al salir de la página el aviso se fue con ella. El segundo es de la sala de guardias: «En la pantalla grande se amontonan los milisegundos, ¿los puedes ocultar?». Parece un cambio de diez minutos. Abres `FilaEstado.tsx`, que es quien pinta los milisegundos, y le agregas una propiedad `mostrarDuracion`. Pero `FilaEstado` la recibe de `ListaEstados`, que la recibe de `ContenidoReporte`, que la recibe de `PaginaReporte`, que la tendría que recibir de la disposición por el `Outlet`. A las 19:05 tu cambio toca cinco archivos, y tres de ellos no hacen nada con ese dato: solo lo pasan al siguiente. Y todavía falta la casilla para cambiarlo. Esta lección resuelve los dos mensajes con dos herramientas de React, y explica por qué ninguna de las dos es para todo.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 6.1 y 6.2)

**Qué construyes:** la bandeja de avisos del `revisor`, que vive en la disposición y por eso sobrevive al cambio de página; el botón «Volver a revisar» deja ahí su resultado, en éxito y en error. Y las preferencias de la pantalla, «Mostrar duración» y «Vista compacta», que se cambian en el encabezado y las lee una fila de la lista cinco niveles más abajo, sin pasar por los componentes de en medio.

**Qué aprendes:** `useReducer`: acciones que describen lo que pasó y un reducer puro que se prueba sin React; contexto solo cuando las propiedades y `children` ya no alcanzan; dos contextos, uno para el estado y otro para el despacho; un hook que falla si falta el proveedor; **qué estado vive dónde**: local, dirección, servidor o contexto.

**De dónde vienes.** De la [Lección 5](05-rutas-url-como-estado.md). Tu `revisor` ya tiene rutas: la lista en `/`, con los filtros en la dirección (`?fallas=1&q=`); el detalle en `/servicios/:nombre`; y una página «no encontrada» para lo demás. Una disposición, `Disposicion`, envuelve a todas las páginas con el encabezado y la navegación, y guarda las notas, que les llegan a las páginas por `<Outlet context>` y el hook `useNotas()`. Desde esa lección, la ruta raíz tiene además su propio límite de error, porque React Router atrapa los errores de las páginas antes de que lleguen a `LimiteDeError`. Los datos los sigue trayendo TanStack Query, y «Volver a revisar» es una mutación que invalida el reporte y el detalle. Partes del punto de control [`programas/05-rutas-url-como-estado/revisor/`](../programas/05-rutas-url-como-estado/revisor).

**Qué no hace esta lección.** No toca el servidor de práctica ni las rutas: la API sigue en su versión C y el arreglo de rutas es el mismo de la lección 5. No mueve las notas a un contexto: se quedan en la disposición, y la sección 6.3 explica por qué ese es su lugar. No usa Redux ni ninguna librería de estado: el curso no la necesita, y la sección 6.3 dice cuándo tendría sentido pensarlo. No memoiza los valores de los contextos con `useMemo` ni `useCallback`: aquí se mide cuántas veces se dibuja cada componente, y la medición no lo pide; medir con el Profiler es tema de la [Lección 9](09-rendimiento-publicacion.md). No guarda las preferencias en el navegador: al recargar, vuelven a sus valores iniciales (el ejercicio 4 discute dónde deberían vivir si se quisieran conservar). Y no arma una suite de pruebas: el reducer se prueba aquí con una figura que lo corre sin React; las suites con Vitest son el tema de la [Lección 8](08-pruebas-de-componentes.md).

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas del `package.json` de esta lección; esta lección no agrega ninguna dependencia. El punto de control se instaló desde cero con `npm ci`, y `npm run lint` y `npm run build` terminaron bien y produjeron `dist/assets/index-DBIHM1Pv.js`. Las corridas del curso habían verificado este mismo punto de control en un contenedor Linux (Debian 12, imagen `node:24.22.0`); esa corrida no se repitió para esta lección y no se corrió en una Linux Mint real, pero nada de lo que se muestra depende del sistema. Si `npm ci` imprime en macOS un aviso de `install-scripts` sobre `fsevents@2.3.3`, es una dependencia opcional que solo se instala en macOS para vigilar archivos: no hace falta aprobarla, y en tu Mint no aparecerá. Lo que se ve «en el navegador» se midió con Chrome sin ventana contra `vite preview`, controlado por su protocolo de depuración para poder hacer clic y leer la página después de cada clic: es un navegador real, no una simulación. Como en la máquina de las corridas había otras cosas encendidas, el servidor de práctica escuchó en el puerto 3106 (`PUERTO=3106 npm run servidor`) y la vista previa en el 4106, con una configuración de una sola vez que apuntaba su *proxy* a ese puerto; en tu máquina usa los de siempre, 3100 y 4173, y verás lo mismo. Las horas de la bitácora del servidor de práctica están en UTC. Las figuras se ejecutaron con su propio `package.json` en [`programas/06-reducer-contexto/`](../programas/06-reducer-contexto), junto a `revisor/`; la figura 1 se ejecuta con `node` directamente sobre el archivo `.ts`, sin compilar, y las demás se compilan con `tsc` como en las lecciones anteriores. Las rutas largas se muestran a partir de `~/curso-react`.

## Al terminar vas a poder

- Escribir las acciones de un reducer como una unión discriminada que describe **lo que pasó** (`agregado`, `descartado`), y hacer que TypeScript te señale el `switch` cuando agregas una acción y olvidas atenderla.
- Probar un reducer sin React, con `node` y una lista de acciones, y comprobar que no modificó el estado que recibió.
- Decidir, frente a un dato que necesitan varios componentes, si basta con pasar propiedades, si conviene reacomodar con `children`, o si hace falta un contexto, y explicar la decisión con el caso del `revisor`.
- Separar el estado y el despacho en dos contextos y medir, contando dibujos, qué componentes se vuelven a dibujar en cada caso.
- Escribir un hook de contexto que lance un error claro cuando falta el proveedor, y mostrar qué pasa cuando, en lugar de lanzar, el contexto tiene un valor por omisión.
- Clasificar cada pedazo de estado del `revisor` en local, dirección, servidor, disposición o contexto, con una razón para cada uno.

## El porqué antes del cómo

Los dos mensajes de la escena parecen dos problemas distintos, y en realidad son la misma pregunta hecha dos veces: **¿quién guarda este dato, y cómo llega a quien lo necesita?**

Empieza por el aviso perdido. En la lección 5, el resultado de «Volver a revisar» se pintaba dentro de `PaginaServicio`, con un `<p role="alert">` que aparecía si la mutación fallaba. Funciona mientras la persona se quede en esa página. Pero la página es una ruta, y una ruta que dejas de ver **se desmonta**: su estado, sus mutaciones en pantalla y sus avisos se destruyen. El aviso necesita vivir en un lugar que no se desmonte al navegar, y ese lugar ya existe: la disposición, que envuelve a todas las páginas. El problema es la distancia. Quien se entera del resultado es un hook, `useReintentar`, que corre dentro de `PaginaServicio`, adentro del `Outlet`. Quien debe pintarlo está arriba, en la disposición. Hace falta un camino de abajo hacia arriba.

Y no es un solo aviso. Si el aviso va a vivir más que la página, hay que poder descartarlo; si llegan varios, hay que poner un tope para que no crezcan sin fin; y cada uno necesita un identificador para que React sepa cuál quitar. Con `useState`, eso son tres funciones (`agregar`, `descartar`, `descartarTodos`) que tocan el mismo arreglo, cada una con su propia copia de las reglas. La documentación de React describe justo ese momento: cuando un componente tiene muchas actualizaciones de estado repartidas en muchos manejadores de eventos, conviene juntar toda esa lógica fuera del componente, en una sola función ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). Esa función se llama **reducer**.

Ahora el segundo mensaje. `mostrarDuracion` no es un dato de una página: lo cambia una casilla del encabezado y lo lee cada fila de la lista. Entre la casilla y la fila hay cinco componentes, y cuatro de ellos no usan el dato. Pasarlo de mano en mano funciona, pero obliga a cambiar la firma de componentes que no tienen nada que ver con la preferencia, y cada componente nuevo que se ponga en medio tendrá que acordarse de pasarlo. React tiene una herramienta para que un dato «salte» los niveles intermedios: el **contexto**. Y su documentación, en la misma página donde lo presenta, advierte antes de usarlo que es muy tentador usarlo de más ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)). Por eso esta lección no empieza por el contexto, sino por las dos cosas que conviene probar antes.

La lección tiene tres partes. En 6.1 construyes el reducer de los avisos y lo pruebas sin React. En 6.2 lo conectas con dos contextos, escribes el hook que se niega a funcionar sin proveedor y aplicas el mismo patrón a las preferencias. Y en 6.3 haces el inventario completo: cada pedazo de estado del `revisor`, dónde vive y por qué ahí. Al terminar, esto es lo que se ve en la pantalla del detalle de `pagos` después de presionar «Volver a revisar», y vas a saber de dónde sale cada pieza:

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div></section>
```

Es la bandeja tal como la entregó Chrome, y sigue igual después de volver a la lista: el aviso ya no depende de la página que lo produjo.

## Los conceptos

### 6.1 `useReducer`: acciones que describen lo que pasó

#### 6.1.1 Un reducer es una función que ya conoces

El nombre suena raro y la idea no lo es. Los arreglos de JavaScript tienen un método, `reduce`, que recorre los elementos en orden y va pasando el resultado de cada paso al siguiente; la función que le das se llama, precisamente, *reducer*, y el resultado final es un solo valor ([MDN, `Array.prototype.reduce()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)). La documentación de React explica que sus reducers llevan ese nombre por la misma idea: el de un arreglo recibe «el resultado hasta ahora» y «el elemento actual» y devuelve el siguiente resultado; el de React recibe **el estado hasta ahora** y **la acción** y devuelve **el siguiente estado** ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

Tenlo presente, porque en 6.1.4 vas a usar literalmente `reduce` de un arreglo con el reducer de los avisos, y va a funcionar sin cambiarle nada. Esa es la primera ventaja de un reducer: **no sabe nada de React**. Es una función de dos argumentos que devuelve un valor.

#### 6.1.2 Las acciones: lo que pasó, no lo que hay que hacer

Con `useState`, el componente le dice a React **qué hacer**: «pon este arreglo». Con un reducer, el componente le dice **qué pasó**: «se agregó un aviso», «la persona descartó el aviso 3». Lo que pasó se describe con un objeto que se llama **acción**, y la regla para escribirlo bien, según la documentación de React, es que el tipo de una acción describa idealmente «lo que hizo la persona» y no «cómo quieres que cambie el estado»; y que **cada acción describa una sola interacción**, aunque esa interacción provoque varios cambios en los datos ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

En el `revisor`, las acciones son tres, y sus nombres están en participio a propósito: `agregado`, `descartado`, `todos-descartados`. Se leen como un registro de hechos. Nota lo que **no** son: no hay una acción `recortar-a-cinco` ni una `incrementar-id`. Cuando llega un aviso nuevo pasan tres cosas (se pone al principio, se recorta la lista a cinco y avanza el contador de identificadores), pero la persona hizo una sola: provocar un aviso. Esas tres cosas son la *consecuencia*, y la consecuencia es asunto del reducer.

En TypeScript, el conjunto de acciones posibles es una **unión discriminada**, igual que `EstadoPublico` desde la lección 0: cada miembro tiene un `tipo` distinto y los datos que ese tipo necesita. `agregado` trae el nivel y el texto; `descartado` trae el identificador; `todos-descartados` no necesita nada más.

#### 6.1.3 El reducer de los avisos

Este es el archivo completo. Todo lo que hay que saber de los avisos está aquí, y nada de él importa algo de React:

```ts
// revisor/src/avisos/avisos.ts
export type NivelAviso = "exito" | "error";

export interface Aviso {
  readonly id: number;
  readonly nivel: NivelAviso;
  readonly texto: string;
}

export interface EstadoAvisos {
  readonly avisos: readonly Aviso[];
  readonly siguienteId: number;
}

export type AccionAvisos =
  | { readonly tipo: "agregado"; readonly nivel: NivelAviso; readonly texto: string }
  | { readonly tipo: "descartado"; readonly id: number }
  | { readonly tipo: "todos-descartados" };

export const estadoInicialAvisos: EstadoAvisos = { avisos: [], siguienteId: 1 };

export const MAXIMO_AVISOS = 5;

export function reducirAvisos(estado: EstadoAvisos, accion: AccionAvisos): EstadoAvisos {
  switch (accion.tipo) {
    case "agregado": {
      const nuevo: Aviso = { id: estado.siguienteId, nivel: accion.nivel, texto: accion.texto };
      return {
        avisos: [nuevo, ...estado.avisos].slice(0, MAXIMO_AVISOS),
        siguienteId: estado.siguienteId + 1,
      };
    }
    case "descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.id !== accion.id) };
    case "todos-descartados":
      return { ...estado, avisos: [] };
    default: {
      const sinAtender: never = accion;
      throw new Error(`acción sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

Léelo de arriba abajo:

- **Los tipos.** Un `Aviso` tiene un `id`, un `nivel` (`exito` o `error`) y un `texto`. El estado no es solo la lista: `EstadoAvisos` guarda también `siguienteId`, el número que recibirá el próximo aviso. Podría parecer que se puede calcular («el mayor identificador más uno»), pero no: si descartas el aviso más nuevo, el mayor baja, y el siguiente aviso repetiría un identificador que React ya usó como `key` para otro elemento. Es un dato que no se deduce de los demás, así que se guarda. Todos los campos son `readonly`, y la lista es `readonly Aviso[]`: TypeScript no te deja modificarla, y en «El error que vas a ver» lo vas a comprobar.
- **`agregado`.** Arma el aviso nuevo con el `siguienteId`, lo pone **al principio** de una lista nueva (`[nuevo, ...estado.avisos]`) y la recorta con `slice(0, MAXIMO_AVISOS)`. Ni `[...]` ni `slice` modifican el arreglo original: crean otro. El tope está en una constante con nombre, `MAXIMO_AVISOS = 5`, y no como un `5` suelto, para que se pueda leer y probar.
- **`descartado`.** `filter` devuelve una lista nueva sin el aviso de ese `id`. El resto del estado se copia con `...estado`; `siguienteId` no cambia, y por eso un identificador nunca se reutiliza.
- **`todos-descartados`.** Una lista vacía, el contador intacto.
- **`default` con `never`.** Si TypeScript llegó hasta aquí, ya descartó los tres tipos, y a `accion` no le queda ningún tipo posible: es `never`. Asignarla a una variable `never` no cuesta nada mientras eso sea cierto. El día que alguien agregue una cuarta acción a la unión y olvide su `case`, esa asignación deja de compilar. Es la misma técnica que el manual de TypeScript llama comprobación exhaustiva ([TypeScript, «Narrowing», *Exhaustiveness checking*](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)), y es la misma que `ContenidoReporte` usaba desde la lección 0. El `throw` solo se ejecutaría si algo saltara el sistema de tipos (por ejemplo, una acción armada a mano con `as`); es la red debajo de la red.

Hay una condición que este archivo cumple y que no se ve a simple vista: **el reducer es puro**. Recibe un estado y una acción y devuelve un estado; no pide nada a la red, no programa temporizadores, no escribe en la consola, no lee la hora. La documentación de `useReducer` lo exige («debe ser pura») y explica cómo lo vigila React: en `StrictMode`, llama a tu reducer **dos veces** para ayudarte a encontrar impurezas accidentales ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Si el reducer tuviera un efecto, como un `fetch`, ese doble llamado lo dispararía dos veces en desarrollo, que es exactamente lo que `StrictMode` quiere que veas. Y hay un detalle de este reducer que es fácil romper sin querer: los identificadores. Si en lugar de guardar `siguienteId` en el estado usaras un contador fuera de la función (`let ultimo = 0` arriba del archivo, y `ultimo += 1` adentro), el doble llamado de `StrictMode` saltaría números, y dos reducers que procesan las mismas acciones darían resultados distintos. Como el contador viaja en el estado, la misma acción sobre el mismo estado da siempre lo mismo.

#### 6.1.4 Probarlo sin React

Como el reducer es una función sin React, se prueba como cualquier función. Esta figura importa el archivo **tal cual** y le pasa acciones. Se ejecuta con `node` directamente, sin compilar, porque Node 24 corre archivos `.ts` (la lección 0 lo explicó en 0.2.2); el `tsc` de la primera línea solo revisa los tipos.

```ts
// fig06_01.ts
import {
  estadoInicialAvisos,
  reducirAvisos,
  type AccionAvisos,
  type EstadoAvisos,
} from "./avisos.ts";

function mostrar(titulo: string, estado: EstadoAvisos): void {
  const lista = estado.avisos.map((aviso) => `${aviso.id}:${aviso.texto}`).join(", ");
  console.log(`${titulo}: [${lista}] siguienteId=${estado.siguienteId}`);
}

const seis: AccionAvisos[] = ["a", "b", "c", "d", "e", "f"].map((letra) => ({
  tipo: "agregado",
  nivel: "exito",
  texto: letra,
}));

const conSeis = seis.reduce(reducirAvisos, estadoInicialAvisos);
mostrar("seis agregados", conSeis);

const sinElTres = reducirAvisos(conSeis, { tipo: "descartado", id: 3 });
mostrar("descartado el 3", sinElTres);

const sinNinguno = reducirAvisos(sinElTres, { tipo: "todos-descartados" });
mostrar("todos descartados", sinNinguno);

const otraVez = reducirAvisos(conSeis, { tipo: "descartado", id: 3 });
console.log(`la misma acción sobre el mismo estado da lo mismo: ${JSON.stringify(otraVez) === JSON.stringify(sinElTres)}`);
console.log(`el estado de antes sigue intacto: ${conSeis.avisos.length} avisos`);
console.log(`el estado inicial sigue vacío: ${estadoInicialAvisos.avisos.length} avisos`);
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --allowImportingTsExtensions --noEmit fig06_01.ts
$ node fig06_01.ts
seis agregados: [6:f, 5:e, 4:d, 3:c, 2:b] siguienteId=7
descartado el 3: [6:f, 5:e, 4:d, 2:b] siguienteId=7
todos descartados: [] siguienteId=7
la misma acción sobre el mismo estado da lo mismo: true
el estado de antes sigue intacto: 5 avisos
el estado inicial sigue vacío: 0 avisos
```

Cada renglón es una afirmación que puedes comprobar a ojo:

- **`seis agregados`.** Seis acciones, pasadas con `reduce` del arreglo, el mismo método de 6.1.1. Quedan cinco, la más nueva primero, y la `a` (identificador 1) se cayó por el tope. `siguienteId` vale 7: se repartieron seis números.
- **`descartado el 3`.** Sale la `c`; los demás conservan su identificador.
- **`todos descartados`.** Lista vacía, y `siguienteId` sigue en 7: el próximo aviso será el 7, no el 1.
- **Las tres últimas líneas** son la pureza, medida. La misma acción sobre el mismo estado dio el mismo resultado; el estado que se pasó como entrada sigue teniendo sus cinco avisos después de que el reducer «lo descartó»; y el estado inicial, que se usó como punto de partida de todo, sigue vacío. El reducer nunca tocó lo que recibió: siempre devolvió algo nuevo.

Esto es lo que la documentación de React pone del lado del reducer cuando lo compara con `useState`: como no depende de tu componente, se puede exportar y probar por separado, y se le puede agregar un `console.log` para ver cada cambio de estado y **por qué** ocurrió, es decir, qué acción lo provocó ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). La misma página es honesta con el costo: con un reducer escribes más código al principio, la función y las acciones. Para tres acciones con un tope y un contador, ese costo se paga solo. Para una casilla que se marca y se desmarca, no; por eso las preferencias de 6.2.7 se quedan con `useState`.

(La copia `avisos.ts` que importa la figura es idéntica a la del punto de control: `cmp avisos.ts revisor/src/avisos/avisos.ts` no imprime nada. En tu máquina, copia el archivo a tu carpeta de figuras.)

#### 6.1.5 `useReducer`: conectar el reducer con React

El reducer decide; falta quien guarde el estado entre dibujos y le pase las acciones. Eso hace `useReducer`. Su forma es `const [estado, despachar] = useReducer(reducer, valorInicial)`: devuelve el estado actual y una función, `despachar` (*dispatch*), que recibe una acción ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Cuando llamas `despachar({ tipo: "descartado", id: 3 })`, React llama al reducer con el estado que tiene y esa acción, guarda lo que el reducer devuelva y vuelve a dibujar. Si lo que devuelve es **el mismo objeto** (comparado con `Object.is`), React se salta el dibujo del componente y de sus hijos; la documentación aclara que a veces todavía llama al componente una vez antes de descartar el resultado, pero eso no cambia lo que ves.

En el `revisor`, quien llama a `useReducer` es un componente que no dibuja nada propio, el **proveedor** de los avisos:

```tsx
// revisor/src/avisos/ProveedorAvisos.tsx
import { useReducer, type ReactNode } from "react";
import { estadoInicialAvisos, reducirAvisos } from "./avisos";
import { ContextoAvisos, ContextoDespachoAvisos } from "./contextos";

export function ProveedorAvisos({ children }: { readonly children: ReactNode }) {
  const [estado, despachar] = useReducer(reducirAvisos, estadoInicialAvisos);

  return (
    <ContextoAvisos value={estado}>
      <ContextoDespachoAvisos value={despachar}>{children}</ContextoDespachoAvisos>
    </ContextoAvisos>
  );
}
```

Cuatro renglones de lógica, y dos se explican en 6.2. Lo que importa aquí es lo que `useReducer` garantiza sobre `despachar`: la documentación dice que esa función tiene una **identidad estable**, es decir, es la misma función en todos los dibujos ([React, `useReducer`](https://react.dev/reference/react/useReducer)). El estado cambia cada vez que llega un aviso; `despachar`, nunca. Esa diferencia es la base de la decisión más importante de la sección siguiente.

### 6.2 Contexto: cuando las propiedades y `children` ya no alcanzan

#### 6.2.1 Antes del contexto, dos preguntas

La documentación de React es directa: que necesites pasar una propiedad por varios niveles **no significa** que debas meter esa información en un contexto. Antes, propone dos alternativas, en este orden ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)):

1. **Pasar propiedades.** Puede sentirse como una carga, pero deja claro qué componente usa qué dato, y quien mantenga el código lo va a agradecer.
2. **Extraer componentes y pasar JSX como `children`.** Si un dato atraviesa capas que no lo usan, a menudo es porque faltó extraer un componente: en lugar de `<Disposicion avisos={avisos} />`, que obliga a la disposición a pasar los avisos hacia abajo, se escribe `<Disposicion><Bandeja avisos={avisos} /></Disposicion>`, y la disposición ya no sabe que hay avisos.

Solo si ninguna de las dos sirve, el contexto. Haz el ejercicio con los dos casos del `revisor`.

**Los avisos.** Quien los pinta, la bandeja, vive en la disposición. Quien los produce, `useReintentar`, vive en `PaginaServicio`, que se dibuja dentro del `<Outlet />`. Pasar propiedades no funciona aquí por una razón concreta: la disposición **no crea** a `PaginaServicio`. La crea el enrutador, según la dirección, en el hueco del `Outlet`. No hay ningún `<PaginaServicio despachar={…} />` escrito en el código al que le puedas agregar una propiedad. El único canal que el enrutador ofrece hacia abajo es `<Outlet context>`, el mismo de las notas. Se podría meter `despachar` en ese objeto, pero entonces solo podrían avisar las páginas, y avisar es un asunto de la aplicación, no de una ruta: un componente que produce un aviso no debería depender de si está o no dentro del `Outlet`. Y `children` tampoco ayuda: no hay ningún componente intermedio que extraer, porque entre la disposición y la página no hay componentes tuyos, hay un enrutador.

**Las preferencias.** El camino es otro y el resultado es el mismo. La casilla vive en el encabezado de la disposición. La fila que pinta los milisegundos es `Descripcion`, dentro de `FilaEstado`. Entre las dos: el `Outlet`, `PaginaReporte`, `ContenidoReporte`, `ListaEstados` y `FilaEstado`. Pasar la propiedad obliga a cambiar la firma de cuatro componentes que no la usan, que es la escena de la lección. ¿Y `children`? Aquí sí vale la pena pensarlo, porque es la alternativa que la documentación recomienda antes del contexto. El problema es que las filas no se pueden crear desde arriba: las crea `ListaEstados` con un `map` sobre los estados **ya filtrados**, y el filtro depende de la dirección, que lee `PaginaReporte`. Para pasar las filas como `children` habría que sacar el `map` de `ListaEstados` y subirlo hasta la disposición, que entonces tendría que saber de filtros y de consultas. Es reacomodar media aplicación para que un dato de presentación llegue a su lugar. Cuando la única forma de evitar el contexto es mezclar responsabilidades, el contexto es la herramienta correcta.

Entre los usos que la documentación de React lista para el contexto están, justamente, el **tema** de la aplicación (cómo se ve) y **manejar estado** que muchos componentes lejanos necesitan cambiar, «a menudo con un reducer junto con el contexto» ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)). Las preferencias son lo primero; los avisos, lo segundo.

#### 6.2.2 Crear, proveer y leer un contexto

Un contexto tiene tres partes:

1. **Se crea** con `createContext(valorPorOmision)`. El argumento es el valor que recibirá quien lea el contexto si **no hay ningún proveedor** arriba de él en el árbol; la documentación lo llama un recurso de «último recurso», estático, que nunca cambia ([React, `createContext`](https://react.dev/reference/react/createContext)).
2. **Se provee** dibujando el contexto como un componente con una propiedad `value`: `<ContextoAvisos value={estado}>…</ContextoAvisos>`. Todo lo que quede adentro, a cualquier profundidad, puede leer ese valor. Desde React 19 se escribe así, con el contexto mismo; antes se escribía `<ContextoAvisos.Provider value={…}>`, una forma que la documentación ya llama heredada ([React, `createContext`](https://react.dev/reference/react/createContext)) y que el equipo de React anunció que marcará como obsoleta en versiones futuras ([React, «React v19»](https://react.dev/blog/2024/12/05/react-19)). Si lees código o tutoriales anteriores, vas a ver `.Provider` por todos lados: hace lo mismo.
3. **Se lee** con `useContext(Contexto)`, que busca **el proveedor más cercano arriba** del componente que lo llama, y no toma en cuenta un proveedor que el mismo componente dibuje ([React, `useContext`](https://react.dev/reference/react/useContext)).

Los contextos de los avisos viven en su propio archivo, como recomienda la documentación cuando varios archivos los necesitan ([React, `createContext`](https://react.dev/reference/react/createContext)):

```ts
// revisor/src/avisos/contextos.ts
import { createContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";

export const ContextoAvisos = createContext<EstadoAvisos | null>(null);
export const ContextoDespachoAvisos = createContext<Dispatch<AccionAvisos> | null>(null);
```

Dos detalles. El primero: el valor por omisión es `null`, y el tipo lo dice (`EstadoAvisos | null`). Es una decisión, no un descuido, y 6.2.4 explica por qué es mejor que un valor «que funcione». El segundo: **son dos contextos**, no uno.

#### 6.2.3 Dos contextos: el estado y el despacho

Vuelve a `ProveedorAvisos` de 6.1.5. El estado va en `ContextoAvisos`; `despachar` va en `ContextoDespachoAvisos`. ¿Por qué no un solo contexto con un objeto `{ estado, despachar }`? La guía de React que junta reducer y contexto pide justo esta separación, un contexto para la lista y otro para la función que despacha acciones ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). No dice por qué; la razón que da esta lección se deduce de una regla de `useContext`: React vuelve a dibujar **todos los componentes que leen un contexto** cuando su proveedor recibe un `value` distinto, comparado con `Object.is`, y saltarse dibujos con `memo` no lo impide ([React, `useContext`](https://react.dev/reference/react/useContext)).

Con un solo contexto, el `value` es un objeto nuevo cada vez que cambia el estado, así que todo el que lea el contexto se vuelve a dibujar, **aunque solo quiera despachar**. En el `revisor` hay uno así: `useReintentar`, que produce avisos y nunca los lee; y cualquier formulario que avise de su resultado sería otro. Con dos contextos, el de despacho guarda una función estable y su `value` nunca cambia. Eso no es una teoría; se cuenta. Esta figura monta una bandeja y un botón dentro de un proveedor, presiona el botón tres veces y cuenta cuántas veces se dibujó cada uno, primero con un contexto y luego con dos. Para contar sin ensuciar el dibujo, cada componente llama a `useContarDibujos`, un hook con un Effect **sin** lista de dependencias, que corre después de cada dibujo confirmado:

```tsx
// fig06_03.tsx
import { JSDOM } from "jsdom";
import {
  act,
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ComponentType,
  type Dispatch,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Accion = { readonly tipo: "agregado" };
type Despachar = Dispatch<Accion>;

function contar(cuantos: number, accion: Accion): number {
  return accion.tipo === "agregado" ? cuantos + 1 : cuantos;
}

// Un Effect sin lista de dependencias corre después de cada dibujo confirmado:
// sirve para contar sin ensuciar el dibujo mismo.
const dibujos = { bandeja: 0, boton: 0 };

function useContarDibujos(quien: keyof typeof dibujos): void {
  useEffect(() => {
    dibujos[quien] += 1;
  });
}

// Uno: estado y despacho en el mismo valor.
const ContextoJunto = createContext<{ cuantos: number; despachar: Despachar } | null>(null);

function ProveedorJunto({ children }: { readonly children: ReactNode }) {
  const [cuantos, despachar] = useReducer(contar, 0);
  return <ContextoJunto value={{ cuantos, despachar }}>{children}</ContextoJunto>;
}

function BandejaJunta() {
  useContarDibujos("bandeja");
  return <p>{useContext(ContextoJunto)?.cuantos} avisos</p>;
}

function BotonJunto() {
  useContarDibujos("boton");
  const despachar = useContext(ContextoJunto)?.despachar;
  return (
    <button type="button" onClick={() => despachar?.({ tipo: "agregado" })}>
      Avisar
    </button>
  );
}

// Dos: un contexto para el estado y otro para el despacho.
const ContextoEstado = createContext<number | null>(null);
const ContextoDespacho = createContext<Despachar | null>(null);

function ProveedorSeparado({ children }: { readonly children: ReactNode }) {
  const [cuantos, despachar] = useReducer(contar, 0);
  return (
    <ContextoEstado value={cuantos}>
      <ContextoDespacho value={despachar}>{children}</ContextoDespacho>
    </ContextoEstado>
  );
}

function BandejaSeparada() {
  useContarDibujos("bandeja");
  return <p>{useContext(ContextoEstado)} avisos</p>;
}

function BotonSeparado() {
  useContarDibujos("boton");
  const despachar = useContext(ContextoDespacho);
  return (
    <button type="button" onClick={() => despachar?.({ tipo: "agregado" })}>
      Avisar
    </button>
  );
}

async function tresClics(
  titulo: string,
  Proveedor: ComponentType<{ children: ReactNode }>,
  Bandeja: ComponentType,
  Boton: ComponentType,
): Promise<void> {
  dibujos.bandeja = 0;
  dibujos.boton = 0;
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(
      <Proveedor>
        <Bandeja />
        <Boton />
      </Proveedor>,
    );
  });

  const boton = contenedor.querySelector("button");
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      boton?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }

  console.log(titulo);
  console.log(`  en pantalla: "${contenedor.querySelector("p")?.textContent}"`);
  console.log(`  dibujos de la bandeja: ${dibujos.bandeja}   dibujos del botón: ${dibujos.boton}`);
  await act(async () => {
    raiz.unmount();
  });
}

await tresClics("un contexto con { cuantos, despachar }:", ProveedorJunto, BandejaJunta, BotonJunto);
await tresClics("dos contextos, estado y despacho:", ProveedorSeparado, BandejaSeparada, BotonSeparado);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig06_03.tsx
$ node fig06_03.js
un contexto con { cuantos, despachar }:
  en pantalla: "3 avisos"
  dibujos de la bandeja: 4   dibujos del botón: 4
dos contextos, estado y despacho:
  en pantalla: "3 avisos"
  dibujos de la bandeja: 4   dibujos del botón: 1
```

La bandeja se dibuja cuatro veces en los dos casos: una al montar y una por cada aviso. Es lo correcto, porque muestra el número. El botón es la diferencia. Con un solo contexto se dibuja cuatro veces, como la bandeja, sin haber mostrado nunca nada nuevo; con dos, una sola vez, al montar. En una pantalla con un botón eso no se nota. En una pantalla con cincuenta componentes que solo despachan, son cincuenta dibujos de más por cada aviso, y todos innecesarios.

Dos observaciones sobre la figura, porque explican el código del `revisor`. La primera: el botón y la bandeja **no** se vuelven a dibujar porque el proveedor se dibuje. El proveedor recibe a los dos como `children`, y `children` es un valor que creó quien llamó al proveedor, una sola vez; cuando el proveedor cambia su estado y se vuelve a dibujar, `children` sigue siendo el mismo objeto y React no tiene por qué volver a dibujarlo. Lo único que obliga a un hijo a dibujarse es que lea un contexto que cambió. Es la composición de la lección 1 trabajando a tu favor. La segunda: la figura monta sin `StrictMode` para que los conteos sean exactos (con él, el ciclo extra de los Effects al montar sumaría uno más a cada componente, sin cambiar la diferencia). Y una tercera, sobre el instrumento: el contador es una variable de fuera de React, y el Effect le suma uno. Hacerlo en el cuerpo del componente (`dibujos.boton += 1` mientras se dibuja) sería la impureza que la lección 1 te enseñó a cazar, y el linter la rechaza con `react-hooks/immutability`. En un Effect es legal: el Effect existe para tocar lo que está fuera de React. Aun así es un instrumento de medición de la figura, no código para el `revisor`; para medir dibujos en una aplicación de verdad, la herramienta es el Profiler de las herramientas de desarrollo. `npx eslint` sobre las figuras de esta lección no da ningún aviso.

¿Y no sería más fácil envolver el objeto en `useMemo`? La documentación de `useContext` lo propone para cuando el valor es un objeto con funciones: es una optimización de rendimiento, y aclara que en aplicaciones pequeñas no es un problema ([React, `useContext`](https://react.dev/reference/react/useContext)). Separar en dos contextos no es una optimización que se agregue después: es la forma natural de los datos, porque el estado y el despacho cambian a ritmos distintos. Y no exige memoizar nada. Es la diferencia entre ordenar bien desde el principio y parchar con una herramienta que tiene su propio costo, que es el criterio del curso.

#### 6.2.4 Un hook que se niega a funcionar sin proveedor

Nadie en el `revisor` llama a `useContext` directamente. Lo hacen dos hooks, uno por contexto:

```ts
// revisor/src/avisos/usarAvisos.ts
import { useContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";
import { ContextoAvisos, ContextoDespachoAvisos } from "./contextos";

export function useAvisos(): EstadoAvisos {
  const estado = useContext(ContextoAvisos);

  if (estado === null) {
    throw new Error("useAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }

  return estado;
}

export function useDespachoAvisos(): Dispatch<AccionAvisos> {
  const despachar = useContext(ContextoDespachoAvisos);

  if (despachar === null) {
    throw new Error("useDespachoAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }

  return despachar;
}
```

Los dos hacen lo mismo: leen el contexto, y si reciben `null`, **lanzan un error que dice qué falta y dónde**. `null` solo puede llegar de un lugar: el valor por omisión de `createContext`, que React usa únicamente cuando no encuentra ningún proveedor arriba. Si llega `null`, alguien dibujó un componente que usa avisos fuera de `ProveedorAvisos`. Como el `if` descarta el `null`, lo que el hook devuelve ya tiene el tipo exacto, `EstadoAvisos` o `Dispatch<AccionAvisos>`, y quien lo usa no tiene que preguntar nada.

La guía de React sugiere exportar hooks como estos y dice que no cambian el comportamiento, pero que te permiten más adelante partir los contextos o «agregar algo de lógica» a esas funciones ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). La comprobación del proveedor es esa lógica. ¿Por qué lanzar, y no darle al contexto un valor por omisión que «funcione», como una lista vacía y una función que no hace nada? Porque ese valor esconde el error en lugar de mostrarlo. Esta figura monta las dos versiones **sin proveedor**:

```tsx
// fig06_02.tsx
import { JSDOM } from "jsdom";
import { act, createContext, useContext, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

interface ValorAvisos {
  readonly avisos: readonly string[];
  readonly avisar: (texto: string) => void;
}

// A: un valor por omisión que "funciona" sin proveedor.
const ContextoConOmision = createContext<ValorAvisos>({ avisos: [], avisar: () => {} });

function BandejaA() {
  const { avisos, avisar } = useContext(ContextoConOmision);
  return (
    <button type="button" onClick={() => avisar("pagos se volvió a revisar")}>
      {avisos.length} avisos
    </button>
  );
}

// B: null por omisión y un hook que se niega a seguir sin proveedor.
const ContextoSinOmision = createContext<ValorAvisos | null>(null);

function useAvisos(): ValorAvisos {
  const valor = useContext(ContextoSinOmision);
  if (valor === null) {
    throw new Error("useAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }
  return valor;
}

function BandejaB() {
  const { avisos } = useAvisos();
  return <p>{avisos.length} avisos</p>;
}

async function montarSinProveedor(titulo: string, arbol: ReactNode): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  try {
    await act(async () => {
      raiz.render(arbol);
    });
  } catch (error: unknown) {
    console.log(`  error al dibujar: ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log(`  en pantalla: "${contenedor.textContent}"`);

  const boton = contenedor.querySelector("button");
  if (boton !== null) {
    await act(async () => {
      boton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    console.log(`  después del clic: "${contenedor.textContent}"`);
  }

  await act(async () => {
    raiz.unmount();
  });
}

await montarSinProveedor("A, con valor por omisión:", <BandejaA />);
await montarSinProveedor("B, con el hook que lanza:", <BandejaB />);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig06_02.tsx
$ node fig06_02.js
A, con valor por omisión:
  en pantalla: "0 avisos"
  después del clic: "0 avisos"
B, con el hook que lanza:
  error al dibujar: useAvisos necesita un <ProveedorAvisos> más arriba en el árbol
  en pantalla: ""
```

La versión A no falla. Dice «0 avisos», y el clic en el botón tampoco falla: llama a la función vacía del valor por omisión, que no hace nada, y la pantalla sigue diciendo «0 avisos». Es el peor resultado posible, porque todo **parece** funcionar: la persona presiona «Volver a revisar» y nunca ve el aviso, y nadie sabe por qué, porque no hay ningún error en ningún lado. La versión B se detiene en el primer dibujo con un mensaje que nombra el componente que falta. Un error que aparece la primera vez que corres el código, con su causa escrita, vale más que una pantalla que miente en silencio.

¿Dónde terminaría ese error en el `revisor`? Depende de dónde estuviera el componente sin proveedor. Si fuera una página, lo atraparía el límite de error de la ruta raíz que agregó la lección 5, y su aviso, con el mensaje del hook, ocuparía el lugar de toda la disposición; si estuviera fuera del enrutador, lo atraparía `LimiteDeError`. En los dos casos, el mensaje que verías es el del hook. Y en el punto de control no puede pasar, porque los proveedores envuelven a toda la aplicación (lo ves en 6.2.8). Donde sí podría pasar es en una prueba que monte una página suelta: si alguien olvidara los proveedores al montar, el error lo diría con todas sus letras.

Un detalle más de `useContext` que conviene conocer: si un proveedor existe pero se te olvidó escribir `value`, React no usa el valor por omisión; es como si pasaras `value={undefined}` ([React, `useContext`](https://react.dev/reference/react/useContext)). El hook del `revisor` compara con `null` y dejaría pasar ese `undefined`, pero TypeScript lo atrapa antes: el contexto se creó con tipo `EstadoAvisos | null`, y un proveedor sin `value` no compila.

#### 6.2.5 La bandeja, una región viva

Con los hooks listos, la bandeja es corta:

```tsx
// revisor/src/avisos/BandejaAvisos.tsx
import { useAvisos, useDespachoAvisos } from "./usarAvisos";

export function BandejaAvisos() {
  const { avisos } = useAvisos();
  const despachar = useDespachoAvisos();

  return (
    <section className="bandeja" aria-label="Avisos">
      <div role="status">
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

Lee los avisos con `useAvisos()` y obtiene `despachar` con `useDespachoAvisos()`. Cada botón «Descartar» despacha `descartado` con el identificador de su aviso, y ese mismo identificador es la `key` de la fila, estable y única gracias al contador del reducer. «Descartar todos» solo aparece si hay más de uno.

La parte que se diseñó con cuidado es la accesibilidad. Un aviso aparece en la pantalla sin que la persona lo haya pedido en ese lugar: presionó un botón en otra parte de la página, o se fue a otra página. Quien ve la pantalla lo nota; quien usa un lector de pantalla, no, a menos que el aviso esté dentro de una **región viva**. El rol `status` define una región viva con información de aviso que no es tan importante como para ser una alerta; trae implícitos `aria-live="polite"` y `aria-atomic="true"`, así que el lector la anuncia cuando la persona deja de hacer otra cosa, sin interrumpirla ([MDN, rol `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).

Fíjate en **dónde** está el `role="status"`: en un `div` que existe siempre, aunque no haya avisos. Lo que aparece y desaparece es la lista de adentro. No es un capricho: la guía de regiones vivas de MDN explica que las tecnologías de asistencia, en general, solo anuncian cambios **dinámicos** dentro de una región que ya existe, que conviene establecer la región vacía antes de llenarla, y que lo más confiable es que esté en el marcado inicial ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Si la región apareciera junto con su primer aviso, ese aviso podría no anunciarse nunca. El botón «Descartar todos» queda **fuera** de la región por la misma lógica al revés: aparecer o desaparecer no es una novedad que haya que anunciar. Y el `aria-label` de cada «Descartar» dice qué aviso descarta, para que un lector de pantalla no lea cinco botones idénticos.

Dos consecuencias de esta región que conviene saber, porque no son gratis. La primera viene del `aria-atomic="true"` implícito: con él, cuando la región cambia, el lector la presenta **completa**, aunque solo haya cambiado una parte ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Con cinco avisos en la bandeja, el sexto puede hacer que se lean los cinco que quedan, con los nombres de sus botones. Si eso estorba cuando lo pruebas con un lector de pantalla, `aria-atomic="false"` en el `div` hace que se anuncie solo lo nuevo; el punto de control de esta lección se queda con el comportamiento del rol tal cual. La segunda es una decisión: los avisos de nivel `error` también van en esta región amable, que espera a que la persona termine lo que está haciendo, y no en un `role="alert"`, que interrumpe. El resultado de un reintento no justifica interrumpir; un error que impide seguir trabajando sí lo justificaría.

Con este cambio, el `revisor` tiene dos `role="status"`: el de la bandeja y el «Cargando…» de las páginas. Tenlo presente si algún día buscas un elemento por su rol: «el» `status` de la página ya no es uno solo.

#### 6.2.6 Despachar desde la mutación

El productor de avisos es `useReintentar`, el hook de la mutación de la lección 4:

```ts
// revisor/src/detalle/useReintentar.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDespachoAvisos } from "../avisos/usarAvisos";
import { claves } from "../consultas/claves";
import { reintentarServicio } from "./reintentar";

export function useReintentar(nombre: string) {
  const clienteConsultas = useQueryClient();
  const despachar = useDespachoAvisos();

  return useMutation({
    mutationFn: () => reintentarServicio(nombre),
    onSuccess: async (estado) => {
      despachar({
        tipo: "agregado",
        nivel: estado.tipo === "disponible" ? "exito" : "error",
        texto:
          estado.tipo === "disponible"
            ? `${nombre} se volvió a revisar: disponible`
            : `${nombre} se volvió a revisar: sigue en falla`,
      });
      await Promise.all([
        clienteConsultas.invalidateQueries({ queryKey: claves.reporte }),
        clienteConsultas.invalidateQueries({ queryKey: claves.servicio(nombre) }),
      ]);
    },
    onError: (error) => {
      despachar({
        tipo: "agregado",
        nivel: "error",
        texto: `No se pudo volver a revisar ${nombre}: ${error.message}`,
      });
    },
  });
}
```

Obtiene `despachar` con el hook y lo usa en los dos desenlaces de la mutación. En `onSuccess`, el servidor respondió con el nuevo estado del servicio, y el aviso dice cuál fue: `disponible`, con nivel `exito`, o `sigue en falla`, con nivel `error`. En `onError`, la petición falló y el aviso trae el mensaje del error. Las invalidaciones de la lección 4 siguen ahí, después del aviso. El hook no lee ningún aviso; solo despacha. Es el consumidor del que hablaba 6.2.3: gracias a los dos contextos, que lleguen avisos nuevos no lo obliga a dibujarse otra vez.

Hay una propiedad de estos callbacks que hace que el aviso sobreviva al cambio de página, y que vale la pena saber. TanStack Query distingue entre los callbacks que se pasan a `useMutation`, como aquí, y los que se pasan a `mutate()`: los segundos **no se ejecutan** si el componente se desmontó antes de que terminara la mutación ([TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)). Los de `useMutation` son los que se usan para efectos como invalidar consultas, y por eso se escribieron ahí desde la lección 4. Para el aviso, la consecuencia es justo la que pedía la escena: la persona presiona «Volver a revisar» y se va a la lista; la mutación termina; el aviso se despacha hacia una bandeja que está en la disposición, que nunca se desmontó.

Y como el resultado ya llega a la bandeja, la página del servicio deja de pintar su propia alerta:

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

El único cambio respecto a la lección 5 es lo que falta: el bloque `{reintento.isError && <p role="alert">…</p>}` que estaba debajo del botón. Si se hubiera quedado, un error se anunciaría dos veces, una en la página y otra en la bandeja, y la de la página moriría al salir. Un hecho, un lugar.

#### 6.2.7 Las preferencias: el mismo patrón, sin reducer

Las preferencias usan la misma forma que los avisos (un contexto con `null` por omisión, un proveedor, un hook que lanza), con dos diferencias que son decisiones y conviene entender. El tipo y los valores iniciales:

```ts
// revisor/src/preferencias/preferencias.ts
export interface Preferencias {
  readonly mostrarDuracion: boolean;
  readonly compacto: boolean;
}

export const preferenciasIniciales: Preferencias = { mostrarDuracion: true, compacto: false };

export interface ValorPreferencias {
  readonly preferencias: Preferencias;
  readonly cambiarPreferencias: (cambio: Partial<Preferencias>) => void;
}
```

El contexto, en su archivo:

```ts
// revisor/src/preferencias/contexto.ts
import { createContext } from "react";
import type { ValorPreferencias } from "./preferencias";

export const ContextoPreferencias = createContext<ValorPreferencias | null>(null);
```

El proveedor:

```tsx
// revisor/src/preferencias/ProveedorPreferencias.tsx
import { useState, type ReactNode } from "react";
import { ContextoPreferencias } from "./contexto";
import { preferenciasIniciales, type Preferencias } from "./preferencias";

export function ProveedorPreferencias({ children }: { readonly children: ReactNode }) {
  const [preferencias, establecerPreferencias] = useState<Preferencias>(preferenciasIniciales);

  function cambiarPreferencias(cambio: Partial<Preferencias>): void {
    establecerPreferencias((actuales) => ({ ...actuales, ...cambio }));
  }

  return (
    <ContextoPreferencias value={{ preferencias, cambiarPreferencias }}>
      {children}
    </ContextoPreferencias>
  );
}
```

**Primera diferencia: `useState` y no `useReducer`.** Hay dos casillas, y la única operación es «cambia estas preferencias». Una función `cambiarPreferencias` que recibe un `Partial<Preferencias>` y lo mezcla con la forma actualizadora de la lección 2 lo resuelve en tres renglones. Un reducer con una acción `cambiado` sería el mismo código con más ceremonia. La documentación pone así el criterio: `useState` se lee muy bien cuando las actualizaciones son simples ([React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer)). El reducer se ganó su lugar en los avisos por el tope, el contador y tres formas distintas de cambiar la lista, y aquí no hay nada de eso.

**Segunda diferencia: un solo contexto, con un objeto.** El `value` es `{ preferencias, cambiarPreferencias }`, un objeto nuevo en cada dibujo del proveedor, y `cambiarPreferencias` también es una función nueva cada vez. ¿No es el problema de 6.2.3? Mira quién lee este contexto: `PanelPreferencias`, que muestra las casillas y también las cambia, y `Descripcion`, que lee `mostrarDuracion`, más la disposición, que lee `compacto`. **Todos leen las preferencias.** No hay un consumidor que solo escriba, así que separar el despacho no ahorraría ningún dibujo: cuando las preferencias cambian, todos tienen que dibujarse de nuevo de todos modos. ¿Y el objeto nuevo en cada dibujo? `ProveedorPreferencias` solo se vuelve a dibujar cuando cambia su propio estado, porque recibe su contenido como `children`; y cuando cambia su estado, el objeto nuevo es exactamente lo que se quiere avisar. No hay ningún dibujo que memoizar.

El hook, igual al de los avisos:

```ts
// revisor/src/preferencias/usarPreferencias.ts
import { useContext } from "react";
import { ContextoPreferencias } from "./contexto";
import type { ValorPreferencias } from "./preferencias";

export function usePreferencias(): ValorPreferencias {
  const valor = useContext(ContextoPreferencias);

  if (valor === null) {
    throw new Error("usePreferencias necesita un <ProveedorPreferencias> más arriba en el árbol");
  }

  return valor;
}
```

El panel con las dos casillas, que vive en el encabezado:

```tsx
// revisor/src/preferencias/PanelPreferencias.tsx
import { usePreferencias } from "./usarPreferencias";

export function PanelPreferencias() {
  const { preferencias, cambiarPreferencias } = usePreferencias();

  return (
    <fieldset className="preferencias">
      <legend>Preferencias</legend>
      <label>
        <input
          type="checkbox"
          checked={preferencias.mostrarDuracion}
          onChange={(evento) => cambiarPreferencias({ mostrarDuracion: evento.target.checked })}
        />{" "}
        Mostrar duración
      </label>
      <label>
        <input
          type="checkbox"
          checked={preferencias.compacto}
          onChange={(evento) => cambiarPreferencias({ compacto: evento.target.checked })}
        />{" "}
        Vista compacta
      </label>
    </fieldset>
  );
}
```

Son casillas **controladas**: lo que muestran sale de `preferencias`, y cada cambio pasa por `cambiarPreferencias`. Van dentro de un `fieldset` con `legend`, el agrupador nativo de HTML para controles relacionados, que le da a un lector de pantalla el nombre del grupo, «Preferencias», antes de cada casilla. Y cada `input` está dentro de su `label`, así que el texto de la etiqueta es su nombre y hacer clic en el texto marca la casilla.

Y el consumidor profundo, la razón de todo esto:

```tsx
// revisor/src/reporte/FilaEstado.tsx
import { Link } from "react-router";
import type { EstadoPublico } from "../compartido/contrato";
import { usePreferencias } from "../preferencias/usarPreferencias";

function Descripcion({ estado }: { readonly estado: EstadoPublico }) {
  const { preferencias } = usePreferencias();

  if (estado.tipo === "disponible") {
    return preferencias.mostrarDuracion ? (
      <>
        disponible (HTTP {estado.codigoHttp}, {estado.duracionMs} ms)
      </>
    ) : (
      <>disponible (HTTP {estado.codigoHttp})</>
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

`usePreferencias()` se llama en `Descripcion`, que es exactamente quien pinta la duración, y en ningún otro componente de la lista. `ListaEstados`, `ContenidoReporte` y `PaginaReporte` no cambiaron ni un renglón. Compáralo con la escena: el mismo resultado, sin tocar los tres archivos de en medio. Y `FilaEstado` no cambió su firma: sigue recibiendo `estado` y `tieneNota` y nada más.

A la hoja de estilos se le agregan, al final, las reglas de la bandeja, del grupo de preferencias y de la vista compacta:

```css
/* agregado al final de revisor/src/reporte/panel.css */
.preferencias {
  border: none;
  display: flex;
  gap: 1rem;
  padding: 0;
}

.bandeja ul {
  margin: 0.5rem 0;
}

.bandeja li.aviso-exito {
  border-color: #1a7f37;
}

.bandeja li.aviso-error {
  border-color: #cf222e;
}

main.compacto li {
  margin: 0.125rem 0;
  padding: 0.125rem 0.5rem;
}
```

#### 6.2.8 Dónde van los proveedores

Un proveedor solo sirve a lo que tiene **adentro**. La pregunta es, entonces, qué tan arriba ponerlo. La disposición necesita las preferencias (para la clase `compacto`) y dibuja la bandeja (que necesita los avisos). `PaginaServicio` necesita despachar. Las dos viven dentro del enrutador, así que los proveedores tienen que estar **por encima** del `RouterProvider`. Se juntan en un componente:

```tsx
// revisor/src/app/Proveedores.tsx
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ProveedorAvisos } from "../avisos/ProveedorAvisos";
import { ProveedorPreferencias } from "../preferencias/ProveedorPreferencias";

export function Proveedores({
  clienteConsultas,
  children,
}: {
  readonly clienteConsultas: QueryClient;
  readonly children: ReactNode;
}) {
  return (
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorPreferencias>
        <ProveedorAvisos>{children}</ProveedorAvisos>
      </ProveedorPreferencias>
    </QueryClientProvider>
  );
}
```

El orden tiene una razón. `QueryClientProvider` va afuera, como en la lección 4. Preferencias y avisos son independientes entre sí, así que su orden relativo no importa; lo que importa es que los dos queden dentro del cliente de consultas y fuera del enrutador. El cliente de consultas se recibe como propiedad, en lugar de crearse adentro, para que quien monte la aplicación decida cuál usar. Una prueba, por ejemplo, querría un `QueryClient` nuevo para cada caso, sin reintentos, y con este componente podría reutilizar exactamente los mismos proveedores que la aplicación de verdad. Si mañana se agrega un cuarto proveedor, se agrega aquí, y todo lo que use `Proveedores` lo recibe sin cambiar.

`main.tsx` usa `Proveedores` en lugar del `QueryClientProvider` que tenía:

```tsx
// revisor/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Proveedores } from "./app/Proveedores";
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
      <Proveedores clienteConsultas={clienteConsultas}>
        <RouterProvider router={enrutador} />
      </Proveedores>
    </LimiteDeError>
  </StrictMode>,
);
```

Y la disposición dibuja el panel de preferencias en el encabezado, la bandeja entre el encabezado y el contenido, y aplica la clase `compacto`:

```tsx
// revisor/src/app/Disposicion.tsx
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { BandejaAvisos } from "../avisos/BandejaAvisos";
import { PanelPreferencias } from "../preferencias/PanelPreferencias";
import { usePreferencias } from "../preferencias/usarPreferencias";
import { conNota, type Notas } from "../reporte/notas";
import "../reporte/panel.css";
import type { ContextoNotas } from "./contextoNotas";

export function Disposicion() {
  const [notas, establecerNotas] = useState<Notas>({});
  const { preferencias } = usePreferencias();

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
        <PanelPreferencias />
      </header>
      <BandejaAvisos />
      <main className={preferencias.compacto ? "compacto" : undefined}>
        <Outlet context={contexto} />
      </main>
    </>
  );
}
```

La bandeja está **fuera** de `<main>` y fuera del `Outlet`: no pertenece a ninguna página, y por eso ninguna página se la lleva al desmontarse. Las notas siguen exactamente donde las dejó la lección 5, en el `useState` de la disposición, y bajan por `<Outlet context>`. La siguiente sección explica por qué ahí.

### 6.3 Qué estado vive dónde

#### 6.3.1 El inventario

Con esta lección, el `revisor` tiene estado en cinco lugares distintos. Cada uno tiene su razón, y conviene poder decirla en una frase:

| Estado | Dónde vive | Por qué ahí |
|---|---|---|
| borrador de una nota | **local**: `useState` en `EditorNota` | solo le importa a quien escribe, y se reinicia al cambiar de servicio con `key={nombre}` |
| «Solo fallas» y texto buscado | **dirección**: `?fallas=1&q=` | describen la vista; se comparten copiando el enlace y sobreviven a una recarga |
| servicio que estás viendo | **dirección**: `/servicios/:nombre` | es la página misma |
| lista de servicios y detalle | **servidor**: TanStack Query, `["reporte"]` y `["servicio", nombre]` | son del servidor; la pantalla guarda una copia en caché que se actualiza sola |
| notas guardadas | **disposición**: `useState` en `Disposicion`, bajan por `<Outlet context>` | las usan dos páginas, la lista y el detalle, y nadie fuera de las páginas |
| avisos | **contexto**: `useReducer` en `ProveedorAvisos` | los producen las páginas y los muestra la disposición; deben sobrevivir al cambio de página |
| preferencias | **contexto**: `useState` en `ProveedorPreferencias` | las cambia el encabezado y las lee una fila cinco niveles abajo |

La regla que ordena la tabla es la de la lección 2, con más pisos. La documentación de React la llama tener **una sola fuente de verdad**: para cada pedazo de estado eliges el componente que lo «posee», y eso no significa que todo el estado viva en un lugar, sino que cada pedazo vive en un componente específico ([React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components)). Lo que esta lección agrega son dos lugares más para elegir, la dirección y el servidor ya los tenías, y una forma de decidir.

#### 6.3.2 Las preguntas, en orden

Ante un dato nuevo, haz estas preguntas en este orden, y quédate con la primera respuesta que sea «sí»:

1. **¿Se puede calcular a partir de otro estado o de las propiedades?** Entonces no es estado. Se calcula al dibujar. Es la regla de la lección 2 («evita el estado redundante», [React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure)); el número de fallas del título y la lista filtrada del reporte se calculan, no se guardan.
2. **¿Es del servidor?** Entonces vive en el servidor y la pantalla lo pide con TanStack Query. Copiarlo a un `useState` crea dos verdades que se desincronizan.
3. **¿Describe lo que la persona está viendo, de modo que querría compartirlo o recargarlo?** Entonces va en la dirección.
4. **¿Lo usa un solo componente?** Entonces es local.
5. **¿Lo usan varios?** Súbelo al antepasado común más cercano y pásalo por propiedades. Si el antepasado común es la disposición y los que lo usan son páginas, el canal es `<Outlet context>`.
6. **¿Las propiedades obligan a atravesar componentes que no lo usan, y reacomodar con `children` no lo resuelve sin mezclar responsabilidades?** Entonces, contexto.

El contexto es la última pregunta, no la primera. No porque sea malo, sino porque es el que más esconde: un componente que lee un contexto depende de algo que no aparece en su firma. La documentación de React defiende las propiedades justo por eso: dejan claro qué componente usa qué dato ([React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context)).

#### 6.3.3 Por qué las notas no pasan a contexto

Es la pregunta obvia de esta lección. Las notas ya suben hasta la disposición, ya las comparten dos páginas, y ahora hay contextos por todas partes. ¿Por qué no un `ProveedorNotas` junto a los otros dos? Pasa las notas por las seis preguntas y la respuesta sale sola: se quedan en la quinta. Las usan varios componentes, sí, pero **todos son páginas**, y el antepasado común de las páginas es la disposición. El canal ya existe y es el que el enrutador ofrece para esto: React Router presenta `<Outlet context>` como la solución integrada al caso en que una ruta padre maneja estado que quiere compartir con sus hijas, y dice que podrías crear tu propio contexto, pero que el caso es tan común que viene dentro del `Outlet` ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)).

Hay tres razones más, y son concretas:

- **El alcance es el correcto.** Con el `Outlet`, las notas solo llegan a las páginas. Un contexto puesto en `Proveedores` las haría visibles para todo: la bandeja, el panel de preferencias, cualquier componente futuro. Nadie fuera de las páginas las necesita, y darle a un dato más alcance del que necesita es invitar a que alguien dependa de él.
- **Los consumidores no están lejos.** `PaginaReporte` lee las notas y las baja a `ListaEstados`, que las usa para calcular `tieneNota`. En medio hay un solo componente, `ContenidoReporte`, que las recibe y las pasa sin usarlas. Un paso intermedio no es la escena del principio de la lección, con tres componentes que solo cargan un dato: es el caso en que la documentación pide propiedades, porque dejan ver qué componente usa qué dato.
- **El cambio, si algún día hace falta, es de un archivo.** Las páginas no llaman a `useOutletContext`: llaman a `useNotas()`, el hook que la lección 5 escribió siguiendo la recomendación de React Router. Si un componente que no es página (la bandeja, por ejemplo) llegara a necesitar las notas, se crearía un contexto, `useNotas()` pasaría a leerlo, y ninguna página cambiaría. Esa es la señal concreta que cambiaría la decisión: **un consumidor fuera del `Outlet`**. Mientras no exista, el contexto no resuelve ningún problema.

Y una aclaración honesta: ni el `Outlet` ni un contexto resuelven que las notas se pierdan al recargar. Las dos opciones guardan en la memoria de la pestaña. Si las notas tuvieran que durar, su lugar sería el servidor (la segunda pregunta), y la API de práctica no tiene una ruta para eso. Mover las notas a un contexto no las acercaría a ese destino; solo cambiaría el cable.

#### 6.3.4 Y Redux, ¿cuándo?

El README del curso dice que Redux no se enseña, y esta tabla explica por qué no hace falta: el estado del servidor, que en muchas aplicaciones es la mayor parte de lo que se metía en un almacén global, ya lo maneja TanStack Query; la dirección guarda la vista; y lo poco que queda compartido son dos piezas pequeñas, con un reducer y un contexto cada una. La guía de React termina justo así: puedes tener muchas parejas de contexto y reducer en tu aplicación ([React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context)). Una librería de estado global empieza a tener sentido cuando hay mucho estado de cliente compartido, que cambia seguido y que leen muchos componentes, cada uno solo una parte. Es un criterio propio, no una regla de React; y el `revisor` está lejos de ahí.

#### 6.3.5 El recorrido completo

Con todo en su lugar, el recorrido usa dos terminales, como en las lecciones anteriores: `npm run servidor` en una, y `npm run build` seguido de `npm run preview` en la otra. La construcción termina así:

```text
$ npm run build

> revisor@0.6.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 183 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-D-tTS2ut.css    1.11 kB │ gzip:   0.52 kB
dist/assets/index-DBIHM1Pv.js   362.37 kB │ gzip: 112.97 kB

✓ built in 258ms
```

Abre `http://localhost:4173/`. El encabezado trae ahora el grupo de preferencias, y debajo, la bandeja vacía. Esto es lo que entregó Chrome para esas dos piezas:

```text
<header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header>
<section class="bandeja" aria-label="Avisos"><div role="status"></div></section>
```

La región viva existe aunque esté vacía, que es lo que pedía 6.2.5. Haz clic en `pagos`, espera el detalle (el servidor de práctica tarda un segundo y medio a propósito) y presiona «Volver a revisar». La bandeja recibe el aviso que viste al principio de la lección. Ahora presiona «Volver al reporte»: la página del servicio se desmonta, la lista se monta, y el aviso **sigue ahí**, con `pagos` ya disponible en la lista:

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200, 42 ms)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200, 95 ms)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

Desmarca «Mostrar duración». Las filas disponibles pierden los milisegundos, y nada más cambia:

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

Y «Descartar» deja la bandeja como al principio: `<div role="status"></div>`, vacía pero presente. La bitácora del servidor de práctica registró el recorrido entero:

```text
08:37:54.148 GET /api/estados 200
08:37:57.289 GET /api/servicios/pagos 200
08:37:58.601 POST /api/servicios/pagos/reintento 200
08:37:59.809 GET /api/servicios/pagos cancelada por el cliente
08:38:00.110 GET /api/estados 200
```

Léela de arriba abajo, porque cuenta una historia que confirma dos cosas de la lección. El `POST` es la mutación. El `GET` del detalle que sigue es la invalidación de `["servicio", "pagos"]` que hace `useReintentar` en su `onSuccess`, y quedó **cancelado**: el servidor tarda un segundo y medio en responder el detalle de `pagos`, y antes de eso la persona ya había vuelto a la lista, la página del detalle se desmontó y TanStack Query canceló la petición que ya nadie esperaba: cuando una consulta queda inactiva mientras se trae, su `signal` se aborta, y como `consultaDetalle` le pasa ese `signal` a `fetch`, la petición se corta ([TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). Lo importante es lo que no pasó: el aviso no esperó a esa petición. Llegó a la bandeja antes de que la persona saliera, porque `useReintentar` despacha **primero** y espera las invalidaciones **después**. Si el orden fuera el contrario, el aviso habría tardado lo que tarda la recarga más lenta. El último `GET /api/estados` es la lista, que se volvió a pedir al montarse porque la invalidación la había marcado como vieja. Y hay un solo `GET /api/estados` al abrir la página: la versión construida no tiene el ciclo extra de `StrictMode`.

## El error que vas a ver

La lección tiene dos errores principales, el del proveedor que falta y el aviso de React que aparece cuando el reducer modifica el estado, y dos de apoyo que da el compilador.

**El error principal: un hook de contexto sin su proveedor.** Ya lo viste en la figura 2, en un DOM de prueba. En una aplicación se provoca moviendo un componente fuera de su proveedor, o montándolo solo en una prueba. El mensaje es el que escribiste en el hook:

```text
useAvisos necesita un <ProveedorAvisos> más arriba en el árbol
```

Se lee así: el componente que llamó a `useAvisos` no tiene ningún `ProveedorAvisos` entre sus antepasados. El arreglo nunca es quitar la comprobación ni darle al contexto un valor por omisión: es poner el proveedor donde corresponde, por encima del componente. Si el error aparece en una prueba, monta con `Proveedores`, que existe justo para eso. Y si aparece **sin** mensaje, como una pantalla que dice «0 avisos» y no reacciona, sospecha de un contexto con un valor por omisión que hace como que funciona (la versión A de la figura 2).

**Los dos errores de apoyo: modificar el estado y olvidar una acción.** Esta figura es el reducer de los avisos con dos cambios a propósito: se agrega a la unión una cuarta acción, `fijado`, sin su `case`; y `agregado` hace `push` sobre la lista que recibió, en lugar de crear una nueva.

```ts
// fig06_04.ts
export type NivelAviso = "exito" | "error";

export interface Aviso {
  readonly id: number;
  readonly nivel: NivelAviso;
  readonly texto: string;
}

export interface EstadoAvisos {
  readonly avisos: readonly Aviso[];
  readonly siguienteId: number;
}

export type AccionAvisos =
  | { readonly tipo: "agregado"; readonly nivel: NivelAviso; readonly texto: string }
  | { readonly tipo: "descartado"; readonly id: number }
  | { readonly tipo: "todos-descartados" }
  | { readonly tipo: "fijado"; readonly id: number };

export const estadoInicialAvisos: EstadoAvisos = { avisos: [], siguienteId: 1 };

export const MAXIMO_AVISOS = 5;

export function reducirAvisos(estado: EstadoAvisos, accion: AccionAvisos): EstadoAvisos {
  switch (accion.tipo) {
    case "agregado": {
      const nuevo: Aviso = { id: estado.siguienteId, nivel: accion.nivel, texto: accion.texto };
      estado.avisos.push(nuevo);
      return { ...estado, siguienteId: estado.siguienteId + 1 };
    }
    case "descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.id !== accion.id) };
    case "todos-descartados":
      return { ...estado, avisos: [] };
    default: {
      const sinAtender: never = accion;
      throw new Error(`acción sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --noEmit fig06_04.ts
fig06_04.ts(29,21): error TS2339: Property 'push' does not exist on type 'readonly Aviso[]'.
fig06_04.ts(37,13): error TS2322: Type '{ readonly tipo: "fijado"; readonly id: number; }' is not assignable to type 'never'.
```

El primero, `TS2339`, dice que `push` no existe en un `readonly Aviso[]`. Es el `readonly` del tipo trabajando: una lista de solo lectura no tiene los métodos que modifican, ni `push`, ni `splice`, ni `sort`. Sin ese `readonly`, el código compilaría y el error sería peor, porque llegaría sin ningún aviso del compilador. Lo que pasa entonces es el siguiente error.

**El error de React: dos avisos con la misma clave.** Para verlo hay que saltarse el `readonly` a propósito. En una copia del punto de control, el `case "agregado"` de `avisos.ts` se cambió por `(estado.avisos as Aviso[]).push(nuevo); return { ...estado, siguienteId: estado.siguienteId + 1 };`. El `as` le dice a TypeScript «confía en mí», y compila. Con esa copia en `npm run dev`, en la página de `pagos`, un solo clic en «Volver a revisar» dejó esto en la bandeja:

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div><button type="button">Descartar todos</button></section>
```

Y la consola del navegador, este error de React (el mensaje llega con un `%s` que la consola sustituye por el `1` que viaja aparte; se muestra ya sustituido):

```text
Encountered two children with the same key, `1`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

Un clic, un aviso despachado, y dos avisos en pantalla con el mismo identificador. La causa es el doble llamado de 6.1.3. En `StrictMode`, React llama al reducer **dos veces con el mismo estado** y se queda con uno de los dos resultados ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Con un reducer puro, eso no se nota: los dos resultados son iguales y se descarta uno. Con el `push`, cada llamada modificó **el mismo arreglo**, el que estaba en el estado, así que el aviso quedó dentro dos veces, con el mismo `id`, porque las dos llamadas leyeron el mismo `siguienteId`. React lo detectó al ver dos hijos con la misma `key`. Hay un daño más, que no se ve: el primer `push` cayó sobre `estadoInicialAvisos`, el objeto de nivel de módulo que sirve de punto de partida, y lo dejó sucio para cualquiera que lo vuelva a usar. Y en la versión construida, sin `StrictMode`, el duplicado no aparecería: el defecto seguiría ahí, solo que sin el aviso que lo delata. La documentación de `useReducer` es tajante: el estado es de solo lectura, no modifiques objetos ni arreglos del estado ([React, `useReducer`](https://react.dev/reference/react/useReducer)). El arreglo es el del punto de control: una lista nueva con `[nuevo, ...estado.avisos]`. Y la lección es doble: el `readonly` lo atrapa antes de correr, y `StrictMode` lo atrapa al correr si alguien se salta el `readonly`.

El segundo, `TS2322`, es la comprobación exhaustiva de 6.1.3 cumpliendo su promesa: el tipo `fijado` llegó al `default` y no se puede asignar a `never`. El mensaje nombra la acción que falta y el renglón del `switch`. El arreglo es escribir su `case`. Fíjate en que el error no está donde agregaste la acción, sino donde **olvidaste** atenderla: eso es lo valioso.

## Lo que se hace mal

**Meter todo en un contexto «por si acaso».** Cada contexto es una dependencia que no aparece en la firma del componente. Si un dato lo usan dos componentes vecinos, pásalo por propiedades. El contexto se gana su lugar cuando las propiedades atraviesan componentes que no usan el dato y `children` no lo arregla.

**Un solo contexto con `{ estado, despachar }` cuando hay quien solo despacha.** Cada cambio de estado vuelve a dibujar a todos los que leen el contexto, también a los que nunca muestran el estado. La figura 3 lo midió: cuatro dibujos contra uno. Separa en dos.

**Un valor por omisión que «funciona».** Una lista vacía y una función que no hace nada convierten un proveedor olvidado en una pantalla que miente sin error. Usa `null` y un hook que lance.

**Efectos dentro del reducer.** Un `fetch`, un `setTimeout`, un `console.log` que decide algo o un contador fuera de la función. El reducer se llama dos veces en `StrictMode` y debe dar siempre lo mismo para la misma entrada. Lo que tenga que pasar fuera de React va en un manejador de eventos o, si es sincronizar, en un Effect (el ejercicio 3 lo hace).

**Acciones que dan órdenes.** `{ tipo: "establecer-lista", avisos: [...] }` convierte al reducer en un `useState` disfrazado: la lógica vuelve a quedar repartida en quien despacha. Las acciones describen lo que pasó; las reglas viven en el reducer.

**Mutar el estado.** Si haces `estado.avisos.push(nuevo)` y devuelves el mismo `estado`, React compara con `Object.is`, concluye que nada cambió y no dibuja. Si devuelves un objeto nuevo con la lista modificada adentro, dibuja, pero el doble llamado de `StrictMode` mete el aviso dos veces con la misma clave, como viste en «El error que vas a ver». Con `readonly` en los tipos, TypeScript no te deja.

**Pintar el mismo hecho en dos lugares.** Si el error del reintento sale en la página y en la bandeja, se anuncia dos veces y una de las dos muere al navegar. Un hecho, un lugar.

**Crear la región viva junto con su contenido.** Un `{avisos.length > 0 && <div role="status">…</div>}` hace que la región aparezca con el primer aviso ya adentro, y ese aviso puede no anunciarse. La región existe siempre; lo que cambia es su contenido.

**Memoizar el valor del contexto por reflejo.** `useMemo` y `useCallback` son herramientas con costo. Antes de usarlas, mide: en el `revisor`, separar estado y despacho resolvió lo que había que resolver, y el proveedor de preferencias no tiene dibujos que ahorrar.

## Ejercicios

### Ejercicio 1 — Predice el reducer

Sin correr nada, predice qué imprime la primera línea de la figura 1 si en lugar de seis letras pasas siete (`"a"` a `"g"`), y qué pasa si después despachas `{ tipo: "descartado", id: 1 }`. ¿Cambia `siguienteId`? ¿Devuelve el reducer el mismo objeto que recibió? Comprueba tus predicciones cambiando la figura y corriéndola.

### Ejercicio 2 — Una acción nueva, guiada por el compilador

Agrega a los avisos una acción que descarte todos los avisos de un nivel: `{ tipo: "nivel-descartado", nivel: NivelAviso }`. Hazlo en tu copia `avisos.ts` de las figuras. **Primero** agrega solo el miembro a la unión y corre `tsc`: predice qué renglón va a señalar. Después escribe el `case` y comprueba, con una variante de la figura 1, que con tres avisos de éxito y dos de error, descartar el nivel `error` deja tres.

### Ejercicio 3 — Avisos que se van solos

Haz que cada aviso de **éxito** se descarte solo a los cinco segundos; los de error se quedan hasta que la persona los descarte. **Antes de escribir**, decide dónde va el temporizador: ¿en el reducer, en `useReintentar` o en la bandeja? Escribe en tu bitácora por qué. La solución no debe silenciar el linter, y el temporizador se tiene que cancelar si la persona descarta el aviso antes de tiempo.

### Ejercicio 4 — Una columna más en la tabla

Sin mirar 6.3.1, dónde pondrías cada uno de estos datos nuevos, y por qué: (a) el modo oscuro de la pantalla; (b) qué servicio tiene el foco del teclado dentro de la lista; (c) el nombre de la persona que inició sesión, que se usa en el encabezado y en el formulario de alta; (d) las preferencias de 6.2.7, si se quisiera que sobrevivieran a una recarga; (e) el número de avisos sin leer, para mostrarlo en el título de la pestaña.

## Soluciones

### Solución 1

Con siete letras quedan cinco avisos, del 7 al 3: `[7:g, 6:f, 5:e, 4:d, 3:c] siguienteId=8`. Las dos más viejas se caen por el tope. Si después descartas el identificador 1, el reducer no encuentra nada que quitar y la lista queda igual, con `siguienteId` en 8: descartar nunca mueve el contador. ¿Devuelve el mismo objeto? **No**: `{ ...estado, avisos: estado.avisos.filter(…) }` crea siempre un objeto nuevo y una lista nueva, aunque tengan el mismo contenido. Es correcto (el reducer no modificó nada), pero significa que React volverá a dibujar la bandeja aunque no haya cambiado nada visible, porque `Object.is` compara identidades y no contenidos. Si alguna vez una medición mostrara que eso importa, el arreglo sería devolver `estado` tal cual cuando el `id` no existe. Hoy no hay ninguna medición que lo pida. Para comprobarlo, compara con `===` en la figura: `console.log(reducirAvisos(conSiete, { tipo: "descartado", id: 1 }) === conSiete)` imprime `false`.

### Solución 2

Al agregar solo el miembro a la unión, `tsc` señala el renglón de `const sinAtender: never = accion;` con un `TS2322` que nombra el tipo nuevo, igual que la figura 4. El `case` que falta:

```ts
// avisos.ts con la acción nueva (fragmento)
    case "nivel-descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.nivel !== accion.nivel) };
```

Dentro de ese `case`, TypeScript ya sabe que `accion` es la variante con `nivel`, así que `accion.nivel` compila sin ningún `as`. La comprobación: con tres `agregado` de nivel `exito` y dos de nivel `error`, el estado tiene cinco avisos; después de `{ tipo: "nivel-descartado", nivel: "error" }` quedan los tres de éxito, con sus identificadores intactos y `siguienteId` en 6. Fíjate en el nombre: `nivel-descartado` describe lo que hizo la persona, no «filtrar la lista».

### Solución 3

El temporizador **no** va en el reducer: un `setTimeout` es un efecto, y el reducer tiene que ser puro (6.1.3). Tampoco en `useReintentar`, porque el temporizador tiene que vivir lo que vive el aviso, y el aviso vive en la bandeja, no en la página que lo produjo. Va en la bandeja, y es un Effect legítimo en el sentido de la lección 3: **sincroniza** cada aviso visible con un temporizador, que es un sistema externo a React. La forma más limpia es darle a cada aviso su propio componente, para que su Effect empiece cuando aparece y se limpie cuando desaparece:

```tsx
// BandejaAvisos.tsx con descarte automático (fragmento)
function FilaAviso({ aviso }: { readonly aviso: Aviso }) {
  const despachar = useDespachoAvisos();

  useEffect(() => {
    if (aviso.nivel !== "exito") {
      return;
    }
    const temporizador = setTimeout(() => despachar({ tipo: "descartado", id: aviso.id }), 5_000);
    return () => clearTimeout(temporizador);
  }, [aviso.id, aviso.nivel, despachar]);

  return (
    <li className={`aviso-${aviso.nivel}`}>
      {aviso.texto}{" "}
      <button
        type="button"
        aria-label={`Descartar: ${aviso.texto}`}
        onClick={() => despachar({ tipo: "descartado", id: aviso.id })}
      >
        Descartar
      </button>
    </li>
  );
}
```

Y en `BandejaAvisos`, el `map` dibuja `<FilaAviso key={aviso.id} aviso={aviso} />`. Tres cosas que vale la pena notar. Las dependencias nombran todo lo que el Effect usa, incluido `despachar`; la documentación de `useReducer` aclara que, como su identidad es estable, incluirlo no hará que el Effect se repita ([React, `useReducer`](https://react.dev/reference/react/useReducer)), así que no hay razón para quitarlo y silenciar el linter. Si la persona descarta el aviso antes de los cinco segundos, la fila se desmonta, la limpieza cancela el temporizador y no se despacha nada de más (y aunque se despachara, `descartado` sobre un `id` que ya no está no rompe nada, como viste en la solución 1). Y con `StrictMode` el temporizador se crea, se cancela y se vuelve a crear al montar: la prueba gratuita de la lección 0 de que la limpieza existe. Este fragmento se revisó con el linter del curso sobre una copia de la bandeja y no dio ningún aviso.

Una advertencia de accesibilidad: un aviso que desaparece solo es un límite de tiempo en el sentido de las pautas WCAG, que cuentan como tal a cualquier proceso que ocurre, sin que la persona lo inicie, después de un tiempo fijo ([W3C, «Understanding SC 2.2.1: Timing Adjustable»](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)). Aquí se puede, porque el resultado también se ve en la lista, y por eso solo se van solos los de éxito. Si un aviso fuera la única forma de enterarse de algo, cinco segundos no alcanzan para todas las personas: no lo hagas, o deja que la persona lo desactive.

### Solución 4

(a) **Modo oscuro**: contexto, igual que las preferencias, y por la misma razón: lo cambia un control y lo leen componentes por todas partes; es el primer ejemplo que da la documentación de React para el contexto. (b) **El foco del teclado**: en ningún estado tuyo; el foco lo maneja el navegador, y guardarlo en React crea dos verdades. Si un componente necesita mover el foco, usa una referencia al elemento, no un estado. (c) **La persona que inició sesión**: contexto, y es el segundo ejemplo de la documentación; pero el dato en sí viene del servidor, así que lo correcto es una consulta de TanStack Query (que ya es accesible desde cualquier componente con `useQuery`), y quizá ni haga falta un contexto propio. (d) **Preferencias que sobreviven a una recarga**: el contexto se queda como canal, pero el valor tiene que guardarse fuera de la memoria de la pestaña: en el almacenamiento del navegador, si son de esta máquina, o en el servidor, si deben seguir a la persona a otra computadora. Leer y escribir ese almacenamiento es sincronizarse con algo externo, y el proveedor sería quien lo hiciera. (e) **Avisos sin leer en el título**: **no es estado**. Se calcula a partir de los avisos que ya están en el contexto (primera pregunta de 6.3.2), y escribirlo en `document.title` es el trabajo de `useTituloDocumento`, el Effect de la lección 3.

## Cómo sé que lo logré

- [ ] `npm ci`, `npm run lint` y `npm run build` terminan bien dentro de `~/curso-react/revisor/`, y `npm run build` deja `dist/assets/index-DBIHM1Pv.js` si tu código es idéntico al del punto de control.
- [ ] `grep -rn "eslint-disable" src/` no encuentra nada.
- [ ] La figura 1 imprime `seis agregados: [6:f, 5:e, 4:d, 3:c, 2:b] siguienteId=7` y termina con las tres líneas que comprueban que el reducer no modificó lo que recibió.
- [ ] En una copia con el `push` y `npm run dev`, un clic en «Volver a revisar» deja dos avisos iguales y el error `Encountered two children with the same key` en la consola, y puedes explicar por qué lo provoca `StrictMode`.
- [ ] Puedes provocar los dos errores de la figura 4 en una copia del reducer y explicar cada uno: `TS2339` por modificar una lista `readonly` y `TS2322` por una acción que llega al `default`.
- [ ] La figura 3 muestra el botón dibujado 4 veces con un contexto y 1 con dos, y puedes explicar por qué la bandeja se dibuja 4 veces en los dos casos.
- [ ] La figura 2 muestra «0 avisos» sin ningún error en la versión A y el mensaje del hook en la versión B, y puedes decir por qué B es preferible.
- [ ] Con el servidor de práctica y `npm run preview` encendidos, la página `/` muestra en el encabezado las casillas «Mostrar duración» (marcada) y «Vista compacta», y debajo una bandeja vacía con `role="status"`.
- [ ] En `/servicios/pagos`, «Volver a revisar» deja en la bandeja `pagos se volvió a revisar: disponible`, y el aviso sigue ahí después de volver a la lista con «Volver al reporte».
- [ ] Al desmarcar «Mostrar duración», las filas disponibles pierden los milisegundos sin que `ListaEstados`, `ContenidoReporte` ni `PaginaReporte` hayan cambiado.
- [ ] Puedes recitar la tabla de 6.3.1 sin mirarla, con una razón por renglón, y decir qué tendría que pasar para que las notas pasaran a un contexto.
- [ ] Anotaste en tu [bitácora](bitacora.md) dónde vive cada estado de tu `revisor` y por qué elegiste ese lugar para el temporizador del ejercicio 3.

## Resumen

Responde sin mirar la lección:

1. ¿Por qué un reducer se llama así, y qué tiene que ver con `Array.prototype.reduce`?
2. ¿Qué describe una acción? ¿Por qué `agregado` y no `recortar-a-cinco`?
3. ¿Qué hace el `default` con `never` del reducer, y en qué momento te ayuda?
4. ¿Por qué el reducer guarda `siguienteId` en el estado en lugar de usar un contador fuera de la función?
5. ¿Qué dos cosas conviene intentar antes de un contexto? ¿Por qué ninguna de las dos sirve para las preferencias del `revisor`?
6. ¿Por qué los avisos usan dos contextos y las preferencias uno solo?
7. ¿Qué pasa si un componente lee un contexto sin proveedor, con valor por omisión `null` y sin él? ¿Por qué el hook lanza un error?
8. ¿Por qué el `role="status"` de la bandeja existe aunque no haya avisos?
9. ¿Por qué las notas siguen en la disposición y no en un contexto? ¿Qué tendría que pasar para que eso cambiara?

## Para leer más

- [React, «Extracting State Logic into a Reducer»](https://react.dev/learn/extracting-state-logic-into-a-reducer): acciones que describen lo que hizo la persona, reducers puros, el origen del nombre y la comparación con `useState`. Consultado el 21 de octubre de 2026.
- [React, `useReducer`](https://react.dev/reference/react/useReducer): la firma, el doble llamado del reducer en `StrictMode`, el estado de solo lectura, la comparación con `Object.is` y la identidad estable de `dispatch`. Consultado el 21 de octubre de 2026.
- [React, «Passing Data Deeply with Context»](https://react.dev/learn/passing-data-deeply-with-context): las dos alternativas antes del contexto, la advertencia sobre usarlo de más y sus usos (tema, cuenta, enrutamiento, estado). Consultado el 21 de octubre de 2026.
- [React, `createContext`](https://react.dev/reference/react/createContext): el valor por omisión como último recurso, `<Contexto>` como proveedor desde React 19 y los contextos en un archivo aparte. Consultado el 21 de octubre de 2026.
- [React, `useContext`](https://react.dev/reference/react/useContext): el proveedor más cercano hacia arriba, el redibujo de los consumidores comparado con `Object.is`, la optimización con `useMemo` y el caso del `value` olvidado. Consultado el 21 de octubre de 2026.
- [React, «Scaling Up with Reducer and Context»](https://react.dev/learn/scaling-up-with-reducer-and-context): dos contextos (estado y despacho), los hooks propios y el proveedor que junta todo. Consultado el 21 de octubre de 2026.
- [React, «React v19»](https://react.dev/blog/2024/12/05/react-19): `<Context>` como proveedor y el plan de retirar `<Context.Provider>`. Consultado el 21 de octubre de 2026.
- [React, «Sharing State Between Components»](https://react.dev/learn/sharing-state-between-components): elevar el estado al antepasado común y la fuente única de verdad. Consultado el 21 de octubre de 2026.
- [React, «Choosing the State Structure»](https://react.dev/learn/choosing-the-state-structure): los principios de forma del estado, entre ellos no guardar lo que se puede calcular. Consultado el 21 de octubre de 2026.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext): el estado de una ruta padre compartido con sus hijas y el hook propio recomendado con TypeScript. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Mutations»](https://tanstack.com/query/latest/docs/framework/react/guides/mutations): `onSuccess`, `onError` y la diferencia entre los callbacks de `useMutation` y los de `mutate` cuando el componente se desmonta. Consultado el 21 de octubre de 2026.
- [TanStack Query, «Query Cancellation»](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): el `signal` que se aborta cuando una consulta queda inactiva mientras se trae. Consultado el 21 de octubre de 2026.
- [TypeScript, «Narrowing»](https://www.typescriptlang.org/docs/handbook/2/narrowing.html): el tipo `never` y la comprobación exhaustiva en un `switch`. Consultado el 21 de octubre de 2026.
- [MDN, rol `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) y [«ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions): la región viva de aviso, con `aria-live="polite"` y `aria-atomic="true"` implícitos; qué hace `aria-atomic`, y por qué la región tiene que existir antes de llenarse. Consultado el 21 de octubre de 2026.
- [W3C, «Understanding SC 2.2.1: Timing Adjustable»](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html): qué cuenta como límite de tiempo y cuándo hace falta poder ajustarlo. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| reducer | función pura que recibe el estado actual y una acción y devuelve el siguiente estado |
| acción | objeto que describe lo que pasó (`{ tipo: "descartado", id: 3 }`); el reducer decide qué consecuencia tiene |
| despachar (*dispatch*) | la función que devuelve `useReducer` para entregarle una acción; su identidad es estable entre dibujos |
| comprobación exhaustiva | el `default` que asigna la acción a `never`, para que TypeScript avise si una acción queda sin atender |
| contexto | canal de React para que un valor llegue a cualquier componente de adentro sin pasar por propiedades |
| proveedor | el componente que pone un valor en un contexto para todo lo que tiene adentro: `<Contexto value={…}>` |
| valor por omisión | lo que recibe quien lee un contexto si no hay ningún proveedor arriba; en este curso, `null` |
| consumidor | componente que lee un contexto; se vuelve a dibujar cuando el `value` de su proveedor cambia |
| región viva | parte de la página cuyos cambios anuncia un lector de pantalla; `role="status"` es la amable, que no interrumpe |
| fuente única de verdad | cada pedazo de estado vive en un solo lugar, y los demás lo leen de ahí |

---

**Siguiente:** [Lección 7 — Formularios, acciones y accesibilidad](07-formularios-accesibilidad.md)
