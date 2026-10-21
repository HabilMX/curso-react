// fig07_01.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// react-dom decide al CARGARSE si hay un DOM con eventos `input`; por eso se
// importa después de preparar `window`, y no arriba con los demás.
const { createRoot } = await import("react-dom/client");

// Los avisos de React salen por console.error: se imprimen recortados al primer renglón.
console.error = (formato: unknown) => {
  console.log(`  [aviso de React] ${String(formato).split("\n")[0]}`);
};

// Escribe en un <input> como lo haría una persona: cambia el valor y avisa con un evento.
function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

function NoControlado() {
  return <input aria-label="no controlado" defaultValue="correo" />;
}

function Controlado() {
  const [nombre, establecerNombre] = useState("correo");
  return (
    <>
      <input aria-label="controlado" value={nombre} onChange={(e) => establecerNombre(e.target.value.toUpperCase())} />
      <output>{nombre}</output>
    </>
  );
}

function SinOnChange() {
  return <input aria-label="sin onChange" value="correo" />;
}

async function probar(titulo: string, arbol: React.ReactNode, texto: string): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(arbol));
  const campo = contenedor.querySelector("input");

  if (campo === null) {
    throw new Error("no hay campo");
  }

  await act(async () => escribir(campo, texto));
  console.log(`  escribí «${texto}» → el campo dice «${campo.value}»`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await probar("1. no controlado (defaultValue):", <NoControlado />, "correo2");
await probar("2. controlado (value + onChange):", <Controlado />, "correo2");
await probar("3. value sin onChange:", <SinOnChange />, "correo2");
dom.window.close();
