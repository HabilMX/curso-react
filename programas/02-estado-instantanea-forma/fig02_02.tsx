// fig02_02.tsx
import { JSDOM } from "jsdom";
import { act, Profiler, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Notas = Record<string, string>;

let dibujos = 0;

function BlocDeNotas() {
  const [notas, establecerNotas] = useState<Notas>({});

  function mutar(): void {
    notas.pagos = "se reinició a las 9:40";
    establecerNotas(notas);
  }

  function copiar(): void {
    establecerNotas({ ...notas, pagos: "se reinició a las 9:40" });
  }

  return (
    <>
      <p>notas guardadas: {Object.keys(notas).length}</p>
      <button type="button" id="mutar" onClick={mutar}>
        mutar
      </button>
      <button type="button" id="copiar" onClick={copiar}>
        copiar
      </button>
    </>
  );
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor);

async function clic(id: string): Promise<void> {
  await act(async () => {
    contenedor
      .querySelector(`#${id}`)
      ?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  console.log(`clic en «${id}»: pantalla «${contenedor.querySelector("p")?.textContent}», dibujos: ${dibujos}`);
}

await act(async () => {
  raiz.render(
    <Profiler id="bloc" onRender={() => (dibujos += 1)}>
      <BlocDeNotas />
    </Profiler>,
  );
});
console.log(`al montar:      pantalla «${contenedor.querySelector("p")?.textContent}», dibujos: ${dibujos}`);
await clic("mutar");
await clic("copiar");
await act(async () => {
  raiz.unmount();
});
dom.window.close();
