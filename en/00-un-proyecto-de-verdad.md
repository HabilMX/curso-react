# Lesson 0 — A Real-World Project: Vite, StrictMode, and the Linter

*It is 9:40 AM and the review with the operations team is at 10:00. Yesterday you changed a single line in the `revisor` dashboard: you removed a dependency from a `useEffect` because it was "unnecessary." On your machine it looks perfect. Your coworker opens it on hers, changes the refresh interval to five seconds for the demo... and the dashboard keeps polling every ten, as if it had not heard her. Nobody knows why. In that same change, someone left—"just to test"—an API key for the monitoring provider in a variable that starts with `VITE_`, and the bundle has already been published to the staging server. Twenty minutes remain. Both failures had warnings: a tool that was not installed and a rule nobody knew. This lesson installs the tool and explains the rule.*

**Time:** 2 × 45 min (the natural break is between sections 0.3 and 0.4)

**What you build:** the dashboard from lesson 9 of the TypeScript course, migrated to a Vite project: with a development server, a proxy to the API, a `VITE_` configuration variable, `StrictMode` enabled, the React linter active, and the course practice server so the dashboard has something to query

**What you learn:** what Vite adds on top of a hand-rolled bundler; the `react-ts` template, its three `tsconfig` files, and feature-based folder structure; the proxy to the API (no CORS in development); `VITE_` variables and why no secret belongs there; `eslint-plugin-react-hooks` enabled from day one

**Where you are coming from.** From lesson 9 of this school's [TypeScript course](https://github.com/HabilMX/curso-typescript), or a similar place: a working React dashboard. That dashboard has a `Panel` component, a custom `useReporte` hook that requests `GET /api/estados` with an `AbortController`, a network boundary `cargar.ts` that validates the response with `esReportePublico`, and a `cliente.tsx` that mounts it. It was bundled with a one-line esbuild command and served by the same Node process that answered the API. If you did not take that course, it does not matter: all the dashboard code appears complete in this lesson, and the course includes a practice server that fulfills the same contract. You work in a new folder, `~/curso-react/revisor/`.

**What this lesson does not do.** It does not change what the dashboard does: not a new screen, not a new state, not a new rule. The React code is the same as in TypeScript lesson 9, with two small changes explained where they appear. Nor does it explain Effects or StrictMode in depth: here you turn them on and see what they do; [Lesson 3](03-effects-sincronizar.md) breaks them down piece by piece. It publishes nothing: the content security policy (CSP), rewriting to `index.html`, and the production server arrive in [Lesson 9](09-rendimiento-publicacion.md). And it does not have automated tests yet: Vitest and Testing Library arrive in [Lesson 8](08-pruebas-de-componentes.md).

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 (the most recent LTS version on that day) and npm 11.19.1, on macOS, with the exact versions pinned in this lesson's `package.json`. Because the course assumes Linux Mint, the checkpoint was reinstalled from scratch with `npm ci` inside a Linux container (Debian 12 with the official `node:24.22.0` image), and there `npm run lint` and `npm run build` produced the same output, with the same file names in `dist/`. It was not run on a physical Linux Mint, but nothing shown depends on the system, except for the word `darwin-arm64` in `vite --version`, which on your Mint will say `linux-x64`. What is seen "in the browser" was measured with headless Chrome (`--headless`), which loads the page, executes its JavaScript, and delivers the resulting document: it is a real browser, not a simulation. The long paths printed by ESLint and Vite are shown starting from `~/curso-react`. Practice server log times are in UTC. The programs are in [`programas/00-un-proyecto-de-verdad/`](../programas/00-un-proyecto-de-verdad), in the course repository: `revisor/` is the checkpoint and the figures sit alongside it.

## By the end you will be able to

- Create a project with Vite's `react-ts` template, pin its dependencies to exact versions, and explain what each of its three `tsconfig` files is for.
- Explain the difference between `npm run dev` and `npm run build`, and demonstrate with a type error that Vite translates TypeScript but does not check it.
- Configure a proxy in `vite.config.ts` and explain, with `curl`'s response in plain view, why with it the browser does not need CORS in development.
- Read a `VITE_` variable from `import.meta.env`, type it, and verify with `grep` on `dist/` that its value travels written directly into the JavaScript that anyone can download.
- Recognize in the server log the second request caused by `StrictMode` in development, and explain why it does not appear in the built version.
- Enable `eslint-plugin-react-hooks`, make a warning stop `npm run lint`, and read warnings from `rules-of-hooks`, `exhaustive-deps`, and `set-state-in-effect`.

## The why before the how

The dashboard from lesson 9 of TypeScript works, and it works for good reasons: the contract is validated, the effect cleans up, the API failure is displayed as a failure. What it does not have is a **project** around it. Ask that dashboard four questions and you will see the gaps.

**How long does it take you to see a change?** Every time you touched `Panel.tsx`, you had to bundle again with esbuild, restart the Node server, and reload the page. That is fifteen seconds, a hundred times a day. A development server that watches your files and notifies the browser which module changed turns those fifteen seconds into less than one, and preserves the screen's state in the process.

**How do you talk to the API if they do not live in the same process?** In TypeScript, the page and the API came from the same server, the same origin, which is why `fetch("/api/estados")` worked without configuring anything. As soon as you separate the UI (now served by a development tool on one port) from the API (still on another), the browser starts enforcing the same-origin policy and the request is blocked. There are two ways out: opening CORS on the API, which is a security decision that does not belong to the UI, or having the development tool forward those requests so the browser sees a single origin again. This lesson takes the second.

**Where does configuration go?** The refresh interval was hardcoded in the code, `10_000`. Changing it for a demo required editing a file. Build tools offer environment variables, but on a browser page "environment variable" means something very different than on a server, and confusing the two is the most common way to leak an API key.

**Who warns you when you break a React rule?** The TypeScript compiler checks types; it does not know that a hook cannot be called after a `return`, nor that an effect's dependency list must name what the effect uses. Lesson 9 of TypeScript said it explicitly: "ESLint, in this project, does not check dependency lists; the official package that does so is `eslint-plugin-react-hooks`, and it is a good next installation." That next installation is today, and it is the first one in this course, because **a principle the course repeats in every lesson—if the linter complains, you change the code—only makes sense if the linter is enabled from day one.**

