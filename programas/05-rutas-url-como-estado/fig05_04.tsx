// fig05_04.tsx
import { JSDOM } from "jsdom";
import { act, Component, type ReactNode } from "react";
import { createMemoryRouter, useSearchParams } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

// Los avisos de consola de React traen pilas largas: aquí solo se muestra su primer renglón.
console.error = (...partes: unknown[]) => {
  const [formato, ...resto] = partes;
  const texto = typeof formato === "string" && formato.startsWith("%o") ? resto : partes;
  const primero = texto.map((parte) => (parte instanceof Error ? parte.message : String(parte))).join(" ");
  console.log(`  [consola] ${primero.split("\n")[0]}`);
};

class Limite extends Component<{ readonly children: ReactNode }, { readonly error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error === null ? this.props.children : <>[límite propio] {this.state.error.message}</>;
  }
}

function Filtros() {
  const [parametros] = useSearchParams();
  return <>q = {parametros.get("q")}</>;
}

function Rota(): ReactNode {
  throw new Error("la página se rompió al dibujar");
}

async function dibujar(titulo: string, arbol: ReactNode): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Limite>{arbol}</Limite>);
  });
  // Sin el <pre> de la pila, que trae rutas de la máquina.
  const copia = contenedor.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("pre").forEach((pila) => pila.remove());
  console.log(`  pantalla: ${copia.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await dibujar("1. useSearchParams sin enrutador:", <Filtros />);

const enrutador = createMemoryRouter([{ path: "/", Component: Rota }]);
await dibujar("2. una ruta que lanza, dentro de RouterProvider:", <RouterProvider router={enrutador} />);
dom.window.close();
