// fig05_01.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, Outlet, useLocation, useParams, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Disposicion() {
  return (
    <>
      [disposición] <Outlet />
    </>
  );
}

function Reporte() {
  return <>reporte</>;
}

function Servicio() {
  const { nombre } = useParams();
  return <>servicio «{nombre}»</>;
}

function NoEncontrada() {
  return <>no existe {useLocation().pathname}</>;
}

const rutas: RouteObject[] = [
  {
    path: "/",
    Component: Disposicion,
    children: [
      { index: true, Component: Reporte },
      { path: "servicios/:nombre", Component: Servicio },
      { path: "*", Component: NoEncontrada },
    ],
  },
];

for (const direccion of ["/", "/servicios/pagos", "/servicios/cat%C3%A1logo", "/servicios", "/servicios/pagos/extra"]) {
  const enrutador = createMemoryRouter(rutas, { initialEntries: [direccion] });
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  console.log(`${direccion.padEnd(26)} → ${contenedor.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}
dom.window.close();