The four answers fit into one tool and two switches. The tool is **Vite**, the one the React team itself suggests when you want to build an application without a framework ([React, "Build a React app from Scratch"](https://react.dev/learn/build-a-react-app-from-scratch)) and the one that replaced Create React App, which the React team retired for new projects on February 14, 2025 ([React, "Sunsetting Create React App"](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)). The switches are **`StrictMode`**, which makes React put your components to the test while you develop, and **`eslint-plugin-react-hooks`**, which checks React rules before executing anything.

The lesson has seven parts: what Vite is and what it does (0.1); the project, its `tsconfig` files, and its folders (0.2); the proxy (0.3); `VITE_` variables (0.4); `StrictMode` (0.5); the linter (0.6); and the full tour with the practice server (0.7). At the end, this is what you will see, and you will know where every line comes from:

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

## The concepts

### 0.1 What Vite does that the hand-rolled bundler did not

#### 0.1.1 Two different jobs under the same name

The esbuild command from lesson 9 of TypeScript did a single job: take `cliente.tsx`, follow its `import`s, bundle everything into `cliente.js`, and write it to disk. Vite does **two different jobs**, and almost everything you will read about it is easier to understand if you separate them:

1. **The development server** (`npm run dev`). It does not bundle your code into a file. It serves each module of your code separately, when the browser requests it, translated on the fly from TypeScript and JSX to JavaScript. Modern browsers know how to load JavaScript modules (`<script type="module">` and their `import`s) without help, so bundling is not necessary for development. That is why it starts in an instant regardless of project size, and that is why, when you change a file, only that module is sent again: this is **Hot Module Replacement** (HMR), which in React is called *Fast Refresh* and preserves the state of components that did not change ([Vite, "Why Vite"](https://vite.dev/guide/why)). For **dependencies** (what lives in `node_modules/`, like `react`), it does make an exception: it **pre-bundles** them once, at startup, to convert those in the old Node format (CommonJS) into JavaScript modules and to ensure that a library made of hundreds of internal files reaches the browser in a single request rather than hundreds. That pre-bundling happens only in development and does not touch your code ([Vite, "Dependency Pre-Bundling"](https://vite.dev/guide/dep-pre-bundling)).
2. **The build** (`npm run build`). Here it does bundle, because serving hundreds of individual modules in production forces the browser to make a request for every nested `import`. The result is a `dist/` folder with an `index.html`, a JavaScript file, and a stylesheet with names that change whenever their contents change.

Since Vite 8, released on March 12, 2026, both jobs are handled by the same component: **Rolldown**, a bundler written in Rust, with **Oxc** to parse, transform, and minify the code. Previously, Vite used esbuild in development and Rollup for building, and keeping them in agreement required glue code ([Vite, "Announcing Vite 8"](https://vite.dev/blog/announcing-vite8)). For you, the practical consequence is simple: what you see in development and what gets built pass through the exact same translation rules.

#### 0.1.2 index.html is the entry point

In lesson 9 of TypeScript, the page was a text string inside `pagina.ts`, and pointed to a `/cliente.js` that had to exist beforehand. In Vite, it is the other way around: **`index.html` lives at the root of the project and is the starting point.** Vite reads it, finds `<script type="module" src="/src/main.tsx">`, and from there follows the `import`s ([Vite, "Getting Started"](https://vite.dev/guide/)). You point to the TypeScript file, not to a bundled result; Vite ensures the browser receives JavaScript.

You can see it with your own eyes. With the development server running, request the page with `curl`:

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

It is your `index.html` with two additions you did not write: `/@vite/client`, the piece that keeps a connection open to the server to find out which file changed, and `/@react-refresh`, the one that allows replacing a component without losing the state of the others. That second one is injected by `@vitejs/plugin-react`, the official Vite plugin for React, which also transforms JSX using the automatic runtime, the same `react-jsx` mode you used with `tsc` ([vite-plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)). None of this appears in `dist/`: it is strictly for development.

#### 0.1.3 Vite translates TypeScript, but does not check it

This is the sentence most worth remembering from this section: **Vite strips types without checking them.** Its documentation says so in all caps: it only translates `.ts` files and "DOES NOT" perform type checking; that task is left to the editor and the build process ([Vite, "Features", TypeScript](https://vite.dev/guide/features)). It is exactly what happened with esbuild in lesson 9 of TypeScript, and it has the same consequence: if someone only runs the bundling tool, they can ship a program with type errors.

That is why the template's `build` script is not just `vite build`, but `tsc -b && vite build`. First, the TypeScript compiler checks everything; if it finds an error, the `&&` prevents the build from even starting. In "The error you will see", you will trigger this on purpose to see the two outputs side by side. And in development, while `npm run dev` is running, type errors **do not appear in the terminal or in the browser**: you see them in your editor, or when you run `npm run build`.

### 0.2 The project: the template, its tsconfigs, and its folders

#### 0.2.1 What the template brings, and what is changed

The official way to start is `npm create vite@latest`. With a name and a template, it asks no questions. This course pins the version of the scaffolding tool so your result matches the lesson:

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

The two standalone dashes (`--`) separate npm's options from the creator's options; without them, npm would capture `--template`. The `react-ts` template leaves a folder with `index.html`, `vite.config.ts`, three `tsconfig` files, a `package.json`, a `src/` folder with an example counter, and a `public/` folder for files that are copied as-is. Measured on that day, its `package.json` came with three decisions that this course changes, and it pays to state them out loud so you are not surprised if you compare:

- **Versions with `^` and `~`.** The template writes `"vite": "^8.3.4"`, which lets npm install any newer 8.x. The course pins every dependency with its exact version, verified with `npm view` on the day of the run: so what you see here is what you install. The lockfile, `package-lock.json`, also stores the exact resolution of everything those dependencies pull in.
- **The linter.** This month's template includes **Oxlint**, a very fast linter written in Rust, with some React rules. The course uses ESLint with `eslint-plugin-react-hooks`, which is the package published by the React team itself to enforce its rules ([React, "eslint-plugin-react-hooks"](https://react.dev/reference/eslint-plugin-react-hooks)) and the one that includes the React Compiler diagnostics used in Lesson 9. Oxlint is not a bad choice; it is another choice, and mixing two linters in a course creates noise. The scaffolding tool has an `--eslint` option that swaps Oxlint for ESLint, but it was measured on the same day and adds `eslint-plugin-react-refresh` and `globals`, two packages this course does not use; that is why here it is created without that option and Oxlint is removed by hand, as explained below.
- **TypeScript.** The template pins TypeScript 6. The TypeScript course works with TypeScript 7, and here it is kept the same as there: TypeScript 7 is the one that checks types (`tsc`), and TypeScript 6 stays, under the name `typescript`, solely so ESLint can read `.ts` files. The reason is measurable: `typescript-eslint` declares that it supports TypeScript `>=4.8.4 <6.1.0` ([typescript-eslint, "Dependency Versions"](https://typescript-eslint.io/users/dependency-versions/)), so it does not yet run with 7. They are two distinct roles; do not swap one for the other.

If you did not take the TypeScript course, there is no need to understand the alias trick to follow along: it is enough to know that `npx tsc --version` reports `Version 7.0.2` and that `npx tsc6 --version` exists only for ESLint. A curious detail that was measured: the package `@typescript/typescript6` is at version 6.0.2, but its executable responds `Version 6.0.3`. It affects nothing; I note it because if you see it, it is not your error.

This lesson's checkpoint does not keep the example counter or the `public/` folder: their files are replaced with those of the dashboard. Before installing anything, remove what the template brings for Oxlint so your project ends up matching the course: delete the `.oxlintrc.json` file, delete the `"oxlint"` line from `devDependencies` in `package.json`, and leave its `scripts` block identical to the one shown below (the template's `lint` script says `oxlint`; the course's says `eslint . --max-warnings 0`, and `servidor` is added). The dependencies are installed like this, in two commands, from `~/curso-react/revisor/`:

```bash
npm install --save-exact react@19.3.1 react-dom@19.3.1
npm install --save-dev --save-exact vite@8.3.5 @vitejs/plugin-react@6.1.2 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.2 "@typescript/native@npm:typescript@7.0.2" "typescript@npm:@typescript/typescript6@6.0.2" eslint@10.13.0 @eslint/js@10.0.1 typescript-eslint@8.72.0 eslint-plugin-react-hooks@7.1.1
```

Notice a difference from lesson 9 of TypeScript: there, React was in `devDependencies` because the production server did not import it. Here it goes in `dependencies`, just as the template places it. For an application that is built and served as static files, the difference does not change the result (everything ends up inside the JavaScript in `dist/`); it is a convention that separates "what travels to the browser" from "what you only use to build."

The checkpoint's `package.json` looks like this:

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

Five scripts, five jobs. `dev` starts the development server. `build` checks types and builds. `lint` runs ESLint with `--max-warnings 0`, explained in 0.6. `preview` serves what was left in `dist/` so you can view it before publishing (and only for that: Vite's documentation states that it is intended for previewing the build on your machine and is not a production server, [Vite, "Deploying a Static Site"](https://vite.dev/guide/static-deploy)). And `servidor` starts the practice server, introduced in 0.7.

Before moving on, a non-negotiable habit: `node_modules/` is never committed to a repository. It contains tens of megabytes that `npm ci` reconstructs identically from `package-lock.json`. The template brings a `.gitignore` that already excludes it, along with `dist/` and `*.local` files; keep it, and if you assemble the project by hand, create it before the first `git add` with at least those three lines: `node_modules`, `dist`, and `*.local`. In the course repository, the `revisor/` folder does not bring its own `.gitignore`: the ten checkpoints live in a single repository and the root `.gitignore` covers them all. What does get committed is `package-lock.json`.

#### 0.2.2 Three tsconfigs, because there are two worlds

In lesson 9 of TypeScript, a single `tsconfig.json` checked both the server and the dashboard at the same time, and the lesson itself pointed out the cost: the server code also "saw" `document`, and an oversight would compile and fail at runtime. Vite's template separates the two worlds with **project references**: small TypeScript projects that are checked separately, each with its own rules ([TypeScript, "TSConfig Reference"](https://www.typescriptlang.org/tsconfig/)). The root file checks nothing; it only lists the other two:

```json revisor/tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsc -b` (for *build*) traverses those references and checks each one. The first is for the browser, `tsconfig.app.json`, and covers `src/`:

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

What matters in this file fits into five ideas:

- **`"lib": ["ES2023", "DOM"]` and `"types": ["vite/client"]`.** Here `document` and `window` do exist, as well as the types Vite adds to the browser, such as `import.meta.env` ([Vite, "Features", Client Types](https://vite.dev/guide/features)). In the other project, they will not exist.
- **`"noEmit": true`.** TypeScript does not write any `.js`: it only checks. The translation is done by Vite. TypeScript's documentation describes this option precisely this way: it leaves room for another tool to convert the code ([TypeScript, `noEmit`](https://www.typescriptlang.org/tsconfig/#noEmit)).
- **`"moduleResolution": "bundler"`.** This is the way to resolve `import` statements designed for bundlers, and unlike `nodenext`, **it never requires file extensions** in relative paths ([TypeScript, `moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution)). This is the first of two changes to the code from lesson 9: there you wrote `import { Panel } from "./Panel.js"`, with a `.js` that did not exist on disk because Node required it; here you write `from "./Panel"`.
- **`verbatimModuleSyntax` and `isolatedModules`.** Vite transforms each file separately without looking at the others, and therefore does not know whether what you import is a type or a value. With `verbatimModuleSyntax`, TypeScript forces you to mark with `type` whatever is only a type, so the transformer can remove it without hesitation ([TypeScript, `verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax)); with `isolatedModules`, it warns you if you write something that a single-file transformer cannot interpret correctly. Vite's documentation explicitly asks for this second option ([Vite, "Features"](https://vite.dev/guide/features)). The template does not include it; the checkpoint adds it because the official source requires it.
- **`"strict": true`.** This does not come in this month's template either, and the TypeScript course took it for granted starting in lesson 2. Without it, `null` and `undefined` slip into places they should not.

The second project, `tsconfig.node.json`, is for things that run in Node: Vite's configuration and the practice server.

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

Here there is no `DOM`: if the practice server wrote `document`, `tsc -b` would reject it. And two options appear that relate to a new capability in Node: since version 24.12.0, running a `.ts` file directly with `node file.ts` is stable. Node does not check types, it only replaces them with whitespace, and therefore sets two conditions: that imports include their `.ts` extension and that the file does not use TypeScript syntax that generates code, such as `enum` ([Node.js, "Modules: TypeScript"](https://nodejs.org/api/typescript.html)). `allowImportingTsExtensions` allows the first; `erasableSyntaxOnly` makes `tsc` enforce the second ([TypeScript, `erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)). That is why `npm run servidor` is `node servidor/practica.ts`, without compiling anything beforehand.

Vite's configuration is short. The proxy it contains is explained in 0.3:

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

`port: 5173` is the port Vite uses anyway; writing it makes it explicit. `strictPort: true` changes what happens if that port is occupied: without that option, Vite silently tries the next available port ([Vite, "Server Options"](https://vite.dev/config/server-options)), and you would find yourself with two forgotten dev servers on 5173 and 5174 without knowing which one you are looking at. With it, Vite refuses to start and tells you so.

#### 0.2.3 The folders: by feature, not by file type

There are two common ways to organize `src/`. One groups by file type: a `components/` folder, another `hooks/`, another `services/`. The other groups by **feature**: everything needed to "view the status report" lives together, whether component, hook, or networking function. This course uses the second, and it is our own design choice, not a React rule (React documentation imposes no specific structure). The reason is practical: when you change how the report looks, you open one folder, not three. And as the `revisor` grows—service detail in Lesson 5, registration in Lesson 7—each new feature will be a new folder, not another file in each of the usual ones.

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

`src/reporte/` is the feature. `src/compartido/` holds what several use: today, only the contract. The remaining files in `src/` are those touching the entire application: bootstrapping and configuration. This is the contract, the same one from lesson 8 of TypeScript; the only change is that `esRegistro` now lives right here, because the server configuration file from which it was imported is not part of this project:

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

The network boundary contains the second change. In TypeScript, `cargarReporte` took a second parameter, `base`, which the tests used to point to a local server with its full address. Here the browser always requests the relative path `/api/estados` and it is the proxy that decides where it goes, so that parameter is redundant and removed. Removing it leaves the function matching the exact shape of the `Cargar` type, and `main.tsx` can pass it as-is, without wrapping it in an arrow function:

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

The hook and component arrive with no logic changes; only their `import`s change. The component also imports its stylesheet: in Vite, `import "./panel.css"` is all it takes for the CSS to reach the page. In development, it is injected with a `<style>` tag that is replaced via HMR when you edit the file, and when building it is bundled into a separate `.css` file ([Vite, "Features", CSS](https://vite.dev/guide/features)). In TypeScript you passed the stylesheet to esbuild as a second entry; here the stylesheet travels with the component that uses it, which is the exact idea of grouping by feature.

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

The HTML page and the entry script conclude the tour. `index.html` is the template's with three changes: the language, the title, and the container identifier, which remains `raiz` to avoid touching the code looking for it. `main.tsx` is TypeScript's `cliente.tsx` with two additions: `StrictMode`, explained in 0.5, and the interval read from configuration, explained in 0.4.

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

Notice something that lesson 9 of TypeScript took care of and is preserved here: `cargarReporte` is a function declared at the module level, so it is the same across every render. `useReporte` has it in its dependency list; if it changed on every render, the effect would re-run on every render.

### 0.3 The proxy: a single origin during development

Up to this point there are two processes: Vite's development server at `http://localhost:5173` and the API (the practice server) at `http://127.0.0.1:3100`. For the browser, those are **two origins**, because an origin is the combination of scheme, host, and port, and here both the host and port differ. The rule that applies is called the **same-origin policy**: a script loaded from one origin can request data from another, but the browser **will not allow it to read the response** unless that response includes the appropriate CORS headers. MDN states it like this: for security reasons, browsers restrict cross-origin HTTP requests initiated from scripts, and `fetch()` follows the same-origin policy ([MDN, "Cross-Origin Resource Sharing (CORS)"](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)). The header granting permission is `Access-Control-Allow-Origin`.

Does the practice server provide it? Ask it just like a browser would, stating where you are coming from:

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

Not a trace of `Access-Control-Allow-Origin`. `curl` receives the entire response because `curl` is not a browser and enforces no security policy; but if the dashboard, loaded from port 5173, requested that full address, the browser would receive the response and refuse to hand it to the code, and in the console you would see a CORS error. And it is deliberate that the server does not supply it: deciding which origins can read an API is a security decision belonging to the API, not something opened up just because it gets in the way of the frontend during development. Lesson 9 of TypeScript put it the other way: as long as the dashboard and API come from the same process there is nothing to configure, and if they ever separate, the correct answer is declaring explicit origins, never `*` for convenience.

The other way out is for the browser to **never find out** that there are two processes. That is what the proxy in `vite.config.ts` does: "any request whose path starts with that key is forwarded to the specified target" ([Vite, "Server Options", `server.proxy`](https://vite.dev/config/server-options)). The short form, `"/api": "http://127.0.0.1:3100"`, means that `http://localhost:5173/api/estados` becomes, inside the Vite server, `http://127.0.0.1:3100/api/estados`. The browser only talks to port 5173; the forwarding happens between two processes on your machine, where there is no same-origin policy to enforce. Verify it with the same `curl`, now against Vite:

```text
$ curl -s http://localhost:5173/api/estados | head -c 120
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla"
```

The response is from the practice server, served from the page's origin. That is why `cargar.ts` continues to write `fetch("/api/estados")`, a relative path, exactly as in TypeScript: the dashboard code neither knows nor cares on which port the API lives. Three details worth knowing:

- **Only requests starting with the key are forwarded.** `/src/main.tsx` is still served by Vite. If tomorrow the API adds routes that do not start with `/api`, they will not be forwarded until you add another key. That is why all API routes should live under a common prefix.
- **`vite preview` also forwards.** Its `preview.proxy` option defaults to the value of `server.proxy` ([Vite, "Preview Options"](https://vite.dev/config/preview-options)), which is why in 0.5 the built version also finds the API.
- **In production there is no Vite proxy.** What gets published are the files in `dist/`, and whoever serves them will need to solve the same problem: either the page and the API come from the same origin (most commonly with a reverse proxy in front), or the API declares CORS. Lesson 9 revisits this.

### 0.4 VITE_ variables: configuration, never secrets

The refresh interval is configuration: a value that can vary between your machine, your teammate's, and the published version, without changing code. On a Node server you would read it from `process.env`. On a browser page **there is no environment**: the code runs on the computer of whoever opens the page, and the only thing that person receives is the JavaScript you send them. So when Vite offers you "environment variables", what it actually does is **write their value into the code** at the time of serving or building.

Vite's rule is simple: only variables whose name starts with `VITE_` reach the client code, via `import.meta.env`, and their value is statically replaced during the build ([Vite, "Env Variables and Modes"](https://vite.dev/guide/env-and-mode)). You can define them in the terminal or in a `.env` file at the root of the project, which Vite always reads, along with `.env.local`. The checkpoint includes this one:

```bash
# Variables que Vite expone al navegador. TODO lo que empieza con VITE_ termina
# escrito en el JavaScript que descarga cualquier persona: aquí no va ningún secreto.
VITE_CADA_MS=10000
```

And configuration is read and validated in a single place. What arrives from `import.meta.env` is string or `undefined`, never a number, and comes from outside the program: it is treated like any input at a boundary, just like `leerPuerto` in the TypeScript course. If missing or not a positive integer, the default value is used:

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

For TypeScript to know which variables exist, they are declared in `src/vite-env.d.ts`, as described in Vite's documentation. The `ViteTypeOptions` interface with `strictImportMetaEnv` makes typing strict: with it, reading an undeclared variable is a compilation error instead of a silent `any` ([Vite, "Env Variables and Modes", IntelliSense](https://vite.dev/guide/env-and-mode)). In "The error you will see", you will watch it catch a typo.

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

Now, the demonstration that justifies the entire section. Request the configuration module from the development server, exactly as received by the browser:

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

The first line is what matters: the variable's value is **written into the file** downloaded by the browser, alongside four other constants that Vite always defines (`DEV`, `PROD`, `MODE`, `BASE_URL`). During the build the same thing happens, already minified. Build with another value and look for it in `dist/`:

```text
$ VITE_CADA_MS=15000 npx vite build
...
$ grep -o '.\{30\}15000.\{30\}' dist/assets/*.js
.test(e)?d:Number(e)}var p=f(`15000`);function m(e){return typeof
```

There it is, `f(`15000`)`, inside the minified JavaScript: `f` is `leerCadaMs` with its name mangled. (We use `npx vite build` and not `npm run build` only to pass the variable on the same line; the result is identical.) And if someone defines an "API key", the exact same thing happens. This experiment temporarily adds a line to `main.tsx` that logs one prefixed variable and one without prefix, builds with both values defined in the terminal, and searches:

```text
$ VITE_CLAVE_API=clave-de-mentira-123 CLAVE_API=otra-clave-456 npx vite build
...
$ grep -o 'con prefijo:.\{0,80\}' dist/assets/*.js
con prefijo:`,`clave-de-mentira-123`,`sin prefijo:`,void 0);
```

The `VITE_` one remained written, legible to anyone who opens their browser's developer tools. The one without a prefix became `void 0`, that is, `undefined`: Vite did not expose it. That is why Vite's documentation warns that `VITE_*` variables must not contain sensitive information, such as API keys ([Vite, "Env Variables and Modes"](https://vite.dev/guide/env-and-mode)). Notice also that the build completed successfully even though the code read two variables that `vite-env.d.ts` does not declare: `vite build` does not check types. `npx tsc -b` would have halted it with two `TS2339` errors; that is why the course's build script starts with it. (If you repeat the experiment, remove the line afterward and rebuild.)

The practical rule has two halves. **What does go in `VITE_`:** anything you would not mind seeing posted on a billboard, such as an interval, an environment name, or an API's public URL. **What never goes in `VITE_`:** API keys, passwords, tokens, anything granting permission. A secret needed by the browser stops being a secret the moment the browser receives it; if a feature needs a secret key, the key lives on a server and the client UI asks the server to do the work. And one more piece: `.env.local` files exist for local machine values you do not wish to share, and Vite recommends adding `*.local` to `.gitignore` so they are never committed.

### 0.5 StrictMode: the free test

`StrictMode` is a React component that renders nothing. It wraps part of the tree (here, the entire tree) and, **only in development**, does three things intentionally to expose bugs that already exist in your code: renders every component an extra time, runs every effect through an extra "setup and cleanup" cycle, and checks whether you are using deprecated APIs ([React, "StrictMode"](https://react.dev/reference/react/StrictMode)). In production it does nothing: the documentation states bluntly that all its checks are development-only and do not impact the production build.

The extra effect cycle is the most noticeable, and the first figure demonstrates it in a test DOM. A component with an effect logging when it starts and stops synchronizing mounts and unmounts twice: without `StrictMode` and with it.

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

The figures run in a separate folder, `~/curso-react/figuras/`, with its own `package.json` (located in the lesson's programs folder, alongside `revisor/`); they are compiled with `tsc` and executed with `node`, as in the TypeScript course. With `StrictMode`, React mounted the effect, cleaned it up immediately, and mounted it again, just as if someone had navigated away from the screen and returned in an instant. Why? Because that **does happen** in a real application: a user navigates away and comes back, or an effect dependency changes. If the effect does not know how to clean up after itself, that exit and return leaves things behind: two open connections, two timers, two competing requests. `StrictMode` triggers that scenario on every mount so you see it today, rather than when someone spots it in production.

In the `revisor`, this appears in the practice server's log. Here is what it logged when Chrome opened the dashboard served by `npm run dev`:

```text
07:26:06.245 GET /api/estados cancelada por el cliente
07:26:06.545 GET /api/estados 200
```

Two requests upon opening the page a single time. The first was made by the effect's initial mount; the cleanup that immediately followed invoked `control.abort()`, the browser severed the connection, and the server recorded it as canceled. The second was made by the second mount, and is the one that populated the screen.

A clarification about what is guaranteed and what is not. What React guarantees is the extra effect cycle: setup, cleanup, and setup again ([React, "StrictMode"](https://react.dev/reference/react/StrictMode)). Whether the server manages to **log** the first request depends on the exact millisecond the abort signal arrives: if the browser cancels it before the connection hits the server, the log will show only the `200`. In this run the connection did reach the server, which is why the pair is visible. If on your machine you see only a single line, it does not mean `StrictMode` is off; what proves the extra cycle is the first figure, not the server log. And here is what it recorded when Chrome opened the built version, served by `npm run preview`:

```text
07:26:22.726 GET /api/estados 200
```

Just one. In production there is no extra cycle. Read carefully what that first log demonstrates: **the effect's cleanup exists and works.** If `useReporte` did not abort the request in its cleanup, the first would not be canceled, both responses would arrive, and both would write state; if it did not clear the timer, there would be two intervals querying every ten seconds. The lesson 9 dashboard already had that cleanup, and `StrictMode` confirms it for free every time you open the page.

The temptation, when someone sees two requests for the first time, is to remove `StrictMode` "because it duplicates calls." That is removing the smoke alarm because it is ringing. Lesson 3 dedicates an entire section to why that double mount is your ally, and to the few situations where what you need is not dodging it, but structuring the effect differently.

### 0.6 The React linter, enabled from day one

ESLint inspects your code without running it and looks for patterns known to be buggy. On its own it knows nothing about React; `eslint-plugin-react-hooks` teaches it the rules. Its recommended configuration, in version 7.1.1, enables sixteen rules: the two classic hook rules and fourteen originating from the React Compiler. React's documentation describes them like this: the first two cover fundamental patterns, `rules-of-hooks` (hooks must be called identically on every render) and `exhaustive-deps` (the dependency list must contain everything used by the effect), and the rest are compiler diagnostics that can be used even if your application has not yet adopted the compiler ([React, "eslint-plugin-react-hooks"](https://react.dev/reference/eslint-plugin-react-hooks)). (That page lists seventeen; the difference is `component-hook-factories`, which version 7.1.1 of the package does not yet include in its recommended configuration. This was measured by checking the rules enabled by the installed package.)

The project's configuration brings together three recommended presets—JavaScript, TypeScript, and React—and preserves the rule that lesson 9 of TypeScript wrote against XSS:

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

`globalIgnores(["dist"])` prevents ESLint from checking built code that you did not write. `files` limits the check to TypeScript files. And `reactHooks.configs.flat.recommended` is the pattern prescribed by the package itself for ESLint's flat config.

Now, the detail that decides whether the linter is an actual safeguard or mere decoration. The `exhaustive-deps` rule is configured as a **warning**, not an error. And ESLint, when facing warnings, **exits successfully**. Here is what happens if you remove `cadaMs` from the dependency list in `useReporte` and run ESLint without flags:

```text
$ npx eslint .

~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

$ echo "código de salida: $?"
código de salida: 0
```

Exit code 0: to any script or CI workflow, that means "all clear." That warning is the very scene that opened this lesson: the effect no longer notices when the interval changes, so your coworker can change it all she wants and the dashboard will keep polling every ten seconds. That is why the course's script is `eslint . --max-warnings 0`: with zero warnings permitted, that exact same change halts the command.

```text
$ npm run lint

> revisor@0.0.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

The course's policy for this warning does not change in any lesson: **you fix the code, you do not silence the rule.** Here the fix is returning `cadaMs` to the list, which is the reality: the effect uses it. An `// eslint-disable-next-line` comment would remove the warning and leave the defect exactly where it was.

The second figure brings together, in a twelve-line component, the two classic hook errors. It is not part of the `revisor`; it is checked with its own configuration, identical to the project's without the XSS rule:

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

Both errors state the same thing in different words: React identifies each `useState` and each `useEffect` in a component **by the order in which they are called**, not by their name. If during one render `visible` is `false` and the component returns early, that render invokes no hooks; if during the next it is `true`, it does call them, and React no longer knows which state corresponds to which. The error message even diagnoses the cause: "Did you accidentally call a React Hook after an early return?". The fix is moving the hooks above the `if`, keeping the condition solely for what gets rendered. The warning on the third line is the same one seen in `useReporte`. The exercise solutions demonstrate the corrected version.

And the compiler rules are not just theoretical. If inside the effect in `useReporte` you wrote `establecerCarga({ tipo: "cargando" })` right at the start, before creating the `AbortController`, the linter would respond like this (the message is long; it is shown in full because it is self-explanatory):

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

This is the `set-state-in-effect` rule. Notice that the original `useReporte` does call `establecerCarga` inside the effect, but **after an `await`**, once the response has arrived from the outside: that is synchronizing with an external system, which the rule permits. What it rejects is mutating state immediately within the body of the effect, because that triggers an extra render that nothing outside React asked for. The dashboard already sets `cargando` where it belongs: in `recargar`, which is triggered by a click. This is your first encounter with the course's stance on effects; Lesson 3 develops it completely.

The checkpoint passes clean. This is neither accident nor the linter's doing: the code from lesson 9 of TypeScript already respected the rules. What changes today is that, from now on, if anyone breaks them, `npm run lint` calls it out and halts.

### 0.7 The practice server and the full tour

The final file is the practice server. The course focuses on the UI and this server is not explained line by line: it is a Node process responding to the exact same public contract as the TypeScript course API, `GET /api/estados` and `GET /salud`, with four fixed services and a 300 ms delay so you can briefly spot "Cargando…". It uses the types in `src/compartido/contrato.ts`, so if the contract changes, `tsc -b` flags the server as well. And it logs one line per request, which is what you used in 0.5 to observe `StrictMode`'s two requests.

```ts
// revisor/servidor/practica.ts
// Servidor de práctica del curso de React. Responde el mismo contrato público que
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

The full walkthrough uses two terminals. In the first, start the practice server:

```text
$ npm run servidor

> revisor@0.0.0 servidor
> node servidor/practica.ts

07:25:45.111 servidor de práctica en http://127.0.0.1:3100
```

From another terminal, test it before combining it with anything else. If these three responses do not look like this, the problem is in the server and not in the dashboard:

```text
$ curl -s http://127.0.0.1:3100/salud
ok
$ curl -s http://127.0.0.1:3100/api/estados
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},{"nombre":"reportes","tipo":"falla","detalle":"tiempo límite agotado"}]}
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/no-existe
404
```

In the second terminal, start the development server:

```text
$ npm run dev

> revisor@0.0.0 dev
> vite


  VITE v8.3.5  ready in 110 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

"Ready in 110 ms": it did not bundle your code, which is why it takes so little time. The last line indicates the server only listens on your machine; with `--host` it would open to your local network, which is not needed. Open `http://localhost:5173/` in your browser. You should see the heading "Revisor", an instant of "Cargando…", and four services with green or red borders. Here is what headless Chrome returned after executing the page's JavaScript (only the container is shown):

```text
<div id="raiz"><main><h1>Revisor</h1><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></main></div>
```

With the page open, perform the test that justifies the development server: in `Panel.tsx`, change the `<h1>` text from `Revisor` to `Revisor de servicios` and save. The page updates on its own without reloading, and the list remains in place: it did not cycle back through "Cargando…". That is Fast Refresh from 0.1.2. (This is verified visually in an open browser window; no automated tool in the course measures it, and the runs in this lesson, performed with headless Chrome, did not either: what is stated here is what React's plugin documents. Revert the text when finished.)

Finally, build and inspect the version that would be published. With the practice server still running:

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

`http://localhost:4173/` displays the same dashboard, now from the files in `dist/` and without `StrictMode` active, which is what the log in 0.5 confirmed. Stop everything with Ctrl+C in each terminal; the practice server says goodbye with `servidor de práctica detenido`.

A final verification, the one performed by any automated CI: delete `node_modules/`, reinstall exactly what is in the lockfile with `npm ci`, and repeat. In the Linux container from "About the runs", from a copy without `node_modules/` or `dist/`, `npm ci`, `npm run lint`, and `npm run build` completed cleanly, and the build produced the exact same three files with identical filenames (`index-tGGc24Rg.css` and `index-BWNt33lQ.js`). That the filenames match is not trivial: filenames in `dist/` are derived from file contents, so two machines producing the exact same filenames produced the exact same bundle.

## The error you will see

The lesson features one primary error, stemming from the fact that Vite does not check types, and two secondary ones.

**The primary error: "It builds fine for me."** In `Panel.tsx`, change the type of the `cadaMs` prop from `number` to `string` and build using both approaches:

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

`vite build` exits with its green checkmark: it stripped the types and bundled. `npm run build` halts at `tsc -b` with three errors, and `vite build` never even starts. It reads like any TypeScript error: file, line, and column in parentheses, error code, and what does not match what. The three errors represent the same disagreement viewed from three places: `main.tsx` passes a number where a string is now expected, the default value `10_000` is a number, and `useReporte` receives a string where it expects a number. The fix is restoring the type; the lesson is different: **Vite's checkmark says "I bundled", not "it is correct".** In development the same thing happens, with greater danger: `npm run dev` serves the file containing the error and the dashboard might even work, because at runtime a number that the type calls "string" is still a number. Check your editor, and before shipping, run `npm run build`.

**A typo in a variable.** Type `VITE_CADA_MZ` instead of `VITE_CADA_MS` in `configuracion.ts`:

```text
$ npx tsc -b
src/configuracion.ts(11,50): error TS2551: Property 'VITE_CADA_MZ' does not exist on type 'ImportMetaEnv'. Did you mean 'VITE_CADA_MS'?
```

This is the job of `strictImportMetaEnv` (0.4). Without that line in `vite-env.d.ts`, the misspelled name would compile, evaluate to `undefined` in the browser, `leerCadaMs` would use the fallback value, and nobody would understand why the variable "does not work".

**The warning that stops nothing.** This is the one from 0.6: `exhaustive-deps` is a warning, ESLint exits with code 0, and any check looking only at the exit code reports "clean". The telltale sign is the line `✖ 1 problem (0 errors, 1 warning)` followed by nothing. With `--max-warnings 0`, `ESLint found too many warnings (maximum: 0).` also appears, and the command fails.

## What gets done wrong

**Running only `vite build` or only `npm run dev`.** Neither checks types. A workflow that skips `tsc -b` can ship a bundle with type errors; that is why the `build` script begins with it.

**Putting a secret in a `VITE_` variable.** Everything starting with `VITE_` ends up written into the public JavaScript, as you verified with `grep`. Renaming the variable so it lacks the prefix does not make it secure: if the browser needs it, the browser has it. Secrets belong on a server.

**Opening CORS with `*` on the API so it works in development.** This resolves a local machine inconvenience with a security compromise affecting everyone. In development, Vite's proxy eliminates the issue without touching the API.

**Removing `StrictMode` because "it makes two requests."** The second request is proof that the effect cleanup works, and in production it does not exist. Removing it conceals the exact bugs it was introduced to reveal.

**Silencing the linter.** An `// eslint-disable-next-line react-hooks/exhaustive-deps` comment leaves the effect with a dishonest dependency list, and the defect remains while the alarm is silenced. If the rule complains, change the code.

**Allowing warnings to pass.** Without `--max-warnings 0`, a dependency warning halts nothing and, over time, nobody reads linter output because "there is always something."

**Committing `node_modules/` or `dist/` to the repository.** They are reconstructed identically with `npm ci` and `npm run build`. What must be committed is `package-lock.json`, which makes that exact reconstruction possible.

**Dependencies without pinned versions.** With `^` in `package.json`, two people installing days apart can receive different versions. The lockfile helps, but only if committed and installed via `npm ci`.

**Allowing Vite to change ports silently.** Without `strictPort`, a forgotten server on 5173 causes the new one to launch on 5174, and you end up looking at stale code. With `strictPort: true`, the second server refuses to launch.

## Exercises

### Exercise 1 — Change the interval without touching code

Make the dashboard refresh every 3 seconds without editing any file in `src/`. **Before doing so, predict** how many `GET /api/estados 200` lines the practice server will log in the 10 seconds following opening the page with `npm run dev`. Test this using two different mechanisms: defining the variable in the terminal and creating a `.env.local` file. Which of the two wins if both are present? Why must `.env.local` not be committed to the repository, and which line in `.gitignore` prevents it?

### Exercise 2 — Fix Figure 2

Fix `fig00_02.tsx` so that `npx eslint fig00_02.tsx` reports no problems and the component continues to render nothing when `visible` is `false`. Before editing, explain in your logbook why moving the `if` below the hooks does not alter what the user sees.

### Exercise 3 — The missing proxy

Add to `vite.config.ts` what is needed so that `curl http://localhost:5173/salud` returns `ok`. **First**, predict what that same request returns today and why it is not a 404 from the API. Verify your prediction before changing anything.

### Exercise 4 — The missing cleanup

In `useReporte`, temporarily delete the line `control.abort();` from the effect cleanup. With the practice server and `npm run dev` running, open the page and inspect the server log. What changed compared to 0.5? What does that tell you about what `StrictMode` was testing? Does the linter warn you? Restore the line when finished.

## Solutions

### Solution 1

In the terminal, the variable precedes the command and applies only to that process:

```bash
VITE_CADA_MS=3000 npm run dev
```

With `.env.local`, the file contains a single line, `VITE_CADA_MS=3000`, and Vite reads it at startup (if the server was already running, restart it). The prediction: in 10 seconds, the mount request plus one every 3 seconds, that is, four `200` responses, **plus**, if the connection reaches the server before the abort arrives (0.5), one `cancelada por el cliente` line at the beginning, which is the extra `StrictMode` cycle. Here is what was measured with headless Chrome over 10 seconds of internal clock time: one canceled and four `200`s. If both sources are present, the terminal wins: Vite's documentation notes that variables existing prior to Vite starting are not overwritten by `.env` files. `.env.local` exists specifically for local machine overrides, and the `*.local` rule in `.gitignore` prevents it from being committed. When finished, delete the file so your project once again matches the checkpoint.

### Solution 2

Hooks come first and the condition only determines what gets rendered; the dependency list names what the effect uses:

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

What the user sees does not change, because `return null` still executes before rendering the paragraph. What changes is that both hooks are called on every render, in the exact same sequence, allowing React to match them with their respective state. Note a consequence worth reflecting on in your logbook: with `visible` set to `false`, the timer keeps incrementing even though nothing is displayed. If that is not desired, the fix is not moving the `if` back above the hooks, but having the caller refrain from rendering `Resumen`: `{visible && <Resumen cadaMs={5000} />}` (beware of this pattern when the condition is a number: that is the `0` trap from [Lesson 1](01-componentes-puros-composicion.md)).

### Solution 3

Today, `curl http://localhost:5173/salud` never reaches the API: the path does not start with `/api`, so Vite handles it. For a single-page application development server, an unrecognized route is not an error: it responds with `index.html`, leaving client-side routing to decide (Lesson 5 returns to this). You will receive the HTML of the page, with status 200, not `ok`. Verify this before making any changes; it is a good habit never to take predictions on faith. To forward it, add another key:

```ts
// vite.config.ts (fragmento)
proxy: {
  "/api": "http://127.0.0.1:3100",
  "/salud": "http://127.0.0.1:3100",
},
```

Restart `npm run dev` to pick up the new configuration, and the response will be `ok`. This exercise demonstrates the rationale behind the advice in 0.3: if all API routes lived under `/api`, a single key would suffice.

### Solution 4

Without `control.abort()`, the server log stops showing the `cancelada por el cliente` line: now **two** `GET /api/estados 200` lines appear upon opening the page. The first request, originating from the initial mount that `StrictMode` tore down, is no longer canceled; its response arrives and updates the state of an effect that was already cleaned up. In this dashboard it is not immediately noticeable because both responses are identical, but if the first were slower and returned stale data, it would overwrite the second: that is the race condition that Lesson 3 reproduces and fixes. `StrictMode` was testing exactly that: whether cleanup undoes what setup began. And the linter? It remains silent: missing cleanup breaks no syntax rule discernible in the code's static text. That is why `StrictMode` and the linter are two distinct defenses, and why the course utilizes both.

## How I know I got it

- [ ] `node -v` prints a version starting with `v24`, and `npx tsc --version`, inside `~/curso-react/revisor/`, prints `Version 7.0.2`.
- [ ] With the practice server running, `curl -s http://127.0.0.1:3100/salud` returns `ok`, and `curl -s http://localhost:5173/api/estados` (with `npm run dev` running) returns the JSON for the four services.
- [ ] Opening `http://localhost:5173/` displays the heading "Revisor" and four services, and the practice server log records a `200` upon opening the page. If a `cancelada por el cliente` also appears before it, you recognize it as `StrictMode`'s extra cycle; if it does not appear, you know why that does not mean it is turned off (0.5).
- [ ] With the built version (`npm run preview`, on `http://localhost:4173/`), the same page produces only a single request in the log.
- [ ] `npm run lint` completes without printing any problems, and removing `cadaMs` from `useReporte`'s dependency list fails with `ESLint found too many warnings (maximum: 0).`
- [ ] `npm run build` finishes with `✓ built` and leaves in `dist/` an `index.html`, a `.css`, and a `.js`; intentionally modifying a type causes it to halt at `tsc -b`, preventing `vite build` from running.
- [ ] You can demonstrate with `grep` over `dist/` that the value of `VITE_CADA_MS` travels embedded within the JavaScript, and explain why that precludes storing secrets there.
- [ ] `git status` inside the project does not list `node_modules/` or `dist/` as untracked files.
- [ ] You noted in your [logbook](bitacora.md) your tool versions, what changed compared to bundling with esbuild, and the first warning the linter gave you.

## Summary

Answer without looking at the lesson:

1. What two distinct jobs does Vite perform and which one bundles? Why does the development server not need to bundle?
2. Why does the `build` script begin with `tsc -b`? What happens if you only run `vite build` when type errors exist?
3. What does `tsconfig.app.json` check and what does `tsconfig.node.json` check? Why does one include `DOM` and the other not?
4. Why does `"moduleResolution": "bundler"` mean you no longer write `.js` at the end of `import` paths?
5. What is an origin? Why can the dashboard on port 5173 not read a response from port 3100, and how does the proxy resolve this without modifying the API?
6. Which variables reach `import.meta.env`, when are their values replaced, and why do no secrets belong there?
7. What does `StrictMode` do with effects in development, and what does the `cancelada por el cliente` line in the log demonstrate?
8. What do `rules-of-hooks` and `exhaustive-deps` check? Why does the course run ESLint with `--max-warnings 0`?

## Further reading

- [Vite, "Getting Started"](https://vite.dev/guide/): how to scaffold a project, template listing, required Node version, and why `index.html` is the entry point. Consulted on October 21, 2026.
- [Vite, "Why Vite"](https://vite.dev/guide/why): problems resolved by the development server and reasons for bundling in production; Rolldown and Oxc. Consulted on October 21, 2026.
- [Vite, "Announcing Vite 8"](https://vite.dev/blog/announcing-vite8): Rolldown as the unified bundler, since March 12, 2026. Consulted on October 21, 2026.
- [Vite, "Dependency Pre-Bundling"](https://vite.dev/guide/dep-pre-bundling): why Vite pre-bundles dependencies in development, and how Rolldown powers it. Consulted on October 21, 2026.
- [Vite, "Features"](https://vite.dev/guide/features): TypeScript without type checking, `isolatedModules`, `vite/client` types, and CSS imports. Consulted on October 21, 2026.
- [Vite, "Env Variables and Modes"](https://vite.dev/guide/env-and-mode): the `VITE_` prefix, `.env` file evaluation order, warnings on sensitive data, and types with `strictImportMetaEnv`. Consulted on October 21, 2026.
- [Vite, "Server Options"](https://vite.dev/config/server-options) and ["Preview Options"](https://vite.dev/config/preview-options): `server.proxy`, `server.port`, `strictPort`, and proxy inheritance in `vite preview`. Consulted on October 21, 2026.
- [Vite, "Deploying a Static Site"](https://vite.dev/guide/static-deploy): why `vite preview` is not a production server. Consulted on October 21, 2026.
- [vite-plugin-react, `@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react): Fast Refresh, automatic JSX runtime, and compiler options. Consulted on October 21, 2026.
- [React, "StrictMode"](https://react.dev/reference/react/StrictMode): development checks, the extra effect cycle, and why they do not impact production builds. Consulted on October 21, 2026.
- [React, "eslint-plugin-react-hooks"](https://react.dev/reference/eslint-plugin-react-hooks): recommended configuration, hook rules, and compiler diagnostics. Consulted on October 21, 2026.
- [React, "Build a React app from Scratch"](https://react.dev/learn/build-a-react-app-from-scratch) and ["Sunsetting Create React App"](https://react.dev/blog/2025/02/14/sunsetting-create-react-app): when tools like Vite are appropriate, and the deprecation of Create React App. Consulted on October 21, 2026.
- [MDN, "Cross-Origin Resource Sharing (CORS)"](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS): same-origin policy for `fetch()` and the `Access-Control-Allow-Origin` header. Consulted on October 21, 2026.
- [TypeScript, "TSConfig Reference"](https://www.typescriptlang.org/tsconfig/): `moduleResolution`, `noEmit`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly`, and project references. Consulted on October 21, 2026.
- [typescript-eslint, "Dependency Versions"](https://typescript-eslint.io/users/dependency-versions/): supported TypeScript and ESLint versions. Consulted on October 21, 2026.
- [Node.js, "Modules: TypeScript"](https://nodejs.org/api/typescript.html) and ["Previous Releases"](https://nodejs.org/en/about/previous-releases): running `.ts` directly with Node and its requirements; Node 24 LTS and its latest release. Consulted on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| development server | the process started by `npm run dev`: serves each module separately, translated on the fly, and notifies the browser when a file changes |
| HMR / *Fast Refresh* | replacing only the module that changed on the page without reloading; in React it preserves the state of components that did not change |
| build | what `npm run build` does: check types and bundle into `dist/` the files to be published |
| project references | several small `tsconfig` files that `tsc -b` checks separately, each with its own rules |
| origin | the combination of scheme, host, and port of an address; two different ports are two origins |
| same-origin policy | the browser rule that prevents a script from reading responses from another origin unless the response permits it via CORS |
| proxy (development) | the forwarding Vite performs for certain routes toward another server, so the browser sees a single origin |
| `VITE_` variable | configuration that Vite writes directly into the client code; public by definition |
| `StrictMode` | a React component that, only in development, renders twice and runs an extra cycle of each effect to uncover bugs |
| `--max-warnings 0` | an ESLint option that fails the command if there is at least one warning |

---

**Next:** [Lesson 1 — Pure Components and Composition](01-componentes-puros-composicion.md)
