// fig04_03.tsx
import { useQuery } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// El mismo patrón que LimiteDeError del revisor, reducido a lo indispensable.
class Limite extends Component<{ readonly children: ReactNode }, { readonly error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      return <p role="alert">Algo salió mal al dibujar el panel: {this.state.error.message}</p>;
    }

    return this.props.children;
  }
}

function Panel() {
  const consulta = useQuery({ queryKey: ["reporte"], queryFn: async () => ["catálogo"] });
  return <p>{consulta.data?.length ?? 0} servicios</p>;
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor, {
  onCaughtError: (error) => console.log(`React atrapó: ${error instanceof Error ? error.message : error}`),
});

// Falta <QueryClientProvider> alrededor de <Panel />.
await act(async () =>
  raiz.render(
    <Limite>
      <Panel />
    </Limite>,
  ),
);
console.log(`En pantalla: ${contenedor.textContent}`);

await act(async () => raiz.unmount());
dom.window.close();
