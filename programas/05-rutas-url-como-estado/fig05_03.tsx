// fig05_03.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createMemoryRouter, useSearchParams } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// React DOM decide al cargarse si hay un navegador; por eso se importa DESPUÉS de crear el DOM.
const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

function Buscador({ reemplazar }: { readonly reemplazar: boolean }) {
  const [parametros, establecerParametros] = useSearchParams();

  return (
    <input
      type="search"
      value={parametros.get("q") ?? ""}
      onChange={(evento) => establecerParametros({ q: evento.target.value }, { replace: reemplazar })}
    />
  );
}

function Detalle() {
  return null;
}

const escribirValor = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;

async function teclear(reemplazar: boolean): Promise<void> {
  console.log(`replace: ${reemplazar}`);
  const enrutador = createMemoryRouter(
    [
      { path: "/", element: <Buscador reemplazar={reemplazar} /> },
      { path: "/servicios/:nombre", Component: Detalle },
    ],
    { initialEntries: ["/servicios/pagos", "/"], initialIndex: 1 },
  );
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });

  const caja = contenedor.querySelector("input")!;
  for (const texto of ["p", "pa", "pag"]) {
    await act(async () => {
      escribirValor.call(caja, texto);
      caja.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    const { pathname, search } = enrutador.state.location;
    console.log(`  tecleó «${texto}»: ${pathname}${search} (${enrutador.state.historyAction})`);
  }

  await act(async () => {
    await enrutador.navigate(-1);
  });
  const { pathname, search } = enrutador.state.location;
  console.log(`  botón Atrás:  ${pathname}${search}`);

  await act(async () => {
    raiz.unmount();
  });
  contenedor.remove();
}

await teclear(false);
await teclear(true);
dom.window.close();
