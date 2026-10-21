// fig04_02.tsx
import { onlineManager, QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// La «API» responde bien o falla según esta variable.
let apiCaida = false;

async function cargarNombres(): Promise<readonly string[]> {
  await new Promise((resolver) => setTimeout(resolver, 50));

  if (apiCaida) {
    throw new Error("la API respondió 503");
  }

  return ["catálogo", "pagos", "inventario", "reportes"];
}

function Observador() {
  const consulta = useQuery({ queryKey: ["reporte"], queryFn: cargarNombres, retry: false });
  const datos = consulta.data === undefined ? "sin datos" : `${consulta.data.length} servicios`;

  // Escribir en la consola es sincronizarse con algo de fuera de React: un Effect.
  useEffect(() => {
    console.log(`  status=${consulta.status.padEnd(7)} fetchStatus=${consulta.fetchStatus.padEnd(8)} ${datos}`);
  }, [consulta.status, consulta.fetchStatus, datos]);

  return null;
}

const esperar = (ms: number) => act(() => new Promise<void>((resolver) => setTimeout(resolver, ms)));
const clienteConsultas = new QueryClient();
const raiz = createRoot(dom.window.document.createElement("div"));

console.log("1. sin red, se monta el componente:");
onlineManager.setOnline(false);
await act(async () =>
  raiz.render(
    <QueryClientProvider client={clienteConsultas}>
      <Observador />
    </QueryClientProvider>,
  ),
);
await esperar(100);

console.log("2. vuelve la red:");
await act(async () => onlineManager.setOnline(true));
await esperar(100);

console.log("3. la API se cae y se pide otra vez:");
apiCaida = true;
await act(async () => void clienteConsultas.refetchQueries({ queryKey: ["reporte"] }));
await esperar(100);

await act(async () => raiz.unmount());
clienteConsultas.clear();
dom.window.close();
