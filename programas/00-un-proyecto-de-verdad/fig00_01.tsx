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
