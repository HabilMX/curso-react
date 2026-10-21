# Curso de React — de un panel de una pieza a una aplicación que se sostiene

**Por Dorian Chávez, fundador de Hábil y arquitecto de integración.**

**Para quién es:** quien ya llevó el curso de TypeScript de esta casa y quiere entender a fondo lo que su lección 9 apenas dejó funcionando, y quien programa en JavaScript o TypeScript, ha copiado componentes que funcionan y quiere saber por qué funcionan y por qué, de pronto, dejan de hacerlo. No se supone experiencia con React más allá de haber visto un componente: cada concepto se explica cuando aparece, y se explica por qué existe, no solo cómo se escribe.

**Qué vas a terminar sabiendo:** construir una aplicación de React de varias pantallas, decidir dónde vive cada pedazo de estado, traer datos sin carreras ni pantallas en blanco, probarla con pruebas que de verdad detectan los errores, medirla antes de optimizarla y publicarla. Y quedarte con el criterio para leer la documentación de React por tu cuenta.

**Dónde se ubica:** este curso es el escalón que sigue al [curso de TypeScript](https://github.com/HabilMX/curso-typescript) de esta casa. Su lección 9 ya armó un panel con componentes, `useState` y `useEffect`; aquí no se repite: se profundiza. Si nunca has escrito una página, empieza antes por el curso de Fundamentos de la web.

**Lo que necesitas antes de empezar:** una computadora con Linux Mint, saber abrir una terminal, leer tipos de TypeScript (uniones, genéricos sencillos) y haber visto, aunque sea una vez, un componente de React. La [Lección 0](00-un-proyecto-de-verdad.md) instala todo lo que falta, con Node 24 LTS.

## El proyecto que vas a construir

El **`revisor`**: la pantalla que muestra el estado de una lista de servicios —nombre, estado y tiempo de respuesta—. Empieza como el panel de una sola pieza de la lección 9 de TypeScript y termina como una aplicación de varias pantallas: un reporte con filtros que viajan en la dirección, el detalle de cada servicio, datos con caché que se actualizan en segundo plano, un formulario para dar de alta servicios, avisos, una suite de pruebas y una versión publicada.

Es el mismo problema de los cursos de Go, Rust, TypeScript y Fundamentos de la web de esta casa. Lo que cambia es la altura: no «que funcione», sino «que se sostenga cuando crezca». El curso incluye un servidor de práctica con el contrato de la API, así que no necesitas haber terminado el curso de TypeScript para seguir este.

## Las diez lecciones

| Lección | | Qué construyes | Qué aprendes |
|---|---|---|---|
| 0 | [Un proyecto de verdad: Vite, StrictMode y el linter](00-un-proyecto-de-verdad.md) | el panel de la lección 9 de TypeScript, movido a Vite | qué agrega Vite; `react-ts`, estructura por funcionalidad, proxy a la API, variables `VITE_`, linter de React activo |
| 1 | [Componentes puros y composición](01-componentes-puros-composicion.md) | el panel partido en piezas | render y *commit*; pureza; `children`; `key` estable; la trampa del `0`; nunca un componente dentro de otro |
| 2 | [Estado: instantánea, inmutabilidad y forma](02-estado-instantanea-forma.md) | filtro «solo fallas», nota por servicio, selección | el estado como fotografía; forma actualizadora; copiar, no mutar; cinco reglas de forma; elevar el estado; `key` para reiniciar |
| 3 | [Effects: sincronizar, no «cuando cargue»](03-effects-sincronizar.md) | sondeo cada 10 s y detalle que se reinicia | empezar y dejar de sincronizar; limpieza; carrera de respuestas; StrictMode; dependencias honestas; `useEffectEvent` |
| 4 | [Estado del servidor con TanStack Query](04-estado-del-servidor.md) | el reporte con caché y botón «reintentar» | `useQuery`, `queryKey`, `signal`; `status` y `fetchStatus`; `refetchInterval`; `useMutation`; el estado vacío; Error Boundary |
| 5 | [Rutas y la URL como estado](05-rutas-url-como-estado.md) | lista, detalle, 404 y filtros en la dirección | `createBrowserRouter`, `<Outlet />`, `useSearchParams`, `NavLink`; recargar una ruta del cliente |
| 6 | [Estado compartido: reducer y contexto](06-reducer-contexto.md) | bandeja de avisos y preferencias | `useReducer` y reducer puro; contexto con dos partes; hook que exige proveedor; qué estado vive dónde |
| 7 | [Formularios, acciones y accesibilidad](07-formularios-accesibilidad.md) | el alta de un servicio | `<form action>`, `useActionState`, `useFormStatus`, `useOptimistic`; validación; `aria-invalid`; regiones vivas; teclado |
| 8 | [Pruebas de componentes](08-pruebas-de-componentes.md) | la suite del panel | Vitest y Testing Library; consultas por rol; `findBy`; `user-event`; la prueba que se pone roja al revertir |
| 9 | [Rendimiento, publicación y cuándo un framework](09-rendimiento-publicacion.md) | el `revisor` medido y publicado | Profiler; React Compiler 1.0; `vite build`; reescritura a `index.html`; Server Components y cuándo migrar |

Al final de cada lección hay ejercicios con sus soluciones. Y la [bitácora](bitacora.md) es tuya: anota ahí lo que te costó.

## Tres criterios que atraviesan todo el curso

**Un Effect es para sincronizarse con algo que está fuera de React.** No es para calcular un valor, no es para reaccionar a un clic y no es para «cuando cargue». La lista de dependencias describe el código; si el linter se queja, se cambia el código, nunca se silencia la regla. Es el error que más cuesta en React y la lección 3 entera trata de él, pero aparece desde la 2.

**Primero se mide, después se optimiza.** `useMemo`, `useCallback` y `memo` son herramientas con costo, no una costumbre. El curso las presenta cuando hay una medición que las pide, y enseña antes la estructura —estado local, `children`— que evita la mayoría de los repintados de más.

**La accesibilidad y la seguridad no son lecciones, son costumbres.** Las consultas por rol de la 8 te empujan a escribir HTML accesible, la 7 trae el teclado y las regiones vivas, y la 9 repasa el XSS y lo que nunca debe ir en una variable `VITE_`.

## Cómo sabes que terminaste

El curso no se acaba cuando leíste la lección 9, sino cuando tu `revisor` cumple estas cinco cosas. Son las mismas que la verificación comprueba en cada cambio:

1. **`npm run lint` no avisa nada**, y no hay un solo `eslint-disable` de las reglas de React.
2. **`npm test` pasa**, y cada prueba que protege un arreglo se puso roja cuando lo revertiste.
3. **Existen los cuatro estados** —cargando, error, vacío y con datos—, más el de «datos viejos mientras se actualiza», y cada uno tiene su prueba.
4. **Se recorre completo con el teclado**, y los avisos de cambio llegan a un lector de pantalla.
5. **`npm run build` termina bien**, la vista previa recarga `/servicios/pagos` sin dar 404 servida con reescritura, y en `dist/` no aparece ninguna clave ni secreto.
