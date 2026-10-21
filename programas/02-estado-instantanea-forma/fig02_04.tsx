// fig02_04.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

const primerReporte: readonly Estado[] = [
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "pagos", tipo: "falla" },
];
const segundoReporte: readonly Estado[] = [
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "pagos", tipo: "disponible" },
];

function GuardaElObjeto({ estados }: { readonly estados: readonly Estado[] }) {
  const [elegido] = useState<Estado | null>(estados[1] ?? null);
  return <p>guarda el objeto: {elegido === null ? "nada" : `${elegido.nombre} está ${elegido.tipo}`}</p>;
}

function GuardaElNombre({ estados }: { readonly estados: readonly Estado[] }) {
  const [seleccionado] = useState<string | null>("pagos");
  const elegido = estados.find((estado) => estado.nombre === seleccionado);
  return <p>guarda el nombre: {elegido === undefined ? "nada" : `${elegido.nombre} está ${elegido.tipo}`}</p>;
}

function Pantalla({ estados }: { readonly estados: readonly Estado[] }) {
  const lista = estados.map((estado) => `${estado.nombre}=${estado.tipo}`).join(", ");
  return (
    <>
      <p>lista: {lista}</p>
      <GuardaElObjeto estados={estados} />
      <GuardaElNombre estados={estados} />
    </>
  );
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor);
const imprimir = (titulo: string) => {
  console.log(titulo);
  for (const parrafo of contenedor.querySelectorAll("p")) {
    console.log(`  ${parrafo.textContent}`);
  }
};

await act(async () => {
  raiz.render(<Pantalla estados={primerReporte} />);
});
imprimir("primer reporte, con pagos elegido:");

await act(async () => {
  raiz.render(<Pantalla estados={segundoReporte} />);
});
imprimir("llega el siguiente sondeo (pagos se recuperó):");

await act(async () => {
  raiz.unmount();
});
dom.window.close();
