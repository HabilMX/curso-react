# Lección 8 — Pruebas de componentes

*Son las 12:15 de un jueves y la versión nueva del `revisor` sale a las 13:00. Alguien del equipo subió un cambio de «limpieza»: le quitó al resumen un `> 0` que «sobraba», y le devolvió al botón del alta su `disabled={pending}` porque «`aria-disabled` es un invento raro». El linter no dice nada. `npm run build` termina bien. La revisión de código lo aprueba en dos minutos, porque cada cambio, solo, parece razonable. Nadie tiene tiempo de abrir las cinco pantallas, vaciar la API para ver el reporte sin fallas y recorrer el alta con el teclado. Si sale así, el panel va a pintar un `0` suelto cada vez que todo esté bien, y Raúl, el compañero de guardia que trabaja con un lector de pantalla, va a volver a perder el foco en el momento exacto de enviar, como en la lección 7. Faltan cuarenta y cinco minutos. Lo que necesitas es algo que haga ese recorrido por ti en dos segundos, cada vez que alguien cambie una línea, y que se ponga rojo justo en esos dos lugares. Es lo que esta lección construye. Y también vas a ver qué parte de ese recorrido ninguna prueba en Node puede hacer por ti.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 8.2 y 8.3)

**Qué construyes:** la suite del panel con Vitest y Testing Library: 27 pruebas en 7 archivos, que montan la aplicación completa en un DOM de prueba, con un enrutador en memoria y un `fetch` simulado, y que cubren las funciones puras, el reducer, el esquema, los estados del reporte, el detalle, las rutas, el límite de error y el formulario de alta

**Qué aprendes:** consultas por rol y por qué importan para la accesibilidad; `getBy`, `queryBy`, `findBy`; `user-event`; `fetch` simulado; los cuatro estados, el formulario y una ruta con un enrutador en memoria; **la prueba que se pone roja al revertir el arreglo**; qué NO puede comprobar jsdom

**De dónde vienes.** Del punto de control de la [Lección 7](07-formularios-accesibilidad.md): un `revisor` con la lista en `/`, el detalle en `/servicios/:nombre`, el alta en `/servicios/nuevo` y una página de «no encontrada»; los datos del servidor en TanStack Query; una bandeja de avisos con su reducer y su contexto; y un formulario que se valida con un esquema, marca sus errores con `aria-invalid` y `aria-describedby`, y no le quita el foco al botón mientras envía. Hasta aquí, todo eso se comprobó con figuras que corrían en un DOM de prueba y con Chrome sin ventana, una vez, a mano. Del curso de TypeScript traes, si lo llevaste, una prueba con jsdom. Aquí no se repite: se cambia de herramienta y, sobre todo, de pregunta. Ya no «¿esta función devuelve lo que digo?», sino «¿esta pantalla hace lo que una persona espera?».

**Qué no hace esta lección.** No cambia ni una línea de la aplicación: el JavaScript que produce `npm run build` es idéntico, byte por byte, al de la lección 7. Todo lo nuevo son pruebas, la configuración que las corre y cuatro archivos de ayuda. No usa `@testing-library/jest-dom`, la biblioteca que agrega comparaciones como `toBeInTheDocument()`: las pruebas comparan `textContent` y atributos con el `expect` de Vitest, que alcanza y obliga a decir exactamente qué se espera. No usa `vi.mock` para reemplazar módulos de la aplicación: lo único falso es la red, por razones que se explican en 8.3. No escribe pruebas de extremo a extremo con un navegador real (Playwright, Cypress, el modo navegador de Vitest): se nombra lo que esas herramientas resolverían y se dice qué queda para comprobar a mano. Y no mide cobertura: un porcentaje de líneas ejecutadas no dice si una prueba se pondría roja ante el error que importa, y esta lección te enseña a comprobar eso otro.

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1, en macOS, con las versiones exactas del `package.json` de esta lección. El punto de control se instaló desde cero con `npm ci` en una copia fuera del repositorio, y ahí `npm run lint`, `npm run build` y `npm test` terminaron con código 0; `npm run build` produjo `dist/assets/index-C_lOH5GL.js` (medido otra vez el 22 de octubre de 2026, en macOS), el mismo nombre que en la lección 7. El conteo de pruebas se leyó del resumen de Vitest, no del código de salida. La tercera prueba de `PaginaServicio.test.tsx` (la del detalle viejo, 8.3.4) se añadió al revisar la lección: se vio roja con la página anterior (`1 failed | 26 passed (27)`) y verde con el punto de control, y las salidas del ejercicio 3 y de la suite completa se volvieron a correr con el punto de control nuevo. Todas las salidas de Vitest de la lección se tomaron con `--reporter=default` (o `--reporter=verbose`, donde se dice), que es lo que verías en una terminal interactiva; se fijó el reportero a propósito porque, fuera de una terminal, Vitest puede elegir otro que oculta la consola de las pruebas que pasan (ver «El error que vas a ver»). La copia de trabajo tenía además los archivos de los ejercicios 3 y 4; para la corrida completa se le pasaron a Vitest las rutas de los siete archivos del punto de control, que es lo mismo que correr `npx vitest run` en el punto de control. Cada prueba que «se pone roja» se provocó en esa copia, cambiando un solo archivo, corriendo solo el archivo de pruebas afectado y restaurando después; al terminar, la copia se comparó con el punto de control con `diff -r` y no tenía diferencias, salvo los archivos de prueba de los ejercicios 3 y 4, que no forman parte del punto de control. El punto de control también se instaló desde cero en un contenedor Linux (Debian 12, imagen oficial `node:24.22.0-bookworm`): ahí `npm run build` dio el mismo nombre de archivo y `npm test` terminó con código 0 y `Tests  27 passed (27)`. No se corrió en una Linux Mint real; nada de lo que se muestra depende del sistema, salvo las medidas en píxeles de la página gemela en Chrome (renglón 3 de la figura 3), que dependen de las fuentes instaladas. Lo que importa ahí es que Chrome mide y jsdom devuelve ceros. Las figuras se ejecutaron con su propio `package.json` en [`programas/08-pruebas-de-componentes/`](../programas/08-pruebas-de-componentes), junto a `revisor/`, como en las lecciones anteriores: se compilan con `tsc` y se corren con `node`. La figura 3 tiene además una página HTML gemela que se abrió en Chrome 155.0.8059.85 sin ventana, con `--headless --dump-dom` sobre el archivo local, para comparar lo que hace jsdom con lo que hace un navegador; esa corrida no abrió ningún puerto. Lo que **no** se midió en esta lección, y se dice donde aparece: el recorrido con el teclado en una ventana real y el sonido de un lector de pantalla. Los dos se midieron o se describieron en la lección 7 y vuelven aquí en «Cómo sé que lo logré». En las salidas, las rutas largas se muestran a partir de `~/curso-react`. Los archivos de prueba de los ejercicios y las salidas de la suite, del control negativo y de cada reversión están en `programas/08-pruebas-de-componentes/ejercicios/` (se volvieron a correr al aplicar la revisión, así que sus horas y duraciones difieren de las pegadas aquí). El servidor de práctica (el mismo archivo desde la lección 4) responde `400` con `{"detalle":"nombre de servicio inválido"}` a una dirección con un `%` mal formado, como `/api/servicios/%`, y a su ruta `/reintento`; antes respondía `500`. Se midió con `curl` contra una copia, antes y después, y el proceso siguió vivo en los dos casos.

## Al terminar vas a poder

- Instalar Vitest, jsdom y Testing Library en un proyecto de Vite, configurar el entorno de prueba y explicar por qué hace falta llamar a `cleanup` a mano cuando Vitest no expone sus funciones como globales.
- Encontrar un elemento por su rol y su nombre accesible, y demostrar con una figura que una consulta por rol no encuentra un botón hecho con un `<span>` ni un campo sin etiqueta.
- Elegir entre `getBy`, `queryBy` y `findBy` según lo que la prueba afirma (que algo está, que algo no está, que algo va a llegar), y leer el error que da cada una cuando falla.
- Simular a una persona con `user-event`: escribir, pulsar Tab y Espacio, hacer clic, y explicar por qué esas acciones se esperan con `await`.
- Montar la aplicación completa en una dirección con un enrutador en memoria, una caché nueva y un `fetch` simulado, y probar con eso los estados del reporte, una ruta y el formulario de alta.
- Comprobar que una prueba protege un arreglo: revertir el arreglo en una copia, ver la prueba en rojo con el mensaje exacto y restaurar, y reconocer una prueba verde que no se pone roja.
- Nombrar lo que jsdom no calcula (el diseño, el foco que se pierde al desactivar un botón) y diseñar la prueba para que compruebe la causa cuando el efecto no se puede ver.

## El porqué antes del cómo

Hasta la lección 7, cada vez que el `revisor` cambiaba, alguien comprobaba que siguiera funcionando. Lo hacía bien: con figuras que dibujaban un componente en un DOM de prueba, con `curl` contra la API de práctica, con Chrome sin ventana manejado por un guion. Pero lo hacía **una vez**, en el momento de escribir la lección. La escena del principio es lo que pasa la segunda vez: el código cambia, el linter y el compilador siguen en verde, y nadie vuelve a hacer el recorrido. Pregúntale al panel cuatro cosas y verás qué falta.

**¿Quién se acuerda de los casos raros?** El `0` suelto de la lección 1 solo aparece cuando **ningún** servicio está en falla. La API de práctica arranca siempre con dos en falla. Para ver el error tendrías que dar de alta servicios sanos, reintentar los caídos o vaciar la API, y luego mirar el resumen. Nadie hace eso antes de cada versión. Una prueba sí, porque decide qué responde la API.

**¿Cómo pruebas lo que depende de la red sin depender de la red?** El reporte tiene cuatro estados más uno: cargando, error, vacío, con datos, y con datos viejos cuando la actualización falla. Ver el de «cargando» en un navegador exige una API lenta; ver el de error, una API caída; el vacío, otra API. La API de práctica tiene la variable `ESCENARIO` para eso, pero arrancarla tres veces con tres valores no es algo que corra en dos segundos. Si la prueba controla lo que responde `fetch`, cada estado es una línea.

**¿Cómo sabes que la prueba mira lo mismo que mira la persona?** Una prueba que busca `.boton-enviar` o `div > button:nth-child(2)` pasa aunque el botón se haya vuelto un `<span>` que un lector de pantalla no anuncia y el teclado no alcanza. Las consultas de Testing Library empiezan por otro lado: por el **rol** y el **nombre accesible**, que son lo que el navegador entrega a la tecnología de asistencia. Si una prueba encuentra «el botón que se llama Dar de alta», ese botón está en el árbol de accesibilidad con ese rol y ese nombre: un lector de pantalla lo anuncia así. Lo que la consulta **no** comprueba es que se alcance con Tab ni que responda a Enter o Espacio; eso lo garantiza el `<button>` nativo (lección 7) y, en esta suite, lo ejercita la prueba del foco con `usuario.tab()` y `usuario.keyboard(" ")`. Es la misma costumbre de la lección 7, ahora automática.

**¿Cómo sabes que la prueba sirve?** Esta es la pregunta que casi nadie hace. Una prueba verde dice que el código actual cumple lo que la prueba afirma. No dice que la prueba se pondría roja si el arreglo desapareciera. Hay pruebas que pasan con el código bueno **y** con el malo: no protegen nada y dan una tranquilidad falsa. La única forma de saberlo es hacer el experimento: quitar el arreglo, ver el rojo, restaurar. Esta lección lo hace con tres pruebas de la suite (y una cuarta en el ejercicio 2) y te enseña a reconocer una que no pasa el examen.

Las cuatro respuestas caben en tres conceptos: consultar la página como lo hace una persona (8.2), montar la aplicación completa sin red ni navegador (8.3) y la prueba que se pone roja al revertir el arreglo (8.4). Antes va la instalación (8.1) y después, con la misma franqueza, lo que jsdom no puede comprobar (8.5). Al final, esto es lo que dice `npm test` con el reportero detallado, que imprime una línea por prueba:

```bash
$ npx vitest run --reporter=verbose
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/avisos/avisos.test.ts > reducirAvisos > agrega al principio con un identificador nuevo 1ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > descarta uno por su identificador y no toca los demás 0ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > conserva solo los 5 más recientes 0ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > descartar todos vacía la bandeja y conserva el contador 0ms
 ✓ src/reporte/resumen.test.ts > resumen > cuenta solo los servicios en falla 1ms
 ✓ src/reporte/resumen.test.ts > resumen > usa singular y plural 0ms
 ✓ src/reporte/resumen.test.ts > resumen > filtra por falla y por nombre, sin importar mayúsculas 0ms
 ✓ src/compartido/esquema.test.ts > validarCampos con el esquema del alta > convierte el texto del formulario en un NuevoServicio 2ms
 ✓ src/compartido/esquema.test.ts > validarCampos con el esquema del alta > informa todos los campos inválidos a la vez 0ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > cargando: anuncia la carga mientras la API no responde 157ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > sin datos marca los tres campos y lo anuncia 447ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > error: muestra el motivo y un botón para reintentar 395ms
 ✓ src/app/rutas.test.tsx > las rutas > una dirección desconocida muestra la página de no encontrada 629ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > muestra el detalle del servicio de la dirección 581ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > volver a revisar deja un aviso en la bandeja 86ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > vacío: lo dice en lugar de dejar la lista en blanco 134ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > con datos: un enlace por servicio y el resumen de fallas 53ms
 ✓ src/app/rutas.test.tsx > las rutas > el menú marca la página actual 113ms
 ✓ src/app/rutas.test.tsx > las rutas > una página que se rompe al dibujar muestra el aviso del revisor 122ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > sin fallas no pinta un 0 suelto en el resumen 34ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > con datos válidos envía el alta y confirma 546ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > si la actualización del detalle falla, conserva el detalle y la nota que se escribía 518ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > el filtro «solo fallas» viaja en la dirección 401ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > una dirección con el filtro ya puesto abre filtrada 72ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > declara los obligatorios y la bandeja anuncia solo el aviso nuevo 176ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora 613ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > un nombre repetido se marca en su campo con el mensaje de la API 550ms

 Test Files  7 passed (7)
      Tests  27 passed (27)
   Start at  16:08:16
   Duration  4.69s (environment 54%, tests 29%, setup 8%, transform 4%, import 4%, worker 1%)
```

Son 27 líneas con `✓`, y el resumen lo confirma: `Tests  27 passed (27)`. Fíjate en cómo se leen los nombres: «el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora». Cada prueba dice qué comportamiento protege, en el idioma de quien usa el panel, no en el de quien lo programó. Cuando una se ponga roja, el nombre te va a decir qué se rompió antes de que leas una línea de código. Y fíjate en los milisegundos: las pruebas que montan la aplicación tardaron de 34 a 629 ms en esta corrida; las de funciones puras, de 0 a 2. La suite completa, con el arranque de jsdom, tardó 4.69 s. Esos milisegundos dependen de lo que tenga encendido la máquina (la corrida anterior, con la máquina más libre, dio de 8 a 112 ms y 1.06 s), así que léelos como un orden de magnitud: lo que sí se sostiene es que las funciones puras tardan casi nada y montar la aplicación cuesta cientos de veces más.

## Los conceptos

### 8.1 La instalación: Vitest, jsdom y Testing Library

#### 8.1.1 Cinco dependencias y un script

