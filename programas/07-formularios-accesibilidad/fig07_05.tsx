// fig07_05.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// Un lector de pantalla anuncia los CAMBIOS de una región viva. Aquí un
// MutationObserver hace de oído: cuenta qué cambió dentro de la región.
// `envio` no se dibuja: solo prueba que cada envío vuelve a dibujar el componente.
function Resultado({ envio, detalle }: { readonly envio: number; readonly detalle: string | null }) {
  console.log(`  (dibujo del envío ${envio})`);
  return (
    <div role="alert">
      {detalle !== null && <p>{detalle}</p>}
    </div>
  );
}

const contenedor = dom.window.document.getElementById("raiz")!;
const raiz = createRoot(contenedor);
await act(async () => raiz.render(<Resultado envio={0} detalle={null} />));

const region = contenedor.querySelector('[role="alert"]')!;
let cambios = 0;
const oido = new dom.window.MutationObserver((registros) => {
  cambios += registros.length;
});
oido.observe(region, { childList: true, subtree: true, characterData: true });

const envios: [number, string | null][] = [
  [1, "Revisa los campos marcados."],
  [2, "Revisa los campos marcados."],
  [3, "ya existe un servicio llamado correo"],
];

for (const [envio, detalle] of envios) {
  cambios = 0;
  await act(async () => raiz.render(<Resultado envio={envio} detalle={detalle} />));
  console.log(`envío ${envio}: «${region.textContent}» → cambios en role="alert": ${cambios}`);
}

oido.disconnect();
await act(async () => raiz.unmount());
dom.window.close();
