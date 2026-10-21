import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Servicio = { readonly nombre: string; readonly ms: number };

function Fila({ servicio }: { readonly servicio: Servicio }) {
  console.log(`  render: Fila ${servicio.nombre}`);
  return (
    <li>
      {servicio.nombre}: {servicio.ms} ms
    </li>
  );
}

function Lista({ servicios }: { readonly servicios: readonly Servicio[] }) {
  console.log("  render: Lista");
  return (
    <ul>
      {servicios.map((servicio) => (
        <Fila key={servicio.nombre} servicio={servicio} />
      ))}
    </ul>
  );
}

const contenedor = dom.window.document.getElementById("raiz")!;
let cambios = 0;
const observador = new dom.window.MutationObserver((registros) => {
  cambios += registros.length;
});
observador.observe(contenedor, { childList: true, subtree: true, characterData: true });
const raiz = createRoot(contenedor);

async function dibujar(titulo: string, servicios: readonly Servicio[]): Promise<void> {
  console.log(titulo);
  await act(async () => {
    raiz.render(<Lista servicios={servicios} />);
  });
  cambios += observador.takeRecords().length;
  console.log(`  commit: cambios en el DOM = ${cambios}`);
  cambios = 0;
}

await dibujar("1) primera vez:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 118 },
]);
await dibujar("2) mismos datos:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 118 },
]);
await dibujar("3) cambia un número:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 97 },
]);
console.log(`DOM final: ${contenedor.innerHTML}`);
dom.window.close();