El punto de control de esta lección agrega cinco dependencias de desarrollo y un script. Este es el `package.json` completo:

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.8.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "servidor": "node servidor/practica.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@tanstack/react-query": "5.104.5",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "react-router": "8.5.0"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@testing-library/dom": "10.4.2",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.8",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "npm:typescript@7.0.2",
    "@vitejs/plugin-react": "6.1.2",
    "eslint": "10.13.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "jsdom": "30.1.3",
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "typescript-eslint": "8.72.0",
    "vite": "8.3.5",
    "vitest": "5.0.5"
  }
}
```

Cada pieza tiene un trabajo distinto, y conviene no confundirlas:

- **`vitest`** es el que corre las pruebas: encuentra los archivos `*.test.ts` y `*.test.tsx`, los transforma con la misma configuración de Vite que ya usa el proyecto (por eso entiende TypeScript y JSX sin un paso aparte) y da las funciones `test`, `describe`, `expect` y `vi`.
- **`jsdom`** es un DOM escrito en JavaScript: `document`, `window`, elementos, eventos, formularios. No es un navegador; es la parte del navegador que se puede imitar sin dibujar nada. Ya lo usaste en las figuras de las lecciones anteriores.
- **`@testing-library/dom`** trae las consultas (`getByRole`, `findByText`…) y la espera (`waitFor`). No sabe nada de React. Se instala aparte porque `@testing-library/react` la declara como dependencia par (*peer dependency*) y no la trae; su documentación pide instalar las dos juntas. Las figuras la importan directo para `logRoles` (8.2.2).
- **`@testing-library/react`** es una capa delgada encima: `render`, que dibuja un componente de React en el DOM de prueba, y `cleanup`, que lo desmonta. Envuelve sus funciones en `act` por ti, que es la herramienta de React para aplicar todos los cambios pendientes antes de comparar ([React, `act`](https://react.dev/reference/react/act)). La documentación de React agrega que, con React Testing Library, la variable `IS_REACT_ACT_ENVIRONMENT` «ya queda puesta». Es cierto a medias: la biblioteca la enciende **de forma permanente** solo cuando el ejecutor expone `beforeAll` como global, igual que pasa con `cleanup`; sin globales, la enciende solo mientras dura cada `render` o cada evento que ella misma envuelve en `act`, y la apaga durante cada espera. Una actualización que ocurra fuera de esos tramos (un temporizador, una respuesta que llega tarde) no avisaría nunca. Por eso `preparar.ts` la enciende a mano (8.1.3). Por eso en esta suite casi no aparece `act`: la única vez que se usa a mano es en el ejercicio 3, para navegar con el enrutador desde fuera de un clic.
- **`@testing-library/user-event`** simula a una persona: escribe, hace clic, pulsa teclas. Se explica en 8.2.3.

El script nuevo es `"test": "vitest run"`. La palabra `run` importa: sin ella, en tu terminal `vitest` se queda vigilando tus archivos y vuelve a correr las pruebas en cada cambio, que es cómodo mientras programas y estorba en una verificación que tiene que terminar. (Corre una sola vez por su cuenta en un servidor de integración continua, en una terminal no interactiva o cuando detecta que lo ejecuta un asistente de programación.) Con `run`, corre una vez en cualquier lugar y sale con código 0 si todo pasó, o 1 si algo falló.

Como en todo el curso, las versiones van exactas. Las midió `npm view` el 21 de octubre de 2026 y son las mismas de la tabla «Versiones con las que se escribió» del README. Si algún día difieren, manda el `package.json` del punto de control.

#### 8.1.2 La configuración vive en `vite.config.ts`

Vitest lee la configuración de Vite. No hace falta un archivo aparte; basta una sección `test`:

```ts
// revisor/vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
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
  },
});
```

Comparado con la lección 7 cambian dos cosas. La primera: `defineConfig` se importa de `vitest/config` y no de `vite`. Es la misma función con un tipo más amplio, que conoce la sección `test`; con la de `vite`, TypeScript rechazaría esa clave. (La documentación de Vitest también muestra la otra salida, que es dejar la importación de `vite` y agregar una referencia de tipos con triple barra al principio del archivo; el punto de control eligió la importación, que se lee sin saber qué es una triple barra.)

La segunda: la sección `test`, con dos opciones.

- **`environment: "jsdom"`.** Por omisión, Vitest corre las pruebas en el entorno `node`, sin `document` ni `window` ([Vitest, «Test Environment»](https://vitest.dev/guide/environment.html)). Con `jsdom`, antes de cada archivo de pruebas crea un DOM y pone sus objetos en el ámbito global, como si el archivo corriera en una página. Por eso `jsdom` tiene que estar instalado: Vitest lo usa, pero no lo trae.
- **`setupFiles`.** Una lista de archivos que Vitest ejecuta antes de cada archivo de pruebas. Aquí es uno solo, `preparar.ts`, y lo que hace merece su propio apartado.

Lo que no cambia también importa: `plugins: [react()]` es el mismo de siempre, así que las pruebas ven el código transformado igual que lo ve el servidor de desarrollo. Y el `proxy` hacia la API no interviene en las pruebas: en ellas nadie va a la red.

#### 8.1.3 Lo que hay que limpiar después de cada prueba

```ts
// revisor/src/pruebas/preparar.ts
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// React solo avisa de las actualizaciones fuera de act() si esta variable está encendida.
// Testing Library la enciende sola cuando el ejecutor expone `beforeAll` como global; con
// `globals` apagado no lo hace, y hay que hacerlo aquí.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
```

Son tres instrucciones, y cada una tiene una razón.

**`cleanup()`** desmonta todo lo que `render` dibujó. Sin él, la segunda prueba de un archivo encontraría en el DOM la aplicación de la primera **y** la suya: dos botones «Dar de alta», dos bandejas, y una consulta como `getByRole("button", { name: "Dar de alta" })` fallaría con «encontré varios». La documentación de React Testing Library dice que `cleanup` se llama solo si el entorno de pruebas pone una función global `afterEach`, y que si no, hay que llamarlo después de cada prueba ([Testing Library, API de React](https://testing-library.com/docs/react-testing-library/api)). Y Vitest, por omisión, **no** pone sus funciones como globales: la opción `globals` vale `false`, y su documentación advierte justo esto, que algunas bibliotecas, como `@testing-library/react`, dependen de esos globales para limpiar solas ([Vitest, `globals`](https://vitest.dev/config/globals.html)). El curso deja `globals` apagado a propósito: cada archivo de pruebas importa `test`, `expect` y `vi` explícitamente, y se ve de dónde sale cada cosa. El precio es este archivo.

**`vi.unstubAllGlobals()`** deshace lo que hizo `vi.stubGlobal`. Las pruebas cambian el `fetch` global por uno falso (8.3.1), y ese cambio no debe sobrevivir a la prueba que lo hizo. Según la documentación, `vi.stubGlobal` cambia el valor de una variable global y `vi.unstubAllGlobals` restaura los valores originales; con jsdom, el cambio se ve también en `window` ([Vitest, `vi`](https://vitest.dev/api/vi.html)).

**`IS_REACT_ACT_ENVIRONMENT = true`** enciende los avisos de React sobre `act`. React solo avisa de una actualización de estado que ocurrió fuera de `act` si esa variable global está en `true`; la documentación de React pide ponerla en el archivo de preparación de las pruebas. React Testing Library la enciende sola, pero lo hace desde un `beforeAll` global, que con `globals` apagado no existe: es el mismo problema de `cleanup`. Sin esta línea, la suite nunca imprimiría un aviso de `act`, y «no hay ningún aviso» no demostraría nada. El `as { IS_REACT_ACT_ENVIRONMENT?: boolean }` es para TypeScript, que no conoce esa propiedad de `globalThis`.

Que la línea sirve se midió con un control negativo, una prueba de usar y tirar que no es parte del punto de control: un componente cambia su estado con un temporizador, y la prueba espera con otro temporizador, no con `findBy`, así que nadie envuelve el cambio en `act`. (`screen`, que aparece en la prueba, consulta todo el documento; se explica en 8.3.2.)

```tsx
// fragmento: una prueba de control, fuera del punto de control (programas/08-pruebas-de-componentes/ejercicios/control.test.tsx)
import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { expect, test } from "vitest";

function Tardio() {
  const [texto, establecerTexto] = useState("esperando");
  useEffect(() => {
    const temporizador = setTimeout(() => establecerTexto("listo"), 10);
    return () => clearTimeout(temporizador);
  }, []);
  return <p>{texto}</p>;
}

test("una actualización fuera de act", async () => {
  render(<Tardio />);
  // Se espera con un temporizador simple, no con findBy: nadie envuelve el cambio en act.
  await new Promise((listo) => setTimeout(listo, 50));
  expect(screen.getByText("listo")).toBeDefined();
});
```

Con el `preparar.ts` sin la línea:

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:10
   Duration  362ms (environment 66%, tests 20%, setup 10%, transform 3%, import 1%, worker 1%)
```

Con la línea:

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/pruebas/control.test.tsx > una actualización fuera de act
An update to Tardio inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:11
   Duration  349ms (environment 67%, tests 20%, setup 10%, transform 1%, import 1%, worker 1%)
```

La prueba pasa en los dos casos, porque el texto sí llega a «listo». Lo que cambia es que, con la línea, React avisa en la salida de error (`stderr`) que hubo una actualización sin `act`. Ese es el aviso que la suite del `revisor` no debe tener, y no tiene: con la línea puesta, las 27 pruebas pasan sin un solo `stderr`.

¿Por qué `afterEach` y no `beforeEach`? Porque limpiar al final deja el DOM vacío también después de la **última** prueba, y porque así cada prueba empieza con lo que dejó la limpieza, no con lo que dejó otra. Las pruebas no dependen de su orden, que es la propiedad que permite correr un archivo solo, como vas a hacer en 8.4.

#### 8.1.4 La primera prueba no necesita React

Antes de dibujar nada, las piezas más fáciles de probar son las funciones puras. La lección 1 sacó el conteo de fallas a `resumen.ts` justo para esto: mismas entradas, misma salida, sin DOM. Su prueba:

```ts
// revisor/src/reporte/resumen.test.ts
import { describe, expect, test } from "vitest";
import { reporteDeEjemplo } from "../pruebas/datos";
import { contarFallas, filtrarEstados, textoFallas } from "./resumen";

describe("resumen", () => {
  test("cuenta solo los servicios en falla", () => {
    expect(contarFallas(reporteDeEjemplo.estados)).toBe(2);
    expect(contarFallas([])).toBe(0);
  });

  test("usa singular y plural", () => {
    expect(textoFallas(1)).toBe("1 servicio con falla");
    expect(textoFallas(2)).toBe("2 servicios con falla");
  });

  test("filtra por falla y por nombre, sin importar mayúsculas", () => {
    const nombres = (soloFallas: boolean, texto: string) =>
      filtrarEstados(reporteDeEjemplo.estados, { soloFallas, texto }).map((estado) => estado.nombre);

    expect(nombres(false, "")).toEqual(["catálogo", "pagos", "inventario", "reportes"]);
    expect(nombres(true, "")).toEqual(["pagos", "reportes"]);
    expect(nombres(false, "PAG")).toEqual(["pagos"]);
    expect(nombres(true, "catá")).toEqual([]);
  });
});
```

Lee la forma, porque es la de toda la suite. `describe` agrupa pruebas bajo un nombre; `test` define una, con un nombre y una función; `expect(valor).toBe(esperado)` compara con `Object.is`, que para números y textos es la igualdad de siempre; `toEqual` compara la **forma** de arreglos y objetos, elemento por elemento. La tercera prueba usa una función auxiliar, `nombres`, para que cada línea diga solo lo que cambia: con o sin «solo fallas», con qué texto. El último caso, `nombres(true, "catá")`, comprueba que los dos filtros se combinan: `catálogo` coincide con el texto pero no está en falla, y por eso la lista queda vacía.

Las otras dos pruebas sin React siguen la misma idea. La del reducer de avisos de la lección 6, que lo prueba sin montar un solo componente, como ya lo había hecho la figura de esa lección:

```ts
// revisor/src/avisos/avisos.test.ts
import { describe, expect, test } from "vitest";
import { estadoInicialAvisos, MAXIMO_AVISOS, reducirAvisos, type EstadoAvisos } from "./avisos";

function agregar(estado: EstadoAvisos, texto: string): EstadoAvisos {
  return reducirAvisos(estado, { tipo: "agregado", nivel: "exito", texto });
}

describe("reducirAvisos", () => {
  test("agrega al principio con un identificador nuevo", () => {
    const estado = agregar(agregar(estadoInicialAvisos, "primero"), "segundo");
    expect(estado.avisos.map((aviso) => [aviso.id, aviso.texto])).toEqual([
      [2, "segundo"],
      [1, "primero"],
    ]);
  });

  test("descarta uno por su identificador y no toca los demás", () => {
    const estado = agregar(agregar(estadoInicialAvisos, "primero"), "segundo");
    const despues = reducirAvisos(estado, { tipo: "descartado", id: 1 });
    expect(despues.avisos.map((aviso) => aviso.texto)).toEqual(["segundo"]);
    expect(estado.avisos).toHaveLength(2);
  });

  test(`conserva solo los ${MAXIMO_AVISOS} más recientes`, () => {
    let estado = estadoInicialAvisos;
    for (let numero = 1; numero <= MAXIMO_AVISOS + 2; numero += 1) {
      estado = agregar(estado, `aviso ${numero}`);
    }
    expect(estado.avisos).toHaveLength(MAXIMO_AVISOS);
    expect(estado.avisos[0]?.texto).toBe(`aviso ${MAXIMO_AVISOS + 2}`);
  });

  test("descartar todos vacía la bandeja y conserva el contador", () => {
    const estado = reducirAvisos(agregar(estadoInicialAvisos, "uno"), { tipo: "todos-descartados" });
    expect(estado).toEqual({ avisos: [], siguienteId: 2 });
  });
});
```

La segunda prueba afirma algo que una persona nunca vería en la pantalla: `expect(estado.avisos).toHaveLength(2)` después de descartar. Comprueba que el reducer **no mutó** el estado que recibió, que es la regla de inmutabilidad de la lección 2. Y la tercera usa la constante `MAXIMO_AVISOS` en lugar de escribir `5`: si mañana el máximo cambia, la prueba sigue diciendo la verdad.

Y la del esquema de la lección 7, que comprueba la diferencia que esa lección explicó: todos los errores a la vez, no solo el primero.

```ts
// revisor/src/compartido/esquema.test.ts
import { describe, expect, test } from "vitest";
import { camposAlta } from "../alta/esquemaAlta";
import { validarCampos } from "./esquema";

describe("validarCampos con el esquema del alta", () => {
  test("convierte el texto del formulario en un NuevoServicio", () => {
    expect(
      validarCampos(camposAlta, { nombre: " correo ", url: "https://correo.example", timeoutMs: "1500" }),
    ).toEqual({
      ok: true,
      valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 },
    });
  });

  test("informa todos los campos inválidos a la vez", () => {
    expect(validarCampos(camposAlta, { nombre: "  ", url: "ftp://x", timeoutMs: "1.5" })).toEqual({
      ok: false,
      errores: {
        nombre: "escribe un valor",
        url: "escribe una dirección que empiece con http:// o https://",
        timeoutMs: "escribe un número entero mayor que cero",
      },
    });
  });
});
```

Estas nueve pruebas cuestan casi nada (de 0 a 2 ms cada una) y protegen la lógica que no depende de React. Pero no ven la pantalla. El `0` suelto de la escena no vive en `contarFallas`, que devuelve `0` correctamente: vive en cómo `ResumenFallas` usa ese `0` en JSX. Para verlo hay que dibujar.

### 8.2 Consultar como lo hace una persona

#### 8.2.1 `getBy`, `queryBy`, `findBy`

Antes de ver por qué conviene buscar por rol (8.2.2), hace falta saber de qué formas se puede preguntar. Cada consulta viene en tres familias, y la diferencia no es de estilo: cada una afirma algo distinto. La documentación lo resume así: `getBy` devuelve el elemento y lanza un error descriptivo si no hay ninguno; `queryBy` devuelve el elemento o `null`; `findBy` devuelve una promesa que se resuelve cuando aparece. Las tres tienen su versión `All` (`getAllBy`, `queryAllBy`, `findAllBy`) que devuelve un arreglo. Y las versiones sin `All` también fallan si encuentran **más de uno**.

La figura 1 lo muestra con una copia reducida de lo que dibuja `/`: una bandeja de avisos vacía (un `role="status"` sin contenido, como el del `revisor`) y el contenido del reporte, que dice «Cargando…» y cien milisegundos después muestra la lista.

```tsx
// fig08_01.tsx
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { useEffect, useState } from "react";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Una copia reducida de lo que dibuja `/`: la bandeja de avisos (un `status` vacío)
// y el contenido del reporte, que dice «Cargando…» y 100 ms después muestra la lista.
function Reporte() {
  const [estados, establecerEstados] = useState<readonly string[] | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerEstados(["catálogo", "pagos"]), 100);
    return () => clearTimeout(temporizador);
  }, []);

  return (
    <>
      <section aria-label="Avisos">
        <div role="status" aria-atomic="false"></div>
      </section>
      {estados === null ? (
        <p role="status">Cargando…</p>
      ) : (
        <ul>
          {estados.map((nombre) => (
            <li key={nombre}>{nombre}</li>
          ))}
        </ul>
      )}
    </>
  );
}

// Solo la primera línea del mensaje: el resto es el DOM completo, que aquí estorba.
function primeraLinea(error: unknown): string {
  return error instanceof Error ? error.message.split("\n")[0] : String(error);
}

const pantalla = render(<Reporte />);

console.log("1. antes de que lleguen los datos");
try {
  pantalla.getByRole("list");
} catch (error) {
  console.log(`   getByRole("list")   lanza: ${primeraLinea(error)}`);
}
console.log(`   queryByRole("list") devuelve: ${String(pantalla.queryByRole("list"))}`);
try {
  pantalla.getByRole("status");
} catch (error) {
  console.log(`   getByRole("status") lanza: ${primeraLinea(error)}`);
}
console.log(`   getAllByRole("status") encuentra: ${pantalla.getAllByRole("status").length}`);
const cargando = pantalla.getByText("Cargando…");
console.log(`   getByText("Cargando…") tiene role="${cargando.getAttribute("role")}"`);

console.log("2. esperando con findBy");
const lista = await pantalla.findByRole("list");
console.log(`   findByRole("list") la encontró, con ${lista.children.length} elementos`);
console.log(`   queryByText("Cargando…") ahora devuelve: ${String(pantalla.queryByText("Cargando…"))}`);

console.log("3. lo que nunca aparece");
try {
  await pantalla.findByRole("table", {}, { timeout: 300 });
} catch (error) {
  console.log(`   findByRole("table") rechaza: ${primeraLinea(error)}`);
}

pantalla.unmount();
dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_01.tsx
$ node fig08_01.js
1. antes de que lleguen los datos
   getByRole("list")   lanza: Unable to find an accessible element with the role "list"
   queryByRole("list") devuelve: null
   getByRole("status") lanza: Found multiple elements with the role "status"
   getAllByRole("status") encuentra: 2
   getByText("Cargando…") tiene role="status"
2. esperando con findBy
   findByRole("list") la encontró, con 2 elementos
   queryByText("Cargando…") ahora devuelve: null
3. lo que nunca aparece
   findByRole("table") rechaza: Unable to find role="table"
