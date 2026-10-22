# Lección 0 — Un proyecto de verdad: Vite, StrictMode y el linter

*Son las 9:40 y la revisión con el equipo de operación es a las 10. Ayer cambiaste una línea del panel del `revisor`: le quitaste una dependencia a un `useEffect` porque «sobraba». En tu máquina se ve perfecto. Tu compañera lo abre en la suya, cambia el intervalo de actualización a cinco segundos para la demostración… y el panel sigue preguntando cada diez, como si no la hubiera oído. Nadie sabe por qué. En el mismo cambio alguien dejó, «solo para probar», una clave del proveedor de monitoreo en una variable que empieza con `VITE_`, y el paquete ya se publicó en el servidor de pruebas. Quedan veinte minutos. Las dos fallas tenían aviso: una herramienta que no estaba instalada y una regla que nadie conocía. Esta lección instala la herramienta y explica la regla.*

**Tiempo:** 2 × 45 min (el corte natural está entre las secciones 0.3 y 0.4)

**Qué construyes:** el panel de la lección 9 del curso de TypeScript, movido a un proyecto de Vite: con servidor de desarrollo, un *proxy* hacia la API, una variable de configuración `VITE_`, `StrictMode` encendido, el linter de React activo y el servidor de práctica del curso para que el panel tenga a quién preguntarle

**Qué aprendes:** qué agrega Vite sobre un empaquetador armado a mano; la plantilla `react-ts`, sus tres `tsconfig` y la estructura por funcionalidad; el *proxy* hacia la API (sin CORS en desarrollo); las variables `VITE_` y por qué ahí no va ningún secreto; `eslint-plugin-react-hooks` activo desde el primer día

