# Lesson 0 — A real project: Vite, StrictMode, and the linter

*It is 9:40 and the review with the operations team is at 10. Yesterday you changed one line in the `revisor` dashboard: you removed a dependency from a `useEffect` because it was “unnecessary”. On your machine it looks perfect. Your teammate opens it on hers, changes the refresh interval to five seconds for the demo… and the dashboard keeps asking every ten, as if it had not heard her. Nobody knows why. In that same change someone left, “just to test”, a monitoring provider key in a variable that starts with `VITE_`, and the bundle has already been published to the test server. Twenty minutes remain. Both failures had a warning: a tool that was not installed and a rule nobody knew about. This lesson installs the tool and explains the rule.*

**Time:** 2 × 45 min (the natural break is between sections 0.3 and 0.4)

**What you build:** the dashboard from Lesson 9 of the TypeScript course, moved into a Vite project: with a development server, a *proxy* to the API, a `VITE_` configuration variable, `StrictMode` enabled, the React linter active, and the course's practice server so the dashboard has someone to ask

**What you learn:** what Vite adds over a hand-assembled bundler; the `react-ts` template, its three `tsconfig` files, and the feature-based structure; the *proxy* to the API (no CORS in development); `VITE_` variables and why no secret belongs there; `eslint-plugin-react-hooks` active from day one

**Where you are coming from.** From Lesson 9 of Hábil's [TypeScript course](https://github.com/HabilMX/curso-typescript), or from somewhere similar: a React dashboard that works. That dashboard has a `Panel` component, a custom `useReporte` hook that requests `GET /api/estados` with an `AbortController`, a network boundary `cargar.ts` that validates the response with `esReportePublico`, and a `cliente.tsx` that mounts it. It was bundled with a one-line esbuild command and served by the same Node process that answered the API. If you did not take that course, it does not matter: all the dashboard's code appears in full in this lesson, and the course ships a practice server that answers with the same data shape. You work in a new folder, `~/curso-react/revisor/`.

**What this lesson does not do.** It does not change what the dashboard does: no new screen, no new state, no new rule. The React code is the same as in Lesson 9 of TypeScript, with two small changes explained where they appear. It also does not explain Effects or StrictMode in depth: here you enable them and see what they do; [Lesson 3](03-effects-sincronizar.md) takes them apart piece by piece. It does not publish anything: the content security policy (CSP), the rewrite to `index.html`, and the production server arrive in [Lesson 9](09-rendimiento-publicacion.md). And it has no automated tests yet: Vitest and Testing Library arrive in [Lesson 8](08-pruebas-de-componentes.md).

**About the runs.** Everything was run on October 21, 2026 with Node.js 24.22.0 (the 24 LTS line) and npm 11.19.1, on macOS, with the exact versions pinned by this lesson's `package.json`. Since the course assumes Linux Mint, the checkpoint was reinstalled from scratch with `npm ci` inside a Linux container (Debian 12 with the official `node:24.22.0` image), and there `npm run lint` and `npm run build` produced the same output, with the same file names in `dist/`. It was not run on a real Linux Mint, but nothing shown depends on the system, except the word `darwin-arm64` in `vite --version`, which on your Mint will say `linux-x64`. What is seen “in the browser” was measured with headless Chrome (`--headless`), which loads the page, runs its JavaScript, and delivers the resulting document: it is a real browser, not a simulation. Long paths printed by ESLint and Vite are shown starting from `~/curso-react`. The practice server log times are in UTC. One day earlier, on October 20, version 24.22.1 of the same line had been released, with the same npm; the lesson's runs were not made with it, but the checkpoint was repeated afterward with that version from a clean copy (`npm ci`, `npm run lint`, and `npm run build`) and produced the same file names in `dist/`, `index-tGGc24Rg.css` and `index-BWNt33lQ.js`; the output is in `node-24.22.1.salida.txt`. The programs are in [`programas/00-un-proyecto-de-verdad/`](../programas/00-un-proyecto-de-verdad), in the course repository: `revisor/` is the checkpoint and the figures sit alongside it.

**Before you start: do you have Node.js 24?** This lesson does not install Node.js; it assumes it is installed, so the first thing is to check. Open a terminal and type:

```text
$ node -v
v24.22.1
```