```

Ocho resultados, y cada uno enseña algo.

**Antes de que lleguen los datos, `getByRole("list")` lanza y `queryByRole("list")` devuelve `null`.** Es la misma pregunta con dos respuestas distintas para «no está». Usa `getBy` cuando el elemento **tiene que** estar: si falta, la prueba se detiene en esa línea con un mensaje que dice qué buscabas y, debajo, el DOM que había (lo imprime Testing Library, no Vitest, recortado a 7 000 caracteres salvo que cambies `DEBUG_PRINT_LIMIT`; la figura lo corta con `primeraLinea` porque aquí estorba). Usa `queryBy` cuando quieres afirmar que algo **no** está: `expect(screen.queryByRole("list")).toBeNull()`. Escribir eso con `getBy` es imposible, porque lanzaría antes de llegar al `expect`. La prueba del estado vacío del `revisor` usa exactamente esa línea.

**`getByRole("status")` lanza «Found multiple elements with the role "status"».** En la pantalla hay **dos** regiones de estado: la bandeja de avisos, que está siempre (lección 6), y el «Cargando…». `getBy` exige uno y solo uno. Este detalle es real en el `revisor` y explica una línea de su suite que, si no, parecería rara: la prueba de «cargando» busca el texto con `findByText("Cargando…")` y **después** comprueba que su rol sea `status`. Así encuentra el elemento sin ambigüedad y afirma de todos modos que se anuncia como región de estado. La otra salida sería filtrar por nombre, pero un `status` no toma su nombre de su contenido, así que «Cargando…» no es su nombre.

**`findByRole("list")` espera y encuentra la lista con dos elementos**, y después `queryByText("Cargando…")` ya es `null`. `findBy` es la combinación de `getBy` con `waitFor`: repite la consulta cada 50 ms hasta que la encuentra o hasta que pasan 1000 ms, y además vuelve a intentar cada vez que el DOM cambia ([Testing Library, «Async Methods»](https://testing-library.com/docs/dom-testing-library/api-async/)). En el `revisor` casi todo llega tarde: el reporte depende de un `fetch`, el aviso de la bandeja depende de una acción, la página depende del enrutador. Por eso casi todas las pruebas de componentes de la suite empiezan con un `await screen.findBy…`: es la forma de decir «espera a que la pantalla llegue a este punto».

**`findByRole("table")` rechaza «Unable to find role="table"»** después del tiempo límite, que la figura bajó a 300 ms para no esperar el segundo completo. Un `findBy` que nunca encuentra no se queda colgado: falla con un mensaje.

Una regla que sale de aquí: **no envuelvas un `getBy` en un `waitFor` a mano** si lo que quieres es esperar a un elemento; para eso existe `findBy`. Y no uses `findBy` para algo que ya está: funciona, pero le dice a quien lee la prueba que esperabas algo que no esperabas. Cada familia comunica una intención.

¿Por qué la figura no avisó nada de `act`? Porque corre con `node`, fuera de una prueba, y nadie encendió `IS_REACT_ACT_ENVIRONMENT`: sin esa variable, React no avisa. En la suite sí está encendida (`preparar.ts`, 8.1.3). Y ahí, mientras un `findBy` espera, React Testing Library la **apaga** a propósito, porque la espera ya es la forma correcta de dejar que la pantalla llegue a donde va. Un aviso que menciona `act(` aparece cuando una actualización ocurre sin que nadie esté esperando, por ejemplo después de que la prueba terminó; en 8.4.3 vas a ver uno de verdad. La salida completa de la suite del `revisor` no tiene ninguno.

#### 8.2.2 Por rol y por nombre

Cuando una persona usa el panel no piensa «el segundo `<button>` dentro del `<form>`». Piensa «el botón Dar de alta». Quien usa un lector de pantalla oye lo mismo: «Dar de alta, botón». Esas dos palabras son el **nombre accesible** y el **rol**, las mismas de la lección 7, y son lo que el navegador entrega a la tecnología de asistencia. Testing Library ordena sus consultas con ese criterio. En su página de consultas pone primero las que llama «accesibles para todos» (`getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`), porque reflejan la experiencia de quien usa el ratón y la vista y también la de quien usa tecnología de asistencia; después las semánticas (`getByAltText`, `getByTitle`), y al final, los identificadores de prueba (`getByTestId`) ([Testing Library, «About Queries»](https://testing-library.com/docs/queries/about/)). Detrás hay un principio que la propia biblioteca escribe así: mientras más se parezcan tus pruebas a la forma en que se usa tu programa, más confianza te pueden dar ([Testing Library, «Guiding Principles»](https://testing-library.com/docs/guiding-principles)).

La consecuencia práctica es más fuerte de lo que parece: **una consulta por rol falla si el elemento no tiene ese rol y ese nombre en el árbol de accesibilidad**, o si está oculto para él. No es una prueba completa de accesibilidad (un `<span role="button">` sin `tabindex` pasaría la consulta y seguiría fuera del alcance del teclado), pero descarta la imitación más común, que es la de la figura 2. Para verlo, la figura 2 dibuja dos veces lo mismo: un aviso de la bandeja con su botón «Descartar» y un campo «Nombre». Arriba con los elementos nativos; abajo, una imitación que se vería igual con un poco de CSS.

```tsx
// fig08_02.tsx
import { logRoles } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Dos versiones de lo mismo: un aviso de la bandeja con su botón y un campo.
// La de arriba usa los elementos nativos; la de abajo se ve igual con CSS, pero no lo es.
function Nativo() {
  return (
    <section aria-label="Nativo">
      <p>
        Se dio de alta correo{" "}
        <button type="button" aria-label="Descartar: Se dio de alta correo">
          Descartar
        </button>
      </p>
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" name="nombre" />
    </section>
  );
}

function Imitacion() {
  return (
    <section aria-label="Imitación">
      <p>
        Se dio de alta correo <span className="boton">Descartar</span>
      </p>
      <p>Nombre</p>
      <input name="nombre" />
    </section>
  );
}

function probar(descripcion: string, consulta: () => unknown): void {
  try {
    consulta();
    console.log(`   ${descripcion}: lo encuentra`);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(`   ${descripcion}: ${mensaje}`);
  }
}

for (const [titulo, Componente] of [
  ["nativo", Nativo],
  ["imitación", Imitacion],
] as const) {
  const pantalla = render(<Componente />);
  console.log(`${titulo}:`);
  probar('getByText("Descartar")', () => pantalla.getByText("Descartar"));
  probar('getByRole("button", { name: "Descartar: Se dio de alta correo" })', () =>
    pantalla.getByRole("button", { name: "Descartar: Se dio de alta correo" }),
  );
  probar('getByRole("button", { name: "Descartar" })', () =>
    pantalla.getByRole("button", { name: "Descartar" }),
  );
  probar('getByLabelText("Nombre")', () => pantalla.getByLabelText("Nombre"));
  probar('getByRole("textbox", { name: "Nombre" })', () =>
    pantalla.getByRole("textbox", { name: "Nombre" }),
  );
  pantalla.unmount();
}

// logRoles colorea su salida para la terminal; en un archivo, los colores estorban.
process.env.COLORS = "false";
console.log("logRoles del nativo:");
const nativo = render(<Nativo />);
logRoles(nativo.container);
nativo.unmount();
dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_02.tsx
$ node fig08_02.js
nativo:
   getByText("Descartar"): lo encuentra
   getByRole("button", { name: "Descartar: Se dio de alta correo" }): lo encuentra
   getByRole("button", { name: "Descartar" }): Unable to find an accessible element with the role "button" and name "Descartar"
   getByLabelText("Nombre"): lo encuentra
   getByRole("textbox", { name: "Nombre" }): lo encuentra
imitación:
   getByText("Descartar"): lo encuentra
   getByRole("button", { name: "Descartar: Se dio de alta correo" }): Unable to find an accessible element with the role "button" and name "Descartar: Se dio de alta correo"
   getByRole("button", { name: "Descartar" }): Unable to find an accessible element with the role "button" and name "Descartar"
   getByLabelText("Nombre"): Unable to find a label with the text of: Nombre
   getByRole("textbox", { name: "Nombre" }): Unable to find an accessible element with the role "textbox" and name "Nombre"
logRoles del nativo:
region:

Name "Nativo":
<section
  aria-label="Nativo"
/>

--------------------------------------------------
paragraph:

Name "":
<p />

--------------------------------------------------
button:

Name "Descartar: Se dio de alta correo":
<button
  aria-label="Descartar: Se dio de alta correo"
  type="button"
/>

--------------------------------------------------
textbox:

Name "Nombre":
<input
  id="nombre"
  name="nombre"
/>

--------------------------------------------------
```

Lee la salida por columnas. **`getByText("Descartar")` encuentra las dos versiones.** Buscar por texto no sabe si lo que encontró es un botón, un `<span>` o un párrafo. Una prueba escrita así pasaría con la imitación, que el teclado no alcanza y que un lector de pantalla no anuncia como botón.

**`getByRole("button", { name: "Descartar: Se dio de alta correo" })` encuentra solo el nativo.** El rol `button` lo tiene el `<button>` sin que nadie escriba `role="button"`: es un rol implícito, y la documentación de `ByRole` lo dice con ese mismo ejemplo ([Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole)). La imitación no tiene rol de botón, así que no existe para la consulta, igual que no existe para un lector de pantalla.

**`getByRole("button", { name: "Descartar" })` no encuentra a ninguno**, y esto sorprende la primera vez. El botón nativo **dice** «Descartar» en la pantalla, pero su nombre accesible es «Descartar: Se dio de alta correo», porque `aria-label` gana sobre el contenido. Es exactamente lo que la bandeja de la lección 6 quería: con cinco avisos en la lista, cinco botones que se llamaran «Descartar» serían imposibles de distinguir para quien los oye. La prueba lo comprueba sin proponérselo: si alguien quitara el `aria-label`, la prueba del formulario que busca «Descartar: Se dio de alta correo» se pondría roja.

**`getByLabelText("Nombre")` y `getByRole("textbox", { name: "Nombre" })` encuentran el campo nativo y no la imitación.** El párrafo «Nombre» encima del campo se ve como una etiqueta, pero no está relacionado con él: es la figura 4 de la lección 7 vista desde una prueba.

La última parte de la salida es `logRoles`, una función de depuración de Testing Library que imprime los roles implícitos de un árbol y el nombre de cada elemento ([Testing Library, «Debugging»](https://testing-library.com/docs/dom-testing-library/api-debugging)). Cuando no sepas cómo se llama algo para una consulta, `logRoles(container)` te lo dice. Fíjate en que `section` aparece como `region` con el nombre «Nativo»: un `<section>` con nombre accesible tiene el rol `region`, que es justo lo que la lección 1 explicó para la `Tarjeta`, y por eso la suite puede buscar `getByRole("region", { name: "Avisos" })`. Dos detalles de la figura: `logRoles` colorea su salida para la terminal, y la línea `process.env.COLORS = "false"` lo apaga para que el archivo `.salida.txt` se lea limpio (la documentación nombra esa variable); y el párrafo aparece con el nombre vacío porque los párrafos no toman nombre de su contenido.

Esto no significa que solo se use `getByRole`. La suite usa `getByLabelText` para los campos del formulario, que es más directo y dice lo mismo (el campo tiene esa etiqueta), y `getByText` o `findByText` para textos que no son controles, como «No hay servicios configurados todavía.». Lo que **no** usa es `getByTestId` ni selectores de CSS. La regla práctica: busca primero por rol; si el elemento no tiene un rol útil (un párrafo, un texto suelto), por texto; y si para encontrar algo necesitas un identificador de prueba, pregúntate primero si una persona podría encontrarlo.

Hay un costo que conviene conocer. `ByRole` calcula el árbol de accesibilidad, y la documentación advierte que esos cálculos pueden ser caros con árboles de DOM grandes. Con el `revisor` no se nota (la prueba más lenta de la suite tardó 629 ms en la corrida de 8.1, con la aplicación completa montada), pero si una suite tuya se arrastra, ese es un sospechoso.

#### 8.2.3 `user-event`: una persona, no un evento

Para probar un formulario hay que escribir en él y enviarlo. Testing Library trae `fireEvent`, que dispara **un** evento del DOM: un `click`, un `input`. Pero una persona que hace clic produce varios eventos seguidos (el puntero baja, el puntero sube, el foco cambia, el clic), y una que escribe produce, por cada tecla, una secuencia de teclado y de entrada. `user-event` simula la interacción completa. Su documentación lo dice así: simula *interacciones* completas, que pueden disparar varios eventos y hacer comprobaciones en el camino; por ejemplo, no deja hacer clic en un elemento oculto ni escribir en un campo desactivado, como no lo dejaría el navegador ([Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro)).

Tres reglas de uso, las tres visibles en `montar.tsx` y en las pruebas:

1. **`userEvent.setup()` antes de dibujar.** La documentación lo recomienda así, y `montarEn` lo hace en ese orden. Devuelve un objeto, `usuario`, con los métodos `click`, `type`, `tab`, `keyboard`.
2. **Cada método se espera con `await`.** Devuelven promesas, porque entre tecla y tecla dejan que React y el DOM terminen su trabajo. Un `usuario.click(…)` sin `await` es una prueba que compara antes de que el clic haya ocurrido.
3. **Se escribe sobre lo que la persona tocaría.** `usuario.type(campo, "correo")` escribe en el campo que encontraste por su etiqueta; `usuario.tab()` mueve el foco al siguiente elemento enfocable, como la tecla Tab; `usuario.keyboard(" ")` pulsa Espacio sobre lo que tenga el foco. En la [documentación del teclado](https://testing-library.com/docs/user-event/keyboard), los caracteres imprimibles se escriben tal cual y las teclas con nombre van entre llaves (`{Shift}`).

La diferencia se nota en la prueba más fina de la suite: «el foco no se pierde al enviar». Llega al botón con Tab desde el último campo y envía con Espacio, que es lo que hace una persona con teclado. Con `fireEvent.click(boton)` se habría saltado justo la parte que importa: que el foco estuviera en el botón cuando se envió.

### 8.3 La aplicación entera, sin red ni navegador

#### 8.3.1 Lo único falso es la red

Para probar una pantalla del `revisor` hay que decidir qué es de verdad y qué es falso. Las opciones van de un extremo al otro: dibujar `ContenidoReporte` solo, pasándole a mano un objeto que imite el resultado de `useQuery`; reemplazar con `vi.mock` el módulo `cargar.ts` por uno que devuelva lo que quieras; o dibujar la aplicación completa y reemplazar solo `fetch`.

El punto de control eligió la tercera, y la razón es la misma regla de 8.2: parecerse a cómo se usa el programa. Si la prueba le pasa a `ContenidoReporte` un objeto inventado, comprueba que `ContenidoReporte` sabe dibujar ese objeto, pero no que TanStack Query lo produzca así, ni que la clave de la consulta sea la correcta, ni que `cargarReporte` valide la respuesta. Si la prueba reemplaza `cargar.ts`, se salta la frontera de red que la lección 0 escribió y la lección 4 conectó. En cambio, `fetch` es la frontera **exterior** del programa: todo lo que está de este lado (los componentes, Query, el enrutador, la validación con `esReportePublico`, el reducer de avisos) corre de verdad, y lo único que se decide es qué responde «la API». Es la misma frontera que el servidor de práctica imita, pero dentro del proceso y en cero milisegundos.

```ts
// revisor/src/pruebas/fetchFalso.ts
import { vi } from "vitest";

export interface RespuestaFalsa {
  readonly status: number;
  readonly cuerpo: unknown;
}

export type Rutas = Readonly<Record<string, RespuestaFalsa | (() => Promise<RespuestaFalsa>)>>;

// Sustituye `fetch` por una función que responde según "MÉTODO /ruta". Lo que no
// esté en la tabla responde 404, para que una ruta olvidada se note en la prueba.
export function instalarFetchFalso(rutas: Rutas) {
  const falso = vi.fn(async (entrada: RequestInfo | URL, opciones?: RequestInit) => {
    const url = new URL(String(entrada), "http://localhost");
    const clave = `${opciones?.method ?? "GET"} ${decodeURIComponent(url.pathname)}`;
    const definida = rutas[clave];
    const respuesta =
      definida === undefined
        ? { status: 404, cuerpo: { detalle: `sin ruta falsa para ${clave}` } }
        : typeof definida === "function"
          ? await definida()
          : definida;

    return new Response(JSON.stringify(respuesta.cuerpo), {
      status: respuesta.status,
      headers: { "content-type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", falso);
  return falso;
}

export function nuncaResponde(): Promise<RespuestaFalsa> {
  return new Promise(() => {});
}
```

Recorre la función de arriba abajo.

- **La tabla de rutas.** `instalarFetchFalso` recibe un objeto cuyas claves son `"MÉTODO /ruta"`, como `"GET /api/estados"` o `"POST /api/servicios"`, y cuyos valores son una respuesta (`status` y `cuerpo`) o una **función** que devuelve una promesa de respuesta. La función sirve para lo que no responde de inmediato: una respuesta que nunca llega, o una que la prueba entrega cuando quiere.
- **La clave sale de la petición.** `new URL(String(entrada), "http://localhost")` convierte la dirección relativa que usa el panel (`/api/estados`) en una URL completa para poder leer su `pathname`. `decodeURIComponent` importa con `catálogo`: al armar la URL, la tilde queda codificada (`/api/servicios/cat%C3%A1logo`), y la tabla se escribe con la tilde, como la escribiría una persona. El método sale de `opciones?.method`, y si no viene es `GET`, igual que en `fetch`.
- **Lo que no está en la tabla responde 404.** Es una decisión pequeña con consecuencias grandes. Si una prueba olvida declarar una ruta, el panel recibe un 404 con un `detalle` que dice `sin ruta falsa para GET /api/…`, y lo más probable es que la prueba falle mostrando ese texto. La otra opción, lanzar un error o devolver `undefined`, produciría fallas más confusas, o ninguna.
- **La respuesta es un `Response` de verdad.** `new Response(JSON.stringify(…), { status, headers })` es la clase estándar que también usa el navegador, y Node 24 la trae. Así `cargarReporte` lee `respuesta.ok`, `respuesta.status` y `respuesta.json()` igual que en producción.
- **`vi.fn` registra cada llamada.** El falso no es una función cualquiera: `vi.fn` la envuelve y guarda los argumentos de cada llamada en `mock.calls`, que es un arreglo con los argumentos de cada llamada, uno por elemento ([Vitest, `mock`](https://vitest.dev/api/mock.html)). Por eso `instalarFetchFalso` devuelve el falso: las pruebas pueden preguntar si se llamó, cuántas veces y con qué cuerpo.
- **`vi.stubGlobal("fetch", falso)`** lo instala como `fetch` global, y `preparar.ts` lo quita al terminar la prueba.

`nuncaResponde` es la función más corta del curso: una promesa que no se resuelve jamás. Con ella, la API «se queda pensando» para siempre, y la pantalla se queda en su estado de carga el tiempo que la prueba necesite para mirarlo.

Los datos de ejemplo viven aparte, para que todas las pruebas usen los mismos:

```ts
// revisor/src/pruebas/datos.ts
import type { DetalleServicio, ReportePublico } from "../compartido/contrato";

export const reporteDeEjemplo: ReportePublico = {
  estados: [
    { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
    { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
    { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
    { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
  ],
};

export const detallePagos: DetalleServicio = {
  nombre: "pagos",
  estado: { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
  revisiones: 3,
  ultimaRevision: "2026-10-21T08:00:00.000Z",
};
```

Son los cuatro servicios con los que arranca la API de práctica, con los mismos estados, y el detalle de `pagos`. Que coincidan no es casualidad: así una prueba se puede comparar con lo que ves en el navegador con `npm run dev`. Y van tipados como `ReportePublico` y `DetalleServicio`: si los tipos de la API cambian (`src/compartido/contrato.ts`), `tsc -b` marca los datos de prueba antes de que una prueba pase por accidente con datos viejos.

#### 8.3.2 Montar la aplicación en una dirección

```tsx
// revisor/src/pruebas/montar.tsx
import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Proveedores } from "../app/Proveedores";
import { rutas } from "../app/rutas";

// Monta la aplicación completa en una dirección, con un enrutador en memoria y una
// caché nueva en cada prueba, sin reintentos para que un error se vea de inmediato.
export function montarEn(direccion: string) {
  const clienteConsultas = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const enrutador = createMemoryRouter(rutas, { initialEntries: [direccion] });
  const usuario = userEvent.setup();

  render(
    <Proveedores clienteConsultas={clienteConsultas}>
      <RouterProvider router={enrutador} />
    </Proveedores>,
  );

  return { enrutador, usuario };
}
```

`montarEn` es la pieza que hace que cada prueba de pantalla quepa en cinco renglones, y cada una de sus líneas tiene una razón.

**Un `QueryClient` nuevo en cada prueba.** La caché de TanStack Query guarda lo que llegó de la API. Si dos pruebas compartieran cliente, la segunda vería el reporte de la primera antes de pedir nada, y el estado de «cargando» no existiría. Un cliente por prueba es una caché vacía por prueba. Y tiene `retry: false` en consultas y mutaciones: en la aplicación, `crearClienteConsultas` pide `retry: 2`, y la lección 4 midió las tres peticiones que eso produce con la API caída. En una prueba, esos reintentos solo retrasan el error con esperas crecientes; con `retry: false`, una respuesta 503 se vuelve el estado de error de inmediato.

**`createMemoryRouter(rutas, { initialEntries: [direccion] })`.** La aplicación usa `createBrowserRouter`, que guarda su historial en la barra de direcciones de la ventana. En jsdom esa barra existe (la API `history` funciona), pero es **una sola** para todas las pruebas del archivo: la dirección que dejó una prueba sería el punto de partida de la siguiente. `createMemoryRouter` crea un enrutador que guarda su historial en memoria, uno por prueba, y su documentación lo describe como útil para entornos que no son un navegador ([React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter)). `initialEntries` son las entradas iniciales de ese historial: la prueba dice «empieza en `/servicios/nuevo`» y la aplicación arranca ahí. Lo que importa es **qué** rutas recibe: el mismo arreglo `rutas` que usa `main.tsx`. Es la razón por la que la lección 5 lo escribió como un arreglo exportado y no como JSX dentro de `main.tsx`. Las pruebas no prueban una copia de las rutas; prueban las rutas.

**`<Proveedores clienteConsultas={…}>`.** El mismo componente que monta `main.tsx`, con la caché, las preferencias y la bandeja de avisos. La lección 6 lo sacó a su propio archivo para esto, y la lección 4 explicó el error que da un `useQuery` sin su proveedor: si la prueba montara las páginas sin `Proveedores`, fallarían por la razón equivocada.

**Lo que devuelve.** `{ enrutador, usuario }`. El `usuario` sirve para actuar; el `enrutador`, para preguntar dónde quedó la aplicación (`enrutador.state.location.search`) o para navegar desde fuera, como en el ejercicio 3. Lo que **no** devuelve son las consultas de `render`: las pruebas usan `screen`, que consulta todo el `document.body`. La diferencia importa poco aquí y algo en el futuro: si mañana un componente dibuja algo con un portal fuera de su contenedor, `screen` lo sigue encontrando.

Fíjate en lo que `montarEn` **no** monta: `StrictMode` ni `LimiteDeError`, que están en `main.tsx` alrededor de todo. Las pruebas montan lo que está dentro. `StrictMode` queda fuera a propósito: en desarrollo monta, desmonta y vuelve a montar cada componente (lección 3), así que la primera petición de cada consulta se cancelaría y se repetiría, y contar llamadas a `fetch` se volvería ambiguo. Si un día quieres esa doble pasada en una prueba, React Testing Library la ofrece con `configure({ reactStrictMode: true })` o con la opción `reactStrictMode` de `render`. El límite de error de las rutas sí está, porque viene dentro de `rutas`, y tiene su prueba en 8.3.4.

#### 8.3.3 Los estados del reporte

Con `instalarFetchFalso` y `montarEn`, los estados del reporte son siete pruebas casi iguales, que solo cambian en lo que responde la API y en lo que se espera ver:

```tsx
// revisor/src/reporte/PaginaReporte.test.tsx
import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { reporteDeEjemplo } from "../pruebas/datos";
import { instalarFetchFalso, nuncaResponde } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página del reporte", () => {
  test("cargando: anuncia la carga mientras la API no responde", async () => {
    instalarFetchFalso({ "GET /api/estados": nuncaResponde });
    montarEn("/");
    const cargando = await screen.findByText("Cargando…");
    expect(cargando.getAttribute("role")).toBe("status");
  });

  test("error: muestra el motivo y un botón para reintentar", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 503, cuerpo: { detalle: "caída" } } });
    montarEn("/");
    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("la API respondió 503");
    expect(within(alerta).getByRole("button", { name: "Reintentar" })).toBeDefined();
  });

  test("vacío: lo dice en lugar de dejar la lista en blanco", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: { estados: [] } } });
    montarEn("/");
    expect(await screen.findByText("No hay servicios configurados todavía.")).toBeDefined();
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("con datos: un enlace por servicio y el resumen de fallas", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    montarEn("/");
    const lista = await screen.findByRole("list");
    expect(within(lista).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual([
      "catálogo",
      "pagos",
      "inventario",
      "reportes",
    ]);
    expect(screen.getByText(/2 servicios con falla/)).toBeDefined();
  });

  test("sin fallas no pinta un 0 suelto en el resumen", async () => {
    const sinFallas = { estados: reporteDeEjemplo.estados.filter((estado) => estado.tipo === "disponible") };
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: sinFallas } });
    montarEn("/");
    const resumen = await screen.findByText(/servicios revisados/);
    expect(resumen.textContent).toBe("2 servicios revisados");
  });

  test("el filtro «solo fallas» viaja en la dirección", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    const { enrutador, usuario } = montarEn("/");
    await screen.findByRole("list");
    await usuario.click(screen.getByRole("checkbox", { name: "Solo fallas" }));
    expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(2);
    expect(enrutador.state.location.search).toBe("?fallas=1");
  });

  test("una dirección con el filtro ya puesto abre filtrada", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    montarEn("/?q=inv");
    const lista = await screen.findByRole("list");
    expect(within(lista).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual(["inventario"]);
  });
});
```

Recórrelas en orden, porque juntas son la tabla de estados que la lección 4 prometió.

**Cargando.** La API nunca responde, así que la pantalla se queda en `isPending`. La prueba busca «Cargando…» por texto y comprueba que su `role` sea `status`, por la razón de la figura 1: hay dos regiones de estado y `findByRole("status")` a secas fallaría. Lo que protege: que la carga se **anuncie**. Si alguien cambiara el `<p role="status">` por un `<p>` simple, la prueba se pondría roja aunque el texto siguiera en la pantalla.

**Error.** La API responde 503. La prueba busca la alerta, comprueba que el mensaje incluya `la API respondió 503` (lo escribe `cargarReporte`) y que **dentro de la alerta** haya un botón «Reintentar». `within(alerta)` acota la consulta a ese elemento: el botón tiene que estar junto al mensaje, no en cualquier parte de la página. Gracias a `retry: false`, el error aparece en el primer intento.

**Vacío.** La API responde `{ "estados": [] }`. La prueba espera el texto «No hay servicios configurados todavía.» y afirma con `queryByRole("list")` que **no** hay lista. Ese segundo `expect` es el que distingue «vacío» de «una lista sin elementos»: un `<ul>` vacío no le dice nada a nadie.

**Con datos.** Los cuatro servicios. La prueba toma la lista, dentro de ella todos los enlaces, y compara sus textos **en orden**. Después busca el resumen con una expresión regular, `/2 servicios con falla/`. Hace falta porque el texto del `<strong>` no es «2 servicios con falla» sino « · 2 servicios con falla», con el separador adelante (`ResumenFallas.tsx`, línea 10), y `getByText` con un texto fijo exige que el texto del elemento coincida completo. La expresión regular busca solo el pedazo que importa.

**Sin fallas no pinta un 0 suelto.** La que la escena necesitaba. La API responde solo los dos servicios disponibles, y la prueba compara el `textContent` completo del resumen con `"2 servicios revisados"`, exacto, con `toBe`. Si en ese texto apareciera cualquier cosa más, un `0`, un espacio, un punto, la comparación fallaría. Es el caso que la API de práctica no tiene y que nadie revisaría a mano. En 8.4 lo ves fallar.

**El filtro viaja en la dirección.** Aquí la prueba actúa: espera la lista, hace clic en la casilla «Solo fallas» (encontrada por su rol, `checkbox`, y su nombre) y comprueba dos cosas. Que la lista ahora tenga dos enlaces, y que la dirección del enrutador termine en `?fallas=1`. La segunda es la promesa de la lección 5: el filtro es estado de la URL, así que si alguien lo movía a un `useState`, la lista se filtraría igual, la primera afirmación pasaría y la segunda no.

**Una dirección con el filtro ya puesto abre filtrada.** La otra mitad de la misma promesa: montar en `/?q=inv` y ver solo `inventario`. Es lo que pasa cuando alguien pega un enlace compartido.

Faltan dos estados de la tabla, y lo digo para que no los busques. El de «con datos y error» del **reporte** (la actualización falló, pero se sigue mostrando el último reporte) no tiene prueba en el punto de control; el del **detalle** sí, y es la tercera prueba de 8.3.4. El de «datos viejos mientras se actualiza», el `· actualizando…` junto a la hora, tampoco: depende de una segunda petición en curso. Las dos pruebas las escribes tú en el ejercicio 4, y sin ellas no se cumple el tercer punto de «Cómo sabes que terminaste» del curso.

#### 8.3.4 Las rutas, con un enrutador en memoria

Dos archivos prueban la navegación. El del detalle:

```tsx
// revisor/src/detalle/PaginaServicio.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { detallePagos } from "../pruebas/datos";
import { instalarFetchFalso, type RespuestaFalsa } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página de un servicio", () => {
  test("muestra el detalle del servicio de la dirección", async () => {
    instalarFetchFalso({ "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos } });
    montarEn("/servicios/pagos");
    expect(await screen.findByText("En falla: HTTP 503")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Servicio pagos" })).toBeDefined();
  });

  test("volver a revisar deja un aviso en la bandeja", async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    await usuario.click(await screen.findByRole("button", { name: "Volver a revisar" }));
    expect(await screen.findByText("pagos se volvió a revisar: disponible")).toBeDefined();
    expect(fetchFalso.mock.calls.some(([, opciones]) => opciones?.method === "POST")).toBe(true);
  });

  test("si la actualización del detalle falla, conserva el detalle y la nota que se escribía", async () => {
    // El primer GET responde bien; los siguientes, 503. El clic en «Volver a revisar»
    // invalida el detalle, y esa segunda petición es la que falla.
    const detalles: RespuestaFalsa[] = [{ status: 200, cuerpo: detallePagos }];
    instalarFetchFalso({
      "GET /api/servicios/pagos": async () => detalles.shift() ?? { status: 503, cuerpo: { detalle: "caída" } },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    const nota = await screen.findByLabelText("Nota sobre pagos");
    await usuario.type(nota, "revisar con infraestructura");
    await usuario.click(screen.getByRole("button", { name: "Volver a revisar" }));

    expect(await screen.findByText(/Mostrando el último detalle que llegó/)).toBeDefined();
    expect(screen.getByText("En falla: HTTP 503")).toBeDefined();
    expect((screen.getByLabelText("Nota sobre pagos") as HTMLTextAreaElement).value).toBe("revisar con infraestructura");
  });
});
```

La primera prueba monta directamente en `/servicios/pagos` y espera el estado del servicio y el encabezado «Servicio pagos». Comprueba de un golpe tres cosas que nadie revisaría juntas: que la ruta `servicios/:nombre` lleve a `PaginaServicio`, que `useParams` entregue `pagos`, y que la consulta pida `GET /api/servicios/pagos`. Si la ruta pidiera otra dirección, el falso respondería 404 y el texto esperado nunca aparecería.

La segunda hace clic en «Volver a revisar» y espera el aviso en la bandeja, que es lo que la lección 6 conectó con `useReintentar`. Su última línea revisa que alguna llamada a `fetch` haya sido un `POST`: recorre `fetchFalso.mock.calls` y pregunta por el método de cada una.

La tercera prueba existe por un defecto que una revisión externa encontró y que ninguna de las otras dos podía ver. Mientras la primera petición del detalle responde bien y las siguientes con `503` (una función en la tabla del falso lleva la cuenta, como en el ejercicio 4), la prueba escribe un borrador en «Nota sobre pagos», hace clic en «Volver a revisar» y espera el aviso «Mostrando el último detalle que llegó». El clic invalida el detalle, la segunda petición falla y el estado de la consulta pasa a `error` con los datos anteriores todavía en la caché. La prueba comprueba tres cosas: el aviso, el estado «En falla: HTTP 503» que sigue a la vista y el borrador de la nota intacto. Esta última importa tanto como el aviso: con la versión anterior de la página, que dibujaba el detalle solo si `consulta.isSuccess`, el editor de la nota se desmontaba con el error y el borrador se perdía.

Una prueba nueva no vale hasta que se la ve roja. Con la página anterior (la condición `consulta.isSuccess` y un solo aviso de error) la suite da `1 failed | 26 passed (27)`, y el archivo, lo siguiente:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/detalle/PaginaServicio.tsx src/detalle/PaginaServicio.tsx
20c20
<       {consulta.isError && consulta.data === undefined && (
---
>       {consulta.isError && (
23,28c23
<       {consulta.isError && consulta.data !== undefined && (
<         <p role="alert" className="viejo">
<           Mostrando el último detalle que llegó: la actualización falló ({consulta.error.message}).
<         </p>
<       )}
<       {consulta.data !== undefined && (
---
>       {consulta.isSuccess && (
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/detalle/PaginaServicio.test.tsx (3 tests | 1 failed)
   ❯ la página de un servicio (3)
     ✓ muestra el detalle del servicio de la dirección
     ✓ volver a revisar deja un aviso en la bandeja
     × si la actualización del detalle falla, conserva el detalle y la nota que se escribía

 FAIL  src/detalle/PaginaServicio.test.tsx > la página de un servicio > si la actualización del detalle falla, conserva el detalle y la nota que se escribía
TestingLibraryElementError: Unable to find an element with the text: /Mostrando el último detalle que llegó/.
[… el DOM que había: solo «No se pudo cargar el detalle: la API respondió 503», sin detalle ni editor …]

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
```

Con el punto de control, la misma prueba pasa y la suite completa da `27 passed (27)`:

```bash
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/PaginaServicio.test.tsx (3 tests)

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

Las salidas completas están en `programas/08-pruebas-de-componentes/ejercicios/` (`detalle-viejo-con-isSuccess.salida.txt` y `detalle-viejo-punto-de-control.salida.txt`, con el `diff` en `detalle-viejo-con-isSuccess.diff.txt`).

Y el de las rutas en general:

```tsx
// revisor/src/app/rutas.test.tsx
import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";
import { Proveedores } from "./Proveedores";
import { rutas } from "./rutas";

function PaginaRota(): never {
  throw new Error("la página se rompió al dibujar");
}

describe("las rutas", () => {
  test("una dirección desconocida muestra la página de no encontrada", async () => {
    instalarFetchFalso({});
    montarEn("/no-existe");
    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeDefined();
    expect(screen.getByText("No existe ninguna página en /no-existe.")).toBeDefined();
  });

  test("el menú marca la página actual", async () => {
    instalarFetchFalso({});
    montarEn("/servicios/nuevo");
    const actual = await screen.findByRole("link", { name: "Dar de alta" });
    expect(actual.getAttribute("aria-current")).toBe("page");
  });

  test("una página que se rompe al dibujar muestra el aviso del revisor", async () => {
    // React y React Router anuncian el error en la consola; aquí se espera, así que se calla.
    const consola = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => consola.mockRestore());

    // La ruta raíz del revisor, con su límite de error, y una sola página: una que lanza.
    const enrutador = createMemoryRouter([
      { ...rutas[0], index: false, children: [{ index: true, Component: PaginaRota }] },
    ]);
    render(
      <Proveedores clienteConsultas={new QueryClient()}>
        <RouterProvider router={enrutador} />
      </Proveedores>,
    );

    const aviso = await screen.findByRole("alert");
    expect(aviso.querySelector("h2")?.textContent).toBe("Algo salió mal al dibujar el panel");
    expect(aviso.querySelector("p")?.textContent).toBe("la página se rompió al dibujar");
    expect(screen.queryByText("Unexpected Application Error!")).toBeNull();
  });
});
```

**La dirección desconocida** monta en `/no-existe` y espera el encabezado y el texto de `PaginaNoEncontrada`, con la dirección incluida. Comprueba que la ruta comodín `*` exista y esté al final.

**El menú marca la página actual** monta en `/servicios/nuevo` y comprueba que el enlace «Dar de alta» tenga `aria-current="page"`. Ese atributo lo pone `NavLink` en el enlace activo (lección 5), y es lo que un lector de pantalla anuncia como «página actual». La prueba no mira la clase `active`, que solo sirve para pintar: mira el atributo que llega a la tecnología de asistencia.

**Una página que se rompe al dibujar muestra el aviso del revisor** es distinta de las demás, y vale la pena leerla despacio. No usa `montarEn`, porque necesita una ruta que no existe en la aplicación: una página que lanza un error al dibujarse. Arma su propio enrutador con **la ruta raíz real** del `revisor`, `rutas[0]`, con su `Component: Disposicion` y su `ErrorBoundary: ErrorDeRuta`, pero le cambia los hijos por uno solo, `PaginaRota`. El `index: false` está para TypeScript: en el tipo `RouteObject`, una ruta índice no puede tener hijos, y al escribirlo explícito la copia queda del lado de las rutas que sí los admiten. Luego comprueba que aparezca la alerta con el título y el mensaje de `AvisoDeError`, y que **no** aparezca el «Unexpected Application Error!» que dibuja React Router cuando una ruta no tiene límite propio (lección 5).

Las dos primeras líneas de esa prueba callan la consola. Cuando un componente lanza, React y React Router anuncian el error con `console.error`, aunque un límite lo atrape: es información para quien desarrolla. Aquí ese error es **el escenario** de la prueba, no un problema, y dejarlo salir llenaría la salida de pilas que parecen fallas. `vi.spyOn(console, "error")` envuelve el método y `.mockImplementation(() => undefined)` lo deja sin efecto; `onTestFinished(() => consola.mockRestore())` lo restaura al terminar. `mockRestore` devuelve el método original de un objeto espiado con `vi.spyOn`, y `onTestFinished` se llama siempre después de que la prueba terminó de correr, después de los `afterEach` ([Vitest, «Hooks»](https://vitest.dev/api/hooks.html)). Se usa en lugar de un `consola.mockRestore()` al final del cuerpo por una razón: si la prueba falla a la mitad, el final del cuerpo nunca se ejecuta, y la consola se quedaría callada para las pruebas siguientes. Calla solo lo que esta prueba provoca, y solo mientras dura.

#### 8.3.5 El formulario

El alta de la lección 7 tiene la suite más larga, porque es la pantalla con más comportamiento: validar, enviar, anunciar, no perder el foco, no enviar dos veces, traducir el 409.

```tsx
// revisor/src/alta/FormularioAlta.test.tsx
import { screen, within } from "@testing-library/react";
import { describe, expect, onTestFinished, test } from "vitest";
import { instalarFetchFalso, type RespuestaFalsa } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("el formulario de alta", () => {
  test("sin datos marca los tres campos y lo anuncia", async () => {
    const fetchFalso = instalarFetchFalso({});
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.click(await screen.findByRole("button", { name: "Dar de alta" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Revisa los campos marcados.");
    for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)"]) {
      expect(screen.getByLabelText(etiqueta).getAttribute("aria-invalid")).toBe("true");
    }
    expect(screen.getByLabelText("Nombre").getAttribute("aria-describedby")).toBe(
      "nombre-error nombre-ayuda",
    );
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  test("con datos válidos envía el alta y confirma", async () => {
    const fetchFalso = instalarFetchFalso({
      "POST /api/servicios": {
        status: 201,
        cuerpo: { nombre: "correo", tipo: "disponible", codigoHttp: 200, duracionMs: 75 },
      },
    });
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "correo");
    await usuario.type(screen.getByLabelText("Dirección"), "https://correo.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));

    // El éxito se anuncia una sola vez: en la bandeja de avisos, no también en el formulario.
    expect(await screen.findByRole("button", { name: "Descartar: Se dio de alta correo" })).toBeDefined();
    expect(screen.queryByText("Se dio de alta correo.")).toBeNull();
    const [, opciones] = fetchFalso.mock.calls[0] ?? [];
    expect(JSON.parse(String(opciones?.body))).toEqual({
      nombre: "correo",
      url: "https://correo.example/",
      timeoutMs: 1500,
    });
  });

  test("declara los obligatorios y la bandeja anuncia solo el aviso nuevo", async () => {
    instalarFetchFalso({});
    montarEn("/servicios/nuevo");

    for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)"]) {
      const campo = (await screen.findByLabelText(etiqueta)) as HTMLInputElement;
      expect(campo.required).toBe(true);
    }
    const bandeja = screen.getByRole("region", { name: "Avisos" });
    expect(within(bandeja).getByRole("status").getAttribute("aria-atomic")).toBe("false");
  });

  test("el foco no se pierde al enviar y un segundo envío se ignora", async () => {
    // La respuesta se entrega a mano. Una acción que nunca terminara dejaría pendiente
    // la Transition y enredaría las acciones de las pruebas siguientes: por eso, aunque
    // esta prueba falle a la mitad, al terminar se responde lo que quede pendiente.
    const creado: RespuestaFalsa = {
      status: 201,
      cuerpo: { nombre: "correo", tipo: "disponible", codigoHttp: 200, duracionMs: 75 },
    };
    let responder: (respuesta: RespuestaFalsa) => void = () => {};
    const fetchFalso = instalarFetchFalso({
      "POST /api/servicios": () => new Promise<RespuestaFalsa>((listo) => (responder = listo)),
    });
    onTestFinished(() => responder(creado));
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "correo");
    await usuario.type(screen.getByLabelText("Dirección"), "https://correo.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Dar de alta" }));

    await usuario.keyboard(" ");
    const pendiente = await screen.findByRole("button", { name: "Dando de alta…" });
    // jsdom no saca el foco de un botón desactivado (Chrome sí: lo manda al body), así
    // que se comprueba la causa: el botón sigue habilitado y anuncia que no está disponible.
    expect(pendiente.hasAttribute("disabled")).toBe(false);
    expect(pendiente.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(pendiente);

    // Un segundo Espacio mientras está pendiente. Si no se ignorara, React lo pondría en
    // cola y lo enviaría en cuanto terminara el primero: por eso se cuenta al final.
    await usuario.keyboard(" ");
    responder(creado);

    expect(await screen.findByRole("button", { name: "Descartar: Se dio de alta correo" })).toBeDefined();
    expect(document.activeElement).toBe(await screen.findByRole("button", { name: "Dar de alta" }));
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  test("un nombre repetido se marca en su campo con el mensaje de la API", async () => {
    instalarFetchFalso({
      "POST /api/servicios": {
        status: 409,
        cuerpo: { detalle: "ya existe un servicio llamado pagos", campos: { nombre: "ese nombre ya existe" } },
      },
    });
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "pagos");
    await usuario.type(screen.getByLabelText("Dirección"), "https://pagos.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));

    expect(await screen.findByText("ese nombre ya existe")).toBeDefined();
    expect(screen.getByLabelText("Nombre").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Dirección").getAttribute("aria-invalid")).toBe("false");
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("pagos");
  });
});
```

**Sin datos marca los tres campos y lo anuncia.** La API no tiene ninguna ruta declarada (`instalarFetchFalso({})`), así que cualquier petición respondería 404. La prueba hace clic en «Dar de alta» con el formulario vacío y comprueba cuatro cosas: el texto de la alerta, `aria-invalid="true"` en los tres campos (encontrados por su etiqueta, en un `for`), el `aria-describedby` del nombre con el error **antes** que la ayuda (el orden en que el lector los lee, lección 7), y que `fetch` no se haya llamado nunca. Esa última es la que demuestra que la validación ocurre en el navegador: si el formulario mandara la petición y esperara a que la API se quejara, la prueba seguiría viendo errores (la API falsa respondería 404) pero `not.toHaveBeenCalled()` se pondría rojo.

**Con datos válidos envía el alta y confirma.** La API responde 201. La prueba escribe en los tres campos, hace clic y espera el botón «Descartar: Se dio de alta correo», que solo existe cuando hay un aviso en la bandeja. Después afirma que el texto «Se dio de alta correo.» con punto, el que tendría un formulario con su propia región de éxito (la versión con dos `status` que la lección 7 descartó en 7.3.3), **no** está: el éxito se anuncia en un solo lugar. Por último lee el cuerpo de la primera llamada a `fetch`: `fetchFalso.mock.calls[0]` es el arreglo de argumentos `[entrada, opciones]`, y la desestructuración `const [, opciones]` se salta el primero. El cuerpo es JSON, así que se convierte con `JSON.parse` y se compara con `toEqual`. Fíjate en la URL: la persona escribió `https://correo.example` y viajó `https://correo.example/`, con la barra final que agrega el esquema. La prueba documenta esa normalización.

**Declara los obligatorios y la bandeja anuncia solo el aviso nuevo.** Dos de los arreglos de la lección 7, en una prueba. `campo.required` es la propiedad del DOM que refleja el atributo `required`; el `as HTMLInputElement` le dice a TypeScript que lo encontrado por etiqueta es un `<input>`, porque `findByLabelText` solo promete un `HTMLElement`. Y la bandeja se encuentra por su rol de región y su nombre, «Avisos», y dentro de ella el `status`, para leer su `aria-atomic`. Es una prueba de atributos, no de comportamiento: jsdom no tiene lector de pantalla, así que lo más cerca que puede llegar es comprobar que el atributo que el lector necesita está puesto.

**El foco no se pierde al enviar y un segundo envío se ignora.** La prueba más cuidadosa de la suite, y la que la escena necesitaba para el botón. Va por partes.

1. *La respuesta se entrega a mano.* La ruta `POST /api/servicios` es una función que devuelve una promesa y guarda su `listo` en la variable `responder`. Mientras nadie llame a `responder`, el alta está pendiente, y la prueba puede mirar el formulario en ese estado el tiempo que quiera. Es la versión controlable de `nuncaResponde`.
2. *`onTestFinished(() => responder(creado))`.* Si la prueba fallara a la mitad, el alta quedaría pendiente para siempre, y con ella la *Transition* de React que la envuelve (lección 7). El comentario del archivo dice qué pasaría: esa acción sin terminar enredaría las acciones de las pruebas siguientes. Por eso, pase lo que pase, al terminar se responde lo que quede pendiente.
3. *Llegar al botón como lo haría Raúl.* Escribe en los tres campos y pulsa Tab: el foco pasa del último campo al botón. La prueba lo comprueba con `document.activeElement`, el elemento que tiene el foco.
4. *Enviar con Espacio.* `usuario.keyboard(" ")` sobre el botón enfocado. La prueba espera el botón «Dando de alta…», que solo existe mientras `useFormStatus` dice `pending`.
5. *Comprobar la causa, no el efecto.* Aquí está la decisión más importante, y el comentario la dice: jsdom no saca el foco de un botón desactivado; Chrome sí. Si la prueba solo comprobara `document.activeElement`, pasaría también con `disabled={pending}`, porque en jsdom el foco se queda donde estaba aunque en el navegador se vaya al `body`. Por eso comprueba primero lo que **causa** que el foco se conserve: que el botón **no** tenga el atributo `disabled` y que **sí** tenga `aria-disabled="true"`. El `activeElement` se comprueba también, pero es la afirmación débil; la fuerte es la anterior. La sección 8.5 mide esa diferencia entre jsdom y Chrome.
6. *El segundo Espacio.* Con el alta todavía pendiente, otro `usuario.keyboard(" ")`. Si la guarda de `BotonEnviar` no cancelara el clic, React pondría ese segundo envío en cola.
7. *Responder y contar.* `responder(creado)` termina el alta. La prueba espera el aviso de la bandeja, comprueba que el foco esté en el botón, que ya volvió a decir «Dar de alta», y que `fetch` se haya llamado **una** vez.

**Un nombre repetido se marca en su campo con el mensaje de la API.** La API responde 409 con `campos.nombre`. La prueba espera el texto del error («ese nombre ya existe», que viene de la API y no del esquema), comprueba que solo «Nombre» quede inválido y que «Dirección» siga en `false`, y que el campo conserve lo escrito. Esa última línea protege el `defaultValue` desde el estado de la lección 7: si `Campo` recibiera un valor fijo, React vaciaría el campo después de la acción, y la persona tendría que volver a escribir todo por un solo error.

### 8.4 La prueba que se pone roja al revertir el arreglo

#### 8.4.1 El experimento

Una prueba verde responde «¿el código cumple esto?». No responde «¿esta prueba notaría si el arreglo desapareciera?». Para la segunda pregunta hay un experimento directo, y es el que da nombre a la sección:

1. Copia el punto de control (o trabaja en una rama que vas a descartar).
2. Deshaz **solo** el arreglo que la prueba dice proteger, en un solo archivo.
3. Corre solo el archivo de pruebas que lo cubre.
4. Lee el rojo: ¿falla la prueba que esperabas, por la razón que esperabas, con un mensaje que explica el problema?
5. Restaura y vuelve a correr.

Si en el paso 4 todo sigue verde, la prueba no protege ese arreglo, por bien escrita que parezca. Eso no es un fracaso del experimento: es justo lo que el experimento sirve para descubrir. Se hizo con tres arreglos del curso, uno de ellos deshecho de dos formas, y las cuatro reversiones se pusieron rojas. El ejercicio 2 agrega un cuarto arreglo. Y en el ejercicio 3 vas a escribir una prueba que no pasa el examen.

Correr un solo archivo es `npx vitest run` seguido de la ruta, o de un pedazo de ella: `npx vitest run src/alta` corre todos los archivos de prueba cuya ruta contenga `src/alta`. Es más rápido y la salida no se mezcla con lo demás.

#### 8.4.2 El cero suelto

El arreglo de la lección 1: en `ResumenFallas.tsx`, la condición es `{fallas > 0 && …}`. En la copia se cambió por la versión «más corta» de la escena:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ResumenFallas.tsx src/reporte/ResumenFallas.tsx
10c10
<       {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
---
>       {fallas && <strong> · {textoFallas(fallas)}</strong>}
$ npx vitest run src/reporte/PaginaReporte.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/PaginaReporte.test.tsx (7 tests | 1 failed) 256ms
   ❯ la página del reporte (7)
     ✓ cargando: anuncia la carga mientras la API no responde 36ms
     ✓ error: muestra el motivo y un botón para reintentar 58ms
     ✓ vacío: lo dice en lugar de dejar la lista en blanco 28ms
     ✓ con datos: un enlace por servicio y el resumen de fallas 25ms
     × sin fallas no pinta un 0 suelto en el resumen 16ms
     ✓ el filtro «solo fallas» viaja en la dirección 57ms
     ✓ una dirección con el filtro ya puesto abre filtrada 35ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/PaginaReporte.test.tsx > la página del reporte > sin fallas no pinta un 0 suelto en el resumen
AssertionError: expected '2 servicios revisados0' to be '2 servicios revisados' // Object.is equality

Expected: "2 servicios revisados"
Received: "2 servicios revisados0"

 ❯ src/reporte/PaginaReporte.test.tsx:48:33
     46|     montarEn("/");
     47|     const resumen = await screen.findByText(/servicios revisados/);
     48|     expect(resumen.textContent).toBe("2 servicios revisados");
       |                                 ^
     49|   });
     50|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  04:04:54
   Duration  1.13s (environment 53%, tests 25%, transform 8%, import 7%, setup 6%)
```

Una prueba roja de siete, la que debía. Lee el mensaje de abajo hacia arriba, que es como se lee mejor una falla. El resumen: `Tests  1 failed | 6 passed (7)`. El nombre: «sin fallas no pinta un 0 suelto en el resumen», que ya te dice qué pasó. La comparación: `Expected: "2 servicios revisados"` contra `Received: "2 servicios revisados0"`. Y el lugar: la línea 48 del archivo de pruebas, con una flecha bajo `toBe`.

El `0` pegado al final es el error de la lección 1, visto desde una prueba: cuando `fallas` vale `0`, la expresión `0 && <strong>…</strong>` vale `0`, y React dibuja los números (no dibuja `false`, `null` ni `undefined`, pero sí `0`). Las otras seis pruebas siguen verdes, y eso también es información: en particular, «con datos» sigue verde, porque con dos fallas `fallas && …` se comporta igual que `fallas > 0 && …`. **Una sola prueba de este archivo distingue el arreglo del error**, y es la que tiene datos sin fallas. Si no existiera, la suite diría «todo bien» con el error de la escena adentro.

Restaurado el archivo, el archivo de pruebas vuelve a `7 passed (7)`, y la suite completa, a 27 de 27.

#### 8.4.3 El botón que se lleva el foco

El arreglo de la lección 7: `BotonEnviar` lleva `aria-disabled={pending}` y cancela el clic mientras está pendiente, en lugar de `disabled={pending}`. Hay **dos** formas de deshacerlo, y la prueba tiene que notar las dos.

La primera es la de la escena: volver a `disabled`.

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/BotonEnviar.tsx src/alta/BotonEnviar.tsx
17c17
<     <button type="submit" aria-disabled={pending} onClick={alPulsar}>
---
>     <button type="submit" disabled={pending} onClick={alPulsar}>
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 362ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 75ms
     ✓ con datos válidos envía el alta y confirma 96ms
     ✓ declara los obligatorios y la bandeja anuncia solo el aviso nuevo 9ms
     × el foco no se pierde al enviar y un segundo envío se ignora 94ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 87ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 ❯ src/alta/FormularioAlta.test.tsx:82:48
     80|     // jsdom no saca el foco de un botón desactivado (Chrome sí: lo ma…
     81|     // que se comprueba la causa: el botón sigue habilitado y anuncia …
     82|     expect(pendiente.hasAttribute("disabled")).toBe(false);
       |                                                ^
     83|     expect(pendiente.getAttribute("aria-disabled")).toBe("true");
     84|     expect(document.activeElement).toBe(pendiente);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:26
   Duration  1.31s (environment 43%, tests 29%, import 11%, transform 10%, setup 6%)
```

Falla en la línea 82, `expect(pendiente.hasAttribute("disabled")).toBe(false)`, con `expected true to be false`: el botón pendiente tiene el atributo `disabled`. Fíjate en **dónde** falla: en la comprobación de la causa, dos líneas antes de la del foco. Si la prueba no tuviera esa línea, llegaría a `expect(document.activeElement).toBe(pendiente)`, y en jsdom eso **pasaría**, porque jsdom deja el foco en el botón aunque esté desactivado (8.5). La prueba estaría verde con el error que la lección 7 midió en Chrome. Esa línea existe porque alguien hizo este experimento.

Fíjate también en lo que sale **antes** del rojo: un aviso en `stderr`, «A suspended resource finished loading inside a test, but the event was not wrapped in act(...)». Es el caso que 8.2.1 anunció, una actualización cuando ya nadie estaba esperando. La prueba falló en la línea 82, antes de llegar a `responder(creado)`; al terminar, `onTestFinished` entregó la respuesta pendiente, y la acción del formulario terminó fuera de cualquier `act`. El mensaje habla de un «recurso suspendido» porque así llama React a la promesa que estaba esperando. Con el punto de control, la prueba llega a `responder(creado)` dentro de su cuerpo y el aviso no aparece. Es la línea de `IS_REACT_ACT_ENVIRONMENT` en `preparar.ts` la que hace visible este aviso: sin ella, el rojo saldría igual, pero callado.

La segunda forma de deshacerlo es más sutil: dejar `aria-disabled`, que se ve bien en la revisión de código, y quitar la guarda que cancela el clic.

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/BotonEnviar.tsx src/alta/BotonEnviar.tsx
17c17
<     <button type="submit" aria-disabled={pending} onClick={alPulsar}>
---
>     <button type="submit" aria-disabled={pending}>
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 1387ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 77ms
     ✓ con datos válidos envía el alta y confirma 97ms
     ✓ declara los obligatorios y la bandeja anuncia solo el aviso nuevo 9ms
     × el foco no se pierde al enviar y un segundo envío se ignora 1095ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 109ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
TestingLibraryElementError: Unable to find role="button" and name "Descartar: Se dio de alta correo"

Ignored nodes: comments, script, style
<body>
[… recortado: 141 líneas del DOM (encabezado, bandeja y los tres campos) …]
          <button
            aria-disabled="true"
            type="submit"
          >
            Dando de alta…
          </button>
        </form>
        <div
          id="resultado-alta"
        >
          <div
            role="alert"
          />
        </div>
        <section
          aria-label="Altas de esta sesión"
        >
          <h3>
            Altas de esta sesión
          </h3>
          <ul>
            <li
              class="pendiente"
            >
              correo
               (agregando…)
            </li>
          </ul>
        </section>
      </section>
    </main>
  </div>
</body>
[… recortado: la salida imprime el mismo DOM otra vez, 177 líneas …]
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ src/alta/FormularioAlta.test.tsx:91:25
     89|     responder(creado);
     90|
     91|     expect(await screen.findByRole("button", { name: "Descartar: Se di…
       |                         ^
     92|     expect(document.activeElement).toBe(await screen.findByRole("butto…
     93|     expect(fetchFalso).toHaveBeenCalledTimes(1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:27
   Duration  1.79s (tests 80%, environment 14%, import 3%, setup 2%, transform 2%)
```

Esta vez falla en la línea 91 (y vuelve a salir el aviso de `act`, dos veces, por la misma razón que antes), `findByRole("button", { name: "Descartar: Se dio de alta correo" })`, con «Unable to find role="button"». La salida real imprime el DOM completo de la página, más de cien líneas; arriba se dejaron el principio y el final, y el corte está marcado. El final es lo que importa: después de `responder(creado)` y un segundo entero de espera, el botón **sigue** diciendo «Dando de alta…» con `aria-disabled="true"`, y «Altas de esta sesión» sigue mostrando `correo (agregando…)`. El segundo Espacio no se ignoró: puso un segundo envío en cola. Ese segundo envío llamó otra vez a `fetch`, que guardó un nuevo `responder` que nadie llamó, y el formulario quedó pendiente. Lo que se ve en el DOM es eso; lo que se deduce, y la lección 7 explicó, es que React junta las acciones en curso, y el aviso de la primera no se confirma en la pantalla mientras la segunda no termine. Es la misma razón por la que la prueba cuenta las llamadas a `fetch` **al final**: un segundo envío en cola no se ve mientras el primero está pendiente.

En la lección 7 este mismo error se midió en Chrome, con la bitácora de la API: un `201` seguido de un `409`. Aquí la misma prueba lo detecta en menos de dos segundos, sin API y sin navegador.

Las dos variantes dan `Tests  1 failed | 4 passed (5)` en `src/alta`. Restaurado, `5 passed (5)`.

#### 8.4.4 El límite de error de las rutas

El arreglo de la lección 5: `ErrorBoundary: ErrorDeRuta` en la ruta raíz. En la copia se borró esa línea de `rutas.tsx`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/app/rutas.tsx src/app/rutas.tsx
13d12
<     ErrorBoundary: ErrorDeRuta,
$ npx vitest run src/app
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/app/rutas.test.tsx (3 tests | 1 failed) 1089ms
   ❯ las rutas (3)
     ✓ una dirección desconocida muestra la página de no encontrada 59ms
     ✓ el menú marca la página actual 8ms
     × una página que se rompe al dibujar muestra el aviso del revisor 1019ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/app/rutas.test.tsx > las rutas > una página que se rompe al dibujar muestra el aviso del revisor
TestingLibraryElementError: Unable to find role="alert"

Ignored nodes: comments, script, style
<body>
  <div>
    <h2>
      Unexpected Application Error!
    </h2>
    <h3
      style="font-style: italic;"
    >
      la página se rompió al dibujar
    </h3>
    <pre
      style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);"
    >
      Error: la página se rompió al dibujar
[… recortado: 10 renglones de la pila …]
    </pre>
    <p>
      💿 Hey developer 👋
    </p>
    <p>
      You can provide a way better UX than this when your app throws errors by providing your own
      <code
        style="padding: 2px 4px; background-color: rgba(200, 200, 200, 0.5);"
      >
        ErrorBoundary
      </code>
       or

      <code
        style="padding: 2px 4px; background-color: rgba(200, 200, 200, 0.5);"
      >
        errorElement
      </code>
       prop on your route.
    </p>
  </div>
</body>
[… recortado: la salida imprime el mismo DOM otra vez, 48 líneas …]
 ❯ PaginaRota src/app/rutas.test.tsx:11:9
      9|
     10| function PaginaRota(): never {
     11|   throw new Error("la página se rompió al dibujar");
       |         ^
     12| }
     13|
 ❯ Object.react_stack_bottom_frame node_modules/react-dom/cjs/react-dom-client.development.js:28571:20
 ❯ renderWithHooks node_modules/react-dom/cjs/react-dom-client.development.js:8030:22
 ❯ updateFunctionComponent node_modules/react-dom/cjs/react-dom-client.development.js:10569:19
 ❯ beginWork node_modules/react-dom/cjs/react-dom-client.development.js:12205:18
 ❯ runWithFiberInDEV node_modules/react-dom/cjs/react-dom-client.development.js:1048:13
 ❯ performUnitOfWork node_modules/react-dom/cjs/react-dom-client.development.js:19176:22
 ❯ workLoopSync node_modules/react-dom/cjs/react-dom-client.development.js:19004:41
 ❯ renderRootSync node_modules/react-dom/cjs/react-dom-client.development.js:18985:11
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ src/app/rutas.test.tsx:44:32

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  04:05:30
   Duration  2.20s (tests 56%, environment 36%, import 3%, transform 3%, setup 2%)
```

«Unable to find role="alert"», y debajo, el DOM que sí había: el límite por omisión de React Router, con «Unexpected Application Error!», el mensaje, la pila (recortada arriba) y el párrafo que te sugiere poner tu propio `ErrorBoundary` o `errorElement` en la ruta. Ese párrafo existe solo en la versión de desarrollo de React Router: Vitest no corre en modo de producción (`NODE_ENV` vale `test`), así que Vite carga esa versión, igual que carga la de React (fíjate en `react-dom-client.development.js` en la pila). Es la pantalla que la lección 5 mostró en Chrome, ahora como texto en la salida de una prueba. La salida real imprime ese DOM dos veces; la segunda copia se quitó. `Tests  1 failed | 2 passed (3)`.

Las tres pruebas pasaron el examen, cuatro veces. Lo que tienen en común vale más que cada una: **cada una afirma exactamente lo que el arreglo cambió**. El resumen se compara entero, no con un `toContain`. El botón se revisa por su atributo, no solo por el foco. La alerta se busca por su rol, y además se comprueba que no aparezca el texto del límite ajeno. Cuando una prueba afirma algo más débil que el arreglo, el error pasa por el hueco.

### 8.5 Lo que jsdom no puede comprobar

#### 8.5.1 Un DOM que no dibuja

jsdom implementa el DOM, los eventos, los formularios y la lectura de las hojas de estilo (sabe qué regla aplica a cada elemento, como muestra el renglón 4 de la figura). Lo que no hace es **dibujar**. Su README pone dos cosas fuera de su alcance: la navegación (cambiar de página al seguir un enlace o al asignar `location.href`) y el diseño, que define como la capacidad de calcular dónde quedarán los elementos por efecto del CSS. Para el diseño hay valores de relleno, y muchas propiedades devuelven ceros ([jsdom, README](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform)).

Eso tiene una consecuencia que no es obvia: hay comportamientos del navegador que dependen del dibujo aunque no parezcan de dibujo. El foco es uno. La figura 3 hace cuatro preguntas a jsdom, sin React, y una página HTML gemela hace las mismas cuatro a Chrome:

```tsx
// fig08_03.tsx
import { JSDOM } from "jsdom";

// Sin React a propósito: lo que se mide aquí es el DOM de prueba, no la biblioteca.
// `pretendToBeVisual` le da a jsdom un requestAnimationFrame, para esperar dos cuadros
// como en fig08_03.html, la misma página para Chrome.
const dom = new JSDOM(`<!doctype html>
<style>
  button[aria-disabled="true"] { opacity: 0.6; cursor: not-allowed; }
  .oculto { display: none; }
</style>
<button type="submit" id="enviar">Dar de alta</button>
<button type="button" id="escondido" class="oculto">Escondido</button>`, { pretendToBeVisual: true });

const { document } = dom.window;
const enviar = document.getElementById("enviar") as HTMLButtonElement;
const escondido = document.getElementById("escondido") as HTMLButtonElement;

function quienTieneElFoco(): string {
  const activo = document.activeElement;
  return activo === null ? "nadie" : activo.id === "" ? activo.tagName.toLowerCase() : `#${activo.id}`;
}

console.log("1. el foco en un botón que se desactiva");
enviar.focus();
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);
enviar.disabled = true;
console.log(`   después de disabled = true: foco en ${quienTieneElFoco()}`);
await new Promise((listo) => dom.window.requestAnimationFrame(() => dom.window.requestAnimationFrame(listo)));
console.log(`   dos cuadros después: foco en ${quienTieneElFoco()}`);
enviar.disabled = false;
enviar.focus();

console.log("2. el foco en un elemento con display: none");
escondido.focus();
console.log(`   display calculado: ${dom.window.getComputedStyle(escondido).display}`);
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);

console.log("3. el diseño");
const caja = enviar.getBoundingClientRect();
console.log(`   getBoundingClientRect(): ${caja.width} × ${caja.height} en (${caja.x}, ${caja.y})`);
console.log(`   offsetWidth: ${enviar.offsetWidth}`);

console.log("4. la hoja de estilos");
enviar.setAttribute("aria-disabled", "true");
const estilo = dom.window.getComputedStyle(enviar);
console.log(`   opacity: ${estilo.opacity}, cursor: ${estilo.cursor}`);

dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_03.tsx
$ node fig08_03.js
1. el foco en un botón que se desactiva
   después de focus(): foco en #enviar
   después de disabled = true: foco en #enviar
   dos cuadros después: foco en #enviar
2. el foco en un elemento con display: none
   display calculado: none
   después de focus(): foco en #enviar
3. el diseño
   getBoundingClientRect(): 0 × 0 en (0, 0)
   offsetWidth: 0
4. la hoja de estilos
   opacity: 0.6, cursor: not-allowed
```

Y la página gemela, `fig08_03.html` (está junto a la figura, con el mismo HTML y los mismos pasos escritos en JavaScript de navegador), abierta en Chrome sin ventana:

```bash
$ google-chrome --headless --disable-gpu --no-first-run \
    --user-data-dir="$PWD/perfil" --virtual-time-budget=3000 --dump-dom "file://$PWD/fig08_03.html"
1. el foco en un botón que se desactiva
   después de focus(): foco en #enviar
   después de disabled = true: foco en #enviar
   dos cuadros después: foco en body
2. el foco en un elemento con display: none
   display calculado: none
   después de focus(): foco en #enviar
3. el diseño
   getBoundingClientRect(): 81.21875 × 21 en (8, 8)
   offsetWidth: 81
4. la hoja de estilos
   opacity: 0.6, cursor: not-allowed
```

(Lo que se muestra es el contenido del `<pre id="salida">` donde la página escribe sus resultados; `--dump-dom` imprime la página entera. En Chromium el ejecutable se llama `chromium`; en macOS, donde se midió esta salida, la ruta es `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. `--virtual-time-budget` deja correr los temporizadores y los cuadros de animación antes de imprimir. Y `--user-data-dir` usa un perfil de Chrome nuevo en la carpeta `perfil/`, para no tocar el tuyo: bórrala al terminar y no la subas al repositorio.)

Compara renglón por renglón.

**1. El foco en un botón que se desactiva.** Justo después de `disabled = true`, **los dos** dicen que el foco sigue en `#enviar`. Dos cuadros de animación después, Chrome dice `body` y jsdom sigue diciendo `#enviar`. La especificación de HTML explica la diferencia. En los pasos de «actualizar la representación» (*update the rendering*), que el navegador corre cuando va a dibujar un cuadro, hay uno que dice: si el área enfocada del documento ya no es un área enfocable, se corren los pasos de enfoque sobre el *viewport* del documento (en la práctica, el foco cae en el `body`, que es lo que Chrome reporta). Y pone como ejemplo justo esto: que a un control se le ponga `disabled` ([WHATWG, HTML, «Update the rendering»](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)). La especificación la llama una corrección **asíncrona**: no ocurre al poner el atributo, sino en el siguiente dibujo. jsdom no dibuja, así que esa corrección nunca llega, aunque con `pretendToBeVisual` le dé `requestAnimationFrame`. Es la medición de la lección 7 (en Chrome, mientras el alta estaba pendiente, el foco ya estaba en el `body`), explicada desde la especificación y vista en jsdom. Y es la razón de la línea 82 de la prueba del formulario.

Fíjate en un detalle del primer renglón de Chrome: incluso en un navegador real, una comprobación **inmediata** habría dicho «el foco sigue en el botón». Una prueba que mirara el foco justo después de desactivar el botón estaría equivocada en los dos lados.

**2. El foco en un elemento con `display: none`.** Aquí jsdom acierta: los dos rechazan el `focus()` y el foco se queda donde estaba. jsdom sí aplica la hoja de estilos para saber que el elemento no se muestra. Conviene saberlo para no culpar a jsdom de lo que sí hace.

**3. El diseño.** Chrome mide el botón: 81.21875 por 21 píxeles, en la posición (8, 8), que es el margen por omisión del `body`. jsdom dice `0 × 0 en (0, 0)` y `offsetWidth: 0`. Cualquier prueba que dependa de tamaños o posiciones (si algo cabe, si se salió de la pantalla, si dos elementos se enciman) no se puede hacer en jsdom. No falla: devuelve ceros con toda tranquilidad, que es peor.

**4. La hoja de estilos.** Los dos calculan `opacity: 0.6` y `cursor: not-allowed` para el botón con `aria-disabled="true"`, a partir de la regla de la hoja de estilos. jsdom resuelve la cascada de CSS para `getComputedStyle`. Lo que no puede decirte es si ese gris se **ve**, o si cumple el contraste que pide MDN para un control desactivado (lección 7): eso es diseño y percepción.

#### 8.5.2 Qué hacer con lo que jsdom no ve

La figura deja tres reglas para escribir pruebas, y una lista de lo que queda para comprobar a mano.

**Cuando el efecto no se ve, comprueba la causa.** El foco que se pierde es un efecto del dibujo. Su causa es un atributo, `disabled`, que jsdom sí ve. La prueba del formulario comprueba la causa (sin `disabled`, con `aria-disabled="true"`) y deja la del efecto como afirmación secundaria. Funciona porque la relación entre causa y efecto está medida en un navegador (lección 7) y respaldada por la especificación (8.5.1). Sin esa medición, comprobar la causa sería una suposición.

**No escribas una prueba que pase por la razón equivocada.** Una prueba de jsdom que afirmara «el foco no se pierde» mirando solo `document.activeElement` sería verde con el código bueno y con el malo. Es la prueba que no pasa el examen de 8.4, y la peor clase de prueba: la que da confianza sin darla.

**Nombra el hueco.** El comentario de la línea 80 del archivo de pruebas dice, en una frase, qué no puede ver jsdom y qué se comprueba en su lugar. Quien lea la prueba dentro de seis meses no va a «simplificarla» quitando la línea del atributo.

Y lo que esta suite **no** comprueba, aunque esté en verde:

- **El recorrido real con el teclado**: que Tab pase por los elementos en orden, que el contorno de `:focus-visible` se vea, que el foco no se pierda en un navegador. La prueba del formulario cubre un tramo (del último campo al botón, y el botón durante el envío), con la salvedad de 8.5.1.
- **Lo que suena en un lector de pantalla.** La suite comprueba que los roles, nombres, `aria-invalid`, `aria-describedby`, `aria-atomic` y `required` estén puestos. Si NVDA, Orca o VoiceOver los anuncian como se espera es otra pregunta, y se contesta escuchando.
- **El diseño**: que nada se encime, que el botón atenuado se distinga, que el panel compacto quepa en una pantalla angosta.
- **La red y el servidor de verdad**: el *proxy* de Vite, la API de práctica, la reescritura a `index.html` de la lección 9. El `fetch` falso responde lo que la prueba dice; si la API real cambiara la forma de sus respuestas, `tsc -b` lo notaría por los tipos compartidos, pero ninguna de estas pruebas.

Para esas cosas existen las pruebas de extremo a extremo, que manejan un navegador real. Este curso no las enseña; lo que sí hace es dejarlas escritas como pasos a mano en «Cómo sé que lo logré». El orden de costo es claro: una prueba de jsdom tarda milisegundos y corre en cada cambio; una prueba en un navegador tarda segundos y necesita un navegador instalado; una revisión con un lector de pantalla tarda minutos y necesita una persona. Las tres se complementan, y ninguna reemplaza a la otra.

## El error que vas a ver

La lección tiene un error principal y dos de apoyo.

**El error principal: «Found multiple elements with the role "status"».** Si escribes la prueba de «cargando» de la forma natural, `await screen.findByRole("status")`, falla. La figura 1 lo mostró con `getByRole`: en la pantalla hay dos regiones de estado, la bandeja de avisos y la carga. `findByRole` es `getByRole` con espera, así que también exige uno solo. El mensaje completo, en una prueba de Vitest, imprime además el DOM con los dos elementos, y ahí se ve cuál es cuál. Se arregla de dos formas: buscar por el texto y luego comprobar el rol, como hace la suite; o acotar la búsqueda con `within` a la parte de la página donde está la carga. Lo que **no** arregla nada es `getAllByRole("status")[1]`: depende del orden del DOM, y el día que la bandeja cambie de lugar la prueba mirará el elemento equivocado sin avisar.

**El de apoyo: «Unable to find role="…"» con un DOM de cien líneas.** Lo viste en 8.4.3 y 8.4.4. Asusta por el tamaño, pero es la mejor ayuda que te da Testing Library: cuando una consulta `get` o `find` falla, imprime el estado del DOM ([Testing Library, «Debugging»](https://testing-library.com/docs/dom-testing-library/api-debugging)). Léelo buscando lo que esperabas encontrar. Casi siempre está ahí con otro nombre (un `aria-label` distinto), otro rol (un `<div>` con `onClick`), o todavía no ha llegado (un `getBy` donde iba un `findBy`). Si el DOM es demasiado largo, la documentación explica que se corta a 7000 caracteres y que la variable `DEBUG_PRINT_LIMIT` cambia ese límite.

**El silencioso: la prueba que limpia a medias.** Si quitas `cleanup()` de `preparar.ts`, las pruebas que montan la aplicación empiezan a fallar con «Found multiple elements…» en lugares que no tienen nada que ver entre sí, porque cada prueba encuentra en el DOM lo que dejó la anterior. Si quitas `vi.unstubAllGlobals()`, el `fetch` falso de una prueba se queda para las siguientes del mismo archivo, y una prueba puede pasar con las rutas que declaró otra. Este segundo es el silencioso de verdad: no falla, solo deja de probar lo que dice.

**El silencioso de la herramienta: el reportero que oculta la consola.** Si corres Vitest desde una herramienta automatizada (un asistente de programación, un guion que se identifica como agente), Vitest puede elegir otro reportero sin decírtelo. Su documentación lo explica: cuando no hay reporteros configurados y detecta que corre dentro de un agente de programación, usa el reportero mínimo, que solo muestra las pruebas que fallan, y suprime la consola de las que pasan y el resumen por archivo ([Vitest, «Reporters»](https://vitest.dev/guide/reporters.html)). Con ese reportero, un aviso de `act` en una prueba verde no se ve. En tu terminal no pasa, pero si alguna vez una herramienta te dice «sin avisos», pídele `--reporter=default`.

## Lo que se hace mal

**Buscar por clases de CSS o por la estructura del DOM.** `container.querySelector(".resumen strong")` pasa aunque el resumen deje de ser legible para un lector de pantalla, y se rompe cuando alguien cambia un nombre de clase sin cambiar nada que vea una persona. Busca por rol, etiqueta o texto.

**`getByTestId` como primera opción.** Un `data-testid` es un atributo que solo existe para la prueba: encuentra el elemento aunque no tenga rol ni nombre. Testing Library lo pone al final de su lista por esa razón.

**Probar la implementación.** Leer el estado de un componente, contar cuántas veces se dibujó o comprobar que se llamó a `establecerAltas`. Esas pruebas se rompen con cada refactorización que no cambia nada para la persona, y siguen verdes con errores que sí le cambian algo. Prueba lo que se ve, se oye o se envía.

**Simular módulos de la aplicación con `vi.mock`.** Reemplazar `cargar.ts` o `useReintentar.ts` deja fuera justo la parte que suele romperse: la validación, la clave de la consulta, la invalidación. Simula la frontera exterior, `fetch`, y deja correr lo demás.

**Compartir el `QueryClient` entre pruebas.** La caché de una prueba aparece en la siguiente: la carga no se ve y una prueba pasa con los datos de otra.

**Reintentos activados en las pruebas.** Con `retry: 2`, cada prueba de error espera los reintentos antes de mostrar el error, y una prueba de error puede pasar el límite de un segundo de `findBy`.

**`fireEvent` para lo que hace una persona.** Un solo evento no mueve el foco ni respeta un campo desactivado. Usa `user-event` y espera cada acción con `await`.

**Olvidar el `await`.** `usuario.click(boton)` sin `await` compara antes de que el clic ocurra. La prueba puede pasar por casualidad y fallar el día que la máquina esté cargada.

**Un `expect` que no puede fallar.** `expect(screen.getByText("Dar de alta")).toBeDefined()` nunca falla en su `expect`: si el texto no está, el `getByText` ya lanzó, y si está, está definido. La suite usa esa forma algunas veces, a sabiendas: lo que afirma es el `getBy` o el `findBy`, y el `expect` solo hace que la línea se lea como afirmación. Lo que se hace mal es creer que el `toBeDefined()` comprueba algo más.

**Dar una prueba por buena porque está verde.** Si no la has visto en rojo con el arreglo deshecho, no sabes si protege algo. El ejercicio 3 tiene una que no.

**Una prueba que pasa en jsdom por la razón equivocada.** Afirmar el foco en jsdom después de desactivar un botón, medir tamaños, esperar que un `<a href>` sin enrutador cargue otra página. Si jsdom no calcula el efecto, comprueba la causa y nombra el hueco.

**Callar la consola para toda la suite.** Un `console.error` silenciado en `preparar.ts` esconde los avisos de React que delatan errores de verdad (una `key` repetida, una actualización fuera de `act`). Calla solo lo que una prueba provoca a propósito, solo durante esa prueba, y restaura con `onTestFinished`.

## Ejercicios

### Ejercicio 1 — Elige la consulta

Sin correr nada, escribe en tu bitácora qué consulta usarías (familia `getBy`, `queryBy` o `findBy`, y tipo `ByRole`, `ByLabelText` o `ByText`) para cada afirmación, y por qué:

1. Al terminar de cargar, el reporte muestra una lista.
2. Con la API vacía, **no** hay lista.
3. El campo «Dirección» quedó marcado como inválido después de enviar vacío (el formulario ya está dibujado).
4. Aparece el botón para descartar el aviso de alta de `correo`.
5. La carga se anuncia como región de estado.

Después busca cada caso en la suite del punto de control y compara.

### Ejercicio 2 — El obligatorio que desaparece

En una copia del punto de control, quita el atributo `required` de `src/alta/Campo.tsx`. **Antes** de correr nada, predice: ¿cuántas pruebas se ponen rojas, cuáles, en qué línea y con qué mensaje? Corre `npx vitest run src/alta` y compara. Restaura al terminar. Y una pregunta más: ¿qué cambiaría para una persona, en el navegador, si ese atributo faltara? (Pista: la lección 7, árbol de accesibilidad.)

### Ejercicio 3 — La prueba que no pasa el examen

La lección 2 arregló un error con `key`: el borrador de una nota no debe arrastrarse de un servicio a otro. Hoy vive en `PaginaServicio.tsx`, en `<EditorNota key={nombre} …>`, y el punto de control **no** tiene una prueba para él. Escríbela en un archivo nuevo, `src/detalle/EditorNota.test.tsx`: monta en `/servicios/pagos`, escribe un borrador en el campo «Nota sobre pagos» sin guardarlo, navega a `/servicios/reportes` con `await act(() => enrutador.navigate("/servicios/reportes"))` (importa `act` de `@testing-library/react`) y comprueba que el campo «Nota sobre reportes» esté vacío. Declara en el `fetch` falso las dos rutas de detalle.

Cuando esté verde, haz el examen de 8.4: quita `key={nombre}` en una copia y vuelve a correrla. **¿Se pone roja?** Si no, explica por qué y arréglala hasta que sí. Pista: mira qué dibuja `PaginaServicio` mientras la consulta del servicio nuevo está pendiente.

### Ejercicio 4 — Los datos viejos

El punto de control no prueba el quinto estado del reporte: la actualización falla, pero se sigue mostrando el último reporte que llegó, con un aviso. Escribe esa prueba en `src/reporte/DatosViejos.test.tsx`. Necesitas que la primera petición a `/api/estados` responda bien y las siguientes con 503 (una función en la tabla del falso puede llevar la cuenta), y una forma de provocar la segunda petición sin esperar los diez segundos del sondeo (busca en `PaginaReporte.tsx` un botón). Comprueba el texto exacto del aviso y que la lista siga ahí con sus cuatro enlaces. Después haz el examen: en una copia, cambia en `ContenidoReporte.tsx` la condición `consulta.isError && consulta.data === undefined` por `consulta.isError` y comprueba que tu prueba se pone roja.

Segunda parte, el estado «actualizando»: en el mismo archivo, escribe otra prueba donde la primera petición responda bien y la segunda **no responda nunca** (ya tienes `nuncaResponde`). Después de pulsar «Actualizar», comprueba que aparezca `· actualizando…` junto a la hora, que la lista siga con sus cuatro enlaces y que **no** aparezca «Cargando…». El examen de esta: en una copia, cambia en `ContenidoReporte.tsx` el `if (consulta.isPending)` por `if (consulta.isFetching)`. ¿Qué diferencia de la lección 4 protege esta prueba?

## Soluciones

### Solución 1

1. `findByRole("list")`: la lista **va a llegar** después de un `fetch`, y es un elemento con rol. Es la primera línea de «con datos».
2. `queryByRole("list")` dentro de `expect(…).toBeNull()`: se afirma una **ausencia**, y `getBy` lanzaría antes del `expect`. Pero antes hace falta un `findBy…` de algo que sí aparece («No hay servicios configurados todavía.»): si no, la prueba afirmaría la ausencia mientras la página todavía está cargando, y pasaría por la razón equivocada. Así lo hace «vacío».
3. `getByLabelText("Dirección")` y luego su `aria-invalid`: el formulario ya está dibujado y el campo **tiene que** estar; `getBy`. En la suite, la prueba espera primero la alerta con `findByRole("alert")`, que es la señal de que el envío terminó, y después usa `getByLabelText` en los tres campos. `getByRole("textbox", { name: "Dirección" })` también funcionaría.
4. `findByRole("button", { name: "Descartar: Se dio de alta correo" })`: llega después de la acción, y el nombre accesible es el del `aria-label`, no el texto visible «Descartar» (figura 2).
5. `findByText("Cargando…")` y luego comprobar `role="status"`: `findByRole("status")` falla porque hay dos regiones de estado (figura 1 y «El error que vas a ver»).

Si en algún caso elegiste otra familia, pregúntate qué afirmaría tu versión que la de la suite no, o al revés. Las dos cosas que más se confunden son «espera» contra «ya está» y «tiene que estar» contra «no debe estar».

### Solución 2

Se pone roja **una** prueba, «declara los obligatorios y la bandeja anuncia solo el aviso nuevo», en la línea 52, con `expected false to be true`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/Campo.tsx src/alta/Campo.tsx
26d25
<         required
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 363ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 72ms
     ✓ con datos válidos envía el alta y confirma 91ms
     × declara los obligatorios y la bandeja anuncia solo el aviso nuevo 7ms
     ✓ el foco no se pierde al enviar y un segundo envío se ignora 110ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 82ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > declara los obligatorios y la bandeja anuncia solo el aviso nuevo
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ src/alta/FormularioAlta.test.tsx:52:30
     50|     for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)…
     51|       const campo = (await screen.findByLabelText(etiqueta)) as HTMLIn…
     52|       expect(campo.required).toBe(true);
       |                              ^
     53|     }
     54|     const bandeja = screen.getByRole("region", { name: "Avisos" });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:33
   Duration  935ms (tests 44%, environment 39%, import 6%, setup 5%, transform 5%)
```

La prueba se detiene en el primer campo, «Nombre», porque el `expect` de la vuelta del `for` lanza al fallar; por eso no ves los otros dos. Las demás pruebas del archivo siguen verdes: el formulario tiene `noValidate`, así que el navegador nunca usó `required` para impedir el envío, y la validación la hace el esquema. Lo que cambia para la persona es lo que la lección 7 midió en el árbol de accesibilidad: sin `required`, los tres campos pasan de `required=true` a `required=false`, y un lector de pantalla deja de anunciar «obligatorio» al llegar a cada uno. Nada cambia a la vista. Es el ejemplo perfecto de un arreglo que solo una prueba (o un lector de pantalla) puede notar.

### Solución 3

La prueba como la pide el enunciado:

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, versión ingenua
const { enrutador, usuario } = montarEn("/servicios/pagos");
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

Está verde. Y en una copia **sin** `key={nombre}`, sigue verde (para correr las dos versiones lado a lado, la ingenua se guardó como `EditorNotaIngenua.test.tsx`):

```bash
$ npx vitest run src/detalle/EditorNotaIngenua.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNotaIngenua.test.tsx (1 test) 116ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:37
   Duration  478ms (environment 49%, tests 27%, import 9%, setup 8%, transform 6%)
```

No pasa el examen. La razón está en `PaginaServicio`: `EditorNota` solo se dibuja cuando la consulta ya tiene datos (`consulta.data !== undefined`). Al navegar a `reportes`, la consulta de ese servicio todavía no tiene datos, así que la página muestra «Cargando detalle…» y **desmonta** el editor. Cuando llegan los datos, monta uno nuevo, con su estado nuevo. El borrador se pierde por esa razón, con `key` o sin ella. La prueba comprueba algo cierto, pero no lo que la `key` arregla.

El caso que la `key` arregla es cuando la página **no** pasa por «cargando»: cuando el servicio de destino ya está en la caché. Entonces los datos ya están desde el primer dibujo, `EditorNota` queda en el mismo lugar del árbol, y sin `key` React lo reutiliza con su estado. La prueba buena visita primero `reportes` para que su detalle quede en la caché:

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, la que pasa el examen
const { enrutador, usuario } = montarEn("/servicios/reportes");
await screen.findByRole("textbox", { name: "Nota sobre reportes" });
await act(() => enrutador.navigate("/servicios/pagos"));
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

El `fetch` falso declara las dos rutas; para `reportes` basta copiar `detallePagos` cambiando el nombre:

```tsx
// fragmento: la tabla del fetch falso en EditorNota.test.tsx
instalarFetchFalso({
  "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
  "GET /api/servicios/reportes": {
    status: 200,
    cuerpo: { ...detallePagos, nombre: "reportes", estado: { ...detallePagos.estado, nombre: "reportes" } },
  },
});
```

Con el punto de control, verde:

```bash
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNota.test.tsx (1 test) 120ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:34
   Duration  522ms (environment 49%, tests 26%, import 10%, transform 8%, setup 7%)
```

Y sin `key={nombre}`, roja, con el borrador de `pagos` en el editor de `reportes`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/detalle/PaginaServicio.tsx src/detalle/PaginaServicio.tsx
46d45
<             key={nombre}
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/detalle/EditorNota.test.tsx (1 test | 1 failed) 131ms
   × el borrador de una nota no se arrastra a otro servicio 131ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/detalle/EditorNota.test.tsx > el borrador de una nota no se arrastra a otro servicio
AssertionError: expected 'revisar el lunes' to be '' // Object.is equality

- Expected
+ Received

+ revisar el lunes

 ❯ src/detalle/EditorNota.test.tsx:24:24
     22|   await act(() => enrutador.navigate("/servicios/reportes"));
     23|   const editor = (await screen.findByRole("textbox", { name: "Nota sob…
     24|   expect(editor.value).toBe("");
       |                        ^
     25| });
     26|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:05:36
   Duration  695ms (environment 54%, tests 21%, import 9%, setup 8%, transform 7%, worker 1%)
```

`act` hace falta aquí porque `enrutador.navigate` cambia el estado de la aplicación desde fuera de una interacción de Testing Library, y envolverlo en `act` hace que React aplique todos los cambios antes de la siguiente línea. La versión que pasa el examen y la prueba del ejercicio 4 pasaron `npx eslint` y `tsc` sin avisos. Lo que te llevas es la idea, más que la prueba: **una prueba puede comprobar algo cierto por una razón distinta de la que crees**, y el único modo de saberlo es el experimento.

### Solución 4

Una forma de escribirla:

```tsx
// fragmento: src/reporte/DatosViejos.test.tsx
test("datos viejos: si la actualización falla, conserva la lista y lo avisa", async () => {
  // La primera petición responde bien; las siguientes, 503.
  const respuestas: RespuestaFalsa[] = [{ status: 200, cuerpo: reporteDeEjemplo }];
  instalarFetchFalso({
    "GET /api/estados": async () => respuestas.shift() ?? { status: 503, cuerpo: { detalle: "caída" } },
  });
  const { usuario } = montarEn("/");
  await screen.findByRole("list");

  await usuario.click(screen.getByRole("button", { name: "Actualizar" }));

  const aviso = await screen.findByRole("alert");
  expect(aviso.textContent).toBe(
    "Mostrando el último reporte que llegó: la actualización falló (la API respondió 503).",
  );
  expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(4);
});
```

(Importa `screen` y `within` de `@testing-library/react`, `expect` y `test` de `vitest`, `reporteDeEjemplo` de `../pruebas/datos`, `instalarFetchFalso` y el tipo `RespuestaFalsa` de `../pruebas/fetchFalso`, y `montarEn` de `../pruebas/montar`.)

El arreglo `respuestas` es la cuenta: `shift()` saca la primera respuesta la primera vez y devuelve `undefined` después, y el `??` convierte ese `undefined` en el 503. El botón «Actualizar» de `PaginaReporte` llama a `consulta.refetch()`, que provoca la segunda petición sin esperar el sondeo. Con el punto de control:

```bash
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (1 test) 137ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:35
   Duration  649ms (environment 42%, tests 24%, transform 14%, import 12%, setup 7%, worker 1%)
```

Con la condición cambiada a `consulta.isError`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ContenidoReporte.tsx src/reporte/ContenidoReporte.tsx
21c21
<   if (consulta.isError && consulta.data === undefined) {
---
>   if (consulta.isError) {
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/DatosViejos.test.tsx (1 test | 1 failed) 88ms
   × datos viejos: si la actualización falla, conserva la lista y lo avisa 87ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/DatosViejos.test.tsx > datos viejos: si la actualización falla, conserva la lista y lo avisa
AssertionError: expected 'No se pudo cargar el reporte: la API …' to be 'Mostrando el último reporte que llegó…' // Object.is equality

Expected: "Mostrando el último reporte que llegó: la actualización falló (la API respondió 503)."
Received: "No se pudo cargar el reporte: la API respondió 503Reintentar"

 ❯ src/reporte/DatosViejos.test.tsx:19:29
     17|
     18|   const aviso = await screen.findByRole("alert");
     19|   expect(aviso.textContent).toBe(
       |                             ^
     20|     "Mostrando el último reporte que llegó: la actualización falló (la…
     21|   );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:05:38
   Duration  579ms (environment 56%, tests 18%, import 10%, setup 8%, transform 7%, worker 1%)
```

El `Received` cuenta la historia: sin `consulta.data === undefined`, cualquier error manda a la pantalla de error, y la persona pierde la lista que ya tenía por una actualización que falló; el `Reintentar` pegado al final es el texto del botón, que `textContent` junta con el del párrafo. La segunda afirmación de la prueba (la lista con cuatro enlaces) no llegó a correr, porque la primera ya falló; si quisieras ver las dos, cámbialas de orden. Si tu prueba usó otro camino para la segunda petición (por ejemplo, invalidar la consulta), también vale, mientras pase el examen.

La segunda parte, en el mismo archivo (agrega `nuncaResponde` a la importación de `../pruebas/fetchFalso`):

```tsx
// fragmento: src/reporte/DatosViejos.test.tsx, segunda prueba
test("actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista", async () => {
  // La primera petición responde bien; la segunda no responde nunca.
  const respuestas: RespuestaFalsa[] = [{ status: 200, cuerpo: reporteDeEjemplo }];
  instalarFetchFalso({
    "GET /api/estados": () => {
      const siguiente = respuestas.shift();
      return siguiente === undefined ? nuncaResponde() : Promise.resolve(siguiente);
    },
  });
  const { usuario } = montarEn("/");
  await screen.findByRole("list");

  await usuario.click(screen.getByRole("button", { name: "Actualizar" }));

  expect((await screen.findByText(/· actualizando…/)).textContent).toMatch(/^Actualizado a las .+ · actualizando…$/);
  expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(4);
  expect(screen.queryByText("Cargando…")).toBeNull();
});
```

La hora no se compara exacta, porque cambia en cada corrida: la expresión regular pide que el párrafo empiece con «Actualizado a las», tenga algo en medio y termine en `· actualizando…`. Con el punto de control, las dos pruebas del archivo en verde:

```bash
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (2 tests) 143ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  04:06:36
   Duration  784ms (environment 49%, tests 20%, import 11%, setup 10%, transform 10%)
```

Con `consulta.isFetching` en lugar de `consulta.isPending`:

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ContenidoReporte.tsx src/reporte/ContenidoReporte.tsx
17c17
<   if (consulta.isPending) {
---
>   if (consulta.isFetching) {
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/DatosViejos.test.tsx (2 tests | 1 failed) 161ms
   ✓ datos viejos: si la actualización falla, conserva la lista y lo avisa 126ms
   × actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista 34ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/DatosViejos.test.tsx > actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista
TestingLibraryElementError: Unable to find an accessible element with the role "list"
[… recortado: la lista de roles accesibles y el principio del DOM, 218 líneas …]
        <p
          role="status"
        >
          Cargando…
        </p>
        <p
          class="actualizado"
        >
          Actualizado a las
          4:06:38 a.m.
           · actualizando…
        </p>
        <button
          disabled=""
          type="button"
        >
          Actualizar
        </button>
      </section>
    </main>
  </div>
</body>
 ❯ Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 ❯ src/reporte/DatosViejos.test.tsx:40:24
     38|
     39|   expect((await screen.findByText(/· actualizando…/)).textContent).toM…
     40|   expect(within(screen.getByRole("list")).getAllByRole("link")).toHave…
       |                        ^
     41|   expect(screen.queryByText("Cargando…")).toBeNull();
     42| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Start at  04:06:37
   Duration  600ms (environment 44%, tests 30%, import 9%, transform 9%, setup 7%)
```

En el DOM recortado se ve el problema: mientras llega el reporte nuevo, la pantalla dice «Cargando…» donde estaba la lista, aunque la caché tiene el reporte anterior. Es la diferencia de la lección 4 entre `status` («¿hay datos?») y `fetchStatus` («¿hay una petición en curso?»): `isPending` es «todavía no hay datos», `isFetching` es «se está pidiendo algo», y confundirlas borra la lista en cada sondeo, cada diez segundos. La primera prueba del archivo sigue verde con ese cambio: cada una protege un arreglo distinto. Las dos pasaron `npx eslint` y `tsc`.

## Cómo sé que lo logré

- [ ] `npm ci`, `npm run lint` y `npm run build` terminan bien dentro de `~/curso-react/revisor/`, y `npm run build` deja `dist/assets/index-C_lOH5GL.js`, **el mismo nombre que en la lección 7**: las pruebas no cambiaron la aplicación.
- [ ] `npm test` termina con `Test Files  7 passed (7)` y `Tests  27 passed (27)`, leídos del resumen, no del código de salida. Con `npx vitest run --reporter=verbose`, ves las 27 líneas con `✓` y sus nombres.
- [ ] Con `npx vitest run --reporter=default`, la salida de la suite no tiene ningún `stderr` ni ningún aviso que mencione `act(`. Y comprobaste que eso significa algo: sin la línea de `IS_REACT_ACT_ENVIRONMENT` en `preparar.ts`, la prueba de control de 8.1.3 no avisa; con ella, sí.
- [ ] Hiciste el examen de 8.4 con al menos dos arreglos, en una copia: `fallas > 0` en `ResumenFallas.tsx` y la guarda `onClick={alPulsar}` en `BotonEnviar.tsx`. Cada uno dejó roja la prueba que se dice en la lección, con el mensaje que se dice; restaurado, todo volvió a verde.
- [ ] Las figuras 1, 2 y 3 dan en tu máquina la misma salida que en la lección, y la página `fig08_03.html` en tu Chrome dice `body` en el renglón «dos cuadros después».
- [ ] Escribiste la prueba del ejercicio 3 que **sí** se pone roja sin `key={nombre}`, y viste verde la que no.
- [ ] Escribiste las dos pruebas del ejercicio 4 (datos viejos con error y «actualizando…»), las viste en verde con el punto de control y cada una en rojo con su cambio (`consulta.isError` e `isFetching`). Con ellas, los estados del reporte tienen todos su prueba.
- [ ] **A mano, con el teclado, en Chrome**, con `npm run servidor` y `npm run dev`: en `/servicios/nuevo`, llena el formulario, llega al botón con Tab y envía con Espacio. El contorno azul sigue en el botón mientras dice «Dando de alta…» y después. Es la parte de la prueba del foco que jsdom no puede ver (8.5); en la lección 7 tienes el paso a paso completo.
- [ ] **A mano, con un lector de pantalla** (Orca en tu Mint, NVDA en Windows o VoiceOver en macOS): repite las comprobaciones de la lección 7 y anota en tu [bitácora](bitacora.md) qué atributos comprueba la suite y qué solo comprobaste escuchando.

## Resumen

Responde sin mirar la lección:

1. ¿Qué hace cada una de las cinco dependencias nuevas, y por qué `jsdom` tiene que estar instalado si Vitest es el que lo usa?
2. ¿Por qué `preparar.ts` llama a `cleanup` a mano? ¿Qué pasaría sin él, y qué pasaría sin `vi.unstubAllGlobals`?
3. ¿Por qué una consulta por rol y nombre dice algo sobre la accesibilidad que una consulta por texto no dice? ¿Por qué `getByRole("button", { name: "Descartar" })` no encuentra el botón de la bandeja?
4. ¿Qué afirma cada familia, `getBy`, `queryBy` y `findBy`? ¿Por qué la prueba de «cargando» busca por texto y luego comprueba el rol?
5. ¿Qué hace `user-event` que `fireEvent` no hace, y por qué cada acción lleva `await`?
6. ¿Por qué el punto de control simula `fetch` y no los módulos de la aplicación? ¿Qué responde el falso a una ruta que no se declaró, y por qué?
7. ¿Qué tres cosas monta `montarEn`, y por qué cada prueba necesita un `QueryClient` nuevo y sin reintentos?
8. ¿Cuáles son los cinco pasos del examen de 8.4? ¿Qué te dice una prueba que sigue verde con el arreglo deshecho?
9. ¿Por qué la prueba del foco comprueba que el botón no tenga `disabled`, si lo que importa es el foco? ¿Qué dice la especificación de HTML sobre cuándo se pierde el foco de un control desactivado?
10. Nombra tres cosas que la suite no comprueba aunque esté en verde, y cómo se comprueba cada una.

## Para leer más

- [Testing Library, «About Queries»](https://testing-library.com/docs/queries/about/): las tres familias (`getBy`, `queryBy`, `findBy`) con sus versiones `All`, la prioridad de las consultas y el tiempo límite de `findBy`. Consultado el 21 de octubre de 2026.
- [Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole): la opción `name`, los roles implícitos, la opción `hidden` y el costo de calcular el árbol de accesibilidad. Consultado el 21 de octubre de 2026.
- [Testing Library, «Guiding Principles»](https://testing-library.com/docs/guiding-principles): mientras más se parezcan las pruebas al uso real, más confianza dan. Consultado el 21 de octubre de 2026.
- [Testing Library, «Async Methods»](https://testing-library.com/docs/dom-testing-library/api-async/): `findBy` como `getBy` más `waitFor`, el intervalo de 50 ms y el tiempo límite de 1000 ms. Consultado el 21 de octubre de 2026.
- [Testing Library, «Debugging»](https://testing-library.com/docs/dom-testing-library/api-debugging): `logRoles`, `prettyDOM`, el DOM impreso en las fallas, `DEBUG_PRINT_LIMIT` y `COLORS`. Consultado el 21 de octubre de 2026.
- [Testing Library, API de React Testing Library](https://testing-library.com/docs/react-testing-library/api): `render`, lo que devuelve, y cuándo `cleanup` es automático y cuándo no. Consultado el 21 de octubre de 2026.
- [Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro) y [su teclado](https://testing-library.com/docs/user-event/keyboard): interacciones completas frente a eventos sueltos, `setup()` antes de dibujar, y cómo se escriben las teclas. Consultado el 21 de octubre de 2026.
- [Vitest, «Test Environment»](https://vitest.dev/guide/environment.html): el entorno `node` por omisión y el entorno `jsdom`. Consultado el 21 de octubre de 2026.
- [Vitest, `globals`](https://vitest.dev/config/globals.html) y [«Reporters»](https://vitest.dev/guide/reporters.html): por qué `globals` vale `false` por omisión y qué bibliotecas dependen de los globales para limpiar solas; qué reportero elige Vitest y cuál oculta la consola de las pruebas que pasan. Consultado el 21 de octubre de 2026.
- [Vitest, `vi`](https://vitest.dev/api/vi.html), [`mock`](https://vitest.dev/api/mock.html) y [«Hooks»](https://vitest.dev/api/hooks.html): `vi.fn`, `vi.spyOn`, `vi.stubGlobal`, `vi.unstubAllGlobals`, `mock.calls`, `mockRestore`, `afterEach` y `onTestFinished`. Consultado el 21 de octubre de 2026.
- [React, `act`](https://react.dev/reference/react/act): aplicar los cambios pendientes antes de comparar, `IS_REACT_ACT_ENVIRONMENT`, y por qué React Testing Library ya lo usa por ti. Consultado el 21 de octubre de 2026.
- [React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter): el enrutador con historial en memoria e `initialEntries`. Consultado el 21 de octubre de 2026.
- [jsdom, README, «Unimplemented parts of the web platform»](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform): la navegación y el diseño fuera de su alcance, los ceros de relleno y `pretendToBeVisual`. Consultado el 21 de octubre de 2026.
- [WHATWG, HTML, «Update the rendering»](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering): la corrección asíncrona del foco cuando el elemento enfocado deja de ser enfocable, por ejemplo al desactivarse. Consultado el 21 de octubre de 2026.
- [MDN, atributo `disabled`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled): un control desactivado no recibe el foco ni eventos como el clic. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| prueba de componente | una prueba que dibuja componentes en un DOM de prueba y los usa como lo haría una persona |
| Vitest | el ejecutor de pruebas que usa la configuración de Vite; da `test`, `describe`, `expect` y `vi` |
| jsdom | un DOM escrito en JavaScript, sin diseño ni dibujo, donde corren las pruebas |
| consulta | una función de Testing Library que busca elementos: `getBy…`, `queryBy…`, `findBy…` y sus versiones `All` |
| rol implícito | el rol que un elemento nativo tiene sin escribir `role`: `<button>` es `button`, `<ul>` es `list` |
| `user-event` | biblioteca que simula interacciones completas de una persona: escribir, hacer clic, pulsar teclas |
| `fetch` simulado | un `fetch` reemplazado en la prueba que responde según una tabla de rutas, sin red |
| enrutador en memoria | un enrutador de React Router que guarda su historial en memoria, sin barra de direcciones |
| `act` | herramienta de React que aplica los cambios pendientes antes de comparar; Testing Library la usa por ti |
| el examen de la prueba | deshacer el arreglo que una prueba protege, verla en rojo y restaurar; si sigue verde, no protege nada |
| corrección del foco | el paso del navegador que, al dibujar el siguiente cuadro, quita el foco de un elemento que dejó de ser enfocable |

---

**Siguiente:** [Lección 9 — Rendimiento, publicación y cuándo un framework](09-rendimiento-publicacion.md)
