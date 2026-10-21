// fig05_02.tsx
import { JSDOM } from "jsdom";
import { act, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Borrador({ nombre }: { readonly nombre: string }) {
  // El estado inicial solo se usa la PRIMERA vez que se monta el componente.
  const [borrador] = useState(`nota sobre ${nombre}`);
  return <>dirección: {nombre} · borrador: {borrador}</>;
}

function SinKey() {
  const { nombre = "" } = useParams();
  return <Borrador nombre={nombre} />;
}

function ConKey() {
  const { nombre = "" } = useParams();
  return <Borrador key={nombre} nombre={nombre} />;
}

async function recorrer(titulo: string, Pagina: ComponentType): Promise<void> {
  console.log(titulo);
  const enrutador = createMemoryRouter([{ path: "/servicios/:nombre", Component: Pagina }], {
    initialEntries: ["/servicios/pagos"],
  });
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  console.log(`  ${contenedor.textContent}`);
  await act(async () => {
    await enrutador.navigate("/servicios/inventario");
  });
  console.log(`  ${contenedor.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await recorrer("sin key:", SinKey);
await recorrer("con key={nombre}:", ConKey);
dom.window.close();