Your final number may differ (the one shown here is the latest release of the 24 line on the day of the review), but it must start with `v24`. If the command does not exist, or says something else, install Node.js 24 LTS following the instructions on the downloads page ([Node.js, “Download”](https://nodejs.org/en/download)), which suggests a method for your system, and type `node -v` again. This is not a formality: Vite 8 requires Node.js 20.19 or higher, or 22.12 or higher ([Vite, “Getting Started”](https://vite.dev/guide/)), and the practice server runs with `node servidor/practica.ts`, which needs 24.12 or later (0.2.2 explains it). If your distribution ships an older Node.js in its repositories, the command will exist and the numbers will not match the lesson's: that is why you check first.

## By the end you will be able to

- Create a project with Vite's `react-ts` template, pin its dependencies to exact versions, and explain what each of its three `tsconfig` files is for.
- Explain the difference between `npm run dev` and `npm run build`, and demonstrate with a type error that Vite translates TypeScript but does not check it.
- Configure a *proxy* in `vite.config.ts` and explain, with the `curl` response in front of you, why with it the browser does not need CORS in development.
- Read a `VITE_` variable from `import.meta.env`, give it a type, and verify with `grep` on `dist/` that its value travels written into the JavaScript that anyone downloads.
- Recognize in the server log the second request that `StrictMode` causes in development, and explain why it does not appear in the built version.
- Enable `eslint-plugin-react-hooks`, make a warning stop `npm run lint`, and read the warnings from `rules-of-hooks`, `exhaustive-deps`, and `set-state-in-effect`.

## The why before the how

The dashboard from Lesson 9 of TypeScript works, and it works for good reasons: the API response is validated, the effect is cleaned up, an API failure shows up as a failure. What it lacks is a **project** around it. Ask that dashboard four questions and you will see the gaps.

**How long does it take you to see a change?** Every time you touched `Panel.tsx` you had to bundle again with esbuild, restart the Node server, and reload the page. That is fifteen seconds, a hundred times a day. A development server that watches your files and tells the browser which module changed turns those fifteen seconds into less than one, and keeps the screen's state in the meantime.

**How do you talk to the API if they do not live in the same process?** In TypeScript, the page and the API came from the same server, the same origin, and that is why `fetch("/api/estados")` worked without configuring anything. As soon as you separate the screen (now served by a development tool on one port) from the API (which stays on another), the browser starts applying the same-origin policy and the request is blocked. There are two ways out: open CORS on the API, which is a security decision that is not the screen's to make, or have the development tool forward those requests, so the browser sees a single origin again. This lesson takes the second.

**Where does configuration go?** The refresh interval was written in the code, `10_000`. Changing it for a demo meant editing a file. Build tools offer environment variables, but on a browser page “environment variable” means something very different from what it means on a server, and confusing the two is the most common way to publish a key.

**Who warns you when you break a React rule?** The TypeScript compiler checks types; it does not know that a hook cannot be called after a `return`, or that an effect's dependency list has to name what the effect uses. Lesson 9 of TypeScript said it in so many words: “ESLint, in this project, does not check dependency lists; the official package that does is `eslint-plugin-react-hooks`, and it is a good next install”. That next install is today, and it is the first of this course, because **a principle this course repeats in every lesson—if the linter complains, you change the code—only makes sense if the linter is on from day one.**

The four answers fit in one tool and two switches. The tool is **Vite**, one of those the React team itself cites, along with Parcel and Rsbuild, when you want to build an application without a framework ([React, “Build a React app from Scratch”](https://react.dev/learn/build-a-react-app-from-scratch)) and the one that replaced Create React App, which the React team deprecated for new projects on February 14, 2025 ([React, “Sunsetting Create React App”](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)). The switches are **`StrictMode`**, which makes React put your components to the test while you develop, and **`eslint-plugin-react-hooks`**, which checks React's rules before anything runs.

There are three new concepts, the ones in the previous paragraph. The first is **the tool, Vite**, and it takes four sections because it answers the first three questions: what Vite is and what it does (0.1); the project, its `tsconfig` files, and its folders (0.2); the *proxy* (0.3); and `VITE_` variables (0.4). The second is the first switch, **`StrictMode`** (0.5). The third is the second switch, **the React linter** (0.6). Section 0.7 adds no concept: it is the complete walkthrough with the practice server, where the three are seen together. At the end, this is what you will see, and you will know where each line comes from:

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

### 0.1 What Vite does that the hand-assembled bundler did not

#### 0.1.1 Two different jobs under one name

The esbuild command from Lesson 9 of TypeScript did a single job: take `cliente.tsx`, follow its `import`s, join everything into a `cliente.js`, and write it to disk. Vite does **two different jobs**, and almost everything you will read about it is easier to understand if you separate them:

1. **The development server** (`npm run dev`). It does not join your code into one file. It serves each module of your code separately, when the browser asks for it, translated on the fly from TypeScript and JSX to JavaScript. Modern browsers know how to load JavaScript modules (`<script type="module">` and their `import`s) on their own, so there is no need to bundle in order to develop. That is why it starts quickly, because it does not bundle your code (startup time grows much less with project size than in a tool that bundles everything before serving), and that is why, when you change a file, only that module is sent again: this is **hot module replacement** (HMR), which in React is called *Fast Refresh* and keeps the state of the components that did not change ([Vite, “Why Vite”](https://vite.dev/guide/why)). With **dependencies** (what lives in `node_modules/`, like `react`) it does make an exception: it **pre-bundles** them once, at startup, to convert to JavaScript modules those that come in Node's old format (CommonJS) and so that a library made of hundreds of internal files reaches the browser in one request rather than hundreds. That pre-bundling happens only in development and does not touch your code ([Vite, “Dependency Pre-Bundling”](https://vite.dev/guide/dep-pre-bundling)).
2. **The build** (`npm run build`). Here it does bundle, because serving hundreds of loose modules in production forces the browser to make one request per nested `import`. The result is a `dist/` folder with an `index.html`, a JavaScript file, and a stylesheet with names that change when their content changes.

Since Vite 8, released on March 12, 2026, both jobs are done by the same piece: **Rolldown**, a bundler written in Rust, with **Oxc** to read, translate, and minify the code. Before, Vite used esbuild in development and Rollup to build, and keeping them in agreement required glue code ([Vite, “Announcing Vite 8”](https://vite.dev/blog/announcing-vite8)). For you the practical consequence is just one: what you see in development and what gets built go through the same translator (in development, without bundling or minifying the code).

#### 0.1.2 `index.html` is the entry point

In Lesson 9 of TypeScript, the page was a text string inside `pagina.ts`, and it pointed to a `/cliente.js` that had to exist beforehand. In Vite it is the other way around: **`index.html` lives at the project root and is the starting point.** Vite reads it, finds the `<script type="module" src="/src/main.tsx">`, and from there follows the `import`s ([Vite, “Getting Started”](https://vite.dev/guide/)). You point to the TypeScript file, not to a bundled result; Vite makes sure the browser receives JavaScript.

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

It is your `index.html` with two additions you did not write: `/@vite/client`, the little piece that keeps a connection open to the server to learn which file changed, and `/@react-refresh`, the one that makes it possible to replace one component without losing the state of the others. The second is added by `@vitejs/plugin-react`, Vite's official plugin for React, which also translates JSX with the automatic *runtime*, the same `react-jsx` mode you used with `tsc` ([vite-plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)). None of this appears in `dist/`: it is only for developing.

#### 0.1.3 Vite translates TypeScript, but does not check it

This is the sentence most worth taking away from the section: **Vite erases the types without checking them.** Its documentation says it in capital letters: it only translates `.ts` files and does “NOT” check types; it leaves that task to the editor and to the build process ([Vite, “Features”, TypeScript](https://vite.dev/guide/features)). It is exactly what happened with esbuild in Lesson 9 of TypeScript, and it has the same consequence: if someone runs only the tool that bundles, they can ship a program with type errors.

That is why the template's `build` script is not plain `vite build`, but `tsc -b && vite build`. First the TypeScript compiler checks everything; if it finds an error, the `&&` prevents the build from even starting. In “The error you will see” you will trigger it on purpose to see the two outputs side by side. And in development, while `npm run dev` runs, type errors **do not appear in the terminal or in the browser**: you see them in your editor, or when you run `npm run build`.

### 0.2 The project: the template, its `tsconfig` files, and its folders

#### 0.2.1 What the template brings, and what gets changed

The official way to start is `npm create vite@latest`. With a name and a template, it asks no questions. This course pins the creator's version so that your result matches the lesson's:

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

The two bare dashes (`--`) separate npm's options from the creator's options; without them, npm would keep `--template` for itself. The `react-ts` template leaves a folder with `index.html`, `vite.config.ts`, three `tsconfig` files, a `package.json`, a `src/` folder with a sample counter, and a `public/` folder for files that are copied as is. Measured that day, its `package.json` brought three decisions that this course changes, and it is worth saying so out loud so it does not surprise you if you compare:

- **Versions with `^` and `~`.** The template writes `"vite": "^8.3.4"`, which lets npm install any newer 8.x. The course pins each dependency to its exact version, verified with `npm view` on the day of the run: that way what you see here is what you install. The lock file, `package-lock.json`, also stores the exact resolution of everything those dependencies pull in.
- **The linter.** This month's template brings **Oxlint**, a very fast linter written in Rust, with some React rules. The course uses ESLint with `eslint-plugin-react-hooks`, which is the package published by the React team itself to check its rules ([React, “eslint-plugin-react-hooks”](https://react.dev/reference/eslint-plugin-react-hooks)) and the one that includes the React Compiler diagnostics that Lesson 9 uses. Oxlint is not a bad choice; it is a different one, and mixing two linters in one course is noise. The creator has a `--eslint` option that swaps Oxlint for ESLint, but it was measured the same day and it also adds `eslint-plugin-react-refresh` and `globals`, two packages this course does not use; that is why it is created here without that option and Oxlint is removed by hand, as explained below.
- **TypeScript.** The template pins TypeScript 6. The TypeScript course works with TypeScript 7, and it is kept the same here as there: TypeScript 7 is the one that checks types (`tsc`), and TypeScript 6 stays, under the name `typescript`, only so that ESLint can read `.ts` files. The reason is measurable: `typescript-eslint` states that it supports TypeScript `>=4.8.4 <6.1.0` ([typescript-eslint, “Dependency Versions”](https://typescript-eslint.io/users/dependency-versions/)), so it does not run with 7 yet. They are two different roles; do not swap one for the other.

If you did not take the TypeScript course, you do not need to understand the alias trick to follow along: it is enough to know that `npx tsc --version` says `Version 7.0.2` and that `npx tsc6 --version` exists only for ESLint. A curious detail that was measured: the `@typescript/typescript6` package is at version 6.0.2, but its executable answers `Version 6.0.3`. It affects nothing; it is noted here because, if you see it, it is not a mistake of yours.

The lesson's checkpoint does not keep the sample counter or the `public/` folder: their files are replaced with the dashboard's. Before installing anything, remove what the template brings from Oxlint, so that your project ends up like the course's: delete the `.oxlintrc.json` file, delete the `"oxlint"` line from `devDependencies` in `package.json`, and leave its `scripts` block equal to the one shown below (the template's `lint` says `oxlint`; the course's says `eslint . --max-warnings 0`, and `servidor` is added). Dependencies are installed like this, in two commands, from `~/curso-react/revisor/`:

```bash
npm install --save-exact react@19.3.1 react-dom@19.3.1
npm install --save-dev --save-exact vite@8.3.5 @vitejs/plugin-react@6.1.2 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.2 "@typescript/native@npm:typescript@7.0.2" "typescript@npm:@typescript/typescript6@6.0.2" eslint@10.13.0 @eslint/js@10.0.1 typescript-eslint@8.72.0 eslint-plugin-react-hooks@7.1.1
```

Notice a difference from Lesson 9 of TypeScript: there React went in `devDependencies`, because the production server did not import it. Here it goes in `dependencies`, as the template puts it. For an application that is built and served as static files, the difference does not change the result (everything ends up inside the JavaScript in `dist/`); it is a convention that separates “what travels to the browser” from “what you only use to build”.

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

Five scripts, five jobs. `dev` starts the development server. `build` checks types and builds. `lint` runs ESLint with `--max-warnings 0`, which is explained in 0.6. `preview` serves what is left in `dist/` so you can see it before publishing (and only for that: Vite's documentation says it is meant to preview the build on your machine and is not a production server, [Vite, “Deploying a Static Site”](https://vite.dev/guide/static-deploy)). And `servidor` starts the practice server, which is introduced in 0.7.

Before moving on, a habit that is not negotiable: `node_modules/` is never pushed to a repository. It is tens of megabytes that `npm ci` rebuilds identically from `package-lock.json`. The template brings a `.gitignore` that already excludes it, along with `dist/` and `*.local` files; keep it, and if you assemble the project by hand, create it before the first `git add` with at least those three lines: `node_modules`, `dist`, and `*.local`. In the course repository, the `revisor/` folder does not carry its own `.gitignore`: the ten checkpoints live in a single repository and the `.gitignore` at its root covers them all. What you do push is `package-lock.json`.

#### 0.2.2 Three `tsconfig` files, because there are two worlds

In Lesson 9 of TypeScript, a single `tsconfig.json` checked the server and the dashboard at once, and the lesson itself pointed out the cost: the server code also “saw” `document`, and a slip compiled and failed at run time. Vite's template separates the two worlds with **project references**: small TypeScript projects that are checked separately, each with its own rules ([TypeScript, “TSConfig Reference”](https://www.typescriptlang.org/tsconfig/)). The root file checks nothing; it only lists the other two:

```json revisor/tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsc -b` (for *build*) walks those references and checks each one. The first is the browser one, `tsconfig.app.json`, and it covers `src/`:

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

What matters in this file fits in five ideas:

- **`"lib": ["ES2023", "DOM"]` and `"types": ["vite/client"]`.** Here `document` and `window` do exist, along with the types Vite adds for the browser, such as `import.meta.env` ([Vite, “Features”, client types](https://vite.dev/guide/features)). In the other project they will not exist.
- **`"noEmit": true`.** TypeScript writes no `.js` file: it only checks. The one that translates is Vite. TypeScript's documentation describes this option in just that way: it leaves room for another tool to convert the code ([TypeScript, `noEmit`](https://www.typescriptlang.org/tsconfig/#noEmit)).
- **`"moduleResolution": "bundler"`.** It is the way of resolving `import`s designed for bundlers, and unlike `nodenext` it **never requires an extension** in relative paths ([TypeScript, `moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution)). This is the first of the two changes to the Lesson 9 code: there you wrote `import { Panel } from "./Panel.js"`, with a `.js` that did not exist on disk, because Node required it; here you write `from "./Panel"`.
- **`verbatimModuleSyntax` and `isolatedModules`.** Vite translates each file separately, without looking at the others, and so it does not know whether what you import is a type or a value. With `verbatimModuleSyntax`, TypeScript forces you to mark with `type` what is only a type, and the translator can erase it without hesitation ([TypeScript, `verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax)); with `isolatedModules`, it warns you if you write something that a one-file-at-a-time translator cannot interpret correctly. Vite's documentation explicitly asks for this second option ([Vite, “Features”](https://vite.dev/guide/features)). The template does not include it; the checkpoint adds it because the official source requires it.
- **`"strict": true`.** It does not come in this month's template either, and the TypeScript course took it for granted from its Lesson 2. Without it, `null` and `undefined` slip in where they should not.

The second project, `tsconfig.node.json`, is the one for things that run in Node: Vite's configuration and the practice server.

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

There is no `DOM` here: if the practice server wrote `document`, `tsc -b` would reject it. And two options appear that have to do with a new Node capability: since version 24.12.0, running a `.ts` file directly with `node archivo.ts` is stable. Node does not check types, it only replaces them with spaces, and so it sets two conditions: that imports carry their `.ts` extension and that the file not use TypeScript syntax that generates code, such as `enum` ([Node.js, “Modules: TypeScript”](https://nodejs.org/api/typescript.html)). `allowImportingTsExtensions` allows the first; `erasableSyntaxOnly` makes `tsc` watch for the second ([TypeScript, `erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)). That is why `npm run servidor` is `node servidor/practica.ts`, with nothing compiled beforehand.

Vite's configuration is short. The *proxy* it contains is explained in 0.3:

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

`port: 5173` is the port Vite uses anyway; writing it makes clear which one it is. `strictPort: true` changes what happens if that port is busy: without that option, Vite silently tries the next free port ([Vite, “Server Options”](https://vite.dev/config/server-options)), and you would end up with two forgotten development servers on 5173 and 5174 without knowing which one you are looking at. With it, Vite refuses to start and tells you so.

#### 0.2.3 Folders: by feature, not by file type

There are two common ways to organize `src/`. One groups by file type: a `components/` folder, another `hooks/`, another `services/`. The other groups by **feature**: everything needed to “see the status report” lives together, whether component, hook, or network function. This course uses the second, and it is the course's own criterion, not a React rule (React's documentation imposes no structure). The reason is practical: when you change how the report looks, you open one folder, not three. And when the `revisor` grows—the service detail in Lesson 5, the registration form in Lesson 7—each new feature will be a new folder, not one more file in each of the usual ones.

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

`src/reporte/` is the feature. `src/compartido/` holds what several features use: today, only the API types (`contrato.ts`). The other files in `src/` are the ones that affect the whole application: startup and configuration. Those types are the same as in Lesson 8 of TypeScript; the only change is that `esRegistro` now lives right here, because the server configuration file it was imported from is not part of this project:

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

The network boundary has the second change. In TypeScript, `cargarReporte` received a second parameter, `base`, which the tests used to point at a local server with its full address. Here the browser always requests the relative path `/api/estados` and it is the *proxy* that decides where it goes, so that parameter is unnecessary and is removed. With it gone, the function already has exactly the shape of the `Cargar` type, and `main.tsx` can pass it as is, without wrapping it in an arrow function:

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

The hook and the component arrive with no logic changes; only their `import`s change. The component also imports its stylesheet: in Vite, `import "./panel.css"` is all it takes for the CSS to reach the page. In development it is injected with a `<style>` tag that is hot-replaced when you edit the file, and when building it is joined into a separate `.css` file ([Vite, “Features”, CSS](https://vite.dev/guide/features)). In TypeScript you passed esbuild the stylesheet as a second entry; here the stylesheet travels with the component that uses it, which is precisely the idea of grouping by feature.

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

The page and the startup complete the walkthrough. `index.html` is the template's with three changes: the language, the title, and the container's identifier, which stays as `raiz` so as not to touch the code that looks for it. `main.tsx` is the `cliente.tsx` from TypeScript with two additions: `StrictMode`, explained in 0.5, and the interval read from the configuration, explained in 0.4.

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

Notice something that Lesson 9 of TypeScript took care of and that is preserved here: `cargarReporte` is a function declared at module level, so it is the same on every render. `useReporte` has it in its dependency list; if it changed on every render, the effect would repeat on every render.

### 0.3 The *proxy*: a single origin while you develop

So far there are two processes: Vite's development server at `http://localhost:5173` and the API (the practice server) at `http://127.0.0.1:3100`. For the browser, those are **two origins**, because an origin is the combination of scheme, host, and port, and here the host and the port change. The rule that applies is called the **same-origin policy**: a script loaded from one origin can request data from another, but the browser **does not let it read the response** unless that response carries the appropriate CORS headers. MDN puts it this way: for security reasons, browsers restrict cross-origin HTTP requests initiated by scripts, and `fetch()` follows the same-origin policy ([MDN, “Cross-Origin Resource Sharing (CORS)”](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)). The header that grants permission is `Access-Control-Allow-Origin`.

Does the practice server carry it? Ask it the way the browser would, saying which origin you come from:

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

There is no trace of `Access-Control-Allow-Origin`. `curl` receives the full response because `curl` is not a browser and applies no policy; but if the dashboard, loaded from port 5173, requested that full address, the browser would receive the response and refuse to hand it to the code, and in the console you would see a CORS error. And it is deliberate that the server does not carry it: deciding which origins can read an API is a security decision of the API, not something that gets opened up because it gets in the screen's way during development. Lesson 9 of TypeScript said it the other way around: as long as dashboard and API come from the same process there is nothing to configure, and if someday they are separated, the right answer is to declare explicit origins, never `*` for convenience.

The other way out is for the browser to **never find out** that there are two processes. That is what the *proxy* in `vite.config.ts` does: “any request whose path starts with that key is forwarded to the indicated target” ([Vite, “Server Options”, `server.proxy`](https://vite.dev/config/server-options)). The short form, `"/api": "http://127.0.0.1:3100"`, means that `http://localhost:5173/api/estados` becomes, inside Vite's server, `http://127.0.0.1:3100/api/estados`. The browser only talks to port 5173; the forwarding happens between two processes on your machine, where there is no same-origin policy to apply. Verify it with the same `curl`, now against Vite:

```text
$ curl -s http://localhost:5173/api/estados | head -c 120
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla"
```

The response is the practice server's, served from the page's origin. That is why `cargar.ts` keeps writing `fetch("/api/estados")`, a relative path, just as in TypeScript: the dashboard's code neither knows nor cares which port the API lives on. Three details worth knowing:

- **Only what starts with the key is forwarded.** `/src/main.tsx` is still served by Vite. If tomorrow the API adds routes that do not start with `/api`, they are not forwarded until you add another key. That is why it is a good idea for all of an API's routes to live under a single prefix.
- **`vite preview` forwards too.** Its `preview.proxy` option defaults to the value of `server.proxy` ([Vite, “Preview Options”](https://vite.dev/config/preview-options)), and that is why in 0.5 the built version also finds the API.
- **There is no Vite *proxy* in production.** What gets published are the files in `dist/`, and whoever serves them will have to solve the same thing: either the page and the API come from the same origin (the most common, with a reverse proxy in front), or the API declares CORS. Lesson 9 returns to this.

### 0.4 `VITE_` variables: configuration, never secrets

The refresh interval is configuration: a value that can change between your machine, your teammate's, and the published version, without the code changing. On a Node server you would read it from `process.env`. On a browser page **there is no environment**: the code runs on the computer of whoever opens the page, and the only thing that person receives is the JavaScript you send. So when Vite offers you “environment variables”, what it actually does is **write their value into the code** at the moment of serving or building.

Vite's rule is just one: only variables whose name starts with `VITE_` reach the client code, through `import.meta.env`, and their value is statically replaced at build time ([Vite, “Env Variables and Modes”](https://vite.dev/guide/env-and-mode)). You can define them in the terminal or in a `.env` file at the project root, which Vite always reads, along with `.env.local`. If the same variable appears in more than one place, the most specific wins: those that already exist in the terminal when Vite starts have the highest priority and `.env` files do not overwrite them; among files, one for a specific mode (`.env.production`, for example) weighs more than a general one ([Vite, “Env Variables and Modes”](https://vite.dev/guide/env-and-mode)). The checkpoint brings this one:

```bash
# Variables que Vite expone al navegador. TODO lo que empieza con VITE_ termina
# escrito en el JavaScript que descarga cualquier persona: aquí no va ningún secreto.
VITE_CADA_MS=10000
```

And the configuration is read and validated in a single place. What arrives from `import.meta.env` is text or `undefined`, never a number, and it comes from outside the program: it is treated like any input at a boundary, just like `leerPuerto` in the TypeScript course. If it is missing or is not a positive integer, the usual value is used:

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

So that TypeScript knows which variables exist, they are declared in `src/vite-env.d.ts`, as Vite's documentation indicates. The `ViteTypeOptions` interface with `strictImportMetaEnv` makes the type strict: with it, reading a variable you did not declare is a compile error instead of a silent `any` ([Vite, “Env Variables and Modes”, IntelliSense](https://vite.dev/guide/env-and-mode)). In “The error you will see” you will watch it catch a typo.

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

Now, the demonstration that justifies the whole section. Ask the development server for the configuration module, just as the browser receives it:

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

The first line is the one that matters: the variable's value is **written into the file** that the browser downloads, along with four other constants that Vite always defines (`DEV`, `PROD`, `MODE`, `BASE_URL`). When building, the same happens, already minified. Build with a different value and look for it in `dist/`:

```text
$ VITE_CADA_MS=15000 npx vite build
...
$ grep -o '.\{30\}15000.\{30\}' dist/assets/*.js
.test(e)?d:Number(e)}var p=f(`15000`);function m(e){return typeof
```

There it is, `f(`15000`)`, inside the minified JavaScript: `f` is `leerCadaMs` with its name shortened. (`npx vite build` is used instead of `npm run build` only to pass the variable on the same line; the result is the same.) And if someone defines a “key”, exactly the same thing happens to it. This experiment temporarily adds a line at the end of `src/main.tsx` that prints one variable with the prefix and another without it:

```ts
console.log("con prefijo:", import.meta.env.VITE_CLAVE_API, "sin prefijo:", import.meta.env.CLAVE_API);
```

Build with both values defined in the terminal, and search:

```text
$ VITE_CLAVE_API=clave-de-mentira-123 CLAVE_API=otra-clave-456 npx vite build
...
$ grep -o 'con prefijo:.\{0,80\}' dist/assets/*.js
con prefijo:`,`clave-de-mentira-123`,`sin prefijo:`,void 0);
```

The `VITE_` one was written out, readable by anyone who opens their browser's developer tools. The one without the prefix ended up as `void 0`, that is, `undefined`: Vite did not expose it. That is why Vite's documentation warns that `VITE_*` variables must not contain sensitive information, such as API keys ([Vite, “Env Variables and Modes”](https://vite.dev/guide/env-and-mode)). Notice also that the build finished fine even though the code read two variables that `vite-env.d.ts` does not declare: `vite build` does not check types. `npx tsc -b` would have stopped it with two `TS2339` errors; that is why the course's build script starts with it. (If you repeat the experiment, remove the line afterward and build again. The complete output, with the two `TS2339` errors, is in `vite-clave-api.salida.txt`.)

A nuance worth measuring, because it changes what “written into the JavaScript” means. When building, Vite replaces **the reads** it finds in your code, such as `import.meta.env.VITE_CADA_MS`; a `VITE_` variable that no file reads does not travel. Define one that nobody reads and search for its value:

```text
$ VITE_NADIE_LA_LEE=valor-que-nadie-lee npx vite build
...
$ grep -c 'valor-que-nadie-lee' dist/assets/*.js
0
```

But it is enough for a single line to read the whole object (`console.log(import.meta.env);`, added at the end of `main.tsx` for the experiment) for **all** the `VITE_` variables that exist at that moment to travel:

```text
$ VITE_NADIE_LA_LEE=valor-que-nadie-lee npx vite build
...
$ grep -c 'valor-que-nadie-lee' dist/assets/*.js
1
```

That is why the rule does not rest on “nobody reads that value”: any `VITE_` variable is written assuming it may end up in the public JavaScript (output in `vite-variable-sin-leer.salida.txt`). This is what Vite documents when it warns that `VITE_*` values are included in the code at build time and must not carry sensitive information; the “only the ones that are read” part is what this experiment measured with Vite 8.3.5, not something its guide asserts.

The practical rule has two halves. **What does go in `VITE_`:** what you would not mind seeing published on a billboard, such as an interval, the environment name, or an API's public address. **What never goes:** keys, passwords, tokens, anything that grants permission to something. A secret the browser needs stops being secret as soon as the browser has it; if a feature needs a key, the key lives on a server and the screen asks the server to do the work. And one more piece: `.env.local` files exist for values on your machine that you do not want to share, and Vite recommends putting `*.local` in `.gitignore` so they are never pushed.

### 0.5 `StrictMode`: the free test

`StrictMode` is a React component that renders nothing. It wraps a part of the tree (here, the whole tree) and, **in development only**, does three things on purpose to uncover bugs that already exist in your code: it renders each component one extra time, it runs each effect through an extra “start and clean up” cycle, and it checks whether you use old APIs ([React, “StrictMode”](https://react.dev/reference/react/StrictMode)). In production it does nothing: the documentation says so bluntly, all its checks are for development and do not affect the build.

The extra effect cycle is the most noticeable, and the first figure shows it in a test DOM. A component with an effect that prints when it starts and when it stops synchronizing is mounted and unmounted twice: without `StrictMode` and with it.

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

The figures are run in a separate folder, `~/curso-react/figuras/`, and that folder does not exist until you set it up. Copy into it, from `programas/00-un-proyecto-de-verdad/` (the folder next to `revisor/`), five files: `package.json`, `package-lock.json`, `eslint.config.js`, `fig00_01.tsx`, and `fig00_02.tsx`; then run `npm ci` inside `~/curso-react/figuras/` to install `react`, `jsdom`, and the linter at the exact versions. Without that folder's `eslint.config.js`, `npx eslint fig00_02.tsx` (0.6) does not know which rules to apply. The figures are compiled with `tsc` and run with `node`, as in the TypeScript course. With `StrictMode`, React mounted the effect, cleaned it up immediately, and mounted it again, as if someone had left the screen and returned in an instant. What for? Because that **does** happen in a real application: the person switches screens and comes back, or a dependency of the effect changes. If the effect does not know how to clean up what it did, that leaving and returning leaves leftovers: two open connections, two timers, two requests competing. `StrictMode` triggers that situation on every mount so that you see it today and not when someone notices it in production.

In the `revisor` it shows up in the practice server's log. This is what it recorded when Chrome opened the dashboard served by `npm run dev`:

```text
07:26:06.245 GET /api/estados cancelada por el cliente
07:26:06.545 GET /api/estados 200
```

Two requests when the page is opened just once. The first was made by the effect's first mount; the cleanup that followed called `control.abort()`, the browser cut the connection, and the server noted it as canceled. The second was made by the second mount, and it is the one that filled the screen.

A clarification about what is guaranteed and what is not. What React guarantees is the extra effect cycle: set up, clean up, and set up again ([React, “StrictMode”](https://react.dev/reference/react/StrictMode)). Whether the server manages to **log** the first request depends on the moment the abort arrives: if the browser cancels it before the connection reaches the server, the log will show only the `200`. In this run the connection did get there, and that is why you see the pair. If on your machine you see a single line, it does not mean `StrictMode` is off; what proves the additional cycle is the first figure, not the log. And this is what it recorded when Chrome opened the built version, served by `npm run preview`:

```text
07:26:22.726 GET /api/estados 200
```

Just one. In production there is no additional cycle. Read carefully what the first log demonstrates: **the effect's cleanup exists and works.** If `useReporte` did not abort the request in its cleanup, the first one would not be canceled, both responses would arrive and both would write the state; if it did not stop the timer, there would be two intervals asking every ten seconds. The Lesson 9 dashboard already had that cleanup, and `StrictMode` confirms it for free every time you open the page.

The temptation, when someone sees two requests for the first time, is to remove `StrictMode` “because it duplicates the calls”. That is removing the alarm because it is ringing. Lesson 3 devotes an entire section to why that double mount is your ally, and to the few situations in which what you need is not to dodge it but to write the effect another way.

### 0.6 The React linter, enabled from day one

ESLint reads your code without running it and looks for patterns it knows are wrong. On its own it does not know React; `eslint-plugin-react-hooks` teaches it its rules. Its recommended configuration, in version 7.1.1, enables sixteen rules: the two classic ones for hooks and fourteen that come from the React Compiler. React's documentation describes them like this: the first two cover the fundamental patterns, `rules-of-hooks` (that hooks are called the same way on every render) and `exhaustive-deps` (that the dependency list contains everything the effect uses), and the rest are compiler diagnostics that can be used even if your application has not adopted it yet ([React, “eslint-plugin-react-hooks”](https://react.dev/reference/eslint-plugin-react-hooks)). (That page lists seventeen; the difference is `component-hook-factories`, which version 7.1.1 of the package does not yet include in its recommended configuration. This was measured by reading the rules that the installed package enables.)

The project's configuration brings together three recommended pieces—those for JavaScript, TypeScript, and React—and keeps the rule that Lesson 9 of TypeScript wrote against XSS:

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

`globalIgnores(["dist"])` keeps ESLint from checking the built code, which you did not write. `files` limits the check to TypeScript files. And `reactHooks.configs.flat.recommended` is the form the package itself indicates for ESLint's flat configuration.

Now, the detail that decides whether the linter is useful or decorative. The `exhaustive-deps` rule is configured as a **warning**, not as an error. And ESLint, with warnings, **finishes successfully**. This is what it looks like if you remove `cadaMs` from `useReporte`'s dependency list and run ESLint as is:

```text
$ npx eslint .

~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

$ echo "código de salida: $?"
código de salida: 0
```

Exit code 0: for any script or automated check, that means “all good”. That warning is the scene the lesson started with: the effect no longer finds out when the interval changes, so your teammate can change it as much as she likes and the dashboard will keep asking every ten seconds. That is why the course's script is `eslint . --max-warnings 0`: with zero warnings allowed, the same change stops the command.

```text
$ npm run lint

> revisor@0.0.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

The course's principle for this warning does not change in any lesson: **you fix the code, you do not silence the rule.** Here the fix is to put `cadaMs` back in the list, which is the truth: the effect uses it. An `// eslint-disable-next-line` comment would remove the warning and leave the defect exactly where it was.

The second figure brings together, in a twelve-line component, the two classic hook errors. It is not part of the `revisor`; it is checked with its own configuration, equal to the project's without the XSS rule:

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

Both errors say the same thing in different words: React identifies each `useState` and each `useEffect` in a component **by the order in which they are called**, not by their name. If on one render `visible` is `false` and the component exits early, that render calls no hooks at all; if on the next it is `true`, it does call them, and React no longer knows which state belongs to which. The message even guesses the cause: “Did you call a hook after an early `return`?”. The fix is to move the hooks above the `if` and leave the condition only for what gets rendered. The warning on the third line is the same one from `useReporte`. The exercise solutions show the corrected version.

And the compiler's rules are not just theory. If inside `useReporte`'s effect you wrote `establecerCarga({ tipo: "cargando" })` right at the start, before creating the `AbortController`, the linter would answer like this (the message is long; it is shown in full because it explains itself):

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

That is the `set-state-in-effect` rule. Notice that the original `useReporte` does call `establecerCarga` inside the effect, but **after an `await`**, when the response arrived from outside: that is synchronizing with an external system, and the rule allows it. What it rejects is changing state immediately, in the effect's body, because that causes an additional render that nothing outside React asked for. The dashboard already sets `cargando` where it belongs: in `recargar`, which runs on a click. This is the first contact with the course's principle about effects; Lesson 3 develops it in full.

The checkpoint passes clean. It is neither a coincidence nor the linter's merit: the Lesson 9 TypeScript code already respected the rules. What changes today is that, from here on, if someone breaks them, `npm run lint` says so and stops.

### 0.7 The practice server and the complete walkthrough

The last file is the practice server. The course is about the screen, and this server is not explained line by line: it is a Node process that answers the same public data as the TypeScript course's API, `GET /api/estados` and `GET /salud`, with four fixed services and a 300 ms delay so that you get to see “Cargando…”. It uses the types from `src/compartido/contrato.ts`, so if those types change, `tsc -b` flags the server too. And it writes one line per request, which is what you used in 0.5 to see `StrictMode`'s two requests.

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

The complete walkthrough uses two terminals. In the first, the practice server:

```text
$ npm run servidor

> revisor@0.0.0 servidor
> node servidor/practica.ts

07:25:45.111 servidor de práctica en http://127.0.0.1:3100
```

From another terminal, check it before mixing it with anything else. If these three responses do not come out like this, the problem is in the server and not in the dashboard:

```text
$ curl -s http://127.0.0.1:3100/salud
ok
$ curl -s http://127.0.0.1:3100/api/estados
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},{"nombre":"reportes","tipo":"falla","detalle":"tiempo límite agotado"}]}
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/no-existe
404
```

In the second terminal, the development server:

```text
$ npm run dev

> revisor@0.0.0 dev
> vite


  VITE v8.3.5  ready in 110 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

“Ready in 110 ms”: it did not bundle your code, which is why it takes so little time. The last line says the server only listens on your machine; with `--host` it would open to your network, and that is not needed. Open `http://localhost:5173/` in your browser. You should see the title “Revisor”, a momentary “Cargando…”, and four services with a green or red border. This is what headless Chrome delivered after running the page's JavaScript (only the container is shown):

```text
<div id="raiz"><main><h1>Revisor</h1><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></main></div>
```

With the page open, do the test that justifies the development server: in `Panel.tsx`, change the `<h1>` text `Revisor` to `Revisor de servicios` and save. The page changes by itself, without reloading, and the list is still there: it did not go through “Cargando…” again. That is the *Fast Refresh* from 0.1.2. (This is checked with your eyes, in an open browser window; no automated tool in the course measures it, and this lesson's runs, made with headless Chrome, do not either: what is stated here is what the React plugin documents. Put the text back when you are done.)

To finish, build and look at the version that would be published. With the practice server still running:

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

`http://localhost:4173/` shows the same dashboard, now from the files in `dist/` and without `StrictMode` active, which is what the 0.5 log confirmed. Shut everything down with Ctrl+C in each terminal; the practice server says goodbye with `servidor de práctica detenido`.

One last check, the one any automated verification makes: delete `node_modules/`, reinstall exactly what is in the lock file with `npm ci`, and repeat. In the Linux container from “About the runs”, from a copy without `node_modules/` or `dist/`, `npm ci`, `npm run lint`, and `npm run build` finished cleanly, and the build produced the same three files with the same names (`index-tGGc24Rg.css` and `index-BWNt33lQ.js`). That the name matches is not a detail: the names in `dist/` come from the content, so if two machines produce the same names, it is very likely that the bundle is the same (the name carries only a fragment of the content hash), and if the names differ, the content is different.

## The error you will see

The lesson has one main error, the one born from Vite not checking types, and two supporting ones.

**The main error: “it builds for me”.** In `Panel.tsx`, change the type of the `cadaMs` property from `number` to `string` and build both ways:

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

`vite build` finishes with its green checkmark: it erased the types and bundled. `npm run build` stops at `tsc -b` with three errors, and `vite build` does not even start. It reads like any TypeScript error: file, line, and column in parentheses, error code, and what does not fit with what. The three errors are the same disagreement seen from three places: `main.tsx` passes a number where text is now expected, the default value `10_000` is a number, and `useReporte` receives text where it expects a number. The fix is to put the type back; the lesson is another: **Vite's checkmark says “I bundled”, not “it is fine”.** In development the same thing happens, with more danger: `npm run dev` serves the file with the error and the dashboard may even work, because at run time a number that the type calls “text” is still a number. Check your editor, and before delivering, run `npm run build`.

**A typo in a variable.** Write `VITE_CADA_MZ` instead of `VITE_CADA_MS` in `configuracion.ts`:

```text
$ npx tsc -b
src/configuracion.ts(11,50): error TS2551: Property 'VITE_CADA_MZ' does not exist on type 'ImportMetaEnv'. Did you mean 'VITE_CADA_MS'?
```

That is the job of `strictImportMetaEnv` (0.4). Without that line in `vite-env.d.ts`, the wrong name would compile, would be `undefined` in the browser, `leerCadaMs` would use the default value, and nobody would know why the variable “does not work”.

**The warning that stops nothing.** It is the one from 0.6: `exhaustive-deps` is a warning, ESLint finishes with code 0, and a check that only looks at the exit code says “clean”. The sign to recognize it is the line `✖ 1 problem (0 errors, 1 warning)` followed by nothing. With `--max-warnings 0`, `ESLint found too many warnings (maximum: 0).` also appears and the command fails.

## Common mistakes

**Running only `vite build` or only `npm run dev`.** Neither checks types. A workflow that does not go through `tsc -b` can deliver a bundle with type errors; that is why the `build` script starts with it.

**Putting a secret in a `VITE_` variable.** Any `VITE_` variable may end up written into the public JavaScript (the one the code reads, certainly; all of them, if one line reads the whole object), as you saw with `grep`. Renaming the variable so that it does not carry the prefix does not make it safe: if the browser needs it, the browser has it. Keys live on a server.

**Opening CORS with `*` on the API so that it works in development.** It solves an annoyance on your machine with a security decision that affects everyone. In development, Vite's *proxy* eliminates the problem without touching the API.

**Removing `StrictMode` because it “makes two requests”.** The second request is the proof that the effect's cleanup works, and in production it does not exist. Removing it hides exactly the bugs it came to show.

**Silencing the linter.** An `// eslint-disable-next-line react-hooks/exhaustive-deps` leaves the effect with a dependency list that lies, and the defect is still there with the warning turned off. If the rule complains, change the code.

**Letting warnings through.** Without `--max-warnings 0`, a dependency warning stops nothing and, over time, nobody reads the linter's output because “it always has something”.

**Pushing `node_modules/` or `dist/` to the repository.** They are rebuilt identically with `npm ci` and `npm run build`. What you do push is `package-lock.json`, which is what makes rebuilding them possible.

**Dependencies without an exact version.** With `^` in `package.json`, two people who install days apart can end up with different versions. The lock file helps, but only if it is pushed and installed with `npm ci`.

**Letting Vite switch ports silently.** Without `strictPort`, a forgotten server on 5173 makes the new one start on 5174, and you end up looking at the old version. With `strictPort: true`, the second one refuses to start.

## Exercises

### Exercise 1 — Change the interval without touching the code

Make the dashboard refresh every 3 seconds without editing any file in `src/`. **Before doing it, predict** how many `GET /api/estados 200` lines the practice server writes in the 10 seconds after opening the page with `npm run dev`. Test it with two different mechanisms: defining the variable in the terminal and creating a `.env.local` file. Which of the two wins if both are present? Why must `.env.local` not be pushed to the repository, and which line in `.gitignore` prevents it?

### Exercise 2 — Fix figure 2

Fix `fig00_02.tsx` so that `npx eslint fig00_02.tsx` reports nothing and the component still renders nothing when `visible` is `false`. Before writing, explain in your log why moving the `if` below the hooks does not change what the person sees.

### Exercise 3 — The missing *proxy*

Add to `vite.config.ts` whatever is needed so that `curl http://localhost:5173/salud` answers `ok`. **Beforehand**, predict what that same request answers today and why it is not a 404 from the API. Check your prediction before changing anything.

### Exercise 4 — The missing cleanup

In `useReporte`, temporarily delete the line `control.abort();` from the effect's cleanup. With the practice server and `npm run dev` running, open the page and read the server's log. What changed compared to 0.5? What does that tell you about what `StrictMode` was checking? Does the linter warn you? Restore the line when you are done.

## Solutions

### Solution 1

In the terminal, the variable goes in front of the command and applies only to that process:

```bash
VITE_CADA_MS=3000 npm run dev
```

With `.env.local`, the file carries one line, `VITE_CADA_MS=3000`, and Vite reads it at startup (if the server was already running, restart it). The prediction: in 10 seconds, the mount's request plus one every 3 seconds, that is, four `200` responses, **plus**, if the connection manages to reach the server before the abort (0.5), a `cancelada por el cliente` line at the start, which is `StrictMode`'s additional cycle. That is how it came out measured with headless Chrome over 10 seconds of its internal clock: one canceled and four `200`s. If both sources are present, the terminal wins: Vite's documentation says that variables that already exist when Vite starts are not overwritten by `.env` files. `.env.local` exists precisely for values on your machine, and the `*.local` line in `.gitignore` keeps it from being pushed. When you finish, delete the file so that your project matches the checkpoint again.

### Solution 2

The hooks go first and the condition only decides what gets rendered; the dependency list names what the effect uses:

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

What the person sees does not change, because the `return null` still happens before rendering the paragraph. What changes is that both hooks are called on every render, in the same order, and React can match them with their state. Note a consequence worth discussing in your log: with `visible` set to `false`, the timer keeps counting even though nothing is visible. If that is not what you want, the solution is not to put the `if` back on top, but for whoever uses `Resumen` not to render it: `{visible && <Resumen cadaMs={5000} />}` (careful with that form when the condition is a number: it is the `0` trap from [Lesson 1](01-componentes-puros-composicion.md)).

### Solution 3

Today, `curl http://localhost:5173/salud` does not reach the API: the path does not start with `/api`, so Vite handles it. For a development server of a single-page application, an unknown path is not an error: it answers with `index.html`, so that the client-side router decides (Lesson 5 returns to this). You will receive the page's HTML, with code 200, not `ok`. Check it before changing anything; it is a good habit not to trust the prediction. To forward it, add another key:

```ts
// vite.config.ts (fragmento)
proxy: {
  "/api": "http://127.0.0.1:3100",
  "/salud": "http://127.0.0.1:3100",
},
```

Restart `npm run dev` so it picks up the new configuration, and the response will be `ok`. This exercise is the reason for the recommendation in 0.3: if all of the API's routes lived under `/api`, a single key would be enough.

### Solution 4

Without `control.abort()`, the log stops showing the `cancelada por el cliente` line: now **two** `GET /api/estados 200` lines appear when the page opens. The first request, the one from the mount that `StrictMode` undid, is no longer canceled by anyone; its response arrives and writes the state of an effect that had already been cleaned up. In this dashboard it is not noticeable at a glance, because the two responses are equal, but if the first were slower and brought stale data, it would overwrite the second: it is the response race condition that Lesson 3 reproduces and fixes. `StrictMode` was checking exactly that, that the cleanup undoes what the effect started. And the linter? It says nothing: the missing cleanup breaks no rule that can be seen in the code's text. That is why `StrictMode` and the linter are two distinct defenses, and the course uses both.

## How I know I got it

- [ ] `node -v` prints a version that starts with `v24`, and `npx tsc --version`, inside `~/curso-react/revisor/`, prints `Version 7.0.2`.
- [ ] With the practice server running, `curl -s http://127.0.0.1:3100/salud` answers `ok`, and `curl -s http://localhost:5173/api/estados` (with `npm run dev` running) answers the JSON for the four services.
- [ ] Opening `http://localhost:5173/` shows the title “Revisor” and four services, and the practice server's log records a `200` when the page opens. If a `cancelada por el cliente` also appears before it, you know how to read it as `StrictMode`'s additional cycle; if it does not appear, you know why that does not mean it is off (0.5).
- [ ] With the built version (`npm run preview`, at `http://localhost:4173/`), the same page produces a single request in the log.
- [ ] `npm run lint` finishes without writing any problem, and when you remove `cadaMs` from `useReporte`'s dependency list it fails with `ESLint found too many warnings (maximum: 0).`
- [ ] `npm run build` finishes with `✓ built` and leaves in `dist/` an `index.html`, a `.css`, and a `.js`; when you change a type on purpose, it stops at `tsc -b` and `vite build` never runs.
- [ ] You can show with `grep` on `dist/` that the value of `VITE_CADA_MS` travels inside the JavaScript, and explain why that rules out putting a secret there.
- [ ] `git status` inside the project does not show `node_modules/` or `dist/` as files to add.
- [ ] You noted in your [log](bitacora.md) your versions, what changed compared to the esbuild bundling, and the first warning the linter gave you.

## Summary

Answer without looking at the lesson:

1. What two different jobs does Vite do, and which of them bundles? Why does the development server not need to bundle?
2. Why does the `build` script start with `tsc -b`? What happens if you only run `vite build` with a type error?
3. What does `tsconfig.app.json` check and what does `tsconfig.node.json` check? Why does one have `DOM` and the other not?
4. Why do you no longer write `.js` at the end of `import`s with `"moduleResolution": "bundler"`?
5. What is an origin? Why can the dashboard on port 5173 not read a response from port 3100, and how does the *proxy* solve it without touching the API?
6. Which variables reach `import.meta.env`, when is their value replaced, and why does no secret belong there?
7. What does `StrictMode` do with effects in development, and what does the `cancelada por el cliente` line in the log demonstrate?
8. What do `rules-of-hooks` and `exhaustive-deps` check? Why does the course run ESLint with `--max-warnings 0`?

## Further reading

- [Vite, “Getting Started”](https://vite.dev/guide/): how to create a project, the list of templates, the Node version it requires, and why `index.html` is the entry point. Accessed on October 21, 2026.
- [Vite, “Why Vite”](https://vite.dev/guide/why): the problems the development server solves and why it bundles for production; Rolldown and Oxc. Accessed on October 21, 2026.
- [Vite, “Announcing Vite 8”](https://vite.dev/blog/announcing-vite8): Rolldown as the only bundler, since March 12, 2026. Accessed on October 21, 2026.
- [Vite, “Dependency Pre-Bundling”](https://vite.dev/guide/dep-pre-bundling): why Vite pre-bundles dependencies in development, and that it does so with Rolldown. Accessed on October 21, 2026.
- [Vite, “Features”](https://vite.dev/guide/features): TypeScript without type checking, `isolatedModules`, the `vite/client` types, and CSS imports. Accessed on October 21, 2026.
- [Vite, “Env Variables and Modes”](https://vite.dev/guide/env-and-mode): the `VITE_` prefix, the order of `.env` files, the warning about sensitive information, and the types with `strictImportMetaEnv`. Accessed on October 21, 2026.
- [Vite, “Server Options”](https://vite.dev/config/server-options) and [“Preview Options”](https://vite.dev/config/preview-options): `server.proxy`, `server.port`, `strictPort`, and the *proxy* inherited by `vite preview`. Accessed on October 21, 2026.
- [Vite, “Deploying a Static Site”](https://vite.dev/guide/static-deploy): why `vite preview` is not a production server. Accessed on October 21, 2026.
- [vite-plugin-react, `@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react): *Fast Refresh*, the automatic JSX *runtime*, and the compiler option. Accessed on October 21, 2026.
- [React, “StrictMode”](https://react.dev/reference/react/StrictMode): the development checks, the extra effect cycle, and why they do not affect the build. Accessed on October 21, 2026.
- [React, “eslint-plugin-react-hooks”](https://react.dev/reference/eslint-plugin-react-hooks): the recommended configuration, the hook rules, and the compiler ones. Accessed on October 21, 2026.
- [React, “Build a React app from Scratch”](https://react.dev/learn/build-a-react-app-from-scratch) and [“Sunsetting Create React App”](https://react.dev/blog/2025/02/14/sunsetting-create-react-app): when a tool like Vite makes sense, and the deprecation of Create React App. Accessed on October 21, 2026.
- [MDN, “Cross-Origin Resource Sharing (CORS)”](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS): the same-origin policy for `fetch()` and the `Access-Control-Allow-Origin` header. Accessed on October 21, 2026.
- [TypeScript, “TSConfig Reference”](https://www.typescriptlang.org/tsconfig/): `moduleResolution`, `noEmit`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly`, and project references. Accessed on October 21, 2026.
- [typescript-eslint, “Dependency Versions”](https://typescript-eslint.io/users/dependency-versions/): the TypeScript and ESLint versions it supports. Accessed on October 21, 2026.
- [Node.js, “Modules: TypeScript”](https://nodejs.org/api/typescript.html), [“Download”](https://nodejs.org/en/download), and [“Previous Releases”](https://nodejs.org/en/about/previous-releases): running `.ts` directly with Node and its conditions; the versions of the 24 LTS line. Accessed on October 21, 2026.

### Terms in this lesson

| Term | What it means |
|---|---|
| development server | the process that `npm run dev` starts: it serves each module separately, translated on the fly, and tells the browser when a file changes |
| HMR / *Fast Refresh* | replacing in the page only the module that changed, without reloading; in React it keeps the state of the components that did not change |
| build | what `npm run build` does: check types and bundle into `dist/` the files that get published |
| project references | several small `tsconfig` files that `tsc -b` checks separately, each with its own rules |
| origin | the combination of scheme, host, and port of an address; two different ports are two different origins |
| same-origin policy | the browser rule that prevents a script from reading responses from another origin, unless the response allows it with CORS |
| (development) *proxy* | Vite's forwarding of certain paths to another server, so that the browser sees a single origin |
| `VITE_` variable | configuration that Vite writes into the client code; public by definition |
| `StrictMode` | React component that, in development only, renders twice and runs an additional cycle of each effect to uncover bugs |
| `--max-warnings 0` | ESLint option that makes the command fail if there is at least one warning |

---

**Next:** [Lesson 1 — Pure components and composition](01-componentes-puros-composicion.md)