**De dónde vienes.** De la lección 9 del [curso de TypeScript](https://github.com/HabilMX/curso-typescript) de esta casa, o de un lugar parecido: un panel de React que funciona. Ese panel tiene un componente `Panel`, un hook propio `useReporte` que pide `GET /api/estados` con un `AbortController`, una frontera de red `cargar.ts` que valida la respuesta con `esReportePublico`, y un `cliente.tsx` que lo monta. Se empaquetaba con un comando de esbuild de una línea y lo servía el mismo proceso de Node que respondía la API. Si no llevaste ese curso, no importa: todo el código del panel aparece completo en esta lección, y el curso trae un servidor de práctica que responde con la misma forma de datos. Trabajas en una carpeta nueva, `~/curso-react/revisor/`.

**Qué no hace esta lección.** No cambia lo que el panel hace: ni una pantalla nueva, ni un estado nuevo, ni una regla nueva. El código de React es el mismo de la lección 9 de TypeScript, con dos cambios pequeños que se explican donde aparecen. Tampoco explica a fondo los Effects ni StrictMode: aquí los enciendes y ves qué hacen; la [Lección 3](03-effects-sincronizar.md) los desarma pieza por pieza. No publica nada: la política de seguridad de contenido (CSP), la reescritura a `index.html` y el servidor de producción llegan en la [Lección 9](09-rendimiento-publicacion.md). Y no tiene pruebas automáticas todavía: Vitest y Testing Library llegan en la [Lección 8](08-pruebas-de-componentes.md).

**Sobre las corridas.** Todo se ejecutó el 21 de octubre de 2026 con Node.js 24.22.0 (línea 24 LTS) y npm 11.19.1, en macOS, con las versiones exactas que fija el `package.json` de esta lección. Como el curso supone Linux Mint, el punto de control se volvió a instalar desde cero con `npm ci` dentro de un contenedor Linux (Debian 12 con la imagen oficial `node:24.22.0`), y ahí `npm run lint` y `npm run build` dieron la misma salida, con los mismos nombres de archivo en `dist/`. No se corrió en una Linux Mint real, pero nada de lo que se muestra depende del sistema, salvo la palabra `darwin-arm64` de `vite --version`, que en tu Mint dirá `linux-x64`. Lo que se ve «en el navegador» se midió con Chrome sin ventana (`--headless`), que carga la página, ejecuta su JavaScript y entrega el documento resultante: es un navegador real, no una simulación. Las rutas largas que imprimen ESLint y Vite se muestran a partir de `~/curso-react`. Las horas de la bitácora del servidor de práctica están en UTC. Un día antes, el 20 de octubre, había salido la 24.22.1 de la misma línea, con el mismo npm; las corridas de la lección no se hicieron con ella, pero el punto de control se repitió después con esa versión desde una copia limpia (`npm ci`, `npm run lint` y `npm run build`) y produjo los mismos nombres de archivo en `dist/`, `index-tGGc24Rg.css` e `index-BWNt33lQ.js`; la salida está en `node-24.22.1.salida.txt`. Los programas están en [`programas/00-un-proyecto-de-verdad/`](../programas/00-un-proyecto-de-verdad), en el repositorio del curso: `revisor/` es el punto de control y las figuras están junto a él.

**Antes de empezar: ¿tienes Node.js 24?** Esta lección no instala Node.js; lo da por instalado, así que lo primero es comprobarlo. Abre una terminal y escribe:

```text
$ node -v
v24.22.1
```

Tu número final puede ser otro (aquí se muestra el de la versión más reciente de la línea 24 el día de la revisión), pero debe empezar con `v24`. Si el comando no existe, o dice otra cosa, instala Node.js 24 LTS siguiendo las instrucciones de la página de descargas ([Node.js, «Download»](https://nodejs.org/en/download)), que propone un método según tu sistema, y vuelve a escribir `node -v`. No es un trámite: Vite 8 pide Node.js 20.19 o superior, o 22.12 o superior ([Vite, «Getting Started»](https://vite.dev/guide/)), y el servidor de práctica se ejecuta con `node servidor/practica.ts`, que necesita la 24.12 o una posterior (lo explica 0.2.2). Si tu distribución trae un Node.js más viejo en sus repositorios, el comando existirá y los números no coincidirán con los de la lección: por eso se comprueba antes.

## Al terminar vas a poder

- Crear un proyecto con la plantilla `react-ts` de Vite, fijar sus dependencias con versión exacta y explicar para qué sirve cada uno de sus tres archivos `tsconfig`.
- Explicar la diferencia entre `npm run dev` y `npm run build`, y demostrar con un error de tipos que Vite traduce TypeScript pero no lo revisa.
- Configurar un *proxy* en `vite.config.ts` y explicar, con la respuesta de `curl` a la vista, por qué con él el navegador no necesita CORS en desarrollo.
- Leer una variable `VITE_` desde `import.meta.env`, darle tipo, y comprobar con `grep` sobre `dist/` que su valor viaja escrito en el JavaScript que descarga cualquier persona.
- Reconocer en la bitácora del servidor la segunda petición que provoca `StrictMode` en desarrollo, y explicar por qué no aparece en la versión construida.
- Activar `eslint-plugin-react-hooks`, hacer que un aviso detenga `npm run lint`, y leer los avisos de `rules-of-hooks`, `exhaustive-deps` y `set-state-in-effect`.

## El porqué antes del cómo

El panel de la lección 9 de TypeScript funciona, y funciona por buenas razones: la respuesta de la API está validada, el efecto se limpia, la falla de la API se ve como falla. Lo que no tiene es un **proyecto** alrededor. Pregúntale a ese panel cuatro cosas y verás los huecos.

**¿Cuánto tardas en ver un cambio?** Cada vez que tocabas `Panel.tsx` había que volver a empaquetar con esbuild, reiniciar el servidor de Node y recargar la página. Son quince segundos, cien veces al día. Un servidor de desarrollo que vigila tus archivos y le avisa al navegador qué módulo cambió convierte esos quince segundos en menos de uno, y conserva el estado de la pantalla mientras tanto.

**¿Cómo hablas con la API si no viven en el mismo proceso?** En TypeScript, la página y la API salían del mismo servidor, del mismo origen, y por eso `fetch("/api/estados")` funcionaba sin configurar nada. En cuanto separas la pantalla (que ahora sirve una herramienta de desarrollo en un puerto) de la API (que sigue en otro), el navegador empieza a aplicar la política del mismo origen y la petición se bloquea. Hay dos salidas: abrir CORS en la API, que es una decisión de seguridad que no le toca a la pantalla, o hacer que la herramienta de desarrollo reenvíe esas peticiones, para que el navegador vuelva a ver un solo origen. Esta lección toma la segunda.

**¿Dónde va la configuración?** El intervalo de actualización estaba escrito en el código, `10_000`. Cambiarlo para una demostración exigía editar un archivo. Las herramientas de construcción ofrecen variables de entorno, pero en una página del navegador «variable de entorno» significa algo muy distinto que en un servidor, y confundirlo es la forma más común de publicar una clave.

**¿Quién te avisa cuando rompes una regla de React?** El compilador de TypeScript revisa tipos; no sabe que un hook no se puede llamar después de un `return`, ni que la lista de dependencias de un efecto tiene que nombrar lo que el efecto usa. La lección 9 de TypeScript lo dijo con todas sus letras: «ESLint, en este proyecto, no revisa listas de dependencias; el paquete oficial que lo hace es `eslint-plugin-react-hooks`, y es una buena siguiente instalación». Esa siguiente instalación es hoy, y es la primera de este curso, porque **un criterio que el curso repite en cada lección —si el linter se queja, se cambia el código— solo tiene sentido si el linter está encendido desde el primer día.**

Las cuatro respuestas caben en una herramienta y dos interruptores. La herramienta es **Vite**, una de las que el propio equipo de React cita, junto con Parcel y Rsbuild, cuando quieres construir una aplicación sin un framework ([React, «Build a React app from Scratch»](https://react.dev/learn/build-a-react-app-from-scratch)) y la que reemplazó a Create React App, que el equipo de React retiró para proyectos nuevos el 14 de febrero de 2025 ([React, «Sunsetting Create React App»](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)). Los interruptores son **`StrictMode`**, que hace que React ponga a prueba tus componentes mientras desarrollas, y **`eslint-plugin-react-hooks`**, que revisa las reglas de React antes de ejecutar nada.

Son tres conceptos nuevos, los del párrafo anterior. El primero es **la herramienta, Vite**, y ocupa cuatro secciones porque responde las tres primeras preguntas: qué es Vite y qué hace (0.1); el proyecto, sus `tsconfig` y sus carpetas (0.2); el *proxy* (0.3); y las variables `VITE_` (0.4). El segundo es el primer interruptor, **`StrictMode`** (0.5). El tercero es el segundo interruptor, **el linter de React** (0.6). La sección 0.7 no agrega un concepto: es el recorrido completo con el servidor de práctica, donde los tres se ven juntos. Al final, esto es lo que vas a ver, y vas a saber de dónde sale cada renglón:

```text
$ npm run build

> revisor@0.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 20 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-tGGc24Rg.css    0.24 kB │ gzip:  0.18 kB
dist/assets/index-BWNt33lQ.js   221.66 kB │ gzip: 69.47 kB

✓ built in 265ms
```

## Los conceptos

### 0.1 Qué hace Vite que el empaquetador armado a mano no hacía

#### 0.1.1 Dos trabajos distintos con un mismo nombre

El comando de esbuild de la lección 9 de TypeScript hacía un solo trabajo: tomar `cliente.tsx`, seguir sus `import`, juntarlo todo en un `cliente.js` y escribirlo en disco. Vite hace **dos trabajos distintos**, y casi todo lo que vas a leer sobre él se entiende mejor si los separas:

1. **El servidor de desarrollo** (`npm run dev`). No junta tu código en un archivo. Sirve cada módulo de tu código por separado, cuando el navegador lo pide, traducido al vuelo de TypeScript y JSX a JavaScript. Los navegadores modernos saben cargar módulos de JavaScript (`<script type="module">` y sus `import`) sin ayuda, así que no hace falta empaquetar para desarrollar. Por eso arranca en poco tiempo, porque no empaqueta tu código (el tiempo de arranque crece mucho menos con el tamaño del proyecto que en una herramienta que empaqueta todo antes de servir), y por eso, cuando cambias un archivo, solo ese módulo se vuelve a enviar: es el **reemplazo de módulos en caliente** (HMR, *Hot Module Replacement*), que en React se llama *Fast Refresh* y conserva el estado de los componentes que no cambiaron ([Vite, «Why Vite»](https://vite.dev/guide/why)). Con las **dependencias** (lo que vive en `node_modules/`, como `react`) sí hace una excepción: las **preempaqueta** una vez, al arrancar, para convertir a módulos de JavaScript las que vienen en el formato viejo de Node (CommonJS) y para que una librería hecha de cientos de archivos internos llegue al navegador en una sola petición y no en cientos. Ese preempaquetado solo ocurre en desarrollo y no toca tu código ([Vite, «Dependency Pre-Bundling»](https://vite.dev/guide/dep-pre-bundling)).
2. **La construcción** (`npm run build`). Aquí sí se empaqueta, porque servir cientos de módulos sueltos en producción obliga al navegador a hacer una petición por cada `import` anidado. El resultado es una carpeta `dist/` con un `index.html`, un JavaScript y una hoja de estilos con nombres que cambian cuando cambia su contenido.

Desde Vite 8, publicado el 12 de marzo de 2026, los dos trabajos los hace la misma pieza: **Rolldown**, un empaquetador escrito en Rust, con **Oxc** para leer, traducir y reducir el código. Antes, Vite usaba esbuild en desarrollo y Rollup para construir, y mantenerlos de acuerdo exigía código de pegamento ([Vite, «Announcing Vite 8»](https://vite.dev/blog/announcing-vite8)). Para ti la consecuencia práctica es una sola: lo que ves en desarrollo y lo que se construye pasan por el mismo traductor (en desarrollo, sin empaquetar ni reducir el código).

#### 0.1.2 `index.html` es la puerta de entrada

En la lección 9 de TypeScript, la página era una cadena de texto dentro de `pagina.ts`, y apuntaba a un `/cliente.js` que tenía que existir de antemano. En Vite es al revés: **`index.html` vive en la raíz del proyecto y es el punto de partida.** Vite lo lee, encuentra el `<script type="module" src="/src/main.tsx">` y a partir de ahí sigue los `import` ([Vite, «Getting Started»](https://vite.dev/guide/)). Tú apuntas al archivo de TypeScript, no a un resultado empaquetado; Vite se encarga de que el navegador reciba JavaScript.

Lo puedes ver con tus ojos. Con el servidor de desarrollo encendido, pide la página con `curl`:

```text
$ curl -s http://localhost:5173/
<!doctype html>
<html lang="es">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Revisor</title>
  </head>
  <body>
    <div id="raiz"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Es tu `index.html` con dos agregados que no escribiste: `/@vite/client`, el pedacito que mantiene abierta una conexión con el servidor para enterarse de qué archivo cambió, y `/@react-refresh`, el que permite reemplazar un componente sin perder el estado de los demás. Ese segundo lo pone `@vitejs/plugin-react`, el complemento oficial de Vite para React, que además traduce el JSX con el *runtime* automático, el mismo modo `react-jsx` que usabas con `tsc` ([vite-plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)). Nada de esto aparece en `dist/`: es solo para desarrollar.

#### 0.1.3 Vite traduce TypeScript, pero no lo revisa

Esta es la frase que más conviene llevarse de la sección: **Vite borra los tipos sin comprobarlos.** Su documentación lo dice en mayúsculas: solo traduce los archivos `.ts` y «NO» revisa tipos; esa tarea la deja al editor y al proceso de construcción ([Vite, «Features», TypeScript](https://vite.dev/guide/features)). Es exactamente lo que pasaba con esbuild en la lección 9 de TypeScript, y tiene la misma consecuencia: si alguien solo corre la herramienta que empaqueta, puede entregar un programa con errores de tipo.

Por eso el script `build` de la plantilla no es `vite build` a secas, sino `tsc -b && vite build`. Primero el compilador de TypeScript revisa todo; si encuentra un error, el `&&` impide que la construcción siquiera empiece. En «El error que vas a ver» lo vas a provocar a propósito para ver las dos salidas lado a lado. Y en desarrollo, mientras `npm run dev` corre, los errores de tipo **no aparecen en la terminal ni en el navegador**: los ves en tu editor, o cuando corres `npm run build`.

### 0.2 El proyecto: la plantilla, sus `tsconfig` y sus carpetas

#### 0.2.1 Lo que trae la plantilla, y lo que se le cambia

La forma oficial de empezar es `npm create vite@latest`. Con un nombre y una plantilla, no hace preguntas. Este curso fija la versión del creador para que tu resultado sea igual al de la lección:

```text
$ npm create vite@9.3.1 revisor -- --template react-ts --no-interactive

> npx
> 'cva' revisor --template react-ts --no-interactive


create-vite v9.3.1

│
◇  Scaffolding project in ~/curso-react/revisor...
│
└  Done. Now run:

  cd revisor
  npm install
  npm run dev
```

Los dos guiones sueltos (`--`) separan las opciones de npm de las opciones del creador; sin ellos, npm se quedaría con `--template`. La plantilla `react-ts` deja una carpeta con `index.html`, `vite.config.ts`, tres archivos `tsconfig`, un `package.json`, una carpeta `src/` con un contador de ejemplo y una carpeta `public/` para archivos que se copian tal cual. Medido ese día, su `package.json` traía tres decisiones que este curso cambia, y conviene decirlo en voz alta para que no te sorprenda si comparas:

- **Las versiones con `^` y `~`.** La plantilla escribe `"vite": "^8.3.4"`, que deja a npm instalar cualquier 8.x más nueva. El curso fija cada dependencia con su versión exacta, verificada con `npm view` el día de la corrida: así lo que ves aquí es lo que instalas tú. El archivo de bloqueo, `package-lock.json`, guarda además la resolución exacta de todo lo que esas dependencias arrastran.
- **El linter.** La plantilla de este mes trae **Oxlint**, un linter muy rápido escrito en Rust, con algunas reglas de React. El curso usa ESLint con `eslint-plugin-react-hooks`, que es el paquete que publica el propio equipo de React para revisar sus reglas ([React, «eslint-plugin-react-hooks»](https://react.dev/reference/eslint-plugin-react-hooks)) y el que incluye los diagnósticos del React Compiler que la Lección 9 usa. Oxlint no es una mala elección; es otra, y mezclar dos linters en un curso es ruido. El creador tiene una opción `--eslint` que cambia Oxlint por ESLint, pero se midió el mismo día y agrega además `eslint-plugin-react-refresh` y `globals`, dos paquetes que este curso no usa; por eso aquí se crea sin esa opción y se quita Oxlint a mano, como se explica abajo.
- **TypeScript.** La plantilla fija TypeScript 6. El curso de TypeScript trabaja con TypeScript 7, y aquí se conserva igual que allá: TypeScript 7 es el que revisa los tipos (`tsc`), y TypeScript 6 se queda, con el nombre `typescript`, solo para que ESLint pueda leer los archivos `.ts`. La razón es medible: `typescript-eslint` declara que soporta TypeScript `>=4.8.4 <6.1.0` ([typescript-eslint, «Dependency Versions»](https://typescript-eslint.io/users/dependency-versions/)), así que todavía no corre con la 7. Son dos papeles distintos; no cambies uno por el otro.

Si no llevaste el curso de TypeScript, no hace falta entender el truco de los alias para seguir: basta saber que `npx tsc --version` dice `Version 7.0.2` y que `npx tsc6 --version` existe solo para ESLint. Un detalle curioso que se midió: el paquete `@typescript/typescript6` está en su versión 6.0.2, pero su ejecutable responde `Version 6.0.3`. No afecta nada; se deja anotado porque, si lo ves, no es un error tuyo.

El punto de control de esta lección no conserva el contador de ejemplo ni la carpeta `public/`: sus archivos se reemplazan por los del panel. Antes de instalar nada, quita lo que la plantilla trae de Oxlint, para que tu proyecto termine igual al del curso: borra el archivo `.oxlintrc.json`, borra en `package.json` el renglón `"oxlint"` de `devDependencies`, y deja su bloque `scripts` igual al que se muestra más abajo (el `lint` de la plantilla dice `oxlint`; el del curso, `eslint . --max-warnings 0`, y se agrega `servidor`). Las dependencias se instalan así, en dos comandos, desde `~/curso-react/revisor/`:

```bash
npm install --save-exact react@19.3.1 react-dom@19.3.1
npm install --save-dev --save-exact vite@8.3.5 @vitejs/plugin-react@6.1.2 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.2 "@typescript/native@npm:typescript@7.0.2" "typescript@npm:@typescript/typescript6@6.0.2" eslint@10.13.0 @eslint/js@10.0.1 typescript-eslint@8.72.0 eslint-plugin-react-hooks@7.1.1
```

Fíjate en una diferencia con la lección 9 de TypeScript: allá React iba en `devDependencies`, porque el servidor de producción no lo importaba. Aquí va en `dependencies`, como lo pone la plantilla. Para una aplicación que se construye y se sirve como archivos estáticos, la diferencia no cambia el resultado (todo termina dentro del JavaScript de `dist/`); es una convención que separa «lo que viaja al navegador» de «lo que solo usas para construir».

El `package.json` del punto de control queda así:

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "servidor": "node servidor/practica.ts"
  },
  "dependencies": {
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

Cinco scripts, cinco trabajos. `dev` arranca el servidor de desarrollo. `build` revisa tipos y construye. `lint` corre ESLint con `--max-warnings 0`, que se explica en 0.6. `preview` sirve lo que quedó en `dist/` para que lo veas antes de publicarlo (y solo para eso: la documentación de Vite dice que está pensado para ver la construcción en tu máquina y que no es un servidor de producción, [Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy)). Y `servidor` arranca el servidor de práctica, que se presenta en 0.7.

Antes de seguir, una costumbre que no se negocia: `node_modules/` no se sube nunca a un repositorio. Son decenas de megabytes que `npm ci` reconstruye idénticos a partir de `package-lock.json`. La plantilla trae un `.gitignore` que ya lo excluye, junto con `dist/` y los archivos `*.local`; consérvalo, y si armas el proyecto a mano, créalo antes del primer `git add` con al menos esos tres renglones: `node_modules`, `dist` y `*.local`. En el repositorio del curso, la carpeta `revisor/` no trae un `.gitignore` propio: los diez puntos de control viven en un solo repositorio y el `.gitignore` de su raíz los cubre a todos. Lo que sí se sube es `package-lock.json`.

#### 0.2.2 Tres `tsconfig`, porque hay dos mundos

En la lección 9 de TypeScript, un solo `tsconfig.json` revisaba a la vez el servidor y el panel, y la propia lección señalaba el costo: el código del servidor también «veía» `document`, y un descuido compilaba y fallaba al ejecutar. La plantilla de Vite separa los dos mundos con **referencias de proyecto** (*project references*): pequeños proyectos de TypeScript que se revisan por separado, cada uno con sus propias reglas ([TypeScript, «TSConfig Reference»](https://www.typescriptlang.org/tsconfig/)). El archivo de la raíz no revisa nada; solo enumera a los otros dos:

```json revisor/tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsc -b` (de *build*) recorre esas referencias y revisa cada una. El primero es el del navegador, `tsconfig.app.json`, y cubre `src/`:

```json revisor/tsconfig.app.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

Lo que importa de este archivo cabe en cinco ideas:

- **`"lib": ["ES2023", "DOM"]` y `"types": ["vite/client"]`.** Aquí sí existen `document` y `window`, y además los tipos que Vite agrega al navegador, como `import.meta.env` ([Vite, «Features», tipos del cliente](https://vite.dev/guide/features)). En el otro proyecto no existirán.
- **`"noEmit": true`.** TypeScript no escribe ningún `.js`: solo revisa. Quien traduce es Vite. La documentación de TypeScript describe esta opción justo así: deja lugar para que otra herramienta convierta el código ([TypeScript, `noEmit`](https://www.typescriptlang.org/tsconfig/#noEmit)).
- **`"moduleResolution": "bundler"`.** Es la forma de resolver `import` pensada para empaquetadores, y a diferencia de `nodenext` **nunca exige extensión** en las rutas relativas ([TypeScript, `moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution)). Este es el primero de los dos cambios al código de la lección 9: allá escribías `import { Panel } from "./Panel.js"`, con un `.js` que no existía en disco, porque Node lo exigía; aquí escribes `from "./Panel"`.
- **`verbatimModuleSyntax` e `isolatedModules`.** Vite traduce cada archivo por separado, sin mirar los demás, y por eso no sabe si lo que importas es un tipo o un valor. Con `verbatimModuleSyntax`, TypeScript te obliga a marcar con `type` lo que es solo tipo, y el traductor puede borrarlo sin dudar ([TypeScript, `verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax)); con `isolatedModules`, te avisa si escribes algo que un traductor de un archivo a la vez no puede interpretar bien. La documentación de Vite pide esta segunda opción explícitamente ([Vite, «Features»](https://vite.dev/guide/features)). La plantilla no la trae; el punto de control la agrega porque la fuente oficial la exige.
- **`"strict": true`.** Tampoco viene en la plantilla de este mes, y el curso de TypeScript lo daba por sentado desde su lección 2. Sin él, `null` y `undefined` se cuelan donde no deben.

El segundo proyecto, `tsconfig.node.json`, es el de las cosas que corren en Node: la configuración de Vite y el servidor de práctica.

```json revisor/tsconfig.node.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts", "servidor"]
}
```

Aquí no hay `DOM`: si el servidor de práctica escribiera `document`, `tsc -b` lo rechazaría. Y aparecen dos opciones que tienen que ver con una capacidad nueva de Node: desde la versión 24.12.0, ejecutar un archivo `.ts` directamente con `node archivo.ts` es estable. Node no revisa tipos, solo los reemplaza por espacios, y por eso pone dos condiciones: que las importaciones lleven su extensión `.ts` y que el archivo no use sintaxis de TypeScript que genere código, como `enum` ([Node.js, «Modules: TypeScript»](https://nodejs.org/api/typescript.html)). `allowImportingTsExtensions` permite la primera; `erasableSyntaxOnly` hace que `tsc` vigile la segunda ([TypeScript, `erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)). Por eso `npm run servidor` es `node servidor/practica.ts`, sin compilar nada antes.

La configuración de Vite es corta. El *proxy* que contiene se explica en 0.3:

```ts
// revisor/vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3100",
    },
  },
});
```

`port: 5173` es el puerto que Vite usa de todos modos; escribirlo deja claro cuál es. `strictPort: true` cambia lo que pasa si ese puerto está ocupado: sin esa opción, Vite prueba en silencio el siguiente puerto libre ([Vite, «Server Options»](https://vite.dev/config/server-options)), y te encontrarías con dos servidores de desarrollo olvidados en 5173 y 5174 sin saber cuál estás mirando. Con ella, Vite se niega a arrancar y te lo dice.

#### 0.2.3 Las carpetas: por funcionalidad, no por tipo de archivo

Hay dos formas comunes de ordenar `src/`. Una agrupa por tipo de archivo: una carpeta `components/`, otra `hooks/`, otra `services/`. La otra agrupa por **funcionalidad**: todo lo que hace falta para «ver el reporte de estados» vive junto, sea componente, hook o función de red. Este curso usa la segunda, y es un criterio propio, no una regla de React (la documentación de React no impone ninguna estructura). La razón es práctica: cuando cambias cómo se ve el reporte, abres una carpeta, no tres. Y cuando el `revisor` crezca —el detalle de un servicio en la Lección 5, el alta en la Lección 7—, cada funcionalidad nueva será una carpeta nueva, no un archivo más en cada una de las de siempre.

```text
revisor/
├── .env
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── servidor/
│   └── practica.ts
├── src/
│   ├── compartido/
│   │   └── contrato.ts
│   ├── reporte/
│   │   ├── cargar.ts
│   │   ├── Panel.tsx
│   │   ├── panel.css
│   │   └── useReporte.ts
│   ├── configuracion.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

`src/reporte/` es la funcionalidad. `src/compartido/` guarda lo que usan varias: hoy, solo los tipos de la API (`contrato.ts`). Los demás archivos de `src/` son los que tocan la aplicación entera: el arranque y la configuración. Esos tipos son los mismos de la lección 8 de TypeScript; el único cambio es que `esRegistro` ahora vive aquí mismo, porque el archivo de configuración del servidor del que se importaba no forma parte de este proyecto:

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
```

La frontera de red tiene el segundo cambio. En TypeScript, `cargarReporte` recibía un segundo parámetro, `base`, que las pruebas usaban para apuntar a un servidor local con su dirección completa. Aquí el navegador siempre pide la ruta relativa `/api/estados` y es el *proxy* el que decide a dónde va, así que ese parámetro sobra y se quita. Al quitarlo, la función ya tiene exactamente la forma del tipo `Cargar`, y `main.tsx` puede pasarla tal cual, sin envolverla en una función flecha:

```ts
// revisor/src/reporte/cargar.ts
import { esReportePublico, type ReportePublico } from "../compartido/contrato";

export type Cargar = (senal: AbortSignal) => Promise<ReportePublico>;

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

El hook y el componente llegan sin cambios de lógica; solo cambian sus `import`. El componente, además, importa su hoja de estilos: en Vite, `import "./panel.css"` es todo lo que hace falta para que el CSS llegue a la página. En desarrollo se inyecta con una etiqueta `<style>` que se reemplaza en caliente cuando editas el archivo, y al construir se junta en un archivo `.css` aparte ([Vite, «Features», CSS](https://vite.dev/guide/features)). En TypeScript le pasabas a esbuild la hoja como segunda entrada; aquí la hoja viaja con el componente que la usa, que es justo la idea de agrupar por funcionalidad.

```ts
// revisor/src/reporte/useReporte.ts
import { useEffect, useState } from "react";
import type { ReportePublico } from "../compartido/contrato";
import type { Cargar } from "./cargar";

export type Carga =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "listo"; readonly reporte: ReportePublico }
  | { readonly tipo: "error"; readonly detalle: string };

export function useReporte(
  cargar: Cargar,
  cadaMs: number,
): { readonly carga: Carga; readonly recargar: () => void } {
  const [carga, establecerCarga] = useState<Carga>({ tipo: "cargando" });
  const [intento, establecerIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();

    async function pedir(): Promise<void> {
      try {
        const reporte = await cargar(control.signal);
        establecerCarga({ tipo: "listo", reporte });
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

```tsx
// revisor/src/reporte/Panel.tsx
import type { EstadoPublico } from "../compartido/contrato";
import type { Cargar } from "./cargar";
import "./panel.css";
import { useReporte, type Carga } from "./useReporte";

function FilaEstado({ estado }: { readonly estado: EstadoPublico }) {
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

function Contenido({ carga }: { readonly carga: Carga }) {
  switch (carga.tipo) {
    case "cargando":
      return <p role="status">Cargando…</p>;
    case "error":
      return <p role="alert">No se pudo cargar el reporte: {carga.detalle}</p>;
    case "listo":
      return (
        <ul>
          {carga.reporte.estados.map((estado, posicion) => (
            <FilaEstado key={`${posicion}-${estado.nombre}`} estado={estado} />
          ))}
        </ul>
      );
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}

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
      <Contenido carga={carga} />
      <button type="button" onClick={recargar}>
        Actualizar
      </button>
    </main>
  );
}
```

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
```

La página y el arranque cierran el recorrido. `index.html` es el de la plantilla con tres cambios: el idioma, el título y el identificador del contenedor, que se queda como `raiz` para no tocar el código que lo busca. `main.tsx` es el `cliente.tsx` de TypeScript con dos agregados: `StrictMode`, que se explica en 0.5, y el intervalo leído de la configuración, que se explica en 0.4.

```html revisor/index.html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Revisor</title>
  </head>
  <body>
    <div id="raiz"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```tsx
// revisor/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { cadaMs } from "./configuracion";
import { cargarReporte } from "./reporte/cargar";
import { Panel } from "./reporte/Panel";

const raiz = document.getElementById("raiz");

if (raiz === null) {
  throw new Error("falta el elemento #raiz en la página");
}

createRoot(raiz).render(
  <StrictMode>
    <Panel cargar={cargarReporte} cadaMs={cadaMs} />
  </StrictMode>,
);
```

Nota algo que la lección 9 de TypeScript cuidaba y que aquí se conserva: `cargarReporte` es una función declarada a nivel de módulo, así que es la misma en cada dibujo. `useReporte` la tiene en su lista de dependencias; si cambiara en cada dibujo, el efecto se repetiría en cada dibujo.

### 0.3 El *proxy*: un solo origen mientras desarrollas

Hasta aquí hay dos procesos: el servidor de desarrollo de Vite en `http://localhost:5173` y la API (el servidor de práctica) en `http://127.0.0.1:3100`. Para el navegador, eso son **dos orígenes**, porque un origen es la combinación de esquema, servidor y puerto, y aquí cambian el servidor y el puerto. La regla que aplica se llama **política del mismo origen**: un script que se cargó desde un origen puede pedir datos a otro, pero el navegador **no le deja leer la respuesta** a menos que esa respuesta traiga los encabezados de CORS adecuados. MDN lo dice así: por seguridad, los navegadores restringen las peticiones HTTP entre orígenes que inician los scripts, y `fetch()` sigue la política del mismo origen ([MDN, «Cross-Origin Resource Sharing (CORS)»](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)). El encabezado que da permiso es `Access-Control-Allow-Origin`.

¿Lo trae el servidor de práctica? Pregúntaselo como lo haría el navegador, diciendo de qué origen vienes:

```text
$ curl -s -D - -o /dev/null -H "Origin: http://localhost:5173" http://127.0.0.1:3100/api/estados
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
cache-control: no-store
Date: Wed, 21 Oct 2026 07:25:57 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked
```

Ni rastro de `Access-Control-Allow-Origin`. `curl` recibe la respuesta completa porque `curl` no es un navegador y no aplica ninguna política; pero si el panel, cargado desde el puerto 5173, pidiera esa dirección completa, el navegador recibiría la respuesta y se negaría a entregársela al código, y en la consola verías un error de CORS. Y es deliberado que el servidor no lo traiga: decidir qué orígenes pueden leer una API es una decisión de seguridad de la API, no algo que se abre porque a la pantalla le estorba en desarrollo. La lección 9 de TypeScript lo dijo al revés: mientras panel y API salgan del mismo proceso no hay nada que configurar, y si algún día se separan, la respuesta correcta es declarar orígenes explícitos, nunca `*` por comodidad.

La otra salida es que el navegador **nunca se entere** de que hay dos procesos. Eso hace el *proxy* de `vite.config.ts`: «toda petición cuya ruta empiece con esa clave se reenvía al destino indicado» ([Vite, «Server Options», `server.proxy`](https://vite.dev/config/server-options)). La forma corta, `"/api": "http://127.0.0.1:3100"`, significa que `http://localhost:5173/api/estados` se convierte, dentro del servidor de Vite, en `http://127.0.0.1:3100/api/estados`. El navegador solo habla con el puerto 5173; el reenvío ocurre entre dos procesos de tu máquina, donde no hay ninguna política del mismo origen que aplicar. Compruébalo con el mismo `curl`, ahora contra Vite:

```text
$ curl -s http://localhost:5173/api/estados | head -c 120
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla"
```

La respuesta es la del servidor de práctica, servida desde el origen de la página. Por eso `cargar.ts` sigue escribiendo `fetch("/api/estados")`, una ruta relativa, igual que en TypeScript: el código del panel no sabe ni le importa en qué puerto vive la API. Tres detalles que conviene saber:

- **Solo se reenvía lo que empieza con la clave.** `/src/main.tsx` lo sigue sirviendo Vite. Si mañana la API agrega rutas que no empiecen con `/api`, no se reenvían hasta que agregues otra clave. Por eso conviene que todas las rutas de una API vivan bajo un mismo prefijo.
- **`vite preview` también reenvía.** Su opción `preview.proxy` toma por omisión el valor de `server.proxy` ([Vite, «Preview Options»](https://vite.dev/config/preview-options)), y por eso en 0.5 la versión construida también encuentra la API.
- **En producción no hay *proxy* de Vite.** Lo que se publica son los archivos de `dist/`, y quien los sirva tendrá que resolver lo mismo: o la página y la API salen del mismo origen (lo más común, con un proxy inverso delante), o la API declara CORS. La Lección 9 vuelve sobre esto.

### 0.4 Variables `VITE_`: configuración, nunca secretos

El intervalo de actualización es configuración: un valor que puede cambiar entre tu máquina, la de tu compañera y la versión publicada, sin que cambie el código. En un servidor de Node lo leerías de `process.env`. En una página del navegador **no hay entorno**: el código corre en la computadora de quien abre la página, y lo único que esa persona recibe es el JavaScript que tú le mandas. Así que, cuando Vite te ofrece «variables de entorno», lo que en realidad hace es **escribir su valor dentro del código** en el momento de servir o construir.

La regla de Vite es una sola: solo las variables cuyo nombre empieza con `VITE_` llegan al código del cliente, a través de `import.meta.env`, y su valor se reemplaza de forma estática al construir ([Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode)). Las puedes definir en la terminal o en un archivo `.env` en la raíz del proyecto, que Vite lee siempre, junto con `.env.local`. Si una misma variable aparece en más de un lugar, gana el más específico: las que ya existen en la terminal cuando Vite arranca tienen la prioridad más alta y los archivos `.env` no las sobrescriben; entre archivos, uno de un modo concreto (`.env.production`, por ejemplo) pesa más que uno general ([Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode)). El punto de control trae este:

```bash
# Variables que Vite expone al navegador. TODO lo que empieza con VITE_ termina
# escrito en el JavaScript que descarga cualquier persona: aquí no va ningún secreto.
VITE_CADA_MS=10000
```

Y la configuración la lee y la valida en un solo lugar. Lo que llega de `import.meta.env` es texto o `undefined`, nunca un número, y viene de fuera del programa: se trata como cualquier entrada de una frontera, igual que `leerPuerto` en el curso de TypeScript. Si falta o no es un entero positivo, se usa el valor de siempre:

```ts
// revisor/src/configuracion.ts
const CADA_MS_PREDETERMINADO = 10_000;

export function leerCadaMs(valor: string | undefined): number {
  if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
    return CADA_MS_PREDETERMINADO;
  }

  return Number(valor);
}

export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
```

Para que TypeScript sepa qué variables existen, se declaran en `src/vite-env.d.ts`, como indica la documentación de Vite. La interfaz `ViteTypeOptions` con `strictImportMetaEnv` vuelve estricto el tipo: con ella, leer una variable que no declaraste es un error de compilación en lugar de un `any` silencioso ([Vite, «Env Variables and Modes», IntelliSense](https://vite.dev/guide/env-and-mode)). En «El error que vas a ver» la vas a ver atrapar un error de dedo.

```ts
// revisor/src/vite-env.d.ts
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_CADA_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Ahora, la demostración que justifica toda la sección. Pídele al servidor de desarrollo el módulo de configuración, tal como lo recibe el navegador:

```text
$ curl -s http://localhost:5173/src/configuracion.ts | head -9
import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false, "VITE_CADA_MS": "10000"};const CADA_MS_PREDETERMINADO = 1e4;
export function leerCadaMs(valor) {
	if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
		return CADA_MS_PREDETERMINADO;
	}
	return Number(valor);
}
export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
```

El primer renglón es el que importa: el valor de la variable está **escrito en el archivo** que descarga el navegador, junto con otras cuatro constantes que Vite siempre define (`DEV`, `PROD`, `MODE`, `BASE_URL`). Al construir pasa lo mismo, ya reducido. Construye con otro valor y búscalo en `dist/`:

```text
$ VITE_CADA_MS=15000 npx vite build
...
$ grep -o '.\{30\}15000.\{30\}' dist/assets/*.js
.test(e)?d:Number(e)}var p=f(`15000`);function m(e){return typeof
```

Ahí está, `f(`15000`)`, dentro del JavaScript minificado: `f` es `leerCadaMs` con el nombre acortado. (Se usa `npx vite build` y no `npm run build` solo para pasar la variable en la misma línea; el resultado es igual.) Y si alguien define una «clave», le pasa exactamente lo mismo. Este experimento agrega temporalmente un renglón al final de `src/main.tsx` que imprime una variable con prefijo y otra sin él:

```ts
console.log("con prefijo:", import.meta.env.VITE_CLAVE_API, "sin prefijo:", import.meta.env.CLAVE_API);
```

Construye con los dos valores definidos en la terminal, y busca:

```text
$ VITE_CLAVE_API=clave-de-mentira-123 CLAVE_API=otra-clave-456 npx vite build
...
$ grep -o 'con prefijo:.\{0,80\}' dist/assets/*.js
con prefijo:`,`clave-de-mentira-123`,`sin prefijo:`,void 0);
```

La de `VITE_` quedó escrita, legible para cualquiera que abra las herramientas de desarrollo de su navegador. La que no tiene prefijo quedó como `void 0`, es decir, `undefined`: Vite no la expuso. Por eso la documentación de Vite advierte que las variables `VITE_*` no deben contener información sensible, como claves de API ([Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode)). Fíjate también en que la construcción terminó bien aunque el código leía dos variables que `vite-env.d.ts` no declara: `vite build` no revisa tipos. `npx tsc -b` sí lo habría detenido con dos `TS2339`; por eso el script de construcción del curso empieza con él. (Si repites el experimento, quita después el renglón y vuelve a construir. La salida completa, con los dos `TS2339`, está en `vite-clave-api.salida.txt`.)

Un matiz que conviene medir, porque cambia lo que significa «escrito en el JavaScript». Al construir, Vite reemplaza **las lecturas** que encuentra en tu código, como `import.meta.env.VITE_CADA_MS`; una variable `VITE_` que ningún archivo lee no viaja. Define una que nadie lee y busca su valor:

```text
$ VITE_NADIE_LA_LEE=valor-que-nadie-lee npx vite build
...
$ grep -c 'valor-que-nadie-lee' dist/assets/*.js
0
```

Pero basta con que una sola línea lea el objeto entero (`console.log(import.meta.env);`, agregada al final de `main.tsx` para el experimento) para que viajen **todas** las variables `VITE_` que existan en ese momento:

```text
$ VITE_NADIE_LA_LEE=valor-que-nadie-lee npx vite build
...
$ grep -c 'valor-que-nadie-lee' dist/assets/*.js
1
```

Por eso la regla no se apoya en que «ese valor nadie lo lee»: cualquier variable `VITE_` se escribe pensando que puede acabar en el JavaScript público (salida en `vite-variable-sin-leer.salida.txt`). Es lo que documenta Vite al avisar que los valores `VITE_*` se incluyen en el código al construir y no deben llevar información sensible; la parte de «solo las que se leen» es lo que midió este experimento con Vite 8.3.5, no algo que su guía afirme.

La regla práctica tiene dos mitades. **Qué sí va en `VITE_`:** lo que no te importaría ver publicado en un cartel, como un intervalo, el nombre del ambiente o la dirección pública de una API. **Qué no va nunca:** claves, contraseñas, tokens, nada que dé permiso a algo. Un secreto que el navegador necesita deja de ser secreto en cuanto el navegador lo tiene; si una funcionalidad necesita una clave, la clave vive en un servidor y la pantalla le pide al servidor que haga el trabajo. Y una pieza más: los archivos `.env.local` existen para valores de tu máquina que no quieres compartir, y Vite recomienda poner `*.local` en el `.gitignore` para que nunca se suban.

### 0.5 `StrictMode`: la prueba gratuita

`StrictMode` es un componente de React que no dibuja nada. Envuelve una parte del árbol (aquí, el árbol entero) y, **solo en desarrollo**, hace tres cosas a propósito para destapar errores que ya existen en tu código: dibuja cada componente una vez más, ejecuta cada efecto un ciclo extra de «empezar y limpiar», y revisa si usas APIs viejas ([React, «StrictMode»](https://react.dev/reference/react/StrictMode)). En producción no hace nada: la documentación lo dice sin rodeos, todas sus comprobaciones son de desarrollo y no afectan la construcción.

El ciclo extra de los efectos es el que más se nota, y la primera figura lo muestra en un DOM de prueba. Un componente con un efecto que imprime cuándo empieza y cuándo deja de sincronizarse se monta y se desmonta dos veces: sin `StrictMode` y con él.

```tsx
// fig00_01.tsx
import { JSDOM } from "jsdom";
import { act, StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Sondeo({ nombre }: { readonly nombre: string }) {
  useEffect(() => {
    console.log(`  ${nombre}: empieza a sincronizar`);
    return () => console.log(`  ${nombre}: deja de sincronizar`);
  }, [nombre]);

  return <p>{nombre}</p>;
}

async function montarYDesmontar(titulo: string, arbol: ReactNode): Promise<void> {
  console.log(titulo);
  const raiz = createRoot(dom.window.document.createElement("div"));

  await act(async () => {
    raiz.render(arbol);
  });
  await act(async () => {
    raiz.unmount();
  });
}

await montarYDesmontar("sin StrictMode:", <Sondeo nombre="panel" />);
await montarYDesmontar(
  "con StrictMode:",
  <StrictMode>
    <Sondeo nombre="panel" />
  </StrictMode>,
);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig00_01.tsx
$ node fig00_01.js
sin StrictMode:
  panel: empieza a sincronizar
  panel: deja de sincronizar
con StrictMode:
  panel: empieza a sincronizar
  panel: deja de sincronizar
  panel: empieza a sincronizar
  panel: deja de sincronizar
```

Las figuras se corren en una carpeta aparte, `~/curso-react/figuras/`, y esa carpeta no existe hasta que la armas. Copia en ella, desde `programas/00-un-proyecto-de-verdad/` (la carpeta que está junto a `revisor/`), cinco archivos: `package.json`, `package-lock.json`, `eslint.config.js`, `fig00_01.tsx` y `fig00_02.tsx`; luego corre `npm ci` dentro de `~/curso-react/figuras/` para instalar `react`, `jsdom` y el linter con las versiones exactas. Sin el `eslint.config.js` de esa carpeta, `npx eslint fig00_02.tsx` (0.6) no sabe qué reglas aplicar. Las figuras se compilan con `tsc` y se ejecutan con `node`, como en el curso de TypeScript. Con `StrictMode`, React montó el efecto, lo limpió de inmediato y lo volvió a montar, como si alguien hubiera salido de la pantalla y regresado en un instante. ¿Para qué? Porque eso **sí pasa** en una aplicación real: la persona cambia de pantalla y vuelve, o cambia una dependencia del efecto. Si el efecto no sabe limpiar lo que hizo, esa salida y regreso deja basura: dos conexiones abiertas, dos temporizadores, dos peticiones que compiten. `StrictMode` provoca esa situación en cada montaje para que la veas hoy y no cuando alguien lo note en producción.

En el `revisor` se ve en la bitácora del servidor de práctica. Esto es lo que registró cuando Chrome abrió el panel servido por `npm run dev`:

```text
07:26:06.245 GET /api/estados cancelada por el cliente
07:26:06.545 GET /api/estados 200
```

Dos peticiones al abrir la página una sola vez. La primera la hizo el primer montaje del efecto; la limpieza que siguió llamó a `control.abort()`, el navegador cortó la conexión y el servidor lo anotó como cancelada. La segunda la hizo el segundo montaje, y es la que llenó la pantalla.

Una precisión sobre qué está garantizado y qué no. Lo que React garantiza es el ciclo extra del efecto: preparar, limpiar y volver a preparar ([React, «StrictMode»](https://react.dev/reference/react/StrictMode)). Que el servidor alcance a **anotar** la primera petición depende de en qué momento llega el aborto: si el navegador la cancela antes de que la conexión llegue al servidor, la bitácora mostrará solo el `200`. En esta corrida la conexión alcanzó a llegar, y por eso se ve la pareja. Si en tu máquina ves una sola línea, no es que `StrictMode` esté apagado; lo que prueba el ciclo extra es la primera figura, no la bitácora. Y esto es lo que registró cuando Chrome abrió la versión construida, servida por `npm run preview`:

```text
07:26:22.726 GET /api/estados 200
```

Una sola. En producción no hay ciclo extra. Lee bien lo que demuestra la primera bitácora: **la limpieza del efecto existe y funciona.** Si `useReporte` no abortara la petición en su limpieza, la primera no se cancelaría, las dos respuestas llegarían y las dos escribirían el estado; si no detuviera el temporizador, habría dos intervalos preguntando cada diez segundos. El panel de la lección 9 ya tenía esa limpieza, y `StrictMode` lo confirma gratis cada vez que abres la página.

La tentación, cuando alguien ve dos peticiones por primera vez, es quitar `StrictMode` «porque duplica las llamadas». Es quitar la alarma porque suena. La Lección 3 dedica una sección entera a por qué ese doble montaje es tu aliado, y a las pocas situaciones en que lo que necesitas no es esquivarlo sino escribir el efecto de otra forma.

### 0.6 El linter de React, encendido desde el primer día

ESLint lee tu código sin ejecutarlo y busca patrones que sabe que están mal. Por sí solo no conoce React; `eslint-plugin-react-hooks` le enseña sus reglas. Su configuración recomendada, en la versión 7.1.1, enciende dieciséis reglas: las dos clásicas de los hooks y catorce que vienen del React Compiler. La documentación de React las describe así: las dos primeras cubren los patrones fundamentales, `rules-of-hooks` (que los hooks se llamen igual en cada dibujo) y `exhaustive-deps` (que la lista de dependencias contenga todo lo que el efecto usa), y las demás son diagnósticos del compilador que se pueden usar aunque tu aplicación todavía no lo adopte ([React, «eslint-plugin-react-hooks»](https://react.dev/reference/eslint-plugin-react-hooks)). (Esa página enumera diecisiete; la diferencia es `component-hook-factories`, que la versión 7.1.1 del paquete todavía no incluye en su configuración recomendada. Se midió leyendo las reglas que el paquete instalado enciende.)

La configuración del proyecto junta tres piezas recomendadas —las de JavaScript, las de TypeScript y las de React— y conserva la regla que la lección 9 de TypeScript escribió contra el XSS:

```js
// revisor/eslint.config.js
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "No insertes HTML sin sanitizar: usa texto como hijo de JSX.",
        },
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: "No asignes innerHTML: usa textContent o un componente de React.",
        },
      ],
    },
  },
]);
```

`globalIgnores(["dist"])` evita que ESLint revise el código construido, que no escribiste tú. `files` limita la revisión a los archivos de TypeScript. Y `reactHooks.configs.flat.recommended` es la forma que indica el propio paquete para la configuración plana de ESLint.

Ahora, el detalle que decide si el linter sirve o adorna. La regla `exhaustive-deps` está configurada como **aviso** (*warning*), no como error. Y ESLint, con avisos, **termina bien**. Así se ve si a `useReporte` le quitas `cadaMs` de la lista de dependencias y corres ESLint sin más:

```text
$ npx eslint .

~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

$ echo "código de salida: $?"
código de salida: 0
```

Código de salida 0: para cualquier guion o verificación automática, eso es «todo bien». Ese aviso es la escena con que empezó la lección: el efecto ya no se entera cuando cambia el intervalo, así que tu compañera puede cambiarlo cuanto quiera y el panel seguirá preguntando cada diez segundos. Por eso el script del curso es `eslint . --max-warnings 0`: con cero avisos permitidos, el mismo cambio detiene el comando.

```text
$ npm run lint

> revisor@0.0.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

El criterio del curso para este aviso no cambia en ninguna lección: **se arregla el código, no se silencia la regla.** Aquí el arreglo es devolver `cadaMs` a la lista, que es la verdad: el efecto lo usa. Un comentario `// eslint-disable-next-line` quitaría el aviso y dejaría el defecto exactamente donde estaba.

La segunda figura junta, en un componente de doce renglones, los dos errores clásicos de los hooks. No es parte del `revisor`; se revisa con su propia configuración, igual a la del proyecto sin la regla del XSS:

```tsx
// fig00_02.tsx
import { useEffect, useState } from "react";

export function Resumen({ cadaMs, visible }: { readonly cadaMs: number; readonly visible: boolean }) {
  if (!visible) {
    return null;
  }

  const [vueltas, establecerVueltas] = useState(0);

  useEffect(() => {
    const temporizador = setInterval(() => establecerVueltas((n) => n + 1), cadaMs);
    return () => clearInterval(temporizador);
  }, []);

  return <p>{vueltas} actualizaciones</p>;
}
```
```bash
$ npx eslint fig00_02.tsx

~/curso-react/figuras/fig00_02.tsx
   9:40  error    React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?   react-hooks/rules-of-hooks
  11:3   error    React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
  14:6   warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array                                                                                    react-hooks/exhaustive-deps

✖ 3 problems (2 errors, 1 warning)
```

Los dos errores dicen lo mismo con palabras distintas: React identifica cada `useState` y cada `useEffect` de un componente **por el orden en que se llaman**, no por su nombre. Si en un dibujo `visible` es `false` y el componente sale antes, ese dibujo no llama a ningún hook; si en el siguiente es `true`, sí los llama, y React ya no sabe qué estado le corresponde a cuál. El mensaje incluso adivina la causa: «¿llamaste un hook después de un `return` anticipado?». El arreglo es mover los hooks arriba del `if` y dejar la condición solo para lo que se dibuja. El aviso del tercer renglón es el mismo de `useReporte`. Las soluciones de los ejercicios muestran la versión corregida.

Y las reglas del compilador no se quedan en teoría. Si dentro del efecto de `useReporte` escribieras `establecerCarga({ tipo: "cargando" })` justo al empezar, antes de crear el `AbortController`, el linter respondería así (el mensaje es largo; se muestra completo porque se explica solo):

```text
$ npm run lint

> revisor@0.0.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  18:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/revisor/src/reporte/useReporte.ts:18:5
  16 |
  17 |   useEffect(() => {
> 18 |     establecerCarga({ tipo: "cargando" });
     |     ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  19 |     const control = new AbortController();
  20 |
  21 |     async function pedir(): Promise<void> {  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)
```

Es la regla `set-state-in-effect`. Fíjate en que el `useReporte` original sí llama a `establecerCarga` dentro del efecto, pero **después de un `await`**, cuando la respuesta llegó de fuera: eso es sincronizarse con un sistema externo, y la regla lo permite. Lo que rechaza es cambiar el estado de forma inmediata, en el cuerpo del efecto, porque eso provoca un dibujo extra que nada fuera de React pidió. El panel ya pone `cargando` donde corresponde: en `recargar`, que se ejecuta por un clic. Este es el primer contacto con el criterio del curso sobre los efectos; la Lección 3 lo desarrolla entero.

El punto de control pasa limpio. No es casualidad ni mérito del linter: el código de la lección 9 de TypeScript ya respetaba las reglas. Lo que cambia hoy es que, a partir de aquí, si alguien las rompe, `npm run lint` lo dice y se detiene.

### 0.7 El servidor de práctica y el recorrido completo

El último archivo es el servidor de práctica. El curso es de pantalla y este servidor no se explica renglón por renglón: es un proceso de Node que responde los mismos datos públicos que la API del curso de TypeScript, `GET /api/estados` y `GET /salud`, con cuatro servicios fijos y una demora de 300 ms para que alcances a ver «Cargando…». Usa los tipos de `src/compartido/contrato.ts`, así que si esos tipos cambian, `tsc -b` señala también al servidor. Y escribe una línea por petición, que es lo que usaste en 0.5 para ver las dos peticiones de `StrictMode`.

```ts
// revisor/servidor/practica.ts
// Servidor de práctica del curso de React. Responde los mismos datos públicos que
// la API del curso de TypeScript (GET /api/estados y GET /salud) con datos fijos,
// para que el panel tenga a quién preguntarle. No se explica en el curso: el curso
// es de pantalla. Se arranca con `npm run servidor`.
import { createServer } from "node:http";
import type { ReportePublico } from "../src/compartido/contrato.ts";

const PUERTO = Number(process.env.PUERTO ?? "3100");
const DEMORA_MS = 300;

const reporte: ReportePublico = {
  estados: [
    { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
    { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
    { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
    { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
  ],
};

function registrar(linea: string): void {
  console.log(`${new Date().toISOString().slice(11, 23)} ${linea}`);
}

const servidor = createServer((solicitud, respuesta) => {
  const ruta = new URL(solicitud.url ?? "/", "http://practica.local").pathname;

  respuesta.once("finish", () => {
    registrar(`${solicitud.method ?? "?"} ${ruta} ${respuesta.statusCode}`);
  });
  solicitud.once("close", () => {
    if (!respuesta.writableFinished) {
      registrar(`${solicitud.method ?? "?"} ${ruta} cancelada por el cliente`);
    }
  });

  if (solicitud.method !== "GET") {
    respuesta.writeHead(405, { allow: "GET", "content-type": "application/json; charset=utf-8" });
    respuesta.end(JSON.stringify({ detalle: "método no permitido" }));
    return;
  }

  if (ruta === "/salud") {
    respuesta.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    respuesta.end("ok");
    return;
  }

  if (ruta === "/api/estados") {
    setTimeout(() => {
      if (respuesta.destroyed) {
        return;
      }
      respuesta.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      respuesta.end(JSON.stringify(reporte));
    }, DEMORA_MS);
    return;
  }

  respuesta.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  respuesta.end(JSON.stringify({ detalle: "ruta no encontrada" }));
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  registrar(`servidor de práctica en http://127.0.0.1:${PUERTO}`);
});

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    servidor.close(() => registrar("servidor de práctica detenido"));
    servidor.closeAllConnections();
  });
}
```

El recorrido completo usa dos terminales. En la primera, el servidor de práctica:

```text
$ npm run servidor

> revisor@0.0.0 servidor
> node servidor/practica.ts

07:25:45.111 servidor de práctica en http://127.0.0.1:3100
```

Desde otra terminal, compruébalo antes de mezclarlo con nada más. Si estas tres respuestas no salen así, el problema está en el servidor y no en el panel:

```text
$ curl -s http://127.0.0.1:3100/salud
ok
$ curl -s http://127.0.0.1:3100/api/estados
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},{"nombre":"reportes","tipo":"falla","detalle":"tiempo límite agotado"}]}
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/no-existe
404
```

En la segunda terminal, el servidor de desarrollo:

```text
$ npm run dev

> revisor@0.0.0 dev
> vite


  VITE v8.3.5  ready in 110 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

«Ready in 110 ms»: no empaquetó tu código, por eso tarda tan poco. La última línea dice que el servidor solo escucha en tu máquina; con `--host` se abriría a tu red, y no hace falta. Abre `http://localhost:5173/` en tu navegador. Debes ver el título «Revisor», un «Cargando…» de un instante y cuatro servicios con borde verde o rojo. Esto es lo que entregó Chrome sin ventana después de ejecutar el JavaScript de la página (se muestra solo el contenedor):

```text
<div id="raiz"><main><h1>Revisor</h1><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></main></div>
```

Con la página abierta, haz la prueba que justifica el servidor de desarrollo: cambia en `Panel.tsx` el texto `Revisor` del `<h1>` por `Revisor de servicios` y guarda. La página cambia sola, sin recargar, y la lista sigue ahí: no volvió a pasar por «Cargando…». Es el *Fast Refresh* de 0.1.2. (Esto se comprueba con los ojos, en una ventana de navegador abierta; ninguna herramienta automática del curso lo mide, y las corridas de esta lección, hechas con Chrome sin ventana, tampoco: lo que se afirma aquí es lo que documenta el complemento de React. Regresa el texto al terminar.)

Para terminar, construye y mira la versión que se publicaría. Con el servidor de práctica todavía encendido:

```text
$ npm run build
...
✓ built in 265ms
$ npm run preview

> revisor@0.0.0 preview
> vite preview

  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
```

`http://localhost:4173/` muestra el mismo panel, ahora desde los archivos de `dist/` y sin `StrictMode` activo, que es lo que confirmó la bitácora de 0.5. Apaga todo con Ctrl+C en cada terminal; el servidor de práctica se despide con `servidor de práctica detenido`.

Una última comprobación, la que hace cualquier verificación automática: borrar `node_modules/`, reinstalar exactamente lo del archivo de bloqueo con `npm ci` y repetir. En el contenedor Linux de «Sobre las corridas», desde una copia sin `node_modules/` ni `dist/`, `npm ci`, `npm run lint` y `npm run build` terminaron bien, y la construcción produjo los mismos tres archivos con los mismos nombres (`index-tGGc24Rg.css` e `index-BWNt33lQ.js`). Que el nombre coincida no es un detalle: los nombres de `dist/` salen del contenido, así que si dos máquinas producen los mismos nombres, es muy probable que el paquete sea el mismo (el nombre lleva solo un fragmento del hash del contenido), y si los nombres difieren, el contenido es distinto.

## El error que vas a ver

La lección tiene un error principal, el que nace de que Vite no revisa tipos, y dos de apoyo.

**El error principal: «a mí sí me construye».** Cambia en `Panel.tsx` el tipo de la propiedad `cadaMs` de `number` a `string` y construye de las dos maneras:

```text
$ npx vite build
...
✓ built in 79ms
$ npm run build

> revisor@0.0.0 build
> tsc -b && vite build

src/main.tsx(15,35): error TS2322: Type 'number' is not assignable to type 'string'.
src/reporte/Panel.tsx(46,3): error TS2322: Type 'number' is not assignable to type 'string'.
src/reporte/Panel.tsx(51,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

`vite build` termina con su palomita verde: borró los tipos y empaquetó. `npm run build` se detiene en `tsc -b` con tres errores, y `vite build` ni siquiera empieza. Se lee como cualquier error de TypeScript: archivo, renglón y columna entre paréntesis, código del error y qué no encaja con qué. Los tres errores son el mismo desacuerdo visto desde tres lugares: `main.tsx` pasa un número donde ahora se espera texto, el valor por omisión `10_000` es un número, y `useReporte` recibe texto donde espera un número. El arreglo es devolver el tipo; la lección es otra: **la palomita de Vite dice «empaqueté», no «está bien».** En desarrollo pasa lo mismo, con más peligro: `npm run dev` sirve el archivo con el error y el panel puede incluso funcionar, porque en tiempo de ejecución un número que el tipo llama «texto» sigue siendo un número. Revisa tu editor, y antes de entregar, corre `npm run build`.

**Un error de dedo en una variable.** Escribe `VITE_CADA_MZ` en lugar de `VITE_CADA_MS` en `configuracion.ts`:

```text
$ npx tsc -b
src/configuracion.ts(11,50): error TS2551: Property 'VITE_CADA_MZ' does not exist on type 'ImportMetaEnv'. Did you mean 'VITE_CADA_MS'?
```

Es el trabajo de `strictImportMetaEnv` (0.4). Sin esa línea en `vite-env.d.ts`, el nombre equivocado compilaría, valdría `undefined` en el navegador, `leerCadaMs` usaría el valor por omisión y nadie sabría por qué la variable «no funciona».

**El aviso que no detiene nada.** Es el de 0.6: `exhaustive-deps` es un aviso, ESLint termina con código 0 y una verificación que solo mire el código de salida dice «limpio». La señal para reconocerlo es el renglón `✖ 1 problem (0 errors, 1 warning)` seguido de nada. Con `--max-warnings 0` aparece además `ESLint found too many warnings (maximum: 0).` y el comando falla.

## Lo que se hace mal

**Correr solo `vite build` o solo `npm run dev`.** Ninguno de los dos revisa tipos. Un flujo que no pasa por `tsc -b` puede entregar un paquete con errores de tipo; por eso el script `build` empieza con él.

**Poner un secreto en una variable `VITE_`.** Cualquier variable `VITE_` puede quedar escrita en el JavaScript público (la que el código lee, seguro; todas, si una línea lee el objeto entero), como viste con `grep`. Cambiarle el nombre a la variable para que no lo lleve no lo vuelve seguro: si el navegador lo necesita, el navegador lo tiene. Las claves viven en un servidor.

**Abrir CORS con `*` en la API para que funcione en desarrollo.** Resuelve una molestia de tu máquina con una decisión de seguridad que afecta a todos. En desarrollo, el *proxy* de Vite elimina el problema sin tocar la API.

**Quitar `StrictMode` porque «hace dos peticiones».** La segunda petición es la prueba de que la limpieza del efecto funciona, y en producción no existe. Quitarlo esconde justo los errores que vino a mostrar.

**Silenciar el linter.** Un `// eslint-disable-next-line react-hooks/exhaustive-deps` deja el efecto con una lista de dependencias que miente, y el defecto sigue ahí con el aviso apagado. Si la regla se queja, cambia el código.

**Dejar que los avisos pasen.** Sin `--max-warnings 0`, un aviso de dependencias no detiene nada y, con el tiempo, nadie lee la salida del linter porque «siempre tiene algo».

**Subir `node_modules/` o `dist/` al repositorio.** Se reconstruyen idénticos con `npm ci` y `npm run build`. Lo que sí se sube es `package-lock.json`, que es lo que permite reconstruirlos.

**Dependencias sin versión exacta.** Con `^` en `package.json`, dos personas que instalan con días de diferencia pueden tener versiones distintas. El archivo de bloqueo ayuda, pero solo si se sube y se instala con `npm ci`.

**Dejar que Vite cambie de puerto en silencio.** Sin `strictPort`, un servidor olvidado en 5173 hace que el nuevo arranque en 5174, y terminas mirando la versión vieja. Con `strictPort: true`, el segundo se niega a arrancar.

## Ejercicios

### Ejercicio 1 — Cambia el intervalo sin tocar el código

Haz que el panel se actualice cada 3 segundos sin editar ningún archivo de `src/`. **Antes de hacerlo, predice** cuántas líneas `GET /api/estados 200` escribe el servidor de práctica en los 10 segundos siguientes a abrir la página con `npm run dev`. Haz la prueba con dos mecanismos distintos: definiendo la variable en la terminal y creando un archivo `.env.local`. ¿Cuál de los dos gana si están los dos? ¿Por qué `.env.local` no se debe subir al repositorio, y qué renglón del `.gitignore` lo impide?

### Ejercicio 2 — Arregla la figura 2

Corrige `fig00_02.tsx` para que `npx eslint fig00_02.tsx` no informe nada y el componente siga sin dibujar nada cuando `visible` es `false`. Antes de escribir, explica en tu bitácora por qué mover el `if` debajo de los hooks no cambia lo que la persona ve.

### Ejercicio 3 — El *proxy* que falta

Agrega al `vite.config.ts` lo necesario para que `curl http://localhost:5173/salud` responda `ok`. **Antes**, predice qué responde hoy esa misma petición y por qué no es un 404 de la API. Comprueba tu predicción antes de cambiar nada.

### Ejercicio 4 — La limpieza que falta

En `useReporte`, borra temporalmente la línea `control.abort();` de la limpieza del efecto. Con el servidor de práctica y `npm run dev` encendidos, abre la página y lee la bitácora del servidor. ¿Qué cambió respecto a 0.5? ¿Qué te dice eso sobre lo que `StrictMode` estaba comprobando? ¿Te avisa el linter? Restaura la línea al terminar.

## Soluciones

### Solución 1

En la terminal, la variable va delante del comando y vale solo para ese proceso:

```bash
VITE_CADA_MS=3000 npm run dev
```

Con `.env.local`, el archivo lleva una línea, `VITE_CADA_MS=3000`, y Vite lo lee al arrancar (si el servidor ya estaba encendido, reinícialo). La predicción: en 10 segundos, la petición del montaje más una cada 3 segundos, es decir, cuatro respuestas `200`, **más**, si la conexión alcanza a llegar al servidor antes del aborto (0.5), una línea `cancelada por el cliente` al principio, que es el ciclo extra de `StrictMode`. Así salió medido con Chrome sin ventana durante 10 segundos de su reloj interno: una cancelada y cuatro `200`. Si están las dos fuentes, gana la terminal: la documentación de Vite dice que las variables que ya existen cuando Vite arranca no se sobrescriben con los archivos `.env`. `.env.local` existe precisamente para valores de tu máquina, y el renglón `*.local` del `.gitignore` impide que se suba. Al terminar, borra el archivo para que tu proyecto vuelva a coincidir con el punto de control.

### Solución 2

Los hooks van primero y la condición solo decide qué se dibuja; la lista de dependencias nombra lo que el efecto usa:

```tsx
// fig00_02.tsx corregida (fragmento)
export function Resumen({ cadaMs, visible }: { readonly cadaMs: number; readonly visible: boolean }) {
  const [vueltas, establecerVueltas] = useState(0);

  useEffect(() => {
    const temporizador = setInterval(() => establecerVueltas((n) => n + 1), cadaMs);
    return () => clearInterval(temporizador);
  }, [cadaMs]);

  if (!visible) {
    return null;
  }

  return <p>{vueltas} actualizaciones</p>;
}
```

Lo que la persona ve no cambia, porque el `return null` sigue ocurriendo antes de dibujar el párrafo. Lo que cambia es que los dos hooks se llaman en todos los dibujos, en el mismo orden, y React puede emparejarlos con su estado. Nota una consecuencia que vale la pena discutir en tu bitácora: con `visible` en `false`, el temporizador sigue contando aunque no se vea nada. Si eso no es lo que quieres, la solución no es volver a poner el `if` arriba, sino que quien usa `Resumen` no lo dibuje: `{visible && <Resumen cadaMs={5000} />}` (cuidado con esa forma cuando la condición sea un número: es la trampa del `0` de la [Lección 1](01-componentes-puros-composicion.md)).

### Solución 3

Hoy, `curl http://localhost:5173/salud` no llega a la API: la ruta no empieza con `/api`, así que la atiende Vite. Para un servidor de desarrollo de una aplicación de una sola página, una ruta desconocida no es un error: responde con `index.html`, para que el enrutador del cliente decida (la Lección 5 vuelve sobre esto). Recibirás el HTML de la página, con código 200, no `ok`. Compruébalo antes de cambiar nada; es una buena costumbre no fiarse de la predicción. Para reenviarla, agrega otra clave:

```ts
// vite.config.ts (fragmento)
proxy: {
  "/api": "http://127.0.0.1:3100",
  "/salud": "http://127.0.0.1:3100",
},
```

Reinicia `npm run dev` para que tome la configuración nueva, y la respuesta será `ok`. Este ejercicio es la razón de la recomendación de 0.3: si todas las rutas de la API vivieran bajo `/api`, una sola clave bastaría.

### Solución 4

Sin `control.abort()`, la bitácora deja de mostrar la línea `cancelada por el cliente`: ahora aparecen **dos** `GET /api/estados 200` al abrir la página. La primera petición, la del montaje que `StrictMode` deshizo, ya nadie la cancela; llega su respuesta y escribe el estado de un efecto que ya se había limpiado. En este panel no se nota a simple vista, porque las dos respuestas son iguales, pero si la primera fuera más lenta y trajera datos viejos, pisaría a la segunda: es la carrera de respuestas que la Lección 3 reproduce y arregla. `StrictMode` estaba comprobando justo eso, que la limpieza deshace lo que el efecto empezó. ¿Y el linter? No dice nada: la limpieza que falta no rompe ninguna regla que pueda verse en el texto del código. Por eso `StrictMode` y el linter son dos defensas distintas, y el curso usa las dos.

## Cómo sé que lo logré

- [ ] `node -v` imprime una versión que empieza con `v24`, y `npx tsc --version`, dentro de `~/curso-react/revisor/`, imprime `Version 7.0.2`.
- [ ] Con el servidor de práctica encendido, `curl -s http://127.0.0.1:3100/salud` responde `ok`, y `curl -s http://localhost:5173/api/estados` (con `npm run dev` encendido) responde el JSON de los cuatro servicios.
- [ ] Abrir `http://localhost:5173/` muestra el título «Revisor» y cuatro servicios, y la bitácora del servidor de práctica registra un `200` al abrir la página. Si además aparece una `cancelada por el cliente` antes, sabes leerla como el ciclo extra de `StrictMode`; si no aparece, sabes por qué eso no significa que esté apagado (0.5).
- [ ] Con la versión construida (`npm run preview`, en `http://localhost:4173/`), la misma página produce una sola petición en la bitácora.
- [ ] `npm run lint` termina sin escribir ningún problema, y al quitar `cadaMs` de la lista de dependencias de `useReporte` falla con `ESLint found too many warnings (maximum: 0).`
- [ ] `npm run build` termina con `✓ built` y deja en `dist/` un `index.html`, un `.css` y un `.js`; al cambiar un tipo a propósito, se detiene en `tsc -b` y `vite build` no llega a ejecutarse.
- [ ] Puedes mostrar con `grep` sobre `dist/` que el valor de `VITE_CADA_MS` viaja dentro del JavaScript, y explicar por qué eso descarta poner ahí un secreto.
- [ ] `git status` dentro del proyecto no muestra `node_modules/` ni `dist/` como archivos por agregar.
- [ ] Anotaste en tu [bitácora](bitacora.md) tus versiones, lo que cambió respecto al empaquetado con esbuild y el primer aviso que te dio el linter.

## Resumen

Responde sin mirar la lección:

1. ¿Qué dos trabajos distintos hace Vite y cuál de los dos empaqueta? ¿Por qué el servidor de desarrollo no necesita empaquetar?
2. ¿Por qué el script `build` empieza con `tsc -b`? ¿Qué pasa si solo corres `vite build` con un error de tipos?
3. ¿Qué revisa `tsconfig.app.json` y qué revisa `tsconfig.node.json`? ¿Por qué uno tiene `DOM` y el otro no?
4. ¿Por qué con `"moduleResolution": "bundler"` ya no escribes `.js` al final de los `import`?
5. ¿Qué es un origen? ¿Por qué el panel en el puerto 5173 no puede leer una respuesta del puerto 3100, y cómo lo resuelve el *proxy* sin tocar la API?
6. ¿Qué variables llegan a `import.meta.env`, cuándo se reemplaza su valor y por qué ahí no va ningún secreto?
7. ¿Qué hace `StrictMode` con los efectos en desarrollo, y qué demuestra la línea `cancelada por el cliente` en la bitácora?
8. ¿Qué revisan `rules-of-hooks` y `exhaustive-deps`? ¿Por qué el curso corre ESLint con `--max-warnings 0`?

## Para leer más

- [Vite, «Getting Started»](https://vite.dev/guide/): cómo crear un proyecto, la lista de plantillas, la versión de Node que pide y por qué `index.html` es la entrada. Consultado el 21 de octubre de 2026.
- [Vite, «Why Vite»](https://vite.dev/guide/why): los problemas que resuelve el servidor de desarrollo y por qué se empaqueta para producción; Rolldown y Oxc. Consultado el 21 de octubre de 2026.
- [Vite, «Announcing Vite 8»](https://vite.dev/blog/announcing-vite8): Rolldown como único empaquetador, desde el 12 de marzo de 2026. Consultado el 21 de octubre de 2026.
- [Vite, «Dependency Pre-Bundling»](https://vite.dev/guide/dep-pre-bundling): por qué Vite preempaqueta las dependencias en desarrollo, y que lo hace con Rolldown. Consultado el 21 de octubre de 2026.
- [Vite, «Features»](https://vite.dev/guide/features): TypeScript sin revisión de tipos, `isolatedModules`, los tipos de `vite/client` y la importación de CSS. Consultado el 21 de octubre de 2026.
- [Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode): el prefijo `VITE_`, el orden de los archivos `.env`, la advertencia sobre información sensible y los tipos con `strictImportMetaEnv`. Consultado el 21 de octubre de 2026.
- [Vite, «Server Options»](https://vite.dev/config/server-options) y [«Preview Options»](https://vite.dev/config/preview-options): `server.proxy`, `server.port`, `strictPort` y el *proxy* heredado por `vite preview`. Consultado el 21 de octubre de 2026.
- [Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy): por qué `vite preview` no es un servidor de producción. Consultado el 21 de octubre de 2026.
- [vite-plugin-react, `@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react): *Fast Refresh*, el *runtime* automático de JSX y la opción del compilador. Consultado el 21 de octubre de 2026.
- [React, «StrictMode»](https://react.dev/reference/react/StrictMode): las comprobaciones de desarrollo, el ciclo extra de los efectos y por qué no afectan la construcción. Consultado el 21 de octubre de 2026.
- [React, «eslint-plugin-react-hooks»](https://react.dev/reference/eslint-plugin-react-hooks): la configuración recomendada, las reglas de los hooks y las del compilador. Consultado el 21 de octubre de 2026.
- [React, «Build a React app from Scratch»](https://react.dev/learn/build-a-react-app-from-scratch) y [«Sunsetting Create React App»](https://react.dev/blog/2025/02/14/sunsetting-create-react-app): cuándo conviene una herramienta como Vite, y el retiro de Create React App. Consultado el 21 de octubre de 2026.
- [MDN, «Cross-Origin Resource Sharing (CORS)»](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS): la política del mismo origen para `fetch()` y el encabezado `Access-Control-Allow-Origin`. Consultado el 21 de octubre de 2026.
- [TypeScript, «TSConfig Reference»](https://www.typescriptlang.org/tsconfig/): `moduleResolution`, `noEmit`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly` y las referencias de proyecto. Consultado el 21 de octubre de 2026.
- [typescript-eslint, «Dependency Versions»](https://typescript-eslint.io/users/dependency-versions/): las versiones de TypeScript y ESLint que soporta. Consultado el 21 de octubre de 2026.
- [Node.js, «Modules: TypeScript»](https://nodejs.org/api/typescript.html), [«Download»](https://nodejs.org/en/download) y [«Previous Releases»](https://nodejs.org/en/about/previous-releases): ejecutar `.ts` directamente con Node y sus condiciones; las versiones de la línea 24 LTS. Consultado el 21 de octubre de 2026.

### Términos de esta lección

| Término | Qué significa |
|---|---|
| servidor de desarrollo | el proceso que arranca `npm run dev`: sirve cada módulo por separado, traducido al vuelo, y avisa al navegador cuando un archivo cambia |
| HMR / *Fast Refresh* | reemplazar en la página solo el módulo que cambió, sin recargar; en React conserva el estado de los componentes que no cambiaron |
| construcción | lo que hace `npm run build`: revisar tipos y empaquetar en `dist/` los archivos que se publican |
| referencias de proyecto | varios `tsconfig` pequeños que `tsc -b` revisa por separado, cada uno con sus reglas |
| origen | la combinación de esquema, servidor y puerto de una dirección; dos puertos distintos son dos orígenes |
| política del mismo origen | la regla del navegador que impide a un script leer respuestas de otro origen, salvo que la respuesta lo permita con CORS |
| *proxy* (de desarrollo) | el reenvío que hace Vite de ciertas rutas hacia otro servidor, para que el navegador vea un solo origen |
| variable `VITE_` | configuración que Vite escribe dentro del código del cliente; pública por definición |
| `StrictMode` | componente de React que, solo en desarrollo, dibuja dos veces y ejecuta un ciclo extra de cada efecto para destapar errores |
| `--max-warnings 0` | opción de ESLint que hace fallar el comando si hay al menos un aviso |

---

**Siguiente:** [Lección 1 — Componentes puros y composición](01-componentes-puros-composicion.md)
