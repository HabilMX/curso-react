# Curso de React — de un panel de una pieza a una aplicación que se sostiene

**Por Dorian Chávez, fundador de Hábil y arquitecto de integración.**

**Cada punto de control de este curso se revisa con el linter de React, se prueba y se compila en cada cambio, y el resultado queda a la vista de cualquiera.**

> El curso está en cinco idiomas: español (el original), inglés, francés, portugués de Brasil y búlgaro.

## En qué idiomas

El curso se escribe primero en español, que es el original, y se traduce después al inglés, al francés, al portugués de Brasil y al búlgaro.

## Para quién es

Quien ya llevó el curso de TypeScript de esta casa y llegó a su lección 9, donde un panel de React funciona pero no se explica a fondo; y quien programa en JavaScript o TypeScript, ha copiado componentes que funcionan y quiere saber por qué funcionan —y por qué, de pronto, dejan de hacerlo—. **Es el escalón que sigue a la lección 9 de TypeScript, no una repetición de ella.** No se supone experiencia con React más allá de haber visto un componente; sí se supone que lees tipos de TypeScript sin miedo.

## Qué NO repite este curso

La lección 9 del curso de TypeScript ya enseñó, con React 19, lo necesario para que un panel funcione: un componente como función, JSX en archivos `.tsx`, propiedades tipadas con una unión discriminada, `useState` y un `useEffect` con `AbortController`, un primer hook propio, la prohibición de `dangerouslySetInnerHTML` (XSS, ESLint y CSP), el empaquetado con esbuild, la prueba con jsdom y el reparto de tipos entre servidor y pantalla. **Aquí no se vuelve a explicar.** Se retoma desde ahí y se cambia la pregunta: ya no «¿cómo hago que funcione?», sino «¿por qué funciona, qué pasa cuando crece y cómo me doy cuenta de que se rompió?».

## El proyecto que crece

El **`revisor`**, el mismo de los cursos de Go, Rust, TypeScript y de Fundamentos de la web: la pantalla que muestra el estado de una lista de servicios —nombre, estado y tiempo de respuesta—. Empieza donde lo dejó la lección 9 de TypeScript, **un panel de una sola pieza**, y termina como una **aplicación de varias pantallas**: reporte con filtros que viajan en la URL, detalle de cada servicio, datos con caché y actualización en segundo plano, alta de servicios con formulario, avisos, pruebas y una versión publicada.

Se repite el proyecto y no se inventa otro porque la comparación enseña más que empezar de nuevo: quien hizo el panel en TypeScript ve el mismo problema resuelto con otras herramientas, y la diferencia entre «el panel que funciona» y «el panel que se sostiene» es justo lo que este curso enseña. Lo que cambia es la altura del problema, no el problema.

**No necesitas haber terminado la API del curso de TypeScript.** El curso incluye un servidor de práctica con el mismo contrato público (`GET /api/estados`, `GET /salud`) y las pocas rutas nuevas que el panel necesita desde la lección 4 (detalle de un servicio, alta y reintento). Es el único código de servidor del curso y no se explica: el curso es de pantalla.

## Las lecciones

Numeración única y continua: «Lección N», de la 0 a la 9.

