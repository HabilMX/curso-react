import { JSDOM } from "jsdom";
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Servicio = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

const revision = 0;

function ResumenImpuro({
  servicios,
  revision,
  hora,
}: {
  readonly servicios: readonly Servicio[];
  readonly revision: number;
  readonly hora: string;
}) {
  const ordenados = [...servicios].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <p>
      Revisión {revision} a las {hora}: {ordenados.map((s) => s.nombre).join(", ")}
    </p>
  );
}

const servicios: Servicio[] = [
  { nombre: "pagos", tipo: "falla" },
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "reportes", tipo: "falla" },
];
const nombres = () => servicios.map((s) => s.nombre).join(", ");

console.log(`1) el arreglo antes de dibujar:   ${nombres()}`);
const raiz = createRoot(dom.window.document.getElementById("raiz")!);
await act(async () => {
  raiz.render(
    <StrictMode>
      <ResumenImpuro servicios={servicios} revision={1} hora="10:00:00" />
    </StrictMode>,
  );
});
console.log(`2) el arreglo después de dibujar: ${nombres()}`);
console.log(`3) se montó una vez y el contador dice: ${revision}`);

const horaDe = (html: string) => /a las (\d\d:\d\d:\d\d)/.exec(html)?.[1];
const primera = renderToStaticMarkup(<ResumenImpuro servicios={servicios} revision={1} hora="10:00:00" />);
await new Promise((listo) => setTimeout(listo, 1100));
const segunda = renderToStaticMarkup(<ResumenImpuro servicios={servicios} revision={1} hora="10:00:00" />);
console.log(`4) mismas props, ¿misma hora en los dos dibujos? ${horaDe(primera) === horaDe(segunda) ? "sí" : "no"}`);
dom.window.close();
