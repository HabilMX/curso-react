// fig02_03.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// react-dom comprueba al cargarse si existe `window.document` y si el documento
// admite el evento `input`, así que se importa después de que exista `window`
// (los import de arriba se cargan antes).
const { createRoot } = await import("react-dom/client");

function Editor({ nombre }: { readonly nombre: string }) {
  const [borrador, establecerBorrador] = useState("");

  return (
    <label>
      {`Nota sobre ${nombre}`}
      <textarea value={borrador} onChange={(evento) => establecerBorrador(evento.target.value)} />
    </label>
  );
}

function Detalle({ nombre, conKey }: { readonly nombre: string; readonly conKey: boolean }) {
  return conKey ? <Editor key={nombre} nombre={nombre} /> : <Editor nombre={nombre} />;
}

function escribir(area: HTMLTextAreaElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")?.set;
  asignar?.call(area, texto);
  area.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function probar(conKey: boolean): Promise<void> {
  console.log(conKey ? "con key={nombre}:" : "sin key:");
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  const leer = () =>
    `«${contenedor.querySelector("label")?.firstChild?.textContent}» → borrador «${contenedor.querySelector("textarea")?.value}»`;

  await act(async () => {
    raiz.render(<Detalle nombre="pagos" conKey={conKey} />);
  });
  await act(async () => {
    const area = contenedor.querySelector("textarea");
    if (area !== null) {
      escribir(area, "llamar al proveedor");
    }
  });
  console.log(`  escribes en pagos:    ${leer()}`);

  await act(async () => {
    raiz.render(<Detalle nombre="reportes" conKey={conKey} />);
  });
  console.log(`  eliges reportes:      ${leer()}`);

  await act(async () => {
    raiz.unmount();
  });
  contenedor.remove();
}

await probar(false);
await probar(true);
dom.window.close();