| # | Lección | Qué construyes | Qué aprendes |
|---|---|---|---|
| 0 | Un proyecto de verdad: Vite, StrictMode y el linter | el panel de la lección 9 de TypeScript, movido a un proyecto Vite con su servidor de práctica | qué agrega Vite sobre un empaquetador armado a mano; la plantilla `react-ts`, el `tsconfig` y la estructura por funcionalidad; el proxy hacia la API (sin CORS en desarrollo); las variables `VITE_` y por qué ahí no va ningún secreto; `eslint-plugin-react-hooks` activo desde el primer día |
| 1 | Componentes puros y composición | el panel partido en piezas que se pueden entender y cambiar por separado | render y *commit*; pureza: mismas entradas, misma salida; tres impurezas plantadas que hay que encontrar; `children` y composición; `key` con un identificador estable; la trampa del `0` pintado por `&&`; por qué un componente jamás se define dentro de otro |
| 2 | Estado: instantánea, inmutabilidad y forma | el filtro «solo fallas», una nota por servicio y la selección de un servicio | el estado es una fotografía por render; la forma actualizadora `setN(n => n + 1)`; copiar en vez de mutar; las cinco reglas de forma del estado (un `status` y no tres banderas, guardar el identificador y no el objeto, no guardar lo que se puede calcular); elevar el estado; `key` para reiniciarlo |
| 3 | Effects: sincronizar, no «cuando cargue» | el sondeo cada 10 s y un panel de detalle que se reinicia solo | el ciclo de un Effect: empezar y dejar de sincronizar; la limpieza; la carrera de respuestas, reproducida y arreglada; StrictMode como prueba gratuita de que la limpieza existe; dependencias que describen el código (**el linter no se silencia**); `useEffectEvent`; los casos en que no se necesita un Effect |
| 4 | Estado del servidor con TanStack Query | el reporte con caché, actualización en segundo plano y botón «reintentar» | por qué traer datos a mano no escala (caché, cascadas, carreras); `useQuery`, `queryKey` y `signal`; `status` frente a `fetchStatus`; `staleTime`, reintentos y `refetchInterval`; `useMutation` e invalidación; **el cuarto estado: vacío**; lo que Suspense no hace; el Error Boundary, la única clase del curso |
| 5 | Rutas y la URL como estado | la lista, el detalle `/servicios/:nombre`, el 404 y los filtros en la dirección | rutas como objetos con `createBrowserRouter`, anidadas con `<Outlet />`; parámetros y `useSearchParams`; un filtro que se comparte copiando el enlace; `NavLink`; **recargar una ruta del cliente y el servidor que debe responder `index.html`** |
| 6 | Estado compartido: reducer y contexto | la bandeja de avisos y las preferencias de la pantalla | `useReducer`: acciones que describen lo que pasó y un reducer puro que se prueba sin React; contexto solo cuando props y `children` ya no alcanzan; dos contextos (estado y despacho); un hook que falla si falta el proveedor; **qué estado vive dónde**: local, URL, servidor o contexto |
| 7 | Formularios, acciones y accesibilidad | el alta de un servicio, con su validación y su aviso para lectores de pantalla | controlado frente a no controlado; `<form action>`, `useActionState`, `useFormStatus` y `useOptimistic`; validar con el esquema de la lección 6 de TypeScript; `aria-invalid` con `aria-describedby`; regiones vivas (`role="status"`, `role="alert"`); el HTML nativo antes que ARIA; recorrerlo con el teclado |
| 8 | Pruebas de componentes | la suite del panel con Vitest y Testing Library | consultas por rol y por qué importan para la accesibilidad; `getBy`, `queryBy`, `findBy`; `user-event`; `fetch` simulado; los cuatro estados, el formulario y una ruta con un enrutador en memoria; **la prueba que se pone roja al revertir el arreglo**; qué NO puede comprobar jsdom |
| 9 | Rendimiento, publicación y cuándo un framework | el `revisor` medido, optimizado y publicado | medir con el Profiler **antes** de memoizar; estructura primero; React Compiler 1.0; `vite build` y por qué `vite preview` no es un servidor de producción; reescritura a `index.html`; `VITE_` sin secretos; repaso de XSS; Server Components y Server Functions: qué son y por qué este panel no los usa; cuándo conviene migrar a un framework |

Lo que la tabla promete por lección es lo que la lección trae.

**Dos criterios atraviesan todo el curso.** El primero: **un Effect es para sincronizarse con algo que está fuera de React, no para calcular, no para reaccionar a un clic y no para «cuando cargue»**, y la lista de dependencias describe el código: si el linter se queja, se cambia el código, nunca se silencia la regla. El segundo: **primero se mide y después se optimiza**; la memoización no es un reflejo sino una herramienta con costo, y el curso la presenta cuando hay una medición que la pide.

