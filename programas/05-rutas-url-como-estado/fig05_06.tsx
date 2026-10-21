// fig05_06.tsx
import { JSDOM } from "jsdom";
import { act, type ReactNode } from "react";
import { createMemoryRouter, Outlet, useRouteError, type RouteObject } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

// Los avisos de consola se esperan; aquí solo se cuentan.
let avisosDeConsola = 0;
console.error = () => {
  avisosDeConsola += 1;
};

function Disposicion() {
  return (
    <>
      <header>
        <h1>Revisor</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

function PaginaRota(): ReactNode {
  throw new Error("la página se rompió al dibujar");
}

function ErrorDeRuta() {
  const error = useRouteError();

  return (
    <div role="alert" className="limite-de-error">
      <h2>Algo salió mal al dibujar el panel</h2>
      <p>{error instanceof Error ? error.message : "error desconocido"}</p>
    </div>
  );
}

async function dibujar(titulo: string, raizDeRutas: RouteObject): Promise<void> {
  console.log(titulo);
  avisosDeConsola = 0;
  const enrutador = createMemoryRouter([raizDeRutas]);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  // Sin el <pre> de la pila, que trae rutas de la máquina.
  const copia = contenedor.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("pre").forEach((pila) => pila.remove());
  console.log(`  pantalla:    ${copia.textContent}`);
  console.log(`  encabezado:  ${copia.querySelector("header") === null ? "no está" : "está"}`);
  console.log(`  role=alert:  ${copia.querySelector('[role="alert"]') === null ? "no está" : "está"}`);
  console.log(`  avisos de consola: ${avisosDeConsola}`);
  await act(async () => {
    raiz.unmount();
  });
}

const hijas: RouteObject[] = [{ index: true, Component: PaginaRota }];

await dibujar("1. sin ErrorBoundary:", { path: "/", Component: Disposicion, children: hijas });
await dibujar("2. con ErrorBoundary en la ruta raíz:", {
  path: "/",
  Component: Disposicion,
  ErrorBoundary: ErrorDeRuta,
  children: hijas,
});
dom.window.close();
