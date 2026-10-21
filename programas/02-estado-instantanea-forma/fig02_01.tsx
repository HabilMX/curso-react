// fig02_01.tsx
import { JSDOM } from "jsdom";
import { act, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function ConValor() {
  const [revisiones, establecerRevisiones] = useState(0);

  function revisarTres(): void {
    establecerRevisiones(revisiones + 1);
    establecerRevisiones(revisiones + 1);
    establecerRevisiones(revisiones + 1);
    console.log(`  dentro del clic, revisiones vale ${revisiones}`);
  }

  return (
    <button type="button" onClick={revisarTres}>
      {revisiones}
    </button>
  );
}

function ConActualizadora() {
  const [revisiones, establecerRevisiones] = useState(0);

  function revisarTres(): void {
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones((actual) => actual + 1);
    console.log(`  dentro del clic, revisiones vale ${revisiones}`);
  }

  return (
    <button type="button" onClick={revisarTres}>
      {revisiones}
    </button>
  );
}

async function hacerClic(titulo: string, Componente: ComponentType): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<Componente />);
  });

  const boton = contenedor.querySelector("button");
  await act(async () => {
    boton?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });

  console.log(`  después del clic, el botón dice ${boton?.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await hacerClic("con el valor (revisiones + 1, tres veces):", ConValor);
await hacerClic("con la forma actualizadora (actual => actual + 1, tres veces):", ConActualizadora);
dom.window.close();
