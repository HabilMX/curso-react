// fig07_04.tsx
import { computeAccessibleDescription, computeAccessibleName } from "dom-accessibility-api";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// Una copia reducida del Campo del revisor (src/alta/Campo.tsx): las mismas relaciones de
// etiqueta, aria-invalid y aria-describedby; sin type, required, defaultValue ni clases,
// que no cambian el nombre ni la descripción accesibles.
function Campo({ nombre, etiqueta, ayuda, error }: {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly ayuda: string;
  readonly error: string | undefined;
}) {
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;

  return (
    <div className="campo">
      <label htmlFor={nombre}>{etiqueta}</label>
      <input
        id={nombre}
        name={nombre}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? idAyuda : `${idError} ${idAyuda}`}
      />
      {error !== undefined && <p id={idError}>{error}</p>}
      <p id={idAyuda}>{ayuda}</p>
    </div>
  );
}

// Lo mismo, a la antigua: un texto encima del campo, sin <label> ni aria-*.
function CampoSinRelaciones() {
  return (
    <div>
      <p>Nombre</p>
      <input name="nombre" />
      <p>escribe un valor</p>
    </div>
  );
}

const raiz = createRoot(dom.window.document.getElementById("raiz")!);

async function leer(titulo: string, arbol: React.ReactNode): Promise<void> {
  await act(async () => raiz.render(arbol));
  const campo = dom.window.document.querySelector("input")!;
  console.log(titulo);
  console.log(`  html:        ${campo.outerHTML}`);
  console.log(`  nombre:      «${computeAccessibleName(campo)}»`);
  console.log(`  descripción: «${computeAccessibleDescription(campo)}»`);
}

const ayuda = "Un nombre corto y único, por ejemplo: correo";
await leer("sin error:", <Campo nombre="nombre" etiqueta="Nombre" ayuda={ayuda} error={undefined} />);
await leer("con error:", <Campo nombre="nombre" etiqueta="Nombre" ayuda={ayuda} error="escribe un valor" />);
await leer("sin relaciones:", <CampoSinRelaciones />);
await act(async () => raiz.unmount());
dom.window.close();