**La accesibilidad y la seguridad no son lecciones: son costumbres.** El HTML nativo y las consultas por rol desde la 1 y la 8, la región viva y el teclado en la 7, el repaso del XSS y de las variables `VITE_` en la 9. Se enseñan donde aparecen, no en un módulo final que nadie alcanza.

**Lo que este curso NO enseña, a propósito:** componentes de clase (la única excepción es el Error Boundary, que React sigue exigiendo como clase, y se explica por qué), Create React App (retirado por el propio equipo de React), Redux, `useEffect` como si fuera un ciclo de vida («al montar», «al desmontar»), `useMemo`, `useCallback` y `memo` por costumbre, `react-router-dom` como paquete aparte, y Server Components como parte de la aplicación del curso. Cada una de esas ausencias tiene su razón escrita en la lección donde la tentación aparece.

## Versiones con las que se escribió

Medidas con `npm view` el 7 de octubre de 2026 y fijadas en el curso con versión exacta. Se vuelven a medir antes de publicar y ninguna se da por buena porque la heredó otro documento.

| | Versión | Nota |
|---|---|---|
| Node.js | 24 LTS | La misma línea del curso de TypeScript. Vite 8 pide 20.19 o 22.12 o superior; Vitest 5 pide 22.12 o 24 o superior; React Router 8 pide 22.22 o superior |
| React y React DOM | 19.3.0 | Publicada el 9 de septiembre de 2026 |
| Vite y `@vitejs/plugin-react` | 8.3.3 y 6.1.2 | |
| TypeScript | 7.0.2 | La que fija el curso de TypeScript |
| React Router | 8.4.0 | Un solo paquete, `react-router` |
| TanStack Query | 5.104.1 | |
| Vitest, Testing Library y `user-event` | 5.0.3, 16.3.3 y 14.6.7 | |
| `eslint-plugin-react-hooks` | 7.1.1 | Aloja también las reglas del compilador |
| React Compiler | 1.0.0 | `babel-plugin-react-compiler`; estable desde octubre de 2025 |

## La plantilla de cada lección

Igual en todas:

1. **Encabezado:** «Lección N — título», tiempo (90 min o 2 × 45) y «Al terminar vas a poder…» (3 a 7 objetivos medibles).
2. **El porqué antes del cómo:** qué le falta hoy al panel, con un caso concreto del `revisor`, antes de nombrar la herramienta.
3. **Los conceptos**, uno por sección, **máximo tres nuevos por lección**: explicación, ejemplo mínimo ejecutable y ejemplo en el `revisor`.
4. **El error que vas a ver:** el aviso real de React, del linter o de Vite, qué significa y cómo se arregla. Se provoca a propósito: primero se rompe, luego se ve, luego se arregla.
5. **Lo que se hace mal** (antipatrones), con su costo.
6. **Ejercicios** (2 a 4), de menor a mayor, con sus **soluciones** aparte.
7. **Cómo sé que lo logré:** medible. Tal comando da tal salida; el linter no avisa; la prueba que debía ponerse roja se pone roja.
8. **Fuentes:** de 10 a 15, primarias (la documentación oficial, la especificación), enlazadas y con la fecha en que se consultaron.

## Cómo sabes que terminaste

El curso no se acaba cuando leíste la lección 9, sino cuando tu `revisor` cumple estas cinco cosas. Son las mismas que la verificación comprueba en cada cambio:

1. **`npm run lint` no avisa nada** y no hay un solo `eslint-disable` de las reglas de React en el código.
2. **`npm test` pasa**, y cada prueba que protege un arreglo se ha puesto roja al revertirlo (la lección 8 enseña a comprobarlo).
3. **Existen los cuatro estados**: cargando, error, vacío y con datos —más el de «datos viejos mientras se actualiza»—, y cada uno tiene su prueba.
4. **Se recorre completo con el teclado** y los avisos de cambio (`N servicios con falla`, errores del formulario) llegan a un lector de pantalla.
5. **`npm run build` termina bien, la vista previa recarga `/servicios/pagos` sin dar 404 servida con reescritura, y en `dist/` no aparece ninguna clave ni secreto.**

