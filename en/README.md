# React course — from a monolithic dashboard to an application that holds up

**By Dorian Chávez, founder of Hábil and integration architect.**

**Who it is for:** anyone who has already taken our TypeScript course and wants to thoroughly understand what its lesson 9 barely got working, and anyone who programs in JavaScript or TypeScript, has copied components that work, and wants to know why they work and why, all of a sudden, they stop working. No prior experience with React is assumed beyond having seen a component: every concept is explained as it comes up, along with why it exists, not just how it is written.

**What you will know by the end:** how to build a multi-screen React application, decide where each piece of state lives, fetch data without race conditions or blank screens, test it with tests that actually catch errors, measure it before optimizing it and publish it. And you will be able to read React's documentation on your own.

**Where it fits:** this course is the step that follows our [TypeScript course](https://github.com/HabilMX/curso-typescript). Its lesson 9 already put together a dashboard with components, `useState` and `useEffect`; we don't repeat it here; we go deeper. If you have never written a web page, start with the Web Fundamentals course.

**What you need before you start:** a computer with Linux Mint, knowing how to open a terminal, being able to read TypeScript types (unions, simple generics) and having seen, at least once, a React component. [Lesson 0](00-un-proyecto-de-verdad.md) installs everything that is missing, with Node 24 LTS.

## The project you will build

The **`revisor`**: the screen that shows the status of a list of services (name, status and response time). It starts as the monolithic dashboard from lesson 9 of TypeScript and ends as a multi-screen application: a report with filters kept in the URL, the detail view for each service, cached data that updates in the background, a form to register services, notifications, a test suite and a published version.

It is the same problem as in our Go, Rust, TypeScript and Web Fundamentals courses. What changes is the bar: not “make it work”, but “make it hold up when it grows”. The course includes a practice server with the API contract, so you do not need to have finished the TypeScript course to follow this one.

## The ten lessons

| Lesson | | What you build | What you learn |
|---|---|---|---|
| 0 | [A real project: Vite, StrictMode, and the linter](00-un-proyecto-de-verdad.md) | the dashboard from lesson 9 of TypeScript, moved to Vite | what Vite adds; `react-ts`, structure by feature, proxy to the API, `VITE_` variables, React linter enabled |
| 1 | [Pure components and composition](01-componentes-puros-composicion.md) | the dashboard split into pieces | render and *commit*; purity; `children`; stable `key`; the `0` trap; never a component inside another |
| 2 | [State: snapshot, immutability, and shape](02-estado-instantanea-forma.md) | “failures only” filter, note per service, selection | state as a snapshot; updater form; copy, do not mutate; five rules of shape; lifting state up; `key` to reset |
| 3 | [Effects: synchronizing, not “when it loads”](03-effects-sincronizar.md) | polling every 10 s and detail view that resets | starting and stopping synchronization; cleanup; response race condition; StrictMode; honest dependencies; `useEffectEvent` |
| 4 | [Server state with TanStack Query](04-estado-del-servidor.md) | the cached report and “retry” button | `useQuery`, `queryKey`, `signal`; `status` and `fetchStatus`; `refetchInterval`; `useMutation`; the empty state; Error Boundary |
| 5 | [Routes and the URL as state](05-rutas-url-como-estado.md) | list, detail, 404 and filters in the URL | `createBrowserRouter`, `<Outlet />`, `useSearchParams`, `NavLink`; reloading a client route |
| 6 | [Shared state: reducer and context](06-reducer-contexto.md) | notifications tray and preferences | `useReducer` and pure reducer; two-part context; hook that requires a provider; what state lives where |
| 7 | [Forms, actions, and accessibility](07-formularios-accesibilidad.md) | registering a service | `<form action>`, `useActionState`, `useFormStatus`, `useOptimistic`; validation; `aria-invalid`; live regions; keyboard |
| 8 | [Component tests](08-pruebas-de-componentes.md) | the dashboard's test suite | Vitest and Testing Library; queries by role; `findBy`; `user-event`; the test that turns red when you revert the fix |
| 9 | [Performance, publishing, and when to use a framework](09-rendimiento-publicacion.md) | the `revisor` measured and published | Profiler; React Compiler 1.0; `vite build`; rewrite to `index.html`; Server Components and when to migrate |

At the end of each lesson there are exercises with their solutions. And the [logbook](bitacora.md) is yours: write down there what was hard for you.

## Three principles that run through the whole course

**An Effect is for synchronizing with something outside React.** It is not for calculating a value, it is not for reacting to a click, and it is not for “when it loads”. The dependency list describes the code; if the linter complains, you change the code, you never silence the rule. It is the most expensive mistake in React and all of lesson 3 is about it, but it shows up from lesson 2 on.

**First you measure, then you optimize.** `useMemo`, `useCallback` and `memo` are tools with a cost, not a habit. The course introduces them when a measurement calls for them, and first teaches the structure (local state, `children`) that prevents most unnecessary re-renders.

**Accessibility and security are not lessons, they are habits.** The queries by role in lesson 8 push you to write accessible HTML, lesson 7 brings the keyboard and live regions, and lesson 9 reviews XSS and what must never go in a `VITE_` variable.

## How you know you are done

The course does not end when you have read lesson 9, but when your `revisor` meets these five things. They are the same checks that run on every change:

1. **`npm run lint` reports nothing**, and there is not a single `eslint-disable` for the React rules.
2. **`npm test` passes**, and every test that protects a fix turned red when you reverted it.
3. **All four states exist** (loading, error, empty and with data), plus “stale data while updating”, and each one has its test.
4. **It can be navigated completely with the keyboard**, and change notifications reach a screen reader.
5. **`npm run build` finishes cleanly**, the preview reloads `/servicios/pagos` without returning a 404 when served with a rewrite, and no key or secret appears in `dist/`.
