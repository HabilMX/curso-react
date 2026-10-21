// fig09_01.tsx
import { JSDOM } from "jsdom";
import { act, Profiler, useState, type ProfilerOnRenderCallback } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");

const SERVICIOS = ["catálogo", "pagos", "inventario", "reportes"];

// Gasta tiempo sin hacer nada útil: simula un dibujo caro. Sigue siendo impuro (lee el
// reloj); el linter no lo ve porque está en otra función. Se acepta solo porque no
// produce nada que se dibuje: nunca escondas así una impureza de verdad.
function gastar(ms: number): void {
  const hasta = performance.now() + ms;
  while (performance.now() < hasta) {
    // espera activa
  }
}

// Una lista que tarda 20 ms en dibujarse: el costo es a propósito, para que se vea.
function ListaLenta() {
  gastar(20);
  return (
    <ul>
      {SERVICIOS.map((nombre) => (
        <li key={nombre}>{nombre}</li>
      ))}
    </ul>
  );
}

// Lo que mide el Profiler: cuántos dibujos hubo de la lista y cuánto tardaron.
const medidas: { fase: string; ms: number }[] = [];
const anotar: ProfilerOnRenderCallback = (_id, fase, duracionReal) => {
  medidas.push({ fase, ms: duracionReal });
};

function ListaMedida() {
  return (
    <Profiler id="lista" onRender={anotar}>
      <ListaLenta />
    </Profiler>
  );
}

// A. El borrador de la nota vive en el panel: cada tecla dibuja el panel completo.
function PanelArriba() {
  const [borrador, establecerBorrador] = useState("");
  return (
    <>
      <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />
      <ListaMedida />
    </>
  );
}

// B. Estructura primero: el borrador baja al único componente que lo usa.
function CampoNota() {
  const [borrador, establecerBorrador] = useState("");
  return <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />;
}

function PanelAbajo() {
  return (
    <>
      <CampoNota />
      <ListaMedida />
    </>
  );
}

function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function medir(titulo: string, Panel: () => React.ReactNode): Promise<void> {
  medidas.length = 0;
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(<Panel />));
  const campo = contenedor.querySelector("input");

  if (campo === null) {
    throw new Error("no hay campo");
  }

  let texto = "";
  for (const letra of "caído") {
    texto += letra;
    await act(async () => escribir(campo, texto));
  }

  const fases = medidas.map((medida) => medida.fase).join(", ");
  const lentas = medidas.filter((medida) => medida.ms >= 20).length;
  console.log(titulo);
  const veces = medidas.length === 1 ? "1 vez" : `${medidas.length} veces`;
  console.log(`  5 teclas → la lista se dibujó ${veces}: ${fases}`);
  console.log(`  dibujos de la lista que tardaron 20 ms o más: ${lentas}`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await medir("A. el borrador vive en el panel:", PanelArriba);
await medir("B. el borrador vive en CampoNota:", PanelAbajo);
dom.window.close();