## Cómo se comprueba que los programas funcionan

Cada lección tiene un **punto de control**: el `revisor` tal como queda al terminar esa lección. Para comprobarlo hace falta [Node.js](https://nodejs.org/en/download) 24 LTS, y cada punto de control se revisa con cuatro comandos: `npm ci` (instala exactamente las versiones del archivo de bloqueo), `npm run lint` (el linter de React no debe avisar nada), `npm test` (la salida de la suite se compara con la documentada) y `npm run build` (el paquete compila sin errores de tipos).

Hay dos clases de programa. **Los puntos de control** son el proyecto completo de la lección, con su `package.json`; **las figuras** (`figNN_NN.tsx`) son piezas pequeñas que se dibujan en un DOM de prueba y cuya salida documentada se compara contra la real. Las que a propósito fallan —un aviso del linter, un error de React— traen el mensaje exacto que la lección enseña a leer.

**Hay cosas que ninguna corrida automática puede comprobar, y el curso las nombra en lugar de esconderlas.** jsdom no calcula diseño ni mueve el foco como un navegador real, y el Profiler de las herramientas de desarrollo solo se lee con los ojos. Esas comprobaciones están en la lista de «Cómo sé que lo logré» de la lección que las necesita, con el paso a paso para hacerlas a mano.

**Las lecciones son la fuente; los programas se extraen de ellas**, de los bloques de código del texto, y una verificación comprueba que lo extraído sea idéntico a lo que dicen las lecciones. Así lo que lees y lo que ejecutas no pueden diferir.

## La profundidad se mide

Cada lección tiene al menos 3,000 palabras de explicación, como las del curso de Go. Se cuentan las **palabras de explicación** (lo que está fuera de los bloques de código) y se exigen dos varas absolutas: **piso de 3,000 palabras por lección y mediana del curso de 4,000**. Si no se cumplen, la verificación se pone roja.

Se cuentan palabras y no líneas porque las líneas se inflan: una frase por línea suma muchas líneas sin explicar más. Y las varas son absolutas y no «la mitad de la mediana del curso» porque ese criterio se muerde la cola: unas lecciones flacas bajan la mediana y entonces pasan. Un criterio relativo garantiza uniformidad, no profundidad. Las varas se calibraron con el curso de Go: lecciones de 3,269 a 5,097 palabras, mediana 4,321.

## Las fuentes se cuentan

Toda afirmación técnica del curso se apoya en una fuente primaria —la documentación oficial de React, de Vite, del enrutador y de la librería de datos; las especificaciones; las guías de accesibilidad del W3C y de MDN—, enlazada al final de la lección donde se usa. El curso en conjunto cita **al menos cien**, y se cuentan. Lo que una fuente no respalda, el curso lo marca como criterio propio y no como hecho.

## Qué es un programa y qué es un fragmento

**No todo bloque de código de este curso es un programa completo.** Un **programa** corre solo: su bloque empieza con un comentario `// figNN_NN.tsx` y trae, justo después, la corrida real y su salida. Cada uno se revisa, se prueba y se ejecuta en cada cambio. Un **fragmento** es una ilustración que no pretende correr por sí sola, y por eso no se verifica; se reconoce porque su bloque no empieza con ese comentario.

## Reglas del curso

- **Licencia CC BY-SA 4.0:** el material es público y se puede reusar citando la fuente.
- **Multiidioma:** el español es el original; las demás ediciones son traducciones y se revisan cuando el original cambia.
- **El código no se traduce.** Los nombres de archivo, los identificadores y los datos quedan como están; se traducen la interfaz, las explicaciones, los ejercicios, los errores y el glosario. Así el código es idéntico en las cinco ediciones y el salto a la documentación de React, que está en inglés, es menos abrupto.
- Antes de publicar se revisa que el material no contenga rutas internas ni claves.
- Sin emojis en los títulos de las lecciones.
